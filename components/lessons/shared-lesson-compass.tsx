"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Compass,
  GaugeCircle,
  LoaderCircle,
  MessageSquareHeart,
  Radio,
  Sparkles,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  saveInstructorLessonCompassAction,
  saveLearnerLessonCompassAction,
} from "@/lib/actions/lesson-compass";
import { createClient } from "@/lib/supabase/client";
import type { SharedLessonCompassBoard } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CONFIDENCE_OPTIONS = [
  { value: 1, label: "Vast" },
  { value: 2, label: "Twijfel" },
  { value: 3, label: "Ok" },
  { value: 4, label: "Sterk" },
  { value: 5, label: "Klaar" },
] as const;

function getLastUpdateCopy(board: SharedLessonCompassBoard) {
  if (!board.updated_label) {
    return "Nog geen live update gedeeld";
  }

  if (board.last_updated_by === "leerling") {
    return `Laatste update van leerling - ${board.updated_label}`;
  }

  if (board.last_updated_by === "instructeur") {
    return `Laatste update van instructeur - ${board.updated_label}`;
  }

  return `Laatst bijgewerkt - ${board.updated_label}`;
}

function SharedLessonCompassCard({
  board,
  role,
}: {
  board: SharedLessonCompassBoard;
  role: "leerling" | "instructeur";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [focus, setFocus] = useState(board.instructor_focus ?? "");
  const [mission, setMission] = useState(board.instructor_mission ?? "");
  const [confidence, setConfidence] = useState<number | null>(
    board.learner_confidence ?? null
  );
  const [helpRequest, setHelpRequest] = useState(board.learner_help_request ?? "");

  const otherSideTitle =
    role === "instructeur" ? "Check-in leerling" : "Coachfocus";
  const mySideTitle =
    role === "instructeur" ? "Wat jij nu meegeeft" : "Wat jij nu teruggeeft";

  function handleSave() {
    startTransition(async () => {
      const result =
        role === "instructeur"
          ? await saveInstructorLessonCompassAction({
              leerlingId: board.leerling_id,
              instructeurId: board.instructeur_id,
              focus,
              mission,
            })
          : await saveLearnerLessonCompassAction({
              leerlingId: board.leerling_id,
              instructeurId: board.instructeur_id,
              confidence,
              helpRequest,
            });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/85 p-4 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-slate-950 dark:text-white">
              {board.counterpart_name}
            </p>
            <Badge variant={board.pulse_variant}>{board.pulse_label}</Badge>
          </div>
          <p className="mt-1 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            Gekoppeld met {board.counterpart_role}
          </p>
          <p className="mt-1.5 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
            {board.next_touchpoint ?? "Zodra er een concreet lesmoment staat, zie je die hier terug."}
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
          {getLastUpdateCopy(board)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <div className="rounded-[1rem] border border-slate-200 bg-white/92 p-3 dark:border-white/10 dark:bg-white/6">
          <div className="flex items-center gap-2">
            {role === "instructeur" ? (
              <GaugeCircle className="size-4 text-primary" />
            ) : (
              <Target className="size-4 text-primary" />
            )}
            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
              {otherSideTitle}
            </p>
          </div>

          {role === "instructeur" ? (
            <div className="mt-3 space-y-3">
              <div className="rounded-[0.9rem] bg-slate-50 px-3 py-2.5 dark:bg-white/5">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                  Zelfvertrouwen
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {CONFIDENCE_OPTIONS.map((option) => {
                    const active = board.learner_confidence === option.value;

                    return (
                      <span
                        key={option.value}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          active
                            ? "bg-sky-100 text-sky-700 dark:bg-sky-500/18 dark:text-sky-200"
                            : "bg-slate-100 text-slate-500 dark:bg-white/7 dark:text-slate-400"
                        )}
                      >
                        {option.value} / {option.label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-[0.9rem] bg-slate-50 px-3 py-2.5 dark:bg-white/5">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                  Hulpvraag
                </p>
                <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                  {board.learner_help_request?.trim()
                    ? board.learner_help_request.trim()
                    : "Nog geen hulpvraag gedeeld. De leerling kan hier live aangeven waar extra hulp nodig is."}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="rounded-[0.9rem] bg-slate-50 px-3 py-2.5 dark:bg-white/5">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                  Volgende lesfocus
                </p>
                <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                  {board.instructor_focus?.trim()
                    ? board.instructor_focus.trim()
                    : "Nog geen coachfocus gedeeld. Hier verschijnt straks wat je instructeur als volgende prioriteit ziet."}
                </p>
              </div>
              <div className="rounded-[0.9rem] bg-slate-50 px-3 py-2.5 dark:bg-white/5">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                  Mini missie
                </p>
                <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                  {board.instructor_mission?.trim()
                    ? board.instructor_mission.trim()
                    : "Nog geen mini-missie gezet. Zodra je instructeur een compacte opdracht meegeeft, zie je die hier."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[1rem] border border-slate-200 bg-white/92 p-3 dark:border-white/10 dark:bg-white/6">
          <div className="flex items-center gap-2">
            {role === "instructeur" ? (
              <Sparkles className="size-4 text-primary" />
            ) : (
              <MessageSquareHeart className="size-4 text-primary" />
            )}
            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
              {mySideTitle}
            </p>
          </div>

          {role === "instructeur" ? (
            <div className="mt-3 space-y-3">
              <Textarea
                value={focus}
                onChange={(event) => setFocus(event.target.value)}
                placeholder="Bijvoorbeeld: rustig schakelen in druk stadsverkeer en eerder vooruitkijken."
                className="min-h-24 rounded-[0.95rem] text-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
              />
              <Input
                value={mission}
                onChange={(event) => setMission(event.target.value)}
                placeholder="Mini missie voor tussen nu en de volgende les"
                className="h-9 rounded-[0.95rem] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
              />
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {CONFIDENCE_OPTIONS.map((option) => {
                  const active = confidence === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setConfidence(option.value)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                        active
                          ? "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-200"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:hover:border-white/18"
                      )}
                    >
                      {option.value} / {option.label}
                    </button>
                  );
                })}
              </div>
              <Textarea
                value={helpRequest}
                onChange={(event) => setHelpRequest(event.target.value)}
                placeholder="Waar wil je volgende les extra hulp op? Bijvoorbeeld kruispunten, kijkritme of hellingproef."
                className="min-h-24 rounded-[0.95rem] text-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
              />
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="h-9 rounded-full text-[12px]"
            >
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Compass className="size-4" />
              )}
              {role === "instructeur"
                ? "Duw naar leerlingdashboard"
                : "Check-in live delen"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SharedLessonCompass({
  boards,
  role,
}: {
  boards: SharedLessonCompassBoard[];
  role: "leerling" | "instructeur";
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPulse, setLastPulse] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();
  const refreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const queueRefresh = (message: string) => {
      setLastPulse(message);

      if (document.visibilityState === "hidden") {
        return;
      }

      if (refreshTimeoutRef.current) {
        return;
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        refreshTimeoutRef.current = null;
        startTransition(() => router.refresh());
      }, 250);
    };

    const channel = supabase
      .channel(`lesson-compass-${role}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leskompassen" },
        () => {
          queueRefresh("Leskompas beweegt live mee");
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      void supabase.removeChannel(channel);
    };
  }, [role, router, supabase]);

  return (
    <section className="rounded-[1.7rem] border border-white/70 bg-white/90 p-5 shadow-[0_26px_86px_-48px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="gap-1.5">
              <Compass className="size-3.5" />
              Live leskompas
            </Badge>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
              <span
                className={cn(
                  "relative flex size-2.5",
                  isConnected ? "text-emerald-400" : "text-amber-300"
                )}
              >
                <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-current opacity-35" />
                <span className="relative inline-flex size-2.5 rounded-full bg-current" />
              </span>
              <Radio className="size-3.5" />
              {isConnected ? "Live gekoppeld" : "Verbinden..."}
              {isRefreshing
                ? " - verversen"
                : lastPulse
                  ? ` - ${lastPulse}`
                  : null}
            </div>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">
            Wat jij hier bijwerkt, staat direct op het dashboard van de ander.
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Dit is jullie gedeelde coachkaart voor de volgende les. Geen losse
            chat of statisch notitieveld, maar een live afstemming tussen
            instructeur en leerling over focus, zelfvertrouwen en hulpvraag.
          </p>
        </div>
      </div>

      {boards.length ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {boards.map((board) => (
            <SharedLessonCompassCard
              key={`${board.leerling_id}-${board.instructeur_id}-${board.updated_at ?? "new"}`}
              board={board}
              role={role}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[1.2rem] border border-dashed border-slate-300 px-4 py-5 text-sm leading-6 text-slate-600 dark:border-white/12 dark:text-slate-300">
          {role === "instructeur"
            ? "Zodra een leerling echt aan jouw traject hangt, verschijnt hier automatisch een gedeeld leskompas om samen focus en hulpvragen vast te leggen."
            : "Zodra je een actief traject of ingeplande les met een instructeur hebt, verschijnt hier automatisch jullie gedeelde leskompas."}
        </div>
      )}
    </section>
  );
}
