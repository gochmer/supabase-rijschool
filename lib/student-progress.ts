import type {
  StudentProgressAssessment,
  StudentProgressLessonNote,
  StudentProgressStatus,
} from "@/lib/types";

export type StudentProgressItem = {
  key: string;
  label: string;
};

export type StudentProgressSection = {
  key: string;
  label: string;
  shortLabel: string;
  items: StudentProgressItem[];
};

export type StudentProgressInsightBadge =
  | "success"
  | "warning"
  | "danger"
  | "info";

export type StudentProgressFocusItem = StudentProgressItem & {
  sectionKey: string;
  sectionLabel: string;
  latest: StudentProgressAssessment | null;
};

export type StudentProgressMomentum = {
  score: number;
  label: string;
  badge: StudentProgressInsightBadge;
  detail: string;
  suggestion: string;
};

export type StudentExamReadiness = {
  score: number;
  label: string;
  badge: StudentProgressInsightBadge;
  summary: string;
  nextMilestone: string;
  checks: Array<{
    label: string;
    value: string;
    badge: StudentProgressInsightBadge;
  }>;
};

export type StudentNextLessonPlanItem = {
  title: string;
  detail: string;
  badgeLabel: string;
  badge: StudentProgressInsightBadge;
};

export type StudentCoachSignal = {
  title: string;
  detail: string;
  badgeLabel: string;
  badge: StudentProgressInsightBadge;
};

export type StudentPackageTrajectoryInput = {
  packageName?: string | null;
  totalLessons?: number | null;
  plannedLessons?: number | null;
  usedLessons?: number | null;
  remainingLessons?: number | null;
};

export type StudentPackageTrajectorySignal = {
  title: string;
  detail: string;
  badgeLabel: string;
  badge: StudentProgressInsightBadge;
  nextAction: string;
  usageLabel: string;
  pressure: number;
  remainingLessons: number | null;
  shouldSuggestAdditionalPackage: boolean;
};

export type StudentTrajectoryIntelligence = {
  packageSignal: StudentPackageTrajectorySignal;
  examReadiness: StudentExamReadiness;
  nextLessonPlan: StudentNextLessonPlanItem[];
  headline: string;
  summary: string;
};

export type StudentWeeklyGoal = {
  title: string;
  detail: string;
  badgeLabel: string;
  badge: StudentProgressInsightBadge;
};

export type StudentProgressStreak = {
  count: number;
  label: string;
  detail: string;
  badge: StudentProgressInsightBadge;
};

export type StudentAchievementBadge = {
  key: string;
  title: string;
  detail: string;
  badgeLabel: string;
  badge: StudentProgressInsightBadge;
  earned: boolean;
  progressLabel: string;
  newlyUnlocked?: boolean;
};

export type StudentMilestoneOverview = {
  unlocked: StudentAchievementBadge[];
  next: StudentAchievementBadge | null;
  recentUnlocked: StudentAchievementBadge[];
  totalUnlocked: number;
  totalAvailable: number;
  headline: string;
};

export type StudentThreeLessonTrackStep = StudentNextLessonPlanItem & {
  lessonLabel: string;
};

export const STUDENT_PROGRESS_SECTIONS: StudentProgressSection[] = [
  {
    key: "bediening",
    label: "Toets 1: Bediening van het voertuig",
    shortLabel: "Bediening",
    items: [
      { key: "voorbereiding", label: "Voorbereiding en controlehandelingen" },
      { key: "stuurremkoppeling", label: "Stuur-, rem- en koppeltechniek" },
      { key: "schakelen", label: "Schakelen en snelheid verdelen" },
      { key: "koppelen", label: "Ontkoppelen, koppelen en wegrijden" },
      { key: "remmen", label: "Remmen en gecontroleerd tot stilstand komen" },
    ],
  },
  {
    key: "kijktechniek",
    label: "Toets 2: Kijktechniek en verkeersinzicht",
    shortLabel: "Kijktechniek",
    items: [
      { key: "kijkgedrag", label: "Kern: kijkgedrag en spiegels" },
      { key: "afslaan_links", label: "Naar links afslaan of richting veranderen" },
      { key: "afslaan_rechts", label: "Naar rechts afslaan of richting veranderen" },
      { key: "achteruit_kijkgebruik", label: "Achteruit rijden en kijkgebruik" },
      { key: "kruispunten", label: "Naderen en oversteken van kruispunten" },
    ],
  },
  {
    key: "verkeersdeelname",
    label: "Toets 3: Verkeersdeelname en route-inzicht",
    shortLabel: "Verkeersdeelname",
    items: [
      { key: "invoegen", label: "In- en uitvoegen op verschillende wegen" },
      { key: "fileparkeren", label: "Fileparkeren en bocht achteruit" },
      { key: "tegenliggers", label: "Tegemoetkomen en voorrang inschatten" },
      { key: "bijzondere_manoeuvres", label: "Bijzondere manoeuvres en zelfstandigheid" },
      { key: "informatie_verwerken", label: "Informatie verwerken en verkeersinzicht" },
    ],
  },
  {
    key: "examengericht",
    label: "Toets 4: Eindtoets en examengerichte onderdelen",
    shortLabel: "Examengericht",
    items: [
      { key: "milieubewust", label: "Milieubewust en vlot rijgedrag" },
      { key: "gevaarherkenning", label: "Situatiebewustzijn en gevaarherkenning" },
      { key: "zelfstandige_route", label: "Zelfstandige route rijden" },
      { key: "proefexamen", label: "Proefexamen en examendiscipline" },
      { key: "specifieke_situaties", label: "Specifieke verkeerssituaties" },
    ],
  },
];

