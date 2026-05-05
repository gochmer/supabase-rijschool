"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateLessonAction } from "@/lib/actions/lesson-management";
import type { Les, LocationOption } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";

const LATER_LOCATION_VALUE = "__later__";
const NEW_LOCATION_VALUE = "__new__";

function getInitialDate(lesson: Les) {
  return lesson.start_at?.slice(0, 10) ?? "";
}

function getInitialTime(lesson: Les) {
  return lesson.start_at?.slice(11, 16) ?? "12:00";
}

function getInitialLocationChoice(
  lesson: Les,
  locationOptions: LocationOption[]
) {
  if (lesson.locatie_id && locationOptions.some((item) => item.id === lesson.locatie_id)) {
    return lesson.locatie_id;
  }

  return LATER_LOCATION_VALUE;
}

export function LessonEditDialog({
  lesson,
  locationOptions = [],
}: {
  lesson: Les;
  locationOptions?: LocationOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(getInitialDate(lesson));
  const [time, setTime] = useState(getInitialTime(lesson));
  const [duration, setDuration] = useState(String(lesson.duur_minuten ?? 60));
  const [status, setStatus] = useState<
    "geaccepteerd" | "ingepland" | "afgerond" | "geannuleerd"
  >(
    lesson.status === "afgerond" ||
      lesson.status === "geannuleerd" ||
      lesson.status === "geaccepteerd"
      ? lesson.status
      : "ingepland"
  );
  const [locationChoice, setLocationChoice] = useState(
    getInitialLocationChoice(lesson, locationOptions)
  );
  const [reason, setReason] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationCity, setNewLocationCity] = useState("");
  const [newLocationAddress, setNewLocationAddress] = useState("");
  const [isPending, startTransition] = useTransition();

  const lessonDateId = useId();
  const lessonTimeId = useId();
  const lessonDurationId = useId();
  const cancelReasonId = useId();
  const locationNameId = useId();
  const locationCityId = useId();
  const locationAddressId = useId();

  const locationSummary = useMemo(() => {
    if (locationChoice === NEW_LOCATION_VALUE) {
      return newLocationName.trim()
        ? `${newLocationName.trim()}${newLocationCity.trim() ? `, ${newLocationCity.trim()}` : ""}`
        : "Nieuwe locatie wordt aangemaakt";
    }

    if (locationChoice === LATER_LOCATION_VALUE) {
      return "Locatie wordt later gekozen";
    }

    return (
      locationOptions.find((item) => item.id === locationChoice)?.label ??
      lesson.locatie ??
      "Nog onbekend"
    );
  }, [
    lesson.locatie,
    locationChoice,
    locationOptions,
    newLocationCity,
    newLocationName,
  ]);

  function resetTransientState() {
    setReason("");
    setNewLocationName("");
    setNewLocationCity("");
    setNewLocationAddress("");
    setLocationChoice(getInitialLocationChoice(lesson, locationOptions));
    setDate(getInitialDate(lesson));
    setTime(getInitialTime(lesson));
    setDuration(String(lesson.duur_minuten ?? 60));
    setStatus(
      lesson.status === "afgerond" ||
        lesson.status === "geannuleerd" ||
        lesson.status === "geaccepteerd"
        ? lesson.status
        : "ingepland"
    );
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateLessonAction({
        lessonId: lesson.id,
        datum: date,
        tijd: time,
        duurMinuten: Number(duration),
        status,
        reason,
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

      if (result.success) {
        const progressHref =
          "progressHref" in result ? result.progressHref : null;

        toast.success(
          progressHref
            ? "Les afgerond. Ik open de voortgangskaart voor feedback."
            : result.message,
        );
        setOpen(false);
        resetTransientState();
        if (progressHref) {
          router.push(progressHref);
          return;
        }

        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetTransientState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-full">
          Les bewerken
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Les bewerken</DialogTitle>
          <DialogDescription>
            Werk datum, tijd, status en locatie bij. Bij annuleren wordt de reden
            ook meteen teruggekoppeld aan de leerling.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={lessonDateId}>Datum</Label>
            <Input
              id={lessonDateId}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={lessonTimeId}>Starttijd</Label>
            <Input
              id={lessonTimeId}
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={lessonDurationId}>Duur in minuten</Label>
            <Input
              id={lessonDurationId}
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
                <SelectItem value="geaccepteerd">Geaccepteerd</SelectItem>
                <SelectItem value="ingepland">Ingepland</SelectItem>
                <SelectItem value="afgerond">Afgerond</SelectItem>
                <SelectItem value="geannuleerd">Geannuleerd</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 rounded-[1.3rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="space-y-2">
            <Label>Locatie</Label>
            <Select value={locationChoice} onValueChange={setLocationChoice}>
              <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
                <SelectValue placeholder="Kies een locatie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LATER_LOCATION_VALUE}>Locatie later bepalen</SelectItem>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={locationNameId}>Locatienaam</Label>
                <Input
                  id={locationNameId}
                  value={newLocationName}
                  onChange={(event) => setNewLocationName(event.target.value)}
                  placeholder="Bijvoorbeeld Station Utrecht"
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={locationCityId}>Stad</Label>
                <Input
                  id={locationCityId}
                  value={newLocationCity}
                  onChange={(event) => setNewLocationCity(event.target.value)}
                  placeholder="Bijvoorbeeld Utrecht"
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={locationAddressId}>Adres of toelichting</Label>
                <Input
                  id={locationAddressId}
                  value={newLocationAddress}
                  onChange={(event) => setNewLocationAddress(event.target.value)}
                  placeholder="Bijvoorbeeld Jaarbeursplein 10"
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>
            </div>
          ) : null}
        </div>

        {status === "geannuleerd" ? (
          <div className="space-y-2">
            <Label htmlFor={cancelReasonId}>Reden van annuleren</Label>
            <Textarea
              id={cancelReasonId}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Bijvoorbeeld: leerling is verhinderd of dit moment past niet meer."
              className="min-h-28 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>
        ) : null}

        <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/90 p-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <strong className="text-slate-950 dark:text-white">{lesson.titel}</strong>{" "}
          met {lesson.leerling_naam || "leerling"}.
          <div className="mt-2 grid gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Huidige status: {lesson.status}</span>
            <span>Nieuwe locatie: {locationSummary}</span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isPending ||
              !date ||
              !time ||
              (status === "geannuleerd" && !reason.trim()) ||
              (locationChoice === NEW_LOCATION_VALUE &&
                (!newLocationName.trim() || !newLocationCity.trim()))
            }
          >
            {isPending ? "Opslaan..." : "Wijzigingen opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
