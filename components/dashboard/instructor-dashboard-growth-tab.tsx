"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { InstructorGrowthRadar } from "@/components/dashboard/instructor-growth-radar";

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

type InstructorDashboardGrowthTabProps = {
  growthInsights: GrowthInsights;
  growthTips: string[];
};

export function InstructorDashboardGrowthTab({
  growthInsights,
  growthTips,
}: InstructorDashboardGrowthTabProps) {
  return (
    <div className="space-y-5">
      <InstructorGrowthRadar insights={growthInsights} />

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[1.8rem] border border-white/70 bg-white/90 p-5 shadow-[0_26px_86px_-48px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-white/6">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
            Groei focus
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
            Waar bouw je nu het slimst op door?
          </h2>
          <div className="mt-4 grid gap-2">
            {growthTips.map((tip) => (
              <div
                key={tip}
                className="rounded-[1rem] bg-slate-50/85 px-3 py-2.5 text-sm leading-6 text-slate-700 dark:bg-white/6 dark:text-slate-300"
              >
                {tip}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,249,255,0.9))] p-5 shadow-[0_26px_86px_-48px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
            Slimme vervolgstappen
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
            Werk je verkoop- en groeilaag bij
          </h2>
          <div className="mt-4 grid gap-3">
            {[
              {
                href: "/instructeur/pakketten",
                label: "Aanbod",
                title: "Pakketten aanscherpen",
                text: "Verbeter prijs, structuur en presentatie van je aanbod.",
              },
              {
                href: "/instructeur/profiel",
                label: "Profiel",
                title: "Publiek vertrouwen verhogen",
                text: "Werk bio, specialisaties en zichtbare kwaliteitssignalen bij.",
              },
              {
                href: "/instructeur/inkomsten",
                label: "Omzet",
                title: "Inkomsten cockpit openen",
                text: "Zie waar pakketten, gaten en vervolgstappen direct geld opleveren.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[1.15rem] border border-slate-200 bg-white/82 p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-36px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
                      {item.label}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {item.text}
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
