import Link from "next/link";
import {
  CalendarClock,
  CircleAlert,
  Flame,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { InstructorIncomeTabs } from "@/components/dashboard/instructor-income-tabs";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getCurrentInstructorIncomeCockpit,
  getCurrentInstructorIncomeOverview,
} from "@/lib/data/instructor-account";
import { cn } from "@/lib/utils";

export default async function InkomstenPage() {
  const [overview, cockpit] = await Promise.all([
    getCurrentInstructorIncomeOverview(),
    getCurrentInstructorIncomeCockpit(),
  ]);
  const topStats = overview.topStats;
  const secondaryStats = overview.secondaryStats;
  const summaryIcons = [WalletCards, CalendarClock, Sparkles, CircleAlert];
  const heroSignals = [
    {
      label: "Verwacht deze week",
      value: topStats[0]?.value ?? "Nog leeg",
      hint: topStats[0]?.detail ?? "Nog geen leswaarde opgebouwd.",
    },
    {
      label: "Pakketportfolio",
      value: cockpit.stats[3]?.value ?? "Nog leeg",
      hint: cockpit.stats[3]?.detail ?? "Nog geen pakketlijn zichtbaar.",
    },
    {
      label: "Groeiacties klaar",
      value: `${cockpit.growthInsights.summary.readyActions}`,
      hint:
        cockpit.growthInsights.summary.readyActions > 0
          ? "Voorstel, nudge of upgrade staat klaar."
          : "Geen directe groeiactie open.",
    },
  ];
  const incomeFocusScore = Math.min(
    100,
    52 +
      cockpit.actions.length * 6 +
      cockpit.gapOpportunities.length * 8 +
      cockpit.growthInsights.summary.readyActions * 4
  );
  const heroSignalTones = [
    "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-500/10",
    "border-sky-200/80 bg-sky-50/80 dark:border-sky-400/20 dark:bg-sky-500/10",
    "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10",
  ];
  const topStatTones = [
    "from-emerald-500/12 to-cyan-500/10",
    "from-sky-500/12 to-indigo-500/10",
    "from-slate-500/12 to-sky-500/8",
    "from-amber-500/14 to-rose-500/10",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inkomsten"
        description="Een cockpit voor geplande omzet, pakketwaarde, open gaten en leerlingen waar nu geld of vervolg blijft liggen."
        actions={
          <>
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-full text-[13px]"
            >
              <Link href="/instructeur/beschikbaarheid">Agenda openen</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-full text-[13px]"
            >
              <Link href="/instructeur/leerlingen">Leerlingenwerkplek</Link>
            </Button>
            <Button asChild className="h-9 rounded-full text-[13px]">
              <Link href="/instructeur/pakketten">Pakketten beheren</Link>
            </Button>
          </>
        }
      />

      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,#0f172a,#172554,#1e293b)] p-5 text-white shadow-[0_34px_120px_-62px_rgba(15,23,42,0.75)] dark:border-white/10 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_82%_16%,rgba(59,130,246,0.18),transparent_24%),radial-gradient(circle_at_72%_86%,rgba(148,163,184,0.16),transparent_24%)]" />
        <div className="relative grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/78 uppercase">
              <Flame className="size-3.5" />
              Inkomsten cockpit
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Zie direct waar leswaarde, pakketten en open gaten je omzet sturen.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/74 sm:text-[15px]">
              Minder zoeken in losse cijfers, meer regie op geplande omzet,
              vervolgvoorstellen en kansen die nog open in je agenda liggen.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {heroSignals.map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-[1.2rem] border px-3.5 py-3 backdrop-blur",
                    heroSignalTones[index] ??
                      "border-white/14 bg-white/10"
                  )}
                >
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-white/68 uppercase">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs leading-5 text-white/68">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-[1.6rem] border border-white/14 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/62 uppercase">
                  Omzet focus
                </p>
                <p className="mt-1 text-4xl font-semibold">{incomeFocusScore}</p>
              </div>
              <Sparkles className="size-8 text-sky-200" />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#22c55e,#facc15)]"
                style={{ width: `${incomeFocusScore}%` }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Open gaten",
                  value: `${cockpit.gapOpportunities.length}`,
                  hint: "Boekbare kansen",
                },
                {
                  label: "Acties",
                  value: `${cockpit.actions.length}`,
                  hint: "Direct opvolgen",
                },
                {
                  label: "Groei",
                  value: cockpit.growthInsights.summary.estimatedGrowthValueLabel,
                  hint: "Waarde klaar",
                },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-[1rem] border px-3 py-3",
                    heroSignalTones[index] ??
                      "border-white/14 bg-white/10"
                  )}
                >
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-white/62 uppercase">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-white/62">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topStats.map((stat, index) => {
          const Icon = summaryIcons[index] ?? WalletCards;

          return (
            <Card
              key={stat.label}
              className="overflow-hidden border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]"
            >
              <CardContent className="relative p-4">
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-20 bg-gradient-to-r opacity-80",
                    topStatTones[index] ??
                      "from-slate-500/10 to-transparent"
                  )}
                />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-950/6 text-primary dark:bg-white/10 dark:text-sky-200">
                      <Icon className="size-4" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {stat.detail}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <InstructorIncomeTabs
        secondaryStats={secondaryStats}
        overviewSignals={overview.overviewSignals}
        cockpit={cockpit}
      />
    </div>
  );
}
