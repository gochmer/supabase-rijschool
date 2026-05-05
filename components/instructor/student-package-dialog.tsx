"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateInstructorLearnerPackageAction } from "@/lib/actions/instructor-learners";
import type { Pakket } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NO_PACKAGE_VALUE = "__no_package__";

export function StudentPackageDialog({
  leerlingId,
  leerlingNaam,
  currentPackageId,
  currentPackageName,
  currentPackageStatusLabel,
  currentPackageUsageLabel,
  packages = [],
}: {
  leerlingId: string;
  leerlingNaam: string;
  currentPackageId?: string | null;
  currentPackageName?: string | null;
  currentPackageStatusLabel?: string | null;
  currentPackageUsageLabel?: string | null;
  packages?: Pakket[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState(NO_PACKAGE_VALUE);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const selectedPackage =
    selectedPackageId !== NO_PACKAGE_VALUE
      ? packages.find((pkg) => pkg.id === selectedPackageId) ?? null
      : null;
  const replacesExisting = Boolean(
    currentPackageId &&
      selectedPackageId !== NO_PACKAGE_VALUE &&
      selectedPackageId !== currentPackageId
  );

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateInstructorLearnerPackageAction({
        leerlingId,
        packageId:
          selectedPackageId !== NO_PACKAGE_VALUE ? selectedPackageId : null,
        replaceExisting: replacesExisting && replaceExisting,
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setSelectedPackageId(currentPackageId ?? NO_PACKAGE_VALUE);
          setReplaceExisting(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9 rounded-full text-[12px]">
          Pakket koppelen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Pakket kiezen voor {leerlingNaam}</DialogTitle>
          <DialogDescription>
            Kies welk van jouw pakketten bij deze leerling hoort. Dit pakket komt
            daarna direct terug in de werkplek en vervolgflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Select
            value={selectedPackageId}
            onValueChange={(value) => {
              setSelectedPackageId(value);
              setReplaceExisting(false);
            }}
          >
            <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
              <SelectValue placeholder="Kies een pakket" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PACKAGE_VALUE}>Nog geen pakket koppelen</SelectItem>
              {packages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id}>
                  {pkg.naam}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {currentPackageName ? (
            <p className="text-[12px] leading-5 text-slate-500 dark:text-slate-400">
              Huidig pakket: {currentPackageName}
              {currentPackageStatusLabel ? ` - ${currentPackageStatusLabel}` : ""}
            </p>
          ) : null}
          {currentPackageUsageLabel ? (
            <p className="text-[12px] leading-5 text-slate-500 dark:text-slate-400">
              {currentPackageUsageLabel}
            </p>
          ) : null}
          {selectedPackage ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-[12px] leading-5 text-slate-300">
              <p className="font-semibold text-white">{selectedPackage.naam}</p>
              <p className="mt-1">
                {selectedPackage.lessen || "Flexibel"} lessen - EUR{" "}
                {selectedPackage.prijs.toLocaleString("nl-NL")}
              </p>
            </div>
          ) : null}
          {replacesExisting ? (
            <label className="flex items-start gap-2 rounded-2xl border border-amber-300/18 bg-amber-400/10 p-3 text-[12px] leading-5 text-amber-100">
              <input
                checked={replaceExisting}
                onChange={(event) => setReplaceExisting(event.target.checked)}
                type="checkbox"
                className="mt-1"
              />
              <span>
                Ik vervang dit pakket bewust. Open betalingen van het oude
                pakket worden gesloten.
              </span>
            </label>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || (replacesExisting && !replaceExisting)}
          >
            {isPending ? "Opslaan..." : "Pakket opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
