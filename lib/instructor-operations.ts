import type {
  BeschikbaarheidSlot,
  InstructorStudentProgressRow,
  Les,
  LesAanvraag,
  Pakket,
} from "@/lib/types";

export type InstructorOperationsTone = "success" | "warning" | "danger" | "info";

export type InstructorOperationsGap = {
  id: string;
  compactLabel: string;
  label: string;
  startAt: string | null;
  endAt: string | null;
  minutes: number;
};

export type InstructorOperationsQueueItem = {
  id: string;
  leerlingNaam: string;
  requestLabel: string;
  preferredLabel: string;
  suggestedSlotLabel: string;
  href: string;
};

export type InstructorOperationsRiskItem = {
  id: string;
  leerlingNaam: string;
  score: number;
  reason: string;
  nextLessonLabel: string;
};

export type InstructorOperationsRevenueItem = {
  id: string;
  leerlingNaam: string;
  packageName: string;
  estimatedValue: number;
  reason: string;
};

export type InstructorOperationsAction = {
  id: string;
  title: string;
  detail: string;
  badgeLabel: string;
  badge: InstructorOperationsTone;
  href: string;
  ctaLabel: string;
};

export type InstructorCopilotSuggestion = {
  id: string;
  title: string;
  detail: string;
  why: string;
  impactLabel: string;
  confidence: number;
  badgeLabel: string;
  badge: InstructorOperationsTone;
  href: string;
  ctaLabel: string;
  draftText?: string;
};

export type InstructorOperationsCopilot = {
  headline: string;
  detail: string;
  confidence: number;
  intakeMode: "push_leads" | "normal" | "limit_intake";
  intakeLabel: string;
  intakeDetail: string;
  capacityLabel: string;
  capacityDetail: string;
  safeNewStudentCapacity: number;
  underusedDayLabel: string;
  strongestTimeWindowLabel: string;
  suggestions: InstructorCopilotSuggestion[];
};

export type InstructorOperationsIntelligence = {
  autoPlanningCount: number;
  availableGapCount: number;
  weekUtilizationPercent: number;
  bookedHoursThisWeek: number;
  freeHoursThisWeek: number;
  noShowRiskCount: number;
  nearPackageEndCount: number;
  estimatedRevenuePotential: number;
  extraSlotsNeeded: number;
  forecast: {
    label: string;
    detail: string;
    badge: InstructorOperationsTone;
  };
  gaps: InstructorOperationsGap[];
  queue: InstructorOperationsQueueItem[];
  noShowRisks: InstructorOperationsRiskItem[];
  revenueOpportunities: InstructorOperationsRevenueItem[];
  actions: InstructorOperationsAction[];
  copilot: InstructorOperationsCopilot;
};

const ACTIVE_LESSON_STATUSES = new Set(["geaccepteerd", "ingepland", "afgerond"]);
const FUTURE_LESSON_STATUSES = new Set(["geaccepteerd", "ingepland"]);
const WEEKDAY_LABELS = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
];

const dateLabelFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Amsterdam",
  weekday: "short",
});

