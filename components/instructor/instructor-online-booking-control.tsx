"use client";

import { useState, useTransition } from "react";
import { Globe, LockKeyhole, Sparkles } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-[1.8rem] border border-white/70 bg-[linear-gradient(135deg,#0f172a,#172554,#1e293b)] p-5 text-white shadow-[0_30px_90px_-58px_rgba(15,23,42,0.7)] dark:border-white/10 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.16),transparent_24%),radial-gradient(circle_at_86%_20%,rgba(56,189,248,0.16),transparent_24%),radial-gradient(circle_at_72%_88%,rgba(148,163,184,0.16),transparent_24%)]" />

      <div className="relative grid gap-5 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/78 uppercase">
            <Sparkles className="size-3.5" />
            Online boeking
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
              Laat leerlingen online zelf een echt agenda-moment kiezen.
            </h3>
            <p className="max-w-2xl text-sm leading-7 text-white/74 sm:text-[15px]">
              Zet dit aan als je wilt dat leerlingen jouw publieke agenda kunnen
              gebruiken voor direct online inschrijven. Zet het uit als je alleen
              per leerling handmatig wilt vrijgeven wie zelf mag plannen.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className={cn("border", isEnabled ? "border-emerald-200/22 bg-emerald-400/15 text-emerald-50" : "border-amber-200/22 bg-amber-400/12 text-amber-50")}>
              {isEnabled ? "Online inschrijven staat aan" : "Online inschrijven staat uit"}
            </Badge>
            <Badge className="border border-white/14 bg-white/10 text-white">
              {activeSlotCount} open slot{activeSlotCount === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-white/14 bg-white/10 p-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-white/62 uppercase">
                Status
              </p>
              <p className="mt-2 text-xl font-semibold">
                {isEnabled ? "Open voor online boeking" : "Alleen op vrijgave"}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {isEnabled
                  ? "Nieuwe leerlingen kunnen vanaf je publieke profiel een vrij moment kiezen zodra ze inloggen als leerling."
                  : "Je publieke agenda blijft afgeschermd. Zelf plannen blijft alleen mogelijk via jouw leerlingwerkplek."}
              </p>
            </div>
            <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", isEnabled ? "bg-emerald-400/16 text-emerald-100" : "bg-white/10 text-white/82")}>
              {isEnabled ? <Globe className="size-5" /> : <LockKeyhole className="size-5" />}
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <Button
              className="h-10 rounded-full bg-white text-slate-950 shadow-[0_16px_36px_-28px_rgba(255,255,255,0.45)] hover:bg-slate-100"
              disabled={isPending || isEnabled}
              onClick={() => handleToggle(true)}
            >
              Zet online boeking aan
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-full border-white/18 bg-white/8 text-white hover:bg-white/12"
              disabled={isPending || !isEnabled}
              onClick={() => handleToggle(false)}
            >
              Zet online boeking uit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
