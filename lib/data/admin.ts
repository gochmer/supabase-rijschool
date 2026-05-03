import "server-only";

import {
  adminMetrics,
  betalingen,
  pakketten,
  reviewsPerInstructeur,
  supportTickets,
} from "@/lib/mock-data";
import type { DashboardMetric } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { getRijlesType } from "@/lib/lesson-types";
import {
  getPackageCoverPositionKey,
  getPackageCoverUrl,
  parsePackageCoverFocusValue,
} from "@/lib/package-covers";
import { normalizePackageLabels } from "@/lib/package-labels";
import { getPackageIconKey, getPackageThemeKey } from "@/lib/package-visuals";
import { createServerClient } from "@/lib/supabase/server";

type AdminPackageRow = {
  id: string;
  naam: string;
  beschrijving: string | null;
  prijs: number | string | null;
  aantal_lessen: number | null;
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
  created_at: string;
};

function formatDate(dateString: string | null | undefined) {
  if (!dateString) {
    return "-";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export async function getAdminDashboardMetrics(): Promise<DashboardMetric[]> {
  const supabase = await createServerClient();

  const [
    { count: totaalGebruikers },
    { count: totaalLeerlingen },
    { count: totaalInstructeurs },
    { count: openGoedkeuringen },
    { count: lessenDezeWeek },
    { data: recenteBetalingen },
    { count: openTickets },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("leerlingen").select("id", { count: "exact", head: true }),
    supabase.from("instructeurs").select("id", { count: "exact", head: true }),
    supabase
      .from("instructeurs")
      .select("id", { count: "exact", head: true })
      .neq("profiel_status", "goedgekeurd"),
    supabase
      .from("lessen")
      .select("id", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      ),
    supabase
      .from("betalingen")
      .select("bedrag")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .neq("status", "afgesloten"),
  ]);

  const omzet = (recenteBetalingen ?? []).reduce(
    (sum, item) => sum + Number(item.bedrag ?? 0),
    0
  );

  if (
    !totaalGebruikers &&
    !totaalLeerlingen &&
    !totaalInstructeurs &&
    !openGoedkeuringen &&
    !lessenDezeWeek &&
    !openTickets &&
    omzet === 0
  ) {
    return adminMetrics;
  }

  return [
    {
      label: "Actieve gebruikers",
      waarde: `${totaalGebruikers ?? 0}`,
      context: "Totaal aantal profielen binnen het platform",
    },
    {
      label: "Open goedkeuringen",
      waarde: `${openGoedkeuringen ?? 0}`,
      context: "Instructeurs die nog wachten op beoordeling",
    },
    {
      label: "Lessen deze week",
      waarde: `${lessenDezeWeek ?? 0}`,
      context: "Nieuwe of ingeplande lessen van de laatste 7 dagen",
    },
    {
      label: "Recente omzet",
      waarde: formatCurrency(omzet),
      context: "Som van de 5 meest recente betalingen",
    },
  ];
}

export async function getAdminUsers() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, volledige_naam, email, telefoon, rol, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    data?.map((row) => ({
      id: row.id,
      naam: row.volledige_naam,
      email: row.email,
      telefoon: row.telefoon ?? "",
      rol: row.rol,
      status: "actief",
      laatsteActiviteit: formatDate(row.updated_at || row.created_at),
    })) ?? []
  );
}

