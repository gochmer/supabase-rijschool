"use client";

import { X } from "lucide-react";

import { InstructorFilterFields } from "@/components/instructors/instructor-filter-fields";
import type {
  InstructorFilterHandlers,
  InstructorFilterValues,
  SmartFilterSuggestion,
} from "@/components/instructors/instructor-filter-types";
import { SmartFilterSuggestions } from "@/components/instructors/smart-filter-suggestions";
import { Button } from "@/components/ui/button";

export function MobileFilterDrawer({
  open,
  onClose,
  suggestions,
  values,
  handlers,
  hasActiveFilters,
  onReset,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  suggestions: SmartFilterSuggestion[];
  values: InstructorFilterValues;
  handlers: Pick<
    InstructorFilterHandlers,
    | "onCityChange"
    | "onSpecializationChange"
    | "onPriceChange"
    | "onRatingChange"
    | "onAvailabilityChange"
    | "onTransmissionChange"
    | "onSortByChange"
  >;
  hasActiveFilters: boolean;
  onReset: () => void;
  resultCount: number;
}) {
  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Sluit filters"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] border border-white/70 bg-white p-5 shadow-[0_-28px_90px_-48px_rgba(15,23,42,0.6)] transition-transform duration-300 dark:border-white/10 dark:bg-slate-950 lg:hidden"
        style={{ transform: open ? "translateY(0)" : "translateY(110%)" }}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
              Filters
            </p>
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              Verfijn je selectie
            </h3>
          </div>
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-4">
          <SmartFilterSuggestions suggestions={suggestions} compact />
        </div>

        <div className="mt-4 max-h-[56vh] overflow-y-auto pr-1">
          <InstructorFilterFields values={values} handlers={handlers} className="grid gap-4" />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" className="rounded-full" onClick={onReset} disabled={!hasActiveFilters}>
            Reset filters
          </Button>
          <Button type="button" className="rounded-full" onClick={onClose}>
            Toon {resultCount} resultaten
          </Button>
        </div>
      </div>
    </>
  );
}
