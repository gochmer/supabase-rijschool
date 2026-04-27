import Link from "next/link";
import { ArrowRight, Compass, Scale, Sparkles } from "lucide-react";
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
import { seoComparisonPages } from "@/lib/seo-comparisons";

export const metadata: Metadata = {
  title: "Rijles vergelijken | Automaat, schakel, spoedcursus en meer",
  description:
    "Vergelijk populaire rijleskeuzes zoals automaat vs schakel, spoedcursus vs regulier en meer. Gemaakt voor zoekers die al dicht op een beslissing zitten.",
  alternates: { canonical: "/vergelijk" },
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
  const featuredComparison = seoComparisonPages[0];
  const remainingComparisons = seoComparisonPages.slice(1);

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_14%_18%,rgba(56,189,248,0.24),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(29,78,216,0.18),transparent_26%),radial-gradient(circle_at_56%_62%,rgba(249,115,22,0.12),transparent_26%)]" />
        <div className="site-shell relative mx-auto w-full py-10 lg:py-16">
          <Reveal className="overflow-hidden rounded-[2.55rem] border border-white/80 bg-white/92 shadow-[0_34px_110px_-56px_rgba(15,23,42,0.32)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88),rgba(15,23,42,0.96))]">
            <div className="grid gap-0 xl:grid-cols-[1fr_0.82fr]">
              <div className="p-6 sm:p-8">
                <div className="max-w-5xl space-y-5">
                  <SeoBreadcrumbs items={breadcrumbItems} />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-300/16 dark:bg-sky-400/10 dark:text-sky-100">Vergelijkhub</Badge>
                    <Badge className="border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">{seoComparisonPages.length} keuzehulpen</Badge>
                    <Badge className="border border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-300/16 dark:bg-violet-300/10 dark:text-violet-100">High-intent SEO</Badge>
                  </div>

                  <div>
                    <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">Slim kiezen</p>
                    <h1 className="mt-4 max-w-[18ch] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[3.2rem]">Vergelijk rijlesroutes die leerlingen echt overwegen.</h1>
                    <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">Deze vergelijkpagina’s helpen bezoekers sneller kiezen tussen populaire routes zoals automaat, schakel, spoedcursus en regulier lessen.</p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <Button asChild className="rounded-full"><Link href="#vergelijkingen">Bekijk vergelijkingen <ArrowRight className="size-4" /></Link></Button>
                    <Button asChild variant="outline" className="rounded-full"><Link href="/instructeurs">Naar instructeurs</Link></Button>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-200 bg-slate-50/80 p-6 dark:border-white/10 dark:bg-white/[0.04] sm:p-8 xl:border-l xl:border-t-0">
                <div className="grid h-full content-center gap-4">
                  {[
                    { label: "Keuzehulp", value: `${seoComparisonPages.length}`, text: "Gerichte vergelijkingen voor beslissers." },
                    { label: "Intentie", value: "Hoog", text: "Bezoekers zitten dichter op een aanvraag." },
                    { label: "Doel", value: "Sneller kiezen", text: "Minder twijfel, meer richting naar actie." },
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

      <section id="vergelijkingen" className="site-shell mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
        <Reveal className="space-y-5">
          {featuredComparison ? (
            <Card className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
              <div className="grid gap-0 lg:grid-cols-[1fr_0.65fr]">
                <CardHeader className="p-6 sm:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-300/16 dark:bg-sky-300/10 dark:text-sky-100">Uitgelichte vergelijking</Badge>
                    <Badge className="border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">{featuredComparison.category}</Badge>
                  </div>
                  <CardTitle className="mt-3 max-w-2xl text-2xl leading-tight sm:text-3xl">{featuredComparison.title}</CardTitle>
                  <CardDescription className="mt-2 max-w-3xl text-sm leading-7">{featuredComparison.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col justify-between gap-4 border-t border-slate-200 bg-slate-50/80 p-6 dark:border-white/10 dark:bg-white/[0.04] lg:border-l lg:border-t-0">
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{featuredComparison.intro}</p>
                  <Button asChild className="rounded-full"><Link href={`/vergelijk/${featuredComparison.slug}`}>Lees deze vergelijking <ArrowRight className="size-4" /></Link></Button>
                </CardContent>
              </div>
            </Card>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {remainingComparisons.map((comparison) => (
              <Card key={comparison.slug} className="group rounded-[1.55rem] border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 hover:shadow-[0_30px_82px_-48px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-white/10 dark:text-sky-200"><Scale className="size-4" /></div>
                    <Badge className="border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">{comparison.category}</Badge>
                  </div>
                  <CardTitle className="text-xl leading-tight">{comparison.title}</CardTitle>
                  <CardDescription className="text-sm leading-7">{comparison.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">{comparison.intro}</div>
                  <Link href={`/vergelijk/${comparison.slug}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white">Lees vergelijking <ArrowRight className="size-4" /></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </Reveal>
      </section>
    </div>
  );
}
