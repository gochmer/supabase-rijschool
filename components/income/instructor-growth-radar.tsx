"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  CalendarPlus2,
  Copy,
  Gem,
  Layers3,
  Send,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import {
  sendInstructorGapNudgeAction,
  sendInstructorPackageSuggestionAction,
} from "@/lib/actions/instructor-growth";
import type {
  InstructorGrowthInsightItem,
  InstructorGrowthInsights,
} from "@/lib/data/instructor-growth-insights";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function renderSummaryCard(label: string, value: string) {
  return (
    <div className="rounded-[1rem] border border-slate-200/80 bg-white/80 px-3 py-3 dark:border-white/10 dark:bg-slate-950/20">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-[15px] font-semibold text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function GrowthItemCard({
  item,
  onCopyDraft,
  onRunAction,
  isPending,
  wasSent,
}: {
  item: InstructorGrowthInsightItem;
  onCopyDraft: (item: InstructorGrowthInsightItem) => void;
  onRunAction: (item: InstructorGrowthInsightItem) => void;
  isPending: boolean;
  wasSent: boolean;
}) {
  return (
    <div className="rounded-[1rem] border border-slate-200/80 bg-white/85 p-3 dark:border-white/10 dark:bg-slate-950/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold text-slate-950 dark:text-white">
              {item.title}
            </p>
            <Badge variant={item.badge}>{item.badgeLabel}</Badge>
          </div>
          <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
            {item.detail}
          </p>
          {item.meta ? (
            <p className="mt-2 text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {item.meta}
            </p>
          ) : null}
          {item.draftText ? (
            <div className="mt-3 rounded-[0.9rem] border border-sky-200/80 bg-sky-50/85 px-3 py-2 text-[12px] leading-5 text-sky-950 dark:border-sky-400/18 dark:bg-sky-500/10 dark:text-sky-100">
              <span className="font-semibold">Concept:</span> {item.draftText}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.actionType ? (
          <Button
            type="button"
            className="h-8 rounded-full px-3 text-[12px]"
            disabled={isPending}
            onClick={() => onRunAction(item)}
          >
            <Send className="mr-1 size-3.5" />
            {wasSent ? "Nogmaals sturen" : item.ctaLabel}
          </Button>
        ) : null}
        {item.draftText ? (
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-full px-3 text-[12px]"
            onClick={() => onCopyDraft(item)}
          >
            <Copy className="mr-1 size-3.5" />
            Kopieer draft
          </Button>
        ) : null}
        <Button asChild type="button" variant="outline" className="h-8 rounded-full px-3 text-[12px]">
          <Link href={item.href}>
            {item.openLabel ?? "Open"}
            <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function GrowthColumn({
  icon: Icon,
  title,
  items,
  emptyText,
  onCopyDraft,
  onRunAction,
  isPending,
  sentIds,
}: {
  icon: typeof Gem;
  title: string;
  items: InstructorGrowthInsightItem[];
  emptyText: string;
  onCopyDraft: (item: InstructorGrowthInsightItem) => void;
  onRunAction: (item: InstructorGrowthInsightItem) => void;
  isPending: boolean;
  sentIds: Set<string>;
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/88 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-slate-500 dark:text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
          {title}
        </h3>
      </div>
      <div className="mt-3 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <GrowthItemCard
              key={item.id}
              item={item}
              onCopyDraft={onCopyDraft}
              onRunAction={onRunAction}
              isPending={isPending}
              wasSent={sentIds.has(item.id)}
            />
          ))
        ) : (
          <div className="rounded-[1rem] border border-dashed border-slate-300/80 bg-white/80 p-4 text-sm leading-6 text-slate-600 dark:border-white/12 dark:bg-slate-950/20 dark:text-slate-300">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

export function InstructorGrowthRadar({
  insights,
}: {
  insights: InstructorGrowthInsights;
}) {
  const [isPending, startTransition] = useTransition();
  const [sentIds, setSentIds] = useState<string[]>([]);

  function markSent(id: string) {
    setSentIds((current) =>
      current.includes(id) ? current : [...current, id]
    );
  }

  async function copyDraft(item: InstructorGrowthInsightItem) {
    if (!item.draftText?.trim()) {
      toast.error("Er is nog geen drafttekst beschikbaar.");
      return;
    }

    try {
      await navigator.clipboard.writeText(item.draftText);
      toast.success("Draft gekopieerd.");
    } catch {
      toast.error("Kopieren lukt hier niet. Probeer het opnieuw.");
    }
  }

  function runAction(item: InstructorGrowthInsightItem) {
    startTransition(async () => {
      if (item.actionType === "package_suggestion") {
        if (!item.suggestedPackageId || !item.id) {
          toast.error("Dit pakketvoorstel is niet compleet.");
          return;
        }

        const leerlingId = item.id.replace(/^package-empty-/, "")
          .replace(/^package-light-/, "")
          .replace(/^upgrade-/, "");
        const result = await sendInstructorPackageSuggestionAction({
          leerlingId,
          suggestedPackageId: item.suggestedPackageId,
          currentPackageName: item.currentPackageName ?? null,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        markSent(item.id);
        toast.success(result.message);
        return;
      }

      if (item.actionType === "gap_nudge") {
        if (
          !item.nudgeStudentIds?.length ||
          !item.slotStartAt ||
          !item.slotEndAt
        ) {
          toast.error("Deze nudge mist nog een open moment of doelgroep.");
          return;
        }

        const result = await sendInstructorGapNudgeAction({
          leerlingIds: item.nudgeStudentIds,
          slotStartAt: item.slotStartAt,
          slotEndAt: item.slotEndAt,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        markSent(item.id);
        toast.success(result.message);
      }
    });
  }

  return (
    <section className="rounded-[1.8rem] border border-white/70 bg-white/90 p-5 shadow-[0_26px_86px_-48px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase dark:text-sky-300">
            Groei en omzet
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
            Slimme prijs-, planning- en pakketkansen
          </h2>
          <p className="mt-1.5 max-w-3xl text-[13px] leading-6 text-slate-600 dark:text-slate-300">
            Deze laag kijkt waar je trajecten logischer, voller en waardevoller kunnen worden:
            wie nog een pakket mist, welke open momenten je slim kunt vullen en wie klaar is
            voor een grotere volgende stap.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/instructeur/pakketten">Pakketten openen</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/instructeur/beschikbaarheid">Agenda openen</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/instructeur/leerlingen">Leerlingenwerkplek</Link>
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {renderSummaryCard("Vandaag eerst", insights.summary.headline)}
        {renderSummaryCard(
          "Geschatte groeikans",
          insights.summary.estimatedGrowthValueLabel
        )}
        {renderSummaryCard(
          "Nudge doelgroep",
          insights.summary.nudgeAudienceLabel
        )}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <GrowthColumn
          icon={Gem}
          title="Slimme prijs- en pakketkansen"
          items={insights.packageOpportunities}
          emptyText="Je actieve trajecten hebben op dit moment geen duidelijke gemiste pakket- of prijsstap. De basis staat netjes."
          onCopyDraft={copyDraft}
          onRunAction={runAction}
          isPending={isPending}
          sentIds={new Set(sentIds)}
        />
        <GrowthColumn
          icon={CalendarPlus2}
          title="Vrije gaten opvullen"
          items={insights.fillGaps}
          emptyText="Je komende week heeft nu geen open boekbare gaten meer die eruit springen. Je agenda zit mooi dicht."
          onCopyDraft={copyDraft}
          onRunAction={runAction}
          isPending={isPending}
          sentIds={new Set(sentIds)}
        />
        <GrowthColumn
          icon={Layers3}
          title="Wie kan door naar groter pakket"
          items={insights.upgradeCandidates}
          emptyText="Er staat nu niemand heel duidelijk op het punt om door te schuiven naar een groter pakket. Eerst verder laten bouwen."
          onCopyDraft={copyDraft}
          onRunAction={runAction}
          isPending={isPending}
          sentIds={new Set(sentIds)}
        />
      </div>

      <div className="mt-4 rounded-[1.15rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(37,99,235,0.08),rgba(14,165,233,0.08))] px-4 py-3 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(37,99,235,0.16),rgba(14,165,233,0.08))]">
        <div className="flex flex-wrap items-center gap-2">
          <TrendingUp className="size-4 text-primary dark:text-sky-300" />
          <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
            Slimme volgorde: eerst trajecten zonder pakket rechtzetten, daarna open slots
            vullen en dan pas grotere pakketten voorstellen.
          </p>
        </div>
      </div>
    </section>
  );
}
