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

export type LearnerInstructorSchedulingAccess = {
  instructorId: string | null;
  hasActiveRelationship: boolean;
  selfSchedulingAllowed: boolean;
  canViewAgenda: boolean;
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
  const schedulingAccessQuery = studentSchedulingAccess
    .select("zelf_inplannen_toegestaan")
    .eq("instructeur_id", instructorId)
    .eq("leerling_id", leerlingId)
    .maybeSingle();
  const [{ data: accessRow }, hasRelationship] = await Promise.all([
    schedulingAccessQuery,
    hasInstructorStudentPlanningRelationship(instructorId, leerlingId),
  ]);

  const selfSchedulingAllowed =
    hasRelationship && Boolean(accessRow?.zelf_inplannen_toegestaan);

  return {
    instructorId,
    hasActiveRelationship: hasRelationship,
    selfSchedulingAllowed,
    canViewAgenda: selfSchedulingAllowed,
  };
}

export async function getCurrentLearnerSchedulingAccessForInstructorSlug(
  instructorSlug: string
): Promise<LearnerInstructorSchedulingAccess> {
  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return {
      instructorId: null,
      hasActiveRelationship: false,
      selfSchedulingAllowed: false,
      canViewAgenda: false,
    };
  }

  const supabase = await createServerClient();
  const { data: instructeur } = await supabase
    .from("instructeurs")
    .select("id")
    .eq("slug", instructorSlug)
    .maybeSingle();

  if (!instructeur) {
    return {
      instructorId: null,
      hasActiveRelationship: false,
      selfSchedulingAllowed: false,
      canViewAgenda: false,
    };
  }

  return getLearnerInstructorSchedulingAccess(instructeur.id, leerling.id);
}
