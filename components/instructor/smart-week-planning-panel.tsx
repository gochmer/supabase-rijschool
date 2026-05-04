"use client";

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
      <Button className="w-full rounded-lg" disabled>
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
      return "border-amber-300/25 bg-amber-400/10 text-amber-100";
    case "sky":
      return "border-sky-300/25 bg-sky-400/10 text-sky-100";
    case "violet":
      return "border-violet-300/25 bg-violet-400/10 text-violet-100";
    default:
      return "border-emerald-300/25 bg-emerald-400/10 text-emerald-100";
  }
}

function getSuggestedTitle(proposal: SmartWeekPlanningProposal) {
  if (proposal.student.pakket && proposal.student.pakket !== "Nog geen pakket") {
    return proposal.student.pakket;
  }

  return "Rijles";
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

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4 text-white">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-400/15 text-violet-100">
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white">Slimme weekplanning</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Combineer open plekken met leerlingen zonder vervolgafspraak.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
        <div className="rounded-lg border border-white/10 bg-white/6 p-3">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
            Open plekken
          </p>
          <p className="mt-1 text-xl font-semibold">{openSlotCount}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/6 p-3">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
            Te plannen
          </p>
          <p className="mt-1 text-xl font-semibold">{candidateCount}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/6 p-3">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
            Geblokkeerd
          </p>
          <p className="mt-1 text-xl font-semibold">{blockedCandidateCount}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row xl:flex-col">
        <Button
          className="rounded-lg bg-violet-500 text-white hover:bg-violet-400"
          disabled={!canSuggest}
          onClick={() => setShowProposals((value) => !value)}
          type="button"
        >
          <Sparkles className="size-4" />
          {showProposals ? "Voorstellen verbergen" : "Stel planning voor"}
        </Button>
        <Button asChild className="rounded-lg" variant="outline">
          <Link href="/instructeur/beschikbaarheid">
            Weekplanning beheren
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {!canSuggest ? (
        <div className="mt-4 rounded-lg border border-dashed border-white/12 bg-slate-950/22 p-4">
          <CheckCircle2 className="size-5 text-emerald-300" />
          <p className="mt-2 text-sm font-semibold text-white">
            Geen voorstel nodig
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Er zijn geen passende open plekken of leerlingen die nu gepland
            kunnen worden.
          </p>
        </div>
      ) : null}

      {visibleProposals.length ? (
        <div className="mt-4 space-y-3">
          {visibleProposals.map((proposal) => (
            <div
              key={proposal.id}
              className={cn(
                "rounded-lg border p-3 shadow-[0_16px_48px_-38px_rgba(0,0,0,0.95)]",
                getToneClasses(proposal.tone),
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge className="bg-white/15 text-white" variant="default">
                    {proposal.priorityLabel}
                  </Badge>
                  <p className="mt-3 truncate font-semibold text-white">
                    {proposal.student.naam}
                  </p>
                  <p className="mt-1 truncate text-xs text-white/70">
                    {proposal.student.pakket}
                  </p>
                </div>
                <div className="rounded-full border border-white/15 bg-slate-950/30 px-2 py-1 text-xs font-semibold text-white/80">
                  {Math.min(99, proposal.score)}%
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm text-white/82">
                <span className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-white/60" />
                  {proposal.dateLabel}
                </span>
                <span className="flex items-center gap-2">
                  <Clock3 className="size-4 text-white/60" />
                  {proposal.timeLabel} ({proposal.durationLabel})
                </span>
                <span className="flex items-center gap-2">
                  <PackageCheck className="size-4 text-white/60" />
                  {proposal.student.pakketIngeplandeLessen ??
                    proposal.student.gekoppeldeLessen}{" "}
                  les{(proposal.student.pakketIngeplandeLessen ??
                    proposal.student.gekoppeldeLessen) === 1
                    ? ""
                    : "sen"}{" "}
                  gepland
                </span>
              </div>

              <p className="mt-3 text-xs leading-5 text-white/68">
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
                  triggerClassName="w-full rounded-lg bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                  triggerLabel="Plan voorstel"
                />
              </div>
            </div>
          ))}

          {proposals.length > 2 && !showProposals ? (
            <Button
              className="w-full rounded-lg"
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
    </div>
  );
}
