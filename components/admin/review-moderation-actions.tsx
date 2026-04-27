"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { updateReviewModerationAction } from "@/lib/actions/reviews";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ModerationStatus = "zichtbaar" | "verborgen" | "gemarkeerd";

const moderationStatusOptions: Array<{
  value: ModerationStatus;
  label: string;
  description: string;
}> = [
  {
    value: "zichtbaar",
    label: "Zichtbaar",
    description: "Publiek tonen op instructeurprofielen en in kaarten.",
  },
  {
    value: "gemarkeerd",
    label: "Gemarkeerd",
    description: "Nog zichtbaar, maar wel intern gemarkeerd voor opvolging.",
  },
  {
    value: "verborgen",
    label: "Verborgen",
    description: "Niet meer publiek tonen totdat de review opnieuw is beoordeeld.",
  },
];

export function ReviewModerationActions({
  reviewId,
  currentStatus,
  currentNote,
}: {
  reviewId: string;
  currentStatus: string;
  currentNote?: string | null;
}) {
  const router = useRouter();
  const resolvedCurrentStatus: ModerationStatus =
    currentStatus === "verborgen" || currentStatus === "gemarkeerd"
      ? currentStatus
      : "zichtbaar";
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [moderationStatus, setModerationStatus] =
    useState<ModerationStatus>(resolvedCurrentStatus);
  const [moderationNote, setModerationNote] = useState(currentNote ?? "");
  const noteId = useId();

  function resetState() {
    setModerationStatus(resolvedCurrentStatus);
    setModerationNote(currentNote ?? "");
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      resetState();
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateReviewModerationAction({
        reviewId,
        moderatieStatus: moderationStatus,
        moderatieNotitie: moderationNote,
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
        <Button size="sm" variant="outline" className="rounded-full">
          Modereren
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Review modereren</DialogTitle>
          <DialogDescription>
            Bepaal of deze review publiek zichtbaar blijft, intern gemarkeerd
            wordt of tijdelijk verborgen moet worden.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {moderationStatusOptions.map((option) => {
              const isActive = moderationStatus === option.value;
              const Icon =
                option.value === "zichtbaar"
                  ? ShieldCheck
                  : option.value === "verborgen"
                    ? ShieldOff
                    : Flag;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setModerationStatus(option.value)}
                  className={`rounded-[1rem] border px-3 py-3 text-left transition-colors ${
                    isActive
                      ? "border-primary/30 bg-primary/10 text-slate-950 dark:border-sky-300/24 dark:bg-sky-400/10 dark:text-white"
                      : "border-slate-200 bg-slate-50/80 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="size-4" />
                    <span className="text-sm font-semibold">{option.label}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 opacity-80">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={moderationStatus}
              onValueChange={(value) =>
                setModerationStatus(value as ModerationStatus)
              }
            >
              <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
                <SelectValue placeholder="Kies een moderatiestatus" />
              </SelectTrigger>
              <SelectContent>
                {moderationStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={noteId}>Interne moderatienotitie</Label>
            <Textarea
              id={noteId}
              value={moderationNote}
              onChange={(event) => setModerationNote(event.target.value)}
              placeholder="Bijvoorbeeld: review voorlopig gemarkeerd wegens twijfel over toon of feitelijke juistheid."
              className="min-h-28 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            />
            <p className="text-xs leading-5 text-muted-foreground dark:text-slate-400">
              Deze notitie is alleen zichtbaar voor admins en helpt bij latere
              opvolging.
            </p>
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
            {isPending ? "Opslaan..." : "Moderatie opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
