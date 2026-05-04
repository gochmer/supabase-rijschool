"use server";

import { revalidatePath } from "next/cache";

import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { syncStudentDriverJourneyStatus } from "@/lib/data/driver-journey";
import { hasInstructorStudentPlanningRelationship } from "@/lib/data/student-scheduling";
import { createServerClient } from "@/lib/supabase/server";
import { evaluateStudentTrajectorySignals } from "@/lib/student-trajectory-notifications";
import {
  calculateStudentProgressPercentage,
  getStudentProgressItem,
  isStudentProgressStatus,
  normalizeStudentProgressDate,
} from "@/lib/student-progress";

type ProgressLessonContext =
  | {
      date: string;
      error?: never;
      lesId: string | null;
    }
  | {
      date?: never;
      error: string;
      lesId?: never;
    };

async function resolveProgressLessonContext({
  fallbackDate,
  instructeurId,
  leerlingId,
  lesId,
  supabase,
}: {
  fallbackDate: string;
  instructeurId: string;
  leerlingId: string;
  lesId?: string | null;
  supabase: Awaited<ReturnType<typeof createServerClient>>;
}): Promise<ProgressLessonContext> {
  const normalizedFallbackDate = normalizeStudentProgressDate(fallbackDate);

  if (!normalizedFallbackDate) {
    return {
      error: "Kies een geldige lesdatum.",
    };
  }

  if (!lesId) {
    return {
      date: normalizedFallbackDate,
      lesId: null,
    };
  }

  const { data: lesson, error } = await supabase
    .from("lessen")
    .select("id, start_at")
    .eq("id", lesId)
    .eq("instructeur_id", instructeurId)
    .eq("leerling_id", leerlingId)
    .maybeSingle();

  if (error || !lesson) {
    return {
      error: "Deze les hoort niet bij deze leerling of instructeur.",
    };
  }

  return {
    date:
      normalizeStudentProgressDate(
        lesson.start_at?.slice(0, 10) ?? normalizedFallbackDate,
      ) ?? normalizedFallbackDate,
    lesId: lesson.id,
  };
}

async function syncStudentProgressPercentage(leerlingId: string) {
  const supabase = await createServerClient();
  const { data: rows } = await supabase
    .from("leerling_voortgang_beoordelingen")
    .select("vaardigheid_key, status, beoordelings_datum, created_at")
    .eq("leerling_id", leerlingId)
    .order("beoordelings_datum", { ascending: false })
    .order("created_at", { ascending: false });

  const percentage = calculateStudentProgressPercentage(
    ((rows ?? []) as Array<{
      vaardigheid_key: string;
      status: "uitleg" | "begeleid" | "zelfstandig" | "herhaling";
      beoordelings_datum: string;
      created_at: string;
    }>).map((row, index) => ({
      id: `sync-${index}`,
      leerling_id: leerlingId,
      instructeur_id: "",
      vaardigheid_key: row.vaardigheid_key,
      beoordelings_datum: row.beoordelings_datum,
      status: row.status,
      created_at: row.created_at,
    }))
  );

  await supabase
    .from("leerlingen")
    .update({ voortgang_percentage: percentage })
    .eq("id", leerlingId);
}

