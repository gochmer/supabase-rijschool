import Link from "next/link";
import { ArrowRight, BookOpenText, Sparkles } from "lucide-react";
import type { Metadata } from "next";

import { Reveal } from "@/components/marketing/homepage-motion";
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
import { seoTipArticles } from "@/lib/seo-tips";

export const metadata: Metadata = {
  title: "Rijschool tips en lokale SEO-artikelen | RijBasis",
  description:
    "Praktische tips, lokale rijschool-content en SEO-artikelen over proeflessen, spoedcursussen, examenfocus en stadsspecifieke rijlesvragen.",
  alternates: {
    canonical: "/tips",
  },
  openGraph: {
    title: "Rijschool tips en lokale SEO-artikelen | RijBasis",
    description:
      "Praktische tips, lokale rijschool-content en SEO-artikelen over proeflessen, spoedcursussen, examenfocus en stadsspecifieke rijlesvragen.",
    url: "/tips",
    type: "website",
    locale: "nl_NL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rijschool tips en lokale SEO-artikelen | RijBasis",
    description:
      "Praktische tips, lokale rijschool-content en SEO-artikelen over proeflessen, spoedcursussen, examenfocus en stadsspecifieke rijlesvragen.",
  },
};

export default function TipsOverviewPage() {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Tips", href: "/tips" },
  ];

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(29,78,216,0.16),transparent_24%),radial-gradient(circle_at_56%_60%,rgba(249,115,22,0.1),transparent_24%)]" />
        <div className="site-shell relative mx-auto w-full py-10 lg:py-16">
          <Reveal className="rounded-[2.4rem] border border-white/80 bg-white/92 p-6 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.22)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86),rgba(15,23,42,0.94))] dark:shadow-[0_28px_90px_-48px_rgba(15,23,42,0.62)] sm:p-8">
            <div className="max-w-4xl space-y-5">
              <SeoBreadcrumbs items={breadcrumbItems} />
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border border-sky-100 bg-sky-50 text-sky-700">
                  SEO kennisbank
                </Badge>
                <Badge className="border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
                  Tips en lokale zoekcontent
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                  Content die verkeer aantrekt
                </p>
                <h1 className="mt-4 max-w-[16ch] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[3.2rem]">
                  Rijschool tips, lokale zoekartikelen en slimme content rond rijles.
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                  Deze kennisbank helpt niet alleen bezoekers, maar geeft de site ook extra SEO-diepte op zoekopdrachten rondom proeflessen, spoedcursussen, examenfocus en lokale rijschoolkeuze.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {[
                  "Ondersteunt long-tail SEO",
                  "Sterke interne links naar lokale routes",
                  "Meer topical authority voor Google",
                ].map((item) => (
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
        <Reveal className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {seoTipArticles.map((article) => (
            <Card
              key={article.slug}
              className="rounded-[1.5rem] border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.52)]"
            >
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
                    {article.category}
                  </Badge>
                  <Badge className="border border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-300/16 dark:bg-sky-300/10 dark:text-sky-100">
                    {article.cityLabel}
                  </Badge>
                </div>
                <CardTitle className="text-xl leading-tight">
                  {article.title}
                </CardTitle>
                <CardDescription className="text-sm leading-7">
                  {article.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                  {article.intro}
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.keywords.slice(0, 3).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/tips/${article.slug}`}>
                    Lees artikel
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </Reveal>
      </section>

      <section className="site-shell mx-auto w-full px-4 pt-4 sm:px-6 lg:px-8">
        <Reveal>
          <Card className="rounded-[2rem] border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.52)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenText className="size-5" />
                Waarom dit goed is voor SEO
              </CardTitle>
              <CardDescription>
                Artikelen op long-tail zoektermen ondersteunen je lokale landingspagina&apos;s en maken het onderwerp breder en sterker voor zoekmachines.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <div>Meer topical authority rond rijles, examenfocus en proeflessen.</div>
              <div>Sterkere interne links naar stadspagina&apos;s en intentroutes.</div>
              <div>Extra ingang voor bezoekers die nog via een informatievraag binnenkomen.</div>
            </CardContent>
            <CardContent className="grid gap-2 pt-0 sm:grid-cols-2">
              <Link
                href="/vergelijk/automaat-vs-schakel"
                className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
              >
                <span>Automaat vs schakel vergelijken</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/vergelijk/spoedcursus-vs-regulier"
                className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
              >
                <span>Spoedcursus vs regulier</span>
                <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
