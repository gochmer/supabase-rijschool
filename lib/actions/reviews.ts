"use server";

import { revalidatePath } from "next/cache";

import { getCurrentLeerlingRecord, getCurrentRole } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

type SaveLearnerReviewInput = {
  lessonId: string;
  score: number;
  title: string;
  text: string;
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

async function revalidateReviewPaths(instructorSlug?: string | null) {
  revalidatePath("/leerling/reviews");
  revalidatePath("/leerling/dashboard");
  revalidatePath("/leerling/profiel");
  revalidatePath("/instructeur/dashboard");
  revalidatePath("/instructeur/profiel");
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
  reviewId: string,
  moderatieStatus: "zichtbaar" | "verborgen" | "gemarkeerd"
) {
  const role = await getCurrentRole();

  if (role !== "admin") {
    return {
      success: false,
      message: "Alleen admins kunnen reviews modereren.",
    };
  }

  const supabase = await createServerClient();
  const { data: reviewRow } = await supabase
    .from("reviews")
    .select("id, instructeur_id")
    .eq("id", reviewId)
    .maybeSingle();

  const { error } = await supabase
    .from("reviews")
    .update({
      moderatie_status: moderatieStatus,
      verborgen: moderatieStatus === "verborgen",
      moderated_at: new Date().toISOString(),
    })
    .eq("id", reviewId);

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

  revalidatePath("/admin/reviews");
  await revalidateReviewPaths(instructorSlug);

  return {
    success: true,
    message: "Reviewstatus bijgewerkt.",
  };
}
