"use client";

import { useMemo, useState, useTransition } from "react";
import { Clock3, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { updateInstructorLessonDurationDefaultsAction } from "@/lib/actions/instructor-lesson-durations";
import {
  LESSON_DURATION_PRESET_OPTIONS,
  type InstructorLessonDurationDefaults,
} from "@/lib/lesson-durations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DurationFieldKey = keyof InstructorLessonDurationDefaults;

const durationFieldConfig: Array<{
  key: DurationFieldKey;
  label: string;
  hint: string;
}> = [
  {
    key: "rijles",
    label: "Rijles",
    hint: "Je standaard losse rijles.",
  },
  {
    key: "proefles",
    label: "Proefles",
    hint: "Kennismaking of intake.",
  },
  {
    key: "pakketles",
    label: "Pakketles",
    hint: "Langer blok voor trajecten of pakketten.",
  },
  {
    key: "examenrit",
    label: "Examenrit",
    hint: "Examenvoorbereiding of examengericht blok.",
  },
];

function clampDuration(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(30, Math.min(240, parsed));
}

export function InstructorLessonDurationControl({
  defaults,
}: {
  defaults: InstructorLessonDurationDefaults;
}) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<DurationFieldKey, string>>({
    rijles: String(defaults.rijles),
    proefles: String(defaults.proefles),
    pakketles: String(defaults.pakketles),
    examenrit: String(defaults.examenrit),
  });

  const isDirty = useMemo(
    () =>
      durationFieldConfig.some(
        ({ key }) => clampDuration(values[key], defaults[key]) !== defaults[key]
      ),
    [defaults, values]
  );

  function patchValue(key: DurationFieldKey, value: string) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function applyPresetToKey(key: DurationFieldKey, preset: number) {
    patchValue(key, String(preset));
  }

  function resetValues() {
    setValues({
      rijles: String(defaults.rijles),
      proefles: String(defaults.proefles),
      pakketles: String(defaults.pakketles),
      examenrit: String(defaults.examenrit),
    });
  }

  function handleSave() {
    startTransition(async () => {
      const payload = {
        rijles: clampDuration(values.rijles, defaults.rijles),
        proefles: clampDuration(values.proefles, defaults.proefles),
        pakketles: clampDuration(values.pakketles, defaults.pakketles),
        examenrit: clampDuration(values.examenrit, defaults.examenrit),
      };

      const result = await updateInstructorLessonDurationDefaultsAction(payload);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setValues({
        rijles: String(payload.rijles),
        proefles: String(payload.proefles),
        pakketles: String(payload.pakketles),
        examenrit: String(payload.examenrit),
      });
      toast.success(result.message);
    });
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
            Standaard lesduur
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
            Bepaal je blokduur per lestype
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Nieuwe boekbare blokken en handmatig geplande lessen nemen deze duur automatisch
            over. Per losse les kun je daarna nog steeds afwijken.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
          <Clock3 className="size-4" />
          Automatische blokvulling
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {durationFieldConfig.map((field) => {
          const currentValue = clampDuration(values[field.key], defaults[field.key]);

          return (
            <div
              key={field.key}
              className="rounded-[1.1rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="text-sm font-semibold text-slate-950 dark:text-white">
                    {field.label}
                  </Label>
                  <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">
                    {field.hint}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100">
                  {currentValue} min
                </span>
              </div>

              <div className="mt-3 space-y-3">
                <Input
                  type="number"
                  min={30}
                  max={240}
                  step={5}
                  value={values[field.key]}
                  onChange={(event) => patchValue(field.key, event.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/6 dark:text-white"
                />

                <div className="flex flex-wrap gap-2">
                  {LESSON_DURATION_PRESET_OPTIONS.map((preset) => (
                    <Button
                      key={`${field.key}-${preset}`}
                      type="button"
                      variant={currentValue === preset ? "default" : "outline"}
                      className="h-8 rounded-full px-3 text-[11px]"
                      onClick={() => applyPresetToKey(field.key, preset)}
                    >
                      {preset} min
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.1rem] border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
        <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
          Voorbeeld: plan je een proefles om 10:00 met 50 minuten standaardduur, dan reserveert
          de agenda automatisch 10:00 tot 10:50.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-full" onClick={resetValues}>
            Reset
          </Button>
          <Button
            type="button"
            className="h-9 rounded-full"
            disabled={isPending || !isDirty}
            onClick={handleSave}
          >
            <Settings2 className="size-4" />
            {isPending ? "Opslaan..." : "Duren opslaan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
