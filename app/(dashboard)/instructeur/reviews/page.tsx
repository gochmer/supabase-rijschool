import {
  BadgeCheck,
  ExternalLink,
  MessageSquareReply,
  MessageSquareText,
  Star,
} from "lucide-react";
import Link from "next/link";

import { InstructorReviewReplyDialog } from "@/components/reviews/instructor-review-reply-dialog";
import { Button } from "@/components/ui/button";
import {
  getCurrentInstructorReviewSummary,
  getCurrentInstructorReviews,
} from "@/lib/data/reviews";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import type { Review } from "@/lib/types";
import { cn } from "@/lib/utils";

function scoreLabel(value: number) {
  return value ? value.toFixed(1) : "0.0";
}

function ReviewStars({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const roundedScore = Math.max(0, Math.min(5, Math.round(score)));

  return (
    <div className={cn("flex items-center gap-1.5 text-amber-300", className)}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "size-7 drop-shadow-[0_8px_18px_rgba(251,191,36,0.28)]",
            index < roundedScore ? "fill-current" : "text-white/14"
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  priority = false,
}: {
  review: Review;
  priority?: boolean;
}) {
  const answered = Boolean(review.antwoord_tekst?.trim());

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[2rem] border p-5 text-white shadow-[0_28px_90px_-54px_rgba(0,0,0,0.95)] sm:p-7 lg:p-8",
        priority
          ? "border-amber-500/35 bg-[radial-gradient(circle_at_0%_0%,rgba(245,158,11,0.28),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(8,145,178,0.12),transparent_32%),linear-gradient(135deg,rgba(24,24,22,0.98),rgba(8,16,18,0.98))]"
          : "border-white/12 bg-[radial-gradient(circle_at_0%_0%,rgba(148,163,184,0.11),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.07),rgba(8,16,18,0.96))]"
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-amber-400/45" />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(330px,0.43fr)] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-11 items-center justify-center rounded-full border border-amber-300/28 bg-amber-400/14 px-5 text-2xl font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_14px_40px_-24px_rgba(245,158,11,0.95)]">
              {review.score}/5
            </span>
            <span
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-full border px-5 text-base font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
                answered
                  ? "border-emerald-300/24 bg-emerald-400/12 text-emerald-50"
                  : "border-cyan-300/28 bg-cyan-300/13 text-cyan-50"
              )}
            >
              {answered ? "Beantwoord" : "Nog reageren"}
            </span>
            {review.rapport_count ? (
              <span className="inline-flex h-10 items-center rounded-full border border-rose-300/24 bg-rose-400/12 px-4 text-sm font-semibold text-rose-100">
                {review.rapport_count} melding
                {review.rapport_count === 1 ? "" : "en"}
              </span>
            ) : null}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0">
              <p className="text-[13px] font-bold tracking-[0.34em] text-slate-400 uppercase">
                {review.leerling_naam} - {review.datum}
              </p>
              <h2 className="mt-7 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                {review.titel}
              </h2>
            </div>
            <ReviewStars score={review.score} className="lg:pt-10" />
          </div>

          <p className="mt-7 max-w-4xl text-xl leading-9 text-slate-300">
            {review.tekst || "Geen toelichting toegevoegd."}
          </p>
        </div>

        <aside
          className={cn(
            "rounded-[1.75rem] border p-5 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.95)] sm:p-6",
            answered
              ? "border-emerald-300/18 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.2),transparent_34%),linear-gradient(145deg,rgba(6,78,59,0.38),rgba(8,19,27,0.93))]"
              : "border-cyan-300/18 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_34%),linear-gradient(145deg,rgba(8,47,73,0.5),rgba(8,19,27,0.93))]"
          )}
        >
          <div className="flex items-start gap-5">
            <div
              className={cn(
                "flex size-16 shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]",
                answered
                  ? "border-emerald-200/10 bg-emerald-300/14 text-emerald-100"
                  : "border-cyan-200/10 bg-cyan-300/14 text-cyan-100"
              )}
            >
              {answered ? (
                <BadgeCheck className="size-8" />
              ) : (
                <MessageSquareReply className="size-8" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-semibold tracking-tight text-white">
                {answered ? "Reactie staat live" : "Pak deze review op"}
              </p>
              <p className="mt-4 text-xl leading-9 text-slate-300">
                {answered
                  ? `Je publieke antwoord is zichtbaar${review.antwoord_datum ? ` sinds ${review.antwoord_datum}` : ""}.`
                  : "Een korte, persoonlijke reply maakt je publieke profiel sterker."}
              </p>
            </div>
          </div>

          {answered ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/7 p-4 text-base leading-7 text-slate-200">
              {review.antwoord_tekst}
            </div>
          ) : null}

          <div className="mt-7">
            <InstructorReviewReplyDialog
              reviewId={review.id}
              reviewerName={review.leerling_naam}
              reviewTitle={review.titel}
              initialReply={review.antwoord_tekst}
              triggerLabel={answered ? "Reactie bijwerken" : "Reageer op review"}
              triggerClassName="h-14 rounded-full border-cyan-300/30 bg-slate-950/20 px-7 text-base font-semibold text-white hover:border-cyan-200/55 hover:bg-cyan-300/10"
            />
          </div>
        </aside>
      </div>
    </article>
  );
}

