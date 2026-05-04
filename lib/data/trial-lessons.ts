import "server-only";

import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import { createServerClient } from "@/lib/supabase/server";
import type { LesStatus, TrialLessonStatus } from "@/lib/types";

const ACTIVE_TRIAL_STATUSES = [
  "aangevraagd",
  "geaccepteerd",
  "ingepland",
  "afgerond",
] as const satisfies readonly LesStatus[];

export type TrialLessonRequestCandidate = {
  id?: string;
  aanvraag_type?: string | null;
  status: string | null;
  created_at?: string | null;
  voorkeursdatum?: string | null;
  tijdvak?: string | null;
};

export type TrialLessonLessonCandidate = {
  id?: string;
  titel?: string | null;
  status: string | null;
  created_at?: string | null;
  start_at?: string | null;
};

export type TrialLessonState = {
  available: boolean;
  status: TrialLessonStatus;
  message: string;
  source: "none" | "request" | "lesson" | "error";
  requestId?: string;
  lessonId?: string;
  checked: boolean;
};

type TrialLessonActor = "learner" | "instructor";

function isTrialRequest(request: TrialLessonRequestCandidate) {
  return request.aanvraag_type === "proefles";
}

function isTrialLesson(lesson: TrialLessonLessonCandidate) {
  return (lesson.titel ?? "").toLowerCase().includes("proefles");
}

function isActiveTrialStatus(status: string | null | undefined) {
  return (ACTIVE_TRIAL_STATUSES as readonly string[]).includes(status ?? "");
}

function sortByLatestActivity<
  T extends { created_at?: string | null; start_at?: string | null; voorkeursdatum?: string | null },
>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftValue = left.start_at ?? left.voorkeursdatum ?? left.created_at ?? "";
    const rightValue = right.start_at ?? right.voorkeursdatum ?? right.created_at ?? "";

    return rightValue.localeCompare(leftValue);
  });
}

export function getTrialLessonBlockedMessage(
  state: Pick<TrialLessonState, "status">,
  actor: TrialLessonActor = "learner",
) {
  const subjectHas = actor === "learner" ? "Je hebt" : "Deze leerling heeft";
  const possessive = actor === "learner" ? "je" : "deze leerling";

  switch (state.status) {
    case "completed":
      return `${subjectHas} de proefles al voltooid. Nieuwe proeflessen zijn niet meer beschikbaar; vervolglessen lopen via een pakket.`;
    case "planned":
      return `Er staat al een proefles gepland voor ${possessive}. Een tweede proefles kan niet worden ingepland.`;
    case "pending":
      return `${subjectHas} al een open proeflesaanvraag. Rond die eerst af voordat er een nieuwe proefles wordt gepland.`;
    case "unknown":
      return "De proeflesstatus kon niet veilig worden gecontroleerd. Probeer opnieuw voordat je een proefles plant.";
    default:
      return "De proefles is nog beschikbaar.";
  }
}

