import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getRijlesTypeLabel } from "@/lib/lesson-types";
import type { Database } from "@/lib/supabase/database.types";
import type { LesAanvraagType, RijlesType } from "@/lib/types";

type ServerSupabase = SupabaseClient<Database>;
type NotificationTone = "info" | "succes" | "waarschuwing";

type ProfileContact = {
  id: string;
  volledige_naam: string;
  email: string | null;
};

function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEmailTemplate({
  eyebrow,
  title,
  intro,
  details,
  ctaLabel,
  ctaHref,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  details: Array<{ label: string; value: string }>;
  ctaLabel: string;
  ctaHref: string;
}) {
  const escapedTitle = escapeHtml(title);
  const escapedIntro = escapeHtml(intro);
  const escapedCtaLabel = escapeHtml(ctaLabel);

  return `
    <div style="background:#f8fafc;padding:32px 16px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid rgba(148,163,184,0.22);border-radius:24px;overflow:hidden;box-shadow:0 24px 64px -40px rgba(15,23,42,0.35);">
        <div style="padding:28px 28px 12px;background:linear-gradient(135deg,#020617,#172554,#0284c7);color:#ffffff;">
          <div style="font-size:11px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.78;font-weight:700;">${escapeHtml(
            eyebrow
          )}</div>
          <h1 style="margin:14px 0 0;font-size:28px;line-height:1.15;font-weight:700;">${escapedTitle}</h1>
        </div>
        <div style="padding:24px 28px 28px;">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#334155;">${escapedIntro}</p>
          <div style="display:grid;gap:10px;margin:0 0 24px;">
            ${details
              .map(
                (detail) => `
                  <div style="border:1px solid rgba(148,163,184,0.22);border-radius:16px;padding:14px 16px;background:#f8fafc;">
                    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;font-weight:700;">${escapeHtml(
                      detail.label
                    )}</div>
                    <div style="margin-top:6px;font-size:15px;line-height:1.6;color:#0f172a;font-weight:600;">${escapeHtml(
                      detail.value
                    )}</div>
                  </div>
                `
              )
              .join("")}
          </div>
          <a href="${ctaHref}" style="display:inline-block;border-radius:999px;background:linear-gradient(135deg,#0f172a,#2563eb);color:#ffffff;text-decoration:none;padding:12px 18px;font-size:14px;font-weight:700;">
            ${escapedCtaLabel}
          </a>
        </div>
      </div>
    </div>
  `;
}

function renderPlainText({
  title,
  intro,
  details,
  ctaHref,
}: {
  title: string;
  intro: string;
  details: Array<{ label: string; value: string }>;
  ctaHref: string;
}) {
  return [
    title,
    "",
    intro,
    "",
    ...details.map((detail) => `${detail.label}: ${detail.value}`),
    "",
    `Open: ${ctaHref}`,
  ].join("\n");
}

async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  const replyTo = process.env.NOTIFICATION_REPLY_TO_EMAIL;
  const forcedTo = process.env.NOTIFICATION_TEST_TO_EMAIL?.trim();
  const recipient = forcedTo || to;

  if (!apiKey || !from || !recipient?.trim()) {
    return { sent: false, skipped: true as const };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "gochoir-notifications/1.0",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject,
        html,
        text,
        reply_to: replyTo || undefined,
      }),
    });

    if (!response.ok) {
      console.error("Notification email failed", await response.text());
      return { sent: false, skipped: false as const };
    }

    return { sent: true, skipped: false as const };
  } catch (error) {
    console.error("Notification email failed", error);
    return { sent: false, skipped: false as const };
  }
}

async function createInAppNotification({
  supabase,
  profileId,
  title,
  text,
  type = "info",
}: {
  supabase: ServerSupabase;
  profileId: string | null | undefined;
  title: string;
  text: string;
  type?: NotificationTone;
}) {
  if (!profileId) {
    return;
  }

  await supabase.from("notificaties").insert({
    profiel_id: profileId,
    titel: title,
    tekst: text,
    type,
    ongelezen: true,
  } as never);
}

async function getProfileContactById(
  supabase: ServerSupabase,
  profileId: string | null | undefined
): Promise<ProfileContact | null> {
  if (!profileId) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, volledige_naam, email")
    .eq("id", profileId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    volledige_naam: data.volledige_naam,
    email: data.email || null,
  };
}

async function getLearnerContactById(
  supabase: ServerSupabase,
  leerlingId: string | null | undefined
) {
  if (!leerlingId) {
    return null;
  }

  const { data: leerling } = await supabase
    .from("leerlingen")
    .select("profile_id")
    .eq("id", leerlingId)
    .maybeSingle();

  return getProfileContactById(supabase, leerling?.profile_id);
}

