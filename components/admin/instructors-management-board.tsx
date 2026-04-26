"use client";

import { useMemo, useState } from "react";

import { ApprovalActions } from "@/components/admin/approval-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Instructor = {
  id: string;
  naam: string;
  email: string;
  telefoon: string;
  werkgebied: string;
  profiel: string;
  status: string;
  prijs: string;
  transmissie: string;
};

export function InstructorsManagementBoard({
  instructors,
}: {
  instructors: Instructor[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("alles");
  const [sortBy, setSortBy] = useState("naam");

  const filtered = useMemo(() => {
    const next = instructors.filter((instructor) => {
      const matchesQuery = `${instructor.naam} ${instructor.email} ${instructor.werkgebied}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "alles" ? true : instructor.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    if (sortBy === "profiel") {
      return [...next].sort(
        (a, b) => Number(b.profiel.replace("%", "")) - Number(a.profiel.replace("%", ""))
      );
    }

    if (sortBy === "status") {
      return [...next].sort((a, b) => a.status.localeCompare(b.status));
    }

    return [...next].sort((a, b) => a.naam.localeCompare(b.naam));
  }, [instructors, query, sortBy, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="rounded-[1.9rem] border border-white/70 bg-white/84 p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.6)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Zoek op naam, e-mail of werkgebied"
            className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="native-select h-11 rounded-xl px-3 text-sm"
          >
            <option value="alles">Alle statussen</option>
            <option value="goedgekeurd">Goedgekeurd</option>
            <option value="in_beoordeling">In beoordeling</option>
            <option value="concept">Concept</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="native-select h-11 rounded-xl px-3 text-sm"
          >
            <option value="naam">Sorteer op naam</option>
            <option value="status">Sorteer op status</option>
            <option value="profiel">Sorteer op profiel</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map((instructor) => (
          <Card
            key={instructor.id}
            className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]"
          >
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <CardTitle>{instructor.naam}</CardTitle>
                  <CardDescription>
                    {instructor.email} • {instructor.telefoon || "Geen telefoon"}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    instructor.status === "goedgekeurd"
                      ? "success"
                      : instructor.status === "afgewezen"
                        ? "danger"
                        : "warning"
                  }
                >
                  {instructor.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid gap-2 text-sm text-muted-foreground dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
                <div>Werkgebied: {instructor.werkgebied}</div>
                <div>Profiel: {instructor.profiel}</div>
                <div>Prijs: {instructor.prijs}</div>
                <div className="capitalize">Transmissie: {instructor.transmissie}</div>
              </div>
              <ApprovalActions instructorId={instructor.id} status={instructor.status} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
