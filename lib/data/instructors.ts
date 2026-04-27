import "server-only";

import {
  instructeurs,
  pakkettenPerInstructeur,
  reviewsPerInstructeur,
} from "@/lib/mock-data";
import {
  formatAvailabilityDay,
  formatAvailabilityWindow,
} from "@/lib/availability";
import { buildRecurringAvailabilitySlots } from "@/lib/availability-week-rules";
import type {
  BeschikbaarheidSlot,
  BeschikbaarheidWeekrooster,
  InstructeurProfiel,
  RijlesType,
  Review,
} from "@/lib/types";
import {
  getLatestVisibleReviewsByInstructorIds,
  getReviewStatsByInstructorIds,
} from "@/lib/data/reviews";
import { createServerClient } from "@/lib/supabase/server";

type DbInstructorRow = {
  id: string;
  profile_id: string;
  slug: string;
  volledige_naam: string | null;
  avatar_url: string | null;
  bio: string | null;
  ervaring_jaren: number | null;
  werkgebied: string[] | null;
  prijs_per_les: number | string | null;
  transmissie: InstructeurProfiel["transmissie"] | null;
  beoordeling: number | string | null;
  profiel_status: string | null;
  profiel_compleetheid: number | null;
  specialisaties: string[] | null;
  profielfoto_kleur: string | null;
};

const gradientPalette = [
  "from-amber-300 via-orange-400 to-rose-500",
  "from-sky-300 via-cyan-400 to-blue-600",
  "from-emerald-300 via-teal-400 to-cyan-600",
  "from-fuchsia-300 via-pink-400 to-rose-500",
  "from-indigo-300 via-violet-400 to-purple-600",
];

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function mapInstructor(
  row: DbInstructorRow,
  reviewStats?: {
    reviewCount: number;
    averageScore: number;
  },
  latestReview?: InstructeurProfiel["recente_review"]
): InstructeurProfiel {
  const base = instructeurs.find((item) => item.slug === row.slug);
  const resolvedReviewCount =
    reviewStats?.reviewCount ?? base?.aantal_reviews ?? 0;
  const resolvedRating =
    reviewStats && reviewStats.reviewCount > 0
      ? reviewStats.averageScore
      : toNumber(row.beoordeling, base?.beoordeling ?? 0);

  return {
    id: row.id,
    slug: row.slug,
    volledige_naam:
      row.volledige_naam || base?.volledige_naam || "Instructeur",
    email: base?.email || "",
    telefoon: base?.telefoon || "",
    avatar_url: row.avatar_url || base?.avatar_url || null,
    rol: "instructeur",
    created_at: base?.created_at || new Date().toISOString(),
    updated_at: base?.updated_at || new Date().toISOString(),
    bio: row.bio || base?.bio || "Nog geen introductietekst toegevoegd.",
    ervaring_jaren: row.ervaring_jaren ?? base?.ervaring_jaren ?? 0,
    prijs_per_les: toNumber(row.prijs_per_les, base?.prijs_per_les ?? 0),
    beoordeling: resolvedRating,
    aantal_reviews: resolvedReviewCount,
    recente_review: latestReview ?? null,
    transmissie: row.transmissie || base?.transmissie || "beide",
    steden: row.werkgebied?.length ? row.werkgebied : base?.steden || [],
    specialisaties:
      row.specialisaties?.length ? row.specialisaties : base?.specialisaties || [],
    profielfoto_kleur:
      row.profielfoto_kleur ||
      base?.profielfoto_kleur ||
      gradientPalette[
        Math.abs(row.id.length + row.slug.length) % gradientPalette.length
      ],
    status:
      row.profiel_status === "goedgekeurd" ||
      row.profiel_status === "in_beoordeling"
        ? row.profiel_status
        : "concept",
    profiel_voltooid: row.profiel_compleetheid ?? base?.profiel_voltooid ?? 0,
  };
}

