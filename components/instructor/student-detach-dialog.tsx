"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";
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
import { cn } from "@/lib/utils";

export function StudentDetachDialog({
  blockedMessage,
  leerlingId,
  leerlingNaam,
  canDetach = true,
  triggerClassName,
  triggerIconOnly = false,
  triggerLabel = "Ontkoppelen",
}: {
  blockedMessage?: string;
  leerlingId: string;
  leerlingNaam: string;
  canDetach?: boolean;
  triggerClassName?: string;
  triggerIconOnly?: boolean;
  triggerLabel?: string;
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
        <Button
          variant="destructive"
          className={cn("h-9 rounded-full text-[12px]", triggerClassName)}
          title={triggerLabel}
        >
          {triggerIconOnly ? (
            <>
              <UserX className="size-4" />
              <span className="sr-only">{triggerLabel}</span>
            </>
          ) : (
            triggerLabel
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Leerling ontkoppelen</DialogTitle>
          <DialogDescription>
            Verwijder {leerlingNaam} uit je handmatige werkplek. Het account van
            de leerling blijft bestaan; alleen de losse werkplekkoppeling wordt
            verwijderd.
          </DialogDescription>
        </DialogHeader>

        {!canDetach ? (
          <div className="rounded-[1rem] border border-amber-200/80 bg-amber-50/90 p-3 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
            {blockedMessage ??
              "Deze leerling heeft al lessen of aanvragen in dit traject. Daardoor blijft de leerling onderdeel van je werkplek en kun je de handmatige koppeling niet meer los verwijderen."}
          </div>
        ) : (
          <div className="rounded-[1rem] border border-red-200/80 bg-red-50/90 p-3 text-sm leading-6 text-red-900 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-100">
            Dit haalt de leerling uit je handmatige leerlingenlijst. Dit kan
            alleen zolang er nog geen lessen of aanvragen aan deze koppeling
            hangen.
          </div>
        )}

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
            {isPending ? "Ontkoppelen..." : "Leerling ontkoppelen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
