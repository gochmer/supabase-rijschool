"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { submitReviewReportAction } from "@/lib/actions/reviews";
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

export function ReviewReportDialog({
  reviewId,
  reviewTitle,
}: {
  reviewId: string;
  reviewTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setReason("");
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitReviewReportAction({
        reviewId,
        reason,
      });

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setReason("");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="rounded-full text-xs">
          <Flag className="size-3.5" />
          Rapporteren
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Review rapporteren</DialogTitle>
          <DialogDescription>
            Licht kort toe waarom de review &ldquo;{reviewTitle}&rdquo; extra
            controle nodig heeft.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor={`review-report-${reviewId}`}>Toelichting</Label>
          <Textarea
            id={`review-report-${reviewId}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Bijvoorbeeld: feitelijk onjuist, ongepaste toon of lijkt niet overeen te komen met een echte leservaring."
            className="min-h-32 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Terug
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Versturen..." : "Melding versturen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