export async function getPublicInstructors() {
  const supabase = await createServerClient();
  const { data: rows, error } = await supabase
    .from("instructeurs")
    .select(
      "id, profile_id, slug, volledige_naam, avatar_url, bio, ervaring_jaren, werkgebied, prijs_per_les, transmissie, beoordeling, profiel_status, profiel_compleetheid, specialisaties, profielfoto_kleur"
    )
    .order("created_at", { ascending: false });

  if (error || !rows?.length) {
    return instructeurs;
  }

  const instructorIds = rows.map((row) => row.id);
  const [reviewStatsMap, latestReviewMap] = await Promise.all([
    getReviewStatsByInstructorIds(instructorIds),
    getLatestVisibleReviewsByInstructorIds(instructorIds),
  ]);

  return rows.map((row) =>
    mapInstructor(
      row as DbInstructorRow,
      reviewStatsMap.get(row.id),
      latestReviewMap.get(row.id)
    )
  );
}

export async function getPublicInstructorsByLessonType(lesType: RijlesType) {
  const allInstructors = await getPublicInstructors();
  const supabase = await createServerClient();
  const { data: packageRows, error } = (await supabase
    .from("pakketten")
    .select("instructeur_id")
    .eq("actief", true)
    .filter("les_type", "eq", lesType)
    .not("instructeur_id", "is", null)) as unknown as {
    data: Array<{ instructeur_id: string | null }> | null;
    error: unknown;
  };

  if (error || !packageRows?.length) {
    const fallbackSlugs = new Set(
      Object.entries(pakkettenPerInstructeur)
        .filter(([, packages]) => packages.some((pkg) => pkg.les_type === lesType))
        .map(([slug]) => slug)
    );

    return allInstructors.filter((instructor) => fallbackSlugs.has(instructor.slug));
  }

  const supportedInstructorIds = new Set(
    packageRows
      .map((row) => row.instructeur_id)
      .filter((value): value is string => Boolean(value))
  );

  return allInstructors.filter((instructor) => supportedInstructorIds.has(instructor.id));
}

export async function getPublicInstructorBySlug(slug: string) {
  const liveInstructors = await getPublicInstructors();
  return liveInstructors.find((item) => item.slug === slug) ?? null;
}

export async function getInstructorReviews(slug: string): Promise<Review[]> {
  const instructor = await getPublicInstructorBySlug(slug);

  if (!instructor) {
    return [];
  }

  const supabase = await createServerClient();
  const { data: reviewRows, error } = await supabase
    .from("reviews")
    .select(
      "id, score, titel, tekst, created_at, leerling_naam_snapshot, antwoord_tekst, antwoord_datum"
    )
    .eq("instructeur_id", instructor.id)
    .eq("verborgen", false)
    .order("created_at", { ascending: false });

  if (error || !reviewRows?.length) {
    return reviewsPerInstructeur[slug] ?? [];
  }

  return reviewRows.map((row) => ({
    id: row.id,
    leerling_naam: row.leerling_naam_snapshot || "Leerling",
    score: row.score,
    titel: row.titel || "Review",
    tekst: row.tekst || "",
    datum: new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(row.created_at)),
    antwoord_tekst: row.antwoord_tekst || null,
    antwoord_datum: row.antwoord_datum
      ? new Intl.DateTimeFormat("nl-NL", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(row.antwoord_datum))
      : null,
  }));
}

