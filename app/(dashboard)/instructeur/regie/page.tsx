import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Gauge,
  PackageCheck,
  UsersRound,
} from "lucide-react";

import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { PageHeader } from "@/components/dashboard/page-header";
import { SmartWeekPlanningPanel } from "@/components/instructor/smart-week-planning-panel";
import { RequestStatusActions } from "@/components/requests/request-status-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getCurrentInstructorSettingsOverview } from "@/lib/data/instructor-account";
import { getLocationOptions } from "@/lib/data/locations";
import {
  getInstructeurDashboardLessonRequests,
  getInstructeurDashboardLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentNotificationPreview } from "@/lib/data/notifications";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import {
  getInstructeurDashboardProgressSignals,
  getInstructeurDashboardStudents,
} from "@/lib/data/student-progress";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";
import { buildSmartWeekPlanningModel } from "@/lib/instructor-smart-week-planning";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import type { Les } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROUTE = "/instructeur/regie";
const PLANNING_WINDOW_DAYS = 14;

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Amsterdam",
});

const timeFormatter = new Intl.DateTimeFormat("nl-NL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

function getSafeDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getLessonStart(lesson: Les) {
  return getSafeDate(lesson.start_at) ?? getSafeDate(lesson.datum);
}

function getDayRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { end, now, start };
}

function getTimeLabel(value: string | null | undefined, fallback: string) {
  const date = getSafeDate(value);

  return date ? timeFormatter.format(date) : fallback;
}

function getLessonStatusTone(status: string) {
  if (status === "afgerond" || status === "voltooid") {
    return "success" as const;
  }

  if (status === "geannuleerd" || status === "geweigerd") {
    return "danger" as const;
  }

  return "info" as const;
}

