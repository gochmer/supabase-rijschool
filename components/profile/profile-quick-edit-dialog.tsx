"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PencilLine } from "lucide-react";
import { toast } from "sonner";

import { updateCurrentProfileAction } from "@/lib/actions/profile";
import {
  instructorColorOptions,
  instructorTransmissionOptions,
} from "@/lib/instructor-profile";
import type { TransmissieType } from "@/lib/types";
import { cn } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";

export type ProfileQuickEditValues = {
  volledigeNaam: string;
  email: string;
  telefoon: string;
  bio: string;
  ervaringJaren: number | string;
  werkgebied: string;
  prijsPerLes: number | string;
  transmissie: TransmissieType;
  specialisaties: string;
  profielfotoKleur: string;
};

type ProfileQuickEditField = keyof ProfileQuickEditValues;
type QuickEditKind = "email" | "number" | "select" | "text" | "textarea";

function getSelectOptions(field: ProfileQuickEditField) {
  if (field === "transmissie") {
    return instructorTransmissionOptions;
  }

  if (field === "profielfotoKleur") {
    return instructorColorOptions;
  }

  return [];
}

function normalizeInitialValue(
  field: ProfileQuickEditField,
  value: ProfileQuickEditValues[ProfileQuickEditField],
) {
  if (field === "ervaringJaren" || field === "prijsPerLes") {
    return String(value ?? 0);
  }

  return String(value ?? "");
}

export function ProfileQuickEditDialog({
  baseValues,
  children,
  description,
  field,
  kind = "text",
  placeholder,
  title,
  triggerClassName,
}: {
  baseValues: ProfileQuickEditValues;
  children: ReactNode;
  description?: string;
  field: ProfileQuickEditField;
  kind?: QuickEditKind;
  placeholder?: string;
  title: string;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const initialValue = useMemo(
    () => normalizeInitialValue(field, baseValues[field]),
    [baseValues, field],
  );
  const [value, setValue] = useState(initialValue);
  const selectOptions = getSelectOptions(field);

  function resetAndOpen(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setValue(initialValue);
    }
  }

  function saveQuickEdit() {
    const nextValue = value.trim();

    startTransition(async () => {
      const result = await updateCurrentProfileAction({
        volledigeNaam:
          field === "volledigeNaam" ? nextValue : baseValues.volledigeNaam,
        email: field === "email" ? nextValue : baseValues.email,
        telefoon: field === "telefoon" ? nextValue : baseValues.telefoon,
        bio: field === "bio" ? nextValue : baseValues.bio,
        ervaringJaren:
          field === "ervaringJaren"
            ? nextValue
            : String(baseValues.ervaringJaren),
        werkgebied: field === "werkgebied" ? nextValue : baseValues.werkgebied,
        prijsPerLes:
          field === "prijsPerLes" ? nextValue : String(baseValues.prijsPerLes),
        transmissie:
          field === "transmissie" ? nextValue : baseValues.transmissie,
        specialisaties:
          field === "specialisaties" ? nextValue : baseValues.specialisaties,
        profielfotoKleur:
          field === "profielfotoKleur"
            ? nextValue
            : baseValues.profielfotoKleur,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        className={cn("text-left", triggerClassName)}
        onClick={() => resetAndOpen(true)}
      >
        {children}
      </button>

      <Dialog open={open} onOpenChange={resetAndOpen}>
        <DialogContent className="border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PencilLine className="size-4 text-sky-300" />
              {title}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {description ?? "Pas de waarde aan en sla de wijziging op."}
            </DialogDescription>
          </DialogHeader>

          {kind === "textarea" ? (
            <Textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={placeholder}
              autoFocus
              className="min-h-36 rounded-xl border-white/10 bg-white/7 text-white placeholder:text-slate-500"
            />
          ) : kind === "select" ? (
            <select
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoFocus
              className="h-12 rounded-xl border border-white/10 bg-slate-950/90 px-4 text-white outline-none focus:border-sky-300/40"
            >
              {selectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={placeholder}
              type={kind === "email" ? "email" : kind === "number" ? "number" : "text"}
              min={kind === "number" ? 0 : undefined}
              step={field === "prijsPerLes" ? "0.01" : kind === "number" ? "1" : undefined}
              autoFocus
              className="h-12 rounded-xl border-white/10 bg-white/7 text-white placeholder:text-slate-500"
            />
          )}

          <DialogFooter className="border-white/10 bg-white/[0.03]">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-white/10 bg-white/7 text-white hover:bg-white/12"
              onClick={() => setOpen(false)}
            >
              Annuleren
            </Button>
            <Button
              type="button"
              className="rounded-lg bg-blue-600 text-white hover:bg-blue-500"
              disabled={isPending}
              onClick={saveQuickEdit}
            >
              <CheckCircle2 className="size-4" />
              {isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
