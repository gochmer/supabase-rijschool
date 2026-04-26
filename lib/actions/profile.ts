"use server";

import { revalidatePath } from "next/cache";

import { ensureCurrentUserContext } from "@/lib/data/profiles";
import {
  calculateInstructorProfileCompletion,
  isInstructorColor,
  isTransmissionType,
  parseCommaSeparatedList,
} from "@/lib/instructor-profile";
import { createServerClient } from "@/lib/supabase/server";
import type { TransmissieType } from "@/lib/types";

type UpdateProfileInput = {
  volledigeNaam: string;
  telefoon: string;
  bio?: string;
  ervaringJaren?: string;
  werkgebied?: string;
  prijsPerLes?: string;
  transmissie?: string;
  specialisaties?: string;
  profielfotoKleur?: string;
};

export async function updateCurrentProfileAction(input: UpdateProfileInput) {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return {
      success: false,
      message: "Log eerst in om je profiel bij te werken.",
    };
  }

  const supabase = await createServerClient();
  const volledigeNaam = input.volledigeNaam.trim();
  const telefoon = input.telefoon.trim();

  if (!volledigeNaam) {
    return {
      success: false,
      message: "Vul een volledige naam in.",
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      volledige_naam: volledigeNaam,
      telefoon,
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.user.id);

  if (profileError) {
    return {
      success: false,
      message: "Je profiel kon niet worden opgeslagen.",
    };
  }

  if (context.role === "instructeur" && typeof input.bio === "string") {
    const bio = input.bio.trim();
    const werkgebied = parseCommaSeparatedList(String(input.werkgebied ?? ""));
    const specialisaties = parseCommaSeparatedList(
      String(input.specialisaties ?? "")
    );
    const ervaringJarenRaw = Number.parseInt(
      String(input.ervaringJaren ?? "0"),
      10
    );
    const prijsPerLesRaw = Number.parseFloat(
      String(input.prijsPerLes ?? "0").replace(",", ".")
    );
    const ervaringJaren =
      Number.isFinite(ervaringJarenRaw) && ervaringJarenRaw >= 0
        ? ervaringJarenRaw
        : 0;
    const prijsPerLes =
      Number.isFinite(prijsPerLesRaw) && prijsPerLesRaw >= 0
        ? Number(prijsPerLesRaw.toFixed(2))
        : 0;
    const transmissieInput = String(input.transmissie ?? "");
    const transmissie: TransmissieType = isTransmissionType(transmissieInput)
      ? transmissieInput
      : "beide";
    const profielfotoKleur = isInstructorColor(
      String(input.profielfotoKleur ?? "")
    )
      ? String(input.profielfotoKleur)
      : "from-sky-300 via-cyan-400 to-blue-600";
    const profielCompleetheid = calculateInstructorProfileCompletion({
      bio,
      telefoon,
      werkgebied,
      prijsPerLes,
      specialisaties,
      ervaringJaren,
    });

    const { error: instructorError } = await supabase
      .from("instructeurs")
      .update({
        bio,
        ervaring_jaren: ervaringJaren,
        werkgebied,
        prijs_per_les: prijsPerLes,
        transmissie,
        specialisaties,
        profielfoto_kleur: profielfotoKleur,
        profiel_compleetheid: profielCompleetheid,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", context.user.id);

    if (instructorError) {
      return {
        success: false,
        message: "Je instructeursprofiel kon niet worden opgeslagen.",
      };
    }

    const { data: instructorSlug } = await supabase
      .from("instructeurs")
      .select("slug")
      .eq("profile_id", context.user.id)
      .maybeSingle();

    revalidatePath("/leerling/instructeurs");
    revalidatePath("/instructeurs");
    revalidatePath("/instructeur/dashboard");

    if (instructorSlug?.slug) {
      revalidatePath(`/instructeurs/${instructorSlug.slug}`);
    }
  }

  revalidatePath("/leerling/profiel");
  revalidatePath("/instructeur/profiel");

  return {
    success: true,
    message: "Je profiel is opgeslagen.",
  };
}
