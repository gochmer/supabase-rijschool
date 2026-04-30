import { MessageSquareQuote, PencilLine, Star } from "lucide-react";

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
      detail: "Afgeronde lessen die je kunt beoordelen.",
    },
    {
      icon: Star,
      label: "Geplaatst",
      value: `${reviewCount}`,
      detail: "Reviews die al zichtbaar of bijgewerkt zijn.",
    },
    {
      icon: MessageSquareQuote,
      label: "Nog te doen",
      value: `${openReviewCount}`,
      detail: "Open momenten waarvoor feedback nog nuttig is.",
    },
  ];

  return (
    <div className="space-y-6 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Reviews"
        title="Reviews en feedback"
        description="Schrijf na afgeronde lessen een eerlijke review. De pagina begint nu met de belangrijkste status en daarna pas de details."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.45rem] border border-white/10 bg-white/6 p-4 shadow-[0_20px_58px_-42px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-slate-100">
                <item.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
                  {item.label}
                </p>
                <p className="mt-1 truncate text-lg font-semibold text-white">
                  {item.value}
                </p>
                <p className="mt-1 text-[12px] leading-5 text-slate-300">
                  {item.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ReviewsBoard opportunities={opportunities} />
    </div>
  );
}
