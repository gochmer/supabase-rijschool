import { PageHeader } from "@/components/dashboard/page-header";
import { InstructorFinder } from "@/components/instructors/instructor-finder";
import { getFavoriteInstructorIds } from "@/lib/data/favorites";
import { getPublicInstructors } from "@/lib/data/instructors";

export default async function LeerlingInstructeursPage() {
  const [liveInstructors, favoriteInstructorIds] = await Promise.all([
    getPublicInstructors(),
    getFavoriteInstructorIds(),
  ]);

  return (
    <>
      <PageHeader
        title="Instructeurs zoeken"
        description="Vergelijk instructeurs op regio, prijs, beoordeling, beschikbaarheid, transmissie en specialisatie."
      />
      <InstructorFinder
        instructors={liveInstructors}
        detailBasePath="/instructeurs"
        favoriteInstructorIds={favoriteInstructorIds}
      />
    </>
  );
}
