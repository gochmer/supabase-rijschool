"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addWeeks,
  compareAsc,
  eachDayOfInterval,
  endOfWeek,
  format,
  isToday,
  startOfWeek,
} from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PlanningWeekTone = "default" | "urban";
export type PlanningWeekDesktopAt = "xl" | "2xl";
export type PlanningWeekAccent =
  | "amber"
  | "cyan"
  | "emerald"
  | "rose"
  | "sky"
  | "slate"
  | "violet";
export type PlanningWeekItemKind =
  | "lesson"
  | "request"
  | "available"
  | "blocked"
  | "pause";

export type PlanningWeekItem<Meta = unknown> = {
  id: string;
  kind: PlanningWeekItemKind;
  title: string;
  startAt: Date;
  endAt: Date;
  typeLabel?: string;
  statusLabel?: string;
  contextLabel?: string;
  actionLabel?: string;
  ariaLabel?: string;
  accent?: PlanningWeekAccent;
  interactive?: boolean;
  meta?: Meta;
};

const PLANNER_START_HOUR = 7;
const PLANNER_END_HOUR = 22;
const PLANNER_HOUR_HEIGHT = 60;
const PLANNER_COLUMN_MIN_WIDTH = 152;
const PLANNER_ROW_COUNT = PLANNER_END_HOUR - PLANNER_START_HOUR;
const PLANNER_HEIGHT = PLANNER_ROW_COUNT * PLANNER_HOUR_HEIGHT;
const plannerHours = Array.from(
  { length: PLANNER_ROW_COUNT },
  (_, index) => PLANNER_START_HOUR + index,
);

const kindLabels: Record<PlanningWeekItemKind, string> = {
  available: "open",
  blocked: "blokkade",
  lesson: "les",
  pause: "pauze",
  request: "aanvraag",
};

function getItemEndAt(item: PlanningWeekItem) {
  return item.endAt > item.startAt
    ? item.endAt
    : new Date(item.startAt.getTime() + 60 * 60_000);
}

function getPlannerBounds(date: Date) {
  const start = new Date(date);
  start.setHours(PLANNER_START_HOUR, 0, 0, 0);

  const end = new Date(date);
  end.setHours(PLANNER_END_HOUR, 0, 0, 0);

  return { start, end };
}

function getDayBounds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return { start, end };
}

