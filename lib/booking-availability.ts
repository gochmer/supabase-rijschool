import type { LesStatus } from "@/lib/types";

export const ACTIVE_BOOKED_LESSON_STATUSES = [
  "geaccepteerd",
  "ingepland",
] as const satisfies readonly LesStatus[];

export const ACTIVE_REQUEST_HOLD_STATUSES = [
  "aangevraagd",
  "geaccepteerd",
  "ingepland",
] as const satisfies readonly LesStatus[];

export type BookingWindow = {
  source: "lesson" | "request";
  status: LesStatus;
  startAt: string;
  endAt: string;
  label?: string | null;
};

export function addMinutesToIsoTimestamp(timestamp: string, minutes: number) {
  return new Date(new Date(timestamp).getTime() + minutes * 60_000).toISOString();
}

export function getLessonEndAt(
  startAt: string | null | undefined,
  durationMinutes: number | null | undefined
) {
  if (!startAt) {
    return null;
  }

  return addMinutesToIsoTimestamp(startAt, durationMinutes ?? 60);
}

function createLocalDateTime(dateString: string, timeString: string) {
  const [hours, minutes] = timeString.split(":");

  if (!hours || !minutes) {
    return null;
  }

  return `${dateString}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
}

export function parseRequestWindow(
  preferredDate: string | null | undefined,
  timeSlot: string | null | undefined
) {
  if (!preferredDate) {
    return { startAt: null, endAt: null };
  }

  const rangeMatch = timeSlot?.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);

  if (!rangeMatch) {
    return {
      startAt: createLocalDateTime(preferredDate, "12:00"),
      endAt: createLocalDateTime(preferredDate, "13:00"),
    };
  }

  return {
    startAt: createLocalDateTime(preferredDate, rangeMatch[1]),
    endAt: createLocalDateTime(preferredDate, rangeMatch[2]),
  };
}

export function windowsOverlapIso(
  leftStartAt: string,
  leftEndAt: string,
  rightStartAt: string,
  rightEndAt: string
) {
  return (
    new Date(leftStartAt).getTime() < new Date(rightEndAt).getTime() &&
    new Date(leftEndAt).getTime() > new Date(rightStartAt).getTime()
  );
}

export function createBookingWindowFromLesson(params: {
  startAt: string | null | undefined;
  durationMinutes: number | null | undefined;
  status: LesStatus;
  label?: string | null;
}) {
  const endAt = getLessonEndAt(params.startAt, params.durationMinutes);

  if (!params.startAt || !endAt) {
    return null;
  }

  return {
    source: "lesson" as const,
    status: params.status,
    startAt: params.startAt,
    endAt,
    label: params.label ?? null,
  };
}

export function createBookingWindowFromRequest(params: {
  preferredDate: string | null | undefined;
  timeSlot: string | null | undefined;
  status: LesStatus;
  label?: string | null;
}) {
  const { startAt, endAt } = parseRequestWindow(
    params.preferredDate,
    params.timeSlot
  );

  if (!startAt || !endAt) {
    return null;
  }

  return {
    source: "request" as const,
    status: params.status,
    startAt,
    endAt,
    label: params.label ?? null,
  };
}

export function hasBookingConflict(
  targetWindow: Pick<BookingWindow, "startAt" | "endAt">,
  existingWindows: Array<Pick<BookingWindow, "startAt" | "endAt">>
) {
  return existingWindows.some((window) =>
    windowsOverlapIso(
      targetWindow.startAt,
      targetWindow.endAt,
      window.startAt,
      window.endAt
    )
  );
}

export function filterBookableAvailabilitySlots<
  T extends {
    start_at?: string | null;
    eind_at?: string | null;
  },
>(slots: T[], bookingWindows: Array<Pick<BookingWindow, "startAt" | "endAt">>) {
  if (!bookingWindows.length) {
    return slots;
  }

  return slots.filter((slot) => {
    if (!slot.start_at || !slot.eind_at) {
      return false;
    }

    return !hasBookingConflict(
      {
        startAt: slot.start_at,
        endAt: slot.eind_at,
      },
      bookingWindows
    );
  });
}

export function getIsoDayBounds(dateLike: string) {
  const date = new Date(dateLike);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const dateValue = `${year}-${month}-${day}`;

  return {
    dayStartAt: `${dateValue}T00:00:00`,
    dayEndAt: `${dateValue}T23:59:59`,
  };
}