async function getInstructorContactById(
  supabase: ServerSupabase,
  instructeurId: string | null | undefined
) {
  if (!instructeurId) {
    return null;
  }

  const { data: instructeur } = await supabase
    .from("instructeurs")
    .select("profile_id, volledige_naam")
    .eq("id", instructeurId)
    .maybeSingle();

  const profileContact = await getProfileContactById(
    supabase,
    instructeur?.profile_id
  );

  if (!profileContact && !instructeur) {
    return null;
  }

  return {
    id: profileContact?.id ?? instructeur?.profile_id ?? "",
    volledige_naam:
      profileContact?.volledige_naam ||
      instructeur?.volledige_naam ||
      "Instructeur",
    email: profileContact?.email ?? null,
  };
}

function getRequestLabel({
  pakketNaam,
  aanvraagType,
  lesType,
}: {
  pakketNaam?: string | null;
  aanvraagType?: LesAanvraagType | string | null;
  lesType?: RijlesType | string | null;
}) {
  if (pakketNaam?.trim()) {
    return pakketNaam.trim();
  }

  const typeLabel = lesType ? getRijlesTypeLabel(lesType) : "Rijles";

  if (aanvraagType === "proefles") {
    return `${typeLabel} proefles`;
  }

  if (aanvraagType === "pakket") {
    return `${typeLabel} pakket`;
  }

  return `${typeLabel} aanvraag`;
}

async function deliverNotificationEmail({
  to,
  subject,
  eyebrow,
  intro,
  details,
  ctaPath,
  ctaLabel,
}: {
  to: string | null | undefined;
  subject: string;
  eyebrow: string;
  intro: string;
  details: Array<{ label: string; value: string }>;
  ctaPath: string;
  ctaLabel: string;
}) {
  if (!to?.trim()) {
    return;
  }

  const ctaHref = `${getAppBaseUrl()}${ctaPath}`;
  const html = renderEmailTemplate({
    eyebrow,
    title: subject,
    intro,
    details,
    ctaLabel,
    ctaHref,
  });
  const text = renderPlainText({
    title: subject,
    intro,
    details,
    ctaHref,
  });

  await sendEmail({
    to,
    subject,
    html,
    text,
  });
}

export async function notifyInstructorAboutNewRequest({
  supabase,
  instructeurId,
  leerlingNaam,
  voorkeursdatum,
  tijdvak,
  pakketNaam,
  aanvraagType,
  lesType,
  bericht,
}: {
  supabase: ServerSupabase;
  instructeurId: string;
  leerlingNaam: string;
  voorkeursdatum: string;
  tijdvak: string;
  pakketNaam?: string | null;
  aanvraagType?: LesAanvraagType | string | null;
  lesType?: RijlesType | string | null;
  bericht?: string | null;
}) {
  const instructor = await getInstructorContactById(supabase, instructeurId);
  const requestLabel = getRequestLabel({ pakketNaam, aanvraagType, lesType });
  const title = "Nieuwe aanvraag ontvangen";
  const text = `${leerlingNaam} heeft een ${requestLabel.toLowerCase()} aangevraagd voor ${voorkeursdatum} (${tijdvak}).`;

  await createInAppNotification({
    supabase,
    profileId: instructor?.id,
    title,
    text,
    type: "info",
  });

  await deliverNotificationEmail({
    to: instructor?.email,
    subject: `Nieuwe aanvraag van ${leerlingNaam}`,
    eyebrow: "Nieuwe lesaanvraag",
    intro: `${leerlingNaam} heeft een nieuwe ${requestLabel.toLowerCase()} naar je verstuurd.`,
    details: [
      { label: "Leerling", value: leerlingNaam },
      { label: "Type", value: requestLabel },
      { label: "Voorkeursdatum", value: voorkeursdatum },
      { label: "Tijdvak", value: tijdvak },
      ...(bericht?.trim()
        ? [{ label: "Toelichting", value: bericht.trim() }]
        : []),
    ],
    ctaPath: "/instructeur/aanvragen",
    ctaLabel: "Open lesaanvragen",
  });
}

export async function notifyLearnerAboutRequestDecision({
  supabase,
  leerlingId,
  instructeurNaam,
  status,
  voorkeursdatum,
  tijdvak,
  pakketNaam,
  aanvraagType,
  lesType,
  reason,
}: {
  supabase: ServerSupabase;
  leerlingId: string | null;
  instructeurNaam: string;
  status: "geaccepteerd" | "geweigerd";
  voorkeursdatum?: string | null;
  tijdvak?: string | null;
  pakketNaam?: string | null;
  aanvraagType?: LesAanvraagType | string | null;
  lesType?: RijlesType | string | null;
  reason?: string | null;
}) {
  const learner = await getLearnerContactById(supabase, leerlingId);
  const requestLabel = getRequestLabel({ pakketNaam, aanvraagType, lesType });
  const isAccepted = status === "geaccepteerd";
  const title = isAccepted
    ? "Je aanvraag is geaccepteerd"
    : "Je aanvraag is geweigerd";
  const text = isAccepted
    ? `${instructeurNaam} heeft je ${requestLabel.toLowerCase()} geaccepteerd.`
    : reason?.trim()
      ? `${instructeurNaam} heeft je aanvraag geweigerd. Reden: ${reason.trim()}`
      : `${instructeurNaam} heeft je aanvraag geweigerd.`;

  await createInAppNotification({
    supabase,
    profileId: learner?.id,
    title,
    text,
    type: isAccepted ? "succes" : "waarschuwing",
  });

  await deliverNotificationEmail({
    to: learner?.email,
    subject: title,
    eyebrow: isAccepted ? "Aanvraag geaccepteerd" : "Aanvraag geweigerd",
    intro: isAccepted
      ? `${instructeurNaam} heeft je ${requestLabel.toLowerCase()} geaccepteerd.`
      : `${instructeurNaam} heeft je ${requestLabel.toLowerCase()} geweigerd.`,
    details: [
      { label: "Instructeur", value: instructeurNaam },
      { label: "Type", value: requestLabel },
      ...(voorkeursdatum ? [{ label: "Voorkeursdatum", value: voorkeursdatum }] : []),
      ...(tijdvak ? [{ label: "Tijdvak", value: tijdvak }] : []),
      ...(!isAccepted && reason?.trim()
        ? [{ label: "Reden", value: reason.trim() }]
        : []),
    ],
    ctaPath: "/leerling/boekingen",
    ctaLabel: "Open je boekingen",
  });
}

