import Link from "next/link";
import { Bell, CalendarClock, ClipboardList, Search, Target, UserRound } from "lucide-react";

import { DataTableCard } from "@/components/dashboard/data-table-card";
import {
  DashboardFocusPanel,
  type DashboardFocusItem,
} from "@/components/dashboard/dashboard-focus-panel";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { LessonCheckinPanel } from "@/components/dashboard/lesson-checkin-board";
import { LessonFocusCard } from "@/components/dashboard/lesson-focus-card";
import { LearnerRequestOverview } from "@/components/dashboard/learner-request-overview";
import { PageHeader } from "@/components/dashboard/page-header";
import { QuickActionGrid } from "@/components/dashboard/quick-action-grid";
import { RealtimeDashboardSync } from "@/components/dashboard/realtime-dashboard-sync";
import { SharedLessonCompass } from "@/components/dashboard/shared-lesson-compass";
import {
  OnboardingPanel,
  type OnboardingStep,
} from "@/components/dashboard/onboarding-panel";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import { getCurrentLearnerLessonCheckinBoards } from "@/lib/data/lesson-checkins";
import { getCurrentLearnerLessonCompassBoards } from "@/lib/data/lesson-compass";
import {
  getLeerlingDashboardMetrics,
  getLeerlingLessonRequests,
  getLeerlingLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentNotifications } from "@/lib/data/notifications";
import { getCurrentProfile } from "@/lib/data/profiles";

