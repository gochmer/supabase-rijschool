"use server";

import { revalidatePath } from "next/cache";

import {
  createAvailabilityTimestamp,
  formatAvailabilityWindow,
  getAvailabilityDateValue,
} from "@/lib/availability";
import { parseRequestWindow } from "@/lib/booking-availability";
import {
  buildRecurringAvailabilitySlotFromRule,
  parseWeekRuleSlotId,
} from "@/lib/availability-week-rules";
import { findSchedulingConflict } from "@/lib/data/scheduling-conflicts";
import { getLearnerInstructorSchedulingAccess } from "@/lib/data/student-scheduling";
import {
  ensureCurrentUserContext,
  getCurrentLeerlingRecord,
} from "@/lib/data/profiles";
import {
  appendRequestUpdateMessage,
  buildLessonRequestReference,
} from "@/lib/lesson-request-flow";
import {
  notifyInstructorAboutDirectBooking,
  notifyInstructorAboutNewRequest,
} from "@/lib/notification-events";
import { createServerClient } from "@/lib/supabase/server";

type CreateLessonRequestInput = {
  instructorSlug: string;
  datum?: string;
  tijdvak?: string;
  slotId?: string;
  bericht?: string;
  packageId?: string;
  requestType?: "algemeen" | "proefles";
};

type CreateDirectLessonBookingInput = {
  instructorSlug: string;
  slotId: string;
  bericht?: string;
  packageId?: string;
  requestType?: "algemeen" | "proefles";
};

type MutateLessonRequestInput = {
  requestId: string;
  reden?: string;
  datum?: string;
  tijdvak?: string;
};

type ReschedulableLessonRequestRow = {
  id: string;
  status: "aangevraagd" | "geaccepteerd" | "ingepland" | "afgerond" | "geweigerd" | "geannuleerd";
  bericht: string | null;
  instructeur_id: string | null;
  pakket_id: string | null;
};

type DuplicateLessonRequestRow = {
  id: string;
  pakket_id: string | null;
  voorkeursdatum: string | null;
  tijdvak: string | null;
};

function revalidateLessonRequestPaths(instructorSlug?: string) {
  revalidatePath("/leerling/boekingen");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/instructeur/aanvragen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/instructeur/lessen");
  revalidatePath("/leerling/instructeurs");

  if (instructorSlug) {
    revalidatePath(`/instructeurs/${instructorSlug}`);
  }
}

function getLessonRequestTitle({
  packageName,
  requestType,
}: {
  packageName?: string | null;
  requestType: "algemeen" | "proefles" | "pakket";
}) {
  if (packageName?.trim()) {
    return packageName.trim();
  }

  if (requestType === "proefles") {
    return "Proefles";
  }

  return "Rijles";
}

