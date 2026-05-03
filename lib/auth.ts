import { redirect } from "next/navigation";

import { ensureCurrentUserContext, getCurrentRole } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";
import type { GebruikersRol } from "@/lib/types";
import { getDashboardRouteForRole } from "@/lib/routes";

export async function getCurrentUserRole(): Promise<GebruikersRol | null> {
  return getCurrentRole();
}

export async function requireRole(allowedRoles: GebruikersRol[]) {
  const context = await ensureCurrentUserContext();

  if (!context) {
    redirect("/inloggen");
  }

  const { role, user } = context;

  if (!allowedRoles.includes(role)) {
    redirect(getDashboardRouteForRole(role));
  }

  if (role === "instructeur" && allowedRoles.includes("instructeur")) {
    const supabase = await createServerClient();
    const { data: instructor } = await supabase
      .from("instructeurs")
      .select("profiel_status")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (instructor?.profiel_status !== "goedgekeurd") {
      redirect("/instructeur-verificatie");
    }
  }

  return { user, role };
}
