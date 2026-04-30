import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  PackageCheck,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { MarketingFaqSection } from "@/components/marketing/marketing-faq-section";
import { Reveal } from "@/components/marketing/homepage-motion";
import { RouteCoach } from "@/components/marketing/route-coach";
import { FeaturedInstructorsCarousel } from "@/components/marketing/featured-instructors-carousel";
import { InstructorSearchCard } from "@/components/marketing/instructor-search-card";
import { Button } from "@/components/ui/button";
import { getPublicInstructorsByLessonType } from "@/lib/data/instructors";
import { getPublicInstructorPackageMap } from "@/lib/data/packages";
import { seoCityConfigs } from "@/lib/seo-cities";

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
  const routeCoachCities = seoCityConfigs.slice(0, 6).map((city) => ({
    slug: city.slug,
    name: city.name,
  }));
  const instructorIds = featuredInstructors.map((instructor) => instructor.id);
  const packagesByInstructorId = instructorIds.length
    ? await getPublicInstructorPackageMap(instructorIds, "auto")
    : {};
  const hasFeaturedInstructors = featuredInstructors.length > 0;

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden px-4 pt-10 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_10%_16%,rgba(56,189,248,0.14),transparent_26%),radial-gradient(circle_at_84%_14%,rgba(29,78,216,0.12),transparent_28%)]" />
        <div className="site-shell relative mx-auto w-full py-8 lg:py-14">
          <Reveal className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(145deg,rgba(7,12,28,0.98),rgba(17,24,39,0.94),rgba(37,99,235,0.72))] p-4 text-white shadow-[0_30px_84px_-54px_rgba(15,23,42,0.64)] sm:p-5 xl:p-7">
            <div className="absolute inset-x-0 top-0 h-px bg-white/24" />
            <div className="relative grid gap-6 xl:grid-cols-[1fr_0.78fr] xl:items-center">
              <InstructorSearchCard />
              <div className="rounded-[1.45rem] border border-white/12 bg-white/9 p-5 shadow-[0_22px_62px_-44px_rgba(0,0,0,0.38)] backdrop-blur-xl">
                <p className="text-[10px] font-semibold tracking-[0.24em] text-white/64 uppercase">
                  Snelle route
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  Start met kiezen, niet met zoeken.
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  Pak direct de route die past bij je intentie: pakketten bekijken, instructeurs vergelijken of eerst rustig leren wat bij je past.
                </p>
                <div className="mt-5 grid gap-2">
                  {[
                    { href: "/instructeurs", label: "Vergelijk instructeurs", icon: SearchCheck },
                    { href: "/pakketten", label: "Bekijk pakketten", icon: PackageCheck },
                    { href: "/tips", label: "Lees rijles tips", icon: BookOpenText },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center justify-between rounded-[0.95rem] border border-white/12 bg-white/9 px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/14"
                    >
                      <span className="flex items-center gap-2">
                        <item.icon className="size-4 text-sky-100" />
                        {item.label}
                      </span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </div>
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
                Bekijk in een rustige selectie welke instructeur past bij jouw regio, budget en voorkeur voor automaat of handgeschakeld.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/instructeurs">
                Alle instructeurs bekijken
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          {hasFeaturedInstructors ? (
            <FeaturedInstructorsCarousel
              items={featuredInstructors}
              packagesByInstructorId={packagesByInstructorId}
            />
          ) : (
            <div className="surface-empty px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                Er zijn nog geen uitgelichte instructeurs beschikbaar.
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Zodra er instructeurs zijn toegevoegd, verschijnen ze hier automatisch met hun pakketten, beoordelingen en beschikbaarheid.
              </p>
            </div>
          )}
        </Reveal>
      </section>

      <section className="site-shell mx-auto w-full px-4 pb-10 sm:px-6 lg:px-8">
        <RouteCoach cities={routeCoachCities} />
      </section>

      <section className="site-shell mx-auto w-full px-4 pb-10 sm:px-6 lg:px-8">
        <Reveal>
          <div className="surface-panel rounded-[1.75rem] p-5 sm:p-7">
            <div className="grid gap-7 xl:grid-cols-[1fr_auto] xl:items-end">
              <div className="max-w-3xl space-y-3.5">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/90 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-sky-700 uppercase dark:border-white/10 dark:bg-white/6 dark:text-sky-200">
                  <Sparkles className="size-3.5" />
                  Klaar voor je volgende stap
                </div>
                <h2 className="max-w-[20ch] text-[1.9rem] font-semibold leading-[1.06] tracking-tight text-slate-950 dark:text-white sm:text-[2.5rem]">
                  Van orienteren naar aanvragen in een duidelijke flow.
                </h2>
                <p className="max-w-[42rem] text-[15px] leading-7 text-slate-600 dark:text-slate-300">
                  Start met een route, vergelijk de belangrijkste verschillen en ga daarna direct door naar een instructeur of pakket dat bij je planning past.
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {["Sterke eerste indruk", "Heldere selectie", "Snelle doorstroom"].map((item) => (
                    <div key={item} className="surface-card px-4 py-3 text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                      {item}
                    </div>
                  ))}
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
                <div className="surface-muted flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-sky-200">
                    <ShieldCheck className="size-4" />
                  </div>
                  <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                    Duidelijke filters en rustige profielen helpen leerlingen met vertrouwen de eerste stap naar een rijlesaanvraag te zetten.
                  </p>
                </div>
              </div>

              <div className="w-full max-w-md rounded-[1.45rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] px-5 py-5 text-white shadow-[0_22px_58px_-38px_rgba(37,99,235,0.32)] dark:border-white/10">
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
                  Eerst vergelijken, daarna aanvragen. Zo blijft de route helder vanaf de eerste klik.
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
