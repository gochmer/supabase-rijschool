import {
  CalendarClock,
  CalendarPlus,
  Flame,
  Inbox,
  PackageCheck,
  ToggleRight,
  UserRound,
} from "lucide-react";

import {
  DashboardFocusPanel,
  type DashboardFocusItem,
} from "@/components/dashboard/dashboard-focus-panel";
import { InstructorDashboardTabs } from "@/components/dashboard/instructor-dashboard-tabs";
import {
  OnboardingPanel,
  type OnboardingStep,
} from "@/components/dashboard/onboarding-panel";
import { RealtimeDashboardSync } from "@/components/dashboard/realtime-dashboard-sync";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getCurrentInstructorLessonCheckinBoards } from "@/lib/data/lesson-checkins";
import { getCurrentInstructorLessonCompassBoards } from "@/lib/data/lesson-compass";
import { getLocationOptions } from "@/lib/data/locations";
import {
  getInstructeurDashboardMetrics,
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentNotifications } from "@/lib/data/notifications";
import { getCurrentInstructorPackages } from "@/lib/data/packages";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { getInstructorGrowthInsights } from "@/lib/data/instructor-growth-insights";
import { getInstructorDashboardRadarInsights } from "@/lib/data/instructor-dashboard-radar";

const amsterdamDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Amsterdam",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getAmsterdamDateKey(dateValue: string | null | undefined) {
  if (!dateValue) {
    return "";
  }

  return amsterdamDateFormatter.format(new Date(dateValue));
}

