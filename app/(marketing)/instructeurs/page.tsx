import Link from "next/link";

import { InstructorFinder } from "@/components/instructors/instructor-finder";
import { Reveal } from "@/components/marketing/homepage-motion";
import { Button } from "@/components/ui/button";
import { getFavoriteInstructorIds } from "@/lib/data/favorites";
import { getPublicInstructorsByLessonType } from "@/lib/data/instructors";
import { getPublicInstructorPackageMap } from "@/lib/data/packages";
import { seoCityConfigs } from "@/lib/seo-cities";

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

  return (
    <div className="pb-20">
      <section className="site-shell mx-auto w-full px-4 pb-10 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <Reveal className="space-y-4">
          <div className="rounded-[1.2rem] border border-slate-200 bg-white/88 p-4 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_18px_44px_-34px_rgba(15,23,42,0.42)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                  Categorie
                </p>
                <h1 className="text-xl font-semibold text-slate-950 dark:text-white">
                  Deze pagina toont alleen auto-instructeurs en autopakketten.
                </h1>
                <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                  Zoek je motorrijles of vrachtwagen? Die hebben een eigen route met alleen
                  passend aanbod uit die categorie.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href="/motor">Naar motor</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href="/vrachtwagen">Naar vrachtwagen</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-slate-200 bg-white/88 p-4 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_18px_44px_-34px_rgba(15,23,42,0.42)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                  Populaire steden
                </p>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                  Lokale SEO-routes voor rijschool, automaat, schakel en specialistische lessen
                </h2>
                <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                  Zoek je direct in een specifieke stad, op automaat of op een specialistisch traject? Open dan een lokale route met alleen relevant aanbod uit die regio.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex flex-wrap gap-2">
                  {seoCityConfigs.slice(0, 6).map((city) => (
                    <Button
                      key={`city-${city.slug}`}
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                    >
                      <Link href={`/rijschool/${city.slug}`}>{city.name}</Link>
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {seoCityConfigs.slice(0, 4).map((city) => (
                    <Button
                      key={`automatic-${city.slug}`}
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                    >
                      <Link href={`/automaat/${city.slug}`}>
                        Automaat {city.name}
                      </Link>
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {seoCityConfigs.slice(0, 4).map((city) => (
                    <Button
                      key={`manual-${city.slug}`}
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                    >
                      <Link href={`/schakel/${city.slug}`}>
                        Schakel {city.name}
                      </Link>
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {seoCityConfigs.slice(0, 3).map((city) => (
                    <Button
                      key={`motor-${city.slug}`}
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                    >
                      <Link href={`/motor/${city.slug}`}>Motor {city.name}</Link>
                    </Button>
                  ))}
                  {seoCityConfigs.slice(0, 3).map((city) => (
                    <Button
                      key={`truck-${city.slug}`}
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                    >
                      <Link href={`/vrachtwagen/${city.slug}`}>
                        Vrachtwagen {city.name}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-slate-200 bg-white/88 p-4 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_18px_44px_-34px_rgba(15,23,42,0.42)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                  Zoekintentie pagina&apos;s
                </p>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                  Extra SEO-routes voor warme zoekintentie en langere zoekopdrachten
                </h2>
                <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                  Dit zijn de pagina&apos;s waarop mensen vaak binnenkomen als ze al dichter op een beslissing zitten of heel gericht zoeken naar een bepaald traject.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-4">
                {seoCityConfigs.slice(0, 4).map((city) => (
                  <Button
                    key={`spoed-${city.slug}`}
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    <Link href={`/spoedcursus/${city.slug}`}>
                      Spoed {city.name}
                    </Link>
                  </Button>
                ))}
                {seoCityConfigs.slice(0, 4).map((city) => (
                  <Button
                    key={`trial-${city.slug}`}
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    <Link href={`/proefles/${city.slug}`}>
                      Proefles {city.name}
                    </Link>
                  </Button>
                ))}
                {seoCityConfigs.slice(0, 4).map((city) => (
                  <Button
                    key={`exam-${city.slug}`}
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    >
                      <Link href={`/examengericht/${city.slug}`}>
                        Examengericht {city.name}
                      </Link>
                    </Button>
                ))}
                {seoCityConfigs.slice(0, 3).map((city) => (
                  <Button
                    key={`fear-${city.slug}`}
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    <Link href={`/faalangst/${city.slug}`}>
                      Faalangst {city.name}
                    </Link>
                  </Button>
                ))}
                {seoCityConfigs.slice(0, 3).map((city) => (
                  <Button
                    key={`refresh-${city.slug}`}
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    <Link href={`/opfriscursus/${city.slug}`}>
                      Opfriscursus {city.name}
                    </Link>
                  </Button>
                ))}
                {seoCityConfigs.slice(0, 3).map((city) => (
                  <Button
                    key={`exam-focus-${city.slug}`}
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    <Link href={`/praktijkexamen/${city.slug}`}>
                      Praktijkexamen {city.name}
                    </Link>
                  </Button>
                ))}
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href="/tips">Naar SEO tips</Link>
                </Button>
              </div>
            </div>
          </div>

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
