import { PageHeader } from "@/components/dashboard/page-header";
import { ReviewsBoard } from "@/components/learner/reviews-board";
import { getPublicInstructors } from "@/lib/data/instructors";

export default async function LeerlingReviewsPage() {
  const instructors = await getPublicInstructors();

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Schrijf reviews na afgeronde lessen en beheer eerder geplaatste beoordelingen."
      />
      <ReviewsBoard instructors={instructors} />
    </>
  );
}
