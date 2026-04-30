import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

import { getRijlesTypeLabel } from "@/lib/lesson-types";
import type { Les, LesAanvraag, LesStatus } from "@/lib/types";

export type CalendarTone = "default" | "urban";
export type CalendarRole = "leerling" | "instructeur";

export type CalendarEntry = {
  id: string;
  kind: "lesson" | "request";
  title: string;
  status: LesStatus;
  startAt: Date;
  endAt?: Date | null;
  momentLabel: string;
  contextLabel: string;
  contactLabel: string;
  note?: string;
  typeLabel: string;
  lesson?: Les;
  request?: LesAanvraag;
};

export const LESSON_PLANNER_START_HOUR = 7;
export const LESSON_PLANNER_END_HOUR = 22;
export const LESSON_PLANNER_HOUR_HEIGHT = 60;
export const LESSON_PLANNER_COLUMN_MIN_WIDTH = 152;
export const LESSON_PLANNER_ROW_COUNT =
  LESSON_PLANNER_END_HOUR - LESSON_PLANNER_START_HOUR;
export const LESSON_PLANNER_HEIGHT =
  LESSON_PLANNER_ROW_COUNT * LESSON_PLANNER_HOUR_HEIGHT;
export const lessonPlannerHours = Array.from(
  { length: LESSON_PLANNER_ROW_COUNT },
  (_, index) => LESSON_PLANNER_START_HOUR + index
);

export function getStatusMeta(
  status: LesStatus,
  tone: CalendarTone,
  kind: "lesson" | "request" = "lesson"
) {
  if (kind === "request") {
    if (tone === "urban") {
      switch (status) {
        case "geaccepteerd":
          return {
            badgeClassName:
              "border border-cyan-300/20 bg-cyan-400/12 text-cyan-100",
            cardClassName:
              "border-cyan-300/18 bg-cyan-400/8 text-cyan-50",
          };
        case "geannuleerd":
        case "geweigerd":
          return {
            badgeClassName:
              "border border-rose-300/20 bg-rose-400/12 text-rose-100",
            cardClassName:
              "border-rose-300/18 bg-rose-400/8 text-rose-50",
          };
        case "aangevraagd":
        default:
          return {
            badgeClassName:
              "border border-amber-300/20 bg-amber-400/12 text-amber-100",
            cardClassName:
              "border-amber-300/18 bg-amber-400/8 text-amber-50",
          };
      }
    }

    switch (status) {
      case "geaccepteerd":
        return {
          badgeClassName: "border border-cyan-200 bg-cyan-50 text-cyan-700",
          cardClassName: "border-cyan-200/80 bg-cyan-50/70 text-cyan-900",
        };
      case "geannuleerd":
      case "geweigerd":
        return {
          badgeClassName: "border border-rose-200 bg-rose-50 text-rose-700",
          cardClassName: "border-rose-200/80 bg-rose-50/70 text-rose-900",
        };
      case "aangevraagd":
      default:
        return {
          badgeClassName: "border border-amber-200 bg-amber-50 text-amber-700",
          cardClassName: "border-amber-200/80 bg-amber-50/70 text-amber-900",
        };
    }
  }

  if (tone === "urban") {
    switch (status) {
      case "geaccepteerd":
        return {
          badgeClassName:
            "border border-emerald-300/20 bg-emerald-400/12 text-emerald-100",
          cardClassName:
            "border-emerald-300/18 bg-emerald-400/8 text-emerald-50",
        };
      case "ingepland":
        return {
          badgeClassName:
            "border border-sky-300/20 bg-sky-400/12 text-sky-100",
          cardClassName: "border-sky-300/18 bg-sky-400/8 text-sky-50",
        };
      case "afgerond":
        return {
          badgeClassName:
            "border border-slate-300/16 bg-slate-200/10 text-slate-100",
          cardClassName: "border-white/10 bg-white/6 text-slate-100",
        };
      case "geannuleerd":
      case "geweigerd":
        return {
          badgeClassName:
            "border border-rose-300/20 bg-rose-400/12 text-rose-100",
          cardClassName:
            "border-rose-300/18 bg-rose-400/8 text-rose-50",
        };
      case "aangevraagd":
      default:
        return {
          badgeClassName:
            "border border-amber-300/20 bg-amber-400/12 text-amber-100",
          cardClassName:
            "border-amber-300/18 bg-amber-400/8 text-amber-50",
        };
    }
  }

  switch (status) {
    case "geaccepteerd":
      return {
        badgeClassName:
          "border border-emerald-200 bg-emerald-50 text-emerald-700",
        cardClassName: "border-emerald-200/80 bg-emerald-50/70 text-emerald-900",
      };
    case "ingepland":
      return {
        badgeClassName: "border border-sky-200 bg-sky-50 text-sky-700",
        cardClassName: "border-sky-200/80 bg-sky-50/70 text-sky-900",
      };
    case "afgerond":
      return {
        badgeClassName: "border border-slate-200 bg-slate-100 text-slate-700",
        cardClassName: "border-slate-200/80 bg-slate-100/80 text-slate-900",
      };
    case "geannuleerd":
    case "geweigerd":
      return {
        badgeClassName: "border border-rose-200 bg-rose-50 text-rose-700",
        cardClassName: "border-rose-200/80 bg-rose-50/70 text-rose-900",
      };
    case "aangevraagd":
    default:
      return {
        badgeClassName: "border border-amber-200 bg-amber-50 text-amber-700",
        cardClassName: "border-amber-200/80 bg-amber-50/70 text-amber-900",
      };
  }
}

