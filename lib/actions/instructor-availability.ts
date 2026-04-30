"use server";

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
import {
  getWeekdayNumberFromDateValue,
  parseWeekRuleSlotId,
} from "@/lib/availability-week-rules";
import { getAvailabilityTemplateById } from "@/lib/availability-templates";
import {
  addMinutesToTimeValue,
  buildLinkedAvailabilityCluster,
  buildPlannedSlotsForWindow,
  findAvailabilityConflicts,
  findAvailabilityWeekRuleConflicts,
  getAvailabilityBreakValidationMessage,
  getAvailabilityWindowValidationMessage,
  getDateValuesBetween,
  normalizePauseWindow,
} from "@/lib/actions/instructor-availability-planning";
import {
  ensureInstructorAccess,
  getPlannedAvailabilitySlotKey,
  revalidateAvailabilityPaths,
  type ApplyAvailabilityTemplateInput,
  type ApplyAvailabilityWeeklyBulkActionInput,
  type CreateAvailabilitySlotInput,
  type CreateAvailabilityWeekOverrideInput,
  type DeleteAvailabilitySlotInput,
  type DeleteAvailabilityWeekRuleInput,
  type DuplicateAvailabilityWeekInput,
  type MoveAvailabilityBlockInput,
  type PlannedAvailabilitySlot,
  type SeriesAvailabilityActionInput,
  type ShiftAvailabilityBlocksInput,
  type UpdateAvailabilitySeriesTimingInput,
  type UpdateAvailabilitySlotTimingInput,
  type UpdateAvailabilityStatusInput,
  type UpdateAvailabilityWeekRuleActiveInput,
  type UpdateAvailabilityWeekRuleInput,
  type UpdateAvailabilityWindowInput,
} from "@/lib/actions/instructor-availability-shared";
import { createServerClient } from "@/lib/supabase/server";

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

