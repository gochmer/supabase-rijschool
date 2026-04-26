import "server-only";

import { berichten } from "@/lib/mock-data";
import { createServerClient } from "@/lib/supabase/server";
import { ensureCurrentUserContext } from "@/lib/data/profiles";

export async function getCurrentMessageInbox() {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return berichten;
  }

  const supabase = await createServerClient();
  const { data: rows, error } = await supabase
    .from("berichten")
    .select("id, afzender_profiel_id, onderwerp, inhoud, gelezen, created_at")
    .eq("ontvanger_profiel_id", context.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return [];
  }

  if (!rows?.length) {
    return [];
  }

  const senderIds = rows.map((row) => row.afzender_profiel_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, volledige_naam")
    .in("id", senderIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.volledige_naam])
  );

  return rows.map((row) => ({
    id: row.id,
    afzender: profileMap.get(row.afzender_profiel_id) ?? "Afzender",
    onderwerp: row.onderwerp,
    preview: row.inhoud,
    tijd: new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(row.created_at)),
    ongelezen: !row.gelezen,
  }));
}

export async function getMessageRecipientsForCurrentUser() {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return [];
  }

  const supabase = await createServerClient();

  if (context.role === "leerling") {
    const { data: rows } = await supabase
      .from("instructeurs")
      .select("id, profile_id")
      .order("created_at", { ascending: false })
      .limit(50);

    const profileIds = (rows ?? []).map((row) => row.profile_id);
    const { data: profiles } = profileIds.length
      ? await supabase
          .from("profiles")
          .select("id, volledige_naam")
          .in("id", profileIds)
      : { data: [] };

    const profileMap = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile.volledige_naam])
    );

    return (rows ?? []).map((row) => ({
      id: row.profile_id,
      label: profileMap.get(row.profile_id) ?? "Instructeur",
    }));
  }

  if (context.role === "instructeur") {
    const { data: rows } = await supabase
      .from("leerlingen")
      .select("id, profile_id")
      .order("created_at", { ascending: false })
      .limit(50);

    const profileIds = (rows ?? []).map((row) => row.profile_id);
    const { data: profiles } = profileIds.length
      ? await supabase
          .from("profiles")
          .select("id, volledige_naam")
          .in("id", profileIds)
      : { data: [] };

    const profileMap = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile.volledige_naam])
    );

    return (rows ?? []).map((row) => ({
      id: row.profile_id,
      label: profileMap.get(row.profile_id) ?? "Leerling",
    }));
  }

  return [];
}
