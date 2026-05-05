"use server";

import { revalidatePath } from "next/cache";

import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import {
  getCoachNoteTemplateTypeMeta,
  isCoachNoteTemplateType,
} from "@/lib/feedback-template-types";
import { createServerClient } from "@/lib/supabase/server";
import {
  getStudentProgressItem,
  isStudentProgressStatus,
} from "@/lib/student-progress";
import type {
  CoachNoteTemplateType,
  FeedbackTemplateTarget,
  InstructorFeedbackTemplate,
  StudentProgressStatus,
} from "@/lib/types";

const FEEDBACK_TEMPLATE_TARGETS = [
  "samenvatting",
  "sterkPunt",
  "focusVolgendeLes",
] as const satisfies FeedbackTemplateTarget[];

type FeedbackTemplateRow = {
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

function isFeedbackTemplateTarget(
  value: string,
): value is FeedbackTemplateTarget {
  return FEEDBACK_TEMPLATE_TARGETS.some((target) => target === value);
}

function mapTemplateRow(row: FeedbackTemplateRow): InstructorFeedbackTemplate {
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

const feedbackTemplateColumns =
  "id, instructeur_id, vaardigheid_key, status, target, note_type, label, omschrijving, tekst, actief, sort_order, usage_count, last_used_at, created_at, updated_at";

function revalidateFeedbackTemplateSurfaces() {
  revalidatePath("/instructeur/leerlingen");
  revalidatePath("/instructeur/instellingen");
}

function normalizeTemplateDescription(value: string | null | undefined) {
  const description = value?.trim() ?? "";

  return description ? description.slice(0, 240) : null;
}

function resolveTemplateNoteType(value: string | null | undefined) {
  const noteType = value?.trim() || "algemene_begeleiding";

  return isCoachNoteTemplateType(noteType)
    ? noteType
    : ("algemene_begeleiding" as const);
}

export async function saveInstructorFeedbackTemplateAction(input: {
  label?: string;
  noteType?: string | null;
  omschrijving?: string | null;
  sortOrder?: number;
  status?: string | null;
  target: string;
  tekst: string;
  vaardigheidKey?: string | null;
}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen instructeurs kunnen feedbacktemplates opslaan.",
    };
  }

  const label = input.label?.trim() ?? "";
  const tekst = input.tekst.trim();
  const vaardigheidKey = input.vaardigheidKey?.trim() || null;
  const status = input.status?.trim() || null;
  const noteType = resolveTemplateNoteType(input.noteType);
  const omschrijving = normalizeTemplateDescription(input.omschrijving);

  if (!isFeedbackTemplateTarget(input.target)) {
    return {
      success: false,
      message: "Kies een geldig feedbackveld voor deze template.",
    };
  }

  if (vaardigheidKey && !getStudentProgressItem(vaardigheidKey)) {
    return {
      success: false,
      message: "Deze vaardigheid bestaat niet.",
    };
  }

  if (status && !isStudentProgressStatus(status)) {
    return {
      success: false,
      message: "Deze voortgangsstatus bestaat niet.",
    };
  }

  if (tekst.length < 12) {
    return {
      success: false,
      message: "Maak de template iets concreter voordat je hem opslaat.",
    };
  }

  if (tekst.length > 900) {
    return {
      success: false,
      message: "Maak de template korter. Houd hem onder 900 tekens.",
    };
  }

  const safeLabel =
    label ||
    (input.target === "samenvatting"
      ? "Eigen reflectie"
      : input.target === "sterkPunt"
        ? "Eigen sterk punt"
        : "Eigen focus");

  const supabase = await createServerClient();
  const { data, error } = (await supabase
    .from("instructeur_feedback_templates" as never)
    .insert({
      instructeur_id: instructeur.id,
      label: safeLabel.slice(0, 80),
      note_type: noteType,
      omschrijving,
      sort_order: Number.isFinite(input.sortOrder)
        ? Math.max(0, Number(input.sortOrder))
        : 100,
      status,
      target: input.target,
      tekst,
      vaardigheid_key: vaardigheidKey,
    } as never)
    .select(feedbackTemplateColumns)
    .single()) as unknown as {
    data: FeedbackTemplateRow | null;
    error?: unknown;
  };

  if (error || !data) {
    return {
      success: false,
      message:
        "Opslaan van de feedbacktemplate is niet gelukt. Controleer of de migration is toegepast.",
    };
  }

  revalidateFeedbackTemplateSurfaces();

  return {
    success: true,
    message: "Feedbacktemplate opgeslagen.",
    template: mapTemplateRow(data),
  };
}

