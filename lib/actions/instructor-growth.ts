"use server";

import { revalidatePath } from "next/cache";

import {
  ensureCurrentUserContext,
  getCurrentInstructeurRecord,
} from "@/lib/data/profiles";
import { hasInstructorStudentPlanningRelationship } from "@/lib/data/student-scheduling";
import {
  notifyLearnerAboutOpenSlotNudge,
  notifyLearnerAboutPackageSuggestion,
} from "@/lib/notification-events";
import { createServerClient } from "@/lib/supabase/server";

function revalidateGrowthSurfaces() {
  [
    "/instructeur/dashboard",
    "/instructeur/leerlingen",
    "/instructeur/beschikbaarheid",
    "/leerling/dashboard",
    "/leerling/boekingen",
    "/leerling/instructeurs",
  ].forEach((path) => revalidatePath(path));
}

export async function sendInstructorPackageSuggestionAction(input: {
  leerlingId: string;
  suggestedPackageId: string;
  currentPackageName?: string | null;
}) {
  const context = await ensureCurrentUserContext();
  const instructeur = await getCurrentInstructeurRecord();

  if (!context || !instructeur) {
    return {
      success: false,
      message: "Alleen een ingelogde instructeur kan een pakketvoorstel sturen.",
    };
  }

  const leerlingId = input.leerlingId.trim();
  const suggestedPackageId = input.suggestedPackageId.trim();

  if (!leerlingId || !suggestedPackageId) {
    return {
      success: false,
      message: "Kies eerst een leerling en pakketvoorstel.",
    };
  }

  const hasRelationship = await hasInstructorStudentPlanningRelationship(
    instructeur.id,
    leerlingId
  );

  if (!hasRelationship) {
    return {
      success: false,
      message: "Deze leerling hoort niet bij jouw actieve werkplek.",
    };
  }

  const supabase = await createServerClient();
  const { data: pkg } = await supabase
    .from("pakketten")
    .select("id, naam")
    .eq("id", suggestedPackageId)
    .eq("instructeur_id", instructeur.id)
    .maybeSingle();

  if (!pkg) {
    return {
      success: false,
      message: "Dit pakket hoort niet bij jouw aanbod.",
    };
  }

  await notifyLearnerAboutPackageSuggestion({
    supabase,
    leerlingId,
    instructeurNaam: context.profile?.volledige_naam || "Je instructeur",
    packageName: pkg.naam,
    currentPackageName: input.currentPackageName?.trim() || null,
  });

  revalidateGrowthSurfaces();

  return {
    success: true,
    message: `Pakketvoorstel verstuurd voor ${pkg.naam}.`,
  };
}

export async function sendInstructorGapNudgeAction(input: {
  leerlingIds: string[];
  slotStartAt: string;
  slotEndAt: string;
}) {
  const context = await ensureCurrentUserContext();
  const instructeur = await getCurrentInstructeurRecord();

  if (!context || !instructeur) {
    return {
      success: false,
      message: "Alleen een ingelogde instructeur kan een slimme nudge sturen.",
    };
  }

  const leerlingIds = Array.from(
    new Set((input.leerlingIds ?? []).map((value) => value.trim()).filter(Boolean))
  ).slice(0, 3);

  if (!leerlingIds.length || !input.slotStartAt.trim() || !input.slotEndAt.trim()) {
    return {
      success: false,
      message: "Kies eerst een open moment en minimaal een leerling.",
    };
  }

  const validLearnerIds: string[] = [];

  for (const leerlingId of leerlingIds) {
    const hasRelationship = await hasInstructorStudentPlanningRelationship(
      instructeur.id,
      leerlingId
    );

    if (hasRelationship) {
      validLearnerIds.push(leerlingId);
    }
  }

  if (!validLearnerIds.length) {
    return {
      success: false,
      message: "Er zijn geen geldige leerlingen gevonden om te nudgen.",
    };
  }

  const supabase = await createServerClient();

  for (const leerlingId of validLearnerIds) {
    await notifyLearnerAboutOpenSlotNudge({
      supabase,
      leerlingId,
      instructeurNaam: context.profile?.volledige_naam || "Je instructeur",
      slotStartAt: input.slotStartAt,
      slotEndAt: input.slotEndAt,
    });
  }

  revalidateGrowthSurfaces();

  return {
    success: true,
    message:
      validLearnerIds.length === 1
        ? "Slimme nudge verstuurd naar 1 leerling."
        : `Slimme nudge verstuurd naar ${validLearnerIds.length} leerlingen.`,
  };
}
