"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  MessageSquareQuote,
  PencilLine,
  Search,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { saveLearnerReviewAction } from "@/lib/actions/reviews";
import type { LearnerReviewOpportunity } from "@/lib/data/reviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function ReviewFormDialog({
  opportunity,
}: {
  opportunity: LearnerReviewOpportunity;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(opportunity.existingReview?.score ?? 5);
  const [title, setTitle] = useState(opportunity.existingReview?.title ?? "");
  const [text, setText] = useState(opportunity.existingReview?.text ?? "");

  function resetToCurrentValues() {
    setScore(opportunity.existingReview?.score ?? 5);
    setTitle(opportunity.existingReview?.title ?? "");
    setText(opportunity.existingReview?.text ?? "");
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      resetToCurrentValues();
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await saveLearnerReviewAction({
        lessonId: opportunity.lessonId,
        score,
        title,
        text,
      });

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          {opportunity.existingReview ? "Review bijwerken" : "Review schrijven"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>
            {opportunity.existingReview ? "Review aanpassen" : "Review schrijven"}
          </DialogTitle>
          <DialogDescription>
            Je review verschijnt op het profiel van {opportunity.instructorName} en helpt nieuwe leerlingen sneller een passende keuze maken.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
              Afgeronde les
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
              {opportunity.lessonTitle}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {opportunity.lessonDate} om {opportunity.lessonTime} met{" "}
              {opportunity.instructorName}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Jouw score</Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => {
                const isActive = value <= score;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScore(value)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100"
                        : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    }`}
                  >
                    <Star
                      className={`size-4 ${
                        isActive ? "fill-current text-current" : "text-slate-400"
                      }`}
                    />
                    {value}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`review-title-${opportunity.lessonId}`}>Titel</Label>
            <Input
              id={`review-title-${opportunity.lessonId}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Bijvoorbeeld: Rustige uitleg en duidelijke feedback"
              className="dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`review-text-${opportunity.lessonId}`}>Review</Label>
            <Textarea
              id={`review-text-${opportunity.lessonId}`}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Vertel kort wat sterk was aan deze les of begeleiding."
              className="min-h-32 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Terug
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? "Opslaan..."
              : opportunity.existingReview
                ? "Review bijwerken"
                : "Review plaatsen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewsBoard({
  opportunities,
}: {
  opportunities: LearnerReviewOpportunity[];
}) {
  const [query, setQuery] = useState("");

  const filteredOpportunities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return opportunities;
    }

    return opportunities.filter((opportunity) =>
      [opportunity.instructorName, opportunity.lessonTitle]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [opportunities, query]);

  const reviewCount = opportunities.filter(
    (opportunity) => opportunity.existingReview
  ).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.55rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86),rgba(15,23,42,0.94))]">
          <label className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50/90 px-3 py-3 dark:border-white/10 dark:bg-white/5">
            <Search className="size-4 text-slate-400 dark:text-slate-300" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Zoek op instructeur of les"
              className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 dark:text-white dark:placeholder:text-slate-400"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.35rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86),rgba(15,23,42,0.94))]">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
              Afgeronde lessen
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
              {opportunities.length}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
              Lessen waarvoor je feedback kunt achterlaten of bijwerken.
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86),rgba(15,23,42,0.94))]">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
              Reviews geplaatst
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
              {reviewCount}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
              Jouw zichtbare social proof op instructeurprofielen.
            </p>
          </div>
        </div>
      </div>

      {filteredOpportunities.length ? (
        <div className="grid gap-3">
          {filteredOpportunities.map((opportunity) => (
            <details
              key={opportunity.lessonId}
              className="group overflow-hidden rounded-[1.55rem] border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86),rgba(15,23,42,0.94))]"
            >
              <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 transition hover:bg-slate-50/80 dark:hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
                    {opportunity.lessonTitle}
                  </p>
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                    {opportunity.instructorName}
                  </h3>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {opportunity.lessonDate} om {opportunity.lessonTime}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={opportunity.existingReview ? "success" : "warning"}
                  >
                    {opportunity.existingReview ? "Review geplaatst" : "Klaar voor review"}
                  </Badge>
                  <span className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100">
                    Details
                    <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                  </span>
                </div>
              </summary>

              <div className="grid gap-3 border-t border-slate-200/80 p-4 dark:border-white/10 md:grid-cols-[1fr_auto] md:items-end">
                <div className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5">
                  {opportunity.existingReview ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="info">
                          <Star className="mr-1 size-3.5 fill-current" />
                          {opportunity.existingReview.score}/5
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Geplaatst op {opportunity.existingReview.submittedAt}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">
                          {opportunity.existingReview.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {opportunity.existingReview.text}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-primary" />
                      <p>
                        Deel hoe de begeleiding voelde, wat sterk was aan de uitleg
                        en waarom andere leerlingen deze instructeur wel of niet
                        moeten overwegen.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  {opportunity.instructorSlug ? (
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href={`/instructeurs/${opportunity.instructorSlug}`}>
                        Bekijk profiel
                      </Link>
                    </Button>
                  ) : null}
                  <ReviewFormDialog opportunity={opportunity} />
                </div>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.55rem] border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center dark:border-white/12 dark:bg-white/5">
          <PencilLine className="mx-auto size-10 text-slate-400 dark:text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
            Nog geen afgeronde lessen voor reviews
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Zodra een les is afgerond, verschijnt die hier automatisch zodat je
            een review kunt plaatsen.
          </p>
        </div>
      )}
    </div>
  );
}
