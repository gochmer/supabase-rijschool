import { LessonsManagementBoard } from "@/components/admin/lessons-management-board";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAdminLessons } from "@/lib/data/admin";

export default async function AdminLessenPage() {
  const lessons = await getAdminLessons();

  return (
    <>
      <PageHeader
        tone="urban"
        title="Lessen beheren"
        description="Platformbreed overzicht van lessen, planningen en statussen."
      />
      <LessonsManagementBoard lessons={lessons} />
    </>
  );
}
