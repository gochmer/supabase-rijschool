import { requireRole } from "@/lib/auth";
import { DashboardModuleTabs } from "@/components/dashboard/dashboard-module-tabs";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin"]);

  return (
    <DashboardShell role="admin">
      <DashboardModuleTabs role="admin" />
      {children}
    </DashboardShell>
  );
}
