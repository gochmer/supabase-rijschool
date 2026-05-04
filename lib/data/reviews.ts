import "server-only";

import type { Review, ReviewPreview } from "@/lib/types";
import {
  getCurrentInstructeurRecord,
  getCurrentLeerlingRecord,
} from "@/lib/data/profiles";
import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import { createServerClient } from "@/lib/supabase/server";

type ReviewStatRow = {
  id: string;
  instructeur_id: string;
  score: number;
};

type PublicReviewRow = {
  id: string;
  instructeur_id?: string;
  score: number;
  titel: string | null;
  tekst: string | null;
  created_at: string;
  leerling_naam_snapshot: string | null;
  antwoord_tekst?: string | null;
  antwoord_datum?: string | null;
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

type ReviewReportAggregateRow = {
  review_id: string;
  reden: string | null;
  created_at: string;
};

export type InstructorReviewSummary = {
  averageScore: number;
  reviewCount: number;
  latestReviews: Review[];
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  repliedCount: number;
  replyRate: number;
  reportedCount: number;
  recentThirtyDayCount: number;
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

function createEmptyDistribution(): Record<1 | 2 | 3 | 4 | 5, number> {
  return {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
}

function mapReviewPreview(row: PublicReviewRow): ReviewPreview {
  return {
    id: row.id,
    leerling_naam: row.leerling_naam_snapshot || "Leerling",
    score: Number(row.score ?? 0),
    titel: row.titel || `Review ${formatReviewScoreLabel(Number(row.score ?? 0))}`,
    tekst: row.tekst || "",
    datum: formatReviewDate(row.created_at),
  };
}

function mapReview(
  row: PublicReviewRow,
  reportMeta?: {
    reportCount: number;
    latestReason: string | null;
  }
): Review {
  return {
    id: row.id,
    leerling_naam: row.leerling_naam_snapshot || "Leerling",
    score: Number(row.score ?? 0),
    titel: row.titel || `Review ${formatReviewScoreLabel(Number(row.score ?? 0))}`,
    tekst: row.tekst || "",
    datum: formatReviewDate(row.created_at),
    antwoord_tekst: row.antwoord_tekst || null,
    antwoord_datum: row.antwoord_datum ? formatReviewDate(row.antwoord_datum) : null,
    rapport_count: reportMeta?.reportCount ?? 0,
    laatste_rapport_reden: reportMeta?.latestReason ?? null,
  };
}

async function getReviewReportMetaByReviewIds(reviewIds: string[]) {
  const uniqueReviewIds = Array.from(new Set(reviewIds.filter(Boolean)));

  if (!uniqueReviewIds.length) {
    return new Map<string, { reportCount: number; latestReason: string | null }>();
  }

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("review_reports")
    .select("review_id, reden, created_at")
    .in("review_id", uniqueReviewIds)
    .order("created_at", { ascending: false });

  const reportMap = new Map<string, { reportCount: number; latestReason: string | null }>();

  for (const row of (data ?? []) as ReviewReportAggregateRow[]) {
    const current = reportMap.get(row.review_id);

    if (!current) {
      reportMap.set(row.review_id, {
        reportCount: 1,
        latestReason: row.reden || null,
      });
      continue;
    }

    current.reportCount += 1;
  }

  return reportMap;
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
      distribution: createEmptyDistribution(),
      repliedCount: 0,
      replyRate: 0,
      reportedCount: 0,
      recentThirtyDayCount: 0,
    };
  }

  const [statsMap, supabase] = await Promise.all([
    getReviewStatsByInstructorIds([instructeur.id]),
    createServerClient(),
  ]);

  const { data: latestReviewRows } = await supabase
    .from("reviews")
    .select(
      "id, score, titel, tekst, created_at, leerling_naam_snapshot, antwoord_tekst, antwoord_datum"
    )
    .eq("instructeur_id", instructeur.id)
    .eq("verborgen", false)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: allVisibleReviewRows } = await supabase
    .from("reviews")
    .select(
      "id, score, titel, tekst, created_at, leerling_naam_snapshot, antwoord_tekst, antwoord_datum"
    )
    .eq("instructeur_id", instructeur.id)
    .eq("verborgen", false)
    .order("created_at", { ascending: false });

  const stats = statsMap.get(instructeur.id) ?? {
    reviewCount: 0,
    averageScore: 0,
  };

  const allReviews = (allVisibleReviewRows ?? []) as PublicReviewRow[];
  const distribution = createEmptyDistribution();
  let repliedCount = 0;
  let recentThirtyDayCount = 0;

  for (const row of allReviews) {
    const score = Math.min(5, Math.max(1, Number(row.score ?? 0))) as
      | 1
      | 2
      | 3
      | 4
      | 5;
    distribution[score] += 1;

    if (row.antwoord_tekst?.trim()) {
      repliedCount += 1;
    }

    const createdAt = new Date(row.created_at).getTime();
    if (createdAt >= Date.now() - 30 * 24 * 60 * 60 * 1000) {
      recentThirtyDayCount += 1;
    }
  }

  const reportMetaMap = await getReviewReportMetaByReviewIds(
    allReviews.map((review) => review.id)
  );
  const reportedCount = Array.from(reportMetaMap.values()).reduce(
    (total, entry) => total + entry.reportCount,
    0
  );

  return {
    averageScore: stats.averageScore,
    reviewCount: stats.reviewCount,
    latestReviews: ((latestReviewRows ?? []) as PublicReviewRow[]).map((row) =>
      mapReview(row, reportMetaMap.get(row.id))
    ),
    distribution,
    repliedCount,
    replyRate: stats.reviewCount
      ? Math.round((repliedCount / stats.reviewCount) * 100)
      : 0,
    reportedCount,
    recentThirtyDayCount,
  };
}

