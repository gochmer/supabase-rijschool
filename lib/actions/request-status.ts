"use server";

import { revalidatePath } from "next/cache";

import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";
import type { LesStatus } from "@/lib/types";

export async function updateLessonRequestStatusAction(
  requestId: string,
  status: Extract<LesStatus, "geaccepteerd" | "geweigerd">
) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen ingelogde instructeurs kunnen aanvragen bijwerken.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("lesaanvragen")
    .update({ status })
    .eq("id", requestId)
    .eq("instructeur_id", instructeur.id);

  if (error) {
    return {
      success: false,
      message: "De aanvraagstatus kon niet worden bijgewerkt.",
    };
  }

  revalidatePath("/instructeur/aanvragen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/leerling/boekingen");
  revalidatePath("/leerling/dashboard");

  return {
    success: true,
    message:
      status === "geaccepteerd"
        ? "De aanvraag is geaccepteerd."
        : "De aanvraag is geweigerd.",
  };
}
