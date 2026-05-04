"use server";

import { revalidatePath } from "next/cache";

import { getLessonEndAt } from "@/lib/booking-availability";
import { resolveLocationSelection, type LocationSelectionInput } from "@/lib/actions/location-resolution";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { syncStudentDriverJourneyStatus } from "@/lib/data/driver-journey";
import { getInstructeurLessons } from "@/lib/data/lesson-requests";
import { findSchedulingConflict } from "@/lib/data/scheduling-conflicts";
import {
  ensureCurrentUserContext,
  getCurrentInstructeurRecord,
} from "@/lib/data/profiles";
import { hasInstructorStudentPlanningRelationship } from "@/lib/data/student-scheduling";
import { getLearnerTrialLessonState } from "@/lib/data/trial-lessons";
import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import {
  appendRequestUpdateMessage,
  extractLessonRequestReference,
} from "@/lib/lesson-request-flow";
import {
  notifyLearnerAboutLessonChange,
  notifyLearnerAboutLessonAttendance,
  notifyLearnerToLeaveReview,
} from "@/lib/notification-events";
import { findBestLessonRescheduleOptions } from "@/lib/lesson-reschedule-proposals";
import { evaluateStudentTrajectorySignals } from "@/lib/student-trajectory-notifications";
import { createServerClient } from "@/lib/supabase/server";
import type { LessonAttendanceStatus, Les, LesStatus } from "@/lib/types";

const MAX_REPEAT_LESSONS = 12;

