import "server-only";

import { parseRequestWindow } from "@/lib/booking-availability";
import { getPublicInstructorAvailabilityMap } from "@/lib/data/instructors";
import { getCurrentLeerlingRecord } from "@/lib/data/profiles";
import {
  getLearnerTrialLessonState,
  getTrialLessonBlockedMessage,
} from "@/lib/data/trial-lessons";
import { extractLessonRequestReference } from "@/lib/lesson-request-flow";
import {
  addBookedMinutesForWeek,
  filterAvailabilitySlotsByWeeklyLimit,
  getRemainingWeeklyBookingMinutes,
  getWeeklyBookingWindow,
  resolveEffectiveWeeklyBookingLimit,
  type WeeklyBookingLimitSource,
  type WeeklyBookedMinutesMap,
} from "@/lib/self-scheduling-limits";
import type { BeschikbaarheidSlot, LesStatus, TrialLessonStatus } from "@/lib/types";
import { createServerClient } from "@/lib/supabase/server";

const ACTIVE_REQUEST_STATUSES = ["geaccepteerd", "ingepland", "afgerond"] as const;

type StudentSchedulingAccessReadBuilder = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: {
            zelf_inplannen_toegestaan: boolean;
            zelf_inplannen_limiet_minuten_per_week: number | null;
            zelf_inplannen_limiet_is_handmatig: boolean;
          } | null;
        }>;
      };
    };
  };
};

type InstructorPublicBookingReadBuilder = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<{
        data: { online_boeken_actief: boolean } | null;
      }>;
    };
  };
};

export type LearnerInstructorSchedulingAccess = {
  instructorId: string | null;
  hasActiveRelationship: boolean;
  packageAssigned: boolean;
  planningBlockedUntilPackage: boolean;
  trialLessonAvailable: boolean;
  trialLessonStatus: TrialLessonStatus;
  trialLessonMessage: string;
  publicBookingEnabled: boolean;
  selfSchedulingAllowed: boolean;
  directBookingAllowed: boolean;
  canViewAgenda: boolean;
  weeklyBookingLimitMinutes: number | null;
  manualWeeklyBookingLimitMinutes: number | null;
  packageWeeklyBookingLimitMinutes: number | null;
  weeklyBookingLimitSource: WeeklyBookingLimitSource;
  bookedMinutesByWeekStart: WeeklyBookedMinutesMap;
  weeklyBookedMinutesThisWeek: number;
  weeklyRemainingMinutesThisWeek: number | null;
  currentWeekLimitReached: boolean;
};

type SchedulingAccessMapRow = {
  instructeur_id: string | null;
  zelf_inplannen_toegestaan: boolean;
  zelf_inplannen_limiet_minuten_per_week: number | null;
  zelf_inplannen_limiet_is_handmatig: boolean;
};

type RelationshipMapRow = {
  instructeur_id: string | null;
};

type InstructorPublicBookingMapRow = {
  id: string;
  online_boeken_actief: boolean | null;
};

type InstructorBookingOverviewRow = {
  id: string;
  slug: string;
  volledige_naam: string | null;
  online_boeken_actief: boolean | null;
  standaard_rijles_duur_minuten: number | null;
  standaard_proefles_duur_minuten: number | null;
};

type InstructorPendingRequestRow = {
  id?: string;
  instructeur_id: string | null;
  status: string;
};

type LearnerBookedLessonWindowRow = {
  id: string;
  instructeur_id: string | null;
  start_at: string | null;
  duur_minuten: number;
  status: LesStatus;
  notities: string | null;
};

type LearnerBookedRequestWindowRow = {
  id: string;
  instructeur_id: string | null;
  voorkeursdatum: string | null;
  tijdvak: string | null;
  status: LesStatus;
};

type LearnerBookingLimitSnapshot = {
  weeklyBookingLimitMinutes: number | null;
  manualWeeklyBookingLimitMinutes: number | null;
  packageWeeklyBookingLimitMinutes: number | null;
  weeklyBookingLimitSource: WeeklyBookingLimitSource;
  bookedMinutesByWeekStart: WeeklyBookedMinutesMap;
  weeklyBookedMinutesThisWeek: number;
  weeklyRemainingMinutesThisWeek: number | null;
  currentWeekLimitReached: boolean;
};

