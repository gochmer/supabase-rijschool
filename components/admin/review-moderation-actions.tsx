"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateReviewModerationAction } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";

export function ReviewModerationActions({
  reviewId,
}: {
  reviewId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function updateStatus(status: "zichtbaar" | "verborgen" | "gemarkeerd") {
    startTransition(async () => {
      const result = await updateReviewModerationAction(reviewId, status);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={isPending} onClick={() => updateStatus("zichtbaar")}>
        Zichtbaar
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => updateStatus("gemarkeerd")}
      >
        Markeren
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => updateStatus("verborgen")}
      >
        Verbergen
      </Button>
    </div>
  );
}
