import type { BeschikbaarheidSlot } from "@/lib/types";

const availabilityTimeZone = "Europe/Amsterdam";

const dayFormatter = new Intl.DateTimeFormat("nl-NL", {
  timeZone: availabilityTimeZone,
  weekday: "long",
  day: "numeric",
  month: "long",
});

const shortDayFormatter = new Intl.DateTimeFormat("nl-NL", {
  timeZone: availabilityTimeZone,
  day: "numeric",
  month: "short",
});

const weekdayKeyFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: availabilityTimeZone,
  weekday: "short",
});

const weekdayNumberMap: Record<string, 1 | 2 | 3 | 4 | 5 | 6 | 7> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

const timeFormatter = new Intl.DateTimeFormat("nl-NL", {
  timeZone: availabilityTimeZone,
  hour: "2-digit",
  minute: "2-digit",
});

const dateValueFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: availabilityTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getAmsterdamOffsetMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: availabilityTimeZone,
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const zoneName = parts.find((part) => part.type === "timeZoneName")?.value;

  if (!zoneName) {
    return 0;
  }

  const match = zoneName.match(/^GMT([+-])(\d{2}):(\d{2})$/);

  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number.parseInt(match[2], 10);
  const minutes = Number.parseInt(match[3], 10);

  return sign * (hours * 60 + minutes);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function createAvailabilityTimestamp(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map((part) => Number.parseInt(part, 10));
  const [hour, minute] = timeValue.split(":").map((part) => Number.parseInt(part, 10));

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    throw new Error("Invalid availability date or time");
  }

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offsetMinutes = getAmsterdamOffsetMinutes(utcGuess);

  return new Date(utcGuess.getTime() - offsetMinutes * 60_000).toISOString();
}

export function addDaysToDateValue(dateValue: string, days: number) {
  const [year, month, day] = dateValue.split("-").map((part) => Number.parseInt(part, 10));

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    throw new Error("Invalid availability date");
  }

  const shifted = new Date(Date.UTC(year, month - 1, day + days));

  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
    shifted.getUTCDate()
  )}`;
}

export function getStartOfWeekDateValue(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map((part) => Number.parseInt(part, 10));

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    throw new Error("Invalid availability date");
  }

  const current = new Date(Date.UTC(year, month - 1, day));
  const weekday = current.getUTCDay();
  const distanceToMonday = weekday === 0 ? -6 : 1 - weekday;

  current.setUTCDate(current.getUTCDate() + distanceToMonday);

  return `${current.getUTCFullYear()}-${pad(current.getUTCMonth() + 1)}-${pad(
    current.getUTCDate()
  )}`;
}

export function formatAvailabilityDay(startAt: string) {
  return dayFormatter.format(new Date(startAt));
}

export function formatAvailabilityShortDay(startAt: string) {
  return shortDayFormatter.format(new Date(startAt));
}

export function formatAvailabilityTime(startAt: string) {
  return timeFormatter.format(new Date(startAt));
}

export function formatAvailabilityWindow(startAt: string, endAt: string) {
  return `${formatAvailabilityTime(startAt)} - ${formatAvailabilityTime(endAt)}`;
}

export function getAvailabilitySeriesKey(startAt: string, endAt: string) {
  return `${weekdayKeyFormatter.format(new Date(startAt))}|${formatAvailabilityTime(
    startAt
  )}|${formatAvailabilityTime(endAt)}`;
}

export function getAvailabilityWeekdayNumber(startAt: string) {
  return weekdayNumberMap[weekdayKeyFormatter.format(new Date(startAt))] ?? 1;
}

export function formatAvailabilitySeriesLabel(startAt: string, endAt: string) {
  return `${formatAvailabilityDay(startAt)} - ${formatAvailabilityWindow(startAt, endAt)}`;
}

export function formatAvailabilityMoment(startAt: string, endAt: string) {
  return `${formatAvailabilityDay(startAt)} - ${formatAvailabilityWindow(startAt, endAt)}`;
}

export function getAvailabilityDateValue(startAt: string) {
  return dateValueFormatter.format(new Date(startAt));
}

export function getDateValueDifferenceInDays(startDateValue: string, endDateValue: string) {
  const [startYear, startMonth, startDay] = startDateValue
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  const [endYear, endMonth, endDay] = endDateValue
    .split("-")
    .map((part) => Number.parseInt(part, 10));

  if (
    !Number.isFinite(startYear) ||
    !Number.isFinite(startMonth) ||
    !Number.isFinite(startDay) ||
    !Number.isFinite(endYear) ||
    !Number.isFinite(endMonth) ||
    !Number.isFinite(endDay)
  ) {
    throw new Error("Invalid availability date");
  }

  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);

  return Math.round((end - start) / 86_400_000);
}

export function getAvailabilityDurationMinutes(startAt: string, endAt: string) {
  const durationMs = new Date(endAt).getTime() - new Date(startAt).getTime();
  return Math.max(0, Math.round(durationMs / 60000));
}

export function formatAvailabilityDuration(startAt: string, endAt: string) {
  const durationMinutes = getAvailabilityDurationMinutes(startAt, endAt);

  if (durationMinutes === 0) {
    return "Onbekend";
  }

  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (minutes === 0) {
    return `${hours} uur`;
  }

  return `${hours}u ${minutes} min`;
}

export function formatAvailabilitySlotLabel(
  slot: Pick<BeschikbaarheidSlot, "dag" | "tijdvak">
) {
  return `${slot.dag} - ${slot.tijdvak}`;
}
