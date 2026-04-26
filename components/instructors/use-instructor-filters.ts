"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  InstructorFilterHandlers,
  InstructorFilterValues,
  SmartFilterSuggestion,
} from "@/components/instructors/instructor-filter-types";
import {
  buildInstructorActiveChips,
  buildInstructorAnimationKey,
  buildInstructorSearchParams,
  buildInstructorSuggestionSeeds,
  buildInstructorSummaryChips,
  filterInstructors,
  getInstructorFilterParam,
  hasActiveInstructorFilters,
  sortInstructors,
} from "@/components/instructors/instructor-filter-utils";
import type { InstructeurProfiel, TransmissieType } from "@/lib/types";

export function useInstructorFilters({
  instructors,
  favoriteInstructorIds,
}: {
  instructors: InstructeurProfiel[];
  favoriteInstructorIds: string[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [price, setPrice] = useState(searchParams.get("price") ?? "alles");
  const [rating, setRating] = useState(searchParams.get("rating") ?? "0");
  const [availability, setAvailability] = useState(searchParams.get("availability") ?? "alles");
  const [transmission, setTransmission] = useState<TransmissieType | "alles">(
    (searchParams.get("transmission") as TransmissieType | "alles") ?? "alles"
  );
  const [specialization, setSpecialization] = useState(searchParams.get("specialization") ?? "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") ?? "top");
  const [quickFilter, setQuickFilter] = useState(searchParams.get("quick") ?? "alles");

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const syncFrame = window.requestAnimationFrame(() => {
      setCity(getInstructorFilterParam(params, "city", ""));
      setSpecialization(getInstructorFilterParam(params, "specialization", ""));
      setPrice(getInstructorFilterParam(params, "price", "alles"));
      setRating(getInstructorFilterParam(params, "rating", "0"));
      setAvailability(getInstructorFilterParam(params, "availability", "alles"));
      setTransmission(
        getInstructorFilterParam(params, "transmission", "alles") as TransmissieType | "alles"
      );
      setSortBy(getInstructorFilterParam(params, "sort", "top"));
      setQuickFilter(getInstructorFilterParam(params, "quick", "alles"));
    });

    return () => {
      window.cancelAnimationFrame(syncFrame);
    };
  }, [searchParams]);

  const filterValues = useMemo<InstructorFilterValues>(
    () => ({
      city,
      specialization,
      price,
      rating,
      availability,
      transmission,
      sortBy,
      quickFilter,
    }),
    [availability, city, price, quickFilter, rating, sortBy, specialization, transmission]
  );

  useEffect(() => {
    const params = buildInstructorSearchParams(filterValues);

    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => router.replace(next, { scroll: false }));
  }, [
    availability,
    city,
    pathname,
    price,
    quickFilter,
    rating,
    router,
    sortBy,
    specialization,
    transmission,
    filterValues,
  ]);

  const hasActiveFilters = hasActiveInstructorFilters(filterValues);

  const filtered = useMemo(() => {
    const matching = filterInstructors({
      instructors,
      values: filterValues,
      favoriteInstructorIds,
    });

    return sortInstructors({
      instructors: matching,
      sortBy: filterValues.sortBy,
      favoriteInstructorIds,
    });
  }, [favoriteInstructorIds, filterValues, instructors]);

  const smartSuggestions = useMemo(() => {
    return buildInstructorSuggestionSeeds({
      instructors,
      values: filterValues,
    }).map((suggestion): SmartFilterSuggestion => {
      if (suggestion.kind === "city") {
        return { label: suggestion.label, action: () => setCity(suggestion.value) };
      }

      if (suggestion.kind === "rating") {
        return { label: suggestion.label, action: () => setRating(suggestion.value) };
      }

      if (suggestion.kind === "price") {
        return { label: suggestion.label, action: () => setPrice(suggestion.value) };
      }

      return {
        label: suggestion.label,
        action: () => setTransmission(suggestion.value),
      };
    });
  }, [filterValues, instructors]);

  const activeChips = buildInstructorActiveChips(filterValues);
  const summaryChips = buildInstructorSummaryChips(filterValues, activeChips);

  const filterHandlers: InstructorFilterHandlers = {
    onCityChange: setCity,
    onSpecializationChange: setSpecialization,
    onPriceChange: setPrice,
    onRatingChange: setRating,
    onAvailabilityChange: setAvailability,
    onTransmissionChange: setTransmission,
    onSortByChange: setSortBy,
    onQuickFilterChange: setQuickFilter,
  };

  const animationKey = buildInstructorAnimationKey(filterValues);

  const resetFilters = () => {
    setCity("");
    setSpecialization("");
    setPrice("alles");
    setRating("0");
    setAvailability("alles");
    setTransmission("alles");
    setQuickFilter("alles");
    setSortBy("top");
  };

  return {
    isPending,
    filtered,
    smartSuggestions,
    filterValues,
    filterHandlers,
    hasActiveFilters,
    summaryChips,
    animationKey,
    resetFilters,
  };
}
