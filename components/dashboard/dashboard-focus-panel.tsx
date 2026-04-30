import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type DashboardFocusItem = {
  label: string;
  title: string;
  value: string;
  description: string;
  href: string;
  ctaLabel: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
};

function getToneClasses(tone: DashboardFocusItem["tone"] = "default") {
  switch (tone) {
    case "success":
      return {
        icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100",
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100",
      };
    case "warning":
      return {
        icon: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-100",
        badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100",
      };
    case "danger":
      return {
        icon: "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-100",
        badge: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100",
      };
    default:
      return {
        icon: "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-100",
        badge: "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100",
      };
  }
}

function FocusCard({
  item,
  featured = false,
  compact = false,
}: {
  item: DashboardFocusItem;
  featured?: boolean;
  compact?: boolean;
}) {
  const toneClasses = getToneClasses(item.tone);

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex min-w-0 flex-col border transition-all duration-300 hover:-translate-y-0.5",
        compact
          ? "rounded-lg bg-white p-3 hover:bg-slate-50 dark:bg-white/[0.05] dark:hover:bg-white/8"
          : "rounded-[1.25rem]",
        featured && !compact
          ? "border-slate-200 bg-slate-950 p-4 text-white shadow-[0_26px_80px_-42px_rgba(15,23,42,0.7)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(2,6,23,0.98),rgba(30,41,59,0.94))]"
          : compact && featured
            ? "border-sky-200 text-slate-950 dark:border-sky-300/20 dark:text-white"
            : "surface-card p-3.5 hover:bg-white dark:hover:bg-white/8"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center",
            compact ? "size-8 rounded-lg" : "size-10 rounded-2xl",
            featured && !compact ? "bg-white/10 text-sky-100" : toneClasses.icon
          )}
        >
          <item.icon className="size-4" />
        </div>
        <span
          className={cn(
            "border font-semibold tracking-[0.14em] uppercase",
            compact ? "rounded-md px-2 py-0.5 text-[9px]" : "rounded-full px-2.5 py-1 text-[10px]",
            featured && !compact
              ? "border-white/14 bg-white/10 text-white/80"
              : toneClasses.badge
          )}
        >
          {item.value}
        </span>
      </div>

      <div className={cn("min-w-0", compact ? "mt-3" : "mt-4")}>
        <p
          className={cn(
            "font-semibold tracking-[0.18em] uppercase",
            compact ? "text-[9px]" : "text-[10px]",
            featured && !compact ? "text-sky-100/70" : "text-primary dark:text-sky-300"
          )}
        >
          {item.label}
        </p>
        <h3
          className={cn(
            "font-semibold",
            compact ? "mt-1 text-sm leading-5" : "mt-1.5 text-base leading-6",
            featured && !compact ? "text-white" : "text-slate-950 dark:text-white"
          )}
        >
          {item.title}
        </h3>
        <p
          className={cn(
            compact ? "mt-1 line-clamp-2 text-[12px] leading-5" : "mt-1.5 text-[13px] leading-6",
            featured && !compact ? "text-slate-300" : "text-muted-foreground dark:text-slate-300"
          )}
        >
          {item.description}
        </p>
      </div>

      <div
        className={cn(
          "inline-flex items-center gap-1.5 font-semibold",
          compact ? "mt-3 text-[12px]" : "mt-4 text-[13px]",
          featured && !compact ? "text-sky-100" : "text-slate-950 dark:text-slate-100"
        )}
      >
        {item.ctaLabel}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export function DashboardFocusPanel({
  eyebrow,
  title,
  description,
  primary,
  items,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  primary: DashboardFocusItem;
  items: DashboardFocusItem[];
  compact?: boolean;
}) {
  return (
    <section className={cn("surface-panel", compact ? "p-3" : "p-4")}>
      <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between", compact ? "mb-3" : "mb-4")}>
        <div className="max-w-3xl">
          <p className={cn("font-semibold tracking-[0.22em] text-primary uppercase dark:text-sky-300", compact ? "text-[10px]" : "text-[11px]")}>
            {eyebrow}
          </p>
          <h2 className={cn("mt-1.5 font-semibold tracking-tight text-slate-950 dark:text-white", compact ? "text-lg" : "text-xl sm:text-2xl")}>
            {title}
          </h2>
          <p className={cn("mt-1.5 text-muted-foreground dark:text-slate-300", compact ? "text-[12px] leading-5" : "text-[13px] leading-6")}>
            {description}
          </p>
        </div>
      </div>

      <div className={cn("grid gap-3", compact ? "xl:grid-cols-4" : "xl:grid-cols-[0.95fr_1.45fr]")}>
        <FocusCard item={primary} featured compact={compact} />
        <div className={cn("grid gap-3 md:grid-cols-2", compact ? "xl:col-span-3 2xl:grid-cols-3" : "2xl:grid-cols-4")}>
          {items.map((item) => (
            <FocusCard key={`${item.href}-${item.label}`} item={item} compact={compact} />
          ))}
        </div>
      </div>
    </section>
  );
}
