"use client";

import { useState, useTransition } from "react";
import { Ban, Clock3, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { updateInstructorLearnerLessonCancellationWindowAction } from "@/lib/actions/instructor-lesson-cancellation";
import {
  LEARNER_LESSON_CANCELLATION_HOUR_OPTIONS,
  formatLearnerLessonCancellationWindowLabel,
  type LearnerLessonCancellationWindowHours,
} from "@/lib/lesson-cancellation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function InstructorLessonCancellationControl({
  hoursBeforeLesson,
}: {
  hoursBeforeLesson: number | null | undefined;
}) {
  const [selectedHours, setSelectedHours] =
    useState<LearnerLessonCancellationWindowHours | null>(
      hoursBeforeLesson === 24 ||
        hoursBeforeLesson === 48 ||
        hoursBeforeLesson === 72
        ? hoursBeforeLesson
        : null,
    );
  const [isPending, startTransition] = useTransition();

  function applyValue(nextValue: LearnerLessonCancellationWindowHours | null) {
    const previousValue = selectedHours;
    setSelectedHours(nextValue);

    startTransition(async () => {
      const result =
        await updateInstructorLearnerLessonCancellationWindowAction(nextValue);

      if (!result.success) {
        setSelectedHours(previousValue);
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  }

  const isEnabled = selectedHours != null;

  return (
    <div className="min-h-[20rem] rounded-xl border border-sky-300/16 bg-[radial-gradient(circle_at_15%_0%,rgba(14,165,233,0.14),transparent_34%),linear-gradient(145deg,rgba(9,20,35,0.98),rgba(5,13,24,0.99))] p-5 shadow-[0_22px_70px_-55px_rgba(14,165,233,0.8)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-400 uppercase">
            Les annuleren
          </p>
          <h3 className="mt-4 text-lg font-semibold text-white">
            Annuleertermijn
          </h3>
          <p className="mt-3 max-w-64 text-sm leading-6 text-slate-300">
            Bepaal tot hoe laat leerlingen zelf mogen annuleren.
          </p>
        </div>
        <div
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold leading-tight",
            isEnabled
              ? "border-emerald-300/25 bg-emerald-400/12 text-emerald-100"
              : "border-white/10 bg-white/8 text-slate-200",
          )}
        >
          {isEnabled ? (
            <ShieldCheck className="size-4" />
          ) : (
            <Ban className="size-4" />
          )}
          {formatLearnerLessonCancellationWindowLabel(selectedHours)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {LEARNER_LESSON_CANCELLATION_HOUR_OPTIONS.map((option) => (
          <Button
            key={option}
            type="button"
            variant={selectedHours === option ? "default" : "outline"}
            className={cn(
              "h-9 rounded-xl px-4 text-xs",
              selectedHours === option
                ? "bg-sky-500 text-slate-950 hover:bg-sky-400"
                : "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white",
            )}
            disabled={isPending}
            onClick={() => applyValue(option)}
          >
            <Clock3 className="size-4" />
            Tot {option} uur ervoor
          </Button>
        ))}
        <Button
          type="button"
          variant={selectedHours == null ? "default" : "outline"}
          className={cn(
            "h-9 rounded-xl px-4 text-xs",
            selectedHours == null
              ? "bg-sky-500 text-slate-950 hover:bg-sky-400"
              : "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white",
          )}
          disabled={isPending}
          onClick={() => applyValue(null)}
        >
          <Ban className="size-4" />
          Zelf annuleren uit
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge
          className={cn(
            "text-[11px]",
            isEnabled
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800",
          )}
        >
          {isEnabled ? "Zelf annuleren aan" : "Alleen via contact"}
        </Badge>
        {isEnabled ? (
          <Badge className="bg-sky-100 text-[11px] text-sky-800">
            {selectedHours} uur vooraf
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
