"use client";

import Link from "next/link";

import { RequestStatusActions } from "@/components/requests/request-status-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getRequestStatusLabel } from "@/lib/lesson-request-flow";
import { getRijlesTypeLabel } from "@/lib/lesson-types";
import type { LesAanvraag, LocationOption } from "@/lib/types";
import { cn } from "@/lib/utils";

function getRequestTypeLabel(request: LesAanvraag) {
  if (request.aanvraag_type === "proefles") {
    return "Proefles";
  }

  if (request.aanvraag_type === "pakket") {
    return "Pakket";
  }

  return "Losse les";
}

function getRequestLessonLabel(request: LesAanvraag) {
  if (request.pakket_naam?.trim()) {
    return request.pakket_naam;
  }

  const lessonTypeLabel = request.les_type
    ? getRijlesTypeLabel(request.les_type)
    : "Auto";

  if (request.aanvraag_type === "proefles") {
    return `${lessonTypeLabel}rijles`;
  }

  return request.aanvraag_type === "pakket"
    ? `${lessonTypeLabel} pakket`
    : `${lessonTypeLabel}rijles 60 minuten`;
}

function getStatusClassName(status: LesAanvraag["status"]) {
  if (status === "aangevraagd") {
    return "border-amber-400/35 bg-amber-400/12 text-amber-300";
  }

  if (["geaccepteerd", "ingepland", "afgerond"].includes(status)) {
    return "border-emerald-400/25 bg-emerald-400/12 text-emerald-300";
  }

  return "border-rose-400/28 bg-rose-400/12 text-rose-300";
}

function getTableDate(value: string) {
  return value
    .replace(" januari ", " jan. ")
    .replace(" februari ", " feb. ")
    .replace(" maart ", " mrt. ")
    .replace(" april ", " apr. ")
    .replace(" mei ", " mei ")
    .replace(" juni ", " jun. ")
    .replace(" juli ", " jul. ")
    .replace(" augustus ", " aug. ")
    .replace(" september ", " sep. ")
    .replace(" oktober ", " okt. ")
    .replace(" november ", " nov. ")
    .replace(" december ", " dec. ");
}

export function PlanningRequestDialog({
  locationOptions,
  onOpenChange,
  request,
}: {
  locationOptions: LocationOption[];
  onOpenChange: (open: boolean) => void;
  request: LesAanvraag | null;
}) {
  return (
    <Dialog open={Boolean(request)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] dark:text-white">
        {request ? (
          <>
            <DialogHeader>
              <DialogTitle>{request.leerling_naam}</DialogTitle>
              <DialogDescription>
                {getRequestTypeLabel(request)} voor{" "}
                {getRequestLessonLabel(request)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Datum", getTableDate(request.voorkeursdatum)],
                ["Tijd", request.tijdvak],
                ["Status", getRequestStatusLabel(request.status)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/6 p-4"
                >
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                    {label}
                  </p>
                  <p className="mt-2 font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/6 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">
                  Bericht leerling
                </p>
                <span
                  className={cn(
                    "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                    getStatusClassName(request.status),
                  )}
                >
                  {getRequestStatusLabel(request.status)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {request.bericht?.trim() ||
                  "Deze leerling heeft geen extra toelichting meegestuurd."}
              </p>
            </div>

            <DialogFooter className="items-center sm:justify-between">
              {request.status === "aangevraagd" ? (
                <RequestStatusActions
                  requestId={request.id}
                  status={request.status}
                  locationOptions={locationOptions}
                />
              ) : (
                <Button asChild variant="outline" className="rounded-lg">
                  <Link href="/instructeur/aanvragen">Aanvragen openen</Link>
                </Button>
              )}
              <DialogClose asChild>
                <Button variant="outline" className="rounded-lg">
                  Sluiten
                </Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