export type LearnerBookingEligibility = {
  instructorId: string;
  instructorSlug: string;
  instructorName: string;
  hasActiveRelationship: boolean;
  packageAssigned: boolean;
  planningBlockedUntilPackage: boolean;
  hasPendingRequest: boolean;
  trialLessonAvailable: boolean;
  trialLessonStatus: TrialLessonStatus;
  trialLessonMessage: string;
  publicBookingEnabled: boolean;
  selfSchedulingAllowed: boolean;
  directBookingAllowed: boolean;
  canBookFromBookingsPage: boolean;
  availableSlots: BeschikbaarheidSlot[];
  trialAvailableSlots: BeschikbaarheidSlot[];
  regularLessonDurationMinutes: number;
  trialLessonDurationMinutes: number;
  weeklyBookingLimitMinutes: number | null;
  manualWeeklyBookingLimitMinutes: number | null;
  packageWeeklyBookingLimitMinutes: number | null;
  weeklyBookingLimitSource: WeeklyBookingLimitSource;
  bookedMinutesByWeekStart: WeeklyBookedMinutesMap;
  weeklyBookedMinutesThisWeek: number;
  weeklyRemainingMinutesThisWeek: number | null;
  currentWeekLimitReached: boolean;
};

export type LearnerBookingOverview = {
  hasLearnerProfile: boolean;
  totalKnownInstructors: number;
  eligibleInstructors: LearnerBookingEligibility[];
  pendingInstructors: LearnerBookingEligibility[];
  waitingApprovalInstructors: LearnerBookingEligibility[];
};

function createEmptyBookingLimitSnapshot(): LearnerBookingLimitSnapshot {
  return {
    weeklyBookingLimitMinutes: null,
    manualWeeklyBookingLimitMinutes: null,
    packageWeeklyBookingLimitMinutes: null,
    weeklyBookingLimitSource: "none",
    bookedMinutesByWeekStart: {},
    weeklyBookedMinutesThisWeek: 0,
    weeklyRemainingMinutesThisWeek: null,
    currentWeekLimitReached: false,
  };
}

export async function hasLearnerUsedTrialLesson(params: {
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  leerlingId: string;
}) {
  const trialState = await getLearnerTrialLessonState({
    supabase: params.supabase,
    leerlingId: params.leerlingId,
  });

  return !trialState.available;
}

function createAvailableTrialLessonAccessSnapshot() {
  return {
    trialLessonAvailable: true,
    trialLessonStatus: "available" as TrialLessonStatus,
    trialLessonMessage: getTrialLessonBlockedMessage(
      { status: "available" },
      "learner",
    ),
  };
}

