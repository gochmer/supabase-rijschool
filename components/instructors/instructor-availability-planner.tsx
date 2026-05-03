"use client";

import { useMemo, useState } from "react";
import {
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
import {
  filterAvailabilitySlotsByWeeklyLimit,
  formatMinutesAsHoursLabel,
  formatWeeklyLimitLabel,
  type WeeklyBookedMinutesMap,
} from "@/lib/self-scheduling-limits";
import type { BeschikbaarheidSlot } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  PlanningWeekView,
  type PlanningWeekItem,
} from "@/components/calendar/planning-week-view";
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
  directBookingEnabled = false,
  publicBookingEnabled = false,
  trialLessonAvailable = true,
  regularLessonDurationMinutes = 60,
  trialLessonDurationMinutes = 50,
  weeklyBookingLimitMinutes = null,
  weeklyBookingLimitSource = "none",
  bookedMinutesByWeekStart = {},
  weeklyRemainingMinutesThisWeek = null,
}: {
  instructorName: string;
  instructorSlug: string;
  slots: BeschikbaarheidSlot[];
  directBookingEnabled?: boolean;
  publicBookingEnabled?: boolean;
  trialLessonAvailable?: boolean;
  regularLessonDurationMinutes?: number;
  trialLessonDurationMinutes?: number;
  weeklyBookingLimitMinutes?: number | null;
  weeklyBookingLimitSource?: "manual" | "package" | "none";
  bookedMinutesByWeekStart?: WeeklyBookedMinutesMap;
  weeklyRemainingMinutesThisWeek?: number | null;
}) {
  const visibleSlots = useMemo(
    () =>
      filterAvailabilitySlotsByWeeklyLimit(
        slots,
        regularLessonDurationMinutes,
        weeklyBookingLimitMinutes,
        bookedMinutesByWeekStart
      ),
    [
      slots,
      regularLessonDurationMinutes,
      weeklyBookingLimitMinutes,
      bookedMinutesByWeekStart,
    ]
  );
  const entries = useMemo(
    () =>
      visibleSlots
        .map(createAvailabilityEntry)
        .filter(isAvailabilityEntry)
        .sort((left, right) => left.startAt.localeCompare(right.startAt)),
    [visibleSlots]
  );
  const blockedByWeeklyLimit =
    weeklyBookingLimitMinutes != null && slots.length > 0 && visibleSlots.length === 0;

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(
    entries[0]?.id ?? null
  );

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedSlotId) ?? entries[0] ?? null,
    [entries, selectedSlotId]
  );
  const planningItems = useMemo<Array<PlanningWeekItem<{ entry: AvailabilityEntry }>>>(
    () =>
      entries.flatMap((entry) => {
        const startAt = new Date(entry.startAt);
        const endAt = new Date(entry.endAt);

        if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
          return [];
        }

        return [
          {
            id: entry.id,
            kind: "available",
            title: "Open moment",
            startAt,
            endAt,
            typeLabel: "Live agenda",
            statusLabel: "Open",
            contextLabel: entry.durationLabel,
            actionLabel: directBookingEnabled
              ? "Boek dit moment"
              : "Vraag dit moment aan",
            ariaLabel: `${entry.dag} ${entry.tijdvak} selecteren`,
            meta: { entry },
          } satisfies PlanningWeekItem<{ entry: AvailabilityEntry }>,
        ];
      }),
    [directBookingEnabled, entries],
  );
  const weeklyLimitSourceLabel =
    weeklyBookingLimitSource === "manual"
      ? "Handmatig afgestemd"
      : weeklyBookingLimitSource === "package"
        ? "Volgt pakket"
        : "Geen vaste limiet";

  if (!entries.length) {
    return (
      <div className="surface-panel rounded-[1.35rem] p-6">
        <p className="text-xs font-semibold tracking-[0.22em] text-sky-700 uppercase">
          Live agenda
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Nog geen planning beschikbaar
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          {blockedByWeeklyLimit
            ? `Je persoonlijke weekruimte is bereikt. Er staan wel open momenten in de agenda, maar niet meer binnen jouw limiet van ${formatWeeklyLimitLabel(
                weeklyBookingLimitMinutes
              )}.`
            : "Deze instructeur heeft op dit moment nog geen momenten voor jou vrijgezet. Je kunt wel alvast een gewone aanvraag versturen, waarna de planning later wordt afgestemd."}
        </p>
        <div
          className={cn(
            "mt-5 grid gap-3",
            trialLessonAvailable ? "sm:grid-cols-2" : "sm:grid-cols-1"
          )}
        >
          <LessonRequestDialog
            instructorName={instructorName}
            instructorSlug={instructorSlug}
            availableSlots={slots}
            defaultDurationMinutes={regularLessonDurationMinutes}
            weeklyBookingLimitMinutes={weeklyBookingLimitMinutes}
            bookedMinutesByWeekStart={bookedMinutesByWeekStart}
            weeklyRemainingMinutesThisWeek={weeklyRemainingMinutesThisWeek}
            triggerLabel="Les aanvragen"
          />
          {trialLessonAvailable ? (
            <LessonRequestDialog
              instructorName={instructorName}
              instructorSlug={instructorSlug}
              requestType="proefles"
              availableSlots={slots}
              defaultDurationMinutes={trialLessonDurationMinutes}
              weeklyBookingLimitMinutes={weeklyBookingLimitMinutes}
              bookedMinutesByWeekStart={bookedMinutesByWeekStart}
              weeklyRemainingMinutesThisWeek={weeklyRemainingMinutesThisWeek}
              triggerLabel="Plan proefles"
              triggerVariant="secondary"
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="surface-panel rounded-[1.35rem] p-5 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.22em] text-sky-700 uppercase">
            Live agenda
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Plan zelf een moment bij {instructorName}
          </h3>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            {publicBookingEnabled
              ? directBookingEnabled
                ? "Deze instructeur heeft online zelf-inschrijven aangezet. Je ziet hieronder alleen vrije boekbare momenten uit de agenda."
                : "Deze instructeur toont hieronder alleen vrije online momenten. Log in als leerling om een gekozen blok direct te boeken of als aanvraag vast te zetten."
              : directBookingEnabled
                ? "Je ziet hieronder alleen vrije momenten die echt boekbaar zijn. Klik een blok aan en plan jezelf direct in."
                : "Klik een vrij blok aan en geef precies dat boekbare moment door als je voorkeursmoment."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">Live slots</Badge>
          <Badge variant={directBookingEnabled ? "success" : "warning"}>
            {publicBookingEnabled
              ? "Online boeking aan"
              : directBookingEnabled
                ? "Zelf plannen"
              : "Voorkeursmoment"}
          </Badge>
          {weeklyBookingLimitMinutes != null ? (
            <Badge variant="default">
              Limiet: {formatWeeklyLimitLabel(weeklyBookingLimitMinutes)}
            </Badge>
          ) : null}
          {weeklyBookingLimitSource !== "none" ? (
            <Badge
              variant={
                weeklyBookingLimitSource === "manual" ? "warning" : "success"
              }
            >
              {weeklyLimitSourceLabel}
            </Badge>
          ) : null}
        </div>
      </div>

      {weeklyBookingLimitMinutes != null ? (
        <div className="mt-4 rounded-[1.2rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-[13px] leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          Je ziet hier alleen vrije momenten die passen binnen jouw persoonlijke weekruimte.
          {weeklyRemainingMinutesThisWeek == null
            ? " Deze week staat onbeperkt open."
            : ` Nog over deze week: ${formatMinutesAsHoursLabel(
                weeklyRemainingMinutesThisWeek
              )}.`}
          {weeklyBookingLimitSource === "package"
            ? " Deze ruimte volgt automatisch het gekoppelde pakket."
            : weeklyBookingLimitSource === "manual"
              ? " Deze ruimte is handmatig door de instructeur op jouw traject afgestemd."
              : ""}
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1.75fr)_19.5rem]">
        <div className="min-w-0">
          <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/90 p-4 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_70px_-42px_rgba(2,6,23,0.55)] lg:p-5">
            <PlanningWeekView
              emptyLabel="Geen vrije momenten."
              initialAnchorDate={planningItems[0]?.startAt}
              items={planningItems}
              onSelectItem={(item) => {
                if (item.meta?.entry) {
                  setSelectedSlotId(item.meta.entry.id);
                }
              }}
              selectedItemId={selectedEntry?.id ?? null}
            />
          </div>
        </div>

        <div className="space-y-4 2xl:sticky 2xl:top-24 2xl:self-start">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4 shadow-[0_20px_52px_-38px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_20px_52px_-38px_rgba(2,6,23,0.5)] lg:p-5">
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">
              Geselecteerd moment
            </p>
            <h4 className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">
              {selectedEntry?.dag}
            </h4>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Alles rechts helpt je gekozen blok snel bevestigen.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                Beschikbaar
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {publicBookingEnabled
                  ? "Online boekbaar"
                  : directBookingEnabled
                    ? "Zelf in te plannen"
                    : "Als moment te kiezen"}
              </span>
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-white/90 p-4 shadow-[0_14px_34px_-26px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                    Tijdvak
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                    {selectedEntry?.tijdvak}
                  </p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-400/12 dark:text-sky-100">
                  <Clock3 className="size-4" />
                </div>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-1">
                <div className="rounded-[1rem] border border-slate-200 bg-slate-50/90 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                    Moment
                  </p>
                  <p className="mt-1 text-[13px] leading-6 font-medium text-slate-900 dark:text-slate-100">
                    {selectedEntry?.momentLabel}
                  </p>
                </div>
                <div className="rounded-[1rem] border border-slate-200 bg-slate-50/90 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                    Duur
                  </p>
                  <p className="mt-1 text-[13px] leading-6 font-medium text-slate-900 dark:text-slate-100">
                    {selectedEntry?.durationLabel}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[1rem] border border-emerald-200 bg-emerald-50/80 px-3.5 py-3 text-sm leading-6 text-emerald-800 dark:border-emerald-300/16 dark:bg-emerald-400/10 dark:text-emerald-100">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-emerald-700 dark:bg-white/10 dark:text-emerald-100">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {directBookingEnabled
                        ? "Na bevestigen staat dit moment direct in de agenda."
                        : "Na bevestigen gaat dit exacte tijdvak mee als voorkeursmoment."}
                    </p>
                    <p className="mt-1 text-[13px] leading-6 text-emerald-700/90 dark:text-emerald-100/80">
                      {trialLessonAvailable
                        ? "Je kunt hieronder nog een gewone les of proefles op dit blok starten."
                        : "Je kunt hieronder een gewone les op dit blok starten."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "mt-5 grid gap-3",
                trialLessonAvailable ? "sm:grid-cols-2" : "sm:grid-cols-1"
              )}
            >
                <LessonRequestDialog
                  instructorName={instructorName}
                  instructorSlug={instructorSlug}
                  availableSlots={slots}
                  directBookingEnabled={directBookingEnabled}
                  defaultSlotId={selectedEntry?.id}
                  defaultDurationMinutes={regularLessonDurationMinutes}
                  weeklyBookingLimitMinutes={weeklyBookingLimitMinutes}
                  bookedMinutesByWeekStart={bookedMinutesByWeekStart}
                  weeklyRemainingMinutesThisWeek={weeklyRemainingMinutesThisWeek}
                  triggerLabel={directBookingEnabled ? "Boek dit moment" : "Vraag dit moment aan"}
                  triggerClassName="!h-10 w-full"
                />
                {trialLessonAvailable ? (
                  <LessonRequestDialog
                    instructorName={instructorName}
                    instructorSlug={instructorSlug}
                    requestType="proefles"
                    availableSlots={slots}
                    directBookingEnabled={directBookingEnabled}
                    defaultSlotId={selectedEntry?.id}
                    defaultDurationMinutes={trialLessonDurationMinutes}
                    weeklyBookingLimitMinutes={weeklyBookingLimitMinutes}
                    bookedMinutesByWeekStart={bookedMinutesByWeekStart}
                    weeklyRemainingMinutesThisWeek={weeklyRemainingMinutesThisWeek}
                    triggerLabel={
                      directBookingEnabled
                        ? "Boek dit moment als proefles"
                        : "Vraag proefles op dit moment aan"
                    }
                    triggerVariant="secondary"
                    triggerClassName="!h-10 w-full"
                  />
                ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 2xl:grid-cols-1">
            {[
              { label: "Open momenten", value: `${entries.length}`, icon: CalendarDays },
              {
                label: "Eerst",
                value: entries[0]?.shortDay ?? "-",
                icon: Sparkles,
              },
              {
                label: "Lesduur",
                value: selectedEntry?.durationLabel ?? "-",
                icon: Clock3,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.3rem] border border-slate-200 bg-slate-50/90 p-4 text-slate-950 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-[0_16px_40px_-34px_rgba(2,6,23,0.5)]"
              >
                <div className="flex items-center gap-2">
                  <item.icon className="size-4 text-sky-700 dark:text-sky-300" />
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
