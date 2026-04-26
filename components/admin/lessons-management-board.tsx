"use client";

import { useMemo, useState } from "react";

import { DataTableCard } from "@/components/dashboard/data-table-card";
import { Input } from "@/components/ui/input";

type Lesson = {
  id: string;
  titel: string;
  leerling: string;
  instructeur: string;
  status: string;
  datum: string;
  locatie: string;
};

export function LessonsManagementBoard({ lessons }: { lessons: Lesson[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("alles");

  const filtered = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesQuery = `${lesson.titel} ${lesson.leerling} ${lesson.instructeur} ${lesson.locatie}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "alles" ? true : lesson.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [lessons, query, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="rounded-[1.9rem] border border-white/70 bg-white/84 p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.6)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Zoek op les, leerling, instructeur of locatie"
            className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="native-select h-11 rounded-xl px-3 text-sm"
          >
            <option value="alles">Alle statussen</option>
            <option value="ingepland">Ingepland</option>
            <option value="geaccepteerd">Geaccepteerd</option>
            <option value="afgerond">Afgerond</option>
            <option value="geannuleerd">Geannuleerd</option>
          </select>
        </div>
      </div>

      <DataTableCard
        title="Lessen"
        description="Live inzicht in lesactiviteiten binnen het platform."
        headers={["Les", "Leerling", "Instructeur", "Datum", "Status", "Locatie"]}
        rows={filtered.map((lesson) => [
          lesson.titel,
          lesson.leerling,
          lesson.instructeur,
          lesson.datum,
          lesson.status,
          lesson.locatie,
        ])}
        badgeColumns={[4]}
        emptyTitle="Geen lessen gevonden"
        emptyDescription="Pas je zoekopdracht of statusfilter aan om resultaten te tonen."
      />
    </div>
  );
}
