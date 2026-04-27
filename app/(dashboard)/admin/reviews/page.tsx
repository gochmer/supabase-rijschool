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
  const moderationSummary = {
    zichtbaar: reviews.filter((review) => review.moderatieStatus === "zichtbaar")
      .length,
    gemarkeerd: reviews.filter((review) => review.moderatieStatus === "gemarkeerd")
      .length,
    verborgen: reviews.filter((review) => review.moderatieStatus === "verborgen")
      .length,
    gemeld: reviews.filter((review) => review.reportCount > 0).length,
    replies: reviews.filter((review) => Boolean(review.antwoordTekst?.trim())).length,
    gemiddeldeScore: reviews.length
      ? (
          reviews.reduce((total, review) => total + Number(review.score), 0) /
          reviews.length
        ).toFixed(1)
      : "0.0",
  };

  return (
    <>
      <PageHeader
        title="Reviews beheren"
        description="Modereren, analyseren en opvolgen van beoordelingen en geschreven feedback."
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Zichtbaar",
            value: moderationSummary.zichtbaar,
            tone: "success" as const,
            context: "Publiek zichtbaar op profielen en kaarten",
          },
          {
            label: "Gemarkeerd",
            value: moderationSummary.gemarkeerd,
            tone: "warning" as const,
            context: "Nog zichtbaar, maar intern gemarkeerd",
          },
          {
            label: "Verborgen",
            value: moderationSummary.verborgen,
            tone: "danger" as const,
            context: "Tijdelijk niet zichtbaar voor bezoekers",
          },
          {
            label: "Gemeld",
            value: moderationSummary.gemeld,
            tone: "warning" as const,
            context: "Reviews met minstens één gebruikersmelding",
          },
          {
            label: "Replies",
            value: moderationSummary.replies,
            tone: "info" as const,
            context: "Reviews waarop de instructeur al heeft gereageerd",
          },
          {
            label: "Gem. score",
            value: moderationSummary.gemiddeldeScore,
            tone: "success" as const,
            context: "Gemiddelde van alle reviews in moderatie",
          },
        ].map((item) => (
          <Card
            key={item.label}
            className="border-0 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86),rgba(15,23,42,0.94))]"
          >
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground dark:text-slate-300">
              {item.context}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4">
        {reviews.length ? reviews.map((review) => (
          <Card
            key={review.id}
            className="border-0 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86),rgba(15,23,42,0.94))]"
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
                    {review.reportCount ? (
                      <Badge variant="danger">
                        {review.reportCount} melding
                        {review.reportCount === 1 ? "" : "en"}
                      </Badge>
                    ) : null}
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
              <p className="text-sm leading-7 text-muted-foreground dark:text-slate-300">
                {review.tekst || "Geen toelichting toegevoegd."}
              </p>
              {review.antwoordTekst ? (
                <div className="rounded-[1rem] border border-sky-100 bg-sky-50/90 px-4 py-3 text-sm leading-6 text-sky-900 dark:border-sky-300/16 dark:bg-sky-400/10 dark:text-sky-100">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-sky-700 uppercase dark:text-sky-100">
                    Instructeur reply
                  </p>
                  <p className="mt-2">{review.antwoordTekst}</p>
                </div>
              ) : null}
              {review.reportCount ? (
                <div className="rounded-[1rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-300/16 dark:bg-amber-400/10 dark:text-amber-100">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-amber-700 uppercase dark:text-amber-100">
                    Gebruikersmeldingen
                  </p>
                  <p className="mt-2">
                    {review.reportCount} melding
                    {review.reportCount === 1 ? "" : "en"} ontvangen
                    {review.latestReportStatus
                      ? ` • laatste status: ${review.latestReportStatus}`
                      : ""}
                  </p>
                  {review.latestReportReason ? (
                    <p className="mt-1 text-sm leading-6">
                      Laatste reden: {review.latestReportReason}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {review.moderatieNotitie ? (
                <div className="rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
                    Interne moderatienotitie
                  </p>
                  <p className="mt-2">{review.moderatieNotitie}</p>
                </div>
              ) : null}
              <ReviewModerationActions
                reviewId={review.id}
                currentStatus={review.moderatieStatus}
                currentNote={review.moderatieNotitie}
              />
            </CardContent>
          </Card>
        )) : (
          <Card className="border border-dashed border-slate-300 bg-slate-50/80 shadow-none dark:border-white/12 dark:bg-white/5">
            <CardContent className="p-6 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Er staan nog geen reviews klaar voor moderatie.
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