export const STUDENT_PROGRESS_STATUS_OPTIONS: Array<{
  value: StudentProgressStatus;
  label: string;
  shortLabel: string;
}> = [
  {
    value: "uitleg",
    label: "Nog uitleg of demonstratie nodig",
    shortLabel: "U",
  },
  {
    value: "begeleid",
    label: "Met begeleiding uitgevoerd",
    shortLabel: "B",
  },
  {
    value: "zelfstandig",
    label: "Zelfstandig uitgevoerd",
    shortLabel: "Z",
  },
  {
    value: "herhaling",
    label: "Herhaling nodig",
    shortLabel: "H",
  },
];

export const STUDENT_PROGRESS_STATUS_WEIGHTS: Record<
  StudentProgressStatus,
  number
> = {
  uitleg: 20,
  begeleid: 60,
  zelfstandig: 100,
  herhaling: 15,
};

export const STUDENT_PROGRESS_ITEM_COUNT = STUDENT_PROGRESS_SECTIONS.reduce(
  (total, section) => total + section.items.length,
  0
);

export function isStudentProgressStatus(
  value: string
): value is StudentProgressStatus {
  return STUDENT_PROGRESS_STATUS_OPTIONS.some((option) => option.value === value);
}

export function getStudentProgressStatusMeta(status: StudentProgressStatus) {
  return (
    STUDENT_PROGRESS_STATUS_OPTIONS.find((option) => option.value === status) ??
    STUDENT_PROGRESS_STATUS_OPTIONS[0]
  );
}

export function getStudentProgressItem(key: string) {
  for (const section of STUDENT_PROGRESS_SECTIONS) {
    const item = section.items.find((entry) => entry.key === key);

    if (item) {
      return {
        ...item,
        sectionKey: section.key,
        sectionLabel: section.label,
        sectionShortLabel: section.shortLabel,
      };
    }
  }

  return null;
}

export function calculateStudentProgressPercentage(
  assessments: StudentProgressAssessment[]
) {
  const latestBySkill = getLatestAssessmentsBySkill(assessments);
  const total = STUDENT_PROGRESS_SECTIONS.flatMap((section) => section.items).reduce(
    (sum, item) => {
      const status = latestBySkill.get(item.key)?.status;
      return sum + (status ? STUDENT_PROGRESS_STATUS_WEIGHTS[status] : 0);
    },
    0
  );

  return Math.max(
    0,
    Math.min(100, Math.round(total / STUDENT_PROGRESS_ITEM_COUNT))
  );
}

export function getLatestAssessmentsBySkill(
  assessments: StudentProgressAssessment[]
) {
  const latest = new Map<string, StudentProgressAssessment>();

  const sorted = [...assessments].sort((left, right) => {
    if (left.beoordelings_datum !== right.beoordelings_datum) {
      return right.beoordelings_datum.localeCompare(left.beoordelings_datum);
    }

    return right.created_at.localeCompare(left.created_at);
  });

  for (const assessment of sorted) {
    if (!latest.has(assessment.vaardigheid_key)) {
      latest.set(assessment.vaardigheid_key, assessment);
    }
  }

  return latest;
}

export function getStudentProgressSummary(
  assessments: StudentProgressAssessment[]
) {
  const latestBySkill = getLatestAssessmentsBySkill(assessments);
  const latestEntries = Array.from(latestBySkill.values());

  const zelfstandigCount = latestEntries.filter(
    (assessment) => assessment.status === "zelfstandig"
  ).length;
  const aandachtCount = latestEntries.filter((assessment) =>
    ["uitleg", "herhaling"].includes(assessment.status)
  ).length;
  const begeleidCount = latestEntries.filter(
    (assessment) => assessment.status === "begeleid"
  ).length;
  const lastReviewedAt =
    [...assessments]
      .sort((left, right) =>
        right.beoordelings_datum.localeCompare(left.beoordelings_datum)
      )[0]?.beoordelings_datum ?? null;

  return {
    percentage: calculateStudentProgressPercentage(assessments),
    zelfstandigCount,
    aandachtCount,
    begeleidCount,
    beoordeeldCount: latestEntries.length,
    nogOpenCount: Math.max(0, STUDENT_PROGRESS_ITEM_COUNT - latestEntries.length),
    lastReviewedAt,
  };
}

export function getStudentProgressSectionSummaries(
  assessments: StudentProgressAssessment[]
) {
  const latestBySkill = getLatestAssessmentsBySkill(assessments);

  return STUDENT_PROGRESS_SECTIONS.map((section) => {
    const weightedTotal = section.items.reduce((sum, item) => {
      const status = latestBySkill.get(item.key)?.status;
      return sum + (status ? STUDENT_PROGRESS_STATUS_WEIGHTS[status] : 0);
    }, 0);
    const masteredCount = section.items.filter(
      (item) => latestBySkill.get(item.key)?.status === "zelfstandig"
    ).length;
    const attentionCount = section.items.filter((item) =>
      ["uitleg", "herhaling"].includes(latestBySkill.get(item.key)?.status ?? "")
    ).length;
    const percentage = Math.round(weightedTotal / section.items.length);

    return {
      key: section.key,
      label: section.label,
      shortLabel: section.shortLabel,
      percentage: Math.max(0, Math.min(100, percentage)),
      masteredCount,
      attentionCount,
      totalCount: section.items.length,
    };
  });
}

function sortStudentProgressAssessmentsByRecency(
  left: StudentProgressAssessment,
  right: StudentProgressAssessment
) {
  if (left.beoordelings_datum !== right.beoordelings_datum) {
    return right.beoordelings_datum.localeCompare(left.beoordelings_datum);
  }

  return right.created_at.localeCompare(left.created_at);
}

function sortStudentProgressNotesByRecency(
  left: StudentProgressLessonNote,
  right: StudentProgressLessonNote
) {
  if (left.lesdatum !== right.lesdatum) {
    return right.lesdatum.localeCompare(left.lesdatum);
  }

  return right.updated_at.localeCompare(left.updated_at);
}

function getStudentProgressStatusPriority(
  status?: StudentProgressStatus | null
) {
  switch (status) {
    case "herhaling":
      return 0;
    case "uitleg":
      return 1;
    case "begeleid":
      return 2;
    case "zelfstandig":
      return 4;
    default:
      return 3;
  }
}

