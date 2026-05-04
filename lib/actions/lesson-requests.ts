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
  buildRecurringAvailabilitySlots,
  parseWeekRuleSlotId,
} from "@/lib/availability-week-rules";
import { findSchedulingConflict } from "@/lib/data/scheduling-conflicts";
import { syncStudentDriverJourneyStatus } from "@/lib/data/driver-journey";
import {
  getLearnerInstructorBookingLimitSnapshot,
  getLearnerInstructorSchedulingAccess,
  hasLearnerUsedTrialLesson,
} from "@/lib/data/student-scheduling";
import {
  ensureCurrentUserContext,
  getCurrentLeerlingRecord,
} from "@/lib/data/profiles";
import {
  appendRequestUpdateMessage,
  buildLessonRequestReference,
} from "@/lib/lesson-request-flow";
import {
  getLessonDurationForKind,
  type LessonDurationKind,
} from "@/lib/lesson-durations";
import {
  formatMinutesAsHoursLabel,
  getRemainingWeeklyBookingMinutes,
  getWeekStartKey,
  getWeekRangeLabel,
} from "@/lib/self-scheduling-limits";
import {
  notifyInstructorAboutDirectBooking,
  notifyInstructorAboutNewRequest,
} from "@/lib/notification-events";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { BeschikbaarheidWeekrooster, LesStatus } from "@/lib/types";

type CreateLessonRequestInput = {
  instructorSlug: string;
  datum?: string;
  tijdvak?: string;
  slotId?: string;
  startAt?: string;
  endAt?: string;
  bericht?: string;
  packageId?: string;
  requestType?: "algemeen" | "proefles";
};

type CreateDirectLessonBookingInput = {
  instructorSlug: string;
  slotId: string;
  startAt?: string;
  endAt?: string;
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
  status: LesStatus;
};

type InstructorDurationRow = {
  id: string;
  online_boeken_actief?: boolean | null;
  standaard_rijles_duur_minuten?: number | null;
  standaard_proefles_duur_minuten?: number | null;
  standaard_pakketles_duur_minuten?: number | null;
  standaard_examenrit_duur_minuten?: number | null;
};

type LessonBookingPackage = {
  id: string;
  naam: string;
  les_type: string | null;
};

const PACKAGE_REQUIRED_MESSAGE =
  "Kies eerst een lespakket voordat je vervolglessen kunt plannen. Je proefles blijft beschikbaar zolang je die nog niet hebt gebruikt.";

