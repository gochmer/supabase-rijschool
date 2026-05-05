import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AuditActorRole = "admin" | "instructeur" | "leerling" | "system";

export type AuditEventInput = {
  actorProfileId?: string | null;
  actorRole?: AuditActorRole | null;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  leerlingId?: string | null;
  instructeurId?: string | null;
  pakketId?: string | null;
  betalingId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
};

function normalizeAuditEvent(input: AuditEventInput) {
  return {
    actor_profile_id: input.actorProfileId ?? null,
    actor_role: input.actorRole ?? "system",
    event_type: input.eventType.trim(),
    entity_type: input.entityType.trim(),
    entity_id: input.entityId ?? null,
    leerling_id: input.leerlingId ?? null,
    instructeur_id: input.instructeurId ?? null,
    pakket_id: input.pakketId ?? null,
    betaling_id: input.betalingId ?? null,
    summary: input.summary.trim(),
    metadata: input.metadata ?? {},
  };
}

export async function recordAuditEvents(
  inputs: Array<AuditEventInput | null | false | undefined>
) {
  const rows = inputs
    .filter((input): input is AuditEventInput => Boolean(input))
    .filter((input) => input.eventType.trim() && input.entityType.trim() && input.summary.trim())
    .map(normalizeAuditEvent);

  if (!rows.length) {
    return;
  }

  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("audit_events" as never).insert(rows as never);

    if (error) {
      console.warn("[audit-events] insert failed", {
        message: error.message,
        eventTypes: rows.map((row) => row.event_type),
      });
    }
  } catch (error) {
    console.warn("[audit-events] insert crashed", error);
  }
}

export async function recordAuditEvent(input: AuditEventInput) {
  await recordAuditEvents([input]);
}
