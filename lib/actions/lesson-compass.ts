"use server";

import { revalidatePath } from "next/cache";

import {
  notifyInstructorAboutLessonCompassUpdate,
  notifyLearnerAboutLessonCompassUpdate,
} from "@/lib/notification-events";
import { ensureCurrentUserContext } from "@/lib/data/profiles";
import { hasInstructorStudentPlanningRelationship } from "@/lib/data/student-scheduling";
import { createServerClient } from "@/lib/supabase/server";

const MAX_FOCUS_LENGTH = 180;
const MAX_MISSION_LENGTH = 140;
const MAX_HELP_REQUEST_LENGTH = 260;

function normalizeNullableText(value: string, maxLength: number) {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw new Error(`MAX_${maxLength}`);
  }

  return normalized;
}

function revalidateLessonCompassSurfaces() {
  ["/leerling/dashboard", "/instructeur/dashboard"].forEach((path) =>
    revalidatePath(path)
  );
}

export async function saveInstructorLessonCompassAction(input: {
  leerlingId: string;
  instructeurId: string;
  focus: string;
  mission: string;
}) {
  const context = await ensureCurrentUserContext();

  if (!context || context.role !== "instructeur") {
    return {
      success: false,
      message: "Alleen een instructeur kan het leskompas vanaf deze kant bijwerken.",
    };
  }

  let focus: string | null;
  let mission: string | null;

  try {
    focus = normalizeNullableText(input.focus, MAX_FOCUS_LENGTH);
    mission = normalizeNullableText(input.mission, MAX_MISSION_LENGTH);
  } catch {
    return {
      success: false,
      message: "Houd focus en mini-missie kort en scherp.",
    };
  }

  const supabase = await createServerClient();
  const { data: instructorRow } = await supabase
    .from("instructeurs")
    .select("id, profile_id, volledige_naam")
    .eq("id", input.instructeurId)
    .eq("profile_id", context.user.id)
    .maybeSingle();

  if (!instructorRow) {
    return {
      success: false,
      message: "Dit leskompas hoort niet bij jouw instructeursdashboard.",
    };
  }

  const hasRelationship = await hasInstructorStudentPlanningRelationship(
    input.instructeurId,
    input.leerlingId
  );

  if (!hasRelationship) {
    return {
      success: false,
      message: "Deze leerling is nog niet actief gekoppeld aan jouw traject.",
    };
  }

  const [{ data: learnerRow }, { data: existingRow }] = await Promise.all([
    supabase
      .from("leerlingen")
      .select("id, profile_id")
      .eq("id", input.leerlingId)
      .maybeSingle(),
    supabase
      .from("leskompassen")
      .select("id, instructeur_focus, instructeur_missie")
      .eq("leerling_id", input.leerlingId)
      .eq("instructeur_id", input.instructeurId)
      .maybeSingle(),
  ]);

  if (!learnerRow?.profile_id) {
    return {
      success: false,
      message: "De gekoppelde leerling kon niet worden gevonden.",
    };
  }

  if (!existingRow && !focus && !mission) {
    return {
      success: false,
      message: "Zet eerst een coachfocus of mini-missie neer.",
    };
  }

  const unchanged =
    (existingRow?.instructeur_focus ?? null) === focus &&
    (existingRow?.instructeur_missie ?? null) === mission;

  if (unchanged) {
    return {
      success: true,
      message: "Je leskompas stond al up-to-date.",
    };
  }

  const { error } = await supabase.from("leskompassen").upsert(
    {
      leerling_id: input.leerlingId,
      instructeur_id: input.instructeurId,
      instructeur_focus: focus,
      instructeur_missie: mission,
      laatste_update_door: "instructeur",
    } as never,
    {
      onConflict: "leerling_id,instructeur_id",
    }
  );

  if (error) {
    return {
      success: false,
      message: "Opslaan van jullie leskompas is niet gelukt.",
    };
  }

  await notifyLearnerAboutLessonCompassUpdate({
    supabase,
    leerlingId: input.leerlingId,
    instructeurNaam:
      instructorRow.volledige_naam || context.profile?.volledige_naam || "Je instructeur",
    focus,
    mission,
  });

  revalidateLessonCompassSurfaces();

  return {
    success: true,
    message: "Coachfocus staat nu live op het leerlingdashboard.",
  };
}

