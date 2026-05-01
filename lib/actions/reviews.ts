"use server";

import { revalidatePath } from "next/cache";

import {
  ensureCurrentUserContext,
  getCurrentInstructeurRecord,
  getCurrentLeerlingRecord,
  getCurrentRole,
} from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

type SaveLearnerReviewInput = {
  lessonId: string;
  score: number;
  title: string;
  text: string;
};

type SaveInstructorReviewReplyInput = {
  reviewId: string;
  text: string;
};

type SubmitReviewReportInput = {
  reviewId: string;
  reason: string;
};

function sanitizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function validateReviewInput(input: SaveLearnerReviewInput) {
  const title = sanitizeText(input.title);
  const text = sanitizeText(input.text);
  const score = Number(input.score);

  if (!input.lessonId) {
    return { error: "De gekoppelde les ontbreekt." };
  }

  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return { error: "Kies een score tussen 1 en 5 sterren." };
  }

  if (title.length < 3) {
    return { error: "Geef je review een korte titel van minimaal 3 tekens." };
  }

  if (text.length < 12) {
    return {
      error:
        "Schrijf iets meer context, zodat je review echt nuttig is voor andere leerlingen.",
    };
  }

  return {
    score,
    title,
    text,
  };
}

function validateReplyInput(input: SaveInstructorReviewReplyInput) {
  const text = sanitizeText(input.text);

  if (!input.reviewId) {
    return { error: "De review ontbreekt." };
  }

  if (text.length < 8) {
    return {
      error:
        "Schrijf een iets duidelijker antwoord van minimaal 8 tekens.",
    };
  }

  return { text };
}

function validateReportInput(input: SubmitReviewReportInput) {
  const reason = sanitizeText(input.reason);

  if (!input.reviewId) {
    return { error: "De review ontbreekt." };
  }

  if (reason.length < 10) {
    return {
      error:
        "Geef een korte toelichting van minimaal 10 tekens mee bij je melding.",
    };
  }

  return { reason };
}

async function revalidateReviewPaths(instructorSlug?: string | null) {
  revalidatePath("/leerling/reviews");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/leerling/profiel");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/instructeur/profiel");
  revalidatePath("/instructeur/reviews");
  revalidatePath("/instructeurs");
  revalidatePath("/motor");
  revalidatePath("/vrachtwagen");

  if (instructorSlug) {
    revalidatePath(`/instructeurs/${instructorSlug}`);
  }
}

export async function saveLearnerReviewAction(input: SaveLearnerReviewInput) {
  const role = await getCurrentRole();

  if (role !== "leerling") {
    return {
      success: false,
      message: "Alleen leerlingen kunnen een review plaatsen.",
    };
  }

  const validation = validateReviewInput(input);

  if ("error" in validation) {
    return {
      success: false,
      message: validation.error,
    };
  }

  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return {
      success: false,
      message: "Je leerlingprofiel kon niet worden geladen.",
    };
  }

  const supabase = await createServerClient();
  const { data: lessonRow, error: lessonError } = await supabase
    .from("lessen")
    .select("id, leerling_id, instructeur_id, status")
    .eq("id", input.lessonId)
    .maybeSingle();

  if (lessonError || !lessonRow) {
    return {
      success: false,
      message: "De afgeronde les voor deze review kon niet worden gevonden.",
    };
  }

  if (lessonRow.leerling_id !== leerling.id) {
    return {
      success: false,
      message: "Deze les hoort niet bij jouw account.",
    };
  }

  if (lessonRow.status !== "afgerond") {
    return {
      success: false,
      message: "Je kunt pas een review plaatsen nadat de les is afgerond.",
    };
  }

  if (!lessonRow.instructeur_id) {
    return {
      success: false,
      message: "Deze les is niet gekoppeld aan een instructeur.",
    };
  }

  const [{ data: existingReview }, { data: instructorRow }] = await Promise.all([
    supabase
      .from("reviews")
      .select("id")
      .eq("les_id", input.lessonId)
      .maybeSingle(),
    supabase
      .from("instructeurs")
      .select("id, slug")
      .eq("id", lessonRow.instructeur_id)
      .maybeSingle(),
  ]);

  const payload = {
    score: validation.score,
    titel: validation.title,
    tekst: validation.text,
  };

  const { error } = existingReview
    ? await supabase.from("reviews").update(payload).eq("id", existingReview.id)
    : await supabase.from("reviews").insert({
        leerling_id: leerling.id,
        instructeur_id: lessonRow.instructeur_id,
        les_id: input.lessonId,
        ...payload,
      });

  if (error) {
    const duplicateReview =
      error.code === "23505" ||
      error.message?.toLowerCase().includes("unique") ||
      error.message?.toLowerCase().includes("duplicate");

    return {
      success: false,
      message: duplicateReview
        ? "Voor deze les bestaat al een review. Werk je bestaande review bij."
        : "Je review kon niet worden opgeslagen. Probeer het opnieuw.",
    };
  }

  await revalidateReviewPaths(instructorRow?.slug);

  return {
    success: true,
    message: existingReview
      ? "Je review is bijgewerkt."
      : "Je review is opgeslagen.",
  };
}

