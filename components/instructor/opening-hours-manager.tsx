"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  EyeOff,
  Luggage,
  PlusSquare,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  applyAvailabilityWeeklyBulkAction,
  createAvailabilitySlotAction,
} from "@/lib/actions/instructor-availability";
import {
  addDaysToDateValue,
  createAvailabilityTimestamp,
  formatAvailabilityDay,
  getAvailabilityDateValue,
  getAvailabilityWeekdayNumber,
  getStartOfWeekDateValue,
} from "@/lib/availability";
import type { BeschikbaarheidSlot } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type QuickAction = "moment" | "vacation" | "week";

const weekdayOptions = [
  { value: 1, shortLabel: "Ma" },
  { value: 2, shortLabel: "Di" },
  { value: 3, shortLabel: "Wo" },
  { value: 4, shortLabel: "Do" },
  { value: 5, shortLabel: "Vr" },
  { value: 6, shortLabel: "Za" },
  { value: 7, shortLabel: "Zo" },
] as const;

const schedulePresets = [
  {
    label: "Werkdag 09:00 - 17:00",
    start: "09:00",
    end: "17:00",
    weekdays: [1, 2, 3, 4, 5],
  },
  {
    label: "Lange dag 09:00 - 20:00",
    start: "09:00",
    end: "20:00",
    weekdays: [1, 2, 3, 4, 5],
  },
];

const exceptionPresets = [
  { label: "Lunch 12:30 - 13:30", start: "12:30", end: "13:30" },
  { label: "Ochtend dicht", start: "09:00", end: "12:00" },
  { label: "Middag dicht", start: "13:00", end: "17:00" },
];

function getTodayValue() {
  return getAvailabilityDateValue(new Date().toISOString());
}

function ActionShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.35rem] border border-sky-300/18 bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.16),transparent_34%),linear-gradient(145deg,rgba(10,18,32,0.98),rgba(5,12,22,0.99))] p-6 shadow-[0_26px_80px_-58px_rgba(0,0,0,0.95)] sm:p-8",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function OpeningHoursManager({
  slots,
}: {
  slots: BeschikbaarheidSlot[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initialDateValue = useMemo(
    () =>
      slots.find((slot) => slot.start_at)?.start_at
        ? getAvailabilityDateValue(
            slots.find((slot) => slot.start_at)?.start_at ?? "",
          )
        : getTodayValue(),
    [slots],
  );
  const [selectedDateValue, setSelectedDateValue] = useState(initialDateValue);
  const [startTijd, setStartTijd] = useState("09:00");
  const [eindTijd, setEindTijd] = useState("17:00");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([
    1, 2, 3, 4, 5,
  ]);
  const [useBreakWindow, setUseBreakWindow] = useState(false);
  const [pauseStartTijd, setPauseStartTijd] = useState("12:30");
  const [pauseEindTijd, setPauseEindTijd] = useState("13:00");
  const [activeQuickAction, setActiveQuickAction] =
    useState<QuickAction>("moment");
  const [exceptionStartTijd, setExceptionStartTijd] = useState("09:00");
  const [exceptionEindTijd, setExceptionEindTijd] = useState("12:00");
  const [vacationStartDate, setVacationStartDate] = useState(initialDateValue);
  const [vacationEndDate, setVacationEndDate] = useState(
    addDaysToDateValue(initialDateValue, 2),
  );
  const [bulkCutoffTime, setBulkCutoffTime] = useState("18:00");
  const selectedWeekStart = getStartOfWeekDateValue(
    selectedDateValue || initialDateValue,
  );

  function runAction(
    action: () => Promise<{
      success: boolean;
      message: string;
      detail?: string;
    }>,
  ) {
    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(
        result.detail ? `${result.message} ${result.detail}` : result.message,
      );
      router.refresh();
    });
  }

  function toggleWeekday(value: number) {
    setSelectedWeekdays((current) =>
      current.includes(value)
        ? current.filter((day) => day !== value)
        : [...current, value].sort((left, right) => left - right),
    );
  }

  function applyPreset(preset: (typeof schedulePresets)[number]) {
    setStartTijd(preset.start);
    setEindTijd(preset.end);
    setSelectedWeekdays(preset.weekdays);
    toast.success(`${preset.label} staat klaar.`);
  }

  function applyExceptionPreset(preset: (typeof exceptionPresets)[number]) {
    setExceptionStartTijd(preset.start);
    setExceptionEindTijd(preset.end);
    toast.success(`${preset.label} staat klaar.`);
  }

  function handleSaveFixedWeekSchedule() {
    const normalizedWeekdays = selectedWeekdays.length
      ? selectedWeekdays
      : [
          getAvailabilityWeekdayNumber(
            createAvailabilityTimestamp(selectedDateValue, "12:00"),
          ),
        ];

    runAction(() =>
      createAvailabilitySlotAction({
        datum: selectedDateValue,
        startTijd,
        eindTijd,
        repeatWeeks: "ongoing",
        weekdagen: normalizedWeekdays,
        pauzeStartTijd: useBreakWindow ? pauseStartTijd : undefined,
        pauzeEindTijd: useBreakWindow ? pauseEindTijd : undefined,
        beschikbaar: true,
      }),
    );
  }

  function handleCreateExceptionBlock() {
    runAction(() =>
      createAvailabilitySlotAction({
        datum: selectedDateValue,
        startTijd: exceptionStartTijd,
        eindTijd: exceptionEindTijd,
        beschikbaar: false,
      }),
    );
  }

  function handleCreateVacationBlock() {
    runAction(() =>
      createAvailabilitySlotAction({
        datum: vacationStartDate,
        eindDatum: vacationEndDate,
        startTijd: "00:00",
        eindTijd: "23:59",
        beschikbaar: false,
      }),
    );
  }

  function handleBulkCloseAfterTime() {
    runAction(() =>
      applyAvailabilityWeeklyBulkAction({
        weekStartDateValue: selectedWeekStart,
        action: "close_after_time",
        cutoffTime: bulkCutoffTime,
      }),
    );
  }

  function handleBulkOpenAfterTime() {
    runAction(() =>
      applyAvailabilityWeeklyBulkAction({
        weekStartDateValue: selectedWeekStart,
        action: "open_after_time",
        cutoffTime: bulkCutoffTime,
      }),
    );
  }

  function handleBulkCloseWeekend() {
    runAction(() =>
      applyAvailabilityWeeklyBulkAction({
        weekStartDateValue: selectedWeekStart,
        action: "close_weekend",
      }),
    );
  }

  return (
    <div id="beschikbaarheid-beheer" className="space-y-6 scroll-mt-28">
      <div className="grid gap-5 xl:grid-cols-2">
        <ActionShell className="min-h-[560px]">
          <div className="flex items-start gap-5">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl text-sky-300 ring-1 ring-sky-300/35">
              <CalendarClock className="size-8" />
            </span>
            <div className="min-w-0">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Basisrooster
              </h2>
              <p className="mt-3 text-xl leading-7 text-slate-300">
                Stel de vaste werktijden in voor je bedrijf.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {schedulePresets.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                className="rounded-full border-white/10 bg-white/5 text-xs text-slate-100 hover:bg-white/10"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-lg font-medium text-white">
                Werkdag start
              </Label>
              <Input
                type="time"
                value={startTijd}
                onChange={(event) => setStartTijd(event.target.value)}
                className="h-16 rounded-xl border-slate-600/80 bg-slate-900/70 px-6 text-2xl font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-visible:border-sky-400/70 focus-visible:ring-sky-400/20"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-lg font-medium text-white">
                Werkdag eind
              </Label>
              <Input
                type="time"
                value={eindTijd}
                onChange={(event) => setEindTijd(event.target.value)}
                className="h-16 rounded-xl border-slate-600/80 bg-slate-900/70 px-6 text-2xl font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-visible:border-sky-400/70 focus-visible:ring-sky-400/20"
              />
            </div>
          </div>

          <div className="mt-9 space-y-5">
            <Label className="text-lg font-medium text-white">Werkdagen</Label>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
              {weekdayOptions.map((option) => {
                const active = selectedWeekdays.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleWeekday(option.value)}
                    className={cn(
                      "h-16 rounded-xl border text-2xl font-semibold transition focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:outline-none",
                      active
                        ? "border-sky-300/55 bg-blue-600 text-white shadow-[0_22px_44px_-28px_rgba(37,99,235,0.95)]"
                        : "border-slate-600/80 bg-slate-950/35 text-slate-100 hover:border-sky-300/45",
                    )}
                    aria-pressed={active}
                  >
                    {option.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Label className="text-lg font-medium text-white">
              Pauze meenemen
            </Label>
            <button
              type="button"
              onClick={() => setUseBreakWindow((current) => !current)}
              className="flex h-16 w-full items-center justify-between rounded-xl border border-slate-600/80 bg-slate-900/70 px-6 text-left text-2xl font-medium text-white transition hover:border-sky-300/55 focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:outline-none"
              aria-pressed={useBreakWindow}
            >
              <span>{useBreakWindow ? "Aan" : "Uit"}</span>
              <ChevronDown className="size-6 text-slate-200" />
            </button>
            {useBreakWindow ? (
              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-white">
                    Pauze start
                  </Label>
                  <Input
                    type="time"
                    value={pauseStartTijd}
                    onChange={(event) => setPauseStartTijd(event.target.value)}
                    className="h-12 rounded-xl border-slate-600/80 bg-slate-900/70 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-white">
                    Pauze eind
                  </Label>
                  <Input
                    type="time"
                    value={pauseEindTijd}
                    onChange={(event) => setPauseEindTijd(event.target.value)}
                    className="h-12 rounded-xl border-slate-600/80 bg-slate-900/70 text-white"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-8">
            <Button
              type="button"
              className="h-16 rounded-xl bg-blue-600 px-8 text-xl font-semibold text-white hover:bg-blue-500"
              disabled={isPending}
              onClick={handleSaveFixedWeekSchedule}
            >
              <PlusSquare className="size-7" />
              Vaste werktijden opslaan
            </Button>
          </div>
        </ActionShell>

        <ActionShell className="min-h-[560px]">
          <div className="flex items-start gap-5">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl text-blue-300">
              <Zap className="size-9" />
            </span>
            <div className="min-w-0">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Snelle acties
              </h2>
              <p className="mt-3 text-xl leading-7 text-slate-300">
                Beheer uitzonderingen en tijdelijke wijzigingen.
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-6">
            {[
              {
                id: "moment" as const,
                title: "Moment sluiten",
                text: "Sluit een tijdelijk moment af binnen een dag.",
                icon: Clock3,
                shell:
                  "border-blue-400/35 bg-[radial-gradient(circle_at_0%_0%,rgba(37,99,235,0.26),transparent_44%),rgba(10,24,43,0.66)] text-blue-200",
              },
              {
                id: "vacation" as const,
                title: "Vakantie blokkeren",
                text: "Blokkeer een periode waarin je gesloten bent.",
                icon: BriefcaseBusiness,
                shell:
                  "border-amber-400/35 bg-[radial-gradient(circle_at_0%_0%,rgba(245,158,11,0.24),transparent_44%),rgba(45,33,8,0.62)] text-amber-200",
              },
              {
                id: "week" as const,
                title: "Week sluiten",
                text: "Sluit een hele week tijdelijk af.",
                icon: CalendarDays,
                shell:
                  "border-violet-400/35 bg-[radial-gradient(circle_at_0%_0%,rgba(124,58,237,0.26),transparent_44%),rgba(24,18,55,0.62)] text-violet-200",
              },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeQuickAction === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveQuickAction(item.id)}
                  className={cn(
                    "group flex min-h-36 w-full items-center gap-6 rounded-xl border p-7 text-left transition hover:translate-y-[-1px] focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:outline-none",
                    item.shell,
                    active && "ring-2 ring-white/18",
                  )}
                  aria-pressed={active}
                >
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="size-8" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-2xl font-bold text-white">
                      {item.title}
                    </span>
                    <span className="mt-3 block text-xl leading-7 text-slate-200">
                      {item.text}
                    </span>
                  </span>
                  <ChevronRight className="size-9 shrink-0 text-white transition group-hover:translate-x-1" />
                </button>
              );
            })}
          </div>
        </ActionShell>
      </div>

      <section className="rounded-[1.15rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(7,14,26,0.98))] p-5 shadow-[0_24px_80px_-58px_rgba(0,0,0,0.95)]">
        {activeQuickAction === "moment" ? (
          <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Uitzondering
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                Los moment dichtzetten
              </h3>
            </div>
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Datum</Label>
                <Input
                  type="date"
                  value={selectedDateValue}
                  onChange={(event) => setSelectedDateValue(event.target.value)}
                  className="h-12 rounded-xl border-slate-600/80 bg-slate-900/70 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">
                  Presets
                </Label>
                <div className="flex flex-wrap gap-2">
                  {exceptionPresets.map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      variant="outline"
                      className="rounded-full border-white/10 bg-white/5 text-xs text-slate-100 hover:bg-white/10"
                      onClick={() => applyExceptionPreset(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Start</Label>
                <Input
                  type="time"
                  value={exceptionStartTijd}
                  onChange={(event) =>
                    setExceptionStartTijd(event.target.value)
                  }
                  className="h-12 rounded-xl border-slate-600/80 bg-slate-900/70 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Eind</Label>
                <Input
                  type="time"
                  value={exceptionEindTijd}
                  onChange={(event) => setExceptionEindTijd(event.target.value)}
                  className="h-12 rounded-xl border-slate-600/80 bg-slate-900/70 text-white"
                />
              </div>
              <div className="lg:col-span-2">
                <Button
                  type="button"
                  className="h-12 rounded-xl bg-sky-500 px-5 text-slate-950 hover:bg-sky-400"
                  disabled={isPending}
                  onClick={handleCreateExceptionBlock}
                >
                  <EyeOff className="size-4" />
                  Moment blokkeren
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {activeQuickAction === "vacation" ? (
          <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-amber-200 uppercase">
                Vakantie
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                Vakantie blokkeren
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Van</Label>
                <Input
                  type="date"
                  value={vacationStartDate}
                  onChange={(event) => setVacationStartDate(event.target.value)}
                  className="h-12 rounded-xl border-amber-400/30 bg-amber-950/25 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">
                  Tot en met
                </Label>
                <Input
                  type="date"
                  value={vacationEndDate}
                  onChange={(event) => setVacationEndDate(event.target.value)}
                  className="h-12 rounded-xl border-amber-400/30 bg-amber-950/25 text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-amber-400/35 bg-amber-400/12 px-5 text-amber-100 hover:bg-amber-400/18"
                  disabled={isPending}
                  onClick={handleCreateVacationBlock}
                >
                  <Luggage className="size-4" />
                  Periode blokkeren
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {activeQuickAction === "week" ? (
          <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-violet-200 uppercase">
                Weekacties
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                Week sluiten
              </h3>
              <Badge className="mt-4 border border-white/10 bg-white/8 text-slate-100">
                Week van{" "}
                {formatAvailabilityDay(
                  createAvailabilityTimestamp(selectedWeekStart, "12:00"),
                )}
              </Badge>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">
                  Na dit uur
                </Label>
                <Input
                  type="time"
                  value={bulkCutoffTime}
                  onChange={(event) => setBulkCutoffTime(event.target.value)}
                  className="h-12 rounded-xl border-slate-600/80 bg-slate-900/70 text-white"
                />
              </div>
              <Button
                type="button"
                className="h-12 rounded-xl bg-sky-500 px-5 text-slate-950 hover:bg-sky-400"
                disabled={isPending}
                onClick={handleBulkCloseAfterTime}
              >
                Sluiten
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl border-white/10 bg-white/5 px-5 text-slate-100 hover:bg-white/10"
                disabled={isPending}
                onClick={handleBulkOpenAfterTime}
              >
                Weer open
              </Button>
              <div className="lg:col-span-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-white/10 bg-white/5 px-5 text-slate-100 hover:bg-white/10"
                  disabled={isPending}
                  onClick={handleBulkCloseWeekend}
                >
                  Weekend dicht
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
