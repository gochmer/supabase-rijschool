import Link from "next/link";
import { ArrowRight, CarFront, MapPinned, SearchCheck, Sparkles } from "lucide-react";

import { InstructorFinder } from "@/components/instructors/instructor-finder";
import { Reveal } from "@/components/marketing/homepage-motion";
import { SeoBreadcrumbs } from "@/components/marketing/seo-breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFavoriteInstructorIds } from "@/lib/data/favorites";
import { getPublicInstructorsByLessonType } from "@/lib/data/instructors";
import { getPublicInstructorPackageMap } from "@/lib/data/packages";
import { seoCityConfigs } from "@/lib/seo-cities";

const primaryCities = seoCityConfigs.slice(0, 6);
const featuredCities = seoCityConfigs.slice(0, 4);
const compactCities = seoCityConfigs.slice(0, 3);

function SeoLinkPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.2)] transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-white/18 dark:hover:text-white"
    >
      {children}
      <ArrowRight className="size-3.5" />
    </Link>
  );
}

export default async function InstructeursPage() {
  const [liveInstructors, favoriteInstructorIds] = await Promise.all([
    getPublicInstructorsByLessonType("auto"),
    getFavoriteInstructorIds(),
  ]);
  const instructorIds = liveInstructors.map((instructor) => instructor.id);
  const packagesByInstructorId = await getPublicInstructorPackageMap(
    instructorIds,
    "auto"
  );
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Instructeurs", href: "/instructeurs" },
  ];

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden px-4 pb-10 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_14%_16%,rgba(56,189,248,0.2),transparent_24%),radial-gradient(circle_at_86%_12%,rgba(29,78,216,0.18),transparent_26%),radial-gradient(circle_at_58%_64%,rgba(249,115,22,0.1),transparent_24%)]" />
        <div className="site-shell relative mx-auto w-full">
          <Reveal className="space-y-6">
            <SeoBreadcrumbs items={breadcrumbItems} />

            <div className="overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/92 p-6 shadow-[0_32px_100px_-54px_rgba(15,23,42,0.32)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88),rgba(15,23,42,0.96))] sm:p-8">
              <div className="grid gap-8 xl:grid-cols-[1fr_0.95fr] xl:items-end">
                <div className="max-w-4xl space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-300/16 dark:bg-sky-400/10 dark:text-sky-100">
                      Auto-instructeurs
                    </Badge>
                    <Badge className="border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
                      {liveInstructors.length} profielen
                    </Badge>
                    <Badge className="border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
                      Pakketten, reviews en beschikbaarheid
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                      Vergelijk rijinstructeurs
                    </p>
                    <h1 className="mt-4 max-w-[16ch] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[3.3rem]">
                      Vind een rijinstructeur die past bij je stad, budget en rijdoel.
                    </h1>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                      Vergelijk auto-instructeurs op regio, prijs, beoordeling, transmissie, pakketten en specialisaties. Wil je motor- of vrachtwagenrijles? Gebruik dan de aparte routes voor passend aanbod.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <Button asChild className="rounded-full">
                      <Link href="#instructeurs-overzicht">
                        Start vergelijken
                        <SearchCheck className="size-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/motor">Motorrijles bekijken</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/vrachtwagen">Vrachtwagen bekijken</Link>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  {[
                    {
                      icon: CarFront,
                      label: "Categorie",
                      value: "Auto",
                      text: "Alleen auto-instructeurs en autopakketten op deze pagina.",
                    },
                    {
                      icon: MapPinned,
                      label: "Lokale routes",
                      value: `${seoCityConfigs.length}+ steden`,
                      text: "Stadspagina’s voor lokale zoekopdrachten en snelle matching.",
                    },
                    {
                      icon: Sparkles,
                      label: "Slim kiezen",
                      value: "Filters + reviews",
                      text: "Gebruik social proof, prijs en specialisaties voor een betere keuze.",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[1.35rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                        <item.icon className="size-4" />
                        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase">
                          {item.label}
                        </p>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                        {item.value}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="site-shell mx-auto w-full px-4 pb-8 sm:px-6 lg:px-8">
        <Reveal className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.6rem] border border-white/70 bg-white/90 p-5 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-primary uppercase">
              Populaire steden
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
              Start lokaal met rijschool, automaat, schakel, motor of vrachtwagen.
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Deze routes geven bezoekers en zoekmachines direct context per stad en lestype.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {primaryCities.map((city) => (
                <SeoLinkPill key={`city-${city.slug}`} href={`/rijschool/${city.slug}`}>
                  {city.name}
                </SeoLinkPill>
              ))}
              {featuredCities.map((city) => (
                <SeoLinkPill key={`automatic-${city.slug}`} href={`/automaat/${city.slug}`}>
                  Automaat {city.name}
                </SeoLinkPill>
              ))}
              {featuredCities.map((city) => (
                <SeoLinkPill key={`manual-${city.slug}`} href={`/schakel/${city.slug}`}>
                  Schakel {city.name}
                </SeoLinkPill>
              ))}
              {compactCities.map((city) => (
                <SeoLinkPill key={`motor-${city.slug}`} href={`/motor/${city.slug}`}>
                  Motor {city.name}
                </SeoLinkPill>
              ))}
              {compactCities.map((city) => (
                <SeoLinkPill key={`truck-${city.slug}`} href={`/vrachtwagen/${city.slug}`}>
                  Vrachtwagen {city.name}
                </SeoLinkPill>
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/70 bg-white/90 p-5 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-primary uppercase">
              Zoekintentie routes
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
              Snelle routes voor leerlingen die al gerichter zoeken.
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Gebruik deze pagina’s voor zoekopdrachten met hogere intentie zoals proefles, spoedcursus, faalangst en praktijkexamen.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {featuredCities.map((city) => (
                <SeoLinkPill key={`spoed-${city.slug}`} href={`/spoedcursus/${city.slug}`}>
                  Spoed {city.name}
                </SeoLinkPill>
              ))}
              {featuredCities.map((city) => (
                <SeoLinkPill key={`trial-${city.slug}`} href={`/proefles/${city.slug}`}>
                  Proefles {city.name}
                </SeoLinkPill>
              ))}
              {featuredCities.map((city) => (
                <SeoLinkPill key={`exam-${city.slug}`} href={`/examengericht/${city.slug}`}>
                  Examengericht {city.name}
                </SeoLinkPill>
              ))}
              {compactCities.map((city) => (
                <SeoLinkPill key={`fear-${city.slug}`} href={`/faalangst/${city.slug}`}>
                  Faalangst {city.name}
                </SeoLinkPill>
              ))}
              {compactCities.map((city) => (
                <SeoLinkPill key={`refresh-${city.slug}`} href={`/opfriscursus/${city.slug}`}>
                  Opfriscursus {city.name}
                </SeoLinkPill>
              ))}
              {compactCities.map((city) => (
                <SeoLinkPill key={`exam-focus-${city.slug}`} href={`/praktijkexamen/${city.slug}`}>
                  Praktijkexamen {city.name}
                </SeoLinkPill>
              ))}
              <SeoLinkPill href="/vergelijk">Vergelijkhub</SeoLinkPill>
              <SeoLinkPill href="/tips">SEO tips</SeoLinkPill>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="instructeurs-overzicht" className="site-shell mx-auto w-full px-4 pb-10 sm:px-6 lg:px-8">
        <Reveal>
          <InstructorFinder
            instructors={liveInstructors}
            favoriteInstructorIds={favoriteInstructorIds}
            packagesByInstructorId={packagesByInstructorId}
          />
        </Reveal>
      </section>
    </div>
  );
}
