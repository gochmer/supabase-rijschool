"use client";

import { Search, SlidersHorizontal } from "lucide-react";

import {
  formatPriceLabel,
  instructorAvailabilityOptions,
  instructorPriceOptions,
  instructorRatingOptions,
  instructorSortOptions,
  instructorTransmissionOptions,
  type FilterOption,
} from "@/components/instructors/instructor-filter-config";
import type {
  InstructorFilterHandlers,
  InstructorFilterValues,
} from "@/components/instructors/instructor-filter-types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: FilterOption[];
}) {
  return (
    <label className="space-y-2 text-sm text-muted-foreground dark:text-slate-300">
      <span>{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-11 w-full rounded-xl border-slate-200/80 bg-white px-3 text-sm shadow-[0_14px_28px_-24px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-[0_14px_28px_-24px_rgba(15,23,42,0.42)]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          className="overflow-hidden rounded-[1rem] border border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-1 shadow-[0_22px_60px_-30px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] dark:shadow-[0_22px_60px_-30px_rgba(15,23,42,0.52)]"
        >
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="min-h-9 rounded-[0.8rem] px-3 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-200 focus:bg-[linear-gradient(135deg,#1d4ed8,#38bdf8)] focus:text-white"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

export function InstructorFilterFields({
  values,
  handlers,
  className = "grid gap-4",
}: {
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
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={values.city}
          onChange={(event) => handlers.onCityChange(event.target.value)}
          placeholder="Zoek op stad of regio"
          className="h-11 rounded-xl pl-9 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
        />
      </div>

      <div className="relative">
        <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={values.specialization}
          onChange={(event) => handlers.onSpecializationChange(event.target.value)}
          placeholder="Specialisatie"
          className="h-11 rounded-xl pl-9 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
        />
      </div>

      <FilterSelect
        label="Max. prijs per les"
        value={values.price}
        onValueChange={handlers.onPriceChange}
        options={instructorPriceOptions.map((option) => ({
          ...option,
          label: option.value === "alles" ? option.label : formatPriceLabel(option.value),
        }))}
      />

      <FilterSelect
        label="Min. beoordeling"
        value={values.rating}
        onValueChange={handlers.onRatingChange}
        options={instructorRatingOptions}
      />

      <FilterSelect
        label="Beschikbaarheid"
        value={values.availability}
        onValueChange={handlers.onAvailabilityChange}
        options={instructorAvailabilityOptions}
      />

      <FilterSelect
        label="Transmissie"
        value={values.transmission}
        onValueChange={(value) => handlers.onTransmissionChange(value as InstructorFilterValues["transmission"])}
        options={instructorTransmissionOptions}
      />

      <FilterSelect
        label="Sortering"
        value={values.sortBy}
        onValueChange={handlers.onSortByChange}
        options={instructorSortOptions}
      />
    </div>
  );
}