function getMinutesBetweenDates(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

function itemOverlapsDay(item: PlanningWeekItem, date: Date) {
  const bounds = getDayBounds(date);
  const endAt = getItemEndAt(item);

  return item.startAt < bounds.end && endAt > bounds.start;
}

function getItemLayout(item: PlanningWeekItem, date: Date) {
  const bounds = getPlannerBounds(date);
  const itemEndAt = getItemEndAt(item);

  if (itemEndAt <= bounds.start || item.startAt >= bounds.end) {
    return null;
  }

  const boundedStart =
    item.startAt < bounds.start ? bounds.start : item.startAt;
  const boundedEnd = itemEndAt > bounds.end ? bounds.end : itemEndAt;
  const top =
    (getMinutesBetweenDates(bounds.start, boundedStart) / 60) *
    PLANNER_HOUR_HEIGHT;
  const rawHeight =
    (getMinutesBetweenDates(boundedStart, boundedEnd) / 60) *
    PLANNER_HOUR_HEIGHT;
  const remainingHeight = Math.max(PLANNER_HEIGHT - top, 28);

  return {
    height: Math.max(28, Math.min(remainingHeight, rawHeight)),
    top,
  };
}

function formatTimeRange(item: PlanningWeekItem) {
  return `${format(item.startAt, "HH:mm", { locale: nl })} - ${format(
    getItemEndAt(item),
    "HH:mm",
    { locale: nl },
  )}`;
}

function getHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function getSurfaceClassNames(item: PlanningWeekItem, tone: PlanningWeekTone) {
  if (item.accent) {
    const urbanAccentClasses: Record<
      PlanningWeekAccent,
      {
        badge: string;
        mobile: string;
        rail: string;
        surface: string;
      }
    > = {
      amber: {
        badge: "border border-amber-300/20 bg-amber-400/12 text-amber-100",
        mobile: "border-amber-300/18 bg-amber-400/8 text-amber-50",
        rail: "bg-amber-300",
        surface: "border-amber-300/22 bg-amber-400/10 text-amber-50",
      },
      cyan: {
        badge: "border border-cyan-300/20 bg-cyan-400/12 text-cyan-100",
        mobile: "border-cyan-300/18 bg-cyan-400/8 text-cyan-50",
        rail: "bg-cyan-300",
        surface: "border-cyan-300/22 bg-cyan-400/10 text-cyan-50",
      },
      emerald: {
        badge:
          "border border-emerald-300/20 bg-emerald-400/12 text-emerald-100",
        mobile: "border-emerald-300/18 bg-emerald-400/8 text-emerald-50",
        rail: "bg-emerald-300",
        surface: "border-emerald-300/22 bg-emerald-400/10 text-emerald-50",
      },
      rose: {
        badge: "border border-rose-300/20 bg-rose-400/12 text-rose-100",
        mobile: "border-rose-300/18 bg-rose-400/8 text-rose-50",
        rail: "bg-rose-300",
        surface: "border-rose-300/22 bg-rose-400/10 text-rose-50",
      },
      sky: {
        badge: "border border-sky-300/20 bg-sky-400/12 text-sky-100",
        mobile: "border-sky-300/18 bg-sky-400/8 text-sky-50",
        rail: "bg-sky-300",
        surface: "border-sky-300/22 bg-sky-400/10 text-sky-50",
      },
      slate: {
        badge: "border border-slate-300/16 bg-slate-200/10 text-slate-100",
        mobile: "border-white/10 bg-white/6 text-slate-100",
        rail: "bg-slate-300",
        surface: "border-white/10 bg-white/6 text-slate-100",
      },
      violet: {
        badge: "border border-violet-300/20 bg-violet-400/12 text-violet-100",
        mobile: "border-violet-300/18 bg-violet-400/8 text-violet-50",
        rail: "bg-violet-300",
        surface: "border-violet-300/22 bg-violet-400/10 text-violet-50",
      },
    };
    const defaultAccentClasses: Record<
      PlanningWeekAccent,
      {
        badge: string;
        mobile: string;
        rail: string;
        surface: string;
      }
    > = {
      amber: {
        badge: "border border-amber-200 bg-amber-50 text-amber-700",
        mobile: "border-amber-200/80 bg-amber-50/70 text-amber-900",
        rail: "bg-amber-500",
        surface: "border-amber-200/90 bg-amber-50/92 text-amber-950",
      },
      cyan: {
        badge: "border border-cyan-200 bg-cyan-50 text-cyan-700",
        mobile: "border-cyan-200/80 bg-cyan-50/70 text-cyan-900",
        rail: "bg-cyan-500",
        surface: "border-cyan-200/90 bg-cyan-50/92 text-cyan-950",
      },
      emerald: {
        badge: "border border-emerald-200 bg-emerald-50 text-emerald-700",
        mobile: "border-emerald-200/80 bg-emerald-50/70 text-emerald-900",
        rail: "bg-emerald-500",
        surface: "border-emerald-200/90 bg-emerald-50/92 text-emerald-950",
      },
      rose: {
        badge: "border border-rose-200 bg-rose-50 text-rose-700",
        mobile: "border-rose-200/80 bg-rose-50/70 text-rose-900",
        rail: "bg-rose-500",
        surface: "border-rose-200/90 bg-rose-50/92 text-rose-950",
      },
      sky: {
        badge: "border border-sky-200 bg-sky-50 text-sky-700",
        mobile: "border-sky-200/80 bg-sky-50/70 text-sky-900",
        rail: "bg-sky-500",
        surface: "border-sky-200/90 bg-sky-50/92 text-sky-950",
      },
      slate: {
        badge: "border border-slate-200 bg-slate-100 text-slate-700",
        mobile: "border-slate-200/80 bg-slate-100/80 text-slate-900",
        rail: "bg-slate-400",
        surface: "border-slate-200/90 bg-slate-100/92 text-slate-900",
      },
      violet: {
        badge: "border border-violet-200 bg-violet-50 text-violet-700",
        mobile: "border-violet-200/80 bg-violet-50/70 text-violet-900",
        rail: "bg-violet-500",
        surface: "border-violet-200/90 bg-violet-50/92 text-violet-950",
      },
    };

    return tone === "urban"
      ? urbanAccentClasses[item.accent]
      : defaultAccentClasses[item.accent];
  }

  if (tone === "urban") {
    switch (item.kind) {
      case "available":
        return {
          badge:
            "border border-emerald-300/20 bg-emerald-400/12 text-emerald-100",
          mobile:
            "border-emerald-300/18 bg-emerald-400/8 text-emerald-50",
          rail: "bg-emerald-300",
          surface:
            "border-emerald-300/22 bg-emerald-400/10 text-emerald-50",
        };
      case "blocked":
        return {
          badge: "border border-rose-300/20 bg-rose-400/12 text-rose-100",
          mobile: "border-rose-300/18 bg-rose-400/8 text-rose-50",
          rail: "bg-rose-300",
          surface: "border-rose-300/22 bg-rose-400/10 text-rose-50",
        };
      case "pause":
        return {
          badge:
            "border border-slate-300/16 bg-slate-200/10 text-slate-100",
          mobile: "border-white/10 bg-white/6 text-slate-100",
          rail: "bg-slate-300",
          surface: "border-white/10 bg-white/6 text-slate-100",
        };
      case "request":
        return {
          badge:
            "border border-amber-300/20 bg-amber-400/12 text-amber-100",
          mobile: "border-amber-300/18 bg-amber-400/8 text-amber-50",
          rail: "bg-amber-300",
          surface:
            "border-amber-300/22 bg-amber-400/10 text-amber-50",
        };
      case "lesson":
      default:
        return {
          badge: "border border-sky-300/20 bg-sky-400/12 text-sky-100",
          mobile: "border-sky-300/18 bg-sky-400/8 text-sky-50",
          rail: "bg-sky-300",
          surface: "border-sky-300/22 bg-sky-400/10 text-sky-50",
        };
    }
  }

  switch (item.kind) {
    case "available":
      return {
        badge: "border border-emerald-200 bg-emerald-50 text-emerald-700",
        mobile: "border-emerald-200/80 bg-emerald-50/70 text-emerald-900",
        rail: "bg-emerald-500",
        surface: "border-emerald-200/90 bg-emerald-50/92 text-emerald-950",
      };
    case "blocked":
      return {
        badge: "border border-rose-200 bg-rose-50 text-rose-700",
        mobile: "border-rose-200/80 bg-rose-50/70 text-rose-900",
        rail: "bg-rose-500",
        surface: "border-rose-200/90 bg-rose-50/92 text-rose-950",
      };
    case "pause":
      return {
        badge: "border border-slate-200 bg-slate-100 text-slate-700",
        mobile: "border-slate-200/80 bg-slate-100/80 text-slate-900",
        rail: "bg-slate-400",
        surface: "border-slate-200/90 bg-slate-100/92 text-slate-900",
      };
    case "request":
      return {
        badge: "border border-amber-200 bg-amber-50 text-amber-700",
        mobile: "border-amber-200/80 bg-amber-50/70 text-amber-900",
        rail: "bg-amber-500",
        surface: "border-amber-200/90 bg-amber-50/92 text-amber-950",
      };
    case "lesson":
    default:
      return {
        badge: "border border-sky-200 bg-sky-50 text-sky-700",
        mobile: "border-sky-200/80 bg-sky-50/70 text-sky-900",
        rail: "bg-sky-500",
        surface: "border-sky-200/90 bg-sky-50/92 text-sky-950",
      };
  }
}

function getDayStats(items: PlanningWeekItem[]) {
  return (["lesson", "request", "available", "blocked", "pause"] as const)
    .map((kind) => ({
      kind,
      count: items.filter((item) => item.kind === kind).length,
    }))
    .filter((item) => item.count > 0);
}

function PlanningTimeAxis({
  fitToContainer,
  tone,
}: {
  fitToContainer?: boolean;
  tone: PlanningWeekTone;
}) {
  return (
    <div
      className={cn(
        "border-r",
        tone === "urban"
          ? "border-white/10 bg-white/4"
          : "border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-slate-950/30",
      )}
    >
      <div
        className={cn(
          "h-[72px] border-b py-2.5",
          fitToContainer ? "px-1.5" : "px-3",
          tone === "urban"
            ? "border-white/10"
            : "border-slate-200/80 dark:border-white/10",
        )}
      >
        <p
          className={cn(
            "text-[10px] font-semibold tracking-[0.18em] uppercase",
            tone === "urban"
              ? "text-slate-400"
              : "text-slate-500 dark:text-slate-400",
          )}
        >
          Tijd
        </p>
        <p
          className={cn(
            "mt-2 text-[11px]",
            fitToContainer && "hidden 2xl:block",
            tone === "urban"
              ? "text-slate-400"
              : "text-slate-500 dark:text-slate-400",
          )}
        >
          Planner
        </p>
      </div>

      <div className="overflow-hidden rounded-bl-[1.25rem]">
        {plannerHours.map((hour) => (
          <div
            key={hour}
            className={cn(
              "relative border-b pt-2",
              fitToContainer ? "px-1.5" : "px-3",
              tone === "urban"
                ? "border-white/10"
                : "border-slate-200/80 dark:border-white/10",
            )}
            style={{ height: PLANNER_HOUR_HEIGHT }}
          >
            <span
              className={cn(
                "font-semibold",
                fitToContainer ? "text-[10px]" : "text-[11px]",
                tone === "urban"
                  ? "text-slate-300"
                  : "text-slate-600 dark:text-slate-300",
              )}
            >
              {getHourLabel(hour)}
            </span>
            <div
              className={cn(
                "absolute inset-x-0 top-1/2 border-t",
                tone === "urban"
                  ? "border-white/8"
                  : "border-slate-200/70 dark:border-white/8",
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanningItemBlock<Meta>({
  active,
  fitToContainer,
  item,
  layout,
  onSelectItem,
  tone,
}: {
  active: boolean;
  fitToContainer?: boolean;
  item: PlanningWeekItem<Meta>;
  layout: { top: number; height: number };
  onSelectItem?: (item: PlanningWeekItem<Meta>) => void;
  tone: PlanningWeekTone;
}) {
  const surface = getSurfaceClassNames(item, tone);
  const compact = layout.height < 88;
  const superCompact = layout.height < 62;
  const interactive = item.interactive !== false && Boolean(onSelectItem);
  const statusLabel = item.statusLabel ?? kindLabels[item.kind];

  const content = (
    <>
      <div className={cn("absolute inset-y-0 left-0 w-1.5 rounded-l-[0.72rem]", surface.rail)} />
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
                    : "line-clamp-2 text-[11px]",
              )}
            >
              {item.title}
            </p>
            <p
              className={cn(
                "mt-0.5 font-semibold opacity-80",
                superCompact ? "text-[9px]" : "text-[10px]",
              )}
            >
              {formatTimeRange(item)}
            </p>
          </div>
          <Badge
            className={cn(
              "shrink-0 border border-white/60 bg-white/70 px-1 py-0 text-[7px] capitalize text-slate-700 dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-100",
              surface.badge,
            )}
          >
            {statusLabel}
          </Badge>
        </div>

        {!superCompact ? (
          <div className="mt-2">
            {item.typeLabel ? (
              <p
                className={cn(
                  "font-medium opacity-80",
                  compact
                    ? "line-clamp-1 text-[9.5px]"
                    : "line-clamp-2 text-[10px]",
                )}
              >
                {item.typeLabel}
              </p>
            ) : null}
            {!compact && item.contextLabel ? (
              <p className="mt-1 line-clamp-2 text-[10px] opacity-65">
                {item.contextLabel}
              </p>
            ) : null}
            {interactive && item.actionLabel ? (
              <p className="mt-1 hidden text-[10px] font-semibold opacity-80 group-hover:block group-focus-visible:block">
                {item.actionLabel}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );

  const className = cn(
    "group absolute z-10 overflow-hidden rounded-[0.62rem] border pt-2 pb-1.5 text-left transition-all",
    fitToContainer ? "inset-x-1 px-1.5" : "inset-x-1.5 px-2",
    surface.surface,
    active
      ? "ring-2 ring-sky-400/70 shadow-[0_12px_26px_-22px_rgba(56,189,248,0.5)]"
      : interactive
        ? "hover:shadow-[0_12px_26px_-22px_rgba(15,23,42,0.18)] focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:outline-none"
        : "",
  );
  const style = { height: layout.height, top: layout.top };

  if (!interactive) {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={item.ariaLabel}
      className={className}
      style={style}
      onClick={() => onSelectItem?.(item)}
    >
      {content}
    </button>
  );
}

function PlanningDayColumn<Meta>({
  date,
  emptyLabel,
  fitToContainer,
  items,
  onSelectItem,
  selectedItemId,
  tone,
}: {
  date: Date;
  emptyLabel: string;
  fitToContainer?: boolean;
  items: Array<PlanningWeekItem<Meta>>;
  onSelectItem?: (item: PlanningWeekItem<Meta>) => void;
  selectedItemId?: string | null;
  tone: PlanningWeekTone;
}) {
  const isCurrentDay = isToday(date);
  const orderedItems = [...items].sort((left, right) =>
    compareAsc(left.startAt, right.startAt),
  );
  const stats = getDayStats(orderedItems);

  return (
    <div
      className={cn(
        "min-w-0 border-r",
        tone === "urban"
          ? "border-white/10"
          : "border-slate-200 dark:border-white/10",
      )}
      style={{ minWidth: fitToContainer ? 0 : PLANNER_COLUMN_MIN_WIDTH }}
    >
      <div
        className={cn(
          "relative flex h-[72px] flex-col items-start justify-between border-b py-2.5",
          fitToContainer ? "px-1.5" : "px-3",
          tone === "urban"
            ? "border-white/10"
            : "border-slate-200/80 dark:border-white/10",
        )}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-1",
            isCurrentDay ? "bg-sky-500 dark:bg-sky-300" : "bg-transparent",
          )}
        />
        <div>
          <p
            className={cn(
              "text-[10px] font-semibold tracking-[0.18em] uppercase",
              tone === "urban"
                ? "text-slate-400"
                : "text-slate-500 dark:text-slate-400",
            )}
          >
            {format(date, "EEE", { locale: nl })}
          </p>
          <p
            className={cn(
              "mt-1 font-semibold capitalize",
              fitToContainer ? "text-[12px] 2xl:text-sm" : "text-sm",
              tone === "urban" ? "text-white" : "text-slate-950 dark:text-white",
            )}
          >
            {format(date, "d MMM", { locale: nl })}
          </p>
        </div>

        <div className="flex max-w-full flex-wrap gap-1">
          {isCurrentDay ? <Badge variant="info">Vandaag</Badge> : null}
          {stats.slice(0, fitToContainer ? 1 : 2).map((stat) => {
            const surface = getSurfaceClassNames(
              {
                endAt: date,
                id: stat.kind,
                kind: stat.kind,
                startAt: date,
                title: stat.kind,
              },
              tone,
            );

            return (
              <Badge
                key={stat.kind}
                className={cn(
                  "max-w-full truncate px-1 py-0 text-[8px] 2xl:px-1.5 2xl:text-[9px]",
                  surface.badge,
                )}
              >
                {stat.count} {kindLabels[stat.kind]}
              </Badge>
            );
          })}
        </div>
      </div>

      <div
        className={cn(
          "relative overflow-hidden",
          tone === "urban" ? "bg-slate-950/20" : "bg-white/90 dark:bg-slate-950/20",
        )}
        style={{ height: PLANNER_HEIGHT }}
      >
        {plannerHours.map((hour) => (
          <div
            key={hour}
            className={cn(
              "relative border-b",
              tone === "urban"
                ? "border-white/10"
                : "border-slate-200/80 dark:border-white/10",
            )}
            style={{ height: PLANNER_HOUR_HEIGHT }}
          >
            <div
              className={cn(
                "absolute inset-x-0 top-1/2 border-t",
                tone === "urban"
                  ? "border-white/6"
                  : "border-slate-100 dark:border-white/6",
              )}
            />
          </div>
        ))}

        {orderedItems.length ? (
          orderedItems.map((item) => {
            const layout = getItemLayout(item, date);

            if (!layout) {
              return null;
            }

            return (
              <PlanningItemBlock
                key={item.id}
                active={selectedItemId === item.id}
                fitToContainer={fitToContainer}
                item={item}
                layout={layout}
                onSelectItem={onSelectItem}
                tone={tone}
              />
            );
          })
        ) : (
          <div className="pointer-events-none absolute inset-x-2 top-3 rounded-[0.72rem] border border-dashed border-slate-200/90 bg-white/75 px-2.5 py-1.5 text-[9px] text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function PlanningMobileItemCard<Meta>({
  active,
  item,
  onSelectItem,
  tone,
}: {
  active: boolean;
  item: PlanningWeekItem<Meta>;
  onSelectItem?: (item: PlanningWeekItem<Meta>) => void;
  tone: PlanningWeekTone;
}) {
  const surface = getSurfaceClassNames(item, tone);
  const interactive = item.interactive !== false && Boolean(onSelectItem);
  const statusLabel = item.statusLabel ?? kindLabels[item.kind];

  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{item.title}</p>
          {item.typeLabel ? (
            <p className="mt-1 text-[12px] opacity-80">{item.typeLabel}</p>
          ) : null}
        </div>
        <Badge className={cn("border", surface.badge)}>{statusLabel}</Badge>
      </div>
      <div className="mt-3 space-y-1.5 text-[12px] opacity-90">
        <p>{formatTimeRange(item)}</p>
        {item.contextLabel ? <p>{item.contextLabel}</p> : null}
        {interactive && item.actionLabel ? (
          <p className="font-semibold opacity-85">{item.actionLabel}</p>
        ) : null}
      </div>
    </>
  );

  const className = cn(
    "w-full rounded-[1rem] border p-3 text-left transition-all",
    surface.mobile,
    active
      ? "ring-2 ring-sky-400/70 shadow-[0_18px_34px_-24px_rgba(56,189,248,0.45)]"
      : interactive
        ? "hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-28px_rgba(15,23,42,0.26)]"
        : "",
  );

  if (!interactive) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      type="button"
      aria-label={item.ariaLabel}
      className={className}
      onClick={() => onSelectItem?.(item)}
    >
      {content}
    </button>
  );
}

function PlanningWeekCompactAgenda<Meta>({
  dayMap,
  desktopAt,
  emptyLabel,
  onSelectItem,
  selectedItemId,
  tone,
  weekDays,
}: {
  dayMap: Map<string, Array<PlanningWeekItem<Meta>>>;
  desktopAt: PlanningWeekDesktopAt;
  emptyLabel: string;
  onSelectItem?: (item: PlanningWeekItem<Meta>) => void;
  selectedItemId?: string | null;
  tone: PlanningWeekTone;
  weekDays: Date[];
}) {
  const isUrban = tone === "urban";

  return (
    <div
      className={cn(
        "grid gap-2.5 sm:grid-cols-2",
        desktopAt === "xl" ? "xl:hidden" : "xl:grid-cols-3 2xl:hidden",
      )}
    >
      {weekDays.map((day) => {
        const dayItems = dayMap.get(format(day, "yyyy-MM-dd")) ?? [];
        const isCurrentDay = isToday(day);
        const stats = getDayStats(dayItems);

        return (
          <section
            key={day.toISOString()}
            className={cn(
              "rounded-xl border p-3",
              isUrban
                ? "border-white/10 bg-slate-950/24"
                : "border-slate-200 bg-white/82 dark:border-white/10 dark:bg-slate-950/24",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className={cn(
                    "text-[10px] font-semibold tracking-[0.18em] uppercase",
                    isUrban
                      ? "text-slate-400"
                      : "text-slate-500 dark:text-slate-400",
                  )}
                >
                  {format(day, "EEEE", { locale: nl })}
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm font-semibold capitalize",
                    isUrban ? "text-white" : "text-slate-950 dark:text-white",
                  )}
                >
                  {format(day, "d MMMM", { locale: nl })}
                </p>
              </div>
              {isCurrentDay ? (
                <Badge className="border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100">
                  Vandaag
                </Badge>
              ) : null}
            </div>

            {stats.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stats.map((stat) => {
                  const surface = getSurfaceClassNames(
                    {
                      endAt: day,
                      id: stat.kind,
                      kind: stat.kind,
                      startAt: day,
                      title: stat.kind,
                    },
                    tone,
                  );

                  return (
                    <Badge
                      key={stat.kind}
                      className={cn("px-1.5 py-0 text-[9px]", surface.badge)}
                    >
                      {stat.count} {kindLabels[stat.kind]}
                    </Badge>
                  );
                })}
              </div>
            ) : null}

            <div className="mt-3 space-y-2">
              {dayItems.length ? (
                dayItems.map((item) => (
                  <PlanningMobileItemCard
                    key={item.id}
                    active={selectedItemId === item.id}
                    item={item}
                    onSelectItem={onSelectItem}
                    tone={tone}
                  />
                ))
              ) : (
                <div
                  className={cn(
                    "rounded-lg border border-dashed px-3 py-3 text-xs",
                    isUrban
                      ? "border-white/10 bg-white/5 text-slate-400"
                      : "border-slate-200 bg-white/70 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400",
                  )}
                >
                  {emptyLabel}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function PlanningWeekView<Meta = unknown>({
  desktopAt = "xl",
  emptyLabel = "Geen items.",
  fitToContainer,
  initialAnchorDate,
  items,
  navigationLabel = "Week van",
  onSelectedWeekStartChange,
  onSelectItem,
  onVisibleWeekStartChange,
  selectedWeekStart,
  selectedItemId,
  showNavigation,
  tone = "default",
  weekDays,
}: {
  desktopAt?: PlanningWeekDesktopAt;
  emptyLabel?: string;
  fitToContainer?: boolean;
  initialAnchorDate?: Date;
  items: Array<PlanningWeekItem<Meta>>;
  navigationLabel?: string;
  onSelectedWeekStartChange?: (weekStart: Date) => void;
  onSelectItem?: (item: PlanningWeekItem<Meta>) => void;
  onVisibleWeekStartChange?: (weekStart: Date) => void;
  selectedWeekStart?: Date;
  selectedItemId?: string | null;
  showNavigation?: boolean;
  tone?: PlanningWeekTone;
  weekDays?: Date[];
}) {
  const [internalAnchorDate, setInternalAnchorDate] = useState<Date>(
    initialAnchorDate ?? items[0]?.startAt ?? new Date(),
  );
  const anchorDate = selectedWeekStart ?? internalAnchorDate;
  function setWeekAnchor(nextDate: Date) {
    const nextWeekStart = startOfWeek(nextDate, { weekStartsOn: 1 });

    if (selectedWeekStart) {
      onSelectedWeekStartChange?.(new Date(nextWeekStart));
      return;
    }

    setInternalAnchorDate(nextWeekStart);
    onSelectedWeekStartChange?.(new Date(nextWeekStart));
  }
  const resolvedWeekDays = useMemo(() => {
    if (weekDays?.length) {
      return weekDays;
    }

    const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });

    return eachDayOfInterval({ end: weekEnd, start: weekStart });
  }, [anchorDate, weekDays]);
  const shouldShowNavigation = showNavigation ?? !weekDays?.length;
  const weekStart = resolvedWeekDays[0] ?? anchorDate;
  const weekEnd = resolvedWeekDays[resolvedWeekDays.length - 1] ?? anchorDate;
  useEffect(() => {
    onVisibleWeekStartChange?.(new Date(weekStart));
  }, [onVisibleWeekStartChange, weekStart]);
  const dayMap = useMemo(() => {
    const nextMap = new Map<string, Array<PlanningWeekItem<Meta>>>();

    resolvedWeekDays.forEach((day) => {
      nextMap.set(
        format(day, "yyyy-MM-dd"),
        items
          .filter((item) => itemOverlapsDay(item, day))
          .sort((left, right) => compareAsc(left.startAt, right.startAt)),
      );
    });

    return nextMap;
  }, [items, resolvedWeekDays]);

  return (
    <>
      {shouldShowNavigation ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className={cn(
                "text-xs font-semibold tracking-[0.18em] uppercase",
                tone === "urban"
                  ? "text-slate-400"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              {navigationLabel}
            </p>
            <p
              className={cn(
                "mt-1 text-lg font-semibold capitalize",
                tone === "urban" ? "text-white" : "text-slate-950 dark:text-white",
              )}
            >
              {format(weekStart, "d MMMM", { locale: nl })} -{" "}
              {format(weekEnd, "d MMMM", { locale: nl })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className={cn(
                "rounded-lg",
                tone === "urban" &&
                  "border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white",
              )}
              onClick={() => setWeekAnchor(addWeeks(anchorDate, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-10 rounded-lg px-3 text-sm font-semibold",
                tone === "urban" &&
                  "border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white",
              )}
              onClick={() => setWeekAnchor(new Date())}
            >
              Deze week
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className={cn(
                "rounded-lg",
                tone === "urban" &&
                  "border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white",
              )}
              onClick={() => setWeekAnchor(addWeeks(anchorDate, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <PlanningWeekCompactAgenda
        dayMap={dayMap}
        desktopAt={desktopAt}
        emptyLabel={emptyLabel}
        onSelectItem={onSelectItem}
        selectedItemId={selectedItemId}
        tone={tone}
        weekDays={resolvedWeekDays}
      />

      <div
        className={cn(
          "rounded-[1.35rem] border",
          fitToContainer ? "overflow-hidden" : "overflow-x-auto",
          desktopAt === "xl" ? "hidden xl:block" : "hidden 2xl:block",
          tone === "urban"
            ? "border-white/10 bg-white/5"
            : "border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/5",
        )}
      >
        <div
          className={cn(
            "grid",
            fitToContainer
              ? "min-w-0 grid-cols-[52px_repeat(7,minmax(0,1fr))] 2xl:grid-cols-[64px_repeat(7,minmax(0,1fr))]"
              : "min-w-[1120px] grid-cols-[82px_repeat(7,minmax(0,1fr))]",
          )}
        >
          <PlanningTimeAxis fitToContainer={fitToContainer} tone={tone} />
          {resolvedWeekDays.map((day) => (
            <PlanningDayColumn
              key={day.toISOString()}
              date={day}
              emptyLabel={emptyLabel}
              fitToContainer={fitToContainer}
              items={dayMap.get(format(day, "yyyy-MM-dd")) ?? []}
              onSelectItem={onSelectItem}
              selectedItemId={selectedItemId}
              tone={tone}
            />
          ))}
        </div>
      </div>
    </>
  );
}
