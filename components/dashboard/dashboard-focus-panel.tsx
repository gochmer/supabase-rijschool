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
}: {
  item: DashboardFocusItem;
  featured?: boolean;
}) {
  const toneClasses = getToneClasses(item.tone);

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex min-w-0 flex-col rounded-[1.25rem] border transition-all duration-300 hover:-translate-y-0.5",
        featured
          ? "border-slate-200 bg-slate-950 p-4 text-white shadow-[0_26px_80px_-42px_rgba(15,23,42,0.7)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(2,6,23,0.98),rgba(30,41,59,0.94))]"
          : "border-slate-200 bg-white/88 p-3.5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.32)] hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl",
            featured ? "bg-white/10 text-sky-100" : toneClasses.icon
          )}
        >
          <item.icon className="size-4" />
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase",
            featured
              ? "border-white/14 bg-white/10 text-white/80"
              : toneClasses.badge
          )}
        >
          {item.value}
        </span>
      </div>

      <div className="mt-4 min-w-0">
        <p
          className={cn(
            "text-[10px] font-semibold tracking-[0.18em] uppercase",
            featured ? "text-sky-100/70" : "text-primary dark:text-sky-300"
          )}
        >
          {item.label}
        </p>
        <h3
          className={cn(
            "mt-1.5 text-base font-semibold leading-6",
            featured ? "text-white" : "text-slate-950 dark:text-white"
          )}
        >
          {item.title}
        </h3>
        <p
          className={cn(
            "mt-1.5 text-[13px] leading-6",
            featured ? "text-slate-300" : "text-muted-foreground dark:text-slate-300"
          )}
        >
          {item.description}
        </p>
      </div>

      <div
        className={cn(
          "mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold",
          featured ? "text-sky-100" : "text-slate-950 dark:text-slate-100"
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
}: {
  eyebrow: string;
  title: string;
  description: string;
  primary: DashboardFocusItem;
  items: DashboardFocusItem[];
}) {
  return (
    <section className="rounded-[1.55rem] border border-white/70 bg-white/82 p-4 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.38)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-primary uppercase dark:text-sky-300">
            {eyebrow}
          </p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground dark:text-slate-300">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[0.95fr_1.45fr]">
        <FocusCard item={primary} featured />
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {items.map((item) => (
            <FocusCard key={`${item.href}-${item.label}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
