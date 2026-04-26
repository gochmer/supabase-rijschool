"use server";

import { revalidatePath } from "next/cache";

import { getCurrentLeerlingRecord, getCurrentRole } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

export async function toggleFavoriteInstructorAction(instructorId: string) {
  const role = await getCurrentRole();

  if (role !== "leerling") {
    return {
      success: false,
      message: "Alleen leerlingen kunnen instructeurs als favoriet opslaan.",
    };
  }

  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return {
      success: false,
      message: "Je leerlingprofiel is niet gevonden.",
    };
  }

  const currentFavorites = leerling.favoriete_instructeurs ?? [];
  const alreadyFavorite = currentFavorites.includes(instructorId);
  const nextFavorites = alreadyFavorite
    ? currentFavorites.filter((id) => id !== instructorId)
    : [...currentFavorites, instructorId];

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("leerlingen")
    .update({ favoriete_instructeurs: nextFavorites })
    .eq("id", leerling.id);

  if (error) {
    return {
      success: false,
      message: "Favoriet bijwerken is niet gelukt.",
    };
  }

  revalidatePath("/leerling/instructeurs");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/instructeurs");

  return {
    success: true,
    isFavorite: !alreadyFavorite,
    message: alreadyFavorite
      ? "Instructeur verwijderd uit favorieten."
      : "Instructeur toegevoegd aan favorieten.",
  };
}
