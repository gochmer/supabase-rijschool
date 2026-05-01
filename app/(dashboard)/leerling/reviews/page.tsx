import { MessageSquareQuote, PencilLine, Star } from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReviewsBoard } from "@/components/learner/reviews-board";
import { getLearnerReviewOpportunities } from "@/lib/data/reviews";

export default async function LeerlingReviewsPage() {
  const opportunities = await getLearnerReviewOpportunities();
  const reviewCount = opportunities.filter(
    (opportunity) => opportunity.existingReview
  ).length;
  const openReviewCount = opportunities.length - reviewCount;
  const stats = [
    {
      icon: PencilLine,
      label: "Reviewkansen",
      value: `${opportunities.length}`,
      tone: "sky",
      detail: "Afgeronde lessen die je kunt beoordelen.",
    },
    {
      icon: Star,
      label: "Geplaatst",
      value: `${reviewCount}`,
      tone: "amber",
      detail: "Reviews die al zichtbaar of bijgewerkt zijn.",
    },
    {
      icon: MessageSquareQuote,
      label: "Nog te doen",
      value: `${openReviewCount}`,
      tone: openReviewCount > 0 ? "rose" : "emerald",
      detail: "Open momenten waarvoor feedback nog nuttig is.",
    },
  ] as const;

  return (
    <div className="space-y-4 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Reviews"
        title="Reviews en feedback"
        description="Schrijf na afgeronde lessen een eerlijke review. De pagina begint nu met de belangrijkste status en daarna pas de details."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <DashboardStatCard key={item.label} {...item} />
        ))}
      </div>

      <ReviewsBoard opportunities={opportunities} />
    </div>
  );
}
