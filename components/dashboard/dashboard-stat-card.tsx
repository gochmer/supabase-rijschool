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
    glow: string;
    icon: string;
    bar: string;
  }
> = {
  amber: {
    glow: "from-amber-400/20 via-orange-300/10 to-transparent",
    icon: "bg-amber-400/14 text-amber-100",
    bar: "bg-amber-300",
  },
  cyan: {
    glow: "from-cyan-400/20 via-sky-300/10 to-transparent",
    icon: "bg-cyan-400/14 text-cyan-100",
    bar: "bg-cyan-300",
  },
  emerald: {
    glow: "from-emerald-400/20 via-teal-300/10 to-transparent",
    icon: "bg-emerald-400/14 text-emerald-100",
    bar: "bg-emerald-300",
  },
  rose: {
    glow: "from-rose-400/20 via-pink-300/10 to-transparent",
    icon: "bg-rose-400/14 text-rose-100",
    bar: "bg-rose-300",
  },
  sky: {
    glow: "from-sky-400/20 via-cyan-300/10 to-transparent",
    icon: "bg-sky-400/14 text-sky-100",
    bar: "bg-sky-300",
  },
  violet: {
    glow: "from-violet-400/20 via-fuchsia-300/10 to-transparent",
    icon: "bg-violet-400/14 text-violet-100",
    bar: "bg-violet-300",
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
    <div className="group relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] p-4 text-white shadow-[0_20px_58px_-42px_rgba(15,23,42,0.7)] transition duration-300 hover:-translate-y-0.5 hover:border-white/18">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r",
          styles.glow
        )}
      />
      <div className="pointer-events-none absolute -right-8 -top-10 size-24 rounded-full bg-white/8 blur-2xl transition duration-500 group-hover:scale-110" />
      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10",
            styles.icon
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className={cn("mb-2 h-1 w-9 rounded-full", styles.bar)} />
          <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
            {label}
          </p>
          <p className="mt-1 truncate text-lg font-semibold text-white">
            {value}
          </p>
          <p className="mt-1 text-[12px] leading-5 text-slate-300">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}
