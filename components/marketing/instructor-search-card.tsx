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
    apply: (state: SearchState): SearchState => ({
      ...state,
      transmission: "automaat",
    }),
    active: (state: SearchState) => state.transmission === "automaat",
    clear: (state: SearchState): SearchState => ({
      ...state,
      transmission: "alles",
    }),
  },
  {
    icon: CarFront,
    label: "Handgeschakeld",
    apply: (state: SearchState): SearchState => ({
      ...state,
      transmission: "handgeschakeld",
    }),
    active: (state: SearchState) => state.transmission === "handgeschakeld",
    clear: (state: SearchState): SearchState => ({
      ...state,
      transmission: "alles",
    }),
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
    case "alles":
      return "Alle prijzen";
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

// rest unchanged except options

// inside options:
// replace { value: "100", label: "Alles" } with { value: "alles", label: "Alles" }
