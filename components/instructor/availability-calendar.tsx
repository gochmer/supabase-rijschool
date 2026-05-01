"use client";

import {
  type CSSProperties,
  type HTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  addWeeks,
  compareAsc,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfWeek,
} from "date-fns";
import { nl } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GripVertical,
  MapPin,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type AvailabilityCalendarAvailabilityItem = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  available: boolean;
  momentLabel: string;
  durationLabel?: string;
  sourceLabel?: string;
  source?: "slot" | "weekrooster";
  weekRuleId?: string | null;
};

export type AvailabilityCalendarLessonItem = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  status: string;
  learnerName?: string;
  location?: string;
  timeLabel?: string;
};

type TimelineItem = {
  id: string;
  kind: "availability" | "lesson";
  title: string;
  startAt: Date;
  endAt: Date | null;
  momentLabel: string;
  detailLabel: string;
  secondaryLabel?: string;
  statusLabel: string;
  available?: boolean;
  statusTone: "info" | "success" | "warning" | "muted" | "danger";
};

type AvailabilityCalendarProps = {
  availabilityItems: AvailabilityCalendarAvailabilityItem[];
  lessonItems?: AvailabilityCalendarLessonItem[];
  selectedEntryStartAt?: string;
  selectedAvailabilityId?: string | null;
  selectedDateValue?: string;
  showFooterStats?: boolean;
  displayMode?: "internal" | "booking";
  onDateSelect?: (dateValue: string) => void;
  onAvailabilityEventClick: (eventId: string) => void;
  onAvailabilityEventDrop?: (eventId: string, targetDateValue: string) => void;
  onAvailabilityResize?: (
    eventId: string,
    edge: "start" | "end",
    minutes: number
  ) => void;
};

function getLessonTone(status: string): TimelineItem["statusTone"] {
  switch (status) {
    case "afgerond":
      return "success";
    case "geannuleerd":
    case "geweigerd":
      return "danger";
    case "aangevraagd":
      return "warning";
    case "ingepland":
    case "geaccepteerd":
    default:
      return "info";
  }
}

function getToneClassNames(tone: TimelineItem["statusTone"]) {
  switch (tone) {
    case "success":
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        card: "border-emerald-200/80 bg-emerald-50/70 text-emerald-950",
      };
    case "warning":
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        card: "border-amber-200/80 bg-amber-50/70 text-amber-950",
      };
    case "danger":
      return {
        badge: "border-rose-200 bg-rose-50 text-rose-700",
        card: "border-rose-200/80 bg-rose-50/70 text-rose-950",
      };
    case "muted":
      return {
        badge: "border-slate-200 bg-slate-100 text-slate-700",
        card: "border-slate-200/80 bg-slate-100/80 text-slate-900",
      };
    case "info":
    default:
      return {
        badge: "border-sky-200 bg-sky-50 text-sky-700",
        card: "border-sky-200/80 bg-sky-50/70 text-sky-950",
      };
  }
}

function getPlannerEventSurfaceClassNames(item: TimelineItem) {
  if (item.kind === "lesson") {
    return {
      surface:
        "border-emerald-400/24 bg-[linear-gradient(145deg,rgba(22,101,52,0.92),rgba(21,128,61,0.72))] text-emerald-50 shadow-[0_14px_32px_-24px_rgba(34,197,94,0.75)]",
      rail: "bg-emerald-300/80",
    };
  }

  if (item.available) {
    return {
      surface:
        "border-blue-400/24 bg-[linear-gradient(145deg,rgba(29,78,216,0.95),rgba(30,64,175,0.72))] text-blue-50 shadow-[0_14px_32px_-24px_rgba(59,130,246,0.75)]",
      rail: "bg-blue-300/80",
    };
  }

  return {
    surface:
      "border-white/8 bg-[linear-gradient(145deg,rgba(51,65,85,0.86),rgba(30,41,59,0.74))] text-slate-200 shadow-[0_14px_32px_-26px_rgba(15,23,42,0.9)]",
    rail: "bg-slate-400/80",
  };
}

function createAvailabilityTimelineItem(
  item: AvailabilityCalendarAvailabilityItem
): TimelineItem {
  return {
    id: item.id,
    kind: "availability",
    title: item.title,
    startAt: parseISO(item.startAt),
    endAt: parseISO(item.endAt),
    momentLabel: item.momentLabel,
    detailLabel: item.durationLabel ?? "Open moment",
    secondaryLabel: item.sourceLabel,
    statusLabel: item.available ? "Boekbaar" : "Niet boekbaar",
    available: item.available,
    statusTone: item.available ? "info" : "muted",
  };
}

