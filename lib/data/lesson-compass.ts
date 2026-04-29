import "server-only";

import type { SharedLessonCompassBoard } from "@/lib/types";
import { getCurrentInstructeurRecord, getCurrentLeerlingRecord } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

const ACTIVE_COMPASS_REQUEST_STATUSES = [
  "geaccepteerd",
  "ingepland",
  "afgerond",
] as const;
const UPCOMING_LESSON_STATUSES = ["geaccepteerd", "ingepland"] as const;

type LessonCompassRow = {
  id: string;
  leerling_id: string;
  instructeur_id: string;
  instructeur_focus: string | null;
  instructeur_missie: string | null;
  leerling_confidence: number | null;
  leerling_hulpvraag: string | null;
  laatste_update_door: string | null;
  updated_at: string;
};

type LearnerLessonSeedRow = {
  instructeur_id: string | null;
  start_at: string | null;
  titel: string;
  status: string;
};

type LearnerRequestSeedRow = {
  instructeur_id: string | null;
  pakket_naam_snapshot: string | null;
  status: string;
  created_at: string;
};

type LearnerManualLinkSeedRow = {
  instructeur_id: string | null;
  created_at: string;
};

type InstructorLessonSeedRow = {
  leerling_id: string | null;
  instructeur_id: string | null;
  start_at: string | null;
  titel: string;
  status: string;
};

type InstructorRequestSeedRow = {
  leerling_id: string | null;
  instructeur_id: string | null;
  pakket_naam_snapshot: string | null;
  status: string;
  created_at: string;
};

type InstructorManualLinkSeedRow = {
  leerling_id: string | null;
  instructeur_id: string | null;
  created_at: string;
};

type PairSeed = {
  leerlingId: string;
  instructeurId: string;
  nextTouchpoint: string | null;
  sortMode: "future" | "recent";
  sortAt: number;
};

function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(dateString));
}

function formatUpdatedLabel(dateString: string | null | undefined) {
  if (!dateString) {
    return "Nog niet samen bijgewerkt";
  }

  const date = new Date(dateString);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return new Intl.DateTimeFormat("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Amsterdam",
    }).format(date);
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(date);
}

function getRequestStatusLabel(status: string) {
  if (status === "ingepland") {
    return "Les ingepland";
  }

  if (status === "afgerond") {
    return "Traject loopt al";
  }

  return "Traject geaccepteerd";
}

function registerSeed(
  map: Map<string, PairSeed>,
  key: string,
  candidate: PairSeed
) {
  const current = map.get(key);

  if (!current) {
    map.set(key, candidate);
    return;
  }

  if (candidate.sortMode === "future" && current.sortMode !== "future") {
    map.set(key, candidate);
    return;
  }

  if (candidate.sortMode !== "future" && current.sortMode === "future") {
    return;
  }

  if (
    candidate.sortMode === "future" &&
    current.sortMode === "future" &&
    candidate.sortAt < current.sortAt
  ) {
    map.set(key, candidate);
    return;
  }

  if (
    candidate.sortMode === "recent" &&
    current.sortMode === "recent" &&
    candidate.sortAt > current.sortAt
  ) {
    map.set(key, candidate);
  }
}

function getCompassPulse(board: {
  learnerConfidence?: number | null;
  learnerHelpRequest?: string | null;
  instructorFocus?: string | null;
  instructorMission?: string | null;
}) {
  if ((board.learnerConfidence ?? 0) <= 2 && board.learnerConfidence != null) {
    return {
      label: "Extra rust nodig",
      variant: "warning" as const,
    };
  }

  if (
    (board.learnerConfidence ?? 0) >= 4 &&
    (board.instructorFocus?.trim() || board.instructorMission?.trim())
  ) {
    return {
      label: "Klaar voor tempo",
      variant: "success" as const,
    };
  }

  if (board.learnerHelpRequest?.trim() && board.instructorFocus?.trim()) {
    return {
      label: "Focus staat scherp",
      variant: "success" as const,
    };
  }

  if (board.learnerHelpRequest?.trim()) {
    return {
      label: "Vraag staat klaar",
      variant: "info" as const,
    };
  }

  return {
    label: "Samen afstemmen",
    variant: "info" as const,
  };
}

