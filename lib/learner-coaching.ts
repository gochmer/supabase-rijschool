import type { LearnerNextAction } from "@/lib/next-action-engine";
import {
  getStudentExamReadiness,
  getStudentNextLessonPlan,
  getStudentProgressFocusItems,
  getStudentProgressSectionSummaries,
} from "@/lib/student-progress";
import type {
  LearnerLearningPreferences,
  Les,
  LesAanvraag,
  StudentProgressAssessment,
  StudentProgressLessonNote,
} from "@/lib/types";

export type LearnerCoachingTone = "danger" | "success" | "warning" | "info";

export type LearnerCoachingSignal = {
  id: string;
  title: string;
  detail: string;
  actionLabel: string;
  href: string;
  tone: LearnerCoachingTone;
  reason: string;
  evidence: string[];
};

export type LearnerBehaviorInsight = {
  label: string;
  value: string;
  detail: string;
  tone: LearnerCoachingTone;
  score: number;
};

export type LearnerScenarioTraining = {
  id: string;
  title: string;
  situation: string;
  practice: string;
  why: string;
  badgeLabel: string;
  tone: LearnerCoachingTone;
};

export type LearnerCoachingModel = {
  behaviorInsights: LearnerBehaviorInsight[];
  explanation: {
    title: string;
    reason: string;
    ruleLabel: string;
    evidence: string[];
  };
  learningProfile: {
    title: string;
    detail: string;
    coachingStyle: string;
  };
  proactiveSignals: LearnerCoachingSignal[];
  scenarioTraining: LearnerScenarioTraining[];
};

type PackageUsageInput = {
  plannedLessons?: number | null;
  remainingLessons?: number | null;
  totalLessons?: number | null;
  usedLessons?: number | null;
};

const ACTIVE_LESSON_STATUSES = new Set(["geaccepteerd", "ingepland"]);

function getSafeTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : null;
}

function getLessonTime(lesson: Les) {
  return getSafeTime(lesson.start_at) ?? getSafeTime(`${lesson.datum} ${lesson.tijd}`);
}

function getUpcomingLessons(lessons: Les[]) {
  const now = Date.now();

  return lessons
    .filter((lesson) => ACTIVE_LESSON_STATUSES.has(lesson.status))
    .filter((lesson) => (getLessonTime(lesson) ?? 0) >= now - 60 * 60_000)
    .sort((left, right) => {
      const leftTime = getLessonTime(left) ?? Number.MAX_SAFE_INTEGER;
      const rightTime = getLessonTime(right) ?? Number.MAX_SAFE_INTEGER;

      return leftTime - rightTime;
    });
}

function getLatestActivityTime({
  assessments,
  lessons,
  notes,
  requests,
}: {
  assessments: StudentProgressAssessment[];
  lessons: Les[];
  notes: StudentProgressLessonNote[];
  requests: LesAanvraag[];
}) {
  const times = [
    ...lessons.map((lesson) => getLessonTime(lesson)),
    ...requests.map((request) => getSafeTime(request.start_at ?? request.voorkeursdatum)),
    ...assessments.map((assessment) => getSafeTime(assessment.created_at)),
    ...notes.map((note) => getSafeTime(note.updated_at ?? note.created_at)),
  ].filter((value): value is number => value != null);

  return times.length ? Math.max(...times) : null;
}

function getDaysSince(time: number | null) {
  if (time == null) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
}

function getLearningProfile(preferences?: LearnerLearningPreferences | null) {
  const style = preferences?.leerstijl ?? "praktisch";
  const guidance = preferences?.begeleiding ?? "rustig";

  const styleText: Record<string, string> = {
    examengericht: "Examenroute met korte checkpoints",
    praktisch: "Praktisch oefenen in echte verkeerssituaties",
    stap_voor_stap: "Stap voor stap opbouwen met duidelijke volgorde",
    visueel: "Visuele voorbeelden en scenario's eerst",
  };
  const guidanceText: Record<string, string> = {
    direct: "Kort, direct en actiegericht",
    motiverend: "Motiverend met kleine wins",
    rustig: "Rustig en overzichtelijk",
    uitgebreid: "Meer uitleg en context per stap",
  };

  return {
    title: styleText[style] ?? styleText.praktisch,
    detail:
      preferences?.spanningsniveau === "hoog"
        ? "Adviezen houden extra rekening met spanning en vertrouwen."
        : "Adviezen sluiten aan op je gekozen leerstijl en oefenritme.",
    coachingStyle: guidanceText[guidance] ?? guidanceText.rustig,
  };
}

