import "server-only";

import { cache } from "react";
import {
  formatAvailabilityDay,
  formatAvailabilityWindow,
} from "@/lib/availability";
import { buildRecurringAvailabilitySlots } from "@/lib/availability-week-rules";
import {
  ACTIVE_BOOKED_LESSON_STATUSES,
  ACTIVE_REQUEST_HOLD_STATUSES,
  createBookingWindowFromLesson,
  createBookingWindowFromRequest,
  filterBookableAvailabilitySlots,
  type BookingWindow,
} from "@/lib/booking-availability";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import type {
  BeschikbaarheidSlot,
  BeschikbaarheidWeekrooster,
  InstructeurProfiel,
  LesStatus,
  RijlesType,
  Review,
  TransmissieType,
} from "@/lib/types";
import {
  getLatestVisibleReviewsByInstructorIds,
  getReviewStatsByInstructorIds,
} from "@/lib/data/reviews";
import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import { normalizeCityForSlug } from "@/lib/seo-cities";
import { createPublicServerClient } from "@/lib/supabase/public";

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
  online_boeken_actief: boolean | null;
  standaard_rijles_duur_minuten: number | null;
  standaard_proefles_duur_minuten: number | null;
  standaard_pakketles_duur_minuten: number | null;
  standaard_examenrit_duur_minuten: number | null;
  transmissie: InstructeurProfiel["transmissie"] | null;
  beoordeling: number | string | null;
  profiel_status: string | null;
  profiel_compleetheid: number | null;
  specialisaties: string[] | null;
  profielfoto_kleur: string | null;
  created_at: string;
  updated_at: string;
};