export async function saveStudentProgressAssessmentAction(input: {
  leerlingId: string;
  lesId?: string | null;
  vaardigheidKey: string;
  beoordelingsDatum: string;
  status: string;
}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen instructeurs kunnen voortgang opslaan.",
    };
  }

  const vaardigheid = getStudentProgressItem(input.vaardigheidKey);

  if (!vaardigheid) {
    return {
      success: false,
      message: "Dit lesonderdeel bestaat niet.",
    };
  }

  if (!isStudentProgressStatus(input.status)) {
    return {
      success: false,
      message: "Kies een geldige beoordelingsstatus.",
    };
  }

  const hasLink = await hasInstructorStudentPlanningRelationship(
    instructeur.id,
    input.leerlingId
  );

  if (!hasLink) {
    return {
      success: false,
      message: "Deze leerling hoort niet bij jouw instructiekaart.",
    };
  }

  const supabase = await createServerClient();
  const lessonContext = await resolveProgressLessonContext({
    fallbackDate: input.beoordelingsDatum,
    instructeurId: instructeur.id,
    leerlingId: input.leerlingId,
    lesId: input.lesId,
    supabase,
  });

  if ("error" in lessonContext) {
    return {
      success: false,
      message: lessonContext.error,
    };
  }

  let existingAssessmentQuery = supabase
    .from("leerling_voortgang_beoordelingen")
    .select("id")
    .eq("leerling_id", input.leerlingId)
    .eq("instructeur_id", instructeur.id)
    .eq("vaardigheid_key", input.vaardigheidKey);

  existingAssessmentQuery = lessonContext.lesId
    ? existingAssessmentQuery.eq("les_id", lessonContext.lesId)
    : existingAssessmentQuery
        .is("les_id", null)
        .eq("beoordelings_datum", lessonContext.date);

  const { data: existingAssessment } =
    await existingAssessmentQuery.maybeSingle();
  const payload = {
    beoordelings_datum: lessonContext.date,
    instructeur_id: instructeur.id,
    leerling_id: input.leerlingId,
    les_id: lessonContext.lesId,
    status: input.status,
    vaardigheid_key: input.vaardigheidKey,
  };
  const { error } = existingAssessment
    ? await supabase
        .from("leerling_voortgang_beoordelingen")
        .update(payload)
        .eq("id", existingAssessment.id)
    : await supabase
        .from("leerling_voortgang_beoordelingen")
        .insert(payload);

  if (error) {
    return {
      success: false,
      message: "Opslaan van de instructiekaart is niet gelukt.",
    };
  }

  await syncStudentProgressPercentage(input.leerlingId);
  await syncStudentDriverJourneyStatus(input.leerlingId);
  await evaluateStudentTrajectorySignals({
    supabase,
    leerlingId: input.leerlingId,
    instructeurId: instructeur.id,
  });

  revalidatePath("/instructeur/leerlingen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/admin/leerlingen");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/leerling/profiel");

  return {
    success: true,
    message: `${vaardigheid.label} is bijgewerkt.`,
  };
}

export async function clearStudentProgressAssessmentAction(input: {
  leerlingId: string;
  lesId?: string | null;
  vaardigheidKey: string;
  beoordelingsDatum: string;
}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen instructeurs kunnen voortgang aanpassen.",
    };
  }

  const vaardigheid = getStudentProgressItem(input.vaardigheidKey);

  if (!vaardigheid) {
    return {
      success: false,
      message: "Dit lesonderdeel bestaat niet.",
    };
  }

  const hasLink = await hasInstructorStudentPlanningRelationship(
    instructeur.id,
    input.leerlingId
  );

  if (!hasLink) {
    return {
      success: false,
      message: "Deze leerling hoort niet bij jouw instructiekaart.",
    };
  }

  const supabase = await createServerClient();
  const lessonContext = await resolveProgressLessonContext({
    fallbackDate: input.beoordelingsDatum,
    instructeurId: instructeur.id,
    leerlingId: input.leerlingId,
    lesId: input.lesId,
    supabase,
  });

  if ("error" in lessonContext) {
    return {
      success: false,
      message: lessonContext.error,
    };
  }

  let deleteQuery = supabase
    .from("leerling_voortgang_beoordelingen")
    .delete()
    .eq("leerling_id", input.leerlingId)
    .eq("instructeur_id", instructeur.id)
    .eq("vaardigheid_key", input.vaardigheidKey);

  deleteQuery = lessonContext.lesId
    ? deleteQuery.eq("les_id", lessonContext.lesId)
    : deleteQuery.is("les_id", null).eq("beoordelings_datum", lessonContext.date);

  const { error } = await deleteQuery;

  if (error) {
    return {
      success: false,
      message: "Verwijderen van deze markering is niet gelukt.",
    };
  }

  await syncStudentProgressPercentage(input.leerlingId);
  await syncStudentDriverJourneyStatus(input.leerlingId);
  await evaluateStudentTrajectorySignals({
    supabase,
    leerlingId: input.leerlingId,
    instructeurId: instructeur.id,
  });

  revalidatePath("/instructeur/leerlingen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/admin/leerlingen");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/leerling/profiel");

  return {
    success: true,
    message: `${vaardigheid.label} is leeggemaakt.`,
  };
}

