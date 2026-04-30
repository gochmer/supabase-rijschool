import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardActionTone =
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "slate";

export type DashboardActionHubItem = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone?: DashboardActionTone;
  meta?: string;
};

const toneStyles: Record<
  DashboardActionTone,
  {
    icon: string;
    meta: string;
    hover: string;
  }
> = {
  sky: {
    icon: "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-200",
    meta: "text-sky-700 dark:text-sky-200",
    hover: "hover:border-sky-200 hover:bg-sky-50/70 dark:hover:border-sky-300/20 dark:hover:bg-sky-400/10",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
    meta: "text-emerald-700 dark:text-emerald-200",
    hover:
      "hover:border-emerald-200 hover:bg-emerald-50/70 dark:hover:border-emerald-300/20 dark:hover:bg-emerald-400/10",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200",
    meta: "text-amber-700 dark:text-amber-200",
    hover:
      "hover:border-amber-200 hover:bg-amber-50/70 dark:hover:border-amber-300/20 dark:hover:bg-amber-400/10",
  },
  rose: {
    icon: "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200",
    meta: "text-rose-700 dark:text-rose-200",
    hover: "hover:border-rose-200 hover:bg-rose-50/70 dark:hover:border-rose-300/20 dark:hover:bg-rose-400/10",
  },
  slate: {
    icon: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-100",
    meta: "text-slate-600 dark:text-slate-300",
    hover:
      "hover:border-slate-300 hover:bg-slate-50 dark:hover:border-white/15 dark:hover:bg-white/8",
  },
};

export function DashboardActionHub({
  eyebrow = "Snel regelen",
  title,
  description,
  primaryHref,
  primaryLabel,
  items,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  items: DashboardActionHubItem[];
}) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-white/[0.06] sm:p-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.5fr)] xl:items-stretch">
        <div className="flex min-h-full flex-col justify-between rounded-[1.45rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#eef6ff,#f8fafc)] p-4 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(14,165,233,0.16),rgba(15,23,42,0.9))]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:border-white/10 dark:bg-white/8 dark:text-slate-300">
              <Search className="size-3.5" />
              {eyebrow}
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {title}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              {description}
            </p>
          </div>

          <Button asChild className="mt-5 h-11 w-full rounded-full sm:w-fit">
            <Link href={primaryHref}>
              {primaryLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;
            const tone = toneStyles[item.tone ?? "slate"];

            return (
              <Link
                key={`${item.href}-${item.title}`}
                href={item.href}
                className={cn(
                  "group flex min-h-[8.5rem] flex-col justify-between rounded-[1.25rem] border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_46px_-34px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/[0.05]",
                  tone.hover
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                      tone.icon
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <ArrowRight className="mt-1 size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-300" />
                </div>

                <div className="mt-4">
                  {item.meta ? (
                    <p
                      className={cn(
                        "mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase",
                        tone.meta
                      )}
                    >
                      {item.meta}
                    </p>
                  ) : null}
                  <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
