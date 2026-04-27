import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComparisonLandingPage } from "@/components/marketing/comparison-landing-page";
import {
  getSeoComparisonBySlug,
  seoComparisonPages,
} from "@/lib/seo-comparisons";

export async function generateStaticParams() {
  return seoComparisonPages.map((comparison) => ({
    slug: comparison.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getSeoComparisonBySlug(slug);

  if (!comparison) {
    return {
      title: "Vergelijk rijlessen | RijBasis",
    };
  }

  const canonicalPath = `/vergelijk/${comparison.slug}`;

  return {
    title: comparison.title,
    description: comparison.description,
    keywords: comparison.keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: comparison.title,
      description: comparison.description,
      url: canonicalPath,
      type: "article",
      locale: "nl_NL",
    },
    twitter: {
      card: "summary_large_image",
      title: comparison.title,
      description: comparison.description,
    },
  };
}

export default async function VergelijkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const comparison = getSeoComparisonBySlug(slug);

  if (!comparison) {
    notFound();
  }

  return <ComparisonLandingPage comparison={comparison} />;
}
