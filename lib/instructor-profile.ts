import type { TransmissieType } from "@/lib/types";

export const instructorColorOptions = [
  {
    label: "Helder blauw",
    value: "from-sky-300 via-cyan-400 to-blue-600",
  },
  {
    label: "Warm amber",
    value: "from-amber-300 via-orange-400 to-rose-500",
  },
  {
    label: "Groen aqua",
    value: "from-emerald-300 via-teal-400 to-cyan-600",
  },
  {
    label: "Roze sunset",
    value: "from-fuchsia-300 via-pink-400 to-rose-500",
  },
  {
    label: "Indigo violet",
    value: "from-indigo-300 via-violet-400 to-purple-600",
  },
] as const;

export const instructorTransmissionOptions: Array<{
  label: string;
  value: TransmissieType;
}> = [
  { label: "Beide", value: "beide" },
  { label: "Automaat", value: "automaat" },
  { label: "Handgeschakeld", value: "handgeschakeld" },
];

export function parseCommaSeparatedList(value: string) {
  const seen = new Set<string>();

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .filter((item) => {
      const key = item.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

export function isInstructorColor(value: string) {
  return instructorColorOptions.some((option) => option.value === value);
}

export function isTransmissionType(value: string): value is TransmissieType {
  return instructorTransmissionOptions.some((option) => option.value === value);
}

export function calculateInstructorProfileCompletion(input: {
  bio: string;
  telefoon: string;
  werkgebied: string[];
  prijsPerLes: number;
  specialisaties: string[];
  ervaringJaren: number;
}) {
  const checks = [
    input.bio.trim().length > 0,
    input.telefoon.trim().length > 0,
    input.werkgebied.length > 0,
    input.prijsPerLes > 0,
    input.specialisaties.length > 0,
    input.ervaringJaren > 0,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
