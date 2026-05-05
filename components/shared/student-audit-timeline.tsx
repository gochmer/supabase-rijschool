"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import type { StudentAuditTimelineEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const toneClassNames: Record<StudentAuditTimelineEvent["tone"], string> = {
  danger: "bg-red-400 shadow-[0_0_0_4px_rgba(248,113,113,0.16)]",
  info: "bg-sky-400 shadow-[0_0_0_4px_rgba(56,189,248,0.14)]",
  success: "bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.14)]",
  warning: "bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.16)]",
};

type AuditFilter = StudentAuditTimelineEvent["category"] | "alles";

const filterOptions: Array<{ label: string; value: AuditFilter }> = [
  { label: "Alles", value: "alles" },
  { label: "Pakket", value: "pakket" },
  { label: "Betaling", value: "betaling" },
  { label: "Planning", value: "planning" },
  { label: "Lessen", value: "lessen" },
];

export function StudentAuditTimeline({
  className,
  events = [],
  limit = 6,
  title = "Pakket-tijdlijn",
}: {
  className?: string;
  events?: StudentAuditTimelineEvent[];
  limit?: number;
  title?: string;
}) {
  const [activeFilter, setActiveFilter] = useState<AuditFilter>("alles");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const filteredEvents = useMemo(
    () =>
      activeFilter === "alles"
        ? events
        : events.filter((event) => event.category === activeFilter),
    [activeFilter, events],
  );
  const visibleEvents = filteredEvents.slice(0, limit);
  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedEventId) ?? null;

  function getFilterCount(value: AuditFilter) {
    return value === "alles"
      ? events.length
      : events.filter((event) => event.category === value).length;
  }

  return (
    <section
      className={cn(
        "rounded-[1.25rem] border border-slate-200 bg-slate-50/82 p-4 dark:border-white/10 dark:bg-white/[0.035]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
            {title}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Laatste pakket-, betaling- en planningsacties.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
          {events.length}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const count = getFilterCount(option.value);
          const active = activeFilter === option.value;

          return (
            <button
              key={option.value}
              type="button"
              data-audit-filter={option.value}
              onClick={() => {
                setActiveFilter(option.value);
                setSelectedEventId(null);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
                active
                  ? "border-slate-950 bg-slate-950 text-white dark:border-sky-300/30 dark:bg-white/12 dark:text-white"
                  : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300 dark:hover:border-white/18",
              )}
            >
              {option.label}
              <span className="ml-1.5 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        {visibleEvents.length ? (
          visibleEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              data-audit-event={event.eventType}
              onClick={() => setSelectedEventId(event.id)}
              className={cn(
                "grid w-full grid-cols-[0.75rem_minmax(0,1fr)] gap-3 rounded-xl border p-2.5 text-left transition",
                selectedEventId === event.id
                  ? "border-sky-300/45 bg-sky-500/8"
                  : "border-transparent hover:border-slate-200 hover:bg-white/70 dark:hover:border-white/10 dark:hover:bg-white/[0.04]",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 size-2.5 rounded-full",
                  toneClassNames[event.tone],
                )}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {event.title}
                  </p>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-500">
                    {event.createdAtLabel}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  {event.detail}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">
                  Door {event.actorLabel}
                </p>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-3 text-xs leading-5 text-slate-500 dark:border-white/12 dark:bg-white/[0.035] dark:text-slate-400">
            {events.length
              ? "Geen auditregels binnen dit filter."
              : "Nog geen pakket-audit. Zodra een pakket wordt gekoppeld, vervangen, betaald of losgekoppeld, verschijnt dat hier."}
          </div>
        )}
      </div>

      {selectedEvent ? (
        <div
          data-audit-detail-drawer
          className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-slate-950/58"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                Audit details
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                {selectedEvent.title}
              </h3>
            </div>
            <button
              type="button"
              aria-label="Audit details sluiten"
              onClick={() => setSelectedEventId(null)}
              className="rounded-full border border-slate-200 bg-slate-50 p-1.5 text-slate-500 transition hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.035]">
              <dt className="text-slate-500 dark:text-slate-500">Eventcode</dt>
              <dd className="mt-1 break-all font-semibold text-slate-900 dark:text-slate-200">
                {selectedEvent.eventType}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.035]">
              <dt className="text-slate-500 dark:text-slate-500">Categorie</dt>
              <dd className="mt-1 font-semibold capitalize text-slate-900 dark:text-slate-200">
                {selectedEvent.category}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.035]">
              <dt className="text-slate-500 dark:text-slate-500">Moment</dt>
              <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-200">
                {selectedEvent.createdAtLabel}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.035]">
              <dt className="text-slate-500 dark:text-slate-500">Actor</dt>
              <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-200">
                {selectedEvent.actorLabel}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
              Metadata
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {selectedEvent.metadata.length ? (
                selectedEvent.metadata.map((item) => (
                  <div
                    key={`${selectedEvent.id}-${item.label}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.035]"
                  >
                    <p className="text-[11px] text-slate-500 dark:text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1 break-words text-xs font-semibold text-slate-900 dark:text-slate-200">
                      {item.value}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500 dark:border-white/12 dark:bg-white/[0.035] dark:text-slate-400">
                  Geen extra metadata voor deze auditregel.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
