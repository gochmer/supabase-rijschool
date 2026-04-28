import { CalendarDays, Clock3, MapPin } from "lucide-react";

import type { Les } from "@/lib/types";
import {
  getLessonAudienceLabel,
  getLessonCountdownLabel,
} from "@/lib/lesson-utilities";
import { LessonQuickActions } from "@/components/dashboard/lesson-quick-actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LessonFocusCard({
  lesson,
  title = "Eerstvolgende les",
  description,
  tone = "default",
}: {
  lesson?: Les | null;
  title?: string;
  description?: string;
  tone?: "default" | "urban";
}) {
  const isUrban = tone === "urban";
  const countdownLabel = lesson?.start_at
    ? getLessonCountdownLabel(lesson.start_at)
    : null;

  return (
    <div
      className={cn(
        "rounded-[1.45rem] border p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.32)]",
        isUrban
          ? "border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] text-white shadow-[0_28px_88px_-46px_rgba(15,23,42,0.78)]"
          : "border-white/70 bg-white/88 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p
            className={cn(
              "text-[10px] font-semibold tracking-[0.18em] uppercase",
              isUrban ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
            )}
          >
            {title}
          </p>
          <h3
            className={cn(
              "text-lg font-semibold",
              isUrban ? "text-white" : "text-slate-950 dark:text-white"
            )}
          >
            {lesson ? lesson.titel : "Nog geen les gepland"}
          </h3>
          <p
            className={cn(
              "text-sm leading-6",
              isUrban ? "text-slate-300" : "text-slate-600 dark:text-slate-300"
            )}
          >
            {lesson
              ? description || getLessonAudienceLabel(lesson)
              : "Zodra een les vastligt, verschijnt hier direct je belangrijkste planningsmoment."}
          </p>
        </div>

        {countdownLabel ? <Badge variant="info">{countdownLabel}</Badge> : null}
      </div>

      {lesson ? (
        <>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            <div
              className={cn(
                "rounded-[1rem] px-3 py-2.5",
                isUrban
                  ? "border border-white/10 bg-white/6"
                  : "border border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/6"
              )}
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                <span className="text-[10px] font-semibold tracking-[0.16em] uppercase">
                  Datum
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold">{lesson.datum}</p>
            </div>

            <div
              className={cn(
                "rounded-[1rem] px-3 py-2.5",
                isUrban
                  ? "border border-white/10 bg-white/6"
                  : "border border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/6"
              )}
            >
              <div className="flex items-center gap-2">
                <Clock3 className="size-4" />
                <span className="text-[10px] font-semibold tracking-[0.16em] uppercase">
                  Tijd
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold">{lesson.tijd}</p>
            </div>

            <div
              className={cn(
                "rounded-[1rem] px-3 py-2.5",
                isUrban
                  ? "border border-white/10 bg-white/6"
                  : "border border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/6"
              )}
            >
              <div className="flex items-center gap-2">
                <MapPin className="size-4" />
                <span className="text-[10px] font-semibold tracking-[0.16em] uppercase">
                  Locatie
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold">{lesson.locatie}</p>
            </div>
          </div>

          <LessonQuickActions lesson={lesson} tone={tone} className="mt-4" />
        </>
      ) : null}
    </div>
  );
}
