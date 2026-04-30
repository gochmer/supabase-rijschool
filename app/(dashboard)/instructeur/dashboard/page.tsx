import {
  CalendarClock,
  CalendarPlus,
  Inbox,
  MessageSquare,
  PackageCheck,
  Settings,
  ToggleRight,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  DashboardActionHub,
  type DashboardActionHubItem,
} from "@/components/dashboard/dashboard-action-hub";
import {
  DashboardFocusPanel,
  type DashboardFocusItem,
} from "@/components/dashboard/dashboard-focus-panel";
import { InstructorDashboardTabs } from "@/components/dashboard/instructor-dashboard-tabs";
import {
  OnboardingPanel,
  type OnboardingStep,
} from "@/components/dashboard/onboarding-panel";
import { PageHeader } from "@/components/dashboard/page-header";
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
  const instructorActionItems: DashboardActionHubItem[] = [
    {
      title: "Aanvragen",
      description: "Nieuwe leerlingen beoordelen en inplannen.",
      href: "/instructeur/aanvragen",
      icon: Inbox,
      tone: openRequests.length ? "amber" : "emerald",
      meta: openRequests.length ? `${openRequests.length} open` : "Bij",
    },
    {
      title: "Lessen",
      description: "Vandaag, planning en lesadministratie.",
      href: "/instructeur/lessen",
      icon: CalendarClock,
      tone: todayLessons.length ? "emerald" : "sky",
      meta: todayLessons.length ? `${todayLessons.length} vandaag` : "Agenda",
    },
    {
      title: "Beschikbaarheid",
      description: "Open momenten en online boeken beheren.",
      href: "/instructeur/beschikbaarheid",
      icon: CalendarPlus,
      tone: availabilityReady ? "emerald" : "amber",
      meta: availabilityReady ? `${activeSlotCount} open` : "Invullen",
    },
    {
      title: "Leerlingen",
      description: "Trajecten, voortgang en afspraken volgen.",
      href: "/instructeur/leerlingen",
      icon: UsersRound,
      tone: "sky",
      meta: "CRM",
    },
    {
      title: "Pakketten",
      description: "Aanbod, prijzen en actieve pakketten.",
      href: "/instructeur/pakketten",
      icon: PackageCheck,
      tone: packagesReady ? "emerald" : "amber",
      meta: packagesReady ? `${activePackageCount} actief` : "Maken",
    },
    {
      title: "Berichten",
      description: "Afstemming met leerlingen op een plek.",
      href: "/instructeur/berichten",
      icon: MessageSquare,
      tone: notifications.some((item) => item.ongelezen) ? "amber" : "slate",
      meta: notifications.some((item) => item.ongelezen) ? "Nieuw" : "Inbox",
    },
    {
      title: "Instellingen",
      description: "Voertuigen, documenten en bedrijfsgegevens.",
      href: "/instructeur/instellingen",
      icon: Settings,
      tone: "slate",
      meta: "Account",
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Instructeur"
        title="Dashboard"
        description="Klein, standaard en snel: aanvragen, lessen, agenda en leerlingen staan direct bovenaan."
        actions={<RealtimeDashboardSync profileLabel="instructeur-dashboard" />}
      />

      <DashboardActionHub
        compact
        title="Alles wat je vaak nodig hebt"
        description="Zoals een accountoverzicht: aanvragen, lessen, agenda en aanbod staan direct klaar als duidelijke tegels."
        primaryHref={firstOpenRequest ? "/instructeur/aanvragen" : "/instructeur/beschikbaarheid"}
        primaryLabel={firstOpenRequest ? "Open aanvragen" : "Open agenda"}
        items={instructorActionItems}
      />

      <DashboardFocusPanel
        compact
        eyebrow="Vandaag eerst"
        title="Je cockpit begint met de acties die geld en rust opleveren"
        description="Nieuwe aanvragen, lessen van vandaag en agenda-gaten staan vooraan, zodat je niet hoeft te zoeken naar de eerstvolgende stap."
        primary={instructorPrimaryFocus}
        items={instructorFocusItems}
      />

      <OnboardingPanel
        compact
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
