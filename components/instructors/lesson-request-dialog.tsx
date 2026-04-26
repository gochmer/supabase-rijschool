"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import { toast } from "sonner";

import { createLessonRequestAction } from "@/lib/actions/lesson-requests";
import { formatAvailabilitySlotLabel } from "@/lib/availability";
import { formatCurrency } from "@/lib/format";
import { getRijlesTypeLabel } from "@/lib/lesson-types";
import type { BeschikbaarheidSlot, Pakket } from "@/lib/types";
import { cn } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function getDialogTriggerClassName(
  isHazard: boolean,
  triggerVariant: "primary" | "secondary"
) {
  if (triggerVariant === "secondary") {
    return isHazard
      ? "h-11 flex-1 rounded-full border border-red-300/18 bg-white/6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/10"
      : "h-11 flex-1 rounded-full border border-slate-200 bg-white text-slate-900 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.18)] hover:bg-slate-50 dark:border-white/10 dark:bg-white/6 dark:text-white dark:shadow-none dark:hover:bg-white/10";
  }

  return isHazard
    ? "h-11 flex-1 rounded-full border border-red-300/16 bg-[linear-gradient(135deg,#450a0a,#b91c1c,#ea580c)] text-white shadow-[0_18px_36px_-24px_rgba(185,28,28,0.42)]"
    : "h-11 flex-1 rounded-full bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] text-white shadow-[0_18px_38px_-24px_rgba(14,116,144,0.4)]";
}

