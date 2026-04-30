"use server";

import { revalidatePath } from "next/cache";

import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import {
  normalizeDurationMinutes,
  resolveInstructorLessonDurationDefaults,
} from "@/lib/lesson-durations";
import { createServerClient } from "@/lib/supabase/server";

type UpdateInstructorLessonDurationDefaultsInput = {
  rijles: number;
  proefles: number;
  pakketles: number;
  examenrit: number;
};

export async function updateInstructorLessonDurationDefaultsAction(
  input: UpdateInstructorLessonDurationDefaultsInput
) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen een ingelogde instructeur kan standaardduren aanpassen.",
    };
  }

  const currentDefaults = resolveInstructorLessonDurationDefaults(instructeur);
  const nextDefaults = {
    rijles: normalizeDurationMinutes(input.rijles, currentDefaults.rijles),
    proefles: normalizeDurationMinutes(input.proefles, currentDefaults.proefles),
    pakketles: normalizeDurationMinutes(input.pakketles, currentDefaults.pakketles),
    examenrit: normalizeDurationMinutes(input.examenrit, currentDefaults.examenrit),
  };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("instructeurs")
    .update({
      standaard_rijles_duur_minuten: nextDefaults.rijles,
      standaard_proefles_duur_minuten: nextDefaults.proefles,
      standaard_pakketles_duur_minuten: nextDefaults.pakketles,
      standaard_examenrit_duur_minuten: nextDefaults.examenrit,
    } as never)
    .eq("id", instructeur.id)
    .eq("profile_id", instructeur.profile_id);

  if (error) {
    return {
      success: false,
      message: "De standaardduren konden niet worden opgeslagen.",
    };
  }

  revalidatePath("/instructeur/beschikbaarheid");
  revalidatePath("/instructeur/leerlingen");
  revalidatePath("/instructeur/lessen");
  revalidatePath("/instructeur/instellingen");
  revalidatePath(`/instructeurs/${instructeur.slug}`);
  revalidatePath("/instructeurs");
  revalidatePath("/leerling/instructeurs");

  return {
    success: true,
    message:
      "De standaardduur per lestype is opgeslagen. Nieuwe lesblokken en boekingen sluiten hier nu op aan.",
  };
}
