"use client";

import { useId, useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpenCheck,
  CalendarDays,
  CalendarPlus2,
  CheckCircle2,
  Clock3,
  Gauge,
  LoaderCircle,
  MapPin,
  Timer,
  UserRound,
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

const fieldClassName =
  "h-10 w-full min-w-0 rounded-lg border-white/10 bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-slate-500 focus-visible:border-sky-300/45 focus-visible:ring-sky-300/18 2xl:h-11";

const compactDateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Amsterdam",
  weekday: "short",
  year: "numeric",
});

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

function getDateLabel(dateValue: string) {
  if (!dateValue) {
    return "Geen datum";
  }

  const date = new Date(`${dateValue}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? dateValue
    : compactDateFormatter.format(date);
}

function DialogField({
  children,
  icon: Icon,
  label,
}: {
  children: ReactNode;
  icon: typeof UserRound;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-xs font-semibold tracking-[0.02em] text-slate-200">
        <Icon className="size-3.5 text-sky-300" />
        {label}
      </Label>
      {children}
    </div>
  );
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
  const completedLessonCount = selectedStudent?.voltooideLessen ?? 0;
  const linkedLessonCount = selectedStudent?.gekoppeldeLessen ?? 0;
  const progressValue = Math.min(
    Math.max(selectedStudent?.voortgang ?? 0, 0),
    100,
  );
  const remainingLessonCount = Math.max(
    linkedLessonCount - completedLessonCount,
    0,
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
      <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-[80rem] gap-0 overflow-x-hidden overflow-y-auto p-0 [-ms-overflow-style:none] [scrollbar-width:none] sm:max-w-[80rem] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.96),rgba(2,6,23,0.98))] dark:text-white [&::-webkit-scrollbar]:hidden">
        <DialogHeader className="border-b border-white/10 px-4 py-4 sm:px-5 2xl:px-6 2xl:py-5">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-400/12 text-sky-100">
              <CalendarPlus2 className="size-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-semibold text-white">
                Nieuwe les inplannen
              </DialogTitle>
              <DialogDescription className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                Plan direct een lesmoment voor een gekoppelde leerling.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {students.length ? (
          <div className="grid min-w-0 gap-4 px-4 py-4 sm:px-5 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:gap-5 2xl:px-6 2xl:py-5">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 2xl:gap-4">
              <div className="sm:col-span-2">
                <DialogField icon={UserRound} label="Leerling">
                  <Select value={studentId} onValueChange={setStudentId}>
                    <SelectTrigger id={studentIdField} className={fieldClassName}>
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
                </DialogField>
                {selectedStudent ? (
                  <div className="mt-3 grid gap-2 rounded-lg border border-white/10 bg-slate-950/24 p-3 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        icon: CheckCircle2,
                        label: "Voltooid",
                        value: `${completedLessonCount}`,
                      },
                      {
                        icon: BookOpenCheck,
                        label: "Totaal lessen",
                        value: `${linkedLessonCount}`,
                      },
                      {
                        icon: Gauge,
                        label: "Voortgang",
                        value: `${progressValue}%`,
                      },
                      {
                        icon: Timer,
                        label: "Nog open",
                        value: `${remainingLessonCount}`,
                      },
                    ].map((item) => (
                      <div key={item.label} className="min-w-0">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <item.icon className="size-3.5 text-sky-300" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <DialogField icon={BookOpenCheck} label="Type">
                <Select
                  value={lessonKind}
                  onValueChange={(value) =>
                    handleLessonKindChange(value as LessonDurationKind)
                  }
                >
                  <SelectTrigger id={lessonKindField} className={fieldClassName}>
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
              </DialogField>

              <DialogField icon={Timer} label="Duur">
                <Input
                  id={durationField}
                  type="number"
                  min={30}
                  max={240}
                  step={15}
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className={fieldClassName}
                />
              </DialogField>

              <div className="sm:col-span-2">
                <DialogField icon={BookOpenCheck} label="Les / pakket">
                  <Input
                    id={titleField}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className={fieldClassName}
                    placeholder="Bijvoorbeeld Rijles 60 minuten"
                  />
                </DialogField>
              </div>

              <DialogField icon={CalendarDays} label="Datum">
                <Input
                  id={dateField}
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={fieldClassName}
                />
              </DialogField>

              <DialogField icon={Clock3} label="Starttijd">
                <Input
                  id={timeField}
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className={fieldClassName}
                />
              </DialogField>

              <div className="sm:col-span-2">
                <DialogField icon={MapPin} label="Locatie">
                  <Select
                    value={locationChoice}
                    onValueChange={setLocationChoice}
                  >
                    <SelectTrigger className={fieldClassName}>
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
                </DialogField>
              </div>
            </div>

            <aside className="min-w-0 rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_24px_70px_-48px_rgba(0,0,0,0.75)]">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
                Samenvatting
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {title.trim() || "Rijles"}
              </h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                {[
                  {
                    icon: UserRound,
                    label: "Leerling",
                    value: selectedStudent?.naam ?? "Nog kiezen",
                  },
                  {
                    icon: CalendarDays,
                    label: "Datum",
                    value: getDateLabel(date),
                  },
                  {
                    icon: Clock3,
                    label: "Tijd",
                    value: `${time || "--:--"}${endTimeLabel ? ` - ${endTimeLabel}` : ""}`,
                  },
                  {
                    icon: Timer,
                    label: "Duur",
                    value: `${duration || "0"} min`,
                  },
                  {
                    icon: MapPin,
                    label: "Locatie",
                    value: locationLabel,
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-950/35 text-sky-200">
                      <item.icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                        {item.label}
                      </p>
                      <p className="mt-0.5 line-clamp-2 font-medium text-slate-100">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/28 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                    Leerlingstatus
                  </p>
                  <span className="text-xs font-semibold text-sky-100">
                    {progressValue}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-sky-300"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
                    <p className="text-slate-500">Voltooid</p>
                    <p className="mt-1 font-semibold text-white">
                      {completedLessonCount} / {linkedLessonCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
                    <p className="text-slate-500">Pakket</p>
                    <p className="mt-1 line-clamp-1 font-semibold text-white">
                      {selectedStudent?.pakket ?? "Geen pakket"}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="mx-5 my-5 rounded-lg border border-dashed border-white/12 bg-white/[0.055] p-4 text-sm leading-6 text-slate-300 sm:mx-6">
            Je hebt nog geen gekoppelde leerlingen om direct een les voor in te
            plannen.
          </div>
        )}

        <DialogFooter className="mx-0 mb-0 border-t border-white/10 bg-slate-950/28 px-4 py-3 sm:px-5 2xl:px-6 2xl:py-4">
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
