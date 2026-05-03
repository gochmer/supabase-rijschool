"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";

import { createInstructorLessonForLearnerAction } from "@/lib/actions/instructor-learners";
import { addMinutesToTimeValue } from "@/lib/booking-availability";
import {
  DEFAULT_LESSON_DURATION_MINUTES,
  getLessonDurationKindLabel,
  type InstructorLessonDurationDefaults,
  type LessonDurationKind,
} from "@/lib/lesson-durations";
import type { FirstLessonTemplate } from "@/lib/package-first-lesson-template";
import type { LocationOption } from "@/lib/types";
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
import { cn } from "@/lib/utils";

const LOCATION_LATER_VALUE = "__later__";

const lessonKindOptions: LessonDurationKind[] = [
  "rijles",
  "proefles",
  "pakketles",
  "examenrit",
];

export type LessonPlanningAvailabilitySlot = {
  id: string;
  dag?: string;
  tijdvak?: string;
  beschikbaar?: boolean;
  start_at?: string | null;
  eind_at?: string | null;
};

export type LessonPlanningBusyWindow = {
  id: string;
  label?: string | null;
  status?: string | null;
  start_at?: string | null;
  end_at?: string | null;
};

type PlanningSegment = {
  startMinutes: number;
  endMinutes: number;
};

type AvailableStartTimeOption = {
  value: string;
  label: string;
};

type AvailableStartDateOption = {
  dateValue: string;
  label: string;
  slotCount: number;
  firstTime: string;
};

const amsterdamPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Amsterdam",
  year: "numeric",
});

const dateLabelFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  weekday: "long",
  year: "numeric",
});

