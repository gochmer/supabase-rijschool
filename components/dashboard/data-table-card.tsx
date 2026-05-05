import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function getBadgeVariant(value: string) {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("betaald") ||
    normalized.includes("goedgekeurd") ||
    normalized.includes("geaccepteerd") ||
    normalized.includes("ingepland") ||
    normalized.includes("actief") ||
    normalized.includes("beschikbaar") ||
    normalized.includes("succes")
  ) {
    return "success" as const;
  }

  if (
    normalized.includes("open") ||
    normalized.includes("aangevraagd") ||
    normalized.includes("in_afwachting") ||
    normalized.includes("waarschuwing") ||
    normalized.includes("gemarkeerd")
  ) {
    return "warning" as const;
  }

  if (
    normalized.includes("geweigerd") ||
    normalized.includes("geannuleerd") ||
    normalized.includes("verborgen") ||
    normalized.includes("mislukt")
  ) {
    return "danger" as const;
  }

  return "info" as const;
}

export function DataTableCard({
  title,
  description,
  headers,
  rows,
  badgeColumns = [],
  emptyTitle = "Nog geen data beschikbaar",
  emptyDescription = "Zodra er activiteit is, verschijnt hier automatisch een overzicht.",
  tone = "default",
}: {
  title: string;
  description: string;
  headers: string[];
  rows: string[][];
  badgeColumns?: number[];
  emptyTitle?: string;
  emptyDescription?: string;
  tone?: "default" | "hazard" | "urban";
}) {
  const isUrban = tone === "urban";
  const isHazard = tone === "hazard";

  return (
    <Card
      size="sm"
      className={cn(
        isUrban
          ? "border border-white/10 bg-slate-950/84 text-white shadow-[0_24px_72px_-44px_rgba(15,23,42,0.78)]"
          : isHazard
          ? "re-frame-flash border border-red-300/12 bg-[linear-gradient(145deg,rgba(9,11,16,0.98),rgba(22,12,15,0.96),rgba(40,16,19,0.9))] text-white shadow-[0_28px_88px_-46px_rgba(0,0,0,0.74)]"
          : "surface-panel"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className={isUrban || isHazard ? "text-white" : "dark:text-white"}>{title}</CardTitle>
        <CardDescription
          className={cn(
            "text-[13px] leading-6",
            isUrban ? "text-slate-300" : isHazard ? "text-stone-300" : "dark:text-slate-300"
          )}
        >
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className="space-y-1.5">
            <div className="grid gap-2 md:hidden">
              {rows.map((row, index) => (
                <div
                  key={`${title}-mobile-${index}`}
                  className={cn(
                    "rounded-lg p-2.5 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.22)]",
                    isUrban
                      ? "border border-white/10 bg-white/7"
                      : isHazard
                        ? "border border-red-300/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(120,22,22,0.12))]"
                        : "surface-card"
                  )}
                >
                  <div className="grid gap-2">
                    {row.map((cell, cellIndex) => (
                      <div
                        key={`${title}-mobile-${index}-${cellIndex}`}
                          className="border-b border-black/5 pb-2 last:border-b-0 last:pb-0"
                      >
                        <p
                          className={cn(
                            "text-[10px] font-semibold tracking-[0.14em] uppercase",
                            isUrban
                              ? "text-slate-300"
                              : isHazard
                                ? "text-red-100/62"
                                : "text-slate-500 dark:text-slate-400"
                          )}
                        >
                          {headers[cellIndex] ?? `Kolom ${cellIndex + 1}`}
                        </p>
                        <div className="mt-1.5 text-[13px]">
                          {badgeColumns.includes(cellIndex) ? (
                            <Badge variant={getBadgeVariant(cell)}>{cell}</Badge>
                          ) : (
                            <span
                              className={
                                isUrban
                                  ? "text-slate-100"
                                  : isHazard
                                    ? "text-stone-100"
                                    : "text-slate-700 dark:text-slate-100"
                              }
                            >
                              {cell}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-separate border-spacing-y-1 text-left text-[13px]">
                <thead>
                  <tr>
                    {headers.map((header) => (
                      <th
                        key={header}
                        className={cn(
                          "px-3 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase",
                          isUrban
                            ? "text-slate-300"
                            : isHazard
                              ? "text-red-100/62"
                              : "text-muted-foreground dark:text-slate-400"
                        )}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={`${title}-${index}`}
                      className={cn(
                        "translate-y-0 rounded-lg transition-transform duration-300 hover:-translate-y-0.5",
                        isUrban
                          ? "bg-white/7 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.52)]"
                          : isHazard
                            ? "bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(120,22,22,0.12))] shadow-[0_18px_40px_-28px_rgba(0,0,0,0.56)]"
                            : "bg-slate-50/85 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.35)] dark:bg-white/5 dark:shadow-[0_12px_28px_-24px_rgba(15,23,42,0.52)]"
                      )}
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${title}-${index}-${cellIndex}`}
                          className="px-3 py-2.5 align-top first:rounded-l-lg last:rounded-r-lg"
                        >
                          {badgeColumns.includes(cellIndex) ? (
                            <Badge variant={getBadgeVariant(cell)}>{cell}</Badge>
                          ) : (
                            <span
                              className={
                                isUrban
                                  ? "text-slate-100"
                                  : isHazard
                                    ? "text-stone-100"
                                    : "text-slate-700 dark:text-slate-100"
                              }
                            >
                              {cell}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-xl p-4",
              isUrban
                ? "border border-dashed border-white/10 bg-white/4"
                : isHazard
                  ? "border border-dashed border-red-300/10 bg-white/4"
                  : "surface-empty"
            )}
          >
            <h3 className={cn("text-base font-semibold", isUrban || isHazard ? "text-white" : "text-slate-950 dark:text-white")}>
              {emptyTitle}
            </h3>
            <p
              className={cn(
                "mt-1.5 max-w-xl text-[13px] leading-6",
                isUrban ? "text-slate-300" : isHazard ? "text-stone-300" : "text-muted-foreground dark:text-slate-300"
              )}
            >
              {emptyDescription}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
