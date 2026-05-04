"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import {
  ensureCurrentUserContext,
  getCurrentLeerlingRecord,
} from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

const LEARNER_DOCUMENT_BUCKET = "learner-documents";
const MAX_DOCUMENT_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

type ActionResult = {
  success: boolean;
  message: string;
};

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();

  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  if (file.type === "application/pdf") {
    return "pdf";
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function validateDocumentFile(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) {
    return "Kies een documentbestand om te uploaden.";
  }

  if (!ALLOWED_DOCUMENT_FILE_TYPES.has(file.type)) {
    return "Document moet een JPG, PNG, WebP of PDF zijn.";
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return "Document mag maximaal 5 MB zijn.";
  }

  return null;
}

async function getLearnerMutationContext(): Promise<
  | {
      learnerId: string | null;
      profileId: string;
    }
  | ActionResult
> {
  const context = await ensureCurrentUserContext();

  if (!context || context.role !== "leerling") {
    return {
      success: false,
      message: "Log in als leerling om deze actie uit te voeren.",
    };
  }

  const learner = await getCurrentLeerlingRecord();

  return {
    learnerId: learner?.id ?? null,
    profileId: context.user.id,
  };
}

function isActionResult(value: unknown): value is ActionResult {
  return Boolean(value && typeof value === "object" && "success" in value);
}

function revalidateLearnerExperience() {
  [
    "/leerling/dashboard",
    "/leerling/profiel",
    "/leerling/voortgang",
    "/leerling/documenten",
    "/leerling/support",
    "/leerling/notificaties",
    "/leerling/betalingen",
  ].forEach((path) => revalidatePath(path));
}

function minutesAgoIso(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function parseLearningStyle(value: string) {
  return value === "visueel" ||
    value === "stap_voor_stap" ||
    value === "examengericht"
    ? value
    : "praktisch";
}

function parseGuidancePreference(value: string) {
  return value === "direct" || value === "motiverend" || value === "uitgebreid"
    ? value
    : "rustig";
}

function parsePracticeRhythm(value: string) {
  return value === "lange_sessies" ||
    value === "vaste_weekroutine" ||
    value === "intensief"
    ? value
    : "kort_en_vaker";
}

function parseAnxietySupport(value: string) {
  return value === "laag" || value === "hoog" ? value : "normaal";
}

function parseScenarioFocus(values: FormDataEntryValue[]) {
  const allowed = new Set([
    "bediening",
    "kijktechniek",
    "verkeersdeelname",
    "examengericht",
  ]);

  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => allowed.has(value));
}

export async function createLearnerSupportTicketAction(
  formData: FormData,
): Promise<ActionResult> {
  const mutationContext = await getLearnerMutationContext();

  if (isActionResult(mutationContext)) {
    return mutationContext;
  }

  const onderwerp = cleanText(formData.get("onderwerp"));
  const omschrijving = cleanText(formData.get("omschrijving"));
  const prioriteit = cleanText(formData.get("prioriteit")) || "normaal";

  if (!onderwerp || !omschrijving) {
    return {
      success: false,
      message: "Vul een onderwerp en omschrijving in.",
    };
  }

  const supabase = await createServerClient();
  const { data: existingTicket, error: duplicateCheckError } = await supabase
    .from("support_tickets")
    .select("id")
    .eq("profiel_id", mutationContext.profileId)
    .eq("onderwerp", onderwerp)
    .eq("omschrijving", omschrijving)
    .gte("created_at", minutesAgoIso(2))
    .maybeSingle();

  if (duplicateCheckError) {
    logSupabaseDataError("learnerSupport.duplicateCheck", duplicateCheckError, {
      profileId: mutationContext.profileId,
    });
  }

  if (existingTicket) {
    revalidateLearnerExperience();

    return {
      success: true,
      message: "Deze supportvraag staat al klaar.",
    };
  }

  const { error } = await supabase.from("support_tickets").insert({
    profiel_id: mutationContext.profileId,
    onderwerp,
    omschrijving,
    prioriteit,
    status: "open",
  });

  if (error) {
    logSupabaseDataError("learnerSupport.createTicket", error, {
      profileId: mutationContext.profileId,
    });

    return {
      success: false,
      message: "Supportvraag aanmaken is niet gelukt.",
    };
  }

  revalidateLearnerExperience();

  return {
    success: true,
    message: "Supportvraag aangemaakt.",
  };
}

