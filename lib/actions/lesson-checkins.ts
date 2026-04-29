"use server";

import { revalidatePath } from "next/cache";

import {
  ensureCurrentUserContext,
  getCurrentInstructeurRecord,
  getCurrentLeerlingRecord,
} from "@/lib/data/profiles";
import {
  notifyInstructorAboutLessonCheckin,
  notifyLearnerAboutLessonCheckinFocus,
} from "@/lib/notification-events";
import { createServerClient } from "@/lib/supabase/server";
import type { LessonCheckinArrivalMode } from "@/lib/types";

type LessonOwnershipRow = {
  id: string;
  leerling_id: string | null;
  instructeur_id: string | null;
  titel: string | null;
  start_at: string | null;
  status: string | null;
};

function normalizeText(value: string) {
  return value.trim();
}

function revalidateLessonCheckinSurfaces() {
  [
    "/instructeur/dashboard",
    "/instructeur/lessen",
    "/leerling/dashboard",
    "/leerling/boekingen",
  ].forEach((path) => revalidatePath(path));
}

async function getLessonForCheckin(lessonId: string) {
  const supabase = await createServerClient();
  const { data } = (await supabase
    .from("lessen")
    .select("id, leerling_id, instructeur_id, titel, start_at, status")
    .eq("id", lessonId)
    .maybeSingle()) as unknown as { data: LessonOwnershipRow | null };

  return {
    supabase,
    lesson: data,
  };
}

function isLessonCheckinAllowed(lesson: LessonOwnershipRow | null) {
  if (!lesson?.id || !lesson.start_at) {
    return false;
  }

  if (!["ingepland", "geaccepteerd"].includes(lesson.status ?? "")) {
    return false;
  }

  const lessonStart = new Date(lesson.start_at).getTime();
  const now = Date.now();
  const diffHours = (lessonStart - now) / (1000 * 60 * 60);

  return diffHours > -2 && diffHours <= 168;
}

export async function saveLearnerLessonCheckinAction(input: {
  lessonId: string;
  confidenceLevel: number | null;
  supportRequest: string;
  arrivalMode: LessonCheckinArrivalMode | null;
}) {
  const context = await ensureCurrentUserContext();
  const leerling = await getCurrentLeerlingRecord();

  if (!context || !leerling) {
    return {
      success: false,
      message: "Alleen een ingelogde leerling kan deze check-in invullen.",
    };
  }

  const { supabase, lesson } = await getLessonForCheckin(input.lessonId);

  if (!lesson || lesson.leerling_id !== leerling.id) {
    return {
      success: false,
      message: "Deze les hoort niet bij jouw dashboard.",
    };
  }

  if (!isLessonCheckinAllowed(lesson)) {
    return {
      success: false,
      message:
        "Deze voor-les check-in is alleen beschikbaar rond een geplande aankomende les.",
    };
  }

  if (!lesson.instructeur_id) {
    return {
      success: false,
      message: "Bij deze les ontbreekt nog een geldige instructeurkoppeling.",
    };
  }

  const confidenceLevel =
    input.confidenceLevel && input.confidenceLevel >= 1 && input.confidenceLevel <= 5
      ? input.confidenceLevel
      : null;
  const supportRequest = normalizeText(input.supportRequest);
  const { data: existingCheckin } = (await supabase
    .from("les_checkins" as never)
    .select("instructor_focus")
    .eq("les_id", lesson.id)
    .maybeSingle()) as unknown as {
    data: { instructor_focus: string | null } | null;
  };

  const { error } = await supabase
    .from("les_checkins" as never)
    .upsert(
      {
        les_id: lesson.id,
        leerling_id: leerling.id,
        instructeur_id: lesson.instructeur_id,
        confidence_level: confidenceLevel,
        support_request: supportRequest || null,
        arrival_mode: input.arrivalMode,
        instructor_focus: existingCheckin?.instructor_focus ?? null,
        learner_updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "les_id" }
    );

  if (error) {
    return {
      success: false,
      message: "Je voor-les check-in kon niet worden opgeslagen.",
    };
  }

  await notifyInstructorAboutLessonCheckin({
    supabase,
    instructeurId: lesson.instructeur_id,
    leerlingNaam: context.profile?.volledige_naam || "Leerling",
    confidenceLevel,
    supportRequest,
    arrivalMode: input.arrivalMode,
  });

  revalidateLessonCheckinSurfaces();

  return {
    success: true,
    message: "Je voor-les check-in is bijgewerkt.",
  };
}

export async function saveInstructorLessonCheckinFocusAction(input: {
  lessonId: string;
  instructorFocus: string;
}) {
  const context = await ensureCurrentUserContext();
  const instructeur = await getCurrentInstructeurRecord();

  if (!context || !instructeur) {
    return {
      success: false,
      message: "Alleen een ingelogde instructeur kan de lesfocus klaarzetten.",
    };
  }

  const { supabase, lesson } = await getLessonForCheckin(input.lessonId);

  if (!lesson || lesson.instructeur_id !== instructeur.id) {
    return {
      success: false,
      message: "Deze les hoort niet bij jouw dashboard.",
    };
  }

  if (!isLessonCheckinAllowed(lesson)) {
    return {
      success: false,
      message:
        "Deze lesfocus is alleen beschikbaar rond een geplande aankomende les.",
    };
  }

  if (!lesson.leerling_id) {
    return {
      success: false,
      message: "Bij deze les ontbreekt nog een geldige leerlingkoppeling.",
    };
  }

  const instructorFocus = normalizeText(input.instructorFocus);

  if (!instructorFocus) {
    return {
      success: false,
      message: "Vul een korte focus voor de volgende les in.",
    };
  }

  const { data: existingCheckin } = (await supabase
    .from("les_checkins" as never)
    .select("confidence_level, support_request, arrival_mode, learner_updated_at")
    .eq("les_id", lesson.id)
    .maybeSingle()) as unknown as {
    data: {
      confidence_level: number | null;
      support_request: string | null;
      arrival_mode: LessonCheckinArrivalMode | null;
      learner_updated_at: string | null;
    } | null;
  };

  const { error } = await supabase
    .from("les_checkins" as never)
    .upsert(
      {
        les_id: lesson.id,
        leerling_id: lesson.leerling_id,
        instructeur_id: instructeur.id,
        confidence_level: existingCheckin?.confidence_level ?? null,
        support_request: existingCheckin?.support_request ?? null,
        arrival_mode: existingCheckin?.arrival_mode ?? null,
        learner_updated_at: existingCheckin?.learner_updated_at ?? null,
        instructor_focus: instructorFocus,
        instructor_updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "les_id" }
    );

  if (error) {
    return {
      success: false,
      message: "De lesfocus kon niet worden opgeslagen.",
    };
  }

  await notifyLearnerAboutLessonCheckinFocus({
    supabase,
    leerlingId: lesson.leerling_id,
    instructeurNaam: context.profile?.volledige_naam || "Je instructeur",
    focus: instructorFocus,
  });

  revalidateLessonCheckinSurfaces();

  return {
    success: true,
    message: "De lesfocus staat nu klaar voor de leerling.",
  };
}
