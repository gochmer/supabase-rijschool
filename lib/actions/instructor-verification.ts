"use server";

import { revalidatePath } from "next/cache";

import { ensureCurrentUserContext, getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { calculateInstructorProfileCompletion, parseCommaSeparatedList } from "@/lib/instructor-profile";
import { createServerClient } from "@/lib/supabase/server";

const VERIFICATION_BUCKET = "instructor-verifications";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

type VerificationUpload = {
  field: string;
  label: string;
  required: boolean;
};

const verificationUploads: VerificationUpload[] = [
  { field: "wrm_front", label: "WRM voorkant pas", required: true },
  { field: "wrm_back", label: "WRM achterkant pas", required: true },
  { field: "selfie", label: "Selfie identiteitscontrole", required: true },
  { field: "profile_photo", label: "Profielfoto", required: false },
];

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

function validateFile(file: FormDataEntryValue | null, label: string, required: boolean) {
  if (!(file instanceof File) || file.size === 0) {
    return required ? `${label} is verplicht.` : null;
  }

  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    return `${label} moet een JPG, PNG, WebP of PDF zijn.`;
  }

  if (file.size > MAX_FILE_SIZE) {
    return `${label} mag maximaal 5 MB zijn.`;
  }

  return null;
}

async function uploadVerificationFile({
  file,
  field,
  userId,
  supabase,
}: {
  file: File;
  field: string;
  userId: string;
  supabase: Awaited<ReturnType<typeof createServerClient>>;
}) {
  const extension = getFileExtension(file);
  const path = `${userId}/${field}-${Date.now()}.${extension}`;
  const buffer = await file.arrayBuffer();

  const { error } = await supabase.storage.from(VERIFICATION_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new Error(`Upload mislukt voor ${field}. Controleer de Supabase storage policies.`);
  }

  return path;
}

export async function submitInstructorVerificationAction(formData: FormData) {
  const context = await ensureCurrentUserContext();

  if (!context || context.role !== "instructeur") {
    return {
      success: false,
      message: "Log in als instructeur om je verificatie in te dienen.",
    };
  }

  const instructor = await getCurrentInstructeurRecord();

  if (!instructor) {
    return {
      success: false,
      message: "Je instructeursprofiel kon niet worden gevonden.",
    };
  }

  const volledigeNaam = cleanText(formData.get("full_name"));
  const email =
    cleanText(formData.get("email")) ||
    context.profile?.email ||
    context.user.email ||
    "";
  const telefoon = cleanText(formData.get("phone"));
  const wrmPasnummer = cleanText(formData.get("wrm_number"));
  const wrmCategorie = cleanText(formData.get("wrm_category"));
  const wrmGeldigTot = cleanText(formData.get("wrm_valid_until"));
  const rijschoolOrganisatie = cleanText(formData.get("school"));
  const functieRol = cleanText(formData.get("function_role"));
  const bio = cleanText(formData.get("bio"));
  const specialisaties = parseCommaSeparatedList(cleanText(formData.get("specializations")));

  if (!volledigeNaam || !email || !telefoon || !wrmPasnummer || !wrmCategorie || !wrmGeldigTot) {
    return {
      success: false,
      message: "Vul je naam, e-mailadres, telefoonnummer en alle WRM-gegevens in.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      success: false,
      message: "Vul een geldig e-mailadres in.",
    };
  }

  const validUntil = new Date(wrmGeldigTot);

  if (Number.isNaN(validUntil.getTime())) {
    return {
      success: false,
      message: "Vul een geldige WRM-geldigheidsdatum in.",
    };
  }

  for (const upload of verificationUploads) {
    const error = validateFile(formData.get(upload.field), upload.label, upload.required);

    if (error) {
      return { success: false, message: error };
    }
  }

  const supabase = await createServerClient();

  try {
    const uploadedDocuments = [];

    for (const upload of verificationUploads) {
      const file = formData.get(upload.field);

      if (!(file instanceof File) || file.size === 0) {
        continue;
      }

      const path = await uploadVerificationFile({
        file,
        field: upload.field,
        userId: context.user.id,
        supabase,
      });

      uploadedDocuments.push({
        instructeur_id: instructor.id,
        naam: upload.label,
        url: path,
        status: "ingediend",
      });
    }

    const profielCompleetheid = calculateInstructorProfileCompletion({
      bio,
      telefoon,
      werkgebied: instructor.werkgebied ?? [],
      prijsPerLes: Number(instructor.prijs_per_les ?? 0),
      specialisaties,
      ervaringJaren: Number(instructor.ervaring_jaren ?? 0),
    });

    const [{ error: profileError }, { error: instructorError }] = await Promise.all([
      supabase
        .from("profiles")
        .update({
          volledige_naam: volledigeNaam,
          email,
          telefoon,
          updated_at: new Date().toISOString(),
        })
        .eq("id", context.user.id),
      supabase
        .from("instructeurs")
        .update({
          bio,
          specialisaties,
          profiel_status: "in_beoordeling",
          profiel_compleetheid: profielCompleetheid,
          updated_at: new Date().toISOString(),
        })
        .eq("id", instructor.id),
    ]);

    if (profileError || instructorError) {
      return {
        success: false,
        message: "Je profielgegevens konden niet worden opgeslagen.",
      };
    }

    const { error: verificationError } = await supabase
      .from("instructeur_verificatie_aanvragen" as never)
      .upsert(
        {
          instructeur_id: instructor.id,
          wrm_pasnummer: wrmPasnummer,
          wrm_categorie: wrmCategorie,
          wrm_geldig_tot: wrmGeldigTot,
          rijschool_organisatie: rijschoolOrganisatie || null,
          functie_rol: functieRol || null,
          specialisaties,
          status: "ingediend",
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "instructeur_id" }
      );

    if (verificationError) {
      return {
        success: false,
        message: "Je verificatiegegevens konden niet worden opgeslagen.",
      };
    }

    if (uploadedDocuments.length) {
      const { error: documentError } = await supabase
        .from("instructeur_documenten")
        .insert(uploadedDocuments);

      if (documentError) {
        return {
          success: false,
          message: "Je bestanden zijn geupload, maar de documentstatus kon niet worden opgeslagen.",
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Je verificatie kon niet worden ingediend.",
    };
  }

  revalidatePath("/instructeur-verificatie");
  revalidatePath("/instructeur/instellingen");
  revalidatePath("/admin/instructeurs");

  return {
    success: true,
    message: "Je verificatie is ingediend. We controleren je gegevens binnen 1-2 werkdagen.",
  };
}
