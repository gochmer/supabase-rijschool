import type { getCurrentInstructorSettingsOverview } from "@/lib/data/instructor-account";

type InstructorSettingsOverview = Awaited<
  ReturnType<typeof getCurrentInstructorSettingsOverview>
>;

export type InstructorDocumentSummary =
  InstructorSettingsOverview["documents"][number];

export function getDocumentVariant(status: string) {
  if (status === "goedgekeurd") {
    return "success" as const;
  }

  if (status === "afgekeurd" || status === "afgewezen") {
    return "danger" as const;
  }

  return "warning" as const;
}

export function getDocumentStatusLabel(status: string) {
  if (status === "goedgekeurd") {
    return "Akkoord";
  }

  if (status === "afgekeurd" || status === "afgewezen") {
    return "Afgewezen";
  }

  if (status === "ingediend" || status === "in_beoordeling") {
    return "In controle";
  }

  return status || "Onbekend";
}

export function getDocumentTone(status: string, hasUrl: boolean) {
  if (status === "goedgekeurd") {
    return {
      shell:
        "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10",
      icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
      label: "Profielklaar",
    };
  }

  if (!hasUrl) {
    return {
      shell:
        "border-amber-200/80 bg-amber-50/90 dark:border-amber-400/20 dark:bg-amber-500/10",
      icon: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
      label: "Upload mist",
    };
  }

  if (status === "afgekeurd" || status === "afgewezen") {
    return {
      shell:
        "border-rose-200/80 bg-rose-50/90 dark:border-rose-400/20 dark:bg-rose-500/10",
      icon: "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200",
      label: "Actie nodig",
    };
  }

  return {
    shell:
      "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10",
    icon: "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-200",
    label: "Wordt bekeken",
  };
}

export function getVehicleTone(status: string) {
  if (status === "actief") {
    return {
      shell:
        "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-500/10",
      icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
      label: "Rijklaar",
    };
  }

  return {
    shell:
      "border-amber-200/80 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-500/10",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
    label: "Aandacht",
  };
}

export function findDocumentByKeywords(
  documents: InstructorDocumentSummary[],
  keywords: string[]
) {
  return documents.find((document) => {
    const name = document.naam.toLowerCase();

    return keywords.some((keyword) => name.includes(keyword));
  });
}

export function isDocumentReady(document?: InstructorDocumentSummary) {
  return Boolean(document?.hasUrl && document.status === "goedgekeurd");
}

export function getAuthorityStatusLabel(
  document: InstructorDocumentSummary | undefined,
  required: boolean
) {
  if (!document) {
    return required ? "Mist nog" : "Optioneel";
  }

  if (!document.hasUrl) {
    return "Upload mist";
  }

  if (document.status === "goedgekeurd") {
    return "Akkoord";
  }

  if (document.status === "afgekeurd" || document.status === "afgewezen") {
    return "Actie nodig";
  }

  return "In controle";
}

export function getAuthorityTone(
  document: InstructorDocumentSummary | undefined,
  required: boolean
) {
  if (isDocumentReady(document)) {
    return {
      shell:
        "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10",
      icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
      badge: "success" as const,
    };
  }

  if (document?.status === "afgekeurd" || document?.status === "afgewezen") {
    return {
      shell:
        "border-rose-200/80 bg-rose-50/90 dark:border-rose-400/20 dark:bg-rose-500/10",
      icon: "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200",
      badge: "danger" as const,
    };
  }

  if (required) {
    return {
      shell:
        "border-amber-200/80 bg-amber-50/90 dark:border-amber-400/20 dark:bg-amber-500/10",
      icon: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
      badge: "warning" as const,
    };
  }

  return {
    shell:
      "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10",
    icon: "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-200",
    badge: "info" as const,
  };
}
