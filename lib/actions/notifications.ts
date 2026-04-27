"use server";

import { revalidatePath } from "next/cache";

import { ensureCurrentUserContext } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

function revalidateNotificationSurfaces() {
  [
    "/leerling/dashboard",
    "/instructeur/dashboard",
    "/admin/dashboard",
    "/leerling/instellingen",
    "/instructeur/instellingen",
    "/admin/instellingen",
  ].forEach((path) => revalidatePath(path));
}

export async function markNotificationReadAction(notificationId: string) {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return {
      success: false,
      message: "Log eerst in om notificaties bij te werken.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("notificaties")
    .update({ ongelezen: false } as never)
    .eq("id", notificationId)
    .eq("profiel_id", context.user.id);

  if (error) {
    return {
      success: false,
      message: "De notificatie kon niet worden bijgewerkt.",
    };
  }

  revalidateNotificationSurfaces();

  return {
    success: true,
    message: "Notificatie gemarkeerd als gelezen.",
  };
}

export async function markAllNotificationsReadAction() {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return {
      success: false,
      message: "Log eerst in om notificaties bij te werken.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("notificaties")
    .update({ ongelezen: false } as never)
    .eq("profiel_id", context.user.id)
    .eq("ongelezen", true);

  if (error) {
    return {
      success: false,
      message: "De notificaties konden niet worden bijgewerkt.",
    };
  }

  revalidateNotificationSurfaces();

  return {
    success: true,
    message: "Alle notificaties zijn gemarkeerd als gelezen.",
  };
}
