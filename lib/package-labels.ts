import type { RijlesType } from "@/lib/types";

export const PACKAGE_LABEL_LIMIT = 8;
export const PACKAGE_LABEL_MAX_LENGTH = 28;
export const PRAKTIJK_EXAMEN_LABEL = "Praktijk-examen";

const sharedPackageLabelSuggestions = [
  PRAKTIJK_EXAMEN_LABEL,
  "Spoedtraject",
  "Weekend",
  "Avond",
];

const packageLabelSuggestionsByType: Record<RijlesType, string[]> = {
  auto: ["Automaat", "Handgeschakeld", "Faalangst", "Opfris"],
  motor: ["AVB", "AVD", "Opstaples", "Beschermende kleding"],
  vrachtwagen: ["Code 95", "Praktijk C", "Ritvoorbereiding", "Bedrijfsopleiding"],
};

export function normalizePackageLabel(value: string | null | undefined) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function getPackageLabelKey(value: string | null | undefined) {
  return normalizePackageLabel(value).toLocaleLowerCase("nl-NL");
}

export function normalizePackageLabels(input: string[] | string | null | undefined) {
  const values = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(/[\n,]+/)
      : [];

  const seen = new Set<string>();
  const labels: string[] = [];

  for (const value of values) {
    const label = normalizePackageLabel(value);

    if (!label) {
      continue;
    }

    const key = getPackageLabelKey(label);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    labels.push(label);
  }

  return labels;
}

export function getPackageLabelSuggestions(lesType: RijlesType) {
  return normalizePackageLabels([
    ...sharedPackageLabelSuggestions,
    ...packageLabelSuggestionsByType[lesType],
  ]);
}

export function packageHasLabel(
  labels: string[] | null | undefined,
  targetLabel: string
) {
  const targetKey = getPackageLabelKey(targetLabel);
  return (labels ?? []).some((label) => getPackageLabelKey(label) === targetKey);
}
