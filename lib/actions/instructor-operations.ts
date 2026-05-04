"use server";

import { revalidatePath } from "next/cache";

import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import { ensureCurrentUserContext, getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";
import type { TransmissieType } from "@/lib/types";

const DOCUMENT_BUCKET = "instructor-verifications";
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

function parseTransmission(value: string): TransmissieType | null {
  if (value === "handgeschakeld" || value === "automaat" || value === "beide") {
    return value;
  }

  return null;
}

function parseVehicleStatus(value: string) {
  return value === "onderhoud" ? "onderhoud" : "actief";
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

async function getInstructorMutationContext(): Promise<
  | {
      instructorId: string;
      userId: string;
    }
  | ActionResult
> {
  const context = await ensureCurrentUserContext();

  if (!context || context.role !== "instructeur") {
    return {
      success: false,
      message: "Log in als instructeur om deze actie uit te voeren.",
    };
  }

  const instructor = await getCurrentInstructeurRecord();

  if (!instructor) {
    return {
      success: false,
      message: "Je instructeursprofiel kon niet worden gevonden.",
    };
  }

  return {
    instructorId: instructor.id,
    userId: context.user.id,
  };
}

function isActionResult(value: unknown): value is ActionResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    "success" in value &&
    "message" in value
  );
}

function revalidateInstructorOperations() {
  revalidatePath("/instructeur/regie");
  revalidatePath("/instructeur/onboarding");
  revalidatePath("/instructeur/documenten");
  revalidatePath("/instructeur/voertuigen");
  revalidatePath("/instructeur/instellingen");
}

export async function uploadInstructorDocumentAction(
  formData: FormData,
): Promise<ActionResult> {
  const mutationContext = await getInstructorMutationContext();

  if (isActionResult(mutationContext)) {
    return mutationContext;
  }

  const documentName = cleanText(formData.get("document_name"));
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
  const path = `${mutationContext.userId}/document-${Date.now()}.${extension}`;
  const buffer = await documentFile.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, buffer, {
      contentType: documentFile.type,
      upsert: true,
    });

  if (uploadError) {
    logSupabaseDataError("instructorDocuments.upload", uploadError, {
      documentName,
    });

    return {
      success: false,
      message: "Document uploaden is niet gelukt. Controleer de storage policies.",
    };
  }

  const { error: insertError } = await supabase
    .from("instructeur_documenten")
    .insert({
      instructeur_id: mutationContext.instructorId,
      naam: documentName,
      status: "ingediend",
      url: path,
    });

  if (insertError) {
    logSupabaseDataError("instructorDocuments.insert", insertError, {
      documentName,
    });

    const { error: cleanupError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .remove([path]);

    if (cleanupError) {
      logSupabaseDataError("instructorDocuments.cleanupAfterInsertFailure", cleanupError, {
        documentName,
        instructorId: mutationContext.instructorId,
      });
    }

    return {
      success: false,
      message: "Document is geupload, maar kon niet worden geregistreerd.",
    };
  }

  revalidateInstructorOperations();

  return {
    success: true,
    message: "Document toegevoegd aan je documentkluis.",
  };
}

