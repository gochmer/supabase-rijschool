"use client";

import { CalendarPlus2, MapPinned } from "lucide-react";

import type { Les } from "@/lib/types";
import {
  buildLessonCalendarFile,
  buildLessonMapsUrl,
  getLessonCalendarFilename,
} from "@/lib/lesson-utilities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LessonQuickActions({
  lesson,
  tone = "default",
  className,
}: {
  lesson: Les;
  tone?: "default" | "urban";
  className?: string;
}) {
  const isUrban = tone === "urban";
  const mapsUrl = buildLessonMapsUrl(lesson.locatie);
  const canExportCalendar = Boolean(lesson.start_at);

  function handleCalendarDownload() {
    const fileContent = buildLessonCalendarFile(lesson);

    if (!fileContent) {
      return;
    }

    const fileBlob = new Blob([fileContent], {
      type: "text/calendar;charset=utf-8",
    });
    const fileUrl = URL.createObjectURL(fileBlob);
    const tempLink = document.createElement("a");
    tempLink.href = fileUrl;
    tempLink.download = getLessonCalendarFilename(lesson);
    document.body.appendChild(tempLink);
    tempLink.click();
    tempLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleCalendarDownload}
        disabled={!canExportCalendar}
        className={cn(
          "h-9 rounded-full px-3 text-[12px]",
          isUrban &&
            "border-white/10 bg-white/6 text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.42)] hover:bg-white/10"
        )}
      >
        <CalendarPlus2 className="size-4" />
        Zet in agenda
      </Button>

      {mapsUrl ? (
        <Button
          asChild
          variant="outline"
          size="lg"
          className={cn(
            "h-9 rounded-full px-3 text-[12px]",
            isUrban &&
              "border-white/10 bg-white/6 text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.42)] hover:bg-white/10"
          )}
        >
          <a href={mapsUrl} target="_blank" rel="noreferrer">
            <MapPinned className="size-4" />
            Open route
          </a>
        </Button>
      ) : null}
    </div>
  );
}
