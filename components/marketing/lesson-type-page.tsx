"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { InstructorCard } from "@/components/instructors/instructor-card";
import { Reveal } from "@/components/marketing/homepage-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { getRijlesTypeLabel, rijlesTypeOptions } from "@/lib/lesson-types";
import { getPackageCoverObjectPosition } from "@/lib/package-covers";
import { getPackageVisualConfig } from "@/lib/package-visuals";
import type {
  InstructeurProfiel,
  Pakket,
  RijlesType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type LessonTypePageProps = {
  lessonType: RijlesType;
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  instructors: InstructeurProfiel[];
  packages: Pakket[];
};

function groupPackagesByInstructorId(packages: Pakket[]) {
  return packages.reduce<Record<string, Pakket[]>>((accumulator, pkg) => {
    if (!pkg.instructeur_id) {
      return accumulator;
    }

    if (!accumulator[pkg.instructeur_id]) {
      accumulator[pkg.instructeur_id] = [];
    }

    accumulator[pkg.instructeur_id].push(pkg);
    return accumulator;
  }, {});
}

export function LessonTypePage({
  lessonType,
  eyebrow,
  title,
  description,
  highlights,
  instructors,
  packages,
}: LessonTypePageProps) {
  const activeOption = rijlesTypeOptions.find((option) => option.value === lessonType);
  const packagesByInstructorId = groupPackagesByInstructorId(packages);

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_10%_16%,rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(29,78,216,0.18),transparent_26%),radial-gradient(circle_at_58%_62%,rgba(249,115,22,0.1),transparent_24%)]" />
        <div className="site-shell relative mx-auto w-full py-10 lg:py-16">
          <Reveal className="rounded-[2.5rem] border border-white/80 bg-white/90 p-6 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.22)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_28px_90px_-48px_rgba(15,23,42,0.62)] sm:p-8">
            <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {rijlesTypeOptions.map((option) => (
                    <Link
                      key={option.value}
                      href={option.href}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-xs font-semibold tracking-[0.18em] uppercase transition-all",
                        option.value === lessonType
                          ? "border-slate-950 bg-slate-950 text-white dark:border-sky-300/30 dark:bg-white/10"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/16 dark:hover:text-white"
                      )}
                    >
                      {option.label}
                    </Link>
                  ))}
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                    {eyebrow}
                  </p>
                  <h1 className="mt-4 max-w-[14ch] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[3.3rem]">
                    {title}
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                    {description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {highlights.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:shadow-[0_16px_34px_-28px_rgba(15,23,42,0.36)]"
                    >
                      <CheckCircle2 className="size-4 text-emerald-500 dark:text-emerald-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    label: "Actieve instructeurs",
                    value: `${instructors.length}`,
                    detail: `Profielen met ${activeOption?.label.toLowerCase()}-aanbod`,
                  },
                  {
                    label: "Zichtbare pakketten",
                    value: `${packages.length}`,
                    detail: "Direct gekoppeld aan deze categorie",
                  },
                  {
                    label: "Paginafocus",
                    value: activeOption?.label ?? getRijlesTypeLabel(lessonType),
                    detail: activeOption?.description ?? "",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-4 shadow-[0_20px_46px_-36px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_46px_-36px_rgba(15,23,42,0.42)]"
                  >
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="site-shell mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
        <Reveal className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                Instructeurs
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Instructeurs die {getRijlesTypeLabel(lessonType).toLowerCase()} aanbieden.
              </h2>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                Kies direct uit profielen waar deze categorie echt onderdeel is van het aanbod.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/instructeurs">
                Bekijk alle instructeurs
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          {instructors.length ? (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {instructors.map((instructor) => (
                <InstructorCard
                  key={instructor.id}
                  instructor={instructor}
                  packages={packagesByInstructorId[instructor.id] ?? []}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/80 p-8 text-sm leading-7 text-slate-600 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:shadow-[0_24px_70px_-42px_rgba(15,23,42,0.42)]">
              Er staan nog geen instructeurs live met {getRijlesTypeLabel(lessonType).toLowerCase()}-aanbod.
              Zodra een instructeur deze pakketten toevoegt in het dashboard, verschijnt het aanbod hier direct.
            </div>
          )}
        </Reveal>
      </section>

      <section className="site-shell mx-auto w-full px-4 py-4 sm:px-6 lg:px-8">
        <Reveal className="space-y-5">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
              Pakketten
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Pakketten en trajecten binnen {getRijlesTypeLabel(lessonType).toLowerCase()}.
            </h2>
            <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              Vergelijk aanbod op inhoud, prijs en instructeur zodat je sneller richting voelt.
            </p>
          </div>

          {packages.length ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {packages.map((pkg, index) => {
                const visual = getPackageVisualConfig(pkg.icon_key, pkg.visual_theme);
                const coverObjectPosition = getPackageCoverObjectPosition(
                  pkg.cover_position,
                  pkg.cover_focus_x,
                  pkg.cover_focus_y
                );
                const isLeadCard = pkg.uitgelicht || index === 0;
                const packagePoints = [
                  pkg.lessen
                    ? `${pkg.lessen} lessen als duidelijke basis`
                    : "Flexibel opgebouwd rond jouw tempo",
                  pkg.instructeur_naam
                    ? `Aangeboden door ${pkg.instructeur_naam}`
                    : "Platformaanbod binnen deze categorie",
                ];

                return (
                  <Card
                    key={pkg.id}
                    className={cn(
                      "group relative min-h-[29rem] overflow-hidden border shadow-[0_24px_80px_-42px_rgba(15,23,42,0.22)] transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1.5",
                      isLeadCard
                        ? "border-sky-300/16 bg-[linear-gradient(160deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96),rgba(14,165,233,0.18))] text-white hover:border-sky-300/28 hover:shadow-[0_38px_110px_-48px_rgba(14,165,233,0.42)] dark:border-sky-300/16"
                        : "border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] hover:border-slate-200 hover:shadow-[0_36px_100px_-44px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88),rgba(15,23,42,0.92))] dark:hover:border-white/16 dark:hover:shadow-[0_36px_100px_-44px_rgba(15,23,42,0.46)]"
                    )}
                  >
                    {pkg.cover_url ? (
                      <div
                        className={cn(
                          "relative z-10 mx-4 mt-4 h-28 overflow-hidden rounded-[1.1rem] border",
                          isLeadCard
                            ? "border-white/10"
                            : "border-slate-200/80 dark:border-white/10"
                        )}
                      >
                        <Image
                          src={pkg.cover_url}
                          alt={`Cover voor ${pkg.naam}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          style={{ objectPosition: coverObjectPosition }}
                        />
                        <div
                          className={cn(
                            "absolute inset-0",
                            isLeadCard
                              ? "bg-gradient-to-t from-slate-950/70 via-slate-950/18 to-transparent"
                              : "bg-gradient-to-t from-slate-950/35 via-slate-950/10 to-transparent"
                          )}
                        />
                      </div>
                    ) : null}

                    <CardHeader className="relative z-10 space-y-3 px-4 pb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          className={cn(
                            "border px-2 py-0.5 text-[9px] tracking-[0.14em]",
                            isLeadCard ? visual.featuredBadgeClass : visual.softBadgeClass
                          )}
                        >
                          {getRijlesTypeLabel(pkg.les_type)}
                        </Badge>
                        {pkg.uitgelicht ? (
                          <Badge
                            className={cn(
                              "border px-2 py-0.5 text-[9px] tracking-[0.14em]",
                              isLeadCard ? visual.featuredBadgeClass : visual.softBadgeClass
                            )}
                          >
                            Uitgelicht
                          </Badge>
                        ) : null}
                        {pkg.badge ? (
                          <Badge
                            className={cn(
                              "border px-2 py-0.5 text-[9px] tracking-[0.14em]",
                              isLeadCard ? visual.featuredBadgeClass : visual.softBadgeClass
                            )}
                          >
                            {pkg.badge}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-[1rem]",
                            isLeadCard ? visual.featuredIconClass : visual.softIconClass
                          )}
                        >
                          <visual.Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle
                            className={cn("text-[1rem]", isLeadCard ? "text-white" : "text-slate-950 dark:text-white")}
                          >
                            {pkg.naam}
                          </CardTitle>
                          <CardDescription
                            className={cn(
                              "mt-1.5 line-clamp-2 text-[13px] leading-6",
                              isLeadCard ? "text-white/72" : "text-slate-600 dark:text-slate-300"
                            )}
                          >
                            {pkg.beschrijving}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="relative z-10 flex flex-1 flex-col space-y-3.5 px-4 pb-4">
                      <div>
                        <p
                          className={cn(
                            "text-[1.75rem] font-semibold",
                            isLeadCard ? "text-white" : "text-slate-950 dark:text-white"
                          )}
                        >
                          {pkg.prijs === 0 ? "Op aanvraag" : formatCurrency(pkg.prijs)}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-[12px]",
                            isLeadCard ? "text-white/70" : "text-slate-500 dark:text-slate-300"
                          )}
                        >
                          {pkg.instructeur_naam
                            ? `Bij ${pkg.instructeur_naam}`
                            : "Platformaanbod"}
                        </p>
                      </div>

                      <div
                        className={cn(
                          "grid gap-1.5 rounded-[1.05rem] p-2.5",
                          isLeadCard
                            ? "border border-white/10 bg-white/8"
                            : "border border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/6"
                        )}
                      >
                        {packagePoints.map((item) => (
                          <div
                            key={item}
                            className={cn(
                              "flex items-start gap-2 rounded-[0.85rem] px-2.5 py-2 text-[12px] leading-5",
                              isLeadCard
                                ? "bg-white/6 text-white/82"
                                : "bg-white text-slate-600 dark:bg-white/6 dark:text-slate-300"
                            )}
                          >
                            <CheckCircle2
                              className={cn(
                                "mt-0.5 size-4 shrink-0",
                                isLeadCard ? "text-sky-200" : "text-emerald-500 dark:text-emerald-300"
                              )}
                            />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto" />

                      <Button asChild className="h-9 w-full rounded-full text-[13px]">
                        <Link href={pkg.instructeur_slug ? `/instructeurs/${pkg.instructeur_slug}` : "/registreren"}>
                          {pkg.instructeur_slug ? "Bekijk instructeur" : "Meer info"}
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/80 p-8 text-sm leading-7 text-slate-600 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:shadow-[0_24px_70px_-42px_rgba(15,23,42,0.42)]">
              Er staan nog geen zichtbare {getRijlesTypeLabel(lessonType).toLowerCase()}-pakketten live.
              Zodra instructeurs ze toevoegen in hun dashboard, verschijnen ze hier.
            </div>
          )}
        </Reveal>
      </section>
    </div>
  );
}
