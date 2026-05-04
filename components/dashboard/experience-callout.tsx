import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

type ExperienceCalloutTone = "danger" | "info" | "success" | "warning";

const toneClasses: Record<ExperienceCalloutTone, string> = {
  danger: "border-rose-300/20 bg-rose-400/10 text-rose-100",
  info: "border-sky-300/20 bg-sky-400/10 text-sky-100",
  success: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
  warning: "border-amber-300/20 bg-amber-400/10 text-amber-100",
};

export function ExperienceCallout({
  description,
  icon: Icon = Info,
  title,
  tone = "info",
}: {
  description: string;
  icon?: LucideIcon;
  title: string;
  tone?: ExperienceCalloutTone;
}) {
  return (
    <div className={cn("rounded-lg border p-3", toneClasses[tone])}>
      <div className="flex gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-white/72">{description}</p>
        </div>
      </div>
    </div>
  );
}