export async function updateReviewModerationAction(
  input: {
    reviewId: string;
    moderatieStatus: "zichtbaar" | "verborgen" | "gemarkeerd";
    moderatieNotitie?: string | null;
  }
) {
  const role = await getCurrentRole();

  if (role !== "admin") {
    return {
      success: false,
      message: "Alleen admins kunnen reviews modereren.",
    };
  }

  const context = await ensureCurrentUserContext();
  const supabase = await createServerClient();
  const { data: reviewRow } = await supabase
    .from("reviews")
    .select("id, instructeur_id")
    .eq("id", input.reviewId)
    .maybeSingle();
  const moderationNote = sanitizeText(input.moderatieNotitie ?? "");

  const { error } = await supabase
    .from("reviews")
    .update({
      moderatie_status: input.moderatieStatus,
      verborgen: input.moderatieStatus === "verborgen",
      moderated_at: new Date().toISOString(),
      moderatie_notitie: moderationNote || null,
      moderated_by: context?.profile?.id ?? null,
    } as never)
    .eq("id", input.reviewId);

  if (error) {
    return {
      success: false,
      message: "Reviewstatus kon niet worden bijgewerkt.",
    };
  }

  let instructorSlug: string | null = null;

  if (reviewRow?.instructeur_id) {
    const { data: instructorRow } = await supabase
      .from("instructeurs")
      .select("slug")
      .eq("id", reviewRow.instructeur_id)
      .maybeSingle();

    instructorSlug = instructorRow?.slug ?? null;
  }

  await supabase
    .from("review_reports")
    .update({
      status: "beoordeeld",
      reviewed_at: new Date().toISOString(),
      reviewed_by: context?.profile?.id ?? null,
    } as never)
    .eq("review_id", input.reviewId)
    .eq("status", "nieuw");

  revalidatePath("/admin/reviews");
  await revalidateReviewPaths(instructorSlug);

  return {
    success: true,
    message:
      input.moderatieStatus === "verborgen"
        ? "Review is verborgen."
        : input.moderatieStatus === "gemarkeerd"
          ? "Review is gemarkeerd voor opvolging."
          : "Review is weer zichtbaar.",
  };
}

export async function saveInstructorReviewReplyAction(
  input: SaveInstructorReviewReplyInput
) {
  const role = await getCurrentRole();

  if (role !== "instructeur") {
    return {
      success: false,
      message: "Alleen instructeurs kunnen reageren op reviews.",
    };
  }

  const validation = validateReplyInput(input);

  if ("error" in validation) {
    return {
      success: false,
      message: validation.error,
    };
  }

  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Je instructeursprofiel kon niet worden geladen.",
    };
  }

  const context = await ensureCurrentUserContext();
  const supabase = await createServerClient();
  const { data: reviewRow, error: reviewError } = await supabase
    .from("reviews")
    .select("id, instructeur_id")
    .eq("id", input.reviewId)
    .maybeSingle();

  if (reviewError || !reviewRow) {
    return {
      success: false,
      message: "De review kon niet worden gevonden.",
    };
  }

  if (reviewRow.instructeur_id !== instructeur.id) {
    return {
      success: false,
      message: "Je kunt alleen reageren op reviews van je eigen profiel.",
    };
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      antwoord_tekst: validation.text,
      antwoord_datum: new Date().toISOString(),
      answered_by: context?.profile?.id ?? null,
    } as never)
    .eq("id", input.reviewId);

  if (error) {
    return {
      success: false,
      message: "Je antwoord kon niet worden opgeslagen.",
    };
  }

  const { data: instructorRow } = await supabase
    .from("instructeurs")
    .select("slug")
    .eq("id", instructeur.id)
    .maybeSingle();

  await revalidateReviewPaths(instructorRow?.slug ?? instructeur.slug);

  return {
    success: true,
    message: "Je reactie staat nu zichtbaar bij de review.",
  };
}

export async function submitReviewReportAction(input: SubmitReviewReportInput) {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return {
      success: false,
      message: "Log eerst in om een review te rapporteren.",
    };
  }

  const validation = validateReportInput(input);

  if ("error" in validation) {
    return {
      success: false,
      message: validation.error,
    };
  }

  const supabase = await createServerClient();
  const { data: reviewRow, error: reviewError } = await supabase
    .from("reviews")
    .select("id, instructeur_id, leerling_id")
    .eq("id", input.reviewId)
    .maybeSingle();

  if (reviewError || !reviewRow) {
    return {
      success: false,
      message: "De review kon niet worden gevonden.",
    };
  }

  if (context.role === "leerling") {
    const leerling = await getCurrentLeerlingRecord();

    if (leerling?.id && leerling.id === reviewRow.leerling_id) {
      return {
        success: false,
        message: "Je kunt je eigen review niet rapporteren.",
      };
    }
  }

  if (context.role === "instructeur") {
    const instructeur = await getCurrentInstructeurRecord();

    if (instructeur?.id && instructeur.id === reviewRow.instructeur_id) {
      return {
        success: false,
        message: "Gebruik moderatie of support voor reviews op je eigen profiel.",
      };
    }
  }

  const { error } = await supabase.from("review_reports").insert({
    review_id: input.reviewId,
    reporter_profile_id: context.user.id,
    reden: validation.reason,
  } as never);

  if (error) {
    const duplicateReport =
      error.code === "23505" ||
      error.message?.toLowerCase().includes("unique") ||
      error.message?.toLowerCase().includes("duplicate");

    return {
      success: false,
      message: duplicateReport
        ? "Je hebt deze review al gemeld."
        : "Je melding kon niet worden opgeslagen.",
    };
  }

  revalidatePath("/admin/reviews");

  return {
    success: true,
    message: "Bedankt. Deze review is gemeld voor beoordeling.",
  };
}
