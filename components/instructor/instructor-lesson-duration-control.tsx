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
import { cn } from "@/lib/utils";

type DurationFieldKey = keyof InstructorLessonDurationDefaults;

const durationFieldConfig: Array<{
  key: DurationFieldKey;
  label: string;
  hint: string;
}> = [
  {
    key: "rijles",
    label: "Rijles",
    hint: "Standaardles.",
  },
  {
    key: "proefles",
    label: "Proefles",
    hint: "Kennismaking.",
  },
  {
    key: "pakketles",
    label: "Pakketles",
    hint: "Langer blok.",
  },
  {
    key: "examenrit",
    label: "Examenrit",
    hint: "Examengericht.",
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
  const [savedDefaults, setSavedDefaults] =
    useState<InstructorLessonDurationDefaults>(defaults);
  const [values, setValues] = useState<Record<DurationFieldKey, string>>({
    rijles: String(defaults.rijles),
    proefles: String(defaults.proefles),
    pakketles: String(defaults.pakketles),
    examenrit: String(defaults.examenrit),
  });

  const isDirty = useMemo(
    () =>
      durationFieldConfig.some(
        ({ key }) =>
          clampDuration(values[key], savedDefaults[key]) !== savedDefaults[key],
      ),
    [savedDefaults, values],
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
      rijles: String(savedDefaults.rijles),
      proefles: String(savedDefaults.proefles),
      pakketles: String(savedDefaults.pakketles),
      examenrit: String(savedDefaults.examenrit),
    });
  }

  function handleSave() {
    startTransition(async () => {
      const payload = {
        rijles: clampDuration(values.rijles, savedDefaults.rijles),
        proefles: clampDuration(values.proefles, savedDefaults.proefles),
        pakketles: clampDuration(values.pakketles, savedDefaults.pakketles),
        examenrit: clampDuration(values.examenrit, savedDefaults.examenrit),
      };

      const result =
        await updateInstructorLessonDurationDefaultsAction(payload);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setSavedDefaults(payload);
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
    <div className="rounded-xl border border-sky-300/16 bg-[radial-gradient(circle_at_15%_0%,rgba(14,165,233,0.14),transparent_34%),linear-gradient(145deg,rgba(9,20,35,0.98),rgba(5,13,24,0.99))] p-5 shadow-[0_22px_70px_-55px_rgba(14,165,233,0.8)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-400 uppercase">
            Standaard lesduur
          </p>
          <h3 className="mt-4 text-lg font-semibold text-white">
            Duur per lestype
          </h3>
          <p className="mt-3 max-w-80 text-sm leading-6 text-slate-300">
            Nieuwe blokken nemen deze duur automatisch over.
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-semibold leading-tight text-slate-200">
          <Clock3 className="size-4" />
          Automatische blokvulling
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {durationFieldConfig.map((field) => {
          const currentValue = clampDuration(
            values[field.key],
            savedDefaults[field.key],
          );

          return (
            <div
              key={field.key}
              className="rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="text-sm font-semibold text-white">
                    {field.label}
                  </Label>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    {field.hint}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-100">
                  {currentValue} min
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                <Input
                  type="number"
                  min={30}
                  max={240}
                  step={5}
                  value={values[field.key]}
                  onChange={(event) =>
                    patchValue(field.key, event.target.value)
                  }
                  className="h-10 rounded-xl border-white/10 bg-white/8 text-white placeholder:text-slate-500"
                />

                <div className="flex flex-wrap gap-2">
                  {LESSON_DURATION_PRESET_OPTIONS.map((preset) => (
                    <Button
                      key={`${field.key}-${preset}`}
                      type="button"
                      variant={currentValue === preset ? "default" : "outline"}
                      className={cn(
                        "h-7 rounded-xl px-3 text-[10px]",
                        currentValue === preset
                          ? "bg-sky-500 text-slate-950 hover:bg-sky-400"
                          : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white",
                      )}
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-xs leading-5 text-slate-300">
          Per losse les kun je later nog afwijken.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            onClick={resetValues}
          >
            Reset
          </Button>
          <Button
            type="button"
            className="h-9 rounded-xl bg-sky-500 text-slate-950 hover:bg-sky-400"
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
