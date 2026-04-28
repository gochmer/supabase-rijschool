import type { LessonAttendanceStatus, Les } from "@/lib/types";

function padIcsDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function formatIcsDate(dateValue: Date) {
  return [
    dateValue.getUTCFullYear(),
    padIcsDatePart(dateValue.getUTCMonth() + 1),
    padIcsDatePart(dateValue.getUTCDate()),
    "T",
    padIcsDatePart(dateValue.getUTCHours()),
    padIcsDatePart(dateValue.getUTCMinutes()),
    padIcsDatePart(dateValue.getUTCSeconds()),
    "Z",
  ].join("");
}

function escapeIcsText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

export function buildLessonMapsUrl(location: string) {
  const normalized = location.trim();

  if (!normalized || normalized.toLowerCase().includes("onbekend")) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    normalized
  )}`;
}

export function getLessonAudienceLabel(lesson: Les) {
  if (lesson.leerling_naam && lesson.instructeur_naam) {
    return `${lesson.leerling_naam} met ${lesson.instructeur_naam}`;
  }

  return lesson.leerling_naam || lesson.instructeur_naam || "Rijles";
}

export function getLessonCountdownLabel(startAt?: string | null) {
  if (!startAt) {
    return null;
  }

  const now = new Date();
  const lessonDate = new Date(startAt);
  const diffMs = lessonDate.getTime() - now.getTime();

  if (!Number.isFinite(diffMs)) {
    return null;
  }

  if (diffMs < 0) {
    return "Lesmoment is gestart";
  }

  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 60) {
    return `Start over ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Start over ${diffHours} uur`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) {
    return "Start morgen";
  }

  return `Start over ${diffDays} dagen`;
}

export function getLessonAttendanceLabel(
  attendanceStatus?: LessonAttendanceStatus | null
) {
  if (attendanceStatus === "aanwezig") {
    return "Aanwezig bevestigd";
  }

  if (attendanceStatus === "afwezig") {
    return "Afwezig bevestigd";
  }

  return "Nog niet bevestigd";
}

export function getLessonAttendanceVariant(
  attendanceStatus?: LessonAttendanceStatus | null
) {
  if (attendanceStatus === "aanwezig") {
    return "success" as const;
  }

  if (attendanceStatus === "afwezig") {
    return "warning" as const;
  }

  return "info" as const;
}

export function buildLessonCalendarFile(lesson: Les) {
  if (!lesson.start_at) {
    return null;
  }

  const startAt = new Date(lesson.start_at);
  const endAt = lesson.end_at
    ? new Date(lesson.end_at)
    : new Date(startAt.getTime() + lesson.duur_minuten * 60000);

  const nowStamp = formatIcsDate(new Date());
  const uid = `lesson-${lesson.id}@gochoir`;
  const location = lesson.locatie?.trim() || "Locatie volgt nog";
  const description = `${getLessonAudienceLabel(
    lesson
  )}\\nStatus: ${lesson.status}\\nLocatie: ${location}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GoChoir//Lesson Planner//NL",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART:${formatIcsDate(startAt)}`,
    `DTEND:${formatIcsDate(endAt)}`,
    `SUMMARY:${escapeIcsText(lesson.titel)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function getLessonCalendarFilename(lesson: Les) {
  const safeTitle = lesson.titel
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeTitle || "rijles"}-${lesson.id}.ics`;
}
