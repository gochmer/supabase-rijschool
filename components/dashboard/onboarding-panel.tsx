import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type OnboardingStep = {
  label: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  complete: boolean;
  icon: LucideIcon;
  meta?: string;
};

export function OnboardingPanel({
  eyebrow,
  title,
  description,
  steps,
  accent = "sky",
  hideWhenComplete = false,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  steps: OnboardingStep[];
  accent?: "sky" | "emerald" | "amber";
  hideWhenComplete?: boolean;
  compact?: boolean;
}) {
  const completedCount = steps.filter((step) => step.complete).length;
  const progress = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;
  const accentClassName =
    accent === "emerald"
      ? "from-emerald-400 via-sky-400 to-slate-950"
      : accent === "amber"
        ? "from-amber-300 via-sky-400 to-slate-950"
        : "from-sky-300 via-blue-500 to-slate-950";

  if (hideWhenComplete && steps.length > 0 && completedCount === steps.length) {
    return null;
  }

  if (compact) {
    return (
      <section className="surface-panel p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase dark:text-sky-300">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
              {title}
            </h2>
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground dark:text-slate-300">
              {description}
            </p>
          </div>
          <div className="min-w-[9rem] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {completedCount}/{steps.length} klaar
              </span>
              <span className="text-sm font-semibold text-slate-950 dark:text-white">
                {progress}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className={cn("h-full rounded-full bg-gradient-to-r", accentClassName)}
                style={{ width: `${Math.max(progress, 6)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => {
            const StatusIcon = step.complete ? CheckCircle2 : CircleDashed;

            return (
              <Link
                key={step.label}
                href={step.href}
                className="group min-w-0 rounded-lg border border-slate-200 bg-white p-3 transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/8"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        step.complete
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100"
                          : "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-100"
                      )}
                    >
                      <step.icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold tracking-[0.16em] text-primary uppercase dark:text-sky-300">
                        {step.label}
                      </p>
                      <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5 text-slate-950 dark:text-white">
                        {step.title}
                      </h3>
                    </div>
                  </div>
                  <StatusIcon
                    className={cn(
                      "mt-1 size-4 shrink-0",
                      step.complete
                        ? "text-emerald-600 dark:text-emerald-200"
                        : "text-slate-400 dark:text-slate-500"
                    )}
                  />
                </div>

                {step.meta ? (
                  <p className="mt-2 truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                    {step.meta}
                  </p>
                ) : null}
                <div className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-950 dark:text-slate-100">
                  {step.ctaLabel}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="surface-panel overflow-hidden">
      <div className="grid gap-0 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="relative overflow-hidden bg-slate-950 p-4 text-white sm:p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(56,189,248,0.22),transparent_26%),radial-gradient(circle_at_84%_20%,rgba(16,185,129,0.18),transparent_24%),radial-gradient(circle_at_70%_86%,rgba(245,158,11,0.14),transparent_26%)]" />
          <div className="relative">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-sky-100/78 uppercase">
              {eyebrow}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              {title}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-slate-300">
              {description}
            </p>

            <div className="mt-5 rounded-[1.2rem] border border-white/12 bg-white/8 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-300 uppercase">
                    Onboarding
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    {completedCount} van {steps.length} stappen klaar
                  </p>
                </div>
                <p className="text-3xl font-semibold">{progress}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/12">
                <div
                  className={cn("h-full rounded-full bg-gradient-to-r", accentClassName)}
                  style={{ width: `${Math.max(progress, 6)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2.5 p-3.5 sm:p-4 md:grid-cols-2">
          {steps.map((step) => {
            const StatusIcon = step.complete ? CheckCircle2 : CircleDashed;

            return (
              <Link
                key={step.label}
                href={step.href}
                className="surface-card group min-w-0 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_20px_58px_-38px_rgba(15,23,42,0.3)] dark:hover:bg-white/8"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                        step.complete
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100"
                          : "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-100"
                      )}
                    >
                      <step.icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold tracking-[0.18em] text-primary uppercase dark:text-sky-300">
                        {step.label}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold leading-5 text-slate-950 dark:text-white">
                        {step.title}
                      </h3>
                    </div>
                  </div>
                  <StatusIcon
                    className={cn(
                      "mt-1 size-4 shrink-0",
                      step.complete
                        ? "text-emerald-600 dark:text-emerald-200"
                        : "text-slate-400 dark:text-slate-500"
                    )}
                  />
                </div>

                <p className="mt-2 text-[12px] leading-5 text-muted-foreground dark:text-slate-300">
                  {step.description}
                </p>
                {step.meta ? (
                  <p className="mt-2 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                    {step.meta}
                  </p>
                ) : null}
                <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-950 dark:text-slate-100">
                  {step.ctaLabel}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
