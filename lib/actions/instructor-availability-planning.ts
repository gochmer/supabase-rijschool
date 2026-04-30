import "server-only";

import {
  addDaysToDateValue,
  createAvailabilityTimestamp,
  getAvailabilityDateValue,
  getDateValueDifferenceInDays,
} from "@/lib/availability";
import {
  ACTIVE_BOOKED_LESSON_STATUSES,
  createBookingWindowFromLesson,
  getIsoDayBounds,
  hasBookingConflict,
  type BookingWindow,
} from "@/lib/booking-availability";
import {
  MAX_LINKED_WINDOW_GAP_MINUTES,
  getPlannedAvailabilitySlotKey,
  type PlannedAvailabilitySlot,
} from "@/lib/actions/instructor-availability-shared";
import type { createServerClient } from "@/lib/supabase/server";

export function getAvailabilityWindowValidationMessage(startAt: string, eindAt: string) {
  if (new Date(eindAt).getTime() <= new Date(startAt).getTime()) {
    return "De eindtijd moet na de starttijd liggen.";
  }

  if (new Date(eindAt).getTime() - new Date(startAt).getTime() < 30 * 60_000) {
    return "Maak een tijdslot van minimaal 30 minuten.";
  }

  return null;
}

export function getAvailabilityBreakValidationMessage(
  startAt: string,
  eindAt: string,
  pauseStartAt: string,
  pauseEndAt: string
) {
  if (new Date(pauseEndAt).getTime() <= new Date(pauseStartAt).getTime()) {
    return "De pauze-eindtijd moet na de pauze-starttijd liggen.";
  }

  if (new Date(pauseStartAt).getTime() <= new Date(startAt).getTime()) {
    return "Laat de pauze na de start van je werktijd beginnen.";
  }

  if (new Date(pauseEndAt).getTime() >= new Date(eindAt).getTime()) {
    return "Laat de pauze eindigen voordat je werktijd afloopt.";
  }

  const beforePauseValidation = getAvailabilityWindowValidationMessage(startAt, pauseStartAt);

  if (beforePauseValidation) {
    return "Houd voor je pauze minimaal 30 minuten open.";
  }

  const afterPauseValidation = getAvailabilityWindowValidationMessage(pauseEndAt, eindAt);

  if (afterPauseValidation) {
    return "Houd na je pauze minimaal 30 minuten open.";
  }

  return null;
}

function addMinutesToTimestamp(timestamp: string, minutes: number) {
  return new Date(new Date(timestamp).getTime() + minutes * 60_000).toISOString();
}

function getMinutesBetweenTimestamps(startAt: string, eindAt: string) {
  return Math.round(
    (new Date(eindAt).getTime() - new Date(startAt).getTime()) / 60_000
  );
}

export function buildLinkedAvailabilityCluster<
  T extends {
    id: string;
    start_at: string;
    eind_at: string;
    beschikbaar: boolean;
  },
>(rows: T[], anchorId: string) {
  const orderedRows = [...rows].sort((left, right) =>
    left.start_at.localeCompare(right.start_at)
  );
  const anchorIndex = orderedRows.findIndex((row) => row.id === anchorId);

  if (anchorIndex === -1) {
    return [];
  }

  let startIndex = anchorIndex;
  let endIndex = anchorIndex;

  while (startIndex > 0) {
    const current = orderedRows[startIndex];
    const previous = orderedRows[startIndex - 1];
    const gapMinutes = getMinutesBetweenTimestamps(previous.eind_at, current.start_at);

    if (
      previous.beschikbaar !== current.beschikbaar ||
      gapMinutes < 0 ||
      gapMinutes > MAX_LINKED_WINDOW_GAP_MINUTES
    ) {
      break;
    }

    startIndex -= 1;
  }

  while (endIndex < orderedRows.length - 1) {
    const current = orderedRows[endIndex];
    const next = orderedRows[endIndex + 1];
    const gapMinutes = getMinutesBetweenTimestamps(current.eind_at, next.start_at);

    if (
      next.beschikbaar !== current.beschikbaar ||
      gapMinutes < 0 ||
      gapMinutes > MAX_LINKED_WINDOW_GAP_MINUTES
    ) {
      break;
    }

    endIndex += 1;
  }

  return orderedRows.slice(startIndex, endIndex + 1);
}

