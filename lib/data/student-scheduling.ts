import "server-only";

import { getCurrentLeerlingRecord } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

const ACTIVE_REQUEST_STATUSES = ["geaccepteerd", "ingepland", "afgerond"] as const;

type StudentSchedulingAccessReadBuilder = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: { zelf_inplannen_toegestaan: boolean } | null;
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
  publicBookingEnabled: boolean;
  selfSchedulingAllowed: boolean;
  directBookingAllowed: boolean;
  canViewAgenda: boolean;
};

type SchedulingAccessMapRow = {
  instructeur_id: string | null;
  zelf_inplannen_toegestaan: boolean;
};

type RelationshipMapRow = {
  instructeur_id: string | null;
};

type InstructorPublicBookingMapRow = {
  id: string;
  online_boeken_actief: boolean | null;
};

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
    .select("zelf_inplannen_toegestaan")
    .eq("instructeur_id", instructorId)
    .eq("leerling_id", leerlingId)
    .maybeSingle();
  const publicBookingQuery = instructorPublicBooking
    .select("online_boeken_actief")
    .eq("id", instructorId)
    .maybeSingle();
  const [{ data: accessRow }, { data: instructorRow }, hasRelationship] = await Promise.all([
    schedulingAccessQuery,
    publicBookingQuery,
    hasInstructorStudentPlanningRelationship(instructorId, leerlingId),
  ]);

  const publicBookingEnabled = Boolean(instructorRow?.online_boeken_actief);
  const selfSchedulingAllowed =
    hasRelationship && Boolean(accessRow?.zelf_inplannen_toegestaan);
  const directBookingAllowed = publicBookingEnabled || selfSchedulingAllowed;

  return {
    instructorId,
    hasActiveRelationship: hasRelationship,
    publicBookingEnabled,
    selfSchedulingAllowed,
    directBookingAllowed,
    canViewAgenda: directBookingAllowed,
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
      publicBookingEnabled: false,
      selfSchedulingAllowed: false,
      directBookingAllowed: false,
      canViewAgenda: false,
    };
  }

  const publicBookingEnabled = Boolean(instructeur.online_boeken_actief);
  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return {
      instructorId: instructeur.id,
      hasActiveRelationship: false,
      publicBookingEnabled,
      selfSchedulingAllowed: false,
      directBookingAllowed: false,
      canViewAgenda: publicBookingEnabled,
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
          publicBookingEnabled,
          selfSchedulingAllowed: false,
          directBookingAllowed: false,
          canViewAgenda: publicBookingEnabled,
        };

        return accumulator;
      },
      {}
    );
  }

  const [accessResult, requestResult, lessonResult, linkResult] = await Promise.all([
    (supabase
      .from("leerling_planningsrechten" as never)
      .select("instructeur_id, zelf_inplannen_toegestaan")
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
        hasActiveRelationship &&
        Boolean(selfSchedulingByInstructorId.get(instructorId));
      const directBookingAllowed =
        publicBookingEnabled || selfSchedulingAllowed;

      accumulator[instructorId] = {
        instructorId,
        hasActiveRelationship,
        publicBookingEnabled,
        selfSchedulingAllowed,
        directBookingAllowed,
        canViewAgenda: directBookingAllowed,
      };

      return accumulator;
    },
    {}
  );
}
