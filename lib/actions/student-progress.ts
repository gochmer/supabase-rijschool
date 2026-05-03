"use server";

import { revalidatePath } from "next/cache";

import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { hasInstructorStudentPlanningRelationship } from "@/lib/data/student-scheduling";
import { createServerClient } from "@/lib/supabase/server";
import {
  calculateStudentProgressPercentage,
  getStudentProgressItem,
  isStudentProgressStatus,
  normalizeStudentProgressDate,
} from "@/lib/student-progress";

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

  const beoordelingsDatum = normalizeStudentProgressDate(input.beoordelingsDatum);

  if (!beoordelingsDatum) {
    return {
      success: false,
      message: "Kies een geldige lesdatum.",
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
  const { error } = await supabase.from("leerling_voortgang_beoordelingen").upsert(
    {
      leerling_id: input.leerlingId,
      instructeur_id: instructeur.id,
      vaardigheid_key: input.vaardigheidKey,
      beoordelings_datum: beoordelingsDatum,
      status: input.status,
    },
    {
      onConflict: "leerling_id,instructeur_id,vaardigheid_key,beoordelings_datum",
    }
  );

  if (error) {
    return {
      success: false,
      message: "Opslaan van de instructiekaart is niet gelukt.",
    };
  }

  await syncStudentProgressPercentage(input.leerlingId);

  revalidatePath("/instructeur/leerlingen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/admin/leerlingen");
  revalidatePath("/leerling/profiel");

  return {
    success: true,
    message: `${vaardigheid.label} is bijgewerkt.`,
  };
}

export async function clearStudentProgressAssessmentAction(input: {
  leerlingId: string;
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

  const beoordelingsDatum = normalizeStudentProgressDate(input.beoordelingsDatum);

  if (!beoordelingsDatum) {
    return {
      success: false,
      message: "Kies een geldige lesdatum.",
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
  const { error } = await supabase
    .from("leerling_voortgang_beoordelingen")
    .delete()
    .eq("leerling_id", input.leerlingId)
    .eq("instructeur_id", instructeur.id)
    .eq("vaardigheid_key", input.vaardigheidKey)
    .eq("beoordelings_datum", beoordelingsDatum);

  if (error) {
    return {
      success: false,
      message: "Verwijderen van deze markering is niet gelukt.",
    };
  }

  await syncStudentProgressPercentage(input.leerlingId);

  revalidatePath("/instructeur/leerlingen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/admin/leerlingen");
  revalidatePath("/leerling/profiel");

  return {
    success: true,
    message: `${vaardigheid.label} is leeggemaakt.`,
  };
}

export async function saveStudentProgressLessonNoteAction(input: {
  leerlingId: string;
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

  const lesdatum = normalizeStudentProgressDate(input.lesdatum);

  if (!lesdatum) {
    return {
      success: false,
      message: "Kies een geldige lesdatum voor deze notitie.",
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

  if (!samenvatting && !sterkPunt && !focusVolgendeLes) {
    const { error: deleteError } = await supabase
      .from("leerling_voortgang_lesnotities")
      .delete()
      .eq("leerling_id", input.leerlingId)
      .eq("instructeur_id", instructeur.id)
      .eq("lesdatum", lesdatum);

    if (deleteError) {
      return {
        success: false,
        message: "Lege lesnotitie verwijderen is niet gelukt.",
      };
    }
  } else {
    const { error } = await supabase
      .from("leerling_voortgang_lesnotities")
      .upsert(
        {
          leerling_id: input.leerlingId,
          instructeur_id: instructeur.id,
          lesdatum,
          samenvatting: samenvatting || null,
          sterk_punt: sterkPunt || null,
          focus_volgende_les: focusVolgendeLes || null,
        },
        {
          onConflict: "leerling_id,instructeur_id,lesdatum",
        }
      );

    if (error) {
      return {
        success: false,
        message: "Opslaan van de lesnotitie is niet gelukt.",
      };
    }
  }

  revalidatePath("/instructeur/leerlingen");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/leerling/profiel");

  return {
    success: true,
    message: "Lesnotitie opgeslagen.",
  };
}