async function getLearnerBookingLimitSnapshotsForInstructorIds(params: {
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  leerlingId: string;
  instructorIds: string[];
}) {
  const uniqueInstructorIds = Array.from(new Set(params.instructorIds.filter(Boolean)));

  if (!uniqueInstructorIds.length) {
    return {} as Record<string, LearnerBookingLimitSnapshot>;
  }

  const { weekStartKey } = getWeeklyBookingWindow(new Date());
  const weekStartAt = `${weekStartKey}T00:00:00`;
  const [planningRightsResult, lessonResult, requestResult, learnerResult] =
    await Promise.all([
    (params.supabase
      .from("leerling_planningsrechten" as never)
      .select(
        "instructeur_id, zelf_inplannen_toegestaan, zelf_inplannen_limiet_minuten_per_week, zelf_inplannen_limiet_is_handmatig"
      )
      .eq("leerling_id", params.leerlingId)
      .in("instructeur_id", uniqueInstructorIds)) as unknown as Promise<{
      data: SchedulingAccessMapRow[] | null;
    }>,
    (params.supabase
      .from("lessen")
      .select("id, instructeur_id, start_at, duur_minuten, status, notities")
      .eq("leerling_id", params.leerlingId)
      .in("instructeur_id", uniqueInstructorIds)
      .in("status", ["geaccepteerd", "ingepland", "afgerond"])
      .gte("start_at", weekStartAt)) as unknown as Promise<{
      data: LearnerBookedLessonWindowRow[] | null;
    }>,
    (params.supabase
      .from("lesaanvragen")
      .select("id, instructeur_id, voorkeursdatum, tijdvak, status")
      .eq("leerling_id", params.leerlingId)
      .in("instructeur_id", uniqueInstructorIds)
      .in("status", ["aangevraagd", "geaccepteerd", "ingepland"])
      .gte("voorkeursdatum", weekStartKey)) as unknown as Promise<{
      data: LearnerBookedRequestWindowRow[] | null;
    }>,
    (params.supabase
      .from("leerlingen")
      .select("pakket_id")
      .eq("id", params.leerlingId)
      .maybeSingle()) as unknown as Promise<{
      data: { pakket_id: string | null } | null;
    }>,
  ]);

  const planningRightsMap = new Map(
    (planningRightsResult.data ?? []).map((row) => [
      row.instructeur_id,
      {
        weeklyLimitMinutes: row.zelf_inplannen_limiet_minuten_per_week,
        manualLimitIsSet: Boolean(row.zelf_inplannen_limiet_is_handmatig),
      },
    ])
  );
  const packageLimitByInstructorId = new Map<string, number | null>();

  if (learnerResult.data?.pakket_id) {
    const { data: packageRow } = (await params.supabase
      .from("pakketten")
      .select("id, instructeur_id, zelf_inplannen_limiet_minuten_per_week")
      .eq("id", learnerResult.data.pakket_id)
      .maybeSingle()) as unknown as {
      data:
        | {
            id: string;
            instructeur_id: string | null;
            zelf_inplannen_limiet_minuten_per_week: number | null;
          }
        | null;
    };

    if (packageRow) {
      if (
        packageRow.instructeur_id &&
        uniqueInstructorIds.includes(packageRow.instructeur_id)
      ) {
        packageLimitByInstructorId.set(
          packageRow.instructeur_id,
          packageRow.zelf_inplannen_limiet_minuten_per_week
        );
      } else if (uniqueInstructorIds.length === 1) {
        packageLimitByInstructorId.set(
          uniqueInstructorIds[0],
          packageRow.zelf_inplannen_limiet_minuten_per_week
        );
      }
    }
  }
  const linkedRequestIds = new Set(
    (lessonResult.data ?? [])
      .map((lesson) => extractLessonRequestReference(lesson.notities))
      .filter((value): value is string => Boolean(value))
  );
  const bookedMinutesByInstructorId = new Map<string, WeeklyBookedMinutesMap>();

  for (const lesson of lessonResult.data ?? []) {
    if (!lesson.instructeur_id || !lesson.start_at) {
      continue;
    }

    const currentMap = bookedMinutesByInstructorId.get(lesson.instructeur_id) ?? {};
    addBookedMinutesForWeek({
      map: currentMap,
      dateLike: lesson.start_at,
      minutes: lesson.duur_minuten,
    });
    bookedMinutesByInstructorId.set(lesson.instructeur_id, currentMap);
  }

  for (const request of requestResult.data ?? []) {
    if (
      !request.instructeur_id ||
      linkedRequestIds.has(request.id) ||
      !request.voorkeursdatum
    ) {
      continue;
    }

    const { startAt, endAt } = parseRequestWindow(
      request.voorkeursdatum,
      request.tijdvak
    );

    if (!startAt || !endAt) {
      continue;
    }

    const currentMap = bookedMinutesByInstructorId.get(request.instructeur_id) ?? {};
    addBookedMinutesForWeek({
      map: currentMap,
      dateLike: startAt,
      minutes: Math.max(
        30,
        Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000)
      ),
    });
    bookedMinutesByInstructorId.set(request.instructeur_id, currentMap);
  }

  return uniqueInstructorIds.reduce<Record<string, LearnerBookingLimitSnapshot>>(
    (accumulator, instructorId) => {
      const bookedMinutesByWeekStart = bookedMinutesByInstructorId.get(instructorId) ?? {};
      const manualConfig =
        planningRightsMap.get(instructorId) ?? {
          weeklyLimitMinutes: null,
          manualLimitIsSet: false,
        };
      const packageWeeklyBookingLimitMinutes =
        packageLimitByInstructorId.get(instructorId) ?? null;
      const resolvedWeeklyLimit = resolveEffectiveWeeklyBookingLimit({
        manualLimitIsSet: manualConfig.manualLimitIsSet,
        manualLimitMinutes: manualConfig.weeklyLimitMinutes,
        packageLimitMinutes: packageWeeklyBookingLimitMinutes,
      });
      const weeklyBookingLimitMinutes = resolvedWeeklyLimit.weeklyLimitMinutes;
      const weeklyBookedMinutesThisWeek = bookedMinutesByWeekStart[weekStartKey] ?? 0;
      const weeklyRemainingMinutesThisWeek = getRemainingWeeklyBookingMinutes(
        weeklyBookingLimitMinutes,
        weeklyBookedMinutesThisWeek
      );

      accumulator[instructorId] = {
        weeklyBookingLimitMinutes,
        manualWeeklyBookingLimitMinutes: manualConfig.weeklyLimitMinutes,
        packageWeeklyBookingLimitMinutes,
        weeklyBookingLimitSource: resolvedWeeklyLimit.source,
        bookedMinutesByWeekStart,
        weeklyBookedMinutesThisWeek,
        weeklyRemainingMinutesThisWeek,
        currentWeekLimitReached:
          weeklyBookingLimitMinutes != null &&
          weeklyBookedMinutesThisWeek >= weeklyBookingLimitMinutes,
      };

      return accumulator;
    },
    {}
  );
}