export async function getAdminInstructors() {
  const supabase = await createServerClient();
  const { data: rows } = await supabase
    .from("instructeurs")
    .select(
      "id, profile_id, werkgebied, profiel_status, profiel_compleetheid, prijs_per_les, transmissie, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (!rows?.length) {
    return [
      {
        id: "fallback-instructor",
        naam: "Sanne van Dijk",
        email: "sanne@rijbasis.nl",
        telefoon: "06 14 52 88 11",
        werkgebied: "Amsterdam, Amstelveen, Diemen",
        profiel: "96%",
        status: "in_beoordeling",
        prijs: formatCurrency(64),
        transmissie: "beide",
      },
    ];
  }

  const profileIds = rows.map((row) => row.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, volledige_naam, email, telefoon")
    .in("id", profileIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  return rows.map((row) => {
    const profile = profileMap.get(row.profile_id);
    return {
      id: row.id,
      naam: profile?.volledige_naam ?? "Instructeur",
      email: profile?.email ?? "",
      telefoon: profile?.telefoon ?? "",
      werkgebied: row.werkgebied?.join(", ") || "Nog niet ingevuld",
      profiel: `${row.profiel_compleetheid ?? 0}%`,
      status: row.profiel_status ?? "concept",
      prijs: formatCurrency(Number(row.prijs_per_les ?? 0)),
      transmissie: row.transmissie ?? "beide",
    };
  });
}

export async function getAdminStudents() {
  const supabase = await createServerClient();
  const { data: rows } = await supabase
    .from("leerlingen")
    .select("id, profile_id, voortgang_percentage, pakket_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!rows?.length) {
    return [
      {
        id: "fallback-student",
        naam: "Mila Jansen",
        email: "mila@voorbeeld.nl",
        telefoon: "06 11 22 33 44",
        pakket: "Starterspakket",
        voortgang: "74%",
        status: "actief",
      },
    ];
  }

  const profileIds = rows.map((row) => row.profile_id);
  const pakketIds = rows
    .map((row) => row.pakket_id)
    .filter((value): value is string => Boolean(value));

  const [{ data: profiles }, { data: pakkettenRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, volledige_naam, email, telefoon")
      .in("id", profileIds),
    pakketIds.length
      ? supabase.from("pakketten").select("id, naam").in("id", pakketIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );
  const pakketMap = new Map(
    (pakkettenRows ?? []).map((pakket) => [pakket.id, pakket])
  );

  return rows.map((row) => {
    const profile = profileMap.get(row.profile_id);
    return {
      id: row.id,
      naam: profile?.volledige_naam ?? "Leerling",
      email: profile?.email ?? "",
      telefoon: profile?.telefoon ?? "",
      pakket: row.pakket_id
        ? pakketMap.get(row.pakket_id)?.naam ?? "Onbekend pakket"
        : "Nog geen pakket",
      voortgang: `${row.voortgang_percentage ?? 0}%`,
      status: "actief",
    };
  });
}

export async function getAdminLessons() {
  const supabase = await createServerClient();
  const { data: rows } = await supabase
    .from("lessen")
    .select(
      "id, titel, status, start_at, leerling_id, instructeur_id, locatie_id, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (!rows?.length) {
    return [];
  }

  const leerlingIds = rows
    .map((row) => row.leerling_id)
    .filter((value): value is string => Boolean(value));
  const instructeurIds = rows
    .map((row) => row.instructeur_id)
    .filter((value): value is string => Boolean(value));

  const [{ data: leerlingen }, { data: instructeursRows }, { data: locaties }] =
    await Promise.all([
      leerlingIds.length
        ? supabase
            .from("leerlingen")
            .select("id, profile_id")
            .in("id", leerlingIds)
        : Promise.resolve({ data: [] }),
      instructeurIds.length
        ? supabase
            .from("instructeurs")
            .select("id, profile_id")
            .in("id", instructeurIds)
        : Promise.resolve({ data: [] }),
      supabase.from("locaties").select("id, naam, stad"),
    ]);

  const profileIds = [
    ...(leerlingen ?? []).map((item) => item.profile_id),
    ...(instructeursRows ?? []).map((item) => item.profile_id),
  ];

  const { data: profiles } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, volledige_naam")
        .in("id", profileIds)
    : { data: [] };

  const leerlingMap = new Map(
    (leerlingen ?? []).map((item) => [item.id, item.profile_id])
  );
  const instructeurMap = new Map(
    (instructeursRows ?? []).map((item) => [item.id, item.profile_id])
  );
  const profileMap = new Map(
    (profiles ?? []).map((item) => [item.id, item.volledige_naam])
  );
  const locatieMap = new Map(
    (locaties ?? []).map((locatie) => [
      locatie.id,
      locatie.naam ? `${locatie.naam}, ${locatie.stad}` : locatie.stad,
    ])
  );

  return rows.map((row) => ({
    id: row.id,
    titel: row.titel,
    leerling:
      row.leerling_id
        ? profileMap.get(leerlingMap.get(row.leerling_id) ?? "") ?? "Leerling"
        : "Leerling",
    instructeur:
      row.instructeur_id
        ? profileMap.get(instructeurMap.get(row.instructeur_id) ?? "") ??
          "Instructeur"
        : "Instructeur",
    status: row.status,
    datum: formatDate(row.start_at || row.created_at),
    locatie: row.locatie_id
      ? locatieMap.get(row.locatie_id) ?? "Onbekend"
      : "Onbekend",
  }));
}

export async function getAdminPayments() {
  const supabase = await createServerClient();
  const { data: rows } = await supabase
    .from("betalingen")
    .select("id, profiel_id, bedrag, status, provider, betaald_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!rows?.length) {
    return betalingen.map((payment) => ({
      id: payment.id,
      omschrijving: payment.omschrijving,
      bedrag: formatCurrency(payment.bedrag),
      datum: payment.datum,
      status: payment.status,
      gebruiker: "Mock leerling",
      provider: "mock",
    }));
  }

  const profileIds = rows.map((row) => row.profiel_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, volledige_naam")
    .in("id", profileIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  return rows.map((row) => ({
    id: row.id,
    omschrijving: "Platformbetaling",
    bedrag: formatCurrency(Number(row.bedrag ?? 0)),
    datum: formatDate(row.betaald_at || row.created_at),
    status: row.status,
    gebruiker: profileMap.get(row.profiel_id)?.volledige_naam ?? "Gebruiker",
    provider: row.provider ?? "mock",
  }));
}

export async function getAdminSupportTickets() {
  const supabase = await createServerClient();
  const { data: rows } = await supabase
    .from("support_tickets")
    .select("id, profiel_id, onderwerp, status, prioriteit, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!rows?.length) {
    return supportTickets.map((ticket) => ({
      id: ticket.id,
      onderwerp: ticket.onderwerp,
      status: ticket.status,
      prioriteit: ticket.prioriteit,
      gebruiker: ticket.gebruiker,
      datum: "Vandaag",
    }));
  }

  const profileIds = rows.map((row) => row.profiel_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, volledige_naam")
    .in("id", profileIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  return rows.map((row) => ({
    id: row.id,
    onderwerp: row.onderwerp,
    status: row.status,
    prioriteit: row.prioriteit,
    gebruiker: profileMap.get(row.profiel_id)?.volledige_naam ?? "Gebruiker",
    datum: formatDate(row.created_at),
  }));
}

export async function getAdminActivityFeed() {
  const [users, lessonsRows, paymentsRows, ticketsRows] = await Promise.all([
    getAdminUsers(),
    getAdminLessons(),
    getAdminPayments(),
    getAdminSupportTickets(),
  ]);

  const items = [
    ...users.slice(0, 3).map((user) => ({
      id: `user-${user.id}`,
      titel: `Nieuw of bijgewerkt profiel: ${user.naam}`,
      detail: `${user.rol} • laatste activiteit ${user.laatsteActiviteit}`,
      type: "Gebruiker",
    })),
    ...lessonsRows.slice(0, 3).map((lesson) => ({
      id: `lesson-${lesson.id}`,
      titel: `Lesstatus: ${lesson.titel}`,
      detail: `${lesson.leerling} • ${lesson.status} • ${lesson.datum}`,
      type: "Les",
    })),
    ...paymentsRows.slice(0, 2).map((payment) => ({
      id: `payment-${payment.id}`,
      titel: `Betaling ${payment.status}`,
      detail: `${payment.gebruiker} • ${payment.bedrag} • ${payment.datum}`,
      type: "Betaling",
    })),
    ...ticketsRows.slice(0, 2).map((ticket) => ({
      id: `ticket-${ticket.id}`,
      titel: `Support: ${ticket.onderwerp}`,
      detail: `${ticket.gebruiker} • ${ticket.prioriteit} • ${ticket.status}`,
      type: "Support",
    })),
  ];

  return items.slice(0, 8);
}

export async function getAdminApprovalQueue() {
  const instructors = await getAdminInstructors();
  return instructors
    .filter((item) => item.status !== "goedgekeurd")
    .slice(0, 8);
}

export async function getAdminReviews() {
  const supabase = await createServerClient();
  const { data: rows } = await supabase
    .from("reviews")
    .select(
      "id, leerling_id, instructeur_id, score, titel, tekst, created_at, moderatie_status, moderatie_notitie, verborgen, antwoord_tekst"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (!rows?.length) {
    return Object.values(reviewsPerInstructeur).flat().map((review) => ({
      id: review.id,
      leerling: review.leerling_naam,
      instructeur: "Instructeur",
      score: `${review.score}`,
      titel: review.titel,
      tekst: review.tekst,
      datum: review.datum,
      moderatieStatus: "zichtbaar",
      moderatieNotitie: null,
      antwoordTekst: null,
      reportCount: 0,
      latestReportReason: null,
      latestReportStatus: null,
    }));
  }

  const leerlingIds = rows.map((row) => row.leerling_id);
  const instructeurIds = rows.map((row) => row.instructeur_id);
  const reviewIds = rows.map((row) => row.id);

  const [{ data: leerlingen }, { data: instructeursRows }, { data: reviewReports }] =
    await Promise.all([
    supabase.from("leerlingen").select("id, profile_id").in("id", leerlingIds),
    supabase
      .from("instructeurs")
      .select("id, profile_id")
      .in("id", instructeurIds),
    reviewIds.length
      ? supabase
          .from("review_reports")
          .select("review_id, reden, status, created_at")
          .in("review_id", reviewIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const profileIds = [
    ...(leerlingen ?? []).map((item) => item.profile_id),
    ...(instructeursRows ?? []).map((item) => item.profile_id),
  ];

  const { data: profiles } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, volledige_naam")
        .in("id", profileIds)
    : { data: [] };

  const leerlingMap = new Map(
    (leerlingen ?? []).map((item) => [item.id, item.profile_id])
  );
  const instructeurMap = new Map(
    (instructeursRows ?? []).map((item) => [item.id, item.profile_id])
  );
  const profileMap = new Map(
    (profiles ?? []).map((item) => [item.id, item.volledige_naam])
  );
  const reportMap = new Map<
    string,
    { count: number; latestReason: string | null; latestStatus: string | null }
  >();

  for (const row of reviewReports ?? []) {
    const current = reportMap.get(row.review_id);

    if (!current) {
      reportMap.set(row.review_id, {
        count: 1,
        latestReason: row.reden ?? null,
        latestStatus: row.status ?? null,
      });
      continue;
    }

    current.count += 1;
  }

  return rows.map((row) => {
    const reportMeta = reportMap.get(row.id);

    return {
      id: row.id,
      leerling:
        profileMap.get(leerlingMap.get(row.leerling_id) ?? "") ?? "Leerling",
      instructeur:
        profileMap.get(instructeurMap.get(row.instructeur_id) ?? "") ??
        "Instructeur",
      score: `${row.score}`,
      titel: row.titel || "Review",
      tekst: row.tekst || "",
      datum: formatDate(row.created_at),
      moderatieStatus:
        row.verborgen ? "verborgen" : row.moderatie_status || "zichtbaar",
      moderatieNotitie: row.moderatie_notitie || null,
      antwoordTekst: row.antwoord_tekst || null,
      reportCount: reportMeta?.count ?? 0,
      latestReportReason: reportMeta?.latestReason ?? null,
      latestReportStatus: reportMeta?.latestStatus ?? null,
    };
  });
}

export async function getAdminPackages() {
  const supabase = await createServerClient();
  const { data: rows } = (await supabase
    .from("pakketten")
    .select("id, naam, beschrijving, prijs, praktijk_examen_prijs, aantal_lessen, actief, badge, labels, instructeur_id, sort_order, uitgelicht, icon_key, visual_theme, cover_path, cover_position, cover_focus_x, cover_focus_y, les_type, created_at")
    .order("uitgelicht", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(50)) as unknown as { data: AdminPackageRow[] | null };

  if (!rows?.length) {
    return pakketten.map((pakket) => ({
      id: pakket.id,
      naam: pakket.naam,
      beschrijving: pakket.beschrijving,
      prijs: pakket.prijs,
      prijsLabel: pakket.prijs ? formatCurrency(pakket.prijs) : "Op aanvraag",
      lessen: pakket.lessen,
      les_type: pakket.les_type,
      badge: pakket.badge,
      labels: pakket.labels ?? [],
      praktijk_examen_prijs: pakket.praktijk_examen_prijs ?? null,
      instructeur_id: pakket.instructeur_id ?? null,
      uitgelicht: pakket.uitgelicht ?? false,
      sort_order: pakket.sort_order ?? 0,
      icon_key: getPackageIconKey(pakket.icon_key),
      visual_theme: getPackageThemeKey(pakket.visual_theme),
      cover_path: pakket.cover_path ?? null,
      cover_url: pakket.cover_url ?? null,
      cover_position: getPackageCoverPositionKey(pakket.cover_position),
      cover_focus_x: parsePackageCoverFocusValue(pakket.cover_focus_x),
      cover_focus_y: parsePackageCoverFocusValue(pakket.cover_focus_y),
      status: "actief",
    }));
  }

  return rows.map((row) => ({
    id: row.id,
    naam: row.naam,
    beschrijving: row.beschrijving || "",
    prijs: Number(row.prijs ?? 0),
    prijsLabel: formatCurrency(Number(row.prijs ?? 0)),
    lessen: row.aantal_lessen ?? 0,
    les_type: getRijlesType(row.les_type),
    badge: row.badge || undefined,
    labels: normalizePackageLabels(row.labels),
    praktijk_examen_prijs:
      row.praktijk_examen_prijs === null || row.praktijk_examen_prijs === undefined
        ? null
        : Number(row.praktijk_examen_prijs),
    instructeur_id: row.instructeur_id,
    uitgelicht: row.uitgelicht ?? false,
    sort_order: row.sort_order ?? 0,
    icon_key: getPackageIconKey(row.icon_key),
    visual_theme: getPackageThemeKey(row.visual_theme),
    cover_path: row.cover_path ?? null,
    cover_url: getPackageCoverUrl(row.cover_path),
    cover_position: getPackageCoverPositionKey(row.cover_position),
    cover_focus_x: parsePackageCoverFocusValue(row.cover_focus_x),
    cover_focus_y: parsePackageCoverFocusValue(row.cover_focus_y),
    status: row.actief ? "actief" : "gepauzeerd",
  }));
}
