import "server-only";

import { parseRequestWindow } from "@/lib/booking-availability";
import type {
  InstructorDashboardProgressSignals,
  InstructorDashboardProgressSignalStudent,
  InstructorStudentProgressRow,
  StudentProgressAssessment,
  StudentProgressLessonNote,
} from "@/lib/types";
import {
  getCurrentInstructeurRecord,
  getCurrentLeerlingRecord,
} from "@/lib/data/profiles";
import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import {
  calculateStudentProgressPercentage,
  getStudentExamReadiness,
  getStudentProgressSummary,
} from "@/lib/student-progress";
import { resolveDriverJourneyState } from "@/lib/driver-journey";
import {
  addBookedMinutesForWeek,
  getRemainingWeeklyBookingMinutes,
  getWeeklyBookingWindow,
  resolveEffectiveWeeklyBookingLimit,
} from "@/lib/self-scheduling-limits";
import { extractLessonRequestReference } from "@/lib/lesson-request-flow";

type InstructorStudentLessonRow = {
  leerling_id: string | null;
  pakket_id: string | null;
  start_at: string | null;
  duur_minuten: number;
  status: string;
  titel?: string | null;
  notities: string | null;
};

type InstructorStudentRequestRow = {
  id: string;
  leerling_id: string | null;
  status: string | null;
  pakket_naam_snapshot: string | null;
  created_at: string;
  voorkeursdatum: string | null;
  tijdvak: string | null;
};

type InstructorStudentLinkRow = {
  leerling_id: string | null;
  created_at: string;
  bron: string | null;
  onboarding_notitie: string | null;
  intake_checklist_keys: string[] | null;
};

type InstructorDashboardStudentLinkRow = {
  leerling_id: string | null;
  created_at: string;
};

type InstructorDashboardStudentSummaryEmbeddedProfile = {
  volledige_naam: string | null;
  email: string | null;
  telefoon: string | null;
};

type InstructorDashboardStudentSummaryEmbeddedStudent = InstructorStudentRow & {
  profile: InstructorDashboardStudentSummaryEmbeddedProfile | null;
};

type InstructorDashboardStudentSummaryEmbeddedLinkRow = {
  leerling_id: string | null;
  created_at: string;
  leerling: InstructorDashboardStudentSummaryEmbeddedStudent | null;
};

type StudentSchedulingAccessRow = {
  leerling_id: string;
  zelf_inplannen_toegestaan: boolean;
  zelf_inplannen_limiet_minuten_per_week: number | null;
  zelf_inplannen_limiet_is_handmatig: boolean;
};

type StudentSchedulingAccessListBuilder = {
  select: (columns: string) => {
    eq: (
      column: string,
      value: string,
    ) => {
      in: (
        column: string,
        values: string[],
      ) => Promise<{
        data: StudentSchedulingAccessRow[] | null;
      }>;
    };
  };
};

type InstructorStudentRow = {
  id: string;
  profile_id: string;
  voortgang_percentage: number;
  pakket_id: string | null;
  student_status?: string | null;
};

type InstructorStudentPackageRow = {
  id: string;
  naam: string;
  aantal_lessen: number | null;
  zelf_inplannen_limiet_minuten_per_week: number | null;
};

export async function getInstructorStudentCount(instructorId: string) {
  const supabase = await createServerClient();
  const { count, error } = await supabase
    .from("instructeur_leerling_koppelingen" as never)
    .select("leerling_id", { count: "exact", head: true })
    .eq("instructeur_id" as never, instructorId as never);

  if (error) {
    logSupabaseDataError("studentProgress.instructorStudentCount", error, {
      instructorId,
    });
    return 0;
  }

  return count ?? 0;
}

type StudentProgressLessonNoteRow = {
  id: string;
  leerling_id: string;
  instructeur_id: string;
  les_id?: string | null;
  lesdatum: string;
  samenvatting: string | null;
  sterk_punt: string | null;
  focus_volgende_les: string | null;
  created_at: string;
  updated_at: string;
};

type ProgressInstructorRow = {
  id: string;
  profile_id: string;
};

function isDashboardProgressSignalStudent(
  value: InstructorDashboardProgressSignalStudent | null,
): value is InstructorDashboardProgressSignalStudent {
  return Boolean(value);
}

type StudentAuthState = {
  accountStatus: "uitgenodigd" | "actief";
  lastSignInAt: string | null;
};

const ACTIVE_PLANNING_REQUEST_STATUSES = [
  "geaccepteerd",
  "ingepland",
  "afgerond",
] as const;

function formatLongDate(dateValue: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(dateValue));
}

function formatRelativeOrFallback(dateValue: string | null | undefined) {
  if (!dateValue) {
    return "Nog niet gepland";
  }

  return formatLongDate(dateValue);
}

function getRequestStatusLabel(status: string | null) {
  switch (status) {
    case "aangevraagd":
      return "Nieuwe aanvraag";
    case "geaccepteerd":
      return "Aanvraag geaccepteerd";
    case "ingepland":
      return "Les ingepland";
    case "afgerond":
      return "Actief traject";
    default:
      return "Actief traject";
  }
}

function hasFutureExamLesson(lessons: InstructorStudentLessonRow[]) {
  return lessons.some((lesson) => {
    const title = (lesson.titel ?? "").toLowerCase();
    const startsAt = lesson.start_at ? new Date(lesson.start_at) : null;
    const isFuture =
      startsAt && !Number.isNaN(startsAt.getTime())
        ? startsAt.getTime() >= Date.now()
        : false;

    return (
      isFuture &&
      ["geaccepteerd", "ingepland"].includes(lesson.status) &&
      (title.includes("examen") || title.includes("proefexamen"))
    );
  });
}

function getJourneyFields({
  completedLessons,
  currentStatus,
  examReadinessScore,
  hasPackage,
  hasPlannedLessons,
  hasRequest,
  lessons,
}: {
  completedLessons: number;
  currentStatus?: string | null;
  examReadinessScore: number;
  hasPackage: boolean;
  hasPlannedLessons: boolean;
  hasRequest: boolean;
  lessons: InstructorStudentLessonRow[];
}) {
  const journey = resolveDriverJourneyState({
    completedLessons,
    currentStatus,
    examReadinessScore,
    hasExamLessonPlanned: hasFutureExamLesson(lessons),
    hasPackage,
    hasPlannedLessons,
    hasRequest,
  });

  return {
    journeyLabel: journey.label,
    journeyNextAction: journey.nextAction,
    journeyStatus: journey.status,
    journeyTone: journey.tone,
  };
}