function getMostRecentAssessmentForSkill(
  assessments: StudentProgressAssessment[],
  vaardigheidKey: string
) {
  return (
    [...assessments]
      .filter((assessment) => assessment.vaardigheid_key === vaardigheidKey)
      .sort(sortStudentProgressAssessmentsByRecency)[0] ?? null
  );
}

function clampProgressValue(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function getStudentProgressFocusItems(
  assessments: StudentProgressAssessment[],
  limit = 4
) {
  return STUDENT_PROGRESS_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      sectionKey: section.key,
      sectionLabel: section.shortLabel,
      latest: getMostRecentAssessmentForSkill(assessments, item.key),
    }))
  )
    .filter((item) => item.latest?.status !== "zelfstandig")
    .sort((left, right) => {
      const priorityDiff =
        getStudentProgressStatusPriority(left.latest?.status) -
        getStudentProgressStatusPriority(right.latest?.status);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const leftDate = left.latest?.beoordelings_datum ?? "";
      const rightDate = right.latest?.beoordelings_datum ?? "";

      if (leftDate !== rightDate) {
        return rightDate.localeCompare(leftDate);
      }

      return left.label.localeCompare(right.label);
    })
    .slice(0, limit);
}

export function getStudentProgressStrongestItems(
  assessments: StudentProgressAssessment[],
  limit = 3
) {
  return STUDENT_PROGRESS_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      sectionKey: section.key,
      sectionLabel: section.shortLabel,
      latest: getMostRecentAssessmentForSkill(assessments, item.key),
    }))
  )
    .filter((item) => item.latest?.status === "zelfstandig")
    .sort((left, right) => {
      const leftDate = left.latest?.beoordelings_datum ?? "";
      const rightDate = right.latest?.beoordelings_datum ?? "";

      if (leftDate !== rightDate) {
        return rightDate.localeCompare(leftDate);
      }

      return left.label.localeCompare(right.label);
    })
    .slice(0, limit);
}

export function getStudentProgressTimeline(
  assessments: StudentProgressAssessment[],
  notes: StudentProgressLessonNote[] = []
) {
  const grouped = new Map<
    string,
    {
      date: string;
      assessments: StudentProgressAssessment[];
      note: StudentProgressLessonNote | null;
    }
  >();

  for (const assessment of assessments) {
    const current = grouped.get(assessment.beoordelings_datum) ?? {
      date: assessment.beoordelings_datum,
      assessments: [],
      note: null,
    };
    current.assessments.push(assessment);
    grouped.set(assessment.beoordelings_datum, current);
  }

  for (const note of notes) {
    const current = grouped.get(note.lesdatum) ?? {
      date: note.lesdatum,
      assessments: [],
      note: null,
    };
    current.note = note;
    grouped.set(note.lesdatum, current);
  }

  return Array.from(grouped.values())
    .sort((left, right) => right.date.localeCompare(left.date))
    .map((entry) => {
      const zelfstandigCount = entry.assessments.filter(
        (assessment) => assessment.status === "zelfstandig"
      ).length;
      const attentionCount = entry.assessments.filter((assessment) =>
        ["uitleg", "herhaling"].includes(assessment.status)
      ).length;

      return {
        date: entry.date,
        assessments: entry.assessments,
        zelfstandigCount,
        attentionCount,
        note: entry.note,
      };
    });
}

export function getStudentProgressMomentum(
  assessments: StudentProgressAssessment[],
  notes: StudentProgressLessonNote[] = []
): StudentProgressMomentum {
  const timeline = getStudentProgressTimeline(assessments, notes).slice(0, 3);

  if (!timeline.length) {
    return {
      score: 0,
      label: "Nog geen ritme",
      badge: "info",
      detail:
        "Er zijn nog te weinig lesmomenten gemarkeerd om al een trend in zelfstandigheid te zien.",
      suggestion:
        "Zodra meerdere lesmomenten ingevuld zijn, zie je hier of de leerling stabieler rijdt.",
    };
  }

  const recentZelfstandig = timeline.reduce(
    (total, entry) => total + entry.zelfstandigCount,
    0
  );
  const recentAttention = timeline.reduce(
    (total, entry) => total + entry.attentionCount,
    0
  );
  const latestEntry = timeline[0];

  let score = 50 + (recentZelfstandig - recentAttention) * 8;

  if (latestEntry.zelfstandigCount > latestEntry.attentionCount) {
    score += 10;
  } else if (latestEntry.attentionCount > latestEntry.zelfstandigCount) {
    score -= 10;
  }

  score = clampProgressValue(score);

  if (score >= 68) {
    return {
      score,
      label: "Stijgende lijn",
      badge: "success",
      detail: `In de laatste ${timeline.length} lesmomenten stonden ${recentZelfstandig} markeringen op zelfstandig tegenover ${recentAttention} aandachtspunten.`,
      suggestion:
        "Goed moment om zelfstandige ritten en examengerichte keuzes verder uit te bouwen.",
    };
  }

  if (score >= 45) {
    return {
      score,
      label: "Stabiele opbouw",
      badge: "info",
      detail: `De laatste ${timeline.length} lesmomenten blijven in balans: ${recentZelfstandig} zelfstandige markeringen en ${recentAttention} aandachtspunten.`,
      suggestion:
        "Houd de lijn vast en gebruik de volgende lessen om de zwakste onderdelen gericht op te trekken.",
    };
  }

  return {
    score,
    label: "Schommelt nog",
    badge: "warning",
    detail: `In de laatste ${timeline.length} lesmomenten waren er ${recentAttention} aandachtspunten tegenover ${recentZelfstandig} zelfstandige markeringen.`,
    suggestion:
      "Plan de volgende lessen smaller en herhaal de onderdelen die nu nog onzeker voelen.",
  };
}