type PublicInstructorProfileRow = {
  id: string;
  volledige_naam: string | null;
  email: string | null;
  telefoon: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type InstructorBookedLessonRow = {
  id: string;
  instructeur_id?: string | null;
  titel: string;
  start_at: string | null;
  duur_minuten: number;
  status: LesStatus;
};

type InstructorRequestHoldRow = {
  id: string;
  instructeur_id?: string | null;
  voorkeursdatum: string | null;
  tijdvak: string | null;
  status: LesStatus;
  pakket_naam_snapshot: string | null;
  aanvraag_type: string | null;
};

const gradientPalette = [
  "from-amber-300 via-orange-400 to-rose-500",
  "from-sky-300 via-cyan-400 to-blue-600",
  "from-emerald-300 via-teal-400 to-cyan-600",
  "from-fuchsia-300 via-pink-400 to-rose-500",
  "from-indigo-300 via-violet-400 to-purple-600",
];

function getOptionalPublicClient() {
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
  latestReview?: InstructeurProfiel["recente_review"],
  profile?: PublicInstructorProfileRow | null
): InstructeurProfiel {
  const durationDefaults = resolveInstructorLessonDurationDefaults(row);
  const resolvedReviewCount = reviewStats?.reviewCount ?? 0;
  const resolvedRating =
    reviewStats && reviewStats.reviewCount > 0
      ? reviewStats.averageScore
      : toNumber(row.beoordeling, 0);

  return {
    id: row.id,
    slug: row.slug,
    volledige_naam:
      row.volledige_naam || profile?.volledige_naam || "Instructeur",
    email: profile?.email ?? "",
    telefoon: profile?.telefoon ?? "",
    avatar_url: row.avatar_url || profile?.avatar_url || null,
    rol: "instructeur",
    created_at: profile?.created_at ?? row.created_at,
    updated_at: profile?.updated_at ?? row.updated_at,
    bio: row.bio || "Nog geen introductietekst toegevoegd.",
    ervaring_jaren: row.ervaring_jaren ?? 0,
    prijs_per_les: toNumber(row.prijs_per_les, 0),
    online_boeken_actief: Boolean(row.online_boeken_actief),
    standaard_rijles_duur_minuten: durationDefaults.rijles,
    standaard_proefles_duur_minuten: durationDefaults.proefles,
    standaard_pakketles_duur_minuten: durationDefaults.pakketles,
    standaard_examenrit_duur_minuten: durationDefaults.examenrit,
    beoordeling: resolvedRating,
    aantal_reviews: resolvedReviewCount,
    recente_review: latestReview ?? null,
    transmissie: row.transmissie || "beide",
    steden: row.werkgebied?.length ? row.werkgebied : [],
    specialisaties:
      row.specialisaties?.length ? row.specialisaties : [],
    profielfoto_kleur:
      row.profielfoto_kleur ||
      gradientPalette[
        Math.abs(row.id.length + row.slug.length) % gradientPalette.length
      ],
    status:
      row.profiel_status === "goedgekeurd" ||
      row.profiel_status === "in_beoordeling"
        ? row.profiel_status
        : "concept",
    profiel_voltooid: row.profiel_compleetheid ?? 0,
  };
}

function appendBookingWindow(
  map: Map<string, BookingWindow[]>,
  instructorId: string | null | undefined,
  window: BookingWindow | null
) {
  if (!instructorId || !window) {
    return;
  }

  const existingWindows = map.get(instructorId) ?? [];
  existingWindows.push(window);
  map.set(instructorId, existingWindows);
}

export const getPublicInstructors = cache(async function getPublicInstructors() {
  const supabase = getOptionalPublicClient();

  if (!supabase) {
    logSupabaseDataError(
      "instructors.publicClient",
      new Error("Missing public Supabase environment"),
    );
    return [];
  }

  const { data: rows, error } = await supabase
    .from("instructeurs")
    .select(
      "id, profile_id, slug, volledige_naam, avatar_url, bio, ervaring_jaren, werkgebied, prijs_per_les, online_boeken_actief, standaard_rijles_duur_minuten, standaard_proefles_duur_minuten, standaard_pakketles_duur_minuten, standaard_examenrit_duur_minuten, transmissie, beoordeling, profiel_status, profiel_compleetheid, specialisaties, profielfoto_kleur, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error || !rows?.length) {
    if (error) {
      logSupabaseDataError("instructors.public", error);
    }
    return [];
  }

  const instructorIds = rows.map((row) => row.id);
  const profileIds = rows.map((row) => row.profile_id);
  const [reviewStatsMap, latestReviewMap, profilesResult] = await Promise.all([
    getReviewStatsByInstructorIds(instructorIds),
    getLatestVisibleReviewsByInstructorIds(instructorIds),
    supabase
      .from("profiles")
      .select("id, volledige_naam, email, telefoon, avatar_url, created_at, updated_at")
      .in("id", profileIds),
  ]);
  const profileMap = new Map(
    ((profilesResult.data ?? []) as PublicInstructorProfileRow[]).map(
      (profile) => [profile.id, profile],
    ),
  );

  return rows.map((row) =>
    mapInstructor(
      row as DbInstructorRow,
      reviewStatsMap.get(row.id),
      latestReviewMap.get(row.id),
      profileMap.get(row.profile_id) ?? null,
    )
  );
});

export const getPublicInstructorsByLessonType = cache(async function getPublicInstructorsByLessonType(lesType: RijlesType) {
  const allInstructors = await getPublicInstructors();
  const supabase = getOptionalPublicClient();

  if (!supabase) {
    logSupabaseDataError(
      "instructors.byLessonTypeClient",
      new Error("Missing public Supabase environment"),
      { lesType },
    );
    return [];
  }

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
    if (error) {
      logSupabaseDataError("instructors.byLessonType", error, { lesType });
    }
    return [];
  }

  const supportedInstructorIds = new Set(
    packageRows
      .map((row) => row.instructeur_id)
      .filter((value): value is string => Boolean(value))
  );

  return allInstructors.filter((instructor) => supportedInstructorIds.has(instructor.id));
});

export const getPublicInstructorsByCity = cache(async function getPublicInstructorsByCity(
  citySlug: string,
  lesType: RijlesType = "auto"
) {
  const instructors = await getPublicInstructorsByLessonType(lesType);

  return instructors.filter((instructor) =>
    instructor.steden.some((city) => normalizeCityForSlug(city) === citySlug)
  );
});

export const getPublicInstructorsByCityAndTransmission = cache(async function getPublicInstructorsByCityAndTransmission(
  citySlug: string,
  transmission: Extract<TransmissieType, "automaat" | "handgeschakeld">,
  lesType: RijlesType = "auto"
) {
  const cityInstructors = await getPublicInstructorsByCity(citySlug, lesType);

  return cityInstructors.filter((instructor) => {
    if (transmission === "automaat") {
      return (
        instructor.transmissie === "automaat" ||
        instructor.transmissie === "beide"
      );
    }

    return (
      instructor.transmissie === "handgeschakeld" ||
      instructor.transmissie === "beide"
    );
  });
});

