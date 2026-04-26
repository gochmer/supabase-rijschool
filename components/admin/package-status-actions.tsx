"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updatePackageStatusAction } from "@/lib/actions/packages";
import { Button } from "@/components/ui/button";

export function PackageStatusActions({
  packageId,
  status,
}: {
  packageId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  function updateStatus(nextActive: boolean) {
    startTransition(async () => {
      const result = await updatePackageStatusAction(packageId, nextActive);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex gap-2">
      {status !== "actief" ? (
        <Button size="sm" disabled={isPending} onClick={() => updateStatus(true)}>
          Activeren
        </Button>
      ) : null}
      {status !== "gepauzeerd" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => updateStatus(false)}
        >
          Pauzeren
        </Button>
      ) : null}
    </div>
  );
}
