"use server";

import { revalidatePath } from "next/cache";

import {
  getCurrentInstructeurRecord,
  getCurrentRole,
} from "@/lib/data/profiles";
import { getRijlesType, isRijlesType } from "@/lib/lesson-types";
import {
  getPackageIconKey,
  getPackageThemeKey,
  isPackageIconKey,
  isPackageVisualTheme,
} from "@/lib/package-visuals";
import {
  getPackageCoverFocusPoint,
  getPackageCoverPositionKey,
  isPackageCoverPositionKey,
  parsePackageCoverFocusValue,
  PACKAGE_COVER_BUCKET,
} from "@/lib/package-covers";
import {
  getPackageLabelKey,
  normalizePackageLabels,
  PACKAGE_LABEL_LIMIT,
  PACKAGE_LABEL_MAX_LENGTH,
} from "@/lib/package-labels";
import { createServerClient } from "@/lib/supabase/server";

type CreatePackageInput = {
  naam: string;
  lesType?: string;
  beschrijving?: string;
  prijs?: string;
  praktijkExamenPrijs?: string;
  aantalLessen?: string;
  weeklyBookingLimitMinutes?: string | number | null;
  badge?: string;
  labels?: string[] | string;
  iconKey?: string;
  visualTheme?: string;
  coverPath?: string | null;
  coverChanged?: boolean;
  coverPosition?: string | null;
  coverFocusX?: number | string | null;
  coverFocusY?: number | string | null;
};

type EditablePackage = {
  id: string;
  naam: string;
  instructeur_id: string | null;
  sort_order?: number | null;
  uitgelicht?: boolean | null;
};

type PackageScopeRow = {
  id: string;
  sort_order: number;
  created_at: string;
  uitgelicht: boolean;
};