export const getPublicInstructorBySlug = cache(async function getPublicInstructorBySlug(slug: string) {
  const liveInstructors = await getPublicInstructors();
  return liveInstructors.find((item) => item.slug === slug) ?? null;
});

export const getInstructorReviews = cache(async function getInstructorReviews(slug: string): Promise<Review[]> {
  const instructor = await getPublicInstructorBySlug(slug);

  if (!instructor) {
    return [];
  }

  const supabase = getOptionalPublicClient();

  if (!supabase) {
    logSupabaseDataError(
      "instructors.reviewsClient",
      new Error("Missing public Supabase environment"),
      { slug },
    );
    return [];
  }

  const { data: reviewRows, error } = await supabase
    .from("reviews")
    .select(
      "id, score, titel, tekst, created_at, leerling_naam_snapshot, antwoord_tekst, antwoord_datum"
    )
    .eq("instructeur_id", instructor.id)
    .eq("verborgen", false)
    .order("created_at", { ascending: false });

  if (error || !reviewRows?.length) {
    if (error) {
      logSupabaseDataError("instructors.reviews", error, {
        slug,
        instructeurId: instructor.id,
      });
    }
    return [];
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
});

export const getInstructorAvailability = cache(async function getInstructorAvailability(
  slug: string
): Promise<BeschikbaarheidSlot[]> {
  const instructor = await getPublicInstructorBySlug(slug);

  if (!instructor) {
    return [];
  }

  const supabase = getOptionalPublicClient();

  if (!supabase) {
    logSupabaseDataError(
      "instructors.availabilityClient",
      new Error("Missing public Supabase environment"),
      { slug },
    );
    return [];
  }

  const todayIso = new Date().toISOString();
  const todayDateValue = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
  }).format(new Date());
  const [
    { data: slots, error },
    { data: ruleRows },
    { data: lessonRows },
    { data: requestRows },
  ] = await Promise.all([
    supabase
      .from("beschikbaarheid")
      .select("id, start_at, eind_at, beschikbaar")
      .eq("instructeur_id", instructor.id)
      .gte("eind_at", todayIso)
      .order("start_at", { ascending: true }),
    supabase
      .from("beschikbaarheid_weekroosters")
      .select(
        "id, instructeur_id, weekdag, start_tijd, eind_tijd, pauze_start_tijd, pauze_eind_tijd, beschikbaar, actief"
      )
      .eq("instructeur_id", instructor.id)
      .eq("actief", true),
    (supabase
      .from("lessen")
      .select("id, titel, start_at, duur_minuten, status")
      .eq("instructeur_id", instructor.id)
      .in("status", [...ACTIVE_BOOKED_LESSON_STATUSES])
      .gte("start_at", todayIso)) as unknown as Promise<{
      data: InstructorBookedLessonRow[] | null;
    }>,
    (supabase
      .from("lesaanvragen")
      .select("id, voorkeursdatum, tijdvak, status, pakket_naam_snapshot, aanvraag_type")
      .eq("instructeur_id", instructor.id)
      .in("status", [...ACTIVE_REQUEST_HOLD_STATUSES])
      .gte("voorkeursdatum", todayDateValue)) as unknown as Promise<{
      data: InstructorRequestHoldRow[] | null;
    }>,
  ]);

  if (error) {
    logSupabaseDataError("instructors.availability", error, {
      slug,
      instructeurId: instructor.id,
    });
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

  const bookingWindows = [
    ...((lessonRows ?? [])
      .map((lesson) =>
        createBookingWindowFromLesson({
          startAt: lesson.start_at,
          durationMinutes: lesson.duur_minuten,
          status: lesson.status,
          label: lesson.titel,
        })
      )
      .filter(Boolean) as BookingWindow[]),
    ...((requestRows ?? [])
      .map((request) =>
        createBookingWindowFromRequest({
          preferredDate: request.voorkeursdatum,
          timeSlot: request.tijdvak,
          status: request.status,
          label:
            request.pakket_naam_snapshot ??
            (request.aanvraag_type === "proefles" ? "Proefles" : "Aanvraag"),
        })
      )
      .filter(Boolean) as BookingWindow[]),
  ];

  return filterBookableAvailabilitySlots(
    [...concreteSlots, ...recurringSlots].filter((slot) => slot.beschikbaar),
    bookingWindows
  )
    .sort((left, right) => (left.start_at ?? "").localeCompare(right.start_at ?? ""))
    .slice(0, 24);
});