export async function hasInstructorStudentPlanningRelationship(
  instructorId: string,
  leerlingId: string
) {
  const supabase = await createServerClient();
  const [{ data: requestRows }, { data: lessonRows }, { data: linkRows }] =
    await Promise.all([
    supabase
      .from("lesaanvragen")
      .select("id")
      .eq("instructeur_id", instructorId)
      .eq("leerling_id", leerlingId)
      .in("status", [...ACTIVE_REQUEST_STATUSES])
      .limit(1),
    supabase
      .from("lessen")
      .select("id")
      .eq("instructeur_id", instructorId)
      .eq("leerling_id", leerlingId)
      .neq("status", "geannuleerd")
      .limit(1),
    supabase
      .from("instructeur_leerling_koppelingen" as never)
      .select("id")
      .eq("instructeur_id", instructorId)
      .eq("leerling_id", leerlingId)
      .limit(1),
  ]);

  return Boolean(requestRows?.length || lessonRows?.length || linkRows?.length);
}

export async function getLearnerInstructorSchedulingAccess(
  instructorId: string,
  leerlingId: string
): Promise<LearnerInstructorSchedulingAccess> {
  const supabase = await createServerClient();
  const studentSchedulingAccess = supabase.from(
    "leerling_planningsrechten" as never
  ) as unknown as StudentSchedulingAccessReadBuilder;
  const instructorPublicBooking = supabase.from(
    "instructeurs"
  ) as unknown as InstructorPublicBookingReadBuilder;
  const schedulingAccessQuery = studentSchedulingAccess
    .select(
      "zelf_inplannen_toegestaan, zelf_inplannen_limiet_minuten_per_week, zelf_inplannen_limiet_is_handmatig"
    )
    .eq("instructeur_id", instructorId)
    .eq("leerling_id", leerlingId)
    .maybeSingle();
  const publicBookingQuery = instructorPublicBooking
    .select("online_boeken_actief")
    .eq("id", instructorId)
    .maybeSingle();
  const learnerPackageQuery = (supabase
    .from("leerlingen")
    .select("pakket_id")
    .eq("id", leerlingId)
    .maybeSingle()) as unknown as Promise<{
    data: { pakket_id: string | null } | null;
  }>;
  const [
    { data: accessRow },
    { data: instructorRow },
    { data: learnerPackageRow },
    hasRelationship,
  ] = await Promise.all([
    schedulingAccessQuery,
    publicBookingQuery,
    learnerPackageQuery,
    hasInstructorStudentPlanningRelationship(instructorId, leerlingId),
  ]);
  const limitSnapshot =
    (
      await getLearnerBookingLimitSnapshotsForInstructorIds({
        supabase,
        leerlingId,
        instructorIds: [instructorId],
      })
    )[instructorId] ?? createEmptyBookingLimitSnapshot();
  const trialLessonState = await getLearnerTrialLessonState({
    supabase,
    leerlingId,
    actor: "learner",
  });

  const publicBookingEnabled = Boolean(instructorRow?.online_boeken_actief);
  const packageAssigned = Boolean(learnerPackageRow?.pakket_id);
  const selfSchedulingAllowed =
    packageAssigned && hasRelationship && Boolean(accessRow?.zelf_inplannen_toegestaan);
  const directBookingAllowed =
    packageAssigned && (publicBookingEnabled || selfSchedulingAllowed);

  return {
    instructorId,
    hasActiveRelationship: hasRelationship,
    packageAssigned,
    planningBlockedUntilPackage: hasRelationship && !packageAssigned,
    trialLessonAvailable: trialLessonState.available,
    trialLessonStatus: trialLessonState.status,
    trialLessonMessage: trialLessonState.message,
    publicBookingEnabled,
    selfSchedulingAllowed,
    directBookingAllowed,
    canViewAgenda:
      directBookingAllowed || (publicBookingEnabled && trialLessonState.available),
    weeklyBookingLimitMinutes: limitSnapshot.weeklyBookingLimitMinutes,
    manualWeeklyBookingLimitMinutes:
      limitSnapshot.manualWeeklyBookingLimitMinutes,
    packageWeeklyBookingLimitMinutes:
      limitSnapshot.packageWeeklyBookingLimitMinutes,
    weeklyBookingLimitSource: limitSnapshot.weeklyBookingLimitSource,
    bookedMinutesByWeekStart: limitSnapshot.bookedMinutesByWeekStart,
    weeklyBookedMinutesThisWeek: limitSnapshot.weeklyBookedMinutesThisWeek,
    weeklyRemainingMinutesThisWeek: limitSnapshot.weeklyRemainingMinutesThisWeek,
    currentWeekLimitReached: limitSnapshot.currentWeekLimitReached,
  };
}