export function getTrialLessonStateFromRows(params: {
  requests?: TrialLessonRequestCandidate[];
  lessons?: TrialLessonLessonCandidate[];
  actor?: TrialLessonActor;
}): TrialLessonState {
  const activeRequests = sortByLatestActivity(
    (params.requests ?? []).filter(
      (request) => isTrialRequest(request) && isActiveTrialStatus(request.status),
    ),
  );
  const activeLessons = sortByLatestActivity(
    (params.lessons ?? []).filter(
      (lesson) => isTrialLesson(lesson) && isActiveTrialStatus(lesson.status),
    ),
  );
  const completedLesson = activeLessons.find((lesson) => lesson.status === "afgerond");
  const completedRequest = activeRequests.find((request) => request.status === "afgerond");
  const plannedLesson = activeLessons.find((lesson) =>
    ["geaccepteerd", "ingepland"].includes(lesson.status ?? ""),
  );
  const plannedRequest = activeRequests.find((request) =>
    ["geaccepteerd", "ingepland"].includes(request.status ?? ""),
  );
  const pendingLesson = activeLessons.find((lesson) => lesson.status === "aangevraagd");
  const pendingRequest = activeRequests.find((request) => request.status === "aangevraagd");

  if (completedLesson || completedRequest) {
    const source = completedLesson ? "lesson" : "request";
    const state = {
      available: false,
      checked: true,
      lessonId: completedLesson?.id,
      message: "",
      requestId: completedRequest?.id,
      source,
      status: "completed",
    } satisfies TrialLessonState;

    return {
      ...state,
      message: getTrialLessonBlockedMessage(state, params.actor),
    };
  }

  if (plannedLesson || plannedRequest) {
    const source = plannedLesson ? "lesson" : "request";
    const state = {
      available: false,
      checked: true,
      lessonId: plannedLesson?.id,
      message: "",
      requestId: plannedRequest?.id,
      source,
      status: "planned",
    } satisfies TrialLessonState;

    return {
      ...state,
      message: getTrialLessonBlockedMessage(state, params.actor),
    };
  }

  if (pendingRequest || pendingLesson) {
    const state = {
      available: false,
      checked: true,
      message: "",
      lessonId: pendingLesson?.id,
      requestId: pendingRequest?.id,
      source: pendingRequest ? "request" : "lesson",
      status: "pending",
    } satisfies TrialLessonState;

    return {
      ...state,
      message: getTrialLessonBlockedMessage(state, params.actor),
    };
  }

  return {
    available: true,
    checked: true,
    message: getTrialLessonBlockedMessage({ status: "available" }, params.actor),
    source: "none",
    status: "available",
  };
}

export async function getLearnerTrialLessonState(params: {
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  leerlingId: string;
  actor?: TrialLessonActor;
  excludeRequestId?: string | null;
  excludeLessonId?: string | null;
}): Promise<TrialLessonState> {
  try {
    const baseRequestQuery = params.supabase
      .from("lesaanvragen")
      .select("id, aanvraag_type, status, created_at, voorkeursdatum, tijdvak")
      .eq("leerling_id", params.leerlingId)
      .eq("aanvraag_type", "proefles")
      .in("status", [...ACTIVE_TRIAL_STATUSES]);
    const requestQuery = (
      params.excludeRequestId
        ? baseRequestQuery.neq("id", params.excludeRequestId)
        : baseRequestQuery
    )
      .order("created_at", { ascending: false })
      .limit(5);

    const baseLessonQuery = params.supabase
      .from("lessen")
      .select("id, titel, status, created_at, start_at")
      .eq("leerling_id", params.leerlingId)
      .ilike("titel", "%proefles%")
      .in("status", [...ACTIVE_TRIAL_STATUSES]);
    const lessonQuery = (
      params.excludeLessonId
        ? baseLessonQuery.neq("id", params.excludeLessonId)
        : baseLessonQuery
    )
      .order("start_at", { ascending: false })
      .limit(5);

    const [requestResult, lessonResult] = await Promise.all([
      requestQuery,
      lessonQuery,
    ]);

    if (requestResult.error || lessonResult.error) {
      const error = requestResult.error ?? lessonResult.error;
      logSupabaseDataError("trialLessons.status", error, {
        leerlingId: params.leerlingId,
      });

      return {
        available: false,
        checked: false,
        message: getTrialLessonBlockedMessage({ status: "unknown" }, params.actor),
        source: "error",
        status: "unknown",
      };
    }

    return getTrialLessonStateFromRows({
      actor: params.actor,
      lessons: lessonResult.data ?? [],
      requests: requestResult.data ?? [],
    });
  } catch (error) {
    logSupabaseDataError("trialLessons.status.unhandled", error, {
      leerlingId: params.leerlingId,
    });

    return {
      available: false,
      checked: false,
      message: getTrialLessonBlockedMessage({ status: "unknown" }, params.actor),
      source: "error",
      status: "unknown",
    };
  }
}
