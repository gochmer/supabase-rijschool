"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateLessonRequestStatusAction } from "@/lib/actions/request-status";
import type { LesStatus, LocationOption } from "@/lib/types";
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

const LATER_VALUE = "__later__";
const NEW_LOCATION_VALUE = "__new__";

export function RequestStatusActions({
  requestId,
  status,
  locationOptions = [],
}: {
  requestId: string;
  status: LesStatus;
  locationOptions?: LocationOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [locationChoice, setLocationChoice] = useState(LATER_VALUE);
  const rejectReasonId = useId();
  const locationNameId = useId();
  const locationCityId = useId();
  const locationAddressId = useId();

  if (status !== "aangevraagd") {
    return <span className="text-xs text-muted-foreground">Geen acties beschikbaar</span>;
  }

  function handleAccept(formData: FormData) {
    startTransition(async () => {
      const selectedValue = String(formData.get("locationChoice") ?? LATER_VALUE);
      const result = await updateLessonRequestStatusAction({
        requestId,
        status: "geaccepteerd",
        locationId:
          selectedValue !== LATER_VALUE && selectedValue !== NEW_LOCATION_VALUE
            ? selectedValue
            : null,
        newLocationName:
          selectedValue === NEW_LOCATION_VALUE
            ? String(formData.get("newLocationName") ?? "")
            : null,
        newLocationCity:
          selectedValue === NEW_LOCATION_VALUE
            ? String(formData.get("newLocationCity") ?? "")
            : null,
        newLocationAddress:
          selectedValue === NEW_LOCATION_VALUE
            ? String(formData.get("newLocationAddress") ?? "")
            : null,
      });

      if (result.success) {
        toast.success(result.message);
        setAcceptOpen(false);
        setLocationChoice(LATER_VALUE);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleReject(formData: FormData) {
    startTransition(async () => {
      const result = await updateLessonRequestStatusAction({
        requestId,
        status: "geweigerd",
        reason: String(formData.get("reason") ?? ""),
      });

      if (result.success) {
        toast.success(result.message);
        setRejectOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="grid gap-2 sm:flex [&>*]:w-full sm:[&>*]:w-auto">
      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogTrigger asChild>
          <Button size="sm">Accepteren</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
          <DialogHeader>
            <DialogTitle>Aanvraag accepteren</DialogTitle>
            <DialogDescription>
              Zet de aanvraag om naar een les en kies meteen een locatie, of laat
              die nog even open voor de volgende stap.
            </DialogDescription>
          </DialogHeader>

          <form action={handleAccept} className="space-y-4">
            <div className="space-y-2">
              <Label>Locatie</Label>
              <input type="hidden" name="locationChoice" value={locationChoice} />
              <Select value={locationChoice} onValueChange={setLocationChoice}>
                <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
                  <SelectValue placeholder="Kies een locatie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LATER_VALUE}>Locatie later bepalen</SelectItem>
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
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor={locationNameId}>Locatienaam</Label>
                  <Input
                    id={locationNameId}
                    name="newLocationName"
                    placeholder="Bijvoorbeeld Station Utrecht"
                    required
                    className="dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={locationCityId}>Stad</Label>
                  <Input
                    id={locationCityId}
                    name="newLocationCity"
                    placeholder="Bijvoorbeeld Utrecht"
                    required
                    className="dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={locationAddressId}>Adres of toelichting</Label>
                  <Input
                    id={locationAddressId}
                    name="newLocationAddress"
                    placeholder="Bijvoorbeeld Jaarbeursplein 10"
                    className="dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                  />
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAcceptOpen(false)}
              >
                Terug
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Accepteren..." : "Aanvraag accepteren"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            Weigeren
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
          <DialogHeader>
            <DialogTitle>Aanvraag weigeren</DialogTitle>
            <DialogDescription>
              Geef een duidelijke reden mee, zodat de leerling begrijpt waarom
              deze aanvraag niet door kan gaan.
            </DialogDescription>
          </DialogHeader>

          <form action={handleReject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={rejectReasonId}>Reden van weigeren</Label>
              <Textarea
                id={rejectReasonId}
                name="reason"
                required
                placeholder="Bijvoorbeeld: dit moment is niet haalbaar of dit pakket past niet bij de beschikbaarheid."
                className="min-h-28 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectOpen(false)}
              >
                Terug
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Weigeren..." : "Aanvraag weigeren"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
