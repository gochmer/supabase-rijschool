"use server";

import { revalidatePath } from "next/cache";

import { hasInstructorStudentPlanningRelationship } from "@/lib/data/student-scheduling";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

type StudentSchedulingRightsWriteBuilder = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: {
            zelf_inplannen_toegestaan: boolean;
            vrijgegeven_at: string | null;
            zelf_inplannen_limiet_is_handmatig: boolean;
          } | null;
        }>;
      };
    };
  };
  upsert: (
    values: {
      leerling_id: string;
      instructeur_id: string;
      zelf_inplannen_toegestaan: boolean;
      vrijgegeven_at: string | null;
      zelf_inplannen_limiet_minuten_per_week?: number | null;
      zelf_inplannen_limiet_is_handmatig?: boolean;
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

  if (zelfInplannenToegestaan) {
    const { data: learner } = (await supabase
      .from("leerlingen")
      .select("pakket_id")
      .eq("id", leerlingId)
      .maybeSingle()) as unknown as {
      data: { pakket_id: string | null } | null;
    };

    if (!learner?.pakket_id) {
      return {
        success: false,
        message: "Koppel eerst een pakket voordat je zelf inplannen vrijgeeft.",
      };
    }
  }

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

export async function updateStudentWeeklyBookingLimitAction(
  leerlingId: string,
  weeklyLimitMinutes: number | null,
  mode: "manual" | "package" = "manual"
) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen een ingelogde instructeur kan dit boekingslimiet aanpassen.",
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
        "Deze leerling moet eerst actief aan jouw traject of werkplek gekoppeld zijn.",
    };
  }

  const normalizedLimit =
    mode === "package" || weeklyLimitMinutes == null
      ? null
      : Math.round(Number(weeklyLimitMinutes));

  if (
    normalizedLimit != null &&
    (!Number.isFinite(normalizedLimit) ||
      normalizedLimit < 30 ||
      normalizedLimit > 1440)
  ) {
    return {
      success: false,
      message: "Kies een weeklimiet tussen 30 en 1440 minuten, of laat hem onbeperkt.",
    };
  }

  const supabase = await createServerClient();
  const studentSchedulingRights = supabase.from(
    "leerling_planningsrechten" as never
  ) as unknown as StudentSchedulingRightsWriteBuilder;
  const existingRow =
    (
      await studentSchedulingRights
        .select(
          "zelf_inplannen_toegestaan, vrijgegeven_at, zelf_inplannen_limiet_is_handmatig"
        )
        .eq("instructeur_id", instructeur.id)
        .eq("leerling_id", leerlingId)
        .maybeSingle()
    ).data ?? null;

  const { error } = await studentSchedulingRights.upsert(
    {
      leerling_id: leerlingId,
      instructeur_id: instructeur.id,
      zelf_inplannen_toegestaan: existingRow?.zelf_inplannen_toegestaan ?? false,
      vrijgegeven_at: existingRow?.vrijgegeven_at ?? null,
      zelf_inplannen_limiet_minuten_per_week: normalizedLimit,
      zelf_inplannen_limiet_is_handmatig: mode === "manual",
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "leerling_id,instructeur_id",
    }
  );

  if (error) {
    return {
      success: false,
      message: "Het weeklimiet kon niet worden opgeslagen.",
    };
  }

  revalidatePath("/instructeur/leerlingen");
  revalidatePath("/leerling/boekingen");
  revalidatePath("/leerling/instructeurs");
  revalidatePath(`/instructeurs/${instructeur.slug}`);

  return {
    success: true,
    message:
      mode === "package"
        ? "Deze leerling volgt nu weer automatisch het weeklimiet van het gekoppelde pakket."
        : normalizedLimit == null
          ? "Zelf plannen staat nu onbeperkt open voor deze leerling."
          : `Deze leerling mag nu maximaal ${normalizedLimit} minuten per week zelf inplannen.`,
  };
}
