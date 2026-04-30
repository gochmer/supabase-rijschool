import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass, Scale, Trophy } from "lucide-react";

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

export function ComparisonLandingPage({ comparison }: ComparisonLandingPageProps) {
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
    author: { "@type": "Organization", name: "RijBasis" },
    publisher: { "@type": "Organization", name: "RijBasis" },
    keywords: comparison.keywords.join(", "),
  };

  return (
    <div className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <section className="relative overflow-hidden px-4 pt-10 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_14%_18%,rgba(56,189,248,0.14),transparent_26%),radial-gradient(circle_at_84%_16%,rgba(29,78,216,0.12),transparent_28%)]" />
        <div className="site-shell relative mx-auto w-full py-8 lg:py-14">
          <Reveal className="surface-panel overflow-hidden rounded-[1.75rem]">
            <div className="grid gap-0 xl:grid-cols-[1fr_0.9fr]">
              <div className="p-6 sm:p-8">
                <div className="max-w-5xl space-y-5">
                  <SeoBreadcrumbs items={breadcrumbItems} />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-300/16 dark:bg-sky-400/10 dark:text-sky-100">{comparison.category}</Badge>
                    <Badge className="border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">Vergelijkroute</Badge>
                    <Badge className="border border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-300/16 dark:bg-violet-300/10 dark:text-violet-100">High intent SEO</Badge>
                  </div>

                  <div>
                    <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">Slim kiezen</p>
                    <h1 className="mt-4 max-w-[18ch] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[3.2rem]">{comparison.title}</h1>
                    <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">{comparison.intro}</p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <Button asChild className="rounded-full"><Link href="#vergelijking">Bekijk vergelijking <Scale className="size-4" /></Link></Button>
                    <Button asChild variant="outline" className="rounded-full"><Link href="#keuzehulp">Naar keuzehulp</Link></Button>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50/80 p-6 dark:border-white/10 dark:bg-white/[0.04] sm:p-8 xl:border-l xl:border-t-0">
                <div className="grid h-full content-center gap-4">
                  {[comparison.leftLabel, comparison.rightLabel].map((label, index) => (
                    <div key={label} className="surface-card p-5">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                        {index === 0 ? <Compass className="size-4" /> : <Trophy className="size-4" />}
                        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase">Optie {index + 1}</p>
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{label}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{index === 0 ? comparison.leftSummary : comparison.rightSummary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="vergelijking" className="site-shell mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
        <Reveal className="space-y-5">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">Vergelijking</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Waar zit in de praktijk het grootste verschil?</h2>
            <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">De vergelijking is opgebouwd voor bezoekers die sneller richting willen voelen zonder door losse pagina&apos;s te moeten zoeken.</p>
          </div>

          <div className="grid gap-4">
            {comparison.comparisonPoints.map((point, index) => (
              <Card key={point.heading} className="surface-panel overflow-hidden">
                <CardHeader className="border-b border-slate-200/80 bg-slate-50/80 dark:border-white/10 dark:bg-white/5">
                  <CardTitle className="flex items-center gap-2 text-xl"><span className="flex size-8 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-sky-200">{index + 1}</span>{point.heading}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 p-4 md:grid-cols-2">
                  <div className="surface-card p-4">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">{comparison.leftLabel}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{point.left}</p>
                  </div>
                  <div className="surface-card p-4">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">{comparison.rightLabel}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{point.right}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Reveal>
      </section>

      <section id="keuzehulp" className="site-shell mx-auto w-full px-4 pt-4 sm:px-6 lg:px-8">
        <Reveal className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>{comparison.decisionTitle}</CardTitle>
              <CardDescription>{comparison.decisionText}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {comparison.bullets.map((item) => (
                <div key={item} className="surface-muted flex items-start gap-3 px-4 py-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-500 dark:text-emerald-300" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Door naar relevante routes</CardTitle>
              <CardDescription>Sterke interne links maken deze vergelijking nuttiger voor bezoekers en zoekmachines.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {comparison.relatedLinks.map((link) => (
                <Link key={link.href} href={link.href} className="surface-card group flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white">
                  <span>{link.label}</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
              <Button asChild variant="outline" className="mt-2 rounded-full"><Link href="/vergelijk">Bekijk alle vergelijkpagina&apos;s <ArrowRight className="size-4" /></Link></Button>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      <MarketingFaqSection eyebrow="Vergelijk vragen" title={`Veelgestelde vragen over ${comparison.leftLabel.toLowerCase()} en ${comparison.rightLabel.toLowerCase()}`} description="Ook deze FAQ-laag helpt bezoekers sneller kiezen en maakt de vergelijking rijker voor zoekmachines." items={comparison.faqItems} />
    </div>
  );
}
