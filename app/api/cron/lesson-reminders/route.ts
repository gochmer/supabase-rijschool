import { NextRequest, NextResponse } from "next/server";

import { processDueLessonReminders } from "@/lib/lesson-reminders";

export const dynamic = "force-dynamic";

function getExpectedCronSecret() {
  if (process.env.LESSON_REMINDER_CRON_SECRET?.trim()) {
    return process.env.LESSON_REMINDER_CRON_SECRET.trim();
  }

  if (process.env.NODE_ENV !== "production") {
    return "local-lesson-reminder-secret";
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
      { status: 401 }
    );
  }

  try {
    const result = await processDueLessonReminders();

    return NextResponse.json({
      ok: true,
      message: "Lesherinneringen verwerkt.",
      ...result,
    });
  } catch (error) {
    console.error("Lesson reminder cron failed", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Verwerken van lesherinneringen is mislukt.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleReminderRun(request);
}

export async function GET(request: NextRequest) {
  return handleReminderRun(request);
}
