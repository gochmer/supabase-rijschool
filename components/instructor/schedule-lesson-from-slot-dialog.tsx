"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Clock3 } from "lucide-react";
import { toast } from "sonner";

import { createInstructorLessonForLearnerAction } from "@/lib/actions/instructor-learners";
import { addMinutesToTimeValue } from "@/lib/booking-availability";
import {
  DEFAULT_LESSON_DURATION_MINUTES,
  getLessonDurationKindLabel,
  type InstructorLessonDurationDefaults,
  type LessonDurationKind,
} from "@/lib/lesson-durations";
import type {
  BeschikbaarheidSlot,
  InstructorStudentProgressRow,
  LocationOption,
} from "@/lib/types";
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

const LOCATION_LATER_VALUE = "__later__";
const lessonKindOptions: LessonDurationKind[] = [
  "rijles",
  "proefles",
  "pakketles",
  "examenrit",
];

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

const dateLabelFormatter = new Intl.DateTimeFormat("nl-NL", {
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

function getSlotStartTimeValue(slot: BeschikbaarheidSlot | null | undefined) {
  const parts = getDateTimeParts(slot?.start_at);

  return parts ? formatMinutesAsTime(parts.minutesOfDay) : "09:00";
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

function buildStartTimeOptions({
  slot,
  busyWindows,
  durationMinutes,
}: {
  slot: BeschikbaarheidSlot | null;
  busyWindows: BusyWindow[];
  durationMinutes: number;
}) {
  const startParts = getDateTimeParts(slot?.start_at);
  const endParts = getDateTimeParts(slot?.eind_at);

  if (
    !slot?.beschikbaar ||
    !startParts ||
    !endParts ||
    startParts.dateValue !== endParts.dateValue ||
    endParts.minutesOfDay <= startParts.minutesOfDay ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes < 30
  ) {
    return [];
  }

  const dayBusyWindows = busyWindows
    .map((window) => {
      const busyStart = getDateTimeParts(window.start_at);
      const busyEnd = getDateTimeParts(window.end_at);

      if (
        !busyStart ||
        !busyEnd ||
        busyStart.dateValue !== startParts.dateValue ||
        busyEnd.dateValue !== startParts.dateValue ||
        busyEnd.minutesOfDay <= busyStart.minutesOfDay
      ) {
        return null;
      }

      return {
        startMinutes: busyStart.minutesOfDay,
        endMinutes: busyEnd.minutesOfDay,
      };
    })
    .filter((window): window is TimeSegment => Boolean(window))
    .sort((left, right) => left.startMinutes - right.startMinutes);

  return subtractBusyWindows(
    {
      startMinutes: startParts.minutesOfDay,
      endMinutes: endParts.minutesOfDay,
    },
    dayBusyWindows,
  ).flatMap((segment) => {
    const options: Array<{ value: string; label: string }> = [];

    for (
      let cursor = segment.startMinutes;
      cursor + durationMinutes <= segment.endMinutes;
      cursor += 15
    ) {
      const start = formatMinutesAsTime(cursor);
      const end = formatMinutesAsTime(cursor + durationMinutes);

      options.push({
        value: start,
        label: `${start} - ${end}`,
      });
    }

    return options;
  });
}

function getSlotDateValue(slot: BeschikbaarheidSlot | null) {
  return getDateTimeParts(slot?.start_at)?.dateValue ?? "";
}

function getSlotDurationMinutes(slot: BeschikbaarheidSlot | null) {
  if (!slot?.start_at || !slot.eind_at) {
    return null;
  }

  const duration = Math.round(
    (new Date(slot.eind_at).getTime() - new Date(slot.start_at).getTime()) /
      60000,
  );

  return Number.isFinite(duration) ? Math.max(0, duration) : null;
}

export function ScheduleLessonFromSlotDialog({
  open,
  onOpenChange,
  slot,
  students,
  locationOptions = [],
  busyWindows = [],
  durationDefaults = DEFAULT_LESSON_DURATION_MINUTES,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: BeschikbaarheidSlot | null;
  students: InstructorStudentProgressRow[];
  locationOptions?: LocationOption[];
  busyWindows?: BusyWindow[];
  durationDefaults?: InstructorLessonDurationDefaults;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const slotDuration = getSlotDurationMinutes(slot);
  const defaultDuration = Math.max(
    30,
    Math.min(durationDefaults.rijles, slotDuration ?? durationDefaults.rijles),
  );
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [lessonKind, setLessonKind] = useState<LessonDurationKind>("rijles");
  const [title, setTitle] = useState("Rijles");
  const [duration, setDuration] = useState(String(defaultDuration));
  const [time, setTime] = useState(() => getSlotStartTimeValue(slot));
  const [locationChoice, setLocationChoice] = useState(LOCATION_LATER_VALUE);
  const dateValue = getSlotDateValue(slot);
  const durationMinutes = Number.parseInt(duration, 10);
  const startTimeOptions = useMemo(
    () =>
      buildStartTimeOptions({
        slot,
        busyWindows,
        durationMinutes,
      }),
    [busyWindows, durationMinutes, slot],
  );
  const selectedStudentId = students.some((student) => student.id === studentId)
    ? studentId
    : students[0]?.id ?? "";
  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId,
  );
  const isTrialLessonSelected =
    lessonKind === "proefles" || title.toLowerCase().includes("proefles");
  const trialLessonBlocked =
    isTrialLessonSelected && selectedStudent?.trialLessonAvailable === false;
  const trialLessonBlockMessage =
    selectedStudent?.trialLessonMessage ??
    "Deze leerling heeft al een proefles gepland of afgerond.";
  const fallbackTime = getSlotStartTimeValue(slot);
  const selectedTime = startTimeOptions.length
    ? startTimeOptions.some((option) => option.value === time)
      ? time
      : startTimeOptions[0].value
    : time || fallbackTime;
  const dateLabel = dateValue
    ? dateLabelFormatter.format(new Date(`${dateValue}T12:00:00`))
    : "Geen datum gekozen";
  const endTimeLabel =
    dateValue && selectedTime && Number.isFinite(durationMinutes)
      ? addMinutesToTimeValue(selectedTime, durationMinutes)
      : null;

  function handleLessonKindChange(nextKind: LessonDurationKind) {
    setLessonKind(nextKind);
    setTitle(getLessonDurationKindLabel(nextKind));
    setDuration(String(durationDefaults[nextKind]));
  }

  function handleSubmit() {
    if (!slot?.beschikbaar || !dateValue || !selectedStudentId || !selectedTime) {
      toast.error("Kies eerst een vrij slot, leerling en starttijd.");
      return;
    }

    if (trialLessonBlocked) {
      toast.error(trialLessonBlockMessage);
      return;
    }

    startTransition(async () => {
      const result = await createInstructorLessonForLearnerAction({
        leerlingId: selectedStudentId,
        title,
        datum: dateValue,
        tijd: selectedTime,
        duurMinuten: Number(duration),
        locationId:
          locationChoice !== LOCATION_LATER_VALUE ? locationChoice : null,
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
      <DialogContent className="sm:max-w-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Leerling inplannen op vrij slot</DialogTitle>
          <DialogDescription>
            Kies een leerling en zet dit vrije moment direct als les in de agenda.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-50">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 size-5 shrink-0 text-emerald-300" />
            <div>
              <p className="font-semibold">{dateLabel}</p>
              <p className="mt-1 text-emerald-100/80">
                Vrij slot:{" "}
                {slot?.start_at ? formatMinutesAsTime(getDateTimeParts(slot.start_at)?.minutesOfDay ?? 0) : "--:--"}{" "}
                -{" "}
                {slot?.eind_at ? formatMinutesAsTime(getDateTimeParts(slot.eind_at)?.minutesOfDay ?? 0) : "--:--"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Leerling</Label>
            {students.length ? (
              <Select value={selectedStudentId} onValueChange={setStudentId}>
                <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
                  <SelectValue placeholder="Kies een leerling" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.naam}
                      {student.email ? ` - ${student.email}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-3 text-sm text-amber-100">
                Je hebt nog geen gekoppelde leerlingen om in te plannen.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Lestype</Label>
            <Select value={lessonKind} onValueChange={(value) => handleLessonKindChange(value as LessonDurationKind)}>
              <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lessonKindOptions.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    disabled={
                      option === "proefles" &&
                      selectedStudent?.trialLessonAvailable === false
                    }
                  >
                    {getLessonDurationKindLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Starttijd</Label>
            {startTimeOptions.length ? (
              <Select value={selectedTime} onValueChange={setTime}>
                <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
                  <SelectValue placeholder="Kies een starttijd" />
                </SelectTrigger>
                <SelectContent>
                  {startTimeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="time"
                value={selectedTime}
                onChange={(event) => setTime(event.target.value)}
                className="dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Lestitel</Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Duur in minuten</Label>
            <Input
              type="number"
              min={30}
              max={240}
              step={15}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Locatie</Label>
            <Select value={locationChoice} onValueChange={setLocationChoice}>
              <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
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
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-slate-300">
          <strong className="text-white">Samenvatting:</strong>{" "}
          {title || "Rijles"} voor {selectedStudent?.naam ?? "leerling"} op{" "}
          {dateLabel}
          {selectedTime ? ` om ${selectedTime}` : ""}
          {endTimeLabel ? ` tot ${endTimeLabel}` : ""}.
          {trialLessonBlocked ? (
            <span className="mt-2 block rounded-lg border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-amber-100">
              {trialLessonBlockMessage}
            </span>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isPending ||
              !slot?.beschikbaar ||
              !students.length ||
              !selectedStudentId ||
              !dateValue ||
              !selectedTime ||
              !title.trim() ||
              trialLessonBlocked
            }
          >
            <CalendarPlus className="size-4" />
            {isPending ? "Inplannen..." : "Les inplannen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
