"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Compass,
  GraduationCap,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Reveal } from "@/components/marketing/homepage-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CoachCity = {
  slug: string;
  name: string;
};

type CoachTransmission = "alles" | "automaat" | "schakel";
type CoachGoal =
  | "vergelijk"
  | "pakket"
  | "proefles"
  | "spoed"
  | "faalangst"
  | "praktijkexamen";
type CoachPace = "rustig" | "doelgericht" | "eerst-vertrouwen";

type RouteCoachRecommendation = {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  eyebrow: string;
  title: string;
  summary: string;
  reasons: string[];
};

function transmissionLabel(value: CoachTransmission) {
  switch (value) {
    case "automaat":
      return "Automaat";
    case "schakel":
      return "Schakel";
    default:
      return "Alle lesauto's";
  }
}

function goalLabel(value: CoachGoal) {
  switch (value) {
    case "pakket":
      return "Pakket kiezen";
    case "proefles":
      return "Proefles plannen";
    case "spoed":
      return "Spoedcursus";
    case "faalangst":
      return "Faalangst route";
    case "praktijkexamen":
      return "Praktijkexamen focus";
    default:
      return "Instructeurs vergelijken";
  }
}

function paceLabel(value: CoachPace) {
  switch (value) {
    case "doelgericht":
      return "Doelgericht";
    case "eerst-vertrouwen":
      return "Eerst vertrouwen";
    default:
      return "Rustig opbouwen";
  }
}

function getPrimaryRoute({
  city,
  transmission,
  goal,
}: {
  city: CoachCity;
  transmission: CoachTransmission;
  goal: CoachGoal;
}) {
  if (goal === "spoed") {
    return {
      href: `/spoedcursus/${city.slug}`,
      label: `Spoedcursus ${city.name}`,
    };
  }

  if (goal === "faalangst") {
    return {
      href: `/faalangst/${city.slug}`,
      label: `Faalangst rijles ${city.name}`,
    };
  }

  if (goal === "praktijkexamen") {
    return {
      href: `/praktijkexamen/${city.slug}`,
      label: `Praktijkexamen ${city.name}`,
    };
  }

  if (goal === "proefles") {
    return {
      href: `/proefles/${city.slug}`,
      label: `Proefles ${city.name}`,
    };
  }

  if (goal === "pakket") {
    return {
      href: "/pakketten",
      label: "Bekijk rijlespakketten",
    };
  }

  if (transmission === "automaat") {
    return {
      href: `/automaat/${city.slug}`,
      label: `Automaat rijles ${city.name}`,
    };
  }

  if (transmission === "schakel") {
    return {
      href: `/schakel/${city.slug}`,
      label: `Schakel rijles ${city.name}`,
    };
  }

  return {
    href: `/rijschool/${city.slug}`,
    label: `Rijschool ${city.name}`,
  };
}

function getSecondaryRoute({
  city,
  transmission,
  goal,
  pace,
}: {
  city: CoachCity;
  transmission: CoachTransmission;
  goal: CoachGoal;
  pace: CoachPace;
}) {
  const query = new URLSearchParams();
  query.set("city", city.name);

  if (transmission !== "alles") {
    query.set("transmission", transmission);
  }

  query.set("sort", pace === "doelgericht" ? "price" : "top");

  if (goal === "pakket") {
    return {
      href: `/instructeurs?${query.toString()}`,
      label: `Bekijk instructeurs in ${city.name}`,
    };
  }

  if (goal === "vergelijk") {
    return {
      href: `/instructeurs?${query.toString()}`,
      label: `Vergelijk instructeurs in ${city.name}`,
    };
  }

  return {
    href: `/instructeurs?${query.toString()}`,
    label: `Open instructeurs in ${city.name}`,
  };
}

