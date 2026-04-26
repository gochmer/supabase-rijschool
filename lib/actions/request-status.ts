"use server";

import { revalidatePath } from "next/cache";

import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
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

async function ensureLessonForAcceptedRequest(request: LessonRequestForScheduling) {
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
    .eq("leerling_id", request.leerling_id)
    .eq("instructeur_id", request.instructeur_id)
    .eq("start_at", startAt)
    .maybeSingle();

  if (existingLesson) {
    return { success: true };
  }

  const { error } = await supabase.from("lessen").insert({
    leerling_id: request.leerling_id,
    instructeur_id: request.instructeur_id,
    titel: getLessonTitle(request),
    start_at: startAt,
    duur_minuten: durationMinutes,
    status: "ingepland",
    locatie_id: null,
  } as never);

  if (error) {
    return {
      success: false,
      message: "De aanvraag is niet omgezet naar een geplande les.",
    };
  }

  return { success: true };
}

export async function updateLessonRequestStatusAction(
  requestId: string,
  status: Extract<LesStatus, "geaccepteerd" | "geweigerd">
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
      "id, leerling_id, instructeur_id, voorkeursdatum, tijdvak, aanvraag_type, pakket_naam_snapshot"
    )
    .eq("id", requestId)
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

  if (status === "geaccepteerd") {
    const lessonResult = await ensureLessonForAcceptedRequest(request);

    if (!lessonResult.success) {
      return {
        success: false,
        message: lessonResult.message ?? "De les kon niet worden aangemaakt.",
      };
    }
  }

  const { error } = await supabase
    .from("lesaanvragen")
    .update({ status })
    .eq("id", requestId)
    .eq("instructeur_id", instructeur.id);

  if (error) {
    return {
      success: false,
      message: "De aanvraagstatus kon niet worden bijgewerkt.",
    };
  }

  revalidatePath("/instructeur/aanvragen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/leerling/boekingen");
  revalidatePath("/leerling/dashboard");

  return {
    success: true,
    message:
      status === "geaccepteerd"
        ? "De aanvraag is geaccepteerd en als les ingepland."
        : "De aanvraag is geweigerd.",
  };
}
