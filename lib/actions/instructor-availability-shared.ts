import "server-only";

import { revalidatePath } from "next/cache";

import {
  ensureCurrentUserContext,
  getCurrentInstructeurRecord,
} from "@/lib/data/profiles";

export type CreateAvailabilitySlotInput = {
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

export type UpdateAvailabilityStatusInput = {
  slotId: string;
  beschikbaar: boolean;
};

export type DeleteAvailabilitySlotInput = {
  slotId: string;
};

export type SeriesAvailabilityActionInput = {
  slotId: string;
};

export type UpdateAvailabilitySlotTimingInput = {
  slotId: string;
  datum: string;
  startTijd: string;
  eindTijd: string;
};

export type UpdateAvailabilitySeriesTimingInput = {
  slotId: string;
  startTijd: string;
  eindTijd: string;
};

export type UpdateAvailabilityWindowInput = {
  slotId: string;
  startTijd: string;
  eindTijd: string;
  pauzeStartTijd?: string;
  pauzeEindTijd?: string;
};

export type UpdateAvailabilityWeekRuleInput = {
  ruleId: string;
  startTijd: string;
  eindTijd: string;
  pauzeStartTijd?: string;
  pauzeEindTijd?: string;
};

export type UpdateAvailabilityWeekRuleActiveInput = {
  ruleId: string;
  beschikbaar: boolean;
};

export type DeleteAvailabilityWeekRuleInput = {
  ruleId: string;
};

export type ApplyAvailabilityTemplateInput = {
  templateId: string;
  startDatum: string;
  repeatWeeks?: number;
};

export type DuplicateAvailabilityWeekInput = {
  sourceWeekStartDatum: string;
  targetWeekStartDatum: string;
};

export type MoveAvailabilityBlockInput = {
  slotId: string;
  targetDateValue: string;
};

export type ApplyAvailabilityWeeklyBulkActionInput = {
  weekStartDateValue: string;
  action: "close_after_time" | "open_after_time" | "close_weekend";
  cutoffTime?: string;
};

export type ShiftAvailabilityBlocksInput = {
  slotIds: string[];
  minutes: number;
};

export type CreateAvailabilityWeekOverrideInput = {
  slotId: string;
  startTijd: string;
  eindTijd: string;
  pauzeStartTijd?: string;
  pauzeEindTijd?: string;
  beschikbaar: boolean;
};

export const MAX_LINKED_WINDOW_GAP_MINUTES = 90;

export type PlannedAvailabilitySlot = {
  id?: string;
  start_at: string;
  eind_at: string;
  dateLabel: string;
};

export function getPlannedAvailabilitySlotKey(
  slot: Pick<PlannedAvailabilitySlot, "start_at" | "eind_at">
) {
  return `${slot.start_at}|${slot.eind_at}`;
}

export function revalidateAvailabilityPaths(slug: string) {
  revalidatePath("/instructeur/beschikbaarheid");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/instructeurs");
  revalidatePath("/leerling/instructeurs");
  revalidatePath(`/instructeurs/${slug}`);
}

export async function ensureInstructorAccess() {
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
