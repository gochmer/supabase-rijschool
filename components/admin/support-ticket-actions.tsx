"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateSupportTicketStatusAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function SupportTicketActions({
  ticketId,
  status,
}: {
  ticketId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  function updateStatus(nextStatus: "in_behandeling" | "afgesloten") {
    startTransition(async () => {
      const result = await updateSupportTicketStatusAction(ticketId, nextStatus);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex gap-2">
      {status !== "in_behandeling" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => updateStatus("in_behandeling")}
        >
          Oppakken
        </Button>
      ) : null}
      {status !== "afgesloten" ? (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => updateStatus("afgesloten")}
        >
          Afsluiten
        </Button>
      ) : null}
    </div>
  );
}
