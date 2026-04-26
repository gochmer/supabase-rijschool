"use client";

import { useEffect, useMemo, useTransition, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";

import type {
  InstructeurProfiel,
  Pakket,
  TransmissieType,
} from "@/lib/types";
import { InstructorCard } from "@/components/instructors/instructor-card";
import { Button } from "@/components/ui/button";
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
            <SelectItem key={option.value} value={option.value} className="min-h-9 rounded-[0.8rem] px-3 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-200 focus:bg-[linear-gradient(135deg,#1d4ed8,#38bdf8)] focus:text-white">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function formatPriceLabel(price: string) {
  return price === "alles" ? "Alle prijzen" : `Tot EUR ${price}`;
}

function getParam(searchParams: URLSearchParams, key: string, fallback: string) {
  return searchParams.get(key) ?? fallback;
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
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [price, setPrice] = useState(searchParams.get("price") ?? "alles");
  const [rating, setRating] = useState(searchParams.get("rating") ?? "0");
  const [availability, setAvailability] = useState(searchParams.get("availability") ?? "alles");
  const [transmission, setTransmission] = useState<TransmissieType | "alles">((searchParams.get("transmission") as TransmissieType | "alles") ?? "alles");
  const [specialization, setSpecialization] = useState(searchParams.get("specialization") ?? "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") ?? "top");
  const [quickFilter, setQuickFilter] = useState(searchParams.get("quick") ?? "alles");

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const syncFrame = window.requestAnimationFrame(() => {
      setCity(getParam(params, "city", ""));
      setSpecialization(getParam(params, "specialization", ""));
      setPrice(getParam(params, "price", "alles"));
      setRating(getParam(params, "rating", "0"));
      setAvailability(getParam(params, "availability", "alles"));
      setTransmission(getParam(params, "transmission", "alles") as TransmissieType | "alles");
      setSortBy(getParam(params, "sort", "top"));
      setQuickFilter(getParam(params, "quick", "alles"));
    });

    return () => {
      window.cancelAnimationFrame(syncFrame);
    };
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (specialization) params.set("specialization", specialization);
    if (price !== "alles") params.set("price", price);
    if (rating !== "0") params.set("rating", rating);
    if (availability !== "alles") params.set("availability", availability);
    if (transmission !== "alles") params.set("transmission", transmission);
    if (sortBy !== "top") params.set("sort", sortBy);
    if (quickFilter !== "alles") params.set("quick", quickFilter);

    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      router.replace(next, { scroll: false });
    });
  }, [availability, city, pathname, price, quickFilter, rating, router, sortBy, specialization, transmission]);

  const hasActiveFilters = Boolean(city || specialization || price !== "alles" || rating !== "0" || availability !== "alles" || transmission !== "alles" || quickFilter !== "alles");

  function resetFilters() {
    setCity("");
    setSpecialization("");
    setPrice("alles");
    setRating("0");
    setAvailability("alles");
    setTransmission("alles");
    setQuickFilter("alles");
    setSortBy("top");
  }

  const filtered = useMemo(() => {
    const next = instructors.filter((instructor) => {
      const matchesCity = !city || instructor.steden.some((place) => place.toLowerCase().includes(city.toLowerCase()));
      const matchesPrice = price === "alles" || instructor.prijs_per_les <= Number(price);
      const matchesRating = instructor.beoordeling >= Number(rating);
      const matchesAvailability = availability === "alles" ? true : true;
      const matchesTransmission = transmission === "alles" || instructor.transmissie === transmission || instructor.transmissie === "beide";
      const matchesSpecialization = !specialization || instructor.specialisaties.some((tag) => tag.toLowerCase().includes(specialization.toLowerCase()));
      const matchesQuickFilter = quickFilter === "alles" || (quickFilter === "favorieten" && favoriteInstructorIds.includes(instructor.id)) || (quickFilter === "top" && instructor.beoordeling >= 4.9) || (quickFilter === "beste-prijs" && instructor.prijs_per_les <= 60) || (quickFilter === "examentraining" && instructor.specialisaties.some((tag) => tag.toLowerCase().includes("examentraining")));
      return matchesCity && matchesPrice && matchesRating && matchesAvailability && matchesTransmission && matchesSpecialization && matchesQuickFilter;
    });

    if (sortBy === "prijs-laag") return [...next].sort((a, b) => a.prijs_per_les - b.prijs_per_les);
    if (sortBy === "ervaring") return [...next].sort((a, b) => b.ervaring_jaren - a.ervaring_jaren);
    if (sortBy === "favorieten") return [...next].sort((a, b) => Number(favoriteInstructorIds.includes(b.id)) - Number(favoriteInstructorIds.includes(a.id)));
    return [...next].sort((a, b) => b.beoordeling - a.beoordeling);
  }, [availability, city, favoriteInstructorIds, instructors, price, quickFilter, rating, sortBy, specialization, transmission]);

  return (
    <div className="space-y-8">
      <div className="sticky top-4 z-20 overflow-hidden rounded-[2.2rem] border border-white/70 bg-white/88 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.34)] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86),rgba(15,23,42,0.94))] dark:shadow-[0_28px_90px_-48px_rgba(15,23,42,0.68)]">
        <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(29,78,216,0.92),rgba(14,165,233,0.82))] px-5 py-5 text-white dark:border-white/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/78 uppercase">
                <Sparkles className="size-3.5" />
                Slim vergelijken
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {filtered.length} van {instructors.length} instructeurs passen bij je selectie.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/72">
                Verfijn op regio, prijs, beoordeling en lesauto. Je ziet direct welke profielen het beste aansluiten.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-white/78">
              <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1.5">{formatPriceLabel(price)}</span>
              <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1.5">{rating === "0" ? "Alle beoordelingen" : `${rating}+ sterren`}</span>
              <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1.5">{transmission === "alles" ? "Alle lesauto's" : transmission}</span>
              {isPending ? <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1.5">Bijwerken...</span> : null}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {[["alles", "Alles"], ["favorieten", "Favorieten"], ["top", "Top beoordeeld"], ["beste-prijs", "Beste prijs"], ["examentraining", "Examentraining"]].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setQuickFilter(value)} className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${quickFilter === value ? "border-slate-950 bg-slate-950 text-white dark:border-sky-300/30 dark:bg-white/10" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/16 dark:hover:text-white"}`}>
                  {label}
                </button>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={resetFilters} disabled={!hasActiveFilters} className="rounded-full">
              <X className="size-4" />
              Reset filters
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Zoek op stad of regio" className="h-11 rounded-xl pl-9 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400" />
            </div>
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="Specialisatie" className="h-11 rounded-xl pl-9 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400" />
            </div>
            <FilterSelect label="Max. prijs per les" value={price} onValueChange={setPrice} options={[{ value: "alles", label: "Alles" }, { value: "55", label: "Tot EUR 55" }, { value: "65", label: "Tot EUR 65" }, { value: "75", label: "Tot EUR 75" }]} />
            <FilterSelect label="Min. beoordeling" value={rating} onValueChange={setRating} options={[{ value: "0", label: "Alles" }, { value: "4", label: "4.0+" }, { value: "4.5", label: "4.5+" }, { value: "4.8", label: "4.8+" }]} />
            <FilterSelect label="Beschikbaarheid" value={availability} onValueChange={setAvailability} options={[{ value: "alles", label: "Alles" }, { value: "avond", label: "Avond" }, { value: "weekend", label: "Weekend" }, { value: "deze-week", label: "Deze week" }]} />
            <FilterSelect label="Transmissie" value={transmission} onValueChange={(value) => setTransmission(value as TransmissieType | "alles")} options={[{ value: "alles", label: "Alles" }, { value: "handgeschakeld", label: "Handgeschakeld" }, { value: "automaat", label: "Automaat" }, { value: "beide", label: "Beide" }]} />
            <FilterSelect label="Sortering" value={sortBy} onValueChange={setSortBy} options={[{ value: "top", label: "Top beoordeeld" }, { value: "prijs-laag", label: "Laagste prijs" }, { value: "ervaring", label: "Meeste ervaring" }, { value: "favorieten", label: "Favorieten eerst" }]} />
          </div>
        </div>
      </div>

      <div className={`grid gap-6 transition-opacity duration-200 lg:grid-cols-2 xl:grid-cols-3 ${isPending ? "opacity-70" : "opacity-100"}`}>
        {filtered.map((instructor, index) => (
          <div key={instructor.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
            <InstructorCard instructor={instructor} packages={packagesByInstructorId[instructor.id] ?? []} detailBasePath={detailBasePath} isFavorite={favoriteInstructorIds.includes(instructor.id)} />
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/78 p-10 text-center shadow-[0_24px_70px_-48px_rgba(15,23,42,0.18)] dark:border-white/12 dark:bg-white/6">
          <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Geen instructeurs gevonden</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground dark:text-slate-300">Je filters zijn waarschijnlijk te specifiek. Reset je selectie of zoek op een grotere regio om meer matches te zien.</p>
          <Button type="button" onClick={resetFilters} className="mt-5 rounded-full px-6">Reset filters</Button>
        </div>
      ) : null}
    </div>
  );
}
