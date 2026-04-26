"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { assignPackageToStudentAction } from "@/lib/actions/student-packages";
import { Button } from "@/components/ui/button";

export function PackageAssignmentSelect({
  leerlingId,
  currentPackageName,
  packages,
}: {
  leerlingId: string;
  currentPackageName: string;
  packages: Array<{ id: string; naam: string }>;
}) {
  const [selectedPackage, setSelectedPackage] = useState(packages[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  function handleAssign() {
    startTransition(async () => {
      const result = await assignPackageToStudentAction(leerlingId, selectedPackage);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <span className="text-xs text-muted-foreground">
        Huidig: {currentPackageName}
      </span>
      <select
        value={selectedPackage}
        onChange={(event) => setSelectedPackage(event.target.value)}
        className="native-select h-9 rounded-xl px-3 text-sm"
      >
        {packages.map((pkg) => (
          <option key={pkg.id} value={pkg.id}>
            {pkg.naam}
          </option>
        ))}
      </select>
      <Button size="sm" disabled={isPending || !selectedPackage} onClick={handleAssign}>
        Toewijzen
      </Button>
    </div>
  );
}
