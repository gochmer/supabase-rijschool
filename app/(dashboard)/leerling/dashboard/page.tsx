import Link from "next/link";
import {
  Bell,
  Brain,
  CalendarClock,
  CircleAlert,
  ClipboardList,
  NotebookPen,
  CreditCard,
  Gauge,
  MessageSquare,
  Search,
  Target,
  UserRound,
} from "lucide-react";

import { DataTableCard } from "@/components/dashboard/data-table-card";
import { DataHealthCallout } from "@/components/dashboard/data-health-callout";
import {
  DashboardActionHub,
  type DashboardActionHubItem,
} from "@/components/dashboard/dashboard-action-hub";
import {
  DashboardFocusPanel,
  type DashboardFocusItem,
} from "@/components/dashboard/dashboard-focus-panel";
import { LessonCheckinPanel } from "@/components/lessons/lesson-checkin-board";
import { LearnerRequestOverview } from "@/components/learners/learner-request-overview";
import { PageHeader } from "@/components/dashboard/page-header";
import { RealtimeDashboardSync } from "@/components/dashboard/realtime-dashboard-sync";
import { SharedLessonCompass } from "@/components/lessons/shared-lesson-compass";
import {
  formatTrajectoryDate,
  TrajectoryRelationshipCard,
} from "@/components/learners/trajectory-relationship-card";
import {
  OnboardingPanel,
  type OnboardingStep,
} from "@/components/dashboard/onboarding-panel";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentLearnerLessonCheckinBoards } from "@/lib/data/lesson-checkins";
import { getCurrentLearnerLessonCompassBoards } from "@/lib/data/lesson-compass";
import { getLearnerJourneyDataHealth } from "@/lib/data/data-health";
import {
  getLeerlingDashboardMetrics,
  getLeerlingLessonRequests,
  getLeerlingLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentNotifications } from "@/lib/data/notifications";
import {
  getCurrentLeerlingRecord,
  getCurrentProfile,
} from "@/lib/data/profiles";
import { getCurrentLeerlingProgressWorkspace } from "@/lib/data/student-progress";
import {
  resolveLearnerNextAction,
  type NextActionCategory,
  type NextActionTone,
} from "@/lib/next-action-engine";
import {
  getStudentProgressFocusItems,
  getStudentProgressStatusMeta,
  getStudentProgressSummary,
} from "@/lib/student-progress";
import type { StudentProgressLessonNote } from "@/lib/types";
import { cn } from "@/lib/utils";

type LearnerCockpitCard = {
  accentClassName: string;
  description: string;
  href: string;
  icon: typeof Gauge;
  label: string;
  meta: string;
  title: string;
  value: string;
};

function getNextActionIcon(category: NextActionCategory) {
  switch (category) {
    case "exam":
      return Target;
    case "feedback":
      return MessageSquare;
    case "onboarding":
      return UserRound;
    case "package":
      return CreditCard;
    case "skill":
      return Brain;
    case "planning":
    default:
      return CalendarClock;
  }
}

function getNextActionSignalClass(tone: NextActionTone) {
  switch (tone) {
    case "danger":
      return "border-rose-300/18 bg-rose-500/10 text-rose-100";
    case "success":
      return "border-emerald-300/18 bg-emerald-500/10 text-emerald-100";
    case "warning":
      return "border-amber-300/18 bg-amber-500/10 text-amber-100";
    case "default":
    default:
      return "border-sky-300/18 bg-sky-500/10 text-sky-100";
  }
}

function LearnerCockpitCard({ card }: { card: LearnerCockpitCard }) {
  return (
    <Link
      href={card.href}
      className="group relative min-h-[12rem] overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(15,23,42,0.38))] p-4 shadow-[0_22px_70px_-52px_rgba(0,0,0,0.95)] transition hover:border-white/18 hover:bg-white/[0.08]"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r opacity-90",
          card.accentClassName,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
          <card.icon className="size-5" />
        </div>
        <span className="max-w-[8rem] truncate rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-slate-200 uppercase">
          {card.meta}
        </span>
      </div>
      <p className="relative mt-4 text-[10px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
        {card.label}
      </p>
      <div className="relative mt-2 flex items-end gap-2">
        <p className="text-2xl font-semibold tracking-tight text-white">
          {card.value}
        </p>
      </div>
      <h3 className="relative mt-2 line-clamp-1 text-base font-semibold text-white">
        {card.title}
      </h3>
      <p className="relative mt-1.5 line-clamp-2 text-[13px] leading-6 text-slate-300">
        {card.description}
      </p>
    </Link>
  );
}

