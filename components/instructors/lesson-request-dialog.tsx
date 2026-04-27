"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, CheckCircle2, Clock3, MessageSquareText, PackageCheck } from "lucide-react";
import { toast } from "sonner";

import {
  createDirectLessonBookingAction,
  createLessonRequestAction,
} from "@/lib/actions/lesson-requests";
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

function StepBadge({ active, done, label, icon: Icon }: { active: boolean; done: boolean; label: string; icon: typeof PackageCheck }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all", active || done ? "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100" : "border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400")}>
      {done ? <CheckCircle2 className="size-3.5" /> : <Icon className="size-3.5" />}
      {label}
    </div>
  );
}

export function LessonRequestDialog({
  instructorName,
  instructorSlug,
  selectedPackage,
  requestType = "algemeen",
  tone = "default",
  availableSlots = [],
  directBookingEnabled = false,
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
  directBookingEnabled?: boolean;
  defaultSlotId?: string | null;
  triggerLabel?: string;
  triggerClassName?: string;
  triggerVariant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [isPending, startTransition] = useTransition();
  const isHazard = tone === "hazard";
  const hasAvailableSlots = availableSlots.length > 0;
  const canDirectBook = directBookingEnabled && hasAvailableSlots;
  const [selectedSlotId, setSelectedSlotId] = useState(defaultSlotId ?? availableSlots[0]?.id ?? "");

  const selectedSlot = useMemo(() => availableSlots.find((slot) => slot.id === selectedSlotId) ?? availableSlots[0] ?? null, [availableSlots, selectedSlotId]);
  const previewSlots = useMemo(() => availableSlots.slice(0, 3), [availableSlots]);
  const primaryLabel = selectedPackage ? selectedPackage.naam : requestType === "proefles" ? "Proefles" : "Lesaanvraag";
  const submitLabel = canDirectBook ? "Direct inplannen" : "Aanvraag versturen";
  const canGoNextFromMoment = hasAvailableSlots ? Boolean(selectedSlot) : Boolean(manualDate && manualTime);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setStep(1);
      if (hasAvailableSlots) {
        setSelectedSlotId(defaultSlotId ?? availableSlots[0]?.id ?? "");
      }
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const datum = String(formData.get("datum") ?? "");
      const tijdvak = String(formData.get("tijdvak") ?? "");
      const slotId = String(formData.get("slotId") ?? "");
      const bericht = String(formData.get("bericht") ?? "");
      const packageId = String(formData.get("packageId") ?? "");
      const result = canDirectBook
        ? await createDirectLessonBookingAction({
            instructorSlug,
            slotId,
            bericht,
            packageId,
            requestType,
          })
        : await createLessonRequestAction({
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
          canDirectBook
            ? `${result.message} ${instructorName} ziet dit moment direct in de agenda.`
            : `${result.message} ${instructorName} ontvangt direct de aanvraag.`
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
        <Button className={cn(getDialogTriggerClassName(isHazard, triggerVariant), triggerClassName)}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className={isHazard ? "border-red-300/16 bg-[linear-gradient(180deg,rgba(10,11,15,0.98),rgba(31,15,17,0.96),rgba(52,18,18,0.92))] text-white shadow-[0_36px_90px_-54px_rgba(0,0,0,0.76)] sm:max-w-2xl" : "sm:max-w-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white dark:shadow-[0_36px_90px_-54px_rgba(15,23,42,0.72)]"}>
        <DialogHeader>
          <DialogTitle className={isHazard ? "text-white" : "dark:text-white"}>
            {canDirectBook ? "Direct inplannen" : "Boeking starten"}
          </DialogTitle>
          <DialogDescription className={isHazard ? "text-stone-300" : "dark:text-slate-300"}>
            {canDirectBook
              ? `Rond je boeking af in drie rustige stappen. ${instructorName} krijgt dit moment direct in de agenda.`
              : `Rond je aanvraag af in drie rustige stappen. ${instructorName} ontvangt daarna direct je voorkeur.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <StepBadge active={step === 1} done={step > 1} label="Keuze" icon={PackageCheck} />
          <StepBadge active={step === 2} done={step > 2} label="Moment" icon={CalendarDays} />
          <StepBadge active={step === 3} done={false} label="Bericht" icon={MessageSquareText} />
        </div>

        <form action={handleSubmit} className="space-y-4">
          {selectedPackage ? <input type="hidden" name="packageId" value={selectedPackage.id} /> : null}
          {hasAvailableSlots ? <input type="hidden" name="slotId" value={selectedSlot?.id ?? ""} /> : <><input type="hidden" name="datum" value={manualDate} /><input type="hidden" name="tijdvak" value={manualTime} /></>}

          {step === 1 ? (
            <div className={cn("rounded-[1.35rem] border p-4", isHazard ? "border-red-300/16 bg-white/5 text-white" : "border-slate-200 bg-slate-50/90 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-500 dark:text-slate-400">Gekozen traject</p>
                  <p className="mt-2 text-lg font-semibold">{primaryLabel}</p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">{selectedPackage ? selectedPackage.beschrijving : requestType === "proefles" ? "Een eerste les om kennis te maken, je niveau te peilen en te voelen of deze instructeur bij je past." : "Een algemene aanvraag waarmee je samen met de instructeur de juiste vervolgstap bepaalt."}</p>
                </div>
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-sky-700 uppercase dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100">{selectedPackage ? getRijlesTypeLabel(selectedPackage.les_type) : "Kennismaking"}</span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-[1rem] bg-white px-3 py-2 dark:bg-white/6"><p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">Prijs</p><p className="mt-1 text-sm font-semibold">{selectedPackage ? selectedPackage.prijs > 0 ? formatCurrency(selectedPackage.prijs) : "Op aanvraag" : "In overleg"}</p></div>
                <div className="rounded-[1rem] bg-white px-3 py-2 dark:bg-white/6"><p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">Inhoud</p><p className="mt-1 text-sm font-semibold">{selectedPackage ? selectedPackage.lessen > 0 ? `${selectedPackage.lessen} lessen` : "Flexibel traject" : "Intake en eerste indruk"}</p></div>
              </div>
              {previewSlots.length ? <div className="mt-4 rounded-[1rem] border border-dashed border-slate-200 p-3 dark:border-white/10"><p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">Eerstvolgende momenten</p><div className="mt-2 flex flex-wrap gap-1.5">{previewSlots.map((slot) => <span key={slot.id} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100">{formatAvailabilitySlotLabel(slot)}</span>)}</div>{canDirectBook ? <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-300">Deze momenten zijn echt boekbaar en worden direct ingepland zodra je bevestigt.</p> : null}</div> : null}
            </div>
          ) : null}

          {step === 2 ? hasAvailableSlots ? (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Beschikbaar moment</Label><Select value={selectedSlot?.id ?? ""} onValueChange={setSelectedSlotId}><SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/5 dark:text-white"><SelectValue placeholder="Kies een beschikbaar moment" /></SelectTrigger><SelectContent>{availableSlots.map((slot) => <SelectItem key={slot.id} value={slot.id}>{formatAvailabilitySlotLabel(slot)}</SelectItem>)}</SelectContent></Select></div>
              {selectedSlot ? <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5"><p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Gekozen uit live agenda</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="flex items-center gap-3"><CalendarDays className="size-4" /><span>{selectedSlot.dag}</span></div><div className="flex items-center gap-3"><Clock3 className="size-4" /><span>{selectedSlot.tijdvak}</span></div></div>{canDirectBook ? <p className="mt-3 text-[11px] leading-5 text-slate-500 dark:text-slate-300">Na bevestigen staat dit moment meteen vast in jouw en de instructeuragenda.</p> : null}</div> : null}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="datum">Voorkeursdatum</Label><Input id="datum" type="date" required value={manualDate} onChange={(event) => setManualDate(event.target.value)} className="dark:border-white/10 dark:bg-white/5 dark:text-white" /></div><div className="space-y-2"><Label htmlFor="tijdvak">Tijdvak</Label><Input id="tijdvak" placeholder="Bijvoorbeeld 18:00 - 19:30" required value={manualTime} onChange={(event) => setManualTime(event.target.value)} className="dark:border-white/10 dark:bg-white/5 dark:text-white" /></div></div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5"><p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Samenvatting</p><p className="mt-2 text-sm leading-6">{primaryLabel} bij {instructorName}{selectedSlot ? ` op ${selectedSlot.dag}, ${selectedSlot.tijdvak}` : manualDate && manualTime ? ` op ${manualDate}, ${manualTime}` : " met jouw voorkeursmoment"}{canDirectBook ? " wordt direct ingepland." : " wordt als aanvraag verstuurd."}</p></div>
              <div className="space-y-2"><Label htmlFor="bericht">Opmerking</Label><Textarea id="bericht" name="bericht" placeholder="Geef aan wat je wilt oefenen of waar je hulp bij zoekt." className="min-h-28 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400" /></div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => step === 1 ? setOpen(false) : setStep((current) => current - 1)}>{step === 1 ? "Annuleren" : "Terug"}</Button>
            {step < 3 ? <Button type="button" onClick={() => setStep((current) => current + 1)} disabled={step === 2 && !canGoNextFromMoment}>Volgende stap</Button> : <Button type="submit" disabled={isPending || !canGoNextFromMoment}>{isPending ? `${submitLabel}...` : submitLabel}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