type UpdateLessonInput = LocationSelectionInput & {
  lessonId: string;
  leerlingId?: string | null;
  title?: string | null;
  datum: string;
  tijd: string;
  duurMinuten: number;
  status: Extract<LesStatus, "geaccepteerd" | "ingepland" | "afgerond" | "geannuleerd">;
  reason?: string | null;
  repeatCount?: number;
  repeatStartDate?: string | null;
  repeatDates?: string[];
  repeatLessons?: Array<{
    date?: string | null;
    time?: string | null;
    durationMinutes?: number | null;
  }>;
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

function addDaysToDateValue(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDateValue(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(date);
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

function getLessonProgressHref({
  dateValue,
  learnerId,
  lessonId,
}: {
  dateValue: string;
  learnerId: string | null | undefined;
  lessonId: string;
}) {
  if (!learnerId) {
    return null;
  }

  return `/instructeur/leerlingen?student=${encodeURIComponent(
    learnerId,
  )}&date=${encodeURIComponent(dateValue)}&lesson=${encodeURIComponent(
    lessonId,
  )}#voortgang`;
}

function revalidateLessonViews() {
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/instructeur/beschikbaarheid");
  revalidatePath("/instructeur/lessen");
  revalidatePath("/instructeur/aanvragen");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/leerling/boekingen");
  revalidatePath("/leerling/profiel");
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

async function sendAutomaticRescheduleProposalMessage({
  instructorName,
  learnerId,
  lessonTitle,
  proposalLabels,
  senderProfileId,
  supabase,
}: {
  instructorName: string;
  learnerId: string | null | undefined;
  lessonTitle: string;
  proposalLabels: string[];
  senderProfileId: string;
  supabase: Awaited<ReturnType<typeof createServerClient>>;
}) {
  const cleanProposalLabels = proposalLabels
    .map((label) => label.trim())
    .filter(Boolean);

  if (!learnerId || !cleanProposalLabels.length) {
    return;
  }

  const { data: learner } = await supabase
    .from("leerlingen")
    .select("profile_id")
    .eq("id", learnerId)
    .maybeSingle();

  const recipientProfileId = learner?.profile_id;

  if (!recipientProfileId || recipientProfileId === senderProfileId) {
    return;
  }

  const inhoud = [
    `Hi, je les "${lessonTitle}" is geannuleerd.`,
    "",
    `${instructorName} heeft automatisch deze nieuwe momenten voor je klaargezet:`,
    "",
    ...cleanProposalLabels.map((label) => `- ${label}`),
    "",
    "Laat weten welke tijd past, dan kan de les opnieuw worden ingepland.",
  ].join("\n");

  const { error } = await supabase.from("berichten").insert({
    afzender_profiel_id: senderProfileId,
    ontvanger_profiel_id: recipientProfileId,
    onderwerp: "Voorstel voor nieuwe lestijd",
    inhoud,
  });

  if (error) {
    console.error("Automatic reschedule proposal message failed", error);
    return;
  }

  await supabase.from("notificaties").insert({
    profiel_id: recipientProfileId,
    titel: "Nieuw lesvoorstel",
    tekst: `Er staan ${cleanProposalLabels.length} nieuwe tijd${cleanProposalLabels.length === 1 ? "" : "en"} klaar na de annulering.`,
    type: "info",
    ongelezen: true,
  });

  revalidatePath("/leerling/berichten");
  revalidatePath("/instructeur/berichten");
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

  const legacyRepeatCount = Math.min(
    Math.max(
      Number.isFinite(input.repeatCount ?? 0)
        ? Math.trunc(Number(input.repeatCount ?? 0))
        : 0,
      0
    ),
    MAX_REPEAT_LESSONS
  );
  const repeatStartDate = input.repeatStartDate?.trim() || null;
  let repeatLessonValues = Array.isArray(input.repeatLessons)
    ? input.repeatLessons
        .map((repeatLesson) => {
          const repeatDuration = Number(
            repeatLesson.durationMinutes ?? duration
          );

          return {
            date: repeatLesson.date?.trim() ?? "",
            time: repeatLesson.time?.trim() || input.tijd,
            duration: Number.isFinite(repeatDuration)
              ? repeatDuration
              : duration,
          };
        })
        .filter((repeatLesson) => repeatLesson.date)
    : [];

  if (repeatLessonValues.length === 0 && Array.isArray(input.repeatDates)) {
    repeatLessonValues = input.repeatDates
      .map((dateValue) => ({
        date: dateValue.trim(),
        time: input.tijd,
        duration,
      }))
      .filter((repeatLesson) => repeatLesson.date);
  }

  if (repeatLessonValues.length === 0 && legacyRepeatCount > 0) {
    if (!repeatStartDate || repeatStartDate <= input.datum) {
      return {
        success: false,
        message: "Kies een eerste herhalingsdatum na de originele lesdatum.",
      };
    }

    const legacyRepeatLessonValues: Array<{
      date: string;
      time: string;
      duration: number;
    }> = [];

    for (let repeatIndex = 0; repeatIndex < legacyRepeatCount; repeatIndex += 1) {
      const nextDate = addDaysToDateValue(repeatStartDate, repeatIndex * 7);

      if (!nextDate) {
        return {
          success: false,
          message: "De datums voor de herhalingslessen konden niet worden bepaald.",
        };
      }

      legacyRepeatLessonValues.push({
        date: nextDate,
        time: input.tijd,
        duration,
      });
    }

    repeatLessonValues = legacyRepeatLessonValues;
  }

  if (repeatLessonValues.length > MAX_REPEAT_LESSONS) {
    return {
      success: false,
      message: "Je kunt maximaal 12 volgende lessen tegelijk maken.",
    };
  }

  if (repeatLessonValues.length > 0 && input.status === "geannuleerd") {
    return {
      success: false,
      message: "Volgende lessen kunnen niet worden aangemaakt bij een annulering.",
    };
  }

  const seenRepeatMoments = new Set<string>();

  for (let repeatIndex = 0; repeatIndex < repeatLessonValues.length; repeatIndex += 1) {
    const repeatLesson = repeatLessonValues[repeatIndex];
    const repeatDate = repeatLesson.date;
    const parsedRepeatDate = new Date(`${repeatDate}T12:00:00`);

    if (Number.isNaN(parsedRepeatDate.getTime())) {
      return {
        success: false,
        message: `Volgende les ${repeatIndex + 1} heeft geen geldige datum.`,
      };
    }

    if (repeatDate <= input.datum) {
      return {
        success: false,
        message: `Kies voor volgende les ${repeatIndex + 1} een datum na de originele lesdatum.`,
      };
    }

    if (!toLocalDateTime(repeatDate, repeatLesson.time)) {
      return {
        success: false,
        message: `Volgende les ${repeatIndex + 1} heeft geen geldige tijd.`,
      };
    }

    if (
      !Number.isFinite(repeatLesson.duration) ||
      repeatLesson.duration < 30 ||
      repeatLesson.duration > 240
    ) {
      return {
        success: false,
        message: `Volgende les ${repeatIndex + 1} heeft geen geldige duur.`,
      };
    }

    const repeatMomentKey = `${repeatDate}-${repeatLesson.time}`;

    if (seenRepeatMoments.has(repeatMomentKey)) {
      return {
        success: false,
        message: `Volgende les ${repeatIndex + 1} gebruikt hetzelfde moment dubbel.`,
      };
    }

    seenRepeatMoments.add(repeatMomentKey);
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

  const nextLearnerId = input.leerlingId?.trim() || lesson.leerling_id;
  const learnerChanged =
    Boolean(nextLearnerId) && nextLearnerId !== lesson.leerling_id;
  const nextTitle = input.title?.trim() || lesson.titel;
  const nextIsTrialLesson = nextTitle.toLowerCase().includes("proefles");

  if (nextIsTrialLesson && repeatLessonValues.length > 0) {
    return {
      success: false,
      message: "Een proefles is een eenmalig startmoment. Maak hier geen volgende lessen van.",
    };
  }

  if (nextLearnerId && learnerChanged) {
    const hasRelationship = await hasInstructorStudentPlanningRelationship(
      instructeur.id,
      nextLearnerId
    );

    if (!hasRelationship) {
      return {
        success: false,
        message:
          "Koppel deze leerling eerst aan jouw werkplek voordat je de les kunt overzetten.",
      };
    }
  }

  if (nextIsTrialLesson && nextLearnerId && input.status !== "geannuleerd") {
    const trialState = await getLearnerTrialLessonState({
      actor: "instructor",
      excludeLessonId: lesson.id,
      supabase,
      leerlingId: nextLearnerId,
    });

    if (!trialState.available) {
      return {
        success: false,
        message: trialState.message,
      };
    }
  }

  if (input.status !== "geannuleerd") {
    const schedulingConflict = await findSchedulingConflict({
      instructorId: instructeur.id,
      learnerId: nextLearnerId,
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

  const repeatedLessons: Array<{
    startAt: string;
    endAt: string;
    duration: number;
  }> = [];

  if (repeatLessonValues.length > 0) {
    if (!nextLearnerId) {
      return {
        success: false,
        message: "Kies eerst een leerling voordat je volgende lessen maakt.",
      };
    }

    for (let repeatIndex = 0; repeatIndex < repeatLessonValues.length; repeatIndex += 1) {
      const nextRepeatLesson = repeatLessonValues[repeatIndex];
      const repeatStartAt = toLocalDateTime(
        nextRepeatLesson.date,
        nextRepeatLesson.time
      );
      const repeatEndAt = repeatStartAt
        ? getLessonEndAt(repeatStartAt, nextRepeatLesson.duration)
        : null;

      if (!repeatStartAt || !repeatEndAt) {
        return {
          success: false,
          message: "De tijd van een volgende les kon niet worden bepaald.",
        };
      }

      const repeatConflict = await findSchedulingConflict({
        instructorId: instructeur.id,
        learnerId: nextLearnerId,
        startAt: repeatStartAt,
        endAt: repeatEndAt,
        includeRequestHolds: false,
        supabase,
      });

      if (repeatConflict.hasConflict) {
        return {
          success: false,
          message: `Volgende les ${repeatIndex + 1} op ${formatDateValue(nextRepeatLesson.date)} om ${nextRepeatLesson.time} botst met een andere planning.`,
        };
      }

      repeatedLessons.push({
        startAt: repeatStartAt,
        endAt: repeatEndAt,
        duration: nextRepeatLesson.duration,
      });
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
      leerling_id: nextLearnerId,
      titel: nextTitle,
      start_at: startAt,
      duur_minuten: duration,
      status: input.status,
      locatie_id: locationId,
    } as never)
    .eq("id", input.lessonId)
    .eq("instructeur_id", instructeur.id);

  if (error) {
    logSupabaseDataError("lessonManagement.updateLesson", error, {
      lessonId: input.lessonId,
      instructeurId: instructeur.id,
    });
    return {
      success: false,
      message: "De les kon niet worden bijgewerkt.",
    };
  }

  if (repeatedLessons.length > 0) {
    const { error: repeatError } = await supabase.from("lessen").insert(
      repeatedLessons.map((repeatLesson) => ({
        leerling_id: nextLearnerId,
        instructeur_id: instructeur.id,
        titel: nextTitle,
        start_at: repeatLesson.startAt,
        duur_minuten: repeatLesson.duration,
        status: "ingepland",
        locatie_id: locationId,
      })) as never
    );

    if (repeatError) {
      logSupabaseDataError("lessonManagement.repeatLessons", repeatError, {
        lessonId: input.lessonId,
        instructeurId: instructeur.id,
        repeatCount: repeatedLessons.length,
      });
      return {
        success: false,
        message:
          "De les is bijgewerkt, maar de volgende lessen konden niet worden aangemaakt.",
      };
    }
  }

  await syncLinkedRequestStatus(
    extractLessonRequestReference(lesson.notities),
    input.status,
    input.reason
  );

  const instructorName = context.profile?.volledige_naam || "Je instructeur";
  let suggestedRescheduleTimes: string[] = [];

  if (input.status === "geannuleerd" && nextLearnerId) {
    try {
      const [availabilitySlots, instructorLessons] = await Promise.all([
        getCurrentInstructorAvailability(),
        getInstructeurLessons(),
      ]);
      const lessonForProposal =
        instructorLessons.find((item) => item.id === lesson.id) ??
        ({
          id: lesson.id,
          titel: nextTitle,
          datum: input.datum,
          tijd: input.tijd,
          start_at: startAt,
          end_at: endAt,
          duur_minuten: duration,
          status: input.status,
          locatie: locationSummary,
          locatie_id: locationId,
          leerling_id: nextLearnerId,
          leerling_naam: "Leerling",
          instructeur_naam: instructorName,
        } satisfies Les);

      suggestedRescheduleTimes = findBestLessonRescheduleOptions({
        lesson: lessonForProposal,
        lessons: instructorLessons,
        slots: availabilitySlots,
      }).map((option) => option.label);

      await sendAutomaticRescheduleProposalMessage({
        instructorName,
        learnerId: nextLearnerId,
        lessonTitle: nextTitle,
        proposalLabels: suggestedRescheduleTimes,
        senderProfileId: context.user.id,
        supabase,
      });
    } catch (error) {
      console.error("Automatic reschedule proposal failed", error);
    }
  }

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
        leerlingId: nextLearnerId,
        instructeurNaam: instructorName,
        datum: input.datum,
        tijd: input.tijd,
        lesTitel: nextTitle,
      });
    }
  } else {
    if (learnerChanged && lesson.leerling_id) {
      await notifyLearnerAboutLessonChange({
        supabase,
        leerlingId: lesson.leerling_id,
        instructeurNaam: instructorName,
        datum: input.datum,
        tijd: input.tijd,
        locatie: locationSummary,
        status: "geannuleerd",
        reason: "Deze les is overgezet naar een andere leerling.",
      });
    }

    await notifyLearnerAboutLessonChange({
      supabase,
      leerlingId: nextLearnerId,
      instructeurNaam: instructorName,
      datum: input.datum,
      tijd: input.tijd,
      locatie: locationSummary,
      status: input.status,
      reason: input.reason,
      suggestedTimes: suggestedRescheduleTimes,
    });
  }

  await syncStudentDriverJourneyStatus(nextLearnerId);

  if (learnerChanged) {
    await syncStudentDriverJourneyStatus(lesson.leerling_id);
  }

  revalidateLessonViews();

  return {
    success: true,
    message:
      input.status === "geannuleerd"
        ? "De les is geannuleerd."
        : repeatedLessons.length > 0
          ? `De les is bijgewerkt en ${repeatedLessons.length} volgende les${repeatedLessons.length === 1 ? "" : "sen"} zijn ingepland.`
        : "De les is bijgewerkt.",
    progressHref:
      input.status === "afgerond"
        ? getLessonProgressHref({
            dateValue: input.datum,
            learnerId: nextLearnerId,
            lessonId: input.lessonId,
          })
        : null,
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
    logSupabaseDataError("lessonManagement.updateAttendance", error, {
      lessonId: input.lessonId,
      instructeurId: instructeur.id,
      attendanceStatus: input.attendanceStatus,
    });
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

  await evaluateStudentTrajectorySignals({
    supabase,
    leerlingId: lesson.leerling_id,
    instructeurId: instructeur.id,
    instructeurNaam: context.profile?.volledige_naam,
  });
  await syncStudentDriverJourneyStatus(lesson.leerling_id);

  revalidateLessonViews();

  return {
    success: true,
    message:
      input.attendanceStatus === "aanwezig"
        ? "Les bevestigd als aanwezig en afgerond."
        : "Les bevestigd als afwezig en afgerond.",
    progressHref: getLessonProgressHref({
      dateValue: lesson.start_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      learnerId: lesson.leerling_id,
      lessonId: input.lessonId,
    }),
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
    logSupabaseDataError("lessonManagement.saveMomentNote", error, {
      lessonId: input.lessonId,
      instructeurId: instructeur.id,
    });
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
