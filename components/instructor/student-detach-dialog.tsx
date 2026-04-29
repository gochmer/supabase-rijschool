"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { detachInstructorLearnerAction } from "@/lib/actions/instructor-learners";
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

export function StudentDetachDialog({
  leerlingId,
  leerlingNaam,
  canDetach = true,
}: {
  leerlingId: string;
  leerlingNaam: string;
  canDetach?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDetach() {
    startTransition(async () => {
      const result = await detachInstructorLearnerAction({
        leerlingId,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="h-9 rounded-full text-[12px]">
          Ontkoppelen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Werkplek ontkoppelen</DialogTitle>
          <DialogDescription>
            Verwijder {leerlingNaam} uit je handmatige werkplek. Dit werkt alleen
            zolang er nog geen echte lessen of aanvragen aan deze koppeling hangen.
          </DialogDescription>
        </DialogHeader>

        {!canDetach ? (
          <div className="rounded-[1rem] border border-amber-200/80 bg-amber-50/90 p-3 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
            Deze leerling heeft al lessen of aanvragen in dit traject. Daardoor
            blijft de leerling onderdeel van je werkplek en kun je de handmatige
            koppeling niet meer los verwijderen.
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDetach}
            disabled={isPending || !canDetach}
          >
            {isPending ? "Ontkoppelen..." : "Werkplek ontkoppelen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
