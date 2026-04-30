"use client";

import { useState, useTransition } from "react";
import { Globe, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { updateInstructorOnlineBookingAction } from "@/lib/actions/instructor-online-booking";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function InstructorOnlineBookingControl({
  enabled,
  activeSlotCount,
}: {
  enabled: boolean;
  activeSlotCount: number;
}) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle(nextEnabled: boolean) {
    const previousEnabled = isEnabled;
    setIsEnabled(nextEnabled);

    startTransition(async () => {
      const result = await updateInstructorOnlineBookingAction(nextEnabled);

      if (!result.success) {
        setIsEnabled(previousEnabled);
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
            Online boeken
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
            Publieke agenda
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Leerlingen zien alleen vrije boekbare momenten.
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
          {isEnabled ? <Globe className="size-4" /> : <LockKeyhole className="size-4" />}
          {isEnabled ? "Open voor boeking" : "Alleen op vrijgave"}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge
          className={cn(
            "border",
            isEnabled
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100"
              : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200"
          )}
        >
          {isEnabled ? "Online inschrijven aan" : "Online inschrijven uit"}
        </Badge>
        <Badge className="border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100">
          {activeSlotCount} open slot{activeSlotCount === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <Button
          className="h-10 rounded-full"
          disabled={isPending || isEnabled}
          onClick={() => handleToggle(true)}
        >
          Zet aan
        </Button>
        <Button
          variant="outline"
          className="h-10 rounded-full"
          disabled={isPending || !isEnabled}
          onClick={() => handleToggle(false)}
        >
          Zet uit
        </Button>
      </div>
    </div>
  );
}