export async function saveStudentProgressLessonNoteAction(input: {
  leerlingId: string;
  lesId?: string | null;
  lesdatum: string;
  samenvatting?: string;
  sterkPunt?: string;
  focusVolgendeLes?: string;
}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen instructeurs kunnen lesnotities opslaan.",
    };
  }

  const hasLink = await hasInstructorStudentPlanningRelationship(
    instructeur.id,
    input.leerlingId
  );

  if (!hasLink) {
    return {
      success: false,
      message: "Deze leerling hoort niet bij jouw voortgangswerkplek.",
    };
  }

  const samenvatting = String(input.samenvatting ?? "").trim();
  const sterkPunt = String(input.sterkPunt ?? "").trim();
  const focusVolgendeLes = String(input.focusVolgendeLes ?? "").trim();

  const supabase = await createServerClient();
  const lessonContext = await resolveProgressLessonContext({
    fallbackDate: input.lesdatum,
    instructeurId: instructeur.id,
    leerlingId: input.leerlingId,
    lesId: input.lesId,
    supabase,
  });

  if ("error" in lessonContext) {
    return {
      success: false,
      message: lessonContext.error,
    };
  }

  if (!samenvatting && !sterkPunt && !focusVolgendeLes) {
    let deleteQuery = supabase
      .from("leerling_voortgang_lesnotities")
      .delete()
      .eq("leerling_id", input.leerlingId)
      .eq("instructeur_id", instructeur.id);

    deleteQuery = lessonContext.lesId
      ? deleteQuery.eq("les_id", lessonContext.lesId)
      : deleteQuery.is("les_id", null).eq("lesdatum", lessonContext.date);

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      return {
        success: false,
        message: "Lege lesnotitie verwijderen is niet gelukt.",
      };
    }
  } else {
    let existingNoteQuery = supabase
      .from("leerling_voortgang_lesnotities")
      .select("id")
      .eq("leerling_id", input.leerlingId)
      .eq("instructeur_id", instructeur.id);

    existingNoteQuery = lessonContext.lesId
      ? existingNoteQuery.eq("les_id", lessonContext.lesId)
      : existingNoteQuery.is("les_id", null).eq("lesdatum", lessonContext.date);

    const { data: existingNote } = await existingNoteQuery.maybeSingle();
    const payload = {
      focus_volgende_les: focusVolgendeLes || null,
      instructeur_id: instructeur.id,
      leerling_id: input.leerlingId,
      les_id: lessonContext.lesId,
      lesdatum: lessonContext.date,
      samenvatting: samenvatting || null,
      sterk_punt: sterkPunt || null,
    };
    const { error } = existingNote
      ? await supabase
          .from("leerling_voortgang_lesnotities")
          .update(payload)
          .eq("id", existingNote.id)
      : await supabase
          .from("leerling_voortgang_lesnotities")
          .insert(payload);

    if (error) {
      return {
        success: false,
        message: "Opslaan van de lesnotitie is niet gelukt.",
      };
    }
  }

  await evaluateStudentTrajectorySignals({
    supabase,
    leerlingId: input.leerlingId,
    instructeurId: instructeur.id,
  });
  await syncStudentDriverJourneyStatus(input.leerlingId);

  revalidatePath("/instructeur/leerlingen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/leerling/profiel");

  return {
    success: true,
    message: "Lesnotitie opgeslagen.",
  };
}
