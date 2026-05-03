import "server-only";

import {
  ACTIVE_BOOKED_LESSON_STATUSES,
  ACTIVE_REQUEST_HOLD_STATUSES,
  type BookingWindow,
  createBookingWindowFromLesson,
  createBookingWindowFromRequest,
  filterBookableAvailabilitySlots,
} from "@/lib/booking-availability";
import { getCurrentInstructorPackages } from "@/lib/data/packages";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";
import { formatCurrency } from "@/lib/format";
import {
  getStudentExamReadiness,
  getStudentPackageTrajectorySignal,
} from "@/lib/student-progress";
import { createServerClient } from "@/lib/supabase/server";
import type {
  InstructorStudentProgressRow,
  Pakket,
  StudentProgressAssessment,
  StudentProgressLessonNote,
} from "@/lib/types";

type GrowthBadge = "success" | "warning" | "danger" | "info";
export type InstructorGrowthActionType = "package_suggestion" | "gap_nudge";

type InstructorLessonRow = {
  leerling_id: string | null;
  start_at: string | null;
  duur_minuten: number | null;
  status: string | null;
};

type InstructorRequestRow = {
  leerling_id: string | null;
  voorkeursdatum: string | null;
  tijdvak: string | null;
  status: string | null;
};

type InstructorAvailabilityRow = {
  id: string;
  start_at: string | null;
  eind_at: string | null;
  beschikbaar: boolean | null;
};

export type InstructorGrowthInsightItem = {
  id: string;
  studentId?: string;
  title: string;
  badgeLabel: string;
  badge: GrowthBadge;
  detail: string;
  meta?: string;
  href: string;
  ctaLabel: string;
  openLabel?: string;
  actionType?: InstructorGrowthActionType;
  suggestedPackageId?: string;
  suggestedPackageName?: string;
  currentPackageName?: string;
  nudgeStudentIds?: string[];
  nudgeStudentNames?: string[];
  slotStartAt?: string;
  slotEndAt?: string;
  draftText?: string;
};

export type InstructorGrowthSummary = {
  headline: string;
  readyActions: number;
  estimatedGrowthValueLabel: string;
  nudgeAudienceLabel: string;
};

export type InstructorGrowthInsights = {
  summary: InstructorGrowthSummary;
  packageOpportunities: InstructorGrowthInsightItem[];
  fillGaps: InstructorGrowthInsightItem[];
  upgradeCandidates: InstructorGrowthInsightItem[];
};

type InstructorStudentWorkspace = Awaited<
  ReturnType<typeof getInstructeurStudentsWorkspace>
>;

function formatSlotMeta(startAt: string, endAt: string) {
  const dayLabel = new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(startAt));
  const startLabel = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(startAt));
  const endLabel = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(endAt));

  return `${dayLabel} | ${startLabel} - ${endLabel}`;
}

function isPrimeTimeSlot(startAt: string) {
  const date = new Date(startAt);
  const day = date.getDay();
  const hour = date.getHours();

  return day === 0 || day === 6 || hour >= 17;
}

