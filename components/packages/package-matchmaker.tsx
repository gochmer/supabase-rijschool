"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { getPackageCoverObjectPosition } from "@/lib/package-covers";
import type { Pakket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getPackageVisualConfig } from "@/lib/package-visuals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Goal = "snel" | "zeker" | "maatwerk";
type Experience = "beginner" | "gemiddeld" | "herstarter";
type Budget = "compact" | "gebalanceerd" | "ruim";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesOneOf(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function getRecommendation(
  packages: Pakket[],
  goal: Goal,
  experience: Experience,
  budget: Budget
) {
  const enriched = packages.map((item) => ({
    item,
    search: normalizeText(`${item.naam} ${item.beschrijving}`),
  }));

  const maatwerk =
    enriched.find(
      ({ item, search }) =>
        matchesOneOf(search, ["maatwerk", "persoonlijk", "custom"]) ||
        item.prijs === 0
    )?.item ?? packages[0];
  const examenpakket =
    enriched.find(
      ({ item, search }) =>
        matchesOneOf(search, ["examen", "intensief", "spoed"]) ||
        item.lessen >= 20
    )?.item ?? packages[0];
  const starterspakket =
    enriched.find(
      ({ item, search }) =>
        matchesOneOf(search, ["starter", "basis", "beginner"]) ||
        (item.lessen >= 8 && item.lessen < 20)
    )?.item ?? packages[0];
  const losseLes =
    enriched.find(
      ({ item, search }) =>
        matchesOneOf(search, ["losse", "intake", "opfris"]) ||
        item.lessen <= 1
    )?.item ?? packages[0];

  if (goal === "maatwerk" || experience === "herstarter") {
    return maatwerk;
  }

  if (goal === "snel" || budget === "ruim") {
    return examenpakket;
  }

  if (budget === "compact") {
    return losseLes;
  }

  return starterspakket;
}

export function PackageMatchmaker({ packages }: { packages: Pakket[] }) {
  const [goal, setGoal] = useState<Goal>("zeker");
  const [experience, setExperience] = useState<Experience>("beginner");
  const [budget, setBudget] = useState<Budget>("gebalanceerd");

  const recommendation = useMemo(
    () => getRecommendation(packages, goal, experience, budget),
    [budget, experience, goal, packages]
  );

  if (!recommendation) {
    return null;
  }

  const recommendationVisual = getPackageVisualConfig(
    recommendation.icon_key,
    recommendation.visual_theme
  );
  const recommendationCoverObjectPosition = getPackageCoverObjectPosition(
    recommendation.cover_position,
    recommendation.cover_focus_x,
    recommendation.cover_focus_y
  );
  const selectionSummary = [
    goal === "snel"
      ? "Je wilt sneller doorpakken"
      : goal === "maatwerk"
        ? "Je zoekt een flexibeler traject"
        : "Je wilt rustig en zeker opbouwen",
    experience === "herstarter"
      ? "Je pakt het rijden opnieuw op"
      : experience === "gemiddeld"
        ? "Je hebt al wat ervaring"
        : "Je start vanaf de basis",
    budget === "ruim"
      ? "Je zoekt meer inbegrepen"
      : budget === "compact"
        ? "Je wilt compact beginnen"
        : "Je zoekt een gebalanceerde middenweg",
  ];

  return (
    <div className="rounded-[1.7rem] border border-white/70 bg-white/88 p-4 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.2)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_24px_70px_-46px_rgba(15,23,42,0.68)] sm:p-5">
      <div className="grid gap-5 xl:grid-cols-[0.84fr_1.16fr] xl:items-start">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] text-sky-700 uppercase dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100">
            <Sparkles className="size-3" />
            Slimme pakketkiezer
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2rem]">
            Twijfel je tussen pakketten?
          </h2>
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
            Kies hieronder wat het beste bij je past en krijg direct een voorstel
            dat logisch aansluit op je tempo, budget en rijdoel.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectionSummary.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.12)] transition-colors dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:shadow-[0_14px_30px_-24px_rgba(15,23,42,0.34)]"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50/90 p-3 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_44px_-34px_rgba(15,23,42,0.34)]">
            <p className="text-[9px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
              Waarom dit werkt
            </p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
              In plaats van alle pakketten tegelijk te moeten wegen, krijg je eerst een rustige
              richting. Daarna kun je nog steeds zelf vergelijken vanuit een veel duidelijker
              uitgangspunt.
            </p>
          </div>
        </div>

        <div className="grid gap-3.5">
          {[
            {
              label: "Doel",
              value: goal,
              setValue: setGoal,
              options: [
                { value: "snel", label: "Snel vooruit" },
                { value: "zeker", label: "Rustig opbouwen" },
                { value: "maatwerk", label: "Persoonlijk traject" },
              ],
            },
            {
              label: "Ervaring",
              value: experience,
              setValue: setExperience,
              options: [
                { value: "beginner", label: "Starter" },
                { value: "gemiddeld", label: "Al wat ervaring" },
                { value: "herstarter", label: "Opnieuw beginnen" },
              ],
            },
            {
              label: "Budget",
              value: budget,
              setValue: setBudget,
              options: [
                { value: "compact", label: "Compact" },
                { value: "gebalanceerd", label: "Gebalanceerd" },
                { value: "ruim", label: "Meer inbegrepen" },
              ],
            },
          ].map((group) => (
            <div
              key={group.label}
              className="space-y-2 rounded-[1.15rem] border border-slate-200 bg-slate-50/90 p-3 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.08)] transition-shadow duration-300 dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_44px_-34px_rgba(15,23,42,0.32)]"
            >
              <p className="text-[13px] font-semibold text-slate-950 dark:text-white">{group.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      group.setValue(option.value as Goal & Experience & Budget)
                    }
                    aria-pressed={group.value === option.value}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all duration-300 hover:-translate-y-0.5",
                      group.value === option.value
                        ? "border-sky-200 bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] text-white shadow-[0_18px_40px_-26px_rgba(37,99,235,0.38)] dark:border-sky-300/30"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/16 dark:hover:text-white"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="group overflow-hidden rounded-[1.35rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] shadow-[0_26px_70px_-42px_rgba(15,23,42,0.18)] transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1 hover:border-slate-200 hover:shadow-[0_36px_90px_-46px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88),rgba(15,23,42,0.92))] dark:hover:border-white/16 dark:hover:shadow-[0_36px_90px_-46px_rgba(15,23,42,0.5)]">
            {recommendation.cover_url ? (
              <div className="relative h-32">
                <Image
                  src={recommendation.cover_url}
                  alt={`Cover voor ${recommendation.naam}`}
                  fill
                  sizes="(max-width: 1280px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  style={{ objectPosition: recommendationCoverObjectPosition }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.34),rgba(15,23,42,0.72))]" />
              </div>
            ) : (
              <div className="h-3 bg-[linear-gradient(90deg,#0f172a,#1d4ed8,#38bdf8)]" />
            )}

            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-[1rem]",
                      recommendationVisual.softIconClass
                    )}
                  >
                    <recommendationVisual.Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                      Aanbevolen pakket
                    </p>
                    <h3 className="mt-1.5 text-lg font-semibold text-slate-950 dark:text-white">
                      {recommendation.naam}
                    </h3>
                    <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                      {recommendation.beschrijving}
                    </p>
                    {recommendation.praktijk_examen_prijs !== null &&
                    recommendation.praktijk_examen_prijs !== undefined ? (
                      <p className="mt-2 text-[12px] font-medium text-slate-700 dark:text-slate-200">
                        Praktijk-examen {formatCurrency(recommendation.praktijk_examen_prijs)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Badge
                  className={cn(
                    recommendationVisual.softBadgeClass,
                    "rounded-full px-2.5 py-0.5 text-[9px] font-semibold tracking-[0.14em] uppercase shadow-[0_16px_30px_-24px_rgba(15,23,42,0.24)]"
                  )}
                >
                  Match
                </Badge>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-3 transition-colors dark:border-white/10 dark:bg-white/6">
                  <p className="text-[9px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                    Inhoud
                  </p>
                  <p className="mt-1.5 text-[15px] font-semibold text-slate-950 dark:text-white">
                    {recommendation.lessen
                      ? `${recommendation.lessen} lessen`
                      : "Flexibel traject"}
                  </p>
                </div>
                <div className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-3 transition-colors dark:border-white/10 dark:bg-white/6">
                  <p className="text-[9px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                    Investering
                  </p>
                  <p className="mt-1.5 text-[15px] font-semibold text-slate-950 dark:text-white">
                    {recommendation.prijs === 0
                      ? "Op aanvraag"
                      : `Vanaf ${formatCurrency(recommendation.prijs)}`}
                  </p>
                </div>
              </div>

              <div className="grid gap-1.5">
                {[
                  "Sterke aansluiting op je gekozen tempo en doel",
                  "Past logisch binnen de rest van je account en planning",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 rounded-[0.95rem] border border-slate-200 bg-white px-3 py-2.5 text-[12px] leading-5 text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500 dark:text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Button className="h-9 w-full rounded-full bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] text-[13px] text-white shadow-[0_18px_45px_-24px_rgba(37,99,235,0.34)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_56px_-24px_rgba(37,99,235,0.42)]">
                Kies dit pakket
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
