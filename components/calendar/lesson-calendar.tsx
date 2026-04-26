"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventInput } from "@fullcalendar/core";
import nlLocale from "@fullcalendar/core/locales/nl";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import {
  CalendarDays,
  Clock3,
  MapPin,
  MessageSquare,
  UserRound,
} from "lucide-react";

import type { Les, LesAanvraag, LesStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type CalendarEntry = {
  id: string;
  kind: "lesson" | "request";
  title: string;
  status: LesStatus;
  start_at: string;
  end_at?: string | null;
  momentLabel: string;
  contextLabel: string;
  contactLabel: string;
  note?: string;
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
            eventBg: "#06b6d4",
            eventBorder: "#67e8f9",
            eventText: "#082f49",
            pillClassName:
              "border border-cyan-300/20 bg-cyan-400/12 text-cyan-100",
          };
        case "geannuleerd":
        case "geweigerd":
          return {
            eventBg: "#f43f5e",
            eventBorder: "#fb7185",
            eventText: "#fff1f2",
            pillClassName:
              "border border-rose-300/20 bg-rose-400/12 text-rose-100",
          };
        case "aangevraagd":
        default:
          return {
            eventBg: "#f59e0b",
            eventBorder: "#fbbf24",
            eventText: "#1c1200",
            pillClassName:
              "border border-amber-300/20 bg-amber-400/12 text-amber-100",
          };
      }
    }

    switch (status) {
      case "geaccepteerd":
        return {
          eventBg: "#cffafe",
          eventBorder: "#67e8f9",
          eventText: "#155e75",
          pillClassName: "border border-cyan-200 bg-cyan-50 text-cyan-700",
        };
      case "geannuleerd":
      case "geweigerd":
        return {
          eventBg: "#ffe4e6",
          eventBorder: "#fda4af",
          eventText: "#be123c",
          pillClassName: "border border-rose-200 bg-rose-50 text-rose-700",
        };
      case "aangevraagd":
      default:
        return {
          eventBg: "#fef3c7",
          eventBorder: "#fcd34d",
          eventText: "#92400e",
          pillClassName: "border border-amber-200 bg-amber-50 text-amber-700",
        };
    }
  }

  if (tone === "urban") {
    switch (status) {
      case "geaccepteerd":
        return {
          eventBg: "#10b981",
          eventBorder: "#34d399",
          eventText: "#04130f",
          pillClassName:
            "border border-emerald-300/20 bg-emerald-400/12 text-emerald-100",
        };
      case "ingepland":
        return {
          eventBg: "#38bdf8",
          eventBorder: "#7dd3fc",
          eventText: "#07111f",
          pillClassName:
            "border border-sky-300/20 bg-sky-400/12 text-sky-100",
        };
      case "afgerond":
        return {
          eventBg: "#64748b",
          eventBorder: "#94a3b8",
          eventText: "#f8fafc",
          pillClassName:
            "border border-slate-300/16 bg-slate-200/10 text-slate-100",
        };
      case "geannuleerd":
      case "geweigerd":
        return {
          eventBg: "#f43f5e",
          eventBorder: "#fb7185",
          eventText: "#fff1f2",
          pillClassName:
            "border border-rose-300/20 bg-rose-400/12 text-rose-100",
        };
      case "aangevraagd":
      default:
        return {
          eventBg: "#f59e0b",
          eventBorder: "#fbbf24",
          eventText: "#1c1200",
          pillClassName:
            "border border-amber-300/20 bg-amber-400/12 text-amber-100",
        };
    }
  }

  switch (status) {
    case "geaccepteerd":
      return {
        eventBg: "#d1fae5",
        eventBorder: "#6ee7b7",
        eventText: "#065f46",
        pillClassName:
          "border border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "ingepland":
      return {
        eventBg: "#e0f2fe",
        eventBorder: "#7dd3fc",
        eventText: "#075985",
        pillClassName: "border border-sky-200 bg-sky-50 text-sky-700",
      };
    case "afgerond":
      return {
        eventBg: "#e2e8f0",
        eventBorder: "#cbd5e1",
        eventText: "#334155",
        pillClassName: "border border-slate-200 bg-slate-100 text-slate-700",
      };
    case "geannuleerd":
    case "geweigerd":
      return {
        eventBg: "#ffe4e6",
        eventBorder: "#fda4af",
        eventText: "#be123c",
        pillClassName: "border border-rose-200 bg-rose-50 text-rose-700",
      };
    case "aangevraagd":
    default:
      return {
        eventBg: "#fef3c7",
        eventBorder: "#fcd34d",
        eventText: "#92400e",
        pillClassName: "border border-amber-200 bg-amber-50 text-amber-700",
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

  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;

  const dateLabel = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(start);

  const timeFormatter = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${dateLabel} - ${timeFormatter.format(start)}${
    end ? ` - ${timeFormatter.format(end)}` : ""
  }`;
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
    start_at: lesson.start_at,
    end_at: lesson.end_at,
    momentLabel: formatMomentRange(
      lesson.start_at,
      lesson.end_at,
      `${lesson.datum} om ${lesson.tijd}`
    ),
    contextLabel: lesson.locatie,
    contactLabel:
      lesson.instructeur_naam || lesson.leerling_naam || "Nog niet gekoppeld",
    note: "",
  };
}

function createRequestEntry(request: LesAanvraag): CalendarEntry | null {
  if (
    !request.start_at ||
    !["aangevraagd", "geaccepteerd"].includes(request.status)
  ) {
    return null;
  }

  const contactLabel =
    request.instructeur_naam || request.leerling_naam || "Nog niet gekoppeld";

  return {
    id: `request-${request.id}`,
    kind: "request",
    title: request.aanvraag_type === "proefles"
      ? `Proefles - ${contactLabel}`
      : request.pakket_naam
      ? `${request.pakket_naam} - ${contactLabel}`
      : `Aanvraag - ${contactLabel}`,
    status: request.status,
    start_at: request.start_at,
    end_at: request.end_at,
    momentLabel: formatMomentRange(
      request.start_at,
      request.end_at,
      `${request.voorkeursdatum} - ${request.tijdvak}`
    ),
    contextLabel:
      request.status === "geaccepteerd"
        ? request.aanvraag_type === "proefles"
          ? "Voorlopig bevestigd - Proefles"
          : request.pakket_naam
          ? `Voorlopig bevestigd - ${request.pakket_naam}`
          : `Voorlopig bevestigd - ${request.tijdvak}`
        : request.aanvraag_type === "proefles"
          ? `Voorkeursblok ${request.tijdvak} • Proefles`
        : request.pakket_naam
          ? `Voorkeursblok ${request.tijdvak} • ${request.pakket_naam}`
          : `Voorkeursblok ${request.tijdvak}`,
    contactLabel,
    note: request.bericht,
  };
}

export function LessonCalendar({
  lessons,
  requests = [],
  title = "Agenda",
  description = "Bekijk je lessen in een heldere kalenderweergave.",
  emptyTitle = "Nog geen lessen in de agenda",
  emptyDescription = "Zodra lessen bevestigd zijn, verschijnen ze hier automatisch in je kalender.",
  tone = "default",
}: {
  lessons: Les[];
  requests?: LesAanvraag[];
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  tone?: "default" | "urban";
}) {
  const [compact, setCompact] = useState(false);
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
        left.start_at.localeCompare(right.start_at)
      ),
    [calendarLessons, calendarRequests]
  );

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    calendarEntries[0]?.id ?? null
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 920px)");
    const sync = () => setCompact(media.matches);

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const selectedEntry = useMemo(
    () =>
      calendarEntries.find((entry) => entry.id === selectedEntryId) ??
      calendarEntries[0] ??
      null,
    [calendarEntries, selectedEntryId]
  );

  const events = useMemo<EventInput[]>(
    () =>
      calendarEntries.map((entry) => {
        const statusMeta = getStatusMeta(entry.status, tone, entry.kind);

        return {
          id: entry.id,
          title: entry.title,
          start: entry.start_at,
          end: entry.end_at ?? undefined,
          backgroundColor: statusMeta.eventBg,
          borderColor: statusMeta.eventBorder,
          textColor: statusMeta.eventText,
          classNames:
            entry.kind === "request"
              ? ["lesson-calendar-event--request"]
              : ["lesson-calendar-event--lesson"],
        };
      }),
    [calendarEntries, tone]
  );

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
            Kalenderoverzicht
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
                item.meta.pillClassName
              )}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1.15fr)_19rem]">
        <div className="min-w-0">
          <div
            className={cn(
              "lesson-calendar-shell rounded-[1.7rem] p-3",
              isUrban
                ? "border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,21,0.96),rgba(17,24,39,0.94),rgba(24,32,47,0.94))]"
                : "border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(30,41,59,0.88),rgba(15,23,42,0.94))]"
            )}
          >
            <div
              className={cn(
                "lesson-calendar",
                isUrban ? "lesson-calendar--urban" : "lesson-calendar--default"
              )}
            >
              <FullCalendar
                key={compact ? "compact" : "wide"}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                locale={nlLocale}
                initialDate={selectedEntry?.start_at ?? undefined}
                initialView={compact ? "dayGridMonth" : "timeGridWeek"}
                headerToolbar={
                  compact
                    ? {
                        left: "prev,next",
                        center: "title",
                        right: "dayGridMonth,timeGridDay",
                      }
                    : {
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,timeGridWeek,timeGridDay",
                      }
                }
                buttonText={{
                  today: "Vandaag",
                  month: "Maand",
                  week: "Week",
                  day: "Dag",
                }}
                firstDay={1}
                allDaySlot={false}
                nowIndicator
                height="auto"
                fixedWeekCount={false}
                dayMaxEventRows={compact ? 2 : 3}
                slotMinTime="07:00:00"
                slotMaxTime="22:00:00"
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }}
                slotLabelFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }}
                eventOrder="start,-duration,title"
                events={events}
                eventClick={(info) => setSelectedEntryId(info.event.id)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 self-start 2xl:sticky 2xl:top-6">
          <div
            className={cn(
              "rounded-[1.5rem] p-4",
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
                "mt-3 text-lg font-semibold",
                isUrban ? "text-white" : "text-slate-950 dark:text-white"
              )}
            >
              {selectedEntry?.title}
            </h4>
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
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
                  {selectedEntry?.kind === "request" ? "Aanvraag" : "Les"}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
                    selectedEntry
                      ? getStatusMeta(
                          selectedEntry.status,
                          tone,
                          selectedEntry.kind
                        ).pillClassName
                      : ""
                  )}
                >
                  {selectedEntry?.status}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-2xl",
                    isUrban ? "bg-white/8 text-slate-100" : "bg-slate-100 text-slate-700 dark:bg-white/8 dark:text-slate-100"
                  )}
                >
                  <Clock3 className="size-4" />
                </div>
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
                      "mt-1 text-sm leading-6",
                      isUrban ? "text-slate-100" : "text-slate-700 dark:text-slate-200"
                    )}
                  >
                    {selectedEntry?.momentLabel ?? "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-2xl",
                    isUrban ? "bg-white/8 text-slate-100" : "bg-slate-100 text-slate-700 dark:bg-white/8 dark:text-slate-100"
                  )}
                >
                  <MapPin className="size-4" />
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs font-semibold tracking-[0.16em] uppercase",
                      isUrban ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    Context
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm leading-6",
                      isUrban ? "text-slate-100" : "text-slate-700 dark:text-slate-200"
                    )}
                  >
                    {selectedEntry?.contextLabel ?? "Nog onbekend"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-2xl",
                    isUrban ? "bg-white/8 text-slate-100" : "bg-slate-100 text-slate-700 dark:bg-white/8 dark:text-slate-100"
                  )}
                >
                  <UserRound className="size-4" />
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs font-semibold tracking-[0.16em] uppercase",
                      isUrban ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    Contact
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm leading-6",
                      isUrban ? "text-slate-100" : "text-slate-700 dark:text-slate-200"
                    )}
                  >
                    {selectedEntry?.contactLabel ?? "Nog niet gekoppeld"}
                  </p>
                </div>
              </div>

              {selectedEntry?.note ? (
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-2xl",
                      isUrban ? "bg-white/8 text-slate-100" : "bg-slate-100 text-slate-700 dark:bg-white/8 dark:text-slate-100"
                    )}
                  >
                    <MessageSquare className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-xs font-semibold tracking-[0.16em] uppercase",
                        isUrban ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      Bericht
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-sm leading-6",
                        isUrban ? "text-slate-100" : "text-slate-700 dark:text-slate-200"
                      )}
                    >
                      {selectedEntry.note}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "grid gap-3 sm:grid-cols-2 xl:grid-cols-1",
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
