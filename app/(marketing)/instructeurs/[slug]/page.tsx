import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";

import { InstructorAvailabilityPlanner } from "@/components/instructors/instructor-availability-planner";
import { LessonRequestDialog } from "@/components/instructors/lesson-request-dialog";
import { AutomaticInternalLinks } from "@/components/marketing/automatic-internal-links";
import { HoverTilt, Reveal } from "@/components/marketing/homepage-motion";
import { SeoBreadcrumbs } from "@/components/marketing/seo-breadcrumbs";
import { ReviewReportDialog } from "@/components/reviews/review-report-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAvailabilityMoment } from "@/lib/availability";
import {
  getInstructorAvailability,
  getInstructorReviews,
  getPublicInstructorBySlug,
} from "@/lib/data/instructors";
import { getPublicInstructorPackages } from "@/lib/data/packages";
import { ensureCurrentUserContext } from "@/lib/data/profiles";
import { getCurrentLearnerSchedulingAccessForInstructorSlug } from "@/lib/data/student-scheduling";
import { formatCurrency, getInitials } from "@/lib/format";
import { getRijlesTypeLabel, rijlesTypeOptions } from "@/lib/lesson-types";
import { getPackageCoverObjectPosition } from "@/lib/package-covers";
import { getPackageVisualConfig } from "@/lib/package-visuals";
import { normalizeCityForSlug } from "@/lib/seo-cities";

function transmissionLabel(value: string) {
  if (value === "automaat") return "Automaat";
  if (value === "handgeschakeld") return "Handgeschakeld";
  return "Automaat en schakel";
}

function getInstructorFocus(instructor: { specialisaties: string[] }) {
  const focus = instructor.specialisaties.slice(0, 2).join(" en ");
  return focus || "persoonlijke begeleiding";
}

function formatPriceLabel(price: number | null) {
  return price && price > 0 ? formatCurrency(price) : "Op aanvraag";
}

