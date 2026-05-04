"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  Car,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ListChecks,
  MapPin,
  PackageCheck,
  Repeat2,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  Trash2,
  UserRound,
  WandSparkles,
  Zap,
} from "lucide-react";
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
import type { InstructorStudentProgressRow, LocationOption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

const LOCATION_LATER_VALUE = "__later__";
const LOCATION_NEW_VALUE = "__new__";

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

type ExtraLessonDraft = {
  id: string;
  date: string;
  time: string;
};

const MAX_EXTRA_LESSONS = 6;

const manualLessonFocusOptions = [
  "Rijles",
  "Examen voorbereiding",
  "Bijzondere verrichtingen",
  "Route rijden",
  "Voertuigbeheersing",
  "Proefles",
] as const;

function formatPackageMetric(value: number | null | undefined) {
  return value == null ? "-" : String(value);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createExtraLessonId(dateValue: string) {
  return `${dateValue}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

function addDaysToDateValue(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
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
  studentOptions = [],
  suggestedTitle,
  locationOptions = [],
  availabilitySlots = [],
  busyWindows = [],
  template,
  durationDefaults = DEFAULT_LESSON_DURATION_MINUTES,
  defaultLessonKind: preferredLessonKind,
  triggerClassName,
  triggerIconOnly = false,
  triggerLabel = "Les inplannen",
  triggerVariant = "default",
}: {
  leerlingId: string;
  leerlingNaam: string;
  studentOptions?: InstructorStudentProgressRow[];
  suggestedTitle?: string;
  locationOptions?: LocationOption[];
  availabilitySlots?: LessonPlanningAvailabilitySlot[];
  busyWindows?: LessonPlanningBusyWindow[];
  template?: FirstLessonTemplate | null;
  durationDefaults?: InstructorLessonDurationDefaults;
  defaultLessonKind?: LessonDurationKind;
  triggerClassName?: string;
  triggerIconOnly?: boolean;
  triggerLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
}) {
  const router = useRouter();
  const defaultLessonKind: LessonDurationKind =
    preferredLessonKind ?? (template ? "pakketles" : "rijles");
  const [open, setOpen] = useState(false);
  const [selectedLearnerId, setSelectedLearnerId] = useState(leerlingId);
  const [lessonKind, setLessonKind] = useState<LessonDurationKind>(defaultLessonKind);
  const [title, setTitle] = useState(template?.title || suggestedTitle || "Rijles");
  const [date, setDate] = useState(getTodayDate());
  const [time, setTime] = useState(getDefaultStartTime());
  const [duration, setDuration] = useState(
    String(template?.durationMinutes ?? durationDefaults[defaultLessonKind])
  );
  const [locationChoice, setLocationChoice] = useState(LOCATION_LATER_VALUE);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationCity, setNewLocationCity] = useState("");
  const [newLocationAddress, setNewLocationAddress] = useState("");
  const [extraLessons, setExtraLessons] = useState<ExtraLessonDraft[]>([]);
  const [isPending, startTransition] = useTransition();

  const lessonKindId = useId();
  const titleId = useId();
  const dateId = useId();
  const timeId = useId();
  const durationId = useId();
  const newLocationNameId = useId();
  const newLocationCityId = useId();
  const newLocationAddressId = useId();

  const selectableStudents = useMemo(() => {
    const options = studentOptions.length
      ? studentOptions
      : [
          {
            id: leerlingId,
            naam: leerlingNaam,
            pakket: suggestedTitle ?? "Rijles",
            voortgang: 0,
            volgendeLes: "",
            laatsteBeoordeling: "",
            gekoppeldeLessen: 0,
            aanvraagStatus: "",
          } satisfies InstructorStudentProgressRow,
        ];

    return Array.from(new Map(options.map((student) => [student.id, student])).values())
      .sort((left, right) => left.naam.localeCompare(right.naam));
  }, [leerlingId, leerlingNaam, studentOptions, suggestedTitle]);
  const selectedLearner =
    selectableStudents.find((student) => student.id === selectedLearnerId) ??
    selectableStudents.find((student) => student.id === leerlingId) ??
    null;
  const selectedLearnerName = selectedLearner?.naam ?? leerlingNaam;

  const locationLabel = useMemo(() => {
    if (locationChoice === LOCATION_LATER_VALUE) {
      return "Locatie volgt nog";
    }

    if (locationChoice === LOCATION_NEW_VALUE) {
      return newLocationName.trim() && newLocationCity.trim()
        ? `${newLocationName.trim()}, ${newLocationCity.trim()}`
        : "Nieuwe locatie";
    }

    return (
      locationOptions.find((location) => location.id === locationChoice)?.label ??
      "Locatie volgt nog"
    );
  }, [locationChoice, locationOptions, newLocationCity, newLocationName]);

  const durationMinutes = useMemo(() => Number.parseInt(duration, 10), [duration]);
  const availableStartDateOptions = useMemo(
    () => {
      if (!open) {
        return [];
      }

      return buildAvailableStartDateOptions({
        availabilitySlots,
        busyWindows,
        durationMinutes,
      });
    },
    [availabilitySlots, busyWindows, durationMinutes, open],
  );
  const availableStartTimeOptions = useMemo(
    () => {
      if (!open) {
        return [];
      }

      return buildAvailableStartTimeOptions({
        availabilitySlots,
        busyWindows,
        dateValue: date,
        durationMinutes,
      });
    },
    [availabilitySlots, busyWindows, date, durationMinutes, open],
  );
  const hasPlanningAvailability = useMemo(
    () =>
      open &&
      availabilitySlots.some(
        (slot) => slot.beschikbaar !== false && Boolean(slot.start_at && slot.eind_at),
      ),
    [availabilitySlots, open],
  );

  const endTimeLabel = useMemo(() => {
    if (!date || !time || !Number.isFinite(durationMinutes)) {
      return null;
    }

    return addMinutesToTimeValue(time, durationMinutes);
  }, [date, durationMinutes, time]);
  const selectedDateLabel = date ? formatDateLabel(date) : "Geen datum gekozen";
  const selectedTimeLabel =
    time && endTimeLabel ? `${time} - ${endTimeLabel}` : time || "--:--";
  const selectedDateOption = availableStartDateOptions.find(
    (option) => option.dateValue === date,
  );
  const lessonCount = 1 + extraLessons.length;
  const isTrialLessonSelected =
    lessonKind === "proefles" || title.toLowerCase().includes("proefles");
  const trialLessonSeriesBlocked = isTrialLessonSelected && lessonCount > 1;
  const trialLessonBlocked =
    trialLessonSeriesBlocked ||
    (isTrialLessonSelected && selectedLearner?.trialLessonAvailable === false);
  const trialLessonBlockMessage =
    trialLessonSeriesBlocked
      ? "Een proefles is een eenmalig startmoment. Verwijder extra lessen of kies een regulier lestype."
      : (selectedLearner?.trialLessonMessage ??
        "Deze leerling heeft al een proefles gepland of afgerond.");
  const selectedLearnerHasPackage = Boolean(
    selectedLearner?.pakketId ||
      (selectedLearner?.pakket && selectedLearner.pakket !== "Nog geen pakket"),
  );
  const packageUsedLessons =
    selectedLearner?.pakketGevolgdeLessen ?? selectedLearner?.voltooideLessen ?? 0;
  const packagePlannedLessons =
    selectedLearner?.pakketIngeplandeLessen ??
    Math.max((selectedLearner?.gekoppeldeLessen ?? 0) - packageUsedLessons, 0);
  const packageTotalLessons = selectedLearner?.pakketTotaalLessen ?? null;
  const packageRemainingLessons =
    selectedLearner?.pakketResterendeLessen ??
    (packageTotalLessons == null
      ? null
      : Math.max(packageTotalLessons - packageUsedLessons - packagePlannedLessons, 0));
  const packageRemainingAfterPlan =
    packageRemainingLessons == null
      ? null
      : Math.max(packageRemainingLessons - lessonCount, 0);
  const packageUsagePercent = packageTotalLessons
    ? clampNumber(
        Math.round(((packageUsedLessons + packagePlannedLessons) / packageTotalLessons) * 100),
        0,
        100,
      )
    : clampNumber(selectedLearner?.voortgang ?? 0, 0, 100);
  const planningBlockedByPackage = Boolean(
    selectedLearner?.pakketPlanningGeblokkeerd ||
      (!selectedLearnerHasPackage && !isTrialLessonSelected),
  );
  const selectedStartTimeIsAvailable =
    !hasPlanningAvailability ||
    availableStartTimeOptions.some((option) => option.value === time);
  const timeSuggestionOptions = availableStartTimeOptions.slice(0, 4).map((option, index) => ({
    ...option,
    badge:
      index === 0
        ? "Beste keuze"
        : index === 1
          ? "Snelle plek"
          : `${index + 1}e optie`,
    icon: index === 0 ? Star : index === 1 ? Zap : Clock3,
    travelLabel:
      locationChoice === LOCATION_LATER_VALUE
        ? "Reistijd volgt"
        : `Indicatie ${5 + index * 3} min reistijd`,
  }));
  const packageWarning = trialLessonBlocked
    ? {
        label: "Proefles geblokkeerd",
        text: trialLessonBlockMessage,
        tone: "amber" as const,
      }
    : isTrialLessonSelected && !selectedLearnerHasPackage
    ? {
        label: "Proefles mogelijk",
        text: "Dit is het eenmalige startmoment. Na de proefles koppel je een pakket voor vervolglessen.",
        tone: "emerald" as const,
      }
    : !selectedLearnerHasPackage
    ? {
        label: "Pakket nodig",
        text: "Vervolglessen worden pas vrijgegeven zodra er een pakket is gekoppeld.",
        tone: "amber" as const,
      }
    : packageRemainingAfterPlan != null && packageRemainingAfterPlan <= 2
      ? {
          label: "Let op",
          text: `Nog ${packageRemainingAfterPlan} les${packageRemainingAfterPlan === 1 ? "" : "sen"} over na deze planning.`,
          tone: "amber" as const,
        }
      : {
          label: "Gezond",
          text: "Deze planning past binnen het gekoppelde pakket.",
          tone: "emerald" as const,
        };
  const validationItems = [
    {
      icon: ShieldCheck,
      label: selectedStartTimeIsAvailable
        ? "Geen conflicten gevonden"
        : "Tijdslot opnieuw controleren",
      detail: selectedStartTimeIsAvailable
        ? "Instructeur en agenda zijn beschikbaar op dit moment."
        : "Dit startmoment staat niet meer als vrij blok in je agenda.",
      tone: selectedStartTimeIsAvailable ? "emerald" : "amber",
    },
    {
      icon: Sparkles,
      label: trialLessonBlocked
        ? "Proefles al gebruikt"
        : planningBlockedByPackage
        ? "Pakket koppelen voor vervolglessen"
        : "Optimale lesfrequentie",
      detail: trialLessonBlocked
        ? trialLessonBlockMessage
        : planningBlockedByPackage
        ? "Plan alleen een proefles of koppel eerst een pakket."
        : "Deze les past in het huidige traject van de leerling.",
      tone: trialLessonBlocked || planningBlockedByPackage ? "amber" : "violet",
    },
    {
      icon: Route,
      label:
        locationChoice === LOCATION_LATER_VALUE
          ? "Reistijd volgt na locatie"
          : "Reistijd zichtbaar in planning",
      detail:
        locationChoice === LOCATION_LATER_VALUE
          ? "Kies straks een ophaalpunt voor routecontrole."
          : "Gebruik dit ophaalpunt voor de route- en reistijdcheck.",
      tone: locationChoice === LOCATION_LATER_VALUE ? "blue" : "sky",
    },
  ] as const;
  const extraLessonsHaveInvalidTime = extraLessons.some((extraLesson) => {
    if (!hasPlanningAvailability) {
      return !extraLesson.date || !extraLesson.time;
    }

    const options = buildAvailableStartTimeOptions({
      availabilitySlots,
      busyWindows,
      dateValue: extraLesson.date,
      durationMinutes,
    });

    return (
      !extraLesson.date ||
      !extraLesson.time ||
      !options.some((option) => option.value === extraLesson.time)
    );
  });

  useEffect(() => {
    if (!open || !availableStartDateOptions.length) {
      return;
    }

    let cancelled = false;

    if (!availableStartDateOptions.some((option) => option.dateValue === date)) {
      queueMicrotask(() => {
        if (cancelled) {
          return;
        }

        setDate(availableStartDateOptions[0].dateValue);
        setTime(availableStartDateOptions[0].firstTime);
      });

      return () => {
        cancelled = true;
      };
    }

    if (
      availableStartTimeOptions.length &&
      !availableStartTimeOptions.some((option) => option.value === time)
    ) {
      queueMicrotask(() => {
        if (cancelled) {
          return;
        }

        setTime(availableStartTimeOptions[0].value);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [availableStartDateOptions, availableStartTimeOptions, date, open, time]);

  function reset() {
    setSelectedLearnerId(leerlingId);
    setLessonKind(defaultLessonKind);
    setTitle(template?.title || suggestedTitle || "Rijles");
    setDate(getTodayDate());
    setTime(getDefaultStartTime());
    setDuration(String(template?.durationMinutes ?? durationDefaults[defaultLessonKind]));
    setLocationChoice(LOCATION_LATER_VALUE);
    setNewLocationName("");
    setNewLocationCity("");
    setNewLocationAddress("");
    setExtraLessons([]);
  }

  function getSuggestedTitleForLearner(studentId: string) {
    const student = selectableStudents.find((option) => option.id === studentId);

    return student?.pakket && student.pakket !== "Nog geen pakket"
      ? student.pakket
      : "Rijles";
  }

  function handleLearnerChange(nextLearnerId: string) {
    const previousSuggestedTitle =
      getSuggestedTitleForLearner(selectedLearnerId);
    const shouldSyncTitle =
      !template &&
      (!title.trim() ||
        title === previousSuggestedTitle ||
        title === suggestedTitle ||
        title === "Rijles");

    setSelectedLearnerId(nextLearnerId);

    if (shouldSyncTitle) {
      setTitle(getSuggestedTitleForLearner(nextLearnerId));
    }
  }

  function handleLessonKindChange(nextKind: LessonDurationKind) {
    setLessonKind(nextKind);
    setDuration(String(durationDefaults[nextKind]));
    setExtraLessons((current) =>
      current.map((extraLesson) => ({
        ...extraLesson,
        time: getSelectableStartTime(extraLesson.date, extraLesson.time, durationDefaults[nextKind]),
      })),
    );

    if (!template) {
      setTitle(getLessonDurationKindLabel(nextKind));
    }
  }

  function getStartTimeOptions(dateValue: string, nextDuration = durationMinutes) {
    return buildAvailableStartTimeOptions({
      availabilitySlots,
      busyWindows,
      dateValue,
      durationMinutes: nextDuration,
    });
  }

  function getSelectableStartTime(
    dateValue: string,
    preferredTime: string,
    nextDuration = durationMinutes,
  ) {
    const options = getStartTimeOptions(dateValue, nextDuration);

    if (options.some((option) => option.value === preferredTime)) {
      return preferredTime;
    }

    return options[0]?.value ?? preferredTime;
  }

  function createExtraLessonDraft(anchorDate: string, preferredTime: string) {
    const nextDateOption =
      availableStartDateOptions.find((option) => option.dateValue > anchorDate) ??
      availableStartDateOptions[0];
    const nextDate = nextDateOption?.dateValue ?? addDaysToDateValue(anchorDate, 7);
    const nextTime = getSelectableStartTime(nextDate, preferredTime);

    return {
      id: createExtraLessonId(nextDate),
      date: nextDate,
      time: nextTime,
    };
  }

  function addExtraLesson() {
    if (extraLessons.length >= MAX_EXTRA_LESSONS) {
      toast.error("Je kunt maximaal 6 extra lessen tegelijk toevoegen.");
      return;
    }

    setExtraLessons((current) => {
      const previousLesson = current[current.length - 1];
      const anchorDate = previousLesson?.date ?? date;
      const preferredTime = previousLesson?.time ?? time;

      return [...current, createExtraLessonDraft(anchorDate, preferredTime)];
    });
  }

  function planRecurringSeries() {
    setExtraLessons((current) => {
      const remainingSlots = MAX_EXTRA_LESSONS - current.length;

      if (remainingSlots <= 0) {
        toast.error("Je kunt maximaal 6 extra lessen tegelijk toevoegen.");
        return current;
      }

      const nextLessons: ExtraLessonDraft[] = [];
      let anchorDate = current[current.length - 1]?.date ?? date;
      let preferredTime = current[current.length - 1]?.time ?? time;

      for (let index = 0; index < Math.min(3, remainingSlots); index += 1) {
        const nextLesson = createExtraLessonDraft(anchorDate, preferredTime);
        nextLessons.push(nextLesson);
        anchorDate = nextLesson.date;
        preferredTime = nextLesson.time;
      }

      toast.success(`${nextLessons.length} vervolgles${nextLessons.length === 1 ? "" : "sen"} klaargezet.`);
      return [...current, ...nextLessons];
    });
  }

  function fillCurrentWeek() {
    const remainingSlots = MAX_EXTRA_LESSONS - extraLessons.length;

    if (remainingSlots <= 0) {
      toast.error("Je kunt maximaal 6 extra lessen tegelijk toevoegen.");
      return;
    }

    const selectedDate = new Date(`${date}T12:00:00`);
    const selectedTime = selectedDate.getTime();
    const weekEndTime = addDaysToDateValue(date, 6);
    const candidates = availableStartDateOptions
      .filter(
        (option) =>
          option.dateValue !== date &&
          option.dateValue >= date &&
          option.dateValue <= weekEndTime,
      )
      .filter(
        (option) =>
          !extraLessons.some((extraLesson) => extraLesson.date === option.dateValue),
      )
      .sort((left, right) => left.dateValue.localeCompare(right.dateValue))
      .slice(0, Math.min(3, remainingSlots))
      .map((option) => ({
        id: createExtraLessonId(option.dateValue),
        date: option.dateValue,
        time: option.firstTime,
      }));

    if (!Number.isNaN(selectedTime) && candidates.length) {
      setExtraLessons((current) => [...current, ...candidates]);
      toast.success("Deze week is aangevuld met vrije plekken.");
      return;
    }

    planRecurringSeries();
  }

  function updateExtraLessonDate(extraLessonId: string, nextDate: string) {
    setExtraLessons((current) =>
      current.map((extraLesson) =>
        extraLesson.id === extraLessonId
          ? {
              ...extraLesson,
              date: nextDate,
              time: getSelectableStartTime(nextDate, extraLesson.time || time),
            }
          : extraLesson,
      ),
    );
  }

  function updateExtraLessonTime(extraLessonId: string, nextTime: string) {
    setExtraLessons((current) =>
      current.map((extraLesson) =>
        extraLesson.id === extraLessonId
          ? { ...extraLesson, time: nextTime }
          : extraLesson,
      ),
    );
  }

  function removeExtraLesson(extraLessonId: string) {
    setExtraLessons((current) =>
      current.filter((extraLesson) => extraLesson.id !== extraLessonId),
    );
  }

  function handleDurationChange(nextDuration: string) {
    const nextDurationMinutes = Number.parseInt(nextDuration, 10);

    setDuration(nextDuration);
    setExtraLessons((current) =>
      current.map((extraLesson) => ({
        ...extraLesson,
        time: getSelectableStartTime(
          extraLesson.date,
          extraLesson.time || time,
          nextDurationMinutes,
        ),
      })),
    );
  }

  function handleSubmit() {
    if (trialLessonBlocked) {
      toast.error(trialLessonBlockMessage);
      return;
    }

    startTransition(async () => {
      const result = await createInstructorLessonForLearnerAction({
        leerlingId: selectedLearnerId,
        title,
        datum: date,
        tijd: time,
        duurMinuten: Number(duration),
        locationId:
          locationChoice !== LOCATION_LATER_VALUE &&
          locationChoice !== LOCATION_NEW_VALUE
            ? locationChoice
            : null,
        newLocationName:
          locationChoice === LOCATION_NEW_VALUE ? newLocationName : null,
        newLocationCity:
          locationChoice === LOCATION_NEW_VALUE ? newLocationCity : null,
        newLocationAddress:
          locationChoice === LOCATION_NEW_VALUE ? newLocationAddress : null,
        extraLessons: extraLessons.map((extraLesson) => ({
          datum: extraLesson.date,
          tijd: extraLesson.time,
        })),
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
          className={cn("h-8 rounded-full px-3 text-[11px]", triggerClassName)}
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
      <DialogContent
        data-manual-lesson-planner="decision-engine"
        style={{
          maxWidth: "min(1280px, calc(100vw - 1rem))",
          width: "min(1280px, calc(100vw - 1rem))",
        }}
        className="flex h-[min(940px,calc(100dvh-1rem))] !max-w-[min(1280px,calc(100vw-1rem))] !w-[min(1280px,calc(100vw-1rem))] gap-0 overflow-hidden rounded-[1.35rem] border-sky-300/20 p-0 shadow-[0_42px_160px_-58px_rgba(14,165,233,0.9)] sm:!max-w-[min(1280px,calc(100vw-1rem))] dark:bg-[radial-gradient(circle_at_12%_0%,rgba(14,165,233,0.32),transparent_30%),radial-gradient(circle_at_72%_0%,rgba(124,58,237,0.24),transparent_28%),linear-gradient(145deg,rgba(2,6,23,0.99),rgba(15,23,42,0.98),rgba(2,6,23,0.99))] dark:text-white"
      >
        <div className="flex min-h-0 w-full flex-col">
          <div className="border-b border-sky-300/15 bg-[linear-gradient(90deg,rgba(14,165,233,0.12),rgba(124,58,237,0.12),rgba(15,23,42,0.05))] px-5 py-4">
            <DialogHeader className="gap-0 pr-10">
              <div className="flex items-start gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-sky-300/25 bg-sky-400/18 text-sky-100 shadow-[0_20px_55px_-32px_rgba(56,189,248,0.95)]">
                  <CalendarPlus className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="mb-1 text-[11px] font-semibold tracking-[0.18em] text-sky-200 uppercase">
                    Lesbeslissing
                  </p>
                  <DialogTitle className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Slimme lesplanner
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-6 text-slate-300">
                    Voor {selectedLearnerName}. Kies een moment, controleer pakketruimte en zet de les direct klaar.
                  </DialogDescription>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-500/12 px-3 py-1 text-xs font-medium text-blue-100">
                      <ListChecks className="size-4" />
                      {lessonCount} les{lessonCount === 1 ? "" : "sen"} klaarzetten
                    </span>
                    {availableStartDateOptions[0] ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100">
                        <Sparkles className="size-4" />
                        Snelst: {availableStartDateOptions[0].label}
                      </span>
                    ) : null}
                    {packageWarning.tone === "amber" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
                        <AlertTriangle className="size-4" />
                        {packageWarning.label}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="grid gap-3 border-b border-white/10 bg-slate-950/36 px-4 py-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-sky-400/12 text-sky-200">
                  <UserRound className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                    Leerling
                  </p>
                  <p className="truncate text-sm font-semibold text-white">
                    {selectedLearnerName}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-violet-400/12 text-violet-200">
                  <PackageCheck className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                    Pakket
                  </p>
                  <p className="truncate text-sm font-semibold text-white">
                    {selectedLearnerHasPackage ? selectedLearner?.pakket : "Nog geen pakket"}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={cn(
                "rounded-xl border p-3",
                packageWarning.tone === "amber"
                  ? "border-amber-300/25 bg-amber-400/10"
                  : "border-emerald-300/20 bg-emerald-400/10",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    packageWarning.tone === "amber"
                      ? "bg-amber-300/14 text-amber-100"
                      : "bg-emerald-300/14 text-emerald-100",
                  )}
                >
                  {packageWarning.tone === "amber" ? (
                    <AlertTriangle className="size-4" />
                  ) : (
                    <ShieldCheck className="size-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-300 uppercase">
                    Status
                  </p>
                  <p className="truncate text-sm font-semibold text-white">
                    {packageWarning.label}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-sky-300/20 bg-sky-400/10 p-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-sky-300/14 text-sky-100">
                  <Clock3 className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-300 uppercase">
                    Moment
                  </p>
                  <p className="truncate text-sm font-semibold text-white">
                    {selectedTimeLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-950/24 p-4 lg:grid lg:grid-cols-[23rem_minmax(0,1fr)_19rem] lg:gap-4 xl:grid-cols-[27rem_minmax(0,1fr)_22rem]">
            <div className="space-y-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
              <section className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-start gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(59,130,246,0.45),rgba(124,58,237,0.35))] text-lg font-bold text-white">
                    {getInitials(selectedLearnerName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-white">
                        {selectedLearnerName}
                      </h3>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          selectedLearner?.accountStatus === "uitgenodigd"
                            ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
                            : "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
                        )}
                      >
                        {selectedLearner?.accountStatus === "uitgenodigd"
                          ? "Uitgenodigd"
                          : "Actief"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-300">
                      {selectedLearner?.email || "Geen e-mail bekend"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {selectedLearner?.telefoon || "Geen telefoonnummer"}
                    </p>
                    {selectedLearner ? (
                      <a
                        href={`/instructeur/leerlingen?student=${selectedLearner.id}`}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 hover:text-sky-200"
                      >
                        Leerling bekijken
                        <ExternalLink className="size-4" />
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <Label className="text-xs text-slate-300">Gekoppelde leerling</Label>
                  <Select value={selectedLearnerId} onValueChange={handleLearnerChange}>
                    <SelectTrigger className="h-10 min-w-0 rounded-lg text-sm dark:border-white/10 dark:bg-white/5 dark:text-white [&>span]:truncate">
                      <SelectValue placeholder="Kies een leerling" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.naam}
                          {student.email ? ` - ${student.email}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-200">
                      <PackageCheck className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">Pakket overzicht</h3>
                      <p className="text-sm text-slate-400">
                        {selectedLearnerHasPackage
                          ? selectedLearner?.pakket
                          : "Nog geen pakket"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-semibold",
                      packageWarning.tone === "amber"
                        ? "border-amber-300/25 bg-amber-400/10 text-amber-100"
                        : "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
                    )}
                  >
                    {packageWarning.label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-4 divide-x divide-white/10 rounded-xl border border-white/10 bg-slate-950/24">
                  {[
                    ["Totaal", formatPackageMetric(packageTotalLessons)],
                    ["Verbruikt", formatPackageMetric(packageUsedLessons)],
                    ["Gepland", formatPackageMetric(packagePlannedLessons)],
                    ["Resterend", formatPackageMetric(packageRemainingLessons)],
                  ].map(([label, value], index) => (
                    <div key={label} className="px-2 py-3 text-center">
                      <p
                        className={cn(
                          "text-lg font-semibold",
                          index === 1
                            ? "text-emerald-300"
                            : index === 2
                              ? "text-sky-300"
                              : index === 3
                                ? "text-amber-300"
                                : "text-white",
                        )}
                      >
                        {value}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900">
                  <span
                    className="block h-full rounded-full bg-[linear-gradient(90deg,#22c55e,#38bdf8,#a855f7)]"
                    style={{ width: `${packageUsagePercent}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-300">
                  {packageWarning.text}
                </p>
              </section>

              <section className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">1. Kies een tijdstip</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Beschikbare tijden komen uit je agenda en bestaande lessen.
                    </p>
                  </div>
                  {selectedDateOption ? (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100">
                      {selectedDateOption.slotCount} vrij
                    </span>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
                  <div className="space-y-1.5">
                    <Label htmlFor={dateId} className="text-xs text-slate-300">
                      Datum
                    </Label>
                    {availableStartDateOptions.length ? (
                      <Select value={date} onValueChange={setDate}>
                        <SelectTrigger
                          id={dateId}
                          className="h-10 min-w-0 rounded-lg text-sm dark:border-white/10 dark:bg-white/5 dark:text-white [&>span]:truncate"
                        >
                          <SelectValue placeholder="Kies een open dag" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStartDateOptions.map((option, index) => (
                            <SelectItem key={option.dateValue} value={option.dateValue}>
                              {option.label}
                              {index === 0 ? " - snelst beschikbaar" : ""} (
                              {option.slotCount} blok
                              {option.slotCount === 1 ? "" : "ken"})
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
                        className="h-10 rounded-lg text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={timeId} className="text-xs text-slate-300">
                      Starttijd
                    </Label>
                    {availableStartTimeOptions.length ? (
                      <Select value={time} onValueChange={setTime}>
                        <SelectTrigger
                          id={timeId}
                          className="h-10 min-w-0 rounded-lg text-sm dark:border-white/10 dark:bg-white/5 dark:text-white [&>span]:truncate"
                        >
                          <SelectValue placeholder="Kies starttijd" />
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
                        className="h-10 rounded-lg text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {timeSuggestionOptions.length ? (
                    timeSuggestionOptions.map((option, index) => {
                      const Icon = option.icon;
                      const isSelected = option.value === time;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTime(option.value)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                            isSelected
                              ? "border-violet-300/60 bg-violet-500/20 shadow-[0_18px_60px_-38px_rgba(168,85,247,0.9)]"
                              : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-5 items-center justify-center rounded-full border",
                              isSelected
                                ? "border-violet-200 bg-violet-400/20 text-violet-100"
                                : "border-white/15 text-slate-500",
                            )}
                          >
                            {isSelected ? <CheckCircle2 className="size-3.5" /> : null}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-white">{option.label}</p>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                  index === 0
                                    ? "bg-emerald-400/12 text-emerald-200"
                                    : index === 1
                                      ? "bg-amber-400/12 text-amber-200"
                                      : "bg-white/8 text-slate-300",
                                )}
                              >
                                <Icon className="size-3.5" />
                                {option.badge}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              {option.travelLabel}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.025] p-4 text-sm text-slate-400">
                      Geen slimme suggesties gevonden. Je kunt nog steeds handmatig
                      een datum en tijd kiezen.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="mt-4 space-y-4 lg:mt-0 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
              <section className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Car className="size-4 text-blue-300" />
                  <h3 className="font-semibold text-white">2. Les details</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={lessonKindId} className="text-xs text-slate-300">
                      Lestype
                    </Label>
                    <Select
                      value={lessonKind}
                      onValueChange={(value) =>
                        handleLessonKindChange(value as LessonDurationKind)
                      }
                    >
                      <SelectTrigger
                        id={lessonKindId}
                        className="h-10 rounded-lg text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                      >
                        <SelectValue placeholder="Kies een lestype" />
                      </SelectTrigger>
                      <SelectContent>
                        {lessonKindOptions.map((option) => (
                          <SelectItem
                            key={option}
                            value={option}
                            disabled={
                              option === "proefles" &&
                              selectedLearner?.trialLessonAvailable === false
                            }
                          >
                            {getLessonDurationKindLabel(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={durationId} className="text-xs text-slate-300">
                      Lesduur
                    </Label>
                    <div className="relative">
                      <TimerReset className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id={durationId}
                        type="number"
                        min={30}
                        max={240}
                        step={15}
                        value={duration}
                        onChange={(event) => handleDurationChange(event.target.value)}
                        className="h-10 rounded-lg pl-9 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Instructeur</Label>
                    <div className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white">
                      <UserRound className="size-4 text-slate-400" />
                      Automatisch aanbevolen
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Locatie / ophaalpunt</Label>
                    <Select value={locationChoice} onValueChange={setLocationChoice}>
                      <SelectTrigger className="h-10 min-w-0 rounded-lg text-sm dark:border-white/10 dark:bg-white/5 dark:text-white [&>span]:truncate">
                        <SelectValue placeholder="Kies een locatie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={LOCATION_LATER_VALUE}>
                          Locatie later bepalen
                        </SelectItem>
                        {locationOptions.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.label}
                          </SelectItem>
                        ))}
                        <SelectItem value={LOCATION_NEW_VALUE}>
                          Nieuwe locatie toevoegen
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <Label htmlFor={titleId} className="text-xs text-slate-300">
                    Les focus / titel
                  </Label>
                  <Input
                    id={titleId}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Bijvoorbeeld examen voorbereiding"
                    className="h-10 rounded-lg text-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                  />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {manualLessonFocusOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setTitle(option)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition",
                          title === option
                            ? "border-violet-300/50 bg-violet-400/18 text-violet-100"
                            : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/[0.06]",
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {locationChoice === LOCATION_NEW_VALUE ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={newLocationNameId} className="text-xs text-slate-300">
                        Locatienaam
                      </Label>
                      <Input
                        id={newLocationNameId}
                        value={newLocationName}
                        onChange={(event) => setNewLocationName(event.target.value)}
                        placeholder="Bijvoorbeeld CBR centrum"
                        className="h-10 rounded-lg text-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={newLocationCityId} className="text-xs text-slate-300">
                        Stad
                      </Label>
                      <Input
                        id={newLocationCityId}
                        value={newLocationCity}
                        onChange={(event) => setNewLocationCity(event.target.value)}
                        placeholder="Amsterdam"
                        className="h-10 rounded-lg text-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={newLocationAddressId} className="text-xs text-slate-300">
                        Adres of toelichting
                      </Label>
                      <Input
                        id={newLocationAddressId}
                        value={newLocationAddress}
                        onChange={(event) => setNewLocationAddress(event.target.value)}
                        placeholder="Straat, parkeerplek of korte afspraaknotitie"
                        className="h-10 rounded-lg text-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">3. Extra opties</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Versnel terugkerende planning zonder nieuw formulier.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={addExtraLesson}
                    disabled={extraLessons.length >= MAX_EXTRA_LESSONS}
                    className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-left transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CalendarPlus className="size-5 text-violet-300" />
                    <p className="mt-3 text-sm font-semibold text-white">
                      Extra les toevoegen
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Plan meerdere losse lessen
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={planRecurringSeries}
                    disabled={extraLessons.length >= MAX_EXTRA_LESSONS}
                    className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-left transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Repeat2 className="size-5 text-violet-300" />
                    <p className="mt-3 text-sm font-semibold text-white">Reeks plannen</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Zet 3 vervolgmomenten klaar
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={fillCurrentWeek}
                    disabled={extraLessons.length >= MAX_EXTRA_LESSONS}
                    className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-left transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <WandSparkles className="size-5 text-violet-300" />
                    <p className="mt-3 text-sm font-semibold text-white">Vul mijn week</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Kies vrije plekken deze week
                    </p>
                  </button>
                </div>

                {extraLessons.length ? (
                  <div className="mt-4 space-y-2">
                    {extraLessons.map((extraLesson, index) => {
                      const extraTimeOptions = getStartTimeOptions(extraLesson.date);
                      const selectedExtraTimeOption = extraTimeOptions.find(
                        (option) => option.value === extraLesson.time,
                      );
                      const extraSelectOptions = selectedExtraTimeOption
                        ? extraTimeOptions
                        : extraLesson.time
                          ? [
                              {
                                value: extraLesson.time,
                                label: `${extraLesson.time} - ${addMinutesToTimeValue(extraLesson.time, durationMinutes)}`,
                              },
                              ...extraTimeOptions,
                            ]
                          : extraTimeOptions;

                      return (
                        <div
                          key={extraLesson.id}
                          className="grid gap-3 rounded-xl border border-blue-400/18 bg-blue-500/[0.08] p-3 md:grid-cols-[1fr_1fr_auto]"
                        >
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-300">
                              Extra les {index + 1}
                            </Label>
                            {availableStartDateOptions.length ? (
                              <Select
                                value={extraLesson.date}
                                onValueChange={(value) =>
                                  updateExtraLessonDate(extraLesson.id, value)
                                }
                              >
                                <SelectTrigger className="h-9 min-w-0 rounded-lg text-xs dark:border-white/10 dark:bg-white/5 dark:text-white [&>span]:truncate">
                                  <SelectValue placeholder="Kies een open dag" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableStartDateOptions.map((option) => (
                                    <SelectItem key={option.dateValue} value={option.dateValue}>
                                      {option.label} ({option.slotCount} blok
                                      {option.slotCount === 1 ? "" : "ken"})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type="date"
                                value={extraLesson.date}
                                onChange={(event) =>
                                  updateExtraLessonDate(extraLesson.id, event.target.value)
                                }
                                className="h-9 rounded-lg text-xs dark:border-white/10 dark:bg-white/5 dark:text-white"
                              />
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-300">Starttijd</Label>
                            {extraSelectOptions.length ? (
                              <Select
                                value={extraLesson.time}
                                onValueChange={(value) =>
                                  updateExtraLessonTime(extraLesson.id, value)
                                }
                              >
                                <SelectTrigger className="h-9 min-w-0 rounded-lg text-xs dark:border-white/10 dark:bg-white/5 dark:text-white [&>span]:truncate">
                                  <SelectValue placeholder="Kies starttijd" />
                                </SelectTrigger>
                                <SelectContent>
                                  {extraSelectOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type="time"
                                value={extraLesson.time}
                                onChange={(event) =>
                                  updateExtraLessonTime(extraLesson.id, event.target.value)
                                }
                                className="h-9 rounded-lg text-xs dark:border-white/10 dark:bg-white/5 dark:text-white"
                              />
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeExtraLesson(extraLesson.id)}
                            className="self-end rounded-lg px-2 text-rose-100 hover:bg-rose-500/10 hover:text-rose-50"
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Verwijderen</span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </section>

              {template ? (
                <section className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-4 text-sm text-slate-300">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold tracking-[0.14em] text-blue-200 uppercase">
                      Eerste lesopzet
                    </p>
                    <span className="rounded-full border border-blue-300/20 px-3 py-1 text-xs font-medium text-blue-100">
                      {template.durationMinutes} min
                    </span>
                  </div>
                  <p className="mt-2 leading-6">{template.summary}</p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-400">
                    {template.bullets.map((bullet) => (
                      <li key={bullet}>- {bullet}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <aside className="mt-4 lg:mt-0 lg:min-h-0 lg:overflow-y-auto">
              <section className="flex min-h-full flex-col rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.74),rgba(30,41,59,0.42))] p-4">
                <div className="flex items-center gap-3">
                  <CalendarCheck2 className="size-5 text-sky-300" />
                  <h3 className="text-lg font-semibold text-white">Samenvatting</h3>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex gap-3 border-b border-white/10 pb-4">
                    <CalendarDays className="mt-0.5 size-5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Datum</p>
                      <p className="mt-1 font-medium text-white">{selectedDateLabel}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 border-b border-white/10 pb-4">
                    <Clock3 className="mt-0.5 size-5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Tijd</p>
                      <p className="mt-1 font-medium text-white">
                        {selectedTimeLabel} ({durationMinutes || 0} min)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 border-b border-white/10 pb-4">
                    <UserRound className="mt-0.5 size-5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Instructeur</p>
                      <p className="mt-1 font-medium text-white">Automatisch</p>
                    </div>
                  </div>
                  <div className="flex gap-3 border-b border-white/10 pb-4">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Locatie</p>
                      <p className="mt-1 font-medium text-white">{locationLabel}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 border-b border-white/10 pb-4">
                    <Car className="mt-0.5 size-5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Les focus</p>
                      <span className="mt-2 inline-flex rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-100">
                        {title.trim() || "Rijles"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <PackageCheck className="mt-0.5 size-5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Lesnummer</p>
                      <p className="mt-1 font-medium text-white">
                        {packageTotalLessons
                          ? `Les ${packageUsedLessons + packagePlannedLessons + 1} van ${packageTotalLessons}`
                          : `${lessonCount} les${lessonCount === 1 ? "" : "sen"}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "mt-5 rounded-xl border p-3 text-sm leading-6",
                    trialLessonBlocked || planningBlockedByPackage
                      ? "border-amber-300/25 bg-amber-400/10 text-amber-100"
                      : "border-sky-300/20 bg-sky-400/10 text-sky-100",
                  )}
                >
                  {trialLessonBlocked
                    ? trialLessonBlockMessage
                    : planningBlockedByPackage
                    ? "Koppel eerst een pakket of kies Proefles als dit het startmoment is."
                    : "De les wordt direct gekoppeld aan het pakket van de leerling."}
                </div>

                {extraLessons.length ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                    <p className="text-xs font-semibold text-slate-300">Extra lessen</p>
                    <div className="mt-2 space-y-1.5 text-xs text-slate-400">
                      {extraLessons.map((extraLesson, index) => {
                        const extraEndTime = extraLesson.time
                          ? addMinutesToTimeValue(extraLesson.time, durationMinutes)
                          : null;

                        return (
                          <p key={extraLesson.id}>
                            {index + 1}. {formatDateLabel(extraLesson.date)},{" "}
                            {extraLesson.time || "--:--"}
                            {extraEndTime ? ` - ${extraEndTime}` : ""}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="mt-auto grid gap-3 pt-5">
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                      isPending ||
                      !date ||
                      !time ||
                      !title.trim() ||
                      !selectedLearnerId ||
                      trialLessonBlocked ||
                      planningBlockedByPackage ||
                      (locationChoice === LOCATION_NEW_VALUE &&
                        (!newLocationName.trim() || !newLocationCity.trim())) ||
                      extraLessonsHaveInvalidTime
                    }
                    className="h-12 rounded-xl bg-violet-500 text-base font-semibold text-white hover:bg-violet-400"
                  >
                    <CalendarPlus className="size-5" />
                    {isPending
                      ? "Inplannen..."
                      : `${lessonCount} les${lessonCount === 1 ? "" : "sen"} inplannen`}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="h-11 rounded-xl dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    Annuleren
                  </Button>
                </div>
              </section>
            </aside>
          </div>

          <div className="grid border-t border-white/10 bg-slate-950/46 px-4 py-3 md:grid-cols-3">
            {validationItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex items-start gap-3 border-white/10 px-2 py-2 md:border-r md:last:border-r-0"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      item.tone === "emerald"
                        ? "bg-emerald-400/12 text-emerald-300"
                        : item.tone === "amber"
                          ? "bg-amber-400/12 text-amber-300"
                          : item.tone === "violet"
                            ? "bg-violet-400/12 text-violet-300"
                            : "bg-sky-400/12 text-sky-300",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {item.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