export async function getInstructorAvailability(
  slug: string
): Promise<BeschikbaarheidSlot[]> {
  const instructor = await getPublicInstructorBySlug(slug);

  if (!instructor) {
    return [];
  }

  const supabase = await createServerClient();
  const [{ data: slots, error }, { data: ruleRows }] = await Promise.all([
    supabase
      .from("beschikbaarheid")
      .select("id, start_at, eind_at, beschikbaar")
      .eq("instructeur_id", instructor.id)
      .eq("beschikbaar", true)
      .gte("eind_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(24),
    supabase
      .from("beschikbaarheid_weekroosters")
      .select(
        "id, instructeur_id, weekdag, start_tijd, eind_tijd, pauze_start_tijd, pauze_eind_tijd, beschikbaar, actief"
      )
      .eq("instructeur_id", instructor.id)
      .eq("actief", true)
      .eq("beschikbaar", true),
  ]);

  if (error) {
    return [];
  }

  const concreteSlots = (slots ?? []).map((slot) => ({
    id: slot.id,
    dag: formatAvailabilityDay(slot.start_at),
    tijdvak: formatAvailabilityWindow(slot.start_at, slot.eind_at),
    beschikbaar: slot.beschikbaar,
    start_at: slot.start_at,
    eind_at: slot.eind_at,
    source: "slot" as const,
    weekrooster_id: null,
  }));

  const recurringSlots = buildRecurringAvailabilitySlots({
    rules: (ruleRows ?? []) as BeschikbaarheidWeekrooster[],
    concreteSlots,
  });

  return [...concreteSlots, ...recurringSlots]
    .sort((left, right) => (left.start_at ?? "").localeCompare(right.start_at ?? ""))
    .slice(0, 24);
}

export async function getPublicInstructorAvailabilityMap(
  instructorIds: string[]
): Promise<Record<string, BeschikbaarheidSlot[]>> {
  const uniqueInstructorIds = Array.from(new Set(instructorIds.filter(Boolean)));

  if (!uniqueInstructorIds.length) {
    return {};
  }

  const supabase = await createServerClient();
  const [{ data: slotRows, error }, { data: ruleRows }] = await Promise.all([
    supabase
      .from("beschikbaarheid")
      .select("id, instructeur_id, start_at, eind_at, beschikbaar")
      .in("instructeur_id", uniqueInstructorIds)
      .eq("beschikbaar", true)
      .gte("eind_at", new Date().toISOString())
      .order("start_at", { ascending: true }),
    supabase
      .from("beschikbaarheid_weekroosters")
      .select(
        "id, instructeur_id, weekdag, start_tijd, eind_tijd, pauze_start_tijd, pauze_eind_tijd, beschikbaar, actief"
      )
      .in("instructeur_id", uniqueInstructorIds)
      .eq("actief", true)
      .eq("beschikbaar", true),
  ]);

  if (error) {
    return {};
  }

  const concreteSlotsByInstructor = (slotRows ?? []).reduce<
    Record<string, BeschikbaarheidSlot[]>
  >((accumulator, slot) => {
    if (!slot.instructeur_id) {
      return accumulator;
    }

    if (!accumulator[slot.instructeur_id]) {
      accumulator[slot.instructeur_id] = [];
    }

    accumulator[slot.instructeur_id].push({
      id: slot.id,
      dag: formatAvailabilityDay(slot.start_at),
      tijdvak: formatAvailabilityWindow(slot.start_at, slot.eind_at),
      beschikbaar: slot.beschikbaar,
      start_at: slot.start_at,
      eind_at: slot.eind_at,
      source: "slot",
      weekrooster_id: null,
    });

    return accumulator;
  }, {});

  return uniqueInstructorIds.reduce<Record<string, BeschikbaarheidSlot[]>>(
    (accumulator, instructorId) => {
      const concreteSlots = concreteSlotsByInstructor[instructorId] ?? [];
      const recurringSlots = buildRecurringAvailabilitySlots({
        rules: ((ruleRows ?? []) as BeschikbaarheidWeekrooster[]).filter(
          (rule) => rule.instructeur_id === instructorId
        ),
        concreteSlots,
      });

      const mergedSlots = [...concreteSlots, ...recurringSlots]
        .sort((left, right) => (left.start_at ?? "").localeCompare(right.start_at ?? ""))
        .slice(0, 3);

      if (mergedSlots.length) {
        accumulator[instructorId] = mergedSlots;
      }

      return accumulator;
    },
    {}
  );
}