export function getStudentExamReadiness(
  assessments: StudentProgressAssessment[],
  notes: StudentProgressLessonNote[] = []
): StudentExamReadiness {
  const summary = getStudentProgressSummary(assessments);
  const sections = getStudentProgressSectionSummaries(assessments);
  const focusItems = getStudentProgressFocusItems(assessments, 3);
  const strongestItems = getStudentProgressStrongestItems(assessments, 2);
  const momentum = getStudentProgressMomentum(assessments, notes);
  const examSection =
    sections.find((section) => section.key === "examengericht") ?? null;
  const weakestSection =
    [...sections].sort((left, right) => left.percentage - right.percentage)[0] ??
    null;

  let score = Math.round(
    summary.percentage * 0.55 +
      (examSection?.percentage ?? summary.percentage) * 0.25 +
      momentum.score * 0.2
  );

  score += Math.min(10, strongestItems.length * 4);
  score -= summary.aandachtCount * 4;
  score -= Math.min(12, summary.nogOpenCount * 2);

  if (summary.beoordeeldCount < 6) {
    score = Math.min(score, 42);
  }

  if ((examSection?.percentage ?? 0) >= 80) {
    score += 8;
  }

  score = clampProgressValue(score);

  if (
    score >= 82 &&
    (examSection?.percentage ?? 0) >= 74 &&
    summary.aandachtCount <= 2 &&
    summary.nogOpenCount <= 4
  ) {
    return {
      score,
      label: "Klaar voor proefexamen",
      badge: "success",
      summary:
        "De basis oogt stabiel, examengerichte onderdelen staan sterk en de open aandachtspunten zijn beperkt.",
      nextMilestone:
        "Plan een proefexamen of een les die volledig in examenritme staat.",
      checks: [
        {
          label: "Examengericht",
          value: `${examSection?.percentage ?? 0}%`,
          badge: "success",
        },
        {
          label: "Zelfstandig",
          value: `${summary.zelfstandigCount} onderdelen`,
          badge: "success",
        },
        {
          label: "Open aandacht",
          value: `${summary.aandachtCount} onderdelen`,
          badge: summary.aandachtCount === 0 ? "success" : "info",
        },
      ],
    };
  }

  if (score >= 62) {
    return {
      score,
      label: "Bijna proefexamen",
      badge: "warning",
      summary:
        "De leerling komt duidelijk dichterbij, maar heeft nog een paar onderdelen nodig die constanter zelfstandig moeten gaan.",
      nextMilestone: weakestSection
        ? `Trek eerst ${weakestSection.shortLabel.toLowerCase()} verder omhoog en maak daarna een proefexamenslag.`
        : "Werk nog een paar gerichte lesmomenten toe naar een volledige proefrit.",
      checks: [
        {
          label: "Examengericht",
          value: `${examSection?.percentage ?? 0}%`,
          badge:
            (examSection?.percentage ?? 0) >= 65 ? "info" : "warning",
        },
        {
          label: "Aandacht",
          value: `${summary.aandachtCount} onderdelen`,
          badge: summary.aandachtCount <= 3 ? "info" : "warning",
        },
        {
          label: "Nog open",
          value: `${summary.nogOpenCount} onderdelen`,
          badge: summary.nogOpenCount <= 4 ? "info" : "warning",
        },
      ],
    };
  }

  if (score >= 40) {
    return {
      score,
      label: "Richting proefexamen",
      badge: "info",
      summary:
        "Er is al een bruikbare basis, maar de kaart laat nog duidelijk zien welke toetsblokken eerst steviger moeten worden.",
      nextMilestone: weakestSection
        ? `Leg de focus eerst op ${weakestSection.shortLabel.toLowerCase()} en bouw daarna pas examengerichte druk op.`
        : "Werk stap voor stap verder toe naar meer zelfstandige ritten.",
      checks: [
        {
          label: "Voortgang",
          value: `${summary.percentage}%`,
          badge: "info",
        },
        {
          label: "Sterke punten",
          value: `${strongestItems.length} zichtbaar`,
          badge: strongestItems.length ? "success" : "info",
        },
        {
          label: "Open aandacht",
          value: `${summary.aandachtCount} onderdelen`,
          badge: "warning",
        },
      ],
    };
  }

  return {
    score,
    label: "Nog in opbouw",
    badge: "danger",
    summary:
      "De leerling zit nog duidelijk in de opbouwfase. Het is nu slimmer om eerst routine, kijkgedrag en basiscontrole te stabiliseren.",
    nextMilestone:
      focusItems[0]?.label
        ? `Begin de volgende lessen klein rond ${focusItems[0].label.toLowerCase()}.`
        : "Zet eerst de basis van de kaart neer met meerdere beoordeelde lesmomenten.",
    checks: [
      {
        label: "Beoordeeld",
        value: `${summary.beoordeeldCount} onderdelen`,
        badge: summary.beoordeeldCount >= 6 ? "info" : "danger",
      },
      {
        label: "Aandacht",
        value: `${summary.aandachtCount} onderdelen`,
        badge: "warning",
      },
      {
        label: "Examengericht",
        value: `${examSection?.percentage ?? 0}%`,
        badge: "danger",
      },
    ],
  };
}

