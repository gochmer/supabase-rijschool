import { AuditLogBoard } from "@/components/admin/audit-log-board";
import { DataHealthCallout } from "@/components/dashboard/data-health-callout";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAdminAuditLogEvents } from "@/lib/data/admin";
import { getAdminDashboardDataHealth } from "@/lib/data/data-health";

export default async function AdminAuditPage() {
  const [events, dataHealth] = await Promise.all([
    getAdminAuditLogEvents(),
    getAdminDashboardDataHealth(),
  ]);

  return (
    <>
      <PageHeader
        tone="urban"
        title="Audit logboek"
        description="Zoek en filter pakket-, betaling- en planningsacties zonder databaseconsole."
      />
      <DataHealthCallout
        label="Audit datastatus"
        results={dataHealth}
      />
      <AuditLogBoard events={events} />
    </>
  );
}
