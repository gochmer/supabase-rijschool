import "server-only";

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
import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import {
  getTrialLessonStateFromRows,
  type TrialLessonLessonCandidate,
  type TrialLessonRequestCandidate,
} from "@/lib/data/trial-lessons";
import { createServerClient } from "@/lib/supabase/server";
import {
  buildStudentAuditTimelineEvents,
  getAuditEventCategory,
  groupStudentAuditTimelineEvents,
  type StudentAuditActorProfile,
  type StudentAuditEventSourceRow,
} from "@/lib/student-audit-timeline";
import {
  calculateStudentPackageUsage,
  formatStudentPackageAssignedDate,
  formatStudentPackageUsage,
  getStudentPackageStatusMeta,
  isStudentPackagePaymentNeeded,
  resolveStudentPackageStatus,
} from "@/lib/student-package-status";
import type { AdminAuditLogEvent, StudentAuditTimelineEvent } from "@/lib/types";

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

type AdminStudentAuditEventRow = StudentAuditEventSourceRow & {
  leerling_id: string;
};

type AdminAuditEventRow = StudentAuditEventSourceRow & {
  actor_profile_id: string | null;
  actor_role: string | null;
  betaling_id: string | null;
  entity_id: string | null;
  entity_type: string;
  instructeur_id: string | null;
  leerling_id: string | null;
  pakket_id: string | null;
};

export type AdminAuditLogFilters = {
  limit?: number;
  search?: string;
  category?: AdminAuditLogEvent["category"] | "alles";
  actorRole?: string;
  dateFrom?: string;
  dateTo?: string;
  leerlingId?: string;
  actorProfileId?: string;
  pakketId?: string;
  betalingId?: string;
};

type AdminStudentPaymentRow = {
  id: string;
  profiel_id: string;
  pakket_id: string | null;
  status: string | null;
  created_at: string;
};

type AdminTrialLessonRequestRow = TrialLessonRequestCandidate & {
  leerling_id: string | null;
};

