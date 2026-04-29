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
  currentPackageName,
  packages = [],
}: {
  leerlingId: string;
  leerlingNaam: string;
  currentPackageName?: string | null;
  packages?: Pakket[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState(NO_PACKAGE_VALUE);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateInstructorLearnerPackageAction({
        leerlingId,
        packageId:
          selectedPackageId !== NO_PACKAGE_VALUE ? selectedPackageId : null,
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
          const matchingPackage = packages.find(
            (pkg) => pkg.naam === currentPackageName
          );
          setSelectedPackageId(matchingPackage?.id ?? NO_PACKAGE_VALUE);
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
          <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
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
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Opslaan..." : "Pakket opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
