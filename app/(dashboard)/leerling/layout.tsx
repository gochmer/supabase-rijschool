import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function LeerlingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["leerling"]);

  return <DashboardShell role="leerling">{children}</DashboardShell>;
}
