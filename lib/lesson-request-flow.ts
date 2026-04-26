import type { LesStatus } from "@/lib/types";

const REQUEST_REFERENCE_PREFIX = "request-ref:";

export function buildLessonRequestReference(requestId: string) {
  return `${REQUEST_REFERENCE_PREFIX}${requestId}`;
}

export function extractLessonRequestReference(noteText: string | null | undefined) {
  if (!noteText) {
    return null;
  }

  const match = noteText.match(/request-ref:([a-f0-9-]+)/i);
  return match?.[1] ?? null;
}

export function appendRequestUpdateMessage(
  existingMessage: string | null | undefined,
  updateLabel: string,
  reason?: string | null
) {
  const normalizedExisting = existingMessage?.trim();
  const normalizedReason = reason?.trim();
  const updateLine = normalizedReason
    ? `${updateLabel}: ${normalizedReason}`
    : updateLabel;

  if (!normalizedExisting) {
    return updateLine;
  }

  return `${normalizedExisting}\n\n${updateLine}`;
}

export function getRequestStatusVariant(status: LesStatus) {
  switch (status) {
    case "aangevraagd":
      return "warning" as const;
    case "geaccepteerd":
    case "ingepland":
    case "afgerond":
      return "success" as const;
    case "geweigerd":
    case "geannuleerd":
      return "danger" as const;
    default:
      return "info" as const;
  }
}

export function getRequestStatusLabel(status: LesStatus) {
  switch (status) {
    case "aangevraagd":
      return "Aangevraagd";
    case "geaccepteerd":
      return "Geaccepteerd";
    case "ingepland":
      return "Ingepland";
    case "afgerond":
      return "Afgerond";
    case "geweigerd":
      return "Geweigerd";
    case "geannuleerd":
      return "Geannuleerd";
    default:
      return status;
  }
}

export const requestStatusTimeline: Array<{
  value: LesStatus;
  label: string;
}> = [
  { value: "aangevraagd", label: "Aangevraagd" },
  { value: "geaccepteerd", label: "Geaccepteerd" },
  { value: "ingepland", label: "Ingepland" },
  { value: "afgerond", label: "Afgerond" },
  { value: "geannuleerd", label: "Geannuleerd" },
];