const timeFormatter = new Intl.DateTimeFormat("nl-NL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

function getSafeDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(reference: Date, days: number) {
  const date = new Date(reference);
  date.setDate(reference.getDate() + days);
  return date;
}

function getStartOfWeek(reference: Date) {
  const date = new Date(reference);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isBetween(date: Date | null, start: Date, end: Date) {
  return Boolean(date && date >= start && date < end);
}

function formatDateTimeRange(startAt: string | null, endAt: string | null) {
  const start = getSafeDate(startAt);
  const end = getSafeDate(endAt);

  if (!start) {
    return "Vrij moment";
  }

  const dateLabel = dateLabelFormatter.format(start);
  const startLabel = timeFormatter.format(start);
  const endLabel = end ? timeFormatter.format(end) : "";

  return endLabel ? `${dateLabel} ${startLabel}-${endLabel}` : `${dateLabel} ${startLabel}`;
}

function formatCompactDateTime(startAt: string | null, endAt: string | null) {
  const start = getSafeDate(startAt);
  const end = getSafeDate(endAt);

  if (!start) {
    return "Vrij";
  }

  const startLabel = timeFormatter.format(start);
  const endLabel = end ? timeFormatter.format(end) : "";

  return endLabel ? `${startLabel}-${endLabel}` : startLabel;
}

function getLessonStart(lesson: Les) {
  return getSafeDate(lesson.start_at) ?? getSafeDate(lesson.datum);
}

function getLessonEnd(lesson: Les) {
  const explicitEnd = getSafeDate(lesson.end_at);

  if (explicitEnd) {
    return explicitEnd;
  }

  const start = getLessonStart(lesson);

  if (!start) {
    return null;
  }

  return new Date(start.getTime() + (lesson.duur_minuten || 60) * 60_000);
}

function getSlotStart(slot: BeschikbaarheidSlot) {
  return getSafeDate(slot.start_at);
}

function getSlotEnd(slot: BeschikbaarheidSlot) {
  const explicitEnd = getSafeDate(slot.eind_at);

  if (explicitEnd) {
    return explicitEnd;
  }

  const start = getSlotStart(slot);

  return start ? new Date(start.getTime() + 60 * 60_000) : null;
}

function getMinutesBetween(start: Date | null, end: Date | null, fallback = 60) {
  if (!start || !end) {
    return fallback;
  }

  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

function overlaps(
  leftStart: Date | null,
  leftEnd: Date | null,
  rightStart: Date | null,
  rightEnd: Date | null,
) {
  if (!leftStart || !rightStart) {
    return false;
  }

  const safeLeftEnd = leftEnd ?? new Date(leftStart.getTime() + 60 * 60_000);
  const safeRightEnd = rightEnd ?? new Date(rightStart.getTime() + 60 * 60_000);

  return leftStart < safeRightEnd && safeLeftEnd > rightStart;
}

function getRequestDate(request: LesAanvraag) {
  return getSafeDate(request.start_at) ?? getSafeDate(request.voorkeursdatum);
}

function getRequestLabel(request: LesAanvraag) {
  if (request.pakket_naam?.trim()) {
    return request.pakket_naam.trim();
  }

  if (request.aanvraag_type === "proefles") {
    return "Proefles";
  }

  if (request.aanvraag_type === "pakket") {
    return "Pakket";
  }

  return "Rijles";
}

function getCurrentPackage(
  student: InstructorStudentProgressRow,
  packages: Pakket[],
) {
  return (
    packages.find((pkg) => pkg.id === student.pakketId) ??
    packages.find((pkg) => pkg.naam === student.pakket) ??
    null
  );
}

function getSuggestedPackage(
  student: InstructorStudentProgressRow,
  packages: Pakket[],
) {
  const activePackages = packages
    .filter((pkg) => pkg.actief !== false)
    .sort((left, right) => {
      if (left.lessen !== right.lessen) {
        return left.lessen - right.lessen;
      }

      return left.prijs - right.prijs;
    });
  const currentPackage = getCurrentPackage(student, activePackages);

  if (!currentPackage) {
    return activePackages[0] ?? null;
  }

  return (
    activePackages.find(
      (pkg) =>
        pkg.id !== currentPackage.id &&
        pkg.les_type === currentPackage.les_type &&
        pkg.lessen > currentPackage.lessen,
    ) ??
    activePackages.find((pkg) => pkg.id !== currentPackage.id) ??
    currentPackage
  );
}

function getStudentNextLessonDate(student: InstructorStudentProgressRow) {
  return getSafeDate(student.volgendeLesAt);
}

function getDayPartLabel(date: Date | null) {
  const hour = date?.getHours() ?? 0;

  if (hour < 12) {
    return "ochtend";
  }

  if (hour < 17) {
    return "middag";
  }

  return "avond";
}

function getOperationalPatternSummary({
  availabilitySlots,
  lessons,
  now,
}: {
  availabilitySlots: BeschikbaarheidSlot[];
  lessons: Les[];
  now: Date;
}) {
  const windowStart = addDays(now, -42);
  const windowEnd = addDays(now, 21);
  const weekdayBuckets = Array.from({ length: 7 }, (_, index) => ({
    bookedMinutes: 0,
    index,
    label: WEEKDAY_LABELS[index],
    slotMinutes: 0,
  }));
  const dayPartBuckets = new Map<string, number>();

  for (const slot of availabilitySlots) {
    if (!slot.beschikbaar) {
      continue;
    }

    const start = getSlotStart(slot);
    const end = getSlotEnd(slot);

    if (!isBetween(start, windowStart, windowEnd)) {
      continue;
    }

    weekdayBuckets[start?.getDay() ?? 0].slotMinutes += getMinutesBetween(
      start,
      end,
      60,
    );
  }

  for (const lesson of lessons) {
    if (!ACTIVE_LESSON_STATUSES.has(lesson.status)) {
      continue;
    }

    const start = getLessonStart(lesson);

    if (!isBetween(start, windowStart, windowEnd)) {
      continue;
    }

    weekdayBuckets[start?.getDay() ?? 0].bookedMinutes += lesson.duur_minuten || 60;

    const dayPart = getDayPartLabel(start);
    dayPartBuckets.set(dayPart, (dayPartBuckets.get(dayPart) ?? 0) + 1);
  }

  const weekdayScores = weekdayBuckets
    .filter((bucket) => bucket.slotMinutes > 0)
    .map((bucket) => ({
      ...bucket,
      utilization: Math.round((bucket.bookedMinutes / bucket.slotMinutes) * 100),
    }));
  const underusedDay =
    [...weekdayScores]
      .filter((bucket) => bucket.slotMinutes >= 90)
      .sort((left, right) => left.utilization - right.utilization)[0] ?? null;
  const strongestDay =
    [...weekdayScores]
      .filter((bucket) => bucket.slotMinutes >= 90)
      .sort((left, right) => right.utilization - left.utilization)[0] ?? null;
  const strongestTimeWindow =
    [...dayPartBuckets.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "avond";

  return {
    strongestDay,
    strongestTimeWindow,
    underusedDay,
  };
}

function buildRiskItems({
  lessons,
  now,
}: {
  lessons: Les[];
  now: Date;
}) {
  const nextWeekEnd = addDays(now, 7);
  const historyByStudent = new Map<
    string,
    {
      cancelled: number;
      absent: number;
      total: number;
    }
  >();

  for (const lesson of lessons) {
    if (!lesson.leerling_id) {
      continue;
    }

    const history = historyByStudent.get(lesson.leerling_id) ?? {
      absent: 0,
      cancelled: 0,
      total: 0,
    };

    history.total += 1;

    if (lesson.status === "geannuleerd") {
      history.cancelled += 1;
    }

    if (lesson.attendance_status === "afwezig") {
      history.absent += 1;
    }

    historyByStudent.set(lesson.leerling_id, history);
  }

  return lessons
    .filter((lesson) => {
      const start = getLessonStart(lesson);

      return (
        lesson.leerling_id &&
        start &&
        start >= now &&
        start < nextWeekEnd &&
        FUTURE_LESSON_STATUSES.has(lesson.status)
      );
    })
    .map((lesson) => {
      const history = historyByStudent.get(lesson.leerling_id ?? "") ?? {
        absent: 0,
        cancelled: 0,
        total: 0,
      };
      const score = Math.min(
        100,
        history.absent * 28 +
          history.cancelled * 18 +
          (history.total <= 2 ? 8 : 0) +
          (!lesson.reminder_24h_sent_at ? 8 : 0),
      );
      const reasons = [
        history.absent ? `${history.absent} no-show` : null,
        history.cancelled ? `${history.cancelled} annulering` : null,
        !lesson.reminder_24h_sent_at ? "24h reminder nog open" : null,
      ].filter((item): item is string => Boolean(item));

      return {
        id: lesson.id,
        leerlingNaam: lesson.leerling_naam || "Leerling",
        nextLessonLabel: formatDateTimeRange(lesson.start_at ?? null, lesson.end_at ?? null),
        reason: reasons.length ? reasons.join(", ") : "Normaal risico",
        score,
      };
    })
    .filter((item) => item.score >= 22)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);
}

export function buildInstructorOperationsIntelligence({
  availabilitySlots,
  lessonPrice,
  lessons,
  now = new Date(),
  packages,
  requests,
  students,
}: {
  availabilitySlots: BeschikbaarheidSlot[];
  lessonPrice: number;
  lessons: Les[];
  now?: Date;
  packages: Pakket[];
  requests: LesAanvraag[];
  students: InstructorStudentProgressRow[];
}): InstructorOperationsIntelligence {
  const weekStart = getStartOfWeek(now);
  const weekEnd = addDays(weekStart, 7);
  const next14End = addDays(now, 14);
  const previous14Start = addDays(now, -14);

  const activeWeekLessons = lessons.filter((lesson) =>
    ACTIVE_LESSON_STATUSES.has(lesson.status),
  ).filter((lesson) => isBetween(getLessonStart(lesson), weekStart, weekEnd));
  const upcomingActiveLessons = lessons.filter((lesson) => {
    const start = getLessonStart(lesson);

    return (
      start &&
      start >= now &&
      start < next14End &&
      FUTURE_LESSON_STATUSES.has(lesson.status)
    );
  });
  const previousActiveLessons = lessons.filter((lesson) => {
    const start = getLessonStart(lesson);

    return (
      start &&
      start >= previous14Start &&
      start < now &&
      ACTIVE_LESSON_STATUSES.has(lesson.status)
    );
  });
  const weekAvailableSlots = availabilitySlots
    .filter((slot) => slot.beschikbaar)
    .filter((slot) => isBetween(getSlotStart(slot), weekStart, weekEnd))
    .sort(
      (left, right) =>
        (getSlotStart(left)?.getTime() ?? 0) -
        (getSlotStart(right)?.getTime() ?? 0),
    );
  const bookedMinutesThisWeek = activeWeekLessons.reduce(
    (total, lesson) => total + (lesson.duur_minuten || 60),
    0,
  );
  const availableMinutesThisWeek = weekAvailableSlots.reduce(
    (total, slot) =>
      total + getMinutesBetween(getSlotStart(slot), getSlotEnd(slot), 60),
    0,
  );
  const weekUtilizationPercent = availableMinutesThisWeek
    ? Math.min(100, Math.round((bookedMinutesThisWeek / availableMinutesThisWeek) * 100))
    : 0;
  const freeWeekSlots = weekAvailableSlots.filter((slot) => {
    const slotStart = getSlotStart(slot);
    const slotEnd = getSlotEnd(slot);

    return !activeWeekLessons.some((lesson) =>
      overlaps(slotStart, slotEnd, getLessonStart(lesson), getLessonEnd(lesson)),
    );
  });
  const gaps = freeWeekSlots.slice(0, 6).map((slot) => {
    const startAt = slot.start_at ?? null;
    const endAt = slot.eind_at ?? null;

    return {
      id: slot.id,
      compactLabel: formatCompactDateTime(startAt, endAt),
      label: formatDateTimeRange(startAt, endAt),
      startAt,
      endAt,
      minutes: getMinutesBetween(getSlotStart(slot), getSlotEnd(slot), 60),
    };
  });
  const openRequests = requests
    .filter((request) => request.status === "aangevraagd")
    .sort((left, right) => {
      const leftDate = getRequestDate(left)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightDate = getRequestDate(right)?.getTime() ?? Number.MAX_SAFE_INTEGER;

      return leftDate - rightDate;
    });
  const autoPlanningCount = Math.min(openRequests.length, freeWeekSlots.length);
  const queue = openRequests.slice(0, 5).map((request, index) => {
    const suggestedSlot = gaps[index] ?? null;
    const requestDate = getRequestDate(request);

    return {
      id: request.id,
      leerlingNaam: request.leerling_naam,
      requestLabel: getRequestLabel(request),
      preferredLabel: requestDate
        ? dateLabelFormatter.format(requestDate)
        : request.voorkeursdatum || "Voorkeur volgt",
      suggestedSlotLabel: suggestedSlot?.label ?? "Zet eerst een vrij blok open",
      href: "/instructeur/aanvragen",
    };
  });
  const studentsNeedingLesson = students.filter((student) => {
    if (!student.planningVrijTeGeven) {
      return false;
    }

    const nextLesson = getStudentNextLessonDate(student);

    return !nextLesson || nextLesson > addDays(now, 7);
  });
  const noShowRisks = buildRiskItems({ lessons, now });
  const nearPackageEndStudents = students.filter(
    (student) =>
      !student.pakketPlanningGeblokkeerd &&
      student.pakketResterendeLessen != null &&
      student.pakketResterendeLessen <= 3,
  );
  const packageBlockedStudents = students.filter(
    (student) => student.pakketPlanningGeblokkeerd || !student.pakketId,
  );
  const revenueStudents = [
    ...nearPackageEndStudents,
    ...packageBlockedStudents.filter(
      (student) => !nearPackageEndStudents.some((item) => item.id === student.id),
    ),
  ];
  const revenueOpportunities = revenueStudents
    .map((student) => {
      const suggestedPackage = getSuggestedPackage(student, packages);

      if (!suggestedPackage) {
        return null;
      }

      return {
        id: student.id,
        leerlingNaam: student.naam,
        packageName: suggestedPackage.naam,
        estimatedValue: Number(suggestedPackage.prijs ?? 0),
        reason: student.pakketPlanningGeblokkeerd
          ? "Pakket nog niet gekoppeld"
          : `${student.pakketResterendeLessen ?? 0} lessen over`,
      };
    })
    .filter((item): item is InstructorOperationsRevenueItem => Boolean(item))
    .sort((left, right) => right.estimatedValue - left.estimatedValue)
    .slice(0, 5);
  const estimatedRevenuePotential = revenueOpportunities.reduce(
    (total, item) => total + item.estimatedValue,
    0,
  );
  const upcomingDemand = upcomingActiveLessons.length + openRequests.length;
  const previousDemand = previousActiveLessons.length;
  const demandDelta = upcomingDemand - previousDemand;
  const extraSlotsNeeded = Math.max(
    0,
    studentsNeedingLesson.length + openRequests.length - freeWeekSlots.length,
  );
  const freeHoursThisWeek =
    Math.max(availableMinutesThisWeek - bookedMinutesThisWeek, 0) / 60;
  const bookedHoursThisWeek = bookedMinutesThisWeek / 60;
  const forecast =
    extraSlotsNeeded > 3
      ? {
          label: "Capaciteit krap",
          detail: `${extraSlotsNeeded} extra blok${extraSlotsNeeded === 1 ? "" : "ken"} nodig om vraag en ritme op te vangen.`,
          badge: "danger" as const,
        }
      : demandDelta >= 4
        ? {
            label: "Drukke week verwacht",
            detail: `${upcomingDemand} geplande of open momenten in de komende 14 dagen.`,
            badge: "warning" as const,
          }
        : weekUtilizationPercent >= 72
          ? {
              label: "Gezonde bezetting",
              detail: "Je open tijd wordt goed benut zonder dat de planning dichtslibt.",
              badge: "success" as const,
            }
          : {
              label: "Ruimte om te vullen",
              detail: `${freeWeekSlots.length} vrije blok${freeWeekSlots.length === 1 ? "" : "ken"} kunnen nog omzet of ritme opleveren.`,
              badge: "info" as const,
            };
  const patterns = getOperationalPatternSummary({
    availabilitySlots,
    lessons,
    now,
  });
  const safeNewStudentCapacity = Math.max(
    0,
    Math.floor((freeWeekSlots.length - openRequests.length) / 2),
  );
  const intakeMode =
    extraSlotsNeeded > 2 || weekUtilizationPercent >= 88
      ? "limit_intake"
      : weekUtilizationPercent < 58 && safeNewStudentCapacity >= 1
        ? "push_leads"
        : "normal";
  const intakeLabel =
    intakeMode === "limit_intake"
      ? "Intake beperken"
      : intakeMode === "push_leads"
        ? "Leads pushen"
        : "Normale instroom";
  const intakeDetail =
    intakeMode === "limit_intake"
      ? "Laat nieuwe aanvragen door, maar voorkom dat kwaliteit en lesritme onder druk komen."
      : intakeMode === "push_leads"
        ? `${safeNewStudentCapacity} nieuwe leerling${safeNewStudentCapacity === 1 ? "" : "en"} kunnen erbij zonder je week direct vol te trekken.`
        : "Je capaciteit en vraag zijn redelijk in balans; houd campagnes rustig maar actief.";
  const capacityLabel =
    extraSlotsNeeded > 4
      ? "Extra instructeur onderzoeken"
      : extraSlotsNeeded > 0
        ? "Extra blokken openen"
        : "Capaciteit stabiel";
  const capacityDetail =
    extraSlotsNeeded > 4
      ? "De vraag loopt harder dan je vrije blokken. Tijd om extra instructeurs of vaste avondblokken te overwegen."
      : extraSlotsNeeded > 0
        ? `${extraSlotsNeeded} extra blok${extraSlotsNeeded === 1 ? "" : "ken"} voorkomt dat leerlingen zonder nieuw lesmoment vallen.`
        : "Er is genoeg ruimte om bestaande leerlingen en normale instroom op te vangen.";
  const copilotSuggestions: InstructorCopilotSuggestion[] = [];

  if (patterns.underusedDay && patterns.underusedDay.utilization < 42) {
    copilotSuggestions.push({
      id: "underused-day",
      title: `${patterns.underusedDay.label} is structureel onderbenut`,
      detail:
        intakeMode === "push_leads"
          ? "Gebruik deze dag voor een proeflesactie of plaats open slots prominenter."
          : "Overweeg om losse blokken op deze dag te verschuiven naar beter gevulde dagen.",
      why: `${patterns.underusedDay.utilization}% benutting op beschikbare blokken in de recente planning.`,
      impactLabel: "Minder lege tijd",
      confidence: Math.max(56, 92 - patterns.underusedDay.utilization),
      badgeLabel: "Rooster",
      badge: "info",
      href: "/instructeur/beschikbaarheid",
      ctaLabel: "Rooster bekijken",
    });
  }

  if (extraSlotsNeeded > 0) {
    copilotSuggestions.push({
      id: "capacity-needed",
      title: capacityLabel,
      detail: capacityDetail,
      why: `${studentsNeedingLesson.length} leerling${studentsNeedingLesson.length === 1 ? "" : "en"} hebben ritme nodig en er zijn ${openRequests.length} open aanvraag${openRequests.length === 1 ? "" : "en"}.`,
      impactLabel: "Capaciteit",
      confidence: Math.min(94, 62 + extraSlotsNeeded * 7),
      badgeLabel: "Forecast",
      badge: extraSlotsNeeded > 4 ? "danger" : "warning",
      href: "/instructeur/beschikbaarheid",
      ctaLabel: "Blokken openen",
    });
  }

  if (intakeMode === "push_leads") {
    copilotSuggestions.push({
      id: "marketing-push",
      title: "Start een gerichte instroomactie",
      detail: `Je hebt ruimte voor ongeveer ${safeNewStudentCapacity} nieuwe leerling${safeNewStudentCapacity === 1 ? "" : "en"}. Push vooral proeflessen op vrije dagen.`,
      why: `${freeWeekSlots.length} vrije blokken deze week en ${weekUtilizationPercent}% weekbezetting.`,
      impactLabel: "Instroom",
      confidence: Math.min(88, 58 + safeNewStudentCapacity * 8),
      badgeLabel: "Marketing",
      badge: "success",
      href: "/instructeur/profiel",
      ctaLabel: "Profiel promoten",
    });
  }

  if (weekUtilizationPercent >= 82 && packages.length) {
    const candidatePackage = [...packages]
      .filter((pkg) => pkg.actief !== false)
      .sort((left, right) => Number(right.prijs ?? 0) - Number(left.prijs ?? 0))[0];

    if (candidatePackage) {
      copilotSuggestions.push({
        id: "pricing-review",
        title: `Prijs van ${candidatePackage.naam} herzien`,
        detail:
          "Je bezetting is hoog. Test of dit pakket meer marge kan dragen voordat je extra capaciteit toevoegt.",
        why: `${weekUtilizationPercent}% bezetting en ${forecast.label.toLowerCase()}.`,
        impactLabel: "Marge",
        confidence: Math.min(86, weekUtilizationPercent),
        badgeLabel: "Prijs",
        badge: "warning",
        href: "/instructeur/pakketten",
        ctaLabel: "Pakketten openen",
      });
    }
  }

  if (noShowRisks[0]) {
    copilotSuggestions.push({
      id: "personal-message",
      title: `Persoonlijke reminder voor ${noShowRisks[0].leerlingNaam}`,
      detail:
        "Stuur geen standaard herinnering, maar een korte bevestiging met focus op voorbereiding en aanwezigheid.",
      why: `${noShowRisks[0].score}% risicoscore: ${noShowRisks[0].reason}.`,
      impactLabel: "No-show omlaag",
      confidence: Math.min(90, noShowRisks[0].score + 18),
      badgeLabel: "AI bericht",
      badge: "danger",
      href: "/instructeur/berichten",
      ctaLabel: "Bericht sturen",
      draftText: `Hi ${noShowRisks[0].leerlingNaam}, je les staat gepland op ${noShowRisks[0].nextLessonLabel}. Laat je kort weten of dit nog goed uitkomt? Dan houd ik je plek netjes vast en kunnen we gericht verder werken.`,
    });
  }

  if (patterns.strongestTimeWindow && weekUtilizationPercent >= 55) {
    copilotSuggestions.push({
      id: "yield-window",
      title: `Focus op ${patterns.strongestTimeWindow}lessen`,
      detail:
        "Dit tijdvak heeft de meeste activiteit. Gebruik het voor pakketten, proeflessen en leerlingen met urgentie.",
      why: `De meeste geplande of afgeronde lessen vallen in de ${patterns.strongestTimeWindow}.`,
      impactLabel: "Rendement",
      confidence: 68,
      badgeLabel: "Timing",
      badge: "info",
      href: "/instructeur/lessen",
      ctaLabel: "Planning openen",
    });
  }

  const copilotConfidence = Math.min(
    94,
    Math.max(
      54,
      48 +
        Math.min(18, lessons.length * 2) +
        Math.min(14, availabilitySlots.length) +
        Math.min(14, students.length),
    ),
  );
  const copilot: InstructorOperationsCopilot = {
    headline:
      intakeMode === "limit_intake"
        ? "Groei afremmen tot capaciteit klopt"
        : intakeMode === "push_leads"
          ? "Ruimte om gericht nieuwe leerlingen te werven"
          : "Operatie in balans houden",
    detail:
      "Co-pilot voorstellen zijn adviesregels op basis van planning, capaciteit, voortgang en omzet. Jij beslist wat uitgevoerd wordt.",
    confidence: copilotConfidence,
    intakeMode,
    intakeLabel,
    intakeDetail,
    capacityLabel,
    capacityDetail,
    safeNewStudentCapacity,
    underusedDayLabel: patterns.underusedDay
      ? `${patterns.underusedDay.label} (${patterns.underusedDay.utilization}%)`
      : "Geen zwakke dag zichtbaar",
    strongestTimeWindowLabel: patterns.strongestTimeWindow,
    suggestions: copilotSuggestions.slice(0, 5),
  };
  const actions: InstructorOperationsAction[] = [];

  if (autoPlanningCount > 0) {
    actions.push({
      id: "auto-planning",
      title: `${autoPlanningCount} aanvraag${autoPlanningCount === 1 ? "" : "en"} automatisch te plaatsen`,
      detail: "Er zijn open aanvragen en vrije blokken in dezelfde week. Start bij de aanvragenlijst.",
      badgeLabel: "Auto-planning",
      badge: "success",
      href: "/instructeur/aanvragen",
      ctaLabel: "Aanvragen openen",
    });
  }

  if (nearPackageEndStudents.length > 0) {
    actions.push({
      id: "package-upsell",
      title: `${nearPackageEndStudents.length} leerling${nearPackageEndStudents.length === 1 ? "" : "en"} bijna door pakket`,
      detail: "Dit is het juiste moment voor een vervolg- of examenpakket.",
      badgeLabel: "Omzet",
      badge: "warning",
      href: "/instructeur/leerlingen",
      ctaLabel: "Leerlingen openen",
    });
  }

  if (noShowRisks.length > 0) {
    actions.push({
      id: "no-show-risk",
      title: `${noShowRisks.length} no-show risico${noShowRisks.length === 1 ? "" : "'s"}`,
      detail: "Stuur extra bevestiging of stem de les actief af.",
      badgeLabel: "Risico",
      badge: "danger",
      href: "/instructeur/lessen",
      ctaLabel: "Lessen openen",
    });
  }

  if (extraSlotsNeeded > 0) {
    actions.push({
      id: "capacity",
      title: `${extraSlotsNeeded} extra beschikbaarheidsblok${extraSlotsNeeded === 1 ? "" : "ken"} nodig`,
      detail: "Zet capaciteit open voordat leerlingen zonder nieuw lesmoment vallen.",
      badgeLabel: "Capaciteit",
      badge: "warning",
      href: "/instructeur/beschikbaarheid",
      ctaLabel: "Beschikbaarheid openen",
    });
  }

  if (
    weekUtilizationPercent < 65 &&
    freeWeekSlots.length > 0 &&
    lessonPrice > 0
  ) {
    actions.push({
      id: "fill-gaps",
      title: `${freeWeekSlots.length} vrij blok${freeWeekSlots.length === 1 ? "" : "ken"} met omzetruimte`,
      detail: `Bij je gemiddelde lesprijs ligt hier ongeveer EUR ${Math.round(
        freeWeekSlots.length * lessonPrice,
      )} aan lesomzet open.`,
      badgeLabel: "Vullen",
      badge: "info",
      href: "/instructeur/beschikbaarheid",
      ctaLabel: "Vrije blokken vullen",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "stable",
      title: "Operatie op koers",
      detail: "Planning, pakketdruk en risico's blijven momenteel beheersbaar.",
      badgeLabel: "Rustig",
      badge: "success",
      href: "/instructeur/regie",
      ctaLabel: "Regie openen",
    });
  }

  return {
    autoPlanningCount,
    availableGapCount: freeWeekSlots.length,
    weekUtilizationPercent,
    bookedHoursThisWeek,
    freeHoursThisWeek,
    noShowRiskCount: noShowRisks.length,
    nearPackageEndCount: nearPackageEndStudents.length,
    estimatedRevenuePotential,
    extraSlotsNeeded,
    forecast,
    gaps,
    queue,
    noShowRisks,
    revenueOpportunities,
    actions: actions.slice(0, 4),
    copilot,
  };
}
