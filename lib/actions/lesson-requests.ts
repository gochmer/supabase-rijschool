"use server";

import { revalidatePath } from "next/cache";

import {
  createAvailabilityTimestamp,
  formatAvailabilityWindow,
  getAvailabilityDateValue,
} from "@/lib/availability";
import {
  buildRecurringAvailabilitySlotFromRule,
  parseWeekRuleSlotId,
} from "@/lib/availability-week-rules";
import {
  ensureCurrentUserContext,
  getCurrentLeerlingRecord,
} from "@/lib/data/profiles";
import { appendRequestUpdateMessage } from "@/lib/lesson-request-flow";
import { notifyInstructorAboutNewRequest } from "@/lib/notification-events";
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
  revalidatePath("/leerling/instructeurs");

  if (instructorSlug) {
    revalidatePath(`/instructeurs/${instructorSlug}`);
  }
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

  let voorkeursdatum = input.datum?.trim() ?? "";
  let tijdvak = input.tijdvak?.trim() ?? "";
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

  if (input.slotId?.trim()) {
    const recurringReference = parseWeekRuleSlotId(input.slotId.trim());

    if (recurringReference) {
      const { data: rule } = (await supabase
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

      if (!rule || rule.instructeur_id !== instructeur.id) {
        return {
          success: false,
          message: "Deze vaste weekplanning hoort niet bij deze instructeur.",
        };
      }

      if (!rule.actief || !rule.beschikbaar) {
        return {
          success: false,
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
          success: false,
          message: "Dit geplande moment kon niet worden opgebouwd.",
        };
      }

      const dayStartAt = createAvailabilityTimestamp(recurringReference.dateValue, "00:00");
      const dayEndAt = createAvailabilityTimestamp(
        recurringReference.dateValue,
        "23:59"
      );
      const { data: dayOverrides } = await supabase
        .from("beschikbaarheid")
        .select("id, start_at, eind_at")
        .eq("instructeur_id", instructeur.id)
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
          success: false,
          message: "Dit geplande moment is intussen aangepast of afgeschermd.",
        };
      }

      voorkeursdatum = recurringReference.dateValue;
      tijdvak = formatAvailabilityWindow(recurringSlot.start_at, recurringSlot.eind_at);
    } else {
      const { data: slot } = await supabase
        .from("beschikbaarheid")
        .select("id, instructeur_id, start_at, eind_at, beschikbaar")
        .eq("id", input.slotId.trim())
        .maybeSingle();

      if (!slot || slot.instructeur_id !== instructeur.id) {
        return {
          success: false,
          message: "Dit tijdslot hoort niet bij deze instructeur.",
        };
      }

      if (!slot.beschikbaar) {
        return {
          success: false,
          message: "Dit tijdslot is niet meer beschikbaar.",
        };
      }

      voorkeursdatum = getAvailabilityDateValue(slot.start_at);
      tijdvak = formatAvailabilityWindow(slot.start_at, slot.eind_at);
    }
  }

  if (!voorkeursdatum || !tijdvak) {
    return {
      success: false,
      message: "Kies een datum en tijdvak voor je aanvraag.",
    };
  }

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
