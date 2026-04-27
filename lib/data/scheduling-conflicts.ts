import "server-only";

import { getAvailabilityDateValue } from "@/lib/availability";
import {
  ACTIVE_BOOKED_LESSON_STATUSES,
  ACTIVE_REQUEST_HOLD_STATUSES,
  createBookingWindowFromLesson,
  createBookingWindowFromRequest,
  getIsoDayBounds,
  hasBookingConflict,
  type BookingWindow,
} from "@/lib/booking-availability";
import { createServerClient } from "@/lib/supabase/server";

type LessonConflictRow = {
  id: string;
  titel: string;
  start_at: string | null;
  duur_minuten: number;
  status: string;
};

type RequestConflictRow = {
  id: string;
  voorkeursdatum: string | null;
  tijdvak: string | null;
  status: string;
  pakket_naam_snapshot: string | null;
  aanvraag_type: string | null;
};

type SchedulingConflictInput = {
  instructorId: string;
  learnerId?: string | null;
  startAt: string;
  endAt: string;
  ignoreLessonId?: string | null;
  ignoreRequestId?: string | null;
  includeRequestHolds?: boolean;
  supabase?: Awaited<ReturnType<typeof createServerClient>>;
};

type SchedulingConflictResult =
  | { hasConflict: false }
  | {
      hasConflict: true;
      reason:
        | "instructor_lesson"
        | "learner_lesson"
        | "instructor_request"
        | "learner_request";
      message: string;
      conflictWindow?: BookingWindow | null;
    };

function toBookingWindowList(
  rows: LessonConflictRow[],
  ignoreLessonId?: string | null
) {
  return rows
    .filter((row) => row.id !== ignoreLessonId)
    .map((row) =>
      createBookingWindowFromLesson({
        startAt: row.start_at,
        durationMinutes: row.duur_minuten,
        status: row.status as BookingWindow["status"],
        label: row.titel,
      })
    )
    .filter(Boolean) as BookingWindow[];
}

function toRequestWindowList(
  rows: RequestConflictRow[],
  ignoreRequestId?: string | null
) {
  return rows
    .filter((row) => row.id !== ignoreRequestId)
    .map((row) =>
      createBookingWindowFromRequest({
        preferredDate: row.voorkeursdatum,
        timeSlot: row.tijdvak,
        status: row.status as BookingWindow["status"],
        label:
          row.pakket_naam_snapshot ??
          (row.aanvraag_type === "proefles" ? "Proefles" : "Aanvraag"),
      })
    )
    .filter(Boolean) as BookingWindow[];
}

export async function findSchedulingConflict(
  input: SchedulingConflictInput
): Promise<SchedulingConflictResult> {
  const supabase = input.supabase ?? (await createServerClient());
  const dateValue = getAvailabilityDateValue(input.startAt);
  const { dayStartAt, dayEndAt } = getIsoDayBounds(input.startAt);
  const includeRequestHolds = input.includeRequestHolds !== false;

  const [
    { data: instructorLessonRows },
    { data: learnerLessonRows },
    { data: instructorRequestRows },
    { data: learnerRequestRows },
  ] = await Promise.all([
    supabase
      .from("lessen")
      .select("id, titel, start_at, duur_minuten, status")
      .eq("instructeur_id", input.instructorId)
      .in("status", [...ACTIVE_BOOKED_LESSON_STATUSES])
      .gte("start_at", dayStartAt)
      .lte("start_at", dayEndAt),
    input.learnerId
      ? supabase
          .from("lessen")
          .select("id, titel, start_at, duur_minuten, status")
          .eq("leerling_id", input.learnerId)
          .in("status", [...ACTIVE_BOOKED_LESSON_STATUSES])
          .gte("start_at", dayStartAt)
          .lte("start_at", dayEndAt)
      : Promise.resolve({ data: [] as LessonConflictRow[] }),
    includeRequestHolds
      ? supabase
          .from("lesaanvragen")
          .select(
            "id, voorkeursdatum, tijdvak, status, pakket_naam_snapshot, aanvraag_type"
          )
          .eq("instructeur_id", input.instructorId)
          .eq("voorkeursdatum", dateValue)
          .in("status", [...ACTIVE_REQUEST_HOLD_STATUSES])
      : Promise.resolve({ data: [] as RequestConflictRow[] }),
    includeRequestHolds && input.learnerId
      ? supabase
          .from("lesaanvragen")
          .select(
            "id, voorkeursdatum, tijdvak, status, pakket_naam_snapshot, aanvraag_type"
          )
          .eq("leerling_id", input.learnerId)
          .eq("voorkeursdatum", dateValue)
          .in("status", [...ACTIVE_REQUEST_HOLD_STATUSES])
      : Promise.resolve({ data: [] as RequestConflictRow[] }),
  ]);

  const targetWindow = {
    startAt: input.startAt,
    endAt: input.endAt,
  };

  const instructorLessonWindows = toBookingWindowList(
    (instructorLessonRows ?? []) as LessonConflictRow[],
    input.ignoreLessonId
  );
  const learnerLessonWindows = toBookingWindowList(
    (learnerLessonRows ?? []) as LessonConflictRow[],
    input.ignoreLessonId
  );

  const instructorLessonConflict = instructorLessonWindows.find((window) =>
    hasBookingConflict(targetWindow, [window])
  );

  if (instructorLessonConflict) {
    return {
      hasConflict: true,
      reason: "instructor_lesson",
      message: "Dit moment is al bezet door een andere geplande les.",
      conflictWindow: instructorLessonConflict,
    };
  }

  const learnerLessonConflict = learnerLessonWindows.find((window) =>
    hasBookingConflict(targetWindow, [window])
  );

  if (learnerLessonConflict) {
    return {
      hasConflict: true,
      reason: "learner_lesson",
      message: "Je hebt zelf al een andere geplande les op dit moment.",
      conflictWindow: learnerLessonConflict,
    };
  }

  if (includeRequestHolds) {
    const instructorRequestWindows = toRequestWindowList(
      (instructorRequestRows ?? []) as RequestConflictRow[],
      input.ignoreRequestId
    );
    const learnerRequestWindows = toRequestWindowList(
      (learnerRequestRows ?? []) as RequestConflictRow[],
      input.ignoreRequestId
    );

    const instructorRequestConflict = instructorRequestWindows.find((window) =>
      hasBookingConflict(targetWindow, [window])
    );

    if (instructorRequestConflict) {
      return {
        hasConflict: true,
        reason: "instructor_request",
        message: "Dit moment is net al aangevraagd of tijdelijk vastgezet.",
        conflictWindow: instructorRequestConflict,
      };
    }

    const learnerRequestConflict = learnerRequestWindows.find((window) =>
      hasBookingConflict(targetWindow, [window])
    );

    if (learnerRequestConflict) {
      return {
        hasConflict: true,
        reason: "learner_request",
        message: "Je hebt zelf al een andere aanvraag op dit moment lopen.",
        conflictWindow: learnerRequestConflict,
      };
    }
  }

  return { hasConflict: false };
}
