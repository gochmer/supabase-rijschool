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
    <div className="min-h-[20rem] rounded-xl border border-sky-300/16 bg-[radial-gradient(circle_at_15%_0%,rgba(14,165,233,0.14),transparent_34%),linear-gradient(145deg,rgba(9,20,35,0.98),rgba(5,13,24,0.99))] p-5 shadow-[0_22px_70px_-55px_rgba(14,165,233,0.8)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-400 uppercase">
            Online boeken
          </p>
          <h3 className="mt-4 text-lg font-semibold text-white">
            Publieke agenda
          </h3>
          <p className="mt-3 max-w-64 text-sm leading-6 text-slate-300">
            Leerlingen zien alleen vrije boekbare momenten.
          </p>
        </div>
        <div
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold leading-tight",
            isEnabled
              ? "border-emerald-300/25 bg-emerald-400/12 text-emerald-100"
              : "border-white/10 bg-white/8 text-slate-200",
          )}
        >
          {isEnabled ? (
            <Globe className="size-4" />
          ) : (
            <LockKeyhole className="size-4" />
          )}
          {isEnabled ? "Open voor boeking" : "Alleen op vrijgave"}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge
          className={cn(
            "border text-[11px]",
            isEnabled
              ? "border-emerald-300/25 bg-emerald-400/12 text-emerald-100"
              : "border-white/10 bg-white/8 text-slate-200",
          )}
        >
          {isEnabled ? "Online inschrijven aan" : "Online inschrijven uit"}
        </Badge>
        <Badge className="border border-white/10 bg-white/8 text-[11px] text-slate-100">
          {activeSlotCount} open slot{activeSlotCount === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <Button
          className="h-11 rounded-xl bg-sky-500 px-5 text-slate-950 hover:bg-sky-400"
          disabled={isPending}
          onClick={() => handleToggle(true)}
        >
          Zet online boeking aan
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-xl border-white/10 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white"
          disabled={isPending}
          onClick={() => handleToggle(false)}
        >
          Zet online boeking uit
        </Button>
      </div>
    </div>
  );
}
