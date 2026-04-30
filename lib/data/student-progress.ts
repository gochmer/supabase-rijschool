import "server-only";

import { parseRequestWindow } from "@/lib/booking-availability";
import type {
  InstructorStudentProgressRow,
  StudentProgressAssessment,
  StudentProgressLessonNote,
} from "@/lib/types";
import {
  getCurrentInstructeurRecord,
  getCurrentLeerlingRecord,
} from "@/lib/data/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import {
  calculateStudentProgressPercentage,
  getStudentProgressSummary,
} from "@/lib/student-progress";
import {
  addBookedMinutesForWeek,
  getRemainingWeeklyBookingMinutes,
  getWeeklyBookingWindow,
  resolveEffectiveWeeklyBookingLimit,
} from "@/lib/self-scheduling-limits";
import { extractLessonRequestReference } from "@/lib/lesson-request-flow";

type InstructorStudentLessonRow = {
  leerling_id: string | null;
  start_at: string | null;
  duur_minuten: number;
  status: string;
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

type StudentSchedulingAccessRow = {
  leerling_id: string;
  zelf_inplannen_toegestaan: boolean;
  zelf_inplannen_limiet_minuten_per_week: number | null;
  zelf_inplannen_limiet_is_handmatig: boolean;
};

type StudentSchedulingAccessListBuilder = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      in: (column: string, values: string[]) => Promise<{
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
};

type InstructorStudentPackageRow = {
  id: string;
  naam: string;
  zelf_inplannen_limiet_minuten_per_week: number | null;
};

type StudentProgressLessonNoteRow = {
  id: string;
  leerling_id: string;
  instructeur_id: string;
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

const DEMO_STUDENTS: InstructorStudentProgressRow[] = [
  {
    id: "demo-student-mila",
    naam: "Mila Jansen",
    pakket: "Starterspakket",
    voortgang: 58,
    volgendeLes: "28 april 2026",
    volgendeLesAt: "2026-04-28T18:30:00",
    laatsteBeoordeling: "23 april 2026",
    laatsteBeoordelingAt: "2026-04-23",
    gekoppeldeLessen: 8,
    aanvraagStatus: "Actief traject",
    email: "mila@example.com",
    telefoon: "06 12 34 56 78",
    zelfInplannenToegestaan: true,
    zelfInplannenLimietMinutenPerWeek: 120,
    zelfInplannenGebruiktMinutenDezeWeek: 60,
    zelfInplannenResterendMinutenDezeWeek: 60,
    planningVrijTeGeven: true,
  },
  {
    id: "demo-student-noah",
    naam: "Noah de Vries",
    pakket: "Losse lessen",
    voortgang: 31,
    volgendeLes: "24 april 2026",
    volgendeLesAt: "2026-04-24T16:30:00",
    laatsteBeoordeling: "21 april 2026",
    laatsteBeoordelingAt: "2026-04-21",
    gekoppeldeLessen: 4,
    aanvraagStatus: "Nieuwe aanvraag",
    email: "noah@example.com",
    telefoon: "06 98 76 54 32",
    zelfInplannenToegestaan: false,
    zelfInplannenLimietMinutenPerWeek: null,
    zelfInplannenGebruiktMinutenDezeWeek: 0,
    zelfInplannenResterendMinutenDezeWeek: null,
    planningVrijTeGeven: false,
  },
];

const DEMO_ASSESSMENTS: StudentProgressAssessment[] = [
  {
    id: "demo-1",
    leerling_id: "demo-student-mila",
    instructeur_id: "demo-instructor",
    vaardigheid_key: "voorbereiding",
    beoordelings_datum: "2026-04-16",
    status: "begeleid",
    created_at: "2026-04-16T08:00:00",
  },
  {
    id: "demo-2",
    leerling_id: "demo-student-mila",
    instructeur_id: "demo-instructor",
    vaardigheid_key: "voorbereiding",
    beoordelings_datum: "2026-04-23",
    status: "zelfstandig",
    created_at: "2026-04-23T08:00:00",
  },
  {
    id: "demo-3",
    leerling_id: "demo-student-mila",
    instructeur_id: "demo-instructor",
    vaardigheid_key: "kijkgedrag",
    beoordelings_datum: "2026-04-23",
    status: "begeleid",
    created_at: "2026-04-23T08:10:00",
  },
  {
    id: "demo-4",
    leerling_id: "demo-student-mila",
    instructeur_id: "demo-instructor",
    vaardigheid_key: "kruispunten",
    beoordelings_datum: "2026-04-23",
    status: "uitleg",
    created_at: "2026-04-23T08:20:00",
  },
  {
    id: "demo-5",
    leerling_id: "demo-student-noah",
    instructeur_id: "demo-instructor",
    vaardigheid_key: "stuurremkoppeling",
    beoordelings_datum: "2026-04-21",
    status: "uitleg",
    created_at: "2026-04-21T08:00:00",
  },
  {
    id: "demo-6",
    leerling_id: "demo-student-noah",
    instructeur_id: "demo-instructor",
    vaardigheid_key: "schakelen",
    beoordelings_datum: "2026-04-21",
    status: "herhaling",
    created_at: "2026-04-21T08:10:00",
  },
];

const DEMO_NOTES: StudentProgressLessonNote[] = [
  {
    id: "demo-note-1",
    leerling_id: "demo-student-mila",
    instructeur_id: "demo-instructor",
    lesdatum: "2026-04-23",
    samenvatting:
      "Sterke, rustige les met goede spiegelroutine. Kruispunten vragen nog wat meer voorsorteren en ritme.",
    sterk_punt: "Voorbereiding en basisbediening gaan steeds zelfstandiger.",
    focus_volgende_les: "Meer herhaling op kruispunten en vloeiender afslaan naar rechts.",
    created_at: "2026-04-23T09:00:00",
    updated_at: "2026-04-23T09:00:00",
  },
  {
    id: "demo-note-2",
    leerling_id: "demo-student-noah",
    instructeur_id: "demo-instructor",
    lesdatum: "2026-04-21",
    samenvatting:
      "Noah is gemotiveerd, maar schakelmomenten kosten nog te veel aandacht waardoor het verkeersbeeld sneller wegvalt.",
    sterk_punt: "Rustige houding en goede inzet tijdens uitleg.",
    focus_volgende_les: "Schakelen automatiseren en meer vooruit kijken in druk verkeer.",
    created_at: "2026-04-21T09:00:00",
    updated_at: "2026-04-21T09:00:00",
  },
];

export async function getInstructeurStudentsWorkspace() {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      students: DEMO_STUDENTS,
      assessments: DEMO_ASSESSMENTS,
      notes: DEMO_NOTES,
    };
  }

  const supabase = await createServerClient();
  const [lessonsResult, requestsResult, linksResult] = (await Promise.all([
    supabase
      .from("lessen")
      .select("leerling_id, start_at, duur_minuten, status, notities")
      .eq("instructeur_id", instructeur.id)
      .not("leerling_id", "is", null),
    supabase
      .from("lesaanvragen")
      .select(
        "id, leerling_id, status, pakket_naam_snapshot, created_at, voorkeursdatum, tijdvak"
      )
      .eq("instructeur_id", instructeur.id)
      .not("leerling_id", "is", null),
    supabase
      .from("instructeur_leerling_koppelingen" as never)
      .select("leerling_id, created_at, bron, onboarding_notitie, intake_checklist_keys")
      .eq("instructeur_id", instructeur.id)
      .not("leerling_id", "is", null),
  ])) as unknown as [
    { data: InstructorStudentLessonRow[] | null },
    { data: InstructorStudentRequestRow[] | null },
    { data: InstructorStudentLinkRow[] | null },
  ];

  const lessonRows = lessonsResult.data ?? [];
  const requestRows = requestsResult.data ?? [];
  const linkRows = linksResult.data ?? [];

  const leerlingIds = Array.from(
    new Set(
      [...lessonRows, ...requestRows, ...linkRows]
        .map((row) => row.leerling_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (!leerlingIds.length) {
    return {
      students: [],
      assessments: [],
      notes: [],
    };
  }

  const { data: leerlingenRows } = (await supabase
    .from("leerlingen")
    .select("id, profile_id, voortgang_percentage, pakket_id")
    .in("id", leerlingIds)) as unknown as { data: InstructorStudentRow[] | null };

  const profileIds = (leerlingenRows ?? []).map((row) => row.profile_id);
  const packageIds = (leerlingenRows ?? [])
    .map((row) => row.pakket_id)
    .filter((value): value is string => Boolean(value));
  const studentSchedulingAccess = supabase.from(
    "leerling_planningsrechten" as never
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
      ? ((supabase
          .from("pakketten")
          .select("id, naam, zelf_inplannen_limiet_minuten_per_week")
          .in("id", packageIds)) as unknown as Promise<{
          data: InstructorStudentPackageRow[] | null;
        }>)
      : Promise.resolve({ data: [] }),
    supabase
      .from("leerling_voortgang_beoordelingen")
      .select(
        "id, leerling_id, instructeur_id, vaardigheid_key, beoordelings_datum, status, notitie, created_at"
      )
      .eq("instructeur_id", instructeur.id)
      .in("leerling_id", leerlingIds)
      .order("beoordelings_datum", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("leerling_voortgang_lesnotities")
      .select(
        "id, leerling_id, instructeur_id, lesdatum, samenvatting, sterk_punt, focus_volgende_les, created_at, updated_at"
      )
      .eq("instructeur_id", instructeur.id)
      .in("leerling_id", leerlingIds)
      .order("lesdatum", { ascending: false })
      .order("updated_at", { ascending: false }),
    studentSchedulingAccess
      .select(
        "leerling_id, zelf_inplannen_toegestaan, zelf_inplannen_limiet_minuten_per_week, zelf_inplannen_limiet_is_handmatig"
      )
      .eq("instructeur_id", instructeur.id)
      .in("leerling_id", leerlingIds),
  ]);

  const profileMap = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile])
  );
  const packageMap = new Map(
    (packagesResult.data ?? []).map((pkg) => [pkg.id, pkg])
  );
  const schedulingAccessMap = new Map(
    ((schedulingAccessResult.data ?? []) as StudentSchedulingAccessRow[]).map((row) => [
      row.leerling_id,
      row,
    ])
  );

  const assessments =
    ((assessmentsResult.data ?? []) as StudentProgressAssessment[]) ?? [];
  const notes =
    ((notesResult.data ?? []) as StudentProgressLessonNoteRow[]).map((note) => ({
      ...note,
    })) ?? [];
  const authStateMap = new Map<string, StudentAuthState>();

  if (profileIds.length) {
    const admin = await createAdminClient();
    const authStates = await Promise.all(
      profileIds.map(async (profileId) => {
        const { data } = await admin.auth.admin.getUserById(profileId);
        const user = data.user;
        const isActive = Boolean(user?.last_sign_in_at || user?.email_confirmed_at);

        return [
          profileId,
          {
            accountStatus: isActive ? "actief" : "uitgenodigd",
            lastSignInAt: user?.last_sign_in_at ?? null,
          },
        ] as const;
      })
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

  const students: InstructorStudentProgressRow[] = (leerlingenRows ?? []).map((student) => {
    const profile = profileMap.get(student.profile_id);
    const studentAssessments = assessmentsByStudent.get(student.id) ?? [];
    const summary = getStudentProgressSummary(studentAssessments);
    const relatedLessons = lessonsByStudent.get(student.id) ?? [];
    const relatedRequests = requestsByStudent.get(student.id) ?? [];
    const manualLink = manualLinksByStudent.get(student.id) ?? null;
    const schedulingAccess = schedulingAccessMap.get(student.id);
    const nextLesson = [...relatedLessons]
      .filter((lesson) => lesson.start_at)
      .sort((left, right) =>
        (left.start_at ?? "").localeCompare(right.start_at ?? "")
      )
      .find((lesson) => {
        if (!lesson.start_at) {
          return false;
        }

        return new Date(lesson.start_at).getTime() >= Date.now();
      });

    const latestRequest = [...relatedRequests].sort((left, right) =>
      right.created_at.localeCompare(left.created_at)
    )[0];
    const latestAssessmentDate =
      summary.lastReviewedAt ??
      [...studentAssessments]
        .sort((left, right) =>
          right.beoordelings_datum.localeCompare(left.beoordelings_datum)
        )[0]?.beoordelings_datum ??
      null;

    const computedProgress = studentAssessments.length
      ? calculateStudentProgressPercentage(studentAssessments)
      : Number(student.voortgang_percentage ?? 0);
    const planningVrijTeGeven =
      Boolean(manualLink) ||
      relatedLessons.length > 0 ||
      relatedRequests.some((request) =>
        ACTIVE_PLANNING_REQUEST_STATUSES.includes(
          (request.status ?? "") as (typeof ACTIVE_PLANNING_REQUEST_STATUSES)[number]
        )
      );
    const zelfInplannenToegestaan =
      planningVrijTeGeven && Boolean(schedulingAccess?.zelf_inplannen_toegestaan);
    const linkedRequestIds = new Set(
      relatedLessons
        .map((lesson) => extractLessonRequestReference(lesson.notities))
        .filter((value): value is string => Boolean(value))
    );
    const bookedMinutesByWeekStart: Record<string, number> = {};

    relatedLessons.forEach((lesson) => {
      if (!lesson.start_at || !["geaccepteerd", "ingepland", "afgerond"].includes(lesson.status)) {
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
        !["aangevraagd", "geaccepteerd", "ingepland"].includes(request.status ?? "")
      ) {
        return;
      }

      const { startAt, endAt } = parseRequestWindow(
        request.voorkeursdatum,
        request.tijdvak
      );

      if (!startAt || !endAt) {
        return;
      }

      addBookedMinutesForWeek({
        map: bookedMinutesByWeekStart,
        dateLike: startAt,
        minutes: Math.max(
          30,
          Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000)
        ),
      });
    });

    const pakketZelfInplannenLimietMinutenPerWeek =
      packageMap.get(student.pakket_id ?? "")?.zelf_inplannen_limiet_minuten_per_week ??
      null;
    const resolvedWeeklyLimit = resolveEffectiveWeeklyBookingLimit({
      manualLimitIsSet: Boolean(
        schedulingAccess?.zelf_inplannen_limiet_is_handmatig
      ),
      manualLimitMinutes:
        schedulingAccess?.zelf_inplannen_limiet_minuten_per_week ?? null,
      packageLimitMinutes: pakketZelfInplannenLimietMinutenPerWeek,
    });
    const zelfInplannenLimietMinutenPerWeek =
      resolvedWeeklyLimit.weeklyLimitMinutes;
    const zelfInplannenHandmatigeLimietMinutenPerWeek = Boolean(
      schedulingAccess?.zelf_inplannen_limiet_is_handmatig
    )
      ? schedulingAccess?.zelf_inplannen_limiet_minuten_per_week ?? null
      : null;
    const zelfInplannenGebruiktMinutenDezeWeek =
      bookedMinutesByWeekStart[weekStartKey] ?? 0;
    const zelfInplannenResterendMinutenDezeWeek =
      getRemainingWeeklyBookingMinutes(
        zelfInplannenLimietMinutenPerWeek,
        zelfInplannenGebruiktMinutenDezeWeek
      );

    return {
      id: student.id,
      profileId: student.profile_id,
      naam: profile?.volledige_naam ?? "Leerling",
      pakket:
        (student.pakket_id ? packageMap.get(student.pakket_id)?.naam : null) ??
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
      aanvraagStatus:
        latestRequest?.status != null
          ? getRequestStatusLabel(latestRequest.status)
          : manualLink
            ? "Handmatig gekoppeld"
            : "Actief traject",
      email: profile?.email ?? "",
      telefoon: profile?.telefoon ?? "",
      zelfInplannenToegestaan,
      zelfInplannenLimietMinutenPerWeek,
      zelfInplannenPakketLimietMinutenPerWeek:
        pakketZelfInplannenLimietMinutenPerWeek,
      zelfInplannenHandmatigeLimietMinutenPerWeek,
      zelfInplannenHandmatigeOverrideActief: Boolean(
        schedulingAccess?.zelf_inplannen_limiet_is_handmatig
      ),
      zelfInplannenGebruiktMinutenDezeWeek,
      zelfInplannenResterendMinutenDezeWeek,
      planningVrijTeGeven,
      isHandmatigGekoppeld: Boolean(manualLink),
      onboardingNotitie: manualLink?.onboarding_notitie ?? null,
      intakeChecklistKeys: manualLink?.intake_checklist_keys ?? [],
      accountStatus: authStateMap.get(student.profile_id)?.accountStatus,
      lastSignInAt: authStateMap.get(student.profile_id)?.lastSignInAt ?? null,
    };
  });

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
        "id, leerling_id, instructeur_id, vaardigheid_key, beoordelings_datum, status, notitie, created_at"
      )
      .eq("leerling_id", leerling.id)
      .order("beoordelings_datum", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("leerling_voortgang_lesnotities")
      .select(
        "id, leerling_id, instructeur_id, lesdatum, samenvatting, sterk_punt, focus_volgende_les, created_at, updated_at"
      )
      .eq("leerling_id", leerling.id)
      .order("lesdatum", { ascending: false })
      .order("updated_at", { ascending: false }),
  ]);

  const assessments =
    ((assessmentsResult.data ?? []) as StudentProgressAssessment[]) ?? [];
  const notes =
    ((notesResult.data ?? []) as StudentProgressLessonNoteRow[]).map((note) => ({
      ...note,
    })) ?? [];

  const instructeurIds = Array.from(
    new Set([
      ...assessments.map((assessment) => assessment.instructeur_id),
      ...notes.map((note) => note.instructeur_id),
    ])
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
    (instructeursRows ?? []).map((row) => [row.id, row.profile_id])
  );
  const profileNameMap = new Map(
    (profiles ?? []).map((row) => [row.id, row.volledige_naam])
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
      ? profileNameMap.get(
          instructorProfileMap.get(latestInstructorId) ?? ""
        ) ?? null
      : null,
  };
}
