"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateLessonRequestStatusAction } from "@/lib/actions/request-status";
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
import { Textarea } from "@/components/ui/textarea";

export function RequestStatusActions({ requestId, status }: { requestId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);

  if (status !== "aangevraagd") {
    return <span className="text-xs text-muted-foreground">Afgehandeld</span>;
  }

  function accept() {
    startTransition(async () => {
      const result = await updateLessonRequestStatusAction(requestId, "geaccepteerd");
      result.success ? toast.success(result.message) : toast.error(result.message);
    });
  }

  function reject() {
    startTransition(async () => {
      const result = await updateLessonRequestStatusAction(requestId, "geweigerd");
      result.success ? toast.success(result.message) : toast.error(result.message);
      setRejectOpen(false);
      setReason("");
    });
  }

  return (
    <div className="grid gap-2 sm:flex [&>*]:w-full sm:[&>*]:w-auto">
      <Button size="sm" onClick={accept} disabled={isPending}>Accepteren</Button>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={isPending}>Weigeren</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aanvraag weigeren</DialogTitle>
            <DialogDescription>Geef eventueel een reden mee aan de leerling.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Waarom wijs je deze aanvraag af?" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Annuleren</Button>
            <Button variant="destructive" onClick={reject}>Weigeren</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
