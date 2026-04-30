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
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  items: DashboardActionHubItem[];
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "border bg-white/90 dark:border-white/10 dark:bg-white/[0.06]",
        compact
          ? "rounded-xl border-slate-200 p-3 shadow-sm"
          : "rounded-[2rem] border-white/70 p-4 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] sm:p-5"
      )}
    >
      <div
        className={cn(
          "grid gap-3 xl:items-stretch",
          compact
            ? "xl:grid-cols-[minmax(0,0.58fr)_minmax(0,1.8fr)]"
            : "gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.5fr)]"
        )}
      >
        <div
          className={cn(
            "flex min-h-full flex-col justify-between border border-slate-200 dark:border-white/10",
            compact
              ? "rounded-lg bg-slate-50 p-3 dark:bg-white/[0.04]"
              : "rounded-[1.45rem] bg-[linear-gradient(135deg,#f8fafc,#eef6ff,#f8fafc)] p-4 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(14,165,233,0.16),rgba(15,23,42,0.9))]"
          )}
        >
          <div>
            <div
              className={cn(
                "inline-flex items-center gap-2 border border-slate-200 bg-white/80 font-semibold tracking-[0.18em] text-slate-500 uppercase dark:border-white/10 dark:bg-white/8 dark:text-slate-300",
                compact
                  ? "rounded-md px-2 py-1 text-[9px]"
                  : "rounded-full px-3 py-1 text-[10px]"
              )}
            >
              <Search className="size-3.5" />
              {eyebrow}
            </div>
            <h2
              className={cn(
                "font-semibold tracking-tight text-slate-950 dark:text-white",
                compact ? "mt-3 text-lg" : "mt-4 text-2xl"
              )}
            >
              {title}
            </h2>
            <p
              className={cn(
                "mt-2 max-w-xl text-slate-600 dark:text-slate-300",
                compact ? "text-[12px] leading-5" : "text-sm leading-7"
              )}
            >
              {description}
            </p>
          </div>

          <Button
            asChild
            className={cn(
              "w-full sm:w-fit",
              compact ? "mt-4 h-9 rounded-lg text-[12px]" : "mt-5 h-11 rounded-full"
            )}
          >
            <Link href={primaryHref}>
              {primaryLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className={cn("grid gap-2.5 sm:grid-cols-2", compact ? "2xl:grid-cols-4" : "gap-3 2xl:grid-cols-3")}>
          {items.map((item) => {
            const Icon = item.icon;
            const tone = toneStyles[item.tone ?? "slate"];

            return (
              <Link
                key={`${item.href}-${item.title}`}
                href={item.href}
                className={cn(
                  "group flex flex-col justify-between border border-slate-200 bg-white text-left transition-all hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.05]",
                  compact
                    ? "min-h-[6.6rem] rounded-lg p-3 hover:shadow-sm"
                    : "min-h-[8.5rem] rounded-[1.25rem] p-4 hover:shadow-[0_22px_46px_-34px_rgba(15,23,42,0.45)]",
                  tone.hover
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex shrink-0 items-center justify-center",
                      compact ? "size-8 rounded-lg" : "size-10 rounded-2xl",
                      tone.icon
                    )}
                  >
                    <Icon className={compact ? "size-4" : "size-4.5"} />
                  </div>
                  <ArrowRight className="mt-1 size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-300" />
                </div>

                <div className={compact ? "mt-2.5" : "mt-4"}>
                  {item.meta ? (
                    <p
                      className={cn(
                        "mb-1 font-semibold tracking-[0.14em] uppercase",
                        compact ? "text-[9px]" : "text-[11px]",
                        tone.meta
                      )}
                    >
                      {item.meta}
                    </p>
                  ) : null}
                  <h3 className={cn("font-semibold text-slate-950 dark:text-white", compact ? "text-sm" : "text-base")}>
                    {item.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-1 line-clamp-2 text-slate-600 dark:text-slate-300",
                      compact ? "text-[12px] leading-5" : "text-sm leading-6"
                    )}
                  >
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