export async function getInstructeurDashboardStudents({
  lessonLimit = 320,
}: {
  lessonLimit?: number;
} = {}): Promise<InstructorStudentProgressRow[]> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  const [linksResult, lessonsResult] = (await Promise.all([
    supabase
      .from("instructeur_leerling_koppelingen" as never)
      .select("leerling_id, created_at")
      .eq("instructeur_id" as never, instructeur.id as never)
      .not("leerling_id" as never, "is", null),
    supabase
      .from("lessen")
      .select("leerling_id, pakket_id, titel, start_at, duur_minuten, status, notities")
      .eq("instructeur_id", instructeur.id)
      .not("leerling_id", "is", null)
      .order("start_at", { ascending: false })
      .limit(lessonLimit),
  ])) as unknown as [
    { data: InstructorDashboardStudentLinkRow[] | null; error?: unknown },
    { data: InstructorStudentLessonRow[] | null; error?: unknown },
  ];

  const initialError = linksResult.error || lessonsResult.error;
  if (initialError) {
    logSupabaseDataError("studentProgress.dashboardStudents.initial", initialError, {
      instructeurId: instructeur.id,
    });
    return [];
  }

  const linkRows = linksResult.data ?? [];
  const lessonRows = lessonsResult.data ?? [];
  const leerlingIds = Array.from(
    new Set(
      [...linkRows, ...lessonRows]
        .map((row) => row.leerling_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (!leerlingIds.length) {
    return [];
  }

  const { data: leerlingenRows, error: leerlingenError } = (await supabase
    .from("leerlingen")
    .select("id, profile_id, voortgang_percentage, pakket_id, student_status")
    .in("id", leerlingIds)) as unknown as {
    data: InstructorStudentRow[] | null;
    error?: unknown;
  };

  if (leerlingenError) {
    logSupabaseDataError("studentProgress.dashboardStudents.students", leerlingenError, {
      instructeurId: instructeur.id,
      studentCount: leerlingIds.length,
    });
    return [];
  }

  const profileIds = (leerlingenRows ?? []).map((row) => row.profile_id);
  const packageIds = (leerlingenRows ?? [])
    .map((row) => row.pakket_id)
    .filter((value): value is string => Boolean(value));

  const [profilesResult, packagesResult] = await Promise.all([
    profileIds.length
      ? supabase
          .from("profiles")
          .select("id, volledige_naam, email, telefoon")
          .in("id", profileIds)
      : Promise.resolve({ data: [] }),
    packageIds.length
      ? (supabase
          .from("pakketten")
          .select("id, naam, aantal_lessen, zelf_inplannen_limiet_minuten_per_week")
          .in("id", packageIds) as unknown as Promise<{
          data: InstructorStudentPackageRow[] | null;
        }>)
      : Promise.resolve({ data: [] }),
  ]);
  const relationError =
    (profilesResult as { error?: unknown }).error ||
    (packagesResult as { error?: unknown }).error;
  if (relationError) {
    logSupabaseDataError("studentProgress.dashboardStudents.relations", relationError, {
      instructeurId: instructeur.id,
      studentCount: leerlingIds.length,
    });
  }

  const profileMap = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
  );
  const packageMap = new Map(
    (packagesResult.data ?? []).map((pkg) => [pkg.id, pkg]),
  );
  const linksByStudent = new Map(
    linkRows
      .filter((row) => row.leerling_id)
      .map((row) => [row.leerling_id as string, row]),
  );
  const lessonsByStudent = new Map<string, InstructorStudentLessonRow[]>();

  for (const lesson of lessonRows) {
    if (!lesson.leerling_id) {
      continue;
    }

    const current = lessonsByStudent.get(lesson.leerling_id) ?? [];
    current.push(lesson);
    lessonsByStudent.set(lesson.leerling_id, current);
  }

  const nowMs = Date.now();

  return (leerlingenRows ?? [])
    .map((student) => {
      const profile = profileMap.get(student.profile_id);
      const relatedLessons = lessonsByStudent.get(student.id) ?? [];
      const link = linksByStudent.get(student.id) ?? null;
      const assignedPackage = student.pakket_id
        ? packageMap.get(student.pakket_id) ?? null
        : null;
      const nextLesson = [...relatedLessons]
        .filter((lesson) => lesson.start_at)
        .sort((left, right) =>
          (left.start_at ?? "").localeCompare(right.start_at ?? ""),
        )
        .find((lesson) => {
          if (!lesson.start_at) {
            return false;
          }

          return new Date(lesson.start_at).getTime() >= nowMs;
        });
      const packageLessons = relatedLessons.filter(
        (lesson) =>
          lesson.status !== "geannuleerd" &&
          Boolean(student.pakket_id) &&
          lesson.pakket_id === student.pakket_id,
      );
      const pakketIngeplandeLessen = packageLessons.filter((lesson) =>
        ["geaccepteerd", "ingepland"].includes(lesson.status),
      ).length;
      const pakketGevolgdeLessen = packageLessons.filter(
        (lesson) => lesson.status === "afgerond",
      ).length;
      const pakketTotaalLessen = assignedPackage?.aantal_lessen ?? null;
      const pakketResterendeLessen =
        pakketTotaalLessen && pakketTotaalLessen > 0
          ? Math.max(
              pakketTotaalLessen -
                pakketIngeplandeLessen -
                pakketGevolgdeLessen,
              0,
            )
          : null;
      const completedLessons = relatedLessons.filter(
        (lesson) => lesson.status === "afgerond",
      ).length;
      const journeyFields = getJourneyFields({
        completedLessons,
        currentStatus: student.student_status,
        examReadinessScore: Number(student.voortgang_percentage ?? 0),
        hasPackage: Boolean(student.pakket_id),
        hasPlannedLessons: relatedLessons.some((lesson) =>
          ["geaccepteerd", "ingepland"].includes(lesson.status),
        ),
        hasRequest: relatedLessons.length > 0,
        lessons: relatedLessons,
      });

      return {
        id: student.id,
        profileId: student.profile_id,
        naam: profile?.volledige_naam ?? "Leerling",
        pakket: assignedPackage?.naam ?? "Nog geen pakket",
        pakketId: student.pakket_id ?? null,
        voortgang: Number(student.voortgang_percentage ?? 0),
        volgendeLes: formatRelativeOrFallback(nextLesson?.start_at),
        volgendeLesAt: nextLesson?.start_at ?? null,
        laatsteBeoordeling: "Niet geladen",
        laatsteBeoordelingAt: null,
        gekoppeldeLessen: relatedLessons.length,
        voltooideLessen: completedLessons,
        pakketTotaalLessen,
        pakketIngeplandeLessen,
        pakketGevolgdeLessen,
        pakketResterendeLessen,
        pakketPlanningGeblokkeerd: !student.pakket_id,
        aanvraagStatus: link ? "Handmatig gekoppeld" : "Actief traject",
        email: profile?.email ?? "",
        telefoon: profile?.telefoon ?? "",
        gekoppeldSinds: link?.created_at ?? null,
        planningVrijTeGeven: Boolean(student.pakket_id),
        isHandmatigGekoppeld: Boolean(link),
        ...journeyFields,
      } satisfies InstructorStudentProgressRow;
    })
    .sort((left, right) => left.naam.localeCompare(right.naam));
}

export async function getInstructeurDashboardStudentSummary({
  limit = 24,
}: {
  limit?: number;
} = {}): Promise<InstructorStudentProgressRow[]> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  const { data: linkRows, error } = (await supabase
    .from("instructeur_leerling_koppelingen" as never)
    .select(
      `
        leerling_id,
        created_at,
        leerling:leerlingen!instructeur_leerling_koppelingen_leerling_id_fkey(
          id,
          profile_id,
          voortgang_percentage,
          pakket_id,
          student_status,
          profile:profiles!leerlingen_profile_id_fkey(
            volledige_naam,
            email,
            telefoon
          )
        )
      `,
    )
    .eq("instructeur_id" as never, instructeur.id as never)
    .not("leerling_id" as never, "is", null)
    .order("created_at" as never, { ascending: false } as never)
    .limit(limit)) as unknown as {
    data: InstructorDashboardStudentSummaryEmbeddedLinkRow[] | null;
    error?: unknown;
  };

  if (error) {
    logSupabaseDataError("studentProgress.dashboardStudentSummary", error, {
      instructeurId: instructeur.id,
      limit,
    });
    return [];
  }

  const links = (linkRows ?? []).filter(
    (
      row,
    ): row is InstructorDashboardStudentSummaryEmbeddedLinkRow & {
      leerling: InstructorDashboardStudentSummaryEmbeddedStudent;
    } => Boolean(row.leerling),
  );

  if (!links.length) {
    return [];
  }

  return links
    .map((link) => {
      const student = link.leerling;
      const profile = student.profile;
      const journeyFields = getJourneyFields({
        completedLessons: 0,
        currentStatus: student.student_status,
        examReadinessScore: Number(student.voortgang_percentage ?? 0),
        hasPackage: Boolean(student.pakket_id),
        hasPlannedLessons: false,
        hasRequest: false,
        lessons: [],
      });

      return {
        id: student.id,
        profileId: student.profile_id,
        naam: profile?.volledige_naam ?? "Leerling",
        pakket: student.pakket_id ? "Pakket gekoppeld" : "Nog geen pakket",
        pakketId: student.pakket_id ?? null,
        voortgang: Number(student.voortgang_percentage ?? 0),
        volgendeLes: "Niet geladen",
        volgendeLesAt: null,
        laatsteBeoordeling: "Niet geladen",
        laatsteBeoordelingAt: null,
        gekoppeldeLessen: 0,
        voltooideLessen: 0,
        pakketTotaalLessen: null,
        pakketIngeplandeLessen: 0,
        pakketGevolgdeLessen: 0,
        pakketResterendeLessen: null,
        pakketPlanningGeblokkeerd: !student.pakket_id,
        aanvraagStatus: "Handmatig gekoppeld",
        email: profile?.email ?? "",
        telefoon: profile?.telefoon ?? "",
        gekoppeldSinds: link?.created_at ?? null,
        planningVrijTeGeven: Boolean(student.pakket_id),
        isHandmatigGekoppeld: Boolean(link),
        ...journeyFields,
      } satisfies InstructorStudentProgressRow;
    })
    .sort((left, right) => right.voortgang - left.voortgang);
}

