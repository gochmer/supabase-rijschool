"use client";

import { useState, useTransition } from "react";
import { FileText, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";

import { saveStudentProgressLessonNoteAction } from "@/lib/actions/student-progress";
import type { StudentProgressLessonNote } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function StudentProgressLessonNoteEditor({
  leerlingId,
  lesdatum,
  note,
  title = "Coachnotitie",
  compact = false,
  onSaved,
}: {
  leerlingId: string;
  lesdatum: string;
  note?: StudentProgressLessonNote | null;
  title?: string;
  compact?: boolean;
  onSaved?: (nextNote: StudentProgressLessonNote | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [samenvatting, setSamenvatting] = useState(note?.samenvatting ?? "");
  const [sterkPunt, setSterkPunt] = useState(note?.sterk_punt ?? "");
  const [focusVolgendeLes, setFocusVolgendeLes] = useState(
    note?.focus_volgende_les ?? ""
  );

  function handleSave() {
    startTransition(async () => {
      const result = await saveStudentProgressLessonNoteAction({
        leerlingId,
        lesdatum,
        samenvatting,
        sterkPunt,
        focusVolgendeLes,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      onSaved?.(
        samenvatting || sterkPunt || focusVolgendeLes
          ? {
              id: note?.id ?? `local-note-${leerlingId}-${lesdatum}`,
              leerling_id: leerlingId,
              instructeur_id: note?.instructeur_id ?? "local",
              lesdatum,
              samenvatting: samenvatting || null,
              sterk_punt: sterkPunt || null,
              focus_volgende_les: focusVolgendeLes || null,
              created_at: note?.created_at ?? new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : null
      );

      toast.success(result.message);
    });
  }

  const fieldClassName =
    "min-h-24 rounded-[1rem] border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500";
  const wrapperClassName = compact ? "space-y-2.5" : "space-y-3";

  return (
    <div className={wrapperClassName}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h3>
          <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
            Leg kort vast wat er goed ging en wat de focus voor de volgende les is.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={handleSave}
          className="h-9 rounded-full text-[12px]"
        >
          {isPending ? "Opslaan..." : "Opslaan"}
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor={`samenvatting-${leerlingId}-${lesdatum}`}
          className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
        >
          <FileText className="size-3.5" />
          Lesreflectie
        </Label>
        <Textarea
          id={`samenvatting-${leerlingId}-${lesdatum}`}
          value={samenvatting}
          onChange={(event) => setSamenvatting(event.target.value)}
          placeholder="Beschrijf kort hoe de les verliep, wat opviel en wat nog niet stabiel genoeg was."
          className={fieldClassName}
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor={`sterkpunt-${leerlingId}-${lesdatum}`}
          className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
        >
          <Sparkles className="size-3.5" />
          Sterk punt
        </Label>
        <Textarea
          id={`sterkpunt-${leerlingId}-${lesdatum}`}
          value={sterkPunt}
          onChange={(event) => setSterkPunt(event.target.value)}
          placeholder="Wat deed de leerling vandaag zichtbaar goed?"
          className="min-h-20 rounded-[1rem] border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor={`focus-${leerlingId}-${lesdatum}`}
          className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
        >
          <Target className="size-3.5" />
          Focus volgende les
        </Label>
        <Textarea
          id={`focus-${leerlingId}-${lesdatum}`}
          value={focusVolgendeLes}
          onChange={(event) => setFocusVolgendeLes(event.target.value)}
          placeholder="Welke onderdelen of verkeerssituaties krijgen de volgende les prioriteit?"
          className="min-h-20 rounded-[1rem] border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
        />
      </div>
    </div>
  );
}
