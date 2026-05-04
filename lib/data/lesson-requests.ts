import "server-only";

import type { DashboardMetric, Les, LesAanvraag } from "@/lib/types";
import { createServerClient } from "@/lib/supabase/server";
import {
  ensureCurrentUserContext,
  getCurrentInstructeurRecord,
  getCurrentLeerlingRecord,
} from "@/lib/data/profiles";
import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import { getLearnerLessonCancellationAvailability } from "@/lib/lesson-cancellation";
import { getCurrentInstructorReviewSummary } from "@/lib/data/reviews";
import { formatCurrency } from "@/lib/format";
import { getRijlesType } from "@/lib/lesson-types";

type LessonRequestRow = {
  id: string;
  leerling_id?: string;
  instructeur_id?: string;
  voorkeursdatum: string | null;
  tijdvak: string | null;
  status: LesAanvraag["status"];
  bericht: string | null;
  aanvraag_type: LesAanvraag["aanvraag_type"];
  pakket_naam_snapshot: string | null;
  les_type: string | null;
};

type DashboardLessonRow = {
  id: string;
  titel: string;
  start_at: string | null;
  duur_minuten: number | null;
  status: Les["status"];
  locatie_id: string | null;
  leerling_id: string | null;
};

type DashboardEmbeddedProfile = {
  volledige_naam: string | null;
  email?: string | null;
};

type DashboardEmbeddedStudent = {
  id: string;
  profile: DashboardEmbeddedProfile | null;
};

type DashboardLessonWithStudentRow = DashboardLessonRow & {
  leerling: DashboardEmbeddedStudent | null;
};

type InstructorLessonWithStudentRow = DashboardLessonWithStudentRow & {
  aanwezigheid_status: Les["attendance_status"] | null;
  aanwezigheid_bevestigd_at: string | null;
  afwezigheids_reden: string | null;
  lesnotitie: string | null;
  herinnering_24h_verstuurd_at: string | null;
};

type DashboardRequestWithStudentRow = LessonRequestRow & {
  leerling: DashboardEmbeddedStudent | null;
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(dateString));
}

function formatTime(dateString: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(dateString));
}

function getEndAt(startAt: string | null, durationMinutes: number | null) {
  if (!startAt) {
    return null;
  }

  const endDate = new Date(startAt);
  endDate.setMinutes(endDate.getMinutes() + (durationMinutes ?? 60));
  return endDate.toISOString();
}