export function getStudentPackageTrajectorySignal({
  packageName,
  totalLessons,
  plannedLessons,
  usedLessons,
  remainingLessons,
}: StudentPackageTrajectoryInput): StudentPackageTrajectorySignal {
  const normalizedTotal =
    totalLessons && totalLessons > 0 ? Math.round(totalLessons) : null;
  const normalizedPlanned = Math.max(0, Math.round(plannedLessons ?? 0));
  const normalizedUsed = Math.max(0, Math.round(usedLessons ?? 0));
  const normalizedRemaining =
    remainingLessons != null
      ? Math.max(0, Math.round(remainingLessons))
      : normalizedTotal != null
        ? Math.max(normalizedTotal - normalizedPlanned - normalizedUsed, 0)
        : null;
  const consumedLessons = normalizedPlanned + normalizedUsed;
  const pressure =
    normalizedTotal != null && normalizedTotal > 0
      ? clampProgressValue(Math.round((consumedLessons / normalizedTotal) * 100))
      : 0;
  const usageLabel =
    normalizedTotal != null
      ? `${normalizedUsed}/${normalizedTotal} gevolgd, ${normalizedPlanned} gepland, ${normalizedRemaining ?? 0} over`
      : `${normalizedUsed} gevolgd, ${normalizedPlanned} gepland`;

  if (!packageName?.trim()) {
    return {
      title: "Pakket nog niet gekoppeld",
      detail:
        "Vervolglessen blijven geblokkeerd tot er een pakket aan dit traject hangt.",
      badgeLabel: "Pakket nodig",
      badge: "warning",
      nextAction: "Koppel een passend pakket voordat je nieuwe vervolglessen plant.",
      usageLabel,
      pressure,
      remainingLessons: normalizedRemaining,
      shouldSuggestAdditionalPackage: true,
    };
  }

  if (normalizedRemaining != null && normalizedRemaining <= 1) {
    return {
      title: "Pakket bijna op",
      detail: `${packageName} heeft nog ${normalizedRemaining} les${
        normalizedRemaining === 1 ? "" : "sen"
      } vrij. Zet nu alvast een aanvullend pakket of examengericht vervolg klaar.`,
      badgeLabel: "Actie nodig",
      badge: "danger",
      nextAction: "Bespreek direct een aanvullend pakket of examenplanning.",
      usageLabel,
      pressure,
      remainingLessons: normalizedRemaining,
      shouldSuggestAdditionalPackage: true,
    };
  }

  if (
    (normalizedRemaining != null && normalizedRemaining <= 3) ||
    pressure >= 80
  ) {
    return {
      title: "Pakket loopt richting einde",
      detail: `${packageName} is grotendeels ingepland of verbruikt. Dit is het moment om vooruit te kijken zodat het traject niet stilvalt.`,
      badgeLabel: "Vooruit plannen",
      badge: "warning",
      nextAction: "Maak een vervolgadvies op basis van voortgang en leshistorie.",
      usageLabel,
      pressure,
      remainingLessons: normalizedRemaining,
      shouldSuggestAdditionalPackage: true,
    };
  }

  return {
    title: "Pakket op koers",
    detail: `${packageName} heeft nog genoeg ruimte om lessen, herhaling en evaluatie rustig te plannen.`,
    badgeLabel: "Op koers",
    badge: "success",
    nextAction: "Blijf na elke les feedback en aandachtspunten vastleggen.",
    usageLabel,
    pressure,
    remainingLessons: normalizedRemaining,
    shouldSuggestAdditionalPackage: false,
  };
}

export function getStudentTrajectoryIntelligence({
  assessments,
  notes = [],
  packageUsage,
}: {
  assessments: StudentProgressAssessment[];
  notes?: StudentProgressLessonNote[];
  packageUsage: StudentPackageTrajectoryInput;
}): StudentTrajectoryIntelligence {
  const packageSignal = getStudentPackageTrajectorySignal(packageUsage);
  const examReadiness = getStudentExamReadiness(assessments, notes);
  const nextLessonPlan = getStudentNextLessonPlan(assessments, notes);
  const headline =
    examReadiness.score >= 82
      ? "Klaar om examengericht te schakelen"
      : packageSignal.shouldSuggestAdditionalPackage
        ? "Voorkom dat het traject stilvalt"
        : "Traject loopt gecontroleerd door";
  const summary =
    examReadiness.score >= 82
      ? "De voortgangskaart ondersteunt nu een proefexamen of volledige examenrit."
      : packageSignal.shouldSuggestAdditionalPackage
        ? "Het pakketverbruik vraagt tijdige opvolging voordat nieuwe lessen krap worden."
        : "Gebruik de lesfeedback om de volgende lessen steeds smaller en doelgerichter te maken.";

  return {
    packageSignal,
    examReadiness,
    nextLessonPlan,
    headline,
    summary,
  };
}

export function getStudentNextLessonPlan(
  assessments: StudentProgressAssessment[],
  notes: StudentProgressLessonNote[] = []
): StudentNextLessonPlanItem[] {
  const suggestions: StudentNextLessonPlanItem[] = [];
  const focusItems = getStudentProgressFocusItems(assessments, 5);
  const sections = getStudentProgressSectionSummaries(assessments);
  const weakestSection =
    [...sections].sort((left, right) => left.percentage - right.percentage)[0] ??
    null;
  const latestNote = [...notes].sort(sortStudentProgressNotesByRecency)[0] ?? null;

  function pushSuggestion(item: StudentNextLessonPlanItem) {
    const exists = suggestions.some(
      (entry) => entry.title.toLowerCase() === item.title.toLowerCase()
    );

    if (!exists && suggestions.length < 3) {
      suggestions.push(item);
    }
  }

  if (latestNote?.focus_volgende_les) {
    pushSuggestion({
      title: latestNote.focus_volgende_les,
      detail: `Coachfocus uit de laatste lesnotitie van ${formatStudentProgressDate(
        latestNote.lesdatum
      )}.`,
      badgeLabel: "Coachfocus",
      badge: "info",
    });
  }

  if (weakestSection) {
    pushSuggestion({
      title: `${weakestSection.shortLabel} versterken`,
      detail:
        weakestSection.attentionCount > 0
          ? `${weakestSection.attentionCount} onderdelen in dit toetsblok vragen nog extra aandacht.`
          : `Dit blijft op dit moment het minst sterke toetsblok en verdient een gerichte herhaling.`,
      badgeLabel: "Toetsblok",
      badge:
        weakestSection.percentage >= 60 ? "info" : "warning",
    });
  }

  for (const item of focusItems) {
    const meta = item.latest?.status
      ? getStudentProgressStatusMeta(item.latest.status)
      : null;

    pushSuggestion({
      title: item.label,
      detail: meta
        ? `${item.sectionLabel} - nu nog ${meta.label.toLowerCase()}.`
        : `${item.sectionLabel} - nog niet beoordeeld, plan dit bewust in tijdens de volgende les.`,
      badgeLabel: meta ? meta.shortLabel : "Nieuw",
      badge:
        item.latest?.status === "herhaling" || item.latest?.status === "uitleg"
          ? "warning"
          : "info",
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      title: "Zelfstandigheid vasthouden",
      detail:
        "Veel onderdelen staan al sterk. Gebruik de volgende les om examenritme en rust in lastige situaties vast te houden.",
      badgeLabel: "Stabiel",
      badge: "success",
    });
  }

  return suggestions;
}

