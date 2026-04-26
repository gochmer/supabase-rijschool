"use client";

import { WandSparkles } from "lucide-react";
import type { SmartFilterSuggestion } from "@/components/instructors/instructor-filter-types";

export function SmartFilterSuggestions({
  suggestions,
  compact = false,
}: {
  suggestions: SmartFilterSuggestion[];
  compact?: boolean;
}) {
  if (!suggestions.length) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={suggestion.action}
            className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-800 dark:border-white/10 dark:bg-white/8 dark:text-sky-100"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[1.15rem] border border-sky-100 bg-sky-50/80 p-2 dark:border-white/10 dark:bg-white/5">
      <span className="inline-flex items-center gap-1 px-2 text-xs font-semibold text-sky-700 dark:text-sky-200">
        <WandSparkles className="size-3.5" />
        Slimme filters
      </span>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.label}
          type="button"
          onClick={suggestion.action}
          className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-800 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/8 dark:text-sky-100"
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}
