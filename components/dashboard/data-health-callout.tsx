import { AlertTriangle, Database, RefreshCw } from "lucide-react";

import type { DataHealthCheck } from "@/lib/data/data-health";
import { cn } from "@/lib/utils";

type DataHealthCalloutProps = {
  className?: string;
  label?: string;
  results: DataHealthCheck[];
  showAllEmptyState?: boolean;
};

export function DataHealthCallout({
  className,
  label = "Datastatus",
  results,
  showAllEmptyState = true,
}: DataHealthCalloutProps) {
  const failed = results.filter((item) => item.status === "error");
  const empty = results.filter((item) => item.status === "empty");
  const available = results.filter((item) => item.status === "available");

  if (failed.length) {
    return (
      <section
        className={cn(
          "rounded-xl border border-rose-300/18 bg-rose-500/10 p-4 text-rose-50 shadow-[0_22px_70px_-54px_rgba(0,0,0,0.92)]",
          className,
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-rose-200/20 bg-rose-300/10">
              <AlertTriangle className="size-5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-rose-100/75 uppercase">
                {label}
              </p>
              <h2 className="mt-1 text-base font-semibold text-white">
                Niet alle data kon worden geladen
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-rose-100/82">
                Dit is geen lege state. Supabase gaf een fout bij een of meer
                bronnen, dus de pagina toont geen stille fallback-data.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-100/18 bg-rose-100/10 px-3 py-1 text-xs font-semibold text-rose-50">
            <RefreshCw className="size-3.5" />
            Opnieuw laden kan helpen
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {failed.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-rose-100/12 bg-slate-950/24 p-3"
            >
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-xs text-rose-100/70">{item.source}</p>
              <p className="mt-2 text-xs leading-5 text-rose-50/78">
                {item.message}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (showAllEmptyState && empty.length && available.length === 0) {
    return (
      <section
        className={cn(
          "rounded-xl border border-sky-300/16 bg-sky-500/8 p-4 text-sky-50 shadow-[0_22px_70px_-54px_rgba(0,0,0,0.92)]",
          className,
        )}
      >
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-sky-200/18 bg-sky-300/10">
            <Database className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-sky-100/75 uppercase">
              {label}
            </p>
            <h2 className="mt-1 text-base font-semibold text-white">
              Geen records gevonden, database is bereikbaar
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-sky-100/78">
              De gekoppelde bronnen reageren goed, maar er zijn nog geen
              records om te tonen. Dit is dus een echte lege state, geen
              databasefout.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