function toLocalDateTime(dateString: string, timeString: string) {
  const [hours, minutes] = timeString.split(":");

  if (!hours || !minutes) {
    return null;
  }

  return `${dateString}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
}

function parseRequestDateTime(
  preferredDate: string | null,
  timeSlot: string | null,
) {
  if (!preferredDate) {
    return { startAt: null, endAt: null };
  }

  const rangeMatch = timeSlot?.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);

  if (rangeMatch) {
    return {
      startAt: toLocalDateTime(preferredDate, rangeMatch[1]),
      endAt: toLocalDateTime(preferredDate, rangeMatch[2]),
    };
  }

  return {
    startAt: toLocalDateTime(preferredDate, "12:00"),
    endAt: toLocalDateTime(preferredDate, "13:00"),
  };
}

export async function getLeerlingLessonRequests(): Promise<LesAanvraag[]> {
  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return [];
  }

  const supabase = await createServerClient();
  const { data: rows, error } = (await supabase
    .from("lesaanvragen")
    .select(
      "id, instructeur_id, voorkeursdatum, tijdvak, status, bericht, pakket_naam_snapshot, les_type, aanvraag_type",
    )
    .eq("leerling_id", leerling.id)
    .order("created_at", { ascending: false })) as unknown as {
    data: LessonRequestRow[] | null;
    error: unknown;
  };

  if (error) {
    logSupabaseDataError("leerling.lessonRequests", error, {
      leerlingId: leerling.id,
    });
    return [];
  }

  if (!rows?.length) {
    return [];
  }

  const instructeurIds = rows
    .map((row) => row.instructeur_id)
    .filter((value): value is string => Boolean(value));
  const { data: instructeurs } = await supabase
    .from("instructeurs")
    .select("id, profile_id")
    .in("id", instructeurIds);

  const profileIds = (instructeurs ?? []).map((row) => row.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, volledige_naam")
    .in("id", profileIds);

  const instructeurMap = new Map(
    (instructeurs ?? []).map((row) => [row.id, row.profile_id]),
  );
  const profileMap = new Map(
    (profiles ?? []).map((row) => [row.id, row.volledige_naam]),
  );

  return rows.map((row) => {
    const requestDateTime = parseRequestDateTime(
      row.voorkeursdatum,
      row.tijdvak,
    );
    const instructorProfileId = row.instructeur_id
      ? instructeurMap.get(row.instructeur_id)
      : undefined;

    return {
      start_at: requestDateTime.startAt,
      end_at: requestDateTime.endAt,
      id: row.id,
      leerling_naam: "",
      instructeur_naam:
        (instructorProfileId ? profileMap.get(instructorProfileId) : null) ??
        "Instructeur",
      voorkeursdatum: row.voorkeursdatum
        ? formatDate(row.voorkeursdatum)
        : "Nog niet gekozen",
      tijdvak: row.tijdvak ?? "-",
      status: row.status,
      bericht: row.bericht ?? "",
      aanvraag_type: row.aanvraag_type ?? "algemeen",
      pakket_naam: row.pakket_naam_snapshot,
      les_type: row.les_type ? getRijlesType(row.les_type) : null,
    };
  });
}

export async function getInstructeurLessonRequests({
  limit,
}: {
  limit?: number;
} = {}): Promise<LesAanvraag[]> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  let requestQuery = supabase
    .from("lesaanvragen")
    .select(
      "id, leerling_id, voorkeursdatum, tijdvak, status, bericht, pakket_naam_snapshot, les_type, aanvraag_type, leerling:leerlingen!lesaanvragen_leerling_id_fkey(id, profile:profiles!leerlingen_profile_id_fkey(volledige_naam, email))",
    )
    .eq("instructeur_id", instructeur.id)
    .order("created_at", { ascending: false });

  if (limit && limit > 0) {
    requestQuery = requestQuery.limit(limit);
  }

  const { data: rows, error } = (await requestQuery) as unknown as {
    data: DashboardRequestWithStudentRow[] | null;
    error: unknown;
  };

  if (error) {
    logSupabaseDataError("instructeur.lessonRequests", error, {
      instructeurId: instructeur.id,
    });
    return [];
  }

  if (!rows?.length) {
    return [];
  }

  return rows.map((row) => {
    const requestDateTime = parseRequestDateTime(
      row.voorkeursdatum,
      row.tijdvak,
    );
    const studentProfile = row.leerling?.profile ?? null;

    return {
      start_at: requestDateTime.startAt,
      end_at: requestDateTime.endAt,
      id: row.id,
      leerling_naam: studentProfile?.volledige_naam ?? "Leerling",
      leerling_email: studentProfile?.email ?? null,
      instructeur_naam: "",
      voorkeursdatum: row.voorkeursdatum
        ? formatDate(row.voorkeursdatum)
        : "Nog niet gekozen",
      tijdvak: row.tijdvak ?? "-",
      status: row.status,
      bericht: row.bericht ?? "",
      aanvraag_type: row.aanvraag_type ?? "algemeen",
      pakket_naam: row.pakket_naam_snapshot,
      les_type: row.les_type ? getRijlesType(row.les_type) : null,
    };
  });
}

export async function getInstructeurDashboardLessonRequests({
  limit,
  status,
}: {
  limit?: number;
  status?: LesAanvraag["status"];
} = {}): Promise<LesAanvraag[]> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  let requestQuery = supabase
    .from("lesaanvragen")
    .select(
      "id, leerling_id, voorkeursdatum, tijdvak, status, pakket_naam_snapshot, les_type, aanvraag_type, leerling:leerlingen!lesaanvragen_leerling_id_fkey(id, profile:profiles!leerlingen_profile_id_fkey(volledige_naam))",
    )
    .eq("instructeur_id", instructeur.id);

  if (status) {
    requestQuery = requestQuery.eq("status", status);
  }

  requestQuery = requestQuery.order("created_at", { ascending: false });

  if (limit && limit > 0) {
    requestQuery = requestQuery.limit(limit);
  }

  const { data: rows, error } = (await requestQuery) as unknown as {
    data: DashboardRequestWithStudentRow[] | null;
    error: unknown;
  };

  if (error) {
    logSupabaseDataError("instructeur.dashboardLessonRequests", error, {
      instructeurId: instructeur.id,
      status: status ?? null,
    });
    return [];
  }

  if (!rows?.length) {
    return [];
  }

  return rows.map((row) => {
    const requestDateTime = parseRequestDateTime(
      row.voorkeursdatum,
      row.tijdvak,
    );
    const studentName = row.leerling?.profile?.volledige_naam ?? null;

    return {
      start_at: requestDateTime.startAt,
      end_at: requestDateTime.endAt,
      id: row.id,
      leerling_naam: studentName ?? "Leerling",
      leerling_email: null,
      instructeur_naam: "",
      voorkeursdatum: row.voorkeursdatum
        ? formatDate(row.voorkeursdatum)
        : "Nog niet gekozen",
      tijdvak: row.tijdvak ?? "-",
      status: row.status,
      bericht: "",
      aanvraag_type: row.aanvraag_type ?? "algemeen",
      pakket_naam: row.pakket_naam_snapshot,
      les_type: row.les_type ? getRijlesType(row.les_type) : null,
    };
  });
}

export async function getLeerlingLessons(): Promise<Les[]> {
  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return [];
  }

  const supabase = await createServerClient();
  const { data: rows, error } = await supabase
    .from("lessen")
    .select(
      "id, titel, start_at, duur_minuten, status, locatie_id, instructeur_id, aanwezigheid_status, aanwezigheid_bevestigd_at, afwezigheids_reden, lesnotitie, herinnering_24h_verstuurd_at",
    )
    .eq("leerling_id", leerling.id)
    .order("start_at", { ascending: true });

  if (error) {
    logSupabaseDataError("leerling.lessons", error, {
      leerlingId: leerling.id,
    });
    return [];
  }

  if (!rows?.length) {
    return [];
  }

  const instructeurIds = rows
    .map((row) => row.instructeur_id)
    .filter((value): value is string => Boolean(value));
  const locatieIds = rows
    .map((row) => row.locatie_id)
    .filter((value): value is string => Boolean(value));

  const [{ data: instructeurs }, { data: locaties }] = await Promise.all([
    instructeurIds.length
      ? supabase
          .from("instructeurs")
          .select("id, profile_id, leerling_annuleren_tot_uren_voor_les")
          .in("id", instructeurIds)
      : Promise.resolve({ data: [] }),
    locatieIds.length
      ? supabase.from("locaties").select("id, naam, stad").in("id", locatieIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileIds = (instructeurs ?? []).map((row) => row.profile_id);
  const { data: profiles } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, volledige_naam, email")
        .in("id", profileIds)
    : { data: [] };

  const instructeurMap = new Map(
    (instructeurs ?? []).map((row) => [row.id, row.profile_id]),
  );
  const instructorCancellationWindowMap = new Map(
    (instructeurs ?? []).map((row) => [
      row.id,
      row.leerling_annuleren_tot_uren_voor_les ?? null,
    ]),
  );
  const profileMap = new Map(
    (profiles ?? []).map((row) => [row.id, row.volledige_naam]),
  );
  const locatieMap = new Map(
    (locaties ?? []).map((row) => [
      row.id,
      row.naam ? `${row.naam}, ${row.stad}` : row.stad,
    ]),
  );

  return rows.map((row) => {
    const selfCancellation = getLearnerLessonCancellationAvailability({
      startAt: row.start_at,
      status: row.status,
      cancellationWindowHours: row.instructeur_id
        ? (instructorCancellationWindowMap.get(row.instructeur_id) ?? null)
        : null,
    });

    return {
      id: row.id,
      titel: row.titel,
      datum: row.start_at ? formatDate(row.start_at) : "Nog niet gepland",
      tijd: row.start_at ? formatTime(row.start_at) : "--:--",
      start_at: row.start_at,
      end_at: getEndAt(row.start_at, row.duur_minuten),
      duur_minuten: row.duur_minuten ?? 60,
      status: row.status,
      attendance_status: row.aanwezigheid_status,
      attendance_confirmed_at: row.aanwezigheid_bevestigd_at,
      attendance_reason: row.afwezigheids_reden,
      lesson_note: row.lesnotitie,
      reminder_24h_sent_at: row.herinnering_24h_verstuurd_at,
      canSelfCancel: selfCancellation.canCancel,
      selfCancelDeadlineAt: selfCancellation.deadlineAt,
      selfCancelWindowHours: selfCancellation.windowHours,
      selfCancelMessage: selfCancellation.message,
      locatie: row.locatie_id
        ? (locatieMap.get(row.locatie_id) ?? "Nog onbekend")
        : "Nog onbekend",
      locatie_id: row.locatie_id,
      leerling_naam: "",
      instructeur_naam: row.instructeur_id
        ? (profileMap.get(instructeurMap.get(row.instructeur_id) ?? "") ??
          "Instructeur")
        : "Instructeur",
    };
  });
}

export async function getInstructeurLessons({
  from,
  to,
  limit,
}: {
  from?: string;
  to?: string;
  limit?: number;
} = {}): Promise<Les[]> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  let lessonQuery = supabase
    .from("lessen")
    .select(
      "id, titel, start_at, duur_minuten, status, locatie_id, leerling_id, aanwezigheid_status, aanwezigheid_bevestigd_at, afwezigheids_reden, lesnotitie, herinnering_24h_verstuurd_at, leerling:leerlingen!lessen_leerling_id_fkey(id, profile:profiles!leerlingen_profile_id_fkey(volledige_naam, email))",
    )
    .eq("instructeur_id", instructeur.id);

  if (from) {
    lessonQuery = lessonQuery.gte("start_at", from);
  }

  if (to) {
    lessonQuery = lessonQuery.lte("start_at", to);
  }

  lessonQuery = lessonQuery.order("start_at", { ascending: false });

  if (limit && limit > 0) {
    lessonQuery = lessonQuery.limit(limit);
  }

  const { data: rows, error } = (await lessonQuery) as unknown as {
    data: InstructorLessonWithStudentRow[] | null;
    error: unknown;
  };

  if (error) {
    logSupabaseDataError("instructeur.lessons", error, {
      instructeurId: instructeur.id,
      from: from ?? null,
      to: to ?? null,
      limit: limit ?? null,
    });
    return [];
  }

  if (!rows?.length) {
    return [];
  }

  const locatieIds = rows
    .map((row) => row.locatie_id)
    .filter((value): value is string => Boolean(value));

  const { data: locaties } = locatieIds.length
    ? await supabase.from("locaties").select("id, naam, stad").in("id", locatieIds)
    : { data: [] };
  const locatieMap = new Map(
    (locaties ?? []).map((row) => [
      row.id,
      row.naam ? `${row.naam}, ${row.stad}` : row.stad,
    ]),
  );

  return [...rows]
    .sort((left, right) => (left.start_at ?? "").localeCompare(right.start_at ?? ""))
    .map((row) => ({
    id: row.id,
    titel: row.titel,
    datum: row.start_at ? formatDate(row.start_at) : "Nog niet gepland",
    tijd: row.start_at ? formatTime(row.start_at) : "--:--",
    start_at: row.start_at,
    end_at: getEndAt(row.start_at, row.duur_minuten),
    duur_minuten: row.duur_minuten ?? 60,
    status: row.status,
    attendance_status: row.aanwezigheid_status,
    attendance_confirmed_at: row.aanwezigheid_bevestigd_at,
    attendance_reason: row.afwezigheids_reden,
    lesson_note: row.lesnotitie,
    reminder_24h_sent_at: row.herinnering_24h_verstuurd_at,
    locatie: row.locatie_id
      ? (locatieMap.get(row.locatie_id) ?? "Nog onbekend")
      : "Nog onbekend",
    locatie_id: row.locatie_id,
    leerling_id: row.leerling_id,
    leerling_naam: row.leerling?.profile?.volledige_naam ?? "Leerling",
    leerling_email: row.leerling?.profile?.email ?? null,
      instructeur_naam: "",
    }));
}

export async function getInstructeurDashboardLessons({
  from,
  to,
  limit,
}: {
  from?: string;
  to?: string;
  limit?: number;
} = {}): Promise<Les[]> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  let lessonQuery = supabase
    .from("lessen")
    .select(
      "id, titel, start_at, duur_minuten, status, locatie_id, leerling_id, leerling:leerlingen!lessen_leerling_id_fkey(id, profile:profiles!leerlingen_profile_id_fkey(volledige_naam))",
    )
    .eq("instructeur_id", instructeur.id);

  if (from) {
    lessonQuery = lessonQuery.gte("start_at", from);
  }

  if (to) {
    lessonQuery = lessonQuery.lte("start_at", to);
  }

  lessonQuery = lessonQuery.order("start_at", { ascending: false });

  if (limit && limit > 0) {
    lessonQuery = lessonQuery.limit(limit);
  }

  const { data: rows, error } = (await lessonQuery) as unknown as {
    data: DashboardLessonWithStudentRow[] | null;
    error: unknown;
  };

  if (error) {
    logSupabaseDataError("instructeur.dashboardLessons", error, {
      instructeurId: instructeur.id,
      from: from ?? null,
      to: to ?? null,
      limit: limit ?? null,
    });
    return [];
  }

  if (!rows?.length) {
    return [];
  }

  return [...rows]
    .sort((left, right) => (left.start_at ?? "").localeCompare(right.start_at ?? ""))
    .map((row) => ({
      id: row.id,
      titel: row.titel,
      datum: row.start_at ? formatDate(row.start_at) : "Nog niet gepland",
      tijd: row.start_at ? formatTime(row.start_at) : "--:--",
      start_at: row.start_at,
      end_at: getEndAt(row.start_at, row.duur_minuten),
      duur_minuten: row.duur_minuten ?? 60,
      status: row.status,
      locatie: "Nog onbekend",
      locatie_id: row.locatie_id,
      leerling_id: row.leerling_id,
      leerling_naam: row.leerling?.profile?.volledige_naam ?? "Leerling",
      instructeur_naam: "",
    }));
}

export async function getInstructeurProfileLessonStats({
  from,
  limit = 240,
}: {
  from?: string;
  limit?: number;
} = {}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      active: 0,
      completed: 0,
      successRate: 0,
      total: 0,
    };
  }

  const supabase = await createServerClient();
  let query = supabase
    .from("lessen")
    .select("id, status")
    .eq("instructeur_id", instructeur.id);

  if (from) {
    query = query.gte("start_at", from);
  }

  if (limit > 0) {
    query = query.limit(limit);
  }

  const { data: rows, error } = await query;

  if (error) {
    logSupabaseDataError("instructeur.profileLessonStats", error, {
      instructeurId: instructeur.id,
      from: from ?? null,
      limit,
    });
    return {
      active: 0,
      completed: 0,
      successRate: 0,
      total: 0,
    };
  }

  if (!rows?.length) {
    return {
      active: 0,
      completed: 0,
      successRate: 0,
      total: 0,
    };
  }

  const completed = rows.filter((lesson) => lesson.status === "afgerond").length;
  const active = rows.filter((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status ?? ""),
  ).length;

  return {
    active,
    completed,
    successRate: Math.round((completed / rows.length) * 100),
    total: rows.length,
  };
}

export async function getLeerlingDashboardMetrics(): Promise<
  DashboardMetric[]
> {
  const context = await ensureCurrentUserContext();
  const leerling = await getCurrentLeerlingRecord();

  if (!context || !leerling) {
    return [
      {
        label: "Volgende les",
        waarde: "Nog geen les",
        context: "Log in als leerling om je planning te zien",
      },
      {
        label: "Voortgang",
        waarde: "0%",
        context: "Nog geen leerlingprofiel gekoppeld",
      },
      {
        label: "Open aanvragen",
        waarde: "0",
        context: "Geen aanvragen geladen",
      },
      {
        label: "Favoriete instructeurs",
        waarde: "0",
        context: "Geen favorieten geladen",
      },
    ];
  }

  const [lessons, requests] = await Promise.all([
    getLeerlingLessons(),
    getLeerlingLessonRequests(),
  ]);

  const nextLesson = lessons.find((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status),
  );
  const pendingRequests = requests.filter(
    (item) => item.status === "aangevraagd",
  ).length;

  return [
    {
      label: "Volgende les",
      waarde: nextLesson ? `${nextLesson.datum}` : "Nog geen les",
      context: nextLesson
        ? `${nextLesson.tijd} met ${nextLesson.instructeur_naam}`
        : "Vraag je eerste les aan bij een instructeur",
    },
    {
      label: "Voortgang",
      waarde: `${leerling.voortgang_percentage ?? 0}%`,
      context: "Voortgang uit je leerlingprofiel",
    },
    {
      label: "Open aanvragen",
      waarde: `${pendingRequests}`,
      context: "Aanvragen die nog wachten op reactie",
    },
    {
      label: "Favoriete instructeurs",
      waarde: `${leerling.favoriete_instructeurs?.length ?? 0}`,
      context: "Opgeslagen favorieten in je profiel",
    },
  ];
}

export async function getInstructeurDashboardMetrics(): Promise<
  DashboardMetric[]
> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [
      {
        label: "Lessen vandaag",
        waarde: "0",
        context: "Log in als instructeur om je planning te zien",
      },
      {
        label: "Open aanvragen",
        waarde: "0",
        context: "Geen aanvragen geladen",
      },
      {
        label: "PotentiÃ«le omzet",
        waarde: formatCurrency(0),
        context: "Geen geplande lessen geladen",
      },
      {
        label: "Reviewscore",
        waarde: "Nog geen reviews",
        context: "Geen reviewdata geladen",
      },
      {
        label: "Reviews",
        waarde: "0",
        context: "Geen zichtbare reviews geladen",
      },
      {
        label: "Reactiegraad",
        waarde: "0%",
        context: "Geen reviewreacties geladen",
      },
      {
        label: "Laatste 30 dagen",
        waarde: "0",
        context: "Geen recente reviewactiviteit geladen",
      },
    ];
  }

  const [lessons, requests, reviewSummary] = await Promise.all([
    getInstructeurLessons(),
    getInstructeurLessonRequests(),
    getCurrentInstructorReviewSummary(),
  ]);

  const openRequests = requests.filter(
    (item) => item.status === "aangevraagd",
  ).length;
  const todayLessons = lessons.filter(
    (lesson) => lesson.datum === formatDate(new Date().toISOString()),
  ).length;
  const plannedLessons = lessons.filter((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status),
  ).length;
  const revenue = plannedLessons * Number(instructeur.prijs_per_les ?? 0);

  return [
    {
      label: "Lessen vandaag",
      waarde: `${todayLessons}`,
      context: "Aantal lessen gepland op de huidige dag",
    },
    {
      label: "Open aanvragen",
      waarde: `${openRequests}`,
      context: "Aanvragen die wachten op acceptatie of afwijzing",
    },
    {
      label: "Potentiële omzet",
      waarde: formatCurrency(revenue),
      context: "Op basis van geplande en geaccepteerde lessen",
    },
    {
      label: "Reviewscore",
      waarde: reviewSummary.reviewCount
        ? `${reviewSummary.averageScore.toFixed(1)} / 5`
        : "Nog geen reviews",
      context: reviewSummary.reviewCount
        ? `${reviewSummary.reviewCount} zichtbare review${reviewSummary.reviewCount === 1 ? "" : "s"} op je profiel`
        : "Na afgeronde lessen kunnen leerlingen hier social proof toevoegen",
    },
    {
      label: "Reviews",
      waarde: `${reviewSummary.reviewCount}`,
      context: reviewSummary.latestReviews[0]
        ? `Laatste review: ${reviewSummary.latestReviews[0].titel}`
        : "Nog geen zichtbare reviews op je publieke profiel",
    },
    {
      label: "Reactiegraad",
      waarde: `${reviewSummary.replyRate}%`,
      context: reviewSummary.reviewCount
        ? `${reviewSummary.repliedCount} van ${reviewSummary.reviewCount} reviews heeft al een instructeurreply`
        : "Replies worden zichtbaar zodra je eerste review binnenkomt",
    },
    {
      label: "Laatste 30 dagen",
      waarde: `${reviewSummary.recentThirtyDayCount}`,
      context:
        reviewSummary.recentThirtyDayCount > 0
          ? "Nieuwe reviews in de afgelopen maand"
          : "Nog geen nieuwe reviewactiviteit in de afgelopen maand",
    },
  ];
}
