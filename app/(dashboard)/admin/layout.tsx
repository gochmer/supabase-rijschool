import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin"]);

  return <DashboardShell role="admin">{children}</DashboardShell>;
}