export async function updateInstructorFeedbackTemplateAction(input: {
  id: string;
  label: string;
  noteType?: string | null;
  omschrijving?: string | null;
  sortOrder?: number;
  status?: string | null;
  target: string;
  tekst: string;
  vaardigheidKey?: string | null;
}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen instructeurs kunnen feedbacktemplates aanpassen.",
    };
  }

  const label = input.label.trim();
  const tekst = input.tekst.trim();
  const vaardigheidKey = input.vaardigheidKey?.trim() || null;
  const status = input.status?.trim() || null;
  const noteType = resolveTemplateNoteType(input.noteType);
  const omschrijving = normalizeTemplateDescription(input.omschrijving);

  if (!label) {
    return {
      success: false,
      message: "Geef de template een duidelijke naam.",
    };
  }

  if (!isFeedbackTemplateTarget(input.target)) {
    return {
      success: false,
      message: "Kies een geldig feedbackveld.",
    };
  }

  if (vaardigheidKey && !getStudentProgressItem(vaardigheidKey)) {
    return {
      success: false,
      message: "Deze vaardigheid bestaat niet.",
    };
  }

  if (status && !isStudentProgressStatus(status)) {
    return {
      success: false,
      message: "Deze voortgangsstatus bestaat niet.",
    };
  }

  if (tekst.length < 12) {
    return {
      success: false,
      message: "Maak de template iets concreter voordat je hem opslaat.",
    };
  }

  if (tekst.length > 900) {
    return {
      success: false,
      message: "Maak de template korter. Houd hem onder 900 tekens.",
    };
  }

  const supabase = await createServerClient();
  const { data, error } = (await supabase
    .from("instructeur_feedback_templates" as never)
    .update({
      label: label.slice(0, 80),
      note_type: noteType,
      omschrijving,
      sort_order: Number.isFinite(input.sortOrder)
        ? Math.max(0, Number(input.sortOrder))
        : 100,
      status,
      target: input.target,
      tekst,
      updated_at: new Date().toISOString(),
      vaardigheid_key: vaardigheidKey,
    } as never)
    .eq("id" as never, input.id as never)
    .eq("instructeur_id" as never, instructeur.id as never)
    .select(feedbackTemplateColumns)
    .single()) as unknown as {
    data: FeedbackTemplateRow | null;
    error?: unknown;
  };

  if (error || !data) {
    return {
      success: false,
      message: "Opslaan van de feedbacktemplate is niet gelukt.",
    };
  }

  revalidateFeedbackTemplateSurfaces();

  return {
    success: true,
    message: "Feedbacktemplate bijgewerkt.",
    template: mapTemplateRow(data),
  };
}

export async function duplicateInstructorFeedbackTemplateAction(input: {
  id: string;
}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen instructeurs kunnen feedbacktemplates dupliceren.",
    };
  }

  const supabase = await createServerClient();
  const { data: sourceTemplate, error: sourceError } = (await supabase
    .from("instructeur_feedback_templates" as never)
    .select(feedbackTemplateColumns)
    .eq("id" as never, input.id as never)
    .eq("instructeur_id" as never, instructeur.id as never)
    .maybeSingle()) as unknown as {
    data: FeedbackTemplateRow | null;
    error?: unknown;
  };

  if (sourceError || !sourceTemplate) {
    return {
      success: false,
      message: "Deze template kon niet worden gevonden.",
    };
  }

  const { data, error } = (await supabase
    .from("instructeur_feedback_templates" as never)
    .insert({
      instructeur_id: instructeur.id,
      label: `${sourceTemplate.label} kopie`.slice(0, 80),
      note_type: getCoachNoteTemplateTypeMeta(sourceTemplate.note_type).value,
      omschrijving: sourceTemplate.omschrijving,
      sort_order: sourceTemplate.sort_order + 1,
      status: sourceTemplate.status,
      target: sourceTemplate.target,
      tekst: sourceTemplate.tekst,
      vaardigheid_key: sourceTemplate.vaardigheid_key,
    } as never)
    .select(feedbackTemplateColumns)
    .single()) as unknown as {
    data: FeedbackTemplateRow | null;
    error?: unknown;
  };

  if (error || !data) {
    return {
      success: false,
      message: "Dupliceren van de feedbacktemplate is niet gelukt.",
    };
  }

  revalidateFeedbackTemplateSurfaces();

  return {
    success: true,
    message: "Feedbacktemplate gedupliceerd.",
    template: mapTemplateRow(data),
  };
}