export async function getInstructeurDashboardProgressSignals({
  instructorId,
  students,
}: {
  instructorId?: string | null;
  students: InstructorStudentProgressRow[];
}): Promise<InstructorDashboardProgressSignals> {
  const emptySignals: InstructorDashboardProgressSignals = {
    behindStudents: [],
    examReadyStudents: [],
    packageActionStudents: [],
  };

  if (!instructorId || !students.length) {
    return emptySignals;
  }

  const studentIds = students.map((student) => student.id);
  const supabase = await createServerClient();
  const [assessmentsResult, notesResult] = await Promise.all([
    supabase
      .from("leerling_voortgang_beoordelingen")
      .select(
        "id, leerling_id, instructeur_id, les_id, vaardigheid_key, beoordelings_datum, status, notitie, created_at",
      )
      .eq("instructeur_id", instructorId)
      .in("leerling_id", studentIds)
      .order("beoordelings_datum", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(Math.min(900, Math.max(120, studentIds.length * 60))),
    supabase
      .from("leerling_voortgang_lesnotities")
      .select(
        "id, leerling_id, instructeur_id, les_id, lesdatum, samenvatting, sterk_punt, focus_volgende_les, created_at, updated_at",
      )
      .eq("instructeur_id", instructorId)
      .in("leerling_id", studentIds)
      .order("lesdatum", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(Math.min(420, Math.max(60, studentIds.length * 28))),
  ]);

  if (assessmentsResult.error || notesResult.error) {
    logSupabaseDataError(
      "studentProgress.dashboardProgressSignals",
      assessmentsResult.error || notesResult.error,
      {
        instructorId,
        studentCount: studentIds.length,
      },
    );
    return emptySignals;
  }

  const assessments =
    ((assessmentsResult.data ?? []) as StudentProgressAssessment[]) ?? [];
  const notes =
    ((notesResult.data ?? []) as StudentProgressLessonNoteRow[]).map(
      (note) => ({ ...note }),
    ) ?? [];
  const assessmentsByStudent = new Map<string, StudentProgressAssessment[]>();
  const notesByStudent = new Map<string, StudentProgressLessonNote[]>();

  for (const assessment of assessments) {
    const current = assessmentsByStudent.get(assessment.leerling_id) ?? [];
    current.push(assessment);
    assessmentsByStudent.set(assessment.leerling_id, current);
  }

  for (const note of notes) {
    const current = notesByStudent.get(note.leerling_id) ?? [];
    current.push(note);
    notesByStudent.set(note.leerling_id, current);
  }

  const behindStudents = students
    .map((student): InstructorDashboardProgressSignalStudent | null => {
      const studentAssessments = assessmentsByStudent.get(student.id) ?? [];
      const studentNotes = notesByStudent.get(student.id) ?? [];
      const readiness = getStudentExamReadiness(studentAssessments, studentNotes);
      const completedLessons = student.voltooideLessen ?? 0;
      const isBehind =
        (student.voortgang < 45 && completedLessons >= 3) ||
        (readiness.score < 40 && studentAssessments.length >= 6) ||
        (!student.volgendeLesAt && student.voortgang < 55);

      if (!isBehind) {
        return null;
      }

      return {
        id: student.id,
        naam: student.naam,
        detail: !student.volgendeLesAt
          ? `${student.voortgang}% voortgang en geen volgende les gepland`
          : `${student.voortgang}% voortgang, examengereedheid ${readiness.score}%`,
        href: `/instructeur/leerlingen?student=${encodeURIComponent(student.id)}`,
        score: readiness.score,
      };
    })
    .filter(isDashboardProgressSignalStudent)
    .sort((left, right) => (left.score ?? 0) - (right.score ?? 0))
    .slice(0, 4);

  const examReadyStudents = students
    .map((student): InstructorDashboardProgressSignalStudent | null => {
      const readiness = getStudentExamReadiness(
        assessmentsByStudent.get(student.id) ?? [],
        notesByStudent.get(student.id) ?? [],
      );

      if (readiness.score < 74) {
        return null;
      }

      return {
        id: student.id,
        naam: student.naam,
        detail: `${readiness.label}: ${readiness.nextMilestone}`,
        href: `/instructeur/leerlingen?student=${encodeURIComponent(student.id)}`,
        score: readiness.score,
      };
    })
    .filter(isDashboardProgressSignalStudent)
    .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))
    .slice(0, 4);

  const packageActionStudents = students
    .filter(
      (student) =>
        student.pakketPlanningGeblokkeerd ||
        !student.pakketId ||
        (student.pakketResterendeLessen != null &&
          student.pakketResterendeLessen <= 3),
    )
    .map((student) => ({
      id: student.id,
      naam: student.naam,
      detail:
        student.pakketPlanningGeblokkeerd || !student.pakketId
          ? "Pakket nog niet gekoppeld; vervolgplanning blijft geblokkeerd"
          : `${student.pakketResterendeLessen ?? 0} les${
              student.pakketResterendeLessen === 1 ? "" : "sen"
            } over in ${student.pakket}`,
      href: `/instructeur/leerlingen?student=${encodeURIComponent(student.id)}`,
      score:
        student.pakketResterendeLessen == null
          ? 100
          : Math.max(0, 100 - student.pakketResterendeLessen * 20),
    }))
    .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))
    .slice(0, 4);

  return {
    behindStudents,
    examReadyStudents,
    packageActionStudents,
  };
}