function getFutureThreshold(days: number) {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

function sortPackagesForGrowth(left: Pakket, right: Pakket) {
  if (left.lessen !== right.lessen) {
    return left.lessen - right.lessen;
  }

  return left.prijs - right.prijs;
}

function getPackageKeywordsScore(pkg: Pakket) {
  const haystack = `${pkg.naam} ${pkg.badge ?? ""} ${(pkg.labels ?? []).join(
    " "
  )} ${pkg.beschrijving}`.toLowerCase();
  let score = 0;

  if (haystack.includes("examen")) {
    score += 4;
  }

  if (haystack.includes("proef")) {
    score += 2;
  }

  if (haystack.includes("spoed")) {
    score += 1;
  }

  return score;
}

function getExamPackage(packages: Pakket[]) {
  return (
    [...packages].sort((left, right) => {
      const scoreDiff =
        getPackageKeywordsScore(right) - getPackageKeywordsScore(left);

      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return sortPackagesForGrowth(right, left);
    })[0] ?? null
  );
}

function getNextBiggerPackage(currentPackage: Pakket, packages: Pakket[]) {
  return (
    [...packages]
      .filter(
        (pkg) =>
          pkg.id !== currentPackage.id &&
          pkg.lessen > currentPackage.lessen &&
          pkg.prijs >= currentPackage.prijs &&
          pkg.les_type === currentPackage.les_type
      )
      .sort(sortPackagesForGrowth)[0] ?? null
  );
}

function getAssessmentsMap(assessments: StudentProgressAssessment[]) {
  const map = new Map<string, StudentProgressAssessment[]>();

  for (const assessment of assessments) {
    const current = map.get(assessment.leerling_id) ?? [];
    current.push(assessment);
    map.set(assessment.leerling_id, current);
  }

  return map;
}

function getNotesMap(notes: StudentProgressLessonNote[]) {
  const map = new Map<string, StudentProgressLessonNote[]>();

  for (const note of notes) {
    const current = map.get(note.leerling_id) ?? [];
    current.push(note);
    map.set(note.leerling_id, current);
  }

  return map;
}

function getLessonsMap(lessons: InstructorLessonRow[]) {
  const map = new Map<string, InstructorLessonRow[]>();

  for (const lesson of lessons) {
    if (!lesson.leerling_id) {
      continue;
    }

    const current = map.get(lesson.leerling_id) ?? [];
    current.push(lesson);
    map.set(lesson.leerling_id, current);
  }

  return map;
}

function getRequestsMap(requests: InstructorRequestRow[]) {
  const map = new Map<string, InstructorRequestRow[]>();

  for (const request of requests) {
    if (!request.leerling_id) {
      continue;
    }

    const current = map.get(request.leerling_id) ?? [];
    current.push(request);
    map.set(request.leerling_id, current);
  }

  return map;
}

function buildStartPackageDraft(studentName: string, packageName: string) {
  return `Hi ${studentName}, ik heb naar jouw traject gekeken en ${packageName} voelt nu als een slimme volgende stap. Daarmee kunnen we rustiger plannen en weet je meteen waar je qua lessen en opbouw aan toe bent. Als je wilt, zet ik dit direct voor je klaar.`;
}

function buildUpgradeDraft(
  studentName: string,
  currentPackageName: string,
  nextPackageName: string
) {
  return `Hi ${studentName}, je bouwt goed door. Ik denk dat ${nextPackageName} nu een logische stap is na ${currentPackageName}, zodat we voldoende ruimte houden voor herhaling, ritme en de volgende groeifase. Als je wilt, zet ik dit voorstel meteen voor je klaar.`;
}

function buildGapNudgeDraft(
  names: string[],
  slotLabel: string,
  directPlanningAllowed: boolean
) {
  const namesLabel =
    names.length > 1
      ? `${names.slice(0, -1).join(", ")} en ${names[names.length - 1]}`
      : names[0] ?? "je";

  return directPlanningAllowed
    ? `Hi ${namesLabel}, ik heb een mooi vrij lesmoment voor je opengezet op ${slotLabel}. Als dit past, kun je het direct pakken zodat je ritme mooi doorloopt.`
    : `Hi ${namesLabel}, ik heb een mooi vrij lesmoment beschikbaar op ${slotLabel}. Als dit voor je past, laat het me weten dan zet ik het direct voor je vast.`;
}

function buildTargetNamesSummary(names: string[]) {
  if (!names.length) {
    return null;
  }

  if (names.length === 1) {
    return names[0];
  }

  if (names.length === 2) {
    return `${names[0]} en ${names[1]}`;
  }

  return `${names[0]}, ${names[1]} en ${names.length - 2} meer`;
}

function getPrioritizedNudgeTargets(students: InstructorStudentProgressRow[]) {
  return [...students].sort((left, right) => {
    const selfSchedulingDiff =
      Number(Boolean(right.zelfInplannenToegestaan)) -
      Number(Boolean(left.zelfInplannenToegestaan));

    if (selfSchedulingDiff !== 0) {
      return selfSchedulingDiff;
    }

    const nextLessonLeft = left.volgendeLesAt
      ? new Date(left.volgendeLesAt).getTime()
      : 0;
    const nextLessonRight = right.volgendeLesAt
      ? new Date(right.volgendeLesAt).getTime()
      : 0;

    if (nextLessonLeft !== nextLessonRight) {
      return nextLessonLeft - nextLessonRight;
    }

    return right.voortgang - left.voortgang;
  });
}

function getRotatingTargets(
  students: InstructorStudentProgressRow[],
  slotIndex: number,
  limit = 3
) {
  if (!students.length) {
    return [];
  }

  const count = Math.min(limit, students.length);

  return Array.from({ length: count }, (_, offset) => {
    const index = (slotIndex + offset) % students.length;
    return students[index];
  });
}

export async function getInstructorGrowthInsights(
  workspaceOverride?: InstructorStudentWorkspace | Promise<InstructorStudentWorkspace>,
): Promise<InstructorGrowthInsights> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      summary: {
        headline: "Geen groeidata beschikbaar",
        readyActions: 0,
        estimatedGrowthValueLabel: "Geen directe groeikans",
        nudgeAudienceLabel: "Nog geen nudge-doelgroep",
      },
      packageOpportunities: [],
      fillGaps: [],
      upgradeCandidates: [],
    };
  }

  const supabase = await createServerClient();
  const nowIso = new Date().toISOString();
  const nextWeekIso = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    workspace,
    packages,
    lessonsResult,
    requestsResult,
    availabilityResult,
  ] = await Promise.all([
    workspaceOverride
      ? Promise.resolve(workspaceOverride)
      : getInstructeurStudentsWorkspace(),
    getCurrentInstructorPackages(),
    supabase
      .from("lessen")
      .select("leerling_id, start_at, duur_minuten, status")
      .eq("instructeur_id", instructeur.id)
      .order("start_at", { ascending: false })
      .limit(1000),
    supabase
      .from("lesaanvragen")
      .select("leerling_id, voorkeursdatum, tijdvak, status")
      .eq("instructeur_id", instructeur.id)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("beschikbaarheid")
      .select("id, start_at, eind_at, beschikbaar")
      .eq("instructeur_id", instructeur.id)
      .eq("beschikbaar", true)
      .gte("start_at", nowIso)
      .lte("start_at", nextWeekIso)
      .order("start_at", { ascending: true }),
  ]);

  const activePackages = packages
    .filter((pkg) => pkg.actief !== false)
    .sort(sortPackagesForGrowth);
  const starterPackage = activePackages[0] ?? null;
  const examPackage = getExamPackage(activePackages);
  const packageById = new Map(activePackages.map((pkg) => [pkg.id, pkg]));
  const assessmentsByStudent = getAssessmentsMap(workspace.assessments);
  const notesByStudent = getNotesMap(workspace.notes);
  const lessonRows = (lessonsResult.data ?? []) as InstructorLessonRow[];
  const requestRows = (requestsResult.data ?? []) as InstructorRequestRow[];
  const availabilityRows = (availabilityResult.data ?? []) as InstructorAvailabilityRow[];
  const lessonsByStudent = getLessonsMap(lessonRows);
  const requestsByStudent = getRequestsMap(requestRows);
  const growthValueByStudent = new Map<string, number>();

  const registerGrowthValue = (studentId: string, value: number) => {
    const current = growthValueByStudent.get(studentId) ?? 0;
    growthValueByStudent.set(studentId, Math.max(current, value));
  };

  const packageOpportunities: Array<
    InstructorGrowthInsightItem & { sortScore: number }
  > = [];
  const upgradeCandidates: Array<
    InstructorGrowthInsightItem & {
      remainingLessons: number;
      readinessScore: number;
    }
  > = [];

  for (const student of workspace.students) {
    const studentAssessments = assessmentsByStudent.get(student.id) ?? [];
    const studentNotes = notesByStudent.get(student.id) ?? [];
    const readiness = getStudentExamReadiness(
      studentAssessments,
      studentNotes
    );
    const studentLessons = (lessonsByStudent.get(student.id) ?? []).filter(
      (lesson) => lesson.status && lesson.status !== "geannuleerd"
    );
    const studentRequests = requestsByStudent.get(student.id) ?? [];
    const currentPackage = student.pakketId
      ? packageById.get(student.pakketId) ?? null
      : null;
    const currentPackageName = currentPackage?.naam ?? student.pakket;
    const packagePlannedLessons =
      student.pakketIngeplandeLessen ??
      studentLessons.filter((lesson) =>
        ["geaccepteerd", "ingepland"].includes(lesson.status ?? "")
      ).length;
    const packageUsedLessons =
      student.pakketGevolgdeLessen ??
      studentLessons.filter((lesson) => lesson.status === "afgerond").length;
    const packageTotalLessons =
      student.pakketTotaalLessen ?? currentPackage?.lessen ?? null;
    const packageRemainingLessons =
      student.pakketResterendeLessen ??
      (packageTotalLessons != null
        ? Math.max(packageTotalLessons - packagePlannedLessons - packageUsedLessons, 0)
        : null);
    const packageSignal = getStudentPackageTrajectorySignal({
      packageName: currentPackage ? currentPackageName : null,
      totalLessons: packageTotalLessons,
      plannedLessons: packagePlannedLessons,
      usedLessons: packageUsedLessons,
      remainingLessons: packageRemainingLessons,
    });
    const consumedPackageLessons = packagePlannedLessons + packageUsedLessons;
    const hasUpcomingLesson =
      Boolean(student.volgendeLesAt) &&
      new Date(student.volgendeLesAt as string).getTime() > Date.now();
    const needsNextLesson =
      !hasUpcomingLesson ||
      new Date(student.volgendeLesAt as string).getTime() >
        getFutureThreshold(6);

    if (!currentPackage && starterPackage) {
      const suggestedPackage =
        readiness.score >= 62 &&
        examPackage &&
        examPackage.id !== starterPackage.id
          ? examPackage
          : starterPackage;
      const label =
        studentRequests.length > 0 || studentLessons.length > 0
          ? "Traject zonder pakket"
          : "Startpakket klaarzetten";
      const detail =
        studentLessons.length > 0
          ? `${student.naam} heeft al ${studentLessons.length} les${
              studentLessons.length === 1 ? "" : "sen"
            } in beweging. Zet nu een duidelijk pakket neer zodat prijs, planning en vervolg beter kloppen.`
          : `${student.naam} staat al in je werkplek. Met een vast pakket maak je de intake direct concreter en beter verkoopbaar.`;

      packageOpportunities.push({
        id: `package-empty-${student.id}`,
        studentId: student.id,
        title: student.naam,
        badgeLabel: label,
        badge: studentLessons.length > 0 ? "warning" : "info",
        detail,
        meta: `${suggestedPackage.naam} | ${formatCurrency(
          suggestedPackage.prijs
        )} | ${suggestedPackage.lessen} lessen`,
        href: "/instructeur/leerlingen",
        ctaLabel: "Stuur voorstel",
        openLabel: "Open werkplek",
        actionType: "package_suggestion",
        suggestedPackageId: suggestedPackage.id,
        suggestedPackageName: suggestedPackage.naam,
        draftText: buildStartPackageDraft(
          student.naam,
          suggestedPackage.naam
        ),
        sortScore:
          studentLessons.length * 10 + (student.isHandmatigGekoppeld ? 6 : 0),
      });
      registerGrowthValue(student.id, suggestedPackage.prijs);
    }

    if (!currentPackage) {
      continue;
    }

    const nextBiggerPackage = getNextBiggerPackage(
      currentPackage,
      activePackages
    );

    if (
      nextBiggerPackage &&
      (currentPackage.lessen <= 2 ||
        /losse|proefles|intake|opfris/i.test(
          currentPackageName.toLowerCase()
        )) &&
      (consumedPackageLessons >= Math.max(1, currentPackage.lessen) ||
        packageSignal.shouldSuggestAdditionalPackage)
    ) {
      packageOpportunities.push({
        id: `package-light-${student.id}`,
        studentId: student.id,
        title: student.naam,
        badgeLabel: "Licht pakket loopt vol",
        badge: "info",
        detail: `${currentPackageName} voelt nu meer als opstap. ${nextBiggerPackage.naam} geeft ${
          nextBiggerPackage.lessen - currentPackage.lessen
        } extra les${
          nextBiggerPackage.lessen - currentPackage.lessen === 1 ? "" : "sen"
        } en houdt de lijn voor deze leerling rustiger vast.`,
        meta: `${currentPackageName} -> ${nextBiggerPackage.naam} | ${formatCurrency(
          nextBiggerPackage.prijs
        )}`,
        href: "/instructeur/leerlingen",
        ctaLabel: "Stuur voorstel",
        openLabel: "Open werkplek",
        actionType: "package_suggestion",
        suggestedPackageId: nextBiggerPackage.id,
        suggestedPackageName: nextBiggerPackage.naam,
        currentPackageName,
        draftText: buildUpgradeDraft(
          student.naam,
          currentPackageName,
          nextBiggerPackage.naam
        ),
        sortScore: 30 + consumedPackageLessons,
      });
      registerGrowthValue(
        student.id,
        Math.max(nextBiggerPackage.prijs - currentPackage.prijs, 0)
      );
    }

    if (!nextBiggerPackage) {
      continue;
    }

    const remainingLessons = packageSignal.remainingLessons ?? Math.max(
      currentPackage.lessen - consumedPackageLessons,
      0
    );
    const upgradeSignal =
      packageSignal.shouldSuggestAdditionalPackage ||
      remainingLessons <= 2 ||
      readiness.score >= 62 ||
      (student.voortgang >= 60 && needsNextLesson);

    if (!upgradeSignal) {
      continue;
    }

    const extraLessons = nextBiggerPackage.lessen - currentPackage.lessen;
    const extraPrice = Math.max(
      nextBiggerPackage.prijs - currentPackage.prijs,
      0
    );

    upgradeCandidates.push({
      id: `upgrade-${student.id}`,
      studentId: student.id,
      title: student.naam,
      badgeLabel:
        readiness.score >= 82
          ? "Examenversneller"
          : remainingLessons <= 1
            ? "Bijna door pakket heen"
            : "Klaar voor volgende stap",
      badge:
        readiness.score >= 82
          ? "success"
          : remainingLessons <= 1
            ? "warning"
            : "info",
      detail:
        remainingLessons <= 1
          ? `${currentPackageName} is bijna opgebruikt. ${nextBiggerPackage.naam} houdt het ritme vast zonder losse tussenstap.`
          : readiness.score >= 62
            ? `${student.naam} zit richting proefexamen. ${nextBiggerPackage.naam} geeft extra ruimte voor examengerichte ritten en herhaling.`
            : `${student.naam} bouwt stabiel door. Een groter pakket voorkomt dat je straks te laat moet schakelen.`,
      meta: `${currentPackageName} -> ${nextBiggerPackage.naam} | +${extraLessons} lessen | +${formatCurrency(
        extraPrice
      )}`,
      href: "/instructeur/leerlingen",
      ctaLabel: "Stuur upgrade",
      openLabel: "Open werkplek",
      actionType: "package_suggestion",
      suggestedPackageId: nextBiggerPackage.id,
      suggestedPackageName: nextBiggerPackage.naam,
      currentPackageName,
      draftText: buildUpgradeDraft(
        student.naam,
        currentPackageName,
        nextBiggerPackage.naam
      ),
      remainingLessons,
      readinessScore: readiness.score,
    });
    registerGrowthValue(student.id, extraPrice);
  }

  const lessonBookingWindows: BookingWindow[] = lessonRows
    .filter(
      (lesson): lesson is InstructorLessonRow & {
        start_at: string;
        status: string;
      } =>
        Boolean(lesson.start_at && lesson.status) &&
        ACTIVE_BOOKED_LESSON_STATUSES.includes(
          lesson.status as (typeof ACTIVE_BOOKED_LESSON_STATUSES)[number]
        )
    )
    .map((lesson) =>
      createBookingWindowFromLesson({
        startAt: lesson.start_at,
        durationMinutes: lesson.duur_minuten,
        status: lesson.status as (typeof ACTIVE_BOOKED_LESSON_STATUSES)[number],
      })
    )
    .flatMap((window) => (window ? [window] : []));

  const requestBookingWindows: BookingWindow[] = requestRows
    .filter(
      (request): request is InstructorRequestRow & { status: string } =>
        Boolean(request.status) &&
        ACTIVE_REQUEST_HOLD_STATUSES.includes(
          request.status as (typeof ACTIVE_REQUEST_HOLD_STATUSES)[number]
        )
    )
    .map((request) =>
      createBookingWindowFromRequest({
        preferredDate: request.voorkeursdatum,
        timeSlot: request.tijdvak,
        status: request.status as (typeof ACTIVE_REQUEST_HOLD_STATUSES)[number],
      })
    )
    .flatMap((window) => (window ? [window] : []));

  const freeSlots = filterBookableAvailabilitySlots(availabilityRows, [
    ...lessonBookingWindows,
    ...requestBookingWindows,
  ]).slice(0, 6);

  const studentsNeedingMomentum = workspace.students.filter((student) => {
    if (!student.planningVrijTeGeven) {
      return false;
    }

    if (!student.volgendeLesAt) {
      return true;
    }

    return new Date(student.volgendeLesAt).getTime() > getFutureThreshold(6);
  });
  const nudgeTargetPool = getPrioritizedNudgeTargets(studentsNeedingMomentum);

  const fillGaps: InstructorGrowthInsightItem[] = freeSlots.map(
    (slot, slotIndex) => {
      const slotMeta =
        slot.start_at && slot.eind_at
          ? formatSlotMeta(slot.start_at, slot.eind_at)
          : "Komend boekbaar moment";
      const primeTime = slot.start_at ? isPrimeTimeSlot(slot.start_at) : false;
      const leadStudent = studentsNeedingMomentum[0];
      const targetStudents = getRotatingTargets(nudgeTargetPool, slotIndex);
      const targetNames = targetStudents.map((student) => student.naam);
      const directPlanningAllowed = targetStudents.some((student) =>
        Boolean(student.zelfInplannenToegestaan)
      );
      const namesSummary = buildTargetNamesSummary(targetNames);

      return {
        id: `gap-${slot.id}`,
        title: slotMeta,
        badgeLabel: primeTime ? "Topmoment" : "Nog vrij",
        badge: primeTime ? "success" : "info",
        detail: targetStudents.length
          ? directPlanningAllowed
            ? `Stuur dit moment meteen door naar ${namesSummary}. Deze leerling${
                targetStudents.length === 1 ? "" : "en"
              } kan of kunnen waarschijnlijk direct schakelen.`
            : `Gebruik dit open moment als slimme opvolging voor ${namesSummary}. Zo houd je het traject warm en pak je een stil gat direct mee.`
          : studentsNeedingMomentum.length > 0
            ? `${studentsNeedingMomentum.length} leerling${
                studentsNeedingMomentum.length === 1 ? "" : "en"
              } hebben nog geen verse les klaarstaan. Begin bijvoorbeeld bij ${
                leadStudent?.naam ?? "je stille trajecten"
              }.`
            : "Gebruik dit moment voor een proefles, intake of om een stille leerling weer in beweging te krijgen.",
        meta: namesSummary
          ? `${primeTime ? "Topmoment" : "Open plek"} voor ${namesSummary}`
          : primeTime
            ? "Avond- of weekendmoment met hoge boekingskans"
            : "Open plek in je komende week",
        href: "/instructeur/beschikbaarheid",
        ctaLabel: targetStudents.length ? "Stuur nudge" : "Open agenda",
        openLabel: "Open agenda",
        actionType: targetStudents.length ? "gap_nudge" : undefined,
        nudgeStudentIds: targetStudents.map((student) => student.id),
        nudgeStudentNames: targetNames,
        slotStartAt: slot.start_at ?? undefined,
        slotEndAt: slot.eind_at ?? undefined,
        draftText: targetStudents.length
          ? buildGapNudgeDraft(
              targetNames,
              slotMeta,
              directPlanningAllowed
            )
          : undefined,
      };
    }
  );

  const estimatedGrowthValue = Array.from(
    growthValueByStudent.values()
  ).reduce((sum, value) => sum + value, 0);
  const uniqueNudgeAudienceCount = new Set(
    fillGaps.flatMap((item) => item.nudgeStudentIds ?? [])
  ).size;
  const readyActions =
    packageOpportunities.length +
    upgradeCandidates.length +
    fillGaps.filter((item) => (item.nudgeStudentIds ?? []).length > 0).length;

  return {
    summary: {
      headline:
        readyActions > 0
          ? `${readyActions} directe opvolgacties klaar`
          : "Je groeiradar is rustig",
      readyActions,
      estimatedGrowthValueLabel:
        estimatedGrowthValue > 0
          ? formatCurrency(estimatedGrowthValue)
          : "Geen directe groeikans",
      nudgeAudienceLabel:
        uniqueNudgeAudienceCount > 0
          ? `${uniqueNudgeAudienceCount} leerling${
              uniqueNudgeAudienceCount === 1 ? "" : "en"
            }`
          : "Nog geen nudge-doelgroep",
    },
    packageOpportunities: packageOpportunities
      .sort((left, right) => right.sortScore - left.sortScore)
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        studentId: item.studentId,
        title: item.title,
        badgeLabel: item.badgeLabel,
        badge: item.badge,
        detail: item.detail,
        meta: item.meta,
        href: item.href,
        ctaLabel: item.ctaLabel,
        openLabel: item.openLabel,
        actionType: item.actionType,
        suggestedPackageId: item.suggestedPackageId,
        suggestedPackageName: item.suggestedPackageName,
        currentPackageName: item.currentPackageName,
        draftText: item.draftText,
      })),
    fillGaps,
    upgradeCandidates: upgradeCandidates
      .sort((left, right) => {
        if (left.remainingLessons !== right.remainingLessons) {
          return left.remainingLessons - right.remainingLessons;
        }

        return right.readinessScore - left.readinessScore;
      })
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        studentId: item.studentId,
        title: item.title,
        badgeLabel: item.badgeLabel,
        badge: item.badge,
        detail: item.detail,
        meta: item.meta,
        href: item.href,
        ctaLabel: item.ctaLabel,
        openLabel: item.openLabel,
        actionType: item.actionType,
        suggestedPackageId: item.suggestedPackageId,
        suggestedPackageName: item.suggestedPackageName,
        currentPackageName: item.currentPackageName,
        draftText: item.draftText,
      })),
  };
}
