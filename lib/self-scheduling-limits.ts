import { endOfWeek, format, startOfWeek } from "date-fns";
import { nl } from "date-fns/locale";

import { normalizeDurationMinutes } from "@/lib/lesson-durations";

export const SELF_SCHEDULING_WEEKLY_LIMIT_PRESETS = [
  60,
  120,
  180,
  240,
  300,
  360,
] as const;

export type WeeklyBookedMinutesMap = Record<string, number>;
export type WeeklyBookingLimitSource = "manual" | "package" | "none";

export function getWeeklyBookingWindow(dateLike: string | Date) {
  const anchorDate = new Date(dateLike);
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });

  return {
    weekStart,
    weekEnd,
    weekStartKey: format(weekStart, "yyyy-MM-dd"),
    weekEndKey: format(weekEnd, "yyyy-MM-dd"),
  };
}

export function getWeekStartKey(dateLike: string | Date) {
  return getWeeklyBookingWindow(dateLike).weekStartKey;
}

export function getWeekRangeLabel(dateLike: string | Date) {
  const { weekStart, weekEnd } = getWeeklyBookingWindow(dateLike);
  return `${format(weekStart, "d MMMM", { locale: nl })} - ${format(
    weekEnd,
    "d MMMM",
    { locale: nl }
  )}`;
}

export function getMinutesBetween(startAt: string, endAt: string) {
  return Math.max(
    0,
    Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000)
  );
}

export function addBookedMinutesForWeek(params: {
  map: WeeklyBookedMinutesMap;
  dateLike: string | Date;
  minutes: number;
}) {
  const normalizedMinutes = normalizeDurationMinutes(params.minutes, 60);
  const weekStartKey = getWeekStartKey(params.dateLike);

  params.map[weekStartKey] = (params.map[weekStartKey] ?? 0) + normalizedMinutes;
}

export function getBookedMinutesForWeek(
  map: WeeklyBookedMinutesMap | null | undefined,
  dateLike: string | Date
) {
  return map?.[getWeekStartKey(dateLike)] ?? 0;
}

export function getRemainingWeeklyBookingMinutes(
  weeklyLimitMinutes: number | null | undefined,
  bookedMinutes: number
) {
  if (weeklyLimitMinutes == null) {
    return null;
  }

  return Math.max(weeklyLimitMinutes - bookedMinutes, 0);
}

export function resolveEffectiveWeeklyBookingLimit(params: {
  manualLimitIsSet: boolean;
  manualLimitMinutes: number | null | undefined;
  packageLimitMinutes: number | null | undefined;
}) {
  if (params.manualLimitIsSet) {
    return {
      weeklyLimitMinutes: params.manualLimitMinutes ?? null,
      source: "manual" as const,
    };
  }

  if (params.packageLimitMinutes != null) {
    return {
      weeklyLimitMinutes: params.packageLimitMinutes,
      source: "package" as const,
    };
  }

  return {
    weeklyLimitMinutes: null,
    source: "none" as const,
  };
}

export function formatMinutesAsHoursLabel(minutes: number) {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const restMinutes = safeMinutes % 60;

  if (hours > 0 && restMinutes > 0) {
    return `${hours} uur ${restMinutes} min`;
  }

  if (hours > 0) {
    return `${hours} uur`;
  }

  return `${restMinutes} min`;
}

export function formatWeeklyLimitLabel(
  weeklyLimitMinutes: number | null | undefined
) {
  if (weeklyLimitMinutes == null) {
    return "Onbeperkt";
  }

  return `${formatMinutesAsHoursLabel(weeklyLimitMinutes)} per week`;
}

export function slotFitsWeeklyBookingLimit(params: {
  slotStartAt?: string | null;
  slotEndAt?: string | null;
  durationMinutes: number;
  weeklyLimitMinutes: number | null | undefined;
  bookedMinutesByWeekStart?: WeeklyBookedMinutesMap | null;
}) {
  const {
    slotStartAt,
    slotEndAt,
    durationMinutes,
    weeklyLimitMinutes,
    bookedMinutesByWeekStart,
  } = params;

  if (weeklyLimitMinutes == null) {
    return true;
  }

  if (!slotStartAt) {
    return false;
  }

  if (slotEndAt && getMinutesBetween(slotStartAt, slotEndAt) < durationMinutes) {
    return false;
  }

  const alreadyBooked = getBookedMinutesForWeek(bookedMinutesByWeekStart, slotStartAt);
  return alreadyBooked + normalizeDurationMinutes(durationMinutes, 60) <= weeklyLimitMinutes;
}

export function filterAvailabilitySlotsByWeeklyLimit<
  T extends {
    start_at?: string | null;
    eind_at?: string | null;
  },
>(
  slots: T[],
  durationMinutes: number,
  weeklyLimitMinutes: number | null | undefined,
  bookedMinutesByWeekStart?: WeeklyBookedMinutesMap | null
) {
  if (weeklyLimitMinutes == null) {
    return slots;
  }

  return slots.filter((slot) =>
    slotFitsWeeklyBookingLimit({
      slotStartAt: slot.start_at,
      slotEndAt: slot.eind_at,
      durationMinutes,
      weeklyLimitMinutes,
      bookedMinutesByWeekStart,
    })
  );
}
