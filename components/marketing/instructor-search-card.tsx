"use client";

import { useState } from "react";
import {
  CarFront,
  Check,
  Clock3,
  Euro,
  Search,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SearchState = {
  city: string;
  transmission: string;
  price: string;
  rating: string;
  availability: string;
};

const initialState: SearchState = {
  city: "",
  transmission: "alles",
  price: "65",
  rating: "4.8",
  availability: "alles",
};

const quickFilters = [
  {
    icon: CarFront,
    label: "Automaat",
    apply: (state: SearchState): SearchState => ({ ...state, transmission: "automaat" }),
    active: (state: SearchState) => state.transmission === "automaat",
    clear: (state: SearchState): SearchState => ({ ...state, transmission: "alles" }),
  },
  {
    icon: CarFront,
    label: "Handgeschakeld",
    apply: (state: SearchState): SearchState => ({ ...state, transmission: "handgeschakeld" }),
    active: (state: SearchState) => state.transmission === "handgeschakeld",
    clear: (state: SearchState): SearchState => ({ ...state, transmission: "alles" }),
  },
];

function transmissionLabel(value: string) {
  switch (value) {
    case "automaat":
      return "Automaat";
    case "handgeschakeld":
      return "Handgeschakeld";
    case "beide":
      return "Automaat of handgeschakeld";
    default:
      return "Alle lesauto's";
  }
}

function priceLabel(value: string) {
  switch (value) {
    case "55":
      return "Tot EUR 55";
    case "65":
      return "Tot EUR 65";
    case "75":
      return "Tot EUR 75";
    default:
      return "Alle prijzen";
  }
}

function availabilityLabel(value: string) {
  switch (value) {
    case "deze-week":
      return "Deze week";
    case "avond":
      return "Avond";
    case "weekend":
      return "Weekend";
    default:
      return "Flexibel";
  }
}

type SearchCardSelectProps = {
  name: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  icon: typeof CarFront;
  options: Array<{ value: string; label: string }>;
};

function SearchCardSelect({ name, label, value, onValueChange, icon: Icon, options }: SearchCardSelectProps) {
  return (
    <label className="surface-card px-4 py-3 transition-colors focus-within:border-sky-300 focus-within:bg-sky-50/40 dark:focus-within:border-sky-300/40 dark:focus-within:bg-white/8">
      <input type="hidden" name={name} value={value} />
      <div className="flex min-h-[3.6rem] items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-sky-200">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">{label}</p>
          <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="mt-0.5 h-7 w-full border-0 bg-transparent px-0 py-0 text-[14px] font-semibold text-slate-950 shadow-none ring-0 focus-visible:border-0 focus-visible:ring-0 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start" className="overflow-hidden rounded-[1rem] border border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-1 shadow-[0_22px_60px_-30px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] dark:shadow-[0_22px_60px_-30px_rgba(15,23,42,0.52)]">
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value} className="min-h-9 rounded-[0.8rem] px-3 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-200 focus:bg-[linear-gradient(135deg,#1d4ed8,#38bdf8)] focus:text-white">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </label>
  );
}

