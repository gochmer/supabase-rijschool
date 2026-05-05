import { NextResponse } from "next/server";

import { recordAuditEvent } from "@/lib/audit-events";
import { getAdminAuditLogEvents, type AdminAuditLogFilters } from "@/lib/data/admin";
import { ensureCurrentUserContext } from "@/lib/data/profiles";

export const runtime = "nodejs";

const EXPORT_LIMIT = 10_000;

function getOptionalParam(searchParams: URLSearchParams, name: string) {
  const value = searchParams.get(name)?.trim();
  return value || undefined;
}

function getCategoryParam(
  value: string | undefined,
): AdminAuditLogFilters["category"] {
  return ["pakket", "betaling", "planning", "lessen", "overig"].includes(
    value ?? "",
  )
    ? (value as AdminAuditLogFilters["category"])
    : "alles";
}

function buildExportFilters(searchParams: URLSearchParams): AdminAuditLogFilters {
  return {
    actorProfileId: getOptionalParam(searchParams, "actorId"),
    actorRole: getOptionalParam(searchParams, "actorRole"),
    betalingId: getOptionalParam(searchParams, "paymentId"),
    category: getCategoryParam(getOptionalParam(searchParams, "category")),
    dateFrom: getOptionalParam(searchParams, "from"),
    dateTo: getOptionalParam(searchParams, "to"),
    leerlingId: getOptionalParam(searchParams, "learnerId"),
    limit: EXPORT_LIMIT,
    pakketId: getOptionalParam(searchParams, "packageId"),
    search: getOptionalParam(searchParams, "q"),
  };
}

function escapeCsvValue(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function buildAuditCsv(events: Awaited<ReturnType<typeof getAdminAuditLogEvents>>) {
  const headers = [
    "moment",
    "event_type",
    "categorie",
    "titel",
    "samenvatting",
    "actor",
    "actor_rol",
    "leerling",
    "pakket",
    "betaling",
    "entity_type",
    "entity_id",
    "metadata",
  ];
  const rows = events.map((event) => [
    event.createdAt,
    event.eventType,
    event.category,
    event.title,
    event.detail,
    event.actorLabel,
    event.actorRole,
    event.leerlingLabel,
    event.pakketLabel,
    event.betalingLabel,
    event.entityType,
    event.entityId ?? "",
    event.metadata.map((item) => `${item.label}: ${item.value}`).join(" | "),
  ]);

  return `\uFEFF${[headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n")}`;
}

function buildFilename() {
  return `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
}

export async function GET(request: Request) {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  if (context.role !== "admin") {
    return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  }

  const searchParams = new URL(request.url).searchParams;
  const filters = buildExportFilters(searchParams);
  const events = await getAdminAuditLogEvents(filters);
  const csv = buildAuditCsv(events);

  await recordAuditEvent({
    actorProfileId: context.user.id,
    actorRole: "admin",
    betalingId: filters.betalingId ?? null,
    entityId: null,
    entityType: "audit_export",
    eventType: "audit_export_created",
    leerlingId: filters.leerlingId ?? null,
    pakketId: filters.pakketId ?? null,
    summary: `Admin exporteerde ${events.length} auditregels.`,
    metadata: {
      actor_role_filter: filters.actorRole ?? null,
      category_filter: filters.category ?? "alles",
      date_from: filters.dateFrom ?? null,
      date_to: filters.dateTo ?? null,
      export_limit: EXPORT_LIMIT,
      exported_count: events.length,
      has_search: Boolean(filters.search),
    },
  });

  return new Response(csv, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${buildFilename()}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
