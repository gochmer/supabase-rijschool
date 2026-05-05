import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { recordAuditEvent } from "@/lib/audit-events";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300;

type StripeWebhookEvent = {
  type?: string;
  data?: {
    object?: {
      metadata?: {
        payment_id?: string;
        profile_id?: string;
      };
    };
  };
};

type PaymentAuditRow = {
  id: string;
  profiel_id: string;
  pakket_id: string | null;
  bedrag: number | string | null;
  status: string;
};

type LearnerAuditRow = {
  id: string;
};

type PackageAuditRow = {
  instructeur_id: string | null;
};

function getStripeSignatureParts(signatureHeader: string | null) {
  if (!signatureHeader) {
    return null;
  }

  const parts = Object.fromEntries(
    signatureHeader.split(",").flatMap((part) => {
      const [key, value] = part.split("=");
      return key && value ? [[key, value]] : [];
    }),
  );

  if (!parts.t || !parts.v1) {
    return null;
  }

  return {
    timestamp: parts.t,
    signature: parts.v1,
  };
}

function verifyStripeSignature({
  payload,
  signatureHeader,
  webhookSecret,
}: {
  payload: string;
  signatureHeader: string | null;
  webhookSecret: string;
}) {
  const parts = getStripeSignatureParts(signatureHeader);

  if (!parts) {
    return false;
  }

  const timestampSeconds = Number.parseInt(parts.timestamp, 10);
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(nowSeconds - timestampSeconds) > STRIPE_WEBHOOK_TOLERANCE_SECONDS
  ) {
    return false;
  }

  if (
    !/^[a-f0-9]+$/i.test(parts.signature) ||
    parts.signature.length % 2 !== 0
  ) {
    return false;
  }

  const expected = createHmac("sha256", webhookSecret)
    .update(`${parts.timestamp}.${payload}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(parts.signature, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured." },
      { status: 500 },
    );
  }

  const payload = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");
  const isValid = verifyStripeSignature({
    payload,
    signatureHeader,
    webhookSecret,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: StripeWebhookEvent;

  try {
    event = JSON.parse(payload) as StripeWebhookEvent;
  } catch (error) {
    console.error("[stripe-webhook] invalid JSON payload", error);

    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const paymentId = event.data?.object?.metadata?.payment_id;
  const profileId = event.data?.object?.metadata?.profile_id;

  if (!paymentId || !profileId) {
    return NextResponse.json(
      { error: "Missing payment metadata." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createAdminClient();
    const paidAt = new Date().toISOString();
    const { error } = await supabase
      .from("betalingen")
      .update({
        betaald_at: paidAt,
        provider: "stripe",
        status: "betaald",
      })
      .eq("id", paymentId)
      .eq("profiel_id", profileId);

    if (error) {
      console.error("[stripe-webhook] payment update failed", error);

      return NextResponse.json(
        { error: "Could not update payment." },
        { status: 500 },
      );
    }

    const [{ data: payment }, { data: learner }] = (await Promise.all([
      supabase
        .from("betalingen")
        .select("id, profiel_id, pakket_id, bedrag, status")
        .eq("id", paymentId)
        .eq("profiel_id", profileId)
        .maybeSingle(),
      supabase
        .from("leerlingen")
        .select("id")
        .eq("profile_id", profileId)
        .maybeSingle(),
    ])) as unknown as [
      { data: PaymentAuditRow | null },
      { data: LearnerAuditRow | null },
    ];
    const { data: packageRow } = payment?.pakket_id
      ? ((await supabase
          .from("pakketten")
          .select("instructeur_id")
          .eq("id", payment.pakket_id)
          .maybeSingle()) as unknown as { data: PackageAuditRow | null })
      : { data: null };

    await recordAuditEvent({
      actorRole: "system",
      eventType: payment?.pakket_id ? "package_payment_paid" : "payment_paid",
      entityType: "payment",
      entityId: paymentId,
      leerlingId: learner?.id ?? null,
      instructeurId: packageRow?.instructeur_id ?? null,
      pakketId: payment?.pakket_id ?? null,
      betalingId: paymentId,
      summary: payment?.pakket_id
        ? "Pakketbetaling afgerond via Stripe."
        : "Betaling afgerond via Stripe.",
      metadata: {
        provider: "stripe",
        paid_at: paidAt,
        profile_id: profileId,
        amount: payment?.bedrag ?? null,
        status: payment?.status ?? "betaald",
      },
    });

    const { error: notificationError } = await supabase.from("notificaties").insert({
      action_href: "/leerling/betalingen",
      profiel_id: profileId,
      titel: "Betaling ontvangen",
      tekst: "Je betaling is bevestigd en verwerkt in je leerlingdashboard.",
      type: "succes",
      ongelezen: true,
    });

    if (notificationError) {
      console.error("[stripe-webhook] notification insert failed", notificationError);
    }
  } catch (error) {
    console.error("[stripe-webhook] webhook processing failed", error);

    return NextResponse.json(
      { error: "Could not update payment." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
