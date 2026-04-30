"use client";

import { useMemo, useState } from "react";
import {
  addWeeks,
  compareAsc,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from "date-fns";
import { nl } from "date-fns/locale";
import {
  CalendarDays,
  Clock3,
  MapPin,
  MessageSquare,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { LearnerLessonActions } from "@/components/dashboard/learner-lesson-actions";
import { LessonAttendanceActions } from "@/components/dashboard/lesson-attendance-actions";
import { LessonEditDialog } from "@/components/dashboard/lesson-edit-dialog";
import { LessonNoteEditor } from "@/components/dashboard/lesson-note-editor";
import { LessonQuickActions } from "@/components/dashboard/lesson-quick-actions";
import { RequestStatusActions } from "@/components/dashboard/request-status-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRijlesTypeLabel } from "@/lib/lesson-types";
import { cn } from "@/lib/utils";
import type { Les, LesAanvraag, LesStatus, LocationOption } from "@/lib/types";

type CalendarEntry = {
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

function getStatusMeta(
  status: LesStatus,
  tone: "default" | "urban",
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

function formatMomentRange(
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

function inferLessonTypeFromTitle(title: string) {
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

function createLessonEntry(lesson: Les): CalendarEntry | null {
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

function createRequestEntry(request: LesAanvraag): CalendarEntry | null {
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

const LESSON_PLANNER_START_HOUR = 7;
const LESSON_PLANNER_END_HOUR = 22;
const LESSON_PLANNER_HOUR_HEIGHT = 60;
const LESSON_PLANNER_COLUMN_MIN_WIDTH = 152;
const LESSON_PLANNER_ROW_COUNT =
  LESSON_PLANNER_END_HOUR - LESSON_PLANNER_START_HOUR;
const LESSON_PLANNER_HEIGHT =
  LESSON_PLANNER_ROW_COUNT * LESSON_PLANNER_HOUR_HEIGHT;
const lessonPlannerHours = Array.from(
  { length: LESSON_PLANNER_ROW_COUNT },
  (_, index) => LESSON_PLANNER_START_HOUR + index
);

function getPlannerHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function getEntryEndAt(entry: CalendarEntry) {
  return entry.endAt ?? new Date(entry.startAt.getTime() + 60 * 60_000);
}

function formatPlannerTimeRange(entry: CalendarEntry) {
  return `${format(entry.startAt, "HH:mm", { locale: nl })} - ${format(
    getEntryEndAt(entry),
    "HH:mm",
    { locale: nl }
  )}`;
}

function getLessonPlannerBounds(date: Date) {
  const start = new Date(date);
  start.setHours(LESSON_PLANNER_START_HOUR, 0, 0, 0);

  const end = new Date(date);
  end.setHours(LESSON_PLANNER_END_HOUR, 0, 0, 0);

  return { start, end };
}

function getMinutesBetweenDates(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

function getLessonPlannerEventLayout(entry: CalendarEntry, date: Date) {
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

function getPlannerEntrySurfaceClassNames(
  entry: CalendarEntry,
  tone: "default" | "urban"
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

function CalendarEntryCard({
  entry,
  tone,
  active,
  onClick,
}: {
  entry: CalendarEntry;
  tone: "default" | "urban";
  active: boolean;
  onClick: () => void;
}) {
  const statusMeta = getStatusMeta(entry.status, tone, entry.kind);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[1rem] border p-3 text-left transition-all",
        statusMeta.cardClassName,
        active
          ? "ring-2 ring-sky-400/70 shadow-[0_18px_34px_-24px_rgba(56,189,248,0.45)]"
          : "hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-28px_rgba(15,23,42,0.26)]"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{entry.title}</p>
          <p className="mt-1 text-[12px] opacity-80">{entry.typeLabel}</p>
        </div>
        <Badge className={cn("border", statusMeta.badgeClassName)}>
          {entry.status}
        </Badge>
      </div>

      <div className="mt-3 space-y-2 text-[12px] opacity-90">
        <div className="flex items-start gap-2">
          <Clock3 className="mt-0.5 size-3.5 shrink-0" />
          <span>{entry.momentLabel}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          <span>{entry.contextLabel}</span>
        </div>
      </div>
    </button>
  );
}

function LessonPlannerEntryBlock({
  entry,
  tone,
  active,
  layout,
  onClick,
}: {
  entry: CalendarEntry;
  tone: "default" | "urban";
  active: boolean;
  layout: { top: number; height: number };
  onClick: () => void;
}) {
  const statusMeta = getStatusMeta(entry.status, tone, entry.kind);
  const plannerTone = getPlannerEntrySurfaceClassNames(entry, tone);
  const compact = layout.height < 88;
  const superCompact = layout.height < 62;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute inset-x-1.5 z-10 overflow-hidden rounded-[0.62rem] border px-2 pb-1.5 pt-2 text-left transition-all",
        plannerTone.surface,
        active
          ? "ring-2 ring-sky-400/70 shadow-[0_12px_26px_-22px_rgba(56,189,248,0.5)]"
          : "hover:shadow-[0_12px_26px_-22px_rgba(15,23,42,0.18)]"
      )}
      style={{ top: layout.top, height: layout.height }}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1.5 rounded-l-[0.72rem]",
          plannerTone.rail
        )}
      />
      <div className="relative pl-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={cn(
                "font-semibold",
                superCompact
                  ? "line-clamp-1 text-[10px] leading-3.5"
                  : compact
                    ? "line-clamp-2 text-[10.5px] leading-4"
                    : "line-clamp-2 text-[11px]"
              )}
            >
              {entry.title}
            </p>
            <p
              className={cn(
                "mt-0.5 font-semibold opacity-80",
                superCompact ? "text-[9px]" : "text-[10px]"
              )}
            >
              {formatPlannerTimeRange(entry)}
            </p>
          </div>
          <Badge
            className={cn(
              "shrink-0 border border-white/60 bg-white/70 px-1 py-0 text-[7px] capitalize text-slate-700 dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-100",
              statusMeta.badgeClassName
            )}
          >
            {entry.status}
          </Badge>
        </div>

        {!superCompact ? (
          <div className="mt-2">
            <p
              className={cn(
                "font-medium opacity-80",
                compact ? "line-clamp-1 text-[9.5px]" : "line-clamp-2 text-[10px]"
              )}
            >
              {entry.typeLabel}
            </p>
            {!compact ? (
              <p className="mt-1 line-clamp-2 text-[10px] opacity-65">
                {entry.contextLabel}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function LessonPlannerTimeAxis({ tone }: { tone: "default" | "urban" }) {
  return (
    <div
      className={cn(
        "border-r",
        tone === "urban"
          ? "border-white/10 bg-white/4"
          : "border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-slate-950/30"
      )}
    >
      <div
        className={cn(
          "h-[72px] border-b px-3 py-2.5",
          tone === "urban" ? "border-white/10" : "border-slate-200/80 dark:border-white/10"
        )}
      >
        <p
          className={cn(
            "text-[10px] font-semibold tracking-[0.18em] uppercase",
            tone === "urban" ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
          )}
        >
          Tijd
        </p>
        <p
          className={cn(
            "mt-2 text-[11px]",
            tone === "urban" ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
          )}
        >
          Planner
        </p>
      </div>

      <div className="overflow-hidden rounded-bl-[1.25rem]">
        {lessonPlannerHours.map((hour) => (
          <div
            key={hour}
            className={cn(
              "relative border-b px-3 pt-2",
              tone === "urban" ? "border-white/10" : "border-slate-200/80 dark:border-white/10"
            )}
            style={{ height: LESSON_PLANNER_HOUR_HEIGHT }}
          >
            <span
              className={cn(
                "text-[11px] font-semibold",
                tone === "urban" ? "text-slate-300" : "text-slate-600 dark:text-slate-300"
              )}
            >
              {getPlannerHourLabel(hour)}
            </span>
            <div
              className={cn(
                "absolute inset-x-0 top-1/2 border-t",
                tone === "urban" ? "border-white/8" : "border-slate-200/70 dark:border-white/8"
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function LessonPlannerDayColumn({
  date,
  entries,
  tone,
  selectedEntryId,
  onSelectEntry,
}: {
  date: Date;
  entries: CalendarEntry[];
  tone: "default" | "urban";
  selectedEntryId: string | null;
  onSelectEntry: (entryId: string) => void;
}) {
  const isCurrentDay = isToday(date);
  const orderedEntries = [...entries].sort((left, right) =>
    compareAsc(left.startAt, right.startAt)
  );
  const lessonCount = orderedEntries.filter((entry) => entry.kind === "lesson").length;
  const requestCount = orderedEntries.filter((entry) => entry.kind === "request").length;

  return (
    <div
      className={cn(
        "min-w-0 border-r",
        tone === "urban" ? "border-white/10" : "border-slate-200 dark:border-white/10"
      )}
      style={{ minWidth: LESSON_PLANNER_COLUMN_MIN_WIDTH }}
    >
      <div
        className={cn(
          "relative flex h-[72px] flex-col items-start justify-between border-b px-3 py-2.5",
          tone === "urban" ? "border-white/10" : "border-slate-200/80 dark:border-white/10"
        )}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-1",
            isCurrentDay ? "bg-sky-500 dark:bg-sky-300" : "bg-transparent"
          )}
        />
        <div>
          <p
            className={cn(
              "text-[10px] font-semibold tracking-[0.18em] uppercase",
              tone === "urban" ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
            )}
          >
            {format(date, "EEE", { locale: nl })}
          </p>
          <p
            className={cn(
              "mt-1 text-sm font-semibold capitalize",
              tone === "urban" ? "text-white" : "text-slate-950 dark:text-white"
            )}
          >
            {format(date, "d MMM", { locale: nl })}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {isCurrentDay ? <Badge variant="info">Vandaag</Badge> : null}
          {lessonCount ? (
            <Badge className="border border-sky-200 bg-sky-50 px-1.5 py-0 text-[9px] text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100">
              {lessonCount} les
            </Badge>
          ) : null}
          {requestCount ? (
            <Badge className="border border-amber-200 bg-amber-50 px-1.5 py-0 text-[9px] text-amber-700 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
              {requestCount} aanvraag
            </Badge>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "relative overflow-hidden",
          tone === "urban" ? "bg-slate-950/20" : "bg-white/90 dark:bg-slate-950/20"
        )}
        style={{ height: LESSON_PLANNER_HEIGHT }}
      >
        {lessonPlannerHours.map((hour) => (
          <div
            key={hour}
            className={cn(
              "relative border-b",
              tone === "urban" ? "border-white/10" : "border-slate-200/80 dark:border-white/10"
            )}
            style={{ height: LESSON_PLANNER_HOUR_HEIGHT }}
          >
            <div
              className={cn(
                "absolute inset-x-0 top-1/2 border-t",
                tone === "urban" ? "border-white/6" : "border-slate-100 dark:border-white/6"
              )}
            />
          </div>
        ))}

        {orderedEntries.length ? (
          orderedEntries.map((entry) => {
            const layout = getLessonPlannerEventLayout(entry, date);

            if (!layout) {
              return null;
            }

            return (
              <LessonPlannerEntryBlock
                key={entry.id}
                entry={entry}
                tone={tone}
                active={selectedEntryId === entry.id}
                layout={layout}
                onClick={() => onSelectEntry(entry.id)}
              />
            );
          })
        ) : (
          <div className="pointer-events-none absolute inset-x-2 top-3 rounded-[0.72rem] border border-dashed border-slate-200/90 bg-white/75 px-2.5 py-1.5 text-[9px] text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
            Geen lessen of aanvragen.
          </div>
        )}
      </div>
    </div>
  );
}

function LessonWeekPlanner({
  weekDays,
  entries,
  tone,
  selectedEntryId,
  onSelectEntry,
}: {
  weekDays: Date[];
  entries: CalendarEntry[];
  tone: "default" | "urban";
  selectedEntryId: string | null;
  onSelectEntry: (entryId: string) => void;
}) {
  const dayMap = useMemo(() => {
    const nextMap = new Map<string, CalendarEntry[]>();

    weekDays.forEach((day) => {
      nextMap.set(
        format(day, "yyyy-MM-dd"),
        entries
          .filter((entry) => isSameDay(entry.startAt, day))
          .sort((left, right) => compareAsc(left.startAt, right.startAt))
      );
    });

    return nextMap;
  }, [entries, weekDays]);

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-[1.35rem] border",
        tone === "urban" ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/5"
      )}
    >
      <div className="grid min-w-[1120px] grid-cols-[82px_repeat(7,minmax(0,1fr))]">
        <LessonPlannerTimeAxis tone={tone} />
        {weekDays.map((day) => (
          <LessonPlannerDayColumn
            key={day.toISOString()}
            date={day}
            entries={dayMap.get(format(day, "yyyy-MM-dd")) ?? []}
            tone={tone}
            selectedEntryId={selectedEntryId}
            onSelectEntry={onSelectEntry}
          />
        ))}
      </div>
    </div>
  );
}

function LessonDayPlanner({
  date,
  entries,
  tone,
  selectedEntryId,
  onSelectEntry,
}: {
  date: Date;
  entries: CalendarEntry[];
  tone: "default" | "urban";
  selectedEntryId: string | null;
  onSelectEntry: (entryId: string) => void;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.35rem] border",
        tone === "urban" ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/5"
      )}
    >
      <div className="grid grid-cols-[82px_minmax(0,1fr)]">
        <LessonPlannerTimeAxis tone={tone} />
        <LessonPlannerDayColumn
          date={date}
          entries={entries}
          tone={tone}
          selectedEntryId={selectedEntryId}
          onSelectEntry={onSelectEntry}
        />
      </div>
    </div>
  );
}

function getEntryNextStep(entry: CalendarEntry, role: "leerling" | "instructeur") {
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

function CalendarActionPanel({
  entry,
  role,
  tone,
  locationOptions,
}: {
  entry: CalendarEntry | null;
  role: "leerling" | "instructeur" | null;
  tone: "default" | "urban";
  locationOptions: LocationOption[];
}) {
  const isUrban = tone === "urban";

  if (!entry || !role) {
    return null;
  }

  const lesson = entry.lesson;
  const request = entry.request;
  const messageHref = role === "instructeur" ? "/instructeur/berichten" : "/leerling/berichten";
  const nextStep = getEntryNextStep(entry, role);

  return (
    <div
      className={cn(
        "mt-4 rounded-[1.25rem] border p-3.5",
        isUrban
          ? "border-white/10 bg-white/5"
          : "border-slate-200 bg-white/85 dark:border-white/10 dark:bg-white/[0.06]"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between 2xl:flex-col">
        <div>
          <p
            className={cn(
              "text-xs font-semibold tracking-[0.18em] uppercase",
              isUrban ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
            )}
          >
            Acties
          </p>
          <p
            className={cn(
              "mt-2 text-sm leading-6",
              isUrban ? "text-slate-300" : "text-slate-600 dark:text-slate-300"
            )}
          >
            {nextStep}
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className={cn(
            "h-9 rounded-full",
            isUrban && "border-white/10 bg-white/6 text-white hover:bg-white/10"
          )}
        >
          <a href={messageHref}>
            <MessageSquare className="size-4" />
            Bericht openen
          </a>
        </Button>
      </div>

      <div className="mt-3 space-y-3">
        {lesson ? (
          <>
            <LessonQuickActions lesson={lesson} tone={tone} />

            {role === "leerling" ? (
              <LearnerLessonActions lesson={lesson} />
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <LessonEditDialog
                    lesson={lesson}
                    locationOptions={locationOptions}
                  />
                </div>
                <LessonAttendanceActions lesson={lesson} tone={tone} />
                <LessonNoteEditor lesson={lesson} tone={tone} />
              </div>
            )}
          </>
        ) : null}

        {request && role === "instructeur" ? (
          <RequestStatusActions
            requestId={request.id}
            status={request.status}
            locationOptions={locationOptions}
          />
        ) : null}

        {request && role === "leerling" ? (
          <div
            className={cn(
              "rounded-[1rem] border px-3 py-2.5 text-sm leading-6",
              isUrban
                ? "border-white/10 bg-white/4 text-slate-300"
                : "border-slate-200 bg-slate-50/90 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
            )}
          >
            Aanvragen kun je hier volgen. Zodra het moment een les wordt,
            verschijnen route, agenda-export en annuleeracties direct in dit paneel.
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function LessonCalendar({
  lessons,
  requests = [],
  title = "Agenda",
  description = "Bekijk je lessen in een heldere kalenderweergave.",
  emptyTitle = "Nog geen lessen in de agenda",
  emptyDescription = "Zodra lessen bevestigd zijn, verschijnen ze hier automatisch in je kalender.",
  tone = "default",
  role = null,
  locationOptions = [],
}: {
  lessons: Les[];
  requests?: LesAanvraag[];
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  tone?: "default" | "urban";
  role?: "leerling" | "instructeur" | null;
  locationOptions?: LocationOption[];
}) {
  const isUrban = tone === "urban";

  const calendarLessons = useMemo(
    () => lessons.map(createLessonEntry).filter(Boolean) as CalendarEntry[],
    [lessons]
  );
  const calendarRequests = useMemo(
    () => requests.map(createRequestEntry).filter(Boolean) as CalendarEntry[],
    [requests]
  );
  const calendarEntries = useMemo(
    () =>
      [...calendarLessons, ...calendarRequests].sort((left, right) =>
        compareAsc(left.startAt, right.startAt)
      ),
    [calendarLessons, calendarRequests]
  );

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    calendarEntries[0]?.id ?? null
  );
  const [view, setView] = useState<"week" | "today" | "list">("week");
  const [anchorDate, setAnchorDate] = useState<Date>(
    calendarEntries[0]?.startAt ?? new Date()
  );

  const selectedEntry = useMemo(
    () =>
      calendarEntries.find((entry) => entry.id === selectedEntryId) ??
      calendarEntries[0] ??
      null,
    [calendarEntries, selectedEntryId]
  );

  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const entriesThisWeek = calendarEntries.filter((entry) =>
    isWithinInterval(entry.startAt, { start: weekStart, end: weekEnd })
  );
  const todayEntries = useMemo(
    () => calendarEntries.filter((entry) => isToday(entry.startAt)),
    [calendarEntries]
  );
  const todayFocusDate = useMemo(() => {
    if (todayEntries.length) {
      return todayEntries[0].startAt;
    }

    const now = new Date();

    return (
      calendarEntries.find((entry) => compareAsc(entry.startAt, now) >= 0)?.startAt ??
      calendarEntries[0]?.startAt ??
      new Date()
    );
  }, [calendarEntries, todayEntries]);
  const todayFocusEntries = useMemo(
    () =>
      calendarEntries.filter((entry) => isSameDay(entry.startAt, todayFocusDate)),
    [calendarEntries, todayFocusDate]
  );
  const todayFocusLessonCount = todayFocusEntries.filter(
    (entry) => entry.kind === "lesson"
  ).length;
  const todayFocusRequestCount = todayFocusEntries.filter(
    (entry) => entry.kind === "request"
  ).length;

  const groupedListEntries = useMemo(() => {
    const groups = new Map<string, CalendarEntry[]>();

    calendarEntries.forEach((entry) => {
      const key = format(entry.startAt, "yyyy-MM-dd");
      const current = groups.get(key) ?? [];
      current.push(entry);
      groups.set(key, current);
    });

    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      label: format(parseISO(`${key}T12:00:00`), "EEEE d MMMM yyyy", {
        locale: nl,
      }),
      items,
    }));
  }, [calendarEntries]);

  const legendItems = useMemo(
    () =>
      Array.from(
        new Map(
          calendarEntries.map((entry) => [
            `${entry.kind}-${entry.status}`,
            {
              key: `${entry.kind}-${entry.status}`,
              label: `${entry.kind === "request" ? "Aanvraag" : "Les"} ${entry.status}`,
              meta: getStatusMeta(entry.status, tone, entry.kind),
            },
          ])
        ).values()
      ),
    [calendarEntries, tone]
  );

  const lessonCount = calendarLessons.length;
  const requestCount = calendarRequests.length;
  const completedCount = calendarLessons.filter(
    (entry) => entry.status === "afgerond"
  ).length;

  if (!calendarEntries.length) {
    return (
      <div
        className={cn(
          "rounded-[1.9rem] p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)]",
          isUrban
            ? "border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] text-white"
            : "border border-white/70 bg-white/88 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:text-white"
        )}
      >
        <p
          className={cn(
            "text-xs font-semibold tracking-[0.22em] uppercase",
            isUrban ? "text-slate-300" : "text-primary dark:text-sky-300"
          )}
        >
          {title}
        </p>
        <h3
          className={cn(
            "mt-3 text-xl font-semibold",
            isUrban ? "text-white" : "text-slate-950 dark:text-white"
          )}
        >
          {emptyTitle}
        </h3>
        <p
          className={cn(
            "mt-2 max-w-2xl text-sm leading-7",
            isUrban ? "text-slate-300" : "text-slate-600 dark:text-slate-300"
          )}
        >
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[1.9rem] p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)]",
        isUrban
          ? "border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] text-white"
          : "border border-white/70 bg-white/88 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:text-white"
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p
            className={cn(
              "text-xs font-semibold tracking-[0.22em] uppercase",
              isUrban ? "text-slate-300" : "text-primary dark:text-sky-300"
            )}
          >
            {title}
          </p>
          <h3
            className={cn(
              "text-2xl font-semibold tracking-tight",
              isUrban ? "text-white" : "text-slate-950 dark:text-white"
            )}
          >
            Planningsoverzicht
          </h3>
          <p
            className={cn(
              "max-w-2xl text-sm leading-7",
              isUrban ? "text-slate-300" : "text-slate-600 dark:text-slate-300"
            )}
          >
            {description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {legendItems.map((item) => (
            <span
              key={item.key}
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
                item.meta.badgeClassName
              )}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1.85fr)_16.5rem]">
        <div className="min-w-0 space-y-4">
          <div
            className={cn(
              "rounded-[1.5rem] border p-4 shadow-[0_20px_52px_-38px_rgba(15,23,42,0.18)]",
              isUrban
                ? "border-white/10 bg-white/4"
                : "border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/5"
            )}
          >
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <Tabs
                value={view}
                onValueChange={(value) => setView(value as "week" | "today" | "list")}
                className="gap-3"
              >
                <TabsList className="h-auto rounded-[1rem] bg-white/70 p-1 dark:bg-white/5">
                  <TabsTrigger value="week" className="min-h-10 rounded-[0.9rem] px-3">
                    Week
                  </TabsTrigger>
                  <TabsTrigger value="today" className="min-h-10 rounded-[0.9rem] px-3">
                    Vandaag
                  </TabsTrigger>
                  <TabsTrigger value="list" className="min-h-10 rounded-[0.9rem] px-3">
                    Lijst
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setAnchorDate((current) => addWeeks(current, -1))}
                >
                  Vorige week
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setAnchorDate(new Date());
                    toast.success("Terug naar deze week");
                  }}
                >
                  Vandaag
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setAnchorDate((current) => addWeeks(current, 1))}
                >
                  Volgende week
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p
                  className={cn(
                    "text-xs font-semibold tracking-[0.18em] uppercase",
                    isUrban ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  Week van
                </p>
                <p
                  className={cn(
                    "mt-1 text-lg font-semibold capitalize",
                    isUrban ? "text-white" : "text-slate-950 dark:text-white"
                  )}
                >
                  {format(weekStart, "d MMMM", { locale: nl })} -{" "}
                  {format(weekEnd, "d MMMM", { locale: nl })}
                </p>
              </div>
              <Badge
                className={cn(
                  "border",
                  isUrban
                    ? "border-white/10 bg-white/8 text-slate-100"
                    : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100"
                )}
              >
                {entriesThisWeek.length} item{entriesThisWeek.length === 1 ? "" : "s"} deze week
              </Badge>
            </div>

            {view === "week" ? (
              <div className="mt-4">
                <LessonWeekPlanner
                  weekDays={weekDays}
                  entries={calendarEntries}
                  tone={tone}
                  selectedEntryId={selectedEntryId}
                  onSelectEntry={setSelectedEntryId}
                />
              </div>
            ) : null}

            {view === "today" ? (
              <div className="mt-4 space-y-3">
                <div
                  className={cn(
                    "rounded-[1.2rem] border p-3 text-sm",
                    isUrban
                      ? "border-white/10 bg-white/4 text-slate-200"
                      : "border-slate-200 bg-white/80 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      {todayEntries.length
                        ? `Vandaag staan er ${todayEntries.length} les${
                            todayEntries.length === 1 ? "" : "sen"
                          } of aanvragen in je planning.`
                        : "Vandaag is rustig; hieronder zie je de eerstvolgende geplande dag in dezelfde agenda-opbouw."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {todayFocusLessonCount ? (
                        <Badge className="border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100">
                          {todayFocusLessonCount} les
                        </Badge>
                      ) : null}
                      {todayFocusRequestCount ? (
                        <Badge className="border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
                          {todayFocusRequestCount} aanvraag
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
                <LessonDayPlanner
                  date={todayFocusDate}
                  entries={todayFocusEntries}
                  tone={tone}
                  selectedEntryId={selectedEntryId}
                  onSelectEntry={setSelectedEntryId}
                />
              </div>
            ) : null}

            {view === "list" ? (
              <div className="mt-4 space-y-4">
                {groupedListEntries.map((group) => (
                  <div key={group.key}>
                    <p
                      className={cn(
                        "mb-2 text-xs font-semibold tracking-[0.18em] uppercase",
                        isUrban ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      {group.label}
                    </p>
                    <div className="space-y-2">
                      {group.items.map((entry) => (
                        <CalendarEntryCard
                          key={entry.id}
                          entry={entry}
                          tone={tone}
                          active={selectedEntryId === entry.id}
                          onClick={() => setSelectedEntryId(entry.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 self-start 2xl:sticky 2xl:top-6">
          <div
            className={cn(
              "rounded-[1.5rem] p-4 shadow-[0_20px_52px_-38px_rgba(15,23,42,0.18)]",
              isUrban
                ? "border border-white/10 bg-white/4"
                : "border border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/5"
            )}
          >
            <p
              className={cn(
                "text-xs font-semibold tracking-[0.2em] uppercase",
                isUrban ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
              )}
            >
              {selectedEntry?.kind === "request"
                ? "Geselecteerde aanvraag"
                : "Geselecteerde les"}
            </p>
            <h4
              className={cn(
                "mt-3 text-xl font-semibold",
                isUrban ? "text-white" : "text-slate-950 dark:text-white"
              )}
            >
              {selectedEntry?.title}
            </h4>
            <p
              className={cn(
                "mt-2 text-sm leading-6",
                isUrban ? "text-slate-300" : "text-slate-600 dark:text-slate-300"
              )}
            >
              Deze kolom ondersteunt je keuze. De kalender links blijft het hoofdbeeld van je planning.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                  selectedEntry?.kind === "request"
                    ? isUrban
                      ? "border border-white/10 bg-white/6 text-slate-200"
                      : "border border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200"
                    : isUrban
                      ? "border border-sky-300/18 bg-sky-400/10 text-sky-100"
                      : "border border-sky-200 bg-sky-50 text-sky-700"
                )}
              >
                {selectedEntry?.typeLabel}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
                  selectedEntry
                    ? getStatusMeta(selectedEntry.status, tone, selectedEntry.kind)
                        .badgeClassName
                    : ""
                )}
              >
                {selectedEntry?.status}
              </span>
            </div>

            <div
              className={cn(
                "mt-4 rounded-[1.2rem] border p-3.5",
                isUrban
                  ? "border-white/10 bg-white/5"
                  : "border-slate-200 bg-white/85 dark:border-white/10 dark:bg-white/[0.06]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs font-semibold tracking-[0.16em] uppercase",
                      isUrban ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    Moment
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm leading-6 font-medium",
                      isUrban ? "text-slate-50" : "text-slate-900 dark:text-slate-100"
                    )}
                  >
                    {selectedEntry?.momentLabel ?? "-"}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                    isUrban
                      ? "bg-white/8 text-slate-100"
                      : "bg-slate-100 text-slate-700 dark:bg-white/8 dark:text-slate-100"
                  )}
                >
                  <Clock3 className="size-4" />
                </div>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-1">
                <div
                  className={cn(
                    "rounded-[1rem] border px-3 py-2.5",
                    isUrban
                      ? "border-white/10 bg-white/4"
                      : "border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <MapPin
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        isUrban ? "text-slate-300" : "text-slate-600 dark:text-slate-300"
                      )}
                    />
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-[10px] font-semibold tracking-[0.16em] uppercase",
                          isUrban ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                        )}
                      >
                        Locatie
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-[13px] leading-6 font-medium",
                          isUrban ? "text-slate-100" : "text-slate-700 dark:text-slate-200"
                        )}
                      >
                        {selectedEntry?.contextLabel ?? "Nog onbekend"}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-[1rem] border px-3 py-2.5",
                    isUrban
                      ? "border-white/10 bg-white/4"
                      : "border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <UserRound
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        isUrban ? "text-slate-300" : "text-slate-600 dark:text-slate-300"
                      )}
                    />
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-[10px] font-semibold tracking-[0.16em] uppercase",
                          isUrban ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                        )}
                      >
                        Contact
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-[13px] leading-6 font-medium",
                          isUrban ? "text-slate-100" : "text-slate-700 dark:text-slate-200"
                        )}
                      >
                        {selectedEntry?.contactLabel ?? "Nog niet gekoppeld"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedEntry?.note ? (
                <div
                  className={cn(
                    "mt-4 rounded-[1rem] border px-3 py-2.5",
                    isUrban
                      ? "border-white/10 bg-white/4"
                      : "border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <MessageSquare
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        isUrban ? "text-slate-300" : "text-slate-600 dark:text-slate-300"
                      )}
                    />
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-[10px] font-semibold tracking-[0.16em] uppercase",
                          isUrban ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                        )}
                      >
                        Bericht
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-[13px] leading-6",
                          isUrban ? "text-slate-100" : "text-slate-700 dark:text-slate-200"
                        )}
                      >
                        {selectedEntry.note}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <CalendarActionPanel
              entry={selectedEntry}
              role={role}
              tone={tone}
              locationOptions={locationOptions}
            />
          </div>

          <div
            className={cn(
              "grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-1",
              isUrban ? "text-slate-100" : "text-slate-950"
            )}
          >
            {[
              { label: "In agenda", value: `${calendarEntries.length}` },
              { label: "Lessen", value: `${lessonCount}` },
              { label: "Aanvragen", value: `${requestCount}` },
              { label: "Afgerond", value: `${completedCount}` },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-[1.3rem] p-4",
                  isUrban
                    ? "border border-white/10 bg-white/4"
                    : "border border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/5"
                )}
              >
                <div className="flex items-center gap-2">
                  <CalendarDays
                    className={cn(
                      "size-4",
                      isUrban ? "text-slate-300" : "text-primary dark:text-sky-300"
                    )}
                  />
                  <p
                    className={cn(
                      "text-xs font-semibold tracking-[0.16em] uppercase",
                      isUrban ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {item.label}
                  </p>
                </div>
                <p className="mt-3 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
