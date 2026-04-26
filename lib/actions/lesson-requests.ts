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

  revalidatePath("/leerling/boekingen");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/instructeur/aanvragen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/leerling/instructeurs");
  revalidatePath(`/instructeurs/${input.instructorSlug}`);

  return {
    success: true,
    message: selectedPackage
      ? `Je aanvraag voor ${selectedPackage.naam} is verstuurd.`
      : requestType === "proefles"
        ? "Je proeflesaanvraag is verstuurd."
        : "Je lesaanvraag is verstuurd.",
  };
}