export function getStudentAutomaticNotifications(
  assessments: StudentProgressAssessment[],
  notes: StudentProgressLessonNote[] = []
): StudentCoachSignal[] {
  const summary = getStudentProgressSummary(assessments);
  const sections = getStudentProgressSectionSummaries(assessments);
  const examReadiness = getStudentExamReadiness(assessments, notes);
  const momentum = getStudentProgressMomentum(assessments, notes);
  const strongestItems = getStudentProgressStrongestItems(assessments, 1);
  const weakestSection =
    [...sections].sort((left, right) => left.percentage - right.percentage)[0] ??
    null;
  const signals: StudentCoachSignal[] = [];

  function pushSignal(signal: StudentCoachSignal) {
    const exists = signals.some(
      (entry) => entry.title.toLowerCase() === signal.title.toLowerCase()
    );

    if (!exists && signals.length < 3) {
      signals.push(signal);
    }
  }

  if (examReadiness.score >= 82) {
    pushSignal({
      title: "Nu goed moment voor proefexamen",
      detail:
        "De kaart laat genoeg stabiliteit en examengerichte groei zien om een proefexamen of volledige examenrit in te plannen.",
      badgeLabel: "Klaar",
      badge: "success",
    });
  } else if (examReadiness.score >= 62) {
    pushSignal({
      title: "Proefexamen komt dichtbij",
      detail:
        "Nog een paar gerichte lessen kunnen de overstap maken van opbouw naar echte examendruk.",
      badgeLabel: "Bijna",
      badge: "warning",
    });
  } else {
    pushSignal({
      title: "Nog geen proefexamendruk opbouwen",
      detail:
        "Het is nu slimmer om eerst routine, kijkgedrag en zelfstandigheid verder te stabiliseren.",
      badgeLabel: "Opbouw",
      badge: summary.beoordeeldCount >= 6 ? "info" : "danger",
    });
  }

  if (weakestSection) {
    const title =
      weakestSection.key === "kijktechniek"
        ? "Kijktechniek blijft achter"
        : `${weakestSection.shortLabel} blijft achter`;

    pushSignal({
      title,
      detail:
        weakestSection.attentionCount > 0
          ? `${weakestSection.attentionCount} onderdeel${weakestSection.attentionCount === 1 ? "" : "en"} in dit toetsblok vragen nog extra aandacht.`
          : `Dit is nu het minst sterke toetsblok en verdient eerst meer herhaling en rust.`,
      badgeLabel:
        weakestSection.percentage >= 60 ? "Aandacht" : "Prioriteit",
      badge:
        weakestSection.percentage >= 60 ? "warning" : "danger",
    });
  }

  if (momentum.score < 45) {
    pushSignal({
      title: "Ritme schommelt nog",
      detail:
        "De recente lessen laten nog meer aandachtspunten dan stabiele zelfstandigheid zien. Bouw de komende lessen smaller op.",
      badgeLabel: "Ritme",
      badge: "warning",
    });
  } else if (strongestItems[0]) {
    pushSignal({
      title: "Bouw door op sterke basis",
      detail: `${strongestItems[0].label} staat al stevig. Gebruik dat vertrouwen om door te schakelen naar lastiger verkeer en examengerichte keuzes.`,
      badgeLabel: "Sterk punt",
      badge: "success",
    });
  }

  return signals;
}

export function getStudentProgressStreak(
  assessments: StudentProgressAssessment[],
  notes: StudentProgressLessonNote[] = []
): StudentProgressStreak {
  const timeline = getStudentProgressTimeline(assessments, notes);

  if (!timeline.length) {
    return {
      count: 0,
      label: "Nog geen streak",
      detail:
        "Zodra meerdere lesmomenten beoordeeld zijn, zie je hier of de leerling meerdere lessen op rij stabiele groei laat zien.",
      badge: "info",
    };
  }

  let count = 0;

  for (const entry of timeline) {
    if (
      entry.zelfstandigCount > 0 &&
      entry.zelfstandigCount >= entry.attentionCount
    ) {
      count += 1;
      continue;
    }

    break;
  }

  if (count >= 3) {
    return {
      count,
      label: `${count} lessen op rij sterke groei`,
      detail:
        "De recente lessen laten een stabiele opbouw zien waarbij zelfstandigheid het wint van aandachtspunten.",
      badge: "success",
    };
  }

  if (count === 2) {
    return {
      count,
      label: "2 lessen op rij stabiel",
      detail:
        "Er zit nu echt ritme in de groei. Een goed moment om de moeilijkheid voorzichtig op te bouwen.",
      badge: "info",
    };
  }

  if (count === 1) {
    return {
      count,
      label: "Goede laatste les",
      detail:
        "De meest recente les stond beter in balans. Probeer die lijn in de volgende les vast te houden.",
      badge: "info",
    };
  }

  return {
    count: 0,
    label: "Streak nog niet gestart",
    detail:
      "De laatste les bevatte nog te veel aandachtspunten om al van een stabiele groeireeks te spreken.",
    badge: "warning",
  };
}

