"use client";

import { useMemo, useState } from "react";
import { Download, Search, ShieldCheck, X } from "lucide-react";

import type { AdminAuditLogEvent, StudentAuditTimelineEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AuditCategory = AdminAuditLogEvent["category"] | "alles";
type AuditActorRole = AdminAuditLogEvent["actorRole"] | "alles";

const categoryOptions: Array<{ label: string; value: AuditCategory }> = [
  { label: "Alles", value: "alles" },
  { label: "Pakket", value: "pakket" },
  { label: "Betaling", value: "betaling" },
  { label: "Planning", value: "planning" },
  { label: "Lessen", value: "lessen" },
  { label: "Overig", value: "overig" },
];

const actorRoleOptions: Array<{ label: string; value: AuditActorRole }> = [
  { label: "Alle rollen", value: "alles" },
  { label: "Admin", value: "admin" },
  { label: "Instructeur", value: "instructeur" },
  { label: "Leerling", value: "leerling" },
  { label: "Systeem", value: "system" },
];

const toneClassNames: Record<StudentAuditTimelineEvent["tone"], string> = {
  danger: "border-red-300/24 bg-red-500/10 text-red-700 dark:text-red-200",
  info: "border-sky-300/24 bg-sky-500/10 text-sky-700 dark:text-sky-200",
  success:
    "border-emerald-300/24 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  warning:
    "border-amber-300/28 bg-amber-500/10 text-amber-700 dark:text-amber-200",
};

function includesSearch(value: string | null | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query);
}

function getDateInputValue(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function buildAuditExportUrl({
  actorRole,
  category,
  dateFrom,
  dateTo,
  query,
}: {
  actorRole: AuditActorRole;
  category: AuditCategory;
  dateFrom: string;
  dateTo: string;
  query: string;
}) {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set("q", query.trim());
  }

  if (category !== "alles") {
    params.set("category", category);
  }

  if (actorRole !== "alles") {
    params.set("actorRole", actorRole);
  }

  if (dateFrom) {
    params.set("from", dateFrom);
  }

  if (dateTo) {
    params.set("to", dateTo);
  }

  return `/api/admin/audit/export${params.size ? `?${params.toString()}` : ""}`;
}

