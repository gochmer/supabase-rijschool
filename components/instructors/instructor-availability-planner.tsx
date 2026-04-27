"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventInput } from "@fullcalendar/core";
import nlLocale from "@fullcalendar/core/locales/nl";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Sparkles,
} from "lucide-react";

import {
  formatAvailabilityDuration,
  formatAvailabilityMoment,
  formatAvailabilityShortDay,
} from "@/lib/availability";
import type { BeschikbaarheidSlot } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LessonRequestDialog } from "@/components/instructors/lesson-request-dialog";

type AvailabilityEntry = {
  id: string;
  startAt: string;
  endAt: string;
  dag: string;
  tijdvak: string;
  momentLabel: string;
  shortDay: string;
  durationLabel: string;
};

function createAvailabilityEntry(slot: BeschikbaarheidSlot): AvailabilityEntry | null {
  if (!slot.start_at || !slot.eind_at) {
    return null;
  }

  return {
    id: slot.id,
    startAt: slot.start_at,
    endAt: slot.eind_at,
    dag: slot.dag,
    tijdvak: slot.tijdvak,
    momentLabel: formatAvailabilityMoment(slot.start_at, slot.eind_at),
    shortDay: formatAvailabilityShortDay(slot.start_at),
    durationLabel: formatAvailabilityDuration(slot.start_at, slot.eind_at),
  };
}

function isAvailabilityEntry(
  entry: AvailabilityEntry | null
): entry is AvailabilityEntry {
  return entry !== null;
}

export function InstructorAvailabilityPlanner({
  instructorName,
  instructorSlug,
  slots,
}: {
  instructorName: string;
  instructorSlug: string;
  slots: BeschikbaarheidSlot[];
}) {
  const [compact, setCompact] = useState(false);

  const entries = useMemo(
    () =>
      slots
        .map(createAvailabilityEntry)
        .filter(isAvailabilityEntry)
        .sort((left, right) => left.startAt.localeCompare(right.startAt)),
    [slots]
  );

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(
    entries[0]?.id ?? null
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 920px)");
    const sync = () => setCompact(media.matches);

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedSlotId) ?? entries[0] ?? null,
    [entries, selectedSlotId]
  );

  const events = useMemo<EventInput[]>(
    () =>
      entries.map((entry) => ({
        id: entry.id,
        title: "Beschikbaar",
        start: entry.startAt,
        end: entry.endAt,
        backgroundColor: "#dbeafe",
        borderColor: "#38bdf8",
        textColor: "#0f172a",
        classNames: ["lesson-calendar-event--availability"],
      })),
    [entries]
  );

  if (!entries.length) {
    return (
      <div className="rounded-[2rem] border border-white/80 bg-white/92 p-6 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(30,41,59,0.86),rgba(15,23,42,0.92))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
        <p className="text-xs font-semibold tracking-[0.22em] text-sky-700 uppercase">
          Live agenda
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Nog geen planning beschikbaar
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          Deze instructeur heeft op dit moment nog geen momenten voor jou vrijgezet. Je kunt
          wel alvast een gewone aanvraag versturen, waarna de planning later wordt afgestemd.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <LessonRequestDialog
            instructorName={instructorName}
            instructorSlug={instructorSlug}
            triggerLabel="Les aanvragen"
          />
          <LessonRequestDialog
            instructorName={instructorName}
            instructorSlug={instructorSlug}
            requestType="proefles"
            triggerLabel="Plan proefles"
            triggerVariant="secondary"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/80 bg-white/92 p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(30,41,59,0.86),rgba(15,23,42,0.92))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)] sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.22em] text-sky-700 uppercase">
            Live agenda
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Plan zelf een moment bij {instructorName}
          </h3>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Bekijk de actuele agenda van de instructeur, klik een beschikbaar blok aan en
            plan jezelf direct in op een moment dat echt vrij is.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">Live slots</Badge>
          <Badge variant="success">Zelf plannen</Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_19rem]">
        <div className="min-w-0">
          <div className="lesson-calendar-shell rounded-[1.7rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-3">
            <div className="lesson-calendar lesson-calendar--default">
              <FullCalendar
                key={compact ? "compact" : "wide"}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                locale={nlLocale}
                initialDate={selectedEntry?.startAt ?? undefined}
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
                eventClick={(info) => setSelectedSlotId(info.event.id)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">
              Geselecteerd moment
            </p>
            <h4 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
              {selectedEntry?.dag}
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                Beschikbaar
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Zelf in te plannen
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.18)] dark:bg-white/8 dark:text-slate-100 dark:shadow-none">
                  <Clock3 className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                    Tijdvak
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {selectedEntry?.tijdvak}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.18)] dark:bg-white/8 dark:text-slate-100 dark:shadow-none">
                  <CalendarClock className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                    Moment
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {selectedEntry?.momentLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.18)] dark:bg-white/8 dark:text-slate-100 dark:shadow-none">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                    Flow
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    Dit moment wordt direct vastgezet zodra je bevestigt.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <LessonRequestDialog
                instructorName={instructorName}
                instructorSlug={instructorSlug}
                availableSlots={slots}
                directBookingEnabled
                defaultSlotId={selectedEntry?.id}
                triggerLabel="Boek dit moment"
                triggerClassName="w-full"
              />
              <LessonRequestDialog
                instructorName={instructorName}
                instructorSlug={instructorSlug}
                requestType="proefles"
                availableSlots={slots}
                directBookingEnabled
                defaultSlotId={selectedEntry?.id}
                triggerLabel="Boek dit moment als proefles"
                triggerVariant="secondary"
                triggerClassName="w-full"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: "Open slots", value: `${entries.length}`, icon: CalendarDays },
              {
                label: "Eerstvolgende",
                value: entries[0]?.shortDay ?? "-",
                icon: Sparkles,
              },
              {
                label: "Duur",
                value: selectedEntry?.durationLabel ?? "-",
                icon: Clock3,
              },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-[1.3rem] border border-slate-200 bg-slate-50/90 p-4 text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white"
                )}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="size-4 text-sky-700" />
                  <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
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