export function LessonRequestDialog({
  instructorName,
  instructorSlug,
  selectedPackage,
  requestType = "algemeen",
  tone = "default",
  availableSlots = [],
  defaultSlotId,
  triggerLabel = "Les aanvragen",
  triggerClassName,
  triggerVariant = "primary",
}: {
  instructorName: string;
  instructorSlug: string;
  selectedPackage?: Pakket | null;
  requestType?: "algemeen" | "proefles";
  tone?: "default" | "hazard";
  availableSlots?: BeschikbaarheidSlot[];
  defaultSlotId?: string | null;
  triggerLabel?: string;
  triggerClassName?: string;
  triggerVariant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isHazard = tone === "hazard";
  const hasAvailableSlots = availableSlots.length > 0;
  const [selectedSlotId, setSelectedSlotId] = useState(
    defaultSlotId ?? availableSlots[0]?.id ?? ""
  );

  const selectedSlot = useMemo(
    () =>
      availableSlots.find((slot) => slot.id === selectedSlotId) ??
      availableSlots[0] ??
      null,
    [availableSlots, selectedSlotId]
  );
  const previewSlots = useMemo(() => availableSlots.slice(0, 3), [availableSlots]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen && hasAvailableSlots) {
      setSelectedSlotId(defaultSlotId ?? availableSlots[0]?.id ?? "");
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const datum = String(formData.get("datum") ?? "");
      const tijdvak = String(formData.get("tijdvak") ?? "");
      const slotId = String(formData.get("slotId") ?? "");
      const bericht = String(formData.get("bericht") ?? "");
      const packageId = String(formData.get("packageId") ?? "");
      const result = await createLessonRequestAction({
        instructorSlug,
        datum,
        tijdvak,
        slotId,
        bericht,
        packageId,
        requestType,
      });

      if (result.success) {
        toast.success(
          `${result.message} ${instructorName} ontvangt direct de aanvraag.`
        );
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            getDialogTriggerClassName(isHazard, triggerVariant),
            triggerClassName
          )}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
        <DialogContent
          className={
            isHazard
              ? "border-red-300/16 bg-[linear-gradient(180deg,rgba(10,11,15,0.98),rgba(31,15,17,0.96),rgba(52,18,18,0.92))] text-white shadow-[0_36px_90px_-54px_rgba(0,0,0,0.76)] sm:max-w-lg"
            : "sm:max-w-lg dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white dark:shadow-[0_36px_90px_-54px_rgba(15,23,42,0.72)]"
          }
        >
        <DialogHeader>
          <DialogTitle className={isHazard ? "text-white" : "dark:text-white"}>
            Les aanvragen
          </DialogTitle>
          <DialogDescription className={isHazard ? "text-stone-300" : "dark:text-slate-300"}>
            {selectedPackage
              ? hasAvailableSlots
                ? `Kies een beschikbaar moment voor ${selectedPackage.naam} bij ${instructorName}.`
                : `Vraag ${selectedPackage.naam} direct aan bij ${instructorName}.`
              : requestType === "proefles"
                ? hasAvailableSlots
                  ? `Kies een beschikbaar moment voor een proefles bij ${instructorName}.`
                  : `Plan direct een proefles bij ${instructorName}.`
              : hasAvailableSlots
                ? `Kies een beschikbaar moment uit de agenda van ${instructorName}.`
                : `Vraag direct een proefles of vervolgles aan bij ${instructorName}.`}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {selectedPackage || requestType === "proefles" ? (
            <div
              className={cn(
                "rounded-[1.35rem] border p-4",
                isHazard
                  ? "border-red-300/16 bg-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "border-slate-200 bg-slate-50/90 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-[10px] font-semibold tracking-[0.18em] uppercase",
                      isHazard ? "text-stone-300" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {selectedPackage ? "Gekozen pakket" : "Gekozen lesvorm"}
                  </p>
                  <p className={cn("mt-2 text-base font-semibold", isHazard ? "text-stone-100" : "text-slate-950 dark:text-white")}>
                    {selectedPackage ? selectedPackage.naam : "Proefles"}
                  </p>
                  <p
                    className={cn(
                      "mt-2 text-sm leading-6",
                      isHazard ? "text-stone-300" : "text-slate-600 dark:text-slate-300"
                    )}
                  >
                    {selectedPackage
                      ? selectedPackage.beschrijving
                      : "Een eerste les om kennis te maken, je niveau te peilen en direct te voelen of deze instructeur bij je past."}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase",
                    isHazard
                      ? "border-red-200/20 bg-white/8 text-stone-100"
                      : "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100"
                  )}
                >
                  {selectedPackage
                    ? getRijlesTypeLabel(selectedPackage.les_type)
                    : "Kennismaking"}
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div
                  className={cn(
                    "rounded-[1rem] px-3 py-2",
                    isHazard
                      ? "bg-white/6"
                      : "bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:bg-white/6 dark:shadow-none"
                  )}
                >
                  <p
                    className={cn(
                      "text-[10px] font-semibold tracking-[0.16em] uppercase",
                      isHazard ? "text-stone-300" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {selectedPackage ? "Pakketprijs" : "Richtprijs"}
                  </p>
                  <p className={cn("mt-1 text-sm font-semibold", isHazard ? "text-stone-100" : "text-slate-950 dark:text-white")}>
                    {selectedPackage
                      ? selectedPackage.prijs > 0
                        ? formatCurrency(selectedPackage.prijs)
                        : "Op aanvraag"
                      : "In overleg"}
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-[1rem] px-3 py-2",
                    isHazard
                      ? "bg-white/6"
                      : "bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:bg-white/6 dark:shadow-none"
                  )}
                >
                  <p
                    className={cn(
                      "text-[10px] font-semibold tracking-[0.16em] uppercase",
                      isHazard ? "text-stone-300" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {selectedPackage ? "Inhoud" : "Focus"}
                  </p>
                  <p className={cn("mt-1 text-sm font-semibold", isHazard ? "text-stone-100" : "text-slate-950 dark:text-white")}>
                    {selectedPackage
                      ? selectedPackage.lessen > 0
                        ? `${selectedPackage.lessen} lessen`
                        : "Flexibel traject"
                      : "Intake en eerste indruk"}
                  </p>
                </div>
              </div>
              {selectedPackage && previewSlots.length ? (
                <div className="mt-3 rounded-[1rem] border border-dashed p-3 dark:border-white/10">
                  <p
                    className={cn(
                      "text-[10px] font-semibold tracking-[0.16em] uppercase",
                      isHazard ? "text-stone-300" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    Eerstvolgende beschikbare momenten
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {previewSlots.map((slot) => (
                      <span
                        key={slot.id}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[10px] font-medium",
                          isHazard
                            ? "border-red-300/16 bg-white/8 text-stone-100"
                            : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100"
                        )}
                      >
                        {formatAvailabilitySlotLabel(slot)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {selectedPackage ? (
                <input type="hidden" name="packageId" value={selectedPackage.id} />
              ) : null}
            </div>
          ) : null}

          {hasAvailableSlots ? (
            <>
              <div className="space-y-2">
                <Label className={isHazard ? "text-stone-100" : undefined}>
                  Beschikbaar moment
                </Label>
                <Select value={selectedSlot?.id ?? ""} onValueChange={setSelectedSlotId}>
                  <SelectTrigger
                    className={
                      isHazard
                        ? "h-11 w-full border-red-300/16 bg-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "h-11 w-full border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    }
                  >
                    <SelectValue placeholder="Kies een beschikbaar moment" />
                  </SelectTrigger>
                  <SelectContent
                    className={
                      isHazard
                        ? "border-red-300/16 bg-[#120d10] text-white"
                        : undefined
                    }
                  >
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {formatAvailabilitySlotLabel(slot)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="slotId" value={selectedSlot?.id ?? ""} />
              </div>

              {selectedSlot ? (
                <div
                  className={cn(
                    "rounded-[1.35rem] border p-4",
                    isHazard
                      ? "border-red-300/16 bg-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                        : "border-slate-200 bg-slate-50/90 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  )}
                >
                  <p
                    className={cn(
                      "text-[10px] font-semibold tracking-[0.18em] uppercase",
                      isHazard ? "text-stone-300" : "text-slate-500"
                    )}
                  >
                    Gekozen uit live agenda
                  </p>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-2xl",
                          isHazard
                            ? "bg-white/8 text-stone-100"
                            : "bg-white text-slate-700 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.18)] dark:bg-white/8 dark:text-slate-100 dark:shadow-none"
                        )}
                      >
                        <CalendarDays className="size-4" />
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-xs font-semibold tracking-[0.16em] uppercase",
                            isHazard ? "text-stone-300" : "text-slate-500 dark:text-slate-400"
                          )}
                        >
                          Dag
                        </p>
                        <p className={isHazard ? "text-stone-100" : "text-slate-900 dark:text-white"}>
                          {selectedSlot.dag}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-2xl",
                          isHazard
                            ? "bg-white/8 text-stone-100"
                            : "bg-white text-slate-700 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.18)] dark:bg-white/8 dark:text-slate-100 dark:shadow-none"
                        )}
                      >
                        <Clock3 className="size-4" />
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-xs font-semibold tracking-[0.16em] uppercase",
                            isHazard ? "text-stone-300" : "text-slate-500 dark:text-slate-400"
                          )}
                        >
                          Tijdvak
                        </p>
                        <p className={isHazard ? "text-stone-100" : "text-slate-900 dark:text-white"}>
                          {selectedSlot.tijdvak}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="datum" className={isHazard ? "text-stone-100" : undefined}>
                  Voorkeursdatum
                </Label>
                <Input
                  id="datum"
                  name="datum"
                  type="date"
                  required
                  className={
                    isHazard
                      ? "border-red-300/16 bg-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "dark:border-white/10 dark:bg-white/5 dark:text-white"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tijdvak" className={isHazard ? "text-stone-100" : undefined}>
                  Tijdvak
                </Label>
                <Input
                  id="tijdvak"
                  name="tijdvak"
                  placeholder="Bijvoorbeeld 18:00 - 19:30"
                  required
                  className={
                    isHazard
                      ? "border-red-300/16 bg-white/5 text-white placeholder:text-stone-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                  }
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="bericht" className={isHazard ? "text-stone-100" : undefined}>
              Opmerking
            </Label>
            <Textarea
              id="bericht"
              name="bericht"
              placeholder="Geef aan wat je wilt oefenen of waar je hulp bij zoekt."
              className={
                isHazard
                  ? "border-red-300/16 bg-white/5 text-white placeholder:text-stone-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
              }
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className={
                isHazard
                  ? "w-full border border-red-300/16 bg-[linear-gradient(135deg,#450a0a,#b91c1c,#ea580c)] text-white shadow-[0_18px_36px_-24px_rgba(185,28,28,0.42)] sm:w-auto"
                  : "w-full sm:w-auto"
              }
              disabled={isPending || (hasAvailableSlots && !selectedSlot)}
            >
              {isPending ? "Aanvraag versturen..." : "Aanvraag versturen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