export async function getCurrentLearnerSchedulingAccessForInstructorSlug(
  instructorSlug: string
): Promise<LearnerInstructorSchedulingAccess> {
  const supabase = await createServerClient();
  const { data: instructeur } = await supabase
    .from("instructeurs")
    .select("id, online_boeken_actief")
    .eq("slug", instructorSlug)
    .maybeSingle();

  if (!instructeur) {
    return {
      instructorId: null,
      hasActiveRelationship: false,
      packageAssigned: false,
      planningBlockedUntilPackage: false,
      ...createAvailableTrialLessonAccessSnapshot(),
      publicBookingEnabled: false,
      selfSchedulingAllowed: false,
      directBookingAllowed: false,
      canViewAgenda: false,
      ...createEmptyBookingLimitSnapshot(),
    };
  }

  const publicBookingEnabled = Boolean(instructeur.online_boeken_actief);
  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return {
      instructorId: instructeur.id,
      hasActiveRelationship: false,
      packageAssigned: false,
      planningBlockedUntilPackage: false,
      ...createAvailableTrialLessonAccessSnapshot(),
      publicBookingEnabled,
      selfSchedulingAllowed: false,
      directBookingAllowed: false,
      canViewAgenda: publicBookingEnabled,
      ...createEmptyBookingLimitSnapshot(),
    };
  }

  return getLearnerInstructorSchedulingAccess(instructeur.id, leerling.id);
}