function buildStudentAchievementBadges(
  assessments: StudentProgressAssessment[],
  notes: StudentProgressLessonNote[] = []
) {
  const summary = getStudentProgressSummary(assessments);
  const sections = getStudentProgressSectionSummaries(assessments);
  const examReadiness = getStudentExamReadiness(assessments, notes);
  const streak = getStudentProgressStreak(assessments, notes);
  const kijktechniekSection =
    sections.find((section) => section.key === "kijktechniek") ?? null;
  const verkeersdeelnameSection =
    sections.find((section) => section.key === "verkeersdeelname") ?? null;
  const examSection =
    sections.find((section) => section.key === "examengericht") ?? null;

  return [
    {
      key: "basis_zelfstandig",
      title: "Sterke basis",
      detail: "Minimaal 8 onderdelen staan inmiddels op zelfstandig.",
      badgeLabel: "Basis",
      badge: "success" as const,
      earned: summary.zelfstandigCount >= 8,
      progressLabel: `${summary.zelfstandigCount}/8 onderdelen`,
    },
    {
      key: "kijktechniek_stabiel",
      title: "Kijktechniek stabiel",
      detail: "Kijktechniek staat sterk genoeg om als betrouwbare basis mee te tellen.",
      badgeLabel: "Kijktechniek",
      badge: "info" as const,
      earned:
        (kijktechniekSection?.percentage ?? 0) >= 75 &&
        (kijktechniekSection?.attentionCount ?? 99) <= 1,
      progressLabel: `${kijktechniekSection?.percentage ?? 0}%`,
    },
    {
      key: "verkeersdeelname_sterk",
      title: "Verkeersdeelname sterk",
      detail:
        "Verkeersdeelname en route-inzicht staan stevig genoeg om op door te bouwen.",
      badgeLabel: "Route",
      badge: "info" as const,
      earned: (verkeersdeelnameSection?.percentage ?? 0) >= 75,
      progressLabel: `${verkeersdeelnameSection?.percentage ?? 0}%`,
    },
    {
      key: "examengericht_scherp",
      title: "Examengericht scherp",
      detail:
        "Examengerichte onderdelen laten genoeg rust en overzicht zien om door te schakelen.",
      badgeLabel: "Examengericht",
      badge: "warning" as const,
      earned: (examSection?.percentage ?? 0) >= 80,
      progressLabel: `${examSection?.percentage ?? 0}%`,
    },
    {
      key: "groei_streak",
      title: "3 lessen op rij groei",
      detail:
        "De leerling heeft meerdere lessen op rij laten zien dat de groei stabiel blijft.",
      badgeLabel: "Streak",
      badge: "success" as const,
      earned: streak.count >= 3,
      progressLabel: `${Math.min(streak.count, 3)}/3 lessen`,
    },
    {
      key: "proefexamen_ready",
      title: "Klaar voor proefexamen",
      detail:
        "De kaart is sterk genoeg om een proefexamen of volledige examengerichte rit te dragen.",
      badgeLabel: "Proefexamen",
      badge: "success" as const,
      earned: examReadiness.score >= 82,
      progressLabel: `${examReadiness.score}% gereed`,
    },
  ];
}

function getLatestStudentProgressActivityDate(
  assessments: StudentProgressAssessment[],
  notes: StudentProgressLessonNote[] = []
) {
  const latestAssessmentDate =
    [...assessments].sort(sortStudentProgressAssessmentsByRecency)[0]
      ?.beoordelings_datum ?? null;
  const latestNoteDate =
    [...notes].sort(sortStudentProgressNotesByRecency)[0]?.lesdatum ?? null;

  return [latestAssessmentDate, latestNoteDate]
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0] ?? null;
}

export function getStudentCoachSignals(
  assessments: StudentProgressAssessment[],
  notes: StudentProgressLessonNote[] = []
) {
  return getStudentAutomaticNotifications(assessments, notes);
}

export function getStudentWeeklyGoals(
  assessments: StudentProgressAssessment[],
  notes: StudentProgressLessonNote[] = []
): StudentWeeklyGoal[] {
  const sections = getStudentProgressSectionSummaries(assessments);
  const focusItems = getStudentProgressFocusItems(assessments, 4);
  const strongestItems = getStudentProgressStrongestItems(assessments, 1);
  const examReadiness = getStudentExamReadiness(assessments, notes);
  const momentum = getStudentProgressMomentum(assessments, notes);
  const weakestSection =
    [...sections].sort((left, right) => left.percentage - right.percentage)[0] ??
    null;
  const goals: StudentWeeklyGoal[] = [];

  function pushGoal(goal: StudentWeeklyGoal) {
    const exists = goals.some(
      (entry) => entry.title.toLowerCase() === goal.title.toLowerCase()
    );

    if (!exists && goals.length < 3) {
      goals.push(goal);
    }
  }

  if (focusItems[0]) {
    const primaryFocus = focusItems[0];
    const meta = primaryFocus.latest?.status
      ? getStudentProgressStatusMeta(primaryFocus.latest.status)
      : null;

    pushGoal({
      title: `${primaryFocus.label} naar de volgende stap`,
      detail: meta
        ? `${primaryFocus.sectionLabel} staat nu op ${meta.label.toLowerCase()}. Gebruik deze week om dit onderdeel zichtbaar stabieler te maken.`
        : `${primaryFocus.sectionLabel} is nog niet beoordeeld. Pak dit deze week bewust mee in de les zodat de kaart sneller vorm krijgt.`,
      badgeLabel:
        primaryFocus.latest?.status === "herhaling"
          ? "Herpakken"
          : primaryFocus.latest?.status === "uitleg"
          ? "Doorpakken"
          : "Deze week",
      badge:
        primaryFocus.latest?.status === "herhaling" ||
        primaryFocus.latest?.status === "uitleg"
          ? "warning"
          : "info",
    });
  }

  if (weakestSection) {
    pushGoal({
      title: `${weakestSection.shortLabel} optrekken`,
      detail:
        weakestSection.attentionCount > 0
          ? `${weakestSection.attentionCount} onderdeel${weakestSection.attentionCount === 1 ? "" : "en"} in dit toetsblok vragen nog aandacht. Maak hier deze week zichtbaar winst.`
          : `Dit blijft het minst sterke toetsblok. Gebruik deze week om de basis hier steviger en rustiger te maken.`,
      badgeLabel:
        weakestSection.percentage >= 60 ? "Aandacht" : "Prioriteit",
      badge:
        weakestSection.percentage >= 60 ? "warning" : "danger",
    });
  }

  if (examReadiness.score >= 82) {
    pushGoal({
      title: "Plan een proefexamen-check",
      detail:
        "De kaart is sterk genoeg om deze week een proefexamen of een volledige examengerichte rit in te bouwen.",
      badgeLabel: "Klaar",
      badge: "success",
    });
  } else if (examReadiness.score >= 62) {
    pushGoal({
      title: "Maak ruimte voor examenritme",
      detail:
        "Gebruik deze week ten minste één les om langer zelfstandig te rijden en beslissingen minder te onderbreken.",
      badgeLabel: "Bijna",
      badge: "warning",
    });
  } else if (momentum.score < 45) {
    pushGoal({
      title: "Houd de volgende les kleiner",
      detail:
        "Een compactere les met minder variatie geeft deze week waarschijnlijk meer rust en een stabielere groeilijn.",
      badgeLabel: "Ritme",
      badge: "warning",
    });
  } else if (strongestItems[0]) {
    pushGoal({
      title: `Behoud ${strongestItems[0].label.toLowerCase()}`,
      detail:
        "Gebruik dit sterke onderdeel als ankerpunt, zodat vertrouwen blijft staan terwijl de zwakkere delen verder groeien.",
      badgeLabel: "Stabiel",
      badge: "success",
    });
  }

  return goals;
}

