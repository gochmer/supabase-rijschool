"use client";

import { useId, useState, useTransition } from "react";
import { Ban, CircleAlert, Clock3 } from "lucide-react";
import { toast } from "sonner";

import { cancelLearnerLessonAction } from "@/lib/actions/learner-lessons";
import type { Les } from "@/lib/types";
import { formatLearnerLessonCancellationDeadline } from "@/lib/lesson-cancellation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function LearnerLessonActions({ lesson }: { lesson: Les }) {
  const [isPending, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const cancelReasonId = useId();
  const deadlineLabel = formatLearnerLessonCancellationDeadline(
    lesson.selfCancelDeadlineAt
  );

  function handleCancel(formData: FormData) {
    startTransition(async () => {
      const result = await cancelLearnerLessonAction({
        lessonId: lesson.id,
        reason: String(formData.get("reden") ?? ""),
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setCancelOpen(false);
    });
  }

  if (lesson.status !== "ingepland" && lesson.status !== "geaccepteerd") {
    return null;
  }

  if (!lesson.canSelfCancel) {
    if (!lesson.selfCancelMessage) {
      return null;
    }

    return (
      <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs leading-6 text-amber-100/90">
        <div className="flex items-start gap-2">
          <Ban className="mt-0.5 size-4 shrink-0" />
          <span>{lesson.selfCancelMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="rounded-2xl border border-emerald-300/18 bg-emerald-400/8 px-3 py-2 text-xs leading-6 text-emerald-50/92">
        <div className="flex items-start gap-2">
          <Clock3 className="mt-0.5 size-4 shrink-0" />
          <span>
            {deadlineLabel
              ? `Zelf annuleren kan nog tot ${deadlineLabel}.`
              : lesson.selfCancelMessage}
          </span>
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="rounded-full">
            <CircleAlert className="size-4" />
            Les annuleren
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
          <DialogHeader>
            <DialogTitle>Geplande les annuleren</DialogTitle>
            <DialogDescription>
              {deadlineLabel
                ? `Deze les kun je zelf annuleren tot ${deadlineLabel}. Je instructeur krijgt hier direct een melding van.`
                : "Je instructeur krijgt direct een melding zodra je deze les annuleert."}
            </DialogDescription>
          </DialogHeader>

          <form action={handleCancel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={cancelReasonId}>Reden van annuleren</Label>
              <Textarea
                id={cancelReasonId}
                name="reden"
                placeholder="Bijvoorbeeld: ik ben ziek of kan toch niet op dit moment."
                required
                className="min-h-28 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancelOpen(false)}
              >
                Terug
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Annuleren..." : "Les annuleren"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
