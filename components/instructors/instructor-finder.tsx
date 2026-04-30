"use client";

import { useState } from "react";

import { InstructorFilterPanel } from "@/components/instructors/instructor-filter-panel";
import { InstructorResultsGrid } from "@/components/instructors/instructor-results-grid";
import { MobileFilterDrawer } from "@/components/instructors/mobile-filter-drawer";
import { useInstructorFilters } from "@/components/instructors/use-instructor-filters";
import type { WeeklyBookedMinutesMap } from "@/lib/self-scheduling-limits";
import type { BeschikbaarheidSlot, InstructeurProfiel, Pakket } from "@/lib/types";

export function InstructorFinder({
  instructors,
  detailBasePath = "/instructeurs",
  favoriteInstructorIds = [],
  packagesByInstructorId = {},
  availableSlotsByInstructorId = {},
  directBookingEnabledByInstructorId = {},
  trialLessonAvailableByInstructorId = {},
  weeklyBookingLimitByInstructorId = {},
  bookedMinutesByWeekStartByInstructorId = {},
  weeklyRemainingMinutesThisWeekByInstructorId = {},
  showPackagePanel = true,
}: {
  instructors: InstructeurProfiel[];
  detailBasePath?: string;
  favoriteInstructorIds?: string[];
  packagesByInstructorId?: Record<string, Pakket[]>;
  availableSlotsByInstructorId?: Record<string, BeschikbaarheidSlot[]>;
  directBookingEnabledByInstructorId?: Record<string, boolean>;
  trialLessonAvailableByInstructorId?: Record<string, boolean>;
  weeklyBookingLimitByInstructorId?: Record<string, number | null>;
  bookedMinutesByWeekStartByInstructorId?: Record<string, WeeklyBookedMinutesMap>;
  weeklyRemainingMinutesThisWeekByInstructorId?: Record<string, number | null>;
  showPackagePanel?: boolean;
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const {
    isPending,
    filtered,
    smartSuggestions,
    filterValues,
    filterHandlers,
    hasActiveFilters,
    summaryChips,
    animationKey,
    resetFilters,
  } = useInstructorFilters({
    instructors,
    favoriteInstructorIds,
  });

  return (
    <div className="space-y-8">
      <MobileFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        suggestions={smartSuggestions}
        values={filterValues}
        handlers={filterHandlers}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
        resultCount={filtered.length}
      />

      <InstructorFilterPanel
        filteredCount={filtered.length}
        totalCount={instructors.length}
        activeChips={summaryChips}
        isPending={isPending}
        values={filterValues}
        handlers={filterHandlers}
        suggestions={smartSuggestions}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
        onOpenMobileFilters={() => setMobileFiltersOpen(true)}
      />

      <InstructorResultsGrid
        instructors={filtered}
        packagesByInstructorId={packagesByInstructorId}
        availableSlotsByInstructorId={availableSlotsByInstructorId}
        directBookingEnabledByInstructorId={directBookingEnabledByInstructorId}
        trialLessonAvailableByInstructorId={trialLessonAvailableByInstructorId}
        weeklyBookingLimitByInstructorId={weeklyBookingLimitByInstructorId}
        bookedMinutesByWeekStartByInstructorId={bookedMinutesByWeekStartByInstructorId}
        weeklyRemainingMinutesThisWeekByInstructorId={
          weeklyRemainingMinutesThisWeekByInstructorId
        }
        favoriteInstructorIds={favoriteInstructorIds}
        detailBasePath={detailBasePath}
        showPackagePanel={showPackagePanel}
        animationKey={animationKey}
        isPending={isPending}
        onReset={resetFilters}
      />
    </div>
  );
}