type AdminTrialLessonRow = TrialLessonLessonCandidate & {
  leerling_id: string | null;
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
    usersResult,
    approvalsResult,
    lessonsResult,
    paymentsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
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
  ]);
  const queryErrors = [
    ["profiles", usersResult.error],
    ["approvals", approvalsResult.error],
    ["lessonsThisWeek", lessonsResult.error],
    ["recentPayments", paymentsResult.error],
  ] as const;

  for (const [query, error] of queryErrors) {
    if (error) {
      logSupabaseDataError("admin.dashboardMetrics", error, { query });
    }
  }

  const totaalGebruikers = usersResult.count;
  const openGoedkeuringen = approvalsResult.count;
  const lessenDezeWeek = lessonsResult.count;
  const recenteBetalingen = paymentsResult.data;

  const omzet = (recenteBetalingen ?? []).reduce(
    (sum, item) => sum + Number(item.bedrag ?? 0),
    0
  );

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
  const { data, error } = await supabase
    .from("profiles")
    .select("id, volledige_naam, email, telefoon, rol, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logSupabaseDataError("admin.users", error);
    return [];
  }

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
  const { data: rows, error } = await supabase
    .from("instructeurs")
    .select(
      "id, profile_id, werkgebied, profiel_status, profiel_compleetheid, prijs_per_les, transmissie, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logSupabaseDataError("admin.instructors", error);
    return [];
  }

  if (!rows?.length) {
    return [];
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
  const { data: rows, error } = await supabase
    .from("leerlingen")
    .select("id, profile_id, voortgang_percentage, pakket_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logSupabaseDataError("admin.students", error);
    return [];
  }

  if (!rows?.length) {
    return [];
  }

  const profileIds = rows.map((row) => row.profile_id);
  const leerlingIds = rows.map((row) => row.id);
  const pakketIds = rows
    .map((row) => row.pakket_id)
    .filter((value): value is string => Boolean(value));

  const [
    { data: profiles },
    { data: pakkettenRows },
    { data: paymentRows },
    { data: lessonRows },
    trialRequestsResult,
    trialLessonsResult,
    auditEventsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, volledige_naam, email, telefoon")
      .in("id", profileIds),
    pakketIds.length
      ? supabase
          .from("pakketten")
          .select("id, naam, prijs, aantal_lessen, actief")
          .in("id", pakketIds)
      : Promise.resolve({ data: [], error: null }),
    pakketIds.length && profileIds.length
      ? supabase
          .from("betalingen")
          .select("id, profiel_id, pakket_id, status, created_at")
          .in("profiel_id", profileIds)
          .in("pakket_id", pakketIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    pakketIds.length && leerlingIds.length
      ? supabase
          .from("lessen")
          .select("leerling_id, pakket_id, status")
          .in("leerling_id", leerlingIds)
          .in("pakket_id", pakketIds)
          .neq("status", "geannuleerd")
      : Promise.resolve({ data: [], error: null }),
    leerlingIds.length
      ? (supabase
          .from("lesaanvragen")
          .select(
            "id, leerling_id, aanvraag_type, status, created_at, voorkeursdatum, tijdvak"
          )
          .in("leerling_id", leerlingIds)
          .eq("aanvraag_type", "proefles")
          .in("status", [
            "aangevraagd",
            "geaccepteerd",
            "ingepland",
            "afgerond",
          ])
          .order("created_at", { ascending: false })
          .limit(300) as unknown as Promise<{
          data: AdminTrialLessonRequestRow[] | null;
          error?: unknown;
        }>)
      : Promise.resolve({ data: [], error: null }),
    leerlingIds.length
      ? (supabase
          .from("lessen")
          .select("id, leerling_id, titel, status, created_at, start_at")
          .in("leerling_id", leerlingIds)
          .ilike("titel", "%proefles%")
          .in("status", [
            "aangevraagd",
            "geaccepteerd",
            "ingepland",
            "afgerond",
          ])
          .order("start_at", { ascending: false })
          .limit(300) as unknown as Promise<{
          data: AdminTrialLessonRow[] | null;
          error?: unknown;
        }>)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("audit_events" as never)
      .select("id, actor_profile_id, actor_role, created_at, event_type, leerling_id, metadata, summary")
      .in("leerling_id" as never, leerlingIds as never)
      .order("created_at" as never, { ascending: false } as never)
      .limit(300) as unknown as Promise<{
      data: AdminStudentAuditEventRow[] | null;
      error?: unknown;
    }>,
  ]);

  if (auditEventsResult.error) {
    logSupabaseDataError("admin.students.auditEvents", auditEventsResult.error, {
      studentCount: leerlingIds.length,
    });
  }

  if (trialRequestsResult.error) {
    logSupabaseDataError("admin.students.trialRequests", trialRequestsResult.error, {
      studentCount: leerlingIds.length,
    });
  }

  if (trialLessonsResult.error) {
    logSupabaseDataError("admin.students.trialLessons", trialLessonsResult.error, {
      studentCount: leerlingIds.length,
    });
  }

  const auditRows = auditEventsResult.data ?? [];
  const auditActorProfileIds = Array.from(
    new Set(
      auditRows
        .map((row) => row.actor_profile_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const { data: auditActorProfiles, error: auditActorProfilesError } =
    auditActorProfileIds.length
      ? ((await supabase
          .from("profiles")
          .select("id, volledige_naam, email")
          .in("id", auditActorProfileIds)) as unknown as {
          data: StudentAuditActorProfile[] | null;
          error?: unknown;
        })
      : { data: [] as StudentAuditActorProfile[], error: null };

  if (auditActorProfilesError) {
    logSupabaseDataError("admin.students.auditActorProfiles", auditActorProfilesError);
  }

  const auditEventsByStudent = groupStudentAuditTimelineEvents(
    buildStudentAuditTimelineEvents({
      actorProfiles: auditActorProfiles ?? [],
      rows: auditRows,
    }),
  );

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );
  const pakketMap = new Map(
    (pakkettenRows ?? []).map((pakket) => [pakket.id, pakket])
  );
  const paymentMap = new Map<string, AdminStudentPaymentRow>();

  for (const payment of paymentRows ?? []) {
    const key = `${payment.profiel_id}:${payment.pakket_id}`;

    if (!paymentMap.has(key)) {
      paymentMap.set(key, payment);
    }
  }
  const lessonUsageMap = new Map<
    string,
    { plannedLessons: number; usedLessons: number }
  >();

  for (const lesson of lessonRows ?? []) {
    if (!lesson.leerling_id || !lesson.pakket_id) {
      continue;
    }

    const key = `${lesson.leerling_id}:${lesson.pakket_id}`;
    const current = lessonUsageMap.get(key) ?? {
      plannedLessons: 0,
      usedLessons: 0,
    };

    if (["geaccepteerd", "ingepland"].includes(lesson.status ?? "")) {
      current.plannedLessons += 1;
    } else if (lesson.status === "afgerond") {
      current.usedLessons += 1;
    }

    lessonUsageMap.set(key, current);
  }
  const trialRequestsByStudent = new Map<string, AdminTrialLessonRequestRow[]>();
  const trialLessonsByStudent = new Map<string, AdminTrialLessonRow[]>();

  for (const request of trialRequestsResult.data ?? []) {
    if (!request.leerling_id) {
      continue;
    }

    const current = trialRequestsByStudent.get(request.leerling_id) ?? [];
    current.push(request);
    trialRequestsByStudent.set(request.leerling_id, current);
  }

  for (const lesson of trialLessonsResult.data ?? []) {
    if (!lesson.leerling_id) {
      continue;
    }

    const current = trialLessonsByStudent.get(lesson.leerling_id) ?? [];
    current.push(lesson);
    trialLessonsByStudent.set(lesson.leerling_id, current);
  }

  return rows.map((row) => {
    const profile = profileMap.get(row.profile_id);
    const pakket = row.pakket_id ? pakketMap.get(row.pakket_id) : null;
    const payment = row.pakket_id
      ? paymentMap.get(`${row.profile_id}:${row.pakket_id}`) ?? null
      : null;
    const usageCounts = row.pakket_id
      ? lessonUsageMap.get(`${row.id}:${row.pakket_id}`)
      : null;
    const packageUsage = calculateStudentPackageUsage({
      totalLessons: pakket?.aantal_lessen ?? null,
      plannedLessons: usageCounts?.plannedLessons ?? 0,
      usedLessons: usageCounts?.usedLessons ?? 0,
    });
    const packageStatus = resolveStudentPackageStatus({
      hasPackage: Boolean(row.pakket_id && pakket),
      packageActive: pakket?.actief ?? null,
      packagePrice: pakket?.prijs ?? null,
      paymentStatus: payment?.status ?? null,
      ...packageUsage,
    });
    const statusMeta = getStudentPackageStatusMeta(packageStatus);
    const trialLessonState = getTrialLessonStateFromRows({
      actor: "instructor",
      lessons: trialLessonsByStudent.get(row.id) ?? [],
      requests: trialRequestsByStudent.get(row.id) ?? [],
    });

    return {
      id: row.id,
      naam: profile?.volledige_naam ?? "Leerling",
      email: profile?.email ?? "",
      telefoon: profile?.telefoon ?? "",
      pakketId: row.pakket_id ?? null,
      pakket: row.pakket_id
        ? pakket?.naam ?? "Onbekend pakket"
        : "Nog geen pakket",
      pakketStatus: packageStatus,
      pakketStatusLabel: statusMeta.label,
      pakketStatusBadgeVariant: statusMeta.badgeVariant,
      pakketToegewezenOp: formatStudentPackageAssignedDate(
        payment?.created_at ?? null
      ),
      pakketBetalingNodig: isStudentPackagePaymentNeeded({
        packagePrice: pakket?.prijs ?? null,
        paymentStatus: payment?.status ?? null,
      }),
      pakketBetalingStatus: payment?.status ?? null,
      pakketGebruikLabel: row.pakket_id
        ? formatStudentPackageUsage(packageUsage)
        : "Nog geen pakket gekoppeld",
      pakketLessenTotaal: packageUsage.totalLessons,
      pakketLessenGepland: packageUsage.plannedLessons,
      pakketLessenGebruikt: packageUsage.usedLessons,
      pakketLessenResterend: packageUsage.remainingLessons,
      voortgang: `${row.voortgang_percentage ?? 0}%`,
      status: "actief",
      trialLessonAvailable: trialLessonState.available,
      trialLessonStatus: trialLessonState.status,
      trialLessonMessage: trialLessonState.message,
      auditEvents: auditEventsByStudent.get(row.id) ?? [],
    };
  });
}

function getAuditEntityLabel(value: string | null | undefined, fallback: string) {
  return value ? value.slice(0, 8) : fallback;
}

function getAuditDateBoundary(value: string | undefined, endOfDay = false) {
  if (!value) {
    return null;
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date.toISOString();
}

function matchesAdminAuditFilters(
  event: AdminAuditLogEvent,
  filters: AdminAuditLogFilters,
) {
  const category = filters.category && filters.category !== "alles"
    ? filters.category
    : null;

  if (category && event.category !== category) {
    return false;
  }

  const search = filters.search?.trim().toLowerCase();

  if (!search) {
    return true;
  }

  const metadataText = event.metadata
    .map((item) => `${item.label} ${item.value}`)
    .join(" ");

  return [
    event.actorLabel,
    event.actorRole,
    event.betalingLabel,
    event.category,
    event.detail,
    event.entityId,
    event.entityType,
    event.eventType,
    event.leerlingId,
    event.leerlingLabel,
    event.pakketLabel,
    event.title,
    metadataText,
  ].some((value) => (value ?? "").toLowerCase().includes(search));
}

export async function getAdminAuditLogEvents({
  limit = 500,
  search,
  category = "alles",
  actorRole,
  dateFrom,
  dateTo,
  leerlingId,
  actorProfileId,
  pakketId,
  betalingId,
}: AdminAuditLogFilters = {}): Promise<AdminAuditLogEvent[]> {
  const supabase = await createServerClient();
  const normalizedLimit = Math.min(Math.max(limit, 1), 10_000);
  const fromBoundary = getAuditDateBoundary(dateFrom);
  const toBoundary = getAuditDateBoundary(dateTo, true);
  let query = supabase
    .from("audit_events" as never)
    .select(
      "id, actor_profile_id, actor_role, betaling_id, created_at, entity_id, entity_type, event_type, instructeur_id, leerling_id, metadata, pakket_id, summary",
    )
    .order("created_at" as never, { ascending: false } as never)
    .limit(normalizedLimit);

  if (fromBoundary) {
    query = query.gte("created_at" as never, fromBoundary as never);
  }

  if (toBoundary) {
    query = query.lte("created_at" as never, toBoundary as never);
  }

  if (actorRole && actorRole !== "alles") {
    query = query.eq("actor_role" as never, actorRole as never);
  }

  if (leerlingId) {
    query = query.eq("leerling_id" as never, leerlingId as never);
  }

  if (actorProfileId) {
    query = query.eq("actor_profile_id" as never, actorProfileId as never);
  }

  if (pakketId) {
    query = query.eq("pakket_id" as never, pakketId as never);
  }

  if (betalingId) {
    query = query.eq("betaling_id" as never, betalingId as never);
  }

  const { data: rows, error } = (await query) as unknown as {
    data: AdminAuditEventRow[] | null;
    error?: unknown;
  };

  if (error) {
    logSupabaseDataError("admin.auditLog.events", error, {
      actorRole,
      betalingId,
      category,
      dateFrom,
      dateTo,
      leerlingId,
      limit: normalizedLimit,
      pakketId,
    });
    return [];
  }

  const auditRows = rows ?? [];

  if (!auditRows.length) {
    return [];
  }

  const actorProfileIds = Array.from(
    new Set(
      auditRows
        .map((row) => row.actor_profile_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const learnerIds = Array.from(
    new Set(
      auditRows
        .map((row) => row.leerling_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const packageIds = Array.from(
    new Set(
      auditRows
        .map((row) => row.pakket_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [actorProfilesResult, learnersResult, packagesResult] =
    await Promise.all([
      actorProfileIds.length
        ? (supabase
            .from("profiles")
            .select("id, volledige_naam, email")
            .in("id", actorProfileIds) as unknown as Promise<{
            data: StudentAuditActorProfile[] | null;
            error?: unknown;
          }>)
        : Promise.resolve({ data: [] as StudentAuditActorProfile[] }),
      learnerIds.length
        ? supabase
            .from("leerlingen")
            .select(
              "id, profile:profiles!leerlingen_profile_id_fkey(id, volledige_naam, email)",
            )
            .in("id", learnerIds)
        : Promise.resolve({ data: [] }),
      packageIds.length
        ? supabase
            .from("pakketten")
            .select("id, naam")
            .in("id", packageIds)
        : Promise.resolve({ data: [] }),
    ]);

  const relationErrors = [
    ["actorProfiles", (actorProfilesResult as { error?: unknown }).error],
    ["learners", (learnersResult as { error?: unknown }).error],
    ["packages", (packagesResult as { error?: unknown }).error],
  ] as const;

  for (const [query, relationError] of relationErrors) {
    if (relationError) {
      logSupabaseDataError("admin.auditLog.relations", relationError, {
        query,
        limit,
      });
    }
  }

  const timelineEvents = buildStudentAuditTimelineEvents({
    actorProfiles: actorProfilesResult.data ?? [],
    rows: auditRows,
  });
  const timelineEventMap = new Map(
    timelineEvents.map((event) => [event.id, event]),
  );
  const learnerMap = new Map<string, string>();

  for (const row of learnersResult.data ?? []) {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    learnerMap.set(
      row.id,
      profile?.volledige_naam ||
        profile?.email ||
        getAuditEntityLabel(row.id, "Leerling"),
    );
  }

  const packageMap = new Map(
    (packagesResult.data ?? []).map((pkg) => [pkg.id, pkg.naam]),
  );

  return auditRows
    .map((row) => {
      const timelineEvent =
        timelineEventMap.get(row.id) ??
        ({
          actorLabel: row.actor_role ?? "Systeem",
          category: getAuditEventCategory(row.event_type),
          createdAt: row.created_at,
          createdAtLabel: formatDate(row.created_at),
          detail: row.summary,
          eventType: row.event_type,
          id: row.id,
          leerlingId: row.leerling_id,
          metadata: [],
          title: row.event_type,
          tone: "info" as const,
        } satisfies StudentAuditTimelineEvent);

      return {
        ...timelineEvent,
        actorRole: row.actor_role ?? "system",
        entityId: row.entity_id,
        entityType: row.entity_type,
        leerlingLabel: row.leerling_id
          ? learnerMap.get(row.leerling_id) ??
            getAuditEntityLabel(row.leerling_id, "Leerling")
          : "Geen leerling",
        pakketLabel: row.pakket_id
          ? packageMap.get(row.pakket_id) ??
            getAuditEntityLabel(row.pakket_id, "Pakket")
          : "Geen pakket",
        betalingLabel: getAuditEntityLabel(row.betaling_id, "Geen betaling"),
      } satisfies AdminAuditLogEvent;
    })
    .filter((event) =>
      matchesAdminAuditFilters(event, {
        actorProfileId,
        actorRole,
        betalingId,
        category,
        dateFrom,
        dateTo,
        leerlingId,
        limit: normalizedLimit,
        pakketId,
        search,
      }),
    );
}

export async function getAdminLessons() {
  const supabase = await createServerClient();
  const { data: rows, error } = await supabase
    .from("lessen")
    .select(
      "id, titel, status, start_at, leerling_id, instructeur_id, locatie_id, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logSupabaseDataError("admin.lessons", error);
    return [];
  }

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
  const { data: rows, error } = await supabase
    .from("betalingen")
    .select("id, profiel_id, bedrag, status, provider, betaald_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logSupabaseDataError("admin.payments", error);
    return [];
  }

  if (!rows?.length) {
    return [];
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
    provider: row.provider ?? "onbekend",
  }));
}

export async function getAdminSupportTickets() {
  const supabase = await createServerClient();
  const { data: rows, error } = await supabase
    .from("support_tickets")
    .select("id, profiel_id, onderwerp, status, prioriteit, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logSupabaseDataError("admin.supportTickets", error);
    return [];
  }

  if (!rows?.length) {
    return [];
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
  const { data: rows, error } = await supabase
    .from("reviews")
    .select(
      "id, leerling_id, instructeur_id, score, titel, tekst, created_at, moderatie_status, moderatie_notitie, verborgen, antwoord_tekst"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logSupabaseDataError("admin.reviews", error);
    return [];
  }

  if (!rows?.length) {
    return [];
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
  const { data: rows, error } = (await supabase
    .from("pakketten")
    .select("id, naam, beschrijving, prijs, praktijk_examen_prijs, aantal_lessen, actief, badge, labels, instructeur_id, sort_order, uitgelicht, icon_key, visual_theme, cover_path, cover_position, cover_focus_x, cover_focus_y, les_type, created_at")
    .order("uitgelicht", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(50)) as unknown as { data: AdminPackageRow[] | null; error?: unknown };

  if (error) {
    logSupabaseDataError("admin.packages", error);
    return [];
  }

  if (!rows?.length) {
    return [];
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
