"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { DataTableCard } from "@/components/dashboard/data-table-card";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { InstructorGrowthRadar } from "@/components/dashboard/instructor-growth-radar";
import { TrendCard } from "@/components/dashboard/trend-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type IncomeStat = {
  label: string;
  value: string;
  detail: string;
};

type IncomeActionItem = {
  id: string;
  title: string;
  detail: string;
  meta?: string;
  badge: "success" | "warning" | "danger" | "info";
  href: string;
  ctaLabel: string;
};

type PackageHealthItem = {
  leerlingId: string;
  naam: string;
  pakketNaam: string;
  packageValueLabel: string;
  lessonsUsedLabel: string;
  remainingLessonsLabel: string;
  usageRatio: number;
  badge: "success" | "warning" | "danger" | "info";
  badgeLabel: string;
  nextStep: string;
};

type IncomeRow = {
  omschrijving: string;
  bedrag: string;
  datum: string;
  status: string;
};

type GrowthInsightItem = {
  id: string;
  studentId?: string;
  title: string;
  badgeLabel: string;
  badge: "success" | "warning" | "danger" | "info";
  detail: string;
  meta?: string;
  href: string;
  ctaLabel: string;
  openLabel?: string;
  actionType?: "package_suggestion" | "gap_nudge";
  suggestedPackageId?: string;
  suggestedPackageName?: string;
  currentPackageName?: string;
  nudgeStudentIds?: string[];
  nudgeStudentNames?: string[];
  slotStartAt?: string;
  slotEndAt?: string;
  draftText?: string;
};

type GrowthInsights = {
  summary: {
    headline: string;
    readyActions: number;
    estimatedGrowthValueLabel: string;
    nudgeAudienceLabel: string;
  };
  packageOpportunities: GrowthInsightItem[];
  fillGaps: GrowthInsightItem[];
  upgradeCandidates: GrowthInsightItem[];
};

type InstructorIncomeCockpitPanelProps = {
  stats: IncomeStat[];
  secondaryStats: IncomeStat[];
  actions: IncomeActionItem[];
  packageHealth: PackageHealthItem[];
  gapOpportunities: IncomeActionItem[];
  incomeRows: IncomeRow[];
  growthInsights: GrowthInsights;
};

function getIncomeBadgeLabel(value: "success" | "warning" | "danger" | "info") {
  if (value === "success") return "Sterk";
  if (value === "warning") return "Let op";
  if (value === "danger") return "Urgent";
  return "Kans";
}

function getSignalTone(index: number) {
  return [
    "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-500/10",
    "border-amber-200/80 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-500/10",
    "border-sky-200/80 bg-sky-50/80 dark:border-sky-400/20 dark:bg-sky-500/10",
  ][index] ?? "border-white/14 bg-white/10";
}

function getHealthTone(badge: PackageHealthItem["badge"]) {
  if (badge === "danger") {
    return {
      shell:
        "border-rose-200/80 bg-rose-50/90 dark:border-rose-400/20 dark:bg-rose-500/10",
      bar: "bg-[linear-gradient(90deg,#be123c,#ef4444,#fb7185)]",
    };
  }

  if (badge === "warning") {
    return {
      shell:
        "border-amber-200/80 bg-amber-50/90 dark:border-amber-400/20 dark:bg-amber-500/10",
      bar: "bg-[linear-gradient(90deg,#b45309,#f59e0b,#facc15)]",
    };
  }

  if (badge === "info") {
    return {
      shell:
        "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10",
      bar: "bg-[linear-gradient(90deg,#0f172a,#2563eb,#38bdf8)]",
    };
  }

  return {
    shell:
      "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10",
    bar: "bg-[linear-gradient(90deg,#047857,#10b981,#34d399)]",
  };
}

function getOpportunityTone(badge: IncomeActionItem["badge"]) {
  if (badge === "danger") {
    return "border-rose-200/80 bg-rose-50/90 dark:border-rose-400/20 dark:bg-rose-500/10";
  }

  if (badge === "warning") {
    return "border-amber-200/80 bg-amber-50/90 dark:border-amber-400/20 dark:bg-amber-500/10";
  }

  if (badge === "info") {
    return "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10";
  }

  return "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10";
}