export async function deleteInstructorDocumentAction(
  formData: FormData,
): Promise<ActionResult> {
  const mutationContext = await getInstructorMutationContext();

  if (isActionResult(mutationContext)) {
    return mutationContext;
  }

  const documentId = cleanText(formData.get("document_id"));

  if (!documentId) {
    return {
      success: false,
      message: "Document ontbreekt.",
    };
  }

  const supabase = await createServerClient();
  const { data: document, error: findError } = await supabase
    .from("instructeur_documenten")
    .select("url")
    .eq("id", documentId)
    .eq("instructeur_id", mutationContext.instructorId)
    .maybeSingle();

  if (findError) {
    logSupabaseDataError("instructorDocuments.findBeforeDelete", findError, {
      documentId,
    });

    return {
      success: false,
      message: "Document verwijderen is niet gelukt.",
    };
  }

  if (!document) {
    return {
      success: false,
      message: "Document niet gevonden.",
    };
  }

  const { error } = await supabase
    .from("instructeur_documenten")
    .delete()
    .eq("id", documentId)
    .eq("instructeur_id", mutationContext.instructorId);

  if (error) {
    logSupabaseDataError("instructorDocuments.delete", error, {
      documentId,
    });

    return {
      success: false,
      message: "Document verwijderen is niet gelukt.",
    };
  }

  if (document.url) {
    const { error: removeError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .remove([document.url]);

    if (removeError) {
      logSupabaseDataError("instructorDocuments.removeStorageObject", removeError, {
        documentId,
      });
    }
  }

  revalidateInstructorOperations();

  return {
    success: true,
    message: "Document verwijderd.",
  };
}

export async function createInstructorVehicleAction(
  formData: FormData,
): Promise<ActionResult> {
  const mutationContext = await getInstructorMutationContext();

  if (isActionResult(mutationContext)) {
    return mutationContext;
  }

  const model = cleanText(formData.get("model"));
  const kenteken = cleanText(formData.get("kenteken")).toUpperCase();
  const transmissie = parseTransmission(cleanText(formData.get("transmissie")));
  const status = parseVehicleStatus(cleanText(formData.get("status")));

  if (!model || !kenteken || !transmissie) {
    return {
      success: false,
      message: "Vul model, kenteken en transmissie in.",
    };
  }

  const supabase = await createServerClient();
  const { data: existingVehicle, error: duplicateCheckError } = await supabase
    .from("voertuigen")
    .select("id")
    .eq("instructeur_id", mutationContext.instructorId)
    .eq("kenteken", kenteken)
    .maybeSingle();

  if (duplicateCheckError) {
    logSupabaseDataError("instructorVehicles.duplicateCheck", duplicateCheckError, {
      kenteken,
    });
  }

  if (existingVehicle) {
    revalidateInstructorOperations();

    return {
      success: true,
      message: "Dit voertuig staat al in je wagenpark.",
    };
  }

  const { error } = await supabase.from("voertuigen").insert({
    instructeur_id: mutationContext.instructorId,
    model,
    kenteken,
    transmissie,
    status,
  });

  if (error) {
    logSupabaseDataError("instructorVehicles.create", error, {
      kenteken,
    });

    return {
      success: false,
      message:
        "Voertuig toevoegen is niet gelukt. Controleer of de voertuig-schrijfpolicy is toegepast.",
    };
  }

  revalidateInstructorOperations();

  return {
    success: true,
    message: "Voertuig toegevoegd.",
  };
}

export async function updateInstructorVehicleAction(
  formData: FormData,
): Promise<ActionResult> {
  const mutationContext = await getInstructorMutationContext();

  if (isActionResult(mutationContext)) {
    return mutationContext;
  }

  const vehicleId = cleanText(formData.get("vehicle_id"));
  const model = cleanText(formData.get("model"));
  const kenteken = cleanText(formData.get("kenteken")).toUpperCase();
  const transmissie = parseTransmission(cleanText(formData.get("transmissie")));
  const status = parseVehicleStatus(cleanText(formData.get("status")));

  if (!vehicleId || !model || !kenteken || !transmissie) {
    return {
      success: false,
      message: "Vul model, kenteken en transmissie in.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("voertuigen")
    .update({
      kenteken,
      model,
      status,
      transmissie,
    })
    .eq("id", vehicleId)
    .eq("instructeur_id", mutationContext.instructorId);

  if (error) {
    logSupabaseDataError("instructorVehicles.update", error, {
      vehicleId,
    });

    return {
      success: false,
      message:
        "Voertuig bijwerken is niet gelukt. Controleer of de voertuig-schrijfpolicy is toegepast.",
    };
  }

  revalidateInstructorOperations();

  return {
    success: true,
    message: "Voertuig bijgewerkt.",
  };
}

export async function deleteInstructorVehicleAction(
  formData: FormData,
): Promise<ActionResult> {
  const mutationContext = await getInstructorMutationContext();

  if (isActionResult(mutationContext)) {
    return mutationContext;
  }

  const vehicleId = cleanText(formData.get("vehicle_id"));

  if (!vehicleId) {
    return {
      success: false,
      message: "Voertuig ontbreekt.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("voertuigen")
    .delete()
    .eq("id", vehicleId)
    .eq("instructeur_id", mutationContext.instructorId);

  if (error) {
    logSupabaseDataError("instructorVehicles.delete", error, {
      vehicleId,
    });

    return {
      success: false,
      message: "Voertuig verwijderen is niet gelukt.",
    };
  }

  revalidateInstructorOperations();

  return {
    success: true,
    message: "Voertuig verwijderd.",
  };
}