export default async function InstructeurDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const instructor = await getPublicInstructorBySlug(slug);

  if (!instructor) {
    notFound();
  }

  const [reviews, packages, planningAccess, currentUserContext] = await Promise.all([
    getInstructorReviews(slug),
    getPublicInstructorPackages(slug),
    getCurrentLearnerSchedulingAccessForInstructorSlug(slug),
    ensureCurrentUserContext(),
  ]);

  const slots = planningAccess.canViewAgenda
    ? await getInstructorAvailability(slug)
    : [];

  const packageTypeCount = new Set(packages.map((pkg) => pkg.les_type)).size;
  const packageGroups = rijlesTypeOptions
    .map((option) => ({
      ...option,
      packages: packages.filter((pkg) => pkg.les_type === option.value),
    }))
    .filter((group) => group.packages.length > 0);

  const primaryPackage =
    packageTypeCount <= 1
      ? packages.find((pkg) => pkg.uitgelicht) ?? packages[0] ?? null
      : packages.find((pkg) => pkg.uitgelicht) ?? packages[0] ?? null;

  const packagePriceCandidates = packages
    .map((pkg) => Number(pkg.prijs ?? 0))
    .filter((price) => Number.isFinite(price) && price > 0);
  const startingPackagePrice = packagePriceCandidates.length
    ? Math.min(...packagePriceCandidates)
    : 0;

  const nextPlanningMoment = planningAccess.canViewAgenda
    ? slots[0]?.start_at && slots[0]?.eind_at
      ? formatAvailabilityMoment(slots[0].start_at, slots[0].eind_at)
      : slots[0]
        ? `${slots[0].dag} - ${slots[0].tijdvak}`
        : "Nog geen moment vrijgegeven"
    : planningAccess.hasActiveRelationship
      ? "Wordt zichtbaar zodra deze instructeur zelf plannen voor jou vrijgeeft"
      : "Komt beschikbaar zodra je traject met deze instructeur actief is";

  const planningStateLabel = planningAccess.canViewAgenda
    ? "Zelf plannen staat aan"
    : planningAccess.hasActiveRelationship
      ? "Wacht op vrijgave"
      : "Nog afgeschermd";

  const averageScoreLabel = `${instructor.beoordeling.toFixed(1)}/5`;
  const citySlug = instructor.steden[0]
    ? normalizeCityForSlug(instructor.steden[0])
    : undefined;

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Instructeurs", href: "/instructeurs" },
    { label: instructor.volledige_naam, href: `/instructeurs/${instructor.slug}` },
  ];

  return (
    <div className="pb-16">
      <section className="relative overflow-hidden px-4 pt-10 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.18),transparent_22%),radial-gradient(circle_at_84%_14%,rgba(29,78,216,0.16),transparent_24%),radial-gradient(circle_at_56%_64%,rgba(249,115,22,0.12),transparent_24%)]" />
        <div className="site-shell relative mx-auto w-full py-8 lg:py-12">
          <SeoBreadcrumbs items={breadcrumbItems} className="mb-5" />

          <Reveal className="overflow-hidden rounded-[2.2rem] border border-white/80 bg-white/92 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88),rgba(15,23,42,0.96))]">
            <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="p-5 sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div
                    className={`flex size-24 shrink-0 items-center justify-center rounded-[1.9rem] bg-gradient-to-br ${instructor.profielfoto_kleur} text-2xl font-semibold text-white shadow-[0_22px_46px_-28px_rgba(15,23,42,0.42)]`}
                  >
                    {getInitials(instructor.volledige_naam)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-300/16 dark:bg-sky-400/10 dark:text-sky-100">
                        Instructeur profiel
                      </Badge>
                      <Badge className="border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
                        {transmissionLabel(instructor.transmissie)}
                      </Badge>
                      {instructor.beoordeling >= 4.9 ? (
                        <Badge className="border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-300/16 dark:bg-emerald-400/10 dark:text-emerald-100">
                          Top beoordeeld
                        </Badge>
                      ) : null}
                      {instructor.status === "goedgekeurd" ? (
                        <Badge className="border border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-300/16 dark:bg-violet-400/10 dark:text-violet-100">
                          Geverifieerd
                        </Badge>
                      ) : null}
                    </div>

                    <div>
                      <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2.8rem]">
                        {instructor.volledige_naam}
                      </h1>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                        {instructor.steden.join(" / ")}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-100 bg-violet-50/90 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:border-violet-300/16 dark:bg-violet-400/10 dark:text-violet-100">
                        <Star className="size-3.5 fill-current text-current" />
                        {averageScoreLabel}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                        {instructor.aantal_reviews} reviews
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                        {instructor.ervaring_jaren} jaar ervaring
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1.2rem] border border-slate-100 bg-slate-50/90 p-3 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6">
                        <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                          Vanaf
                        </p>
                        <p className="mt-1 text-[1.05rem] font-semibold text-slate-950 dark:text-white">
                          {formatPriceLabel(startingPackagePrice || instructor.prijs_per_les)}
                        </p>
                      </div>
                      <div className="rounded-[1.2rem] border border-slate-100 bg-slate-50/90 p-3 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6">
                        <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                          Werkgebied
                        </p>
                        <p className="mt-1 text-[1.05rem] font-semibold text-slate-950 dark:text-white">
                          {instructor.steden.length} regio&apos;s
                        </p>
                      </div>
                      <div className="rounded-[1.2rem] border border-slate-100 bg-slate-50/90 p-3 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6">
                        <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                          Lesstijl
                        </p>
                        <p className="mt-1 text-[1.05rem] font-semibold text-slate-950 dark:text-white">
                          {getInstructorFocus(instructor)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap">
                      <LessonRequestDialog
                        instructorName={instructor.volledige_naam}
                        instructorSlug={instructor.slug}
                        requestType="proefles"
                        availableSlots={planningAccess.canViewAgenda ? slots : []}
                        triggerLabel="Plan proefles"
                        triggerClassName="h-10 px-5 text-[13px]"
                      />
                      <LessonRequestDialog
                        instructorName={instructor.volledige_naam}
                        instructorSlug={instructor.slug}
                        selectedPackage={primaryPackage}
                        availableSlots={planningAccess.canViewAgenda ? slots : []}
                        triggerLabel={primaryPackage ? "Vraag pakket aan" : "Les aanvragen"}
                        triggerVariant="secondary"
                        triggerClassName="h-10 px-5 text-[13px]"
                      />
                      <Button asChild variant="outline" className="h-10 rounded-full px-5 text-[13px]">
                        <a href="#pakketten-en-trajecten">
                          Scroll naar pakketten
                          <ArrowRight className="size-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50/85 p-5 dark:border-white/10 dark:bg-white/[0.04] sm:p-7 xl:border-l xl:border-t-0">
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(224,242,254,0.88),rgba(255,255,255,0.92))] p-4 shadow-[0_22px_50px_-34px_rgba(14,165,233,0.22)] dark:border-sky-300/14 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.72),rgba(8,47,73,0.52),rgba(14,165,233,0.18))] dark:shadow-[0_22px_50px_-34px_rgba(15,23,42,0.5)]">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-sky-700 dark:bg-white/10 dark:text-sky-100">
                        <CalendarClock className="size-4" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold tracking-[0.18em] text-sky-700 uppercase dark:text-sky-100">
                          Planningstatus
                        </p>
                        <p className="text-base font-semibold text-slate-950 dark:text-white">
                          {planningStateLabel}
                        </p>
                        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {planningAccess.canViewAgenda
                            ? "Je kunt nu direct een geschikt moment kiezen uit de agenda van deze instructeur."
                            : planningAccess.hasActiveRelationship
                              ? "Je traject is al actief. Zodra deze instructeur plannen voor jou vrijgeeft, verschijnt de agenda hieronder."
                              : "Vraag eerst een proefles of pakket aan. Daarna kan de instructeur jouw agenda-toegang vrijgeven."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-[1.25rem] border border-slate-200 bg-white/92 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6">
                      <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                        Eerstvolgende moment
                      </p>
                      <p className="mt-1 text-[13px] font-semibold leading-6 text-slate-950 dark:text-white">
                        {nextPlanningMoment}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-slate-200 bg-white/92 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6">
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-sky-200">
                          <ShieldCheck className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">
                            Agenda pas zichtbaar na relatie
                          </p>
                          <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            De instructeur bepaalt per leerling wanneer zelf inplannen open mag.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[1.25rem] border border-slate-200 bg-white/92 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6">
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-sky-200">
                          <MapPin className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">
                            Rustige flow
                          </p>
                          <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            Eerst vertrouwen, daarna pas agenda en vervolgplanning.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section
        id="pakketten-en-trajecten"
        className="site-shell mx-auto w-full scroll-mt-28 px-4 py-6 sm:px-6 lg:px-8"
      >
        <Reveal className="space-y-4">
          <div className="max-w-3xl space-y-2">
            <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
              Pakketten
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Kies een traject dat past bij je doel en tempo.
            </h2>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              De pakketten staan nu vooraan in de flow, zodat je eerst kunt bepalen welk
              traject logisch voelt en daarna direct kunt aanvragen.
            </p>
          </div>

          {packageGroups.length ? (
            <div className="space-y-5">
              {packageGroups.map((group) => (
                <div key={group.value} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge className="border border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-300/16 dark:bg-sky-400/10 dark:text-sky-100">
                      {group.label}
                    </Badge>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      {group.description}
                    </p>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    {group.packages.map((pkg, index) => {
                      const visual = getPackageVisualConfig(
                        pkg.icon_key,
                        pkg.visual_theme
                      );
                      const coverObjectPosition = getPackageCoverObjectPosition(
                        pkg.cover_position,
                        pkg.cover_focus_x,
                        pkg.cover_focus_y
                      );
                      const isPrimaryPackage = pkg.uitgelicht || index === 0;

                      return (
                        <HoverTilt
                          key={pkg.id}
                          className="relative rounded-[1.45rem] [perspective:1200px]"
                        >
                          <Card
                            className={`overflow-hidden border p-0 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.22)] ${
                              isPrimaryPackage
                                ? visual.featuredCardClass
                                : visual.softCardClass
                            }`}
                          >
                            {pkg.cover_url ? (
                              <div className="relative h-28 overflow-hidden">
                                <Image
                                  src={pkg.cover_url}
                                  alt={`Cover voor ${pkg.naam}`}
                                  fill
                                  sizes="(max-width: 1280px) 100vw, 50vw"
                                  className="object-cover"
                                  style={{ objectPosition: coverObjectPosition }}
                                />
                                <div
                                  className={`absolute inset-0 ${
                                    isPrimaryPackage
                                      ? "bg-gradient-to-t from-slate-950/72 via-slate-950/18 to-transparent"
                                      : "bg-gradient-to-t from-slate-950/35 via-slate-950/10 to-transparent"
                                  }`}
                                />
                              </div>
                            ) : null}

                            <CardContent className="space-y-4 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[1rem] font-semibold text-slate-950 dark:text-white">
                                      {pkg.naam}
                                    </p>
                                    <Badge
                                      className={
                                        isPrimaryPackage
                                          ? visual.featuredBadgeClass
                                          : visual.softBadgeClass
                                      }
                                    >
                                      {getRijlesTypeLabel(pkg.les_type)}
                                    </Badge>
                                    {pkg.uitgelicht ? (
                                      <Badge className={visual.featuredBadgeClass}>
                                        Uitgelicht
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <p
                                    className={`mt-2 line-clamp-2 text-[13px] leading-6 ${
                                      isPrimaryPackage
                                        ? "text-white/76"
                                        : "text-slate-600 dark:text-slate-300"
                                    }`}
                                  >
                                    {pkg.beschrijving}
                                  </p>
                                </div>
                                <div
                                  className={`flex size-10 shrink-0 items-center justify-center rounded-[1rem] ${
                                    isPrimaryPackage
                                      ? visual.featuredIconClass
                                      : visual.softIconClass
                                  }`}
                                >
                                  <visual.Icon className="size-4" />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div
                                  className={`rounded-[0.95rem] px-3 py-2.5 ${
                                    isPrimaryPackage ? "bg-white/10" : "bg-white/90"
                                  }`}
                                >
                                  <p
                                    className={`text-[9px] font-semibold tracking-[0.14em] uppercase ${
                                      isPrimaryPackage
                                        ? "text-white/65"
                                        : "text-slate-500 dark:text-slate-400"
                                    }`}
                                  >
                                    Prijs
                                  </p>
                                  <p className="mt-1 text-[14px] font-semibold text-slate-950 dark:text-white">
                                    {formatPriceLabel(Number(pkg.prijs ?? 0))}
                                  </p>
                                </div>
                                <div
                                  className={`rounded-[0.95rem] px-3 py-2.5 ${
                                    isPrimaryPackage ? "bg-white/10" : "bg-white/90"
                                  }`}
                                >
                                  <p
                                    className={`text-[9px] font-semibold tracking-[0.14em] uppercase ${
                                      isPrimaryPackage
                                        ? "text-white/65"
                                        : "text-slate-500 dark:text-slate-400"
                                    }`}
                                  >
                                    Lessen
                                  </p>
                                  <p className="mt-1 text-[14px] font-semibold text-slate-950 dark:text-white">
                                    {pkg.lessen || "Flexibel"}
                                  </p>
                                </div>
                              </div>

                              <LessonRequestDialog
                                instructorName={instructor.volledige_naam}
                                instructorSlug={instructor.slug}
                                selectedPackage={pkg}
                                availableSlots={planningAccess.canViewAgenda ? slots : []}
                                triggerLabel="Vraag dit pakket aan"
                                triggerClassName="h-10 w-full text-[13px]"
                              />
                            </CardContent>
                          </Card>
                        </HoverTilt>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm leading-7 text-slate-600 dark:border-white/12 dark:bg-white/5 dark:text-slate-300">
              Deze instructeur heeft nog geen losse trajecten gepubliceerd. Je kunt wel direct
              een lesaanvraag of proefles starten.
            </Card>
          )}
        </Reveal>
      </section>

      <section className="site-shell mx-auto w-full px-4 py-2 sm:px-6 lg:px-8">
        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <Card className="rounded-[1.8rem] border-0 bg-white/92 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
              <CardHeader className="pb-3">
                <CardTitle>Profiel en lesstijl</CardTitle>
                <CardDescription>
                  Zo geeft {instructor.volledige_naam} vorm aan de begeleiding.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-[15px]">
                  {instructor.bio}
                </p>

                <div className="flex flex-wrap gap-2">
                  {instructor.specialisaties.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: "Werkgebied",
                      value: instructor.steden.join(" / "),
                    },
                    {
                      label: "Transmissie",
                      value: transmissionLabel(instructor.transmissie),
                    },
                    {
                      label: "Focus",
                      value: getInstructorFocus(instructor),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-3 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6"
                    >
                      <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-1.5 text-[13px] leading-6 font-medium text-slate-950 dark:text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Reveal>

          <div id="plan-afspraak" className="scroll-mt-28">
            <Reveal delay={0.06}>
              <div className="space-y-4">
                <div className="max-w-3xl space-y-2">
                  <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                    Beschikbaarheid
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                    Bekijk hoe planning voor deze instructeur werkt.
                  </h2>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                    De planner blijft hetzelfde, maar staat nu rustiger in de flow na profiel en
                    pakketten.
                  </p>
                </div>

                {planningAccess.canViewAgenda ? (
                  <InstructorAvailabilityPlanner
                    instructorName={instructor.volledige_naam}
                    instructorSlug={instructor.slug}
                    slots={slots}
                  />
                ) : (
                  <Card className="rounded-[1.8rem] border-0 bg-white/92 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={planningAccess.hasActiveRelationship ? "warning" : "info"}
                        >
                          {planningAccess.hasActiveRelationship
                            ? "Wacht op vrijgave"
                            : "Nog afgeschermd"}
                        </Badge>
                      </div>
                      <CardTitle>
                        {planningAccess.hasActiveRelationship
                          ? "Je traject is actief, maar de agenda wacht nog op vrijgave"
                          : "De agenda opent zodra je traject met deze instructeur actief is"}
                      </CardTitle>
                      <CardDescription>
                        {planningAccess.hasActiveRelationship
                          ? "Zodra deze instructeur zelf inplannen voor jou aanzet, verschijnen hier de beschikbare momenten."
                          : "Eerst vraag je een proefles of pakket aan. Daarna kan de instructeur plannen vrijgeven wanneer dat logisch is."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        {[
                          {
                            label: "Stap 1",
                            value: "Vraag een pakket of proefles aan",
                          },
                          {
                            label: "Stap 2",
                            value: "Ga verder in een actief traject",
                          },
                          {
                            label: "Stap 3",
                            value: "De instructeur zet zelf plannen aan",
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/6"
                          >
                            <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                              {item.label}
                            </p>
                            <p className="mt-2 text-[13px] leading-6 font-medium text-slate-950 dark:text-white">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <LessonRequestDialog
                          instructorName={instructor.volledige_naam}
                          instructorSlug={instructor.slug}
                          selectedPackage={primaryPackage}
                          availableSlots={[]}
                          triggerLabel={primaryPackage ? "Vraag pakket aan" : "Les aanvragen"}
                          triggerClassName="h-10 text-[13px]"
                        />
                        <LessonRequestDialog
                          instructorName={instructor.volledige_naam}
                          instructorSlug={instructor.slug}
                          requestType="proefles"
                          availableSlots={[]}
                          triggerLabel="Plan proefles"
                          triggerVariant="secondary"
                          triggerClassName="h-10 text-[13px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="site-shell mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
        <Reveal className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                Reviews
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Echte ervaringen van leerlingen.
              </h2>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                Compacte reviewkaarten met score, titel, korte tekst en eventuele reactie van
                de instructeur.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white/92 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
              {averageScoreLabel} uit {instructor.aantal_reviews} reviews
            </div>
          </div>

          {reviews.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {reviews.map((review) => (
                <HoverTilt key={review.id} className="relative rounded-[1.45rem] [perspective:1200px]">
                  <Card className="rounded-[1.45rem] border border-slate-200/80 bg-white/92 shadow-[0_22px_56px_-38px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_22px_56px_-38px_rgba(15,23,42,0.5)]">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-semibold text-slate-950 dark:text-white">
                            {review.titel}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {review.leerling_naam} / {review.datum}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="warning">{review.score} sterren</Badge>
                          {currentUserContext ? (
                            <ReviewReportDialog
                              reviewId={review.id}
                              reviewTitle={review.titel}
                            />
                          ) : null}
                        </div>
                      </div>

                      <p className="line-clamp-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {review.tekst}
                      </p>

                      {review.antwoord_tekst ? (
                        <div className="rounded-[1rem] border border-sky-100 bg-sky-50/80 p-3 dark:border-sky-300/12 dark:bg-sky-400/10">
                          <p className="text-[10px] font-semibold tracking-[0.16em] text-sky-700 uppercase dark:text-sky-100">
                            Reactie van instructeur
                          </p>
                          <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                            {review.antwoord_tekst}
                          </p>
                          {review.antwoord_datum ? (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Geplaatst op {review.antwoord_datum}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </HoverTilt>
              ))}
            </div>
          ) : (
            <Card className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm leading-7 text-slate-600 dark:border-white/12 dark:bg-white/5 dark:text-slate-300">
              Er zijn nog geen reviews beschikbaar voor dit profiel.
            </Card>
          )}
        </Reveal>
      </section>

      <section className="site-shell mx-auto w-full px-4 pt-2 sm:px-6 lg:px-8">
        <Reveal>
          <AutomaticInternalLinks
            citySlug={citySlug}
            currentPath={`/instructeurs/${instructor.slug}`}
            title="Verder vergelijken"
            description={`Sterke interne links rond ${instructor.steden[0] ?? "deze regio"} die bezoekers en zoekmachines helpen om logisch door te klikken.`}
            limit={8}
          />
        </Reveal>
      </section>
    </div>
  );
}
