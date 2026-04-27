import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";
import type { Metadata } from "next";

import { Reveal } from "@/components/marketing/homepage-motion";
import { SeoBreadcrumbs } from "@/components/marketing/seo-breadcrumbs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { seoComparisonPages } from "@/lib/seo-comparisons";

export const metadata: Metadata = {
  title: "Rijles vergelijken | Automaat, schakel, spoedcursus en meer",
  description:
    "Vergelijk populaire rijleskeuzes zoals automaat vs schakel, spoedcursus vs regulier en meer. Gemaakt voor zoekers die al dicht op een beslissing zitten.",
  alternates: {
    canonical: "/vergelijk",
  },
  openGraph: {
    title: "Rijles vergelijken | Automaat, schakel, spoedcursus en meer",
    description:
      "Vergelijk populaire rijleskeuzes zoals automaat vs schakel, spoedcursus vs regulier en meer. Gemaakt voor zoekers die al dicht op een beslissing zitten.",
    url: "/vergelijk",
    type: "website",
    locale: "nl_NL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rijles vergelijken | Automaat, schakel, spoedcursus en meer",
    description:
      "Vergelijk populaire rijleskeuzes zoals automaat vs schakel, spoedcursus vs regulier en meer. Gemaakt voor zoekers die al dicht op een beslissing zitten.",
  },
};

export default function VergelijkOverviewPage() {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Vergelijk", href: "/vergelijk" },
  ];

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_14%_18%,rgba(56,189,248,0.2),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(29,78,216,0.16),transparent_26%),radial-gradient(circle_at_56%_58%,rgba(249,115,22,0.1),transparent_26%)]" />
        <div className="site-shell relative mx-auto w-full py-10 lg:py-16">
          <Reveal className="rounded-[2.4rem] border border-white/80 bg-white/92 p-6 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.22)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86),rgba(15,23,42,0.94))] dark:shadow-[0_28px_90px_-48px_rgba(15,23,42,0.62)] sm:p-8">
            <div className="max-w-5xl space-y-5">
              <SeoBreadcrumbs items={breadcrumbItems} />
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border border-sky-100 bg-sky-50 text-sky-700">
                  Vergelijkhub
                </Badge>
                <Badge className="border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
                  SEO cluster
                </Badge>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                  Slim kiezen
                </p>
                <h1 className="mt-4 max-w-[18ch] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[3.1rem]">
                  Vergelijk rijlesroutes die mensen echt in Google intypen.
                </h1>
                <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                  Dit zijn typische zoekopdrachten met hoge intentie. Bezoekers zijn minder aan het oriënteren en meer aan het beslissen, waardoor vergelijkpagina&apos;s sterk kunnen werken voor zowel SEO als conversie.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="site-shell mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
        <Reveal className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {seoComparisonPages.map((comparison) => (
            <Card
              key={comparison.slug}
              className="rounded-[1.6rem] border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.52)]"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-white/10 dark:text-sky-200">
                    <Scale className="size-4" />
                  </div>
                  <Badge className="border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
                    {comparison.category}
                  </Badge>
                </div>
                <CardTitle className="text-xl leading-tight">
                  {comparison.title}
                </CardTitle>
                <CardDescription className="text-sm leading-7">
                  {comparison.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                  {comparison.intro}
                </div>
                <div className="flex flex-wrap gap-2">
                  {comparison.keywords.slice(0, 3).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/vergelijk/${comparison.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
                >
                  Lees vergelijking
                  <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </Reveal>
      </section>
    </div>
  );
}
