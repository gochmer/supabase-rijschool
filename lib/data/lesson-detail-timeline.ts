import "server-only";

import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import { createServerClient } from "@/lib/supabase/server";
import {
  getStudentProgressItem,
  isStudentProgressStatus,
} from "@/lib/student-progress";
import type {
  LessonDetailTimelineSummary,
  StudentProgressStatus,
} from "@/lib/types";

type LessonProgressAssessmentRow = {
  les_id: string | null;
  status: string | null;
  vaardigheid_key: string | null;
  created_at: string | null;
};

type LessonProgressNoteRow = {
  les_id: string | null;
  samenvatting: string | null;
  sterk_punt: string | null;
  focus_volgende_les: string | null;
  updated_at: string | null;
  created_at: string | null;
};

function createStatusCounts(): Record<StudentProgressStatus, number> {
  return {
    begeleid: 0,
    herhaling: 0,
    uitleg: 0,
    zelfstandig: 0,
  };
}

function createSummary(lessonId: string): LessonDetailTimelineSummary {
  return {
    latest_progress_label: null,
    latest_progress_status: null,
    les_id: lessonId,
    lesson_note_focus: null,
    lesson_note_strength: null,
    lesson_note_summary: null,
    lesson_note_updated_at: null,
    progress_mark_count: 0,
    progress_status_counts: createStatusCounts(),
  };
}

function getSummary(
  summaries: Map<string, LessonDetailTimelineSummary>,
  lessonId: string,
) {
  const current = summaries.get(lessonId);

  if (current) {
    return current;
  }

  const next = createSummary(lessonId);
  summaries.set(lessonId, next);
  return next;
}

function toDateFilter(value?: string | null) {
  return value ? value.slice(0, 10) : null;
}

function getUpdatedTime(value?: string | null) {
  if (!value) {
    return 0;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export async function getCurrentInstructorLessonDetailTimelineSummaries({
  from,
  limit = 720,
  to,
}: {
  from?: string | null;
  limit?: number;
  to?: string | null;
} = {}): Promise<LessonDetailTimelineSummary[]> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const fromDate = toDateFilter(from);
  const toDate = toDateFilter(to);
  const safeLimit = Math.min(Math.max(limit, 1), 1200);
  const supabase = await createServerClient();

  let assessmentQuery = supabase
    .from("leerling_voortgang_beoordelingen")
    .select("les_id, status, vaardigheid_key, created_at")
    .eq("instructeur_id", instructeur.id)
    .not("les_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (fromDate) {
    assessmentQuery = assessmentQuery.gte("beoordelings_datum", fromDate);
  }

  if (toDate) {
    assessmentQuery = assessmentQuery.lte("beoordelings_datum", toDate);
  }

  let noteQuery = supabase
    .from("leerling_voortgang_lesnotities")
    .select(
      "les_id, samenvatting, sterk_punt, focus_volgende_les, updated_at, created_at",
    )
    .eq("instructeur_id", instructeur.id)
    .not("les_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(safeLimit);

  if (fromDate) {
    noteQuery = noteQuery.gte("lesdatum", fromDate);
  }

  if (toDate) {
    noteQuery = noteQuery.lte("lesdatum", toDate);
  }

  const [assessmentsResult, notesResult] = (await Promise.all([
    assessmentQuery,
    noteQuery,
  ])) as unknown as [
    { data: LessonProgressAssessmentRow[] | null; error?: unknown },
    { data: LessonProgressNoteRow[] | null; error?: unknown },
  ];

  if (assessmentsResult.error) {
    logSupabaseDataError(
      "lessonDetailTimeline.assessments",
      assessmentsResult.error,
      {
        from: fromDate,
        instructeurId: instructeur.id,
        limit: safeLimit,
        to: toDate,
      },
    );
  }

  if (notesResult.error) {
    logSupabaseDataError("lessonDetailTimeline.notes", notesResult.error, {
      from: fromDate,
      instructeurId: instructeur.id,
      limit: safeLimit,
      to: toDate,
    });
  }

  const summaries = new Map<string, LessonDetailTimelineSummary>();
  const latestAssessmentTimeByLesson = new Map<string, number>();

  for (const row of assessmentsResult.data ?? []) {
    if (!row.les_id || !row.status || !isStudentProgressStatus(row.status)) {
      continue;
    }

    const summary = getSummary(summaries, row.les_id);
    summary.progress_mark_count += 1;
    summary.progress_status_counts[row.status] += 1;

    const createdTime = getUpdatedTime(row.created_at);
    const currentLatest = latestAssessmentTimeByLesson.get(row.les_id) ?? 0;

    if (createdTime >= currentLatest) {
      latestAssessmentTimeByLesson.set(row.les_id, createdTime);
      summary.latest_progress_status = row.status;
      summary.latest_progress_label =
        getStudentProgressItem(row.vaardigheid_key ?? "")?.label ??
        row.vaardigheid_key ??
        null;
    }
  }

  const latestNoteTimeByLesson = new Map<string, number>();

  for (const row of notesResult.data ?? []) {
    if (!row.les_id) {
      continue;
    }

    const updatedTime = getUpdatedTime(row.updated_at ?? row.created_at);
    const currentLatest = latestNoteTimeByLesson.get(row.les_id) ?? 0;

    if (updatedTime < currentLatest) {
      continue;
    }

    latestNoteTimeByLesson.set(row.les_id, updatedTime);
    const summary = getSummary(summaries, row.les_id);
    summary.lesson_note_focus = row.focus_volgende_les;
    summary.lesson_note_strength = row.sterk_punt;
    summary.lesson_note_summary = row.samenvatting;
    summary.lesson_note_updated_at = row.updated_at ?? row.created_at;
  }

  return Array.from(summaries.values()).sort((left, right) =>
    left.les_id.localeCompare(right.les_id),
  );
}