export async function getPublicInstructorAvailabilityMap(
  instructorIds: string[],
  limit = 3
): Promise<Record<string, BeschikbaarheidSlot[]>> {
  const uniqueInstructorIds = Array.from(new Set(instructorIds.filter(Boolean)));

  if (!uniqueInstructorIds.length) {
    return {};
  }

  const supabase = getOptionalPublicClient();

  if (!supabase) {
    logSupabaseDataError(
      "instructors.availabilityMapClient",
      new Error("Missing public Supabase environment"),
      { instructorCount: uniqueInstructorIds.length },
    );
    return {};
  }

  const todayIso = new Date().toISOString();
  const todayDateValue = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
  }).format(new Date());
  const [
    { data: slotRows, error },
    { data: ruleRows },
    { data: lessonRows },
    { data: requestRows },
  ] = await Promise.all([
    supabase
      .from("beschikbaarheid")
      .select("id, instructeur_id, start_at, eind_at, beschikbaar")
      .in("instructeur_id", uniqueInstructorIds)
      .gte("eind_at", todayIso)
      .order("start_at", { ascending: true }),
    supabase
      .from("beschikbaarheid_weekroosters")
      .select(
        "id, instructeur_id, weekdag, start_tijd, eind_tijd, pauze_start_tijd, pauze_eind_tijd, beschikbaar, actief"
      )
      .in("instructeur_id", uniqueInstructorIds)
      .eq("actief", true),
    (supabase
      .from("lessen")
      .select("id, instructeur_id, titel, start_at, duur_minuten, status")
      .in("instructeur_id", uniqueInstructorIds)
      .in("status", [...ACTIVE_BOOKED_LESSON_STATUSES])
      .gte("start_at", todayIso)) as unknown as Promise<{
      data: InstructorBookedLessonRow[] | null;
    }>,
    (supabase
      .from("lesaanvragen")
      .select(
        "id, instructeur_id, voorkeursdatum, tijdvak, status, pakket_naam_snapshot, aanvraag_type"
      )
      .in("instructeur_id", uniqueInstructorIds)
      .in("status", [...ACTIVE_REQUEST_HOLD_STATUSES])
      .gte("voorkeursdatum", todayDateValue)) as unknown as Promise<{
      data: InstructorRequestHoldRow[] | null;
    }>,
  ]);

  if (error) {
    logSupabaseDataError("instructors.availabilityMap", error, {
      instructorCount: uniqueInstructorIds.length,
      limit,
    });
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
  const bookingWindowsByInstructor = new Map<string, BookingWindow[]>();

  for (const lesson of lessonRows ?? []) {
    appendBookingWindow(
      bookingWindowsByInstructor,
      lesson.instructeur_id,
      createBookingWindowFromLesson({
        startAt: lesson.start_at,
        durationMinutes: lesson.duur_minuten,
        status: lesson.status,
        label: lesson.titel,
      })
    );
  }

  for (const request of requestRows ?? []) {
    appendBookingWindow(
      bookingWindowsByInstructor,
      request.instructeur_id,
      createBookingWindowFromRequest({
        preferredDate: request.voorkeursdatum,
        timeSlot: request.tijdvak,
        status: request.status,
        label:
          request.pakket_naam_snapshot ??
          (request.aanvraag_type === "proefles" ? "Proefles" : "Aanvraag"),
      })
    );
  }

  return uniqueInstructorIds.reduce<Record<string, BeschikbaarheidSlot[]>>(
    (accumulator, instructorId) => {
      const concreteSlots = concreteSlotsByInstructor[instructorId] ?? [];
      const recurringSlots = buildRecurringAvailabilitySlots({
        rules: ((ruleRows ?? []) as BeschikbaarheidWeekrooster[]).filter(
          (rule) => rule.instructeur_id === instructorId
        ),
        concreteSlots,
      });

      const mergedSlots = filterBookableAvailabilitySlots(
        [...concreteSlots, ...recurringSlots].filter((slot) => slot.beschikbaar),
        bookingWindowsByInstructor.get(instructorId) ?? []
      )
        .sort((left, right) => (left.start_at ?? "").localeCompare(right.start_at ?? ""))
        .slice(0, limit);

      if (mergedSlots.length) {
        accumulator[instructorId] = mergedSlots;
      }

      return accumulator;
    },
    {}
  );
}
