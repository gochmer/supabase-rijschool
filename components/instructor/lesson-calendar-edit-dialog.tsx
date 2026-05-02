"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
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

function getLocationChoice(lesson: Les | null, locationOptions: LocationOption[]) {
  if (
    lesson?.locatie_id &&
    locationOptions.some((location) => location.id === lesson.locatie_id)
  ) {
    return lesson.locatie_id;
  }

  return LATER_LOCATION_VALUE;
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
  const dateLabel = date
    ? longDateFormatter.format(new Date(`${date}T12:00:00`))
    : "Geen datum gekozen";
  const endTimeLabel =
    time && Number.isFinite(durationMinutes)
      ? addMinutesToTimeValue(time, durationMinutes)
      : null;
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
      locationChoice !== getLocationChoice(lesson, locationOptions));

  useEffect(() => {
    if (!open || !lesson) {
      return;
    }

    setStudentId(lesson.leerling_id ?? "");
    setStudentSearch("");
    setTitle(lesson.titel || "Rijles");
    setDate(getInitialDate(lesson));
    setTime(getInitialTime(lesson));
    setDuration(String(lesson.duur_minuten ?? 60));
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
  }, [lesson, locationOptions, open]);

  function shiftDate(days: number) {
    setDate((current) => addDaysToDateValue(current, days));
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Les beheren</DialogTitle>
          <DialogDescription>
            Bekijk de leerling, verzet de les, wissel van leerling of annuleer dit moment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-4">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-5 shrink-0 text-blue-300" />
                <div>
                  <p className="font-semibold text-white">{lesson?.titel ?? "Les"}</p>
                  <p className="mt-1 text-sm text-blue-100/80">
                    {dateLabel}
                    {time ? ` om ${time}` : ""}
                    {endTimeLabel ? ` - ${endTimeLabel}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Leerling zoeken en wijzigen</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Typ naam, e-mail, telefoon of pakket..."
                    className="pl-9 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
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
                {!filteredStudents.length ? (
                  <p className="text-xs text-amber-200">
                    Geen bestaande leerling gevonden. Voeg de leerling eerst toe via Leerlingen.
                  </p>
                ) : null}
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
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as EditableLessonStatus)}
                >
                  <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
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

              <div className="space-y-2">
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Starttijd</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
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

              <div className="space-y-2">
                <Label>Vrije tijden op deze dag</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
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
                {!startTimeOptions.length ? (
                  <p className="text-xs text-slate-400">
                    Geen vrij passend slot gevonden. Handmatig tijd kiezen kan nog steeds.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => shiftDate(-1)}
              >
                Dag eerder
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => shiftDate(1)}
              >
                Dag later
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => shiftDate(7)}
              >
                Volgende week
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setStatus("geannuleerd");
                  setReason((current) => current || "Leerling of instructeur is verhinderd.");
                }}
              >
                Annuleren klaarzetten
              </Button>
            </div>

            <div className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-2">
                <Label>Locatie</Label>
                <Select value={locationChoice} onValueChange={setLocationChoice}>
                  <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Locatienaam</Label>
                    <Input
                      value={newLocationName}
                      onChange={(event) => setNewLocationName(event.target.value)}
                      className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stad</Label>
                    <Input
                      value={newLocationCity}
                      onChange={(event) => setNewLocationCity(event.target.value)}
                      className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Adres of toelichting</Label>
                    <Input
                      value={newLocationAddress}
                      onChange={(event) => setNewLocationAddress(event.target.value)}
                      className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {status === "geannuleerd" ? (
              <div className="space-y-2">
                <Label>Reden annuleren</Label>
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Bijvoorbeeld: leerling is verhinderd of dit moment past niet meer."
                  className="min-h-24 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                  <UserRound className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {selectedStudent?.naam ?? lesson?.leerling_naam ?? "Leerling"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {selectedStudent?.email ?? lesson?.leerling_email ?? "Geen e-mail"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {selectedStudent?.telefoon || "Geen telefoonnummer"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="text-slate-400">Pakket</span>
                  <span className="font-semibold text-white">
                    {selectedStudent?.pakket ?? "Onbekend"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="text-slate-400">Voortgang</span>
                  <span className="font-semibold text-white">
                    {selectedStudent ? `${selectedStudent.voortgang}%` : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="text-slate-400">Lessen</span>
                  <span className="font-semibold text-white">
                    {selectedStudent?.gekoppeldeLessen ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10 text-blue-300">
                  <MapPin className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Adres en locatie</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {selectedLocation?.label ??
                      lesson?.locatie ??
                      "Locatie later bepalen"}
                    {selectedLocation?.adres ? ` - ${selectedLocation.adres}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-50">
              <div className="flex gap-3">
                <Clock3 className="mt-1 size-4 shrink-0" />
                <p>
                  Bij verzetten wordt automatisch gecontroleerd of dit moment niet botst
                  met een andere les van jou of van de gekozen leerling.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
              <strong className="text-white">Samenvatting:</strong>{" "}
              {title || "Les"} met{" "}
              {selectedStudent?.naam ?? lesson?.leerling_naam ?? "leerling"} op{" "}
              {dateLabel}
              {time ? ` om ${time}` : ""}
              {endTimeLabel ? ` tot ${endTimeLabel}` : ""}.
              {hasChanges ? (
                <Badge className="mt-3 border border-blue-400/20 bg-blue-500/10 text-blue-100">
                  Wijzigingen klaar om op te slaan
                </Badge>
              ) : null}
            </div>
          </aside>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
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
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
                (status === "geannuleerd" && !reason.trim()) ||
                (locationChoice === NEW_LOCATION_VALUE &&
                  (!newLocationName.trim() || !newLocationCity.trim()))
              }
            >
              <RefreshCw className="size-4" />
              {isPending
                ? "Opslaan..."
                : status === "geannuleerd"
                  ? "Annulering opslaan"
                  : "Wijzigingen opslaan"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
