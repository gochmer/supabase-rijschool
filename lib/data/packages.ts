import "server-only";

import { cache } from "react";
import type { Pakket, RijlesType } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { getRijlesType } from "@/lib/lesson-types";
import {
  getPackageCoverPositionKey,
  getPackageCoverUrl,
  parsePackageCoverFocusValue,
} from "@/lib/package-covers";
import { normalizePackageLabels } from "@/lib/package-labels";
import { getPackageIconKey, getPackageThemeKey } from "@/lib/package-visuals";
import { createPublicServerClient } from "@/lib/supabase/public";
import { createServerClient } from "@/lib/supabase/server";
import {
  getCurrentInstructeurRecord,
  getCurrentLeerlingRecord,
} from "@/lib/data/profiles";
import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import {
  getPublicInstructors,
  getPublicInstructorBySlug,
} from "@/lib/data/instructors";

type DbPackageRow = {
  id: string;
  naam: string;
  beschrijving: string | null;
  prijs: number | string | null;
  aantal_lessen: number | null;
  zelf_inplannen_limiet_minuten_per_week: number | null;
  actief: boolean | null;
  badge: string | null;
  labels: string[] | null;
  praktijk_examen_prijs: number | string | null;
  instructeur_id: string | null;
  sort_order: number | null;
  uitgelicht: boolean | null;
  icon_key: string | null;
  visual_theme: string | null;
  cover_path: string | null;
  cover_position: string | null;
  cover_focus_x: number | null;
  cover_focus_y: number | null;
  les_type: string | null;
};

type PackageQueryResult = {
  data: DbPackageRow[] | null;
  error: unknown;
};

type MaybePackageQueryResult = {
  data: DbPackageRow | null;
  error?: unknown;
};

function getOptionalPublicPackageClient() {
  try {
    return createPublicServerClient();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Missing env.NEXT_PUBLIC_SUPABASE")
    ) {
      return null;
    }

    throw error;
  }
}