async function getInstructorLessonPackage(params: {
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  instructorId: string;
  packageId: string;
}) {
  const { data: packageRow } = (await params.supabase
    .from("pakketten")
    .select("id, naam, les_type, instructeur_id, actief")
    .eq("id", params.packageId)
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

  if (!packageRow || packageRow.instructeur_id !== params.instructorId) {
    return {
      success: false as const,
      message: "Dit pakket hoort niet bij deze instructeur.",
    };
  }

  if (packageRow.actief === false) {
    return {
      success: false as const,
      message: "Dit pakket is niet meer beschikbaar.",
    };
  }

  return {
    success: true as const,
    package: {
      id: packageRow.id,
      naam: packageRow.naam,
      les_type: packageRow.les_type,
    } satisfies LessonBookingPackage,
  };
}

async function resolveLessonPackageForRequest(params: {
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  instructorId: string;
  learnerPackageId: string | null;
  requestedPackageId?: string | null;
  requestType: "algemeen" | "proefles";
}) {
  const requestedPackageId = params.requestedPackageId?.trim() ?? "";

  if (requestedPackageId) {
    const packageResult = await getInstructorLessonPackage({
      supabase: params.supabase,
      instructorId: params.instructorId,
      packageId: requestedPackageId,
    });

    if (!packageResult.success) {
      return packageResult;
    }

    return {
      success: true as const,
      package: packageResult.package,
      isPackageSelection: true,
    };
  }

  if (params.requestType === "proefles") {
    return {
      success: true as const,
      package: null,
      isPackageSelection: false,
    };
  }

  if (!params.learnerPackageId) {
    return {
      success: false as const,
      message: PACKAGE_REQUIRED_MESSAGE,
    };
  }

  const packageResult = await getInstructorLessonPackage({
    supabase: params.supabase,
    instructorId: params.instructorId,
    packageId: params.learnerPackageId,
  });

  if (!packageResult.success) {
    return {
      success: false as const,
      message:
        "Je gekoppelde pakket hoort niet bij deze instructeur. Vraag je instructeur om het juiste pakket te koppelen.",
    };
  }

  return {
    success: true as const,
    package: packageResult.package,
    isPackageSelection: false,
  };
}

async function activateLearnerPackageForInstructor(params: {
  leerlingId: string;
  instructorId: string;
  packageId: string;
}) {
  const admin = await createAdminClient();
  const now = new Date().toISOString();

  const { error: learnerError } = await admin
    .from("leerlingen" as never)
    .update({
      pakket_id: params.packageId,
    } as never)
    .eq("id", params.leerlingId);

  if (learnerError) {
    return { success: false as const };
  }

  const { error: planningError } = await admin
    .from("leerling_planningsrechten" as never)
    .upsert(
      {
        leerling_id: params.leerlingId,
        instructeur_id: params.instructorId,
        zelf_inplannen_toegestaan: true,
        vrijgegeven_at: now,
        updated_at: now,
      } as never,
      { onConflict: "leerling_id,instructeur_id" }
    );

  if (planningError) {
    return { success: false as const };
  }

  return { success: true as const };
}

function getWeeklyBookingLimitMessage(params: {
  weeklyLimitMinutes: number;
  weeklyBookedMinutes: number;
  slotStartAt: string;
  requestedMinutes: number;
}) {
  const remainingMinutes = getRemainingWeeklyBookingMinutes(
    params.weeklyLimitMinutes,
    params.weeklyBookedMinutes
  );

  return `Je hebt je limiet van ${formatMinutesAsHoursLabel(
    params.weeklyLimitMinutes
  )} voor de week van ${getWeekRangeLabel(
    params.slotStartAt
  )} bereikt. Er staat al ${formatMinutesAsHoursLabel(
    params.weeklyBookedMinutes
  )} ingepland${remainingMinutes === 0 ? "" : ` en nog ${formatMinutesAsHoursLabel(
    remainingMinutes ?? 0
  )} over`}, maar dit blok van ${formatMinutesAsHoursLabel(
    params.requestedMinutes
  )} past daar niet meer binnen. Neem contact op met je instructeur als je extra lessen wilt plannen.`;
}

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

function getRequestedLessonDurationKind(params: {
  hasSelectedPackage: boolean;
  requestType: "algemeen" | "proefles";
}): LessonDurationKind {
  if (params.hasSelectedPackage) {
    return "pakketles";
  }

  if (params.requestType === "proefles") {
    return "proefles";
  }

  return "rijles";
}

function getTrialLessonAlreadyUsedMessage() {
  return "Je hebt al eerder een proefles gepland of gevolgd. Een proefles kun je maar eenmalig boeken.";
}

async function requestedWindowFitsCurrentAvailability(params: {
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  instructorId: string;
  startAt: string;
  endAt: string;
}) {
  const dateValue = getAvailabilityDateValue(params.startAt);

  if (!dateValue || getAvailabilityDateValue(params.endAt) !== dateValue) {
    return false;
  }

  const dayStartAt = createAvailabilityTimestamp(dateValue, "00:00");
  const dayEndAt = createAvailabilityTimestamp(dateValue, "23:59");
  const [{ data: concreteSlotRows }, { data: ruleRows }] = await Promise.all([
    params.supabase
      .from("beschikbaarheid")
      .select("id, start_at, eind_at, beschikbaar")
      .eq("instructeur_id", params.instructorId)
      .lt("start_at", dayEndAt)
      .gt("eind_at", dayStartAt),
    params.supabase
      .from("beschikbaarheid_weekroosters")
      .select(
        "id, instructeur_id, weekdag, start_tijd, eind_tijd, pauze_start_tijd, pauze_eind_tijd, beschikbaar, actief"
      )
      .eq("instructeur_id", params.instructorId)
      .eq("actief", true),
  ]);

  const concreteSlots = (concreteSlotRows ?? []).map((slot) => ({
    id: slot.id,
    start_at: slot.start_at,
    eind_at: slot.eind_at,
    beschikbaar: slot.beschikbaar,
    weekrooster_id: null,
    dag: "",
    tijdvak: "",
  }));

  const recurringSlots = buildRecurringAvailabilitySlots({
    rules: (ruleRows ?? []) as BeschikbaarheidWeekrooster[],
    concreteSlots,
    startDateValue: dateValue,
    weeks: 1,
  });

  return [...concreteSlots, ...recurringSlots]
    .filter((slot) => slot.beschikbaar && slot.start_at && slot.eind_at)
    .some(
      (slot) =>
        new Date(slot.start_at as string).getTime() <=
          new Date(params.startAt).getTime() &&
        new Date(slot.eind_at as string).getTime() >=
          new Date(params.endAt).getTime()
    );
}

async function resolveRequestedLessonMoment(params: {
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  instructorId: string;
  datum?: string | null;
  tijdvak?: string | null;
  slotId?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  fallbackDurationMinutes?: number;
}) {
  let voorkeursdatum = params.datum?.trim() ?? "";
  let tijdvak = params.tijdvak?.trim() ?? "";
  let startAt: string | null = null;
  let endAt: string | null = null;
  const exactStartAt = params.startAt?.trim() ?? "";
  const exactEndAt = params.endAt?.trim() ?? "";

  if (exactStartAt && exactEndAt) {
    const isAvailable = await requestedWindowFitsCurrentAvailability({
      supabase: params.supabase,
      instructorId: params.instructorId,
      startAt: exactStartAt,
      endAt: exactEndAt,
    });

    if (!isAvailable) {
      return {
        success: false as const,
        message: "Dit gekozen lesblok is niet meer open in de agenda.",
      };
    }

    return {
      success: true as const,
      voorkeursdatum: getAvailabilityDateValue(exactStartAt),
      tijdvak: formatAvailabilityWindow(exactStartAt, exactEndAt),
      startAt: exactStartAt,
      endAt: exactEndAt,
    };
  }

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
    const parsedRequestWindow = parseRequestWindow(
      voorkeursdatum,
      tijdvak,
      params.fallbackDurationMinutes
    );
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
    .select("id, pakket_id, voorkeursdatum, tijdvak, status")
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

  const { data: instructeur } = ((await supabase
    .from("instructeurs")
    .select(
      "id, standaard_rijles_duur_minuten, standaard_proefles_duur_minuten, standaard_pakketles_duur_minuten, standaard_examenrit_duur_minuten"
    )
    .eq("slug", input.instructorSlug)
    .maybeSingle()) as unknown as {
    data: InstructorDurationRow | null;
  });

  if (!instructeur) {
    return {
      success: false,
      message: "Deze instructeur is niet gevonden.",
    };
  }

  const requestType = input.requestType === "proefles" ? "proefles" : "algemeen";
  if (
    requestType === "proefles" &&
    (await hasLearnerUsedTrialLesson({ supabase, leerlingId: leerling.id }))
  ) {
    return {
      success: false,
      message: getTrialLessonAlreadyUsedMessage(),
    };
  }
  const packageResult = await resolveLessonPackageForRequest({
    supabase,
    instructorId: instructeur.id,
    learnerPackageId: leerling.pakket_id,
    requestedPackageId: input.packageId,
    requestType,
  });

  if (!packageResult.success) {
    return {
      success: false,
      message: packageResult.message,
    };
  }

  const selectedPackage = packageResult.package;
  const isPackageSelection = packageResult.isPackageSelection;
  const durationKind = getRequestedLessonDurationKind({
    hasSelectedPackage: Boolean(selectedPackage),
    requestType,
  });
  const fallbackDurationMinutes = getLessonDurationForKind(instructeur, durationKind);

  const resolvedMoment = await resolveRequestedLessonMoment({
    supabase,
    instructorId: instructeur.id,
    datum: input.datum,
    tijdvak: input.tijdvak,
    slotId: input.slotId,
    startAt: input.startAt,
    endAt: input.endAt,
    fallbackDurationMinutes,
  });

  if (!resolvedMoment.success) {
    return {
      success: false,
      message: resolvedMoment.message,
    };
  }

  const { voorkeursdatum, tijdvak, startAt: requestedStartAt, endAt: requestedEndAt } =
    resolvedMoment;
  const requestedDurationMinutes = Math.max(
    30,
    Math.round(
      (new Date(requestedEndAt).getTime() - new Date(requestedStartAt).getTime()) / 60000
    )
  );

  if (input.startAt?.trim() && input.endAt?.trim() && requestedDurationMinutes !== fallbackDurationMinutes) {
    return {
      success: false,
      message:
        "Dit gekozen blok past niet meer bij de standaardduur van dit lestype. Kies opnieuw een actueel blok uit de agenda.",
    };
  }

  const { data: existingRequests } = (await supabase
    .from("lesaanvragen")
    .select("id, pakket_id, voorkeursdatum, tijdvak, status")
    .eq("leerling_id", leerling.id)
    .eq("instructeur_id", instructeur.id)
    .in("status", ["aangevraagd", "geaccepteerd", "ingepland"])) as unknown as {
    data: DuplicateLessonRequestRow[] | null;
  };

  const hasDuplicatePackage = isPackageSelection && selectedPackage?.id
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

  const bookingLimitSnapshot = await getLearnerInstructorBookingLimitSnapshot(
    instructeur.id,
    leerling.id
  );
  const requestedWeekKey = getWeekStartKey(requestedStartAt);
  const alreadyBookedMinutesThisWeek =
    bookingLimitSnapshot.bookedMinutesByWeekStart[requestedWeekKey] ?? 0;

  if (
    bookingLimitSnapshot.weeklyBookingLimitMinutes != null &&
    alreadyBookedMinutesThisWeek + requestedDurationMinutes >
      bookingLimitSnapshot.weeklyBookingLimitMinutes
  ) {
    return {
      success: false,
      message: getWeeklyBookingLimitMessage({
        weeklyLimitMinutes: bookingLimitSnapshot.weeklyBookingLimitMinutes,
        weeklyBookedMinutes: alreadyBookedMinutesThisWeek,
        slotStartAt: requestedStartAt,
        requestedMinutes: requestedDurationMinutes,
      }),
    };
  }

  const { error } = await supabase.from("lesaanvragen").insert({
    leerling_id: leerling.id,
    instructeur_id: instructeur.id,
    voorkeursdatum,
    tijdvak,
    bericht: input.bericht?.trim() || null,
    status: "aangevraagd",
    aanvraag_type: isPackageSelection ? "pakket" : requestType,
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
    aanvraagType: isPackageSelection ? "pakket" : requestType,
    lesType: selectedPackage?.les_type ?? null,
    bericht: input.bericht?.trim() || null,
  });

  await syncStudentDriverJourneyStatus(leerling.id);

  revalidateLessonRequestPaths(input.instructorSlug);

  return {
    success: true,
    message: isPackageSelection && selectedPackage
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

  const { data: instructeur } = ((await supabase
    .from("instructeurs")
    .select(
      "id, online_boeken_actief, standaard_rijles_duur_minuten, standaard_proefles_duur_minuten, standaard_pakketles_duur_minuten, standaard_examenrit_duur_minuten"
    )
    .eq("slug", input.instructorSlug)
    .maybeSingle()) as unknown as {
    data: InstructorDurationRow | null;
  });

  if (!instructeur) {
    return {
      success: false,
      message: "Deze instructeur is niet gevonden.",
    };
  }

  const requestType = input.requestType === "proefles" ? "proefles" : "algemeen";
  const planningAccess = await getLearnerInstructorSchedulingAccess(
    instructeur.id,
    leerling.id
  );
  const directBookingAllowedForRequest =
    requestType === "proefles"
      ? planningAccess.publicBookingEnabled ||
        planningAccess.selfSchedulingAllowed ||
        planningAccess.directBookingAllowed
      : planningAccess.directBookingAllowed;

  if (!directBookingAllowedForRequest) {
    return {
      success: false,
      message:
        requestType === "proefles"
          ? "Direct online inplannen staat op dit moment nog niet aan bij deze instructeur."
          : planningAccess.hasActiveRelationship && !planningAccess.packageAssigned
            ? PACKAGE_REQUIRED_MESSAGE
            : "Direct online inplannen staat op dit moment nog niet aan bij deze instructeur.",
    };
  }

  if (
    requestType === "proefles" &&
    (await hasLearnerUsedTrialLesson({ supabase, leerlingId: leerling.id }))
  ) {
    return {
      success: false,
      message: getTrialLessonAlreadyUsedMessage(),
      refreshAvailability: true,
    };
  }

  const packageResult = await resolveLessonPackageForRequest({
    supabase,
    instructorId: instructeur.id,
    learnerPackageId: leerling.pakket_id,
    requestedPackageId: input.packageId,
    requestType,
  });

  if (!packageResult.success) {
    return {
      success: false,
      message: packageResult.message,
      refreshAvailability: true,
    };
  }

  const selectedPackage = packageResult.package;
  const isPackageSelection = packageResult.isPackageSelection;
  const durationKind = getRequestedLessonDurationKind({
    hasSelectedPackage: Boolean(selectedPackage),
    requestType,
  });
  const expectedDurationMinutes = getLessonDurationForKind(instructeur, durationKind);

  const resolvedMoment = await resolveRequestedLessonMoment({
    supabase,
    instructorId: instructeur.id,
    slotId: input.slotId,
    startAt: input.startAt,
    endAt: input.endAt,
    fallbackDurationMinutes: expectedDurationMinutes,
  });

  if (!resolvedMoment.success) {
    return {
      success: false,
      message: resolvedMoment.message,
    };
  }

  const { voorkeursdatum, tijdvak, startAt, endAt } = resolvedMoment;
  const durationMinutes = Math.max(
    30,
    Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000)
  );

  if (durationMinutes !== expectedDurationMinutes) {
    return {
      success: false,
      message:
        "Dit gekozen blok past niet meer bij de standaardduur van dit lestype. Kies opnieuw een actueel blok uit de agenda.",
      refreshAvailability: true,
    };
  }
  const { data: existingRequests } = (await supabase
    .from("lesaanvragen")
    .select("id, pakket_id, voorkeursdatum, tijdvak, status")
    .eq("leerling_id", leerling.id)
    .eq("instructeur_id", instructeur.id)
    .in("status", ["aangevraagd", "geaccepteerd", "ingepland"])) as unknown as {
    data: DuplicateLessonRequestRow[] | null;
  };

  const hasDuplicatePackage = isPackageSelection && selectedPackage?.id
    ? (existingRequests ?? []).some(
        (request) => request.pakket_id === selectedPackage.id
      )
    : false;
  const duplicateSlotRequest =
    (existingRequests ?? []).find(
      (request) =>
        request.voorkeursdatum === voorkeursdatum && request.tijdvak === tijdvak
    ) ?? null;
  const hasDuplicateSlot = Boolean(duplicateSlotRequest);

  const { data: existingDirectLesson } = await supabase
    .from("lessen")
    .select("id, status")
    .eq("leerling_id", leerling.id)
    .eq("instructeur_id", instructeur.id)
    .eq("start_at", startAt)
    .neq("status", "geannuleerd")
    .maybeSingle();

  const alreadyDirectBooked =
    Boolean(existingDirectLesson) ||
    duplicateSlotRequest?.status === "ingepland";

  if (alreadyDirectBooked) {
    return {
      success: false,
      message:
        "Dit moment stond al voor je ingepland. Ik heb de agenda ververst zodat je meteen de actuele open tijden ziet.",
      refreshAvailability: true,
      existingBookingState: "already_booked" as const,
    };
  }

  if (hasDuplicatePackage) {
    return {
      success: false,
      message: "Je hebt al een actieve boeking of aanvraag voor dit pakket.",
    };
  }

  if (hasDuplicateSlot) {
    return {
      success: false,
      message:
        "Dit tijdslot heb je al in een andere aanvraag vastgezet. Ik ververs de agenda zodat je alleen nog open momenten ziet.",
      refreshAvailability: true,
      existingBookingState: "already_requested" as const,
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

  const bookingLimitSnapshot = await getLearnerInstructorBookingLimitSnapshot(
    instructeur.id,
    leerling.id
  );
  const requestedWeekKey = getWeekStartKey(startAt);
  const alreadyBookedMinutesThisWeek =
    bookingLimitSnapshot.bookedMinutesByWeekStart[requestedWeekKey] ?? 0;

  if (
    bookingLimitSnapshot.weeklyBookingLimitMinutes != null &&
    alreadyBookedMinutesThisWeek + durationMinutes >
      bookingLimitSnapshot.weeklyBookingLimitMinutes
  ) {
    return {
      success: false,
      message: getWeeklyBookingLimitMessage({
        weeklyLimitMinutes: bookingLimitSnapshot.weeklyBookingLimitMinutes,
        weeklyBookedMinutes: alreadyBookedMinutesThisWeek,
        slotStartAt: startAt,
        requestedMinutes: durationMinutes,
      }),
      refreshAvailability: true,
    };
  }

  const bookingTitle = getLessonRequestTitle({
    packageName: selectedPackage?.naam ?? null,
    requestType: isPackageSelection ? "pakket" : requestType,
  });

  if (isPackageSelection && selectedPackage) {
    const activatePackageResult = await activateLearnerPackageForInstructor({
      leerlingId: leerling.id,
      instructorId: instructeur.id,
      packageId: selectedPackage.id,
    });

    if (!activatePackageResult.success) {
      return {
        success: false,
        message:
          "Het pakket kon niet aan je traject worden gekoppeld. Probeer opnieuw of neem contact op met je instructeur.",
      };
    }
  }

  const { data: insertedRequest, error: requestError } = await supabase
    .from("lesaanvragen")
    .insert({
      leerling_id: leerling.id,
      instructeur_id: instructeur.id,
      voorkeursdatum,
      tijdvak,
      bericht: input.bericht?.trim() || null,
      status: "ingepland",
      aanvraag_type: isPackageSelection ? "pakket" : requestType,
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
  const { error: lessonError } = await supabase.from("lessen").insert({
    leerling_id: leerling.id,
    instructeur_id: instructeur.id,
    titel: bookingTitle,
    start_at: startAt,
    duur_minuten: durationMinutes,
    status: "ingepland",
    pakket_id: selectedPackage?.id ?? null,
    notities: buildLessonRequestReference(insertedRequest.id),
  } as never);

  if (lessonError) {
    await supabase.from("lesaanvragen").delete().eq("id", insertedRequest.id);

    const lessonInsertBlockedByPolicy =
      lessonError.code === "42501" ||
      lessonError.message.toLowerCase().includes("row-level security");

    return {
      success: false,
      message: lessonInsertBlockedByPolicy
        ? "Direct online inplannen staat nog niet volledig open voor deze instructeur. Probeer het zo opnieuw of gebruik tijdelijk een gewone aanvraag."
        : "De les kon niet direct worden ingepland.",
    };
  }

  await notifyInstructorAboutDirectBooking({
    supabase,
    instructeurId: instructeur.id,
    leerlingNaam: context.profile?.volledige_naam || "Leerling",
    voorkeursdatum,
    tijdvak,
    pakketNaam: selectedPackage?.naam ?? null,
    aanvraagType: isPackageSelection ? "pakket" : requestType,
    lesType: selectedPackage?.les_type ?? null,
    bericht: input.bericht?.trim() || null,
  });

  await syncStudentDriverJourneyStatus(leerling.id);

  revalidateLessonRequestPaths(input.instructorSlug);

  return {
    success: true,
    message:
      requestType === "proefles"
        ? "Je proefles staat direct ingepland."
        : isPackageSelection && selectedPackage
          ? `${selectedPackage.naam} staat direct ingepland.`
          : "Je les staat direct ingepland.",
    refreshAvailability: true,
  };
}