function buildScenarioTraining({
  assessments,
  notes,
  preferences,
}: {
  assessments: StudentProgressAssessment[];
  notes: StudentProgressLessonNote[];
  preferences?: LearnerLearningPreferences | null;
}): LearnerScenarioTraining[] {
  const focusItems = getStudentProgressFocusItems(assessments, 4);
  const nextLessonPlan = getStudentNextLessonPlan(assessments, notes);
  const preferredFocus = new Set(preferences?.scenario_focus ?? []);
  const scenarios: LearnerScenarioTraining[] = [];

  for (const item of focusItems) {
    const isPreferred = preferredFocus.has(item.sectionKey) || preferredFocus.has(item.key);

    scenarios.push({
      id: `focus-${item.key}`,
      title: item.label,
      situation:
        item.sectionKey === "examengericht"
          ? "Je rijdt zelfstandig een onbekende route en krijgt onverwachte verkeersdrukte."
          : item.sectionKey === "verkeersdeelname"
            ? "Je nadert een druk kruispunt met fietsers, tegenliggers en voorrangsmomenten."
            : item.sectionKey === "kijktechniek"
              ? "Je wisselt van richting terwijl je spiegels, dode hoek en snelheid tegelijk bewaakt."
              : "Je voert de handeling rustig uit op een veilige plek en bouwt daarna verkeer erbij op.",
      practice:
        preferences?.leerstijl === "stap_voor_stap"
          ? "Werk in drie stappen: voordoen, samen uitvoeren, zelfstandig herhalen."
          : "Oefen eerst langzaam, benoem hardop wat je ziet en herhaal daarna in normaal tempo.",
      why: `Dit scenario past omdat ${item.label.toLowerCase()} nu als focuspunt uit je voortgang komt.`,
      badgeLabel: isPreferred ? "Voorkeur" : "Focus",
      tone: isPreferred ? "success" : "info",
    });
  }

  for (const item of nextLessonPlan) {
    if (scenarios.length >= 5) {
      break;
    }

    scenarios.push({
      id: `plan-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title: item.title,
      situation: "Gebruik dit als concrete voorbereiding voor je eerstvolgende les.",
      practice: item.detail,
      why: "Dit komt uit je laatste lesnotitie, toetsblok of voortgangskaart.",
      badgeLabel: item.badgeLabel,
      tone: item.badge === "danger" ? "danger" : item.badge === "warning" ? "warning" : "info",
    });
  }

  return scenarios.slice(0, 5);
}

function getPackagePressure(packageUsage?: PackageUsageInput | null) {
  if (!packageUsage?.totalLessons) {
    return 0;
  }

  const used = packageUsage.usedLessons ?? 0;
  const planned = packageUsage.plannedLessons ?? 0;
  return Math.min(100, Math.round(((used + planned) / packageUsage.totalLessons) * 100));
}

export function buildLearnerCoachingModel({
  assessments,
  lessons,
  nextAction,
  notes = [],
  packageUsage,
  preferences,
  requests = [],
}: {
  assessments: StudentProgressAssessment[];
  lessons: Les[];
  nextAction: LearnerNextAction;
  notes?: StudentProgressLessonNote[];
  packageUsage?: PackageUsageInput | null;
  preferences?: LearnerLearningPreferences | null;
  requests?: LesAanvraag[];
}): LearnerCoachingModel {
  const upcomingLessons = getUpcomingLessons(lessons);
  const pendingRequests = requests.filter((request) => request.status === "aangevraagd");
  const completedLessons = lessons.filter((lesson) => lesson.status === "afgerond").length;
  const examReadiness = getStudentExamReadiness(assessments, notes);
  const focusItems = getStudentProgressFocusItems(assessments, 3);
  const sectionSummaries = getStudentProgressSectionSummaries(assessments);
  const weakestSection =
    [...sectionSummaries].sort((left, right) => left.percentage - right.percentage)[0] ??
    null;
  const latestActivityTime = getLatestActivityTime({
    assessments,
    lessons,
    notes,
    requests,
  });
  const daysSinceActivity = getDaysSince(latestActivityTime);
  const packagePressure = getPackagePressure(packageUsage);
  const proactiveSignals: LearnerCoachingSignal[] = [];

  if (!upcomingLessons.length && !pendingRequests.length) {
    proactiveSignals.push({
      id: "no-upcoming-lesson",
      title: "Ritme dreigt stil te vallen",
      detail: "Er staat geen aankomende les of open aanvraag klaar.",
      actionLabel: "Plan een les",
      href: "/leerling/boekingen",
      tone: "warning",
      reason: "Regel: geen actieve planning betekent verhoogde kans op vertraging.",
      evidence: ["0 aankomende lessen", "0 open aanvragen"],
    });
  }

  if (daysSinceActivity != null && daysSinceActivity >= 14) {
    proactiveSignals.push({
      id: "low-activity",
      title: "Minder activiteit gezien",
      detail: `De laatste les-, aanvraag- of feedbackactiviteit is ${daysSinceActivity} dagen geleden.`,
      actionLabel: "Pak ritme op",
      href: "/leerling/boekingen",
      tone: daysSinceActivity >= 21 ? "danger" : "warning",
      reason: "Regel: lange stilte verhoogt de kans dat het traject afzwakt.",
      evidence: [`${daysSinceActivity} dagen sinds laatste activiteit`],
    });
  }

  if (focusItems.length && weakestSection?.percentage != null && weakestSection.percentage < 55) {
    proactiveSignals.push({
      id: "weak-skill",
      title: "Focuspunt vraagt herhaling",
      detail: `${focusItems[0].label} en ${weakestSection.shortLabel} vragen nu extra aandacht.`,
      actionLabel: "Oefen scenario",
      href: "/leerling/lesmateriaal",
      tone: "info",
      reason: "Regel: laagste toetsblok en focus-skill bepalen de eerstvolgende oefenrichting.",
      evidence: [`${weakestSection.shortLabel}: ${weakestSection.percentage}%`, focusItems[0].label],
    });
  }

  if (packageUsage?.remainingLessons != null && packageUsage.remainingLessons <= 3) {
    proactiveSignals.push({
      id: "package-low",
      title: "Pakket bijna op",
      detail: `Er zijn nog ${packageUsage.remainingLessons} lessen beschikbaar in je pakket.`,
      actionLabel: "Bekijk betalingen",
      href: "/leerling/betalingen",
      tone: "warning",
      reason: "Regel: bij drie of minder resterende lessen moet pakketopvolging zichtbaar zijn.",
      evidence: [`${packageUsage.remainingLessons} lessen resterend`, `${packagePressure}% pakketdruk`],
    });
  }

  if (examReadiness.score >= 82) {
    proactiveSignals.push({
      id: "exam-ready",
      title: "Examenstap komt in beeld",
      detail: examReadiness.nextMilestone,
      actionLabel: "Bespreek examen",
      href: "/leerling/berichten",
      tone: "success",
      reason: "Regel: examengereedheid boven 82% activeert een examengerichte vervolgstap.",
      evidence: [`${examReadiness.score}% examengereedheid`, `${completedLessons} lessen afgerond`],
    });
  }

  if (!proactiveSignals.length) {
    proactiveSignals.push({
      id: "on-track",
      title: "Traject loopt stabiel",
      detail: "Er is geen direct risico gevonden in planning, pakket of voortgang.",
      actionLabel: "Bekijk voortgang",
      href: "/leerling/voortgang",
      tone: "success",
      reason: "Regel: planning, feedback en pakketdruk blijven binnen veilige grenzen.",
      evidence: [
        upcomingLessons.length ? `${upcomingLessons.length} aankomende les(sen)` : "Geen blokkade",
        `${examReadiness.score}% examengereedheid`,
      ],
    });
  }

  const inactivityRisk =
    daysSinceActivity == null ? 35 : daysSinceActivity >= 21 ? 82 : daysSinceActivity >= 14 ? 66 : 25;
  const examRisk =
    examReadiness.score >= 82
      ? 15
      : focusItems.length >= 2
        ? 68
        : examReadiness.score >= 60
          ? 38
          : 54;
  const planningRisk = upcomingLessons.length ? 20 : pendingRequests.length ? 45 : 76;

  return {
    behaviorInsights: [
      {
        label: "Activiteit",
        value: daysSinceActivity == null ? "Nog geen data" : `${daysSinceActivity} dagen`,
        detail:
          daysSinceActivity == null
            ? "Nog te weinig activiteit om een patroon te herkennen."
            : "Dagen sinds de laatste les, aanvraag of feedbackupdate.",
        tone: inactivityRisk >= 75 ? "danger" : inactivityRisk >= 55 ? "warning" : "success",
        score: inactivityRisk,
      },
      {
        label: "Planningrisico",
        value: `${planningRisk}%`,
        detail: upcomingLessons.length
          ? "Er staat een les klaar, dus ritme blijft behouden."
          : "Geen bevestigde volgende les verhoogt de kans op vertraging.",
        tone: planningRisk >= 70 ? "danger" : planningRisk >= 45 ? "warning" : "success",
        score: planningRisk,
      },
      {
        label: "Examendruk",
        value: `${examRisk}%`,
        detail:
          examReadiness.score >= 82
            ? "Je zit dicht bij een examengerichte stap."
            : "Gebaseerd op examengereedheid en zwakke focuspunten.",
        tone: examRisk >= 70 ? "warning" : examRisk <= 25 ? "success" : "info",
        score: examRisk,
      },
    ],
    explanation: {
      title: nextAction.title,
      reason: nextAction.reason,
      ruleLabel: nextAction.ruleLabel,
      evidence: nextAction.signals.map((signal) => `${signal.label}: ${signal.value}`),
    },
    learningProfile: getLearningProfile(preferences),
    proactiveSignals,
    scenarioTraining: buildScenarioTraining({
      assessments,
      notes,
      preferences,
    }),
  };
}
