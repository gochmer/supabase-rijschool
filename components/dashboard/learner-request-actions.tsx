"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  cancelLessonRequestAction,
  rescheduleLessonRequestAction,
} from "@/lib/actions/lesson-requests";
import type { LesStatus } from "@/lib/types";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function LearnerRequestActions({
  requestId,
  status,
}: {
  requestId: string;
  status: LesStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const dateId = useId();
  const timeId = useId();
  const reasonId = useId();
  const cancelReasonId = useId();

  if (status !== "aangevraagd") {
    return (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Geen acties beschikbaar
      </span>
    );
  }

  function handleReschedule(formData: FormData) {
    startTransition(async () => {
      const result = await rescheduleLessonRequestAction({
        requestId,
        datum: String(formData.get("datum") ?? ""),
        tijdvak: String(formData.get("tijdvak") ?? ""),
        reden: String(formData.get("reden") ?? ""),
      });

      if (result.success) {
        toast.success(result.message);
        setRescheduleOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleCancel(formData: FormData) {
    startTransition(async () => {
      const result = await cancelLessonRequestAction({
        requestId,
        reden: String(formData.get("reden") ?? ""),
      });

      if (result.success) {
        toast.success(result.message);
        setCancelOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="rounded-full">
            Verplaatsen
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
          <DialogHeader>
            <DialogTitle>Aanvraag verplaatsen</DialogTitle>
            <DialogDescription>
              Kies een nieuw voorkeursmoment en geef eventueel aan waarom je wilt
              verplaatsen.
            </DialogDescription>
          </DialogHeader>

          <form action={handleReschedule} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={dateId}>Nieuwe datum</Label>
                <Input
                  id={dateId}
                  name="datum"
                  type="date"
                  required
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={timeId}>Nieuw tijdvak</Label>
                <Input
                  id={timeId}
                  name="tijdvak"
                  placeholder="Bijvoorbeeld 18:00 - 19:30"
                  required
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={reasonId}>Toelichting</Label>
              <Textarea
                id={reasonId}
                name="reden"
                placeholder="Bijvoorbeeld: ik kan toch niet op het eerdere moment."
                className="min-h-24 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRescheduleOpen(false)}
              >
                Annuleren
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Opslaan..." : "Nieuw moment opslaan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="rounded-full">
            Annuleren
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
          <DialogHeader>
            <DialogTitle>Aanvraag annuleren</DialogTitle>
            <DialogDescription>
              Geef kort aan waarom deze aanvraag vervalt. De instructeur ziet die
              reden meteen terug.
            </DialogDescription>
          </DialogHeader>

          <form action={handleCancel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={cancelReasonId}>Reden van annuleren</Label>
              <Textarea
                id={cancelReasonId}
                name="reden"
                placeholder="Bijvoorbeeld: ik kies toch een ander pakket of een andere datum."
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
                {isPending ? "Annuleren..." : "Aanvraag annuleren"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