function toPackagePrijs(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toOptionalPackagePrijs(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toPackage(row: DbPackageRow, instructeurNaam?: string | null): Pakket {
  return {
    id: row.id,
    naam: row.naam,
    beschrijving: row.beschrijving || "",
    prijs: toPackagePrijs(row.prijs),
    lessen: row.aantal_lessen ?? 0,
    zelf_inplannen_limiet_minuten_per_week:
      row.zelf_inplannen_limiet_minuten_per_week ?? null,
    les_type: getRijlesType(row.les_type),
    badge: row.badge || undefined,
    labels: normalizePackageLabels(row.labels),
    praktijk_examen_prijs: toOptionalPackagePrijs(row.praktijk_examen_prijs),
    actief: row.actief ?? true,
    instructeur_id: row.instructeur_id,
    instructeur_naam: instructeurNaam ?? null,
    sort_order: row.sort_order ?? 0,
    uitgelicht: row.uitgelicht ?? false,
    icon_key: getPackageIconKey(row.icon_key),
    visual_theme: getPackageThemeKey(row.visual_theme),
    cover_path: row.cover_path,
    cover_url: getPackageCoverUrl(row.cover_path),
    cover_position: getPackageCoverPositionKey(row.cover_position),
    cover_focus_x: parsePackageCoverFocusValue(row.cover_focus_x),
    cover_focus_y: parsePackageCoverFocusValue(row.cover_focus_y),
  };
}

export const getPublicPackages = cache(async function getPublicPackages(): Promise<Pakket[]> {
  const supabase = createPublicServerClient();
  const { data: packageRows, error } = (await supabase
    .from("pakketten")
    .select("id, naam, beschrijving, prijs, praktijk_examen_prijs, aantal_lessen, zelf_inplannen_limiet_minuten_per_week, actief, badge, labels, instructeur_id, sort_order, uitgelicht, icon_key, visual_theme, cover_path, cover_position, cover_focus_x, cover_focus_y, les_type")
    .is("instructeur_id", null)
    .filter("les_type", "eq", "auto")
    .eq("actief", true)
    .order("uitgelicht", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })) as unknown as PackageQueryResult;

  if (error) {
    logSupabaseDataError("packages.public", error, { lesType: "auto" });
    return [];
  }

  if (!packageRows?.length) {
    return [];
  }

  return packageRows.map((pkg) => toPackage(pkg as DbPackageRow));
});

export const getCatalogPackagesByLessonType = cache(async function getCatalogPackagesByLessonType(
  lesType: Pakket["les_type"]
): Promise<Pakket[]> {
  const supabase = createPublicServerClient();
  const { data: packageRows, error } = (await supabase
    .from("pakketten")
    .select("id, naam, beschrijving, prijs, praktijk_examen_prijs, aantal_lessen, zelf_inplannen_limiet_minuten_per_week, actief, badge, labels, instructeur_id, sort_order, uitgelicht, icon_key, visual_theme, cover_path, cover_position, cover_focus_x, cover_focus_y, les_type")
    .filter("les_type", "eq", lesType)
    .eq("actief", true)
    .order("uitgelicht", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })) as unknown as PackageQueryResult;

  if (error) {
    logSupabaseDataError("packages.catalogByLessonType", error, { lesType });
    return [];
  }

  if (!packageRows?.length) {
    return [];
  }

  const instructorIds = Array.from(
    new Set(
      packageRows
        .map((pkg) => pkg.instructeur_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  let instructorMap = new Map<string, { naam: string; slug: string }>();

  if (instructorIds.length) {
    const { data: instructorRows } = await supabase
      .from("instructeurs")
      .select("id, volledige_naam, slug")
      .in("id", instructorIds);

    instructorMap = new Map(
      (instructorRows ?? []).map((instructor) => [
        instructor.id,
        {
          naam: instructor.volledige_naam || "Instructeur",
          slug: instructor.slug,
        },
      ])
    );
  }

  return packageRows.map((pkg) => {
    const packageItem = toPackage(
      pkg as DbPackageRow,
      pkg.instructeur_id ? instructorMap.get(pkg.instructeur_id)?.naam ?? null : null
    );

    return {
      ...packageItem,
      instructeur_slug: pkg.instructeur_id
        ? instructorMap.get(pkg.instructeur_id)?.slug ?? null
        : null,
    };
  });
});

export const getPublicInstructorPackages = cache(async function getPublicInstructorPackages(
  slug: string,
  lesType?: RijlesType
): Promise<Pakket[]> {
  const instructor = await getPublicInstructorBySlug(slug);

  if (!instructor) {
    return [];
  }

  const supabase = createPublicServerClient();
  let query = supabase
    .from("pakketten")
    .select("id, naam, beschrijving, prijs, praktijk_examen_prijs, aantal_lessen, zelf_inplannen_limiet_minuten_per_week, actief, badge, labels, instructeur_id, sort_order, uitgelicht, icon_key, visual_theme, cover_path, cover_position, cover_focus_x, cover_focus_y, les_type")
    .eq("instructeur_id", instructor.id)
    .eq("actief", true);

  if (lesType) {
    query = query.filter("les_type", "eq", lesType);
  }

  const { data: packageRows, error } = (await query
    .order("uitgelicht", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })) as unknown as PackageQueryResult;

  if (error) {
    logSupabaseDataError("packages.publicInstructorPackages", error, {
      slug,
      lesType: lesType ?? null,
    });
    return [];
  }

  if (!packageRows?.length) {
    return [];
  }

  return packageRows.map((pkg) =>
    toPackage(pkg as DbPackageRow, instructor.volledige_naam)
  );
});

export async function getPublicInstructorPackageMap(
  instructorIds: string[],
  lesType?: RijlesType
): Promise<Record<string, Pakket[]>> {
  const uniqueInstructorIds = Array.from(
    new Set(instructorIds.filter(Boolean))
  );

  if (!uniqueInstructorIds.length) {
    return {};
  }

  const publicInstructors = await getPublicInstructors();
  const instructorById = new Map(
    publicInstructors.map((instructor) => [instructor.id, instructor])
  );
  const supabase = getOptionalPublicPackageClient();

  if (!supabase) {
    return {};
  }

  let query = supabase
    .from("pakketten")
    .select(
      "id, naam, beschrijving, prijs, praktijk_examen_prijs, aantal_lessen, zelf_inplannen_limiet_minuten_per_week, actief, badge, labels, instructeur_id, sort_order, uitgelicht, icon_key, visual_theme, cover_path, cover_position, cover_focus_x, cover_focus_y, les_type"
    )
    .in("instructeur_id", uniqueInstructorIds)
    .eq("actief", true);

  if (lesType) {
    query = query.filter("les_type", "eq", lesType);
  }

  const { data: packageRows, error } = (await query
    .order("uitgelicht", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })) as unknown as PackageQueryResult;

  if (error) {
    logSupabaseDataError("packages.publicInstructorPackageMap", error, {
      instructorCount: uniqueInstructorIds.length,
      lesType: lesType ?? null,
    });
    return {};
  }

  if (!packageRows?.length) {
    return {};
  }

  return packageRows.reduce<Record<string, Pakket[]>>((accumulator, pkg) => {
    if (!pkg.instructeur_id) {
      return accumulator;
    }

    const instructor = instructorById.get(pkg.instructeur_id);
    const packageItem = {
      ...toPackage(pkg as DbPackageRow, instructor?.volledige_naam ?? null),
      instructeur_slug: instructor?.slug ?? null,
    };

    if (!accumulator[pkg.instructeur_id]) {
      accumulator[pkg.instructeur_id] = [];
    }

    accumulator[pkg.instructeur_id].push(packageItem);
    return accumulator;
  }, {});
}

export const getCurrentInstructorPackages = cache(async function getCurrentInstructorPackages(): Promise<Pakket[]> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  const { data: packageRows, error } = (await supabase
    .from("pakketten")
    .select("id, naam, beschrijving, prijs, praktijk_examen_prijs, aantal_lessen, zelf_inplannen_limiet_minuten_per_week, actief, badge, labels, instructeur_id, sort_order, uitgelicht, icon_key, visual_theme, cover_path, cover_position, cover_focus_x, cover_focus_y, les_type")
    .eq("instructeur_id", instructeur.id)
    .order("uitgelicht", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })) as unknown as PackageQueryResult;

  if (error) {
    logSupabaseDataError("packages.currentInstructor", error, {
      instructeurId: instructeur.id,
    });
    return [];
  }

  if (!packageRows?.length) {
    return [];
  }

  return packageRows.map((pkg) => toPackage(pkg as DbPackageRow));
});

