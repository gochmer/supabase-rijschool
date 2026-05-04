"use server";

import { revalidatePath } from "next/cache";

import { getCurrentRole } from "@/lib/data/profiles";
import { syncStudentDriverJourneyStatus } from "@/lib/data/driver-journey";
import { createServerClient } from "@/lib/supabase/server";

export async function assignPackageToStudentAction(
  leerlingId: string,
  pakketId: string
) {
  const role = await getCurrentRole();

  if (role !== "admin") {
    return {
      success: false,
      message: "Alleen admins kunnen pakketten toewijzen.",
    };
  }

  const supabase = await createServerClient();
  const { data: leerling } = await supabase
    .from("leerlingen")
    .select("id, profile_id")
    .eq("id", leerlingId)
    .maybeSingle();

  if (!leerling) {
    return {
      success: false,
      message: "Leerling niet gevonden.",
    };
  }

  const { data: pakket } = await supabase
    .from("pakketten")
    .select("id, prijs, naam, instructeur_id")
    .eq("id", pakketId)
    .maybeSingle();

  if (!pakket) {
    return {
      success: false,
      message: "Pakket niet gevonden.",
    };
  }

  const { error: updateError } = await supabase
    .from("leerlingen")
    .update({ pakket_id: pakket.id })
    .eq("id", leerling.id);

  if (updateError) {
    return {
      success: false,
      message: "Pakket toewijzen is niet gelukt.",
    };
  }

  if (pakket.instructeur_id) {
    const now = new Date().toISOString();
    await supabase.from("leerling_planningsrechten" as never).upsert(
      {
        leerling_id: leerling.id,
        instructeur_id: pakket.instructeur_id,
        zelf_inplannen_toegestaan: true,
        vrijgegeven_at: now,
        updated_at: now,
      } as never,
      { onConflict: "leerling_id,instructeur_id" }
    );
  }

  await supabase.from("betalingen").insert({
    profiel_id: leerling.profile_id,
    pakket_id: pakket.id,
    bedrag: pakket.prijs ?? 0,
    status: "open",
    provider: "mock",
  });

  await supabase.from("notificaties").insert({
    profiel_id: leerling.profile_id,
    titel: "Nieuw pakket toegewezen",
    tekst: `Je bent gekoppeld aan ${pakket.naam}.`,
    type: "succes",
    ongelezen: true,
  });

  await syncStudentDriverJourneyStatus(leerling.id);

  revalidatePath("/admin/leerlingen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/instructeur/leerlingen");
  revalidatePath("/instructeur/lessen");
  revalidatePath("/leerling/betalingen");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/leerling/boekingen");
  revalidatePath("/leerling/profiel");

  return {
    success: true,
    message: "Pakket succesvol toegewezen.",
  };
}
