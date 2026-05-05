import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type DashboardStatTone =
  | "amber"
  | "cyan"
  | "emerald"
  | "rose"
  | "sky"
  | "violet";

const toneStyles: Record<
  DashboardStatTone,
  {
    icon: string;
    trend: string;
  }
> = {
  amber: {
    icon: "bg-orange-500/18 text-orange-100 ring-orange-400/20",
    trend: "text-orange-200",
  },
  cyan: {
    icon: "bg-cyan-500/18 text-cyan-100 ring-cyan-400/20",
    trend: "text-cyan-200",
  },
  emerald: {
    icon: "bg-emerald-500/18 text-emerald-100 ring-emerald-400/20",
    trend: "text-emerald-200",
  },
  rose: {
    icon: "bg-rose-500/18 text-rose-100 ring-rose-400/20",
    trend: "text-rose-200",
  },
  sky: {
    icon: "bg-blue-500/18 text-blue-100 ring-blue-400/20",
    trend: "text-blue-200",
  },
  violet: {
    icon: "bg-violet-500/18 text-violet-100 ring-violet-400/20",
    trend: "text-violet-200",
  },
};

export function DashboardStatCard({
  detail,
  icon: Icon,
  label,
  tone = "sky",
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone?: DashboardStatTone;
  value: string;
}) {
  const styles = toneStyles[tone];

  return (
    <div className="group rounded-xl border border-white/10 bg-white/[0.055] p-3.5 text-white shadow-[0_18px_54px_-44px_rgba(0,0,0,0.9)] transition hover:border-white/18 hover:bg-white/[0.08]">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1",
            styles.icon
          )}
        >
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-slate-300">
            {label}
          </p>
          <p className="mt-1.5 truncate text-xl font-semibold tracking-tight text-white">
            {value}
          </p>
          <p className={cn("mt-2.5 text-[12px] leading-5", styles.trend)}>
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}
