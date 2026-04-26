import { redirect } from "next/navigation";

import { ensureCurrentUserContext } from "@/lib/data/profiles";
import { getDashboardRouteForRole } from "@/lib/routes";

export default async function DashboardPage() {
  const context = await ensureCurrentUserContext();

  if (!context) {
    redirect("/inloggen?redirect=/dashboard");
  }

  redirect(getDashboardRouteForRole(context.role));
}