function getRouteCoachRecommendation({
  city,
  transmission,
  goal,
  pace,
}: {
  city: CoachCity;
  transmission: CoachTransmission;
  goal: CoachGoal;
  pace: CoachPace;
}): RouteCoachRecommendation {
  const primary = getPrimaryRoute({ city, transmission, goal });
  const secondary = getSecondaryRoute({ city, transmission, goal, pace });
  const cityName = city.name;

  const summary =
    goal === "pakket"
      ? `Je wilt eerst helder krijgen welk traject past, en daarna pas de instructeur kiezen in ${cityName}.`
      : goal === "spoed"
        ? `Je wilt tempo maken in ${cityName}, dus een route met focus op snelheid en beschikbaarheid is hier logisch.`
        : goal === "faalangst"
          ? `Je zoekt meer rust en vertrouwen, dus een zachtere instaproute voor ${cityName} past hier beter dan direct filteren op alles tegelijk.`
          : goal === "praktijkexamen"
            ? `Je zoekt vooral examengerichte houvast in ${cityName}, dus de route moet meteen richting vertrouwen, voorbereiding en ritme sturen.`
            : goal === "proefles"
              ? `Je wilt eerst voelen of een lesstijl past, dus een proeflesroute voor ${cityName} geeft de meeste rust.`
              : `Je bent nog in de vergelijkfase, dus we sturen je eerst naar de slimste ingang voor ${cityName} en daarna naar concrete instructeurs.`;

  return {
    primaryHref: primary.href,
    primaryLabel: primary.label,
    secondaryHref: secondary.href,
    secondaryLabel: secondary.label,
    eyebrow: "Jouw slimste start",
    title:
      goal === "pakket"
        ? "Begin bij trajectkeuze, niet bij twijfel."
        : goal === "spoed"
          ? "Pak de snelle route zonder overzicht te verliezen."
          : goal === "faalangst"
            ? "Kies eerst rust, daarna pas vergelijking."
            : goal === "praktijkexamen"
              ? "Stuur direct op examengerichte zekerheid."
              : goal === "proefles"
                ? "Voel eerst of de instructeur bij je past."
                : "Open eerst de juiste ingang voor jouw situatie.",
    summary,
    reasons: [
      `${transmissionLabel(transmission)} in ${cityName}`,
      `${goalLabel(goal)} als hoofdrichting`,
      `${paceLabel(pace)} als leertempo`,
    ],
  };
}