function windowsOverlap(
  leftStartTime: string,
  leftEndTime: string,
  rightStartTime: string,
  rightEndTime: string
) {
  const referenceDate = "2026-01-05";
  const leftStartAt = createAvailabilityTimestamp(referenceDate, leftStartTime);
  const leftEndAt = createAvailabilityTimestamp(referenceDate, leftEndTime);
  const rightStartAt = createAvailabilityTimestamp(referenceDate, rightStartTime);
  const rightEndAt = createAvailabilityTimestamp(referenceDate, rightEndTime);

  return (
    new Date(leftStartAt).getTime() < new Date(rightEndAt).getTime() &&
    new Date(leftEndAt).getTime() > new Date(rightStartAt).getTime()
  );
}

export async function findAvailabilityWeekRuleConflicts(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  instructeurId: string,
  candidates: Array<{
    weekdag: number;
    startTijd: string;
    eindTijd: string;
  }>,
  ignoreRuleIds: string[] = []
) {
  const weekdays = Array.from(new Set(candidates.map((candidate) => candidate.weekdag)));

  if (!weekdays.length) {
    return {
      success: true as const,
    };
  }

  const { data: existingRules, error } = await supabase
    .from("beschikbaarheid_weekroosters")
    .select("id, weekdag, start_tijd, eind_tijd")
    .eq("instructeur_id", instructeurId)
    .eq("actief", true)
    .in("weekdag", weekdays);

  if (error) {
    return {
      success: false as const,
      message: "Je vaste weekplanning kon niet worden gecontroleerd op overlap.",
    };
  }

  const ignoreSet = new Set(ignoreRuleIds);
  const overlappingRule = (existingRules ?? []).find((existingRule) => {
    if (ignoreSet.has(existingRule.id)) {
      return false;
    }

    return candidates.some((candidate) => {
      return (
        existingRule.weekdag === candidate.weekdag &&
        windowsOverlap(
          existingRule.start_tijd,
          existingRule.eind_tijd,
          candidate.startTijd,
          candidate.eindTijd
        )
      );
    });
  });

  if (overlappingRule) {
    return {
      success: false as const,
      message:
        "Deze vaste weekplanning overlapt met een bestaande doorlopende werktijd op dezelfde weekdag.",
    };
  }

  return {
    success: true as const,
  };
}

export function getDateValuesBetween(startDateValue: string, endDateValue: string) {
  const totalDays = getDateValueDifferenceInDays(startDateValue, endDateValue);

  if (totalDays < 0) {
    return [];
  }

  return Array.from({ length: totalDays + 1 }, (_, dayIndex) =>
    addDaysToDateValue(startDateValue, dayIndex)
  );
}

export function normalizePauseWindow(params: {
  startTijd: string;
  eindTijd: string;
  pauzeStartTijd?: string | null;
  pauzeEindTijd?: string | null;
}) {
  const {
    startTijd,
    eindTijd,
    pauzeStartTijd = null,
    pauzeEindTijd = null,
  } = params;

  if (!pauzeStartTijd || !pauzeEindTijd) {
    return {
      pauzeStartTijd: null,
      pauzeEindTijd: null,
    };
  }

  try {
    const referenceDate = "2026-01-05";
    const validationMessage = getAvailabilityBreakValidationMessage(
      createAvailabilityTimestamp(referenceDate, startTijd),
      createAvailabilityTimestamp(referenceDate, eindTijd),
      createAvailabilityTimestamp(referenceDate, pauzeStartTijd),
      createAvailabilityTimestamp(referenceDate, pauzeEindTijd)
    );

    if (validationMessage) {
      return {
        pauzeStartTijd: null,
        pauzeEindTijd: null,
      };
    }
  } catch {
    return {
      pauzeStartTijd: null,
      pauzeEindTijd: null,
    };
  }

  return {
    pauzeStartTijd,
    pauzeEindTijd,
  };
}

export function addMinutesToTimeValue(timeValue: string, minutes: number) {
  const referenceDate = "2026-01-05";
  const timestamp = createAvailabilityTimestamp(referenceDate, timeValue);
  const shiftedDate = new Date(new Date(timestamp).getTime() + minutes * 60_000);
  const shiftedDateValue = getAvailabilityDateValue(shiftedDate.toISOString());

  if (shiftedDateValue !== referenceDate) {
    return null;
  }

  return shiftedDate.toISOString().slice(11, 16);
}

