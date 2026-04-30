"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createInstructorLessonForLearnerAction } from "@/lib/actions/instructor-learners";
import { getLessonEndAt } from "@/lib/booking-availability";
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

const LOCATION_LATER_VALUE = "__later__";

const lessonKindOptions: LessonDurationKind[] = [
  "rijles",
  "proefles",
  "pakketles",
  "examenrit",
];

function getTodayDate() {
  const current = new Date();
  const local = new Date(current.getTime() - current.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function getDefaultStartTime() {
  return "09:00";
}

export function CreateManualLessonDialog({
  leerlingId,
  leerlingNaam,
  suggestedTitle,
  locationOptions = [],
  template,
  durationDefaults = DEFAULT_LESSON_DURATION_MINUTES,
}: {
  leerlingId: string;
  leerlingNaam: string;
  suggestedTitle?: string;
  locationOptions?: LocationOption[];
  template?: FirstLessonTemplate | null;
  durationDefaults?: InstructorLessonDurationDefaults;
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

  const endTimeLabel = useMemo(() => {
    const durationMinutes = Number.parseInt(duration, 10);

    if (!date || !time || !Number.isFinite(durationMinutes)) {
      return null;
    }

    const startAt = `${date}T${time}:00`;
    const endAt = getLessonEndAt(startAt, durationMinutes);

    return endAt ? endAt.slice(11, 16) : null;
  }, [date, duration, time]);

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
        <Button className="h-9 rounded-full text-[12px]">
          Les inplannen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Les inplannen voor {leerlingNaam}</DialogTitle>
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
            <Input
              id={dateId}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={timeId}>Starttijd</Label>
            <Input
              id={timeId}
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
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
