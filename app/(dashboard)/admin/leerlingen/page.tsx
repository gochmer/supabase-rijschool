import { StudentsManagementBoard } from "@/components/admin/students-management-board";
import { DataHealthCallout } from "@/components/dashboard/data-health-callout";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAdminPackages, getAdminStudents } from "@/lib/data/admin";
import { getAdminDashboardDataHealth } from "@/lib/data/data-health";

export default async function AdminLeerlingenPage() {
  const [students, packages, dataHealth] = await Promise.all([
    getAdminStudents(),
    getAdminPackages(),
    getAdminDashboardDataHealth(),
  ]);

  return (
    <>
      <PageHeader
        tone="urban"
        title="Leerlingen beheren"
        description="Volg voortgang, pakketten en accountstatus in een modern operationeel overzicht."
      />
      <DataHealthCallout
        label="Admin leerlingen datastatus"
        results={dataHealth}
      />
      <StudentsManagementBoard
        students={students}
        packages={packages.map((pkg) => ({ id: pkg.id, naam: pkg.naam }))}
      />
    </>
  );
}
