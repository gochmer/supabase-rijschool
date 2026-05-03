"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

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
  email?: string;
  telefoon: string;
  bio?: string;
  ervaringJaren?: string;
  werkgebied?: string;
  prijsPerLes?: string;
  transmissie?: string;
  specialisaties?: string;
  profielfotoKleur?: string;
};

const avatarAllowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const avatarExtensionByMimeType: Record<string, string> = {
  "image/avif": "avif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function updateProfileAvatarAction(formData: FormData) {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return { success: false, message: "Log eerst in om een profielfoto te uploaden." };
  }

  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Kies eerst een afbeelding." };
  }

  if (!avatarAllowedMimeTypes.has(file.type)) {
    return {
      success: false,
      message: "Gebruik een JPG, PNG, WebP of AVIF afbeelding.",
    };
  }

  if (file.size > 4 * 1024 * 1024) {
    return { success: false, message: "De afbeelding mag maximaal 4 MB zijn." };
  }

  const supabase = await createServerClient();
  const extension = avatarExtensionByMimeType[file.type] ?? "jpg";
  const path = `${context.user.id}/avatar-${Date.now()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { success: false, message: "De profielfoto kon niet worden geüpload. Controleer of de avatars bucket bestaat." };
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = data.publicUrl;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", context.user.id);

  if (profileError) {
    return { success: false, message: "De profielfoto kon niet worden opgeslagen." };
  }

  revalidatePath("/instructeur/profiel");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/instructeurs");

  return { success: true, message: "Je profielfoto is bijgewerkt." };
}

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
  const emailInput =
    typeof input.email === "string" ? normalizeEmail(input.email) : null;
  const telefoon = input.telefoon.trim();
  const currentEmail = normalizeEmail(
    context.user.email || context.profile?.email || ""
  );
  let profileEmail = context.profile?.email || context.user.email || "";
  let emailChangePending = false;
  let emailChangedImmediately = false;

  if (!volledigeNaam) {
    return {
      success: false,
      message: "Vul een volledige naam in.",
    };
  }

  if (emailInput !== null) {
    if (!emailInput || !isValidEmail(emailInput)) {
      return {
        success: false,
        message: "Vul een geldig e-mailadres in.",
      };
    }

    if (emailInput !== currentEmail) {
      const callbackUrl = new URL("/auth/callback", await getSiteUrl());
      callbackUrl.searchParams.set("next", "/instructeur/profiel");

      const { data: authData, error: authError } =
        await supabase.auth.updateUser(
          { email: emailInput },
          { emailRedirectTo: callbackUrl.toString() }
        );

      if (authError) {
        return {
          success: false,
          message:
            "Je e-mailadres kon niet worden gewijzigd. Controleer het adres en probeer opnieuw.",
        };
      }

      const updatedEmail = normalizeEmail(authData.user?.email ?? "");

      if (updatedEmail === emailInput) {
        profileEmail = emailInput;
        emailChangedImmediately = true;
      } else {
        emailChangePending = true;
      }
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      volledige_naam: volledigeNaam,
      email: profileEmail,
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
    message: emailChangePending
      ? "Je profiel is opgeslagen. Bevestig je nieuwe e-mailadres via de bevestigingsmail."
      : emailChangedImmediately
        ? "Je profiel en e-mailadres zijn opgeslagen."
        : "Je profiel is opgeslagen.",
  };
}
