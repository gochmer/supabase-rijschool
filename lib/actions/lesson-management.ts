"use server";

import { revalidatePath } from "next/cache";

import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";
import type { LesStatus } from "@/lib/types";

type UpdateLessonInput = {
  lessonId: string;
  datum: string;
  tijd: string;
  duurMinuten: number;
  status: Extract<LesStatus, "ingepland" | "afgerond" | "geannuleerd">;
  locatie?: string;
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

  const supabase = await createServerClient();
  const { data: lesson } = (await supabase
    .from("lessen")
    .select("id, leerling_id, instructeur_id")
    .eq("id", input.lessonId)
    .eq("instructeur_id", instructeur.id)
    .maybeSingle()) as unknown as {
    data: { id: string; leerling_id: string | null; instructeur_id: string | null } | null;
  };

  if (!lesson) {
    return {
      success: false,
      message: "Deze les kon niet worden gevonden.",
    };
  }

  const { error } = await supabase
    .from("lessen")
    .update({
      start_at: startAt,
      duur_minuten: duration,
      status: input.status,
    } as never)
    .eq("id", input.lessonId)
    .eq("instructeur_id", instructeur.id);

  if (error) {
    return {
      success: false,
      message: "De les kon niet worden bijgewerkt.",
    };
  }

  if (lesson.leerling_id) {
    const { data: leerling } = await supabase
      .from("leerlingen")
      .select("profile_id")
      .eq("id", lesson.leerling_id)
      .maybeSingle();

    await createNotification({
      profileId: leerling?.profile_id,
      title: "Je les is bijgewerkt",
      text: `Je instructeur heeft je les aangepast naar ${input.datum} om ${input.tijd}.`,
      type: input.status === "geannuleerd" ? "waarschuwing" : "info",
    });
  }

  revalidatePath("/instructeur/dashboard");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/leerling/boekingen");

  return {
    success: true,
    message: "De les is bijgewerkt.",
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
    text: "Je hebt een aanvraag geaccepteerd en automatisch ingepland.",
    type: "succes",
  });
}
