"use client";

import { useId, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { createInstructorLessonForLearnerAction } from "@/lib/actions/instructor-learners";
import { addMinutesToTimeValue } from "@/lib/booking-availability";
import {
  DEFAULT_LESSON_DURATION_MINUTES,
  getLessonDurationKindLabel,
  type InstructorLessonDurationDefaults,
  type LessonDurationKind,
} from "@/lib/lesson-durations";
import type { InstructorStudentProgressRow, LocationOption } from "@/lib/types";
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

function getTodayDate() {
  const current = new Date();
  const local = new Date(
    current.getTime() - current.getTimezoneOffset() * 60_000,
  );
  return local.toISOString().slice(0, 10);
}

function getDefaultTitle(kind: LessonDurationKind) {
  return getLessonDurationKindLabel(kind);
}

export function LessonCreateDialog({
  students,
  locationOptions = [],
  durationDefaults = DEFAULT_LESSON_DURATION_MINUTES,
  className,
}: {
  students: InstructorStudentProgressRow[];
  locationOptions?: LocationOption[];
  durationDefaults?: InstructorLessonDurationDefaults;
  className?: string;
}) {
  const router = useRouter();
  const firstStudent = students[0] ?? null;
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState(firstStudent?.id ?? "");
  const [lessonKind, setLessonKind] = useState<LessonDurationKind>("rijles");
  const [title, setTitle] = useState(getDefaultTitle("rijles"));
  const [date, setDate] = useState(getTodayDate());
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(String(durationDefaults.rijles));
  const [locationChoice, setLocationChoice] = useState(LOCATION_LATER_VALUE);
  const [isPending, startTransition] = useTransition();

  const studentIdField = useId();
  const lessonKindField = useId();
  const titleField = useId();
  const dateField = useId();
  const timeField = useId();
  const durationField = useId();

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === studentId) ?? null,
    [studentId, students],
  );

  const locationLabel = useMemo(() => {
    if (locationChoice === LOCATION_LATER_VALUE) {
      return "Locatie later bepalen";
    }

    return (
      locationOptions.find((location) => location.id === locationChoice)
        ?.label ?? "Locatie later bepalen"
    );
  }, [locationChoice, locationOptions]);

  const endTimeLabel = useMemo(() => {
    const durationMinutes = Number.parseInt(duration, 10);

    if (!date || !time || !Number.isFinite(durationMinutes)) {
      return null;
    }

    return addMinutesToTimeValue(time, durationMinutes);
  }, [date, duration, time]);

  function reset() {
    setStudentId(firstStudent?.id ?? "");
    setLessonKind("rijles");
    setTitle(getDefaultTitle("rijles"));
    setDate(getTodayDate());
    setTime("09:00");
    setDuration(String(durationDefaults.rijles));
    setLocationChoice(LOCATION_LATER_VALUE);
  }

  function handleLessonKindChange(nextKind: LessonDurationKind) {
    setLessonKind(nextKind);
    setTitle(getDefaultTitle(nextKind));
    setDuration(String(durationDefaults[nextKind]));
  }

  function handleSubmit() {
    if (!selectedStudent) {
      toast.error("Kies eerst een leerling.");
      return;
    }

    startTransition(async () => {
      const result = await createInstructorLessonForLearnerAction({
        leerlingId: selectedStudent.id,
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
        if (!nextOpen) {
          reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          className={cn(
            "h-12 rounded-lg bg-blue-600 px-5 text-base text-white shadow-[0_18px_50px_-28px_rgba(37,99,235,0.9)] hover:bg-blue-500",
            className,
          )}
        >
          <CalendarPlus2 className="size-5" />
          Nieuwe les
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Nieuwe les inplannen</DialogTitle>
          <DialogDescription>
            Maak direct een lesmoment aan voor een gekoppelde leerling. De les
            verschijnt daarna in deze lijst en in het leerlingdashboard.
          </DialogDescription>
        </DialogHeader>

        {students.length ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={studentIdField}>Leerling</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger
                    id={studentIdField}
                    className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    <SelectValue placeholder="Kies een leerling" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.naam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={lessonKindField}>Type</Label>
                <Select
                  value={lessonKind}
                  onValueChange={(value) =>
                    handleLessonKindChange(value as LessonDurationKind)
                  }
                >
                  <SelectTrigger
                    id={lessonKindField}
                    className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    <SelectValue placeholder="Kies type" />
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

              <div className="space-y-2">
                <Label htmlFor={durationField}>Duur</Label>
                <Input
                  id={durationField}
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
                <Label htmlFor={titleField}>Les / pakket</Label>
                <Input
                  id={titleField}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                  placeholder="Bijvoorbeeld Rijles 60 minuten"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={dateField}>Datum</Label>
                <Input
                  id={dateField}
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={timeField}>Starttijd</Label>
                <Input
                  id={timeField}
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Locatie</Label>
                <Select
                  value={locationChoice}
                  onValueChange={setLocationChoice}
                >
                  <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
                    <SelectValue placeholder="Kies locatie" />
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

            <div className="rounded-[1.05rem] border border-slate-200/80 bg-slate-50/90 p-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <strong className="text-slate-950 dark:text-white">
                Samenvatting:
              </strong>{" "}
              {title.trim() || "Rijles"} voor{" "}
              {selectedStudent?.naam ?? "leerling"}. Start {time}
              {endTimeLabel ? `, einde ${endTimeLabel}` : ""}. Locatie:{" "}
              {locationLabel}.
            </div>
          </>
        ) : (
          <div className="rounded-[1.05rem] border border-dashed border-slate-200 bg-slate-50/90 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Je hebt nog geen gekoppelde leerlingen om direct een les voor in te
            plannen.
          </div>
        )}

        <DialogFooter>
          {students.length ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuleren
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isPending ||
                  !selectedStudent ||
                  !date ||
                  !time ||
                  !title.trim()
                }
              >
                {isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <CalendarPlus2 className="size-4" />
                )}
                {isPending ? "Inplannen..." : "Les inplannen"}
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link href="/instructeur/leerlingen">Leerling koppelen</Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
