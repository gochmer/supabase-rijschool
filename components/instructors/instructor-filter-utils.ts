import {
  formatPriceLabel,
  getQuickFilterLabel,
} from "@/components/instructors/instructor-filter-config";
import type { InstructorFilterValues } from "@/components/instructors/instructor-filter-types";
import type { InstructeurProfiel } from "@/lib/types";

export type InstructorSuggestionSeed =
  | { kind: "city"; label: string; value: string }
  | { kind: "rating"; label: string; value: string }
  | { kind: "price"; label: string; value: string }
  | { kind: "transmission"; label: string; value: InstructorFilterValues["transmission"] };

export function getInstructorFilterParam(
  searchParams: URLSearchParams,
  key: string,
  fallback: string
) {
  return searchParams.get(key) ?? fallback;
}

export function hasActiveInstructorFilters(values: InstructorFilterValues) {
  return Boolean(
    values.city ||
      values.specialization ||
      values.price !== "alles" ||
      values.rating !== "0" ||
      values.availability !== "alles" ||
      values.transmission !== "alles" ||
      values.quickFilter !== "alles"
  );
}

export function buildInstructorSearchParams(values: InstructorFilterValues) {
  const params = new URLSearchParams();

  if (values.city) params.set("city", values.city);
  if (values.specialization) params.set("specialization", values.specialization);
  if (values.price !== "alles") params.set("price", values.price);
  if (values.rating !== "0") params.set("rating", values.rating);
  if (values.availability !== "alles") params.set("availability", values.availability);
  if (values.transmission !== "alles") params.set("transmission", values.transmission);
  if (values.sortBy !== "top") params.set("sort", values.sortBy);
  if (values.quickFilter !== "alles") params.set("quick", values.quickFilter);

  return params;
}

export function matchesCity(instructor: InstructeurProfiel, city: string) {
  return !city || instructor.steden.some((place) => place.toLowerCase().includes(city.toLowerCase()));
}

export function matchesPrice(instructor: InstructeurProfiel, price: string) {
  return price === "alles" || instructor.prijs_per_les <= Number(price);
}

export function matchesRating(instructor: InstructeurProfiel, rating: string) {
  return instructor.beoordeling >= Number(rating);
}

export function matchesAvailability(_instructor: InstructeurProfiel, availability: string) {
  return availability === "alles" ? true : true;
}

export function matchesTransmission(
  instructor: InstructeurProfiel,
  transmission: InstructorFilterValues["transmission"]
) {
  return (
    transmission === "alles" ||
    instructor.transmissie === transmission ||
    instructor.transmissie === "beide"
  );
}

export function matchesSpecialization(instructor: InstructeurProfiel, specialization: string) {
  return (
    !specialization ||
    instructor.specialisaties.some((tag) =>
      tag.toLowerCase().includes(specialization.toLowerCase())
    )
  );
}

export function matchesQuickFilter(
  instructor: InstructeurProfiel,
  quickFilter: InstructorFilterValues["quickFilter"],
  favoriteInstructorIds: string[]
) {
  return (
    quickFilter === "alles" ||
    (quickFilter === "favorieten" && favoriteInstructorIds.includes(instructor.id)) ||
    (quickFilter === "top" && instructor.beoordeling >= 4.9) ||
    (quickFilter === "beste-prijs" && instructor.prijs_per_les <= 60) ||
    (quickFilter === "examentraining" &&
      instructor.specialisaties.some((tag) =>
        tag.toLowerCase().includes("examentraining")
      ))
  );
}

export function filterInstructors({
  instructors,
  values,
  favoriteInstructorIds,
}: {
  instructors: InstructeurProfiel[];
  values: InstructorFilterValues;
  favoriteInstructorIds: string[];
}) {
  return instructors.filter((instructor) => {
    return (
      matchesCity(instructor, values.city) &&
      matchesPrice(instructor, values.price) &&
      matchesRating(instructor, values.rating) &&
      matchesAvailability(instructor, values.availability) &&
      matchesTransmission(instructor, values.transmission) &&
      matchesSpecialization(instructor, values.specialization) &&
      matchesQuickFilter(instructor, values.quickFilter, favoriteInstructorIds)
    );
  });
}

export function sortInstructors({
  instructors,
  sortBy,
  favoriteInstructorIds,
}: {
  instructors: InstructeurProfiel[];
  sortBy: InstructorFilterValues["sortBy"];
  favoriteInstructorIds: string[];
}) {
  if (sortBy === "prijs-laag") {
    return [...instructors].sort((a, b) => a.prijs_per_les - b.prijs_per_les);
  }

  if (sortBy === "ervaring") {
    return [...instructors].sort((a, b) => b.ervaring_jaren - a.ervaring_jaren);
  }

  if (sortBy === "favorieten") {
    return [...instructors].sort(
      (a, b) =>
        Number(favoriteInstructorIds.includes(b.id)) -
        Number(favoriteInstructorIds.includes(a.id))
    );
  }

  return [...instructors].sort((a, b) => b.beoordeling - a.beoordeling);
}

export function buildInstructorSuggestionSeeds({
  instructors,
  values,
}: {
  instructors: InstructeurProfiel[];
  values: InstructorFilterValues;
}) {
  const allCities = instructors.flatMap((instructor) => instructor.steden).filter(Boolean);
  const cityCounts = new Map<string, number>();

  for (const cityName of allCities) {
    cityCounts.set(cityName, (cityCounts.get(cityName) ?? 0) + 1);
  }

  const popularCity = [...cityCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const hasCheap = instructors.some((instructor) => instructor.prijs_per_les <= 60);
  const hasTop = instructors.some((instructor) => instructor.beoordeling >= 4.8);

  return [
    popularCity && !values.city
      ? { kind: "city", label: `Populair in ${popularCity}`, value: popularCity }
      : null,
    hasTop && values.rating === "0"
      ? { kind: "rating", label: "Alleen 4.8+ sterren", value: "4.8" }
      : null,
    hasCheap && values.price === "alles"
      ? { kind: "price", label: "Beste prijs tot EUR 60", value: "65" }
      : null,
    values.transmission === "alles"
      ? { kind: "transmission", label: "Automaat filter", value: "automaat" }
      : null,
  ].filter(Boolean) as InstructorSuggestionSeed[];
}

export function buildInstructorActiveChips(values: InstructorFilterValues) {
  return [
    values.city ? `Regio: ${values.city}` : null,
    values.specialization ? `Specialisatie: ${values.specialization}` : null,
    values.price !== "alles" ? formatPriceLabel(values.price) : null,
    values.rating !== "0" ? `${values.rating}+ sterren` : null,
    values.transmission !== "alles" ? values.transmission : null,
    values.quickFilter !== "alles" ? getQuickFilterLabel(values.quickFilter) : null,
  ].filter(Boolean) as string[];
}

export function buildInstructorSummaryChips(values: InstructorFilterValues, activeChips: string[]) {
  return activeChips.length > 0
    ? activeChips
    : [
        formatPriceLabel(values.price),
        values.rating === "0" ? "Alle beoordelingen" : `${values.rating}+ sterren`,
        values.transmission === "alles" ? "Alle lesauto's" : values.transmission,
      ];
}

export function buildInstructorAnimationKey(values: InstructorFilterValues) {
  return [
    values.city,
    values.specialization,
    values.price,
    values.rating,
    values.availability,
    values.transmission,
    values.sortBy,
    values.quickFilter,
  ].join("|");
}