export function formatMomentRange(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  fallback: string
) {
  if (!startAt) {
    return fallback;
  }

  const start = parseISO(startAt);
  const end = endAt ? parseISO(endAt) : null;

  return `${format(start, "EEEE d MMMM", { locale: nl })} - ${format(
    start,
    "HH:mm",
    { locale: nl }
  )}${end ? ` - ${format(end, "HH:mm", { locale: nl })}` : ""}`;
}

export function inferLessonTypeFromTitle(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("proef")) {
    return "Proefles";
  }

  if (normalized.includes("examen")) {
    return "Examenrit";
  }

  if (normalized.includes("pakket")) {
    return "Pakketles";
  }

  return "Rijles";
}

export function createLessonEntry(lesson: Les): CalendarEntry | null {
  if (!lesson.start_at) {
    return null;
  }

  return {
    id: `lesson-${lesson.id}`,
    kind: "lesson",
    title: lesson.titel,
    status: lesson.status,
    startAt: parseISO(lesson.start_at),
    endAt: lesson.end_at ? parseISO(lesson.end_at) : null,
    momentLabel: formatMomentRange(
      lesson.start_at,
      lesson.end_at,
      `${lesson.datum} om ${lesson.tijd}`
    ),
    contextLabel: lesson.locatie,
    contactLabel:
      lesson.instructeur_naam || lesson.leerling_naam || "Nog niet gekoppeld",
    note: lesson.lesson_note ?? "",
    typeLabel: inferLessonTypeFromTitle(lesson.titel),
    lesson,
  };
}

export function createRequestEntry(request: LesAanvraag): CalendarEntry | null {
  if (
    !request.start_at ||
    !["aangevraagd", "geaccepteerd", "ingepland", "geweigerd", "geannuleerd"].includes(
      request.status
    )
  ) {
    return null;
  }

  const contactLabel =
    request.instructeur_naam || request.leerling_naam || "Nog niet gekoppeld";
  const typeLabel =
    request.aanvraag_type === "proefles"
      ? "Proefles"
      : request.aanvraag_type === "pakket"
        ? "Pakketles"
        : request.les_type
          ? getRijlesTypeLabel(request.les_type)
          : "Rijles";

  return {
    id: `request-${request.id}`,
    kind: "request",
    title:
      request.aanvraag_type === "proefles"
        ? `Proefles - ${contactLabel}`
        : request.pakket_naam
          ? `${request.pakket_naam} - ${contactLabel}`
          : `Aanvraag - ${contactLabel}`,
    status: request.status,
    startAt: parseISO(request.start_at),
    endAt: request.end_at ? parseISO(request.end_at) : null,
    momentLabel: formatMomentRange(
      request.start_at,
      request.end_at,
      `${request.voorkeursdatum} - ${request.tijdvak}`
    ),
    contextLabel:
      request.status === "geaccepteerd" || request.status === "ingepland"
        ? request.pakket_naam
          ? `Voorlopig bevestigd - ${request.pakket_naam}`
          : `Voorlopig bevestigd - ${request.tijdvak}`
        : `Voorkeursblok ${request.tijdvak}`,
    contactLabel,
    note: request.bericht,
    typeLabel,
    request,
  };
}

export function getPlannerHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function getEntryEndAt(entry: CalendarEntry) {
  return entry.endAt ?? new Date(entry.startAt.getTime() + 60 * 60_000);
}

export function formatPlannerTimeRange(entry: CalendarEntry) {
  return `${format(entry.startAt, "HH:mm", { locale: nl })} - ${format(
    getEntryEndAt(entry),
    "HH:mm",
    { locale: nl }
  )}`;
}

export function getLessonPlannerBounds(date: Date) {
  const start = new Date(date);
  start.setHours(LESSON_PLANNER_START_HOUR, 0, 0, 0);

  const end = new Date(date);
  end.setHours(LESSON_PLANNER_END_HOUR, 0, 0, 0);

  return { start, end };
}

