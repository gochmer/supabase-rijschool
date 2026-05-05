import { requireRole } from "@/lib/auth";
import { DashboardModuleTabs } from "@/components/dashboard/dashboard-module-tabs";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function LeerlingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["leerling"]);

  return (
    <DashboardShell role="leerling">
      <DashboardModuleTabs role="leerling" />
      {children}
    </DashboardShell>
  );
}
