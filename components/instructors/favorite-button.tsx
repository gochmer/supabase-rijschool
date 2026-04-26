"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { toggleFavoriteInstructorAction } from "@/lib/actions/favorites";
import { Button } from "@/components/ui/button";

export function FavoriteButton({
  instructorId,
  initialIsFavorite,
}: {
  instructorId: string;
  initialIsFavorite: boolean;
}) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleFavoriteInstructorAction(instructorId);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setIsFavorite(result.isFavorite ?? false);
      toast.success(result.message);
    });
  }

  return (
    <Button
      type="button"
      variant={isFavorite ? "default" : "outline"}
      size="icon-sm"
      className="shrink-0"
      onClick={handleClick}
      disabled={isPending}
      aria-label={
        isFavorite ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"
      }
    >
      <Heart className={isFavorite ? "fill-current" : ""} />
    </Button>
  );
}
