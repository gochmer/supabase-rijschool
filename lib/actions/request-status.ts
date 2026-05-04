"use server";

import { revalidatePath } from "next/cache";

import { getLessonEndAt } from "@/lib/booking-availability";
import { resolveLocationSelection, type LocationSelectionInput } from "@/lib/actions/location-resolution";
import { findSchedulingConflict } from "@/lib/data/scheduling-conflicts";
import {
  ensureCurrentUserContext,
  getCurrentInstructeurRecord,
} from "@/lib/data/profiles";
import { getLearnerTrialLessonState } from "@/lib/data/trial-lessons";
import { getLessonDurationForKind } from "@/lib/lesson-durations";
import { syncStudentDriverJourneyStatus } from "@/lib/data/driver-journey";
import {
  appendRequestUpdateMessage,
  buildLessonRequestReference,
} from "@/lib/lesson-request-flow";
import { notifyLearnerAboutRequestDecision } from "@/lib/notification-events";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { LesStatus } from "@/lib/types";

type LessonRequestForScheduling = {
  id: string;
  leerling_id: string | null;
  instructeur_id: string | null;
  voorkeursdatum: string | null;
  tijdvak: string | null;
  aanvraag_type: string | null;
  pakket_id: string | null;
  pakket_naam_snapshot: string | null;
  bericht: string | null;
  status: LesStatus;
};

type UpdateLessonRequestStatusInput = LocationSelectionInput & {
  requestId: string;
  status: Extract<LesStatus, "geaccepteerd" | "geweigerd">;
  reason?: string | null;
};