export async function updateLearnerLearningPreferencesAction(
  formData: FormData,
): Promise<ActionResult> {
  const mutationContext = await getLearnerMutationContext();

  if (isActionResult(mutationContext)) {
    return mutationContext;
  }

  const payload = {
    profiel_id: mutationContext.profileId,
    leerling_id: mutationContext.learnerId,
    leerstijl: parseLearningStyle(cleanText(formData.get("leerstijl"))),
    begeleiding: parseGuidancePreference(cleanText(formData.get("begeleiding"))),
    oefenritme: parsePracticeRhythm(cleanText(formData.get("oefenritme"))),
    spanningsniveau: parseAnxietySupport(cleanText(formData.get("spanningsniveau"))),
    scenario_focus: parseScenarioFocus(formData.getAll("scenario_focus")),
    updated_at: new Date().toISOString(),
  };
  const supabase = await createServerClient();
  const { error } = (await supabase
    .from("leerling_leervoorkeuren" as never)
    .upsert(payload as never, { onConflict: "profiel_id" })) as unknown as {
    error: unknown;
  };

  if (error) {
    logSupabaseDataError("learnerLearningPreferences.upsert", error, {
      profileId: mutationContext.profileId,
    });

    return {
      success: false,
      message: "Leervoorkeuren opslaan is niet gelukt.",
    };
  }

  revalidateLearnerExperience();

  return {
    success: true,
    message: "Leervoorkeuren opgeslagen.",
  };
}

export async function updateLearnerLearningPreferencesFormAction(
  formData: FormData,
) {
  await updateLearnerLearningPreferencesAction(formData);
}

export async function createLearnerSupportTicketFormAction(formData: FormData) {
  await createLearnerSupportTicketAction(formData);
}

export async function uploadLearnerDocumentAction(
  formData: FormData,
): Promise<ActionResult> {
  const mutationContext = await getLearnerMutationContext();

  if (isActionResult(mutationContext)) {
    return mutationContext;
  }

  const documentName = cleanText(formData.get("document_name"));
  const documentType = cleanText(formData.get("document_type")) || "overig";
  const file = formData.get("document_file");

  if (!documentName) {
    return {
      success: false,
      message: "Vul een documentnaam in.",
    };
  }

  const fileError = validateDocumentFile(file);

  if (fileError) {
    return {
      success: false,
      message: fileError,
    };
  }

  const supabase = await createServerClient();
  const documentFile = file as File;
  const extension = getFileExtension(documentFile);
  const path = `${mutationContext.profileId}/document-${Date.now()}.${extension}`;
  const buffer = await documentFile.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(LEARNER_DOCUMENT_BUCKET)
    .upload(path, buffer, {
      contentType: documentFile.type,
      upsert: true,
    });

  if (uploadError) {
    logSupabaseDataError("learnerDocuments.upload", uploadError, {
      documentName,
      profileId: mutationContext.profileId,
    });

    return {
      success: false,
      message: "Document uploaden is niet gelukt. Controleer de storage policies.",
    };
  }

  const { error: insertError } = (await supabase
    .from("leerling_documenten" as never)
    .insert({
      profiel_id: mutationContext.profileId,
      leerling_id: mutationContext.learnerId,
      document_type: documentType,
      naam: documentName,
      status: "ingediend",
      bestand_pad: path,
      bestand_naam: documentFile.name,
      bestand_type: documentFile.type || null,
      bestand_grootte: documentFile.size,
    } as never)) as unknown as { error: unknown };

  if (insertError) {
    logSupabaseDataError("learnerDocuments.insert", insertError, {
      documentName,
      profileId: mutationContext.profileId,
    });
    const { error: cleanupError } = await supabase.storage
      .from(LEARNER_DOCUMENT_BUCKET)
      .remove([path]);

    if (cleanupError) {
      logSupabaseDataError("learnerDocuments.cleanupAfterInsertFailure", cleanupError, {
        documentName,
        profileId: mutationContext.profileId,
      });
    }

    return {
      success: false,
      message: "Document is geupload, maar kon niet worden geregistreerd.",
    };
  }

  revalidateLearnerExperience();

  return {
    success: true,
    message: "Document toegevoegd aan je leerlingdossier.",
  };
}

export async function uploadLearnerDocumentFormAction(formData: FormData) {
  await uploadLearnerDocumentAction(formData);
}

