import Link from "next/link";
import { ArrowRight, CheckCircle2, Flame, GaugeCircle, Star } from "lucide-react";

import { InstructorCard } from "@/components/instructors/instructor-card";
import { Reveal } from "@/components/marketing/homepage-motion";
import { MarketingFaqSection } from "@/components/marketing/marketing-faq-section";
import { SeoBreadcrumbs } from "@/components/marketing/seo-breadcrumbs";
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
  getSeoCityIntentFaqItems,
  getSeoCityIntentPath,
  getSeoCityIntentNarrative,
  getSeoCityIntentRouteLabel,
  seoCityIntents,
  type SeoCityIntent,
} from "@/lib/seo-city-intents";
import {
  getSeoCityVariantPath,
  getSeoCityVariantRouteLabel,
  seoCityConfigs,
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

  const faqItems = getSeoCityIntentFaqItems(city, intent);
  const localNarrative = getSeoCityIntentNarrative(city, intent);
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Rijschool", href: "/instructeurs" },
    { label: city.name, href: `/rijschool/${city.slug}` },
    { label: config.label, href: getSeoCityIntentPath(city.slug, intent) },
  ];
  const itemListTitle = `Top instructeurs voor ${config.searchLabel} in ${city.name}`;
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

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: itemListTitle,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: instructors.slice(0, 12).length,
    itemListElement: instructors.slice(0, 12).map((instructor, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Person",
        name: instructor.volledige_naam,
        url: `${siteUrl}/instructeurs/${instructor.slug}`,
      },
    })),
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${config.label} ${city.name}`,
    serviceType: config.label,
    description: config.heroIntro(city),
    url: `${siteUrl}${getSeoCityIntentPath(city.slug, intent)}`,
    areaServed: {
      "@type": "City",
      name: city.name,
    },
    provider: {
      "@type": "Organization",
      name: "RijBasis",
      url: siteUrl,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${config.label} in ${city.name}`,
      numberOfItems: totalPackages,
    },
  };

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `RijBasis ${city.name}`,
    url: `${siteUrl}${getSeoCityIntentPath(city.slug, intent)}`,
    description: config.heroIntro(city),
    areaServed: {
      "@type": "City",
      name: city.name,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: city.name,
      addressRegion: city.provinceLabel,
      addressCountry: "NL",
    },
    knowsAbout: [config.label, city.name, config.searchLabel, "rijles"],
  };

  return (
    <div className="pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />

      <section className="relative overflow-hidden px-4 pt-10 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_14%_14%,rgba(56,189,248,0.13),transparent_25%),radial-gradient(circle_at_88%_20%,rgba(251,146,60,0.1),transparent_26%)]" />
        <div className="site-shell relative mx-auto w-full py-8 lg:py-14">
          <Reveal className="surface-panel rounded-[1.75rem] p-5 sm:p-7">
            <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
              <div className="space-y-6">
                <SeoBreadcrumbs items={breadcrumbItems} />
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
                <div className="surface-card p-4">
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

                <div className="surface-card p-4">
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

                <div className="surface-card p-4">
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
          {localNarrative ? (
            <Card className="border border-white/80 bg-white/90 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader>
                <CardTitle>{localNarrative.title}</CardTitle>
                <CardDescription>
                  Unieke lokale context voor {config.searchLabel} in {city.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                <p>{localNarrative.body}</p>
                <p>{localNarrative.support}</p>
              </CardContent>
            </Card>
          ) : null}

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
                  {getSeoCityVariantRouteLabel(city.name, "general")}
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
        <Reveal className="grid gap-5">
          <Card className="border border-white/80 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
            <CardHeader>
              <CardTitle>Andere routes in {city.name}</CardTitle>
              <CardDescription>
                Sterke interne links tussen intentpagina&apos;s en stadspagina&apos;s helpen Google en bezoekers sneller de juiste route binnen {city.name} te vinden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-300">
                  Andere routes in {city.name}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["general", "automaat", "schakel", "motor", "vrachtwagen"] as const).map(
                    (entry) => (
                      <Link
                        key={entry}
                        href={getSeoCityVariantPath(city.slug, entry)}
                        className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
                      >
                        <span>{getSeoCityVariantRouteLabel(city.name, entry)}</span>
                        <ArrowRight className="size-4" />
                      </Link>
                    )
                  )}
                  {seoCityIntents
                    .filter((entry) => entry !== intent)
                    .map((entry) => {
                      return (
                        <Link
                          key={entry}
                          href={getSeoCityIntentPath(city.slug, entry)}
                          className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
                        >
                          <span>{getSeoCityIntentRouteLabel(city.name, entry)}</span>
                          <ArrowRight className="size-4" />
                        </Link>
                      );
                    })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-300">
                  Andere steden voor {config.searchLabel}
                </p>
                <div className="grid gap-2">
                  {seoCityConfigs
                    .filter((entry) => entry.slug !== city.slug)
                    .slice(0, 6)
                    .map((entry) => (
                      <Link
                        key={`${intent}-${entry.slug}`}
                        href={getSeoCityIntentPath(entry.slug, intent)}
                        className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
                      >
                        <span>{getSeoCityIntentRouteLabel(entry.name, intent)}</span>
                        <ArrowRight className="size-4" />
                      </Link>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      <MarketingFaqSection
        eyebrow={`Veelgestelde vragen ${city.name}`}
        title={`Veelgestelde vragen over ${config.searchLabel} in ${city.name}`}
        description={`Deze lokale intent-FAQ geeft extra context over ${config.searchLabel} in ${city.name}, helpt bezoekers sneller kiezen en versterkt tegelijk de rich-result kansen van deze SEO-pagina.`}
        items={faqItems}
      />
    </div>
  );
}
