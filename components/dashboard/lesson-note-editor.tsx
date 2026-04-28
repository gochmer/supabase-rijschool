"use client";

import { useState, useTransition } from "react";
import { FilePenLine, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { saveLessonMomentNoteAction } from "@/lib/actions/lesson-management";
import type { Les } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function LessonNoteEditor({
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
  const [isOpen, setIsOpen] = useState(Boolean(lesson.lesson_note));
  const [note, setNote] = useState(lesson.lesson_note ?? "");

  function handleSave() {
    startTransition(async () => {
      const result = await saveLessonMomentNoteAction({
        lessonId: lesson.id,
        note,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
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
        <div className="min-w-0">
          <p
            className={cn(
              "text-[10px] font-semibold tracking-[0.16em] uppercase",
              isUrban ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
            )}
          >
            Lesnotitie
          </p>
          <p
            className={cn(
              "mt-1 text-[12px] leading-5",
              isUrban ? "text-slate-300" : "text-slate-600 dark:text-slate-300"
            )}
          >
            {note.trim()
              ? note.trim()
              : "Leg kort vast wat relevant was voor dit lesmoment."}
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsOpen((current) => !current)}
          className={cn(
            "h-9 rounded-full text-[12px]",
            isUrban && "border-white/10 bg-white/6 text-white hover:bg-white/10"
          )}
        >
          <FilePenLine className="size-4" />
          {isOpen ? "Sluit notitie" : "Notitie"}
        </Button>
      </div>

      {isOpen ? (
        <div className="mt-3 space-y-2">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Bijvoorbeeld: rustiger spiegelen, sterk invoegen, volgende keer extra focus op kruispunten."
            className={cn(
              "min-h-24 rounded-[0.95rem] text-sm",
              isUrban
                ? "border-white/10 bg-white/6 text-white placeholder:text-slate-400"
                : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            )}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                setIsOpen(false);
              }}
              className={cn(
                "h-9 rounded-full text-[12px]",
                isUrban && "border-white/10 bg-white/6 text-white hover:bg-white/10"
              )}
            >
              Verbergen
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleSave}
              className="h-9 rounded-full text-[12px]"
            >
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <FilePenLine className="size-4" />
              )}
              Notitie opslaan
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
