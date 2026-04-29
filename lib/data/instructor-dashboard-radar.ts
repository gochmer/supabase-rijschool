import "server-only";

import {
  getStudentExamReadiness,
  getStudentProgressMomentum,
} from "@/lib/student-progress";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";
import { createServerClient } from "@/lib/supabase/server";

type RadarBadge = "success" | "warning" | "danger" | "info";

export type InstructorDashboardRadarItem = {
  leerlingId: string;
  naam: string;
  label: string;
  detail: string;
  badge: RadarBadge;
  href: string;
};

export type InstructorDashboardRadarInsights = {
  reactivation: InstructorDashboardRadarItem[];
  examReady: InstructorDashboardRadarItem[];
  noShowRisk: InstructorDashboardRadarItem[];
};

type LessonRadarRow = {
  leerling_id: string | null;
  attendance_status: string | null;
  start_at: string | null;
  status: string | null;
};

type CheckinRadarRow = {
  leerling_id: string;
  confidence_level: number | null;
  support_request: string | null;
  arrival_mode: "op_tijd" | "afstemmen" | null;
  learner_updated_at: string | null;
  updated_at: string;
};

function getDayDistance(dateValue: string | null | undefined) {
  if (!dateValue) {
    return 999;
  }

  const diff = Date.now() - new Date(dateValue).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getLatestDate(values: Array<string | null | undefined>) {
  const filtered = values.filter((value): value is string => Boolean(value));

  if (!filtered.length) {
    return null;
  }

  return [...filtered].sort((left, right) => right.localeCompare(left))[0];
}

function atNoon(dateValue: string | null | undefined) {
  if (!dateValue) {
    return null;
  }

  return `${dateValue}T12:00:00`;
}

export async function getInstructorDashboardRadarInsights() {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      reactivation: [],
      examReady: [],
      noShowRisk: [],
    } satisfies InstructorDashboardRadarInsights;
  }

  const supabase = await createServerClient();
  const [{ students, assessments, notes }, { data: lessonRows }, { data: checkinRows }] =
    (await Promise.all([
      getInstructeurStudentsWorkspace(),
      supabase
        .from("lessen")
        .select("leerling_id, attendance_status:aanwezigheid_status, start_at, status")
        .eq("instructeur_id", instructeur.id)
        .not("leerling_id", "is", null),
      supabase
        .from("les_checkins" as never)
        .select(
          "leerling_id, confidence_level, support_request, arrival_mode, learner_updated_at, updated_at"
        )
        .eq("instructeur_id", instructeur.id),
    ])) as unknown as [
      Awaited<ReturnType<typeof getInstructeurStudentsWorkspace>>,
      { data: LessonRadarRow[] | null },
      { data: CheckinRadarRow[] | null },
    ];

  const assessmentsByStudent = new Map<string, typeof assessments>();
  for (const assessment of assessments) {
    const current = assessmentsByStudent.get(assessment.leerling_id) ?? [];
    current.push(assessment);
    assessmentsByStudent.set(assessment.leerling_id, current);
  }

  const notesByStudent = new Map<string, typeof notes>();
  for (const note of notes) {
    const current = notesByStudent.get(note.leerling_id) ?? [];
    current.push(note);
    notesByStudent.set(note.leerling_id, current);
  }

  const lessonsByStudent = new Map<string, LessonRadarRow[]>();
  for (const lesson of lessonRows ?? []) {
    if (!lesson.leerling_id) {
      continue;
    }

    const current = lessonsByStudent.get(lesson.leerling_id) ?? [];
    current.push(lesson);
    lessonsByStudent.set(lesson.leerling_id, current);
  }

  const latestCheckinByStudent = new Map<string, CheckinRadarRow>();
  for (const checkin of checkinRows ?? []) {
    const current = latestCheckinByStudent.get(checkin.leerling_id);
    const currentDate = current?.learner_updated_at || current?.updated_at || "";
    const nextDate = checkin.learner_updated_at || checkin.updated_at || "";

    if (!current || nextDate > currentDate) {
      latestCheckinByStudent.set(checkin.leerling_id, checkin);
    }
  }

  const reactivation: InstructorDashboardRadarItem[] = [];
  const examReady: InstructorDashboardRadarItem[] = [];
  const noShowRisk: Array<InstructorDashboardRadarItem & { riskScore: number }> = [];

  for (const student of students) {
    const studentAssessments = assessmentsByStudent.get(student.id) ?? [];
    const studentNotes = notesByStudent.get(student.id) ?? [];
    const studentLessons = lessonsByStudent.get(student.id) ?? [];
    const latestCheckin = latestCheckinByStudent.get(student.id) ?? null;

    const latestPastLessonAt = getLatestDate(
      studentLessons
        .filter((lesson) => lesson.start_at && new Date(lesson.start_at).getTime() <= Date.now())
        .map((lesson) => lesson.start_at)
    );
    const latestNoteAt = getLatestDate(studentNotes.map((note) => atNoon(note.lesdatum)));
    const latestActivityAt = getLatestDate([
      student.laatsteBeoordelingAt ? atNoon(student.laatsteBeoordelingAt) : null,
      latestNoteAt,
      latestPastLessonAt,
    ]);

    const daysQuiet = getDayDistance(latestActivityAt);
    const hasUpcomingLesson =
      Boolean(student.volgendeLesAt) &&
      new Date(student.volgendeLesAt as string).getTime() > Date.now();

    if (!hasUpcomingLesson && (daysQuiet >= 12 || student.accountStatus === "uitgenodigd")) {
      reactivation.push({
        leerlingId: student.id,
        naam: student.naam,
        label:
          student.accountStatus === "uitgenodigd"
            ? "Nog niet opgestart"
            : `${daysQuiet} dagen stil`,
        detail:
          student.accountStatus === "uitgenodigd"
            ? "Deze leerling staat wel in je werkplek, maar het traject is nog niet echt gestart."
            : "Er staat geen nieuwe les klaar en de leerling heeft al een tijd geen zichtbaar vervolg gekregen.",
        badge:
          student.accountStatus === "uitgenodigd"
            ? "warning"
            : daysQuiet >= 21
              ? "danger"
              : "warning",
        href: "/instructeur/leerlingen",
      });
    }

    if (studentAssessments.length) {
      const examReadinessScore = getStudentExamReadiness(
        studentAssessments,
        studentNotes
      );

      if (examReadinessScore.score >= 62) {
        examReady.push({
          leerlingId: student.id,
          naam: student.naam,
          label: examReadinessScore.label,
          detail: examReadinessScore.nextMilestone,
          badge:
            examReadinessScore.score >= 82 ? "success" : examReadinessScore.badge,
          href: "/instructeur/leerlingen",
        });
      }
    }

    const momentum = getStudentProgressMomentum(studentAssessments, studentNotes);
    const absenceCount = studentLessons.filter(
      (lesson) => lesson.attendance_status === "afwezig"
    ).length;
    const lowConfidence = latestCheckin?.confidence_level != null && latestCheckin.confidence_level <= 2;
    const wantsCoordination = latestCheckin?.arrival_mode === "afstemmen";

    let riskScore = 0;

    if (absenceCount > 0) {
      riskScore += absenceCount * 24;
    }

    if (lowConfidence) {
      riskScore += 22;
    }

    if (wantsCoordination) {
      riskScore += 16;
    }

    if (!hasUpcomingLesson && daysQuiet >= 10) {
      riskScore += 14;
    }

    if (momentum.score < 45) {
      riskScore += 14;
    } else if (momentum.score < 55) {
      riskScore += 8;
    }

    if (latestCheckin?.support_request?.trim()) {
      riskScore += 8;
    }

    if (riskScore >= 24) {
      noShowRisk.push({
        leerlingId: student.id,
        naam: student.naam,
        label:
          riskScore >= 48 ? "Hoog risico op uitval" : "Let op ritme en aanwezigheid",
        detail:
          absenceCount > 0
            ? `${absenceCount} afwezig gemarkeerde les(sen), ${momentum.label.toLowerCase()} en recente signalen vragen extra opvolging.`
            : lowConfidence || wantsCoordination
              ? "De recente check-in laat weinig vertrouwen of extra afstemming zien vóór de les."
              : "De groeilijn en het lesritme vragen wat meer vasthouden om afhaakmomenten te voorkomen.",
        badge: riskScore >= 48 ? "danger" : "warning",
        href: "/instructeur/leerlingen",
        riskScore,
      });
    }
  }

  return {
    reactivation: reactivation.slice(0, 4),
    examReady: examReady
      .sort((left, right) => {
        const leftReady = left.badge === "success" ? 1 : 0;
        const rightReady = right.badge === "success" ? 1 : 0;
        return rightReady - leftReady;
      })
      .slice(0, 4),
    noShowRisk: noShowRisk
      .sort((left, right) => right.riskScore - left.riskScore)
      .map((item) => ({
        leerlingId: item.leerlingId,
        naam: item.naam,
        label: item.label,
        detail: item.detail,
        badge: item.badge,
        href: item.href,
      }))
      .slice(0, 4),
  } satisfies InstructorDashboardRadarInsights;
}
