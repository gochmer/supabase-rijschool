"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateLessonRequestStatusAction } from "@/lib/actions/request-status";
import { Button } from "@/components/ui/button";

export function RequestStatusActions({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (status !== "aangevraagd") {
    return <span className="text-xs text-muted-foreground">Afgehandeld</span>;
  }

  function updateStatus(nextStatus: "geaccepteerd" | "geweigerd") {
    startTransition(async () => {
      const result = await updateLessonRequestStatusAction(requestId, nextStatus);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="grid gap-2 sm:flex [&>*]:w-full sm:[&>*]:w-auto">
      <Button
        size="sm"
        onClick={() => updateStatus("geaccepteerd")}
        disabled={isPending}
      >
        Accepteren
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => updateStatus("geweigerd")}
        disabled={isPending}
      >
        Weigeren
      </Button>
    </div>
  );
}