async function resolveRequestedLessonMoment(params: {
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  instructorId: string;
  datum?: string | null;
  tijdvak?: string | null;
  slotId?: string | null;
}) {
  let voorkeursdatum = params.datum?.trim() ?? "";
  let tijdvak = params.tijdvak?.trim() ?? "";
  let startAt: string | null = null;
  let endAt: string | null = null;

  if (params.slotId?.trim()) {
    const recurringReference = parseWeekRuleSlotId(params.slotId.trim());

    if (recurringReference) {
      const { data: rule } = (await params.supabase
        .from("beschikbaarheid_weekroosters")
        .select(
          "id, instructeur_id, weekdag, start_tijd, eind_tijd, pauze_start_tijd, pauze_eind_tijd, beschikbaar, actief"
        )
        .eq("id", recurringReference.ruleId)
        .maybeSingle()) as unknown as {
        data:
          | {
              id: string;
              instructeur_id: string;
              weekdag: 1 | 2 | 3 | 4 | 5 | 6 | 7;
              start_tijd: string;
              eind_tijd: string;
              pauze_start_tijd: string | null;
              pauze_eind_tijd: string | null;
              beschikbaar: boolean;
              actief: boolean;
            }
          | null;
      };

      if (!rule || rule.instructeur_id !== params.instructorId) {
        return {
          success: false as const,
          message: "Deze vaste weekplanning hoort niet bij deze instructeur.",
        };
      }

      if (!rule.actief || !rule.beschikbaar) {
        return {
          success: false as const,
          message: "Dit geplande moment is niet meer beschikbaar.",
        };
      }

      const recurringSlot = buildRecurringAvailabilitySlotFromRule({
        rule,
        dateValue: recurringReference.dateValue,
        segmentIndex: recurringReference.segmentIndex,
      });

      if (!recurringSlot) {
        return {
          success: false as const,
          message: "Dit geplande moment kon niet worden opgebouwd.",
        };
      }

      const dayStartAt = createAvailabilityTimestamp(
        recurringReference.dateValue,
        "00:00"
      );
      const dayEndAt = createAvailabilityTimestamp(
        recurringReference.dateValue,
        "23:59"
      );
      const { data: dayOverrides } = await params.supabase
        .from("beschikbaarheid")
        .select("id, start_at, eind_at")
        .eq("instructeur_id", params.instructorId)
        .gte("start_at", dayStartAt)
        .lte("start_at", dayEndAt);

      const hasOverrideConflict = (dayOverrides ?? []).some((overrideSlot) => {
        return (
          new Date(overrideSlot.start_at).getTime() <
            new Date(recurringSlot.eind_at).getTime() &&
          new Date(overrideSlot.eind_at).getTime() >
            new Date(recurringSlot.start_at).getTime()
        );
      });

      if (hasOverrideConflict) {
        return {
          success: false as const,
          message: "Dit geplande moment is intussen aangepast of afgeschermd.",
        };
      }

      voorkeursdatum = recurringReference.dateValue;
      tijdvak = formatAvailabilityWindow(
        recurringSlot.start_at,
        recurringSlot.eind_at
      );
      startAt = recurringSlot.start_at;
      endAt = recurringSlot.eind_at;
    } else {
      const { data: slot } = await params.supabase
        .from("beschikbaarheid")
        .select("id, instructeur_id, start_at, eind_at, beschikbaar")
        .eq("id", params.slotId.trim())
        .maybeSingle();

      if (!slot || slot.instructeur_id !== params.instructorId) {
        return {
          success: false as const,
          message: "Dit tijdslot hoort niet bij deze instructeur.",
        };
      }

      if (!slot.beschikbaar) {
        return {
          success: false as const,
          message: "Dit tijdslot is niet meer beschikbaar.",
        };
      }

      voorkeursdatum = getAvailabilityDateValue(slot.start_at);
      tijdvak = formatAvailabilityWindow(slot.start_at, slot.eind_at);
      startAt = slot.start_at;
      endAt = slot.eind_at;
    }
  }

  if (!voorkeursdatum || !tijdvak) {
    return {
      success: false as const,
      message: "Kies een datum en tijdvak voor je aanvraag.",
    };
  }

  if (!startAt || !endAt) {
    const parsedRequestWindow = parseRequestWindow(voorkeursdatum, tijdvak);
    startAt = parsedRequestWindow.startAt;
    endAt = parsedRequestWindow.endAt;
  }

  if (!startAt || !endAt) {
    return {
      success: false as const,
      message: "Dit aangevraagde moment kon niet goed worden verwerkt.",
    };
  }

  return {
    success: true as const,
    voorkeursdatum,
    tijdvak,
    startAt,
    endAt,
  };
}

