"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  ensureCurrentUserContext,
  getCurrentLeerlingRecord,
} from "@/lib/data/profiles";
import {
  appendRequestUpdateMessage,
  extractLessonRequestReference,
} from "@/lib/lesson-request-flow";
import { getLearnerLessonCancellationAvailability } from "@/lib/lesson-cancellation";
import { notifyInstructorAboutLearnerLessonCancellation } from "@/lib/notification-events";

type CancelLearnerLessonInput = {
  lessonId: string;
  reason?: string;
};

type LearnerLessonRow = {
  id: string;
  leerling_id: string | null;
  instructeur_id: string | null;
  start_at: string | null;
  status:
    | "aangevraagd"
    | "geaccepteerd"
    | "geweigerd"
    | "ingepland"
    | "afgerond"
    | "geannuleerd";
  titel: string;
  notities: string | null;
};

function formatLessonDateAndTime(startAt: string | null) {
  if (!startAt) {
    return {
      datum: "Nog niet gepland",
      tijd: "--:--",
    };
  }

  const lessonDate = new Date(startAt);

  return {
    datum: new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/Amsterdam",
    }).format(lessonDate),
    tijd: new Intl.DateTimeFormat("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Amsterdam",
    }).format(lessonDate),
  };
}

function revalidateLearnerLessonViews(instructorSlug?: string | null) {
  revalidatePath("/leerling/boekingen");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/instructeur/lessen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/instructeur/aanvragen");
  revalidatePath("/leerling/instructeurs");
  revalidatePath("/instructeurs");

  if (instructorSlug) {
    revalidatePath(`/instructeurs/${instructorSlug}`);
  }
}

export async function cancelLearnerLessonAction(
  input: CancelLearnerLessonInput
) {
  const context = await ensureCurrentUserContext();

  if (!context || context.role !== "leerling") {
    return {
      success: false,
      message: "Alleen ingelogde leerlingen kunnen hun eigen les annuleren.",
    };
  }

  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return {
      success: false,
      message: "Je leerlingprofiel kon niet worden gevonden.",
    };
  }

  const admin = await createAdminClient();
  const { data: lesson } = (await admin
    .from("lessen")
    .select("id, leerling_id, instructeur_id, start_at, status, titel, notities")
    .eq("id", input.lessonId)
    .eq("leerling_id", leerling.id)
    .maybeSingle()) as unknown as {
    data: LearnerLessonRow | null;
  };

  if (!lesson) {
    return {
      success: false,
      message: "Deze les kon niet worden gevonden.",
    };
  }

  const { data: instructeur } = await admin
    .from("instructeurs")
    .select("id, slug, leerling_annuleren_tot_uren_voor_les")
    .eq("id", lesson.instructeur_id ?? "")
    .maybeSingle();

  if (!instructeur) {
    return {
      success: false,
      message:
        "De annuleerregels van deze instructeur konden niet worden geladen.",
    };
  }

  const availability = getLearnerLessonCancellationAvailability({
    startAt: lesson.start_at,
    status: lesson.status,
    cancellationWindowHours:
      instructeur.leerling_annuleren_tot_uren_voor_les ?? null,
  });

  if (!availability.canCancel) {
    return {
      success: false,
      message: availability.message,
    };
  }

  const normalizedReason = input.reason?.trim() ?? "";

  if (!normalizedReason) {
    return {
      success: false,
      message: "Geef een reden mee bij het annuleren van je les.",
    };
  }

  const { error: lessonError } = await admin
    .from("lessen")
    .update({
      status: "geannuleerd",
    } as never)
    .eq("id", lesson.id)
    .eq("leerling_id", leerling.id);

  if (lessonError) {
    return {
      success: false,
      message: "De les kon niet worden geannuleerd.",
    };
  }

  const requestId = extractLessonRequestReference(lesson.notities);

  if (requestId) {
    const { data: request } = await admin
      .from("lesaanvragen")
      .select("id, bericht")
      .eq("id", requestId)
      .maybeSingle();

    if (request) {
      await admin
        .from("lesaanvragen")
        .update({
          status: "geannuleerd",
          bericht: appendRequestUpdateMessage(
            request.bericht,
            "Les geannuleerd door leerling",
            normalizedReason
          ),
        } as never)
        .eq("id", requestId);
    }
  }

  const { datum, tijd } = formatLessonDateAndTime(lesson.start_at);

  await notifyInstructorAboutLearnerLessonCancellation({
    supabase: admin,
    instructeurId: lesson.instructeur_id,
    leerlingNaam: context.profile?.volledige_naam || "Leerling",
    datum,
    tijd,
    lesTitel: lesson.titel,
    reason: normalizedReason,
  });

  revalidateLearnerLessonViews(instructeur.slug);

  return {
    success: true,
    message: "Je les is geannuleerd.",
  };
}