export async function getCurrentInstructorProfileReviewData({
  fallbackAverageScore,
  latestLimit = 6,
}: {
  fallbackAverageScore?: number | string | null;
  latestLimit?: number;
} = {}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      averageScore: 0,
      latestReviews: [] as Review[],
      recentThirtyDayCount: 0,
      repliedCount: 0,
      replyRate: 0,
      reviewCount: 0,
    };
  }

  const supabase = await createServerClient();
  const { count, data: latestReviewRows } = await supabase
    .from("reviews")
    .select(
      "id, score, titel, tekst, created_at, leerling_naam_snapshot, antwoord_tekst, antwoord_datum",
      { count: "exact" },
    )
    .eq("instructeur_id", instructeur.id)
    .eq("verborgen", false)
    .order("created_at", { ascending: false })
    .limit(latestLimit);

  const latestReviews = (latestReviewRows ?? []) as PublicReviewRow[];
  const reviewCount = count ?? latestReviews.length;
  const repliedCount = latestReviews.filter((row) =>
    row.antwoord_tekst?.trim(),
  ).length;
  const recentThirtyDayCount = latestReviews.filter((row) => {
    const createdAt = new Date(row.created_at).getTime();
    return createdAt >= Date.now() - 30 * 24 * 60 * 60 * 1000;
  }).length;
  const averageScore = roundReviewScore(
    Number(fallbackAverageScore ?? instructeur.beoordeling ?? 0),
  );

  return {
    averageScore,
    latestReviews: latestReviews.map((row) => mapReview(row)),
    recentThirtyDayCount,
    repliedCount,
    replyRate: latestReviews.length
      ? Math.round((repliedCount / latestReviews.length) * 100)
      : 0,
    reviewCount,
  };
}

export async function getCurrentInstructorReviews(): Promise<Review[]> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  const { data: reviewRows } = await supabase
    .from("reviews")
    .select(
      "id, score, titel, tekst, created_at, leerling_naam_snapshot, antwoord_tekst, antwoord_datum"
    )
    .eq("instructeur_id", instructeur.id)
    .eq("verborgen", false)
    .order("created_at", { ascending: false });

  const reviews = (reviewRows ?? []) as PublicReviewRow[];
  const reportMetaMap = await getReviewReportMetaByReviewIds(
    reviews.map((review) => review.id)
  );

  return reviews.map((review) => mapReview(review, reportMetaMap.get(review.id)));
}

export async function getLatestVisibleReviewsByInstructorIds(
  instructorIds: string[]
) {
  const uniqueInstructorIds = Array.from(new Set(instructorIds.filter(Boolean)));

  if (!uniqueInstructorIds.length) {
    return new Map<string, ReviewPreview>();
  }

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("reviews")
    .select(
      "id, instructeur_id, score, titel, tekst, created_at, leerling_naam_snapshot"
    )
    .in("instructeur_id", uniqueInstructorIds)
    .eq("verborgen", false)
    .order("created_at", { ascending: false });

  const previewMap = new Map<string, ReviewPreview>();

  for (const row of (data ?? []) as PublicReviewRow[]) {
    if (!row.instructeur_id || previewMap.has(row.instructeur_id)) {
      continue;
    }

    previewMap.set(row.instructeur_id, mapReviewPreview(row));
  }

  return previewMap;
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

  if (error) {
    logSupabaseDataError("reviews.learnerOpportunities", error, {
      leerlingId: leerling.id,
    });
    return [];
  }

  if (!lessonRows?.length) {
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
