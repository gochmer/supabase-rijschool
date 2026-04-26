"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  cancelLessonRequestAction,
  rescheduleLessonRequestAction,
} from "@/lib/actions/lesson-requests";
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
  status: string;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [isPending, startTransition] = useTransition();

  if (status !== "aangevraagd") {
    return <span className="text-xs text-muted-foreground">Geen acties beschikbaar</span>;
  }

  function cancelRequest() {
    startTransition(async () => {
      const result = await cancelLessonRequestAction({ requestId, reden: reason });

      if (result.success) {
        toast.success(result.message);
        setCancelOpen(false);
        setReason("");
      } else {
        toast.error(result.message);
      }
    });
  }

  function rescheduleRequest() {
    startTransition(async () => {
      const result = await rescheduleLessonRequestAction({
        requestId,
        datum: date,
        tijdvak: timeSlot,
        reden: reason,
      });

      if (result.success) {
        toast.success(result.message);
        setRescheduleOpen(false);
        setReason("");
        setDate("");
        setTimeSlot("");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="grid gap-2 sm:flex [&>*]:w-full sm:[&>*]:w-auto">
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="rounded-full">
            Verplaatsen
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
          <DialogHeader>
            <DialogTitle>Aanvraag verplaatsen</DialogTitle>
            <DialogDescription>
              Kies een nieuw voorkeursmoment. De instructeur ziet je wijziging direct terug.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Nieuwe datum</Label>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nieuw tijdvak</Label>
              <Input value={timeSlot} onChange={(event) => setTimeSlot(event.target.value)} placeholder="Bijvoorbeeld 18:00 - 19:30" />
            </div>
            <div className="space-y-2">
              <Label>Toelichting</Label>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Waarom wil je verplaatsen?" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRescheduleOpen(false)}>
              Sluiten
            </Button>
            <Button type="button" onClick={rescheduleRequest} disabled={isPending || !date || !timeSlot}>
              {isPending ? "Opslaan..." : "Nieuw moment opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="rounded-full text-red-600 hover:text-red-700">
            Annuleren
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
          <DialogHeader>
            <DialogTitle>Aanvraag annuleren</DialogTitle>
            <DialogDescription>
              Je kunt een open aanvraag annuleren zolang deze nog niet is geaccepteerd.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reden</Label>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Optioneel: waarom annuleer je deze aanvraag?" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              Terug
            </Button>
            <Button type="button" variant="destructive" onClick={cancelRequest} disabled={isPending}>
              {isPending ? "Annuleren..." : "Aanvraag annuleren"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
