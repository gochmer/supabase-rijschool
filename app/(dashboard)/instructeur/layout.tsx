import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function InstructeurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["instructeur"]);

  return <DashboardShell role="instructeur">{children}</DashboardShell>;
}
