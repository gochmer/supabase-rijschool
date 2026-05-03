import "server-only";

import { cache } from "react";
import { notificaties } from "@/lib/mock-data";
import type { Notificatie } from "@/lib/types";
import { createServerClient } from "@/lib/supabase/server";
import { ensureCurrentUserContext } from "@/lib/data/profiles";

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const hours = Math.max(1, Math.floor(diff / (1000 * 60 * 60)));

  if (hours < 24) {
    return `${hours} uur geleden`;
  }

  const days = Math.floor(hours / 24);
  return `${days} dag${days === 1 ? "" : "en"} geleden`;
}

export const getCurrentNotifications = cache(async function getCurrentNotifications(): Promise<Notificatie[]> {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return notificaties;
  }

  const supabase = await createServerClient();
  const { data: rows, error } = await supabase
    .from("notificaties")
    .select("id, titel, tekst, type, ongelezen, created_at")
    .eq("profiel_id", context.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return [];
  }

  if (!rows?.length) {
    return [];
  }

  return rows.map((row) => ({
    id: row.id,
    titel: row.titel,
    tekst: row.tekst,
    tijd: formatRelativeDate(row.created_at),
    type:
      row.type === "succes" || row.type === "waarschuwing"
        ? row.type
        : "info",
    ongelezen: row.ongelezen,
  }));
});
