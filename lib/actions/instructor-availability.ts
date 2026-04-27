"use server";

import { revalidatePath } from "next/cache";

import {
  addDaysToDateValue,
  createAvailabilityTimestamp,
  formatAvailabilityTime,
  formatAvailabilityDay,
  getDateValueDifferenceInDays,
  getAvailabilityDateValue,
  getStartOfWeekDateValue,
  formatAvailabilitySeriesLabel,
  getAvailabilitySeriesKey,
} from "@/lib/availability";
import { getWeekdayNumberFromDateValue } from "@/lib/availability-week-rules";
import { getAvailabilityTemplateById } from "@/lib/availability-templates";
import { getCurrentInstructeurRecord, ensureCurrentUserContext } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

type CreateAvailabilitySlotInput = {
  datum: string;
  eindDatum?: string;
  startTijd: string;
  eindTijd: string;
  repeatWeeks?: number | string;
  weekdagen?: number[];
  pauzeStartTijd?: string;
  pauzeEindTijd?: string;
  beschikbaar?: boolean;
  lesduurMinuten?: number;
  bufferMinuten?: number;
  maxLessenPerDag?: number;
};

type UpdateAvailabilityStatusInput = {
  slotId: string;
  beschikbaar: boolean;
};

type DeleteAvailabilitySlotInput = {
  slotId: string;
};

type SeriesAvailabilityActionInput = {
  slotId: string;
};

type UpdateAvailabilitySlotTimingInput = {
  slotId: string;
  datum: string;
  startTijd: string;
  eindTijd: string;
};

type UpdateAvailabilitySeriesTimingInput = {
  slotId: string;
  startTijd: string;
  eindTijd: string;
};

type UpdateAvailabilityWindowInput = {
  slotId: string;
  startTijd: string;
  eindTijd: string;
  pauzeStartTijd?: string;
  pauzeEindTijd?: string;
};

type UpdateAvailabilityWeekRuleInput = {
  ruleId: string;
  startTijd: string;
  eindTijd: string;
  pauzeStartTijd?: string;
  pauzeEindTijd?: string;
};

type UpdateAvailabilityWeekRuleActiveInput = {
  ruleId: string;
  beschikbaar: boolean;
};

type DeleteAvailabilityWeekRuleInput = {
  ruleId: string;
};

type ApplyAvailabilityTemplateInput = {
  templateId: string;
  startDatum: string;
  repeatWeeks?: number;
};

type DuplicateAvailabilityWeekInput = {
  sourceWeekStartDatum: string;
  targetWeekStartDatum: string;
};

const MAX_LINKED_WINDOW_GAP_MINUTES = 90;

type PlannedAvailabilitySlot = {
  id?: string;
  start_at: string;
  eind_at: string;
  dateLabel: string;
};

function getPlannedAvailabilitySlotKey(slot: Pick<PlannedAvailabilitySlot, "start_at" | "eind_at">) {
  return `${slot.start_at}|${slot.eind_at}`;
}

function revalidateAvailabilityPaths(slug: string) {
  revalidatePath("/instructeur/beschikbaarheid");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/instructeurs");
  revalidatePath("/leerling/instructeurs");
  revalidatePath(`/instructeurs/${slug}`);
}

async function ensureInstructorAccess() {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return {
      ok: false as const,
      message: "Log eerst in om je beschikbaarheid te beheren.",
    };
  }

  if (context.role !== "instructeur") {
    return {
      ok: false as const,
      message: "Alleen instructeurs kunnen beschikbaarheid beheren.",
    };
  }

  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      ok: false as const,
      message: "Je instructeursprofiel kon niet worden gevonden.",
    };
  }

  return {
    ok: true as const,
    instructeur,
  };
}

async function getSeriesSlotsFromAnchor(
  slotId: string,
  instructeurId: string,
  supabase: Awaited<ReturnType<typeof createServerClient>>
) {
  const { data: anchorSlot, error: anchorError } = await supabase
    .from("beschikbaarheid")
    .select("id, start_at, eind_at, beschikbaar")
    .eq("id", slotId)
    .eq("instructeur_id", instructeurId)
    .maybeSingle();

  if (anchorError || !anchorSlot) {
    return {
      success: false as const,
      message: "Dit tijdslot is niet gevonden.",
    };
  }

  const { data: candidateSlots, error: candidateError } = await supabase
    .from("beschikbaarheid")
    .select("id, start_at, eind_at, beschikbaar")
    .eq("instructeur_id", instructeurId)
    .gte("start_at", anchorSlot.start_at)
    .order("start_at", { ascending: true });

  if (candidateError) {
    return {
      success: false as const,
      message: "De reeks kon niet worden opgehaald.",
    };
  }

  const anchorSeriesKey = getAvailabilitySeriesKey(
    anchorSlot.start_at,
    anchorSlot.eind_at
  );
  const seriesSlots = (candidateSlots ?? []).filter((slot) => {
    return (
      getAvailabilitySeriesKey(slot.start_at, slot.eind_at) === anchorSeriesKey
    );
  });

  return {
    success: true as const,
    anchorSlot,
    seriesSlots,
    seriesLabel: formatAvailabilitySeriesLabel(
      anchorSlot.start_at,
      anchorSlot.eind_at
    ),
  };
}

function getAvailabilityWindowValidationMessage(startAt: string, eindAt: string) {
  if (new Date(eindAt).getTime() <= new Date(startAt).getTime()) {
    return "De eindtijd moet na de starttijd liggen.";
  }

  if (new Date(eindAt).getTime() - new Date(startAt).getTime() < 30 * 60_000) {
    return "Maak een tijdslot van minimaal 30 minuten.";
  }

  return null;
}

