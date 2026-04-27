import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { MarketingFaqSection } from "@/components/marketing/marketing-faq-section";
import { Reveal } from "@/components/marketing/homepage-motion";
import { FeaturedInstructorsCarousel } from "@/components/marketing/featured-instructors-carousel";
import { InstructorSearchCard } from "@/components/marketing/instructor-search-card";
import { Button } from "@/components/ui/button";
import { getPublicInstructorsByLessonType } from "@/lib/data/instructors";
import { getPublicInstructorPackageMap } from "@/lib/data/packages";

const homeFaqItems = [
  {
    question: "Hoe kies ik sneller de juiste rijinstructeur?",
    answer:
      "Start met regio, transmissie, reviewscore en prijs, en kijk daarna pas naar de fijnere stijlverschillen. Zo blijft de keuze rustig en logisch.",
  },
  {
    question: "Is automaat of schakel beter voor mij?",
    answer:
      "Dat hangt af van je doel, vertrouwen en voertuigkeuze later. Daarom hebben we aparte routes voor automaat, schakel en lokale intentpagina's.",
  },
  {
    question: "Waarom zijn reviews en profielen zo belangrijk?",
    answer:
      "Nieuwe leerlingen bouwen sneller vertrouwen op als ze echte social proof zien en meteen snappen hoe een instructeur werkt, plant en begeleidt.",
  },
];

export default async function HomePage() {
  const featuredInstructors = (await getPublicInstructorsByLessonType("auto")).slice(0, 6);
  const instructorIds = featuredInstructors.map((instructor) => instructor.id);
  const packagesByInstructorId = instructorIds.length
    ? await getPublicInstructorPackageMap(instructorIds, "auto")
    : {};
  const hasFeaturedInstructors = featuredInstructors.length > 0;

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_10%_16%,rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(29,78,216,0.18),transparent_26%),radial-gradient(circle_at_58%_62%,rgba(249,115,22,0.1),transparent_24%)]" />
        <div className="site-shell relative mx-auto w-full py-10 lg:py-16">
          <Reveal
            className="relative overflow-hidden rounded-[2.6rem] bg-[linear-gradient(145deg,rgba(7,12,28,0.98),rgba(17,24,39,0.94),rgba(37,99,235,0.82),rgba(14,165,233,0.72))] px-6 py-6 text-white shadow-[0_40px_110px_-56px_rgba(15,23,42,0.72)] sm:px-7 sm:py-7 xl:min-h-[34rem] xl:px-8 xl:py-8"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_28%)]" />
            <div className="relative">
              <InstructorSearchCard />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="site-shell mx-auto w-full px-4 py-10 sm:px-6 lg:px-8">
        <Reveal className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                Uitgelichte instructeurs
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Vergelijk rijinstructeurs op prijs, ervaring, beoordeling en beschikbaarheid.
              </h2>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                Bekijk in één rustige selectie welke instructeur past bij jouw regio, budget en
                voorkeur voor automaat of handgeschakeld.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                Vergeleken op kwaliteit
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                Klaar voor directe aanvraag
              </span>
            </div>
          </div>
          {hasFeaturedInstructors ? (
            <FeaturedInstructorsCarousel
              items={featuredInstructors}
              packagesByInstructorId={packagesByInstructorId}
            />
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center shadow-[0_24px_70px_-48px_rgba(15,23,42,0.18)] dark:border-white/12 dark:bg-white/6">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                Er zijn nog geen uitgelichte instructeurs beschikbaar.
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Zodra er instructeurs zijn toegevoegd, verschijnen ze hier automatisch met hun
                pakketten, beoordelingen en beschikbaarheid.
              </p>
            </div>
          )}
        </Reveal>
      </section>

      <section className="site-shell mx-auto w-full px-4 pb-10 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-[2.45rem] border border-white/70 bg-white/84 p-6 shadow-[0_32px_100px_-50px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_32px_100px_-50px_rgba(15,23,42,0.64)] sm:p-8">
            <div className="grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/90 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-sky-700 uppercase dark:border-white/10 dark:bg-white/6 dark:text-sky-200">
                  <Sparkles className="size-3.5" />
                  Klaar voor je volgende stap
                </div>
                <h2 className="max-w-[16ch] text-[2rem] font-semibold leading-[1.02] tracking-tight text-slate-950 dark:text-white sm:text-[2.8rem]">
                  Vind sneller een instructeur die bij jouw rijdoel past.
                </h2>
                <p className="max-w-[38rem] text-[15px] leading-7 text-slate-600 dark:text-slate-300">
                  Start met je locatie, vergelijk de belangrijkste verschillen en ga direct door
                  naar een instructeur die aansluit op jouw planning en budget.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Sterke eerste indruk", "Heldere selectie", "Snelle doorstroom"].map(
                    (item) => (
                      <div
                        key={item}
                        className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-700 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:shadow-[0_18px_36px_-28px_rgba(15,23,42,0.38)]"
                      >
                        {item}
                      </div>
                    )
                  )}
                  </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/vergelijk/automaat-vs-schakel">
                      Vergelijk automaat vs schakel
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/vergelijk/spoedcursus-vs-regulier">
                      Vergelijk spoedcursus vs regulier
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
                <div className="flex items-start gap-3 rounded-[1.25rem] bg-slate-50 px-4 py-3 dark:bg-white/6">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-sky-200">
                    <ShieldCheck className="size-4" />
                  </div>
                  <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                    Duidelijke filters en rustige profielen helpen leerlingen met vertrouwen de
                    eerste stap naar een rijlesaanvraag te zetten.
                  </p>
                </div>
              </div>

              <div className="w-full max-w-md rounded-[1.9rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] px-5 py-5 text-white shadow-[0_26px_62px_-38px_rgba(37,99,235,0.34)] dark:border-white/10">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-white/62 uppercase">
                    Volgende stap
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-8 rounded-full bg-[linear-gradient(90deg,#bae6fd,#ffffff)]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  </div>
                </div>
                <p className="max-w-[22ch] text-[1.1rem] font-semibold leading-6 text-white">
                  Kies eerst hoe je wilt starten en ga daarna direct naar de juiste match.
                </p>
                <div className="mt-4 flex flex-col gap-2.5">
                  <Button asChild size="lg" className="h-11 rounded-full bg-white text-slate-950 hover:bg-white/92">
                    <Link href="/registreren">Aanmelden als leerling</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-11 rounded-full border-white/18 bg-white/10 text-white hover:bg-white/14 hover:text-white">
                    <Link href="/instructeurs">
                      Bekijk instructeurs
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-11 rounded-full border-white/14 bg-white/6 text-white hover:bg-white/10 hover:text-white">
                    <Link href="/tips">Lees tips en lokale artikelen</Link>
                  </Button>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-white/72">
                  Eerst vergelijken, daarna aanvragen. Zo blijft de route helder vanaf de eerste
                  klik.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <MarketingFaqSection
        eyebrow="Veelgestelde vragen"
        title="Snelle antwoorden voor leerlingen die gericht willen kiezen"
        description="Deze vragen spelen vaak vroeg in de funnel en helpen bezoekers sneller richting een instructeur, proefles of pakket."
        items={homeFaqItems}
      />
    </div>
  );
}
