"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { assignPackageToStudentAction } from "@/lib/actions/student-packages";
import { Button } from "@/components/ui/button";

const NO_PACKAGE_VALUE = "__no_package__";

export function PackageAssignmentSelect({
  leerlingId,
  currentPackageId,
  currentPackageName,
  currentPackageStatusLabel,
  currentPackageUsageLabel,
  packages,
}: {
  leerlingId: string;
  currentPackageId?: string | null;
  currentPackageName: string;
  currentPackageStatusLabel?: string | null;
  currentPackageUsageLabel?: string | null;
  packages: Array<{ id: string; naam: string }>;
}) {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState(
    currentPackageId ?? packages[0]?.id ?? NO_PACKAGE_VALUE
  );
  const [allowReplace, setAllowReplace] = useState(false);
  const [isPending, startTransition] = useTransition();
  const selectedPackageId =
    selectedPackage !== NO_PACKAGE_VALUE ? selectedPackage : null;
  const replacesExisting = Boolean(
    currentPackageId &&
      selectedPackageId &&
      selectedPackageId !== currentPackageId
  );

  function handleAssign() {
    startTransition(async () => {
      const result = await assignPackageToStudentAction(
        leerlingId,
        selectedPackageId,
        {
          allowReplace: replacesExisting && allowReplace,
        }
      );
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-muted-foreground">
        <span>Huidig: {currentPackageName}</span>
        {currentPackageStatusLabel ? (
          <span className="ml-2 font-semibold">({currentPackageStatusLabel})</span>
        ) : null}
        {currentPackageUsageLabel ? (
          <span className="mt-1 block">{currentPackageUsageLabel}</span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <select
          data-package-assignment-select={leerlingId}
          value={selectedPackage}
          onChange={(event) => {
            setSelectedPackage(event.target.value);
            setAllowReplace(false);
          }}
          className="native-select h-9 rounded-xl px-3 text-sm"
        >
          <option value={NO_PACKAGE_VALUE}>Geen pakket gekoppeld</option>
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.naam}
            </option>
          ))}
        </select>
        <Button
          data-package-assignment-submit={leerlingId}
          size="sm"
          disabled={
            isPending || !selectedPackage || (replacesExisting && !allowReplace)
          }
          onClick={handleAssign}
        >
          {selectedPackageId ? "Toewijzen" : "Loskoppelen"}
        </Button>
      </div>
      {replacesExisting ? (
        <label className="flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 p-2 text-xs leading-5 text-amber-900 dark:text-amber-100">
          <input
            checked={allowReplace}
            data-package-assignment-replace={leerlingId}
            onChange={(event) => setAllowReplace(event.target.checked)}
            type="checkbox"
            className="mt-1"
          />
          <span>
            Ik wil het bestaande pakket bewust vervangen. Open betalingen van
            het oude pakket worden gesloten.
          </span>
        </label>
      ) : null}
    </div>
  );
}
