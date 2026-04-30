import Image from "next/image";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
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
import type {
  getInstructorAvailability,
  getInstructorReviews,
  getPublicInstructorBySlug,
} from "@/lib/data/instructors";
import type { getPublicInstructorPackages } from "@/lib/data/packages";
import type { ensureCurrentUserContext } from "@/lib/data/profiles";
import type { getCurrentLearnerSchedulingAccessForInstructorSlug } from "@/lib/data/student-scheduling";
import { formatCurrency, getInitials } from "@/lib/format";
import { getRijlesTypeLabel, rijlesTypeOptions } from "@/lib/lesson-types";
import { getPackageCoverObjectPosition } from "@/lib/package-covers";
import { getPackageVisualConfig } from "@/lib/package-visuals";
import { normalizeCityForSlug } from "@/lib/seo-cities";

type PublicInstructor = NonNullable<Awaited<ReturnType<typeof getPublicInstructorBySlug>>>;
type InstructorReviews = Awaited<ReturnType<typeof getInstructorReviews>>;
type PublicInstructorPackages = Awaited<ReturnType<typeof getPublicInstructorPackages>>;
type InstructorSlots = Awaited<ReturnType<typeof getInstructorAvailability>>;
type PlanningAccess = Awaited<ReturnType<typeof getCurrentLearnerSchedulingAccessForInstructorSlug>>;
type CurrentUserContext = Awaited<ReturnType<typeof ensureCurrentUserContext>>;

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

function getPackageFallbackCover(lessonType?: string | null) {
  if (lessonType === "motor") {
    return "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80";
  }

  if (lessonType === "vrachtwagen") {
    return "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80";
  }

  return "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80";
}

