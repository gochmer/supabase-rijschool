"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Save,
  Search,
  Trash2,
  UserRoundPlus,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { updateLessonAction } from "@/lib/actions/lesson-management";
import { addDaysToDateValue, getAvailabilityDateValue } from "@/lib/availability";
import { addMinutesToTimeValue } from "@/lib/booking-availability";
import type {
  BeschikbaarheidSlot,
  InstructorStudentProgressRow,
  Les,
  LocationOption,
  LesStatus,
} from "@/lib/types";
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

const LATER_LOCATION_VALUE = "__later__";
const NEW_LOCATION_VALUE = "__new__";
const MAX_REPEAT_LESSONS = 12;
const repeatWeekdayOptions = [
  { value: "1", label: "Maandag" },
  { value: "2", label: "Dinsdag" },
  { value: "3", label: "Woensdag" },
  { value: "4", label: "Donderdag" },
  { value: "5", label: "Vrijdag" },
  { value: "6", label: "Zaterdag" },
  { value: "7", label: "Zondag" },
] as const;

type RepeatWeekdayOption = (typeof repeatWeekdayOptions)[number]["value"];

type RepeatLessonDraft = {
  id: string;
  date: string;
  time: string;
  weekday: RepeatWeekdayOption;
};

type EditableLessonStatus = Extract<
  LesStatus,
  "geaccepteerd" | "ingepland" | "afgerond" | "geannuleerd"
>;

type BusyWindow = {
  id: string;
  label?: string | null;
  start_at?: string | null;
  end_at?: string | null;
};

type TimeSegment = {
  startMinutes: number;
  endMinutes: number;
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

const longDateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  weekday: "long",
  year: "numeric",
});

