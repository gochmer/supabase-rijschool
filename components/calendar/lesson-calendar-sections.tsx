"use client";

import { useMemo, useState } from "react";
import { compareAsc, format, isSameDay, isToday } from "date-fns";
import { nl } from "date-fns/locale";
import { Clock3, MapPin, MessageSquare } from "lucide-react";

import { LearnerLessonActions } from "@/components/dashboard/learner-lesson-actions";
import { LessonAttendanceActions } from "@/components/dashboard/lesson-attendance-actions";
import { LessonEditDialog } from "@/components/dashboard/lesson-edit-dialog";
import { LessonNoteEditor } from "@/components/dashboard/lesson-note-editor";
import { LessonQuickActions } from "@/components/dashboard/lesson-quick-actions";
import { RequestStatusActions } from "@/components/dashboard/request-status-actions";
import { LessonCalendarEditDialog } from "@/components/instructor/lesson-calendar-edit-dialog";
import {
  LESSON_PLANNER_COLUMN_MIN_WIDTH,
  LESSON_PLANNER_HEIGHT,
  LESSON_PLANNER_HOUR_HEIGHT,
  formatPlannerTimeRange,
  getEntryNextStep,
  getLessonPlannerEventLayout,
  getPlannerEntrySurfaceClassNames,
  getPlannerHourLabel,
  getStatusMeta,
  lessonPlannerHours,
  type CalendarEntry,
  type CalendarRole,
  type CalendarTone,
} from "@/components/calendar/lesson-calendar-model";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  BeschikbaarheidSlot,
  InstructorStudentProgressRow,
  LocationOption,
} from "@/lib/types";

export function CalendarEntryCard({
  entry,
  tone,
  active,
  onClick,
}: {
  entry: CalendarEntry;
  tone: CalendarTone;
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
  tone: CalendarTone;
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

function LessonPlannerTimeAxis({ tone }: { tone: CalendarTone }) {
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
  tone: CalendarTone;
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

export function LessonWeekPlanner({
  weekDays,
  entries,
  tone,
  selectedEntryId,
  onSelectEntry,
}: {
  weekDays: Date[];
  entries: CalendarEntry[];
  tone: CalendarTone;
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

export function LessonDayPlanner({
  date,
  entries,
  tone,
  selectedEntryId,
  onSelectEntry,
}: {
  date: Date;
  entries: CalendarEntry[];
  tone: CalendarTone;
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

export function CalendarActionPanel({
  entry,
  role,
  tone,
  locationOptions,
  students = [],
  availabilitySlots = [],
  lessonBusyWindows = [],
}: {
  entry: CalendarEntry | null;
  role: CalendarRole | null;
  tone: CalendarTone;
  locationOptions: LocationOption[];
  students?: InstructorStudentProgressRow[];
  availabilitySlots?: BeschikbaarheidSlot[];
  lessonBusyWindows?: Array<{
    id: string;
    label?: string | null;
    start_at?: string | null;
    end_at?: string | null;
  }>;
}) {
  const isUrban = tone === "urban";
  const [lessonEditOpen, setLessonEditOpen] = useState(false);

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
                  {students.length ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={cn(
                          "rounded-full",
                          isUrban &&
                            "border-white/10 bg-white/6 text-white hover:bg-white/10"
                        )}
                        onClick={() => setLessonEditOpen(true)}
                      >
                        Les beheren
                      </Button>
                      <LessonCalendarEditDialog
                        open={lessonEditOpen}
                        onOpenChange={setLessonEditOpen}
                        lesson={lesson}
                        students={students}
                        locationOptions={locationOptions}
                        slots={availabilitySlots}
                        busyWindows={lessonBusyWindows}
                      />
                    </>
                  ) : (
                    <LessonEditDialog
                      lesson={lesson}
                      locationOptions={locationOptions}
                    />
                  )}
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

