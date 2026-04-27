import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, MapPin, Star } from "lucide-react";

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
import type { InstructeurProfiel, Pakket } from "@/lib/types";
import {
  getSeoCityIntentPath,
  getSeoCityIntentRouteLabel,
  seoCityIntents,
} from "@/lib/seo-city-intents";
import {
  getSeoCityVariantCollectionLabel,
  getSeoCityVariantContent,
  getSeoCityVariantFaqItems,
  getSeoCityVariantLabel,
  getSeoCityVariantNarrative,
  getSeoCityVariantPath,
  getSeoCityVariantRouteLabel,
  seoCityConfigs,
  seoCityVariants,
  type SeoCityConfig,
  type SeoCityVariant,
} from "@/lib/seo-cities";

type CityLandingPageProps = {
  city: SeoCityConfig;
  variant?: SeoCityVariant;
  instructors: InstructeurProfiel[];
  packagesByInstructorId: Record<string, Pakket[]>;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function CityLandingPage({
  city,
  variant = "general",
  instructors,
  packagesByInstructorId,
}: CityLandingPageProps) {
  const content = getSeoCityVariantContent(city, variant);
  const faqItems = getSeoCityVariantFaqItems(city, variant);
  const localNarrative = getSeoCityVariantNarrative(city, variant);
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Rijschool", href: "/instructeurs" },
    { label: city.name, href: `/rijschool/${city.slug}` },
    ...(variant !== "general"
      ? [{ label: getSeoCityVariantCollectionLabel(variant), href: content.pagePath }]
      : []),
  ];
  const itemListTitle =
    variant === "general"
      ? `Top rijinstructeurs in ${city.name}`
      : `Top ${content.collectionLabel.toLowerCase()} in ${city.name}`;
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
  const relatedCityVariantLinks = seoCityVariants
    .filter((entry) => entry !== variant)
    .map((entry) => ({
      href: getSeoCityVariantPath(city.slug, entry),
      label: getSeoCityVariantRouteLabel(city.name, entry),
      collectionLabel: getSeoCityVariantCollectionLabel(entry),
    }));
  const relatedCityIntentLinks = seoCityIntents.map((entry) => ({
    href: getSeoCityIntentPath(city.slug, entry),
    label: getSeoCityIntentRouteLabel(city.name, entry),
  }));

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
    name: content.pageLabel,
    serviceType: content.collectionLabel,
    description: content.pageIntro,
    url: `${siteUrl}${content.pagePath}`,
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
      name: `${content.collectionLabel} in ${city.name}`,
      numberOfItems: totalPackages,
    },
  };

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `RijBasis ${city.name}`,
    url: `${siteUrl}${content.pagePath}`,
    description: content.pageIntro,
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
    knowsAbout: [content.collectionLabel, city.name, "rijles", "rijinstructeur"],
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

      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_12%_16%,rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(29,78,216,0.16),transparent_22%),radial-gradient(circle_at_60%_60%,rgba(249,115,22,0.1),transparent_24%)]" />
        <div className="site-shell relative mx-auto w-full py-10 lg:py-16">
          <Reveal className="rounded-[2.5rem] border border-white/80 bg-white/90 p-6 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.22)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_28px_90px_-48px_rgba(15,23,42,0.62)] sm:p-8">
            <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
              <div className="space-y-6">
                <SeoBreadcrumbs items={breadcrumbItems} />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border border-sky-100 bg-sky-50 text-sky-700">
                    {content.pageLabel}
                  </Badge>
                  <Badge className="border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
                    {city.provinceLabel}
                  </Badge>
                  {variant !== "general" ? (
                    <Badge className="border border-slate-950 bg-slate-950 text-white dark:border-sky-300/20 dark:bg-sky-300/14 dark:text-sky-100">
                      {content.collectionLabel}
                    </Badge>
                  ) : null}
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                    Lokale SEO pagina
                  </p>
                  <h1 className="mt-4 max-w-[14ch] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[3.3rem]">
                    {content.pageTitle}
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                    {content.pageIntro}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {city.highlightLines.map((item) => (
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
                {[
                  {
                    label: "Actieve instructeurs",
                    value: `${instructors.length}`,
                    detail: `Profielen binnen ${city.name}`,
                    icon: Building2,
                  },
                  {
                    label: content.metricPackageLabel,
                    value: `${totalPackages}`,
                    detail: content.metricPackageDetail,
                    icon: MapPin,
                  },
                  {
                    label: "Gem. score",
                    value: averageReviewScore ? `${averageReviewScore}/5` : "Nog leeg",
                    detail: averageReviewScore
                      ? "Gebaseerd op zichtbare reviews"
                      : "Zichtbare reviews vullen dit automatisch",
                    icon: Star,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-4 shadow-[0_20px_46px_-36px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_46px_-36px_rgba(15,23,42,0.42)]"
                  >
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                      <item.icon className="size-4" />
                      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase">
                        {item.label}
                      </p>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="site-shell mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
        <Reveal className="space-y-5">
          <Card className="border border-white/80 bg-white/90 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
            <CardHeader>
              <CardTitle>{localNarrative.title}</CardTitle>
              <CardDescription>
                Unieke lokale context voor {content.collectionLabel.toLowerCase()} in {city.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>{localNarrative.body}</p>
              <p>{localNarrative.support}</p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                Instructeurs in {city.name}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {content.listTitle}
              </h2>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                {content.listDescription}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {relatedCityVariantLinks.slice(0, 2).map((entry) => (
                <Button
                  key={entry.href}
                  asChild
                  variant="outline"
                  className="rounded-full"
                >
                  <Link href={entry.href}>
                    {entry.label}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ))}
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/instructeurs">
                  Bekijk alle instructeurs
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

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
                {content.emptyState}
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
                Deze interne links geven Google sterkere lokale context en helpen bezoekers sneller door naar precies de juiste route in {city.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-300">
                  Andere routes in {city.name}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {relatedCityVariantLinks.map((entry) => (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
                    >
                      <span>{entry.label}</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  ))}
                  {relatedCityIntentLinks.map((entry) => (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
                    >
                      <span>{entry.label}</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-300">
                  Andere steden in {content.collectionLabel.toLowerCase()}
                </p>
                <div className="grid gap-2">
                  {seoCityConfigs
                    .filter((entry) => entry.slug !== city.slug)
                    .slice(0, 6)
                    .map((entry) => (
                      <Link
                        key={`${variant}-${entry.slug}`}
                        href={getSeoCityVariantPath(entry.slug, variant)}
                        className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
                      >
                        <span>{getSeoCityVariantLabel(entry.name, variant)}</span>
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
        title={`Veelgestelde vragen over ${content.collectionLabel.toLowerCase()} in ${city.name}`}
        description={`Deze lokale FAQ helpt bezoekers en zoekmachines beter begrijpen hoe ${content.collectionLabel.toLowerCase()} in ${city.name} werkt, welke routes er zijn en hoe je sneller de juiste instructeur kiest.`}
        items={faqItems}
      />
    </div>
  );
}