export function getMinutesBetweenDates(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

export function getLessonPlannerEventLayout(entry: CalendarEntry, date: Date) {
  const bounds = getLessonPlannerBounds(date);
  const entryEndAt = getEntryEndAt(entry);

  if (entryEndAt <= bounds.start || entry.startAt >= bounds.end) {
    return null;
  }

  const boundedStart =
    entry.startAt < bounds.start ? bounds.start : entry.startAt;
  const boundedEnd = entryEndAt > bounds.end ? bounds.end : entryEndAt;
  const top =
    (getMinutesBetweenDates(bounds.start, boundedStart) / 60) *
    LESSON_PLANNER_HOUR_HEIGHT;
  const rawHeight =
    (getMinutesBetweenDates(boundedStart, boundedEnd) / 60) *
    LESSON_PLANNER_HOUR_HEIGHT;
  const remainingHeight = Math.max(LESSON_PLANNER_HEIGHT - top, 28);

  return {
    top,
    height: Math.max(28, Math.min(remainingHeight, rawHeight)),
  };
}

export function getPlannerEntrySurfaceClassNames(
  entry: CalendarEntry,
  tone: CalendarTone
) {
  if (tone === "urban") {
    if (entry.kind === "request") {
      if (entry.status === "geaccepteerd") {
        return {
          surface:
            "border-cyan-300/22 bg-cyan-400/10 text-cyan-50",
          rail: "bg-cyan-300",
        };
      }

      if (entry.status === "geannuleerd" || entry.status === "geweigerd") {
        return {
          surface:
            "border-rose-300/22 bg-rose-400/10 text-rose-50",
          rail: "bg-rose-300",
        };
      }

      return {
        surface:
          "border-amber-300/22 bg-amber-400/10 text-amber-50",
        rail: "bg-amber-300",
      };
    }

    if (entry.status === "ingepland") {
      return {
        surface:
          "border-sky-300/22 bg-sky-400/10 text-sky-50",
        rail: "bg-sky-300",
      };
    }

    if (entry.status === "geaccepteerd") {
      return {
        surface:
          "border-emerald-300/22 bg-emerald-400/10 text-emerald-50",
        rail: "bg-emerald-300",
      };
    }

    if (entry.status === "geannuleerd" || entry.status === "geweigerd") {
      return {
        surface:
          "border-rose-300/22 bg-rose-400/10 text-rose-50",
        rail: "bg-rose-300",
      };
    }

    if (entry.status === "afgerond") {
      return {
        surface: "border-white/10 bg-white/6 text-slate-100",
        rail: "bg-slate-300",
      };
    }

    return {
      surface: "border-amber-300/22 bg-amber-400/10 text-amber-50",
      rail: "bg-amber-300",
    };
  }

  if (entry.kind === "request") {
    if (entry.status === "geaccepteerd") {
      return {
        surface: "border-cyan-200/90 bg-cyan-50/92 text-cyan-950",
        rail: "bg-cyan-500",
      };
    }

    if (entry.status === "geannuleerd" || entry.status === "geweigerd") {
      return {
        surface: "border-rose-200/90 bg-rose-50/92 text-rose-950",
        rail: "bg-rose-500",
      };
    }

    return {
      surface: "border-amber-200/90 bg-amber-50/92 text-amber-950",
      rail: "bg-amber-500",
    };
  }

  if (entry.status === "ingepland") {
    return {
      surface: "border-sky-200/90 bg-sky-50/92 text-sky-950",
      rail: "bg-sky-500",
    };
  }

  if (entry.status === "geaccepteerd") {
    return {
      surface: "border-emerald-200/90 bg-emerald-50/92 text-emerald-950",
      rail: "bg-emerald-500",
    };
  }

  if (entry.status === "geannuleerd" || entry.status === "geweigerd") {
    return {
      surface: "border-rose-200/90 bg-rose-50/92 text-rose-950",
      rail: "bg-rose-500",
    };
  }

  if (entry.status === "afgerond") {
    return {
      surface: "border-slate-200/90 bg-slate-100/92 text-slate-900",
      rail: "bg-slate-400",
    };
  }

  return {
    surface: "border-amber-200/90 bg-amber-50/92 text-amber-950",
    rail: "bg-amber-500",
  };
}

export function getEntryNextStep(entry: CalendarEntry, role: CalendarRole) {
  if (entry.kind === "request") {
    if (entry.status === "aangevraagd") {
      return role === "instructeur"
        ? "Beoordeel deze aanvraag en zet hem om naar een les zodra het moment klopt."
        : "Je instructeur bekijkt deze aanvraag. Houd je berichten in de gaten voor afstemming.";
    }

    if (entry.status === "geaccepteerd" || entry.status === "ingepland") {
      return "Dit moment is voorlopig afgestemd. Controleer locatie, route en eventuele laatste afspraken.";
    }

    return "Deze aanvraag vraagt geen directe agenda-actie meer.";
  }

  if (entry.status === "ingepland" || entry.status === "geaccepteerd") {
    return role === "instructeur"
      ? "Bereid deze les voor, open de route of werk na afloop aanwezigheid en notities bij."
      : "Zet de les in je eigen agenda, open de route of annuleer als dat nog mag.";
  }

  if (entry.status === "afgerond") {
    return role === "instructeur"
      ? "Rond de administratie af met aanwezigheid en een korte lesnotitie."
      : "Deze les is afgerond. Bekijk je voortgang of laat een review achter wanneer dat past.";
  }

  return "Controleer de status en stem bij twijfel af via berichten.";
}
