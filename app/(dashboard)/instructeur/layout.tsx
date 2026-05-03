import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { InstructorModuleTabs } from "@/components/dashboard/instructor-module-tabs";

export default async function InstructeurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["instructeur"]);

  return (
    <DashboardShell role="instructeur">
      <InstructorModuleTabs />
      {children}
    </DashboardShell>
  );
}
