import type { GebruikersRol } from "@/lib/types";

export const dashboardRoutes: Record<GebruikersRol, string> = {
  leerling: "/leerling/dashboard",
  instructeur: "/instructeur",
  admin: "/admin/dashboard",
};

export function getDashboardRouteForRole(rol: GebruikersRol) {
  return dashboardRoutes[rol];
}
