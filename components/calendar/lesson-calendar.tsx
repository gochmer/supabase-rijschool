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

import {
  CalendarActionPanel,
  CalendarEntryCard,
  LessonDayPlanner,
  LessonWeekPlanner,
} from "@/components/calendar/lesson-calendar-sections";
import {
  createLessonEntry,
  createRequestEntry,
  getStatusMeta,
  type CalendarEntry,
  type CalendarRole,
  type CalendarTone,
} from "@/components/calendar/lesson-calendar-model";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  BeschikbaarheidSlot,
  InstructorStudentProgressRow,
  Les,
  LesAanvraag,
  LocationOption,
} from "@/lib/types";

function getLessonEnd(lesson: Les) {
  if (lesson.end_at) {
    return lesson.end_at;
  }

  if (!lesson.start_at) {
    return null;
  }

  const endDate = new Date(lesson.start_at);
  endDate.setMinutes(endDate.getMinutes() + lesson.duur_minuten);
  return endDate.toISOString();
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
  students = [],
  availabilitySlots = [],
}: {
  lessons: Les[];
  requests?: LesAanvraag[];
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  tone?: CalendarTone;
  role?: CalendarRole | null;
  locationOptions?: LocationOption[];
  students?: InstructorStudentProgressRow[];
  availabilitySlots?: BeschikbaarheidSlot[];
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
  const lessonBusyWindows = useMemo(
    () =>
      lessons
        .filter((lesson) => lesson.start_at && getLessonEnd(lesson))
        .map((lesson) => ({
          id: lesson.id,
          label: lesson.leerling_naam || lesson.titel,
          start_at: lesson.start_at,
          end_at: getLessonEnd(lesson),
        })),
    [lessons]
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
              students={students}
              availabilitySlots={availabilitySlots}
              lessonBusyWindows={lessonBusyWindows}
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
