import {
  formatAvailabilityDay,
  formatAvailabilityWindow,
  getAvailabilityDateValue,
} from "@/lib/availability";
import type { BeschikbaarheidSlot } from "@/lib/types";

export type LessonDurationKind =
  | "rijles"
  | "proefles"
  | "pakketles"
  | "examenrit";

export type InstructorLessonDurationDefaults = {
  rijles: number;
  proefles: number;
  pakketles: number;
  examenrit: number;
};

type InstructorLessonDurationSource = Partial<{
  standaard_rijles_duur_minuten: number | string | null;
  standaard_proefles_duur_minuten: number | string | null;
  standaard_pakketles_duur_minuten: number | string | null;
  standaard_examenrit_duur_minuten: number | string | null;
}>;

export type BookableAvailabilitySlot = BeschikbaarheidSlot & {
  base_slot_id: string;
};

export const DEFAULT_LESSON_DURATION_MINUTES: InstructorLessonDurationDefaults = {
  rijles: 60,
  proefles: 50,
  pakketles: 90,
  examenrit: 75,
};

export const LESSON_DURATION_PRESET_OPTIONS = [
  45,
  50,
  60,
  75,
  90,
  105,
  120,
] as const;

function toDurationMinutes(
  value: number | string | null | undefined,
  fallback: number
) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return normalizeDurationMinutes(value, fallback);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return normalizeDurationMinutes(parsed, fallback);
  }

  return fallback;
}

export function normalizeDurationMinutes(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const rounded = Math.round(value);

  if (rounded < 30 || rounded > 240) {
    return fallback;
  }

  return rounded;
}

export function resolveInstructorLessonDurationDefaults(
  source?: InstructorLessonDurationSource | null
): InstructorLessonDurationDefaults {
  return {
    rijles: toDurationMinutes(
      source?.standaard_rijles_duur_minuten,
      DEFAULT_LESSON_DURATION_MINUTES.rijles
    ),
    proefles: toDurationMinutes(
      source?.standaard_proefles_duur_minuten,
      DEFAULT_LESSON_DURATION_MINUTES.proefles
    ),
    pakketles: toDurationMinutes(
      source?.standaard_pakketles_duur_minuten,
      DEFAULT_LESSON_DURATION_MINUTES.pakketles
    ),
    examenrit: toDurationMinutes(
      source?.standaard_examenrit_duur_minuten,
      DEFAULT_LESSON_DURATION_MINUTES.examenrit
    ),
  };
}

export function getLessonDurationForKind(
  source: InstructorLessonDurationSource | null | undefined,
  kind: LessonDurationKind
) {
  return resolveInstructorLessonDurationDefaults(source)[kind];
}

export function getLessonDurationKindLabel(kind: LessonDurationKind) {
  switch (kind) {
    case "proefles":
      return "Proefles";
    case "pakketles":
      return "Pakketles";
    case "examenrit":
      return "Examenrit";
    default:
      return "Rijles";
  }
}

export function buildBookableAvailabilitySlots(
  slots: BeschikbaarheidSlot[],
  durationMinutes: number
): BookableAvailabilitySlot[] {
  const normalizedDuration = normalizeDurationMinutes(
    durationMinutes,
    DEFAULT_LESSON_DURATION_MINUTES.rijles
  );

  return slots.flatMap((slot) => {
    if (!slot.beschikbaar || !slot.start_at || !slot.eind_at) {
      return [];
    }

    const slotStartMs = new Date(slot.start_at).getTime();
    const slotEndMs = new Date(slot.eind_at).getTime();
    const durationMs = normalizedDuration * 60_000;

    if (slotStartMs + durationMs > slotEndMs) {
      return [];
    }

    const bookableSlots: BookableAvailabilitySlot[] = [];
    let cursorMs = slotStartMs;
    let index = 0;

    while (cursorMs + durationMs <= slotEndMs) {
      const blockStartAt = new Date(cursorMs).toISOString();
      const blockEndAt = new Date(cursorMs + durationMs).toISOString();

      bookableSlots.push({
        ...slot,
        id: `boekbaar:${slot.id}:${getAvailabilityDateValue(blockStartAt)}:${blockStartAt.slice(11, 16)}:${blockEndAt.slice(11, 16)}:${index}`,
        base_slot_id: slot.id,
        dag: formatAvailabilityDay(blockStartAt),
        tijdvak: formatAvailabilityWindow(blockStartAt, blockEndAt),
        start_at: blockStartAt,
        eind_at: blockEndAt,
      });

      cursorMs += durationMs;
      index += 1;
    }

    return bookableSlots;
  });
}
