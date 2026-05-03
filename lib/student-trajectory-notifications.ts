import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyStudentTrajectorySignals } from "@/lib/notification-events";
import {
  isStudentProgressStatus,
  type StudentPackageTrajectoryInput,
} from "@/lib/student-progress";
import type { Database } from "@/lib/supabase/database.types";
import type {
  StudentProgressAssessment,
  StudentProgressLessonNote,
} from "@/lib/types";

type ServerSupabase = SupabaseClient<Database>;

type LessonUsageRow = {
  pakket_id: string | null;
  status: string | null;
};

type AssessmentRow = {
  id: string;
  leerling_id: string;
  instructeur_id: string;
  vaardigheid_key: string;
  beoordelings_datum: string;
  status: string;
  notitie?: string | null;
  created_at: string;
};

type LessonNoteRow = {
  id: string;
  leerling_id: string;
  instructeur_id: string;
  lesdatum: string;
  samenvatting?: string | null;
  sterk_punt?: string | null;
  focus_volgende_les?: string | null;
  created_at: string;
  updated_at: string;
};

const PLANNED_LESSON_STATUSES = new Set(["geaccepteerd", "ingepland"]);

function mapAssessmentRows(rows: AssessmentRow[]): StudentProgressAssessment[] {
  return rows
    .map((row): StudentProgressAssessment | null => {
      if (!isStudentProgressStatus(row.status)) {
        return null;
      }

      return {
        id: row.id,
        leerling_id: row.leerling_id,
        instructeur_id: row.instructeur_id,
        vaardigheid_key: row.vaardigheid_key,
        beoordelings_datum: row.beoordelings_datum,
        status: row.status,
        notitie: row.notitie ?? null,
        created_at: row.created_at,
      };
    })
    .filter((row): row is StudentProgressAssessment => Boolean(row));
}

function mapLessonNoteRows(rows: LessonNoteRow[]): StudentProgressLessonNote[] {
  return rows.map((row) => ({
    id: row.id,
    leerling_id: row.leerling_id,
    instructeur_id: row.instructeur_id,
    lesdatum: row.lesdatum,
    samenvatting: row.samenvatting ?? null,
    sterk_punt: row.sterk_punt ?? null,
    focus_volgende_les: row.focus_volgende_les ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function evaluateStudentTrajectorySignals({
  supabase,
  leerlingId,
  instructeurId,
  instructeurNaam,
}: {
  supabase: ServerSupabase;
  leerlingId: string | null | undefined;
  instructeurId: string | null | undefined;
  instructeurNaam?: string | null;
}) {
  if (!leerlingId || !instructeurId) {
    return;
  }

  const { data: leerling } = await supabase
    .from("leerlingen")
    .select("id, pakket_id")
    .eq("id", leerlingId)
    .maybeSingle();

  if (!leerling) {
    return;
  }

  const pakketId = leerling.pakket_id ?? null;
  const [pakketResult, assessmentsResult, notesResult] = await Promise.all([
    pakketId
      ? supabase
          .from("pakketten")
          .select("id, naam, aantal_lessen")
          .eq("id", pakketId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("leerling_voortgang_beoordelingen")
      .select(
        "id, leerling_id, instructeur_id, vaardigheid_key, beoordelings_datum, status, notitie, created_at"
      )
      .eq("leerling_id", leerlingId)
      .eq("instructeur_id", instructeurId),
    supabase
      .from("leerling_voortgang_lesnotities")
      .select(
        "id, leerling_id, instructeur_id, lesdatum, samenvatting, sterk_punt, focus_volgende_les, created_at, updated_at"
      )
      .eq("leerling_id", leerlingId)
      .eq("instructeur_id", instructeurId),
  ]);

  let lessonsQuery = supabase
    .from("lessen")
    .select("pakket_id, status")
    .eq("leerling_id", leerlingId)
    .eq("instructeur_id", instructeurId)
    .neq("status", "geannuleerd");

  if (pakketId) {
    lessonsQuery = lessonsQuery.eq("pakket_id", pakketId);
  }

  const { data: lessonRows } = await lessonsQuery;
  const lessons = (lessonRows ?? []) as LessonUsageRow[];
  const plannedLessons = lessons.filter((lesson) =>
    PLANNED_LESSON_STATUSES.has(lesson.status ?? "")
  ).length;
  const usedLessons = lessons.filter(
    (lesson) => lesson.status === "afgerond"
  ).length;
  const totalLessons = pakketResult.data?.aantal_lessen ?? null;
  const packageUsage: StudentPackageTrajectoryInput = {
    packageName: pakketResult.data?.naam ?? null,
    totalLessons,
    plannedLessons,
    usedLessons,
    remainingLessons:
      totalLessons != null
        ? Math.max(totalLessons - plannedLessons - usedLessons, 0)
        : null,
  };

  await notifyStudentTrajectorySignals({
    supabase,
    leerlingId,
    instructeurId,
    instructeurNaam,
    packageUsage,
    assessments: mapAssessmentRows(
      (assessmentsResult.data ?? []) as AssessmentRow[]
    ),
    notes: mapLessonNoteRows((notesResult.data ?? []) as LessonNoteRow[]),
  });
}
