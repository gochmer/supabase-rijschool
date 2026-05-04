"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, CircleSlash, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateLessonAttendanceAction } from "@/lib/actions/lesson-management";
import type { Les } from "@/lib/types";
import {
  getLessonAttendanceLabel,
  getLessonAttendanceVariant,
} from "@/lib/lesson-utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function LessonAttendanceActions({
  lesson,
  tone = "default",
  className,
}: {
  lesson: Les;
  tone?: "default" | "urban";
  className?: string;
}) {
  const isUrban = tone === "urban";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentAttendanceStatus, setCurrentAttendanceStatus] = useState(
    lesson.attendance_status ?? "onbekend"
  );
  const [showAbsentReason, setShowAbsentReason] = useState(false);
  const [absenceReason, setAbsenceReason] = useState(
    lesson.attendance_reason ?? ""
  );

  const helperText = useMemo(() => {
    if (currentAttendanceStatus === "aanwezig") {
      return "Deze les is al als aanwezig afgerond.";
    }

    if (currentAttendanceStatus === "afwezig") {
      return "Deze les is al als afwezig afgerond.";
    }

    return "Rond na het lesmoment direct de aanwezigheid af.";
  }, [currentAttendanceStatus]);

  function handleAttendanceConfirm(attendanceStatus: "aanwezig" | "afwezig") {
    startTransition(async () => {
      const result = await updateLessonAttendanceAction({
        lessonId: lesson.id,
        attendanceStatus,
        absenceReason,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      const progressHref =
        "progressHref" in result ? result.progressHref : null;

      toast.success(
        progressHref
          ? "Les afgerond. Ik open de voortgangskaart voor feedback."
          : result.message,
      );
      setCurrentAttendanceStatus(attendanceStatus);
      if (progressHref) {
        router.push(progressHref);
        return;
      }

      router.refresh();
      if (attendanceStatus === "afwezig") {
        setShowAbsentReason(false);
      }
    });
  }

  return (
    <div
      className={cn(
        "rounded-[1.05rem] border px-3 py-3",
        isUrban
          ? "border-white/10 bg-white/5"
          : "border-slate-200 bg-slate-50/85 dark:border-white/10 dark:bg-white/5",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <p
            className={cn(
              "text-[10px] font-semibold tracking-[0.16em] uppercase",
              isUrban ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
            )}
          >
            Aanwezigheid
          </p>
          <p
            className={cn(
              "text-[12px] leading-5",
              isUrban ? "text-slate-300" : "text-slate-600 dark:text-slate-300"
            )}
          >
            {helperText}
          </p>
        </div>

        <Badge variant={getLessonAttendanceVariant(currentAttendanceStatus)}>
          {getLessonAttendanceLabel(currentAttendanceStatus)}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() => handleAttendanceConfirm("aanwezig")}
          className="h-9 rounded-full text-[12px]"
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          Aanwezig afronden
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => setShowAbsentReason((current) => !current)}
          className={cn(
            "h-9 rounded-full text-[12px]",
            isUrban && "border-white/10 bg-white/6 text-white hover:bg-white/10"
          )}
        >
          <CircleSlash className="size-4" />
          Afwezig afronden
        </Button>
      </div>

      {showAbsentReason ? (
        <div className="mt-3 space-y-2">
          <Textarea
            value={absenceReason}
            onChange={(event) => setAbsenceReason(event.target.value)}
            placeholder="Korte reden, bijvoorbeeld verhinderd of no-show."
            className={cn(
              "min-h-20 rounded-[0.95rem] text-sm",
              isUrban
                ? "border-white/10 bg-white/6 text-white placeholder:text-slate-400"
                : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            )}
          />
          <Button
            type="button"
            size="sm"
            disabled={isPending || !absenceReason.trim()}
            onClick={() => handleAttendanceConfirm("afwezig")}
            className="h-9 rounded-full text-[12px]"
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <CircleSlash className="size-4" />
            )}
            Afwezig bevestigen
          </Button>
        </div>
      ) : null}
    </div>
  );
}
