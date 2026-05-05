import "server-only";

import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import { createServerClient } from "@/lib/supabase/server";
import type {
  CoachNoteTemplateType,
  FeedbackTemplateTarget,
  InstructorFeedbackTemplate,
  StudentProgressStatus,
} from "@/lib/types";

type InstructorFeedbackTemplateRow = {
  actief: boolean;
  created_at: string;
  id: string;
  instructeur_id: string;
  label: string;
  last_used_at: string | null;
  note_type: CoachNoteTemplateType;
  omschrijving: string | null;
  sort_order: number;
  status: StudentProgressStatus | null;
  target: FeedbackTemplateTarget;
  tekst: string;
  updated_at: string;
  usage_count: number;
  vaardigheid_key: string | null;
};

function mapTemplateRow(
  row: InstructorFeedbackTemplateRow,
): InstructorFeedbackTemplate {
  return {
    actief: row.actief,
    created_at: row.created_at,
    id: row.id,
    instructeur_id: row.instructeur_id,
    label: row.label,
    last_used_at: row.last_used_at,
    note_type: row.note_type,
    omschrijving: row.omschrijving,
    sort_order: row.sort_order,
    status: row.status,
    target: row.target,
    tekst: row.tekst,
    updated_at: row.updated_at,
    usage_count: row.usage_count,
    vaardigheid_key: row.vaardigheid_key,
  };
}

export async function getCurrentInstructorFeedbackTemplates(): Promise<
  InstructorFeedbackTemplate[]
> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  const { data, error } = (await supabase
    .from("instructeur_feedback_templates" as never)
    .select(
      "id, instructeur_id, vaardigheid_key, status, target, note_type, label, omschrijving, tekst, actief, sort_order, usage_count, last_used_at, created_at, updated_at",
    )
    .eq("instructeur_id" as never, instructeur.id as never)
    .eq("actief" as never, true as never)
    .order("sort_order" as never, { ascending: true } as never)
    .order("created_at" as never, { ascending: false } as never)
    .limit(80)) as unknown as {
    data: InstructorFeedbackTemplateRow[] | null;
    error?: unknown;
  };

  if (error) {
    logSupabaseDataError("instructorFeedbackTemplates.list", error, {
      instructeurId: instructeur.id,
    });
    return [];
  }

  return (data ?? []).map(mapTemplateRow);
}