function getDateTimeParts(dateLike: string | null | undefined) {
  if (!dateLike) {
    return null;
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

function overlaps(left: TimeSegment, right: TimeSegment) {
  return left.startMinutes < right.endMinutes && left.endMinutes > right.startMinutes;
}

function subtractBusyWindows(segment: TimeSegment, busyWindows: TimeSegment[]) {
  return busyWindows.reduce<TimeSegment[]>(
    (segments, busyWindow) =>
      segments.flatMap((current) => {
        if (!overlaps(current, busyWindow)) {
          return [current];
        }

        const nextSegments: TimeSegment[] = [];
        const leftEnd = Math.min(busyWindow.startMinutes, current.endMinutes);
        const rightStart = Math.max(busyWindow.endMinutes, current.startMinutes);

        if (leftEnd > current.startMinutes) {
          nextSegments.push({
            startMinutes: current.startMinutes,
            endMinutes: leftEnd,
          });
        }

        if (rightStart < current.endMinutes) {
          nextSegments.push({
            startMinutes: rightStart,
            endMinutes: current.endMinutes,
          });
        }

        return nextSegments;
      }),
    [segment],
  );
}

function getInitialDate(lesson: Les | null) {
  return getDateTimeParts(lesson?.start_at)?.dateValue ?? getAvailabilityDateValue(new Date().toISOString());
}

function getInitialTime(lesson: Les | null) {
  const parts = getDateTimeParts(lesson?.start_at);
  return parts ? formatMinutesAsTime(parts.minutesOfDay) : "09:00";
}

function getWeekdayValue(dateValue: string): RepeatWeekdayOption | null {
  const date = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const day = date.getDay();
  return String(day === 0 ? 7 : day) as RepeatWeekdayOption;
}

function getNextDateForWeekday(
  afterDateValue: string,
  weekday: RepeatWeekdayOption,
) {
  const date = new Date(`${afterDateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const targetDay = weekday === "7" ? 0 : Number(weekday);
  const currentDay = date.getDay();
  const dayOffset = (targetDay - currentDay + 7) % 7 || 7;

  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

function getDefaultRepeatStartDate(dateValue: string) {
  try {
    return addDaysToDateValue(dateValue, 7);
  } catch {
    return dateValue;
  }
}

function getMinimumRepeatStartDate(dateValue: string) {
  try {
    return addDaysToDateValue(dateValue, 1);
  } catch {
    return undefined;
  }
}

function formatDateValueLabel(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue || "-";
  }

  return longDateFormatter.format(date);
}

function createRepeatLessonDraft(
  anchorDate: string,
  preferredWeekday?: RepeatWeekdayOption,
  preferredTime = "09:00",
): RepeatLessonDraft {
  const weekday = preferredWeekday ?? getWeekdayValue(anchorDate) ?? "1";
  const nextDate =
    getNextDateForWeekday(anchorDate, weekday) ??
    getDefaultRepeatStartDate(anchorDate);

  return {
    id: `${nextDate}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: nextDate,
    time: preferredTime,
    weekday: getWeekdayValue(nextDate) ?? weekday,
  };
}

function keepRepeatLessonsAfterDate(
  repeatLessons: RepeatLessonDraft[],
  anchorDate: string,
) {
  let previousDate = anchorDate;

  return repeatLessons.map((repeatLesson) => {
    const nextDate =
      repeatLesson.date && repeatLesson.date > previousDate
        ? repeatLesson.date
        : getNextDateForWeekday(previousDate, repeatLesson.weekday) ??
          getDefaultRepeatStartDate(previousDate);

    previousDate = nextDate;

    return {
      ...repeatLesson,
      date: nextDate,
      weekday: getWeekdayValue(nextDate) ?? repeatLesson.weekday,
    };
  });
}

function getLocationChoice(lesson: Les | null, locationOptions: LocationOption[]) {
  if (
    lesson?.locatie_id &&
    locationOptions.some((location) => location.id === lesson.locatie_id)
  ) {
    return lesson.locatie_id;
  }

  return LATER_LOCATION_VALUE;
}

function getStatusLabel(status: EditableLessonStatus) {
  switch (status) {
    case "geaccepteerd":
      return "Geaccepteerd";
    case "afgerond":
      return "Afgerond";
    case "geannuleerd":
      return "Geannuleerd";
    case "ingepland":
    default:
      return "Ingepland";
  }
}

function buildAvailableStartTimeOptions({
  slots,
  busyWindows,
  selectedDate,
  durationMinutes,
  ignoreLessonId,
}: {
  slots: BeschikbaarheidSlot[];
  busyWindows: BusyWindow[];
  selectedDate: string;
  durationMinutes: number;
  ignoreLessonId?: string | null;
}) {
  if (!selectedDate || !Number.isFinite(durationMinutes) || durationMinutes < 30) {
    return [];
  }

  const dayBusyWindows = busyWindows
    .filter((window) => window.id !== ignoreLessonId)
    .map((window) => {
      const start = getDateTimeParts(window.start_at);
      const end = getDateTimeParts(window.end_at);

      if (
        !start ||
        !end ||
        start.dateValue !== selectedDate ||
        end.dateValue !== selectedDate ||
        end.minutesOfDay <= start.minutesOfDay
      ) {
        return null;
      }

      return {
        startMinutes: start.minutesOfDay,
        endMinutes: end.minutesOfDay,
      };
    })
    .filter((window): window is TimeSegment => Boolean(window))
    .sort((left, right) => left.startMinutes - right.startMinutes);

  const optionMap = new Map<string, { value: string; label: string }>();

  slots
    .filter((slot) => slot.beschikbaar && slot.start_at && slot.eind_at)
    .forEach((slot) => {
      const start = getDateTimeParts(slot.start_at);
      const end = getDateTimeParts(slot.eind_at);

      if (
        !start ||
        !end ||
        start.dateValue !== selectedDate ||
        end.dateValue !== selectedDate ||
        end.minutesOfDay <= start.minutesOfDay
      ) {
        return;
      }

      const freeSegments = subtractBusyWindows(
        {
          startMinutes: start.minutesOfDay,
          endMinutes: end.minutesOfDay,
        },
        dayBusyWindows,
      );

      freeSegments.forEach((segment) => {
        for (
          let cursor = segment.startMinutes;
          cursor + durationMinutes <= segment.endMinutes;
          cursor += 15
        ) {
          const startLabel = formatMinutesAsTime(cursor);
          const endLabel = formatMinutesAsTime(cursor + durationMinutes);

          optionMap.set(startLabel, {
            value: startLabel,
            label: `${startLabel} - ${endLabel}`,
          });
        }
      });
    });

  return Array.from(optionMap.values()).sort((left, right) =>
    left.value.localeCompare(right.value),
  );
}

export function LessonCalendarEditDialog({
  open,
  onOpenChange,
  lesson,
  students,
  locationOptions,
  slots,
  busyWindows,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Les | null;
  students: InstructorStudentProgressRow[];
  locationOptions: LocationOption[];
  slots: BeschikbaarheidSlot[];
  busyWindows: BusyWindow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [studentId, setStudentId] = useState(lesson?.leerling_id ?? "");
  const [studentSearch, setStudentSearch] = useState("");
  const [title, setTitle] = useState(lesson?.titel ?? "Rijles");
  const [date, setDate] = useState(getInitialDate(lesson));
  const [time, setTime] = useState(getInitialTime(lesson));
  const [duration, setDuration] = useState(String(lesson?.duur_minuten ?? 60));
  const [status, setStatus] = useState<EditableLessonStatus>("ingepland");
  const [repeatLessons, setRepeatLessons] = useState<RepeatLessonDraft[]>([]);
  const [reason, setReason] = useState("");
  const [locationChoice, setLocationChoice] = useState(
    getLocationChoice(lesson, locationOptions),
  );
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationCity, setNewLocationCity] = useState("");
  const [newLocationAddress, setNewLocationAddress] = useState("");
  const durationMinutes = Number.parseInt(duration, 10);
  const startTimeOptions = useMemo(
    () =>
      buildAvailableStartTimeOptions({
        slots,
        busyWindows,
        selectedDate: date,
        durationMinutes,
        ignoreLessonId: lesson?.id,
      }),
    [busyWindows, date, durationMinutes, lesson?.id, slots],
  );
  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) =>
      [student.naam, student.email, student.telefoon, student.pakket]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [studentSearch, students]);
  const selectedStudent = students.find((student) => student.id === studentId);
  const selectedLocation =
    locationChoice !== LATER_LOCATION_VALUE && locationChoice !== NEW_LOCATION_VALUE
      ? locationOptions.find((location) => location.id === locationChoice)
      : null;
  const progressValue = selectedStudent
    ? Math.min(Math.max(selectedStudent.voortgang, 0), 100)
    : 0;
  const locationLabel =
    selectedLocation?.label ?? lesson?.locatie ?? "Locatie later bepalen";
  const dateLabel = date
    ? longDateFormatter.format(new Date(`${date}T12:00:00`))
    : "Geen datum gekozen";
  const endTimeLabel =
    time && Number.isFinite(durationMinutes)
      ? addMinutesToTimeValue(time, durationMinutes)
      : null;
  const repeatAmount = repeatLessons.length;
  const repeatSummary =
    repeatAmount > 0
      ? repeatLessons
          .map(
            (repeatLesson, index) => {
              const repeatEndTime =
                repeatLesson.time && Number.isFinite(durationMinutes)
                ? addMinutesToTimeValue(repeatLesson.time, durationMinutes)
                : null;

              return `${index + 1}. ${formatDateValueLabel(repeatLesson.date)} ${repeatLesson.time || "--:--"}${repeatEndTime ? ` - ${repeatEndTime}` : ""}`;
            },
          )
          .join(", ")
      : "Geen";
  const hasInvalidRepeatLessons = repeatLessons.some((repeatLesson, index) => {
    const minimumAnchorDate =
      index === 0 ? date : repeatLessons[index - 1]?.date ?? date;
    const repeatTimeIsAvailable = buildAvailableStartTimeOptions({
      slots,
      busyWindows,
      selectedDate: repeatLesson.date,
      durationMinutes,
      ignoreLessonId: lesson?.id,
    }).some((option) => option.value === repeatLesson.time);

    return (
      !repeatLesson.date ||
      repeatLesson.date <= minimumAnchorDate ||
      !repeatLesson.time ||
      !repeatTimeIsAvailable
    );
  });
  const hasChanges =
    lesson &&
    (studentId !== (lesson.leerling_id ?? "") ||
      title.trim() !== lesson.titel ||
      date !== getInitialDate(lesson) ||
      time !== getInitialTime(lesson) ||
      Number(duration) !== lesson.duur_minuten ||
      status !==
        (["geaccepteerd", "ingepland", "afgerond", "geannuleerd"].includes(
          lesson.status,
        )
          ? lesson.status
          : "ingepland") ||
      locationChoice !== getLocationChoice(lesson, locationOptions) ||
      repeatLessons.length > 0);

  useEffect(() => {
    if (!open || !lesson) {
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setStudentId(lesson.leerling_id ?? "");
      setStudentSearch("");
      setTitle(lesson.titel || "Rijles");
      setDate(getInitialDate(lesson));
      setTime(getInitialTime(lesson));
      setDuration(String(lesson.duur_minuten ?? 60));
      setRepeatLessons([]);
      setStatus(
        lesson.status === "geaccepteerd" ||
          lesson.status === "afgerond" ||
          lesson.status === "geannuleerd"
          ? lesson.status
          : "ingepland",
      );
      setReason("");
      setLocationChoice(getLocationChoice(lesson, locationOptions));
      setNewLocationName("");
      setNewLocationCity("");
      setNewLocationAddress("");
    });

    return () => {
      cancelled = true;
    };
  }, [lesson, locationOptions, open]);

  function getRepeatTimeOptions(
    selectedDate: string,
    nextDurationMinutes = durationMinutes,
  ) {
    return buildAvailableStartTimeOptions({
      slots,
      busyWindows,
      selectedDate,
      durationMinutes: nextDurationMinutes,
      ignoreLessonId: lesson?.id,
    });
  }

  function getSelectableRepeatTime(
    selectedDate: string,
    preferredTime: string,
    nextDurationMinutes = durationMinutes,
  ) {
    const repeatTimeOptions = getRepeatTimeOptions(
      selectedDate,
      nextDurationMinutes,
    );

    if (repeatTimeOptions.some((option) => option.value === preferredTime)) {
      return preferredTime;
    }

    return repeatTimeOptions[0]?.value ?? preferredTime;
  }

  function normalizeRepeatLessonTimes(
    nextRepeatLessons: RepeatLessonDraft[],
  ) {
    return nextRepeatLessons.map((repeatLesson) => ({
      ...repeatLesson,
      time: getSelectableRepeatTime(
        repeatLesson.date,
        repeatLesson.time || time,
      ),
    }));
  }

  function shiftDate(days: number) {
    setDate((current) => {
      const nextDate = addDaysToDateValue(current, days);
      setRepeatLessons((currentRepeatLessons) =>
        normalizeRepeatLessonTimes(
          keepRepeatLessonsAfterDate(currentRepeatLessons, nextDate),
        ),
      );

      return nextDate;
    });
  }

  function handleDateChange(nextDate: string) {
    setDate(nextDate);
    setRepeatLessons((currentRepeatLessons) =>
      normalizeRepeatLessonTimes(
        keepRepeatLessonsAfterDate(currentRepeatLessons, nextDate),
      ),
    );
  }

  function handleDurationChange(nextDuration: string) {
    const nextDurationMinutes = Number.parseInt(nextDuration, 10);

    setDuration(nextDuration);
    setRepeatLessons((currentRepeatLessons) =>
      currentRepeatLessons.map((repeatLesson) => ({
        ...repeatLesson,
        time: getSelectableRepeatTime(
          repeatLesson.date,
          repeatLesson.time || time,
          nextDurationMinutes,
        ),
      })),
    );
  }

  function addRepeatLesson() {
    if (status === "geannuleerd") {
      toast.error("Volgende lessen kun je niet toevoegen bij een annulering.");
      return;
    }

    if (repeatLessons.length >= MAX_REPEAT_LESSONS) {
      toast.error("Je kunt maximaal 12 volgende lessen tegelijk maken.");
      return;
    }

    setRepeatLessons((currentRepeatLessons) => {
      const previousLesson =
        currentRepeatLessons[currentRepeatLessons.length - 1];
      const anchorDate = previousLesson?.date ?? date;
      const weekday = previousLesson?.weekday ?? getWeekdayValue(date) ?? "1";
      const preferredTime = previousLesson?.time ?? time;
      const nextRepeatLesson = createRepeatLessonDraft(
        anchorDate,
        weekday,
        preferredTime,
      );

      return [
        ...currentRepeatLessons,
        {
          ...nextRepeatLesson,
          time: getSelectableRepeatTime(
            nextRepeatLesson.date,
            nextRepeatLesson.time,
          ),
        },
      ];
    });
  }

  function removeRepeatLesson(repeatLessonId: string) {
    setRepeatLessons((currentRepeatLessons) =>
      currentRepeatLessons.filter(
        (repeatLesson) => repeatLesson.id !== repeatLessonId,
      ),
    );
  }

  function handleRepeatStartDateChange(
    repeatLessonId: string,
    nextDate: string,
  ) {
    setRepeatLessons((currentRepeatLessons) =>
      normalizeRepeatLessonTimes(
        keepRepeatLessonsAfterDate(
          currentRepeatLessons.map((repeatLesson) =>
            repeatLesson.id === repeatLessonId
              ? {
                  ...repeatLesson,
                  date: nextDate,
                  time: getSelectableRepeatTime(
                    nextDate,
                    repeatLesson.time || time,
                  ),
                  weekday: getWeekdayValue(nextDate) ?? repeatLesson.weekday,
                }
              : repeatLesson,
          ),
          date,
        ),
      ),
    );
  }

  function handleRepeatWeekdayChange(
    repeatLessonId: string,
    nextWeekday: RepeatWeekdayOption,
  ) {
    setRepeatLessons((currentRepeatLessons) => {
      const changedRepeatLessons = currentRepeatLessons.map(
        (repeatLesson, index) => {
          if (repeatLesson.id !== repeatLessonId) {
            return repeatLesson;
          }

          const anchorDate =
            index === 0
              ? date
              : currentRepeatLessons[index - 1]?.date ?? date;
          const nextDate =
            getNextDateForWeekday(anchorDate, nextWeekday) ??
            getDefaultRepeatStartDate(anchorDate);

          return {
            ...repeatLesson,
            date: nextDate,
            time: getSelectableRepeatTime(nextDate, repeatLesson.time || time),
            weekday: nextWeekday,
          };
        },
      );

      return normalizeRepeatLessonTimes(
        keepRepeatLessonsAfterDate(changedRepeatLessons, date),
      );
    });
  }

  function handleRepeatTimeChange(repeatLessonId: string, nextTime: string) {
    setRepeatLessons((currentRepeatLessons) =>
      currentRepeatLessons.map((repeatLesson) =>
        repeatLesson.id === repeatLessonId
          ? { ...repeatLesson, time: nextTime }
          : repeatLesson,
      ),
    );
  }

  function getRepeatMinimumDate(index: number) {
    const minimumAnchorDate =
      index === 0 ? date : repeatLessons[index - 1]?.date ?? date;

    return getMinimumRepeatStartDate(minimumAnchorDate);
  }

  function handleSubmit(nextStatus = status) {
    if (!lesson) {
      return;
    }

    if (!studentId) {
      toast.error("Kies eerst een leerling voor deze les.");
      return;
    }

    startTransition(async () => {
      const result = await updateLessonAction({
        lessonId: lesson.id,
        leerlingId: studentId,
        title,
        datum: date,
        tijd: time,
        duurMinuten: Number(duration),
        status: nextStatus,
        reason:
          nextStatus === "geannuleerd"
            ? reason || "Geannuleerd door instructeur."
            : reason,
        locationId:
          locationChoice !== LATER_LOCATION_VALUE && locationChoice !== NEW_LOCATION_VALUE
            ? locationChoice
            : null,
        newLocationName:
          locationChoice === NEW_LOCATION_VALUE ? newLocationName : null,
        newLocationCity:
          locationChoice === NEW_LOCATION_VALUE ? newLocationCity : null,
        newLocationAddress:
          locationChoice === NEW_LOCATION_VALUE ? newLocationAddress : null,
        repeatLessons: repeatLessons.map((repeatLesson) => ({
          date: repeatLesson.date,
          time: repeatLesson.time,
        })),
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden border-white/10 bg-[radial-gradient(circle_at_12%_0%,rgba(37,99,235,0.18),transparent_36%),linear-gradient(145deg,rgba(9,20,35,0.98),rgba(3,9,19,0.99))] p-0 text-white shadow-[0_28px_120px_-52px_rgba(0,0,0,0.95)] xl:max-w-[76rem]">
        <div className="shrink-0 px-5 py-3">
          <DialogHeader className="gap-0 pr-10">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/15 text-blue-300 shadow-[0_18px_42px_-28px_rgba(59,130,246,0.85)]">
                <CalendarCheck2 className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                  Les beheren
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-5 text-slate-300">
                  Bekijk de leerling, verzet de les, wissel van leerling of annuleer dit moment.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="grid min-h-0 flex-1 items-start gap-3 overflow-y-auto overscroll-contain px-4 py-3 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <section className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_55px_-44px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-blue-300" />
              <h3 className="text-base font-semibold text-white">
                Lesinformatie
              </h3>
            </div>

            <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/24 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/45 text-blue-100 ring-1 ring-blue-300/20">
                    <Car className="size-5" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-white">
                      {title || lesson?.titel || "Les"}
                    </p>
                    <p className="text-xs font-medium text-slate-200">
                      {dateLabel}
                    </p>
                    <Badge className="mt-1.5 border border-blue-300/20 bg-blue-400/12 px-2 py-0 text-[11px] text-blue-100">
                      {getStatusLabel(status)}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-slate-950/30 px-3 py-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200">
                    <Clock3 className="size-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {time || "--:--"}
                      {endTimeLabel ? ` - ${endTimeLabel}` : ""}
                    </p>
                    <p className="text-xs text-slate-400">
                      {duration || 0} minuten
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <Label className="text-sm font-semibold text-white">
                Leerling zoeken en wijzigen
              </Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Zoek op naam, e-mail, telefoon of pakket..."
                  className="h-9 rounded-lg border-white/10 bg-white/5 pl-8 text-sm text-white placeholder:text-slate-500"
                />
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white">
                    <SelectValue placeholder="Kies een leerling" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.naam}
                        {student.email ? ` - ${student.email}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg border-white/10 bg-white/5 text-xs text-blue-200 hover:bg-white/10 hover:text-white"
                >
                  <Link href="/instructeur/leerlingen" prefetch>
                    <UserRoundPlus className="size-3.5" />
                    Nieuwe leerling
                  </Link>
                </Button>
              </div>
              {!filteredStudents.length ? (
                <p className="text-xs text-amber-200">
                  Geen bestaande leerling gevonden. Voeg de leerling eerst toe via Leerlingen.
                </p>
              ) : null}
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <div className="mb-3 flex items-center gap-2">
                <Car className="size-4 text-blue-300" />
                <h4 className="text-sm font-semibold text-white">Lesgegevens</h4>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Lestitel</Label>
                <div className="relative">
                  <Car className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-blue-300" />
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="h-9 rounded-lg border-white/10 bg-white/5 pl-8 text-sm text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as EditableLessonStatus)}
                >
                  <SelectTrigger className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geaccepteerd">Geaccepteerd</SelectItem>
                    <SelectItem value="ingepland">Ingepland</SelectItem>
                    <SelectItem value="afgerond">Afgerond</SelectItem>
                    <SelectItem value="geannuleerd">Geannuleerd</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Datum</Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-300" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(event) => handleDateChange(event.target.value)}
                    className="h-9 rounded-lg border-white/10 bg-white/5 pl-8 text-sm text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Starttijd</Label>
                <div className="relative">
                  <Clock3 className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-300" />
                  <Input
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    className="h-9 rounded-lg border-white/10 bg-white/5 pl-8 text-sm text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Duur</Label>
                <Select value={duration} onValueChange={handleDurationChange}>
                  <SelectTrigger className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 45, 60, 75, 90, 120, 150, 180].map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option} minuten
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Vrije tijden op deze dag</Label>
                <div className="grid grid-cols-[minmax(0,1fr)_3.75rem] overflow-hidden rounded-lg border border-white/10 bg-white/5">
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger className="h-9 rounded-none border-0 bg-transparent text-sm text-white">
                      <SelectValue placeholder="Kies vrij moment" />
                    </SelectTrigger>
                    <SelectContent>
                      {startTimeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="flex items-center justify-center border-l border-emerald-400/20 bg-emerald-500/12 text-[11px] font-semibold text-emerald-100">
                    Vrij
                  </span>
                </div>
                {!startTimeOptions.length ? (
                  <p className="text-xs text-slate-400">
                    Geen vrij passend slot gevonden. Handmatig tijd kiezen kan nog steeds.
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">
                  Herhalingsles{" "}
                  <span className="font-normal text-slate-400">(optioneel)</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRepeatLesson}
                  disabled={
                    !date ||
                    status === "geannuleerd" ||
                    repeatAmount >= MAX_REPEAT_LESSONS
                  }
                  className="h-9 rounded-lg border-blue-400/25 bg-blue-500/10 px-3 text-sm text-blue-100 hover:bg-blue-500/20 hover:text-white"
                >
                  <CalendarDays className="size-3.5" />
                  Volgende les
                </Button>
                <p className="text-[11px] leading-4 text-slate-400">
                  Klik nog een keer om nog een volgende les toe te voegen.
                </p>
              </div>

              {repeatAmount > 0 ? (
                <div className="space-y-2 md:col-span-2 xl:col-span-3">
                  {repeatLessons.map((repeatLesson, index) => {
                    const repeatTimeOptions = getRepeatTimeOptions(
                      repeatLesson.date,
                    );
                    const repeatEndTimeLabel =
                      repeatLesson.time && Number.isFinite(durationMinutes)
                        ? addMinutesToTimeValue(
                            repeatLesson.time,
                            durationMinutes,
                          )
                        : null;
                    const selectedRepeatTimeOption = repeatTimeOptions.find(
                      (option) => option.value === repeatLesson.time,
                    );
                    const repeatSelectOptions = selectedRepeatTimeOption
                      ? repeatTimeOptions
                      : repeatLesson.time
                        ? [
                            {
                              value: repeatLesson.time,
                              label: `${repeatLesson.time}${repeatEndTimeLabel ? ` - ${repeatEndTimeLabel}` : ""}`,
                            },
                            ...repeatTimeOptions,
                          ]
                        : repeatTimeOptions;

                    return (
                      <div
                        key={repeatLesson.id}
                        className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-3"
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="border border-blue-300/25 bg-blue-400/12 px-2 py-0.5 text-[11px] text-blue-100">
                              Volgende les {index + 1}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {formatDateValueLabel(repeatLesson.date)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeRepeatLesson(repeatLesson.id)}
                            className="h-7 rounded-lg px-2 text-xs text-rose-100 hover:bg-rose-500/10 hover:text-rose-50"
                          >
                            <Trash2 className="size-3.5" />
                            Verwijderen
                          </Button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Herhaal op dag</Label>
                            <Select
                              value={repeatLesson.weekday}
                              onValueChange={(value) =>
                                handleRepeatWeekdayChange(
                                  repeatLesson.id,
                                  value as RepeatWeekdayOption,
                                )
                              }
                            >
                              <SelectTrigger className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {repeatWeekdayOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">
                              Eerste herhalingsdatum
                            </Label>
                            <div className="relative">
                              <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-300" />
                              <Input
                                type="date"
                                min={getRepeatMinimumDate(index)}
                                value={repeatLesson.date}
                                onChange={(event) =>
                                  handleRepeatStartDateChange(
                                    repeatLesson.id,
                                    event.target.value,
                                  )
                                }
                                className="h-9 rounded-lg border-white/10 bg-white/5 pl-8 text-sm text-white"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Tijd en duur</Label>
                            <div className="grid grid-cols-[minmax(0,1fr)_3.75rem] overflow-hidden rounded-lg border border-white/10 bg-white/5">
                              <Select
                                value={repeatLesson.time}
                                onValueChange={(value) =>
                                  handleRepeatTimeChange(
                                    repeatLesson.id,
                                    value,
                                  )
                                }
                                disabled={!repeatTimeOptions.length}
                              >
                                <SelectTrigger className="h-9 rounded-none border-0 bg-transparent text-sm text-white">
                                  <SelectValue placeholder="Kies vrije tijd" />
                                </SelectTrigger>
                                <SelectContent>
                                  {repeatSelectOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label} - {duration || 0} min
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span
                                className={cn(
                                  "flex items-center justify-center border-l text-[11px] font-semibold",
                                  selectedRepeatTimeOption
                                    ? "border-emerald-400/20 bg-emerald-500/12 text-emerald-100"
                                    : "border-amber-400/20 bg-amber-500/12 text-amber-100",
                                )}
                              >
                                {selectedRepeatTimeOption ? "Vrij" : "Bezet"}
                              </span>
                            </div>
                            {!repeatTimeOptions.length ? (
                              <p className="text-xs text-slate-400">
                                Geen vrij passend slot op deze datum.
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <div className="space-y-1">
                <Label className="text-xs">Locatie</Label>
                <Select value={locationChoice} onValueChange={setLocationChoice}>
                  <SelectTrigger className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white">
                    <SelectValue placeholder="Kies locatie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LATER_LOCATION_VALUE}>
                      Locatie later bepalen
                    </SelectItem>
                    {locationOptions.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.label}
                      </SelectItem>
                    ))}
                    <SelectItem value={NEW_LOCATION_VALUE}>
                      Nieuwe locatie toevoegen
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {locationChoice === NEW_LOCATION_VALUE ? (
                <div className="grid gap-3 md:col-span-2 md:grid-cols-2 xl:col-span-3 xl:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Locatienaam</Label>
                    <Input
                      value={newLocationName}
                      onChange={(event) => setNewLocationName(event.target.value)}
                      className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Stad</Label>
                    <Input
                      value={newLocationCity}
                      onChange={(event) => setNewLocationCity(event.target.value)}
                      className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Adres of toelichting</Label>
                    <Input
                      value={newLocationAddress}
                      onChange={(event) => setNewLocationAddress(event.target.value)}
                      className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white"
                    />
                  </div>
                </div>
              ) : null}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <Label className="text-sm font-semibold text-white">Snel aanpassen</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg border-white/10 bg-white/5 px-3 text-xs text-white hover:bg-white/10"
                  onClick={() => shiftDate(-1)}
                >
                  <ChevronLeft className="size-3.5" />
                  Dag eerder
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg border-white/10 bg-white/5 px-3 text-xs text-white hover:bg-white/10"
                  onClick={() => shiftDate(1)}
                >
                  <ChevronRight className="size-3.5" />
                  Dag later
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg border-white/10 bg-white/5 px-3 text-xs text-white hover:bg-white/10"
                  onClick={() => shiftDate(7)}
                >
                  <CalendarDays className="size-3.5" />
                  Volgende week
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg border-red-400/40 bg-red-500/10 px-3 text-xs text-red-200 hover:bg-red-500/18 hover:text-red-100"
                  onClick={() => {
                    setStatus("geannuleerd");
                    setReason((current) => current || "Leerling of instructeur is verhinderd.");
                  }}
                >
                  <Trash2 className="size-3.5" />
                  Annuleren klaarzetten
                </Button>
              </div>
            </div>

            {status === "geannuleerd" ? (
              <div className="mt-3 space-y-1">
                <Label className="text-xs">Reden annuleren</Label>
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Bijvoorbeeld: leerling is verhinderd of dit moment past niet meer."
                  className="min-h-16 rounded-lg border-white/10 bg-white/5 text-xs text-white"
                />
              </div>
            ) : null}
          </section>

          <aside className="space-y-1.5">
            <section className="rounded-lg border border-white/10 bg-white/[0.045] p-2.5">
              <h3 className="text-[13px] font-semibold text-white">Leerling</h3>
              <div className="mt-1.5 flex items-start gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/18 text-emerald-100 ring-1 ring-emerald-300/20">
                  <UserRound className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white">
                    {selectedStudent?.naam ?? lesson?.leerling_naam ?? "Leerling"}
                  </p>
                  <p className="truncate text-[11px] text-slate-300">
                    {selectedStudent?.email ?? lesson?.leerling_email ?? "Geen e-mail"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {selectedStudent?.telefoon || "Geen telefoonnummer"}
                  </p>
                </div>
              </div>

              <div className="mt-1.5 overflow-hidden rounded-lg border border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 px-2.5 py-1 text-[11px]">
                  <span className="text-slate-400">Pakket</span>
                  <span className="font-semibold text-white">
                    {selectedStudent?.pakket ?? "Nog geen pakket"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 px-2.5 py-1 text-[11px]">
                  <span className="text-slate-400">Voortgang</span>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                      <span
                        className="block h-full rounded-full bg-emerald-400"
                        style={{ width: `${progressValue}%` }}
                      />
                    </span>
                    <span className="font-semibold text-white">
                      {selectedStudent ? `${selectedStudent.voortgang}%` : "-"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 px-2.5 py-1 text-[11px]">
                  <span className="text-slate-400">Lessen voltooid</span>
                  <span className="font-semibold text-white">
                    {selectedStudent?.voltooideLessen ?? selectedStudent?.gekoppeldeLessen ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 text-[11px]">
                  <span className="text-slate-400">Lessen gepland</span>
                  <span className="font-semibold text-white">
                    {Math.max(
                      (selectedStudent?.gekoppeldeLessen ?? 0) -
                        (selectedStudent?.voltooideLessen ?? 0),
                      0,
                    )}
                  </span>
                </div>
              </div>
              <Button
                asChild
                type="button"
                variant="outline"
                className="mt-1.5 h-7 w-full rounded-lg border-white/10 bg-white/5 text-[11px] text-slate-100 hover:bg-white/10 hover:text-white"
              >
                <a
                  href={
                    selectedStudent
                      ? `/instructeur/leerlingen?student=${encodeURIComponent(selectedStudent.id)}`
                      : "/instructeur/leerlingen"
                  }
                >
                  <UserRound className="size-3.5" />
                  Leerlingdetails bekijken
                </a>
              </Button>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.045] p-2.5">
              <div className="flex items-start gap-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/16 text-blue-200 ring-1 ring-blue-300/20">
                  <MapPin className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold text-white">
                    Adres en locatie
                  </h3>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-200">
                    {locationLabel}
                  </p>
                  <p className="text-[11px] leading-4 text-slate-400">
                    {selectedLocation?.adres ?? "Locatie wordt later bepaald"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-amber-400/22 bg-amber-500/10 p-2.5 text-[11px] leading-4 text-amber-50">
              <div className="flex gap-2.5">
                <Clock3 className="mt-0.5 size-3.5 shrink-0 text-amber-300" />
                <div>
                  <h3 className="font-semibold text-amber-200">
                    Automatische controle
                  </h3>
                  <p className="mt-1">
                    Controleert automatisch of dit moment botst met een andere les.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.045] p-2.5 text-[11px] leading-4 text-slate-300">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="size-3.5 text-blue-300" />
                <h3 className="text-[13px] font-semibold text-white">
                  Samenvatting
                </h3>
              </div>
              <dl className="mt-1.5 grid gap-0.5">
                {[
                  ["Les", `${title || "Les"} (${duration || 0} min)`],
                  ["Leerling", selectedStudent?.naam ?? lesson?.leerling_naam ?? "Leerling"],
                  ["Datum", dateLabel],
                  ["Tijd", time && endTimeLabel ? `${time} - ${endTimeLabel}` : "-"],
                  ["Locatie", locationLabel],
                  [
                    "Herhaling",
                    repeatAmount > 0
                      ? `${repeatAmount} volgende les${repeatAmount === 1 ? "" : "sen"}: ${repeatSummary}`
                      : "Geen",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[4.4rem_1fr] gap-1.5">
                    <dt className="text-slate-400">{label}</dt>
                    <dd className="font-medium text-slate-100">{value}</dd>
                  </div>
                ))}
              </dl>
              {hasChanges ? (
                <Badge className="mt-2 w-full justify-center border border-blue-400/20 bg-blue-500/10 py-1 text-[10px] text-blue-100">
                  <CheckCircle2 className="size-3.5" />
                  Wijzigingen klaar om op te slaan
                </Badge>
              ) : null}
            </section>
          </aside>
        </div>

        <DialogFooter className="mx-0 mb-0 gap-1.5 border-t border-white/10 bg-slate-950/30 px-3 py-2 sm:justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setStatus("geannuleerd");
              handleSubmit("geannuleerd");
            }}
            disabled={isPending || !reason.trim()}
            className={cn(status !== "geannuleerd" && "hidden")}
          >
            Les annuleren
          </Button>
          <div className="flex flex-wrap gap-1.5 sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-7 rounded-lg border-white/10 bg-white/5 px-3 text-[11px] text-white hover:bg-white/10 hover:text-white"
            >
              Sluiten
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(status)}
              disabled={
                isPending ||
                !lesson ||
                !studentId ||
                !date ||
                !time ||
                !title.trim() ||
                hasInvalidRepeatLessons ||
                (status === "geannuleerd" && !reason.trim()) ||
                (status === "geannuleerd" && repeatAmount > 0) ||
                (locationChoice === NEW_LOCATION_VALUE &&
                  (!newLocationName.trim() || !newLocationCity.trim()))
              }
              className="h-7 rounded-lg bg-blue-600 px-3 text-[11px] text-white hover:bg-blue-500"
            >
              <Save className="size-3.5" />
              {isPending
                ? "Opslaan..."
                : status === "geannuleerd"
                  ? "Annulering opslaan"
                  : repeatAmount > 0
                    ? "Wijzigingen + volgende lessen opslaan"
                  : "Wijzigingen opslaan"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
