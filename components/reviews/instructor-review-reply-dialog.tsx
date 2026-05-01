"use client";

import { useState, useTransition } from "react";
import { MessageSquareQuote, Reply } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { saveInstructorReviewReplyAction } from "@/lib/actions/reviews";
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
import { cn } from "@/lib/utils";

export function InstructorReviewReplyDialog({
  reviewId,
  reviewerName,
  reviewTitle,
  initialReply,
  triggerClassName,
  triggerLabel,
}: {
  reviewId: string;
  reviewerName: string;
  reviewTitle: string;
  initialReply?: string | null;
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [replyText, setReplyText] = useState(initialReply ?? "");
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setReplyText(initialReply ?? "");
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await saveInstructorReviewReplyAction({
        reviewId,
        text: replyText,
      });

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={cn("rounded-full", triggerClassName)}
        >
          <Reply className="size-3.5" />
          {triggerLabel ?? (initialReply ? "Reactie bijwerken" : "Reageer op review")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Reageer op review</DialogTitle>
          <DialogDescription>
            Geef een rustige, professionele reactie op de review van {reviewerName}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start gap-2">
              <MessageSquareQuote className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  {reviewTitle}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  Review van {reviewerName}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`review-reply-${reviewId}`}>Jouw reactie</Label>
            <Textarea
              id={`review-reply-${reviewId}`}
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              placeholder="Bedank de leerling, erken de feedback en geef eventueel kort context mee."
              className="min-h-32 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>
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
            {isPending ? "Opslaan..." : initialReply ? "Reactie bijwerken" : "Reactie plaatsen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
