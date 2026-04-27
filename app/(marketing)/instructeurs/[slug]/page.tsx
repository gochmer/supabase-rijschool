import Image from "next/image";
import { notFound } from "next/navigation";
import {
  CalendarClock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { InstructorAvailabilityPlanner } from "@/components/instructors/instructor-availability-planner";
import { LessonRequestDialog } from "@/components/instructors/lesson-request-dialog";
import { BrandRouteScene } from "@/components/marketing/brand-route-scene";
import { HoverTilt, Reveal, SignatureLine } from "@/components/marketing/homepage-motion";
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
import {
  getInstructorAvailability,
  getInstructorReviews,
  getPublicInstructorBySlug,
} from "@/lib/data/instructors";
import { formatAvailabilityMoment } from "@/lib/availability";
import { ensureCurrentUserContext } from "@/lib/data/profiles";
import { getPublicInstructorPackages } from "@/lib/data/packages";
import { getCurrentLearnerSchedulingAccessForInstructorSlug } from "@/lib/data/student-scheduling";
import { formatCurrency, getInitials } from "@/lib/format";
import { getRijlesTypeLabel, rijlesTypeOptions } from "@/lib/lesson-types";
import { getPackageCoverObjectPosition } from "@/lib/package-covers";
import { getPackageVisualConfig } from "@/lib/package-visuals";

function transmissionLabel(value: string) {
  if (value === "automaat") return "Automaat";
  if (value === "handgeschakeld") return "Handgeschakeld";
  return "Automaat en schakel";
}

function getInstructorFocus(instructor: { specialisaties: string[] }) {
  const focus = instructor.specialisaties.slice(0, 2).join(" en ");
  return focus || "persoonlijke begeleiding";
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
      : null;
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
    ? "Vrijgegeven"
    : planningAccess.hasActiveRelationship
      ? "Wacht op vrijgave"
      : "Nog afgeschermd";
  const planningSignals = [
    { label: "Planningstatus", value: planningStateLabel },
    { label: "Werkgebied", value: `${instructor.steden.length} regio's` },
    { label: "Lesvorm", value: transmissionLabel(instructor.transmissie) },
  ];
  const planningHighlights = [
    {
      icon: CalendarClock,
      title: "Agenda pas na relatie",
      text: "De agenda wordt pas zichtbaar zodra je echt verdergaat met deze instructeur.",
    },
    {
      icon: ShieldCheck,
      title: "Instructeur beslist",
      text: "De instructeur kan per leerling aanzetten of zelf inplannen wel of niet mag.",
    },
    {
      icon: MapPin,
      title: "Rustige flow",
      text: "Je kunt wel direct een aanvraag of proefles starten zonder de agenda al te zien.",
    },
  ];
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Instructeurs", href: "/instructeurs" },
    { label: instructor.volledige_naam, href: `/instructeurs/${instructor.slug}` },
  ];

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden px-4 pt-10 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.18),transparent_22%),radial-gradient(circle_at_84%_16%,rgba(29,78,216,0.18),transparent_24%),radial-gradient(circle_at_56%_58%,rgba(249,115,22,0.12),transparent_22%)]" />
        <div className="site-shell relative mx-auto w-full py-10 lg:py-18">
          <SeoBreadcrumbs items={breadcrumbItems} className="mb-6" />
          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8">
              <Reveal className="rounded-[2.45rem] border border-white/70 bg-white/84 p-6 shadow-[0_32px_100px_-50px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row">
                  <div
                    className={`flex size-24 items-center justify-center rounded-[2rem] bg-gradient-to-br ${instructor.profielfoto_kleur} text-2xl font-semibold text-white shadow-[0_22px_46px_-26px_rgba(15,23,42,0.48)]`}
                  >
                    {getInitials(instructor.volledige_naam)}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-sky-700/95 uppercase shadow-[0_14px_30px_-24px_rgba(15,23,42,0.12)]">
                        <Sparkles className="size-3.5" />
                        Instructeur profiel
                      </div>
                      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                        {instructor.volledige_naam}
                      </h1>
                      <p className="mt-2 text-base text-slate-600">
                        {instructor.steden.join(" • ")}
                      </p>
                      <div className="mt-4">
                        <SignatureLine className="h-px w-32 rounded-full" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {instructor.specialisaties.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        {instructor.beoordeling} ({instructor.aantal_reviews} reviews)
                      </span>
                      <span>{instructor.ervaring_jaren} jaar ervaring</span>
                      <span>{transmissionLabel(instructor.transmissie)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.08fr)]">
                  <div className="rounded-[1.55rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.88))] p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.12)]">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      Prijs per les
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {formatCurrency(instructor.prijs_per_les)}
                    </p>
                  </div>
                  <div className="rounded-[1.55rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.88))] p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.12)]">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      Werkgebied
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {instructor.steden.length} regio&apos;s
                    </p>
                  </div>
                  <div className="rounded-[1.55rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.88))] p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.12)]">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      Profielkwaliteit
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {instructor.profiel_voltooid}% compleet
                    </p>
                  </div>
                  <div className="rounded-[1.7rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(224,242,254,0.88),rgba(255,255,255,0.92))] p-4 shadow-[0_20px_46px_-34px_rgba(14,165,233,0.24)]">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-sky-700 uppercase">
                      Vervolgplanning
                    </p>
                    <p className="mt-2 text-[15px] font-semibold leading-6 text-slate-950">
                      {planningAccess.canViewAgenda
                        ? "Je mag nu zelf een moment kiezen uit de agenda van deze instructeur."
                        : planningAccess.hasActiveRelationship
                          ? "Je traject is al actief. Zodra deze instructeur zelf plannen vrijgeeft, verschijnt de agenda hier."
                          : "Vraag eerst een proefles of pakket aan. Daarna kan de instructeur jouw agenda-toegang vrijgeven."}
                    </p>
                    <div className="mt-3 rounded-[1.1rem] border border-white/70 bg-white/80 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <p className="text-[9px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                        {planningAccess.canViewAgenda ? "Eerstvolgende planning" : "Planningstatus"}
                      </p>
                      <p className="mt-1 text-[13px] font-semibold text-slate-950">
                        {nextPlanningMoment}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild className="rounded-full px-5">
                        <a href="#plan-afspraak">
                          {planningAccess.canViewAgenda
                            ? "Bekijk agenda"
                            : "Bekijk hoe planning vrijkomt"}
                        </a>
                      </Button>
                      <Button asChild variant="outline" className="rounded-full px-5">
                        <a href="#pakketten-en-trajecten">Bekijk pakketten eerst</a>
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="mt-8 max-w-3xl text-base leading-8 text-slate-600">
                  {instructor.bio}
                </p>
              </Reveal>

              <Reveal delay={0.06}>
                <Card
                  id="pakketten-en-trajecten"
                  className="scroll-mt-28 border-0 bg-white/92 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)]"
                >
                  <CardHeader>
                    <CardTitle>Pakketten en trajecten</CardTitle>
                    <CardDescription>
                      Bekijk hoe deze instructeur zijn begeleiding heeft opgebouwd, van intake
                      tot examenfocus.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      {[
                        {
                          label: "Lesstijl",
                          value:
                            instructor.specialisaties.slice(0, 2).join(" • ") ||
                            "Persoonlijke begeleiding",
                        },
                        {
                          label: "Werkgebied",
                          value: instructor.steden.join(" • "),
                        },
                        {
                          label: "Planning",
                          value:
                            planningAccess.canViewAgenda
                              ? "Zelf plannen staat aan"
                              : planningAccess.hasActiveRelationship
                                ? "Wacht op vrijgave van instructeur"
                                : "Wordt later in het traject vrijgegeven",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-[1.05rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.88))] p-3 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.12)]"
                        >
                          <p className="text-[9px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                            {item.label}
                          </p>
                          <p className="mt-1.5 text-[13px] leading-6 font-medium text-slate-950">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6">
                      {packageGroups.length ? (
                        packageGroups.map((group) => (
                          <div key={group.value} className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge className="border border-sky-100 bg-sky-50 text-sky-700">
                                {group.label}
                              </Badge>
                              <p className="text-sm text-slate-500">
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
                          const isPrimaryPackage = pkg.uitgelicht || index === 0;

                          return (
                            <div
                              key={pkg.id}
                              className={`relative rounded-[1.2rem] border p-4 shadow-[0_22px_56px_-36px_rgba(15,23,42,0.18)] ${
                                isPrimaryPackage
                                  ? visual.featuredCardClass
                                : visual.softCardClass
                              }`}
                            >
                              {pkg.cover_url ? (
                                <div className="relative mb-3 h-28 overflow-hidden rounded-[1rem]">
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
                                        ? "bg-gradient-to-t from-slate-950/70 via-slate-950/18 to-transparent"
                                        : "bg-gradient-to-t from-slate-950/35 via-slate-950/10 to-transparent"
                                    }`}
                                  />
                                </div>
                              ) : null}
                              <div className="relative z-10 flex items-start justify-between gap-2.5">
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <p className="text-[1rem] font-semibold">{pkg.naam}</p>
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
                                    {pkg.badge ? (
                                      <Badge
                                        className={
                                          isPrimaryPackage
                                            ? visual.featuredBadgeClass
                                            : visual.softBadgeClass
                                        }
                                      >
                                        {pkg.badge}
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <p
                                    className={`mt-1.5 text-[13px] leading-6 ${
                                      isPrimaryPackage
                                        ? "text-white/76"
                                        : "text-slate-600"
                                    }`}
                                  >
                                    {pkg.beschrijving}
                                  </p>
                                  {pkg.praktijk_examen_prijs !== null &&
                                  pkg.praktijk_examen_prijs !== undefined ? (
                                    <p
                                      className={`mt-2 text-[12px] font-medium ${
                                        isPrimaryPackage
                                          ? "text-white/80"
                                          : "text-slate-700"
                                      }`}
                                    >
                                      Praktijk-examen {formatCurrency(pkg.praktijk_examen_prijs)}
                                    </p>
                                  ) : null}
                                </div>
                                <div
                                  className={`flex size-9 shrink-0 items-center justify-center rounded-[1rem] ${
                                    isPrimaryPackage
                                      ? visual.featuredIconClass
                                      : visual.softIconClass
                                  }`}
                                >
                                  <visual.Icon className="size-4" />
                                </div>
                              </div>

                              <div className="relative z-10 mt-3 grid gap-1.5 sm:grid-cols-2">
                                <div
                                  className={`rounded-[0.9rem] p-3 ${
                                    isPrimaryPackage ? "bg-white/10" : "bg-white"
                                  }`}
                                >
                                  <p
                                    className={`text-[9px] font-semibold tracking-[0.14em] uppercase ${
                                      isPrimaryPackage
                                        ? "text-white/65"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    Prijs
                                  </p>
                                  <p className="mt-1 text-[15px] font-semibold">
                                    {pkg.prijs ? formatCurrency(pkg.prijs) : "Op aanvraag"}
                                  </p>
                                </div>
                                <div
                                  className={`rounded-[0.9rem] p-3 ${
                                    isPrimaryPackage ? "bg-white/10" : "bg-white"
                                  }`}
                                >
                                  <p
                                    className={`text-[9px] font-semibold tracking-[0.14em] uppercase ${
                                      isPrimaryPackage
                                        ? "text-white/65"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    Lessen
                                  </p>
                                  <p className="mt-1 text-[15px] font-semibold">
                                    {pkg.lessen || "Flexibel"}
                                  </p>
                                </div>
                              </div>

                              <div
                                className={`relative z-10 mt-3 rounded-[0.95rem] p-3 ${
                                  isPrimaryPackage ? "bg-white/10" : "bg-white"
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <ShieldCheck
                                    className={`mt-1 size-4 ${
                                      isPrimaryPackage ? "text-white/72" : "text-primary"
                                    }`}
                                  />
                                  <p
                                    className={`text-[12px] leading-6 ${
                                      isPrimaryPackage
                                        ? "text-white/76"
                                        : "text-slate-600"
                                    }`}
                                  >
                                    Past bij {instructor.volledige_naam} als je begeleiding zoekt
                                    met focus op {getInstructorFocus(instructor)}.
                                  </p>
                                </div>
                              </div>

                              <div className="relative z-10 mt-4">
                                <LessonRequestDialog
                                  instructorName={instructor.volledige_naam}
                                  instructorSlug={instructor.slug}
                                  selectedPackage={pkg}
                                  availableSlots={planningAccess.canViewAgenda ? slots : []}
                                  triggerLabel="Vraag dit pakket aan"
                                  triggerClassName="h-9 w-full text-[13px]"
                                />
                              </div>

                              {isPrimaryPackage ? (
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_28%),radial-gradient(circle_at_80%_78%,rgba(255,255,255,0.12),transparent_28%)]" />
                              ) : null}
                            </div>
                          );
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[1.75rem] border border-dashed border-border bg-slate-50/80 p-6 text-sm leading-7 text-slate-600 xl:col-span-2">
                          Deze instructeur heeft nog geen losse trajecten gepubliceerd. Je kunt
                          wel direct een lesaanvraag of proefles starten.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Reveal>

              <Reveal delay={0.08}>
                <Card className="border-0 bg-white/92 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)]">
                  <CardHeader>
                    <CardTitle>Reviews van leerlingen</CardTitle>
                    <CardDescription>
                      Echte ervaringen na afgeronde lessen en trajecten.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reviews.length ? (
                      reviews.map((review) => (
                        <HoverTilt
                          key={review.id}
                          className="relative rounded-[1.75rem] [perspective:1200px]"
                        >
                          <div className="rounded-[1.75rem] border border-border/70 bg-slate-50/80 p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-semibold text-slate-950">{review.titel}</p>
                                <p className="text-sm text-slate-500">
                                  {review.leerling_naam} • {review.datum}
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
                              <p className="mt-3 text-sm leading-7 text-slate-600">
                                {review.tekst}
                              </p>
                              {review.antwoord_tekst ? (
                                <div className="mt-3 rounded-[1.15rem] border border-sky-100 bg-sky-50/80 p-4">
                                  <p className="text-[10px] font-semibold tracking-[0.18em] text-sky-700 uppercase">
                                    Reactie van instructeur
                                  </p>
                                  <p className="mt-2 text-sm leading-7 text-slate-700">
                                    {review.antwoord_tekst}
                                  </p>
                                  {review.antwoord_datum ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      Geplaatst op {review.antwoord_datum}
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                        </HoverTilt>
                      ))
                    ) : (
                      <div className="rounded-[1.75rem] border border-dashed border-border bg-slate-50/80 p-6 text-sm leading-7 text-slate-600">
                        Er zijn nog geen reviews beschikbaar voor dit profiel.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Reveal>
            </div>

            <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
              <Reveal delay={0.1} className="relative overflow-hidden rounded-[2.5rem] bg-[linear-gradient(145deg,rgba(15,23,42,1),rgba(30,64,175,0.95),rgba(14,165,233,0.88))] px-6 py-6 text-white shadow-[0_38px_110px_-52px_rgba(15,23,42,0.75)] sm:px-7 sm:py-7 xl:min-h-[31rem] xl:px-8 xl:py-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_28%)]" />
                <div className="absolute inset-y-0 right-0 left-[44%] hidden xl:block opacity-80">
                  <BrandRouteScene showPanels={false} />
                </div>
                <div className="relative flex h-full flex-col justify-between gap-8">
                  <div className="max-w-[26rem] space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[10px] font-semibold tracking-[0.22em] text-sky-200 uppercase">
                        Vervolgplanning
                      </p>
                      <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-white/78 uppercase">
                        Na vrijgave
                      </span>
                    </div>
                    <h2 className="max-w-[13ch] text-3xl font-semibold leading-tight sm:text-[2.05rem]">
                      {planningAccess.canViewAgenda
                        ? "Je agenda-toegang staat open. Kies nu zelf een passend moment."
                        : "De agenda opent pas zodra jouw traject actief is en de instructeur dit vrijgeeft."}
                    </h2>
                    <p className="max-w-[28rem] text-sm leading-7 text-white/72 sm:text-[15px]">
                      {planningAccess.canViewAgenda
                        ? "Je ziet nu alleen de momenten die deze instructeur voor jou open heeft gezet. Zo blijft plannen rustig en gericht."
                        : "Eerst vraag je een pakket of proefles aan. Zodra je echt verdergaat met deze instructeur kan hij of zij zelf inplannen voor jou aanzetten."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {planningSignals.map((item) => (
                        <span
                          key={item.label}
                          className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/78"
                        >
                          <span className="font-semibold text-white">{item.label}</span>{" "}
                          {item.value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 xl:max-w-[28rem]">
                    {planningHighlights.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-[1.6rem] border border-white/12 bg-white/10 p-4 backdrop-blur"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/12">
                            <item.icon className="size-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{item.title}</p>
                            <p className="mt-1 text-sm leading-7 text-white/72">
                              {item.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <LessonRequestDialog
                      instructorName={instructor.volledige_naam}
                      instructorSlug={instructor.slug}
                      selectedPackage={primaryPackage}
                      availableSlots={planningAccess.canViewAgenda ? slots : []}
                      triggerLabel={primaryPackage ? "Vraag pakket aan" : "Les aanvragen"}
                    />
                    <LessonRequestDialog
                      instructorName={instructor.volledige_naam}
                      instructorSlug={instructor.slug}
                      requestType="proefles"
                      availableSlots={planningAccess.canViewAgenda ? slots : []}
                      triggerLabel="Plan proefles"
                      triggerVariant="secondary"
                    />
                  </div>
                </div>
              </Reveal>

              <div id="plan-afspraak" className="scroll-mt-28">
                <Reveal delay={0.14}>
                  {planningAccess.canViewAgenda ? (
                    <InstructorAvailabilityPlanner
                      instructorName={instructor.volledige_naam}
                      instructorSlug={instructor.slug}
                      slots={slots}
                    />
                  ) : (
                    <Card className="border-0 bg-white/92 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)]">
                      <CardHeader>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={planningAccess.hasActiveRelationship ? "warning" : "info"}>
                            {planningAccess.hasActiveRelationship
                              ? "Wacht op vrijgave"
                              : "Nog afgeschermd"}
                          </Badge>
                        </div>
                        <CardTitle>
                          {planningAccess.hasActiveRelationship
                            ? "Agenda wacht nog op vrijgave van de instructeur"
                            : "Agenda wordt pas zichtbaar zodra je traject actief is"}
                        </CardTitle>
                        <CardDescription>
                          {planningAccess.hasActiveRelationship
                            ? "Je bent al gekoppeld aan deze instructeur. Zodra zelf inplannen voor jou wordt aangezet, verschijnen hier de beschikbare momenten."
                            : "De agenda blijft bewust verborgen tot je echt verdergaat met deze instructeur. Daarna kan de instructeur per leerling zelf bepalen of plannen wordt vrijgegeven."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3 md:grid-cols-3">
                        {[
                          {
                            label: "Stap 1",
                            value: "Vraag een pakket of proefles aan",
                          },
                          {
                            label: "Stap 2",
                            value: "Werk verder in een actief traject",
                          },
                          {
                            label: "Stap 3",
                            value: "De instructeur zet zelf inplannen aan",
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-[1.1rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5"
                          >
                            <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                              {item.label}
                            </p>
                            <p className="mt-2 text-[13px] leading-6 font-medium text-slate-950 dark:text-white">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