function parsePrice(value: string | undefined) {
  const parsed = Number.parseFloat(String(value ?? "0").replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : null;
}

function parseLessonCount(value: string | undefined) {
  const parsed = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseOptionalPrice(value: string | undefined) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : Number.NaN;
}

function parseOptionalWeeklyBookingLimitMinutes(
  value: string | number | null | undefined
) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed =
    typeof value === "number"
      ? Math.round(value)
      : Number.parseInt(String(value).trim(), 10);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function validatePackageInput(input: CreatePackageInput) {
  const naam = input.naam.trim();
  const lesTypeRaw = String(input.lesType ?? "").trim();
  const beschrijving = String(input.beschrijving ?? "").trim();
  const badge = String(input.badge ?? "").trim();
  const labels = normalizePackageLabels(input.labels);
  const iconKeyRaw = String(input.iconKey ?? "").trim();
  const visualThemeRaw = String(input.visualTheme ?? "").trim();
  const coverPathRaw = typeof input.coverPath === "string" ? input.coverPath.trim() : "";
  const coverPositionRaw =
    typeof input.coverPosition === "string" ? input.coverPosition.trim() : "";
  const coverFocusXRaw = parsePackageCoverFocusValue(input.coverFocusX);
  const coverFocusYRaw = parsePackageCoverFocusValue(input.coverFocusY);
  const prijs = parsePrice(input.prijs);
  const praktijkExamenPrijs = parseOptionalPrice(input.praktijkExamenPrijs);
  const aantalLessen = parseLessonCount(input.aantalLessen);
  const weeklyBookingLimitMinutes = parseOptionalWeeklyBookingLimitMinutes(
    input.weeklyBookingLimitMinutes
  );

  if (!naam) {
    return {
      success: false as const,
      message: "Geef het pakket een naam.",
    };
  }

  if (prijs === null) {
    return {
      success: false as const,
      message: "Vul een geldige prijs in.",
    };
  }

  if (aantalLessen === null) {
    return {
      success: false as const,
      message: "Vul een geldig aantal lessen in.",
    };
  }

  if (Number.isNaN(praktijkExamenPrijs)) {
    return {
      success: false as const,
      message: "Vul een geldige prijs voor het praktijk-examen in.",
    };
  }

  if (
    weeklyBookingLimitMinutes !== null &&
    (Number.isNaN(weeklyBookingLimitMinutes) ||
      weeklyBookingLimitMinutes < 30 ||
      weeklyBookingLimitMinutes > 1440)
  ) {
    return {
      success: false as const,
      message: "Kies een pakketlimiet tussen 30 en 1440 minuten per week, of laat hem onbeperkt.",
    };
  }

  if (labels.length > PACKAGE_LABEL_LIMIT) {
    return {
      success: false as const,
      message: `Gebruik maximaal ${PACKAGE_LABEL_LIMIT} extra labels per pakket.`,
    };
  }

  const longLabel = labels.find((label) => label.length > PACKAGE_LABEL_MAX_LENGTH);

  if (longLabel) {
    return {
      success: false as const,
      message: `Maak labels korter dan ${PACKAGE_LABEL_MAX_LENGTH} tekens.`,
    };
  }

  if (badge && labels.some((label) => getPackageLabelKey(label) === getPackageLabelKey(badge))) {
    return {
      success: false as const,
      message: "Gebruik dezelfde term niet tegelijk als hoofdbadge en extra label.",
    };
  }

  if (lesTypeRaw && !isRijlesType(lesTypeRaw)) {
    return {
      success: false as const,
      message: "Kies een geldig rijlestype.",
    };
  }

  if (iconKeyRaw && !isPackageIconKey(iconKeyRaw)) {
    return {
      success: false as const,
      message: "Kies een geldig pakketicoon.",
    };
  }

  if (visualThemeRaw && !isPackageVisualTheme(visualThemeRaw)) {
    return {
      success: false as const,
      message: "Kies een geldig visueel thema.",
    };
  }

  if (coverPositionRaw && !isPackageCoverPositionKey(coverPositionRaw)) {
    return {
      success: false as const,
      message: "Kies een geldige coverpositie.",
    };
  }

  return {
    success: true as const,
    values: {
      naam,
      beschrijving,
      badge,
      labels,
      prijs,
      praktijkExamenPrijs,
      weeklyBookingLimitMinutes,
      aantalLessen,
      lesType: getRijlesType(lesTypeRaw),
      iconKey: getPackageIconKey(iconKeyRaw),
      visualTheme: getPackageThemeKey(visualThemeRaw),
      coverPath: coverPathRaw || null,
      coverChanged: Boolean(input.coverChanged),
      coverPosition: getPackageCoverPositionKey(coverPositionRaw),
      coverFocus:
        coverPathRaw && coverFocusXRaw !== null && coverFocusYRaw !== null
          ? getPackageCoverFocusPoint(coverPositionRaw, coverFocusXRaw, coverFocusYRaw)
          : null,
    },
  };
}

async function validateCoverOwnership(
  coverPath: string | null,
  requireOwnershipCheck: boolean
) {
  if (!requireOwnershipCheck || !coverPath) {
    return {
      success: true as const,
    };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false as const,
      message: "Je sessie is verlopen. Log opnieuw in en upload de cover daarna opnieuw.",
    };
  }

  if (!coverPath.startsWith(`${user.id}/`)) {
    return {
      success: false as const,
      message: `De cover moet eerst via de ${PACKAGE_COVER_BUCKET}-uploadflow worden geüpload.`,
    };
  }

  return {
    success: true as const,
  };
}

async function getEditablePackageContext(packageId: string) {
  const role = await getCurrentRole();

  if (!role || (role !== "admin" && role !== "instructeur")) {
    return {
      ok: false as const,
      message: "Je hebt geen rechten om pakketten te beheren.",
    };
  }

  const supabase = await createServerClient();
  const { data: pkg } = await supabase
    .from("pakketten")
    .select("id, naam, instructeur_id, sort_order, uitgelicht")
    .eq("id", packageId)
    .maybeSingle();

  if (!pkg) {
    return {
      ok: false as const,
      message: "Dit pakket bestaat niet meer.",
    };
  }

  if (role === "admin") {
    return {
      ok: true as const,
      role,
      packageRow: pkg as EditablePackage,
    };
  }

  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur || pkg.instructeur_id !== instructeur.id) {
    return {
      ok: false as const,
      message: "Je kunt alleen je eigen pakketten beheren.",
    };
  }

  return {
    ok: true as const,
    role,
    packageRow: pkg as EditablePackage,
    instructeur,
  };
}