export function buildPlannedSlotsForWindow(params: {
  instructeurId: string;
  startAt: string;
  eindAt: string;
  beschikbaar: boolean;
  dateLabel: string;
  lesduurMinuten: number;
  bufferMinuten: number;
}) {
  const {
    instructeurId,
    startAt,
    eindAt,
    beschikbaar,
    dateLabel,
    lesduurMinuten,
    bufferMinuten,
  } = params;

  if (!beschikbaar || lesduurMinuten <= 0) {
    return {
      success: true as const,
      slots: [
        {
          instructeur_id: instructeurId,
          start_at: startAt,
          eind_at: eindAt,
          beschikbaar,
          dateLabel,
        },
      ],
    };
  }

  const slots: {
    instructeur_id: string;
    start_at: string;
    eind_at: string;
    beschikbaar: boolean;
    dateLabel: string;
  }[] = [];
  let cursor = startAt;
  const endMs = new Date(eindAt).getTime();

  while (new Date(cursor).getTime() + lesduurMinuten * 60_000 <= endMs) {
    const slotEndAt = addMinutesToTimestamp(cursor, lesduurMinuten);

    slots.push({
      instructeur_id: instructeurId,
      start_at: cursor,
      eind_at: slotEndAt,
      beschikbaar,
      dateLabel,
    });

    cursor = addMinutesToTimestamp(cursor, lesduurMinuten + bufferMinuten);
  }

  if (!slots.length) {
    return {
      success: false as const,
      message: `Binnen deze werktijd past geen lesblok van ${lesduurMinuten} minuten${bufferMinuten > 0 ? ` met ${bufferMinuten} minuten buffer` : ""}.`,
    };
  }

  return {
    success: true as const,
    slots,
  };
}

export async function findAvailabilityConflicts(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  instructeurId: string,
  plannedSlots: PlannedAvailabilitySlot[],
  ignoreIds: string[] = []
) {
  if (!plannedSlots.length) {
    return {
      success: true as const,
      conflictingDates: [] as string[],
      conflictingSlotKeys: [] as string[],
    };
  }

  const orderedSlots = [...plannedSlots].sort((left, right) =>
    left.start_at.localeCompare(right.start_at)
  );
  const ignoreIdSet = new Set(ignoreIds);

  const { data: overlapRows, error: overlapError } = await supabase
    .from("beschikbaarheid")
    .select("id, start_at, eind_at")
    .eq("instructeur_id", instructeurId)
    .lt("start_at", orderedSlots[orderedSlots.length - 1].eind_at)
    .gt("eind_at", orderedSlots[0].start_at);

  if (overlapError) {
    return {
      success: false as const,
      message: "De overlapcontrole kon niet worden uitgevoerd.",
    };
  }

  const { dayStartAt } = getIsoDayBounds(orderedSlots[0].start_at);
  const { dayEndAt } = getIsoDayBounds(
    orderedSlots[orderedSlots.length - 1].eind_at
  );
  const { data: lessonRows, error: lessonError } = await supabase
    .from("lessen")
    .select("id, titel, start_at, duur_minuten, status")
    .eq("instructeur_id", instructeurId)
    .in("status", [...ACTIVE_BOOKED_LESSON_STATUSES])
    .gte("start_at", dayStartAt)
    .lte("start_at", dayEndAt);

  if (lessonError) {
    return {
      success: false as const,
      message: "De lesoverlapcontrole kon niet worden uitgevoerd.",
    };
  }

  const lessonWindows = ((lessonRows ?? [])
    .map((lesson) =>
      createBookingWindowFromLesson({
        startAt: lesson.start_at,
        durationMinutes: lesson.duur_minuten,
        status: lesson.status,
        label: lesson.titel,
      })
    )
    .filter(Boolean) as BookingWindow[]);

  const conflictingDates = Array.from(
    new Set(
      orderedSlots
        .filter((slot) =>
          (overlapRows ?? []).some((existing) => {
            if (ignoreIdSet.has(existing.id)) {
              return false;
            }

            return (
              new Date(existing.start_at).getTime() < new Date(slot.eind_at).getTime() &&
              new Date(existing.eind_at).getTime() > new Date(slot.start_at).getTime()
            );
          }) ||
          hasBookingConflict(
            { startAt: slot.start_at, endAt: slot.eind_at },
            lessonWindows
          )
        )
        .map((slot) => slot.dateLabel)
    )
  );
  const conflictingSlotKeys = Array.from(
    new Set(
      orderedSlots
        .filter((slot) =>
          (overlapRows ?? []).some((existing) => {
            if (ignoreIdSet.has(existing.id)) {
              return false;
            }

            return (
              new Date(existing.start_at).getTime() < new Date(slot.eind_at).getTime() &&
              new Date(existing.eind_at).getTime() > new Date(slot.start_at).getTime()
            );
          }) ||
          hasBookingConflict(
            { startAt: slot.start_at, endAt: slot.eind_at },
            lessonWindows
          )
        )
        .map((slot) => getPlannedAvailabilitySlotKey(slot))
    )
  );

  return {
    success: true as const,
    conflictingDates,
    conflictingSlotKeys,
  };
}

