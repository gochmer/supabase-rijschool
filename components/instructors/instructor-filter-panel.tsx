"use client";

import { SlidersHorizontal, Sparkles, X } from "lucide-react";

import { ActiveFilterChips } from "@/components/instructors/active-filter-chips";
import { instructorQuickFilterOptions } from "@/components/instructors/instructor-filter-config";
import { InstructorFilterFields } from "@/components/instructors/instructor-filter-fields";
import type {
  InstructorFilterHandlers,
  InstructorFilterValues,
  SmartFilterSuggestion,
} from "@/components/instructors/instructor-filter-types";
import { SmartFilterSuggestions } from "@/components/instructors/smart-filter-suggestions";
import { Button } from "@/components/ui/button";

export function InstructorFilterPanel({
  filteredCount,
  totalCount,
  activeChips,
  isPending,
  values,
  handlers,
  suggestions,
  hasActiveFilters,
  onReset,
  onOpenMobileFilters,
}: {
  filteredCount: number;
  totalCount: number;
  activeChips: string[];
  isPending: boolean;
  values: InstructorFilterValues;
  handlers: InstructorFilterHandlers;
  suggestions: SmartFilterSuggestion[];
  hasActiveFilters: boolean;
  onReset: () => void;
  onOpenMobileFilters: () => void;
}) {
  return (
    <div className="surface-panel relative z-10 overflow-hidden rounded-[1.65rem]">
      <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(29,78,216,0.86),rgba(14,165,233,0.68))] px-5 py-5 text-white dark:border-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/78 uppercase">
              <Sparkles className="size-3.5" />
              Slim vergelijken
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              {filteredCount} van {totalCount} instructeurs passen bij je selectie.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/72">
              Verfijn op regio, prijs, beoordeling en lesauto. Je ziet direct welke profielen het beste aansluiten.
            </p>
          </div>

          <ActiveFilterChips chips={activeChips} isPending={isPending} />
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {instructorQuickFilterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlers.onQuickFilterChange(option.value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${values.quickFilter === option.value ? "border-slate-950 bg-slate-950 text-white dark:border-sky-300/30 dark:bg-white/10" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/16 dark:hover:text-white"}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenMobileFilters}
              className="rounded-full lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {hasActiveFilters ? ` (${activeChips.length})` : ""}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={!hasActiveFilters}
              className="rounded-full"
            >
              <X className="size-4" />
              Reset filters
            </Button>
          </div>
        </div>

        <SmartFilterSuggestions suggestions={suggestions} />

        <InstructorFilterFields
          values={values}
          handlers={{
            onCityChange: handlers.onCityChange,
            onSpecializationChange: handlers.onSpecializationChange,
            onPriceChange: handlers.onPriceChange,
            onRatingChange: handlers.onRatingChange,
            onAvailabilityChange: handlers.onAvailabilityChange,
            onTransmissionChange: handlers.onTransmissionChange,
            onSortByChange: handlers.onSortByChange,
          }}
          className="hidden gap-4 lg:grid lg:grid-cols-7"
        />
      </div>
    </div>
  );
}
