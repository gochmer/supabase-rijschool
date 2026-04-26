"use client";

import { useMemo, useState } from "react";

import type { InstructeurProfiel } from "@/lib/types";
import { DataTableCard } from "@/components/dashboard/data-table-card";
import { Input } from "@/components/ui/input";

export function ReviewsBoard({
  instructors,
}: {
  instructors: InstructeurProfiel[];
}) {
  const [query, setQuery] = useState("");
  const [transmissionFilter, setTransmissionFilter] = useState("alles");

  const filtered = useMemo(() => {
    return instructors.filter((instructor) => {
      const matchesQuery = instructor.volledige_naam
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesTransmission =
        transmissionFilter === "alles"
          ? true
          : instructor.transmissie === transmissionFilter ||
            (transmissionFilter === "beide" && instructor.transmissie === "beide");
      return matchesQuery && matchesTransmission;
    });
  }, [instructors, query, transmissionFilter]);

  return (
    <div className="space-y-5">
      <div className="rounded-[1.9rem] border border-white/70 bg-white/84 p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Zoek op instructeur"
            className="h-11 rounded-xl border-slate-200 bg-white"
          />
          <select
            value={transmissionFilter}
            onChange={(event) => setTransmissionFilter(event.target.value)}
            className="native-select h-11 rounded-xl px-3 text-sm"
          >
            <option value="alles">Alle transmissies</option>
            <option value="automaat">Automaat</option>
            <option value="handgeschakeld">Handgeschakeld</option>
            <option value="beide">Beide</option>
          </select>
        </div>
      </div>

      <DataTableCard
        title="Afgeronde lessen met reviewmogelijkheid"
        description="Na een afgeronde les kun je een beoordeling en geschreven review toevoegen."
        headers={["Instructeur", "Gemiddelde score", "Type", "Actie"]}
        rows={filtered.map((instructor) => [
          instructor.volledige_naam,
          String(instructor.beoordeling),
          instructor.transmissie,
          "Review schrijven",
        ])}
        emptyTitle="Geen reviewopties gevonden"
        emptyDescription="Pas je zoekterm of transmissiefilter aan."
      />
    </div>
  );
}