export async function cancelLessonRequestAction(input: MutateLessonRequestInput) {
  const context = await ensureCurrentUserContext();

  if (!context || context.role !== "leerling") {
    return { success: false, message: "Alleen leerlingen kunnen een aanvraag annuleren." };
  }

  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return { success: false, message: "Je leerlingprofiel kon niet worden gevonden." };
  }

  const supabase = await createServerClient();
  const { data: request } = await supabase
    .from("lesaanvragen")
    .select("id, status, bericht")
    .eq("id", input.requestId)
    .eq("leerling_id", leerling.id)
    .maybeSingle();

  if (!request) {
    return { success: false, message: "Deze aanvraag kon niet worden gevonden." };
  }

  if (request.status !== "aangevraagd") {
    return { success: false, message: "Alleen open aanvragen kunnen worden geannuleerd." };
  }

  if (!input.reden?.trim()) {
    return {
      success: false,
      message: "Geef een reden mee bij het annuleren van een aanvraag.",
    };
  }

  const { error } = await supabase
    .from("lesaanvragen")
    .update({
      status: "geannuleerd",
      bericht: appendRequestUpdateMessage(
        request.bericht,
        "Geannuleerd door leerling",
        input.reden
      ),
    } as never)
    .eq("id", input.requestId)
    .eq("leerling_id", leerling.id);

  if (error) {
    return { success: false, message: "De aanvraag kon niet worden geannuleerd." };
  }

  revalidateLessonRequestPaths();
  return { success: true, message: "Je aanvraag is geannuleerd." };
}

export async function rescheduleLessonRequestAction(input: MutateLessonRequestInput) {
  const context = await ensureCurrentUserContext();

  if (!context || context.role !== "leerling") {
    return { success: false, message: "Alleen leerlingen kunnen een aanvraag verplaatsen." };
  }

  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return { success: false, message: "Je leerlingprofiel kon niet worden gevonden." };
  }

  const datum = input.datum?.trim() ?? "";
  const tijdvak = input.tijdvak?.trim() ?? "";

  if (!datum || !tijdvak) {
    return { success: false, message: "Kies een nieuwe datum en tijdvak." };
  }

  const supabase = await createServerClient();
  const { data: request } = (await supabase
    .from("lesaanvragen")
    .select("id, status, bericht, instructeur_id, pakket_id")
    .eq("id", input.requestId)
    .eq("leerling_id", leerling.id)
    .maybeSingle()) as unknown as {
    data: ReschedulableLessonRequestRow | null;
  };

  if (!request) {
    return { success: false, message: "Deze aanvraag kon niet worden gevonden." };
  }

  if (request.status !== "aangevraagd") {
    return { success: false, message: "Alleen open aanvragen kunnen worden verplaatst." };
  }

  if (!request.instructeur_id) {
    return {
      success: false,
      message: "Deze aanvraag mist instructeurgegevens en kan niet worden verplaatst.",
    };
  }

  const { data: existingRequests } = (await supabase
    .from("lesaanvragen")
    .select("id, pakket_id, voorkeursdatum, tijdvak")
    .eq("leerling_id", leerling.id)
    .eq("instructeur_id", request.instructeur_id)
    .neq("id", input.requestId)
    .in("status", ["aangevraagd", "geaccepteerd", "ingepland"])) as unknown as {
    data: DuplicateLessonRequestRow[] | null;
  };

  const hasDuplicatePackage = request.pakket_id
    ? (existingRequests ?? []).some((item) => item.pakket_id === request.pakket_id)
    : false;
  const hasDuplicateSlot = (existingRequests ?? []).some(
    (item) => item.voorkeursdatum === datum && item.tijdvak === tijdvak
  );

  if (hasDuplicatePackage) {
    return {
      success: false,
      message: "Je hebt al een andere open aanvraag voor dit pakket.",
    };
  }

  if (hasDuplicateSlot) {
    return {
      success: false,
      message: "Je hebt al een andere open aanvraag op dit tijdslot.",
    };
  }

  const requestedWindow = parseRequestWindow(datum, tijdvak);

  if (!requestedWindow.startAt || !requestedWindow.endAt) {
    return {
      success: false,
      message: "Dit nieuwe tijdslot kon niet goed worden gelezen.",
    };
  }

  const schedulingConflict = await findSchedulingConflict({
    instructorId: request.instructeur_id,
    learnerId: leerling.id,
    startAt: requestedWindow.startAt,
    endAt: requestedWindow.endAt,
    ignoreRequestId: input.requestId,
    supabase,
  });

  if (schedulingConflict.hasConflict) {
    return {
      success: false,
      message: schedulingConflict.message,
    };
  }

  const { error } = await supabase
    .from("lesaanvragen")
    .update({
      voorkeursdatum: datum,
      tijdvak,
      bericht: appendRequestUpdateMessage(
        request.bericht,
        "Leerling heeft een nieuw voorkeursmoment gekozen",
        input.reden
      ),
    } as never)
    .eq("id", input.requestId)
    .eq("leerling_id", leerling.id);

  if (error) {
    return { success: false, message: "De aanvraag kon niet worden verplaatst." };
  }

  revalidateLessonRequestPaths();
  return { success: true, message: "Je nieuwe voorkeursmoment is opgeslagen." };
}