export async function moveAvailabilityBlockAction(
  input: MoveAvailabilityBlockInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const slotId = input.slotId.trim();
  const targetDateValue = input.targetDateValue.trim();

  if (!slotId || !targetDateValue) {
    return {
      success: false,
      message: "Kies een blok en een doeldag om te verplaatsen.",
    };
  }

  const supabase = await createServerClient();
  const parsedWeekRuleSlot = parseWeekRuleSlotId(slotId);

  if (parsedWeekRuleSlot) {
    const { data: rule } = await supabase
      .from("beschikbaarheid_weekroosters")
      .select(
        "id, instructeur_id, weekdag, start_tijd, eind_tijd, pauze_start_tijd, pauze_eind_tijd, beschikbaar, actief"
      )
      .eq("id", parsedWeekRuleSlot.ruleId)
      .eq("instructeur_id", access.instructeur.id)
      .maybeSingle();

    if (!rule) {
      return {
        success: false,
        message: "Deze vaste weekplanning is niet gevonden.",
      };
    }

    const targetWeekday = getWeekdayNumberFromDateValue(targetDateValue);

    if (rule.weekdag === targetWeekday) {
      return {
        success: true,
        message: "Dit vaste blok stond al op die weekdag.",
      };
    }

    const ruleConflictResult = await findAvailabilityWeekRuleConflicts(
      supabase,
      access.instructeur.id,
      [
        {
          weekdag: targetWeekday,
          startTijd: rule.start_tijd,
          eindTijd: rule.eind_tijd,
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
        weekdag: targetWeekday,
      })
      .eq("id", rule.id)
      .eq("instructeur_id", access.instructeur.id);

    if (error) {
      return {
        success: false,
        message: "De vaste weekplanning kon niet worden verplaatst.",
      };
    }

    revalidateAvailabilityPaths(access.instructeur.slug);

    return {
      success: true,
      message: `De vaste weekplanning staat nu op ${formatAvailabilityDay(
        createAvailabilityTimestamp(targetDateValue, "12:00")
      )}.`,
    };
  }

  const { data: slot } = await supabase
    .from("beschikbaarheid")
    .select("id, start_at, eind_at")
    .eq("id", slotId)
    .eq("instructeur_id", access.instructeur.id)
    .maybeSingle();

  if (!slot) {
    return {
      success: false,
      message: "Dit agendablok is niet gevonden.",
    };
  }

  const currentDateValue = getAvailabilityDateValue(slot.start_at);

  if (currentDateValue === targetDateValue) {
    return {
      success: true,
      message: "Dit blok stond al op die dag.",
    };
  }

  let startAt = "";
  let eindAt = "";

  try {
    startAt = createAvailabilityTimestamp(
      targetDateValue,
      formatAvailabilityTime(slot.start_at)
    );
    eindAt = createAvailabilityTimestamp(
      targetDateValue,
      formatAvailabilityTime(slot.eind_at)
    );
  } catch {
    return {
      success: false,
      message: "De nieuwe dag kon niet goed worden verwerkt.",
    };
  }

  const validationMessage = getAvailabilityWindowValidationMessage(startAt, eindAt);

  if (validationMessage) {
    return {
      success: false,
      message: validationMessage,
    };
  }

  const conflictResult = await findAvailabilityConflicts(
    supabase,
    access.instructeur.id,
    [
      {
        id: slot.id,
        start_at: startAt,
        eind_at: eindAt,
        dateLabel: formatAvailabilityDay(startAt),
      },
    ],
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
      message: "Dat doeldagblok overlapt met een ander moment of een les in je agenda.",
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
      message: "Het blok kon niet naar die dag worden verplaatst.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message: `Het blok is verplaatst naar ${formatAvailabilityDay(startAt)}.`,
  };
}

export async function shiftAvailabilityBlocksAction(
  input: ShiftAvailabilityBlocksInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const slotIds = Array.from(
    new Set(
      (input.slotIds ?? [])
        .map((slotId) => slotId.trim())
        .filter(Boolean)
    )
  );
  const minutes = Number(input.minutes);

  if (!slotIds.length || !Number.isFinite(minutes) || minutes === 0) {
    return {
      success: false,
      message: "Kies minimaal één blok en een geldige verschuiving.",
    };
  }

  const supabase = await createServerClient();
  const parsedWeekRuleSlots = slotIds
    .map((slotId) => ({
      slotId,
      parsed: parseWeekRuleSlotId(slotId),
    }))
    .filter(
      (
        item
      ): item is {
        slotId: string;
        parsed: NonNullable<ReturnType<typeof parseWeekRuleSlotId>>;
      } => Boolean(item.parsed)
    );
  const weekRuleIds = Array.from(
    new Set(parsedWeekRuleSlots.map((item) => item.parsed.ruleId))
  );
  const concreteSlotIds = slotIds.filter(
    (slotId) => !parsedWeekRuleSlots.some((item) => item.slotId === slotId)
  );

  if (weekRuleIds.length) {
    const { data: weekRules, error: weekRuleError } = await supabase
      .from("beschikbaarheid_weekroosters")
      .select(
        "id, instructeur_id, weekdag, start_tijd, eind_tijd, pauze_start_tijd, pauze_eind_tijd, beschikbaar, actief"
      )
      .eq("instructeur_id", access.instructeur.id)
      .in("id", weekRuleIds);

    if (weekRuleError || (weekRules ?? []).length !== weekRuleIds.length) {
      return {
        success: false,
        message: "Een deel van de vaste weekplanning kon niet worden geladen.",
      };
    }

    const shiftedRules = [];

    for (const rule of weekRules ?? []) {
      const shiftedStartTijd = addMinutesToTimeValue(rule.start_tijd, minutes);
      const shiftedEindTijd = addMinutesToTimeValue(rule.eind_tijd, minutes);
      const shiftedPauseStartTijd = rule.pauze_start_tijd
        ? addMinutesToTimeValue(rule.pauze_start_tijd, minutes)
        : null;
      const shiftedPauseEindTijd = rule.pauze_eind_tijd
        ? addMinutesToTimeValue(rule.pauze_eind_tijd, minutes)
        : null;

      if (!shiftedStartTijd || !shiftedEindTijd) {
        return {
          success: false,
          message:
            "Een vaste weekplanning zou buiten dezelfde dag vallen. Kies een kleinere tijdverschuiving.",
        };
      }

      const normalizedPauseWindow = normalizePauseWindow({
        startTijd: shiftedStartTijd,
        eindTijd: shiftedEindTijd,
        pauzeStartTijd: shiftedPauseStartTijd,
        pauzeEindTijd: shiftedPauseEindTijd,
      });

      shiftedRules.push({
        id: rule.id,
        weekdag: rule.weekdag,
        startTijd: shiftedStartTijd,
        eindTijd: shiftedEindTijd,
        pauzeStartTijd: normalizedPauseWindow.pauzeStartTijd,
        pauzeEindTijd: normalizedPauseWindow.pauzeEindTijd,
      });
    }

    const ruleConflictResult = await findAvailabilityWeekRuleConflicts(
      supabase,
      access.instructeur.id,
      shiftedRules.map((rule) => ({
        weekdag: rule.weekdag,
        startTijd: rule.startTijd,
        eindTijd: rule.eindTijd,
      })),
      shiftedRules.map((rule) => rule.id)
    );

    if (!ruleConflictResult.success) {
      return ruleConflictResult;
    }

    const weekRuleResults = await Promise.all(
      shiftedRules.map((rule) =>
        supabase
          .from("beschikbaarheid_weekroosters")
          .update({
            start_tijd: rule.startTijd,
            eind_tijd: rule.eindTijd,
            pauze_start_tijd: rule.pauzeStartTijd,
            pauze_eind_tijd: rule.pauzeEindTijd,
          })
          .eq("id", rule.id)
          .eq("instructeur_id", access.instructeur.id)
      )
    );

    if (weekRuleResults.some((result) => result.error)) {
      return {
        success: false,
        message: "De vaste weekplanning kon niet volledig worden verschoven.",
      };
    }
  }

  if (concreteSlotIds.length) {
    const { data: concreteSlots, error: concreteError } = await supabase
      .from("beschikbaarheid")
      .select("id, start_at, eind_at, beschikbaar")
      .eq("instructeur_id", access.instructeur.id)
      .in("id", concreteSlotIds)
      .order("start_at", { ascending: true });

    if (concreteError || (concreteSlots ?? []).length !== concreteSlotIds.length) {
      return {
        success: false,
        message: "Een deel van de losse agendablokken kon niet worden geladen.",
      };
    }

    const shiftedSlots: PlannedAvailabilitySlot[] = [];

    for (const slot of concreteSlots ?? []) {
      const startDate = new Date(slot.start_at);
      const endDate = new Date(slot.eind_at);
      const shiftedStartDate = new Date(startDate.getTime() + minutes * 60_000);
      const shiftedEndDate = new Date(endDate.getTime() + minutes * 60_000);

      if (
        getAvailabilityDateValue(shiftedStartDate.toISOString()) !==
        getAvailabilityDateValue(slot.start_at) ||
        getAvailabilityDateValue(shiftedEndDate.toISOString()) !==
          getAvailabilityDateValue(slot.eind_at)
      ) {
        return {
          success: false,
          message:
            "Een los agendablok zou buiten dezelfde dag vallen. Kies een kleinere tijdverschuiving.",
        };
      }

      shiftedSlots.push({
        id: slot.id,
        start_at: shiftedStartDate.toISOString(),
        eind_at: shiftedEndDate.toISOString(),
        dateLabel: formatAvailabilityDay(shiftedStartDate.toISOString()),
      });
    }

    const conflictResult = await findAvailabilityConflicts(
      supabase,
      access.instructeur.id,
      shiftedSlots,
      shiftedSlots.flatMap((slot) => (slot.id ? [slot.id] : []))
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
        message: "Een of meer verschoven blokken overlappen met bestaande agenda-items.",
      };
    }

    const concreteResults = await Promise.all(
      shiftedSlots.map((slot) =>
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

    if (concreteResults.some((result) => result.error)) {
      return {
        success: false,
        message: "De losse agendablokken konden niet volledig worden verschoven.",
      };
    }
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message: `De geselecteerde blokken zijn ${minutes > 0 ? `${minutes} minuten later` : `${Math.abs(minutes)} minuten eerder`} gezet.`,
    detail: `${slotIds.length} blok${slotIds.length === 1 ? "" : "ken"}`,
  };
}

export async function createAvailabilityWeekOverrideAction(
  input: CreateAvailabilityWeekOverrideInput
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
      message: "Vul een starttijd en eindtijd in voor deze week-override.",
    };
  }

  if (hasBreakWindow && (!pauzeStartTijd || !pauzeEindTijd)) {
    return {
      success: false,
      message: "Vul zowel een pauze-starttijd als een pauze-eindtijd in.",
    };
  }

  const parsedWeekRuleSlot = parseWeekRuleSlotId(slotId);

  if (!parsedWeekRuleSlot) {
    return {
      success: false,
      message: "Alleen vaste weekplanning kan als losse week-override worden opgeslagen.",
    };
  }

  const supabase = await createServerClient();
  const { data: rule } = await supabase
    .from("beschikbaarheid_weekroosters")
    .select(
      "id, instructeur_id, weekdag, start_tijd, eind_tijd, pauze_start_tijd, pauze_eind_tijd, beschikbaar, actief"
    )
    .eq("id", parsedWeekRuleSlot.ruleId)
    .eq("instructeur_id", access.instructeur.id)
    .maybeSingle();

  if (!rule) {
    return {
      success: false,
      message: "De vaste weekplanning achter dit blok is niet gevonden.",
    };
  }

  const dateValue = parsedWeekRuleSlot.dateValue;
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
      message: "De gekozen override-tijden konden niet goed worden verwerkt.",
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
    plannedSlots
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
        "Deze week-override overlapt met een bestaand slot of een les op die datum.",
    };
  }

  const { error } = await supabase.from("beschikbaarheid").insert(
    plannedSlots.map((slot) => ({
      instructeur_id: access.instructeur.id,
      start_at: slot.start_at,
      eind_at: slot.eind_at,
      beschikbaar: input.beschikbaar,
    }))
  );

  if (error) {
    return {
      success: false,
      message: "De week-override kon niet worden opgeslagen.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  return {
    success: true,
    message: input.beschikbaar
      ? "Deze week is nu los overschreven met een boekbaar moment."
      : "Deze week is nu los overschreven als niet-boekbaar moment.",
    detail: formatAvailabilityDay(startAt),
  };
}