function toLocalDateTime(dateString: string, timeString: string) {
  const [hours, minutes] = timeString.split(":");

  if (!hours || !minutes) {
    return null;
  }

  return `${dateString}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
}

function parsePreferredLessonWindow(
  preferredDate: string | null,
  timeSlot: string | null,
  fallbackDurationMinutes: number
) {
  if (!preferredDate) {
    return { startAt: null, durationMinutes: fallbackDurationMinutes };
  }

  const rangeMatch = timeSlot?.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);

  if (!rangeMatch) {
    return {
      startAt: toLocalDateTime(preferredDate, "12:00"),
      durationMinutes: fallbackDurationMinutes,
    };
  }

  const startAt = toLocalDateTime(preferredDate, rangeMatch[1]);
  const endAt = toLocalDateTime(preferredDate, rangeMatch[2]);

  if (!startAt || !endAt) {
    return { startAt: null, durationMinutes: fallbackDurationMinutes };
  }

  const durationMinutes = Math.max(
    30,
    Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000)
  );

  return { startAt, durationMinutes };
}

function getLessonTitle(request: LessonRequestForScheduling) {
  if (request.pakket_naam_snapshot) {
    return request.pakket_naam_snapshot;
  }

  if (request.aanvraag_type === "proefles") {
    return "Proefles";
  }

  return "Rijles";
}

async function ensureLessonForAcceptedRequest(
  request: LessonRequestForScheduling,
  input: LocationSelectionInput,
  instructeur: NonNullable<Awaited<ReturnType<typeof getCurrentInstructeurRecord>>>
) {
  if (!request.leerling_id || !request.instructeur_id) {
    return {
      success: false,
      message: "De aanvraag mist leerling- of instructeurgegevens.",
    };
  }

  const fallbackDurationMinutes = getLessonDurationForKind(
    instructeur,
    request.aanvraag_type === "pakket"
      ? "pakketles"
      : request.aanvraag_type === "proefles"
        ? "proefles"
        : "rijles"
  );
  const { startAt, durationMinutes } = parsePreferredLessonWindow(
    request.voorkeursdatum,
    request.tijdvak,
    fallbackDurationMinutes
  );

  if (!startAt) {
    return {
      success: false,
      message: "Er kon geen lestijd worden bepaald voor deze aanvraag.",
    };
  }

  const endAt = getLessonEndAt(startAt, durationMinutes);

  if (!endAt) {
    return {
      success: false,
      message: "De eindtijd van deze aanvraag kon niet worden bepaald.",
    };
  }

  const supabase = await createServerClient();
  const { data: existingLesson } = await supabase
    .from("lessen")
    .select("id")
    .eq("instructeur_id", request.instructeur_id)
    .eq("leerling_id", request.leerling_id)
    .eq("notities", buildLessonRequestReference(request.id))
    .maybeSingle();

  if (existingLesson) {
    return { success: true };
  }

  if (request.aanvraag_type === "proefles") {
    const trialState = await getLearnerTrialLessonState({
      actor: "instructor",
      excludeRequestId: request.id,
      supabase,
      leerlingId: request.leerling_id,
    });

    if (!trialState.available) {
      return {
        success: false,
        message: trialState.message,
      };
    }
  }

  const schedulingConflict = await findSchedulingConflict({
    instructorId: request.instructeur_id,
    learnerId: request.leerling_id,
    startAt,
    endAt,
    ignoreRequestId: request.id,
    includeRequestHolds: false,
    supabase,
  });

  if (schedulingConflict.hasConflict) {
    return {
      success: false,
      message: schedulingConflict.message,
    };
  }

  const locationId = await resolveLocationSelection(input);

  const { error } = await supabase.from("lessen").insert({
    leerling_id: request.leerling_id,
    instructeur_id: request.instructeur_id,
    titel: getLessonTitle(request),
    start_at: startAt,
    duur_minuten: durationMinutes,
    status: "geaccepteerd",
    locatie_id: locationId,
    pakket_id: request.pakket_id,
    notities: buildLessonRequestReference(request.id),
  } as never);

  if (error) {
    return {
      success: false,
      message: "De aanvraag is niet omgezet naar een geaccepteerde les.",
    };
  }

  return { success: true };
}

export async function updateLessonRequestStatusAction(
  input: UpdateLessonRequestStatusInput
) {
  const context = await ensureCurrentUserContext();
  const instructeur = await getCurrentInstructeurRecord();

  if (!context || !instructeur) {
    return {
      success: false,
      message: "Alleen ingelogde instructeurs kunnen aanvragen bijwerken.",
    };
  }

  const supabase = await createServerClient();
  const { data: request } = (await supabase
    .from("lesaanvragen")
    .select(
      "id, leerling_id, instructeur_id, voorkeursdatum, tijdvak, aanvraag_type, pakket_id, pakket_naam_snapshot, bericht, status"
    )
    .eq("id", input.requestId)
    .eq("instructeur_id", instructeur.id)
    .maybeSingle()) as unknown as {
    data: LessonRequestForScheduling | null;
  };

  if (!request) {
    return {
      success: false,
      message: "Deze aanvraag kon niet worden gevonden.",
    };
  }

  if (request.status !== "aangevraagd") {
    return {
      success: false,
      message: "Alleen open aanvragen kunnen nog worden bijgewerkt.",
    };
  }

  if (input.status === "geweigerd" && !input.reason?.trim()) {
    return {
      success: false,
      message: "Geef een reden mee bij het weigeren van een aanvraag.",
    };
  }

  if (input.status === "geaccepteerd") {
    if (request.aanvraag_type === "pakket" && request.pakket_id && request.leerling_id) {
      const admin = await createAdminClient();
      const now = new Date().toISOString();
      const { error: learnerPackageError } = await admin
        .from("leerlingen" as never)
        .update({
          pakket_id: request.pakket_id,
        } as never)
        .eq("id", request.leerling_id);

      if (learnerPackageError) {
        return {
          success: false,
          message: "Het pakket kon niet aan deze leerling worden gekoppeld.",
        };
      }

      const { error: planningAccessError } = await admin
        .from("leerling_planningsrechten" as never)
        .upsert(
          {
            leerling_id: request.leerling_id,
            instructeur_id: instructeur.id,
            zelf_inplannen_toegestaan: true,
            vrijgegeven_at: now,
            updated_at: now,
          } as never,
          { onConflict: "leerling_id,instructeur_id" }
        );

      if (planningAccessError) {
        return {
          success: false,
          message: "Het pakket is gekoppeld, maar de planning kon niet worden vrijgegeven.",
        };
      }
    }

    const lessonResult = await ensureLessonForAcceptedRequest(
      request,
      input,
      instructeur
    );

    if (!lessonResult.success) {
      return {
        success: false,
        message: lessonResult.message ?? "De les kon niet worden aangemaakt.",
      };
    }
  }

  const updateMessage =
    input.status === "geaccepteerd"
      ? "Geaccepteerd door instructeur"
      : "Geweigerd door instructeur";

  const { error } = await supabase
    .from("lesaanvragen")
    .update({
      status: input.status,
      bericht: appendRequestUpdateMessage(
        request.bericht,
        updateMessage,
        input.reason
      ),
    } as never)
    .eq("id", input.requestId)
    .eq("instructeur_id", instructeur.id);

  if (error) {
    return {
      success: false,
      message: "De aanvraagstatus kon niet worden bijgewerkt.",
    };
  }

  await notifyLearnerAboutRequestDecision({
    supabase,
    leerlingId: request.leerling_id,
    instructeurNaam: context.profile?.volledige_naam || "Je instructeur",
    status: input.status,
    voorkeursdatum: request.voorkeursdatum,
    tijdvak: request.tijdvak,
    pakketNaam: request.pakket_naam_snapshot,
    aanvraagType: request.aanvraag_type,
    reason: input.reason,
  });

  await syncStudentDriverJourneyStatus(request.leerling_id);

  revalidatePath("/instructeur/aanvragen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/instructeur/lessen");
  revalidatePath("/leerling/boekingen");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/leerling/profiel");

  return {
    success: true,
    message:
      input.status === "geaccepteerd"
        ? "De aanvraag is geaccepteerd en staat nu klaar als les."
        : "De aanvraag is geweigerd.",
  };
}
