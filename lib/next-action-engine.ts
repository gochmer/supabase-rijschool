import type { DriverJourneyStatus } from "@/lib/driver-journey";
import {
  getStudentExamReadiness,
  getStudentProgressFocusItems,
  getStudentProgressStatusMeta,
} from "@/lib/student-progress";
import type {
  Les,
  LesAanvraag,
  StudentProgressAssessment,
  StudentProgressLessonNote,
} from "@/lib/types";

export type NextActionCategory =
  | "exam"
  | "feedback"
  | "onboarding"
  | "package"
  | "planning"
  | "skill";

export type NextActionTone = "default" | "danger" | "success" | "warning";

export type LearnerNextActionSignal = {
  label: string;
  tone: NextActionTone;
  value: string;
};

export type LearnerNextAction = {
  category: NextActionCategory;
  ctaLabel: string;
  description: string;
  href: string;
  id: string;
  label: string;
  reason: string;
  ruleLabel: string;
  signals: LearnerNextActionSignal[];
  title: string;
  tone: NextActionTone;
  value: string;
};

export type LearnerNextActionContext = {
  assessments: StudentProgressAssessment[];
  hasPackage?: boolean | null;
  journeyStatus?: DriverJourneyStatus | string | null;
  lessons: Les[];
  notes?: StudentProgressLessonNote[];
  profileComplete?: boolean | null;
  requests?: LesAanvraag[];
};

const ACTIVE_LESSON_STATUSES = ["geaccepteerd", "ingepland"] as const;
const COMPLETED_LESSON_STATUS = "afgerond";
const EXAM_READY_COMPLETED_LESSON_THRESHOLD = 22;

function getLessonTimeValue(lesson: Les) {
  if (lesson.start_at) {
    const time = new Date(lesson.start_at).getTime();
    return Number.isNaN(time) ? null : time;
  }

  const time = new Date(`${lesson.datum} ${lesson.tijd}`).getTime();
  return Number.isNaN(time) ? null : time;
}

function getUpcomingLessons(lessons: Les[]) {
  return lessons
    .filter((lesson) => ACTIVE_LESSON_STATUSES.includes(lesson.status as never))
    .sort((left, right) => {
      const leftTime = getLessonTimeValue(left) ?? Number.MAX_SAFE_INTEGER;
      const rightTime = getLessonTimeValue(right) ?? Number.MAX_SAFE_INTEGER;

      return leftTime - rightTime;
    });
}

function getPendingRequests(requests: LesAanvraag[]) {
  return requests.filter((request) => request.status === "aangevraagd");
}

function getCompletedLessonCount(lessons: Les[]) {
  return lessons.filter((lesson) => lesson.status === COMPLETED_LESSON_STATUS)
    .length;
}

function withSignals(
  action: Omit<LearnerNextAction, "signals">,
  signals: LearnerNextActionSignal[],
): LearnerNextAction {
  return {
    ...action,
    signals,
  };
}