export function InstructorDetailContent({
  instructor,
  reviews,
  packages,
  planningAccess,
  currentUserContext,
  slots,
}: {
  instructor: PublicInstructor;
  reviews: InstructorReviews;
  packages: PublicInstructorPackages;
  planningAccess: PlanningAccess;
  currentUserContext: CurrentUserContext;
  slots: InstructorSlots;
}) {
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

  const planningStateLabel = planningAccess.publicBookingEnabled
    ? "Online boeking staat aan"
    : planningAccess.directBookingAllowed
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
    <div className="pb-14">
      <section className="relative overflow-hidden px-4 pt-8 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.13),transparent_25%),radial-gradient(circle_at_84%_14%,rgba(29,78,216,0.11),transparent_28%)]" />
        <div className="site-shell relative mx-auto w-full py-6 lg:py-10">
          <SeoBreadcrumbs items={breadcrumbItems} className="mb-4" />

          <Reveal className="surface-panel overflow-hidden rounded-[1.75rem]">
            <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div
                    className={`flex size-20 shrink-0 items-center justify-center rounded-[1.7rem] bg-gradient-to-br ${instructor.profielfoto_kleur} text-[1.35rem] font-semibold text-white shadow-[0_22px_46px_-28px_rgba(15,23,42,0.42)]`}
                  >
                    {getInitials(instructor.volledige_naam)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
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
                      {planningAccess.publicBookingEnabled ? (
                        <Badge className="border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-300/16 dark:bg-emerald-400/10 dark:text-emerald-100">
                          Online boeken open
                        </Badge>
                      ) : null}
                    </div>

                    <div>
                      <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2.55rem]">
                        {instructor.volledige_naam}
                      </h1>
                      <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
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

                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-[1.2rem] border border-slate-100 bg-slate-50/90 p-2.5 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6">
                        <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                          Vanaf
                        </p>
                        <p className="mt-1 text-[0.98rem] font-semibold text-slate-950 dark:text-white">
                          {formatPriceLabel(startingPackagePrice || instructor.prijs_per_les)}
                        </p>
                      </div>
                      <div className="rounded-[1.2rem] border border-slate-100 bg-slate-50/90 p-2.5 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6">
                        <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                          Werkgebied
                        </p>
                        <p className="mt-1 text-[0.98rem] font-semibold text-slate-950 dark:text-white">
                          {instructor.steden.length} regio&apos;s
                        </p>
                      </div>
                      <div className="rounded-[1.2rem] border border-slate-100 bg-slate-50/90 p-2.5 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6">
                        <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                          Lesstijl
                        </p>
                        <p className="mt-1 text-[0.98rem] font-semibold text-slate-950 dark:text-white">
                          {getInstructorFocus(instructor)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
                      {planningAccess.trialLessonAvailable ? (
                        <LessonRequestDialog
                          instructorName={instructor.volledige_naam}
                          instructorSlug={instructor.slug}
                          requestType="proefles"
                          availableSlots={planningAccess.canViewAgenda ? slots : []}
                          directBookingEnabled={planningAccess.directBookingAllowed}
                          defaultDurationMinutes={
                            instructor.standaard_proefles_duur_minuten ?? 50
                          }
                          weeklyBookingLimitMinutes={
                            planningAccess.weeklyBookingLimitMinutes
                          }
                          bookedMinutesByWeekStart={
                            planningAccess.bookedMinutesByWeekStart
                          }
                          weeklyRemainingMinutesThisWeek={
                            planningAccess.weeklyRemainingMinutesThisWeek
                          }
                          triggerLabel={
                            planningAccess.directBookingAllowed
                              ? "Plan proefles"
                              : planningAccess.canViewAgenda
                                ? "Vraag proefles op moment aan"
                                : "Plan proefles"
                          }
                          triggerClassName="h-9 px-5 text-[13px]"
                        />
                      ) : null}
                      <LessonRequestDialog
                        instructorName={instructor.volledige_naam}
                        instructorSlug={instructor.slug}
                        selectedPackage={primaryPackage}
                        availableSlots={planningAccess.canViewAgenda ? slots : []}
                        directBookingEnabled={planningAccess.directBookingAllowed}
                        defaultDurationMinutes={
                          primaryPackage
                            ? instructor.standaard_pakketles_duur_minuten ?? 90
                            : instructor.standaard_rijles_duur_minuten ?? 60
                        }
                        weeklyBookingLimitMinutes={
                          planningAccess.weeklyBookingLimitMinutes
                        }
                        bookedMinutesByWeekStart={
                          planningAccess.bookedMinutesByWeekStart
                        }
                        weeklyRemainingMinutesThisWeek={
                          planningAccess.weeklyRemainingMinutesThisWeek
                        }
                        triggerLabel={primaryPackage ? "Vraag pakket aan" : "Les aanvragen"}
                        triggerVariant="secondary"
                        triggerClassName="h-9 px-5 text-[13px]"
                      />
                      <Button asChild variant="outline" className="h-9 rounded-full px-5 text-[13px]">
                        <a href="#pakketten-en-trajecten">
                          Scroll naar pakketten
                          <ArrowRight className="size-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50/85 p-3.5 dark:border-white/10 dark:bg-white/[0.04] sm:p-4 xl:border-l xl:border-t-0">
                <div className="space-y-2.5">
                  <div className="rounded-[1.25rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(224,242,254,0.88),rgba(255,255,255,0.92))] p-3 shadow-[0_22px_50px_-34px_rgba(14,165,233,0.22)] dark:border-sky-300/14 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.72),rgba(8,47,73,0.52),rgba(14,165,233,0.18))] dark:shadow-[0_22px_50px_-34px_rgba(15,23,42,0.5)]">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-sky-700 dark:bg-white/10 dark:text-sky-100">
                        <CalendarClock className="size-4" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold tracking-[0.18em] text-sky-700 uppercase dark:text-sky-100">
                          Planningstatus
                        </p>
                        <p className="text-base font-semibold text-slate-950 dark:text-white">
                          {planningStateLabel}
                        </p>
                        <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                          {planningAccess.publicBookingEnabled
                            ? planningAccess.directBookingAllowed
                              ? "Kies een vrij moment uit de live agenda en rond direct af."
                              : "Log in als leerling om een gekozen tijdvak vast te zetten."
                            : planningAccess.directBookingAllowed
                              ? "Kies een moment en laat het direct inplannen."
                            : planningAccess.canViewAgenda
                              ? "Kies een live moment als duidelijke voorkeur."
                            : planningAccess.hasActiveRelationship
                              ? "Je traject is actief; agenda-toegang volgt na vrijgave."
                              : planningAccess.trialLessonAvailable
                                ? "Vraag eerst een proefles of pakket aan."
                                : "Vraag eerst een les of pakket aan."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="rounded-[1.05rem] border border-slate-200 bg-white/92 p-3 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6">
                      <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                        Eerstvolgende moment
                      </p>
                      <p className="mt-1 text-[13px] font-semibold leading-6 text-slate-950 dark:text-white">
                        {nextPlanningMoment}
                      </p>
                    </div>
                    <div className="rounded-[1.05rem] border border-slate-200 bg-white/92 p-3 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6">
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-sky-200">
                          <ShieldCheck className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">
                            {planningAccess.publicBookingEnabled
                              ? "Online boeken staat open"
                              : "Agenda op vrijgave"}
                          </p>
                          <p className="mt-1 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                            {planningAccess.publicBookingEnabled
                              ? "Ingelogde leerlingen kunnen een kalenderblok gebruiken."
                              : "Zelf plannen opent per leerling of traject."}
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
        className="site-shell mx-auto w-full scroll-mt-28 px-4 py-5 sm:px-6 lg:px-8"
      >
        <Reveal className="space-y-4">
          <div className="max-w-3xl space-y-2">
            <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
              Pakketten
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Kies een traject dat past bij je doel en tempo.
            </h2>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              De pakketten staan nu vooraan in de flow, zodat je eerst kunt bepalen welk
              traject logisch voelt en daarna direct kunt aanvragen.
            </p>
          </div>

          {packageGroups.length ? (
            <div className="space-y-4">
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

                  <div className="grid gap-3 xl:grid-cols-2">
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
                      const displayCoverUrl =
                        pkg.cover_url ?? getPackageFallbackCover(pkg.les_type);
                      const isPrimaryPackage = pkg.uitgelicht || index === 0;
                      const packagePoints = [
                        pkg.lessen
                          ? `${pkg.lessen} lessen als duidelijke basis`
                          : "Flexibel opgebouwd rond jouw tempo",
                        pkg.labels?.[0]
                          ? `${pkg.labels[0]} als extra focus in dit traject`
                          : pkg.praktijk_examen_prijs !== null &&
                              pkg.praktijk_examen_prijs !== undefined
                            ? "Praktijk-examen kan apart worden toegevoegd"
                            : "Boekingen en voortgang blijven netjes gekoppeld",
                      ];

                      return (
                        <HoverTilt
                          key={pkg.id}
                          className="relative h-full rounded-[1.45rem] [perspective:1200px]"
                        >
                          <Card
                            className={`group relative flex h-full min-h-[22.75rem] flex-col overflow-hidden border p-0 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.22)] transition-[transform,box-shadow,border-color] duration-500 ${
                              isPrimaryPackage
                                ? `${visual.featuredCardClass} hover:shadow-[0_38px_110px_-48px_rgba(14,165,233,0.42)]`
                                : `${visual.softCardClass} hover:shadow-[0_36px_100px_-44px_rgba(15,23,42,0.2)]`
                            }`}
                          >
                            {displayCoverUrl ? (
                              <div
                                className={`relative z-10 mx-3 mt-3 h-20 overflow-hidden rounded-[0.9rem] border ${
                                  isPrimaryPackage
                                    ? "border-white/10"
                                    : "border-slate-200/80 dark:border-white/10"
                                }`}
                              >
                                <Image
                                  src={displayCoverUrl}
                                  alt={`Cover voor ${pkg.naam}`}
                                  fill
                                  sizes="(max-width: 1280px) 100vw, 50vw"
                                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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

                            <CardHeader className="relative z-10 space-y-2 px-3 pb-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge
                                  className={`border px-2 py-0.5 text-[9px] tracking-[0.14em] ${
                                    isPrimaryPackage
                                      ? visual.featuredBadgeClass
                                      : visual.softBadgeClass
                                  }`}
                                >
                                  {getRijlesTypeLabel(pkg.les_type)}
                                </Badge>
                                {pkg.badge ? (
                                  <Badge
                                    className={`border px-2 py-0.5 text-[9px] tracking-[0.14em] ${
                                      isPrimaryPackage
                                        ? visual.featuredBadgeClass
                                        : visual.softBadgeClass
                                    }`}
                                  >
                                    {pkg.badge}
                                  </Badge>
                                ) : null}
                                {pkg.uitgelicht ? (
                                  <Badge
                                    className={`border px-2 py-0.5 text-[9px] tracking-[0.14em] ${
                                      isPrimaryPackage
                                        ? visual.featuredBadgeClass
                                        : visual.softBadgeClass
                                    }`}
                                  >
                                    Uitgelicht
                                  </Badge>
                                ) : null}
                              </div>

                              <div className="flex items-start gap-2.5">
                                <div
                                  className={`flex size-9 shrink-0 items-center justify-center rounded-[1rem] ${
                                    isPrimaryPackage
                                      ? visual.featuredIconClass
                                      : visual.softIconClass
                                  }`}
                                >
                                  <visual.Icon className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <CardTitle
                                    className={`text-[1rem] ${
                                      isPrimaryPackage
                                        ? "text-white"
                                        : "text-slate-950 dark:text-white"
                                    }`}
                                  >
                                    {pkg.naam}
                                  </CardTitle>
                                  <CardDescription
                                    className={`mt-1 line-clamp-1 text-[12px] leading-5 ${
                                      isPrimaryPackage
                                        ? "text-white/72"
                                        : "text-slate-600 dark:text-slate-300"
                                    }`}
                                  >
                                    {pkg.beschrijving}
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent className="relative z-10 flex flex-1 flex-col space-y-2 px-3 pb-3">
                              <div>
                                <p
                                  className={`text-[1.3rem] font-semibold ${
                                    isPrimaryPackage
                                      ? "text-white"
                                      : "text-slate-950 dark:text-white"
                                  }`}
                                >
                                  {formatPriceLabel(Number(pkg.prijs ?? 0))}
                                </p>
                                <p
                                  className={`mt-0.5 text-[11px] ${
                                    isPrimaryPackage
                                      ? "text-white/70"
                                      : "text-slate-500 dark:text-slate-300"
                                  }`}
                                >
                                  {pkg.lessen
                                    ? `${pkg.lessen} lessen inbegrepen`
                                    : "Persoonlijk samengesteld traject"}
                                </p>
                                {pkg.praktijk_examen_prijs !== null &&
                                pkg.praktijk_examen_prijs !== undefined ? (
                                  <p
                                    className={`mt-0.5 text-[11px] font-medium ${
                                      isPrimaryPackage
                                        ? "text-white/78"
                                        : "text-slate-700 dark:text-slate-200"
                                    }`}
                                  >
                                    Praktijk-examen{" "}
                                    {formatPriceLabel(Number(pkg.praktijk_examen_prijs))}
                                  </p>
                                ) : null}
                              </div>

                              <div
                                className={`grid gap-1.5 rounded-[0.9rem] p-1.5 ${
                                  isPrimaryPackage
                                    ? "border border-white/10 bg-white/8"
                                    : "border border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/6"
                                }`}
                              >
                                <div className="grid gap-1.5 sm:grid-cols-2">
                                  <div
                                    className={`rounded-[0.8rem] px-2 py-1.5 ${
                                      isPrimaryPackage
                                        ? "bg-white/10 text-white"
                                        : "bg-white text-slate-950 dark:bg-white/6 dark:text-white"
                                    }`}
                                  >
                                    <p
                                      className={`text-[9px] font-semibold tracking-[0.14em] uppercase ${
                                        isPrimaryPackage
                                          ? "text-white/62"
                                          : "text-slate-500 dark:text-slate-400"
                                      }`}
                                    >
                                      Prijs
                                    </p>
                                    <p className="mt-0.5 text-[12px] font-semibold">
                                      {formatPriceLabel(Number(pkg.prijs ?? 0))}
                                    </p>
                                  </div>

                                  <div
                                    className={`rounded-[0.8rem] px-2 py-1.5 ${
                                      isPrimaryPackage
                                        ? "bg-white/10 text-white"
                                        : "bg-white text-slate-950 dark:bg-white/6 dark:text-white"
                                    }`}
                                  >
                                    <p
                                      className={`text-[9px] font-semibold tracking-[0.14em] uppercase ${
                                        isPrimaryPackage
                                          ? "text-white/62"
                                          : "text-slate-500 dark:text-slate-400"
                                      }`}
                                    >
                                      Inhoud
                                    </p>
                                    <p className="mt-0.5 text-[12px] font-semibold">
                                      {pkg.lessen ? `${pkg.lessen} lessen` : "Maatwerk traject"}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid gap-1.5">
                                  {packagePoints.map((item) => (
                                    <div
                                      key={item}
                                      className={`flex items-start gap-2 rounded-[0.8rem] px-2 py-1.5 text-[11px] leading-5 ${
                                        isPrimaryPackage
                                          ? "bg-white/6 text-white/82"
                                          : "bg-white text-slate-600 dark:bg-white/6 dark:text-slate-300"
                                      }`}
                                    >
                                      <CheckCircle2
                                        className={`mt-0.5 size-4 shrink-0 ${
                                          isPrimaryPackage
                                            ? "text-sky-200"
                                            : "text-emerald-500 dark:text-emerald-300"
                                        }`}
                                      />
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="mt-auto" />

                              <LessonRequestDialog
                                instructorName={instructor.volledige_naam}
                                instructorSlug={instructor.slug}
                                selectedPackage={pkg}
                                availableSlots={planningAccess.canViewAgenda ? slots : []}
                                directBookingEnabled={planningAccess.directBookingAllowed}
                                defaultDurationMinutes={
                                  instructor.standaard_pakketles_duur_minuten ?? 90
                                }
                                weeklyBookingLimitMinutes={
                                  planningAccess.weeklyBookingLimitMinutes
                                }
                                bookedMinutesByWeekStart={
                                  planningAccess.bookedMinutesByWeekStart
                                }
                                weeklyRemainingMinutesThisWeek={
                                  planningAccess.weeklyRemainingMinutesThisWeek
                                }
                                triggerLabel="Vraag dit pakket aan"
                                triggerClassName="!h-8 !w-full !rounded-full !text-[12px]"
                              />
                            </CardContent>

                            {isPrimaryPackage ? (
                              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.14),transparent_30%)]" />
                            ) : null}
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
              {planningAccess.trialLessonAvailable
                ? "een lesaanvraag of proefles starten."
                : "een lesaanvraag starten."}
            </Card>
          )}
        </Reveal>
      </section>

      <section className="site-shell mx-auto w-full px-4 py-2 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div id="plan-afspraak" className="scroll-mt-28">
            <Reveal>
              <div className="space-y-3">
                <div className="max-w-4xl space-y-2">
                  <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                    Beschikbaarheid
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                    Kies een beschikbaar moment.
                  </h2>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                    Bekijk open momenten en rond je aanvraag of boeking zonder extra uitlegblokken af.
                  </p>
                </div>

                {planningAccess.canViewAgenda ? (
                  <InstructorAvailabilityPlanner
                    instructorName={instructor.volledige_naam}
                    instructorSlug={instructor.slug}
                    slots={slots}
                    directBookingEnabled={planningAccess.directBookingAllowed}
                    publicBookingEnabled={planningAccess.publicBookingEnabled}
                    trialLessonAvailable={planningAccess.trialLessonAvailable}
                    regularLessonDurationMinutes={
                      instructor.standaard_rijles_duur_minuten ?? 60
                    }
                    trialLessonDurationMinutes={
                      instructor.standaard_proefles_duur_minuten ?? 50
                    }
                    weeklyBookingLimitMinutes={
                      planningAccess.weeklyBookingLimitMinutes
                    }
                    weeklyBookingLimitSource={
                      planningAccess.weeklyBookingLimitSource
                    }
                    bookedMinutesByWeekStart={
                      planningAccess.bookedMinutesByWeekStart
                    }
                    weeklyRemainingMinutesThisWeek={
                      planningAccess.weeklyRemainingMinutesThisWeek
                    }
                  />
                ) : (
                  <Card className="rounded-[1.6rem] border-0 bg-white/92 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
                    <CardHeader className="pb-2.5">
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
                          ? "Zodra deze instructeur zelf inplannen voor jou aanzet of online boeking openzet, verschijnen hier de beschikbare momenten."
                          : planningAccess.trialLessonAvailable
                            ? "Eerst vraag je een proefles of pakket aan. Daarna kan de instructeur plannen vrijgeven of online boeking openen wanneer dat logisch is."
                            : "Eerst vraag je een les of pakket aan. Daarna kan de instructeur plannen vrijgeven of online boeking openen wanneer dat logisch is."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-2.5 md:grid-cols-3">
                        {[
                          {
                            label: "Stap 1",
                            value: planningAccess.trialLessonAvailable
                              ? "Vraag een pakket of proefles aan"
                              : "Vraag een pakket of les aan",
                          },
                          {
                            label: "Stap 2",
                            value: "Ga verder in een actief traject",
                          },
                          {
                            label: "Stap 3",
                            value: "De instructeur zet zelf plannen of online boeking aan",
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-2.5 dark:border-white/10 dark:bg-white/6"
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

                      <div
                        className={
                          planningAccess.trialLessonAvailable
                            ? "grid gap-2 sm:grid-cols-2"
                            : "grid gap-2 sm:grid-cols-1"
                        }
                      >
                        <LessonRequestDialog
                          instructorName={instructor.volledige_naam}
                          instructorSlug={instructor.slug}
                          selectedPackage={primaryPackage}
                          availableSlots={[]}
                          defaultDurationMinutes={
                            primaryPackage
                              ? instructor.standaard_pakketles_duur_minuten ?? 90
                              : instructor.standaard_rijles_duur_minuten ?? 60
                          }
                          weeklyBookingLimitMinutes={
                            planningAccess.weeklyBookingLimitMinutes
                          }
                          bookedMinutesByWeekStart={
                            planningAccess.bookedMinutesByWeekStart
                          }
                          weeklyRemainingMinutesThisWeek={
                            planningAccess.weeklyRemainingMinutesThisWeek
                          }
                          triggerLabel={primaryPackage ? "Vraag pakket aan" : "Les aanvragen"}
                          triggerClassName="h-9 text-[13px]"
                        />
                        {planningAccess.trialLessonAvailable ? (
                          <LessonRequestDialog
                            instructorName={instructor.volledige_naam}
                            instructorSlug={instructor.slug}
                            requestType="proefles"
                            availableSlots={[]}
                            defaultDurationMinutes={
                              instructor.standaard_proefles_duur_minuten ?? 50
                            }
                            weeklyBookingLimitMinutes={
                              planningAccess.weeklyBookingLimitMinutes
                            }
                            bookedMinutesByWeekStart={
                              planningAccess.bookedMinutesByWeekStart
                            }
                            weeklyRemainingMinutesThisWeek={
                              planningAccess.weeklyRemainingMinutesThisWeek
                            }
                            triggerLabel="Plan proefles"
                            triggerVariant="secondary"
                            triggerClassName="h-9 text-[13px]"
                          />
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.04}>
            <div className="max-w-4xl">
              <Card className="rounded-[1.6rem] border-0 bg-white/92 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
                <CardHeader className="pb-2.5">
                  <CardTitle>Profiel en lesstijl</CardTitle>
                  <CardDescription>
                    Zo geeft {instructor.volledige_naam} vorm aan de begeleiding.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-[15px]">
                    {instructor.bio}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {instructor.specialisaties.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-3">
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
                        className="rounded-[1rem] border border-slate-200 bg-slate-50/90 p-2.5 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6"
                      >
                        <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-1 text-[13px] leading-6 font-medium text-slate-950 dark:text-white">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="site-shell mx-auto w-full px-4 py-5 sm:px-6 lg:px-8">
        <Reveal className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                Reviews
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                Echte ervaringen van leerlingen.
              </h2>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                Korte reviewkaarten met score, titel en eventuele reactie van de instructeur.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white/92 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
              {averageScoreLabel} uit {instructor.aantal_reviews} reviews
            </div>
          </div>

          {reviews.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {reviews.map((review) => (
                <HoverTilt key={review.id} className="relative rounded-[1.45rem] [perspective:1200px]">
                  <Card className="rounded-[1.45rem] border border-slate-200/80 bg-white/92 shadow-[0_22px_56px_-38px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_22px_56px_-38px_rgba(15,23,42,0.5)]">
                    <CardContent className="space-y-2.5 p-3.5">
                      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
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

                      <p className="line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {review.tekst}
                      </p>

                      {review.antwoord_tekst ? (
                        <div className="rounded-[1rem] border border-sky-100 bg-sky-50/80 p-2.5 dark:border-sky-300/12 dark:bg-sky-400/10">
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
