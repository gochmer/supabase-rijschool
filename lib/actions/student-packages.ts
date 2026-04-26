"use server";

import { revalidatePath } from "next/cache";

import { getCurrentRole } from "@/lib/data/profiles";
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
    .select("id, prijs, naam")
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

  revalidatePath("/admin/leerlingen");
  revalidatePath("/leerling/betalingen");
  revalidatePath("/leerling/dashboard");

  return {
    success: true,
    message: "Pakket succesvol toegewezen.",
  };
}