export async function applyAvailabilityWeeklyBulkAction(
  input: ApplyAvailabilityWeeklyBulkActionInput
) {
  const access = await ensureInstructorAccess();

  if (!access.ok) {
    return {
      success: false,
      message: access.message,
    };
  }

  const weekStartDateValue = getStartOfWeekDateValue(input.weekStartDateValue.trim());
  const action = input.action;
  const cutoffTime = input.cutoffTime?.trim() ?? "";

  if (!weekStartDateValue || !action) {
    return {
      success: false,
      message: "Kies eerst een week en een bulkactie.",
    };
  }

  if ((action === "close_after_time" || action === "open_after_time") && !cutoffTime) {
    return {
      success: false,
      message: "Vul een tijd in, bijvoorbeeld 18:00.",
    };
  }

  const weekEndDateValue = addDaysToDateValue(weekStartDateValue, 7);
  const weekStartAt = createAvailabilityTimestamp(weekStartDateValue, "00:00");
  const weekEndAt = createAvailabilityTimestamp(weekEndDateValue, "00:00");
  const supabase = await createServerClient();

  const [{ data: concreteSlots, error: concreteError }, { data: weekRules, error: ruleError }] =
    await Promise.all([
      supabase
        .from("beschikbaarheid")
        .select("id, start_at, eind_at, beschikbaar")
        .eq("instructeur_id", access.instructeur.id)
        .gte("start_at", weekStartAt)
        .lt("start_at", weekEndAt)
        .order("start_at", { ascending: true }),
      supabase
        .from("beschikbaarheid_weekroosters")
        .select(
          "id, instructeur_id, weekdag, start_tijd, eind_tijd, pauze_start_tijd, pauze_eind_tijd, beschikbaar, actief"
        )
        .eq("instructeur_id", access.instructeur.id)
        .eq("actief", true),
    ]);

  if (concreteError || ruleError) {
    return {
      success: false,
      message: "De week kon niet volledig worden voorbereid voor deze bulkactie.",
    };
  }

  const concreteUpdates: Array<{
    id: string;
    patch: {
      beschikbaar?: boolean;
      eind_at?: string;
    };
  }> = [];
  const ruleUpdates: Array<{
    id: string;
    patch: {
      beschikbaar?: boolean;
      eind_tijd?: string;
      pauze_start_tijd?: string | null;
      pauze_eind_tijd?: string | null;
    };
  }> = [];

  for (const slot of concreteSlots ?? []) {
    const dateValue = getAvailabilityDateValue(slot.start_at);
    const weekday = getWeekdayNumberFromDateValue(dateValue);

    if (action === "close_weekend") {
      if (weekday >= 6 && slot.beschikbaar) {
        concreteUpdates.push({
          id: slot.id,
          patch: {
            beschikbaar: false,
          },
        });
      }

      continue;
    }

    const cutoffAt = createAvailabilityTimestamp(dateValue, cutoffTime);

    if (action === "open_after_time") {
      if (
        new Date(slot.eind_at).getTime() > new Date(cutoffAt).getTime() &&
        !slot.beschikbaar
      ) {
        concreteUpdates.push({
          id: slot.id,
          patch: {
            beschikbaar: true,
          },
        });
      }

      continue;
    }

    if (new Date(slot.eind_at).getTime() <= new Date(cutoffAt).getTime()) {
      continue;
    }

    if (new Date(slot.start_at).getTime() >= new Date(cutoffAt).getTime()) {
      if (slot.beschikbaar) {
        concreteUpdates.push({
          id: slot.id,
          patch: {
            beschikbaar: false,
          },
        });
      }

      continue;
    }

    if (slot.eind_at !== cutoffAt) {
      concreteUpdates.push({
        id: slot.id,
        patch: {
          eind_at: cutoffAt,
        },
      });
    }
  }

  for (const rule of weekRules ?? []) {
    if (action === "close_weekend") {
      if (rule.weekdag >= 6 && rule.beschikbaar) {
        ruleUpdates.push({
          id: rule.id,
          patch: {
            beschikbaar: false,
          },
        });
      }

      continue;
    }

    if (action === "open_after_time") {
      if (rule.eind_tijd > cutoffTime && !rule.beschikbaar) {
        ruleUpdates.push({
          id: rule.id,
          patch: {
            beschikbaar: true,
          },
        });
      }

      continue;
    }

    if (rule.eind_tijd <= cutoffTime) {
      continue;
    }

    if (rule.start_tijd >= cutoffTime) {
      if (rule.beschikbaar) {
        ruleUpdates.push({
          id: rule.id,
          patch: {
            beschikbaar: false,
          },
        });
      }

      continue;
    }

    const normalizedPauseWindow = normalizePauseWindow({
      startTijd: rule.start_tijd,
      eindTijd: cutoffTime,
      pauzeStartTijd: rule.pauze_start_tijd,
      pauzeEindTijd: rule.pauze_eind_tijd,
    });

    if (
      rule.eind_tijd !== cutoffTime ||
      (rule.pauze_start_tijd ?? null) !== normalizedPauseWindow.pauzeStartTijd ||
      (rule.pauze_eind_tijd ?? null) !== normalizedPauseWindow.pauzeEindTijd
    ) {
      ruleUpdates.push({
        id: rule.id,
        patch: {
          eind_tijd: cutoffTime,
          pauze_start_tijd: normalizedPauseWindow.pauzeStartTijd,
          pauze_eind_tijd: normalizedPauseWindow.pauzeEindTijd,
        },
      });
    }
  }

  if (!concreteUpdates.length && !ruleUpdates.length) {
    return {
      success: true,
      message:
        action === "close_weekend"
          ? "Er hoefde niets extra gesloten te worden in deze week."
          : action === "open_after_time"
            ? `Er stonden al geen bestaande avondblokken dicht na ${cutoffTime}.`
            : `Er stond al niets open na ${cutoffTime} in deze week.`,
    };
  }

  const concreteResults = await Promise.all(
    concreteUpdates.map((update) =>
      supabase
        .from("beschikbaarheid")
        .update(update.patch)
        .eq("id", update.id)
        .eq("instructeur_id", access.instructeur.id)
    )
  );
  const ruleResults = await Promise.all(
    ruleUpdates.map((update) =>
      supabase
        .from("beschikbaarheid_weekroosters")
        .update(update.patch)
        .eq("id", update.id)
        .eq("instructeur_id", access.instructeur.id)
    )
  );

  if (
    concreteResults.some((result) => result.error) ||
    ruleResults.some((result) => result.error)
  ) {
    return {
      success: false,
      message: "De bulkactie kon niet volledig worden opgeslagen.",
    };
  }

  revalidateAvailabilityPaths(access.instructeur.slug);

  const detail = [
    concreteUpdates.length ? `${concreteUpdates.length} losse blokken` : null,
    ruleUpdates.length ? `${ruleUpdates.length} vaste weekregels` : null,
  ]
    .filter(Boolean)
    .join(" en ");

  return {
    success: true,
    message:
      action === "close_weekend"
        ? "De geselecteerde weekendmomenten zijn gesloten."
        : action === "open_after_time"
          ? `Bestaande avondblokken na ${cutoffTime} zijn weer boekbaar gemaakt.`
          : `Alles na ${cutoffTime} is bijgewerkt voor deze week.`,
    detail,
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
