import type { BetaalStatus } from "@/lib/types";

export type StudentPackageStatus =
  | "geen_pakket"
  | "in_afwachting_betaling"
  | "actief"
  | "volledig_gebruikt"
  | "verlopen";

export type StudentPackageUsage = {
  totalLessons: number | null;
  plannedLessons: number;
  usedLessons: number;
  remainingLessons: number | null;
};

export type StudentPackageStatusInput = StudentPackageUsage & {
  hasPackage: boolean;
  packageActive?: boolean | null;
  packagePrice?: number | string | null;
  paymentStatus?: BetaalStatus | string | null;
};

export type StudentPackageStatusMeta = {
  label: string;
  description: string;
  badgeVariant: "default" | "info" | "success" | "warning" | "danger";
};

export function toPackageAmount(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function calculateStudentPackageUsage(input: {
  totalLessons?: number | null;
  plannedLessons?: number | null;
  usedLessons?: number | null;
}): StudentPackageUsage {
  const totalLessons =
    typeof input.totalLessons === "number" && input.totalLessons > 0
      ? input.totalLessons
      : null;
  const plannedLessons = Math.max(input.plannedLessons ?? 0, 0);
  const usedLessons = Math.max(input.usedLessons ?? 0, 0);
  const remainingLessons =
    totalLessons == null
      ? null
      : Math.max(totalLessons - plannedLessons - usedLessons, 0);

  return {
    totalLessons,
    plannedLessons,
    usedLessons,
    remainingLessons,
  };
}

export function isStudentPackagePaymentNeeded(input: {
  packagePrice?: number | string | null;
  paymentStatus?: BetaalStatus | string | null;
}) {
  return (
    toPackageAmount(input.packagePrice) > 0 && input.paymentStatus !== "betaald"
  );
}

export function resolveStudentPackageStatus(
  input: StudentPackageStatusInput,
): StudentPackageStatus {
  if (!input.hasPackage) {
    return "geen_pakket";
  }

  if (input.packageActive === false) {
    return "verlopen";
  }

  if (
    isStudentPackagePaymentNeeded({
      packagePrice: input.packagePrice,
      paymentStatus: input.paymentStatus,
    })
  ) {
    return "in_afwachting_betaling";
  }

  if (
    input.totalLessons != null &&
    input.totalLessons > 0 &&
    input.remainingLessons === 0
  ) {
    return "volledig_gebruikt";
  }

  return "actief";
}

export function getStudentPackageStatusMeta(
  status: StudentPackageStatus,
): StudentPackageStatusMeta {
  switch (status) {
    case "actief":
      return {
        label: "Actief",
        description: "Dit pakket is gekoppeld en kan gebruikt worden voor lessen.",
        badgeVariant: "success",
      };
    case "in_afwachting_betaling":
      return {
        label: "Wacht op betaling",
        description:
          "Het pakket is gekoppeld, maar er staat nog een betaling open.",
        badgeVariant: "warning",
      };
    case "volledig_gebruikt":
      return {
        label: "Volledig gebruikt",
        description:
          "Alle lessen uit dit pakket zijn gepland of gevolgd.",
        badgeVariant: "danger",
      };
    case "verlopen":
      return {
        label: "Verlopen",
        description:
          "Dit pakket is niet meer actief in het pakketaanbod.",
        badgeVariant: "default",
      };
    default:
      return {
        label: "Nog geen pakket",
        description:
          "Koppel eerst een pakket om vervolglessen en betaling duidelijk te maken.",
        badgeVariant: "warning",
      };
  }
}

export function formatStudentPackageUsage(usage: StudentPackageUsage) {
  if (usage.totalLessons == null) {
    return `${usage.usedLessons} gevolgd, ${usage.plannedLessons} gepland`;
  }

  return `${usage.usedLessons}/${usage.totalLessons} gevolgd, ${usage.plannedLessons} gepland, ${usage.remainingLessons ?? 0} beschikbaar`;
}

export function formatStudentPackageAssignedDate(dateString?: string | null) {
  if (!dateString) {
    return "Nog niet vastgelegd";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Nog niet vastgelegd";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