export const getCurrentInstructorDashboardPackages = cache(
  async function getCurrentInstructorDashboardPackages(): Promise<Pakket[]> {
    const instructeur = await getCurrentInstructeurRecord();

    if (!instructeur) {
      return [];
    }

    const supabase = await createServerClient();
    const { data: packageRows, error } = (await supabase
      .from("pakketten")
      .select(
        "id, naam, prijs, aantal_lessen, actief, instructeur_id, sort_order, uitgelicht, les_type",
      )
      .eq("instructeur_id", instructeur.id)
      .order("uitgelicht", { ascending: false })
      .order("sort_order", { ascending: true })
      .limit(24)) as unknown as PackageQueryResult;

    if (error) {
      logSupabaseDataError("packages.currentInstructorDashboard", error, {
        instructeurId: instructeur.id,
      });
      return [];
    }

    if (!packageRows?.length) {
      return [];
    }

    return packageRows.map((pkg) => ({
      id: pkg.id,
      naam: pkg.naam,
      beschrijving: "",
      prijs: toPackagePrijs(pkg.prijs),
      lessen: pkg.aantal_lessen ?? 0,
      les_type: getRijlesType(pkg.les_type),
      actief: pkg.actief ?? true,
      instructeur_id: pkg.instructeur_id,
      sort_order: pkg.sort_order ?? 0,
      uitgelicht: pkg.uitgelicht ?? false,
    }));
  },
);

