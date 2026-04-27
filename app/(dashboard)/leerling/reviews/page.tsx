import { PageHeader } from "@/components/dashboard/page-header";
import { ReviewsBoard } from "@/components/learner/reviews-board";
import { getLearnerReviewOpportunities } from "@/lib/data/reviews";

export default async function LeerlingReviewsPage() {
  const opportunities = await getLearnerReviewOpportunities();

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Schrijf na afgeronde lessen een eerlijke review en help andere leerlingen sneller vertrouwen opbouwen."
      />
      <ReviewsBoard opportunities={opportunities} />
    </>
  );
}
