"use client";

import { useMemo, useState } from "react";

import { DataTableCard } from "@/components/dashboard/data-table-card";

type UserRow = {
  id: string;
  naam: string;
  email: string;
  rol: string;
  status: string;
  laatsteActiviteit: string;
};

export function UsersManagementBoard({ users }: { users: UserRow[] }) {
  const [roleFilter, setRoleFilter] = useState("alles");
  const [sortBy, setSortBy] = useState("naam");

  const filtered = useMemo(() => {
    const next = users.filter((user) =>
      roleFilter === "alles" ? true : user.rol === roleFilter
    );

    if (sortBy === "rol") {
      return [...next].sort((a, b) => a.rol.localeCompare(b.rol));
    }

    if (sortBy === "recent") {
      return [...next].sort((a, b) =>
        b.laatsteActiviteit.localeCompare(a.laatsteActiviteit)
      );
    }

    return [...next].sort((a, b) => a.naam.localeCompare(b.naam));
  }, [roleFilter, sortBy, users]);

  return (
    <div className="space-y-5">
      <div className="rounded-[1.9rem] border border-white/70 bg-white/84 p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.6)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {["alles", "leerling", "instructeur", "admin"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRoleFilter(option)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  roleFilter === option
                    ? "border-slate-950 bg-slate-950 text-white dark:border-sky-300/30 dark:bg-white/10"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/16 dark:hover:text-white"
                }`}
              >
                {option === "alles" ? "Alle rollen" : option}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="native-select h-11 rounded-xl px-3 text-sm"
          >
            <option value="naam">Sorteer op naam</option>
            <option value="rol">Sorteer op rol</option>
            <option value="recent">Sorteer op recente activiteit</option>
          </select>
        </div>
      </div>

      <DataTableCard
        title="Gebruikers"
        description="Live overzicht van profielen, rollen en recente activiteit."
        headers={["Naam", "E-mail", "Rol", "Laatste activiteit"]}
        rows={filtered.map((user) => [
          user.naam,
          user.email,
          user.rol,
          user.laatsteActiviteit,
        ])}
        badgeColumns={[2]}
        emptyTitle="Geen gebruikers gevonden"
        emptyDescription="Pas je filters aan om meer resultaten te tonen."
      />
    </div>
  );
}