export default async function LeerlingDashboardPage() {
  const [
    metrics,
    lessons,
    requests,
    notifications,
    lessonCompassBoards,
    lessonCheckinBoards,
    profile,
  ] =
    await Promise.all([
      getLeerlingDashboardMetrics(),
      getLeerlingLessons(),
      getLeerlingLessonRequests(),
      getCurrentNotifications(),
      getCurrentLearnerLessonCompassBoards(),
      getCurrentLearnerLessonCheckinBoards(),
      getCurrentProfile(),
    ]);

  const upcomingLessons = lessons.slice(0, 4);
  const nextLesson = lessons.find((lesson) =>
    ["geaccepteerd", "ingepland"].includes(lesson.status)
  );
  const pendingRequests = requests.filter((item) => item.status === "aangevraagd");
  const acceptedRequests = requests.filter((item) =>
    ["geaccepteerd", "ingepland"].includes(item.status)
  );
  const unreadNotifications = notifications.filter((item) => item.ongelezen);
  const profileComplete = Boolean(
    profile?.volledige_naam?.trim() && profile.telefoon?.trim()
  );
  const hasChosenInstructor = Boolean(
    requests.length || lessons.length || acceptedRequests.length
  );
  const hasStartedRequest = Boolean(requests.length);
  const hasActiveLesson = Boolean(nextLesson);
  const latestPendingRequest = pendingRequests[0] ?? null;
  const learnerNextStep: DashboardFocusItem = nextLesson
    ? {
        label: "Wat moet ik nu doen?",
        title: "Bereid je volgende les voor",
        value: "Nu handig",
        description:
          "Bekijk je lesmoment, locatie en voortgang zodat je precies weet waar je aan toe bent.",
        href: "/leerling/boekingen",
        ctaLabel: "Open boekingen",
        icon: Target,
        tone: "success",
      }
    : latestPendingRequest
      ? {
          label: "Wat moet ik nu doen?",
          title: "Houd je aanvraag in beeld",
          value: "Wacht op reactie",
          description: `Je aanvraag bij ${latestPendingRequest.instructeur_naam} staat open. Check meldingen of vergelijk alvast een alternatief.`,
          href: "/leerling/boekingen",
          ctaLabel: "Open aanvragen",
          icon: ClipboardList,
          tone: "warning",
        }
      : {
          label: "Wat moet ik nu doen?",
          title: "Start met een proefles",
          value: "Begin hier",
          description:
            "Vergelijk instructeurs en vraag direct een proefles of passend pakket aan.",
          href: "/instructeurs",
          ctaLabel: "Zoek instructeur",
          icon: Search,
          tone: "default",
        };

  const learnerFocusItems: DashboardFocusItem[] = [
    {
      label: "Volgende les",
      title: nextLesson ? nextLesson.titel : "Nog geen les ingepland",
      value: nextLesson ? nextLesson.datum : "Geen les",
      description: nextLesson
        ? `${nextLesson.tijd} met ${nextLesson.instructeur_naam}. Locatie: ${nextLesson.locatie}.`
        : "Zodra een instructeur accepteert of een les plant, verschijnt je eerstvolgende moment hier.",
      href: "/leerling/boekingen",
      ctaLabel: "Bekijk lessen",
      icon: CalendarClock,
      tone: nextLesson ? "success" : "default",
    },
    {
      label: "Open aanvraag",
      title: pendingRequests.length
        ? `${pendingRequests.length} aanvraag${pendingRequests.length === 1 ? "" : "en"} wacht op reactie`
        : "Geen open aanvragen",
      value: `${pendingRequests.length}`,
      description: latestPendingRequest
        ? `${latestPendingRequest.instructeur_naam} - ${latestPendingRequest.voorkeursdatum}, ${latestPendingRequest.tijdvak}`
        : "Je kunt rustig een nieuwe proefles of pakket aanvragen wanneer je klaar bent.",
      href: "/leerling/boekingen",
      ctaLabel: "Open aanvragen",
      icon: ClipboardList,
      tone: pendingRequests.length ? "warning" : "success",
    },
    {
      label: "Meldingen",
      title: unreadNotifications.length
        ? `${unreadNotifications.length} nieuwe melding${unreadNotifications.length === 1 ? "" : "en"}`
        : "Geen nieuwe meldingen",
      value: `${unreadNotifications.length}`,
      description: unreadNotifications.length
        ? "Lees reacties van instructeurs en updates over je traject op tijd."
        : "Je hoeft nu niets op te volgen vanuit meldingen.",
      href: "/leerling/berichten",
      ctaLabel: "Open berichten",
      icon: Bell,
      tone: unreadNotifications.length ? "warning" : "success",
    },
  ];
  const learnerOnboardingSteps: OnboardingStep[] = [
    {
      label: "Stap 1",
      title: "Profiel compleet maken",
      description:
        "Vul naam en telefoon in zodat instructeurs je aanvraag sneller en persoonlijker kunnen opvolgen.",
      href: "/leerling/profiel",
      ctaLabel: profileComplete ? "Profiel bekijken" : "Profiel aanvullen",
      complete: profileComplete,
      icon: UserRound,
      meta: profileComplete ? "Basisgegevens staan klaar" : "Naam en telefoon nodig",
    },
    {
      label: "Stap 2",
      title: "Instructeur kiezen",
      description:
        "Vergelijk instructeurs op regio, prijs, transmissie, reviews en lesstijl.",
      href: "/instructeurs",
      ctaLabel: hasChosenInstructor ? "Vergelijk verder" : "Kies instructeur",
      complete: hasChosenInstructor,
      icon: Search,
      meta: hasChosenInstructor ? "Je hebt al een trajectsignaal" : "Nog geen keuze gemaakt",
    },
    {
      label: "Stap 3",
      title: "Proefles of pakket aanvragen",
      description:
        "Start je traject met een concrete aanvraag zodat de instructeur kan reageren of plannen.",
      href: "/leerling/boekingen",
      ctaLabel: hasStartedRequest ? "Aanvragen bekijken" : "Start aanvraag",
      complete: hasStartedRequest,
      icon: ClipboardList,
      meta: hasStartedRequest
        ? `${requests.length} aanvraag${requests.length === 1 ? "" : "en"} bekend`
        : "Nog geen aanvraag",
    },
    {
      label: "Stap 4",
      title: "Eerste les volgen",
      description:
        "Zodra je les is ingepland, houd je hier locatie, tijd en voortgang bij.",
      href: "/leerling/boekingen",
      ctaLabel: hasActiveLesson ? "Open volgende les" : "Bekijk planning",
      complete: hasActiveLesson,
      icon: CalendarClock,
      meta: nextLesson ? `${nextLesson.datum} om ${nextLesson.tijd}` : "Nog niet ingepland",
    },
  ];

  return (
    <>
      <PageHeader
        title="Leerling dashboard"
        description="Volg je aanvragen, geplande lessen, voortgang en meldingen vanuit een rustig overzicht."
        actions={
          <>
            <RealtimeDashboardSync profileLabel="leerling-dashboard" />
            <Button asChild variant="outline" className="h-9 rounded-full text-[13px]">
              <Link href="/leerling/profiel">Profiel bijwerken</Link>
            </Button>
            <Button asChild className="h-9 rounded-full text-[13px]">
              <Link href="/instructeurs">Nieuwe instructeur zoeken</Link>
            </Button>
          </>
        }
      />

      <DashboardFocusPanel
        eyebrow="Vandaag belangrijk"
        title="Je rijlestraject in een oogopslag"
        description="Bovenaan staat meteen wat nu telt: je volgende les, open aanvragen en de slimste vervolgstap."
        primary={learnerNextStep}
        items={learnerFocusItems}
      />

      <OnboardingPanel
        eyebrow="Nieuwe leerling"
        title="Van registratie naar je eerste rijles"
        description="Deze checklist houdt de start simpel: eerst je profiel op orde, dan de juiste instructeur kiezen en je eerste aanvraag afronden."
        steps={learnerOnboardingSteps}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <QuickActionGrid
        items={[
          {
            href: "/instructeurs",
            label: "Nieuwe match",
            title: "Vergelijk instructeurs",
            description:
              "Zoek op regio, prijs, beoordeling en lesauto om sneller de juiste match te vinden.",
          },
          {
            href: "/leerling/boekingen",
            label: "Boekingen",
            title: "Bekijk je aanvragen",
            description:
              "Controleer welke aanvragen nog wachten en welke lessen al zijn bevestigd.",
          },
          {
            href: "/leerling/instructeurs",
            label: "Favorieten",
            title: "Opgeslagen instructeurs",
            description:
              "Bewaar profielen die je later wilt vergelijken of direct wilt benaderen.",
          },
          {
            href: "/leerling/profiel",
            label: "Profiel",
            title: "Maak je profiel compleet",
            description:
              "Een duidelijk profiel helpt instructeurs sneller en beter reageren op je aanvraag.",
          },
        ]}
      />

      <LessonFocusCard
        lesson={nextLesson}
        title="Aankomende lesfocus"
        description={
          nextLesson
            ? `Je eerstvolgende moment met ${nextLesson.instructeur_naam} staat klaar. Voeg hem toe aan je agenda of open meteen je route.`
            : undefined
        }
      />

      <SharedLessonCompass
        boards={lessonCompassBoards.slice(0, 3)}
        role="leerling"
      />

      <LessonCheckinPanel boards={lessonCheckinBoards} role="leerling" />

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <InsightPanel
          title="Vandaag in focus"
          description="De belangrijkste signalen voor jouw rijlestraject."
          items={[
            {
              label: "Open aanvragen",
              value: pendingRequests.length
                ? `${pendingRequests.length} aanvraag(en) wachten op reactie`
                : "Geen open aanvragen",
            },
            {
              label: "Bevestigde trajecten",
              value: acceptedRequests.length
                ? `${acceptedRequests.length} traject(en) bevestigd of ingepland`
                : "Nog geen traject bevestigd",
            },
            {
              label: "Ongelezen meldingen",
              value: `${unreadNotifications.length} nieuwe melding(en)`,
            },
          ]}
        />

        <DataTableCard
          title="Komende lessen"
          description="Je eerstvolgende lessen en geplande afspraken."
          headers={["Les", "Datum", "Instructeur", "Locatie", "Status"]}
          rows={upcomingLessons.map((lesson) => [
            lesson.titel,
            `${lesson.datum} - ${lesson.tijd}`,
            lesson.instructeur_naam,
            lesson.locatie,
            lesson.status,
          ])}
          badgeColumns={[4]}
          emptyTitle="Nog geen lessen ingepland"
          emptyDescription="Zodra een instructeur je aanvraag accepteert of een les plant, verschijnt die hier."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <LearnerRequestOverview
          title="Je lesaanvragen"
          description="Alle aanvragen die via de booking flow naar instructeurs zijn verstuurd, inclusief verplaatsen of annuleren zolang ze nog open staan."
          requests={requests}
          emptyTitle="Nog geen aanvragen"
          emptyDescription="Start met vergelijken en vraag direct een proefles of pakket aan bij een instructeur."
        />

        <div className="rounded-[1.35rem] border border-white/70 bg-white/84 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Slimme volgende stap</h3>
          <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground dark:text-slate-300">
            Houd je traject overzichtelijk door open aanvragen snel op te volgen en je profiel compleet te houden.
          </p>
          <div className="mt-3.5 grid gap-2">
            {[
              pendingRequests.length
                ? "Je hebt nog aanvragen die wachten op reactie van een instructeur."
                : "Vraag een proefles aan om je traject te starten.",
              "Sla interessante instructeurs op zodat je ze later makkelijk terugvindt.",
              "Werk je voorkeuren en contactgegevens bij in je profiel.",
              "Check meldingen zodra een instructeur reageert op je aanvraag.",
            ].map((item) => (
              <div key={item} className="rounded-[0.95rem] bg-slate-50/85 px-3 py-2.5 text-[13px] leading-6 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
