"use client";

import { useMemo, useState } from "react";

import { PackageAssignmentSelect } from "@/components/admin/package-assignment-select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Student = {
  id: string;
  naam: string;
  email: string;
  telefoon: string;
  pakket: string;
  voortgang: string;
  status: string;
};

export function StudentsManagementBoard({
  students,
  packages,
}: {
  students: Student[];
  packages: Array<{ id: string; naam: string }>;
}) {
  const [filter, setFilter] = useState("alles");
  const [sortBy, setSortBy] = useState("voortgang");

  const filtered = useMemo(() => {
    const next = students.filter((student) => {
      if (filter === "met-pakket") {
        return student.pakket !== "Nog geen pakket";
      }

      if (filter === "zonder-pakket") {
        return student.pakket === "Nog geen pakket";
      }

      if (filter === "actief") {
        return student.status === "actief";
      }

      return true;
    });

    if (sortBy === "naam") {
      return [...next].sort((a, b) => a.naam.localeCompare(b.naam));
    }

    if (sortBy === "pakket") {
      return [...next].sort((a, b) => a.pakket.localeCompare(b.pakket));
    }

    return [...next].sort((a, b) => {
      const aValue = Number(a.voortgang.replace("%", ""));
      const bValue = Number(b.voortgang.replace("%", ""));
      return bValue - aValue;
    });
  }, [filter, sortBy, students]);

  return (
    <div className="space-y-5">
      <div className="rounded-[1.9rem] border border-white/70 bg-white/84 p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.6)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              ["alles", "Alle leerlingen"],
              ["met-pakket", "Met pakket"],
              ["zonder-pakket", "Zonder pakket"],
              ["actief", "Actief"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  filter === value
                    ? "border-slate-950 bg-slate-950 text-white dark:border-sky-300/30 dark:bg-white/10"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/16 dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="native-select h-11 rounded-xl px-3 text-sm"
          >
            <option value="voortgang">Sorteer op voortgang</option>
            <option value="naam">Sorteer op naam</option>
            <option value="pakket">Sorteer op pakket</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map((student) => (
          <Card
            key={student.id}
            className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]"
          >
            <CardHeader>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <CardTitle>{student.naam}</CardTitle>
                  <CardDescription>
                    {student.email} • {student.telefoon || "Geen telefoonnummer"}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">Voortgang {student.voortgang}</Badge>
                  <Badge variant={student.status === "actief" ? "success" : "warning"}>
                    {student.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-slate-50/80 p-4 dark:bg-white/5">
                  <p className="text-sm text-muted-foreground dark:text-slate-300">Huidig pakket</p>
                  <p className="mt-1 font-semibold dark:text-white">{student.pakket}</p>
                </div>
                <div className="rounded-[1.5rem] bg-slate-50/80 p-4 dark:bg-white/5">
                  <p className="text-sm text-muted-foreground dark:text-slate-300">Accountstatus</p>
                  <p className="mt-1 font-semibold capitalize dark:text-white">{student.status}</p>
                </div>
              </div>
              <PackageAssignmentSelect
                leerlingId={student.id}
                currentPackageName={student.pakket}
                packages={packages}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
