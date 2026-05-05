import type { StudentAuditTimelineEvent } from "@/lib/types";

export type StudentAuditEventSourceRow = {
  id: string;
  actor_profile_id: string | null;
  actor_role: string | null;
  created_at: string;
  event_type: string;
  leerling_id: string | null;
  metadata: Record<string, unknown> | null;
  summary: string;
};

export type StudentAuditActorProfile = {
  id: string;
  email?: string | null;
  volledige_naam: string | null;
};

const auditDateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: "Europe/Amsterdam",
});

const eventLabels: Record<string, { title: string; tone: StudentAuditTimelineEvent["tone"] }> = {
  package_assigned: { title: "Pakket gekoppeld", tone: "success" },
  package_assignment_synced: { title: "Pakket gesynchroniseerd", tone: "info" },
  package_replaced: { title: "Pakket vervangen", tone: "warning" },
  package_unlinked: { title: "Pakket losgekoppeld", tone: "danger" },
  package_payment_created: { title: "Betaling aangemaakt", tone: "warning" },
  package_payment_reused: { title: "Betaling hergebruikt", tone: "info" },
  package_payment_closed: { title: "Betaling gesloten", tone: "danger" },
  package_payment_paid: { title: "Betaling betaald", tone: "success" },
  package_lessons_attached: { title: "Lessen gekoppeld", tone: "success" },
  package_lessons_detached: { title: "Lessen losgekoppeld", tone: "warning" },
  package_planning_released: { title: "Planning vrijgegeven", tone: "success" },
  package_planning_disabled: { title: "Planning gesloten", tone: "danger" },
};

const actorRoleLabels: Record<string, string> = {
  admin: "Admin",
  instructeur: "Instructeur",
  leerling: "Leerling",
  system: "Systeem",
};

function getMetadataString(
  metadata: Record<string, unknown> | null,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getMetadataNumber(
  metadata: Record<string, unknown> | null,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getCreatedAtLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Onbekend moment" : auditDateFormatter.format(date);
}

function getActorLabel(
  row: StudentAuditEventSourceRow,
  actorMap: Map<string, StudentAuditActorProfile>,
) {
  const roleLabel = actorRoleLabels[row.actor_role ?? ""] ?? "Systeem";
  const actor = row.actor_profile_id ? actorMap.get(row.actor_profile_id) : null;
  const actorName = actor?.volledige_naam || actor?.email || null;

  return actorName ? `${actorName} (${roleLabel})` : roleLabel;
}

function buildDetail(row: StudentAuditEventSourceRow) {
  const metadata = row.metadata ?? {};
  const packageName = getMetadataString(metadata, "package_name");
  const paymentStatus = getMetadataString(metadata, "payment_status");
  const lessonCount = getMetadataNumber(metadata, "lesson_count");
  const detailParts = [row.summary];

  if (packageName) {
    detailParts.push(`Pakket: ${packageName}.`);
  }

  if (paymentStatus) {
    detailParts.push(`Betaling: ${paymentStatus}.`);
  }

  if (lessonCount !== null) {
    detailParts.push(`${lessonCount} les${lessonCount === 1 ? "" : "sen"}.`);
  }

  return detailParts.join(" ");
}

export function buildStudentAuditTimelineEvents({
  actorProfiles,
  rows,
}: {
  actorProfiles: StudentAuditActorProfile[];
  rows: StudentAuditEventSourceRow[];
}): StudentAuditTimelineEvent[] {
  const actorMap = new Map(actorProfiles.map((profile) => [profile.id, profile]));

  return rows
    .map((row) => {
      const meta = eventLabels[row.event_type] ?? {
        title: row.event_type.replaceAll("_", " "),
        tone: "info" as const,
      };

      return {
        id: row.id,
        leerlingId: row.leerling_id,
        eventType: row.event_type,
        title: meta.title,
        detail: buildDetail(row),
        createdAt: row.created_at,
        createdAtLabel: getCreatedAtLabel(row.created_at),
        actorLabel: getActorLabel(row, actorMap),
        tone: meta.tone,
      } satisfies StudentAuditTimelineEvent;
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function groupStudentAuditTimelineEvents(
  events: StudentAuditTimelineEvent[],
) {
  const grouped = new Map<string, StudentAuditTimelineEvent[]>();

  for (const event of events) {
    if (!event.leerlingId) {
      continue;
    }

    const current = grouped.get(event.leerlingId) ?? [];
    current.push(event);
    grouped.set(event.leerlingId, current);
  }

  return grouped;
}
