"use server";

import { revalidatePath } from "next/cache";

import { resolveLocationSelection, type LocationSelectionInput } from "@/lib/actions/location-resolution";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import {
  appendRequestUpdateMessage,
  extractLessonRequestReference,
} from "@/lib/lesson-request-flow";
import { createServerClient } from "@/lib/supabase/server";
import type { LesStatus } from "@/lib/types";

type UpdateLessonInput = LocationSelectionInput & {
  lessonId: string;
  datum: string;
  tijd: string;
  duurMinuten: number;
  status: Extract<LesStatus, "geaccepteerd" | "ingepland" | "afgerond" | "geannuleerd">;
  reason?: string | null;
};

function toLocalDateTime(dateString: string, timeString: string) {
  const [hours, minutes] = timeString.split(":");

  if (!hours || !minutes) {
    return null;
  }

  return `${dateString}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
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

async function syncLinkedRequestStatus(
  requestId: string | null,
  status: UpdateLessonInput["status"],
  reason?: string | null
) {
  if (!requestId) {
    return;
  }

  const supabase = await createServerClient();
  const { data: request } = await supabase
    .from("lesaanvragen")
    .select("id, bericht")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) {
    return;
  }

  let updateLabel = "";
  if (status === "ingepland") {
    updateLabel = "Les is definitief ingepland";
  } else if (status === "afgerond") {
    updateLabel = "Les is afgerond";
  } else if (status === "geannuleerd") {
    updateLabel = "Les is geannuleerd";
  } else {
    updateLabel = "Les is geaccepteerd";
  }

  await supabase
    .from("lesaanvragen")
    .update({
      status,
      bericht: appendRequestUpdateMessage(request.bericht, updateLabel, reason),
    } as never)
    .eq("id", requestId);
}

export async function updateLessonAction(input: UpdateLessonInput) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen ingelogde instructeurs kunnen lessen bijwerken.",
    };
  }

  const startAt = toLocalDateTime(input.datum, input.tijd);

  if (!startAt) {
    return {
      success: false,
      message: "Kies een geldige datum en starttijd.",
    };
  }

  const duration = Number(input.duurMinuten);

  if (!Number.isFinite(duration) || duration < 30 || duration > 240) {
    return {
      success: false,
      message: "Kies een lesduur tussen 30 en 240 minuten.",
    };
  }

  if (input.status === "geannuleerd" && !input.reason?.trim()) {
    return {
      success: false,
      message: "Geef een reden mee bij het annuleren van een les.",
    };
  }

  const supabase = await createServerClient();
  const { data: lesson } = (await supabase
    .from("lessen")
    .select("id, leerling_id, instructeur_id, notities")
    .eq("id", input.lessonId)
    .eq("instructeur_id", instructeur.id)
    .maybeSingle()) as unknown as {
    data:
      | {
          id: string;
          leerling_id: string | null;
          instructeur_id: string | null;
          notities: string | null;
        }
      | null;
  };

  if (!lesson) {
    return {
      success: false,
      message: "Deze les kon niet worden gevonden.",
    };
  }

  const locationId = await resolveLocationSelection(input);

  const { error } = await supabase
    .from("lessen")
    .update({
      start_at: startAt,
      duur_minuten: duration,
      status: input.status,
      locatie_id: locationId,
    } as never)
    .eq("id", input.lessonId)
    .eq("instructeur_id", instructeur.id);

  if (error) {
    return {
      success: false,
      message: "De les kon niet worden bijgewerkt.",
    };
  }

  await syncLinkedRequestStatus(
    extractLessonRequestReference(lesson.notities),
    input.status,
    input.reason
  );

  if (lesson.leerling_id) {
    const { data: leerling } = await supabase
      .from("leerlingen")
      .select("profile_id")
      .eq("id", lesson.leerling_id)
      .maybeSingle();

    const statusText =
      input.status === "afgerond"
        ? `Je les is afgerond.`
        : input.status === "geannuleerd"
          ? `Je les is geannuleerd.${input.reason?.trim() ? ` Reden: ${input.reason.trim()}` : ""}`
          : `Je les is bijgewerkt naar ${input.datum} om ${input.tijd}.`;

    await createNotification({
      profileId: leerling?.profile_id,
      title:
        input.status === "geannuleerd"
          ? "Je les is geannuleerd"
          : input.status === "afgerond"
            ? "Je les is afgerond"
            : "Je les is bijgewerkt",
      text: statusText,
      type: input.status === "geannuleerd" ? "waarschuwing" : "info",
    });
  }

  revalidatePath("/instructeur/dashboard");
  revalidatePath("/instructeur/lessen");
  revalidatePath("/instructeur/aanvragen");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/leerling/boekingen");

  return {
    success: true,
    message:
      input.status === "geannuleerd"
        ? "De les is geannuleerd."
        : "De les is bijgewerkt.",
  };
}

export async function createLessonNotificationForAcceptedRequest({
  leerlingId,
  instructeurProfileId,
  title,
  text,
}: {
  leerlingId: string | null;
  instructeurProfileId?: string | null;
  title: string;
  text: string;
}) {
  const supabase = await createServerClient();

  if (leerlingId) {
    const { data: leerling } = await supabase
      .from("leerlingen")
      .select("profile_id")
      .eq("id", leerlingId)
      .maybeSingle();

    await createNotification({
      profileId: leerling?.profile_id,
      title,
      text,
      type: "succes",
    });
  }

  await createNotification({
    profileId: instructeurProfileId,
    title: "Aanvraag verwerkt",
    text: "Je hebt een aanvraag geaccepteerd en automatisch als les klaargezet.",
    type: "succes",
  });
}
