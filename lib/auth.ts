import { redirect } from "next/navigation";

import {
  ensureCurrentUserContext,
  getCurrentInstructeurRecord,
  getCurrentRole,
} from "@/lib/data/profiles";
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
    const instructor = await getCurrentInstructeurRecord();

    if (instructor?.profiel_status !== "goedgekeurd") {
      redirect("/instructeur-verificatie");
    }
  }

  return { user, role };
}
