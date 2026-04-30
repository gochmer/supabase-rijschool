import type { LesStatus } from "@/lib/types";

export const LEARNER_LESSON_CANCELLATION_HOUR_OPTIONS = [24, 48, 72] as const;

export type LearnerLessonCancellationWindowHours =
  (typeof LEARNER_LESSON_CANCELLATION_HOUR_OPTIONS)[number];

function isValidCancellationWindowHours(
  value: number | null | undefined
): value is LearnerLessonCancellationWindowHours {
  return LEARNER_LESSON_CANCELLATION_HOUR_OPTIONS.includes(
    value as LearnerLessonCancellationWindowHours
  );
}

export function normalizeLearnerLessonCancellationWindowHours(
  value: number | null | undefined
) {
  return isValidCancellationWindowHours(value) ? value : null;
}

export function formatLearnerLessonCancellationWindowLabel(
  hoursBeforeLesson: number | null | undefined
) {
  if (!isValidCancellationWindowHours(hoursBeforeLesson)) {
    return "Zelf annuleren uit";
  }

  return `${hoursBeforeLesson} uur vooraf`;
}

export function formatLearnerLessonCancellationDeadline(
  deadlineAt: string | Date | null | undefined
) {
  if (!deadlineAt) {
    return null;
  }

  const date =
    deadlineAt instanceof Date ? deadlineAt : new Date(deadlineAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(date);
}

export function getLearnerLessonCancellationAvailability({
  startAt,
  status,
  cancellationWindowHours,
  now = new Date(),
}: {
  startAt?: string | null;
  status: LesStatus;
  cancellationWindowHours?: number | null;
  now?: Date;
}) {
  const normalizedHours =
    normalizeLearnerLessonCancellationWindowHours(cancellationWindowHours);

  if (!normalizedHours) {
    return {
      enabled: false,
      canCancel: false,
      deadlineAt: null,
      windowHours: null,
      message:
        "Zelf online annuleren staat voor deze instructeur uit. Neem contact op met je instructeur of de rijschool.",
    };
  }

  if (status === "geannuleerd") {
    return {
      enabled: true,
      canCancel: false,
      deadlineAt: null,
      windowHours: normalizedHours,
      message: "Deze les is al geannuleerd.",
    };
  }

  if (status === "afgerond") {
    return {
      enabled: true,
      canCancel: false,
      deadlineAt: null,
      windowHours: normalizedHours,
      message: "Afgeronde lessen kun je niet meer online annuleren.",
    };
  }

  if (status !== "ingepland" && status !== "geaccepteerd") {
    return {
      enabled: true,
      canCancel: false,
      deadlineAt: null,
      windowHours: normalizedHours,
      message: "Deze les kan niet online worden geannuleerd.",
    };
  }

  if (!startAt) {
    return {
      enabled: true,
      canCancel: false,
      deadlineAt: null,
      windowHours: normalizedHours,
      message:
        "Deze les heeft nog geen volledig moment en kan daarom niet online worden geannuleerd.",
    };
  }

  const lessonStart = new Date(startAt);

  if (Number.isNaN(lessonStart.getTime())) {
    return {
      enabled: true,
      canCancel: false,
      deadlineAt: null,
      windowHours: normalizedHours,
      message:
        "Deze les kon niet goed worden gelezen en kan daarom niet online worden geannuleerd.",
    };
  }

  if (lessonStart.getTime() <= now.getTime()) {
    return {
      enabled: true,
      canCancel: false,
      deadlineAt: null,
      windowHours: normalizedHours,
      message:
        "Deze les is al begonnen of voorbij en kan niet meer online worden geannuleerd.",
    };
  }

  const deadlineDate = new Date(
    lessonStart.getTime() - normalizedHours * 60 * 60 * 1000
  );
  const deadlineLabel = formatLearnerLessonCancellationDeadline(deadlineDate);

  if (now.getTime() >= deadlineDate.getTime()) {
    return {
      enabled: true,
      canCancel: false,
      deadlineAt: deadlineDate.toISOString(),
      windowHours: normalizedHours,
      message: `Deze les kan niet meer online worden geannuleerd, omdat de annuleertermijn van ${normalizedHours} uur is verstreken. Neem contact op met je instructeur.`,
    };
  }

  return {
    enabled: true,
    canCancel: true,
    deadlineAt: deadlineDate.toISOString(),
    windowHours: normalizedHours,
    message: deadlineLabel
      ? `Je kunt deze les zelf annuleren tot ${deadlineLabel}.`
      : `Je kunt deze les zelf annuleren tot ${normalizedHours} uur voor de start.`,
  };
}