async function getInstructorScopeIds(profileId: string, fallbackId: string) {
  const supabase = await createServerClient();
  const { data: rows } = await supabase
    .from("instructeurs")
    .select("id")
    .eq("profile_id", profileId);

  const ids = (rows ?? [])
    .map((row) => row.id)
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(ids.length ? ids : [fallbackId]));
}

function sortBoards(boards: SharedLessonCompassBoard[]) {
  return [...boards].sort((left, right) => {
    const leftHasTouchpoint = left.next_touchpoint ? 0 : 1;
    const rightHasTouchpoint = right.next_touchpoint ? 0 : 1;

    if (leftHasTouchpoint !== rightHasTouchpoint) {
      return leftHasTouchpoint - rightHasTouchpoint;
    }

    const leftUpdated = left.updated_at ? new Date(left.updated_at).getTime() : 0;
    const rightUpdated = right.updated_at ? new Date(right.updated_at).getTime() : 0;

    return rightUpdated - leftUpdated;
  });
}

export async function getCurrentLearnerLessonCompassBoards(): Promise<
  SharedLessonCompassBoard[]
> {
  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return [];
  }

  const supabase = await createServerClient();
  const [{ data: lessonRows }, { data: requestRows }, { data: linkRows }] =
    await Promise.all([
    supabase
      .from("lessen")
      .select("instructeur_id, start_at, titel, status")
      .eq("leerling_id", leerling.id)
      .neq("status", "geannuleerd"),
    supabase
      .from("lesaanvragen")
      .select("instructeur_id, pakket_naam_snapshot, status, created_at")
      .eq("leerling_id", leerling.id)
      .in("status", [...ACTIVE_COMPASS_REQUEST_STATUSES]),
    supabase
      .from("instructeur_leerling_koppelingen" as never)
      .select("instructeur_id, created_at")
      .eq("leerling_id", leerling.id),
  ]);

  const pairSeeds = new Map<string, PairSeed>();

  (lessonRows as LearnerLessonSeedRow[] | null)?.forEach((row) => {
    if (!row.instructeur_id) {
      return;
    }

    const startAt = row.start_at ? new Date(row.start_at).getTime() : null;
    const isUpcoming =
      row.start_at &&
      UPCOMING_LESSON_STATUSES.includes(
        row.status as (typeof UPCOMING_LESSON_STATUSES)[number]
      ) &&
      startAt != null &&
      startAt >= Date.now() - 1000 * 60 * 60 * 4;

    registerSeed(pairSeeds, row.instructeur_id, {
      leerlingId: leerling.id,
      instructeurId: row.instructeur_id,
      nextTouchpoint: isUpcoming
        ? `Volgende les - ${formatDateTime(row.start_at as string)}`
        : `Traject actief - ${row.titel}`,
      sortMode: isUpcoming ? "future" : "recent",
      sortAt: startAt ?? Date.now(),
    });
  });

  (requestRows as LearnerRequestSeedRow[] | null)?.forEach((row) => {
    if (!row.instructeur_id) {
      return;
    }

    registerSeed(pairSeeds, row.instructeur_id, {
      leerlingId: leerling.id,
      instructeurId: row.instructeur_id,
      nextTouchpoint: `${getRequestStatusLabel(row.status)}${
        row.pakket_naam_snapshot ? ` - ${row.pakket_naam_snapshot}` : ""
      }`,
      sortMode: "recent",
      sortAt: new Date(row.created_at).getTime(),
    });
  });

  (linkRows as LearnerManualLinkSeedRow[] | null)?.forEach((row) => {
    if (!row.instructeur_id) {
      return;
    }

    if (!pairSeeds.has(row.instructeur_id)) {
      pairSeeds.set(row.instructeur_id, {
        leerlingId: leerling.id,
        instructeurId: row.instructeur_id,
        nextTouchpoint: "Handmatig gestart",
        sortMode: "recent",
        sortAt: new Date(row.created_at).getTime(),
      });
    }
  });

  const instructorIds = Array.from(pairSeeds.keys());

  if (!instructorIds.length) {
    return [];
  }

  const [{ data: instructors }, { data: boardRows }] = await Promise.all([
    supabase
      .from("instructeurs")
      .select("id, volledige_naam")
      .in("id", instructorIds),
    supabase
      .from("leskompassen")
      .select(
        "id, leerling_id, instructeur_id, instructeur_focus, instructeur_missie, leerling_confidence, leerling_hulpvraag, laatste_update_door, updated_at"
      )
      .eq("leerling_id", leerling.id)
      .in("instructeur_id", instructorIds),
  ]);

  const instructorMap = new Map(
    (instructors ?? []).map((row) => [row.id, row.volledige_naam || "Instructeur"])
  );
  const boardMap = new Map(
    ((boardRows ?? []) as LessonCompassRow[]).map((row) => [
      row.instructeur_id,
      row,
    ])
  );

  const boards = instructorIds.map((instructorId) => {
    const boardRow = boardMap.get(instructorId);
    const seed = pairSeeds.get(instructorId)!;
    const pulse = getCompassPulse({
      learnerConfidence: boardRow?.leerling_confidence,
      learnerHelpRequest: boardRow?.leerling_hulpvraag,
      instructorFocus: boardRow?.instructeur_focus,
      instructorMission: boardRow?.instructeur_missie,
    });

    return {
      id: boardRow?.id ?? null,
      leerling_id: leerling.id,
      instructeur_id: instructorId,
      counterpart_name: instructorMap.get(instructorId) ?? "Instructeur",
      counterpart_role: "instructeur" as const,
      next_touchpoint: seed.nextTouchpoint,
      instructor_focus: boardRow?.instructeur_focus ?? null,
      instructor_mission: boardRow?.instructeur_missie ?? null,
      learner_confidence: boardRow?.leerling_confidence ?? null,
      learner_help_request: boardRow?.leerling_hulpvraag ?? null,
      last_updated_by:
        boardRow?.laatste_update_door === "leerling" ||
        boardRow?.laatste_update_door === "instructeur"
          ? boardRow.laatste_update_door
          : null,
      updated_at: boardRow?.updated_at ?? null,
      updated_label: formatUpdatedLabel(boardRow?.updated_at),
      pulse_label: pulse.label,
      pulse_variant: pulse.variant,
    } satisfies SharedLessonCompassBoard;
  });

  return sortBoards(boards);
}