export async function getCurrentLearnerSchedulingAccessMapForInstructorIds(
  instructorIds: string[]
): Promise<Record<string, LearnerInstructorSchedulingAccess>> {
  const uniqueInstructorIds = Array.from(new Set(instructorIds.filter(Boolean)));

  if (!uniqueInstructorIds.length) {
    return {};
  }

  const supabase = await createServerClient();
  const [instructorResult, leerling] = await Promise.all([
    (supabase
      .from("instructeurs")
      .select("id, online_boeken_actief")
      .in("id", uniqueInstructorIds)) as unknown as Promise<{
      data: InstructorPublicBookingMapRow[] | null;
    }>,
    getCurrentLeerlingRecord(),
  ]);

  const publicBookingByInstructorId = new Map(
    (instructorResult.data ?? []).map((row) => [
      row.id,
      Boolean(row.online_boeken_actief),
    ])
  );

  if (!leerling) {
    return uniqueInstructorIds.reduce<Record<string, LearnerInstructorSchedulingAccess>>(
      (accumulator, instructorId) => {
        const publicBookingEnabled = Boolean(
          publicBookingByInstructorId.get(instructorId)
        );

        accumulator[instructorId] = {
          instructorId,
          hasActiveRelationship: false,
          packageAssigned: false,
          planningBlockedUntilPackage: false,
          ...createAvailableTrialLessonAccessSnapshot(),
          publicBookingEnabled,
          selfSchedulingAllowed: false,
          directBookingAllowed: false,
          canViewAgenda: publicBookingEnabled,
          ...createEmptyBookingLimitSnapshot(),
        };

        return accumulator;
      },
      {}
    );
  }

  const [accessResult, requestResult, lessonResult, linkResult] = await Promise.all([
    (supabase
      .from("leerling_planningsrechten" as never)
      .select(
        "instructeur_id, zelf_inplannen_toegestaan, zelf_inplannen_limiet_minuten_per_week, zelf_inplannen_limiet_is_handmatig"
      )
      .eq("leerling_id", leerling.id)
      .in("instructeur_id", uniqueInstructorIds)) as unknown as Promise<{
      data: SchedulingAccessMapRow[] | null;
    }>,
    (supabase
      .from("lesaanvragen")
      .select("instructeur_id")
      .eq("leerling_id", leerling.id)
      .in("status", [...ACTIVE_REQUEST_STATUSES])
      .in("instructeur_id", uniqueInstructorIds)) as unknown as Promise<{
      data: RelationshipMapRow[] | null;
    }>,
    (supabase
      .from("lessen")
      .select("instructeur_id")
      .eq("leerling_id", leerling.id)
      .neq("status", "geannuleerd")
      .in("instructeur_id", uniqueInstructorIds)) as unknown as Promise<{
      data: RelationshipMapRow[] | null;
    }>,
    (supabase
      .from("instructeur_leerling_koppelingen" as never)
      .select("instructeur_id")
      .eq("leerling_id", leerling.id)
      .in("instructeur_id", uniqueInstructorIds)) as unknown as Promise<{
      data: RelationshipMapRow[] | null;
    }>,
  ]);
  const trialLessonState = await getLearnerTrialLessonState({
    supabase,
    leerlingId: leerling.id,
    actor: "learner",
  });
  const packageAssigned = Boolean(leerling.pakket_id);
  const limitSnapshots = await getLearnerBookingLimitSnapshotsForInstructorIds({
    supabase,
    leerlingId: leerling.id,
    instructorIds: uniqueInstructorIds,
  });

  const relationshipInstructorIds = new Set(
    [...(requestResult.data ?? []), ...(lessonResult.data ?? []), ...(linkResult.data ?? [])]
      .map((row) => row.instructeur_id)
      .filter((value): value is string => Boolean(value))
  );
  const selfSchedulingByInstructorId = new Map(
    (accessResult.data ?? []).map((row) => [
      row.instructeur_id,
      Boolean(row.zelf_inplannen_toegestaan),
    ])
  );

  return uniqueInstructorIds.reduce<Record<string, LearnerInstructorSchedulingAccess>>(
    (accumulator, instructorId) => {
      const publicBookingEnabled = Boolean(
        publicBookingByInstructorId.get(instructorId)
      );
      const hasActiveRelationship = relationshipInstructorIds.has(instructorId);
      const selfSchedulingAllowed =
        packageAssigned &&
        hasActiveRelationship &&
        Boolean(selfSchedulingByInstructorId.get(instructorId));
      const directBookingAllowed =
        packageAssigned && (publicBookingEnabled || selfSchedulingAllowed);
      const limitSnapshot =
        limitSnapshots[instructorId] ?? createEmptyBookingLimitSnapshot();

      accumulator[instructorId] = {
        instructorId,
        hasActiveRelationship,
        packageAssigned,
        planningBlockedUntilPackage: hasActiveRelationship && !packageAssigned,
        trialLessonAvailable: trialLessonState.available,
        trialLessonStatus: trialLessonState.status,
        trialLessonMessage: trialLessonState.message,
        publicBookingEnabled,
        selfSchedulingAllowed,
        directBookingAllowed,
        canViewAgenda:
          directBookingAllowed ||
          (publicBookingEnabled && trialLessonState.available),
        weeklyBookingLimitMinutes: limitSnapshot.weeklyBookingLimitMinutes,
        manualWeeklyBookingLimitMinutes:
          limitSnapshot.manualWeeklyBookingLimitMinutes,
        packageWeeklyBookingLimitMinutes:
          limitSnapshot.packageWeeklyBookingLimitMinutes,
        weeklyBookingLimitSource: limitSnapshot.weeklyBookingLimitSource,
        bookedMinutesByWeekStart: limitSnapshot.bookedMinutesByWeekStart,
        weeklyBookedMinutesThisWeek: limitSnapshot.weeklyBookedMinutesThisWeek,
        weeklyRemainingMinutesThisWeek:
          limitSnapshot.weeklyRemainingMinutesThisWeek,
        currentWeekLimitReached: limitSnapshot.currentWeekLimitReached,
      };

      return accumulator;
    },
    {}
  );
}

