import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import {
  resolveDriverJourneyState,
  type DriverJourneyState,
} from "@/lib/driver-journey";
import { getStudentExamReadiness } from "@/lib/student-progress";
import type {
  StudentProgressAssessment,
  StudentProgressLessonNote,
} from "@/lib/types";

type JourneyLessonRow = {
  id: string;
  titel: string | null;
  start_at: string | null;
  status: string | null;
  aanwezigheid_status: string | null;
};

type JourneyLearnerRow = {
  id: string;
  pakket_id: string | null;
  student_status: string | null;
  student_status_reason: string | null;
};

function isFutureExamLesson(lesson: JourneyLessonRow) {
  const title = (lesson.titel ?? "").toLowerCase();
  const startsAt = lesson.start_at ? new Date(lesson.start_at) : null;
  const isFuture =
    startsAt && !Number.isNaN(startsAt.getTime())
      ? startsAt.getTime() >= Date.now()
      : false;

  return (
    isFuture &&
    ["geaccepteerd", "ingepland"].includes(lesson.status ?? "") &&
    (title.includes("examen") || title.includes("proefexamen"))
  );
}

export async function syncStudentDriverJourneyStatus(
  leerlingId: string | null | undefined,
): Promise<DriverJourneyState | null> {
  if (!leerlingId) {
    return null;
  }

  const supabase = await createServerClient();
  const [learnerResult, lessonsResult, assessmentsResult, notesResult] =
    await Promise.all([
      supabase
        .from("leerlingen")
        .select("id, pakket_id, student_status, student_status_reason")
        .eq("id", leerlingId)
        .maybeSingle(),
      supabase
        .from("lessen")
        .select("id, titel, start_at, status, aanwezigheid_status")
        .eq("leerling_id", leerlingId)
        .order("start_at", { ascending: false })
        .limit(240),
      supabase
        .from("leerling_voortgang_beoordelingen")
        .select(
          "id, leerling_id, instructeur_id, les_id, vaardigheid_key, beoordelings_datum, status, notitie, created_at",
        )
        .eq("leerling_id", leerlingId)
        .order("beoordelings_datum", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(400),
      supabase
        .from("leerling_voortgang_lesnotities")
        .select(
          "id, leerling_id, instructeur_id, les_id, lesdatum, samenvatting, sterk_punt, focus_volgende_les, created_at, updated_at",
        )
        .eq("leerling_id", leerlingId)
        .order("lesdatum", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(160),
    ]);

  const learner = learnerResult.data as JourneyLearnerRow | null;

  if (!learner) {
    return null;
  }

  const lessons = (lessonsResult.data ?? []) as JourneyLessonRow[];
  const assessments =
    ((assessmentsResult.data ?? []) as StudentProgressAssessment[]) ?? [];
  const notes =
    ((notesResult.data ?? []) as StudentProgressLessonNote[]) ?? [];
  const examReadiness = getStudentExamReadiness(assessments, notes);
  const activeLessons = lessons.filter((lesson) =>
    ["geaccepteerd", "ingepland"].includes(lesson.status ?? ""),
  );
  const completedLessons = lessons.filter(
    (lesson) => lesson.status === "afgerond",
  );
  const state = resolveDriverJourneyState({
    completedLessons: completedLessons.length,
    currentStatus: learner.student_status,
    examReadinessScore: examReadiness.score,
    hasExamLessonPlanned: lessons.some(isFutureExamLesson),
    hasPackage: Boolean(learner.pakket_id),
    hasPlannedLessons: activeLessons.length > 0,
    hasRequest: lessons.length > 0,
    profileComplete: true,
  });

  if (
    learner.student_status !== state.status ||
    learner.student_status_reason !== state.reason
  ) {
    await supabase
      .from("leerlingen")
      .update({
        student_status: state.status,
        student_status_reason: state.reason,
        student_status_updated_at: new Date().toISOString(),
      })
      .eq("id", leerlingId);
  }

  return state;
}
