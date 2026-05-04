import { formatAvailabilityDuration } from "@/lib/availability";
import { buildBookableAvailabilitySlots } from "@/lib/lesson-durations";
import type { InstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import type {
  BeschikbaarheidSlot,
  InstructorDashboardProgressSignals,
  InstructorStudentProgressRow,
  Les,
} from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
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

export type SmartWeekPlanningSlot = BeschikbaarheidSlot & {
  start_at: string;
  eind_at: string;
};

export type SmartWeekPlanningBusyWindow = {
  id: string;
  label?: string | null;
  status?: string | null;
  start_at?: string | null;
  end_at?: string | null;
};

export type SmartWeekPlanningProposal = {
  id: string;
  student: InstructorStudentProgressRow;
  slot: SmartWeekPlanningSlot;
  dateLabel: string;
  durationLabel: string;
  priorityLabel: string;
  reason: string;
  score: number;
  timeLabel: string;
  tone: "emerald" | "amber" | "sky" | "violet";
};

export type SmartWeekPlanningModel = {
  blockedCandidateCount: number;
  busyWindows: SmartWeekPlanningBusyWindow[];
  candidateCount: number;
  openSlotCount: number;
  proposals: SmartWeekPlanningProposal[];
};

function getDateMs(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : null;
}

function getLessonStartMs(lesson: Les) {
  return getDateMs(lesson.start_at) ?? getDateMs(lesson.datum);
}

function getLessonEndIso(lesson: Les) {
  if (lesson.end_at) {
    return lesson.end_at;
  }

  const startMs = getLessonStartMs(lesson);

  if (startMs == null) {
    return null;
  }

  return new Date(startMs + Math.max(lesson.duur_minuten, 30) * 60_000).toISOString();
}

function isBlockingLesson(lesson: Les) {
  return lesson.status !== "geannuleerd" && lesson.status !== "geweigerd";
}

function buildBusyWindows(lessons: Les[]): SmartWeekPlanningBusyWindow[] {
  return lessons
    .filter(isBlockingLesson)
    .map((lesson) => ({
      id: lesson.id,
      label: lesson.leerling_naam || lesson.titel,
      status: lesson.status,
      start_at: lesson.start_at ?? null,
      end_at: getLessonEndIso(lesson),
    }))
    .filter((window) => Boolean(window.start_at && window.end_at));
}

function overlapsBusyWindow(
  slot: Pick<SmartWeekPlanningSlot, "start_at" | "eind_at">,
  busyWindows: SmartWeekPlanningBusyWindow[],
) {
  const slotStartMs = getDateMs(slot.start_at);
  const slotEndMs = getDateMs(slot.eind_at);

  if (slotStartMs == null || slotEndMs == null) {
    return true;
  }

  return busyWindows.some((window) => {
    const busyStartMs = getDateMs(window.start_at);
    const busyEndMs = getDateMs(window.end_at);

    if (busyStartMs == null || busyEndMs == null) {
      return false;
    }

    return slotStartMs < busyEndMs && slotEndMs > busyStartMs;
  });
}

function isPlanningBlocked(student: InstructorStudentProgressRow) {
  const hasPackage = Boolean(
    student.pakketId ||
      (student.pakket && student.pakket !== "Nog geen pakket"),
  );

  return student.pakketPlanningGeblokkeerd || !hasPackage;
}

function isStudentWithoutNextLesson(student: InstructorStudentProgressRow) {
  return (
    !student.volgendeLesAt &&
    student.aanvraagStatus !== "geannuleerd" &&
    student.aanvraagStatus !== "geweigerd"
  );
}

function getCandidateScore({
  behindIds,
  packageActionIds,
  student,
}: {
  behindIds: Set<string>;
  packageActionIds: Set<string>;
  student: InstructorStudentProgressRow;
}) {
  let score = 50;

  if (behindIds.has(student.id)) {
    score += 35;
  }

  if (packageActionIds.has(student.id)) {
    score += 18;
  }

  if ((student.pakketResterendeLessen ?? 99) <= 3) {
    score += 12;
  }

  if (student.voortgang < 45) {
    score += 10;
  }

  if ((student.voltooideLessen ?? student.gekoppeldeLessen) >= 8) {
    score += 5;
  }

  return score;
}

function getProposalCopy({
  behindIds,
  packageActionIds,
  student,
}: {
  behindIds: Set<string>;
  packageActionIds: Set<string>;
  student: InstructorStudentProgressRow;
}) {
  if (behindIds.has(student.id)) {
    return {
      priorityLabel: "Beste keuze",
      reason: "Geen vervolgafspraak terwijl de voortgang aandacht vraagt.",
      tone: "violet" as const,
    };
  }

  if (packageActionIds.has(student.id) || (student.pakketResterendeLessen ?? 99) <= 3) {
    return {
      priorityLabel: "Pakket bewaken",
      reason: `${student.pakketResterendeLessen ?? 0} les${student.pakketResterendeLessen === 1 ? "" : "sen"} over, plan gericht en voorkom stilstand.`,
      tone: "amber" as const,
    };
  }

  if (student.voortgang < 55) {
    return {
      priorityLabel: "Ritme herstellen",
      reason: "Deze leerling heeft baat bij een vaste vervolgles deze week.",
      tone: "sky" as const,
    };
  }

  return {
    priorityLabel: "Snelle invulling",
    reason: "Open plek combineren met een leerling zonder volgende les.",
    tone: "emerald" as const,
  };
}

function formatDateTimeLabel(value: string) {
  return {
    dateLabel: dateFormatter.format(new Date(value)),
    timeLabel: timeFormatter.format(new Date(value)),
  };
}

export function buildSmartWeekPlanningModel({
  availabilitySlots,
  durationDefaults,
  lessons,
  maxProposals = 5,
  now = new Date(),
  progressSignals,
  students,
}: {
  availabilitySlots: BeschikbaarheidSlot[];
  durationDefaults: InstructorLessonDurationDefaults;
  lessons: Les[];
  maxProposals?: number;
  now?: Date;
  progressSignals: InstructorDashboardProgressSignals;
  students: InstructorStudentProgressRow[];
}): SmartWeekPlanningModel {
  const nowMs = now.getTime();
  const busyWindows = buildBusyWindows(lessons);
  const bookableSlots = buildBookableAvailabilitySlots(
    availabilitySlots,
    durationDefaults.rijles,
  );
  const uniqueSlots = new Map<string, SmartWeekPlanningSlot>();

  for (const slot of bookableSlots) {
    if (!slot.start_at || !slot.eind_at || slot.beschikbaar === false) {
      continue;
    }

    const startMs = getDateMs(slot.start_at);

    if (startMs == null || startMs <= nowMs + 30 * 60_000) {
      continue;
    }

    if (overlapsBusyWindow(slot as SmartWeekPlanningSlot, busyWindows)) {
      continue;
    }

    uniqueSlots.set(`${slot.start_at}|${slot.eind_at}`, slot as SmartWeekPlanningSlot);
  }

  const openSlots = Array.from(uniqueSlots.values()).sort(
    (left, right) => (left.start_at ?? "").localeCompare(right.start_at ?? ""),
  );
  const studentsWithoutNextLesson = students.filter(isStudentWithoutNextLesson);
  const candidates = studentsWithoutNextLesson.filter(
    (student) => !isPlanningBlocked(student),
  );
  const behindIds = new Set(progressSignals.behindStudents.map((student) => student.id));
  const packageActionIds = new Set(
    progressSignals.packageActionStudents.map((student) => student.id),
  );
  const rankedCandidates = [...candidates].sort((left, right) => {
    const rightScore = getCandidateScore({
      behindIds,
      packageActionIds,
      student: right,
    });
    const leftScore = getCandidateScore({
      behindIds,
      packageActionIds,
      student: left,
    });

    return rightScore - leftScore || left.naam.localeCompare(right.naam);
  });
  const proposalCount = Math.min(maxProposals, openSlots.length, rankedCandidates.length);
  const proposals = Array.from({ length: proposalCount }, (_, index) => {
    const student = rankedCandidates[index];
    const slot = openSlots[index];
    const copy = getProposalCopy({ behindIds, packageActionIds, student });
    const labels = formatDateTimeLabel(slot.start_at);
    const score = getCandidateScore({ behindIds, packageActionIds, student });

    return {
      id: `${student.id}-${slot.id}`,
      student,
      slot,
      dateLabel: labels.dateLabel,
      durationLabel: formatAvailabilityDuration(slot.start_at, slot.eind_at),
      priorityLabel: copy.priorityLabel,
      reason: copy.reason,
      score,
      timeLabel: `${labels.timeLabel} - ${timeFormatter.format(new Date(slot.eind_at))}`,
      tone: copy.tone,
    };
  });

  return {
    blockedCandidateCount: studentsWithoutNextLesson.length - candidates.length,
    busyWindows,
    candidateCount: candidates.length,
    openSlotCount: openSlots.length,
    proposals,
  };
}