export default async function InstructeurRegiePage() {
  const { end, now, start } = getDayRange();
  const planningWindowEnd = new Date(now);
  planningWindowEnd.setDate(planningWindowEnd.getDate() + PLANNING_WINDOW_DAYS);

  const {
    availabilitySlots,
    instructor,
    lessons,
    locationOptions,
    notifications,
    progressSignals,
    requests,
    settings,
    students,
  } = await timedDashboardRoute(ROUTE, async () => {
    const [
      lessons,
      requests,
      notifications,
      settings,
      availabilitySlots,
      students,
      instructor,
      locationOptions,
    ] = await Promise.all([
      timedDashboardData(ROUTE, "planning-lessons", () =>
        getInstructeurDashboardLessons({
          from: now.toISOString(),
          to: planningWindowEnd.toISOString(),
          limit: 80,
        }),
      ),
      timedDashboardData(ROUTE, "open-requests", () =>
        getInstructeurDashboardLessonRequests({
          limit: 8,
          status: "aangevraagd",
        }),
      ),
      timedDashboardData(ROUTE, "notifications", getCurrentNotificationPreview),
      timedDashboardData(
        ROUTE,
        "settings-overview",
        getCurrentInstructorSettingsOverview,
      ),
      timedDashboardData(ROUTE, "availability", () =>
        getCurrentInstructorAvailability({
          concreteLimit: 32,
          from: now.toISOString(),
          recurringWeeks: 2,
        }),
      ),
      timedDashboardData(ROUTE, "students", () =>
        getInstructeurDashboardStudents({ lessonLimit: 160 }),
      ),
      timedDashboardData(ROUTE, "instructor", getCurrentInstructeurRecord),
      timedDashboardData(ROUTE, "locations", () =>
        getLocationOptions({ limit: 40 }),
      ),
    ]);
    const progressSignals = await timedDashboardData(
      ROUTE,
      "progress-signals",
      () =>
        getInstructeurDashboardProgressSignals({
          instructorId: instructor?.id ?? null,
          students,
        }),
    );

    return {
      availabilitySlots,
      instructor,
      lessons,
      locationOptions,
      notifications,
      progressSignals,
      requests,
      settings,
      students,
    };
  });

  const todaysLessons = lessons
    .filter((lesson) => {
      const lessonStart = getLessonStart(lesson)?.getTime();

      return (
        lesson.status !== "geannuleerd" &&
        lessonStart != null &&
        lessonStart >= start.getTime() &&
        lessonStart < end.getTime()
      );
    })
    .sort((left, right) => {
      const leftDate = getLessonStart(left)?.getTime() ?? 0;
      const rightDate = getLessonStart(right)?.getTime() ?? 0;

      return leftDate - rightDate;
    });
  const durationDefaults = resolveInstructorLessonDurationDefaults(instructor);
  const smartPlanning = buildSmartWeekPlanningModel({
    availabilitySlots,
    durationDefaults,
    lessons,
    now,
    progressSignals,
    students,
  });
  const unreadNotifications = notifications.filter((item) => item.ongelezen);
  const documentActions = settings.documents.filter(
    (document) => document.status !== "goedgekeurd" || !document.hasUrl,
  );
  const maintenanceVehicles = settings.vehicles.filter(
    (vehicle) => vehicle.status !== "actief",
  );
  const actionCards = [
    {
      label: "Vandaag",
      value: `${todaysLessons.length}`,
      hint: todaysLessons.length
        ? "Lessen in je dagplanning"
        : "Je dag is nog vrij",
      href: "/instructeur/lessen",
      icon: CalendarDays,
      tone: "sky",
    },
    {
      label: "Aanvragen",
      value: `${requests.length}`,
      hint: requests.length
        ? "Nog beantwoorden"
        : "Inbox is rustig",
      href: "/instructeur/aanvragen",
      icon: ClipboardList,
      tone: requests.length ? "amber" : "emerald",
    },
    {
      label: "Leerling-signalen",
      value: `${progressSignals.behindStudents.length + progressSignals.packageActionStudents.length}`,
      hint:
        progressSignals.behindStudents.length ||
        progressSignals.packageActionStudents.length
          ? "Vraagt opvolging"
          : "Geen directe zorg",
      href: "/instructeur/leerlingen",
      icon: UsersRound,
      tone:
        progressSignals.behindStudents.length ||
        progressSignals.packageActionStudents.length
          ? "rose"
          : "emerald",
    },
    {
      label: "Compliance",
      value: `${documentActions.length + maintenanceVehicles.length}`,
      hint:
        documentActions.length || maintenanceVehicles.length
          ? "Nog afronden"
          : "Basis staat klaar",
      href: "/instructeur/documenten",
      icon: FileText,
      tone: documentActions.length || maintenanceVehicles.length ? "amber" : "emerald",
    },
  ] as const;

  const nextActions = [
    requests.length
      ? {
          title: `${requests.length} aanvraag${requests.length === 1 ? "" : "en"} beoordelen`,
          text: "Accepteer wat past in je planning en wijs de rest duidelijk af.",
          href: "/instructeur/aanvragen",
          icon: ClipboardList,
          tone: "warning" as const,
        }
      : null,
    progressSignals.packageActionStudents.length
      ? {
          title: "Pakketactie klaarzetten",
          text: `${progressSignals.packageActionStudents.length} leerling${progressSignals.packageActionStudents.length === 1 ? "" : "en"} hebben binnenkort duidelijkheid over lessen of pakket nodig.`,
          href: "/instructeur/leerlingen",
          icon: PackageCheck,
          tone: "warning" as const,
        }
      : null,
    progressSignals.behindStudents.length
      ? {
          title: "Achterstand opvolgen",
          text: "Bekijk wie extra ritme, feedback of een nieuwe les nodig heeft.",
          href: "/instructeur/leerlingen",
          icon: AlertTriangle,
          tone: "danger" as const,
        }
      : null,
    documentActions.length
      ? {
          title: "Documentkluis aanvullen",
          text: `${documentActions.length} document${documentActions.length === 1 ? "" : "en"} missen nog een upload of akkoord.`,
          href: "/instructeur/documenten",
          icon: FileText,
          tone: "warning" as const,
        }
      : null,
    maintenanceVehicles.length
      ? {
          title: "Voertuigstatus controleren",
          text: "Controleer of je voertuigstatus klopt voordat je planning erop leunt.",
          href: "/instructeur/voertuigen",
          icon: CarFront,
          tone: "warning" as const,
        }
      : null,
    unreadNotifications.length
      ? {
          title: "Nieuwe meldingen lezen",
          text: `${unreadNotifications.length} melding${unreadNotifications.length === 1 ? "" : "en"} wachten nog op je aandacht.`,
          href: "/instructeur/berichten",
          icon: Bell,
          tone: "info" as const,
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <PageHeader
        tone="urban"
        title="Regie"
        description="Een rustige start van je werkdag: eerst zien wat aandacht vraagt, daarna pas handelen."
      />

      <section className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.055] p-4 text-white shadow-[0_22px_70px_-52px_rgba(0,0,0,0.95)]">
        <div className="relative grid gap-5 xl:grid-cols-[1fr_22rem] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/75 uppercase">
              <Gauge className="size-3.5" />
              Dagcockpit
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              {dateFormatter.format(now)}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
              {instructor?.profielNaam
                ? `${instructor.profielNaam}, dit vraagt vandaag je aandacht.`
                : "Dit vraagt vandaag je aandacht."}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {actionCards.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "rounded-lg border p-4 transition hover:-translate-y-0.5 hover:bg-white/10",
                      item.tone === "amber" &&
                        "border-amber-300/25 bg-amber-400/10",
                      item.tone === "rose" &&
                        "border-rose-300/25 bg-rose-400/10",
                      item.tone === "emerald" &&
                        "border-emerald-300/25 bg-emerald-400/10",
                      item.tone === "sky" && "border-sky-300/25 bg-sky-400/10",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold tracking-[0.18em] text-white/62 uppercase">
                        {item.label}
                      </p>
                      <Icon className="size-4 text-white/70" />
                    </div>
                    <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                    <p className="mt-1 text-xs leading-5 text-white/65">{item.hint}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          <SmartWeekPlanningPanel
            blockedCandidateCount={smartPlanning.blockedCandidateCount}
            busyWindows={smartPlanning.busyWindows}
            candidateCount={smartPlanning.candidateCount}
            durationDefaults={durationDefaults}
            locationOptions={locationOptions}
            openSlotCount={smartPlanning.openSlotCount}
            proposals={smartPlanning.proposals}
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <Card className="border-white/10 bg-white/[0.045] text-white">
          <CardHeader>
            <CardTitle>Vandaag gepland</CardTitle>
            <CardDescription className="text-slate-400">
              De eerstvolgende lessen in je dagritme.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaysLessons.length ? (
              <div className="space-y-3">
                {todaysLessons.slice(0, 6).map((lesson) => (
                  <Link
                    key={lesson.id}
                    href="/instructeur/lessen"
                    className="grid gap-3 rounded-lg border border-white/10 bg-slate-950/28 p-4 transition hover:bg-white/8 sm:grid-cols-[6rem_1fr_auto] sm:items-center"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-sky-100">
                      <Clock3 className="size-4" />
                      {getTimeLabel(lesson.start_at, lesson.tijd)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {lesson.leerling_naam}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-400">
                        {lesson.titel} - {lesson.locatie}
                      </p>
                    </div>
                    <Badge variant={getLessonStatusTone(lesson.status)}>
                      {lesson.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/12 bg-slate-950/22 p-6 text-center">
                <CheckCircle2 className="mx-auto size-9 text-emerald-300" />
                <p className="mt-3 font-semibold text-white">
                  Geen lessen vandaag
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Je hoeft niets te forceren. Gebruik open plekken alleen voor
                  aanvragen of leerlingen die echt een vervolgmoment nodig hebben.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.045] text-white">
          <CardHeader>
            <CardTitle>Acties nodig</CardTitle>
            <CardDescription className="text-slate-400">
              De cockpit zet alleen echte signalen bovenaan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nextActions.length ? (
              <div className="space-y-3">
                {nextActions.map((item) => {
                  if (!item) {
                    return null;
                  }

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="flex gap-3 rounded-lg border border-white/10 bg-slate-950/28 p-4 transition hover:bg-white/8"
                    >
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-lg",
                          item.tone === "danger"
                            ? "bg-rose-400/15 text-rose-200"
                            : item.tone === "warning"
                              ? "bg-amber-400/15 text-amber-200"
                              : "bg-sky-400/15 text-sky-200",
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-white">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-slate-400">
                          {item.text}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-5">
                <p className="font-semibold text-emerald-100">
                  Alles rustig
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-100/75">
                  Geen open aanvragen, urgente leerling-signalen of operationele
                  acties. Mooi moment om vooruit te plannen.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/[0.045] text-white">
        <CardHeader>
          <CardTitle>Open aanvragen</CardTitle>
          <CardDescription className="text-slate-400">
            Beoordeel aanvragen direct vanuit je cockpit zonder naar de lijst te
            hoeven schakelen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {requests.slice(0, 4).map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-white/10 bg-slate-950/28 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {request.leerling_naam}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {request.voorkeursdatum} - {request.tijdvak}
                      </p>
                    </div>
                    <Badge variant="warning">Aanvraag</Badge>
                  </div>
                  {request.bericht ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">
                      {request.bericht}
                    </p>
                  ) : null}
                  <div className="mt-4">
                    <RequestStatusActions
                      requestId={request.id}
                      status={request.status}
                      locationOptions={[]}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/12 bg-slate-950/22 p-6 text-center">
              <CheckCircle2 className="mx-auto size-9 text-emerald-300" />
              <p className="mt-3 font-semibold text-white">
                Geen open aanvragen
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Nieuwe aanvragen verschijnen hier zodra ze binnenkomen.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <DashboardPerformanceMark route={ROUTE} label="InstructorRegie" />
    </div>
  );
}
