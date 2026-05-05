import { requireRole } from "@/lib/auth";
import { DashboardModuleTabs } from "@/components/dashboard/dashboard-module-tabs";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function InstructeurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["instructeur"]);

  return (
    <DashboardShell role="instructeur">
      <DashboardModuleTabs role="instructeur" />
      {children}
    </DashboardShell>
  );
}