export async function getCurrentInstructorLessonCompassBoards(): Promise<
  SharedLessonCompassBoard[]
> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  const instructorIds = await getInstructorScopeIds(
    instructeur.profile_id,
    instructeur.id
  );

  const [{ data: lessonRows }, { data: requestRows }, { data: linkRows }] =
    await Promise.all([
    supabase
      .from("lessen")
      .select("leerling_id, instructeur_id, start_at, titel, status")
      .in("instructeur_id", instructorIds)
      .neq("status", "geannuleerd"),
    supabase
      .from("lesaanvragen")
      .select("leerling_id, instructeur_id, pakket_naam_snapshot, status, created_at")
      .in("instructeur_id", instructorIds)
      .in("status", [...ACTIVE_COMPASS_REQUEST_STATUSES]),
    supabase
      .from("instructeur_leerling_koppelingen" as never)
      .select("leerling_id, instructeur_id, created_at")
      .in("instructeur_id", instructorIds),
  ]);

  const pairSeeds = new Map<string, PairSeed>();

  (lessonRows as InstructorLessonSeedRow[] | null)?.forEach((row) => {
    if (!row.instructeur_id || !row.leerling_id) {
      return;
    }

    const startAt = row.start_at ? new Date(row.start_at).getTime() : null;
    const isUpcoming =
      row.start_at &&
      UPCOMING_LESSON_STATUSES.includes(
        row.status as (typeof UPCOMING_LESSON_STATUSES)[number]
      ) &&
      startAt != null &&
      startAt >= Date.now() - 1000 * 60 * 60 * 4;

    registerSeed(pairSeeds, row.leerling_id, {
      leerlingId: row.leerling_id,
      instructeurId: row.instructeur_id,
      nextTouchpoint: isUpcoming
        ? `Volgende les - ${formatDateTime(row.start_at as string)}`
        : `Traject actief - ${row.titel}`,
      sortMode: isUpcoming ? "future" : "recent",
      sortAt: startAt ?? Date.now(),
    });
  });

  (requestRows as InstructorRequestSeedRow[] | null)?.forEach((row) => {
    if (!row.instructeur_id || !row.leerling_id) {
      return;
    }

    registerSeed(pairSeeds, row.leerling_id, {
      leerlingId: row.leerling_id,
      instructeurId: row.instructeur_id,
      nextTouchpoint: `${getRequestStatusLabel(row.status)}${
        row.pakket_naam_snapshot ? ` - ${row.pakket_naam_snapshot}` : ""
      }`,
      sortMode: "recent",
      sortAt: new Date(row.created_at).getTime(),
    });
  });

  (linkRows as InstructorManualLinkSeedRow[] | null)?.forEach((row) => {
    if (!row.instructeur_id || !row.leerling_id) {
      return;
    }

    if (!pairSeeds.has(row.leerling_id)) {
      pairSeeds.set(row.leerling_id, {
        leerlingId: row.leerling_id,
        instructeurId: row.instructeur_id,
        nextTouchpoint: "Handmatig gestart",
        sortMode: "recent",
        sortAt: new Date(row.created_at).getTime(),
      });
    }
  });

  const learnerIds = Array.from(pairSeeds.keys());

  if (!learnerIds.length) {
    return [];
  }

  const [{ data: learnerRows }, { data: boardRows }] = await Promise.all([
    supabase
      .from("leerlingen")
      .select("id, profile_id")
      .in("id", learnerIds),
    supabase
      .from("leskompassen")
      .select(
        "id, leerling_id, instructeur_id, instructeur_focus, instructeur_missie, leerling_confidence, leerling_hulpvraag, laatste_update_door, updated_at"
      )
      .in("leerling_id", learnerIds)
      .in("instructeur_id", instructorIds),
  ]);

  const profileIds = (learnerRows ?? []).map((row) => row.profile_id);
  const { data: profiles } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, volledige_naam")
        .in("id", profileIds)
    : { data: [] };

  const learnerProfileMap = new Map(
    (learnerRows ?? []).map((row) => [row.id, row.profile_id])
  );
  const profileMap = new Map(
    (profiles ?? []).map((row) => [row.id, row.volledige_naam])
  );
  const boardMap = new Map(
    ((boardRows ?? []) as LessonCompassRow[]).map((row) => [
      `${row.leerling_id}:${row.instructeur_id}`,
      row,
    ])
  );

  const boards = learnerIds.map((learnerId) => {
    const seed = pairSeeds.get(learnerId)!;
    const boardRow = boardMap.get(`${learnerId}:${seed.instructeurId}`);
    const pulse = getCompassPulse({
      learnerConfidence: boardRow?.leerling_confidence,
      learnerHelpRequest: boardRow?.leerling_hulpvraag,
      instructorFocus: boardRow?.instructeur_focus,
      instructorMission: boardRow?.instructeur_missie,
    });

    return {
      id: boardRow?.id ?? null,
      leerling_id: learnerId,
      instructeur_id: seed.instructeurId,
      counterpart_name:
        profileMap.get(learnerProfileMap.get(learnerId) ?? "") ?? "Leerling",
      counterpart_role: "leerling" as const,
      next_touchpoint: seed.nextTouchpoint,
      instructor_focus: boardRow?.instructeur_focus ?? null,
      instructor_mission: boardRow?.instructeur_missie ?? null,
      learner_confidence: boardRow?.leerling_confidence ?? null,
      learner_help_request: boardRow?.leerling_hulpvraag ?? null,
      last_updated_by:
        boardRow?.laatste_update_door === "leerling" ||
        boardRow?.laatste_update_door === "instructeur"
          ? boardRow.laatste_update_door
          : null,
      updated_at: boardRow?.updated_at ?? null,
      updated_label: formatUpdatedLabel(boardRow?.updated_at),
      pulse_label: pulse.label,
      pulse_variant: pulse.variant,
    } satisfies SharedLessonCompassBoard;
  });

  return sortBoards(boards);
}