export async function getLearnerInstructorBookingLimitSnapshot(
  instructorId: string,
  leerlingId: string
) {
  const supabase = await createServerClient();
  return (
    (
      await getLearnerBookingLimitSnapshotsForInstructorIds({
        supabase,
        leerlingId,
        instructorIds: [instructorId],
      })
    )[instructorId] ?? createEmptyBookingLimitSnapshot()
  );
}

export async function getCurrentLearnerBookingOverview(): Promise<LearnerBookingOverview> {
  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return {
      hasLearnerProfile: false,
      totalKnownInstructors: 0,
      eligibleInstructors: [],
      pendingInstructors: [],
      waitingApprovalInstructors: [],
    };
  }

  const supabase = await createServerClient();
  const [requestResult, lessonResult, linkResult, accessResult] = await Promise.all([
    (supabase
      .from("lesaanvragen")
      .select("instructeur_id, status")
      .eq("leerling_id", leerling.id)) as unknown as Promise<{
      data: InstructorPendingRequestRow[] | null;
    }>,
    (supabase
      .from("lessen")
      .select("instructeur_id, status")
      .eq("leerling_id", leerling.id)
      .neq("status", "geannuleerd")) as unknown as Promise<{
      data: RelationshipMapRow[] | null;
    }>,
    (supabase
      .from("instructeur_leerling_koppelingen" as never)
      .select("instructeur_id")
      .eq("leerling_id", leerling.id)) as unknown as Promise<{
      data: RelationshipMapRow[] | null;
    }>,
    (supabase
      .from("leerling_planningsrechten" as never)
      .select(
        "instructeur_id, zelf_inplannen_toegestaan, zelf_inplannen_limiet_minuten_per_week, zelf_inplannen_limiet_is_handmatig"
      )
      .eq("leerling_id", leerling.id)) as unknown as Promise<{
      data: SchedulingAccessMapRow[] | null;
    }>,
  ]);

  const instructorIds = Array.from(
    new Set(
      [
        ...(requestResult.data ?? []).map((row) => row.instructeur_id),
        ...(lessonResult.data ?? []).map((row) => row.instructeur_id),
        ...(linkResult.data ?? []).map((row) => row.instructeur_id),
        ...(accessResult.data ?? []).map((row) => row.instructeur_id),
      ].filter((value): value is string => Boolean(value))
    )
  );

  if (!instructorIds.length) {
    return {
      hasLearnerProfile: true,
      totalKnownInstructors: 0,
      eligibleInstructors: [],
      pendingInstructors: [],
      waitingApprovalInstructors: [],
    };
  }

  const { data: instructorRows } = (await supabase
    .from("instructeurs")
    .select(
      "id, slug, volledige_naam, online_boeken_actief, standaard_rijles_duur_minuten, standaard_proefles_duur_minuten"
    )
    .in("id", instructorIds)) as unknown as {
    data: InstructorBookingOverviewRow[] | null;
  };

  const instructorMap = new Map(
    (instructorRows ?? []).map((row) => [row.id, row])
  );

  const accessMap = await getCurrentLearnerSchedulingAccessMapForInstructorIds(instructorIds);
  const pendingRequestInstructorIds = new Set(
    (requestResult.data ?? [])
      .filter((row) => row.status === "aangevraagd")
      .map((row) => row.instructeur_id)
      .filter((value): value is string => Boolean(value))
  );
  const bookableInstructorIds = instructorIds.filter((instructorId) => {
    const access = accessMap[instructorId];
    return Boolean(access?.hasActiveRelationship);
  });
  const availableSlotsByInstructorId = await getPublicInstructorAvailabilityMap(
    bookableInstructorIds,
    24
  );

  const instructors = instructorIds
    .map<LearnerBookingEligibility | null>((instructorId) => {
      const row = instructorMap.get(instructorId);
      const access = accessMap[instructorId];

      if (!row || !access) {
        return null;
      }

      const regularLessonDurationMinutes =
        row.standaard_rijles_duur_minuten ?? 60;
      const trialLessonDurationMinutes =
        row.standaard_proefles_duur_minuten ?? 50;
      const rawAvailableSlots = access.hasActiveRelationship
        ? availableSlotsByInstructorId[instructorId] ?? []
        : [];
      const regularAvailableSlots = access.packageAssigned
        ? filterAvailabilitySlotsByWeeklyLimit(
            rawAvailableSlots,
            regularLessonDurationMinutes,
            access.weeklyBookingLimitMinutes,
            access.bookedMinutesByWeekStart
          )
        : [];
      const trialAvailableSlots = filterAvailabilitySlotsByWeeklyLimit(
        rawAvailableSlots,
        trialLessonDurationMinutes,
        access.weeklyBookingLimitMinutes,
        access.bookedMinutesByWeekStart
      );

      return {
        instructorId,
        instructorSlug: row.slug,
        instructorName: row.volledige_naam ?? "Instructeur",
        hasActiveRelationship: access.hasActiveRelationship,
        packageAssigned: access.packageAssigned,
        planningBlockedUntilPackage: access.planningBlockedUntilPackage,
        hasPendingRequest: pendingRequestInstructorIds.has(instructorId),
        trialLessonAvailable: access.trialLessonAvailable,
        trialLessonStatus: access.trialLessonStatus,
        trialLessonMessage: access.trialLessonMessage,
        publicBookingEnabled: access.publicBookingEnabled,
        selfSchedulingAllowed: access.selfSchedulingAllowed,
        directBookingAllowed: access.directBookingAllowed,
        canBookFromBookingsPage: access.hasActiveRelationship,
        availableSlots: regularAvailableSlots,
        trialAvailableSlots: access.trialLessonAvailable ? trialAvailableSlots : [],
        regularLessonDurationMinutes,
        trialLessonDurationMinutes,
        weeklyBookingLimitMinutes: access.weeklyBookingLimitMinutes,
        manualWeeklyBookingLimitMinutes:
          access.manualWeeklyBookingLimitMinutes,
        packageWeeklyBookingLimitMinutes:
          access.packageWeeklyBookingLimitMinutes,
        weeklyBookingLimitSource: access.weeklyBookingLimitSource,
        bookedMinutesByWeekStart: access.bookedMinutesByWeekStart,
        weeklyBookedMinutesThisWeek: access.weeklyBookedMinutesThisWeek,
        weeklyRemainingMinutesThisWeek: access.weeklyRemainingMinutesThisWeek,
        currentWeekLimitReached: access.currentWeekLimitReached,
      };
    })
    .filter((value): value is LearnerBookingEligibility => value !== null);

  return {
    hasLearnerProfile: true,
    totalKnownInstructors: instructors.length,
    eligibleInstructors: instructors.filter((item) => item.canBookFromBookingsPage),
    pendingInstructors: instructors.filter(
      (item) => item.hasPendingRequest && !item.hasActiveRelationship
    ),
    waitingApprovalInstructors: [],
  };
}
