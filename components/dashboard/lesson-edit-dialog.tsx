"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateLessonAction } from "@/lib/actions/lesson-management";
import type { Les } from "@/lib/types";
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

function getInitialDate(lesson: Les) {
  return lesson.start_at?.slice(0, 10) ?? "";
}

function getInitialTime(lesson: Les) {
  return lesson.start_at?.slice(11, 16) ?? "12:00";
}

export function LessonEditDialog({ lesson }: { lesson: Les }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(getInitialDate(lesson));
  const [time, setTime] = useState(getInitialTime(lesson));
  const [duration, setDuration] = useState(String(lesson.duur_minuten ?? 60));
  const [status, setStatus] = useState<"ingepland" | "afgerond" | "geannuleerd">(
    lesson.status === "afgerond" || lesson.status === "geannuleerd" ? lesson.status : "ingepland"
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateLessonAction({
        lessonId: lesson.id,
        datum: date,
        tijd: time,
        duurMinuten: Number(duration),
        status,
      });

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-full">
          Les bewerken
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Les bewerken</DialogTitle>
          <DialogDescription>
            Pas datum, tijd, duur of status aan. De leerling krijgt automatisch een notificatie.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`lesson-date-${lesson.id}`}>Datum</Label>
            <Input
              id={`lesson-date-${lesson.id}`}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`lesson-time-${lesson.id}`}>Starttijd</Label>
            <Input
              id={`lesson-time-${lesson.id}`}
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`lesson-duration-${lesson.id}`}>Duur in minuten</Label>
            <Input
              id={`lesson-duration-${lesson.id}`}
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
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
              <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ingepland">Ingepland</SelectItem>
                <SelectItem value="afgerond">Afgerond</SelectItem>
                <SelectItem value="geannuleerd">Geannuleerd</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/90 p-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <strong className="text-slate-950 dark:text-white">{lesson.titel}</strong> met {lesson.leerling_naam || "leerling"}.
          {lesson.locatie ? ` Locatie: ${lesson.locatie}.` : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending || !date || !time}>
            {isPending ? "Opslaan..." : "Wijzigingen opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