export async function createLessonRequestAction(input: CreateLessonRequestInput) {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return {
      success: false,
      message: "Log eerst in om een lesaanvraag te versturen.",
    };
  }

  if (context.role !== "leerling") {
    return {
      success: false,
      message: "Alleen leerlingen kunnen een lesaanvraag versturen.",
    };
  }

  const supabase = await createServerClient();
  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return {
      success: false,
      message: "Je leerlingprofiel kon niet worden gevonden.",
    };
  }

  const { data: instructeur } = await supabase
    .from("instructeurs")
    .select("id")
    .eq("slug", input.instructorSlug)
    .maybeSingle();

  if (!instructeur) {
    return {
      success: false,
      message: "Deze instructeur is niet gevonden.",
    };
  }

  const requestType = input.requestType === "proefles" ? "proefles" : "algemeen";
  let selectedPackage:
    | {
        id: string;
        naam: string;
        les_type: string | null;
      }
    | null = null;

  if (input.packageId?.trim()) {
    const { data: packageRow } = (await supabase
      .from("pakketten")
      .select("id, naam, les_type, instructeur_id, actief")
      .eq("id", input.packageId.trim())
      .maybeSingle()) as unknown as {
      data:
        | {
            id: string;
            naam: string;
            les_type: string | null;
            instructeur_id: string | null;
            actief: boolean | null;
          }
        | null;
    };

    if (!packageRow || packageRow.instructeur_id !== instructeur.id) {
      return {
        success: false,
        message: "Dit pakket hoort niet bij deze instructeur.",
      };
    }

    if (packageRow.actief === false) {
      return {
        success: false,
        message: "Dit pakket is niet meer beschikbaar.",
      };
    }

    selectedPackage = {
      id: packageRow.id,
      naam: packageRow.naam,
      les_type: packageRow.les_type,
    };
  }

  const resolvedMoment = await resolveRequestedLessonMoment({
    supabase,
    instructorId: instructeur.id,
    datum: input.datum,
    tijdvak: input.tijdvak,
    slotId: input.slotId,
  });

  if (!resolvedMoment.success) {
    return {
      success: false,
      message: resolvedMoment.message,
    };
  }

  const { voorkeursdatum, tijdvak, startAt: requestedStartAt, endAt: requestedEndAt } =
    resolvedMoment;

  const { data: existingRequests } = (await supabase
    .from("lesaanvragen")
    .select("id, pakket_id, voorkeursdatum, tijdvak")
    .eq("leerling_id", leerling.id)
    .eq("instructeur_id", instructeur.id)
    .in("status", ["aangevraagd", "geaccepteerd", "ingepland"])) as unknown as {
    data: DuplicateLessonRequestRow[] | null;
  };

  const hasDuplicatePackage = selectedPackage?.id
    ? (existingRequests ?? []).some(
        (request) => request.pakket_id === selectedPackage.id
      )
    : false;
  const hasDuplicateSlot = (existingRequests ?? []).some(
    (request) =>
      request.voorkeursdatum === voorkeursdatum && request.tijdvak === tijdvak
  );

  if (hasDuplicatePackage) {
    return {
      success: false,
      message: "Je hebt al een open aanvraag voor dit pakket.",
    };
  }

  if (hasDuplicateSlot) {
    return {
      success: false,
      message: "Je hebt al een open aanvraag voor dit tijdslot.",
    };
  }

  const schedulingConflict = await findSchedulingConflict({
    instructorId: instructeur.id,
    learnerId: leerling.id,
    startAt: requestedStartAt,
    endAt: requestedEndAt,
    supabase,
  });

  if (schedulingConflict.hasConflict) {
    return {
      success: false,
      message: schedulingConflict.message,
    };
  }

  const { error } = await supabase.from("lesaanvragen").insert({
    leerling_id: leerling.id,
    instructeur_id: instructeur.id,
    voorkeursdatum,
    tijdvak,
    bericht: input.bericht?.trim() || null,
    status: "aangevraagd",
    aanvraag_type: selectedPackage ? "pakket" : requestType,
    pakket_id: selectedPackage?.id ?? null,
    pakket_naam_snapshot:
      selectedPackage?.naam ?? (requestType === "proefles" ? "Proefles" : null),
    les_type: selectedPackage?.les_type ?? null,
  } as never);

  if (error) {
    return {
      success: false,
      message: "De lesaanvraag kon niet worden opgeslagen.",
    };
  }

  await notifyInstructorAboutNewRequest({
    supabase,
    instructeurId: instructeur.id,
    leerlingNaam: context.profile?.volledige_naam || "Leerling",
    voorkeursdatum,
    tijdvak,
    pakketNaam: selectedPackage?.naam ?? null,
    aanvraagType: selectedPackage ? "pakket" : requestType,
    lesType: selectedPackage?.les_type ?? null,
    bericht: input.bericht?.trim() || null,
  });

  revalidateLessonRequestPaths(input.instructorSlug);

  return {
    success: true,
    message: selectedPackage
      ? `Je aanvraag voor ${selectedPackage.naam} is verstuurd.`
      : requestType === "proefles"
        ? "Je proeflesaanvraag is verstuurd."
      : "Je lesaanvraag is verstuurd.",
  };
}

