export const DRIVER_JOURNEY_STATUSES = [
  "onboarding",
  "pakket_kiezen",
  "lessen",
  "examen_klaar",
  "examen_gepland",
  "geslaagd",
] as const;

export type DriverJourneyStatus = (typeof DRIVER_JOURNEY_STATUSES)[number];

export type DriverJourneyTone = "danger" | "info" | "success" | "warning";

export type DriverJourneyState = {
  status: DriverJourneyStatus;
  label: string;
  shortLabel: string;
  description: string;
  nextAction: string;
  reason: string;
  tone: DriverJourneyTone;
  rank: number;
};

export type DriverJourneyContext = {
  completedLessons?: number | null;
  currentStatus?: string | null;
  examReadinessScore?: number | null;
  hasExamLessonPlanned?: boolean | null;
  hasPackage?: boolean | null;
  hasPassed?: boolean | null;
  hasPlannedLessons?: boolean | null;
  hasRequest?: boolean | null;
  profileComplete?: boolean | null;
};

const JOURNEY_STATUS_META: Record<
  DriverJourneyStatus,
  Omit<DriverJourneyState, "reason" | "status">
> = {
  onboarding: {
    label: "Onboarding",
    shortLabel: "Start",
    description: "De leerling is aangemaakt, maar het traject is nog niet scherp gestart.",
    nextAction: "Maak profiel, proefles of intake compleet.",
    tone: "info",
    rank: 10,
  },
  pakket_kiezen: {
    label: "Pakket kiezen",
    shortLabel: "Pakket",
    description: "De proefles of eerste stap is geweest; vervolgplanning wacht op pakketkeuze.",
    nextAction: "Koppel een passend pakket om vervolglessen vrij te geven.",
    tone: "warning",
    rank: 20,
  },
  lessen: {
    label: "Bezig met lessen",
    shortLabel: "Lessen",
    description: "De leerling zit in de actieve lesfase.",
    nextAction: "Plan ritme, leg feedback vast en monitor voortgang.",
    tone: "success",
    rank: 30,
  },
  examen_klaar: {
    label: "Klaar voor examen",
    shortLabel: "Examenklaar",
    description: "De voortgang en lesfeedback wijzen richting proefexamen of examenrit.",
    nextAction: "Plan een proefexamen of praktijkexamenmoment.",
    tone: "success",
    rank: 40,
  },
  examen_gepland: {
    label: "Examen gepland",
    shortLabel: "Examen",
    description: "Er staat een examengericht moment gepland.",
    nextAction: "Gebruik de laatste lessen voor examendruk, routes en rust.",
    tone: "warning",
    rank: 50,
  },
  geslaagd: {
    label: "Geslaagd",
    shortLabel: "Geslaagd",
    description: "De leerling heeft het traject afgerond.",
    nextAction: "Rond administratie, review en nazorg af.",
    tone: "success",
    rank: 60,
  },
};

export function isDriverJourneyStatus(
  value: string | null | undefined,
): value is DriverJourneyStatus {
  return DRIVER_JOURNEY_STATUSES.includes(value as DriverJourneyStatus);
}

function withReason(
  status: DriverJourneyStatus,
  reason: string,
): DriverJourneyState {
  return {
    ...JOURNEY_STATUS_META[status],
    reason,
    status,
  };
}

export function getDriverJourneyStateMeta(
  status: string | null | undefined,
): DriverJourneyState {
  return withReason(
    isDriverJourneyStatus(status) ? status : "onboarding",
    "Status direct gelezen zonder extra context.",
  );
}

export function resolveDriverJourneyState({
  completedLessons = 0,
  currentStatus,
  examReadinessScore = 0,
  hasExamLessonPlanned = false,
  hasPackage = false,
  hasPassed = false,
  hasPlannedLessons = false,
  hasRequest = false,
  profileComplete = true,
}: DriverJourneyContext): DriverJourneyState {
  if (hasPassed || currentStatus === "geslaagd") {
    return withReason("geslaagd", "De leerling staat als geslaagd gemarkeerd.");
  }

  if (hasExamLessonPlanned || currentStatus === "examen_gepland") {
    return withReason(
      "examen_gepland",
      "Er staat een examengerichte les of examenmoment gepland.",
    );
  }

  if ((examReadinessScore ?? 0) >= 82) {
    return withReason(
      "examen_klaar",
      `Examengereedheid staat op ${examReadinessScore}%.`,
    );
  }

  if (hasPackage && ((completedLessons ?? 0) > 0 || hasPlannedLessons)) {
    return withReason(
      "lessen",
      "Er is een pakket en er zijn actieve of afgeronde lessen.",
    );
  }

  if (hasPackage) {
    return withReason(
      "lessen",
      "Er is een pakket gekoppeld; de volgende les kan worden gepland.",
    );
  }

  if (!hasPackage && ((completedLessons ?? 0) > 0 || hasRequest)) {
    return withReason(
      "pakket_kiezen",
      "Er is trajectactiviteit, maar nog geen pakket gekoppeld.",
    );
  }

  if (!profileComplete) {
    return withReason("onboarding", "Het leerlingprofiel is nog niet compleet.");
  }

  return withReason("onboarding", "Er is nog geen actieve lesfase gestart.");
}
