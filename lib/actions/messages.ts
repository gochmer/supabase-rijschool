"use server";

import { revalidatePath } from "next/cache";

import { ensureCurrentUserContext } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

export async function sendMessageAction(input: {
  recipientProfileId: string;
  onderwerp: string;
  inhoud: string;
}) {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return {
      success: false,
      message: "Log eerst in om een bericht te versturen.",
    };
  }

  if (!input.recipientProfileId || !input.onderwerp.trim() || !input.inhoud.trim()) {
    return {
      success: false,
      message: "Vul een ontvanger, onderwerp en bericht in.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("berichten").insert({
    afzender_profiel_id: context.user.id,
    ontvanger_profiel_id: input.recipientProfileId,
    onderwerp: input.onderwerp.trim(),
    inhoud: input.inhoud.trim(),
  });

  if (error) {
    return {
      success: false,
      message: "Het bericht kon niet worden verstuurd.",
    };
  }

  await supabase.from("notificaties").insert({
    profiel_id: input.recipientProfileId,
    titel: "Nieuw bericht ontvangen",
    tekst: input.onderwerp.trim(),
    type: "info",
    ongelezen: true,
  });

  revalidatePath("/leerling/berichten");
  revalidatePath("/instructeur/berichten");
  revalidatePath("/leerling/instellingen");

  return {
    success: true,
    message: "Bericht verstuurd.",
  };
}
