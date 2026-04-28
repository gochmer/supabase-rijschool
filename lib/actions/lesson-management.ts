"use server";

import { revalidatePath } from "next/cache";

import { getLessonEndAt } from "@/lib/booking-availability";
import { resolveLocationSelection, type LocationSelectionInput } from "@/lib/actions/location-resolution";
import { findSchedulingConflict } from "@/lib/data/scheduling-conflicts";
import {
  ensureCurrentUserContext,
  getCurrentInstructeurRecord,
} from "@/lib/data/profiles";
import {
  appendRequestUpdateMessage,
  extractLessonRequestReference,
} from "@/lib/lesson-request-flow";
import {
  notifyLearnerAboutLessonChange,
  notifyLearnerAboutLessonAttendance,
  notifyLearnerToLeaveReview,
} from "@/lib/notification-events";
import { createServerClient } from "@/lib/supabase/server";
import type { LessonAttendanceStatus, LesStatus } from "@/lib/types";

type UpdateLessonInput = LocationSelectionInput & {
  lessonId: string;
  datum: string;
  tijd: string;
  duurMinuten: number;
  status: Extract<LesStatus, "geaccepteerd" | "ingepland" | "afgerond" | "geannuleerd">;
  reason?: string | null;
};

type ManagedLessonRecord = {
  id: string;
  leerling_id: string | null;
  instructeur_id: string | null;
  notities: string | null;
  status: LesStatus;
  titel: string;
  start_at?: string | null;
  aanwezigheid_status?: LessonAttendanceStatus | null;
};

