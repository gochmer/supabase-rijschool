"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarClock,
  CheckCircle2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  saveInstructorLessonCheckinFocusAction,
  saveLearnerLessonCheckinAction,
} from "@/lib/actions/lesson-checkins";
import type {
  LessonCheckinArrivalMode,
  LessonCheckinBoard,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function getConfidenceLabel(value: number | null | undefined) {
  if (!value) {
    return "Nog niet ingevuld";
  }

  if (value >= 4) {
    return `${value}/5 - klaar voor focus`;
  }

  if (value === 3) {
    return "3/5 - neutraal";
  }

  return `${value}/5 - extra begeleiding fijn`;
}

function getConfidenceVariant(value: number | null | undefined) {
  if (!value) {
    return "info" as const;
  }

  if (value >= 4) {
    return "success" as const;
  }

  if (value === 3) {
    return "warning" as const;
  }

  return "danger" as const;
}

export function LessonCheckinPanel({
  boards,
  role,
}: {
  boards: LessonCheckinBoard[];
  role: "leerling" | "instructeur";
}) {
  const [isPending, startTransition] = useTransition();
  const [localBoards, setLocalBoards] = useState(boards);

  const title =
    role === "leerling" ? "Voor de les check-in" : "Live les-check-ins";
  const description =
    role === "leerling"
      ? "Geef voor je volgende les alvast door hoe je je voelt, of je op tijd bent en waar je vandaag hulp bij wilt."
      : "Zie nog voor de les waar een leerling spanning voelt en zet je focus direct terug op het dashboard.";

  const sortedBoards = useMemo(
    () => [...localBoards],
    [localBoards]
  );

  function updateBoardState(
    lessonId: string,
    updater: (board: LessonCheckinBoard) => LessonCheckinBoard
  ) {
    setLocalBoards((current) =>
      current.map((board) => (board.les_id === lessonId ? updater(board) : board))
    );
  }

  return (
    <section className="rounded-[1.65rem] border border-white/70 bg-white/88 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.34)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase dark:text-sky-300">
            Dashboard interactie
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </div>
        <Badge variant="info">
          {role === "leerling" ? "Voor jouw volgende les" : "Voor aankomende lessen"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {sortedBoards.length ? (
          sortedBoards.map((board) => (
            <article
              key={board.les_id}
              className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/88 p-4 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-semibold text-slate-950 dark:text-white">
                      {board.lesson_title}
                    </p>
                    <Badge variant={getConfidenceVariant(board.confidence_level)}>
                      {getConfidenceLabel(board.confidence_level)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                    {role === "leerling" ? board.counterpart_name : `Met ${board.counterpart_name}`} · {board.lesson_date} om {board.lesson_time}
                  </p>
                </div>
                <CalendarClock className="size-4 text-slate-400 dark:text-slate-500" />
              </div>

              {role === "leerling" ? (
                <LearnerCheckinEditor
                  board={board}
                  isPending={isPending}
                  onLocalUpdate={(updater) => updateBoardState(board.les_id, updater)}
                  onSave={(payload) =>
                    startTransition(async () => {
                      const previous = board;
                      updateBoardState(board.les_id, (current) => ({
                        ...current,
                        ...payload,
                      }));

                      const result = await saveLearnerLessonCheckinAction({
                        lessonId: board.les_id,
                        confidenceLevel: payload.confidence_level ?? null,
                        supportRequest: payload.support_request ?? "",
                        arrivalMode: payload.arrival_mode ?? null,
                      });

                      if (!result.success) {
                        updateBoardState(board.les_id, () => previous);
                        toast.error(result.message);
                        return;
                      }

                      toast.success(result.message);
                    })
                  }
                />
              ) : (
                <InstructorCheckinEditor
                  board={board}
                  isPending={isPending}
                  onLocalUpdate={(updater) => updateBoardState(board.les_id, updater)}
                  onSave={(focus) =>
                    startTransition(async () => {
                      const previous = board;
                      updateBoardState(board.les_id, (current) => ({
                        ...current,
                        instructor_focus: focus,
                      }));

                      const result = await saveInstructorLessonCheckinFocusAction({
                        lessonId: board.les_id,
                        instructorFocus: focus,
                      });

                      if (!result.success) {
                        updateBoardState(board.les_id, () => previous);
                        toast.error(result.message);
                        return;
                      }

                      toast.success(result.message);
                    })
                  }
                />
              )}
            </article>
          ))
        ) : (
          <div className="rounded-[1.2rem] border border-dashed border-slate-300/80 bg-slate-50/85 p-5 text-sm leading-6 text-slate-600 dark:border-white/12 dark:bg-white/5 dark:text-slate-300 xl:col-span-2">
            {role === "leerling"
              ? "Zodra je een aankomende les hebt, verschijnt hier een live check-in kaart waarmee je alvast je focus en spanning kunt delen."
              : "Zodra er aankomende lessen zijn, verschijnen hier live check-ins van leerlingen zodat je de lesfocus al kunt aanscherpen."}
          </div>
        )}
      </div>
    </section>
  );
}

function LearnerCheckinEditor({
  board,
  isPending,
  onLocalUpdate,
  onSave,
}: {
  board: LessonCheckinBoard;
  isPending: boolean;
  onLocalUpdate: (updater: (board: LessonCheckinBoard) => LessonCheckinBoard) => void;
  onSave: (payload: {
    confidence_level: number | null;
    support_request: string;
    arrival_mode: LessonCheckinArrivalMode | null;
  }) => void;
}) {
  const [draftMessage, setDraftMessage] = useState(board.support_request ?? "");

  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-[1rem] border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/20">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
            Vertrouwen voor vandaag
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={board.confidence_level === value ? "default" : "outline"}
                className="rounded-full"
                disabled={isPending}
                onClick={() =>
                  onLocalUpdate((current) => ({
                    ...current,
                    confidence_level: value,
                  }))
                }
              >
                {value}/5
              </Button>
            ))}
          </div>
        </div>
        <div className="rounded-[1rem] border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/20">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
            Aankomst
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={board.arrival_mode === "op_tijd" ? "default" : "outline"}
              className="rounded-full"
              disabled={isPending}
              onClick={() =>
                onLocalUpdate((current) => ({
                  ...current,
                  arrival_mode: "op_tijd",
                }))
              }
            >
              <CheckCircle2 className="size-3.5" />
              Ik ben op tijd
            </Button>
            <Button
              type="button"
              size="sm"
              variant={board.arrival_mode === "afstemmen" ? "default" : "outline"}
              className="rounded-full"
              disabled={isPending}
              onClick={() =>
                onLocalUpdate((current) => ({
                  ...current,
                  arrival_mode: "afstemmen",
                }))
              }
            >
              <MessageSquareText className="size-3.5" />
              Even afstemmen
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-[1rem] border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/20">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
          Waar wil je hulp bij?
        </p>
        <Textarea
          value={draftMessage}
          onChange={(event) => setDraftMessage(event.target.value)}
          placeholder="Bijvoorbeeld: invoegen op drukke rotondes, spanning bij examenkruispunten of rustig schakelen."
          className="mt-2 min-h-24 border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
        />
        {board.instructor_focus ? (
          <div className="mt-3 rounded-[0.9rem] border border-sky-200/80 bg-sky-50/80 px-3 py-2.5 text-[12px] leading-5 text-sky-900 dark:border-sky-400/18 dark:bg-sky-500/10 dark:text-sky-100">
            <span className="font-semibold">Lesfocus van {board.counterpart_name}:</span>{" "}
            {board.instructor_focus}
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          className="h-9 rounded-full"
          disabled={isPending}
          onClick={() =>
            onSave({
              confidence_level: board.confidence_level ?? null,
              support_request: draftMessage,
              arrival_mode: board.arrival_mode ?? null,
            })
          }
        >
          {isPending ? "Opslaan..." : "Check-in bijwerken"}
        </Button>
      </div>
    </div>
  );
}

function InstructorCheckinEditor({
  board,
  isPending,
  onLocalUpdate,
  onSave,
}: {
  board: LessonCheckinBoard;
  isPending: boolean;
  onLocalUpdate: (updater: (board: LessonCheckinBoard) => LessonCheckinBoard) => void;
  onSave: (focus: string) => void;
}) {
  const [focus, setFocus] = useState(board.instructor_focus ?? "");

  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-[1rem] border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/20">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
            Leerlingsignaal
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={getConfidenceVariant(board.confidence_level)}>
              {getConfidenceLabel(board.confidence_level)}
            </Badge>
            <Badge variant={board.arrival_mode === "afstemmen" ? "warning" : "info"}>
              {board.arrival_mode === "afstemmen"
                ? "Wil afstemmen"
                : board.arrival_mode === "op_tijd"
                  ? "Komt op tijd"
                  : "Aankomst nog open"}
            </Badge>
          </div>
          <p className="mt-3 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
            {board.support_request?.trim()
              ? board.support_request
              : "Nog geen hulpvraag ingevuld door de leerling."}
          </p>
        </div>

        <div className="rounded-[1rem] border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/20">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
            Jouw snelle lesfocus
          </p>
          <Textarea
            value={focus}
            onChange={(event) => {
              setFocus(event.target.value);
              onLocalUpdate((current) => ({
                ...current,
                instructor_focus: event.target.value,
              }));
            }}
            placeholder="Bijvoorbeeld: eerst rustig invoegen, daarna kijkritme op drukke kruispunten."
            className="mt-2 min-h-24 border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-[12px] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
          <ShieldCheck className="mr-1 inline size-3.5" />
          Leerling ziet jouw focus direct terug op het dashboard
        </div>
        <Button
          type="button"
          className="h-9 rounded-full"
          disabled={isPending || !focus.trim()}
          onClick={() => onSave(focus)}
        >
          <Sparkles className="size-3.5" />
          {isPending ? "Opslaan..." : "Focus terugsturen"}
        </Button>
      </div>
    </div>
  );
}