export async function notifyLearnerAboutLessonChange({
  supabase,
  leerlingId,
  instructeurNaam,
  datum,
  tijd,
  locatie,
  status,
  reason,
}: {
  supabase: ServerSupabase;
  leerlingId: string | null;
  instructeurNaam: string;
  datum: string;
  tijd: string;
  locatie: string;
  status: "geaccepteerd" | "ingepland" | "afgerond" | "geannuleerd";
  reason?: string | null;
}) {
  const learner = await getLearnerContactById(supabase, leerlingId);

  const title =
    status === "geannuleerd"
      ? "Je les is geannuleerd"
      : status === "afgerond"
        ? "Je les is afgerond"
        : "Je les is bijgewerkt";

  const text =
    status === "geannuleerd"
      ? `${instructeurNaam} heeft je les geannuleerd.${reason?.trim() ? ` Reden: ${reason.trim()}` : ""}`
      : status === "afgerond"
        ? `${instructeurNaam} heeft je les als afgerond gemarkeerd.`
        : `${instructeurNaam} heeft je les bijgewerkt naar ${datum} om ${tijd}.`;

  await createInAppNotification({
    supabase,
    profileId: learner?.id,
    title,
    text,
    type: status === "geannuleerd" ? "waarschuwing" : status === "afgerond" ? "succes" : "info",
  });

  if (status === "afgerond") {
    return;
  }

  await deliverNotificationEmail({
    to: learner?.email,
    subject: title,
    eyebrow: status === "geannuleerd" ? "Les geannuleerd" : "Les bijgewerkt",
    intro:
      status === "geannuleerd"
        ? `${instructeurNaam} heeft je les geannuleerd.`
        : `${instructeurNaam} heeft je lesmoment bijgewerkt.`,
    details: [
      { label: "Instructeur", value: instructeurNaam },
      { label: "Datum", value: datum },
      { label: "Tijd", value: tijd },
      { label: "Locatie", value: locatie || "Locatie volgt nog" },
      ...(status === "geannuleerd" && reason?.trim()
        ? [{ label: "Reden", value: reason.trim() }]
        : []),
    ],
    ctaPath: "/leerling/boekingen",
    ctaLabel: "Open je lesoverzicht",
  });
}

export async function notifyLearnerToLeaveReview({
  supabase,
  leerlingId,
  instructeurNaam,
  datum,
  tijd,
  lesTitel,
}: {
  supabase: ServerSupabase;
  leerlingId: string | null;
  instructeurNaam: string;
  datum: string;
  tijd: string;
  lesTitel: string;
}) {
  const learner = await getLearnerContactById(supabase, leerlingId);

  if (!learner?.id) {
    return;
  }

  const title = "Laat een review achter";
  const text = `${instructeurNaam} heeft ${lesTitel.toLowerCase()} op ${datum} om ${tijd} afgerond. Deel kort hoe de les voelde en help andere leerlingen kiezen.`;

  const { data: existingNotification } = await supabase
    .from("notificaties")
    .select("id")
    .eq("profiel_id", learner.id)
    .eq("titel", title)
    .eq("tekst", text)
    .limit(1)
    .maybeSingle();

  if (existingNotification) {
    return;
  }

  await createInAppNotification({
    supabase,
    profileId: learner.id,
    title,
    text,
    type: "succes",
  });

  await deliverNotificationEmail({
    to: learner.email,
    subject: "Je les is afgerond - laat een review achter",
    eyebrow: "Review reminder",
    intro: `${instructeurNaam} heeft je les afgerond. Met een korte review help je andere leerlingen sneller vertrouwen opbouwen.`,
    details: [
      { label: "Instructeur", value: instructeurNaam },
      { label: "Les", value: lesTitel },
      { label: "Datum", value: datum },
      { label: "Tijd", value: tijd },
    ],
    ctaPath: "/leerling/reviews",
    ctaLabel: "Laat een review achter",
  });
}
