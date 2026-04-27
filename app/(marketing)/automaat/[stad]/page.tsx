import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CityLandingPage } from "@/components/marketing/city-landing-page";
import { getPublicInstructorsByCityAndTransmission } from "@/lib/data/instructors";
import { getPublicInstructorPackageMap } from "@/lib/data/packages";
import {
  getSeoCityConfigBySlug,
  getSeoCityVariantMetadata,
  seoCityConfigs,
} from "@/lib/seo-cities";

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

  if (!city) {
    return {
      title: "Automaat rijles stadspagina | RijBasis",
    };
  }

  const metadata = getSeoCityVariantMetadata(city, "automaat");

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: metadata.canonicalPath,
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: metadata.canonicalPath,
      type: "website",
      locale: "nl_NL",
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
    },
  };
}

export default async function AutomaatCityPage({
  params,
}: {
  params: Promise<{ stad: string }>;
}) {
  const { stad } = await params;
  const city = getSeoCityConfigBySlug(stad);

  if (!city) {
    notFound();
  }

  const instructors = await getPublicInstructorsByCityAndTransmission(
    city.slug,
    "automaat",
    "auto"
  );
  const packagesByInstructorId = await getPublicInstructorPackageMap(
    instructors.map((instructor) => instructor.id),
    "auto"
  );

  return (
    <CityLandingPage
      city={city}
      variant="automaat"
      instructors={instructors}
      packagesByInstructorId={packagesByInstructorId}
    />
  );
}