function getStatTone(index: number) {
  return [
    "from-emerald-500/12 to-cyan-500/10",
    "from-sky-500/12 to-indigo-500/10",
    "from-slate-500/12 to-sky-500/8",
    "from-amber-500/14 to-rose-500/10",
  ][index] ?? "from-slate-500/10 to-transparent";
}

export function InstructorIncomeCockpitPanel({
  stats,
  secondaryStats,
  actions,
  packageHealth,
  gapOpportunities,
  incomeRows,
  growthInsights,
}: InstructorIncomeCockpitPanelProps) {
  const cockpitSignals = [
    {
      label: "Open omzet",
      value: stats[2]?.value ?? "Nog leeg",
      hint: "Gepland of geaccepteerd",
      icon: WalletCards,
    },
    {
      label: "Lege gaten",
      value: `${gapOpportunities.length}`,
      hint: "Direct op te vullen",
      icon: CircleAlert,
    },
    {
      label: "Klaar om te sturen",
      value: `${growthInsights.summary.readyActions}`,
      hint: "Voorstel of nudge",
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[1.8rem] border border-white/70 bg-[linear-gradient(135deg,#0f172a,#172554,#1e293b)] p-5 text-white shadow-[0_28px_90px_-52px_rgba(15,23,42,0.62)] dark:border-white/10">
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-white/62 uppercase">
              Cockpit regie
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {growthInsights.summary.headline}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/74">
              Werk vanuit een rustige omzetlaag: welke waarde staat al klaar,
              waar liggen gaten open en welke leerling vraagt nu om een vervolg.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {cockpitSignals.map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-[1.1rem] border px-3.5 py-3 backdrop-blur",
                  getSignalTone(index)
                )}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="size-3.5 text-sky-200" />
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-white/62 uppercase">
                    {item.label}
                  </p>
                </div>
                <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-xs leading-5 text-white/62">{item.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <TrendCard
          title="Omzetritme"
          value={stats[0]?.value ?? "Nog leeg"}
          change={`${growthInsights.summary.readyActions} acties klaar`}
          description="Deze weekse omzetpotentie op basis van lessen die al ingepland of bijna rond zijn."
          data={[
            Math.max(gapOpportunities.length, 1),
            Math.max(actions.length, 1),
            Math.max(packageHealth.length, 1),
            Math.max(growthInsights.packageOpportunities.length, 1),
            Math.max(growthInsights.upgradeCandidates.length, 1),
            Math.max(growthInsights.fillGaps.length, 1),
          ]}
        />
        <InsightPanel
          title="Waar laat je nu geld liggen?"
          description="De belangrijkste financiele signalen uit je agenda, pakketten en actieve trajecten."
          items={[
            {
              label: "Open gaten",
              value:
                gapOpportunities.length > 0
                  ? `${gapOpportunities.length} boekbare momenten kunnen nog lesomzet worden.`
                  : "Je week heeft nu geen duidelijke open gaten die opvallen.",
              status: gapOpportunities.length > 0 ? "Actie" : undefined,
            },
            {
              label: "Bijna leeg",
              value:
                secondaryStats.find((stat) => stat.label === "Bijna door pakket heen")
                  ?.detail ?? "Geen pakketten die nu direct op spanning staan.",
            },
            {
              label: "Zonder pakket",
              value:
                secondaryStats.find((stat) => stat.label === "Zonder logisch pakket")
                  ?.detail ?? "Geen actieve trajecten zonder pakket gevonden.",
              status:
                Number(
                  secondaryStats.find(
                    (stat) => stat.label === "Zonder logisch pakket"
                  )?.value ?? "0"
                ) > 0
                  ? "Kans"
                  : undefined,
            },
          ]}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                  <WalletCards className="size-4 text-primary dark:text-sky-300" />
                  Pakketwaarde per leerling
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Zie in een oogopslag wie bijna door zijn pakket heen is en waar
                  vervolgomzet of rust in planning klaarstaat.
                </CardDescription>
              </div>
              <Button asChild variant="outline" className="h-8 rounded-full px-3 text-[12px]">
                <Link href="/instructeur/leerlingen">Open werkplek</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {packageHealth.length ? (
              packageHealth.map((item) => (
                <div
                  key={item.leerlingId}
                  className={cn(
                    "rounded-[1.2rem] border p-3.5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.2)]",
                    getHealthTone(item.badge).shell
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-semibold text-slate-950 dark:text-white">
                          {item.naam}
                        </p>
                        <Badge variant={item.badge}>{item.badgeLabel}</Badge>
                      </div>
                      <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-300">
                        {item.pakketNaam} - {item.packageValueLabel}
                      </p>
                    </div>
                    <Button asChild variant="outline" className="h-8 rounded-full px-3 text-[12px]">
                      <Link href="/instructeur/leerlingen">
                        Open leerling
                        <ArrowRight className="ml-1 size-3.5" />
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        getHealthTone(item.badge).bar
                      )}
                      style={{ width: `${Math.max(item.usageRatio, 8)}%` }}
                    />
                  </div>
                  <div className="mt-3 grid gap-2 text-[12px] text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                    <p>{item.lessonsUsedLabel}</p>
                    <p>{item.remainingLessonsLabel}</p>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                    {item.nextStep}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.15rem] border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600 dark:border-white/12 dark:bg-white/5 dark:text-slate-300">
                Nog geen actieve pakketkoppelingen gevonden die omzet en dekking
                kunnen tonen.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                  <CalendarClock className="size-4 text-primary dark:text-sky-300" />
                  Vrije omzetkansen
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Open boekbare gaten die nu het meest direct omzet of ritme kunnen opleveren.
                </CardDescription>
              </div>
              <Button asChild variant="outline" className="h-8 rounded-full px-3 text-[12px]">
                <Link href="/instructeur/beschikbaarheid">Open agenda</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {gapOpportunities.length ? (
              gapOpportunities.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-[1.2rem] border p-3.5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.2)]",
                    getOpportunityTone(item.badge)
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-slate-950 dark:text-white">
                      {item.title}
                    </p>
                    <Badge variant={item.badge}>{getIncomeBadgeLabel(item.badge)}</Badge>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                    {item.detail}
                  </p>
                  {item.meta ? (
                    <p className="mt-2 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                      {item.meta}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <Button asChild variant="outline" className="h-8 rounded-full px-3 text-[12px]">
                      <Link href={item.href}>
                        {item.ctaLabel}
                        <ArrowRight className="ml-1 size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.15rem] border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600 dark:border-white/12 dark:bg-white/5 dark:text-slate-300">
                Er springen nu geen duidelijke open momenten uit die direct als
                omzetkans op tafel liggen.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.slice(4, 8).map((stat, index) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-[1.3rem] border border-white/70 bg-white/88 p-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/6"
          >
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-18 bg-gradient-to-r opacity-80",
                getStatTone(index)
              )}
            />
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary dark:text-sky-300">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                {stat.value}
              </p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                {stat.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      <InstructorGrowthRadar insights={growthInsights} />

      <DataTableCard
        title="Inkomstenoverzicht"
        description="Live opgebouwd uit ingeplande, geaccepteerde en afgeronde lessen die aan jouw instructeursprofiel gekoppeld zijn."
        headers={["Omschrijving", "Bedrag", "Datum", "Status"]}
        rows={incomeRows.map((row) => [
          row.omschrijving,
          row.bedrag,
          row.datum,
          row.status,
        ])}
        badgeColumns={[3]}
        emptyTitle="Nog geen inkomstenmomenten"
        emptyDescription="Zodra lessen worden ingepland of afgerond, verschijnt hier automatisch je omzetlijn."
      />
    </div>
  );
}
