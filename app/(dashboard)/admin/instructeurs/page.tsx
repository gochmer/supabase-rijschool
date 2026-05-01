import { InstructorsManagementBoard } from "@/components/admin/instructors-management-board";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAdminInstructors } from "@/lib/data/admin";

export default async function AdminInstructeursPage() {
  const instructors = await getAdminInstructors();

  return (
    <>
      <PageHeader
        tone="urban"
        title="Instructeurs beheren"
        description="Keur instructeurs goed, wijs af en bewaak profielkwaliteit en zichtbaarheid."
      />
      <InstructorsManagementBoard instructors={instructors} />
    </>
  );
}