function toLocalDateTime(dateString: string, timeString: string) {
  const [hours, minutes] = timeString.split(":");

  if (!hours || !minutes) {
    return null;
  }

  return `${dateString}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
}

function formatLessonDateAndTime(startAt: string | null | undefined) {
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

function revalidateLessonViews() {
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/instructeur/lessen");
  revalidatePath("/instructeur/aanvragen");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/leerling/boekingen");
}

async function getManagedLesson(
  lessonId: string,
  instructorId: string
): Promise<ManagedLessonRecord | null> {
  const supabase = await createServerClient();
  const { data: lesson } = (await supabase
    .from("lessen")
    .select(
      "id, leerling_id, instructeur_id, notities, status, titel, start_at, aanwezigheid_status"
    )
    .eq("id", lessonId)
    .eq("instructeur_id", instructorId)
    .maybeSingle()) as unknown as {
    data: ManagedLessonRecord | null;
  };

  return lesson;
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
  const context = await ensureCurrentUserContext();
  const instructeur = await getCurrentInstructeurRecord();

  if (!context || !instructeur) {
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
  const lesson = await getManagedLesson(input.lessonId, instructeur.id);

  if (!lesson) {
    return {
      success: false,
      message: "Deze les kon niet worden gevonden.",
    };
  }

  const endAt = getLessonEndAt(startAt, duration);

  if (!endAt) {
    return {
      success: false,
      message: "De eindtijd van deze les kon niet worden bepaald.",
    };
  }

  if (input.status !== "geannuleerd") {
    const schedulingConflict = await findSchedulingConflict({
      instructorId: instructeur.id,
      learnerId: lesson.leerling_id,
      startAt,
      endAt,
      ignoreLessonId: lesson.id,
      includeRequestHolds: false,
      supabase,
    });

    if (schedulingConflict.hasConflict) {
      return {
        success: false,
        message: schedulingConflict.message,
      };
    }
  }

  const locationId = await resolveLocationSelection(input);
  const locationRow =
    locationId
      ? (
          await supabase
            .from("locaties")
            .select("naam, stad")
            .eq("id", locationId)
            .maybeSingle()
        ).data
      : null;
  const locationSummary =
    input.newLocationName?.trim() && input.newLocationCity?.trim()
      ? `${input.newLocationName.trim()}, ${input.newLocationCity.trim()}`
      : locationRow
        ? `${locationRow.naam}, ${locationRow.stad}`
        : "Locatie volgt nog";

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

  if (input.status === "afgerond") {
    const shouldPromptForReview = lesson.status !== "afgerond";
    const { data: existingReview } = shouldPromptForReview
      ? await supabase
          .from("reviews")
          .select("id")
          .eq("les_id", lesson.id)
          .maybeSingle()
      : { data: null };

    if (shouldPromptForReview && !existingReview) {
      await notifyLearnerToLeaveReview({
        supabase,
        leerlingId: lesson.leerling_id,
        instructeurNaam: context.profile?.volledige_naam || "Je instructeur",
        datum: input.datum,
        tijd: input.tijd,
        lesTitel: lesson.titel,
      });
    }
  } else {
    await notifyLearnerAboutLessonChange({
      supabase,
      leerlingId: lesson.leerling_id,
      instructeurNaam: context.profile?.volledige_naam || "Je instructeur",
      datum: input.datum,
      tijd: input.tijd,
      locatie: locationSummary,
      status: input.status,
      reason: input.reason,
    });
  }

  revalidateLessonViews();

  return {
    success: true,
    message:
      input.status === "geannuleerd"
        ? "De les is geannuleerd."
        : "De les is bijgewerkt.",
  };
}

export async function updateLessonAttendanceAction(input: {
  lessonId: string;
  attendanceStatus: Exclude<LessonAttendanceStatus, "onbekend">;
  absenceReason?: string | null;
}) {
  const context = await ensureCurrentUserContext();
  const instructeur = await getCurrentInstructeurRecord();

  if (!context || !instructeur) {
    return {
      success: false,
      message: "Alleen ingelogde instructeurs kunnen aanwezigheid bevestigen.",
    };
  }

  if (
    input.attendanceStatus === "afwezig" &&
    !input.absenceReason?.trim()
  ) {
    return {
      success: false,
      message: "Geef een korte reden mee als een leerling afwezig was.",
    };
  }

  const supabase = await createServerClient();
  const lesson = await getManagedLesson(input.lessonId, instructeur.id);

  if (!lesson) {
    return {
      success: false,
      message: "Deze les kon niet worden gevonden.",
    };
  }

  const { error } = await supabase
    .from("lessen")
    .update({
      status: "afgerond",
      aanwezigheid_status: input.attendanceStatus,
      aanwezigheid_bevestigd_at: new Date().toISOString(),
      afwezigheids_reden:
        input.attendanceStatus === "afwezig"
          ? input.absenceReason?.trim() || null
          : null,
    } as never)
    .eq("id", input.lessonId)
    .eq("instructeur_id", instructeur.id);

  if (error) {
    return {
      success: false,
      message: "De aanwezigheid kon niet worden bijgewerkt.",
    };
  }

  await syncLinkedRequestStatus(
    extractLessonRequestReference(lesson.notities),
    "afgerond",
    input.attendanceStatus === "afwezig" ? input.absenceReason : null
  );

  const { datum, tijd } = formatLessonDateAndTime(lesson.start_at);

  if (input.attendanceStatus === "aanwezig") {
    const shouldPromptForReview =
      lesson.status !== "afgerond" ||
      lesson.aanwezigheid_status !== "aanwezig";
    const { data: existingReview } = shouldPromptForReview
      ? await supabase
          .from("reviews")
          .select("id")
          .eq("les_id", lesson.id)
          .maybeSingle()
      : { data: null };

    if (shouldPromptForReview && !existingReview) {
      await notifyLearnerToLeaveReview({
        supabase,
        leerlingId: lesson.leerling_id,
        instructeurNaam: context.profile?.volledige_naam || "Je instructeur",
        datum,
        tijd,
        lesTitel: lesson.titel,
      });
    }
  } else {
    await notifyLearnerAboutLessonAttendance({
      supabase,
      leerlingId: lesson.leerling_id,
      instructeurNaam: context.profile?.volledige_naam || "Je instructeur",
      datum,
      tijd,
      reason: input.absenceReason,
    });
  }

  revalidateLessonViews();

  return {
    success: true,
    message:
      input.attendanceStatus === "aanwezig"
        ? "Les bevestigd als aanwezig en afgerond."
        : "Les bevestigd als afwezig en afgerond.",
  };
}

export async function saveLessonMomentNoteAction(input: {
  lessonId: string;
  note: string;
}) {
  const context = await ensureCurrentUserContext();
  const instructeur = await getCurrentInstructeurRecord();

  if (!context || !instructeur) {
    return {
      success: false,
      message: "Alleen ingelogde instructeurs kunnen lesnotities opslaan.",
    };
  }

  const normalizedNote = input.note.trim();

  if (normalizedNote.length > 1500) {
    return {
      success: false,
      message: "Houd de lesnotitie onder 1500 tekens.",
    };
  }

  const supabase = await createServerClient();
  const lesson = await getManagedLesson(input.lessonId, instructeur.id);

  if (!lesson) {
    return {
      success: false,
      message: "Deze les kon niet worden gevonden.",
    };
  }

  const { error } = await supabase
    .from("lessen")
    .update({
      lesnotitie: normalizedNote || null,
    } as never)
    .eq("id", input.lessonId)
    .eq("instructeur_id", instructeur.id);

  if (error) {
    return {
      success: false,
      message: "De lesnotitie kon niet worden opgeslagen.",
    };
  }

  revalidateLessonViews();

  return {
    success: true,
    message: normalizedNote
      ? "Lesnotitie opgeslagen."
      : "Lesnotitie verwijderd.",
  };
}