export function getStudentMilestoneOverview(
  assessments: StudentProgressAssessment[],
  notes: StudentProgressLessonNote[] = []
): StudentMilestoneOverview {
  const badges = buildStudentAchievementBadges(assessments, notes);
  const latestActivityDate = getLatestStudentProgressActivityDate(assessments, notes);
  const previousBadges = latestActivityDate
    ? buildStudentAchievementBadges(
        assessments.filter(
          (assessment) => assessment.beoordelings_datum !== latestActivityDate
        ),
        notes.filter((note) => note.lesdatum !== latestActivityDate)
      )
    : [];
  const recentUnlockedKeys = new Set(
    badges
      .filter((badge) => {
        if (!badge.earned) {
          return false;
        }

        const previousBadge = previousBadges.find(
          (entry) => entry.key === badge.key
        );

        return !previousBadge?.earned;
      })
      .map((badge) => badge.key)
  );

  const unlocked = badges
    .filter((badge) => badge.earned)
    .map((badge) => ({
      ...badge,
      newlyUnlocked: recentUnlockedKeys.has(badge.key),
    }));
  const recentUnlocked = unlocked.filter((badge) => badge.newlyUnlocked);
  const next = badges.find((badge) => !badge.earned) ?? null;

  return {
    unlocked,
    next,
    recentUnlocked,
    totalUnlocked: unlocked.length,
    totalAvailable: badges.length,
    headline: recentUnlocked.length
      ? `${recentUnlocked.length} nieuwe ${recentUnlocked.length === 1 ? "mijlpaal" : "mijlpalen"} na de laatste les`
      : unlocked.length > 0
      ? `${unlocked.length}/${badges.length} mijlpalen behaald`
      : "Nog geen mijlpaal vrijgespeeld",
  };
}

export function getStudentThreeLessonTrack(
  assessments: StudentProgressAssessment[],
  notes: StudentProgressLessonNote[] = []
): StudentThreeLessonTrackStep[] {
  const basePlan = getStudentNextLessonPlan(assessments, notes);
  const examReadiness = getStudentExamReadiness(assessments, notes);
  const momentum = getStudentProgressMomentum(assessments, notes);
  const steps = basePlan.slice(0, 3).map((step, index) => ({
    ...step,
    lessonLabel: `Les ${index + 1}`,
  }));

  while (steps.length < 3) {
    const nextIndex = steps.length + 1;

    if (nextIndex === 3 && examReadiness.score >= 82) {
      steps.push({
        lessonLabel: "Les 3",
        title: "Volledige proefexamenrit",
        detail:
          "Gebruik deze les als echte nulmeting onder examendruk, met zo min mogelijk extra coaching tijdens de rit.",
        badgeLabel: "Proefexamen",
        badge: "success",
      });
      continue;
    }

    if (nextIndex === 3 && examReadiness.score >= 62) {
      steps.push({
        lessonLabel: "Les 3",
        title: "Examengerichte simulatie",
        detail:
          "Laat route, zelfstandige keuzes en tempo langer samenkomen zodat de overstap naar proefexamen natuurlijker wordt.",
        badgeLabel: "Examengericht",
        badge: "warning",
      });
      continue;
    }

    steps.push({
      lessonLabel: `Les ${nextIndex}`,
      title:
        momentum.score >= 45
          ? "Zelfstandigheid verder uitbouwen"
          : "Rust en basis herhalen",
      detail:
        momentum.score >= 45
          ? "Gebruik dit moment om minder hulp te geven en de leerling zelf beslissingen te laten afmaken."
          : "Houd de les klein en herhaal de basis tot het ritme rustiger en constanter wordt.",
      badgeLabel: momentum.score >= 45 ? "Opbouw" : "Herhaling",
      badge: momentum.score >= 45 ? "info" : "warning",
    });
  }

  return steps.slice(0, 3);
}

export function formatStudentProgressDate(dateValue: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(`${dateValue}T12:00:00`));
}

export function normalizeStudentProgressDate(value: string) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = new Date(`${normalized}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}