export function AuditLogBoard({ events }: { events: AdminAuditLogEvent[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AuditCategory>("alles");
  const [actorRole, setActorRole] = useState<AuditActorRole>("alles");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    events[0]?.id ?? null,
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        if (category !== "alles" && event.category !== category) {
          return false;
        }

        if (actorRole !== "alles" && event.actorRole !== actorRole) {
          return false;
        }

        const eventDate = getDateInputValue(event.createdAt);
        if (dateFrom && eventDate < dateFrom) {
          return false;
        }

        if (dateTo && eventDate > dateTo) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const metadataText = event.metadata
          .map((item) => `${item.label} ${item.value}`)
          .join(" ");

        return [
          event.actorLabel,
          event.betalingLabel,
          event.category,
          event.detail,
          event.entityId,
          event.entityType,
          event.eventType,
          event.leerlingLabel,
          event.pakketLabel,
          event.title,
          metadataText,
        ].some((value) => includesSearch(value, normalizedQuery));
      }),
    [actorRole, category, dateFrom, dateTo, events, normalizedQuery],
  );
  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedEventId) ??
    filteredEvents[0] ??
    null;
  const paymentCount = events.filter((event) => event.category === "betaling").length;
  const planningCount = events.filter((event) => event.category === "planning").length;
  const packageCount = events.filter((event) => event.category === "pakket").length;

  return (
    <div data-admin-audit-board className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Auditregels", events.length],
          ["Pakketacties", packageCount],
          ["Betalingen", paymentCount],
          ["Planning", planningCount],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[1.5rem] border border-white/70 bg-white/86 p-4 shadow-[0_22px_70px_-46px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/[0.045]"
          >
            <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
              {value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-[1.75rem] border border-white/70 bg-white/88 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
        <div className="grid gap-3 xl:grid-cols-[minmax(18rem,1fr)_auto_auto_auto_auto] xl:items-end">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Zoeken
            </span>
            <span className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/[0.045]">
              <Search className="size-4 text-slate-400" />
              <input
                data-admin-audit-search
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Leerling, actor, pakket, betaling, eventcode..."
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
              />
            </span>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Categorie
            </span>
            <select
              data-admin-audit-category
              value={category}
              onChange={(event) => setCategory(event.target.value as AuditCategory)}
              className="native-select h-11 rounded-2xl px-3 text-sm"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Actor
            </span>
            <select
              value={actorRole}
              onChange={(event) => setActorRole(event.target.value as AuditActorRole)}
              className="native-select h-11 rounded-2xl px-3 text-sm"
            >
              {actorRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Vanaf
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="native-input h-11 rounded-2xl px-3 text-sm"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Tot
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="native-input h-11 rounded-2xl px-3 text-sm"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filteredEvents.length} van {events.length} auditregels zichtbaar.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuery("");
                setCategory("alles");
                setActorRole("alles");
                setDateFrom("");
                setDateTo("");
                setSelectedEventId(events[0]?.id ?? null);
              }}
            >
              <X className="size-4" />
              Wissen
            </Button>
            <Button
              type="button"
              data-admin-audit-export
              onClick={() => {
                window.location.href = buildAuditExportUrl({
                  actorRole,
                  category,
                  dateFrom,
                  dateTo,
                  query,
                });
              }}
            >
              <Download className="size-4" />
              Server CSV
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Export gebruikt dezelfde filters server-side en is admin-only. De preview
          toont maximaal recente regels, de CSV kan tot 10.000 auditregels ophalen.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
        <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-white/[0.045]">
          <div className="grid grid-cols-[8rem_1fr_10rem_10rem] gap-3 border-b border-slate-200 px-4 py-3 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase dark:border-white/10 dark:text-slate-400 max-lg:hidden">
            <span>Moment</span>
            <span>Gebeurtenis</span>
            <span>Leerling</span>
            <span>Pakket/betaling</span>
          </div>
          <div className="max-h-[38rem] overflow-auto">
            {filteredEvents.length ? (
              filteredEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  data-admin-audit-row={event.eventType}
                  onClick={() => setSelectedEventId(event.id)}
                  className={cn(
                    "grid w-full gap-3 border-b border-slate-200 px-4 py-3 text-left transition last:border-b-0 dark:border-white/10 lg:grid-cols-[8rem_1fr_10rem_10rem]",
                    selectedEvent?.id === event.id
                      ? "bg-sky-500/10"
                      : "hover:bg-slate-50 dark:hover:bg-white/[0.04]",
                  )}
                >
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {event.createdAtLabel}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                          toneClassNames[event.tone],
                        )}
                      >
                        {event.title}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {event.eventType}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">
                      {event.detail}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {event.leerlingLabel}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {event.pakketLabel}
                    <span className="block">{event.betalingLabel}</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="p-8 text-center">
                <ShieldCheck className="mx-auto size-8 text-slate-400" />
                <p className="mt-3 font-semibold text-slate-900 dark:text-white">
                  Geen auditregels gevonden
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Pas je filters aan of wacht tot er nieuwe pakketacties worden uitgevoerd.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
          {selectedEvent ? (
            <div data-admin-audit-detail className="space-y-5">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                  Audit detail
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                  {selectedEvent.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {selectedEvent.detail}
                </p>
              </div>

              <div className="grid gap-2 text-xs">
                {[
                  ["Eventcode", selectedEvent.eventType],
                  ["Categorie", selectedEvent.category],
                  ["Actor", selectedEvent.actorLabel],
                  ["Leerling", selectedEvent.leerlingLabel],
                  ["Pakket", selectedEvent.pakketLabel],
                  ["Betaling", selectedEvent.betalingLabel],
                  ["Entiteit", selectedEvent.entityType],
                  ["Entiteit-id", selectedEvent.entityId ?? "-"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.035]"
                  >
                    <p className="text-slate-500 dark:text-slate-500">{label}</p>
                    <p className="mt-1 break-all font-semibold text-slate-950 dark:text-slate-200">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                  Metadata
                </p>
                <div className="mt-2 grid gap-2">
                  {selectedEvent.metadata.length ? (
                    selectedEvent.metadata.map((item) => (
                      <div
                        key={`${selectedEvent.id}-${item.label}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.035]"
                      >
                        <p className="text-[11px] text-slate-500 dark:text-slate-500">
                          {item.label}
                        </p>
                        <p className="mt-1 break-words text-xs font-semibold text-slate-950 dark:text-slate-200">
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
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-white/12 dark:text-slate-400">
              Selecteer een auditregel om details te bekijken.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