function createLessonTimelineItem(item: AvailabilityCalendarLessonItem): TimelineItem {
  return {
    id: `lesson-${item.id}`,
    kind: "lesson",
    title: item.learnerName ?? item.title,
    startAt: parseISO(item.startAt),
    endAt: parseISO(item.endAt),
    momentLabel:
      item.timeLabel ??
      `${format(parseISO(item.startAt), "EEEE d MMMM - HH:mm", {
        locale: nl,
      })} - ${format(parseISO(item.endAt), "HH:mm", { locale: nl })}`,
    detailLabel: item.learnerName ?? "Leerling",
    secondaryLabel: item.location,
    statusLabel: item.status,
    statusTone: getLessonTone(item.status),
  };
}


function formatTimelineTimeRange(item: TimelineItem) {
  const startLabel = format(item.startAt, "HH:mm", { locale: nl });

  if (!item.endAt) {
    return startLabel;
  }

  return `${startLabel} - ${format(item.endAt, "HH:mm", { locale: nl })}`;
}

function TimelineCard({
  item,
  active,
  onClick,
  className,
  style,
  buttonProps,
  onResize,
}: {
  item: TimelineItem;
  active: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  buttonProps?: HTMLAttributes<HTMLDivElement>;
  onResize?: (edge: "start" | "end", minutes: number) => void;
}) {
  const tone = getToneClassNames(item.statusTone);
  const isInteractive = Boolean(onClick);
  const [resizePreviewMinutes, setResizePreviewMinutes] = useState(0);
  const [resizeEdge, setResizeEdge] = useState<"start" | "end" | null>(null);
  const resizeStartYRef = useRef<number | null>(null);
  const resizeMinutesRef = useRef(0);
  const isResizing = resizeEdge !== null;
  const {
    className: interactiveClassName,
    onKeyDown: interactiveOnKeyDown,
    ...interactiveProps
  } = buttonProps ?? {};

  useEffect(() => {
    if (!resizeEdge || !onResize) {
      return;
    }

    const activeResizeEdge = resizeEdge;
    const handleResizeCommit = onResize;

    function handlePointerMove(event: PointerEvent) {
      if (resizeStartYRef.current === null) {
        return;
      }

      const deltaY = event.clientY - resizeStartYRef.current;
      const snappedMinutes = Math.round(deltaY / 12) * 15;

      resizeMinutesRef.current = snappedMinutes;
      setResizePreviewMinutes(snappedMinutes);
    }

    function handlePointerUp() {
      const appliedMinutes = resizeMinutesRef.current;

      resizeStartYRef.current = null;
      resizeMinutesRef.current = 0;
      setResizeEdge(null);
      setResizePreviewMinutes(0);

      if (appliedMinutes) {
        handleResizeCommit(activeResizeEdge, appliedMinutes);
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [onResize, resizeEdge]);

  function handleResizePointerDown(
    edge: "start" | "end",
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    resizeStartYRef.current = event.clientY;
    resizeMinutesRef.current = 0;
    setResizePreviewMinutes(0);
    setResizeEdge(edge);
  }

  function handleInteractiveKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    interactiveOnKeyDown?.(event);

    if (event.defaultPrevented || event.currentTarget !== event.target) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  }

  const resizePreviewLabel =
    isResizing && resizeEdge
      ? `${
          resizePreviewMinutes > 0 ? "+" : resizePreviewMinutes < 0 ? "-" : ""
        }${Math.abs(resizePreviewMinutes)} min ${
          resizeEdge === "start" ? "bij start" : "bij einde"
        }`
      : null;
  const resizeHandleBaseClassName =
    "absolute inset-x-3 z-10 flex h-3 items-center justify-between rounded-full border border-sky-200/90 bg-white/90 px-2 text-[9px] font-semibold tracking-[0.16em] text-sky-700 uppercase shadow-sm transition hover:border-sky-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 dark:border-sky-300/20 dark:bg-slate-950/90 dark:text-sky-100 dark:hover:border-sky-300/35 dark:hover:bg-slate-950";
  const resizeControls =
    item.kind === "availability" && onResize ? (
      <>
        <button
          type="button"
          aria-label="Starttijd slepen"
          title="Sleep om de starttijd te verschuiven"
          className={cn(
            resizeHandleBaseClassName,
            "top-1 cursor-ns-resize",
            resizeEdge === "start" &&
              "border-sky-400 bg-sky-50 text-sky-800 shadow-[0_0_0_3px_rgba(56,189,248,0.18)] dark:border-sky-300/60 dark:bg-sky-400/15 dark:text-sky-50"
          )}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onPointerDown={(event) => handleResizePointerDown("start", event)}
        >
          <span>Start</span>
          <GripVertical className="size-3 opacity-70" />
        </button>
        <button
          type="button"
          aria-label="Eindtijd slepen"
          title="Sleep om de eindtijd te verschuiven"
          className={cn(
            resizeHandleBaseClassName,
            "bottom-1 cursor-ns-resize",
            resizeEdge === "end" &&
              "border-sky-400 bg-sky-50 text-sky-800 shadow-[0_0_0_3px_rgba(56,189,248,0.18)] dark:border-sky-300/60 dark:bg-sky-400/15 dark:text-sky-50"
          )}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onPointerDown={(event) => handleResizePointerDown("end", event)}
        >
          <span>Eind</span>
          <GripVertical className="size-3 opacity-70" />
        </button>
        {resizePreviewLabel ? (
          <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-center">
            <Badge className="border border-sky-200 bg-white/95 text-sky-700 shadow-sm dark:border-sky-300/20 dark:bg-slate-950/90 dark:text-sky-100">
              {resizePreviewLabel}
            </Badge>
          </div>
        ) : null}
      </>
    ) : null;

  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{item.title}</p>
          <p className="mt-1 text-[12px] opacity-80">{item.momentLabel}</p>
        </div>
        <Badge className={cn("border capitalize", tone.badge)}>{item.statusLabel}</Badge>
      </div>

      <div className="mt-3 space-y-2 text-[12px] opacity-90">
        <div className="flex items-start gap-2">
          <Clock3 className="mt-0.5 size-3.5 shrink-0" />
          <span>{item.detailLabel}</span>
        </div>
        {item.secondaryLabel ? (
          <div className="flex items-start gap-2">
            {item.kind === "lesson" ? (
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
            ) : (
              <UserRound className="mt-0.5 size-3.5 shrink-0" />
            )}
            <span>{item.secondaryLabel}</span>
          </div>
        ) : null}
        {item.kind === "availability" && onResize ? (
          <div className="flex items-start gap-2 rounded-[0.8rem] border border-white/60 bg-white/45 px-2.5 py-2 text-[11px] text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
            <GripVertical className="mt-0.5 size-3.5 shrink-0 text-sky-700 dark:text-sky-300" />
            <span>Sleep aan de boven- of onderrand om dit blok sneller langer of korter te maken.</span>
          </div>
        ) : null}
      </div>
    </>
  );

  if (!isInteractive) {
    return (
      <div
        style={style}
        className={cn(
          "relative w-full rounded-[1rem] border p-3 text-left transition-all",
          tone.card,
          isResizing &&
            "ring-2 ring-sky-400/70 shadow-[0_18px_34px_-24px_rgba(56,189,248,0.35)]",
          className
        )}
      >
        {resizeControls}
        {content}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleInteractiveKeyDown}
      style={style}
      {...interactiveProps}
      className={cn(
        "relative w-full rounded-[1rem] border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-28px_rgba(15,23,42,0.26)]",
        tone.card,
        isResizing &&
          "ring-2 ring-sky-400/70 shadow-[0_18px_34px_-24px_rgba(56,189,248,0.35)]",
        active && "ring-2 ring-sky-400/70 shadow-[0_18px_34px_-24px_rgba(56,189,248,0.45)]",
        className,
        interactiveClassName
      )}
    >
      {resizeControls}
      {content}
    </div>
  );
}

const WEEK_PLANNER_START_HOUR = 8;
const WEEK_PLANNER_END_HOUR = 21;
const WEEK_PLANNER_HOUR_HEIGHT = 64;
const WEEK_PLANNER_COLUMN_MIN_WIDTH = 142;
const WEEK_PLANNER_ROW_COUNT =
  WEEK_PLANNER_END_HOUR - WEEK_PLANNER_START_HOUR;
const WEEK_PLANNER_HEIGHT =
  WEEK_PLANNER_ROW_COUNT * WEEK_PLANNER_HOUR_HEIGHT;
const weekPlannerHours = Array.from(
  { length: WEEK_PLANNER_ROW_COUNT },
  (_, index) => WEEK_PLANNER_START_HOUR + index
);

function getPlannerHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function getWeekPlannerBounds(date: Date) {
  const start = new Date(date);
  start.setHours(WEEK_PLANNER_START_HOUR, 0, 0, 0);

  const end = new Date(date);
  end.setHours(WEEK_PLANNER_END_HOUR, 0, 0, 0);

  return { start, end };
}

function getMinutesBetweenDates(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

function getWeekPlannerEventLayout(item: TimelineItem, date: Date) {
  if (!item.endAt) {
    return null;
  }

  const bounds = getWeekPlannerBounds(date);

  if (item.endAt <= bounds.start || item.startAt >= bounds.end) {
    return null;
  }

  const boundedStart =
    item.startAt < bounds.start ? bounds.start : item.startAt;
  const boundedEnd = item.endAt > bounds.end ? bounds.end : item.endAt;
  const top =
    (getMinutesBetweenDates(bounds.start, boundedStart) / 60) *
    WEEK_PLANNER_HOUR_HEIGHT;
  const rawHeight =
    (getMinutesBetweenDates(boundedStart, boundedEnd) / 60) *
    WEEK_PLANNER_HOUR_HEIGHT;
  const remainingHeight = Math.max(WEEK_PLANNER_HEIGHT - top, 28);

  return {
    top,
    height: Math.max(28, Math.min(remainingHeight, rawHeight)),
  };
}

function WeekPlannerEventCard({
  item,
  active,
  layout,
  onClick,
  onResize,
  draggable,
}: {
  item: TimelineItem;
  active: boolean;
  layout: { top: number; height: number };
  onClick?: () => void;
  onResize?: (edge: "start" | "end", minutes: number) => void;
  draggable: boolean;
}) {
  const plannerTone = getPlannerEventSurfaceClassNames(item);
  const compact = layout.height < 88;
  const superCompact = layout.height < 64;
  const [resizePreviewMinutes, setResizePreviewMinutes] = useState(0);
  const [resizeEdge, setResizeEdge] = useState<"start" | "end" | null>(null);
  const resizeStartYRef = useRef<number | null>(null);
  const resizeMinutesRef = useRef(0);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.id,
      disabled: !draggable,
    });

  useEffect(() => {
    if (!resizeEdge || !onResize) {
      return;
    }

    const activeResizeEdge = resizeEdge;
    const handleResizeCommit = onResize;

    function handlePointerMove(event: PointerEvent) {
      if (resizeStartYRef.current === null) {
        return;
      }

      const deltaY = event.clientY - resizeStartYRef.current;
      const snappedMinutes = Math.round(deltaY / 10) * 15;

      resizeMinutesRef.current = snappedMinutes;
      setResizePreviewMinutes(snappedMinutes);
    }

    function handlePointerUp() {
      const appliedMinutes = resizeMinutesRef.current;

      resizeStartYRef.current = null;
      resizeMinutesRef.current = 0;
      setResizeEdge(null);
      setResizePreviewMinutes(0);

      if (appliedMinutes) {
        handleResizeCommit(activeResizeEdge, appliedMinutes);
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [onResize, resizeEdge]);

  function handleResizePointerDown(
    edge: "start" | "end",
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    resizeStartYRef.current = event.clientY;
    resizeMinutesRef.current = 0;
    setResizePreviewMinutes(0);
    setResizeEdge(edge);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!onClick || event.currentTarget !== event.target) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }

  const resizePreviewLabel =
    resizeEdge && resizePreviewMinutes
      ? `${
          resizePreviewMinutes > 0
            ? "+"
            : resizePreviewMinutes < 0
              ? "-"
              : ""
        }${Math.abs(resizePreviewMinutes)} min ${
          resizeEdge === "start" ? "bij start" : "bij einde"
        }`
      : null;
  const resizeHandleClassName =
    "absolute left-2 right-2 z-20 flex h-1.5 items-center justify-center rounded-full border border-sky-200/80 bg-white/90 text-[0px] text-sky-700 opacity-0 shadow-sm transition group-hover:opacity-100 hover:border-sky-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 dark:border-sky-300/20 dark:bg-slate-950/95 dark:text-sky-100";

  return (
    <div
      ref={setNodeRef}
      className="absolute inset-x-1 z-10"
      style={{
        top: layout.top,
        height: layout.height,
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.58 : 1,
      }}
    >
      <div
        onClick={onClick}
        onKeyDown={handleKeyDown}
        {...(!draggable && onClick
          ? {
              role: "button" as const,
              tabIndex: 0,
            }
          : {})}
        {...(draggable ? { ...attributes, ...listeners } : {})}
        className={cn(
          "group relative flex h-full min-h-[36px] flex-col overflow-hidden rounded-md border px-2 pb-1.5 pt-2 text-left transition-all",
          plannerTone.surface,
          draggable && "cursor-grab active:cursor-grabbing",
          active &&
            "ring-2 ring-sky-400/65 shadow-[0_12px_26px_-22px_rgba(56,189,248,0.5)]",
          resizeEdge &&
            "ring-2 ring-sky-400/65 shadow-[0_12px_26px_-22px_rgba(56,189,248,0.5)]",
          compact ? "gap-1" : "gap-2"
        )}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-1.5 rounded-l-[0.72rem]",
            plannerTone.rail
          )}
        />
        {item.kind === "availability" && onResize ? (
          <>
            <button
              type="button"
              aria-label="Starttijd slepen"
              title="Sleep om de starttijd te verschuiven"
              className={cn(
                resizeHandleClassName,
                "top-1 cursor-ns-resize",
                resizeEdge === "start" &&
                  "border-sky-400 bg-sky-50 text-sky-800 shadow-[0_0_0_3px_rgba(56,189,248,0.18)] dark:border-sky-300/60 dark:bg-sky-400/15 dark:text-sky-50"
              )}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onPointerDown={(event) => handleResizePointerDown("start", event)}
            >
              Start
            </button>
            <button
              type="button"
              aria-label="Eindtijd slepen"
              title="Sleep om de eindtijd te verschuiven"
              className={cn(
                resizeHandleClassName,
                "bottom-1 cursor-ns-resize",
                resizeEdge === "end" &&
                  "border-sky-400 bg-sky-50 text-sky-800 shadow-[0_0_0_3px_rgba(56,189,248,0.18)] dark:border-sky-300/60 dark:bg-sky-400/15 dark:text-sky-50"
              )}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onPointerDown={(event) => handleResizePointerDown("end", event)}
            >
              Eind
            </button>
          </>
        ) : null}

        {resizePreviewLabel ? (
          <div className="pointer-events-none absolute inset-x-2 top-4 z-20 flex justify-center">
            <Badge className="border border-sky-200 bg-white/95 px-2 py-0.5 text-[9px] text-sky-700 shadow-sm dark:border-sky-300/20 dark:bg-slate-950/90 dark:text-sky-100">
              {resizePreviewLabel}
            </Badge>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 pl-1.5">
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
              {item.title}
            </p>
            <p
              className={cn(
                "mt-0.5 font-semibold opacity-75",
                superCompact ? "text-[9px]" : "text-[10px]"
              )}
            >
              {formatTimelineTimeRange(item)}
            </p>
          </div>
          {active ? (
            <span className="mt-0.5 size-1.5 rounded-full bg-white/80" />
          ) : null}
        </div>

        <div className="min-w-0 pl-1.5">
          {!superCompact ? (
            <p
              className={cn(
                "font-medium opacity-80",
                compact ? "line-clamp-1 text-[9.5px]" : "line-clamp-2 text-[10px]"
              )}
            >
              {item.detailLabel}
            </p>
          ) : null}
          {item.secondaryLabel && !compact && !superCompact ? (
            <p className="mt-1 line-clamp-1 text-[10px] opacity-65">
              {item.secondaryLabel}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function WeekPlannerTimeAxis() {
  return (
    <div className="border-r border-white/10 bg-transparent">
      <div className="h-16 border-b border-white/10 px-3 py-2.5">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
          Tijd
        </p>
      </div>

      <div className="overflow-hidden">
        {weekPlannerHours.map((hour) => (
          <div
            key={hour}
            className="relative border-b border-white/10 px-3 pt-2"
            style={{ height: WEEK_PLANNER_HOUR_HEIGHT }}
          >
            <span className="text-xs text-slate-300">
              {getPlannerHourLabel(hour)}
            </span>
            <div className="absolute inset-x-0 top-1/2 border-t border-white/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekPlannerDayColumn({
  date,
  items,
  displayMode = "internal",
  selectedAvailabilityId,
  selectedDateValue,
  onDateSelect,
  onAvailabilityEventClick,
  onAvailabilityEventDrop,
  onAvailabilityResize,
}: {
  date: Date;
  items: TimelineItem[];
  displayMode?: "internal" | "booking";
  selectedAvailabilityId?: string | null;
  selectedDateValue?: string;
  onDateSelect?: (dateValue: string) => void;
  onAvailabilityEventClick: (eventId: string) => void;
  onAvailabilityEventDrop?: (eventId: string, targetDateValue: string) => void;
  onAvailabilityResize?: (
    eventId: string,
    edge: "start" | "end",
    minutes: number
  ) => void;
}) {
  const dateValue = format(date, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({
    id: `day:${dateValue}`,
    disabled: !onAvailabilityEventDrop,
  });
  const orderedItems = [...items].sort((left, right) =>
    compareAsc(left.startAt, right.startAt)
  );
  const availabilityCount = orderedItems.filter(
    (item) => item.kind === "availability"
  ).length;
  const lessonCount = orderedItems.filter((item) => item.kind === "lesson").length;
  const isSelectedDay = selectedDateValue === dateValue;

  return (
    <div
      className={cn(
        "min-w-0 border-r border-white/10",
        isSelectedDay && "bg-blue-400/5"
      )}
      style={{ minWidth: WEEK_PLANNER_COLUMN_MIN_WIDTH }}
    >
      {onDateSelect ? (
        <button
          type="button"
          className={cn(
            "relative flex h-16 w-full flex-col items-center justify-center border-b border-white/10 px-3 py-2.5 text-center transition hover:bg-white/5",
            isSelectedDay && "bg-blue-400/8"
          )}
          onClick={() => onDateSelect(dateValue)}
        >
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-1",
              isToday(date) ? "bg-blue-400" : "bg-transparent"
            )}
          />
          <div>
            <p className="text-xs font-semibold capitalize text-white">
              {format(date, "EEEE", { locale: nl })}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {format(date, "d MMM", { locale: nl })}
            </p>
          </div>

          <span className="sr-only">
            {availabilityCount} open, {lessonCount} lessen
          </span>
        </button>
      ) : (
        <div className="relative flex h-16 flex-col items-center justify-center border-b border-white/10 px-3 py-2.5 text-center">
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-1",
              isToday(date)
                ? "bg-blue-400"
                : "bg-transparent"
            )}
          />
          <div>
            <p className="text-xs font-semibold capitalize text-white">
              {format(date, "EEEE", { locale: nl })}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {format(date, "d MMM", { locale: nl })}
            </p>
          </div>
        </div>
      )}

      <div
        ref={setNodeRef}
        className={cn(
          "relative overflow-hidden",
          isOver && onAvailabilityEventDrop
            ? "bg-blue-400/10"
            : "bg-transparent"
        )}
        style={{ height: WEEK_PLANNER_HEIGHT }}
      >
        {weekPlannerHours.map((hour) => (
          <div
            key={hour}
            className="relative border-b border-white/10"
            style={{ height: WEEK_PLANNER_HOUR_HEIGHT }}
          >
            <div className="absolute inset-x-0 top-1/2 border-t border-white/6" />
          </div>
        ))}

        {orderedItems.length ? (
          orderedItems.map((item) => {
            const layout = getWeekPlannerEventLayout(item, date);

            if (!layout) {
              return null;
            }

            return (
              <WeekPlannerEventCard
                key={item.id}
                item={item}
                active={
                  item.kind === "availability" &&
                  selectedAvailabilityId === item.id
                }
                layout={layout}
                onClick={
                  item.kind === "availability"
                    ? () => onAvailabilityEventClick(item.id)
                    : undefined
                }
                onResize={
                  item.kind === "availability" && onAvailabilityResize
                    ? (edge, minutes) =>
                        onAvailabilityResize(item.id, edge, minutes)
                    : undefined
                }
                draggable={
                  item.kind === "availability" && Boolean(onAvailabilityEventDrop)
                }
              />
            );
          })
        ) : (
          <div className="pointer-events-none absolute inset-x-2 top-3 rounded-md border border-dashed border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[9px] text-slate-500">
            {displayMode === "booking" ? "Geen open momenten." : "Geen blokken of lessen."}
          </div>
        )}
      </div>
    </div>
  );
}

function WeekPlannerGrid({
  weekDays,
  timeline,
  displayMode = "internal",
  selectedAvailabilityId,
  selectedDateValue,
  onDateSelect,
  onAvailabilityEventClick,
  onAvailabilityEventDrop,
  onAvailabilityResize,
}: {
  weekDays: Date[];
  timeline: TimelineItem[];
  displayMode?: "internal" | "booking";
  selectedAvailabilityId?: string | null;
  selectedDateValue?: string;
  onDateSelect?: (dateValue: string) => void;
  onAvailabilityEventClick: (eventId: string) => void;
  onAvailabilityEventDrop?: (eventId: string, targetDateValue: string) => void;
  onAvailabilityResize?: (
    eventId: string,
    edge: "start" | "end",
    minutes: number
  ) => void;
}) {
  const dayMap = useMemo(() => {
    const nextMap = new Map<string, TimelineItem[]>();

    weekDays.forEach((day) => {
      nextMap.set(
        format(day, "yyyy-MM-dd"),
        timeline
          .filter((item) => isSameDay(item.startAt, day))
          .sort((left, right) => compareAsc(left.startAt, right.startAt))
      );
    });

    return nextMap;
  }, [timeline, weekDays]);

  return (
    <div className="overflow-x-auto border-t border-white/10">
      <div className="grid min-w-[1040px] grid-cols-[70px_repeat(7,minmax(0,1fr))]">
        <WeekPlannerTimeAxis />
        {weekDays.map((day) => (
          <WeekPlannerDayColumn
            key={day.toISOString()}
            date={day}
            items={dayMap.get(format(day, "yyyy-MM-dd")) ?? []}
            displayMode={displayMode}
            selectedAvailabilityId={selectedAvailabilityId}
            selectedDateValue={selectedDateValue}
            onDateSelect={onDateSelect}
            onAvailabilityEventClick={onAvailabilityEventClick}
            onAvailabilityEventDrop={onAvailabilityEventDrop}
            onAvailabilityResize={onAvailabilityResize}
          />
        ))}
      </div>
    </div>
  );
}

export function AvailabilityDayPlanner({
  availabilityItems,
  lessonItems = [],
  dateValue,
  displayMode = "internal",
  selectedAvailabilityId = null,
  onAvailabilityEventClick,
  onAvailabilityResize,
}: {
  availabilityItems: AvailabilityCalendarAvailabilityItem[];
  lessonItems?: AvailabilityCalendarLessonItem[];
  dateValue: string;
  displayMode?: "internal" | "booking";
  selectedAvailabilityId?: string | null;
  onAvailabilityEventClick: (eventId: string) => void;
  onAvailabilityResize?: (
    eventId: string,
    edge: "start" | "end",
    minutes: number
  ) => void;
}) {
  const date = parseISO(`${dateValue}T12:00:00`);
  const timeline = useMemo(() => {
    const availabilityTimeline = availabilityItems.map(createAvailabilityTimelineItem);
    const lessonTimeline = lessonItems.map(createLessonTimelineItem);

    return [...availabilityTimeline, ...lessonTimeline]
      .filter((item) => isSameDay(item.startAt, date))
      .sort((left, right) => compareAsc(left.startAt, right.startAt));
  }, [availabilityItems, date, lessonItems]);

  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/5">
      <div className="grid grid-cols-[82px_minmax(0,1fr)]">
        <WeekPlannerTimeAxis />
        <WeekPlannerDayColumn
          date={date}
          items={timeline}
          displayMode={displayMode}
          selectedAvailabilityId={selectedAvailabilityId}
          selectedDateValue={dateValue}
          onAvailabilityEventClick={onAvailabilityEventClick}
          onAvailabilityResize={onAvailabilityResize}
        />
      </div>
    </div>
  );
}

export function AvailabilityCalendar({
  availabilityItems,
  lessonItems = [],
  selectedEntryStartAt,
  selectedAvailabilityId = null,
  selectedDateValue,
  showFooterStats = true,
  displayMode = "internal",
  onDateSelect,
  onAvailabilityEventClick,
  onAvailabilityEventDrop,
  onAvailabilityResize,
}: AvailabilityCalendarProps) {
  const availabilityTimeline = useMemo(
    () => availabilityItems.map(createAvailabilityTimelineItem),
    [availabilityItems]
  );
  const lessonTimeline = useMemo(
    () => lessonItems.map(createLessonTimelineItem),
    [lessonItems]
  );
  const timeline = useMemo(
    () => [...availabilityTimeline, ...lessonTimeline].sort((left, right) => compareAsc(left.startAt, right.startAt)),
    [availabilityTimeline, lessonTimeline]
  );

  const [view, setView] = useState<"week" | "today" | "list">("week");
  const isBookingDisplay = displayMode === "booking";
  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    if (selectedEntryStartAt) {
      return parseISO(selectedEntryStartAt);
    }

    return timeline[0]?.startAt ?? new Date();
  });

  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const todayItems = useMemo(() => timeline.filter((item) => isToday(item.startAt)), [timeline]);
  const todayFocusDate = useMemo(() => {
    if (todayItems.length) {
      return todayItems[0].startAt;
    }

    const now = new Date();
    return (
      timeline.find((item) => compareAsc(item.startAt, now) >= 0)?.startAt ??
      timeline[0]?.startAt ??
      new Date()
    );
  }, [timeline, todayItems]);
  const todayFocusDateValue = format(todayFocusDate, "yyyy-MM-dd");
  const todayFocusAvailabilityItems = useMemo(
    () =>
      availabilityItems.filter((item) =>
        isSameDay(parseISO(item.startAt), todayFocusDate)
      ),
    [availabilityItems, todayFocusDate]
  );
  const todayFocusLessonItems = useMemo(
    () =>
      lessonItems.filter((item) => isSameDay(parseISO(item.startAt), todayFocusDate)),
    [lessonItems, todayFocusDate]
  );
  const todayFocusItemCount =
    todayFocusAvailabilityItems.length + todayFocusLessonItems.length;

  const groupedItems = useMemo(() => {
    const groups = new Map<string, TimelineItem[]>();

    timeline.forEach((item) => {
      const key = format(item.startAt, "yyyy-MM-dd");
      const current = groups.get(key) ?? [];
      current.push(item);
      groups.set(key, current);
    });

    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      label: format(parseISO(`${key}T12:00:00`), "EEEE d MMMM yyyy", {
        locale: nl,
      }),
      items,
    }));
  }, [timeline]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    if (!onAvailabilityEventDrop) {
      return;
    }

    const activeId = String(event.active.id);
    const overId = event.over?.id;

    if (!activeId || typeof overId !== "string" || !overId.startsWith("day:")) {
      return;
    }

    onAvailabilityEventDrop(activeId, overId.slice(4));
  }

  if (!timeline.length) {
    return (
      <div className="rounded-[1.3rem] border border-dashed border-slate-200 bg-white/70 p-5 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
        Er zijn nog geen momenten beschikbaar in deze planning.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(17,25,36,0.98),rgba(10,16,24,0.98))] shadow-[0_24px_80px_-58px_rgba(0,0,0,0.95)]">
      <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Weekoverzicht</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-lg border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10"
              onClick={() => setAnchorDate((current) => addWeeks(current, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-lg border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10"
              onClick={() => setAnchorDate((current) => addWeeks(current, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <p className="hidden text-sm text-slate-400 sm:block">
            {format(weekStart, "d MMMM", { locale: nl })} -{" "}
            {format(weekEnd, "d MMMM", { locale: nl })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10"
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
            className="h-10 rounded-lg border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10"
            onClick={() => setView(view === "week" ? "today" : "week")}
          >
            {view === "week" ? "Weekweergave" : "Vandaag"}
          </Button>
        </div>
      </div>

      {view === "week" ? (
        <>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <WeekPlannerGrid
              weekDays={weekDays}
              timeline={timeline}
              displayMode={displayMode}
              selectedAvailabilityId={selectedAvailabilityId}
              selectedDateValue={selectedDateValue}
              onDateSelect={onDateSelect}
              onAvailabilityEventClick={onAvailabilityEventClick}
              onAvailabilityEventDrop={onAvailabilityEventDrop}
              onAvailabilityResize={onAvailabilityResize}
            />
          </DndContext>
          <div className="flex flex-wrap items-center justify-center gap-6 border-t border-white/10 px-5 py-4 text-xs text-slate-300">
            <span className="inline-flex items-center gap-2">
              <span className="size-3 rounded bg-emerald-500" />
              Les bevestigd
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-3 rounded bg-blue-500" />
              Beschikbaar
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-3 rounded bg-slate-600" />
              Niet beschikbaar
            </span>
          </div>
        </>
      ) : null}

      {view === "today" ? (
        <div className="space-y-3 border-t border-white/10 p-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                  {todayItems.length ? "Vandaag" : "Eerstvolgende dag"}
                </p>
                <p className="mt-1 text-lg font-semibold capitalize text-white">
                  {format(todayFocusDate, "EEEE d MMMM", { locale: nl })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="border-0 bg-blue-500/14 text-blue-200 ring-1 ring-blue-400/20">
                  {todayFocusAvailabilityItems.filter((item) => item.available).length} open
                </Badge>
                {!isBookingDisplay && todayFocusLessonItems.length ? (
                  <Badge className="border-0 bg-emerald-500/14 text-emerald-200 ring-1 ring-emerald-400/20">
                    {todayFocusLessonItems.length} les{todayFocusLessonItems.length === 1 ? "" : "sen"}
                  </Badge>
                ) : null}
                <Badge className="border-0 bg-white/8 text-slate-200 ring-1 ring-white/10">
                  {todayFocusItemCount} items
                </Badge>
              </div>
            </div>
          </div>
          <AvailabilityDayPlanner
            availabilityItems={todayFocusAvailabilityItems}
            lessonItems={todayFocusLessonItems}
            dateValue={todayFocusDateValue}
            displayMode={displayMode}
            selectedAvailabilityId={selectedAvailabilityId}
            onAvailabilityEventClick={onAvailabilityEventClick}
            onAvailabilityResize={onAvailabilityResize}
          />
        </div>
      ) : null}

      <div className="hidden">
        <Tabs
          value={view}
          onValueChange={(value) => setView(value as "week" | "today" | "list")}
        >
          <TabsList>
            <TabsTrigger value="week">Weekoverzicht</TabsTrigger>
            <TabsTrigger value="today">Vandaag</TabsTrigger>
            <TabsTrigger value="list">Lijst</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "list" ? (
        <div className="space-y-4 border-t border-white/10 p-5">
          {groupedItems.map((group) => (
            <div key={group.key}>
              <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <TimelineCard
                    key={item.id}
                    item={item}
                    active={item.kind === "availability" && selectedAvailabilityId === item.id}
                    onClick={
                      item.kind === "availability"
                        ? () => onAvailabilityEventClick(item.id)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {showFooterStats ? (
        <div className="grid gap-3 border-t border-white/10 p-5">
          {[
            {
              label: "Weekslots",
              value: `${availabilityTimeline.filter((item) => item.available).length}`,
              icon: CalendarDays,
            },
            {
              label: "Vandaag",
              value: `${todayItems.length}`,
              icon: Clock3,
            },
            {
              label: "Lessen",
              value: `${lessonTimeline.length}`,
              icon: MapPin,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-center gap-2">
                <item.icon className="size-4 text-blue-300" />
                <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
                  {item.label}
                </p>
              </div>
              <p className="mt-3 text-2xl font-semibold text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
