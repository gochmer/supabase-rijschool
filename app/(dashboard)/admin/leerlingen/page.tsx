import { StudentsManagementBoard } from "@/components/admin/students-management-board";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAdminPackages, getAdminStudents } from "@/lib/data/admin";

export default async function AdminLeerlingenPage() {
  const [students, packages] = await Promise.all([
    getAdminStudents(),
    getAdminPackages(),
  ]);

  return (
    <>
      <PageHeader
        title="Leerlingen beheren"
        description="Volg voortgang, pakketten en accountstatus in een modern operationeel overzicht."
      />
      <StudentsManagementBoard
        students={students}
        packages={packages.map((pkg) => ({ id: pkg.id, naam: pkg.naam }))}
      />
    </>
  );
}
