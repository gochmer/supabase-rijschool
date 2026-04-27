import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CityIntentLandingPage } from "@/components/marketing/city-intent-landing-page";
import { getPublicInstructorsByCity } from "@/lib/data/instructors";
import { getPublicInstructorPackageMap } from "@/lib/data/packages";
import {
  getSeoCityIntentConfig,
  getSeoCityIntentMatches,
} from "@/lib/seo-city-intents";
import { getSeoCityConfigBySlug, seoCityConfigs } from "@/lib/seo-cities";

export async function generateStaticParams() {
  return seoCityConfigs.map((city) => ({
    stad: city.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stad: string }>;
}): Promise<Metadata> {
  const { stad } = await params;
  const city = getSeoCityConfigBySlug(stad);
  const intentConfig = getSeoCityIntentConfig("examengericht");

  if (!city || !intentConfig) {
    return {
      title: "Examengerichte stadspagina | RijBasis",
    };
  }

  const canonicalPath = `/examengericht/${city.slug}`;

  return {
    title: intentConfig.seoTitle(city),
    description: intentConfig.seoDescription(city),
    keywords: [
      `examengerichte rijles ${city.name}`,
      `examentraining ${city.name}`,
      `praktijkexamen rijles ${city.name}`,
    ],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: intentConfig.seoTitle(city),
      description: intentConfig.seoDescription(city),
      url: canonicalPath,
      type: "website",
      locale: "nl_NL",
    },
    twitter: {
      card: "summary_large_image",
      title: intentConfig.seoTitle(city),
      description: intentConfig.seoDescription(city),
    },
  };
}

export default async function ExamengerichtCityPage({
  params,
}: {
  params: Promise<{ stad: string }>;
}) {
  const { stad } = await params;
  const city = getSeoCityConfigBySlug(stad);

  if (!city) {
    notFound();
  }

  const cityInstructors = await getPublicInstructorsByCity(city.slug, "auto");
  const packagesByInstructorId = await getPublicInstructorPackageMap(
    cityInstructors.map((instructor) => instructor.id),
    "auto"
  );
  const matchResult = getSeoCityIntentMatches({
    instructors: cityInstructors,
    packagesByInstructorId,
    intent: "examengericht",
  });

  return (
    <CityIntentLandingPage
      city={city}
      intent="examengericht"
      instructors={matchResult.instructors}
      packagesByInstructorId={packagesByInstructorId}
      fallbackUsed={matchResult.fallbackUsed}
      exactMatchCount={matchResult.exactMatchCount}
    />
  );
}
