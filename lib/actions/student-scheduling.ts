"use server";

import { revalidatePath } from "next/cache";

import { hasInstructorStudentPlanningRelationship } from "@/lib/data/student-scheduling";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

type StudentSchedulingRightsWriteBuilder = {
  upsert: (
    values: {
      leerling_id: string;
      instructeur_id: string;
      zelf_inplannen_toegestaan: boolean;
      vrijgegeven_at: string | null;
      updated_at: string;
    },
    options: { onConflict: string }
  ) => Promise<{ error: { message: string } | null }>;
};

export async function updateStudentSelfSchedulingAccessAction(
  leerlingId: string,
  zelfInplannenToegestaan: boolean
) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen een ingelogde instructeur kan deze planningstoegang aanpassen.",
    };
  }

  const hasRelationship = await hasInstructorStudentPlanningRelationship(
    instructeur.id,
    leerlingId
  );

  if (!hasRelationship) {
    return {
      success: false,
      message:
        "Deze leerling kan pas planningstoegang krijgen zodra hij actief aan jouw traject of werkplek is gekoppeld.",
    };
  }

  const supabase = await createServerClient();
  const studentSchedulingRights = supabase.from(
    "leerling_planningsrechten" as never
  ) as unknown as StudentSchedulingRightsWriteBuilder;
  const { error } = await studentSchedulingRights.upsert(
    {
      leerling_id: leerlingId,
      instructeur_id: instructeur.id,
      zelf_inplannen_toegestaan: zelfInplannenToegestaan,
      vrijgegeven_at: zelfInplannenToegestaan ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "leerling_id,instructeur_id",
    }
  );

  if (error) {
    return {
      success: false,
      message: "De planningstoegang kon niet worden bijgewerkt.",
    };
  }

  revalidatePath("/instructeur/leerlingen");
  revalidatePath("/leerling/instructeurs");
  revalidatePath("/leerling/boekingen");
  revalidatePath(`/instructeurs/${instructeur.slug}`);

  return {
    success: true,
    message: zelfInplannenToegestaan
      ? "Deze leerling mag nu zelf momenten uit jouw agenda kiezen."
      : "Deze leerling ziet jouw agenda niet meer voor zelf inplannen.",
  };
}