export function RouteCoach({
  cities,
  className,
}: {
  cities: CoachCity[];
  className?: string;
}) {
  const [citySlug, setCitySlug] = useState(cities[0]?.slug ?? "amsterdam");
  const [transmission, setTransmission] =
    useState<CoachTransmission>("alles");
  const [goal, setGoal] = useState<CoachGoal>("vergelijk");
  const [pace, setPace] = useState<CoachPace>("rustig");

  const selectedCity =
    cities.find((city) => city.slug === citySlug) ?? cities[0] ?? null;

  const recommendation = useMemo(() => {
    if (!selectedCity) {
      return null;
    }

    return getRouteCoachRecommendation({
      city: selectedCity,
      transmission,
      goal,
      pace,
    });
  }, [goal, pace, selectedCity, transmission]);

  if (!selectedCity || !recommendation) {
    return null;
  }

  return (
    <Reveal className={className}>
      <section className="surface-panel overflow-hidden rounded-[1.75rem]">
        <div className="grid gap-0 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="border-b border-slate-200/80 p-6 dark:border-white/10 sm:p-7 xl:border-b-0 xl:border-r">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/90 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-sky-700 uppercase dark:border-sky-300/16 dark:bg-sky-400/10 dark:text-sky-100">
              <Compass className="size-3.5" />
              Rijles Routecoach
            </div>
            <h2 className="mt-4 max-w-[18ch] text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2.35rem]">
              Kies de route die nu het beste past.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
              Beantwoord een paar keuzes en ga direct naar de meest logische
              start voor jouw situatie.
            </p>

            <div className="mt-6 grid gap-3">
              {[
                {
                  label: "Stad",
                  icon: MapPinned,
                  value: citySlug,
                  options: cities.map((city) => ({
                    value: city.slug,
                    label: city.name,
                  })),
                  onChange: setCitySlug,
                },
                {
                  label: "Type lesauto",
                  icon: GraduationCap,
                  value: transmission,
                  options: [
                    { value: "alles", label: "Maakt niet uit" },
                    { value: "automaat", label: "Automaat" },
                    { value: "schakel", label: "Schakel" },
                  ],
                  onChange: (value: string) =>
                    setTransmission(value as CoachTransmission),
                },
                {
                  label: "Wat wil je nu het liefst?",
                  icon: Sparkles,
                  value: goal,
                  options: [
                    { value: "vergelijk", label: "Instructeurs vergelijken" },
                    { value: "pakket", label: "Eerst pakket kiezen" },
                    { value: "proefles", label: "Eerst proefles plannen" },
                    { value: "spoed", label: "Snel mijn rijbewijs halen" },
                    { value: "faalangst", label: "Rustiger starten" },
                    {
                      value: "praktijkexamen",
                      label: "Praktijkexamen voorbereiden",
                    },
                  ],
                  onChange: (value: string) => setGoal(value as CoachGoal),
                },
                {
                  label: "Hoe wil je leren?",
                  icon: ShieldCheck,
                  value: pace,
                  options: [
                    { value: "rustig", label: "Rustig opbouwen" },
                    { value: "doelgericht", label: "Doelgericht tempo" },
                    { value: "eerst-vertrouwen", label: "Eerst vertrouwen" },
                  ],
                  onChange: (value: string) => setPace(value as CoachPace),
                },
              ].map((group) => (
                <div
                  key={group.label}
                  className="surface-card p-3"
                >
                  <div className="mb-2 flex items-center gap-2 text-slate-500 dark:text-slate-300">
                    <group.icon className="size-4" />
                    <p className="text-[10px] font-semibold tracking-[0.18em] uppercase">
                      {group.label}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => {
                      const active = group.value === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => group.onChange(option.value)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all",
                            active
                              ? "border-sky-200 bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] text-white shadow-[0_20px_42px_-24px_rgba(37,99,235,0.34)] dark:border-sky-300/30"
                              : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/16"
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-7">
            <div className="rounded-[1.45rem] border border-slate-200 bg-[linear-gradient(140deg,#0f172a,#1d4ed8,#38bdf8)] p-5 text-white shadow-[0_24px_64px_-38px_rgba(37,99,235,0.32)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.22em] text-white/66 uppercase">
                    {recommendation.eyebrow}
                  </p>
                  <h3 className="mt-2 max-w-[16ch] text-2xl font-semibold tracking-tight">
                    {recommendation.title}
                  </h3>
                </div>
                <Badge className="border-white/18 bg-white/10 text-white">
                  {selectedCity.name}
                </Badge>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78">
                {recommendation.summary}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {recommendation.reasons.map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/88"
                  >
                    {reason}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.25rem] border border-white/12 bg-white/10 p-4">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-white/60 uppercase">
                    Beste eerste stap
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {recommendation.primaryLabel}
                  </p>
                  <p className="mt-2 text-[13px] leading-6 text-white/74">
                    Deze route past het beste bij hoe iemand nu denkt en zoekt.
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="mt-4 h-10 w-full rounded-full bg-white text-slate-950 hover:bg-white/92"
                  >
                    <Link href={recommendation.primaryHref}>
                      Open deze route
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>

                <div className="rounded-[1.25rem] border border-white/12 bg-white/10 p-4">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-white/60 uppercase">
                    Daarna slim door
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {recommendation.secondaryLabel}
                  </p>
                  <p className="mt-2 text-[13px] leading-6 text-white/74">
                    Zodra de richting helder is, kun je hier meteen verder
                    vergelijken of aanvragen.
                  </p>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="mt-4 h-10 w-full rounded-full border-white/14 bg-white/10 text-white hover:bg-white/14 hover:text-white"
                  >
                    <Link href={recommendation.secondaryHref}>
                      Ga verder
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