function getAvailabilityBreakValidationMessage(
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

function buildLinkedAvailabilityCluster<
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

async function findAvailabilityWeekRuleConflicts(
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

function getDateValuesBetween(startDateValue: string, endDateValue: string) {
  const totalDays = getDateValueDifferenceInDays(startDateValue, endDateValue);

  if (totalDays < 0) {
    return [];
  }

  return Array.from({ length: totalDays + 1 }, (_, dayIndex) =>
    addDaysToDateValue(startDateValue, dayIndex)
  );
}

function buildPlannedSlotsForWindow(params: {
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

async function findAvailabilityConflicts(
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
          })
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
          })
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

export async function createAvailabilitySlotAction(
  input: CreateAvailabilitySlotInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const datum = input.datum.trim();
  const eindDatum = input.eindDatum?.trim() ?? "";
  const startTijd = input.startTijd.trim();
  const eindTijd = input.eindTijd.trim();
  const repeatWeeksValue = String(input.repeatWeeks ?? 1).trim();
  const isOngoingWeekSchedule = repeatWeeksValue === "ongoing";
  const repeatWeeksRaw = Number.parseInt(repeatWeeksValue, 10);
  const repeatWeeks =
    !isOngoingWeekSchedule &&
    Number.isFinite(repeatWeeksRaw) &&
    repeatWeeksRaw >= 1 &&
    repeatWeeksRaw <= 12
      ? repeatWeeksRaw
      : 1;
  const requestedWeekdays = Array.isArray(input.weekdagen) ? input.weekdagen : [];
  const pauzeStartTijd = input.pauzeStartTijd?.trim() ?? "";
  const pauzeEindTijd = input.pauzeEindTijd?.trim() ?? "";
  const beschikbaar = input.beschikbaar !== false;
  const lesduurMinutenRaw = Number.parseInt(String(input.lesduurMinuten ?? 0), 10);
  const lesduurMinuten =
    Number.isFinite(lesduurMinutenRaw) && lesduurMinutenRaw >= 30 && lesduurMinutenRaw <= 240
      ? lesduurMinutenRaw
      : 0;
  const bufferMinutenRaw = Number.parseInt(String(input.bufferMinuten ?? 0), 10);
  const bufferMinuten =
    Number.isFinite(bufferMinutenRaw) && bufferMinutenRaw >= 0 && bufferMinutenRaw <= 120
      ? bufferMinutenRaw
      : 0;
  const maxLessenPerDagRaw = Number.parseInt(String(input.maxLessenPerDag ?? 0), 10);
  const maxLessenPerDag =
    Number.isFinite(maxLessenPerDagRaw) && maxLessenPerDagRaw >= 1 && maxLessenPerDagRaw <= 12
      ? maxLessenPerDagRaw
      : 0;
  const selectedWeekdays = Array.from(
    new Set(
      requestedWeekdays
        .map((value) => Number.parseInt(String(value), 10))
        .filter((value) => Number.isInteger(value) && value >= 1 && value <= 7)
    )
  ).sort((left, right) => left - right);
  const isWeekScheduleMode = selectedWeekdays.length > 0;
  const hasBreakWindow = Boolean(pauzeStartTijd || pauzeEindTijd);
  const useLessonCadence = beschikbaar && lesduurMinuten >= 30;
  const useDateRange = Boolean(eindDatum);

  if (!datum || !startTijd || !eindTijd) {
    return {
      success: false,
      message: "Vul een datum, starttijd en eindtijd in.",
    };
  }

  if (hasBreakWindow && (!pauzeStartTijd || !pauzeEindTijd)) {
    return {
      success: false,
      message: "Vul zowel een pauze-starttijd als een pauze-eindtijd in.",
    };
  }

  if (useDateRange && getDateValueDifferenceInDays(datum, eindDatum) < 0) {
    return {
      success: false,
      message: "De einddatum van je periode moet op of na de startdatum liggen.",
    };
  }

  if (isOngoingWeekSchedule && useDateRange) {
    return {
      success: false,
      message: "Gebruik voor een vaste weekplanning geen van-tot periode maar vaste werkdagen.",
    };
  }

  if (isOngoingWeekSchedule && useLessonCadence) {
    return {
      success: false,
      message:
        "Gebruik voor een vaste weekplanning alleen werktijden en pauze. Lesblokken met buffer blijven bedoeld voor losse of tijdelijke blokken.",
    };
  }

  if (isOngoingWeekSchedule) {
    const supabase = await createServerClient();
    const weekdayTargets =
      selectedWeekdays.length > 0
        ? selectedWeekdays
        : [getWeekdayNumberFromDateValue(datum)];

    try {
      const validationMessage = getAvailabilityWindowValidationMessage(
        createAvailabilityTimestamp(datum, startTijd),
        createAvailabilityTimestamp(datum, eindTijd)
      );

      if (validationMessage) {
        return {
          success: false,
          message: validationMessage,
        };
      }

      if (hasBreakWindow) {
        const breakValidationMessage = getAvailabilityBreakValidationMessage(
          createAvailabilityTimestamp(datum, startTijd),
          createAvailabilityTimestamp(datum, eindTijd),
          createAvailabilityTimestamp(datum, pauzeStartTijd),
          createAvailabilityTimestamp(datum, pauzeEindTijd)
        );

        if (breakValidationMessage) {
          return {
            success: false,
            message: breakValidationMessage,
          };
        }
      }
    } catch {
      return {
        success: false,
        message: "De datum of tijd kon niet goed worden verwerkt.",
      };
    }

    const ruleConflictResult = await findAvailabilityWeekRuleConflicts(
      supabase,
      access.instructeur.id,
      weekdayTargets.map((weekdag) => ({
        weekdag,
        startTijd,
        eindTijd,
      }))
    );

    if (!ruleConflictResult.success) {
      return ruleConflictResult;
    }

    const { error } = await supabase.from("beschikbaarheid_weekroosters").insert(
      weekdayTargets.map((weekdag) => ({
        instructeur_id: access.instructeur.id,
        weekdag,
        start_tijd: startTijd,
        eind_tijd: eindTijd,
        pauze_start_tijd: hasBreakWindow ? pauzeStartTijd : null,
        pauze_eind_tijd: hasBreakWindow ? pauzeEindTijd : null,
        beschikbaar,
        actief: true,
      }))
    );

    if (error) {
      return {
        success: false,
        message: "Je vaste weekplanning kon niet worden opgeslagen.",
      };
    }

    revalidateAvailabilityPaths(access.instructeur.slug);

    return {
      success: true,
      message:
        weekdayTargets.length === 1
          ? "Je vaste weekplanning staat nu elke week klaar tot je hem wijzigt."
          : `Je vaste weekplanning staat nu wekelijks klaar op ${weekdayTargets.length} werkdagen, tot je hem wijzigt.`,
    };
  }

  const plannedSlots: {
    instructeur_id: string;
    start_at: string;
    eind_at: string;
    beschikbaar: boolean;
    dateLabel: string;
  }[] = [];

  try {
    const baseDates = useDateRange
      ? getDateValuesBetween(datum, eindDatum).filter((dateValue) => {
          if (!selectedWeekdays.length) {
            return true;
          }

          const weekday = getStartOfWeekDateValue(dateValue);
          const weekdayNumber =
            getDateValueDifferenceInDays(weekday, dateValue) + 1;

          return selectedWeekdays.includes(weekdayNumber);
        })
      : isWeekScheduleMode
        ? (() => {
            const weekStart = getStartOfWeekDateValue(datum);
            return Array.from({ length: repeatWeeks }, (_, weekIndex) =>
              selectedWeekdays.map((weekday) =>
                addDaysToDateValue(weekStart, weekIndex * 7 + (weekday - 1))
              )
            ).flat();
          })()
        : Array.from({ length: repeatWeeks }, (_, weekIndex) =>
            addDaysToDateValue(datum, weekIndex * 7)
          );

    if (!baseDates.length) {
      return {
        success: false,
        message: "Er vallen geen dagen binnen deze gekozen periode of weekselectie.",
      };
    }

    for (const currentDate of baseDates) {
      const dailyPlannedSlots: {
        instructeur_id: string;
        start_at: string;
        eind_at: string;
        beschikbaar: boolean;
        dateLabel: string;
      }[] = [];
      const startAt = createAvailabilityTimestamp(currentDate, startTijd);
      const eindAt = createAvailabilityTimestamp(currentDate, eindTijd);

      const validationMessage = getAvailabilityWindowValidationMessage(
        startAt,
        eindAt
      );

      if (validationMessage) {
        return {
          success: false,
          message: validationMessage,
        };
      }

      if (hasBreakWindow) {
        const pauseStartAt = createAvailabilityTimestamp(currentDate, pauzeStartTijd);
        const pauseEndAt = createAvailabilityTimestamp(currentDate, pauzeEindTijd);
        const breakValidationMessage = getAvailabilityBreakValidationMessage(
          startAt,
          eindAt,
          pauseStartAt,
          pauseEndAt
        );

        if (breakValidationMessage) {
          return {
            success: false,
            message: breakValidationMessage,
          };
        }

        const beforePauseSlots = buildPlannedSlotsForWindow({
          instructeurId: access.instructeur.id,
          startAt,
          eindAt: pauseStartAt,
          beschikbaar,
          dateLabel: formatAvailabilityDay(startAt),
          lesduurMinuten,
          bufferMinuten,
        });

        if (!beforePauseSlots.success) {
          return {
            success: false,
            message: beforePauseSlots.message,
          };
        }

        const afterPauseSlots = buildPlannedSlotsForWindow({
          instructeurId: access.instructeur.id,
          startAt: pauseEndAt,
          eindAt,
          beschikbaar,
          dateLabel: formatAvailabilityDay(pauseEndAt),
          lesduurMinuten,
          bufferMinuten,
        });

        if (!afterPauseSlots.success) {
          return {
            success: false,
            message: afterPauseSlots.message,
          };
        }

        dailyPlannedSlots.push(...beforePauseSlots.slots, ...afterPauseSlots.slots);
      } else {
        const windowSlots = buildPlannedSlotsForWindow({
          instructeurId: access.instructeur.id,
          startAt,
          eindAt,
          beschikbaar,
          dateLabel: formatAvailabilityDay(startAt),
          lesduurMinuten,
          bufferMinuten,
        });

        if (!windowSlots.success) {
          return {
            success: false,
            message: windowSlots.message,
          };
        }

        dailyPlannedSlots.push(...windowSlots.slots);
      }

      plannedSlots.push(
        ...(maxLessenPerDag > 0 ? dailyPlannedSlots.slice(0, maxLessenPerDag) : dailyPlannedSlots)
      );
    }
  } catch {
    return {
      success: false,
      message: "De datum of tijd kon niet goed worden verwerkt.",
    };
  }

  const supabase = await createServerClient();
  const conflictResult = await findAvailabilityConflicts(
    supabase,
    access.instructeur.id,
    plannedSlots
  );

  if (!conflictResult.success) {
    return {
      success: false,
      message: conflictResult.message,
    };
  }

  const insertableSlots = plannedSlots.filter((slot) => {
    return !conflictResult.conflictingSlotKeys.includes(getPlannedAvailabilitySlotKey(slot));
  });

  if (!insertableSlots.length) {
    return {
      success: false,
      message:
        !beschikbaar
          ? "Geen afwezigheidsblokken toegevoegd. Deze periode overlapt volledig met bestaande blokken in je agenda."
          : useLessonCadence
            ? "Geen lesblokken toegevoegd. Deze werktijd met buffer overlapt volledig met bestaande blokken in je agenda."
        : isWeekScheduleMode
          ? "Geen werkdagen toegevoegd. Deze werktijden overlappen volledig met bestaande blokken in je agenda."
          : hasBreakWindow
            ? "Geen werkblokken toegevoegd. Deze werktijden met pauze overlappen volledig met bestaande blokken in je agenda."
          : repeatWeeks > 1
            ? "Geen tijdsloten toegevoegd. Deze wekelijkse reeks overlapt volledig met bestaande blokken."
            : "Dit tijdslot overlapt met een bestaand blok in je agenda.",
    };
  }

  const { error } = await supabase.from("beschikbaarheid").insert(
    insertableSlots.map((slot) => ({
      instructeur_id: slot.instructeur_id,
      start_at: slot.start_at,
      eind_at: slot.eind_at,
      beschikbaar: slot.beschikbaar,
    }))
  );

  if (error) {
    return {
      success: false,
      message: "Het tijdslot kon niet worden opgeslagen.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message:
      !beschikbaar
        ? insertableSlots.length === plannedSlots.length
          ? useDateRange
            ? `Je afwezigheidsperiode is toegevoegd met ${insertableSlots.length} blok${insertableSlots.length === 1 ? "" : "ken"}.`
            : `Je afwezigheidsblok${insertableSlots.length === 1 ? "" : "ken"} ${insertableSlots.length === 1 ? "is" : "zijn"} toegevoegd.`
          : `${insertableSlots.length} afwezigheidsblokken toegevoegd. ${conflictResult.conflictingDates.length} ${conflictResult.conflictingDates.length === 1 ? "blok is" : "blokken zijn"} overgeslagen door overlap.`
      : useLessonCadence
        ? insertableSlots.length === plannedSlots.length
          ? `Je lesblokken${bufferMinuten > 0 ? ` met ${bufferMinuten} minuten buffer` : ""} zijn toegevoegd.`
          : `${insertableSlots.length} lesblokken toegevoegd. ${conflictResult.conflictingDates.length} ${conflictResult.conflictingDates.length === 1 ? "blok is" : "blokken zijn"} overgeslagen door overlap.`
      : isWeekScheduleMode
        ? insertableSlots.length === plannedSlots.length
          ? `Je werkrooster is toegevoegd met ${insertableSlots.length} blok${insertableSlots.length === 1 ? "" : "ken"}.`
          : `${insertableSlots.length} werkdagblokken toegevoegd. ${conflictResult.conflictingDates.length} ${conflictResult.conflictingDates.length === 1 ? "blok is" : "blokken zijn"} overgeslagen door overlap.`
        : hasBreakWindow
          ? insertableSlots.length === plannedSlots.length
            ? "Je werktijd met pauzemoment is toegevoegd."
            : `${insertableSlots.length} werkblokken toegevoegd. ${conflictResult.conflictingDates.length} ${conflictResult.conflictingDates.length === 1 ? "blok is" : "blokken zijn"} overgeslagen door overlap.`
        : repeatWeeks === 1
          ? "Je tijdslot is toegevoegd."
          : insertableSlots.length === plannedSlots.length
            ? `Je wekelijkse reeks is toegevoegd voor ${insertableSlots.length} weken.`
            : `${insertableSlots.length} weekblokken toegevoegd. ${conflictResult.conflictingDates.length} ${conflictResult.conflictingDates.length === 1 ? "week is" : "weken zijn"} overgeslagen door overlap.`,
  };
}

export async function applyAvailabilityTemplateAction(
  input: ApplyAvailabilityTemplateInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const templateId = input.templateId.trim();
  const startDatum = input.startDatum.trim();
  const repeatWeeksRaw = Number.parseInt(String(input.repeatWeeks ?? 1), 10);
  const repeatWeeks =
    Number.isFinite(repeatWeeksRaw) && repeatWeeksRaw >= 1 && repeatWeeksRaw <= 12
      ? repeatWeeksRaw
      : 1;

  const template = getAvailabilityTemplateById(templateId);

  if (!template) {
    return {
      success: false,
      message: "Deze beschikbaarheidstemplate is niet gevonden.",
    };
  }

  if (!startDatum) {
    return {
      success: false,
      message: "Kies eerst een startdatum of week voor de template.",
    };
  }

  const plannedSlots: {
    instructeur_id: string;
    start_at: string;
    eind_at: string;
    beschikbaar: boolean;
    dateLabel: string;
  }[] = [];

  try {
    const weekStart = getStartOfWeekDateValue(startDatum);

    for (let weekIndex = 0; weekIndex < repeatWeeks; weekIndex += 1) {
      for (const block of template.blocks) {
        const blockDate = addDaysToDateValue(
          weekStart,
          weekIndex * 7 + (block.weekday - 1)
        );
        const startAt = createAvailabilityTimestamp(blockDate, block.startTijd);
        const eindAt = createAvailabilityTimestamp(blockDate, block.eindTijd);
        const validationMessage = getAvailabilityWindowValidationMessage(
          startAt,
          eindAt
        );

        if (validationMessage) {
          return {
            success: false,
            message: validationMessage,
          };
        }

        plannedSlots.push({
          instructeur_id: access.instructeur.id,
          start_at: startAt,
          eind_at: eindAt,
          beschikbaar: true,
          dateLabel: formatAvailabilityDay(startAt),
        });
      }
    }
  } catch {
    return {
      success: false,
      message: "De template kon niet goed worden opgebouwd.",
    };
  }

  const supabase = await createServerClient();
  const conflictResult = await findAvailabilityConflicts(
    supabase,
    access.instructeur.id,
    plannedSlots
  );

  if (!conflictResult.success) {
    return {
      success: false,
      message: conflictResult.message,
    };
  }

  const insertableSlots = plannedSlots.filter((slot) => {
    return !conflictResult.conflictingDates.includes(slot.dateLabel);
  });

  if (!insertableSlots.length) {
    return {
      success: false,
      message: "Deze template overlapt volledig met bestaande tijdsloten.",
    };
  }

  const { error } = await supabase.from("beschikbaarheid").insert(
    insertableSlots.map((slot) => ({
      instructeur_id: slot.instructeur_id,
      start_at: slot.start_at,
      eind_at: slot.eind_at,
      beschikbaar: slot.beschikbaar,
    }))
  );

  if (error) {
    return {
      success: false,
      message: "De template kon niet worden toegepast.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message:
      insertableSlots.length === plannedSlots.length
        ? `Template "${template.title}" toegepast voor ${insertableSlots.length} blokken.`
        : `Template "${template.title}" toegepast voor ${insertableSlots.length} blokken. ${conflictResult.conflictingDates.length} ${conflictResult.conflictingDates.length === 1 ? "moment is" : "momenten zijn"} overgeslagen door overlap.`,
  };
}

export async function duplicateAvailabilityWeekAction(
  input: DuplicateAvailabilityWeekInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const sourceWeekStartDatum = input.sourceWeekStartDatum.trim();
  const targetWeekStartDatum = input.targetWeekStartDatum.trim();

  if (!sourceWeekStartDatum || !targetWeekStartDatum) {
    return {
      success: false,
      message: "Kies een bronweek en doelweek voor het dupliceren.",
    };
  }

  const sourceWeekStart = getStartOfWeekDateValue(sourceWeekStartDatum);
  const targetWeekStart = getStartOfWeekDateValue(targetWeekStartDatum);
  const sourceWeekEnd = addDaysToDateValue(sourceWeekStart, 7);

  const supabase = await createServerClient();
  const sourceWeekStartTs = createAvailabilityTimestamp(sourceWeekStart, "00:00");
  const sourceWeekEndTs = createAvailabilityTimestamp(sourceWeekEnd, "00:00");

  const { data: sourceRows, error: sourceError } = await supabase
    .from("beschikbaarheid")
    .select("id, start_at, eind_at, beschikbaar")
    .eq("instructeur_id", access.instructeur.id)
    .gte("start_at", sourceWeekStartTs)
    .lt("start_at", sourceWeekEndTs)
    .order("start_at", { ascending: true });

  if (sourceError) {
    return {
      success: false,
      message: "De bronweek kon niet worden gelezen.",
    };
  }

  const activeSourceRows = (sourceRows ?? []).filter((slot) => slot.beschikbaar);

  if (!activeSourceRows.length) {
    return {
      success: false,
      message: "Er zijn geen actieve blokken in de gekozen bronweek om te dupliceren.",
    };
  }

  const plannedSlots = activeSourceRows.map((slot) => {
    const sourceDateValue = getAvailabilityDateValue(slot.start_at);
    const offsetDays = getDateValueDifferenceInDays(sourceWeekStart, sourceDateValue);
    const targetDateValue = addDaysToDateValue(targetWeekStart, offsetDays);
    const startAt = createAvailabilityTimestamp(
      targetDateValue,
      formatAvailabilityTime(slot.start_at)
    );
    const eindAt = createAvailabilityTimestamp(
      targetDateValue,
      formatAvailabilityTime(slot.eind_at)
    );

    return {
      instructeur_id: access.instructeur.id,
      start_at: startAt,
      eind_at: eindAt,
      beschikbaar: true,
      dateLabel: formatAvailabilityDay(startAt),
    };
  });

  const conflictResult = await findAvailabilityConflicts(
    supabase,
    access.instructeur.id,
    plannedSlots
  );

  if (!conflictResult.success) {
    return {
      success: false,
      message: conflictResult.message,
    };
  }

  const insertableSlots = plannedSlots.filter((slot) => {
    return !conflictResult.conflictingDates.includes(slot.dateLabel);
  });

  if (!insertableSlots.length) {
    return {
      success: false,
      message: "De doelweek is al gevuld met overlappende blokken.",
    };
  }

  const { error } = await supabase.from("beschikbaarheid").insert(
    insertableSlots.map((slot) => ({
      instructeur_id: slot.instructeur_id,
      start_at: slot.start_at,
      eind_at: slot.eind_at,
      beschikbaar: slot.beschikbaar,
    }))
  );

  if (error) {
    return {
      success: false,
      message: "De week kon niet worden gedupliceerd.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message:
      insertableSlots.length === plannedSlots.length
        ? `${insertableSlots.length} blokken uit de bronweek zijn doorgeschoven naar de volgende week.`
        : `${insertableSlots.length} blokken doorgeschoven. ${conflictResult.conflictingDates.length} ${conflictResult.conflictingDates.length === 1 ? "blok is" : "blokken zijn"} overgeslagen door overlap.`,
  };
}

export async function updateAvailabilitySlotTimingAction(
  input: UpdateAvailabilitySlotTimingInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const slotId = input.slotId.trim();
  const datum = input.datum.trim();
  const startTijd = input.startTijd.trim();
  const eindTijd = input.eindTijd.trim();

  if (!slotId || !datum || !startTijd || !eindTijd) {
    return {
      success: false,
      message: "Vul een datum, starttijd en eindtijd in.",
    };
  }

  const supabase = await createServerClient();
  const { data: slot } = await supabase
    .from("beschikbaarheid")
    .select("id")
    .eq("id", slotId)
    .eq("instructeur_id", access.instructeur.id)
    .maybeSingle();

  if (!slot) {
    return {
      success: false,
      message: "Dit tijdslot is niet gevonden.",
    };
  }

  let startAt = "";
  let eindAt = "";

  try {
    startAt = createAvailabilityTimestamp(datum, startTijd);
    eindAt = createAvailabilityTimestamp(datum, eindTijd);
  } catch {
    return {
      success: false,
      message: "De datum of tijd kon niet goed worden verwerkt.",
    };
  }

  const validationMessage = getAvailabilityWindowValidationMessage(startAt, eindAt);

  if (validationMessage) {
    return {
      success: false,
      message: validationMessage,
    };
  }

  const plannedSlot: PlannedAvailabilitySlot = {
    id: slot.id,
    start_at: startAt,
    eind_at: eindAt,
    dateLabel: formatAvailabilityDay(startAt),
  };

  const conflictResult = await findAvailabilityConflicts(
    supabase,
    access.instructeur.id,
    [plannedSlot],
    [slot.id]
  );

  if (!conflictResult.success) {
    return {
      success: false,
      message: conflictResult.message,
    };
  }

  if (conflictResult.conflictingDates.length) {
    return {
      success: false,
      message: "Dit aangepaste tijdslot overlapt met een ander blok in je agenda.",
    };
  }

  const { error } = await supabase
    .from("beschikbaarheid")
    .update({
      start_at: startAt,
      eind_at: eindAt,
    })
    .eq("id", slot.id)
    .eq("instructeur_id", access.instructeur.id);

  if (error) {
    return {
      success: false,
      message: "Het tijdslot kon niet worden bijgewerkt.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message: "Het tijdslot is bijgewerkt.",
  };
}

export async function updateAvailabilitySeriesTimingAction(
  input: UpdateAvailabilitySeriesTimingInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const slotId = input.slotId.trim();
  const startTijd = input.startTijd.trim();
  const eindTijd = input.eindTijd.trim();

  if (!slotId || !startTijd || !eindTijd) {
    return {
      success: false,
      message: "Vul een starttijd en eindtijd in voor de reeks.",
    };
  }

  const supabase = await createServerClient();
  const seriesResult = await getSeriesSlotsFromAnchor(
    slotId,
    access.instructeur.id,
    supabase
  );

  if (!seriesResult.success) {
    return {
      success: false,
      message: seriesResult.message,
    };
  }

  const plannedSlots: PlannedAvailabilitySlot[] = [];

  try {
    for (const slot of seriesResult.seriesSlots) {
      const dateValue = getAvailabilityDateValue(slot.start_at);
      const startAt = createAvailabilityTimestamp(dateValue, startTijd);
      const eindAt = createAvailabilityTimestamp(dateValue, eindTijd);
      const validationMessage = getAvailabilityWindowValidationMessage(
        startAt,
        eindAt
      );

      if (validationMessage) {
        return {
          success: false,
          message: validationMessage,
        };
      }

      plannedSlots.push({
        id: slot.id,
        start_at: startAt,
        eind_at: eindAt,
        dateLabel: formatAvailabilityDay(startAt),
      });
    }
  } catch {
    return {
      success: false,
      message: "De nieuwe tijden voor deze reeks konden niet worden verwerkt.",
    };
  }

  const conflictResult = await findAvailabilityConflicts(
    supabase,
    access.instructeur.id,
    plannedSlots,
    plannedSlots.flatMap((slot) => (slot.id ? [slot.id] : []))
  );

  if (!conflictResult.success) {
    return {
      success: false,
      message: conflictResult.message,
    };
  }

  if (conflictResult.conflictingDates.length) {
    return {
      success: false,
      message:
        "De aangepaste reeks overlapt met bestaande tijdsloten. Pas de tijden aan en probeer opnieuw.",
    };
  }

  const updateResults = await Promise.all(
    plannedSlots.map((slot) =>
      supabase
        .from("beschikbaarheid")
        .update({
          start_at: slot.start_at,
          eind_at: slot.eind_at,
        })
        .eq("id", slot.id ?? "")
        .eq("instructeur_id", access.instructeur.id)
    )
  );

  if (updateResults.some((result) => result.error)) {
    return {
      success: false,
      message: "De reeks kon niet volledig worden bijgewerkt.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message: `${plannedSlots.length} blokken in deze reeks zijn bijgewerkt.`,
    detail: seriesResult.seriesLabel,
  };
}

export async function updateAvailabilityWeekRuleAction(
  input: UpdateAvailabilityWeekRuleInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const ruleId = input.ruleId.trim();
  const startTijd = input.startTijd.trim();
  const eindTijd = input.eindTijd.trim();
  const pauzeStartTijd = input.pauzeStartTijd?.trim() ?? "";
  const pauzeEindTijd = input.pauzeEindTijd?.trim() ?? "";
  const hasBreakWindow = Boolean(pauzeStartTijd || pauzeEindTijd);

  if (!ruleId || !startTijd || !eindTijd) {
    return {
      success: false,
      message: "Vul een starttijd en eindtijd in.",
    };
  }

  if (hasBreakWindow && (!pauzeStartTijd || !pauzeEindTijd)) {
    return {
      success: false,
      message: "Vul zowel een pauze-starttijd als een pauze-eindtijd in.",
    };
  }

  const supabase = await createServerClient();
  const { data: rule } = await supabase
    .from("beschikbaarheid_weekroosters")
    .select(
      "id, instructeur_id, weekdag, start_tijd, eind_tijd, pauze_start_tijd, pauze_eind_tijd, beschikbaar, actief"
    )
    .eq("id", ruleId)
    .eq("instructeur_id", access.instructeur.id)
    .maybeSingle();

  if (!rule) {
    return {
      success: false,
      message: "Deze vaste weekplanning is niet gevonden.",
    };
  }

  try {
    const referenceDate = addDaysToDateValue("2026-01-05", rule.weekdag - 1);
    const validationMessage = getAvailabilityWindowValidationMessage(
      createAvailabilityTimestamp(referenceDate, startTijd),
      createAvailabilityTimestamp(referenceDate, eindTijd)
    );

    if (validationMessage) {
      return {
        success: false,
        message: validationMessage,
      };
    }

    if (hasBreakWindow) {
      const breakValidationMessage = getAvailabilityBreakValidationMessage(
        createAvailabilityTimestamp(referenceDate, startTijd),
        createAvailabilityTimestamp(referenceDate, eindTijd),
        createAvailabilityTimestamp(referenceDate, pauzeStartTijd),
        createAvailabilityTimestamp(referenceDate, pauzeEindTijd)
      );

      if (breakValidationMessage) {
        return {
          success: false,
          message: breakValidationMessage,
        };
      }
    }
  } catch {
    return {
      success: false,
      message: "De gekozen tijden konden niet goed worden verwerkt.",
    };
  }

  const ruleConflictResult = await findAvailabilityWeekRuleConflicts(
    supabase,
    access.instructeur.id,
    [
      {
        weekdag: rule.weekdag,
        startTijd,
        eindTijd,
      },
    ],
    [rule.id]
  );

  if (!ruleConflictResult.success) {
    return ruleConflictResult;
  }

  const { error } = await supabase
    .from("beschikbaarheid_weekroosters")
    .update({
      start_tijd: startTijd,
      eind_tijd: eindTijd,
      pauze_start_tijd: hasBreakWindow ? pauzeStartTijd : null,
      pauze_eind_tijd: hasBreakWindow ? pauzeEindTijd : null,
    })
    .eq("id", rule.id)
    .eq("instructeur_id", access.instructeur.id);

  if (error) {
    return {
      success: false,
      message: "Je vaste weekplanning kon niet worden bijgewerkt.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message: "Je vaste weekplanning is bijgewerkt.",
  };
}

export async function updateAvailabilityWeekRuleActiveAction(
  input: UpdateAvailabilityWeekRuleActiveInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const ruleId = input.ruleId.trim();

  if (!ruleId) {
    return {
      success: false,
      message: "Deze vaste weekplanning is niet gevonden.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("beschikbaarheid_weekroosters")
    .update({
      beschikbaar: input.beschikbaar,
    })
    .eq("id", ruleId)
    .eq("instructeur_id", access.instructeur.id);

  if (error) {
    return {
      success: false,
      message: "De status van je vaste weekplanning kon niet worden aangepast.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message: input.beschikbaar
      ? "Je vaste weekplanning is weer boekbaar."
      : "Je vaste weekplanning is nu niet boekbaar.",
  };
}

export async function deleteAvailabilityWeekRuleAction(
  input: DeleteAvailabilityWeekRuleInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const ruleId = input.ruleId.trim();

  if (!ruleId) {
    return {
      success: false,
      message: "Deze vaste weekplanning is niet gevonden.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("beschikbaarheid_weekroosters")
    .delete()
    .eq("id", ruleId)
    .eq("instructeur_id", access.instructeur.id);

  if (error) {
    return {
      success: false,
      message: "Je vaste weekplanning kon niet worden verwijderd.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message: "Je vaste weekplanning is verwijderd.",
  };
}

export async function updateAvailabilityWindowAction(
  input: UpdateAvailabilityWindowInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const slotId = input.slotId.trim();
  const startTijd = input.startTijd.trim();
  const eindTijd = input.eindTijd.trim();
  const pauzeStartTijd = input.pauzeStartTijd?.trim() ?? "";
  const pauzeEindTijd = input.pauzeEindTijd?.trim() ?? "";
  const hasBreakWindow = Boolean(pauzeStartTijd || pauzeEindTijd);

  if (!slotId || !startTijd || !eindTijd) {
    return {
      success: false,
      message: "Vul een starttijd en eindtijd in.",
    };
  }

  if (hasBreakWindow && (!pauzeStartTijd || !pauzeEindTijd)) {
    return {
      success: false,
      message: "Vul zowel een pauze-starttijd als een pauze-eindtijd in.",
    };
  }

  const supabase = await createServerClient();
  const { data: anchorSlot, error: anchorError } = await supabase
    .from("beschikbaarheid")
    .select("id, start_at, eind_at, beschikbaar")
    .eq("id", slotId)
    .eq("instructeur_id", access.instructeur.id)
    .maybeSingle();

  if (anchorError || !anchorSlot) {
    return {
      success: false,
      message: "Dit tijdslot is niet gevonden.",
    };
  }

  const dateValue = getAvailabilityDateValue(anchorSlot.start_at);
  const nextDateValue = addDaysToDateValue(dateValue, 1);
  const { data: daySlots, error: daySlotsError } = await supabase
    .from("beschikbaarheid")
    .select("id, start_at, eind_at, beschikbaar")
    .eq("instructeur_id", access.instructeur.id)
    .gte("start_at", createAvailabilityTimestamp(dateValue, "00:00"))
    .lt("start_at", createAvailabilityTimestamp(nextDateValue, "00:00"))
    .order("start_at", { ascending: true });

  if (daySlotsError || !daySlots?.length) {
    return {
      success: false,
      message: "Het gekoppelde werkblok voor deze dag kon niet worden opgehaald.",
    };
  }

  const linkedSlots = buildLinkedAvailabilityCluster(daySlots, anchorSlot.id);

  if (!linkedSlots.length) {
    return {
      success: false,
      message: "Er is geen gekoppeld werkblok gevonden om bij te werken.",
    };
  }

  let startAt = "";
  let eindAt = "";
  let pauseStartAt = "";
  let pauseEndAt = "";

  try {
    startAt = createAvailabilityTimestamp(dateValue, startTijd);
    eindAt = createAvailabilityTimestamp(dateValue, eindTijd);

    if (hasBreakWindow) {
      pauseStartAt = createAvailabilityTimestamp(dateValue, pauzeStartTijd);
      pauseEndAt = createAvailabilityTimestamp(dateValue, pauzeEindTijd);
    }
  } catch {
    return {
      success: false,
      message: "De tijd kon niet goed worden verwerkt.",
    };
  }

  const validationMessage = getAvailabilityWindowValidationMessage(startAt, eindAt);

  if (validationMessage) {
    return {
      success: false,
      message: validationMessage,
    };
  }

  if (hasBreakWindow) {
    const breakValidationMessage = getAvailabilityBreakValidationMessage(
      startAt,
      eindAt,
      pauseStartAt,
      pauseEndAt
    );

    if (breakValidationMessage) {
      return {
        success: false,
        message: breakValidationMessage,
      };
    }
  }

  const plannedSlots: PlannedAvailabilitySlot[] = hasBreakWindow
    ? [
        {
          start_at: startAt,
          eind_at: pauseStartAt,
          dateLabel: formatAvailabilityDay(startAt),
        },
        {
          start_at: pauseEndAt,
          eind_at: eindAt,
          dateLabel: formatAvailabilityDay(pauseEndAt),
        },
      ]
    : [
        {
          start_at: startAt,
          eind_at: eindAt,
          dateLabel: formatAvailabilityDay(startAt),
        },
      ];

  const conflictResult = await findAvailabilityConflicts(
    supabase,
    access.instructeur.id,
    plannedSlots,
    linkedSlots.map((slot) => slot.id)
  );

  if (!conflictResult.success) {
    return {
      success: false,
      message: conflictResult.message,
    };
  }

  if (conflictResult.conflictingDates.length) {
    return {
      success: false,
      message: "Deze aangepaste werktijd overlapt met een ander blok in je agenda.",
    };
  }

  if (linkedSlots.length === plannedSlots.length) {
    const updateResults = await Promise.all(
      plannedSlots.map((slot, index) =>
        supabase
          .from("beschikbaarheid")
          .update({
            start_at: slot.start_at,
            eind_at: slot.eind_at,
          })
          .eq("id", linkedSlots[index]?.id ?? "")
          .eq("instructeur_id", access.instructeur.id)
      )
    );

    if (updateResults.some((result) => result.error)) {
      return {
        success: false,
        message: "De werktijden konden niet volledig worden bijgewerkt.",
      };
    }
  } else {
    const { error: deleteError } = await supabase
      .from("beschikbaarheid")
      .delete()
      .in(
        "id",
        linkedSlots.map((slot) => slot.id)
      )
      .eq("instructeur_id", access.instructeur.id);

    if (deleteError) {
      return {
        success: false,
        message: "De bestaande werkblokken konden niet worden vervangen.",
      };
    }

    const { error: insertError } = await supabase.from("beschikbaarheid").insert(
      plannedSlots.map((slot) => ({
        instructeur_id: access.instructeur.id,
        start_at: slot.start_at,
        eind_at: slot.eind_at,
        beschikbaar: anchorSlot.beschikbaar,
      }))
    );

    if (insertError) {
      return {
        success: false,
        message: "De nieuwe werktijden konden niet worden opgeslagen.",
      };
    }
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message: hasBreakWindow
      ? "Je werktijd en pauze zijn direct bijgewerkt in de agenda."
      : "Je werktijd is direct bijgewerkt in de agenda.",
  };
}

export async function updateAvailabilitySlotStatusAction(
  input: UpdateAvailabilityStatusInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const slotId = input.slotId.trim();

  if (!slotId) {
    return {
      success: false,
      message: "Kies eerst een tijdslot.",
    };
  }

  const supabase = await createServerClient();
  const { data: slot } = await supabase
    .from("beschikbaarheid")
    .select("id")
    .eq("id", slotId)
    .eq("instructeur_id", access.instructeur.id)
    .maybeSingle();

  if (!slot) {
    return {
      success: false,
      message: "Dit tijdslot is niet gevonden.",
    };
  }

  const { error } = await supabase
    .from("beschikbaarheid")
    .update({ beschikbaar: input.beschikbaar })
    .eq("id", slotId)
    .eq("instructeur_id", access.instructeur.id);

  if (error) {
    return {
      success: false,
      message: "De status van dit tijdslot kon niet worden aangepast.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message: input.beschikbaar
      ? "Dit blok is weer boekbaar."
      : "Dit blok is nu niet boekbaar.",
  };
}

export async function deleteAvailabilitySlotAction(
  input: DeleteAvailabilitySlotInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const slotId = input.slotId.trim();

  if (!slotId) {
    return {
      success: false,
      message: "Kies eerst een tijdslot.",
    };
  }

  const supabase = await createServerClient();
  const { data: slot } = await supabase
    .from("beschikbaarheid")
    .select("id")
    .eq("id", slotId)
    .eq("instructeur_id", access.instructeur.id)
    .maybeSingle();

  if (!slot) {
    return {
      success: false,
      message: "Dit tijdslot is niet gevonden.",
    };
  }

  const { error } = await supabase
    .from("beschikbaarheid")
    .delete()
    .eq("id", slotId)
    .eq("instructeur_id", access.instructeur.id);

  if (error) {
    return {
      success: false,
      message: "Het tijdslot kon niet worden verwijderd.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message: "Het tijdslot is verwijderd.",
  };
}

export async function updateAvailabilitySeriesStatusAction(
  input: SeriesAvailabilityActionInput & { beschikbaar: boolean }
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const slotId = input.slotId.trim();

  if (!slotId) {
    return {
      success: false,
      message: "Kies eerst een tijdslot.",
    };
  }

  const supabase = await createServerClient();
  const seriesResult = await getSeriesSlotsFromAnchor(
    slotId,
    access.instructeur.id,
    supabase
  );

  if (!seriesResult.success) {
    return {
      success: false,
      message: seriesResult.message,
    };
  }

  const targetIds = seriesResult.seriesSlots
    .filter((slot) => slot.beschikbaar !== input.beschikbaar)
    .map((slot) => slot.id);

  if (!targetIds.length) {
    return {
      success: true,
      message: input.beschikbaar
        ? "Deze hele reeks stond al actief."
        : "Deze hele reeks stond al verborgen.",
    };
  }

  const { error } = await supabase
    .from("beschikbaarheid")
    .update({ beschikbaar: input.beschikbaar })
    .eq("instructeur_id", access.instructeur.id)
    .in("id", targetIds);

  if (error) {
    return {
      success: false,
      message: "De reeks kon niet worden aangepast.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message: input.beschikbaar
      ? `${targetIds.length} blokken in deze reeks zijn weer boekbaar gemaakt.`
      : `${targetIds.length} blokken in deze reeks zijn niet boekbaar gemaakt.`,
    detail: seriesResult.seriesLabel,
  };
}

export async function deleteAvailabilitySeriesAction(
  input: SeriesAvailabilityActionInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const slotId = input.slotId.trim();

  if (!slotId) {
    return {
      success: false,
      message: "Kies eerst een tijdslot.",
    };
  }

  const supabase = await createServerClient();
  const seriesResult = await getSeriesSlotsFromAnchor(
    slotId,
    access.instructeur.id,
    supabase
  );

  if (!seriesResult.success) {
    return {
      success: false,
      message: seriesResult.message,
    };
  }

  const targetIds = seriesResult.seriesSlots.map((slot) => slot.id);

  if (!targetIds.length) {
    return {
      success: false,
      message: "Er zijn geen blokken gevonden om te verwijderen.",
    };
  }

  const { error } = await supabase
    .from("beschikbaarheid")
    .delete()
    .eq("instructeur_id", access.instructeur.id)
    .in("id", targetIds);

  if (error) {
    return {
      success: false,
      message: "De reeks kon niet worden verwijderd.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message: `${targetIds.length} blokken uit deze reeks zijn verwijderd.`,
    detail: seriesResult.seriesLabel,
  };
}