export async function reorderInstructorFeedbackTemplatesAction(input: {
  items: Array<{
    id: string;
    sortOrder: number;
  }>;
}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen instructeurs kunnen feedbacktemplates ordenen.",
    };
  }

  const supabase = await createServerClient();
  const updates = input.items.slice(0, 120).map((item) =>
    supabase
      .from("instructeur_feedback_templates" as never)
      .update({
        sort_order: Math.max(0, Number(item.sortOrder) || 0),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id" as never, item.id as never)
      .eq("instructeur_id" as never, instructeur.id as never),
  );
  const results = await Promise.all(updates);
  const firstError = results.find((result) => result.error)?.error;

  if (firstError) {
    return {
      success: false,
      message: "Ordenen van templates is niet gelukt.",
    };
  }

  revalidateFeedbackTemplateSurfaces();

  return {
    success: true,
    message: "Templatevolgorde bijgewerkt.",
  };
}

export async function recordInstructorFeedbackTemplateUsageAction(input: {
  id: string;
}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen instructeurs kunnen templategebruik meten.",
    };
  }

  const supabase = await createServerClient();
  const { data: currentTemplate, error: currentError } = (await supabase
    .from("instructeur_feedback_templates" as never)
    .select("usage_count")
    .eq("id" as never, input.id as never)
    .eq("instructeur_id" as never, instructeur.id as never)
    .maybeSingle()) as unknown as {
    data: { usage_count: number | null } | null;
    error?: unknown;
  };

  if (currentError || !currentTemplate) {
    return {
      success: false,
      message: "Templategebruik kon niet worden gemeten.",
    };
  }

  const { data, error } = (await supabase
    .from("instructeur_feedback_templates" as never)
    .update({
      last_used_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      usage_count: Number(currentTemplate.usage_count ?? 0) + 1,
    } as never)
    .eq("id" as never, input.id as never)
    .eq("instructeur_id" as never, instructeur.id as never)
    .select(feedbackTemplateColumns)
    .single()) as unknown as {
    data: FeedbackTemplateRow | null;
    error?: unknown;
  };

  if (error || !data) {
    return {
      success: false,
      message: "Templategebruik kon niet worden opgeslagen.",
    };
  }

  revalidatePath("/instructeur/instellingen");

  return {
    success: true,
    message: "Templategebruik gemeten.",
    template: mapTemplateRow(data),
  };
}

export async function archiveInstructorFeedbackTemplateAction(input: {
  id: string;
}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen instructeurs kunnen feedbacktemplates beheren.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("instructeur_feedback_templates" as never)
    .update({
      actief: false,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id" as never, input.id as never)
    .eq("instructeur_id" as never, instructeur.id as never);

  if (error) {
    return {
      success: false,
      message: "Verwijderen van de feedbacktemplate is niet gelukt.",
    };
  }

  revalidateFeedbackTemplateSurfaces();

  return {
    success: true,
    message: "Feedbacktemplate verwijderd.",
  };
}

export async function deleteInstructorFeedbackTemplateAction(input: {
  id: string;
}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen instructeurs kunnen feedbacktemplates verwijderen.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("instructeur_feedback_templates" as never)
    .delete()
    .eq("id" as never, input.id as never)
    .eq("instructeur_id" as never, instructeur.id as never);

  if (error) {
    return {
      success: false,
      message: "Permanent verwijderen van de feedbacktemplate is niet gelukt.",
    };
  }

  revalidateFeedbackTemplateSurfaces();

  return {
    success: true,
    message: "Feedbacktemplate permanent verwijderd.",
  };
}
