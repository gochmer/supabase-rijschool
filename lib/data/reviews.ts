import "server-only";

import type { Review } from "@/lib/types";
import { getCurrentInstructeurRecord, getCurrentLeerlingRecord } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

type ReviewStatRow = {
  id: string;
  instructeur_id: string;
  score: number;
};

type PublicReviewRow = {
  id: string;
  score: number;
  titel: string | null;
  tekst: string | null;
  created_at: string;
  leerling_naam_snapshot: string | null;
};

type LessonReviewOpportunityRow = {
  id: string;
  titel: string;
  start_at: string | null;
  status: string;
  instructeur_id: string | null;
};

type ExistingLessonReviewRow = {
  id: string;
  les_id: string | null;
  score: number;
  titel: string | null;
  tekst: string | null;
  created_at: string;
};

export type InstructorReviewSummary = {
  averageScore: number;
  reviewCount: number;
  latestReviews: Review[];
};

export type LearnerReviewOpportunity = {
  lessonId: string;
  lessonTitle: string;
  lessonDate: string;
  lessonTime: string;
  instructorId: string;
  instructorName: string;
  instructorSlug: string;
  existingReview: {
    id: string;
    score: number;
    title: string;
    text: string;
    submittedAt: string;
  } | null;
};

function roundReviewScore(value: number) {
  return Math.round(value * 10) / 10;
}

function formatReviewDate(dateString: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(dateString));
}

function formatReviewTime(dateString: string | null) {
  if (!dateString) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(dateString));
}

function formatReviewScoreLabel(score: number) {
  return roundReviewScore(score).toFixed(1);
}

export async function getReviewStatsByInstructorIds(instructorIds: string[]) {
  const uniqueInstructorIds = Array.from(new Set(instructorIds.filter(Boolean)));

  if (!uniqueInstructorIds.length) {
    return new Map<string, { reviewCount: number; averageScore: number }>();
  }

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, instructeur_id, score")
    .in("instructeur_id", uniqueInstructorIds)
    .eq("verborgen", false);

  const groupedScores = new Map<string, number[]>();

  for (const row of (data ?? []) as ReviewStatRow[]) {
    const current = groupedScores.get(row.instructeur_id) ?? [];
    current.push(Number(row.score ?? 0));
    groupedScores.set(row.instructeur_id, current);
  }

  return new Map(
    Array.from(groupedScores.entries()).map(([instructorId, scores]) => [
      instructorId,
      {
        reviewCount: scores.length,
        averageScore: scores.length
          ? roundReviewScore(
              scores.reduce((sum, value) => sum + value, 0) / scores.length
            )
          : 0,
      },
    ])
  );
}

export async function getCurrentInstructorReviewSummary(): Promise<InstructorReviewSummary> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      averageScore: 0,
      reviewCount: 0,
      latestReviews: [],
    };
  }

  const [statsMap, supabase] = await Promise.all([
    getReviewStatsByInstructorIds([instructeur.id]),
    createServerClient(),
  ]);

  const { data: latestReviewRows } = await supabase
    .from("reviews")
    .select("id, score, titel, tekst, created_at, leerling_naam_snapshot")
    .eq("instructeur_id", instructeur.id)
    .eq("verborgen", false)
    .order("created_at", { ascending: false })
    .limit(2);

  const stats = statsMap.get(instructeur.id) ?? {
    reviewCount: 0,
    averageScore: 0,
  };

  return {
    averageScore: stats.averageScore,
    reviewCount: stats.reviewCount,
    latestReviews: ((latestReviewRows ?? []) as PublicReviewRow[]).map((row) => ({
      id: row.id,
      leerling_naam: row.leerling_naam_snapshot || "Leerling",
      score: Number(row.score ?? 0),
      titel: row.titel || `Review ${formatReviewScoreLabel(Number(row.score ?? 0))}`,
      tekst: row.tekst || "",
      datum: formatReviewDate(row.created_at),
    })),
  };
}

export async function getLearnerReviewOpportunities(): Promise<
  LearnerReviewOpportunity[]
> {
  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return [];
  }

  const supabase = await createServerClient();
  const { data: lessonRows, error } = await supabase
    .from("lessen")
    .select("id, titel, start_at, status, instructeur_id")
    .eq("leerling_id", leerling.id)
    .eq("status", "afgerond")
    .order("start_at", { ascending: false });

  if (error || !lessonRows?.length) {
    return [];
  }

  const instructorIds = lessonRows
    .map((row) => row.instructeur_id)
    .filter((value): value is string => Boolean(value));
  const lessonIds = lessonRows.map((row) => row.id);

  const [{ data: instructorRows }, { data: reviewRows }] = await Promise.all([
    instructorIds.length
      ? supabase
          .from("instructeurs")
          .select("id, volledige_naam, slug")
          .in("id", instructorIds)
      : Promise.resolve({ data: [] }),
    lessonIds.length
      ? supabase
          .from("reviews")
          .select("id, les_id, score, titel, tekst, created_at")
          .in("les_id", lessonIds)
      : Promise.resolve({ data: [] }),
  ]);

  const instructorMap = new Map(
    (instructorRows ?? []).map((row) => [
      row.id,
      {
        name: row.volledige_naam || "Instructeur",
        slug: row.slug || "",
      },
    ])
  );
  const reviewMap = new Map(
    ((reviewRows ?? []) as ExistingLessonReviewRow[])
      .filter((row) => row.les_id)
      .map((row) => [row.les_id as string, row])
  );

  return (lessonRows as LessonReviewOpportunityRow[])
    .filter((lesson) => lesson.instructeur_id && instructorMap.has(lesson.instructeur_id))
    .map((lesson) => {
      const instructor = instructorMap.get(lesson.instructeur_id as string)!;
      const existingReview = reviewMap.get(lesson.id);

      return {
        lessonId: lesson.id,
        lessonTitle: lesson.titel,
        lessonDate: lesson.start_at ? formatReviewDate(lesson.start_at) : "Les afgerond",
        lessonTime: formatReviewTime(lesson.start_at),
        instructorId: lesson.instructeur_id as string,
        instructorName: instructor.name,
        instructorSlug: instructor.slug,
        existingReview: existingReview
          ? {
              id: existingReview.id,
              score: Number(existingReview.score ?? 0),
              title: existingReview.titel || "",
              text: existingReview.tekst || "",
              submittedAt: formatReviewDate(existingReview.created_at),
            }
          : null,
      };
    });
}
