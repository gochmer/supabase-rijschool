"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  createDirectLessonBookingAction,
  createLessonRequestAction,
} from "@/lib/actions/lesson-requests";
import { formatAvailabilitySlotLabel, getAvailabilityDateValue } from "@/lib/availability";
import { formatCurrency } from "@/lib/format";
import { getRijlesTypeLabel } from "@/lib/lesson-types";
import type { BeschikbaarheidSlot, Pakket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

function formatDialogDateLabel(dateValue: string) {
  if (!dateValue) {
    return "";
  }

  const safeDate = new Date(`${dateValue}T12:00:00`);
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(safeDate);
}

function formatDialogCompactDateLabel(dateValue: string) {
  if (!dateValue) {
    return "";
  }

  const safeDate = new Date(`${dateValue}T12:00:00`);
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(safeDate);
}

function getRelativeDateLabel(dateValue: string) {
  if (!dateValue) {
    return "";
  }

  const today = new Date();
  const todayValue = getAvailabilityDateValue(today.toISOString());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowValue = getAvailabilityDateValue(tomorrow.toISOString());

  if (dateValue === todayValue) {
    return "Vandaag";
  }

  if (dateValue === tomorrowValue) {
    return "Morgen";
  }

  return formatDialogCompactDateLabel(dateValue);
}

function StepBadge({
  active,
  done,
  label,
  icon: Icon,
}: {
  active: boolean;
  done: boolean;
  label: string;
  icon: typeof PackageCheck;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all",
        active || done
          ? "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100"
          : "border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
      )}
    >
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
  const [selectedSlotId, setSelectedSlotId] = useState(
    defaultSlotId ?? availableSlots[0]?.id ?? ""
  );
  const [selectedDateValue, setSelectedDateValue] = useState(() => {
    const initialSlot =
      availableSlots.find((slot) => slot.id === (defaultSlotId ?? "")) ??
      availableSlots[0] ??
      null;

    return initialSlot?.start_at ? getAvailabilityDateValue(initialSlot.start_at) : "";
  });

  const selectedSlot = useMemo(
    () =>
      availableSlots.find((slot) => slot.id === selectedSlotId) ??
      availableSlots[0] ??
      null,
    [availableSlots, selectedSlotId]
  );
  const previewSlots = useMemo(() => availableSlots.slice(0, 4), [availableSlots]);
  const groupedSlotDays = useMemo(() => {
    const groups = new Map<
      string,
      {
        dateValue: string;
        dayLabel: string;
        relativeLabel: string;
        slotCount: number;
        firstSlotId: string;
      }
    >();

    availableSlots.forEach((slot) => {
      if (!slot.start_at) {
        return;
      }

      const dateValue = getAvailabilityDateValue(slot.start_at);
      const current = groups.get(dateValue);

      if (current) {
        current.slotCount += 1;
        return;
      }

      groups.set(dateValue, {
        dateValue,
        dayLabel: formatDialogDateLabel(dateValue),
        relativeLabel: getRelativeDateLabel(dateValue),
        slotCount: 1,
        firstSlotId: slot.id,
      });
    });

    return Array.from(groups.values());
  }, [availableSlots]);
  const earliestSlotDay = groupedSlotDays[0] ?? null;
  const selectedDayGroup =
    groupedSlotDays.find((day) => day.dateValue === selectedDateValue) ?? null;
  const slotDayCount = useMemo(
    () =>
      new Set(
        availableSlots
          .map((slot) =>
            slot.start_at ? getAvailabilityDateValue(slot.start_at) : null
          )
          .filter(Boolean)
      ).size,
    [availableSlots]
  );
  const filteredSlotsForSelectedDate = useMemo(() => {
    if (!selectedDateValue) {
      return availableSlots;
    }

    return availableSlots.filter(
      (slot) =>
        slot.start_at && getAvailabilityDateValue(slot.start_at) === selectedDateValue
    );
  }, [availableSlots, selectedDateValue]);
  const selectedSlotDate = selectedSlot?.start_at
    ? getAvailabilityDateValue(selectedSlot.start_at)
    : "";
  const selectedSlotDatePretty = selectedSlotDate
    ? formatDialogDateLabel(selectedSlotDate)
    : "";
  const selectedSlotDayLabel = selectedSlotDate
    ? getRelativeDateLabel(selectedSlotDate)
    : "";
  const selectedDaySlotCount = useMemo(() => {
    if (!selectedSlotDate) {
      return 0;
    }

    return availableSlots.filter(
      (slot) =>
        slot.start_at && getAvailabilityDateValue(slot.start_at) === selectedSlotDate
    ).length;
  }, [availableSlots, selectedSlotDate]);
  const primaryLabel = selectedPackage
    ? selectedPackage.naam
    : requestType === "proefles"
      ? "Proefles"
      : "Lesaanvraag";
  const submitLabel = canDirectBook ? "Direct inplannen" : "Aanvraag versturen";
  const canGoNextFromMoment = hasAvailableSlots
    ? Boolean(selectedSlot)
    : Boolean(manualDate && manualTime);

  function resetDialogState() {
    setStep(1);
    setManualDate("");
    setManualTime("");
    const nextSlotId = defaultSlotId ?? availableSlots[0]?.id ?? "";
    const nextSlot =
      availableSlots.find((slot) => slot.id === nextSlotId) ?? availableSlots[0] ?? null;

    setSelectedSlotId(nextSlotId);
    setSelectedDateValue(
      nextSlot?.start_at ? getAvailabilityDateValue(nextSlot.start_at) : ""
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      resetDialogState();
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
        resetDialogState();
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleSlotSelect(slotId: string) {
    setSelectedSlotId(slotId);

    const nextSlot = availableSlots.find((slot) => slot.id === slotId);

    if (nextSlot?.start_at) {
      setSelectedDateValue(getAvailabilityDateValue(nextSlot.start_at));
    }
  }

  function handleDateSelect(dateValue: string) {
    setSelectedDateValue(dateValue);

    const nextSlot =
      availableSlots.find(
        (slot) => slot.start_at && getAvailabilityDateValue(slot.start_at) === dateValue
      ) ?? null;

    if (nextSlot) {
      setSelectedSlotId(nextSlot.id);
    }
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
            ? "max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain border-red-300/16 bg-[linear-gradient(180deg,rgba(10,11,15,0.98),rgba(31,15,17,0.96),rgba(52,18,18,0.92))] text-white shadow-[0_36px_90px_-54px_rgba(0,0,0,0.76)] sm:max-w-2xl"
            : "max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain sm:max-w-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white dark:shadow-[0_36px_90px_-54px_rgba(15,23,42,0.72)]"
        }
      >
        <DialogHeader>
          <DialogTitle className={isHazard ? "text-white" : "dark:text-white"}>
            {canDirectBook ? "Direct inplannen" : "Boeking starten"}
          </DialogTitle>
          <DialogDescription
            className={isHazard ? "text-stone-300" : "dark:text-slate-300"}
          >
            {canDirectBook
              ? `Rond je boeking af in drie rustige stappen. ${instructorName} krijgt dit moment direct in de agenda.`
              : `Rond je aanvraag af in drie rustige stappen. ${instructorName} ontvangt daarna direct je voorkeur.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <StepBadge
            active={step === 1}
            done={step > 1}
            label="Keuze"
            icon={PackageCheck}
          />
          <StepBadge
            active={step === 2}
            done={step > 2}
            label="Moment"
            icon={CalendarDays}
          />
          <StepBadge
            active={step === 3}
            done={false}
            label="Bericht"
            icon={MessageSquareText}
          />
        </div>

        <form action={handleSubmit} className="space-y-4">
          {selectedPackage ? (
            <input type="hidden" name="packageId" value={selectedPackage.id} />
          ) : null}
          <input type="hidden" name="slotId" value={selectedSlot?.id ?? ""} />
          <input
            type="hidden"
            name="datum"
            value={selectedSlotDate || manualDate}
          />
          <input
            type="hidden"
            name="tijdvak"
            value={selectedSlot?.tijdvak || manualTime}
          />

          {step === 1 ? (
            <div
              className={cn(
                "rounded-[1.35rem] border p-4",
                isHazard
                  ? "border-red-300/16 bg-white/5 text-white"
                  : "border-slate-200 bg-slate-50/90 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                    Gekozen traject
                  </p>
                  <p className="mt-2 text-lg font-semibold">{primaryLabel}</p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {selectedPackage
                      ? selectedPackage.beschrijving
                      : requestType === "proefles"
                        ? "Een eerste les om kennis te maken, je niveau te peilen en te voelen of deze instructeur bij je past."
                        : "Een algemene aanvraag waarmee je samen met de instructeur de juiste vervolgstap bepaalt."}
                  </p>
                </div>
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-sky-700 uppercase dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100">
                  {selectedPackage
                    ? getRijlesTypeLabel(selectedPackage.les_type)
                    : "Kennismaking"}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-[1rem] bg-white px-3 py-2 dark:bg-white/6">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                    Prijs
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedPackage
                      ? selectedPackage.prijs > 0
                        ? formatCurrency(selectedPackage.prijs)
                        : "Op aanvraag"
                      : "In overleg"}
                  </p>
                </div>
                <div className="rounded-[1rem] bg-white px-3 py-2 dark:bg-white/6">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                    Inhoud
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedPackage
                      ? selectedPackage.lessen > 0
                        ? `${selectedPackage.lessen} lessen`
                        : "Flexibel traject"
                      : "Intake en eerste indruk"}
                  </p>
                </div>
              </div>

              {previewSlots.length ? (
                <div className="mt-4 rounded-[1rem] border border-dashed border-slate-200 p-3 dark:border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                      Eerstvolgende momenten
                    </p>
                    <Badge
                      className="border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100"
                    >
                      {availableSlots.length} open moment
                      {availableSlots.length === 1 ? "" : "en"}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {previewSlots.map((slot) => (
                      <span
                        key={slot.id}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100"
                      >
                        {formatAvailabilitySlotLabel(slot)}
                      </span>
                    ))}
                  </div>

                  {availableSlots.length > previewSlots.length ? (
                    <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-300">
                      En nog {availableSlots.length - previewSlots.length} extra open moment
                      {availableSlots.length - previewSlots.length === 1 ? "" : "en"}.
                    </p>
                  ) : null}

                  {canDirectBook ? (
                    <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-300">
                      Deze momenten zijn echt boekbaar en worden direct ingepland zodra je bevestigt.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            hasAvailableSlots ? (
              <div className="space-y-4">
                <div className="rounded-[1.1rem] border border-sky-100 bg-sky-50/80 p-3 dark:border-sky-300/16 dark:bg-sky-400/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] leading-5 text-sky-800 dark:text-sky-100">
                      Je kiest hier alleen uit de momenten die de instructeur echt open heeft gezet in de agenda.
                    </p>
                    <Badge className="border border-sky-200 bg-white/80 text-sky-700 dark:border-sky-300/20 dark:bg-white/10 dark:text-sky-100">
                      {availableSlots.length} open moment
                      {availableSlots.length === 1 ? "" : "en"} op {slotDayCount} dag
                      {slotDayCount === 1 ? "" : "en"}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Dag</Label>
                    <Select value={selectedDateValue} onValueChange={handleDateSelect}>
                      <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/5 dark:text-white">
                        <SelectValue placeholder="Kies een open dag" />
                      </SelectTrigger>
                      <SelectContent>
                        {groupedSlotDays.map((day) => (
                          <SelectItem key={day.dateValue} value={day.dateValue}>
                            {day.dayLabel}
                            {earliestSlotDay?.dateValue === day.dateValue
                              ? " - Snelst beschikbaar"
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tijdvak</Label>
                    <Select value={selectedSlot?.id ?? ""} onValueChange={handleSlotSelect}>
                      <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/5 dark:text-white">
                        <SelectValue placeholder="Kies een open tijdvak" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSlotsForSelectedDate.map((slot) => (
                          <SelectItem key={slot.id} value={slot.id}>
                            {slot.tijdvak}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1rem] border border-slate-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                      Gekozen dag
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                      {selectedSlotDatePretty || "Nog geen dag gekozen"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
                      {selectedDayGroup
                        ? `${selectedDayGroup.slotCount} open tijdvak${
                            selectedDayGroup.slotCount === 1 ? "" : "ken"
                          } beschikbaar`
                        : "Kies eerst een dag om de beschikbare tijden te zien"}
                    </p>
                  </div>

                  <div className="rounded-[1rem] border border-slate-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                        Snelst beschikbaar
                      </p>
                      {earliestSlotDay ? (
                        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                          Eerstvolgende
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                      {earliestSlotDay?.dayLabel || "Nog geen open dag"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
                      {earliestSlotDay
                        ? `${earliestSlotDay.slotCount} open tijdvak${
                            earliestSlotDay.slotCount === 1 ? "" : "ken"
                          } op deze dag`
                        : "De instructeur heeft nog geen open live agenda"}
                    </p>
                  </div>
                </div>

                {selectedSlot ? (
                  <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                        Gekozen uit live agenda
                      </p>
                      <Badge
                        className={cn(
                          "border",
                          canDirectBook
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100"
                            : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100"
                        )}
                      >
                        {canDirectBook ? "Direct vast na bevestigen" : "Voorkeur met live koppeling"}
                      </Badge>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="size-4" />
                        <div>
                          <p className="font-medium">{selectedSlot.dag}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-300">
                            {selectedSlotDayLabel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock3 className="size-4" />
                        <div>
                          <p className="font-medium">{selectedSlot.tijdvak}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-300">
                            {selectedDaySlotCount > 1
                              ? `${selectedDaySlotCount} open tijdvakken op deze dag`
                              : "Dit moment staat echt open"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-[11px] leading-5 text-slate-500 dark:text-slate-300">
                      {canDirectBook
                        ? "Na bevestigen staat dit moment meteen vast in jouw en de instructeuragenda."
                        : "Dit tijdvak blijft gekoppeld aan het live kalenderblok dat je hebt gekozen."}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/90 p-3 text-[11px] leading-5 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Deze instructeur heeft nu nog geen live open momenten. Vul daarom hieronder je voorkeursdatum en tijdvak in.
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="datum">Voorkeursdatum</Label>
                    <Input
                      id="datum"
                      type="date"
                      required
                      value={manualDate}
                      onChange={(event) => setManualDate(event.target.value)}
                      className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tijdvak">Tijdvak</Label>
                    <Input
                      id="tijdvak"
                      placeholder="Bijvoorbeeld 18:00 - 19:30"
                      required
                      value={manualTime}
                      onChange={(event) => setManualTime(event.target.value)}
                      className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      Samenvatting
                    </p>
                    <p className="mt-2 text-sm leading-6">
                      {primaryLabel} bij {instructorName}
                      {selectedSlot
                        ? ` op ${selectedSlot.dag}, ${selectedSlot.tijdvak}`
                        : manualDate && manualTime
                          ? ` op ${manualDate}, ${manualTime}`
                          : " met jouw voorkeursmoment"}
                      {canDirectBook ? " wordt direct ingepland." : " wordt als aanvraag verstuurd."}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "border",
                      canDirectBook
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100"
                        : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100"
                    )}
                  >
                    {canDirectBook ? "Direct in agenda" : "Eerst ter beoordeling"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bericht">Opmerking</Label>
                <Textarea
                  id="bericht"
                  name="bericht"
                  placeholder="Geef aan wat je wilt oefenen of waar je hulp bij zoekt."
                  className="min-h-28 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter className="sticky bottom-[-1rem] z-10 gap-2 border-t border-slate-200 bg-white/95 backdrop-blur sm:justify-between dark:border-white/10 dark:bg-slate-950/95">
            <Button
              type="button"
              variant="outline"
              onClick={() => (step === 1 ? setOpen(false) : setStep((current) => current - 1))}
            >
              {step === 1 ? "Annuleren" : "Terug"}
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((current) => current + 1)}
                disabled={step === 2 && !canGoNextFromMoment}
              >
                Volgende stap
              </Button>
            ) : (
              <Button type="submit" disabled={isPending || !canGoNextFromMoment}>
                {isPending ? `${submitLabel}...` : submitLabel}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
