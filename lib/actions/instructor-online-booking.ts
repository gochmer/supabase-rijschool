"use server";

import { revalidatePath } from "next/cache";

import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

export async function updateInstructorOnlineBookingAction(
  onlineBoekenActief: boolean
) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen een ingelogde instructeur kan online boekingen beheren.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("instructeurs")
    .update({
      online_boeken_actief: onlineBoekenActief,
    } as never)
    .eq("id", instructeur.id)
    .eq("profile_id", instructeur.profile_id);

  if (error) {
    return {
      success: false,
      message: "De online boekingsinstelling kon niet worden bijgewerkt.",
    };
  }

  revalidatePath("/instructeur/beschikbaarheid");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/instructeur/instellingen");
  revalidatePath(`/instructeurs/${instructeur.slug}`);

  return {
    success: true,
    message: onlineBoekenActief
      ? "Online zelf-inschrijven staat nu aan. Leerlingen kunnen je live agenda gebruiken."
      : "Online zelf-inschrijven staat nu uit. Alleen vrijgegeven leerlingen kunnen nog zelf plannen.",
  };
}