export async function getInstructeurLessonPlannerStudents(): Promise<
  InstructorStudentProgressRow[]
> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  const [lessonsResult, requestsResult, linksResult] = (await Promise.all([
    supabase
      .from("lessen")
      .select("leerling_id, pakket_id, titel, start_at, duur_minuten, status, notities")
      .eq("instructeur_id", instructeur.id)
      .not("leerling_id", "is", null)
      .limit(1000),
    supabase
      .from("lesaanvragen")
      .select("id, leerling_id, status, pakket_naam_snapshot, created_at")
      .eq("instructeur_id", instructeur.id)
      .not("leerling_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("instructeur_leerling_koppelingen" as never)
      .select("leerling_id, created_at, bron, onboarding_notitie, intake_checklist_keys")
      .eq("instructeur_id", instructeur.id)
      .not("leerling_id", "is", null),
  ])) as unknown as [
    { data: InstructorStudentLessonRow[] | null; error?: unknown },
    { data: InstructorStudentRequestRow[] | null; error?: unknown },
    { data: InstructorStudentLinkRow[] | null; error?: unknown },
  ];

  const sourceError =
    lessonsResult.error || requestsResult.error || linksResult.error;
  if (sourceError) {
    logSupabaseDataError("studentProgress.lessonPlannerStudents.sources", sourceError, {
      instructeurId: instructeur.id,
    });
    return [];
  }

  const lessonRows = lessonsResult.data ?? [];
  const requestRows = requestsResult.data ?? [];
  const linkRows = linksResult.data ?? [];
  const leerlingIds = Array.from(
    new Set(
      [...lessonRows, ...requestRows, ...linkRows]
        .map((row) => row.leerling_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (!leerlingIds.length) {
    return [];
  }

  const { data: leerlingenRows, error: leerlingenError } = (await supabase
    .from("leerlingen")
    .select("id, profile_id, voortgang_percentage, pakket_id, student_status")
    .in("id", leerlingIds)) as unknown as {
    data: InstructorStudentRow[] | null;
    error?: unknown;
  };

  if (leerlingenError) {
    logSupabaseDataError("studentProgress.lessonPlannerStudents.students", leerlingenError, {
      instructeurId: instructeur.id,
      studentCount: leerlingIds.length,
    });
    return [];
  }

  const profileIds = (leerlingenRows ?? []).map((row) => row.profile_id);
  const packageIds = (leerlingenRows ?? [])
    .map((row) => row.pakket_id)
    .filter((value): value is string => Boolean(value));

  const [profilesResult, packagesResult] = await Promise.all([
    profileIds.length
      ? supabase
          .from("profiles")
          .select("id, volledige_naam, email, telefoon")
          .in("id", profileIds)
      : Promise.resolve({ data: [] }),
    packageIds.length
      ? (supabase
          .from("pakketten")
          .select("id, naam, aantal_lessen, zelf_inplannen_limiet_minuten_per_week")
          .in("id", packageIds) as unknown as Promise<{
          data: InstructorStudentPackageRow[] | null;
        }>)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
  );
  const packageMap = new Map(
    (packagesResult.data ?? []).map((pkg) => [pkg.id, pkg]),
  );
  const lessonsByStudent = new Map<string, InstructorStudentLessonRow[]>();
  const requestsByStudent = new Map<string, InstructorStudentRequestRow[]>();
  const manualLinksByStudent = new Map<string, InstructorStudentLinkRow>();

  for (const lesson of lessonRows) {
    if (!lesson.leerling_id) {
      continue;
    }

    const current = lessonsByStudent.get(lesson.leerling_id) ?? [];
    current.push(lesson);
    lessonsByStudent.set(lesson.leerling_id, current);
  }

  for (const request of requestRows) {
    if (!request.leerling_id) {
      continue;
    }

    const current = requestsByStudent.get(request.leerling_id) ?? [];
    current.push(request);
    requestsByStudent.set(request.leerling_id, current);
  }

  for (const link of linkRows) {
    if (link.leerling_id) {
      manualLinksByStudent.set(link.leerling_id, link);
    }
  }

  const nowMs = Date.now();

  return (leerlingenRows ?? [])
    .map((student) => {
      const profile = profileMap.get(student.profile_id);
      const relatedLessons = lessonsByStudent.get(student.id) ?? [];
      const relatedRequests = requestsByStudent.get(student.id) ?? [];
      const manualLink = manualLinksByStudent.get(student.id) ?? null;
      const assignedPackage = student.pakket_id
        ? packageMap.get(student.pakket_id) ?? null
        : null;
      const latestRequest = [...relatedRequests].sort((left, right) =>
        right.created_at.localeCompare(left.created_at),
      )[0];
      const nextLesson = [...relatedLessons]
        .filter((lesson) => lesson.start_at)
        .sort((left, right) =>
          (left.start_at ?? "").localeCompare(right.start_at ?? ""),
        )
        .find((lesson) => {
          if (!lesson.start_at) {
            return false;
          }

          return new Date(lesson.start_at).getTime() >= nowMs;
        });
      const packageLessons = relatedLessons.filter(
        (lesson) =>
          lesson.status !== "geannuleerd" &&
          Boolean(student.pakket_id) &&
          lesson.pakket_id === student.pakket_id,
      );
      const pakketIngeplandeLessen = packageLessons.filter((lesson) =>
        ["geaccepteerd", "ingepland"].includes(lesson.status),
      ).length;
      const pakketGevolgdeLessen = packageLessons.filter(
        (lesson) => lesson.status === "afgerond",
      ).length;
      const pakketTotaalLessen = assignedPackage?.aantal_lessen ?? null;
      const pakketResterendeLessen =
        pakketTotaalLessen && pakketTotaalLessen > 0
          ? Math.max(
              pakketTotaalLessen -
                pakketIngeplandeLessen -
                pakketGevolgdeLessen,
              0,
            )
          : null;
      const completedLessons = relatedLessons.filter(
        (lesson) => lesson.status === "afgerond",
      ).length;
      const journeyFields = getJourneyFields({
        completedLessons,
        currentStatus: student.student_status,
        examReadinessScore: Number(student.voortgang_percentage ?? 0),
        hasPackage: Boolean(student.pakket_id),
        hasPlannedLessons: relatedLessons.some((lesson) =>
          ["geaccepteerd", "ingepland"].includes(lesson.status),
        ),
        hasRequest: relatedRequests.length > 0 || relatedLessons.length > 0,
        lessons: relatedLessons,
      });
      const firstKnownConnectionAt =
        [
          manualLink?.created_at,
          ...relatedRequests.map((request) => request.created_at),
          ...relatedLessons.map((lesson) => lesson.start_at),
        ]
          .filter((value): value is string => Boolean(value))
          .sort((left, right) => left.localeCompare(right))[0] ?? null;

      return {
        id: student.id,
        profileId: student.profile_id,
        naam: profile?.volledige_naam ?? "Leerling",
        pakket:
          assignedPackage?.naam ??
          latestRequest?.pakket_naam_snapshot ??
          "Nog geen pakket",
        pakketId: student.pakket_id ?? null,
        voortgang: Number(student.voortgang_percentage ?? 0),
        volgendeLes: formatRelativeOrFallback(nextLesson?.start_at),
        volgendeLesAt: nextLesson?.start_at ?? null,
        laatsteBeoordeling: "Niet geladen",
        laatsteBeoordelingAt: null,
        gekoppeldeLessen: relatedLessons.length,
        voltooideLessen: completedLessons,
        pakketTotaalLessen,
        pakketIngeplandeLessen,
        pakketGevolgdeLessen,
        pakketResterendeLessen,
        pakketPlanningGeblokkeerd: !student.pakket_id,
        aanvraagStatus:
          latestRequest?.status != null
            ? getRequestStatusLabel(latestRequest.status)
            : manualLink
              ? "Handmatig gekoppeld"
              : "Actief traject",
        email: profile?.email ?? "",
        telefoon: profile?.telefoon ?? "",
        gekoppeldSinds: firstKnownConnectionAt,
        planningVrijTeGeven:
          Boolean(student.pakket_id) &&
          (Boolean(manualLink) ||
            relatedLessons.length > 0 ||
            relatedRequests.some((request) =>
              ACTIVE_PLANNING_REQUEST_STATUSES.includes(
                (request.status ??
                  "") as (typeof ACTIVE_PLANNING_REQUEST_STATUSES)[number],
              ),
            )),
        isHandmatigGekoppeld: Boolean(manualLink),
        ...journeyFields,
      };
    })
    .sort((left, right) => left.naam.localeCompare(right.naam));
}

export async function getInstructeurStudentsWorkspace() {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      students: [],
      assessments: [],
      notes: [],
    };
  }

  const supabase = await createServerClient();
  const [lessonsResult, requestsResult, linksResult] = (await Promise.all([
    supabase
      .from("lessen")
      .select("leerling_id, pakket_id, titel, start_at, duur_minuten, status, notities")
      .eq("instructeur_id", instructeur.id)
      .not("leerling_id", "is", null)
      .order("start_at", { ascending: false })
      .limit(1000),
    supabase
      .from("lesaanvragen")
      .select(
        "id, leerling_id, status, pakket_naam_snapshot, created_at, voorkeursdatum, tijdvak",
      )
      .eq("instructeur_id", instructeur.id)
      .not("leerling_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("instructeur_leerling_koppelingen" as never)
      .select(
        "leerling_id, created_at, bron, onboarding_notitie, intake_checklist_keys",
      )
      .eq("instructeur_id", instructeur.id)
      .not("leerling_id", "is", null),
  ])) as unknown as [
    { data: InstructorStudentLessonRow[] | null; error?: unknown },
    { data: InstructorStudentRequestRow[] | null; error?: unknown },
    { data: InstructorStudentLinkRow[] | null; error?: unknown },
  ];

  const sourceError =
    lessonsResult.error || requestsResult.error || linksResult.error;
  if (sourceError) {
    logSupabaseDataError("studentProgress.studentsWorkspace.sources", sourceError, {
      instructeurId: instructeur.id,
    });
    return {
      students: [],
      assessments: [],
      notes: [],
    };
  }

  const lessonRows = lessonsResult.data ?? [];
  const requestRows = requestsResult.data ?? [];
  const linkRows = linksResult.data ?? [];

  const leerlingIds = Array.from(
    new Set(
      [...lessonRows, ...requestRows, ...linkRows]
        .map((row) => row.leerling_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (!leerlingIds.length) {
    return {
      students: [],
      assessments: [],
      notes: [],
    };
  }

  const { data: leerlingenRows, error: leerlingenError } = (await supabase
    .from("leerlingen")
    .select("id, profile_id, voortgang_percentage, pakket_id, student_status")
    .in("id", leerlingIds)) as unknown as {
    data: InstructorStudentRow[] | null;
    error?: unknown;
  };

  if (leerlingenError) {
    logSupabaseDataError("studentProgress.studentsWorkspace.students", leerlingenError, {
      instructeurId: instructeur.id,
      studentCount: leerlingIds.length,
    });
    return {
      students: [],
      assessments: [],
      notes: [],
    };
  }

  const profileIds = (leerlingenRows ?? []).map((row) => row.profile_id);
  const packageIds = (leerlingenRows ?? [])
    .map((row) => row.pakket_id)
    .filter((value): value is string => Boolean(value));
  const studentSchedulingAccess = supabase.from(
    "leerling_planningsrechten" as never,
  ) as unknown as StudentSchedulingAccessListBuilder;

  const [
    profilesResult,
    packagesResult,
    assessmentsResult,
    notesResult,
    schedulingAccessResult,
  ] = await Promise.all([
    profileIds.length
      ? supabase
          .from("profiles")
          .select("id, volledige_naam, email, telefoon")
          .in("id", profileIds)
      : Promise.resolve({ data: [] }),
    packageIds.length
      ? (supabase
          .from("pakketten")
          .select("id, naam, aantal_lessen, zelf_inplannen_limiet_minuten_per_week")
          .in("id", packageIds) as unknown as Promise<{
          data: InstructorStudentPackageRow[] | null;
        }>)
      : Promise.resolve({ data: [] }),
    supabase
      .from("leerling_voortgang_beoordelingen")
      .select(
        "id, leerling_id, instructeur_id, les_id, vaardigheid_key, beoordelings_datum, status, notitie, created_at",
      )
      .eq("instructeur_id", instructeur.id)
      .in("leerling_id", leerlingIds)
      .order("beoordelings_datum", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1200),
    supabase
      .from("leerling_voortgang_lesnotities")
      .select(
        "id, leerling_id, instructeur_id, les_id, lesdatum, samenvatting, sterk_punt, focus_volgende_les, created_at, updated_at",
      )
      .eq("instructeur_id", instructeur.id)
      .in("leerling_id", leerlingIds)
      .order("lesdatum", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(600),
    studentSchedulingAccess
      .select(
        "leerling_id, zelf_inplannen_toegestaan, zelf_inplannen_limiet_minuten_per_week, zelf_inplannen_limiet_is_handmatig",
      )
      .eq("instructeur_id", instructeur.id)
      .in("leerling_id", leerlingIds),
  ]);

  const workspaceRelationErrors = [
    ["profiles", (profilesResult as { error?: unknown }).error],
    ["packages", (packagesResult as { error?: unknown }).error],
    ["assessments", (assessmentsResult as { error?: unknown }).error],
    ["notes", (notesResult as { error?: unknown }).error],
    ["schedulingAccess", (schedulingAccessResult as { error?: unknown }).error],
  ] as const;

  for (const [query, error] of workspaceRelationErrors) {
    if (error) {
      logSupabaseDataError("studentProgress.studentsWorkspace.relations", error, {
        instructeurId: instructeur.id,
        query,
        studentCount: leerlingIds.length,
      });
    }
  }

  const profileMap = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
  );
  const packageMap = new Map(
    (packagesResult.data ?? []).map((pkg) => [pkg.id, pkg]),
  );
  const schedulingAccessMap = new Map(
    ((schedulingAccessResult.data ?? []) as StudentSchedulingAccessRow[]).map(
      (row) => [row.leerling_id, row],
    ),
  );

  const assessments =
    ((assessmentsResult.data ?? []) as StudentProgressAssessment[]) ?? [];
  const notes =
    ((notesResult.data ?? []) as StudentProgressLessonNoteRow[]).map(
      (note) => ({
        ...note,
      }),
    ) ?? [];
  const authStateMap = new Map<string, StudentAuthState>();

  if (profileIds.length) {
    const admin = await createAdminClient();
    const authStates = await Promise.all(
      profileIds.map(async (profileId) => {
        const { data } = await admin.auth.admin.getUserById(profileId);
        const user = data.user;
        const isActive = Boolean(
          user?.last_sign_in_at || user?.email_confirmed_at,
        );

        return [
          profileId,
          {
            accountStatus: isActive ? "actief" : "uitgenodigd",
            lastSignInAt: user?.last_sign_in_at ?? null,
          },
        ] as const;
      }),
    );

    for (const [profileId, authState] of authStates) {
      authStateMap.set(profileId, authState);
    }
  }

  const assessmentsByStudent = new Map<string, StudentProgressAssessment[]>();

  for (const assessment of assessments) {
    const current = assessmentsByStudent.get(assessment.leerling_id) ?? [];
    current.push(assessment);
    assessmentsByStudent.set(assessment.leerling_id, current);
  }

  const notesByStudent = new Map<string, StudentProgressLessonNote[]>();

  for (const note of notes) {
    const current = notesByStudent.get(note.leerling_id) ?? [];
    current.push(note);
    notesByStudent.set(note.leerling_id, current);
  }

  const requestsByStudent = new Map<
    string,
    Array<{
      id: string;
      status: string | null;
      pakket_naam_snapshot: string | null;
      created_at: string;
      voorkeursdatum: string | null;
      tijdvak: string | null;
    }>
  >();

  const manualLinksByStudent = new Map<
    string,
    {
      created_at: string;
      bron: string | null;
      onboarding_notitie: string | null;
      intake_checklist_keys: string[];
    }
  >();

  for (const request of requestRows) {
    if (!request.leerling_id) {
      continue;
    }

    const current = requestsByStudent.get(request.leerling_id) ?? [];
    current.push(request);
    requestsByStudent.set(request.leerling_id, current);
  }

  const lessonsByStudent = new Map<
    string,
    Array<{
      leerling_id: string | null;
      pakket_id: string | null;
      titel?: string | null;
      start_at: string | null;
      duur_minuten: number;
      status: string;
      notities: string | null;
    }>
  >();

  for (const lesson of lessonRows) {
    if (!lesson.leerling_id) {
      continue;
    }

    const current = lessonsByStudent.get(lesson.leerling_id) ?? [];
    current.push({
      leerling_id: lesson.leerling_id,
      pakket_id: lesson.pakket_id,
      titel: lesson.titel,
      start_at: lesson.start_at,
      duur_minuten: lesson.duur_minuten,
      status: lesson.status,
      notities: lesson.notities,
    });
    lessonsByStudent.set(lesson.leerling_id, current);
  }

  const { weekStartKey } = getWeeklyBookingWindow(new Date());

  for (const link of linkRows) {
    if (!link.leerling_id) {
      continue;
    }

    manualLinksByStudent.set(link.leerling_id, {
      created_at: link.created_at,
      bron: link.bron,
      onboarding_notitie: link.onboarding_notitie,
      intake_checklist_keys: link.intake_checklist_keys ?? [],
    });
  }

  const students: InstructorStudentProgressRow[] = (leerlingenRows ?? []).map(
    (student) => {
      const profile = profileMap.get(student.profile_id);
      const studentAssessments = assessmentsByStudent.get(student.id) ?? [];
      const studentNotes = notesByStudent.get(student.id) ?? [];
      const summary = getStudentProgressSummary(studentAssessments);
      const relatedLessons = lessonsByStudent.get(student.id) ?? [];
      const relatedRequests = requestsByStudent.get(student.id) ?? [];
      const manualLink = manualLinksByStudent.get(student.id) ?? null;
      const schedulingAccess = schedulingAccessMap.get(student.id);
      const nextLesson = [...relatedLessons]
        .filter((lesson) => lesson.start_at)
        .sort((left, right) =>
          (left.start_at ?? "").localeCompare(right.start_at ?? ""),
        )
        .find((lesson) => {
          if (!lesson.start_at) {
            return false;
          }

          return new Date(lesson.start_at).getTime() >= Date.now();
        });

      const latestRequest = [...relatedRequests].sort((left, right) =>
        right.created_at.localeCompare(left.created_at),
      )[0];
      const firstKnownConnectionAt =
        [
          manualLink?.created_at,
          ...relatedRequests.map((request) => request.created_at),
          ...relatedLessons.map((lesson) => lesson.start_at),
        ]
          .filter((value): value is string => Boolean(value))
          .sort((left, right) => left.localeCompare(right))[0] ?? null;
      const latestAssessmentDate =
        summary.lastReviewedAt ??
        [...studentAssessments].sort((left, right) =>
          right.beoordelings_datum.localeCompare(left.beoordelings_datum),
        )[0]?.beoordelings_datum ??
        null;

      const computedProgress = studentAssessments.length
        ? calculateStudentProgressPercentage(studentAssessments)
        : Number(student.voortgang_percentage ?? 0);
      const assignedPackage = student.pakket_id
        ? packageMap.get(student.pakket_id) ?? null
        : null;
      const packageLessons = relatedLessons.filter(
        (lesson) =>
          lesson.status !== "geannuleerd" &&
          Boolean(student.pakket_id) &&
          lesson.pakket_id === student.pakket_id,
      );
      const pakketIngeplandeLessen = packageLessons.filter((lesson) =>
        ["geaccepteerd", "ingepland"].includes(lesson.status),
      ).length;
      const pakketGevolgdeLessen = packageLessons.filter(
        (lesson) => lesson.status === "afgerond",
      ).length;
      const pakketTotaalLessen = assignedPackage?.aantal_lessen ?? null;
      const pakketResterendeLessen =
        pakketTotaalLessen && pakketTotaalLessen > 0
          ? Math.max(
              pakketTotaalLessen -
                pakketIngeplandeLessen -
                pakketGevolgdeLessen,
              0,
            )
          : null;
      const planningVrijTeGeven =
        Boolean(student.pakket_id) &&
        (Boolean(manualLink) ||
          relatedLessons.length > 0 ||
          relatedRequests.some((request) =>
            ACTIVE_PLANNING_REQUEST_STATUSES.includes(
              (request.status ??
                "") as (typeof ACTIVE_PLANNING_REQUEST_STATUSES)[number],
            ),
          ));
      const zelfInplannenToegestaan =
        planningVrijTeGeven &&
        Boolean(schedulingAccess?.zelf_inplannen_toegestaan);
      const linkedRequestIds = new Set(
        relatedLessons
          .map((lesson) => extractLessonRequestReference(lesson.notities))
          .filter((value): value is string => Boolean(value)),
      );
      const bookedMinutesByWeekStart: Record<string, number> = {};

      relatedLessons.forEach((lesson) => {
        if (
          !lesson.start_at ||
          !["geaccepteerd", "ingepland", "afgerond"].includes(lesson.status)
        ) {
          return;
        }

        addBookedMinutesForWeek({
          map: bookedMinutesByWeekStart,
          dateLike: lesson.start_at,
          minutes: lesson.duur_minuten,
        });
      });

      relatedRequests.forEach((request) => {
        if (
          linkedRequestIds.has(request.id) ||
          !request.voorkeursdatum ||
          !["aangevraagd", "geaccepteerd", "ingepland"].includes(
            request.status ?? "",
          )
        ) {
          return;
        }

        const { startAt, endAt } = parseRequestWindow(
          request.voorkeursdatum,
          request.tijdvak,
        );

        if (!startAt || !endAt) {
          return;
        }

        addBookedMinutesForWeek({
          map: bookedMinutesByWeekStart,
          dateLike: startAt,
          minutes: Math.max(
            30,
            Math.round(
              (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000,
            ),
          ),
        });
      });

      const pakketZelfInplannenLimietMinutenPerWeek =
        packageMap.get(student.pakket_id ?? "")
          ?.zelf_inplannen_limiet_minuten_per_week ?? null;
      const resolvedWeeklyLimit = resolveEffectiveWeeklyBookingLimit({
        manualLimitIsSet: Boolean(
          schedulingAccess?.zelf_inplannen_limiet_is_handmatig,
        ),
        manualLimitMinutes:
          schedulingAccess?.zelf_inplannen_limiet_minuten_per_week ?? null,
        packageLimitMinutes: pakketZelfInplannenLimietMinutenPerWeek,
      });
      const zelfInplannenLimietMinutenPerWeek =
        resolvedWeeklyLimit.weeklyLimitMinutes;
      const zelfInplannenHandmatigeLimietMinutenPerWeek = Boolean(
        schedulingAccess?.zelf_inplannen_limiet_is_handmatig,
      )
        ? (schedulingAccess?.zelf_inplannen_limiet_minuten_per_week ?? null)
        : null;
      const zelfInplannenGebruiktMinutenDezeWeek =
        bookedMinutesByWeekStart[weekStartKey] ?? 0;
      const zelfInplannenResterendMinutenDezeWeek =
        getRemainingWeeklyBookingMinutes(
          zelfInplannenLimietMinutenPerWeek,
          zelfInplannenGebruiktMinutenDezeWeek,
        );
      const completedLessons = relatedLessons.filter(
        (lesson) => lesson.status === "afgerond",
      ).length;
      const journeyFields = getJourneyFields({
        completedLessons,
        currentStatus: student.student_status,
        examReadinessScore: getStudentExamReadiness(
          studentAssessments,
          studentNotes,
        ).score,
        hasPackage: Boolean(student.pakket_id),
        hasPlannedLessons: relatedLessons.some((lesson) =>
          ["geaccepteerd", "ingepland"].includes(lesson.status),
        ),
        hasRequest: relatedRequests.length > 0 || relatedLessons.length > 0,
        lessons: relatedLessons,
      });

      return {
        id: student.id,
        profileId: student.profile_id,
        naam: profile?.volledige_naam ?? "Leerling",
        pakket:
          assignedPackage?.naam ??
          latestRequest?.pakket_naam_snapshot ??
          "Nog geen pakket",
        pakketId: student.pakket_id ?? null,
        voortgang: computedProgress,
        volgendeLes: formatRelativeOrFallback(nextLesson?.start_at),
        volgendeLesAt: nextLesson?.start_at ?? null,
        laatsteBeoordeling: latestAssessmentDate
          ? formatLongDate(latestAssessmentDate)
          : "Nog geen beoordeling",
        laatsteBeoordelingAt: latestAssessmentDate,
        gekoppeldeLessen: relatedLessons.length,
        voltooideLessen: completedLessons,
        pakketTotaalLessen,
        pakketIngeplandeLessen,
        pakketGevolgdeLessen,
        pakketResterendeLessen,
        pakketPlanningGeblokkeerd: !student.pakket_id,
        aanvraagStatus:
          latestRequest?.status != null
            ? getRequestStatusLabel(latestRequest.status)
            : manualLink
              ? "Handmatig gekoppeld"
              : "Actief traject",
        email: profile?.email ?? "",
        telefoon: profile?.telefoon ?? "",
        gekoppeldSinds: firstKnownConnectionAt,
        zelfInplannenToegestaan,
        zelfInplannenLimietMinutenPerWeek,
        zelfInplannenPakketLimietMinutenPerWeek:
          pakketZelfInplannenLimietMinutenPerWeek,
        zelfInplannenHandmatigeLimietMinutenPerWeek,
        zelfInplannenHandmatigeOverrideActief: Boolean(
          schedulingAccess?.zelf_inplannen_limiet_is_handmatig,
        ),
        zelfInplannenGebruiktMinutenDezeWeek,
        zelfInplannenResterendMinutenDezeWeek,
        planningVrijTeGeven,
        isHandmatigGekoppeld: Boolean(manualLink),
        onboardingNotitie: manualLink?.onboarding_notitie ?? null,
        intakeChecklistKeys: manualLink?.intake_checklist_keys ?? [],
        accountStatus: authStateMap.get(student.profile_id)?.accountStatus,
        lastSignInAt:
          authStateMap.get(student.profile_id)?.lastSignInAt ?? null,
        ...journeyFields,
      };
    },
  );

  students.sort((left, right) => right.voortgang - left.voortgang);

  return {
    students,
    assessments,
    notes,
  };
}

export async function getCurrentLeerlingProgressWorkspace() {
  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return {
      assessments: [] as StudentProgressAssessment[],
      notes: [] as StudentProgressLessonNote[],
      laatsteInstructeurNaam: null as string | null,
    };
  }

  const supabase = await createServerClient();
  const [assessmentsResult, notesResult] = await Promise.all([
    supabase
      .from("leerling_voortgang_beoordelingen")
      .select(
        "id, leerling_id, instructeur_id, les_id, vaardigheid_key, beoordelings_datum, status, notitie, created_at",
      )
      .eq("leerling_id", leerling.id)
      .order("beoordelings_datum", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("leerling_voortgang_lesnotities")
      .select(
        "id, leerling_id, instructeur_id, les_id, lesdatum, samenvatting, sterk_punt, focus_volgende_les, created_at, updated_at",
      )
      .eq("leerling_id", leerling.id)
      .order("lesdatum", { ascending: false })
      .order("updated_at", { ascending: false }),
  ]);

  if (assessmentsResult.error || notesResult.error) {
    logSupabaseDataError(
      "studentProgress.currentLearnerWorkspace",
      assessmentsResult.error || notesResult.error,
      {
        leerlingId: leerling.id,
      },
    );
    return {
      assessments: [] as StudentProgressAssessment[],
      notes: [] as StudentProgressLessonNote[],
      laatsteInstructeurNaam: null as string | null,
    };
  }

  const assessments =
    ((assessmentsResult.data ?? []) as StudentProgressAssessment[]) ?? [];
  const notes =
    ((notesResult.data ?? []) as StudentProgressLessonNoteRow[]).map(
      (note) => ({
        ...note,
      }),
    ) ?? [];

  const instructeurIds = Array.from(
    new Set([
      ...assessments.map((assessment) => assessment.instructeur_id),
      ...notes.map((note) => note.instructeur_id),
    ]),
  );

  const { data: instructeursRows } = instructeurIds.length
    ? ((await supabase
        .from("instructeurs")
        .select("id, profile_id")
        .in("id", instructeurIds)) as unknown as {
        data: ProgressInstructorRow[] | null;
      })
    : { data: [] };

  const profileIds = (instructeursRows ?? []).map((row) => row.profile_id);
  const { data: profiles } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, volledige_naam")
        .in("id", profileIds)
    : { data: [] };

  const instructorProfileMap = new Map(
    (instructeursRows ?? []).map((row) => [row.id, row.profile_id]),
  );
  const profileNameMap = new Map(
    (profiles ?? []).map((row) => [row.id, row.volledige_naam]),
  );
  const latestAssessment = [...assessments].sort((left, right) => {
    if (left.beoordelings_datum !== right.beoordelings_datum) {
      return right.beoordelings_datum.localeCompare(left.beoordelings_datum);
    }

    return right.created_at.localeCompare(left.created_at);
  })[0];
  const latestNote = [...notes].sort((left, right) => {
    if (left.lesdatum !== right.lesdatum) {
      return right.lesdatum.localeCompare(left.lesdatum);
    }

    return right.updated_at.localeCompare(left.updated_at);
  })[0];
  const latestInstructorId =
    latestAssessment?.instructeur_id ?? latestNote?.instructeur_id ?? null;

  return {
    assessments,
    notes,
    laatsteInstructeurNaam: latestInstructorId
      ? (profileNameMap.get(
          instructorProfileMap.get(latestInstructorId) ?? "",
        ) ?? null)
      : null,
  };
}
