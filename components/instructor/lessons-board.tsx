"use client";

import { useMemo, useState } from "react";

import type { Les, LesAanvraag } from "@/lib/types";
import { LessonCalendar } from "@/components/calendar/lesson-calendar";
import { DataTableCard } from "@/components/dashboard/data-table-card";
import { Input } from "@/components/ui/input";

export function LessonsBoard({
  lessons,
  requests = [],
}: {
  lessons: Les[];
  requests?: LesAanvraag[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("alles");

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesQuery = `${lesson.titel} ${lesson.leerling_naam} ${lesson.locatie}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "alles" ? true : lesson.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [lessons, query, statusFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesQuery = `${request.leerling_naam} ${request.aanvraag_type ?? ""} ${request.pakket_naam ?? ""} ${request.tijdvak} ${request.bericht}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "alles" ? true : request.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, requests, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="rounded-[1.9rem] border border-white/70 bg-white/84 p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.6)]">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Zoek op les, leerling of locatie"
            className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="native-select h-11 rounded-xl px-3 text-sm"
          >
            <option value="alles">Alle statussen</option>
            <option value="aangevraagd">Aangevraagd</option>
            <option value="ingepland">Ingepland</option>
            <option value="geaccepteerd">Geaccepteerd</option>
            <option value="geweigerd">Geweigerd</option>
            <option value="afgerond">Afgerond</option>
            <option value="geannuleerd">Geannuleerd</option>
          </select>
        </div>
      </div>

      <LessonCalendar
        lessons={filteredLessons}
        requests={filteredRequests}
        title="Agenda"
        description="Bekijk je bevestigde lessen en open aanvragen in kalenderweergave en houd direct overzicht op dag-, week- en maandniveau."
        emptyDescription="Er zijn nog geen lessen of aanvragen die aan deze filters voldoen. Pas je zoekopdracht aan of plan nieuwe lessen in."
      />

      <DataTableCard
        title="Lessenoverzicht"
        description="Professioneel overzicht voor planning, opvolging en voortgang."
        headers={["Les", "Leerling", "Datum", "Status", "Locatie"]}
        rows={filteredLessons.map((lesson) => [
          lesson.titel,
          lesson.leerling_naam,
          `${lesson.datum} - ${lesson.tijd}`,
          lesson.status,
          lesson.locatie,
        ])}
        badgeColumns={[3]}
        emptyTitle="Geen lessen gevonden"
        emptyDescription="Probeer een andere zoekterm of statusfilter."
      />
    </div>
  );
}
