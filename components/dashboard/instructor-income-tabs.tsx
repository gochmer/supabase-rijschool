"use client";

import { useState } from "react";
import { ArrowUpRight, CircleAlert, Sparkles, WalletCards } from "lucide-react";

import { InstructorIncomeCockpitPanel } from "@/components/dashboard/instructor-income-cockpit-panel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type OverviewSection = {
  title: string;
  items: string[];
};

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

type IncomeRow = {
  omschrijving: string;
  bedrag: string;
  datum: string;
  status: string;
};

type InstructorIncomeCockpitView = {
  stats: IncomeStat[];
  actions: IncomeActionItem[];
  packageHealth: PackageHealthItem[];
  gapOpportunities: IncomeActionItem[];
  incomeRows: IncomeRow[];
  growthInsights: GrowthInsights;
};

type InstructorIncomeTabsProps = {
  secondaryStats: IncomeStat[];
  overviewSignals: OverviewSection[];
  cockpit: InstructorIncomeCockpitView;
};

export function InstructorIncomeTabs({
  secondaryStats,
  overviewSignals,
  cockpit,
}: InstructorIncomeTabsProps) {
  const overviewHeaderTones = [
    "border-sky-200/80 bg-sky-50/90 dark:border-sky-400/20 dark:bg-sky-500/10",
    "border-amber-200/80 bg-amber-50/90 dark:border-amber-400/20 dark:bg-amber-500/10",
    "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10",
  ];
  const sectionTones = [
    {
      card: "border-sky-200/80 bg-sky-50/40 dark:border-sky-400/20 dark:bg-sky-500/10",
      icon: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200",
      item: "border-sky-200/80 bg-sky-50/90 dark:border-sky-400/20 dark:bg-sky-500/10",
      dot: "bg-sky-500 dark:bg-sky-300",
    },
    {
      card: "border-amber-200/80 bg-amber-50/40 dark:border-amber-400/20 dark:bg-amber-500/10",
      icon: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
      item: "border-amber-200/80 bg-amber-50/90 dark:border-amber-400/20 dark:bg-amber-500/10",
      dot: "bg-amber-500 dark:bg-amber-300",
    },
  ];
  const secondaryStatTones = [
    "from-emerald-500/12 to-cyan-500/10",
    "from-sky-500/12 to-indigo-500/10",
    "from-slate-500/12 to-sky-500/8",
    "from-amber-500/14 to-rose-500/10",
  ];
  const overviewHeader = [
    {
      label: "Klaar om te sturen",
      value: `${cockpit.actions.length}`,
      hint: "Directe opvolgacties",
      icon: Sparkles,
    },
    {
      label: "Open gaten",
      value: `${cockpit.gapOpportunities.length}`,
      hint: "Boekbare kansen",
      icon: CircleAlert,
    },
    {
      label: "Pakketlijnen",
      value: `${cockpit.packageHealth.length}`,
      hint: "Actieve dekking",
      icon: WalletCards,
    },
  ];

  function handleTabChange(value: string) {
    if (value !== "overzicht" && value !== "cockpit") {
      return;
    }

    setActiveTab(value);
  }
  const [activeTab, setActiveTab] = useState<"overzicht" | "cockpit">("overzicht");

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <div className="rounded-[1.8rem] border border-white/70 bg-white/88 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-white/6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase dark:text-sky-300">
              Inkomsten flow
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
              Stuur rustig tussen overzicht en cockpit
            </h2>
            <p className="mt-1 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
              Eerst je kernsignalen, daarna de diepere omzetlaag met pakketwaarde,
              gaten en vervolgstappen.
            </p>
          </div>

          <TabsList
            variant="line"
            className="w-full justify-start gap-1 overflow-x-auto rounded-full bg-slate-100/80 p-1 dark:bg-white/6 lg:w-auto"
          >
            <TabsTrigger
              value="overzicht"
              className="rounded-full px-4 py-2 text-[13px] data-active:bg-white dark:data-active:bg-white/10"
            >
              Overzicht
            </TabsTrigger>
            <TabsTrigger
              value="cockpit"
              className="rounded-full px-4 py-2 text-[13px] data-active:bg-white dark:data-active:bg-white/10"
            >
              Cockpit
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {overviewHeader.map((item) => (
            <div
              key={item.label}
              className={cn(
                "rounded-[1.15rem] border px-3.5 py-3",
                overviewHeaderTones[
                  item.label === "Klaar om te sturen"
                    ? 0
                    : item.label === "Open gaten"
                      ? 1
                      : 2
                ]
              )}
            >
              <div className="flex items-center gap-2">
                <item.icon className="size-3.5 text-primary dark:text-sky-200" />
                <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                  {item.label}
                </p>
              </div>
              <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                {item.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                {item.hint}
              </p>
            </div>
          ))}
        </div>
      </div>

      <TabsContent value="overzicht" className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
          {overviewSignals.map((section, sectionIndex) => {
            const tone =
              sectionTones[sectionIndex] ?? sectionTones[sectionTones.length - 1];

            return (
              <div
                key={section.title}
                className={cn(
                  "overflow-hidden rounded-[1.5rem] border shadow-[0_22px_70px_-42px_rgba(15,23,42,0.28)]",
                  tone.card
                )}
              >
                <div className="border-b border-slate-200/80 px-6 py-5 dark:border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                        {section.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Rustige samenvatting van de belangrijkste omzet- en opvolgsignalen.
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-2xl",
                        tone.icon
                      )}
                    >
                      {sectionIndex === 0 ? (
                        <Sparkles className="size-4" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-6">
                  {section.items.map((item, index) => (
                    <div
                      key={`${section.title}-${index}`}
                      className={cn(
                        "rounded-[1.15rem] border px-4 py-3.5 text-sm",
                        tone.item
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 size-2 shrink-0 rounded-full",
                            tone.dot
                          )}
                        />
                        <p className="font-semibold leading-6 text-slate-950 dark:text-white">
                          {item}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {secondaryStats.map((stat, index) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-[1.35rem] border border-white/70 bg-white/88 p-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/6"
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-18 bg-gradient-to-r opacity-80",
                  secondaryStatTones[index] ??
                    "from-slate-500/10 to-transparent"
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
      </TabsContent>

      <TabsContent value="cockpit" className="space-y-6">
        <InstructorIncomeCockpitPanel
          stats={cockpit.stats}
          secondaryStats={secondaryStats}
          actions={cockpit.actions}
          packageHealth={cockpit.packageHealth}
          gapOpportunities={cockpit.gapOpportunities}
          incomeRows={cockpit.incomeRows}
          growthInsights={cockpit.growthInsights}
        />
      </TabsContent>
    </Tabs>
  );
}
