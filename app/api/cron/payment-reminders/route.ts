import { NextRequest, NextResponse } from "next/server";

import { processDuePaymentReminders } from "@/lib/payment-reminders";

export const dynamic = "force-dynamic";

function getExpectedCronSecret() {
  if (process.env.PAYMENT_REMINDER_CRON_SECRET?.trim()) {
    return process.env.PAYMENT_REMINDER_CRON_SECRET.trim();
  }

  if (process.env.NODE_ENV !== "production") {
    return "local-payment-reminder-secret";
  }

  return null;
}

function isAuthorized(request: NextRequest) {
  const expectedSecret = getExpectedCronSecret();

  if (!expectedSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const forwardedSecret = request.headers.get("x-cron-secret");

  return (
    authHeader === `Bearer ${expectedSecret}` ||
    forwardedSecret === expectedSecret
  );
}

async function handleReminderRun(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, message: "Niet geautoriseerd." },
      { status: 401 },
    );
  }

  try {
    const result = await processDuePaymentReminders();

    return NextResponse.json({
      ok: true,
      message: "Betalingsherinneringen verwerkt.",
      ...result,
    });
  } catch (error) {
    console.error("Payment reminder cron failed", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Verwerken van betalingsherinneringen is mislukt.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return handleReminderRun(request);
}

export async function GET(request: NextRequest) {
  return handleReminderRun(request);
}
