"use server";

import { revalidatePath } from "next/cache";

import { ensureCurrentUserContext } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

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

  revalidatePath("/leerling/dashboard");
  revalidatePath("/instructeur/dashboard");

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

  revalidatePath("/leerling/dashboard");
  revalidatePath("/instructeur/dashboard");

  return {
    success: true,
    message: "Alle notificaties zijn gemarkeerd als gelezen.",
  };
}