export default async function InstructeurDashboardPage() {
  const [
    metrics,
    lessons,
    requests,
    notifications,
    locationOptions,
    lessonCompassBoards,
    lessonCheckinBoards,
    radarInsights,
    growthInsights,
    instructor,
    instructorPackages,
    availabilitySlots,
  ] =
    await Promise.all([
      getInstructeurDashboardMetrics(),
      getInstructeurLessons(),
      getInstructeurLessonRequests(),
      getCurrentNotifications(),
      getLocationOptions(),
      getCurrentInstructorLessonCompassBoards(),
      getCurrentInstructorLessonCheckinBoards(),
      getInstructorDashboardRadarInsights(),
      getInstructorGrowthInsights(),
      getCurrentInstructeurRecord(),
      getCurrentInstructorPackages(),
      getCurrentInstructorAvailability(),
    ]);

  const openRequests = requests.filter((item) => item.status === "aangevraagd");
  const plannedLessons = lessons.filter((item) =>
    ["ingepland", "geaccepteerd"].includes(item.status)
  );
  const todayKey = amsterdamDateFormatter.format(new Date());
  const todayLessons = plannedLessons.filter(
    (lesson) => getAmsterdamDateKey(lesson.start_at) === todayKey
  );
  const firstOpenRequest = openRequests[0] ?? null;
  const firstTodayLesson = todayLessons[0] ?? null;
  const agendaGapCount = growthInsights.fillGaps.length;
  const profileScore = Number(instructor?.profiel_compleetheid ?? 0);
  const profileReady = Boolean(
    profileScore >= 70 &&
      instructor?.bio?.trim() &&
      instructor.werkgebied?.length &&
      Number(instructor.prijs_per_les ?? 0) > 0
  );
  const activePackageCount = instructorPackages.filter(
    (pkg) => pkg.actief !== false
  ).length;
  const activeSlotCount = availabilitySlots.filter((slot) => slot.beschikbaar).length;
  const packagesReady = activePackageCount > 0;
  const availabilityReady = activeSlotCount > 0;
  const onlineBookingReady = Boolean(instructor?.online_boeken_actief);

  const instructorPrimaryFocus: DashboardFocusItem = firstOpenRequest
    ? {
        label: "Eerst opvolgen",
        title: "Nieuwe aanvraag klaarzetten",
        value: "Actie nodig",
        description: `${firstOpenRequest.leerling_naam} wacht op een besluit voor ${firstOpenRequest.voorkeursdatum}, ${firstOpenRequest.tijdvak}.`,
        href: "/instructeur/aanvragen",
        ctaLabel: "Open aanvragen",
        icon: Inbox,
        tone: "warning",
      }
    : firstTodayLesson
      ? {
          label: "Eerst opvolgen",
          title: "Vandaag lesgeven",
          value: firstTodayLesson.tijd,
          description: `${firstTodayLesson.titel} met ${firstTodayLesson.leerling_naam}. Locatie: ${firstTodayLesson.locatie}.`,
          href: "/instructeur/lessen",
          ctaLabel: "Open lessen",
          icon: CalendarClock,
          tone: "success",
        }
      : {
          label: "Eerst opvolgen",
          title: "Agenda vullen",
          value: agendaGapCount ? `${agendaGapCount} kans${agendaGapCount === 1 ? "" : "en"}` : "Rustig",
          description: agendaGapCount
            ? "Er zijn open momenten die je kunt omzetten naar nieuwe lesblokken."
            : "Je hebt geen urgente aanvraag of les vandaag; check je beschikbaarheid voor de komende week.",
          href: "/instructeur/beschikbaarheid",
          ctaLabel: "Open agenda",
          icon: CalendarPlus,
          tone: agendaGapCount ? "warning" : "default",
        };
  const instructorFocusItems: DashboardFocusItem[] = [
    {
      label: "Nieuwe aanvragen",
      title: openRequests.length
        ? `${openRequests.length} aanvraag${openRequests.length === 1 ? "" : "en"} wacht${openRequests.length === 1 ? "" : "en"}`
        : "Geen open aanvragen",
      value: `${openRequests.length}`,
      description: firstOpenRequest
        ? `${firstOpenRequest.leerling_naam} - ${firstOpenRequest.voorkeursdatum}, ${firstOpenRequest.tijdvak}`
        : "Je inbox is bijgewerkt; nieuwe aanvragen verschijnen hier meteen.",
      href: "/instructeur/aanvragen",
      ctaLabel: "Beheer aanvragen",
      icon: Inbox,
      tone: openRequests.length ? "warning" : "success",
    },
    {
      label: "Vandaag lessen",
      title: todayLessons.length
        ? `${todayLessons.length} les${todayLessons.length === 1 ? "" : "sen"} vandaag`
        : "Geen lessen vandaag",
      value: `${todayLessons.length}`,
      description: firstTodayLesson
        ? `${firstTodayLesson.tijd} met ${firstTodayLesson.leerling_naam}`
        : "Gebruik de ruimte om administratie, profiel of beschikbaarheid bij te werken.",
      href: "/instructeur/lessen",
      ctaLabel: "Open lessen",
      icon: CalendarClock,
      tone: todayLessons.length ? "success" : "default",
    },
    {
      label: "Agenda invullen",
      title: agendaGapCount
        ? `${agendaGapCount} open moment${agendaGapCount === 1 ? "" : "en"}`
        : "Agenda staat rustig",
      value: `${agendaGapCount}`,
      description: agendaGapCount
        ? "Vul open blokken of stuur een nudge om stille agenda-ruimte te benutten."
        : "Controleer of je komende week voldoende open boekbare momenten heeft.",
      href: "/instructeur/beschikbaarheid",
      ctaLabel: "Open agenda",
      icon: CalendarPlus,
      tone: agendaGapCount ? "warning" : "success",
    },
  ];
  const instructorOnboardingSteps: OnboardingStep[] = [
    {
      label: "Stap 1",
      title: "Profiel verkoopklaar maken",
      description:
        "Vul bio, werkgebied, prijs en specialisaties aan zodat je openbare profiel vertrouwen wekt.",
      href: "/instructeur/profiel",
      ctaLabel: profileReady ? "Profiel bekijken" : "Profiel afmaken",
      complete: profileReady,
      icon: UserRound,
      meta: `${Math.min(100, Math.max(0, profileScore))}% profielscore`,
    },
    {
      label: "Stap 2",
      title: "Pakketten publiceren",
      description:
        "Zet minimaal een actief pakket klaar, zodat leerlingen niet hoeven te raden wat ze kunnen aanvragen.",
      href: "/instructeur/pakketten",
      ctaLabel: packagesReady ? "Pakketten beheren" : "Pakket maken",
      complete: packagesReady,
      icon: PackageCheck,
      meta: `${activePackageCount} actief pakket${activePackageCount === 1 ? "" : "ten"}`,
    },
    {
      label: "Stap 3",
      title: "Beschikbaarheid invullen",
      description:
        "Open boekbare momenten in je agenda zodat leerlingen direct een passend tijdvak kunnen kiezen.",
      href: "/instructeur/beschikbaarheid",
      ctaLabel: availabilityReady ? "Agenda beheren" : "Agenda vullen",
      complete: availabilityReady,
      icon: CalendarPlus,
      meta: `${activeSlotCount} open moment${activeSlotCount === 1 ? "" : "en"}`,
    },
    {
      label: "Stap 4",
      title: "Online boeken aanzetten",
      description:
        "Maak de stap van interesse naar ingeplande les korter door online boeken open te zetten.",
      href: "/instructeur/beschikbaarheid",
      ctaLabel: onlineBookingReady ? "Instelling bekijken" : "Online boeken aanzetten",
      complete: onlineBookingReady,
      icon: ToggleRight,
      meta: onlineBookingReady ? "Online boeken actief" : "Nog uitgeschakeld",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.2rem] border border-white/70 bg-[linear-gradient(135deg,#020617,#172554,#0284c7)] p-6 text-white shadow-[0_34px_110px_-58px_rgba(15,23,42,0.78)] dark:border-white/10 sm:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_88%_18%,rgba(56,189,248,0.24),transparent_24%),radial-gradient(circle_at_70%_86%,rgba(249,115,22,0.16),transparent_24%)]" />
        <div className="relative">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/78 uppercase">
                <Flame className="size-3.5" />
                Instructeur cockpit
              </div>
              <RealtimeDashboardSync profileLabel="instructeur-dashboard" />
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Vandaag draaien om aanvragen, lessen en conversie.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72 sm:text-[15px]">
              Een scherp overzicht voor je planning, nieuwe leerlingen,
              meldingen en profielacties. Geen ruis, alleen wat vandaag geld,
              vertrouwen en voortgang oplevert.
            </p>
          </div>
        </div>
      </section>

      <DashboardFocusPanel
        eyebrow="Vandaag eerst"
        title="Je cockpit begint met de acties die geld en rust opleveren"
        description="Nieuwe aanvragen, lessen van vandaag en agenda-gaten staan vooraan, zodat je niet hoeft te zoeken naar de eerstvolgende stap."
        primary={instructorPrimaryFocus}
        items={instructorFocusItems}
      />

      <OnboardingPanel
        eyebrow="Nieuwe instructeur"
        title="Van account naar boekbaar profiel"
        description="Deze checklist helpt je om snel verkoopklaar te zijn: profiel, pakketten, beschikbaarheid en online boeken op een rij."
        steps={instructorOnboardingSteps}
        accent="emerald"
        hideWhenComplete
      />

      <InstructorDashboardTabs
        metrics={metrics}
        lessons={lessons}
        requests={requests}
        notifications={notifications}
        locationOptions={locationOptions}
        lessonCompassBoards={lessonCompassBoards}
        lessonCheckinBoards={lessonCheckinBoards}
        radarInsights={radarInsights}
        growthInsights={growthInsights}
      />
    </div>
  );
}