function getTodayDate() {
  const current = new Date();
  const local = new Date(current.getTime() - current.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function getDefaultStartTime() {
  return "09:00";
}

function formatDateLabel(dateValue: string) {
  return dateLabelFormatter.format(new Date(`${dateValue}T12:00:00`));
}

function getPlainLocalDateTimeParts(dateLike: string) {
  const match = dateLike.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?$/,
  );

  if (!match) {
    return null;
  }

  return {
    dateValue: match[1],
    minutesOfDay: Number.parseInt(match[2], 10) * 60 + Number.parseInt(match[3], 10),
  };
}

function getAmsterdamDateTimeParts(dateLike: string | null | undefined) {
  if (!dateLike) {
    return null;
  }

  const plainLocalParts = getPlainLocalDateTimeParts(dateLike);

  if (plainLocalParts) {
    return plainLocalParts;
  }

  const date = new Date(dateLike);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = amsterdamPartsFormatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = Number.parseInt(getPart("hour"), 10);
  const minute = Number.parseInt(getPart("minute"), 10);

  if (!year || !month || !day || !Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return {
    dateValue: `${year}-${month}-${day}`,
    minutesOfDay: hour * 60 + minute,
  };
}

function formatMinutesAsTime(minutes: number) {
  const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const minute = normalizedMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function windowsOverlap(left: PlanningSegment, right: PlanningSegment) {
  return left.startMinutes < right.endMinutes && left.endMinutes > right.startMinutes;
}

function subtractBusyWindows(
  segment: PlanningSegment,
  busyWindows: PlanningSegment[],
) {
  return busyWindows.reduce<PlanningSegment[]>(
    (segments, busyWindow) =>
      segments.flatMap((currentSegment) => {
        if (!windowsOverlap(currentSegment, busyWindow)) {
          return [currentSegment];
        }

        const nextSegments: PlanningSegment[] = [];
        const leftEnd = Math.min(busyWindow.startMinutes, currentSegment.endMinutes);
        const rightStart = Math.max(busyWindow.endMinutes, currentSegment.startMinutes);

        if (leftEnd > currentSegment.startMinutes) {
          nextSegments.push({
            startMinutes: currentSegment.startMinutes,
            endMinutes: leftEnd,
          });
        }

        if (rightStart < currentSegment.endMinutes) {
          nextSegments.push({
            startMinutes: rightStart,
            endMinutes: currentSegment.endMinutes,
          });
        }

        return nextSegments;
      }),
    [segment],
  );
}

function buildAvailableStartTimeOptions({
  availabilitySlots,
  busyWindows,
  dateValue,
  durationMinutes,
}: {
  availabilitySlots: LessonPlanningAvailabilitySlot[];
  busyWindows: LessonPlanningBusyWindow[];
  dateValue: string;
  durationMinutes: number;
}) {
  if (!dateValue || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return [];
  }

  const dayBusyWindows = busyWindows
    .map((window) => {
      const startParts = getAmsterdamDateTimeParts(window.start_at);
      const endParts = getAmsterdamDateTimeParts(window.end_at);

      if (
        !startParts ||
        !endParts ||
        startParts.dateValue !== dateValue ||
        endParts.dateValue !== dateValue ||
        endParts.minutesOfDay <= startParts.minutesOfDay
      ) {
        return null;
      }

      return {
        startMinutes: startParts.minutesOfDay,
        endMinutes: endParts.minutesOfDay,
      };
    })
    .filter((window): window is PlanningSegment => Boolean(window))
    .sort((left, right) => left.startMinutes - right.startMinutes);

  const options = availabilitySlots
    .filter((slot) => slot.beschikbaar !== false)
    .flatMap((slot) => {
      const startParts = getAmsterdamDateTimeParts(slot.start_at);
      const endParts = getAmsterdamDateTimeParts(slot.eind_at);

      if (
        !startParts ||
        !endParts ||
        startParts.dateValue !== dateValue ||
        endParts.dateValue !== dateValue ||
        endParts.minutesOfDay <= startParts.minutesOfDay
      ) {
        return [];
      }

      return subtractBusyWindows(
        {
          startMinutes: startParts.minutesOfDay,
          endMinutes: endParts.minutesOfDay,
        },
        dayBusyWindows,
      );
    })
    .flatMap((segment) => {
      const segmentOptions: AvailableStartTimeOption[] = [];

      for (
        let cursor = segment.startMinutes;
        cursor + durationMinutes <= segment.endMinutes;
        cursor += durationMinutes
      ) {
        const startLabel = formatMinutesAsTime(cursor);
        const endLabel = formatMinutesAsTime(cursor + durationMinutes);

        segmentOptions.push({
          value: startLabel,
          label: `${startLabel} - ${endLabel}`,
        });
      }

      return segmentOptions;
    });

  return Array.from(
    new Map(options.map((option) => [option.value, option])).values(),
  ).sort((left, right) => left.value.localeCompare(right.value));
}

function buildAvailableStartDateOptions(params: {
  availabilitySlots: LessonPlanningAvailabilitySlot[];
  busyWindows: LessonPlanningBusyWindow[];
  durationMinutes: number;
}) {
  const dateValues = Array.from(
    new Set(
      params.availabilitySlots
        .filter((slot) => slot.beschikbaar !== false)
        .map((slot) => getAmsterdamDateTimeParts(slot.start_at)?.dateValue ?? null)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();

  return dateValues
    .map<AvailableStartDateOption | null>((dateValue) => {
      const startTimeOptions = buildAvailableStartTimeOptions({
        ...params,
        dateValue,
      });

      if (!startTimeOptions.length) {
        return null;
      }

      return {
        dateValue,
        label: formatDateLabel(dateValue),
        slotCount: startTimeOptions.length,
        firstTime: startTimeOptions[0].value,
      };
    })
    .filter((option): option is AvailableStartDateOption => Boolean(option));
}

export function CreateManualLessonDialog({
  leerlingId,
  leerlingNaam,
  suggestedTitle,
  locationOptions = [],
  availabilitySlots = [],
  busyWindows = [],
  template,
  durationDefaults = DEFAULT_LESSON_DURATION_MINUTES,
  triggerClassName,
  triggerIconOnly = false,
  triggerLabel = "Les inplannen",
  triggerVariant = "default",
}: {
  leerlingId: string;
  leerlingNaam: string;
  suggestedTitle?: string;
  locationOptions?: LocationOption[];
  availabilitySlots?: LessonPlanningAvailabilitySlot[];
  busyWindows?: LessonPlanningBusyWindow[];
  template?: FirstLessonTemplate | null;
  durationDefaults?: InstructorLessonDurationDefaults;
  triggerClassName?: string;
  triggerIconOnly?: boolean;
  triggerLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
}) {
  const router = useRouter();
  const defaultLessonKind: LessonDurationKind = template ? "pakketles" : "rijles";
  const [open, setOpen] = useState(false);
  const [lessonKind, setLessonKind] = useState<LessonDurationKind>(defaultLessonKind);
  const [title, setTitle] = useState(template?.title || suggestedTitle || "Rijles");
  const [date, setDate] = useState(getTodayDate());
  const [time, setTime] = useState(getDefaultStartTime());
  const [duration, setDuration] = useState(
    String(template?.durationMinutes ?? durationDefaults[defaultLessonKind])
  );
  const [locationChoice, setLocationChoice] = useState(LOCATION_LATER_VALUE);
  const [isPending, startTransition] = useTransition();

  const lessonKindId = useId();
  const titleId = useId();
  const dateId = useId();
  const timeId = useId();
  const durationId = useId();

  const locationLabel = useMemo(() => {
    if (locationChoice === LOCATION_LATER_VALUE) {
      return "Locatie volgt nog";
    }

    return (
      locationOptions.find((location) => location.id === locationChoice)?.label ??
      "Locatie volgt nog"
    );
  }, [locationChoice, locationOptions]);

  const durationMinutes = useMemo(() => Number.parseInt(duration, 10), [duration]);
  const availableStartDateOptions = useMemo(
    () =>
      buildAvailableStartDateOptions({
        availabilitySlots,
        busyWindows,
        durationMinutes,
      }),
    [availabilitySlots, busyWindows, durationMinutes],
  );
  const availableStartTimeOptions = useMemo(
    () =>
      buildAvailableStartTimeOptions({
        availabilitySlots,
        busyWindows,
        dateValue: date,
        durationMinutes,
      }),
    [availabilitySlots, busyWindows, date, durationMinutes],
  );
  const hasPlanningAvailability = availabilitySlots.some(
    (slot) => slot.beschikbaar !== false && Boolean(slot.start_at && slot.eind_at),
  );

  const endTimeLabel = useMemo(() => {
    if (!date || !time || !Number.isFinite(durationMinutes)) {
      return null;
    }

    return addMinutesToTimeValue(time, durationMinutes);
  }, [date, durationMinutes, time]);

  useEffect(() => {
    if (!open || !availableStartDateOptions.length) {
      return;
    }

    if (!availableStartDateOptions.some((option) => option.dateValue === date)) {
      setDate(availableStartDateOptions[0].dateValue);
      setTime(availableStartDateOptions[0].firstTime);
      return;
    }

    if (!availableStartTimeOptions.some((option) => option.value === time)) {
      setTime(availableStartTimeOptions[0].value);
    }
  }, [availableStartDateOptions, availableStartTimeOptions, date, open, time]);

  function reset() {
    setLessonKind(defaultLessonKind);
    setTitle(template?.title || suggestedTitle || "Rijles");
    setDate(getTodayDate());
    setTime(getDefaultStartTime());
    setDuration(String(template?.durationMinutes ?? durationDefaults[defaultLessonKind]));
    setLocationChoice(LOCATION_LATER_VALUE);
  }

  function handleLessonKindChange(nextKind: LessonDurationKind) {
    setLessonKind(nextKind);
    setDuration(String(durationDefaults[nextKind]));

    if (!template) {
      setTitle(getLessonDurationKindLabel(nextKind));
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createInstructorLessonForLearnerAction({
        leerlingId,
        title,
        datum: date,
        tijd: time,
        duurMinuten: Number(duration),
        locationId:
          locationChoice !== LOCATION_LATER_VALUE ? locationChoice : null,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          className={cn("h-9 rounded-full text-[12px]", triggerClassName)}
          title={triggerLabel}
        >
          {triggerIconOnly ? (
            <>
              <CalendarPlus className="size-4" />
              <span className="sr-only">{triggerLabel}</span>
            </>
          ) : (
            triggerLabel
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Handmatig les inplannen voor {leerlingNaam}</DialogTitle>
          <DialogDescription>
            Zet direct een les in de agenda voor deze leerling. Daarna verschijnt
            het lesmoment automatisch in jullie dashboards.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={lessonKindId}>Lestype</Label>
            <Select value={lessonKind} onValueChange={(value) => handleLessonKindChange(value as LessonDurationKind)}>
              <SelectTrigger
                id={lessonKindId}
                className="dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <SelectValue placeholder="Kies een lestype" />
              </SelectTrigger>
              <SelectContent>
                {lessonKindOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {getLessonDurationKindLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={titleId}>Lestitel</Label>
            <Input
              id={titleId}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Bijvoorbeeld Premium examentraject"
              className="dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={dateId}>Datum</Label>
            {availableStartDateOptions.length ? (
              <Select value={date} onValueChange={setDate}>
                <SelectTrigger
                  id={dateId}
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <SelectValue placeholder="Kies een open dag" />
                </SelectTrigger>
                <SelectContent>
                  {availableStartDateOptions.map((option, index) => (
                    <SelectItem key={option.dateValue} value={option.dateValue}>
                      {option.label}
                      {index === 0 ? " - snelst beschikbaar" : ""} (
                      {option.slotCount} blok{option.slotCount === 1 ? "" : "ken"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={dateId}
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            )}
            {availableStartDateOptions.length ? (
              <p className="text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                Deze dagen komen uit dezelfde open agenda als de leerlingboekingen.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={timeId}>Starttijd</Label>
            {availableStartTimeOptions.length ? (
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger
                  id={timeId}
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <SelectValue placeholder="Kies een starttijd" />
                </SelectTrigger>
                <SelectContent>
                  {availableStartTimeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={timeId}
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            )}
            {hasPlanningAvailability ? (
              <p className="text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                {availableStartTimeOptions.length
                  ? `${availableStartTimeOptions.length} passende starttijden voor ${durationMinutes} minuten.`
                  : "Geen passend vrij blok voor deze datum en duur."}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={durationId}>Duur in minuten</Label>
            <Input
              id={durationId}
              type="number"
              min={30}
              max={240}
              step={15}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Locatie</Label>
            <Select value={locationChoice} onValueChange={setLocationChoice}>
              <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
                <SelectValue placeholder="Kies een locatie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LOCATION_LATER_VALUE}>Locatie later bepalen</SelectItem>
                {locationOptions.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {template ? (
          <div className="rounded-[1.05rem] border border-slate-200/80 bg-slate-50/90 p-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                Eerste lesopzet
              </p>
              <span className="rounded-full border border-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-white/10 dark:text-slate-200">
                {template.durationMinutes} min
              </span>
            </div>
            <p className="mt-2 leading-6">{template.summary}</p>
            <ul className="mt-2 space-y-1.5 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
              {template.bullets.map((bullet) => (
                <li key={bullet}>- {bullet}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-[1.05rem] border border-slate-200/80 bg-slate-50/90 p-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <strong className="text-slate-950 dark:text-white">Samenvatting:</strong>{" "}
          {title.trim() || "Rijles"} voor {leerlingNaam}. Type:{" "}
          {getLessonDurationKindLabel(lessonKind)}.{" "}
          {time ? `Start ${time}` : null}
          {endTimeLabel ? `, einde ${endTimeLabel}` : null}. Locatie: {locationLabel}.
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !date || !time || !title.trim()}
          >
            {isPending ? "Inplannen..." : "Les inplannen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
