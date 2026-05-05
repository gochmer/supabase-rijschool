import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Gauge,
  Heart,
  Package,
  Phone,
  User,
} from "lucide-react";

import {
  formatTrajectoryDate,
  TrajectoryRelationshipCard,
} from "@/components/learners/trajectory-relationship-card";
import { StudentProgressReadOnlyCard } from "@/components/progress/student-progress-readonly-card";
import { ProfileForm } from "@/components/profile/profile-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentStudentPackageOverview } from "@/lib/data/packages";
import {
  getLeerlingLessonRequests,
  getLeerlingLessons,
} from "@/lib/data/lesson-requests";
import {
  getCurrentLeerlingRecord,
  getCurrentProfile,
} from "@/lib/data/profiles";
import { getCurrentLeerlingProgressWorkspace } from "@/lib/data/student-progress";
import { resolveDriverJourneyState } from "@/lib/driver-journey";
import { getStudentExamReadiness } from "@/lib/student-progress";

const shellCardClassName =
  "rounded-xl border border-white/10 bg-white/[0.055] shadow-[0_20px_60px_-44px_rgba(0,0,0,0.9)]";

export default async function LeerlingProfielPage() {
  const [profile, leerling, lessons, requests, packageOverview, progressWorkspace] =
    await Promise.all([
      getCurrentProfile(),
      getCurrentLeerlingRecord(),
      getLeerlingLessons(),
      getLeerlingLessonRequests(),
      getCurrentStudentPackageOverview(),
      getCurrentLeerlingProgressWorkspace(),
    ]);

  const renderDate = new Date();
  const renderTime = renderDate.getTime();
  const today = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(renderDate);

  const nextLesson = lessons.find((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status)
  );
  const pendingRequestItems = requests.filter(
    (request) => request.status === "aangevraagd"
  );
  const acceptedRequestItems = requests.filter((request) =>
    ["ingepland", "geaccepteerd"].includes(request.status)
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
  const pendingRequests = pendingRequestItems.length;
  const primaryRequest =
    acceptedRequestItems[0] ?? pendingRequestItems[0] ?? requests[0] ?? null;
  const progressValue = leerling?.voortgang_percentage ?? 0;
  const favoriteCount = leerling?.favoriete_instructeurs?.length ?? 0;
  const hasProfileName = Boolean(profile?.volledige_naam.trim());
  const hasProfilePhone = Boolean(profile?.telefoon.trim());
  const examReadiness = getStudentExamReadiness(
    progressWorkspace.assessments,
    progressWorkspace.notes,
  );
  const hasExamLessonPlanned = lessons.some((lesson) => {
    const title = (lesson.titel ?? "").toLowerCase();
    const startDate = lesson.start_at
      ? new Date(lesson.start_at)
      : new Date(`${lesson.datum}T12:00:00`);

    return (
      !Number.isNaN(startDate.getTime()) &&
      startDate.getTime() >= renderTime &&
      ["geaccepteerd", "ingepland"].includes(lesson.status) &&
      (title.includes("examen") || title.includes("proefexamen"))
    );
  });
  const journeyState = resolveDriverJourneyState({
    completedLessons: lessons.filter((lesson) => lesson.status === "afgerond")
      .length,
    currentStatus: leerling?.student_status,
    examReadinessScore: examReadiness.score,
    hasExamLessonPlanned,
    hasPackage: Boolean(leerling?.pakket_id),
    hasPlannedLessons: lessons.some((lesson) =>
      ["geaccepteerd", "ingepland"].includes(lesson.status),
    ),
    hasRequest: requests.length > 0,
    profileComplete: hasProfileName && hasProfilePhone,
  });
  const packageLabel =
    packageOverview.assignedPackage?.naam ?? "Nog geen pakket gekoppeld";
  const packageUsage = packageOverview.lessonUsage;
  const packageUsageLabel = packageOverview.assignedPackage
    ? `${packageOverview.assignment.statusLabel} - ${packageOverview.assignment.usageLabel}`
    : null;
  const profileIntegrity = [
    hasProfileName,
    hasProfilePhone,
    Boolean(nextLesson),
    Boolean(packageOverview.assignedPackage),
  ];
  const accountQuality = Math.round(
    (profileIntegrity.filter(Boolean).length / profileIntegrity.length) * 100
  );
  const trajectoryInstructorName =
    nextLesson?.instructeur_naam ??
    primaryRequest?.instructeur_naam ??
    progressWorkspace.laatsteInstructeurNaam ??
    "Instructeur volgt";
  const trajectoryStartLabel =
    primaryRequest?.voorkeursdatum ??
    nextLesson?.datum ??
    formatTrajectoryDate(profile?.created_at) ??
    "Start volgt";
  const trajectoryGoalLabel =
    packageOverview.assignedPackage?.naam ??
    primaryRequest?.pakket_naam ??
    (primaryRequest?.aanvraag_type === "proefles"
      ? "Proefles afronden"
      : "Rijbewijs B");
  const trajectoryRhythmLabel = nextLesson
    ? `${nextLesson.datum} om ${nextLesson.tijd}`
    : pendingRequests > 0
      ? "Aanvraag wacht op reactie"
      : "Ritme volgt na eerste planning";
  const trajectoryMilestone = nextLesson
    ? `Volgende les: ${nextLesson.titel}`
    : pendingRequestItems[0]
      ? `Reactie van ${pendingRequestItems[0].instructeur_naam}`
      : !hasProfileName || !hasProfilePhone
        ? "Profiel compleet maken"
        : "Instructeur kiezen";
  const trajectoryPreferences = [
    nextLesson?.locatie ?? "Ophaallocatie volgt",
    primaryRequest?.tijdvak ?? "Lestijd afstemmen",
    hasProfilePhone ? "Contact bekend" : "Telefoon aanvullen",
  ];

  const overviewCards = [
    {
      icon: User,
      label: "Accountkwaliteit",
      value: `${accountQuality}%`,
      accentClassName: "from-sky-400/20 via-cyan-300/12 to-white/5",
      iconClassName: "bg-sky-400/14 text-sky-100",
      barClassName: "bg-sky-300",
      detail:
        accountQuality === 100
          ? "Je basisgegevens en planning staan professioneel en compleet."
          : "Werk je gegevens bij voor een sterker en completer profiel.",
    },
    {
      icon: CalendarDays,
      label: "Volgende les",
      value: nextLesson ? `${nextLesson.datum}` : "Nog niet ingepland",
      accentClassName: "from-emerald-400/20 via-teal-300/12 to-white/5",
      iconClassName: "bg-emerald-400/14 text-emerald-100",
      barClassName: "bg-emerald-300",
      detail: nextLesson
        ? `${nextLesson.tijd} met ${nextLesson.instructeur_naam}`
        : "Zodra je een les bevestigt zie je hem hier direct terug.",
    },
    {
      icon: Heart,
      label: "Favorieten",
      value: `${favoriteCount}`,
      accentClassName: "from-rose-400/20 via-pink-300/12 to-white/5",
      iconClassName: "bg-rose-400/14 text-rose-100",
      barClassName: "bg-rose-300",
      detail:
        favoriteCount > 0
          ? "Je bewaarde instructeurs blijven hier snel inzichtelijk."
          : "Sla interessante instructeurs op om sneller te vergelijken.",
    },
    {
      icon: Package,
      label: "Pakket",
      value: packageLabel,
      accentClassName: "from-amber-400/22 via-orange-300/12 to-white/5",
      iconClassName: "bg-amber-400/14 text-amber-100",
      barClassName: "bg-amber-300",
      detail: packageOverview.assignedPackage
        ? packageUsageLabel ??
          `${packageOverview.assignedPackage.lessen || "Flexibel"} lessen - ${packageOverview.assignedPackage.prijsLabel}`
        : `${packageOverview.availablePackages.length} pakketopties staan klaar.`,
    },
  ];

  const nextProfileStep = !hasProfileName
    ? {
        icon: User,
        label: "Profiel",
        title: "Vul eerst je volledige naam aan.",
        text: "Dan staan boekingen, berichten en voortgang direct netjes op jouw naam.",
        href: "#profielstudio",
        action: "Naam invullen",
      }
    : !hasProfilePhone
      ? {
          icon: Phone,
          label: "Contact",
          title: "Voeg je telefoonnummer toe.",
          text: "Handig voor snelle afstemming wanneer een les of aanvraag verandert.",
          href: "#profielstudio",
          action: "Telefoon toevoegen",
        }
      : pendingRequests > 0
      ? {
          icon: CalendarDays,
          label: "Aanvraag",
          title: "Er loopt nog een aanvraag.",
          text: "Bekijk de status en houd je boekingen rustig op orde.",
          href: "/leerling/boekingen",
          action: "Aanvraag bekijken",
        }
        : !packageOverview.assignedPackage
          ? {
              icon: Package,
              label: "Pakket",
              title: "Kies eerst een passend pakket.",
              text: trialLessonUnavailable
                ? "Je proefles is al gebruikt of gepland. Koppel nu een pakket om vervolglessen vrij te geven."
                : "Na je proefles geeft een gekoppeld pakket vervolglessen en je lesteller vrij.",
              href: "/leerling/instructeurs",
              action: "Pakketten bekijken",
            }
        : !nextLesson
          ? {
              icon: CalendarDays,
              label: "Planning",
              title: "Plan je volgende rijles.",
              text: "Zo blijft je traject zichtbaar in beweging en weet je wat de eerstvolgende stap is.",
              href: "/leerling/instructeurs",
              action: "Instructeur kiezen",
            }
            : {
                icon: CalendarDays,
                label: "Rustig op orde",
                title: "Je profiel staat netjes klaar.",
                text: "Houd vooral je boekingen bij en werk je gegevens bij als er iets verandert.",
                href: "/leerling/boekingen",
                action: "Boekingen bekijken",
              };
  const NextProfileStepIcon = nextProfileStep.icon;
  const heroChips = [
    {
      label: journeyState.label,
      className: "border-emerald-300/18 bg-emerald-400/12 text-emerald-100",
    },
    {
      label: `${progressValue}% voortgang`,
      className: "border-sky-300/18 bg-sky-400/12 text-sky-100",
    },
    {
      label: `${favoriteCount} favorieten`,
      className: "border-rose-300/18 bg-rose-400/12 text-rose-100",
    },
    {
      label: packageOverview.assignedPackage
        ? `${packageOverview.assignment.statusLabel}: ${packageLabel}`
        : packageLabel,
      className: "border-amber-300/18 bg-amber-400/12 text-amber-100",
    },
  ];

  return (
    <div className="space-y-4 text-white">
      <section
        className={`relative overflow-hidden p-4 print:hidden ${shellCardClassName}`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_27%),radial-gradient(circle_at_84%_18%,rgba(16,185,129,0.13),transparent_24%),radial-gradient(circle_at_62%_76%,rgba(245,158,11,0.13),transparent_26%),radial-gradient(circle_at_18%_88%,rgba(244,63,94,0.1),transparent_22%)]" />
        </div>

        <div className="relative grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-semibold tracking-[0.22em] text-slate-200 uppercase">
                Profile suite
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-medium tracking-[0.12em] text-slate-300 uppercase">
                {today}
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Profiel
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Beheer je leerlinggegevens, trajectafspraken en voortgang vanuit een compact overzicht.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {heroChips.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-full border px-3.5 py-2 text-[12px] font-semibold shadow-[0_18px_36px_-28px_rgba(15,23,42,0.42)] ${item.className}`}
                >
                  {item.label}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-full border border-white/12 bg-[linear-gradient(135deg,#f8fafc,#cbd5e1)] px-5 text-[0.95rem] font-semibold text-slate-950 shadow-[0_22px_46px_-26px_rgba(148,163,184,0.42)] hover:brightness-[1.03]"
              >
                <Link href="/leerling/instructeurs">
                  Instructeurs bekijken
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-white/10 bg-white/6 px-5 text-[0.95rem] font-semibold text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.42)] backdrop-blur hover:bg-white/10"
              >
                <Link href="/leerling/boekingen">Boekingen beheren</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/6 p-4 shadow-[0_20px_48px_-32px_rgba(15,23,42,0.54)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-300 uppercase">
                  Account overview
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Persoonlijk overzicht
                </h2>
              </div>
              <div className="rounded-full border border-emerald-400/18 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-emerald-200 uppercase">
                {journeyState.shortLabel}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-emerald-300/14 bg-emerald-400/8 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/18 bg-emerald-400/12 text-emerald-100">
                    <Gauge className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-300 uppercase">
                      Driver journey
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-white">
                      {journeyState.label}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {journeyState.nextAction}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/8 bg-black/12 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-200">
                    Profielcompleetheid
                  </p>
                  <p className="text-lg font-semibold text-white">{accountQuality}%</p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#f8fafc,#94a3b8,#0f172a)]"
                    style={{ width: `${Math.min(Math.max(accountQuality, 8), 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Een completer account maakt plannen en communiceren merkbaar eenvoudiger.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-lg border border-white/8 bg-white/5 p-4">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-300 uppercase">
                    Volgende les
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {nextLesson ? `${nextLesson.datum} om ${nextLesson.tijd}` : "Nog niet bekend"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {nextLesson
                      ? `${nextLesson.instructeur_naam} - ${nextLesson.locatie}`
                      : "Bevestigde lessen verschijnen hier automatisch."}
                  </p>
                </div>

                <div className="rounded-lg border border-white/8 bg-white/5 p-4">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-300 uppercase">
                    Open aanvragen
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {pendingRequests} aanvraag(en)
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Houd hier zicht op lopende verzoeken en reacties van instructeurs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Tabs defaultValue="profiel" className="space-y-4 print:hidden">
        <TabsList className="sticky top-28 z-10 !h-auto min-h-12 w-full justify-start overflow-x-auto overflow-y-hidden rounded-xl border border-white/10 bg-slate-950/72 p-1 text-slate-300 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.65)] [-ms-overflow-style:none] [scrollbar-width:none] backdrop-blur-xl [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="profiel" className="h-10 rounded-full px-4 data-active:bg-sky-200 data-active:text-slate-950">
            Profiel
          </TabsTrigger>
          <TabsTrigger value="voortgang" className="h-10 rounded-full px-4 data-active:bg-emerald-200 data-active:text-slate-950">
            Voortgang
          </TabsTrigger>
        </TabsList>

        <TrajectoryRelationshipCard
          learner={{
            name: profile?.volledige_naam ?? "Leerling",
            roleLabel: "Leerling",
            subtitle:
              accountQuality >= 75 ? "Profiel sterk op orde" : "Profiel aanvullen",
            tone: "sky",
          }}
          instructor={{
            name: trajectoryInstructorName,
            roleLabel: "Instructeur",
            subtitle: nextLesson ? "Samen actief" : "Koppeling volgt",
            tone: "emerald",
          }}
          startLabel={trajectoryStartLabel}
          goalLabel={trajectoryGoalLabel}
          rhythmLabel={trajectoryRhythmLabel}
          nextMilestone={trajectoryMilestone}
          preferences={trajectoryPreferences}
          agreements={[
            "Voortgang samen volgen",
            "Berichten overzichtelijk",
            "Gevoelige info opt-in",
          ]}
          description="Je belangrijkste trajectafspraken bij elkaar: wie rijdt mee, wat is het doel en wat is de eerstvolgende stap."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <div
              key={card.label}
              className={`relative overflow-hidden p-5 ${shellCardClassName}`}
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${card.accentClassName}`} />
              <div className={`relative flex size-11 items-center justify-center rounded-2xl border border-white/10 ${card.iconClassName}`}>
                <card.icon className="size-5" />
              </div>
              <div className={`relative mt-4 h-1 w-10 rounded-full ${card.barClassName}`} />
              <p className="relative mt-3 text-[10px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
                {card.label}
              </p>
              <p className="relative mt-2 text-xl font-semibold text-white">{card.value}</p>
              <p className="relative mt-2 text-sm leading-6 text-slate-300">{card.detail}</p>
            </div>
          ))}
        </div>

        <TabsContent value="profiel" className="mt-0">
          <section
            id="profielstudio"
            className={`p-4 ${shellCardClassName}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-300 uppercase">
                  Profielstudio
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Je leerlinggegevens professioneel op orde
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                  Vul je gegevens in en houd profiel, planning en voortgang rustig
                  bij elkaar zonder dat het overzicht zwaar wordt.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-slate-200 uppercase">
                Leerling account
              </div>
            </div>

            <div className="mt-6">
              <ProfileForm
                role="leerling"
                tone="urban"
                initialValues={{
                  volledigeNaam: profile?.volledige_naam ?? "",
                  telefoon: profile?.telefoon ?? "",
                }}
              />
            </div>

            <div className="mt-5 rounded-[1.45rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(148,163,184,0.08),rgba(15,23,42,0.26))] p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-slate-100">
                    <NextProfileStepIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
                      {nextProfileStep.label}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      {nextProfileStep.title}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                      {nextProfileStep.text}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-full border-white/10 bg-white/7 px-4 text-sm font-semibold text-white hover:bg-white/12 md:shrink-0"
                >
                  <Link href={nextProfileStep.href}>
                    {nextProfileStep.action}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="voortgang" className="mt-0">
          <StudentProgressReadOnlyCard
            assessments={progressWorkspace.assessments}
            notes={progressWorkspace.notes}
            progressValue={progressValue}
            volgendeLes={
              nextLesson ? `${nextLesson.datum} om ${nextLesson.tijd}` : "Nog niet ingepland"
            }
            laatsteInstructeurNaam={progressWorkspace.laatsteInstructeurNaam}
            profile={{
              email: profile?.email ?? "",
              inschrijfdatum: profile?.created_at ?? "",
              naam: profile?.volledige_naam ?? "Leerling",
              pakket: packageLabel,
              telefoon: profile?.telefoon ?? "",
            }}
            packageUsage={{
              packageName: packageOverview.assignedPackage?.naam ?? null,
              totalLessons: packageUsage.totalLessons,
              plannedLessons: packageUsage.plannedLessons,
              usedLessons: packageUsage.usedLessons,
              remainingLessons: packageUsage.remainingLessons,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