export async function getCurrentStudentPackageOverview() {
  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return {
      assignedPackage: null,
      payments: [],
      availablePackages: [],
      lessonUsage: {
        totalLessons: null,
        plannedLessons: 0,
        usedLessons: 0,
        remainingLessons: null,
      },
    };
  }

  const supabase = await createServerClient();
  const [
    assignedPackageResult,
    packageLessonResult,
    paymentResult,
    packageResult,
  ] =
    await Promise.all([
      leerling.pakket_id
        ? (supabase
            .from("pakketten")
            .select("id, naam, beschrijving, prijs, praktijk_examen_prijs, aantal_lessen, zelf_inplannen_limiet_minuten_per_week, actief, badge, labels, instructeur_id, sort_order, uitgelicht, icon_key, visual_theme, cover_path, cover_position, cover_focus_x, cover_focus_y, les_type")
            .eq("id", leerling.pakket_id)
            .maybeSingle() as unknown as Promise<MaybePackageQueryResult>)
        : Promise.resolve({ data: null }),
      leerling.pakket_id
        ? (supabase
            .from("lessen")
            .select("id, status")
            .eq("leerling_id", leerling.id)
            .eq("pakket_id", leerling.pakket_id)
            .neq("status", "geannuleerd") as unknown as Promise<{
            data: Array<{ id: string; status: string | null }> | null;
            error?: unknown;
          }>)
        : Promise.resolve({ data: [] }),
      supabase
        .from("betalingen")
        .select("id, bedrag, status, betaald_at, created_at")
        .eq("profiel_id", leerling.profile_id)
        .order("created_at", { ascending: false }),
      (supabase
        .from("pakketten")
        .select("id, naam, prijs, praktijk_examen_prijs, aantal_lessen, zelf_inplannen_limiet_minuten_per_week, badge, labels, instructeur_id, sort_order, uitgelicht, icon_key, visual_theme, cover_path, cover_position, cover_focus_x, cover_focus_y, les_type")
        .is("instructeur_id", null)
        .filter("les_type", "eq", "auto")
        .eq("actief", true)
        .order("uitgelicht", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })) as unknown as Promise<PackageQueryResult>,
    ]);
  const queryErrors = [
    ["assignedPackage", (assignedPackageResult as { error?: unknown }).error],
    ["packageLessonUsage", (packageLessonResult as { error?: unknown }).error],
    ["payments", (paymentResult as { error?: unknown }).error],
    ["availablePackages", (packageResult as { error?: unknown }).error],
  ] as const;

  for (const [query, error] of queryErrors) {
    if (error) {
      logSupabaseDataError("packages.currentStudentOverview", error, {
        leerlingId: leerling.id,
        query,
      });
    }
  }

  const assignedPackage = assignedPackageResult.data;
  const packageLessonRows = packageLessonResult.data;
  const paymentRows = paymentResult.data;
  const packageRows = packageResult.data;
  const packageLessonUsageRows = packageLessonRows ?? [];
  const plannedPackageLessons = packageLessonUsageRows.filter((lesson) =>
    ["geaccepteerd", "ingepland"].includes(lesson.status ?? "")
  ).length;
  const usedPackageLessons = packageLessonUsageRows.filter(
    (lesson) => lesson.status === "afgerond"
  ).length;
  const assignedLessonTotal = assignedPackage?.aantal_lessen ?? null;
  const remainingPackageLessons =
    assignedLessonTotal && assignedLessonTotal > 0
      ? Math.max(assignedLessonTotal - plannedPackageLessons - usedPackageLessons, 0)
      : null;

  return {
    assignedPackage: assignedPackage
      ? {
          id: assignedPackage.id,
          naam: assignedPackage.naam,
          beschrijving: assignedPackage.beschrijving || "",
          lessen: assignedPackage.aantal_lessen,
          les_type: getRijlesType(assignedPackage.les_type),
          prijsLabel: formatCurrency(Number(assignedPackage.prijs ?? 0)),
          badge: assignedPackage.badge || undefined,
          labels: normalizePackageLabels(assignedPackage.labels),
          praktijk_examen_prijs: toOptionalPackagePrijs(
            assignedPackage.praktijk_examen_prijs
          ),
          uitgelicht: assignedPackage.uitgelicht ?? false,
          icon_key: getPackageIconKey(assignedPackage.icon_key),
          visual_theme: getPackageThemeKey(assignedPackage.visual_theme),
          cover_path: assignedPackage.cover_path,
          cover_url: getPackageCoverUrl(assignedPackage.cover_path),
          cover_position: getPackageCoverPositionKey(assignedPackage.cover_position),
          cover_focus_x: parsePackageCoverFocusValue(assignedPackage.cover_focus_x),
          cover_focus_y: parsePackageCoverFocusValue(assignedPackage.cover_focus_y),
        }
      : null,
    lessonUsage: {
      totalLessons: assignedLessonTotal,
      plannedLessons: plannedPackageLessons,
      usedLessons: usedPackageLessons,
      remainingLessons: remainingPackageLessons,
    },
    payments:
      paymentRows?.map((payment) => ({
        id: payment.id,
        omschrijving: "Pakketbetaling",
        bedrag: formatCurrency(Number(payment.bedrag ?? 0)),
        datum: new Intl.DateTimeFormat("nl-NL", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(new Date(payment.betaald_at || payment.created_at)),
        status: payment.status,
      })) ??
      [],
    availablePackages:
      packageRows?.map((pkg) => ({
        id: pkg.id,
        naam: pkg.naam,
        lessen: pkg.aantal_lessen,
        les_type: getRijlesType(pkg.les_type),
        prijsLabel: formatCurrency(Number(pkg.prijs ?? 0)),
        badge: pkg.badge || undefined,
        labels: normalizePackageLabels(pkg.labels),
        praktijk_examen_prijs: toOptionalPackagePrijs(pkg.praktijk_examen_prijs),
        uitgelicht: pkg.uitgelicht ?? false,
        icon_key: getPackageIconKey(pkg.icon_key),
        visual_theme: getPackageThemeKey(pkg.visual_theme),
        cover_path: pkg.cover_path,
        cover_url: getPackageCoverUrl(pkg.cover_path),
        cover_position: getPackageCoverPositionKey(pkg.cover_position),
        cover_focus_x: parsePackageCoverFocusValue(pkg.cover_focus_x),
        cover_focus_y: parsePackageCoverFocusValue(pkg.cover_focus_y),
      })) ?? [],
  };
}
