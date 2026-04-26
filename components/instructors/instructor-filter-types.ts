"use client";

import type { TransmissieType } from "@/lib/types";

export type SmartFilterSuggestion = {
  label: string;
  action: () => void;
};

export type InstructorFilterValues = {
  city: string;
  specialization: string;
  price: string;
  rating: string;
  availability: string;
  transmission: TransmissieType | "alles";
  sortBy: string;
  quickFilter: string;
};

export type InstructorFilterHandlers = {
  onCityChange: (value: string) => void;
  onSpecializationChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onAvailabilityChange: (value: string) => void;
  onTransmissionChange: (value: TransmissieType | "alles") => void;
  onSortByChange: (value: string) => void;
  onQuickFilterChange: (value: string) => void;
};
