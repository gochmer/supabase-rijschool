"use client";

import type { InstructorFilterValues } from "@/components/instructors/instructor-filter-types";

export type FilterOption = {
  value: string;
  label: string;
};

export type QuickFilterOption = {
  value: InstructorFilterValues["quickFilter"];
  label: string;
};

export const instructorPriceOptions: FilterOption[] = [
  { value: "alles", label: "Alles" },
  { value: "55", label: "Tot EUR 55" },
  { value: "65", label: "Tot EUR 65" },
  { value: "75", label: "Tot EUR 75" },
];

export const instructorRatingOptions: FilterOption[] = [
  { value: "0", label: "Alles" },
  { value: "4", label: "4.0+" },
  { value: "4.5", label: "4.5+" },
  { value: "4.8", label: "4.8+" },
];

export const instructorAvailabilityOptions: FilterOption[] = [
  { value: "alles", label: "Alles" },
  { value: "avond", label: "Avond" },
  { value: "weekend", label: "Weekend" },
  { value: "deze-week", label: "Deze week" },
];

export const instructorTransmissionOptions: FilterOption[] = [
  { value: "alles", label: "Alles" },
  { value: "handgeschakeld", label: "Handgeschakeld" },
  { value: "automaat", label: "Automaat" },
  { value: "beide", label: "Beide" },
];

export const instructorSortOptions: FilterOption[] = [
  { value: "top", label: "Top beoordeeld" },
  { value: "prijs-laag", label: "Laagste prijs" },
  { value: "ervaring", label: "Meeste ervaring" },
  { value: "favorieten", label: "Favorieten eerst" },
];

export const instructorQuickFilterOptions: QuickFilterOption[] = [
  { value: "alles", label: "Alles" },
  { value: "favorieten", label: "Favorieten" },
  { value: "top", label: "Top beoordeeld" },
  { value: "beste-prijs", label: "Beste prijs" },
  { value: "examentraining", label: "Examentraining" },
];

export function formatPriceLabel(price: string) {
  return price === "alles" ? "Alle prijzen" : `Tot EUR ${price}`;
}

export function getQuickFilterLabel(value: InstructorFilterValues["quickFilter"]) {
  return instructorQuickFilterOptions.find((option) => option.value === value)?.label ?? value;
}
