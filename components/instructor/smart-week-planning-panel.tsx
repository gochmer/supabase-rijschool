"use client";

import type React from "react";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  PackageCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LessonPlanningBusyWindow } from "@/components/instructor/create-manual-lesson-dialog";
import type {
  SmartWeekPlanningProposal,
  SmartWeekPlanningSlot,
} from "@/lib/instructor-smart-week-planning";
import type { InstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import type { LocationOption } from "@/lib/types";
import { cn } from "@/lib/utils";

const LazyCreateManualLessonDialog = dynamic(
  () =>
    import("@/components/instructor/create-manual-lesson-dialog").then(
      (module) => module.CreateManualLessonDialog,
    ),
  {
    loading: () => (
      <Button className="w-full rounded-xl" disabled>
        <Loader2 className="size-4 animate-spin" />
        Planner laden
      </Button>
    ),
    ssr: false,
  },
);

function getToneClasses(tone: SmartWeekPlanningProposal["tone"]) {
  switch (tone) {
    case "amber":
      return "border-amber-300/20 bg-amber-400/[0.08] text-amber-100 ring-amber-300/10";
    case "sky":
      return "border-sky-300/20 bg-sky-400/[0.08] text-sky-100 ring-sky-300/10";
    case "violet":
      return "border-violet-300/20 bg-violet-400/[0.08] text-violet-100 ring-violet-300/10";
    default:
      return "border-emerald-300/20 bg-emerald-400/[0.08] text-emerald-100 ring-emerald-300/10";
  }
}

function getSuggestedTitle(proposal: SmartWeekPlanningProposal) {
  if (
    proposal.student.pakket &&
    proposal.student.pakket !== "Nog geen pakket"
  ) {
    return proposal.student.pakket;
  }

  return "Rijles";
}

function PlanningStatPill({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.045] px-2.5 py-1 text-[11px] text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function ProposalMetaRow({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: typeof CalendarClock;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-xs text-white/75">
      <Icon className="size-4 shrink-0 text-white/45" />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

export function SmartWeekPlanningPanel({
  blockedCandidateCount,
  busyWindows,
  candidateCount,
  durationDefaults,
  locationOptions,
  openSlotCount,
  proposals,
}: {
  blockedCandidateCount: number;
  busyWindows: LessonPlanningBusyWindow[];
  candidateCount: number;
  durationDefaults: InstructorLessonDurationDefaults;
  locationOptions: LocationOption[];
  openSlotCount: number;
  proposals: SmartWeekPlanningProposal[];
}) {
  const [showProposals, setShowProposals] = useState(false);
  const visibleProposals = useMemo(
    () => (showProposals ? proposals : proposals.slice(0, 2)),
    [proposals, showProposals],
  );
  const canSuggest = proposals.length > 0;
  const topProposal = proposals[0] ?? null;

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-300/12 bg-[radial-gradient(circle_at_12%_-10%,rgba(139,92,246,0.16),transparent_32%),radial-gradient(circle_at_92%_6%,rgba(34,211,238,0.10),transparent_24%),linear-gradient(145deg,rgba(9,17,31,0.98),rgba(4,9,18,0.99))] p-4 text-white shadow-[0_30px_100px_-64px_rgba(0,0,0,0.98)] 2xl:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl border border-violet-300/18 bg-violet-400/10 text-violet-100 ring-4 ring-violet-300/10">
              <Sparkles className="size-4" />
            </span>
            <p className="text-[10px] font-bold tracking-[0.26em] text-violet-200 uppercase">
              Smart planning cockpit
            </p>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">
              Weekfocus
            </span>
          </div>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">
            Slimme weekplanning
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
            Open plekken, passende leerlingen en directe voorstellen in één
            rustige werkkaart.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:max-w-[26rem] lg:justify-end">
          <PlanningStatPill label="Open plekken" value={openSlotCount} />
          <PlanningStatPill label="Te plannen" value={candidateCount} />
          <PlanningStatPill label="Geblokkeerd" value={blockedCandidateCount} />
          <Link
            href="/instructeur/lessen"
            className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[11px] font-semibold text-sky-200 transition hover:border-sky-300/25 hover:bg-sky-400/10 hover:text-sky-100"
          >
            Volledige planning
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div
        className={cn(
          "mt-4 grid gap-3 rounded-2xl border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center",
          canSuggest
            ? "border-violet-300/14 bg-violet-400/[0.07]"
            : "border-emerald-300/14 bg-emerald-400/[0.07]",
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border",
              canSuggest
                ? "border-violet-300/18 bg-violet-400/10 text-violet-100"
                : "border-emerald-300/18 bg-emerald-400/10 text-emerald-100",
            )}
          >
            {canSuggest ? (
              <Sparkles className="size-4" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              {canSuggest ? "Planningvoorstellen beschikbaar" : "Geen voorstel nodig"}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-slate-400">
              {topProposal
                ? `${topProposal.student.naam} heeft nu de hoogste match: ${Math.min(99, topProposal.score)}% op ${topProposal.dateLabel}.`
                : "Er zijn geen passende open plekken of leerlingen die nu gepland kunnen worden."}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[20rem]">
          <Button
            className="h-9 rounded-xl bg-violet-500 text-xs font-semibold text-white hover:bg-violet-400"
            disabled={!canSuggest}
            onClick={() => setShowProposals((value) => !value)}
            type="button"
          >
            <Sparkles className="size-4" />
            {showProposals ? "Voorstellen verbergen" : "Planning voorstellen"}
          </Button>
          <Button
            asChild
            className="h-9 rounded-xl border-white/[0.08] bg-white/[0.035] text-xs font-semibold text-white hover:bg-white/[0.07]"
            variant="outline"
          >
            <Link href="/instructeur/beschikbaarheid">
              Week beheren
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {visibleProposals.length ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {visibleProposals.map((proposal) => (
            <div
              key={proposal.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-3.5 shadow-[0_20px_70px_-54px_rgba(0,0,0,0.95)] ring-4 transition-colors hover:bg-white/[0.045] 2xl:p-4",
                getToneClasses(proposal.tone),
              )}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge
                    className="rounded-full border border-white/10 bg-white/[0.10] px-2 py-0.5 text-[10px] font-semibold text-white shadow-none"
                    variant="default"
                  >
                    {proposal.priorityLabel}
                  </Badge>
                  <p className="mt-3 truncate text-base font-semibold text-white">
                    {proposal.student.naam}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-white/60">
                    {proposal.student.pakket}
                  </p>
                </div>
                <div className="shrink-0 rounded-full border border-white/12 bg-slate-950/35 px-2.5 py-1 text-xs font-semibold text-white/85">
                  {Math.min(99, proposal.score)}%
                </div>
              </div>

              <div className="mt-4 grid gap-2 rounded-xl border border-white/[0.08] bg-black/15 p-3">
                <ProposalMetaRow icon={CalendarClock}>
                  {proposal.dateLabel}
                </ProposalMetaRow>
                <ProposalMetaRow icon={Clock3}>
                  {proposal.timeLabel} ({proposal.durationLabel})
                </ProposalMetaRow>
                <ProposalMetaRow icon={PackageCheck}>
                  {proposal.student.pakketIngeplandeLessen ??
                    proposal.student.gekoppeldeLessen}{" "}
                  les
                  {(proposal.student.pakketIngeplandeLessen ??
                    proposal.student.gekoppeldeLessen) === 1
                    ? ""
                    : "sen"}{" "}
                  gepland
                </ProposalMetaRow>
              </div>

              <p className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-xs leading-5 text-white/68">
                {proposal.reason}
              </p>

              <div className="mt-3">
                <LazyCreateManualLessonDialog
                  availabilitySlots={[proposal.slot as SmartWeekPlanningSlot]}
                  busyWindows={busyWindows}
                  durationDefaults={durationDefaults}
                  leerlingId={proposal.student.id}
                  leerlingNaam={proposal.student.naam}
                  locationOptions={locationOptions}
                  studentOptions={[proposal.student]}
                  suggestedTitle={getSuggestedTitle(proposal)}
                  triggerClassName="h-9 w-full rounded-xl bg-cyan-400 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
                  triggerLabel="Plan voorstel"
                />
              </div>
            </div>
          ))}

          {proposals.length > 2 && !showProposals ? (
            <Button
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] text-xs font-semibold text-white hover:bg-white/[0.07] lg:col-span-2"
              onClick={() => setShowProposals(true)}
              type="button"
              variant="ghost"
            >
              <UserRound className="size-4" />
              Toon alle {proposals.length} voorstellen
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