function formatLessonReportDate(dateValue?: string | null) {
  if (!dateValue) {
    return "Nog geen datum";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(date);
}

function LatestLessonReportCard({
  note,
}: {
  note?: StudentProgressLessonNote | null;
}) {
  const hasReport = Boolean(
    note?.samenvatting?.trim() ||
      note?.sterk_punt?.trim() ||
      note?.focus_volgende_les?.trim(),
  );

  return (
    <section className="overflow-hidden rounded-xl border border-emerald-300/18 bg-[linear-gradient(145deg,rgba(6,78,59,0.28),rgba(15,23,42,0.72),rgba(14,165,233,0.08))] p-4 text-white shadow-[0_24px_80px_-54px_rgba(0,0,0,0.95)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex size-10 items-center justify-center rounded-xl border border-emerald-200/18 bg-emerald-300/10 text-emerald-100">
              <NotebookPen className="size-5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-emerald-100/75 uppercase">
                Laatste lesverslag
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {hasReport ? "Dit nam je mee uit je laatste les" : "Nog geen lesverslag"}
              </h2>
            </div>
          </div>

          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {hasReport
              ? (note?.samenvatting?.trim() ??
                "Je instructeur heeft feedback opgeslagen voor je traject.")
              : "Zodra je instructeur feedback opslaat, zie je hier meteen je samenvatting en focus voor de volgende les."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold text-slate-200">
            {formatLessonReportDate(note?.lesdatum)}
          </span>
          {hasReport ? (
            <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
              Nieuwste feedback
            </span>
          ) : (
            <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold text-slate-300">
              Wacht op instructeur
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-slate-950/24 p-3">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
            Sterk punt
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            {note?.sterk_punt?.trim() ||
              "Na je volgende les vult je instructeur hier in wat goed ging."}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/24 p-3">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
            Focus voor volgende keer
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            {note?.focus_volgende_les?.trim() ||
              "Je volgende focus verschijnt hier zodra feedback is opgeslagen."}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
        <Button
          asChild
          className="h-9 rounded-full bg-emerald-300 text-emerald-950 hover:bg-emerald-200"
        >
          <Link href="/leerling/boekingen">Open boekingen</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-9 rounded-full border-white/10 bg-white/7 text-white hover:bg-white/12"
        >
          <Link href="/leerling/voortgang">Bekijk voortgang</Link>
        </Button>
      </div>
    </section>
  );
}

export default async function LeerlingDashboardPage() {
  const [
    metrics,
    leerling,
    lessons,
    requests,
    notifications,
    lessonCompassBoards,
    lessonCheckinBoards,
    progressWorkspace,
    profile,
    dataHealth,
  ] =
    await Promise.all([
      getLeerlingDashboardMetrics(),
      getCurrentLeerlingRecord(),
      getLeerlingLessons(),
      getLeerlingLessonRequests(),
      getCurrentNotifications(),
      getCurrentLearnerLessonCompassBoards(),
      getCurrentLearnerLessonCheckinBoards(),
      getCurrentLeerlingProgressWorkspace(),
      getCurrentProfile(),
      getLearnerJourneyDataHealth(),
    ]);

  const upcomingLessons = lessons.slice(0, 4);
  const nextLesson = lessons.find((lesson) =>
    ["geaccepteerd", "ingepland"].includes(lesson.status)
  );
  const pendingRequests = requests.filter((item) => item.status === "aangevraagd");
  const acceptedRequests = requests.filter((item) =>
    ["geaccepteerd", "ingepland"].includes(item.status)
  );
  const activeTrialStatuses = ["aangevraagd", "geaccepteerd", "ingepland", "afgerond"];
  const trialLessonUnavailable =
    requests.some(
      (request) =>
        request.aanvraag_type === "proefles" &&
        activeTrialStatuses.includes(request.status),
    ) ||
    lessons.some(
      (lesson) =>
        lesson.titel.toLowerCase().includes("proefles") &&
        activeTrialStatuses.includes(lesson.status),
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
  const primaryRequest =
    acceptedRequests[0] ?? latestPendingRequest ?? requests[0] ?? null;
  const progressSummary = getStudentProgressSummary(
    progressWorkspace.assessments,
  );
  const progressValue =
    progressSummary.beoordeeldCount > 0
      ? progressSummary.percentage
      : leerling?.voortgang_percentage ?? metrics[0]?.waarde?.replace("%", "") ?? 0;
  const progressNumber = Number(progressValue);
  const primaryFocusSkill =
    getStudentProgressFocusItems(progressWorkspace.assessments, 1)[0] ?? null;
  const focusStatusMeta = primaryFocusSkill?.latest?.status
    ? getStudentProgressStatusMeta(primaryFocusSkill.latest.status)
    : null;
  const latestLessonNote =
    [...progressWorkspace.notes].sort((left, right) => {
      if (left.lesdatum !== right.lesdatum) {
        return right.lesdatum.localeCompare(left.lesdatum);
      }

      return right.updated_at.localeCompare(left.updated_at);
    })[0] ?? null;
  const attentionPoint =
    latestLessonNote?.focus_volgende_les ||
    latestLessonNote?.samenvatting ||
    (primaryFocusSkill
      ? `${primaryFocusSkill.label} vraagt nog aandacht.`
      : "Zodra je instructeur feedback invult, verschijnt je aandachtspunt hier.");
  const nextAction = resolveLearnerNextAction({
    assessments: progressWorkspace.assessments,
    hasPackage: Boolean(leerling?.pakket_id),
    journeyStatus: leerling?.student_status,
    lessons,
    notes: progressWorkspace.notes,
    profileComplete,
    requests,
  });
  const NextActionIcon = getNextActionIcon(nextAction.category);
  const trajectoryInstructorName =
    nextLesson?.instructeur_naam ??
    primaryRequest?.instructeur_naam ??
    lessonCompassBoards[0]?.counterpart_name ??
    "Instructeur volgt";
  const trajectoryStartLabel =
    primaryRequest?.voorkeursdatum ??
    nextLesson?.datum ??
    formatTrajectoryDate(profile?.created_at) ??
    "Start volgt";
  const trajectoryGoalLabel =
    primaryRequest?.pakket_naam ??
    (primaryRequest?.aanvraag_type === "proefles"
      ? "Proefles afronden"
      : primaryRequest?.aanvraag_type === "pakket"
        ? "Pakket starten"
        : "Rijbewijs B");
  const trajectoryRhythmLabel = nextLesson
    ? `${nextLesson.datum} om ${nextLesson.tijd}`
    : latestPendingRequest
      ? "Aanvraag wacht op reactie"
      : "Ritme volgt na eerste planning";
  const trajectoryMilestone = nextLesson
    ? `Volgende les: ${nextLesson.titel}`
    : latestPendingRequest
      ? `Reactie van ${latestPendingRequest.instructeur_naam}`
      : "Eerste instructeur kiezen";
  const trajectoryPreferences = [
    nextLesson?.locatie ?? "Ophaallocatie volgt",
    primaryRequest?.tijdvak ?? "Lestijd afstemmen",
    unreadNotifications.length ? "Bericht open" : "Afstemming via berichten",
  ];
  const learnerNextStep: DashboardFocusItem = {
    label: nextAction.label,
    title: nextAction.title,
    value: nextAction.value,
    description: nextAction.description,
    href: nextAction.href,
    ctaLabel: nextAction.ctaLabel,
    icon: NextActionIcon,
    tone: nextAction.tone,
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
        : trialLessonUnavailable
          ? "Je proefles is al gebruikt of staat gepland. De volgende stap loopt via pakket of vervolglessen."
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
        "Kies iemand die past bij je regio, lesstijl, transmissie en tempo.",
      href: "/instructeurs",
      ctaLabel: hasChosenInstructor ? "Vergelijk verder" : "Kies instructeur",
      complete: hasChosenInstructor,
      icon: Search,
      meta: hasChosenInstructor ? "Eerste koppeling bekend" : "Nog geen keuze gemaakt",
    },
    {
      label: "Stap 3",
      title: trialLessonUnavailable ? "Pakket of vervolgles aanvragen" : "Proefles of pakket aanvragen",
      description:
        trialLessonUnavailable
          ? "Je proefles is al gebruikt of staat gepland. De volgende stap is een pakket of vervolgles."
          : "Start met een concrete aanvraag. Daarna kan de instructeur reageren of meteen plannen.",
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
  const learnerActionItems: DashboardActionHubItem[] = [
    {
      title: "Boekingen",
      description: "Lessen, aanvragen en status op een plek.",
      href: "/leerling/boekingen",
      icon: CalendarClock,
      tone: nextLesson ? "emerald" : "sky",
      meta: nextLesson ? "Volgende les klaar" : "Planning",
    },
    {
      title: "Instructeur zoeken",
      description: "Vergelijk profielen en start direct een aanvraag.",
      href: "/instructeurs",
      icon: Search,
      tone: "sky",
      meta: "Startpunt",
    },
    {
      title: "Berichten",
      description: "Reacties en afspraken met instructeurs.",
      href: "/leerling/berichten",
      icon: MessageSquare,
      tone: unreadNotifications.length ? "amber" : "slate",
      meta: unreadNotifications.length ? `${unreadNotifications.length} nieuw` : "Inbox",
    },
    {
      title: "Profiel",
      description: "Gegevens die instructeurs nodig hebben.",
      href: "/leerling/profiel",
      icon: UserRound,
      tone: profileComplete ? "emerald" : "amber",
      meta: profileComplete ? "Compleet" : "Aanvullen",
    },
    {
      title: "Betalingen",
      description: "Pakketten, opties en betaalstatus.",
      href: "/leerling/betalingen",
      icon: CreditCard,
      tone: "slate",
      meta: "Financieel",
    },
  ];
  const cockpitCards: LearnerCockpitCard[] = [
    {
      accentClassName: "from-sky-400/22 via-cyan-300/12 to-white/5",
      description:
        progressSummary.beoordeeldCount > 0
          ? `${progressSummary.zelfstandigCount} onderdelen zelfstandig, ${progressSummary.aandachtCount} vragen aandacht.`
          : "Nog geen beoordeling nodig om te starten. Na je lessen vult je instructeur dit aan.",
      href: "/leerling/voortgang",
      icon: Gauge,
      label: "Voortgang",
      meta: `${progressSummary.beoordeeldCount} beoordeeld`,
      title: "Richting zelfstandig rijden",
      value: `${Number.isFinite(progressNumber) ? Math.round(progressNumber) : 0}%`,
    },
    {
      accentClassName: "from-emerald-400/22 via-teal-300/12 to-white/5",
      description: nextLesson
        ? `${nextLesson.tijd} met ${nextLesson.instructeur_naam}. Locatie: ${nextLesson.locatie}.`
        : "Nog geen geplande les. Als er een moment staat, zie je hier meteen tijd en locatie.",
      href: "/leerling/boekingen",
      icon: CalendarClock,
      label: "Volgende les",
      meta: nextLesson ? nextLesson.status : "Planning",
      title: nextLesson ? nextLesson.titel : "Nog niet ingepland",
      value: nextLesson ? nextLesson.datum : "Geen les",
    },
    {
      accentClassName: "from-violet-400/22 via-fuchsia-300/12 to-white/5",
      description: focusStatusMeta
        ? `${primaryFocusSkill?.sectionLabel} staat nu op ${focusStatusMeta.label.toLowerCase()}. Pak dit bewust mee in je volgende les.`
        : "Zodra er feedback is, kiest het systeem hier een aandachtige focus voor je volgende les.",
      href: "/leerling/voortgang",
      icon: Brain,
      label: "Focus skill",
      meta: focusStatusMeta?.label ?? "Nog open",
      title: primaryFocusSkill?.label ?? "Nog geen focus skill",
      value: primaryFocusSkill ? "Focus" : "Start",
    },
    {
      accentClassName: "from-amber-400/24 via-orange-300/12 to-white/5",
      description: attentionPoint,
      href: "/leerling/voortgang",
      icon: CircleAlert,
      label: "Aandachtspunt",
      meta: latestLessonNote ? "Feedback" : "Nog leeg",
      title: latestLessonNote?.focus_volgende_les
        ? "Volgende les"
        : primaryFocusSkill
          ? primaryFocusSkill.label
          : "Wacht op feedback",
      value: latestLessonNote ? "Actie" : "Open",
    },
  ];

  return (
    <>
      <PageHeader
        tone="urban"
        title="Mijn rijlesoverzicht"
        description="Alles wat je vandaag nodig hebt: je volgende stap, planning, voortgang en open meldingen."
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

      <DataHealthCallout
        label="Leerling datastatus"
        results={dataHealth}
      />

      <section className="rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.84),rgba(30,41,59,0.48),rgba(14,165,233,0.09))] p-4 text-white shadow-[0_24px_80px_-54px_rgba(0,0,0,0.95)]">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.22em] text-sky-200 uppercase">
              Leerling cockpit
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Waar sta je nu en wat is je volgende stap?
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-300">
              Je dashboard laat vooral zien wat nu belangrijk is, zodat je niet
              hoeft te zoeken naar de volgende stap.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-full border-white/10 bg-white/7 px-4 text-sm font-semibold text-white hover:bg-white/12 lg:shrink-0"
          >
            <Link href="/leerling/voortgang">
              Bekijk voortgang
              <Target className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {cockpitCards.map((card) => (
            <LearnerCockpitCard key={card.label} card={card} />
          ))}
        </div>
      </section>

      <DashboardActionHub
        compact
        title="Waar wil je meteen naartoe?"
        description="De meest gebruikte acties staan bovenaan. Minder zoeken, sneller verder."
        primaryHref={nextLesson ? "/leerling/boekingen" : "/instructeurs"}
        primaryLabel={nextLesson ? "Open volgende les" : "Zoek instructeur"}
        items={learnerActionItems}
      />

      <LatestLessonReportCard note={latestLessonNote} />

      <Tabs defaultValue="vandaag" className="space-y-4">
        <TabsList className="sticky top-28 z-10 !h-auto min-h-12 w-full justify-start overflow-x-auto overflow-y-hidden rounded-xl border border-white/10 bg-slate-950/72 p-1 text-slate-300 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.65)] [-ms-overflow-style:none] [scrollbar-width:none] backdrop-blur-xl [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="vandaag" className="h-10 rounded-full px-4 data-active:bg-sky-200 data-active:text-slate-950">
            Vandaag
          </TabsTrigger>
          <TabsTrigger value="voortgang" className="h-10 rounded-full px-4 data-active:bg-emerald-200 data-active:text-slate-950">
            Voortgang
          </TabsTrigger>
          <TabsTrigger value="planning" className="h-10 rounded-full px-4 data-active:bg-amber-200 data-active:text-slate-950">
            Planning
          </TabsTrigger>
        </TabsList>

      <TrajectoryRelationshipCard
        learner={{
          name: profile?.volledige_naam ?? "Leerling",
          roleLabel: "Leerling",
          subtitle: profileComplete ? "Profiel staat klaar" : "Profiel aanvullen",
          tone: "sky",
        }}
        instructor={{
          name: trajectoryInstructorName,
          roleLabel: "Instructeur",
          subtitle: nextLesson ? "Traject actief" : "Koppeling in voorbereiding",
          tone: "emerald",
        }}
        startLabel={trajectoryStartLabel}
        goalLabel={trajectoryGoalLabel}
        rhythmLabel={trajectoryRhythmLabel}
        nextMilestone={trajectoryMilestone}
        preferences={trajectoryPreferences}
        agreements={[
          "Voorbereid naar de les",
          "Wijzigingen via boekingen",
          "Alleen delen wat nodig is",
        ]}
      />

      <DashboardFocusPanel
        compact
        eyebrow="Volgende stap"
        title="Wat is nu logisch om te doen?"
        description={`${nextAction.reason} Daarom tonen we deze actie bovenaan.`}
        primary={learnerNextStep}
        items={learnerFocusItems}
      />

      <section className="grid gap-3 md:grid-cols-3">
        {nextAction.signals.map((signal) => (
          <div
            key={signal.label}
            className={cn(
              "rounded-lg border px-4 py-3 shadow-[0_18px_45px_-38px_rgba(0,0,0,0.9)]",
              getNextActionSignalClass(signal.tone),
            )}
          >
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase opacity-75">
              {signal.label}
            </p>
            <p className="mt-1 text-base font-semibold">{signal.value}</p>
          </div>
        ))}
      </section>

      <OnboardingPanel
        compact
        eyebrow="Nieuwe leerling"
        title="Van registratie naar je eerste rijles"
        description="Een rustige start in vier stappen: profiel, instructeur, aanvraag en eerste les."
        steps={learnerOnboardingSteps}
        hideWhenComplete
      />

        <TabsContent value="vandaag" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="voortgang" className="mt-0 space-y-4">
          <SharedLessonCompass
            boards={lessonCompassBoards.slice(0, 3)}
            role="leerling"
          />
          <LessonCheckinPanel boards={lessonCheckinBoards} role="leerling" />
        </TabsContent>

        <TabsContent value="planning" className="mt-0">
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <DataTableCard
              title="Komende lessen"
              description="Alleen je eerstvolgende momenten, zodat de planning overzichtelijk blijft."
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
            <LearnerRequestOverview
              title="Je lesaanvragen"
              description="Zie direct welke aanvragen nog wachten, lopen of al klaar zijn."
              requests={requests}
              emptyTitle="Nog geen aanvragen"
              emptyDescription="Start met vergelijken en vraag direct een proefles of pakket aan bij een instructeur."
            />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
