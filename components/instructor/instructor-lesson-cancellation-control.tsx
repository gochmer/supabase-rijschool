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
  const [selectedHours, setSelectedHours] = useState<
    LearnerLessonCancellationWindowHours | null
  >(
    hoursBeforeLesson === 24 ||
      hoursBeforeLesson === 48 ||
      hoursBeforeLesson === 72
      ? hoursBeforeLesson
      : null
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
    <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
            Les annuleren
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
            Annuleertermijn
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Bepaal tot hoe laat leerlingen zelf mogen annuleren.
          </p>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
            isEnabled
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100"
              : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200"
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
            className="h-9 rounded-full px-4"
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
          className="h-9 rounded-full px-4"
          disabled={isPending}
          onClick={() => applyValue(null)}
        >
          <Ban className="size-4" />
          Zelf annuleren uit
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant={isEnabled ? "success" : "warning"}>
          {isEnabled ? "Zelf annuleren aan" : "Alleen via contact"}
        </Badge>
        {isEnabled ? <Badge variant="info">{selectedHours} uur vooraf</Badge> : null}
      </div>
    </div>
  );
}