async function getScopedPackagesOrdered(instructeurId: string | null) {
  const supabase = await createServerClient();
  let query = supabase
    .from("pakketten")
    .select("id, sort_order, created_at, uitgelicht")
    .order("uitgelicht", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (instructeurId) {
    query = query.eq("instructeur_id", instructeurId);
  } else {
    query = query.is("instructeur_id", null);
  }

  const { data } = await query;

  return (data as PackageScopeRow[] | null) ?? [];
}

async function revalidatePackagePaths(instructeurId?: string | null) {
  revalidatePath("/admin/pakketten");
  revalidatePath("/admin/dashboard");
  revalidatePath("/instructeurs");
  revalidatePath("/leerling/instructeurs");
  revalidatePath("/leerling/profiel");
  revalidatePath("/leerling/betalingen");
  revalidatePath("/motor");
  revalidatePath("/vrachtwagen");

  const supabase = await createServerClient();

  if (!instructeurId) {
    revalidatePath("/pakketten");
    return;
  }

  revalidatePath("/instructeur/pakketten");
  revalidatePath("/instructeur/dashboard");

  const { data: instructeur } = await supabase
    .from("instructeurs")
    .select("slug")
    .eq("id", instructeurId)
    .maybeSingle();

  if (instructeur?.slug) {
    revalidatePath(`/instructeurs/${instructeur.slug}`);
  }
}

export async function createPackageAction(input: CreatePackageInput) {
  const role = await getCurrentRole();

  if (!role || (role !== "admin" && role !== "instructeur")) {
    return {
      success: false,
      message: "Alleen admins of instructeurs kunnen pakketten aanmaken.",
    };
  }

  const validation = validatePackageInput(input);

  if (!validation.success) {
    return {
      success: false,
      message: validation.message,
    };
  }

  const {
    naam,
    beschrijving,
    badge,
    labels,
    prijs,
    praktijkExamenPrijs,
    weeklyBookingLimitMinutes,
    aantalLessen,
    lesType,
    iconKey,
    visualTheme,
    coverPath,
    coverPosition,
    coverFocus,
  } = validation.values;

  const coverValidation = await validateCoverOwnership(coverPath, Boolean(coverPath));

  if (!coverValidation.success) {
    return {
      success: false,
      message: coverValidation.message,
    };
  }

  const supabase = await createServerClient();
  let instructeurId: string | null = null;

  if (role === "instructeur") {
    const instructeur = await getCurrentInstructeurRecord();

    if (!instructeur) {
      return {
        success: false,
        message: "Je instructeursprofiel is nog niet compleet genoeg om pakketten toe te voegen.",
      };
    }

    instructeurId = instructeur.id;
  }

  const scopedPackages = await getScopedPackagesOrdered(instructeurId);
  const nextSortOrder =
    scopedPackages.length > 0
      ? Math.max(...scopedPackages.map((pkg) => Number(pkg.sort_order ?? 0))) + 1
      : 1;

  const insertPayload: Record<string, unknown> = {
    naam,
    beschrijving,
    prijs,
    praktijk_examen_prijs: praktijkExamenPrijs,
    zelf_inplannen_limiet_minuten_per_week: weeklyBookingLimitMinutes,
    aantal_lessen: aantalLessen,
    les_type: lesType,
    badge: badge || null,
    labels,
    actief: true,
    instructeur_id: instructeurId,
    sort_order: nextSortOrder,
    uitgelicht: false,
    icon_key: iconKey,
    visual_theme: visualTheme,
    cover_path: coverPath,
    cover_position: coverPosition,
    cover_focus_x: coverFocus?.x ?? null,
    cover_focus_y: coverFocus?.y ?? null,
  };

  const { error } = await supabase.from("pakketten").insert(insertPayload as never);

  if (error) {
    return {
      success: false,
      message: "Het pakket kon niet worden opgeslagen.",
    };
  }

  await revalidatePackagePaths(instructeurId);

  return {
    success: true,
    message:
      role === "instructeur"
        ? "Je pakket staat nu klaar op je profiel."
        : "Het platformpakket is toegevoegd.",
  };
}

export async function updatePackageDetailsAction(
  packageId: string,
  input: CreatePackageInput
) {
  const context = await getEditablePackageContext(packageId);

  if (!context.ok) {
    return {
      success: false,
      message: context.message,
    };
  }

  const validation = validatePackageInput(input);

  if (!validation.success) {
    return {
      success: false,
      message: validation.message,
    };
  }

  const {
    naam,
    beschrijving,
    badge,
    labels,
    prijs,
    praktijkExamenPrijs,
    weeklyBookingLimitMinutes,
    aantalLessen,
    lesType,
    iconKey,
    visualTheme,
    coverPath,
    coverChanged,
    coverPosition,
    coverFocus,
  } = validation.values;

  const coverValidation = await validateCoverOwnership(coverPath, coverChanged);

  if (!coverValidation.success) {
    return {
      success: false,
      message: coverValidation.message,
    };
  }

  const supabase = await createServerClient();
  const updates: {
    naam: string;
    beschrijving: string;
    prijs: number;
    praktijk_examen_prijs: number | null;
    zelf_inplannen_limiet_minuten_per_week: number | null;
    aantal_lessen: number;
    les_type: string;
    badge: string | null;
    labels: string[];
    icon_key: string;
    visual_theme: string;
    cover_position: string;
    cover_focus_x: number | null;
    cover_focus_y: number | null;
    cover_path?: string | null;
  } = {
    naam,
    beschrijving,
    prijs,
    praktijk_examen_prijs: praktijkExamenPrijs,
    zelf_inplannen_limiet_minuten_per_week: weeklyBookingLimitMinutes,
    aantal_lessen: aantalLessen,
    les_type: lesType,
    badge: badge || null,
    labels,
    icon_key: iconKey,
    visual_theme: visualTheme,
    cover_position: coverPosition,
    cover_focus_x: coverFocus?.x ?? null,
    cover_focus_y: coverFocus?.y ?? null,
  };

  if (coverChanged) {
    updates.cover_path = coverPath;
  }

  const { error } = await supabase
    .from("pakketten")
    .update(updates as never)
    .eq("id", packageId);

  if (error) {
    return {
      success: false,
      message: "Het pakket kon niet worden bijgewerkt.",
    };
  }

  await revalidatePackagePaths(context.packageRow.instructeur_id);

  return {
    success: true,
    message: `"${naam}" is bijgewerkt.`,
  };
}

export async function toggleFeaturedPackageAction(
  packageId: string,
  nextFeatured: boolean
) {
  const context = await getEditablePackageContext(packageId);

  if (!context.ok) {
    return {
      success: false,
      message: context.message,
    };
  }

  const supabase = await createServerClient();

  if (nextFeatured) {
    let resetQuery = supabase
      .from("pakketten")
      .update({ uitgelicht: false })
      .eq("uitgelicht", true);

    if (context.packageRow.instructeur_id) {
      resetQuery = resetQuery.eq("instructeur_id", context.packageRow.instructeur_id);
    } else {
      resetQuery = resetQuery.is("instructeur_id", null);
    }

    const { error: resetError } = await resetQuery;

    if (resetError) {
      return {
        success: false,
        message: "Het uitgelichte pakket kon niet worden bijgewerkt.",
      };
    }
  }

  const { error } = await supabase
    .from("pakketten")
    .update({ uitgelicht: nextFeatured })
    .eq("id", packageId);

  if (error) {
    return {
      success: false,
      message: "Het uitgelichte pakket kon niet worden opgeslagen.",
    };
  }

  await revalidatePackagePaths(context.packageRow.instructeur_id);

  return {
    success: true,
    message: nextFeatured
      ? `"${context.packageRow.naam}" staat nu bovenaan als uitgelicht pakket.`
      : `"${context.packageRow.naam}" is niet meer uitgelicht.`,
  };
}

export async function movePackageAction(
  packageId: string,
  direction: "up" | "down"
) {
  const context = await getEditablePackageContext(packageId);

  if (!context.ok) {
    return {
      success: false,
      message: context.message,
    };
  }

  const scopedPackages = await getScopedPackagesOrdered(context.packageRow.instructeur_id);
  const currentIndex = scopedPackages.findIndex((pkg) => pkg.id === packageId);

  if (currentIndex === -1) {
    return {
      success: false,
      message: "De pakketvolgorde kon niet worden bepaald.",
    };
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= scopedPackages.length) {
    return {
      success: false,
      message:
        direction === "up"
          ? "Dit pakket staat al bovenaan."
          : "Dit pakket staat al onderaan.",
    };
  }

  const currentPackage = scopedPackages[currentIndex];
  const targetPackage = scopedPackages[targetIndex];

  if (currentPackage.uitgelicht) {
    return {
      success: false,
      message: "Een uitgelicht pakket blijft bovenaan staan. Haal eerst de uitgelicht-status weg.",
    };
  }

  if (targetPackage.uitgelicht) {
    return {
      success: false,
      message: "Dit pakket staat direct onder een uitgelicht pakket en kan daar niet overheen bewegen.",
    };
  }

  const supabase = await createServerClient();

  const { error: currentError } = await supabase
    .from("pakketten")
    .update({ sort_order: targetPackage.sort_order })
    .eq("id", currentPackage.id);

  if (currentError) {
    return {
      success: false,
      message: "De nieuwe pakketvolgorde kon niet worden opgeslagen.",
    };
  }

  const { error: targetError } = await supabase
    .from("pakketten")
    .update({ sort_order: currentPackage.sort_order })
    .eq("id", targetPackage.id);

  if (targetError) {
    return {
      success: false,
      message: "De nieuwe pakketvolgorde kon niet worden opgeslagen.",
    };
  }

  await revalidatePackagePaths(context.packageRow.instructeur_id);

  return {
    success: true,
    message:
      direction === "up"
        ? `"${context.packageRow.naam}" is een plek omhoog gezet.`
        : `"${context.packageRow.naam}" is een plek omlaag gezet.`,
  };
}

export async function updatePackageStatusAction(
  packageId: string,
  nextActive: boolean
) {
  const context = await getEditablePackageContext(packageId);

  if (!context.ok) {
    return {
      success: false,
      message: context.message,
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("pakketten")
    .update({ actief: nextActive })
    .eq("id", packageId);

  if (error) {
    return {
      success: false,
      message: "De pakketstatus kon niet worden bijgewerkt.",
    };
  }

  await revalidatePackagePaths(context.packageRow.instructeur_id);

  return {
    success: true,
    message: nextActive
      ? "Het pakket is geactiveerd."
      : "Het pakket is gepauzeerd.",
  };
}

export async function deletePackageAction(packageId: string) {
  const context = await getEditablePackageContext(packageId);

  if (!context.ok) {
    return {
      success: false,
      message: context.message,
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("pakketten")
    .delete()
    .eq("id", packageId);

  if (error) {
    return {
      success: false,
      message: "Het pakket kon niet worden verwijderd.",
    };
  }

  await revalidatePackagePaths(context.packageRow.instructeur_id);

  return {
    success: true,
    message: `"${context.packageRow.naam}" is verwijderd.`,
  };
}
