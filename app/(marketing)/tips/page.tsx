import Link from "next/link";
import { ArrowRight, BookOpenText, Compass, SearchCheck, Sparkles } from "lucide-react";
import type { Metadata } from "next";

import { AutomaticInternalLinks } from "@/components/marketing/automatic-internal-links";
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
import { seoComparisonPages } from "@/lib/seo-comparisons";
import { seoTipArticles } from "@/lib/seo-tips";

export const metadata: Metadata = {
  title: "Rijschool tips en lokale SEO-artikelen | RijBasis",
  description:
    "Praktische tips, lokale rijschool-content en SEO-artikelen over proeflessen, spoedcursussen, examenfocus en stadsspecifieke rijlesvragen.",
  alternates: { canonical: "/tips" },
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
  const categories = Array.from(new Set(seoTipArticles.map((article) => article.category)));
  const featuredArticle = seoTipArticles[0];
  const remainingArticles = seoTipArticles.slice(1);

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(29,78,216,0.18),transparent_24%),radial-gradient(circle_at_56%_64%,rgba(249,115,22,0.12),transparent_24%)]" />
        <div className="site-shell relative mx-auto w-full py-10 lg:py-16">
          <Reveal className="overflow-hidden rounded-[2.55rem] border border-white/80 bg-white/92 shadow-[0_34px_110px_-56px_rgba(15,23,42,0.32)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88),rgba(15,23,42,0.96))] dark:shadow-[0_34px_110px_-56px_rgba(15,23,42,0.72)]">
            <div className="grid gap-0 xl:grid-cols-[1fr_0.88fr]">
              <div className="p-6 sm:p-8">
                <div className="max-w-5xl space-y-5">
                  <SeoBreadcrumbs items={breadcrumbItems} />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-300/16 dark:bg-sky-400/10 dark:text-sky-100">SEO kennisbank</Badge>
                    <Badge className="border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">{seoTipArticles.length} artikelen</Badge>
                    <Badge className="border border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-300/16 dark:bg-violet-300/10 dark:text-violet-100">Internal linking hub</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">Content die verkeer aantrekt</p>
                    <h1 className="mt-4 max-w-[17ch] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[3.25rem]">Rijschool tips, lokale zoekartikelen en slimme content rond rijles.</h1>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">Deze kennisbank helpt bezoekers kiezen en versterkt je SEO-clusters rond proeflessen, spoedcursussen, examenfocus, vergelijkingen en lokale rijschoolkeuze.</p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <Button asChild className="rounded-full"><Link href="#artikelen">Bekijk artikelen <SearchCheck className="size-4" /></Link></Button>
                    <Button asChild variant="outline" className="rounded-full"><Link href="#seo-links">Naar linkhub</Link></Button>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-200 bg-slate-50/80 p-6 dark:border-white/10 dark:bg-white/[0.04] sm:p-8 xl:border-l xl:border-t-0">
                <div className="grid h-full content-center gap-4">
                  {[
                    { label: "Long-tail content", value: `${seoTipArticles.length}`, text: "Artikelen voor informatieve zoekopdrachten." },
                    { label: "Categorieën", value: `${categories.length}`, text: "Onderwerpen rond rijles, keuze en voorbereiding." },
                    { label: "Vergelijkroutes", value: `${seoComparisonPages.length}`, text: "High-intent pagina’s gekoppeld aan de kennisbank." },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.45rem] border border-slate-200 bg-white/90 p-4 shadow-[0_20px_46px_-36px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/6">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300"><Compass className="size-4" /><p className="text-[10px] font-semibold tracking-[0.18em] uppercase">{item.label}</p></div>
                      <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="artikelen" className="site-shell mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
        <Reveal className="space-y-5">
          {featuredArticle ? (
            <Card className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
              <div className="grid gap-0 lg:grid-cols-[1fr_0.65fr]">
                <CardHeader className="p-6 sm:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-300/16 dark:bg-sky-300/10 dark:text-sky-100">Uitgelicht artikel</Badge>
                    <Badge className="border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">{featuredArticle.category}</Badge>
                  </div>
                  <CardTitle className="mt-3 max-w-2xl text-2xl leading-tight sm:text-3xl">{featuredArticle.title}</CardTitle>
                  <CardDescription className="mt-2 max-w-3xl text-sm leading-7">{featuredArticle.description}</CardDescription>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {featuredArticle.keywords.slice(0, 4).map((keyword) => <span key={keyword} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">{keyword}</span>)}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col justify-between gap-4 border-t border-slate-200 bg-slate-50/80 p-6 dark:border-white/10 dark:bg-white/[0.04] lg:border-l lg:border-t-0">
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{featuredArticle.intro}</p>
                  <Button asChild className="rounded-full"><Link href={`/tips/${featuredArticle.slug}`}>Lees uitgelicht artikel <ArrowRight className="size-4" /></Link></Button>
                </CardContent>
              </div>
            </Card>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {remainingArticles.map((article) => (
              <Card key={article.slug} className="group rounded-[1.55rem] border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 hover:shadow-[0_30px_82px_-48px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.52)]">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">{article.category}</Badge>
                    <Badge className="border border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-300/16 dark:bg-sky-300/10 dark:text-sky-100">{article.cityLabel}</Badge>
                  </div>
                  <CardTitle className="text-xl leading-tight">{article.title}</CardTitle>
                  <CardDescription className="text-sm leading-7">{article.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">{article.intro}</div>
                  <Button asChild variant="outline" className="rounded-full"><Link href={`/tips/${article.slug}`}>Lees artikel <ArrowRight className="size-4" /></Link></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </Reveal>
      </section>

      <section id="seo-links" className="site-shell mx-auto w-full px-4 pt-4 sm:px-6 lg:px-8">
        <Reveal className="space-y-5">
          <AutomaticInternalLinks title="Automatische SEO linkhub" description="Deze linkhub koppelt artikelen, stadspagina’s en vergelijkroutes zodat bezoekers en zoekmachines dieper door de site kunnen navigeren." currentPath="/tips" limit={10} />

          <Card className="rounded-[2rem] border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpenText className="size-5" />Waarom dit goed is voor SEO</CardTitle>
              <CardDescription>Artikelen op long-tail zoektermen ondersteunen je lokale landingspagina&apos;s en maken het onderwerp breder en sterker voor zoekmachines.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:grid-cols-3">
              <div className="rounded-[1rem] bg-slate-50/90 p-4 dark:bg-white/6"><Sparkles className="mb-2 size-4 text-primary" />Meer topical authority rond rijles, examenfocus en proeflessen.</div>
              <div className="rounded-[1rem] bg-slate-50/90 p-4 dark:bg-white/6"><Sparkles className="mb-2 size-4 text-primary" />Sterkere interne links naar stadspagina&apos;s en intentroutes.</div>
              <div className="rounded-[1rem] bg-slate-50/90 p-4 dark:bg-white/6"><Sparkles className="mb-2 size-4 text-primary" />Extra ingang voor bezoekers die nog via een informatievraag binnenkomen.</div>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
