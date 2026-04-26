import type { RijlesType } from "@/lib/types";

export const rijlesTypeOptions: Array<{
  value: RijlesType;
  label: string;
  pluralLabel: string;
  description: string;
  href: string;
}> = [
  {
    value: "auto",
    label: "Auto",
    pluralLabel: "Autorijlessen",
    description: "Reguliere B-rijlessen, intakepakketten en examenroutes.",
    href: "/pakketten",
  },
  {
    value: "motor",
    label: "Motor",
    pluralLabel: "Motorrijlessen",
    description: "AVB, AVD en complete motortrajecten met gerichte opbouw.",
    href: "/motor",
  },
  {
    value: "vrachtwagen",
    label: "Vrachtwagen",
    pluralLabel: "Vrachtwagenrijlessen",
    description: "C-rijbewijs, praktijkuren en trajecten richting professioneel vervoer.",
    href: "/vrachtwagen",
  },
];

export function isRijlesType(value: string): value is RijlesType {
  return rijlesTypeOptions.some((option) => option.value === value);
}

export function getRijlesType(value: string | null | undefined): RijlesType {
  if (value && isRijlesType(value)) {
    return value;
  }

  return "auto";
}

export function getRijlesTypeOption(value: string | null | undefined) {
  const normalized = getRijlesType(value);

  return (
    rijlesTypeOptions.find((option) => option.value === normalized) ??
    rijlesTypeOptions[0]
  );
}

export function getRijlesTypeLabel(value: string | null | undefined) {
  return getRijlesTypeOption(value).label;
}