export default async function InstructeurReviewsPage() {
  const [summary, reviews, instructor] = await Promise.all([
    getCurrentInstructorReviewSummary(),
    getCurrentInstructorReviews(),
    getCurrentInstructeurRecord(),
  ]);
  const publicProfilePath = instructor?.slug
    ? `/instructeurs/${instructor.slug}`
    : "/instructeurs";
  const unansweredReviews = reviews.filter(
    (review) => !review.antwoord_tekst?.trim()
  );
  const sortedReviews = [
    ...unansweredReviews,
    ...reviews.filter((review) => review.antwoord_tekst?.trim()),
  ];
  const answeredReviews = reviews.length - unansweredReviews.length;

  return (
    <div className="space-y-6 text-white">
      <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_8%_0%,rgba(245,158,11,0.16),transparent_26%),radial-gradient(circle_at_100%_20%,rgba(34,211,238,0.12),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.07),rgba(8,16,18,0.94))] p-5 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.95)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.34em] text-slate-400 uppercase">
              Reviews
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Reviewstudio
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Bekijk al je reviews, reageer persoonlijk en houd je publieke
              profiel sterk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-11 items-center rounded-full border border-amber-300/22 bg-amber-400/12 px-5 text-sm font-semibold text-amber-50">
              {scoreLabel(summary.averageScore)}/5 gemiddeld
            </span>
            <span className="inline-flex h-11 items-center rounded-full border border-cyan-300/22 bg-cyan-300/12 px-5 text-sm font-semibold text-cyan-50">
              {unansweredReviews.length
                ? `${unansweredReviews.length} nog reageren`
                : "Alles beantwoord"}
            </span>
            <span className="inline-flex h-11 items-center rounded-full border border-white/12 bg-white/8 px-5 text-sm font-semibold text-slate-100">
              {answeredReviews}/{summary.reviewCount} live replies
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/12 bg-white/8 text-white hover:bg-white/12"
          >
            <Link href={publicProfilePath}>
              Openbare preview
              <ExternalLink className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-white text-slate-950 hover:bg-slate-200"
          >
            <Link href="/instructeur/profiel">Terug naar profiel</Link>
          </Button>
        </div>
      </section>

      {reviews.length ? (
        <section className="space-y-7">
          {sortedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              priority={!review.antwoord_tekst?.trim()}
            />
          ))}
        </section>
      ) : (
        <section className="rounded-[2rem] border border-dashed border-white/14 bg-white/[0.045] p-8 text-center shadow-[0_20px_60px_-46px_rgba(0,0,0,0.9)]">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-slate-100">
            <MessageSquareText className="size-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-white">
            Nog geen reviews binnen
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-8 text-slate-300">
            Zodra leerlingen afgeronde lessen beoordelen, verschijnen ze hier
            als review-inbox. Vanuit hier kun je direct reageren en daarna je
            publieke profiel controleren.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-full">
              <Link href="/instructeur/lessen">Lessen openen</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/10 bg-white/8 text-white"
            >
              <Link href="/instructeur/profiel">Profiel verbeteren</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
