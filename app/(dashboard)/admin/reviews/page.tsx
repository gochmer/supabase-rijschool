import { Star } from "lucide-react";

import { ReviewModerationActions } from "@/components/admin/review-moderation-actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminReviews } from "@/lib/data/admin";

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  return (
    <>
      <PageHeader
        title="Reviews beheren"
        description="Modereren, analyseren en opvolgen van beoordelingen en geschreven feedback."
      />
      <div className="grid gap-4">
        {reviews.map((review) => (
          <Card
            key={review.id}
            className="border-0 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)]"
          >
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <CardTitle>{review.titel}</CardTitle>
                  <CardDescription>
                    {review.leerling} over {review.instructeur} • {review.datum}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning" className="gap-1">
                    <Star className="size-3.5 fill-current" />
                    {review.score}/5
                  </Badge>
                  <Badge
                    variant={
                      review.moderatieStatus === "verborgen"
                        ? "danger"
                        : review.moderatieStatus === "gemarkeerd"
                          ? "warning"
                          : "success"
                    }
                  >
                    {review.moderatieStatus ?? "zichtbaar"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">
                {review.tekst || "Geen toelichting toegevoegd."}
              </p>
              <ReviewModerationActions reviewId={review.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
