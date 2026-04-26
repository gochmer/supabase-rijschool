"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type {
  InstructeurProfiel,
  Pakket,
  TransmissieType,
} from "@/lib/types";
import { InstructorCard } from "@/components/instructors/instructor-card";
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
  options: Array<{ value: string; label: string }>;
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

export function InstructorFinder({
  instructors,
  detailBasePath = "/instructeurs",
  favoriteInstructorIds = [],
  packagesByInstructorId = {},
}: {
  instructors: InstructeurProfiel[];
  detailBasePath?: string;
  favoriteInstructorIds?: string[];
  packagesByInstructorId?: Record<string, Pakket[]>;
}) {
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [price, setPrice] = useState(searchParams.get("price") ?? "100");
  const [rating, setRating] = useState(searchParams.get("rating") ?? "0");
  const [availability, setAvailability] = useState(
    searchParams.get("availability") ?? "alles",
  );
  const [transmission, setTransmission] =
    useState<TransmissieType | "alles">(
      (searchParams.get("transmission") as TransmissieType | "alles") ?? "alles",
    );
  const [specialization, setSpecialization] =
    useState(searchParams.get("specialization") ?? "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") ?? "top");
  const [quickFilter, setQuickFilter] =
    useState(searchParams.get("quick") ?? "alles");

  const filtered = useMemo(() => {
    const next = instructors.filter((instructor) => {
      const matchesCity =
        !city ||
        instructor.steden.some((place) =>
          place.toLowerCase().includes(city.toLowerCase())
        );
      const matchesPrice = instructor.prijs_per_les <= Number(price);
      const matchesRating = instructor.beoordeling >= Number(rating);
      const matchesAvailability = availability === "alles" ? true : true;
      const matchesTransmission =
        transmission === "alles" ||
        instructor.transmissie === transmission ||
        instructor.transmissie === "beide";
      const matchesSpecialization =
        !specialization ||
        instructor.specialisaties.some((tag) =>
          tag.toLowerCase().includes(specialization.toLowerCase())
        );
      const matchesQuickFilter =
        quickFilter === "alles" ||
        (quickFilter === "favorieten" &&
          favoriteInstructorIds.includes(instructor.id)) ||
        (quickFilter === "top" && instructor.beoordeling >= 4.9) ||
        (quickFilter === "beste-prijs" && instructor.prijs_per_les <= 60) ||
        (quickFilter === "examentraining" &&
          instructor.specialisaties.some((tag) =>
            tag.toLowerCase().includes("examentraining")
          ));

      return (
        matchesCity &&
        matchesPrice &&
        matchesRating &&
        matchesAvailability &&
        matchesTransmission &&
        matchesSpecialization &&
        matchesQuickFilter
      );
    });

    if (sortBy === "prijs-laag") {
      return [...next].sort((a, b) => a.prijs_per_les - b.prijs_per_les);
    }

    if (sortBy === "ervaring") {
      return [...next].sort((a, b) => b.ervaring_jaren - a.ervaring_jaren);
    }

    if (sortBy === "favorieten") {
      return [...next].sort(
        (a, b) =>
          Number(favoriteInstructorIds.includes(b.id)) -
          Number(favoriteInstructorIds.includes(a.id))
      );
    }

    return [...next].sort((a, b) => b.beoordeling - a.beoordeling);
  }, [
    availability,
    city,
    favoriteInstructorIds,
    instructors,
    price,
    quickFilter,
    rating,
    sortBy,
    specialization,
    transmission,
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_24px_80px_-40px_rgba(15,23,42,0.65)]">
        <div className="flex flex-wrap gap-2">
          {[
            ["alles", "Alles"],
            ["favorieten", "Favorieten"],
            ["top", "Top beoordeeld"],
            ["beste-prijs", "Beste prijs"],
            ["examentraining", "Examentraining"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setQuickFilter(value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  quickFilter === value
                  ? "border-slate-950 bg-slate-950 text-white dark:border-sky-300/30 dark:bg-white/10"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/16 dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Zoek op stad of regio"
            className="h-11 rounded-xl dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
          />
          <Input
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="Specialisatie"
            className="h-11 rounded-xl dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
          />
          <label className="space-y-2 text-sm text-muted-foreground dark:text-slate-300">
            <span>Max. prijs per les</span>
            <input
              type="range"
              min="45"
              max="100"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full accent-primary"
            />
            <span className="block text-foreground dark:text-white">Tot EUR {price}</span>
          </label>
          <FilterSelect
            label="Min. beoordeling"
            value={rating}
            onValueChange={setRating}
            options={[
              { value: "0", label: "Alles" },
              { value: "4", label: "4.0+" },
              { value: "4.5", label: "4.5+" },
              { value: "4.8", label: "4.8+" },
            ]}
          />
          <FilterSelect
            label="Beschikbaarheid"
            value={availability}
            onValueChange={setAvailability}
            options={[
              { value: "alles", label: "Alles" },
              { value: "avond", label: "Avond" },
              { value: "weekend", label: "Weekend" },
              { value: "deze-week", label: "Deze week" },
            ]}
          />
          <FilterSelect
            label="Transmissie"
            value={transmission}
            onValueChange={(value) =>
              setTransmission(value as TransmissieType | "alles")
            }
            options={[
              { value: "alles", label: "Alles" },
              { value: "handgeschakeld", label: "Handgeschakeld" },
              { value: "automaat", label: "Automaat" },
              { value: "beide", label: "Beide" },
            ]}
          />
          <FilterSelect
            label="Sortering"
            value={sortBy}
            onValueChange={setSortBy}
            options={[
              { value: "top", label: "Top beoordeeld" },
              { value: "prijs-laag", label: "Laagste prijs" },
              { value: "ervaring", label: "Meeste ervaring" },
              { value: "favorieten", label: "Favorieten eerst" },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((instructor) => (
          <InstructorCard
            key={instructor.id}
            instructor={instructor}
            packages={packagesByInstructorId[instructor.id] ?? []}
            detailBasePath={detailBasePath}
            isFavorite={favoriteInstructorIds.includes(instructor.id)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-white/70 p-10 text-center">
          <h3 className="text-xl font-semibold">Geen instructeurs gevonden</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Pas je filters aan of verruim je zoekgebied om meer matches te zien.
          </p>
        </div>
      ) : null}
    </div>
  );
}
