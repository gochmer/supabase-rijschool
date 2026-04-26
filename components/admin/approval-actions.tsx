"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateInstructorApprovalAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function ApprovalActions({
  instructorId,
  status,
}: {
  instructorId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (status === "goedgekeurd") {
    return <span className="text-xs text-muted-foreground">Al goedgekeurd</span>;
  }

  function updateStatus(nextStatus: "goedgekeurd" | "afgewezen") {
    startTransition(async () => {
      const result = await updateInstructorApprovalAction(instructorId, nextStatus);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => updateStatus("goedgekeurd")}
      >
        Goedkeuren
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => updateStatus("afgewezen")}
      >
        Afwijzen
      </Button>
    </div>
  );
}
