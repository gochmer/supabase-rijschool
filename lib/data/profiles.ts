import "server-only";

import type { User } from "@supabase/supabase-js";

import type { GebruikersRol, Profiel, TransmissieType } from "@/lib/types";
import { createServerClient } from "@/lib/supabase/server";

type ZelfRegistratieRol = Extract<GebruikersRol, "leerling" | "instructeur">;

function normalizeSelfSignupRole(value: unknown): ZelfRegistratieRol {
  return value === "instructeur" ? "instructeur" : "leerling";
}

function createSlug(value: string, fallback: string) {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${base || "instructeur"}-${fallback.slice(0, 6)}`;
}

function getDefaultName(user: User) {
  return (
    (user.user_metadata?.volledige_naam as string | undefined) ||
    user.email?.split("@")[0] ||
    "Gebruiker"
  );
}

async function ensureProfileExists(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  user: User
) {
  const requestedRole = normalizeSelfSignupRole(user.user_metadata?.rol);
  const volledigeNaam = getDefaultName(user);
  const telefoon =
    typeof user.user_metadata?.telefoon === "string"
      ? user.user_metadata.telefoon
      : "";
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  const { data: insertedProfile } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      volledige_naam: volledigeNaam,
      email: user.email ?? "",
      telefoon,
      avatar_url: avatarUrl,
      rol: requestedRole,
    })
    .select("*")
    .maybeSingle();

  return (insertedProfile as Profiel | null) ?? null;
}

export async function ensureCurrentUserContext() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile =
    (existingProfile as Profiel | null) ?? (await ensureProfileExists(supabase, user));
  const role =
    (profile?.rol as GebruikersRol | undefined) ??
    normalizeSelfSignupRole(user.user_metadata?.rol);
  const volledigeNaam = profile?.volledige_naam || getDefaultName(user);

  if (role === "leerling") {
    const { data: leerling } = await supabase
      .from("leerlingen")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!leerling) {
      await supabase.from("leerlingen").insert({
        profile_id: user.id,
      });
    }
  }

  if (role === "instructeur") {
    const { data: instructeur } = await supabase
      .from("instructeurs")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!instructeur) {
      await supabase.from("instructeurs").insert({
        profile_id: user.id,
        slug: createSlug(volledigeNaam, user.id),
        bio:
          typeof user.user_metadata?.bio === "string"
            ? user.user_metadata.bio
            : "",
        werkgebied: [],
        profiel_status: "in_beoordeling",
      });
    }
  }

  return {
    user,
    role,
    profile: (profile as Profiel | null) ?? null,
  };
}

export async function getCurrentProfile() {
  const context = await ensureCurrentUserContext();
  return context?.profile ?? null;
}

export async function getCurrentRole() {
  const context = await ensureCurrentUserContext();
  return context?.role ?? null;
}

export async function getCurrentLeerlingRecord() {
  const context = await ensureCurrentUserContext();

  if (!context || context.role !== "leerling") {
    return null;
  }

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("leerlingen")
    .select("id, profile_id, voortgang_percentage, pakket_id, favoriete_instructeurs")
    .eq("profile_id", context.user.id)
    .maybeSingle();

  return (data as {
    id: string;
    profile_id: string;
    voortgang_percentage: number;
    pakket_id: string | null;
    favoriete_instructeurs: string[] | null;
  } | null) ?? null;
}

export async function getCurrentInstructeurRecord() {
  const context = await ensureCurrentUserContext();

  if (!context || context.role !== "instructeur") {
    return null;
  }

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("instructeurs")
    .select(
      "id, profile_id, slug, bio, ervaring_jaren, werkgebied, prijs_per_les, transmissie, beoordeling, profiel_status, profiel_compleetheid, specialisaties, profielfoto_kleur"
    )
    .eq("profile_id", context.user.id)
    .maybeSingle();

  return (data as {
    id: string;
    profile_id: string;
    slug: string;
    bio: string | null;
    ervaring_jaren: number | null;
    werkgebied: string[] | null;
    prijs_per_les: number | string | null;
    transmissie: TransmissieType | null;
    beoordeling: number | string | null;
    profiel_status: string | null;
    profiel_compleetheid: number | null;
    specialisaties: string[] | null;
    profielfoto_kleur: string | null;
  } | null) ?? null;
}
