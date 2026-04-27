import Link from "next/link";
import { ArrowRight, CheckCircle2, Flame, GaugeCircle, Star } from "lucide-react";

import { InstructorCard } from "@/components/instructors/instructor-card";
import { Reveal } from "@/components/marketing/homepage-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getSeoCityIntentConfig,
  getSeoCityIntentPath,
  seoCityIntents,
  type SeoCityIntent,
} from "@/lib/seo-city-intents";
import {
  getSeoCityVariantLabel,
  getSeoCityVariantPath,
  type SeoCityConfig,
} from "@/lib/seo-cities";
import type { InstructeurProfiel, Pakket } from "@/lib/types";

type CityIntentLandingPageProps = {
  city: SeoCityConfig;
  intent: SeoCityIntent;
  instructors: InstructeurProfiel[];
  packagesByInstructorId: Record<string, Pakket[]>;
  fallbackUsed?: boolean;
  exactMatchCount?: number;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function CityIntentLandingPage({
  city,
  intent,
  instructors,
  packagesByInstructorId,
  fallbackUsed = false,
  exactMatchCount = 0,
}: CityIntentLandingPageProps) {
  const config = getSeoCityIntentConfig(intent);

  if (!config) {
    return null;
  }

  const totalPackages = Object.values(packagesByInstructorId).reduce(
    (total, packages) => total + packages.length,
    0
  );
  const averageReviewScore = instructors.length
    ? (
        instructors.reduce((total, instructor) => total + instructor.beoordeling, 0) /
        instructors.length
      ).toFixed(1)
    : null;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: config.faqQuestion(city),
        acceptedAnswer: {
          "@type": "Answer",
          text: config.faqAnswer(city),
        },
      },
    ],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: config.label,
        item: `${siteUrl}/instructeurs`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${config.label} ${city.name}`,
        item: `${siteUrl}${getSeoCityIntentPath(city.slug, intent)}`,
      },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: instructors.slice(0, 12).map((instructor, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/instructeurs/${instructor.slug}`,
      name: instructor.volledige_naam,
    })),
  };

  return (
    <div className="pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_14%_14%,rgba(56,189,248,0.18),transparent_22%),radial-gradient(circle_at_88%_20%,rgba(251,146,60,0.18),transparent_22%),radial-gradient(circle_at_50%_65%,rgba(30,64,175,0.12),transparent_25%)]" />
        <div className="site-shell relative mx-auto w-full py-10 lg:py-16">
          <Reveal className="rounded-[2.5rem] border border-white/80 bg-white/92 p-6 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.22)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86),rgba(15,23,42,0.94))] dark:shadow-[0_28px_90px_-48px_rgba(15,23,42,0.62)] sm:p-8">
            <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border border-sky-100 bg-sky-50 text-sky-700">
                    {config.label} {city.name}
                  </Badge>
                  <Badge className="border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
                    {city.provinceLabel}
                  </Badge>
                  <Badge className="border border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-300/20 dark:bg-orange-400/10 dark:text-orange-100">
                    Zoekintentie: {config.searchLabel}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                    SEO intentpagina
                  </p>
                  <h1 className="mt-4 max-w-[15ch] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[3.1rem]">
                    {config.heroTitle(city)}
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                    {config.heroIntro(city)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {config.badges.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:shadow-[0_16px_34px_-28px_rgba(15,23,42,0.36)]"
                    >
                      <CheckCircle2 className="size-4 text-emerald-500 dark:text-emerald-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-4 shadow-[0_20px_46px_-36px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_46px_-36px_rgba(15,23,42,0.42)]">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                    <Flame className="size-4" />
                    <p className="text-[10px] font-semibold tracking-[0.18em] uppercase">
                      Directe matches
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                    {exactMatchCount}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {fallbackUsed
                      ? "Nog weinig expliciete matches, daarom tonen we ook breder lokaal aanbod."
                      : "Profielen met duidelijke signalen voor deze zoekintentie."}
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-4 shadow-[0_20px_46px_-36px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_46px_-36px_rgba(15,23,42,0.42)]">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                    <GaugeCircle className="size-4" />
                    <p className="text-[10px] font-semibold tracking-[0.18em] uppercase">
                      Pakketten
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                    {totalPackages}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Relevante rijlespakketten in {city.name} om direct te vergelijken.
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-4 shadow-[0_20px_46px_-36px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_46px_-36px_rgba(15,23,42,0.42)]">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                    <Star className="size-4" />
                    <p className="text-[10px] font-semibold tracking-[0.18em] uppercase">
                      Gem. score
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                    {averageReviewScore ? `${averageReviewScore}/5` : "Nog leeg"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Reviewscore op basis van zichtbare beoordelingen.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="site-shell mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
        <Reveal className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                {config.label} in {city.name}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Vergelijk lokale instructeurs voor {config.searchLabel}, reviews en pakketten.
              </h2>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                Deze pagina is gebouwd rondom een concrete zoekintentie. Daardoor sluit hij sterker aan op bezoekers die niet meer breed orienteren, maar al echt willen doorklikken.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-full">
                <Link href={getSeoCityVariantPath(city.slug, "general")}>
                  {getSeoCityVariantLabel(city.name, "general")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/instructeurs">
                  Bekijk alle instructeurs
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {fallbackUsed ? (
            <Card className="border border-dashed border-slate-200 bg-white/80 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_70px_-42px_rgba(15,23,42,0.42)]">
              <CardContent className="p-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {config.emptyState(city)}
              </CardContent>
            </Card>
          ) : null}

          {instructors.length ? (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {instructors.map((instructor) => (
                <InstructorCard
                  key={instructor.id}
                  instructor={instructor}
                  packages={packagesByInstructorId[instructor.id] ?? []}
                />
              ))}
            </div>
          ) : (
            <Card className="border border-dashed border-slate-200 bg-white/80 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_70px_-42px_rgba(15,23,42,0.42)]">
              <CardContent className="p-8 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {config.emptyState(city)}
              </CardContent>
            </Card>
          )}
        </Reveal>
      </section>

      <section className="site-shell mx-auto w-full px-4 pt-4 sm:px-6 lg:px-8">
        <Reveal className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border border-white/80 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
            <CardHeader>
              <CardTitle>{config.faqQuestion(city)}</CardTitle>
              <CardDescription>
                Zoekopdrachten zoals &quot;{config.searchLabel} {city.name}&quot; zijn vaak warmer dan brede zoektermen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>{config.faqAnswer(city)}</p>
              <p>
                Door hier lokale profielen, reviews en pakketten te combineren, krijgt deze intentpagina meer SEO-diepte en een veel logischere doorklik voor echte bezoekers.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-white/80 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
            <CardHeader>
              <CardTitle>Meer SEO-routes rondom {city.name}</CardTitle>
              <CardDescription>
                Interne links tussen stadspagina&apos;s en intentpagina&apos;s versterken topical authority.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-300">
                  Andere intenten in {city.name}
                </p>
                <div className="grid gap-2">
                  {seoCityIntents
                    .filter((entry) => entry !== intent)
                    .map((entry) => {
                      const entryConfig = getSeoCityIntentConfig(entry);

                      if (!entryConfig) {
                        return null;
                      }

                      return (
                        <Link
                          key={entry}
                          href={getSeoCityIntentPath(city.slug, entry)}
                          className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
                        >
                          <span>
                            {entryConfig.label} {city.name}
                          </span>
                          <ArrowRight className="size-4" />
                        </Link>
                      );
                    })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-300">
                  Klassieke lokale routes
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["general", "automaat", "schakel", "motor", "vrachtwagen"] as const).map(
                    (entry) => (
                      <Link
                        key={entry}
                        href={getSeoCityVariantPath(city.slug, entry)}
                        className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
                      >
                        <span>{getSeoCityVariantLabel(city.name, entry)}</span>
                        <ArrowRight className="size-4" />
                      </Link>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
