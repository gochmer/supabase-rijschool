import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
import { getSeoTipArticleBySlug, seoTipArticles } from "@/lib/seo-tips";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateStaticParams() {
  return seoTipArticles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getSeoTipArticleBySlug(slug);

  if (!article) {
    return {
      title: "Rijschool tip | RijBasis",
    };
  }

  const canonicalPath = `/tips/${article.slug}`;

  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      url: canonicalPath,
      type: "article",
      locale: "nl_NL",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
  };
}

export default async function TipArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getSeoTipArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    inLanguage: "nl-NL",
    mainEntityOfPage: `${siteUrl}/tips/${article.slug}`,
    author: {
      "@type": "Organization",
      name: "RijBasis",
    },
    publisher: {
      "@type": "Organization",
      name: "RijBasis",
    },
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
        name: "Tips",
        item: `${siteUrl}/tips`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `${siteUrl}/tips/${article.slug}`,
      },
    ],
  };

  return (
    <div className="pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_16%_14%,rgba(56,189,248,0.18),transparent_22%),radial-gradient(circle_at_84%_18%,rgba(249,115,22,0.16),transparent_22%)]" />
        <div className="site-shell relative mx-auto w-full py-10 lg:py-16">
          <Reveal className="rounded-[2.4rem] border border-white/80 bg-white/92 p-6 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.22)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86),rgba(15,23,42,0.94))] dark:shadow-[0_28px_90px_-48px_rgba(15,23,42,0.62)] sm:p-8">
            <div className="max-w-4xl space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border border-sky-100 bg-sky-50 text-sky-700">
                  {article.category}
                </Badge>
                <Badge className="border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
                  {article.cityLabel}
                </Badge>
                <Badge className="border border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-300/16 dark:bg-violet-300/10 dark:text-violet-100">
                  Kennisbank
                </Badge>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                  SEO artikel
                </p>
                <h1 className="mt-4 max-w-[18ch] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[3.1rem]">
                  {article.title}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                  {article.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {article.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="site-shell mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
        <Reveal className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-[2rem] border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.52)]">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-5 text-[15px] leading-8 text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                {article.intro}
              </div>
              {article.sections.map((section) => (
                <div key={section.heading} className="space-y-3">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    {section.heading}
                  </h2>
                  <div className="space-y-3 text-[15px] leading-8 text-slate-600 dark:text-slate-300">
                    {section.body.map((paragraph, index) => (
                      <p key={`${section.heading}-${index}`}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-[1.8rem] border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.52)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpenText className="size-5" />
                  Door naar relevante pagina&apos;s
                </CardTitle>
                <CardDescription>
                  Sterke interne links helpen bezoekers en zoekmachines tegelijk.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {article.relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="size-4" />
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.8rem] border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.52)]">
              <CardHeader>
                <CardTitle>Meer lezen</CardTitle>
                <CardDescription>
                  Andere kennisbankartikelen rond rijles, proeflessen en examenfocus.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {seoTipArticles
                  .filter((entry) => entry.slug !== article.slug)
                  .slice(0, 4)
                  .map((entry) => (
                    <Link
                      key={entry.slug}
                      href={`/tips/${entry.slug}`}
                      className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
                    >
                      <span>{entry.title}</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  ))}
              </CardContent>
            </Card>

            <Button asChild variant="outline" className="rounded-full">
              <Link href="/tips">
                <ArrowLeft className="size-4" />
                Terug naar alle tips
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
