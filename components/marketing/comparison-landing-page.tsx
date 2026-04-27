import Link from "next/link";
import { ArrowRight, CheckCircle2, Scale, Sparkles } from "lucide-react";

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
import type { SeoComparisonPage } from "@/lib/seo-comparisons";

type ComparisonLandingPageProps = {
  comparison: SeoComparisonPage;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function ComparisonLandingPage({
  comparison,
}: ComparisonLandingPageProps) {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Vergelijk", href: "/vergelijk" },
    { label: comparison.title, href: `/vergelijk/${comparison.slug}` },
  ];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: comparison.title,
    description: comparison.description,
    inLanguage: "nl-NL",
    mainEntityOfPage: `${siteUrl}/vergelijk/${comparison.slug}`,
    author: {
      "@type": "Organization",
      name: "RijBasis",
    },
    publisher: {
      "@type": "Organization",
      name: "RijBasis",
    },
    keywords: comparison.keywords.join(", "),
  };

  return (
    <div className="pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_14%_18%,rgba(56,189,248,0.2),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(29,78,216,0.16),transparent_26%),radial-gradient(circle_at_56%_58%,rgba(249,115,22,0.1),transparent_26%)]" />
        <div className="site-shell relative mx-auto w-full py-10 lg:py-16">
          <Reveal className="rounded-[2.4rem] border border-white/80 bg-white/92 p-6 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.22)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86),rgba(15,23,42,0.94))] dark:shadow-[0_28px_90px_-48px_rgba(15,23,42,0.62)] sm:p-8">
            <div className="max-w-5xl space-y-5">
              <SeoBreadcrumbs items={breadcrumbItems} />
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border border-sky-100 bg-sky-50 text-sky-700">
                  {comparison.category}
                </Badge>
                <Badge className="border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
                  Vergelijkroute
                </Badge>
                <Badge className="border border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-300/16 dark:bg-violet-300/10 dark:text-violet-100">
                  SEO landingspagina
                </Badge>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                  Slim kiezen
                </p>
                <h1 className="mt-4 max-w-[18ch] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[3.1rem]">
                  {comparison.title}
                </h1>
                <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                  {comparison.intro}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {comparison.bullets.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:shadow-[0_16px_34px_-28px_rgba(15,23,42,0.36)]"
                  >
                    <Sparkles className="size-4 text-emerald-500 dark:text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="site-shell mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
        <Reveal className="grid gap-5 xl:grid-cols-2">
          <Card className="border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.52)]">
            <CardHeader>
              <CardTitle>{comparison.leftLabel}</CardTitle>
              <CardDescription>{comparison.leftSummary}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.52)]">
            <CardHeader>
              <CardTitle>{comparison.rightLabel}</CardTitle>
              <CardDescription>{comparison.rightSummary}</CardDescription>
            </CardHeader>
          </Card>
        </Reveal>
      </section>

      <section className="site-shell mx-auto w-full px-4 py-4 sm:px-6 lg:px-8">
        <Reveal className="space-y-5">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
              Vergelijking
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Waar zit in de praktijk het grootste verschil?
            </h2>
            <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              Bezoekers zoeken dit soort pagina&apos;s meestal pas als ze echt richting willen voelen. Daarom moet de vergelijking helder, compact en praktisch zijn.
            </p>
          </div>

          <div className="grid gap-4">
            {comparison.comparisonPoints.map((point) => (
              <Card
                key={point.heading}
                className="border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.52)]"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Scale className="size-5" />
                    {point.heading}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/6">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                      {comparison.leftLabel}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {point.left}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/6">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                      {comparison.rightLabel}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {point.right}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="site-shell mx-auto w-full px-4 pt-4 sm:px-6 lg:px-8">
        <Reveal className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.52)]">
            <CardHeader>
              <CardTitle>{comparison.decisionTitle}</CardTitle>
              <CardDescription>{comparison.decisionText}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {comparison.bullets.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300"
                >
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-500 dark:text-emerald-300" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.52)]">
            <CardHeader>
              <CardTitle>Door naar relevante routes</CardTitle>
              <CardDescription>
                Sterke interne links helpen deze vergelijking SEO-technisch nog harder werken.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {comparison.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="size-4" />
                </Link>
              ))}
              <Button asChild variant="outline" className="mt-2 rounded-full">
                <Link href="/vergelijk">
                  Bekijk alle vergelijkpagina&apos;s
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      <MarketingFaqSection
        eyebrow="Vergelijk vragen"
        title={`Veelgestelde vragen over ${comparison.leftLabel.toLowerCase()} en ${comparison.rightLabel.toLowerCase()}`}
        description="Ook deze FAQ-laag helpt bezoekers sneller kiezen en maakt de vergelijking rijker voor zoekmachines."
        items={comparison.faqItems}
      />
    </div>
  );
}
