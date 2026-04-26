"use server";

import { revalidatePath } from "next/cache";

import { resolveLocationSelection, type LocationSelectionInput } from "@/lib/actions/location-resolution";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import {
  appendRequestUpdateMessage,
  buildLessonRequestReference,
} from "@/lib/lesson-request-flow";
import { createServerClient } from "@/lib/supabase/server";
import type { LesStatus } from "@/lib/types";

type LessonRequestForScheduling = {
  id: string;
  leerling_id: string | null;
  instructeur_id: string | null;
  voorkeursdatum: string | null;
  tijdvak: string | null;
  aanvraag_type: string | null;
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

function parsePreferredLessonWindow(preferredDate: string | null, timeSlot: string | null) {
  if (!preferredDate) {
    return { startAt: null, durationMinutes: 60 };
  }

  const rangeMatch = timeSlot?.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);

  if (!rangeMatch) {
    return {
      startAt: toLocalDateTime(preferredDate, "12:00"),
      durationMinutes: 60,
    };
  }

  const startAt = toLocalDateTime(preferredDate, rangeMatch[1]);
  const endAt = toLocalDateTime(preferredDate, rangeMatch[2]);

  if (!startAt || !endAt) {
    return { startAt: null, durationMinutes: 60 };
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

async function createNotification({
  profileId,
  title,
  text,
  type = "info",
}: {
  profileId: string | null | undefined;
  title: string;
  text: string;
  type?: "info" | "succes" | "waarschuwing";
}) {
  if (!profileId) {
    return;
  }

  const supabase = await createServerClient();
  await supabase.from("notificaties").insert({
    profiel_id: profileId,
    titel: title,
    tekst: text,
    type,
    ongelezen: true,
  } as never);
}

async function ensureLessonForAcceptedRequest(
  request: LessonRequestForScheduling,
  input: LocationSelectionInput
) {
  if (!request.leerling_id || !request.instructeur_id) {
    return {
      success: false,
      message: "De aanvraag mist leerling- of instructeurgegevens.",
    };
  }

  const { startAt, durationMinutes } = parsePreferredLessonWindow(
    request.voorkeursdatum,
    request.tijdvak
  );

  if (!startAt) {
    return {
      success: false,
      message: "Er kon geen lestijd worden bepaald voor deze aanvraag.",
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

  const locationId = await resolveLocationSelection(input);

  const { error } = await supabase.from("lessen").insert({
    leerling_id: request.leerling_id,
    instructeur_id: request.instructeur_id,
    titel: getLessonTitle(request),
    start_at: startAt,
    duur_minuten: durationMinutes,
    status: "geaccepteerd",
    locatie_id: locationId,
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
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen ingelogde instructeurs kunnen aanvragen bijwerken.",
    };
  }

  const supabase = await createServerClient();
  const { data: request } = (await supabase
    .from("lesaanvragen")
    .select(
      "id, leerling_id, instructeur_id, voorkeursdatum, tijdvak, aanvraag_type, pakket_naam_snapshot, bericht, status"
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
    const lessonResult = await ensureLessonForAcceptedRequest(request, input);

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

  if (request.leerling_id) {
    const { data: leerling } = await supabase
      .from("leerlingen")
      .select("profile_id")
      .eq("id", request.leerling_id)
      .maybeSingle();

    await createNotification({
      profileId: leerling?.profile_id,
      title:
        input.status === "geaccepteerd"
          ? "Je aanvraag is geaccepteerd"
          : "Je aanvraag is geweigerd",
      text:
        input.status === "geaccepteerd"
          ? "De instructeur heeft je aanvraag geaccepteerd. De les staat nu klaar om verder ingepland te worden."
          : input.reason?.trim()
            ? `De instructeur heeft je aanvraag geweigerd. Reden: ${input.reason.trim()}`
            : "De instructeur heeft je aanvraag geweigerd.",
      type: input.status === "geaccepteerd" ? "succes" : "waarschuwing",
    });
  }

  revalidatePath("/instructeur/aanvragen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/instructeur/lessen");
  revalidatePath("/leerling/boekingen");
  revalidatePath("/leerling/dashboard");

  return {
    success: true,
    message:
      input.status === "geaccepteerd"
        ? "De aanvraag is geaccepteerd en staat nu klaar als les."
        : "De aanvraag is geweigerd.",
  };
}