export async function saveLearnerLessonCompassAction(input: {
  leerlingId: string;
  instructeurId: string;
  confidence: number | null;
  helpRequest: string;
}) {
  const context = await ensureCurrentUserContext();

  if (!context || context.role !== "leerling") {
    return {
      success: false,
      message: "Alleen een leerling kan vanaf deze kant een check-in delen.",
    };
  }

  if (
    input.confidence != null &&
    (!Number.isInteger(input.confidence) ||
      input.confidence < 1 ||
      input.confidence > 5)
  ) {
    return {
      success: false,
      message: "Kies een zelfvertrouwen tussen 1 en 5.",
    };
  }

  let helpRequest: string | null;

  try {
    helpRequest = normalizeNullableText(
      input.helpRequest,
      MAX_HELP_REQUEST_LENGTH
    );
  } catch {
    return {
      success: false,
      message: "Houd je hulpvraag compact en concreet.",
    };
  }

  const supabase = await createServerClient();
  const { data: learnerRow } = await supabase
    .from("leerlingen")
    .select("id, profile_id")
    .eq("id", input.leerlingId)
    .eq("profile_id", context.user.id)
    .maybeSingle();

  if (!learnerRow) {
    return {
      success: false,
      message: "Dit leskompas hoort niet bij jouw leerlingdashboard.",
    };
  }

  const hasRelationship = await hasInstructorStudentPlanningRelationship(
    input.instructeurId,
    input.leerlingId
  );

  if (!hasRelationship) {
    return {
      success: false,
      message: "Deze instructeur is nog niet actief gekoppeld aan jouw traject.",
    };
  }

  const [{ data: instructorRow }, { data: existingRow }] = await Promise.all([
    supabase
      .from("instructeurs")
      .select("id, profile_id, volledige_naam")
      .eq("id", input.instructeurId)
      .maybeSingle(),
    supabase
      .from("leskompassen")
      .select("id, leerling_confidence, leerling_hulpvraag")
      .eq("leerling_id", input.leerlingId)
      .eq("instructeur_id", input.instructeurId)
      .maybeSingle(),
  ]);

  if (!instructorRow?.profile_id) {
    return {
      success: false,
      message: "De gekoppelde instructeur kon niet worden gevonden.",
    };
  }

  if (!existingRow && input.confidence == null && !helpRequest) {
    return {
      success: false,
      message: "Zet eerst je zelfvertrouwen of hulpvraag neer.",
    };
  }

  const unchanged =
    (existingRow?.leerling_confidence ?? null) === input.confidence &&
    (existingRow?.leerling_hulpvraag ?? null) === helpRequest;

  if (unchanged) {
    return {
      success: true,
      message: "Je check-in stond al live voor je instructeur.",
    };
  }

  const { error } = await supabase.from("leskompassen").upsert(
    {
      leerling_id: input.leerlingId,
      instructeur_id: input.instructeurId,
      leerling_confidence: input.confidence,
      leerling_hulpvraag: helpRequest,
      laatste_update_door: "leerling",
    } as never,
    {
      onConflict: "leerling_id,instructeur_id",
    }
  );

  if (error) {
    return {
      success: false,
      message: "Opslaan van je check-in is niet gelukt.",
    };
  }

  await notifyInstructorAboutLessonCompassUpdate({
    supabase,
    instructeurId: input.instructeurId,
    leerlingNaam: context.profile?.volledige_naam || "Je leerling",
    confidence: input.confidence,
    helpRequest,
  });

  revalidateLessonCompassSurfaces();

  return {
    success: true,
    message: "Je check-in staat nu live op het instructeursdashboard.",
  };
}
