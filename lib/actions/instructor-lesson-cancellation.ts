"use server";

import { revalidatePath } from "next/cache";

import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import {
  normalizeLearnerLessonCancellationWindowHours,
  type LearnerLessonCancellationWindowHours,
} from "@/lib/lesson-cancellation";
import { createServerClient } from "@/lib/supabase/server";

export async function updateInstructorLearnerLessonCancellationWindowAction(
  hoursBeforeLesson: LearnerLessonCancellationWindowHours | null
) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message:
        "Alleen een ingelogde instructeur kan de annuleertermijn voor leerlingen aanpassen.",
    };
  }

  const nextValue =
    normalizeLearnerLessonCancellationWindowHours(hoursBeforeLesson);

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("instructeurs")
    .update({
      leerling_annuleren_tot_uren_voor_les: nextValue,
    } as never)
    .eq("id", instructeur.id)
    .eq("profile_id", instructeur.profile_id);

  if (error) {
    return {
      success: false,
      message: "De annuleertermijn kon niet worden opgeslagen.",
    };
  }

  revalidatePath("/instructeur/beschikbaarheid");
  revalidatePath("/instructeur/lessen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/leerling/boekingen");
  revalidatePath(`/instructeurs/${instructeur.slug}`);
  revalidatePath("/instructeurs");
  revalidatePath("/leerling/instructeurs");

  return {
    success: true,
    message: nextValue
      ? `Leerlingen mogen nu tot ${nextValue} uur voor de les zelf online annuleren.`
      : "Zelf online annuleren is voor leerlingen uitgezet. Annuleringen lopen nu alleen via jou of de rijschool.",
  };
}