export function InstructorSearchCard() {
  const [filters, setFilters] = useState<SearchState>(initialState);
  const activeQuickFilters = quickFilters.filter((item) => item.active(filters));
  const hasActiveFilters = activeQuickFilters.length > 0;

  const selectionSummary = [
    filters.city.trim() || "Heel Nederland",
    transmissionLabel(filters.transmission),
    priceLabel(filters.price),
    filters.rating === "0" ? "Alle beoordelingen" : `${filters.rating}+ score`,
    availabilityLabel(filters.availability),
  ];

  return (
    <div className="surface-panel rounded-[1.55rem] p-2.5">
      <form action="/instructeurs" method="get" className="rounded-[1.25rem] border border-slate-200/80 bg-white/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-3.5 dark:border-white/10 dark:bg-white/5 dark:shadow-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.24em] text-primary uppercase">Zoek jouw rijschool</p>
            <p className="mt-1 max-w-[18ch] text-[1rem] leading-[1.25] font-semibold text-slate-950 sm:max-w-none sm:text-[1.15rem] dark:text-white">Vind een instructeur die past bij jouw regio, budget en planning.</p>
            <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-300">Start met locatie en verfijn daarna rustig je voorkeuren.</p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[1rem] bg-primary/10 text-primary shadow-[0_14px_28px_-20px_rgba(37,99,235,0.18)] dark:bg-white/10 dark:text-sky-200 dark:shadow-[0_14px_28px_-20px_rgba(15,23,42,0.42)]"><Search className="size-4" /></div>
        </div>

        <label className="surface-card mt-3 block px-4 py-3 transition-colors focus-within:border-sky-300 focus-within:bg-sky-50/40 dark:focus-within:border-sky-300/40 dark:focus-within:bg-white/8">
          <div className="flex min-h-[3.2rem] items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-sky-200"><Search className="size-4" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">Locatie of regio</p>
              <input type="text" name="city" value={filters.city} onChange={(e) => setFilters((current) => ({ ...current, city: e.target.value }))} placeholder="Bijvoorbeeld Rotterdam, Den Haag of Dordrecht" className="mt-0.5 w-full bg-transparent text-[14px] font-semibold text-slate-950 placeholder:font-medium placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500" />
            </div>
          </div>
        </label>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <SearchCardSelect name="transmission" label="Type lesauto" icon={CarFront} value={filters.transmission} onValueChange={(value) => setFilters((current) => ({ ...current, transmission: value }))} options={[{ value: "alles", label: "Alles" }, { value: "automaat", label: "Automaat" }, { value: "handgeschakeld", label: "Handgeschakeld" }, { value: "beide", label: "Beide" }]} />
          <SearchCardSelect name="price" label="Max prijs per les" icon={Euro} value={filters.price} onValueChange={(value) => setFilters((current) => ({ ...current, price: value }))} options={[{ value: "55", label: "Tot EUR 55" }, { value: "65", label: "Tot EUR 65" }, { value: "75", label: "Tot EUR 75" }, { value: "alles", label: "Alles" }]} />
          <SearchCardSelect name="rating" label="Beoordeling" icon={Star} value={filters.rating} onValueChange={(value) => setFilters((current) => ({ ...current, rating: value }))} options={[{ value: "0", label: "Alles" }, { value: "4", label: "4.0+" }, { value: "4.5", label: "4.5+" }, { value: "4.8", label: "4.8+" }]} />
          <SearchCardSelect name="availability" label="Beschikbaarheid" icon={Clock3} value={filters.availability} onValueChange={(value) => setFilters((current) => ({ ...current, availability: value }))} options={[{ value: "alles", label: "Alles" }, { value: "deze-week", label: "Deze week" }, { value: "avond", label: "Avond" }, { value: "weekend", label: "Weekend" }]} />
        </div>

        <div className="mt-3 flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">Snelle filters</p>
          {hasActiveFilters ? <button type="button" onClick={() => setFilters((current) => ({ ...current, transmission: "alles" }))} className="text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">Wissen</button> : null}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
          {quickFilters.map((item) => {
            const active = item.active(filters);
            return (
              <button key={item.label} type="button" onClick={() => setFilters((current) => active ? item.clear(current) : item.apply(current))} aria-pressed={active} className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-200 sm:text-[12px] ${active ? "scale-[1.02] border-sky-200 bg-sky-50 text-sky-900 shadow-[0_18px_34px_-20px_rgba(14,165,233,0.18)] dark:border-sky-300/24 dark:bg-sky-400/12 dark:text-sky-100" : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:bg-white/8"}`}>
                <span className={`flex size-5 items-center justify-center rounded-full ${active ? "bg-sky-100 dark:bg-sky-300/18" : "bg-slate-100 dark:bg-white/10"}`}>{active ? <Check className="size-3.5" /> : <item.icon className="size-3.5 text-current" />}</span>
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="surface-muted mt-3 px-4 py-3">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">Jouw selectie</p>
          <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
            {selectionSummary.map((item) => <span key={item} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 sm:text-[11px]">{item}</span>)}
            {hasActiveFilters ? activeQuickFilters.map((item) => <span key={item.label} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-800 dark:border-emerald-300/24 dark:bg-emerald-400/12 dark:text-emerald-100 sm:text-[11px]">{item.label}</span>) : null}
          </div>
        </div>

        <input type="hidden" name="sort" value="top" />
        <div className="surface-muted mt-3 p-2">
          <div className="flex flex-col gap-2 md:flex-row">
            <Button type="submit" className="h-11 flex-1 rounded-full bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] text-white shadow-[0_22px_45px_-26px_rgba(37,99,235,0.38)] sm:h-10.5">Zoek instructeurs<Search className="size-4" /></Button>
            <Button type="button" variant="outline" onClick={() => setFilters(initialState)} className="h-11 w-full rounded-full px-5 sm:h-10.5 sm:w-auto">Filters wissen</Button>
          </div>
          <p className="mt-2 px-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[12px]">Je filters gaan mee naar de resultatenpagina, zodat je daar meteen gericht kunt vergelijken.</p>
        </div>
      </form>
    </div>
  );
}