export function resolveLearnerNextAction({
  assessments,
  hasPackage = false,
  journeyStatus,
  lessons,
  notes = [],
  profileComplete = true,
  requests = [],
}: LearnerNextActionContext): LearnerNextAction {
  const upcomingLessons = getUpcomingLessons(lessons);
  const nextLesson = upcomingLessons[0] ?? null;
  const pendingRequests = getPendingRequests(requests);
  const completedLessons = getCompletedLessonCount(lessons);
  const focusSkill = getStudentProgressFocusItems(assessments, 1)[0] ?? null;
  const focusMeta = focusSkill?.latest?.status
    ? getStudentProgressStatusMeta(focusSkill.latest.status)
    : null;
  const examReadiness = getStudentExamReadiness(assessments, notes);
  const hasWeakSkill =
    focusSkill?.latest?.status === "herhaling" ||
    focusSkill?.latest?.status === "uitleg";
  const signals: LearnerNextActionSignal[] = [
    {
      label: "Planning",
      tone: nextLesson ? "success" : pendingRequests.length ? "warning" : "danger",
      value: nextLesson
        ? nextLesson.datum
        : pendingRequests.length
          ? "Aanvraag open"
          : "Geen les",
    },
    {
      label: "Skill",
      tone: hasWeakSkill
        ? focusSkill?.latest?.status === "herhaling"
          ? "danger"
          : "warning"
        : focusSkill
          ? "default"
          : "warning",
      value: focusSkill
        ? (focusMeta?.label ?? "Nog open")
        : "Nog geen focus",
    },
    {
      label: "Examen",
      tone:
        examReadiness.score >= 82 ||
        completedLessons >= EXAM_READY_COMPLETED_LESSON_THRESHOLD
          ? "success"
          : "default",
      value:
        examReadiness.score >= 1
          ? `${examReadiness.score}% gereed`
          : `${completedLessons} lessen`,
    },
  ];

  if (journeyStatus === "geslaagd") {
    return withSignals({
      category: "feedback",
      ctaLabel: "Profiel afronden",
      description:
        "Je traject staat op geslaagd. Rond review, betalingen en eventuele nazorg rustig af.",
      href: "/leerling/profiel",
      id: "journey-passed",
      label: "Volgende stap",
      reason: "De Driver Journey staat op geslaagd.",
      ruleLabel: "Traject afgerond",
      title: "Rond je traject af",
      tone: "success",
      value: "Geslaagd",
    }, signals);
  }

  if (!profileComplete) {
    return withSignals({
      category: "onboarding",
      ctaLabel: "Profiel aanvullen",
      description:
        "Maak je naam en telefoon compleet zodat instructeurs je sneller kunnen helpen.",
      href: "/leerling/profiel",
      id: "complete-profile",
      label: "Volgende stap",
      reason: "Basisgegevens zijn nog niet compleet.",
      ruleLabel: "Profiel eerst",
      title: "Maak je profiel compleet",
      tone: "warning",
      value: "Profiel",
    }, signals);
  }

  if (!hasPackage && (completedLessons > 0 || lessons.length > 0)) {
    return withSignals({
      category: "package",
      ctaLabel: "Pakket kiezen",
      description:
        "Je traject is gestart, maar vervolglessen blijven duidelijker zodra er een pakket is gekoppeld.",
      href: "/leerling/instructeurs",
      id: "choose-package-after-start",
      label: "Volgende stap",
      reason: "Er zijn lessen bekend, maar nog geen pakket gekoppeld.",
      ruleLabel: "Pakket ontbreekt",
      title: "Kies of bevestig je pakket",
      tone: "warning",
      value: "Pakket",
    }, signals);
  }

  if (
    journeyStatus === "examen_klaar" ||
    examReadiness.score >= 82 ||
    completedLessons >= EXAM_READY_COMPLETED_LESSON_THRESHOLD
  ) {
    return withSignals({
      category: "exam",
      ctaLabel: "Examenstap bespreken",
      description:
        examReadiness.score >= 82
          ? `${examReadiness.nextMilestone} Bespreek met je instructeur of proefexamen of praktijkexamen logisch is.`
          : `Je hebt ${completedLessons} lessen afgerond. Bespreek of een examengerichte stap nu past.`,
      href: "/leerling/berichten",
      id: "plan-exam-step",
      label: "Volgende stap",
      reason:
        examReadiness.score >= 82
          ? "Examengereedheid is hoog genoeg voor een examengerichte stap."
          : "Het aantal afgeronde lessen bereikt de examendrempel.",
      ruleLabel: "Examenmoment",
      title: "Plan je examenstap",
      tone: "success",
      value: `${Math.max(examReadiness.score, 0)}% gereed`,
    }, signals);
  }

  if (!nextLesson && hasPackage) {
    return withSignals({
      category: "planning",
      ctaLabel: "Nieuwe les plannen",
      description:
        "Er staat geen aankomende les in je planning. Plan een nieuw moment zodat je ritme niet wegvalt.",
      href: "/leerling/instructeurs",
      id: "schedule-next-lesson",
      label: "Volgende stap",
      reason: "Er is een pakket, maar geen aankomende les.",
      ruleLabel: "Planning valt stil",
      title: "Plan je volgende les",
      tone: "warning",
      value: "Geen les",
    }, signals);
  }

  if (pendingRequests.length > 0 && !nextLesson) {
    const request = pendingRequests[0];

    return withSignals({
      category: "planning",
      ctaLabel: "Aanvraag bekijken",
      description: `${request.instructeur_naam} heeft je aanvraag nog in behandeling. Houd de status en berichten in beeld.`,
      href: "/leerling/boekingen",
      id: "follow-pending-request",
      label: "Volgende stap",
      reason: "Er staat een open aanvraag zonder bevestigde volgende les.",
      ruleLabel: "Aanvraag opvolgen",
      title: "Volg je open aanvraag",
      tone: "warning",
      value: "Wacht op reactie",
    }, signals);
  }

  if (hasWeakSkill && focusSkill) {
    return withSignals({
      category: "skill",
      ctaLabel: "Bekijk voortgang",
      description: `${focusSkill.label} staat nu op ${focusMeta?.label.toLowerCase() ?? "aandacht"}. Maak dit je focus voor de eerstvolgende les.`,
      href: "/leerling/profiel#voortgang",
      id: `focus-${focusSkill.key}`,
      label: "Volgende stap",
      reason: "Een skill blijft achter op basis van de laatste beoordeling.",
      ruleLabel: "Skill blijft achter",
      title: `Focus op ${focusSkill.label}`,
      tone: focusSkill.latest?.status === "herhaling" ? "danger" : "warning",
      value: focusMeta?.label ?? "Focus",
    }, signals);
  }

  if (nextLesson) {
    return withSignals({
      category: "planning",
      ctaLabel: "Les voorbereiden",
      description: focusSkill
        ? `Je volgende les staat klaar. Neem ${focusSkill.label} bewust mee als focuspunt.`
        : `Je volgende les staat gepland op ${nextLesson.datum} om ${nextLesson.tijd}.`,
      href: "/leerling/boekingen",
      id: "prepare-next-lesson",
      label: "Volgende stap",
      reason: "Er staat een aankomende les in de planning.",
      ruleLabel: "Les staat klaar",
      title: "Bereid je volgende les voor",
      tone: "success",
      value: nextLesson.datum,
    }, signals);
  }

  return withSignals({
    category: "onboarding",
    ctaLabel: "Zoek instructeur",
    description:
      "Start met een proefles of aanvraag, zodat je traject en voortgang kunnen beginnen.",
    href: "/instructeurs",
    id: "start-driving-journey",
    label: "Volgende stap",
    reason: "Er zijn nog geen lessen, aanvragen of pakketdata.",
    ruleLabel: "Start traject",
    title: "Start met een proefles",
    tone: "default",
    value: "Begin hier",
  }, signals);
}
