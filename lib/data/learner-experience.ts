import "server-only";

import { cache } from "react";

import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import {
  ensureCurrentUserContext,
  getCurrentLeerlingRecord,
} from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";
import type { LearnerDocument, SupportTicket } from "@/lib/types";
import type {
  LearnerAnxietySupport,
  LearnerGuidancePreference,
  LearnerLearningPreferences,
  LearnerLearningStyle,
  LearnerPracticeRhythm,
} from "@/lib/types";

const LEARNER_DOCUMENT_BUCKET = "learner-documents";

export const DEFAULT_LEARNER_LEARNING_PREFERENCES: Omit<
  LearnerLearningPreferences,
  "profiel_id"
> = {
  leerling_id: null,
  leerstijl: "praktisch",
  begeleiding: "rustig",
  oefenritme: "kort_en_vaker",
  spanningsniveau: "normaal",
  scenario_focus: [],
};

type LearnerDocumentRow = Omit<LearnerDocument, "signed_url">;

export const getCurrentLearnerDocuments = cache(
  async function getCurrentLearnerDocuments(): Promise<LearnerDocument[]> {
    const context = await ensureCurrentUserContext();

    if (!context) {
      return [];
    }

    const supabase = await createServerClient();
    const { data, error } = (await supabase
      .from("leerling_documenten" as never)
      .select(
        "id, profiel_id, leerling_id, document_type, naam, status, bestand_pad, bestand_naam, bestand_type, bestand_grootte, created_at, updated_at",
      )
      .eq("profiel_id" as never, context.user.id as never)
      .order("created_at" as never, { ascending: false })) as unknown as {
      data: LearnerDocumentRow[] | null;
      error: unknown;
    };

    if (error) {
      logSupabaseDataError("learnerExperience.documents", error, {
        profileId: context.user.id,
      });
      return [];
    }

    const rows = data ?? [];

    return Promise.all(
      rows.map(async (row) => {
        const { data: signedData } = await supabase.storage
          .from(LEARNER_DOCUMENT_BUCKET)
          .createSignedUrl(row.bestand_pad, 60 * 30);

        return {
          ...row,
          signed_url: signedData?.signedUrl ?? null,
        };
      }),
    );
  },
);

export const getCurrentLearnerSupportTickets = cache(
  async function getCurrentLearnerSupportTickets(): Promise<SupportTicket[]> {
    const context = await ensureCurrentUserContext();

    if (!context) {
      return [];
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, profiel_id, onderwerp, omschrijving, status, prioriteit, created_at")
      .eq("profiel_id", context.user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      logSupabaseDataError("learnerExperience.supportTickets", error, {
        profileId: context.user.id,
      });
      return [];
    }

    return (data ?? []).map((ticket) => ({
      ...ticket,
      status:
        ticket.status === "in_behandeling" || ticket.status === "afgesloten"
          ? ticket.status
          : "open",
      prioriteit:
        ticket.prioriteit === "laag" || ticket.prioriteit === "hoog"
          ? ticket.prioriteit
          : "normaal",
      gebruiker: "Jij",
    })) as SupportTicket[];
  },
);

export const getCurrentLearnerDocumentContext = cache(
  async function getCurrentLearnerDocumentContext() {
    const [documents, learner] = await Promise.all([
      getCurrentLearnerDocuments(),
      getCurrentLeerlingRecord(),
    ]);

    return {
      documents,
      learner,
    };
  },
);

function toLearningStyle(value: unknown): LearnerLearningStyle {
  return value === "visueel" ||
    value === "stap_voor_stap" ||
    value === "examengericht"
    ? value
    : "praktisch";
}

function toGuidancePreference(value: unknown): LearnerGuidancePreference {
  return value === "direct" || value === "motiverend" || value === "uitgebreid"
    ? value
    : "rustig";
}

function toPracticeRhythm(value: unknown): LearnerPracticeRhythm {
  return value === "lange_sessies" ||
    value === "vaste_weekroutine" ||
    value === "intensief"
    ? value
    : "kort_en_vaker";
}

function toAnxietySupport(value: unknown): LearnerAnxietySupport {
  return value === "laag" || value === "hoog" ? value : "normaal";
}

export const getCurrentLearnerLearningPreferences = cache(
  async function getCurrentLearnerLearningPreferences(): Promise<
    LearnerLearningPreferences | null
  > {
    const context = await ensureCurrentUserContext();

    if (!context) {
      return null;
    }

    const supabase = await createServerClient();
    const { data, error } = (await supabase
      .from("leerling_leervoorkeuren" as never)
      .select(
        "profiel_id, leerling_id, leerstijl, begeleiding, oefenritme, spanningsniveau, scenario_focus, created_at, updated_at",
      )
      .eq("profiel_id" as never, context.user.id as never)
      .maybeSingle()) as unknown as {
      data:
        | (LearnerLearningPreferences & {
            leerstijl: unknown;
            begeleiding: unknown;
            oefenritme: unknown;
            spanningsniveau: unknown;
            scenario_focus: unknown;
          })
        | null;
      error: unknown;
    };

    if (error) {
      logSupabaseDataError("learnerExperience.learningPreferences", error, {
        profileId: context.user.id,
      });
      return {
        ...DEFAULT_LEARNER_LEARNING_PREFERENCES,
        profiel_id: context.user.id,
      };
    }

    if (!data) {
      return {
        ...DEFAULT_LEARNER_LEARNING_PREFERENCES,
        profiel_id: context.user.id,
      };
    }

    return {
      ...data,
      leerstijl: toLearningStyle(data.leerstijl),
      begeleiding: toGuidancePreference(data.begeleiding),
      oefenritme: toPracticeRhythm(data.oefenritme),
      spanningsniveau: toAnxietySupport(data.spanningsniveau),
      scenario_focus: Array.isArray(data.scenario_focus)
        ? data.scenario_focus.filter((item): item is string => typeof item === "string")
        : [],
    };
  },
);