export async function deleteLearnerDocumentAction(
  formData: FormData,
): Promise<ActionResult> {
  const mutationContext = await getLearnerMutationContext();

  if (isActionResult(mutationContext)) {
    return mutationContext;
  }

  const documentId = cleanText(formData.get("document_id"));
  const documentPath = cleanText(formData.get("document_path"));

  if (!documentId) {
    return {
      success: false,
      message: "Document ontbreekt.",
    };
  }

  const supabase = await createServerClient();
  const { error } = (await supabase
    .from("leerling_documenten" as never)
    .delete()
    .eq("id" as never, documentId as never)
    .eq("profiel_id" as never, mutationContext.profileId as never)) as unknown as {
    error: unknown;
  };

  if (error) {
    logSupabaseDataError("learnerDocuments.delete", error, {
      documentId,
      profileId: mutationContext.profileId,
    });

    return {
      success: false,
      message: "Document verwijderen is niet gelukt.",
    };
  }

  if (documentPath) {
    const { error: removeError } = await supabase.storage
      .from(LEARNER_DOCUMENT_BUCKET)
      .remove([documentPath]);

    if (removeError) {
      logSupabaseDataError("learnerDocuments.removeStorageObject", removeError, {
        documentId,
        profileId: mutationContext.profileId,
      });
    }
  }

  revalidateLearnerExperience();

  return {
    success: true,
    message: "Document verwijderd.",
  };
}

export async function deleteLearnerDocumentFormAction(formData: FormData) {
  await deleteLearnerDocumentAction(formData);
}

function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function startStudentCheckoutAction(formData: FormData) {
  const mutationContext = await getLearnerMutationContext();

  if (isActionResult(mutationContext)) {
    return mutationContext;
  }

  const paymentId = cleanText(formData.get("payment_id"));

  if (!paymentId) {
    return {
      success: false,
      message: "Betaling ontbreekt.",
    };
  }

  const supabase = await createServerClient();
  const { data: payment, error } = await supabase
    .from("betalingen")
    .select("id, bedrag, status, profiel_id")
    .eq("id", paymentId)
    .eq("profiel_id", mutationContext.profileId)
    .maybeSingle();

  if (error) {
    logSupabaseDataError("learnerPayments.findPayment", error, {
      paymentId,
      profileId: mutationContext.profileId,
    });

    return {
      success: false,
      message: "Betaling niet gevonden.",
    };
  }

  if (!payment) {
    return {
      success: false,
      message: "Betaling niet gevonden.",
    };
  }

  if (payment.status === "betaald") {
    return {
      success: false,
      message: "Deze betaling is al afgerond.",
    };
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return {
      success: false,
      message: "Checkout provider is nog niet geconfigureerd.",
    };
  }

  const amount = Number(payment.bedrag ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    logSupabaseDataError("learnerPayments.invalidAmount", payment.bedrag, {
      paymentId: payment.id,
    });

    return {
      success: false,
      message: "Deze betaling heeft geen geldig bedrag.",
    };
  }

  const amountInCents = Math.round(amount * 100);
  const baseUrl = getAppBaseUrl();
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${baseUrl}/leerling/betalingen?checkout=success&factuur=${encodeURIComponent(payment.id)}`,
    cancel_url: `${baseUrl}/leerling/betalingen?checkout=cancelled&factuur=${encodeURIComponent(payment.id)}`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(amountInCents),
    "line_items[0][price_data][product_data][name]": "Rijles pakketbetaling",
    "metadata[payment_id]": payment.id,
    "metadata[profile_id]": mutationContext.profileId,
  });

  let response: Response;

  try {
    response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      body,
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });
  } catch (checkoutError) {
    logSupabaseDataError("learnerPayments.checkoutNetwork", checkoutError, {
      paymentId: payment.id,
    });

    return {
      success: false,
      message: "Checkout provider is tijdelijk niet bereikbaar.",
    };
  }

  if (!response.ok) {
    const detail = await response.text();
    logSupabaseDataError("learnerPayments.checkoutSession", detail, {
      paymentId: payment.id,
      status: response.status,
    });

    return {
      success: false,
      message: "Checkout starten is niet gelukt.",
    };
  }

  const session = (await response.json()) as { url?: string };

  if (!session.url) {
    return {
      success: false,
      message: "Checkout URL ontbreekt.",
    };
  }

  const { error: updateError } = await supabase
    .from("betalingen")
    .update({ provider: "stripe", status: "in_afwachting" })
    .eq("id", payment.id)
    .eq("profiel_id", mutationContext.profileId);

  if (updateError) {
    logSupabaseDataError("learnerPayments.markPending", updateError, {
      paymentId: payment.id,
      profileId: mutationContext.profileId,
    });

    return {
      success: false,
      message: "Checkout is aangemaakt, maar de betaling kon niet worden bijgewerkt.",
    };
  }

  redirect(session.url);
}

export async function startStudentCheckoutFormAction(formData: FormData) {
  await startStudentCheckoutAction(formData);
}
