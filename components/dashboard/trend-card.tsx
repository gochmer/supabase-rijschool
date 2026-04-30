import { ArrowUpRight, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function TrendCard({
  title,
  value,
  change,
  description,
  data,
  tone = "default",
}: {
  title: string;
  value: string;
  change: string;
  description: string;
  data: number[];
  tone?: "default" | "hazard" | "urban";
}) {
  const max = Math.max(...data, 1);
  const isUrban = tone === "urban";
  const isHazard = tone === "hazard";

  return (
    <Card
      className={cn(
        "overflow-hidden",
        isUrban
          ? "border border-white/10 bg-slate-950/84 text-white shadow-[0_24px_72px_-44px_rgba(15,23,42,0.78)]"
          : isHazard
          ? "re-frame-flash border border-red-300/12 bg-[linear-gradient(145deg,rgba(8,10,14,0.98),rgba(18,9,12,0.98),rgba(52,14,18,0.9))] text-white shadow-[0_28px_90px_-46px_rgba(0,0,0,0.76)]"
          : "surface-panel"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardDescription className={cn("text-[12px]", isUrban ? "text-slate-300" : isHazard ? "text-red-100/72" : "dark:text-slate-300")}>
              {title}
            </CardDescription>
            <CardTitle className={cn("mt-1 text-[1.45rem] sm:text-[1.8rem]", isUrban || isHazard ? "text-white" : "dark:text-white")}>
              {value}
            </CardTitle>
          </div>
          <div
            className={cn(
              "rounded-[1rem] px-2.5 py-1.5 text-[12px] font-semibold",
              isUrban
                ? "border border-white/10 bg-white/8 text-slate-100"
                : isHazard
                ? "border border-red-300/12 bg-red-500/12 text-red-100"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300"
            )}
          >
            {change}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-18 items-end gap-1.5">
          {data.map((item, index) => (
            <div
              key={`${title}-${index}`}
              className={cn(
                "relative flex-1 overflow-hidden rounded-full",
                isUrban ? "bg-white/8" : isHazard ? "bg-white/8" : "bg-slate-100 dark:bg-white/8"
              )}
            >
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 rounded-full transition-all duration-500",
                  isUrban
                    ? "bg-[linear-gradient(180deg,#f8fafc,#94a3b8,#0f172a)]"
                    : isHazard
                    ? "bg-[linear-gradient(180deg,#fdba74,#ef4444,#7f1d1d)]"
                    : "bg-[linear-gradient(180deg,#38bdf8,#2563eb,#0f172a)] dark:bg-[linear-gradient(180deg,#bfdbfe,#38bdf8,#0f172a)]"
                )}
                style={{ height: `${Math.max((item / max) * 100, 18)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <p
            className={cn(
              "text-[13px] leading-6",
              isUrban ? "text-slate-300" : isHazard ? "text-stone-300" : "text-muted-foreground dark:text-slate-300"
            )}
          >
            {description}
          </p>
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-[1rem]",
              isUrban
                ? "bg-white/8 text-slate-100"
                : isHazard
                  ? "bg-red-500/12 text-red-100"
                  : "bg-slate-100 text-slate-700 dark:bg-white/8 dark:text-slate-100"
            )}
          >
            <TrendingUp className="size-3.5" />
          </div>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 text-[11px] font-medium",
            isUrban ? "text-slate-300" : isHazard ? "text-red-100/72" : "text-slate-500 dark:text-slate-400"
          )}
        >
          Trend
          <ArrowUpRight className="size-3" />
        </div>
      </CardContent>
    </Card>
  );
}