export async function createDirectLessonBookingAction(
  input: CreateDirectLessonBookingInput
) {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return {
      success: false,
      message: "Log eerst in om direct een les te boeken.",
    };
  }

  if (context.role !== "leerling") {
    return {
      success: false,
      message: "Alleen leerlingen kunnen direct een les boeken.",
    };
  }

  const supabase = await createServerClient();
  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return {
      success: false,
      message: "Je leerlingprofiel kon niet worden gevonden.",
    };
  }

  const { data: instructeur } = await supabase
    .from("instructeurs")
    .select("id, online_boeken_actief")
    .eq("slug", input.instructorSlug)
    .maybeSingle();

  if (!instructeur) {
    return {
      success: false,
      message: "Deze instructeur is niet gevonden.",
    };
  }

  const planningAccess = await getLearnerInstructorSchedulingAccess(
    instructeur.id,
    leerling.id
  );

  if (!planningAccess.directBookingAllowed) {
    return {
      success: false,
      message:
        "Direct online inplannen staat op dit moment nog niet aan bij deze instructeur.",
    };
  }

  const requestType = input.requestType === "proefles" ? "proefles" : "algemeen";
  let selectedPackage:
    | {
        id: string;
        naam: string;
        les_type: string | null;
      }
    | null = null;

  if (input.packageId?.trim()) {
    const { data: packageRow } = (await supabase
      .from("pakketten")
      .select("id, naam, les_type, instructeur_id, actief")
      .eq("id", input.packageId.trim())
      .maybeSingle()) as unknown as {
      data:
        | {
            id: string;
            naam: string;
            les_type: string | null;
            instructeur_id: string | null;
            actief: boolean | null;
          }
        | null;
    };

    if (!packageRow || packageRow.instructeur_id !== instructeur.id) {
      return {
        success: false,
        message: "Dit pakket hoort niet bij deze instructeur.",
      };
    }

    if (packageRow.actief === false) {
      return {
        success: false,
        message: "Dit pakket is niet meer beschikbaar.",
      };
    }

    selectedPackage = {
      id: packageRow.id,
      naam: packageRow.naam,
      les_type: packageRow.les_type,
    };
  }

  const resolvedMoment = await resolveRequestedLessonMoment({
    supabase,
    instructorId: instructeur.id,
    slotId: input.slotId,
  });

  if (!resolvedMoment.success) {
    return {
      success: false,
      message: resolvedMoment.message,
    };
  }

  const { voorkeursdatum, tijdvak, startAt, endAt } = resolvedMoment;
  const { data: existingRequests } = (await supabase
    .from("lesaanvragen")
    .select("id, pakket_id, voorkeursdatum, tijdvak")
    .eq("leerling_id", leerling.id)
    .eq("instructeur_id", instructeur.id)
    .in("status", ["aangevraagd", "geaccepteerd", "ingepland"])) as unknown as {
    data: DuplicateLessonRequestRow[] | null;
  };

  const hasDuplicatePackage = selectedPackage?.id
    ? (existingRequests ?? []).some(
        (request) => request.pakket_id === selectedPackage.id
      )
    : false;
  const hasDuplicateSlot = (existingRequests ?? []).some(
    (request) =>
      request.voorkeursdatum === voorkeursdatum && request.tijdvak === tijdvak
  );

  if (hasDuplicatePackage) {
    return {
      success: false,
      message: "Je hebt al een actieve boeking of aanvraag voor dit pakket.",
    };
  }

  if (hasDuplicateSlot) {
    return {
      success: false,
      message: "Dit tijdslot is al door jou vastgezet in een andere boeking of aanvraag.",
    };
  }

  const schedulingConflict = await findSchedulingConflict({
    instructorId: instructeur.id,
    learnerId: leerling.id,
    startAt,
    endAt,
    supabase,
  });

  if (schedulingConflict.hasConflict) {
    return {
      success: false,
      message: schedulingConflict.message,
    };
  }

  const bookingTitle = getLessonRequestTitle({
    packageName: selectedPackage?.naam ?? null,
    requestType: selectedPackage ? "pakket" : requestType,
  });

  const { data: insertedRequest, error: requestError } = await supabase
    .from("lesaanvragen")
    .insert({
      leerling_id: leerling.id,
      instructeur_id: instructeur.id,
      voorkeursdatum,
      tijdvak,
      bericht: input.bericht?.trim() || null,
      status: "ingepland",
      aanvraag_type: selectedPackage ? "pakket" : requestType,
      pakket_id: selectedPackage?.id ?? null,
      pakket_naam_snapshot:
        selectedPackage?.naam ?? (requestType === "proefles" ? "Proefles" : null),
      les_type: selectedPackage?.les_type ?? null,
    } as never)
    .select("id")
    .single();

  if (requestError || !insertedRequest) {
    return {
      success: false,
      message: "De directe boeking kon niet worden opgeslagen.",
    };
  }

  const durationMinutes = Math.max(
    30,
    Math.round(
      (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000
    )
  );

  const { error: lessonError } = await supabase.from("lessen").insert({
    leerling_id: leerling.id,
    instructeur_id: instructeur.id,
    titel: bookingTitle,
    start_at: startAt,
    duur_minuten: durationMinutes,
    status: "ingepland",
    notities: buildLessonRequestReference(insertedRequest.id),
  } as never);

  if (lessonError) {
    await supabase.from("lesaanvragen").delete().eq("id", insertedRequest.id);

    return {
      success: false,
      message: "De les kon niet direct worden ingepland.",
    };
  }

  await notifyInstructorAboutDirectBooking({
    supabase,
    instructeurId: instructeur.id,
    leerlingNaam: context.profile?.volledige_naam || "Leerling",
    voorkeursdatum,
    tijdvak,
    pakketNaam: selectedPackage?.naam ?? null,
    aanvraagType: selectedPackage ? "pakket" : requestType,
    lesType: selectedPackage?.les_type ?? null,
    bericht: input.bericht?.trim() || null,
  });

  revalidateLessonRequestPaths(input.instructorSlug);

  return {
    success: true,
    message:
      requestType === "proefles"
        ? "Je proefles staat direct ingepland."
        : selectedPackage
          ? `${selectedPackage.naam} staat direct ingepland.`
          : "Je les staat direct ingepland.",
  };
}
