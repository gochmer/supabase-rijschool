import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ClipboardList,
  FileText,
  NotebookPen,
  PackageCheck,
  UsersRound,
} from "lucide-react";

import { DataHealthCallout } from "@/components/dashboard/data-health-callout";
import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { PageHeader } from "@/components/dashboard/page-header";
import { FeedbackTodoCard } from "@/components/instructor/feedback-todo-card";
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
import { getInstructorPlanningDataHealth } from "@/lib/data/data-health";
import type { DataHealthCheck } from "@/lib/data/data-health";
import { getCurrentInstructorFeedbackTodoLessons } from "@/lib/data/instructor-feedback-todos";
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
const FEEDBACK_TODO_LIMIT = 6;

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

const cockpitToneClasses = {
  amber: {
    dot: "bg-amber-300",
    icon: "bg-amber-300/12 text-amber-100",
    value: "text-amber-100",
  },
  emerald: {
    dot: "bg-emerald-300",
    icon: "bg-emerald-300/12 text-emerald-100",
    value: "text-emerald-100",
  },
  rose: {
    dot: "bg-rose-300",
    icon: "bg-rose-300/12 text-rose-100",
    value: "text-rose-100",
  },
  sky: {
    dot: "bg-sky-300",
    icon: "bg-sky-300/12 text-sky-100",
    value: "text-sky-100",
  },
} as const;

const actionToneClasses = {
  danger: {
    badge: "bg-rose-400/15 text-rose-100",
    dot: "bg-rose-400",
    row: "hover:border-rose-200/20 hover:bg-rose-400/8",
  },
  info: {
    badge: "bg-sky-400/15 text-sky-100",
    dot: "bg-sky-400",
    row: "hover:border-sky-200/20 hover:bg-sky-400/8",
  },
  warning: {
    badge: "bg-amber-400/15 text-amber-100",
    dot: "bg-amber-400",
    row: "hover:border-amber-200/20 hover:bg-amber-400/8",
  },
} as const;

function RegieDataStatusCard({ results }: { results: DataHealthCheck[] }) {
  const failed = results.filter((item) => item.status === "error");
  const empty = results.filter((item) => item.status === "empty");
  const isError = failed.length > 0;
  const Icon = isError ? AlertTriangle : CheckCircle2;

  return (
    <section
      className={cn(
        "flex min-h-full items-center justify-between gap-3 rounded-xl border p-3.5 text-white shadow-[0_18px_54px_-44px_rgba(0,0,0,0.9)]",
        isError
          ? "border-rose-300/20 bg-rose-400/10"
          : "border-emerald-300/18 bg-white/[0.055]",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            isError
              ? "bg-rose-400/18 text-rose-100"
              : "bg-emerald-400/18 text-emerald-100",
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Datastatus</p>
          <p className="mt-0.5 truncate text-[13px] text-slate-300">
            {isError
              ? `${failed.length} databron${failed.length === 1 ? "" : "nen"} vragen controle`
              : empty.length
                ? `${empty.length} bron${empty.length === 1 ? "" : "nen"} leeg, database bereikbaar`
                : "Planning- en leerlingdata geladen"}
          </p>
        </div>
      </div>
      <Badge variant={isError ? "danger" : "success"}>
        {isError ? "Check" : "OK"}
      </Badge>
    </section>
  );
}

export default async function InstructeurRegiePage() {
  const { end, now, start } = getDayRange();
  const planningWindowEnd = new Date(now);
  planningWindowEnd.setDate(planningWindowEnd.getDate() + PLANNING_WINDOW_DAYS);

  const {
    availabilitySlots,
    feedbackTodos,
    instructor,
    lessons,
    locationOptions,
    notifications,
    progressSignals,
    requests,
    settings,
    students,
    dataHealth,
  } = await timedDashboardRoute(ROUTE, async () => {
    const [
      lessons,
      requests,
      notifications,
      settings,
      availabilitySlots,
      feedbackTodos,
      students,
      instructor,
      locationOptions,
      dataHealth,
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
      timedDashboardData(ROUTE, "feedback-todos", () =>
        getCurrentInstructorFeedbackTodoLessons({
          daysBack: 21,
          limit: FEEDBACK_TODO_LIMIT,
        }),
      ),
      timedDashboardData(ROUTE, "students", () =>
        getInstructeurDashboardStudents({ lessonLimit: 160 }),
      ),
      timedDashboardData(ROUTE, "instructor", getCurrentInstructeurRecord),
      timedDashboardData(ROUTE, "locations", () =>
        getLocationOptions({ limit: 40 }),
      ),
      timedDashboardData(ROUTE, "data-health", getInstructorPlanningDataHealth),
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
      feedbackTodos,
      instructor,
      lessons,
      locationOptions,
      notifications,
      progressSignals,
      requests,
      settings,
      students,
      dataHealth,
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
      hint: requests.length ? "Nog beantwoorden" : "Inbox is rustig",
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
      label: "Feedback",
      value: `${feedbackTodos.length}`,
      hint: feedbackTodos.length ? "Lesverslag invullen" : "Alles bijgewerkt",
      href: feedbackTodos[0]?.href ?? "/instructeur/leerlingen",
      icon: NotebookPen,
      tone: feedbackTodos.length ? "amber" : "emerald",
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
      tone:
        documentActions.length || maintenanceVehicles.length
          ? "amber"
          : "emerald",
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
    feedbackTodos.length
      ? {
          title: `${feedbackTodos.length} lesverslag${feedbackTodos.length === 1 ? "" : "en"} invullen`,
          text: "Afgeronde lessen zonder feedback. Maak direct een korte update voor de leerling.",
          href: feedbackTodos[0]?.href ?? "/instructeur/leerlingen",
          icon: NotebookPen,
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
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <PageHeader
          tone="urban"
          title="Regie"
          description="Rustige start van de werkdag: eerst zien wat aandacht vraagt, daarna pas handelen."
        />
        <RegieDataStatusCard results={dataHealth} />
      </div>

      <DataHealthCallout
        className="!mt-3"
        label="Regie datastatus"
        results={dataHealth}
        showAllEmptyState={false}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {actionCards.map((item) => {
          const Icon = item.icon;
          const tone = cockpitToneClasses[item.tone];

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "rounded-xl border border-white/10 bg-white/[0.045] p-3.5 text-white shadow-[0_18px_54px_-44px_rgba(0,0,0,0.9)] transition hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.07]",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    tone.icon,
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <span className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                  {item.label}
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p
                  className={cn(
                    "text-2xl font-semibold tracking-tight",
                    tone.value,
                  )}
                >
                  {item.value}
                </p>
                <p className="flex items-center gap-2 text-right text-xs leading-5 text-slate-400">
                  <span className={cn("size-1.5 rounded-full", tone.dot)} />
                  <span>{item.hint}</span>
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(21rem,0.75fr)]">
        <SmartWeekPlanningPanel
          blockedCandidateCount={smartPlanning.blockedCandidateCount}
          busyWindows={smartPlanning.busyWindows}
          candidateCount={smartPlanning.candidateCount}
          durationDefaults={durationDefaults}
          locationOptions={locationOptions}
          openSlotCount={smartPlanning.openSlotCount}
          proposals={smartPlanning.proposals}
        />

        <Card size="sm" className="border-white/10 bg-white/[0.045] text-white">
          <CardHeader>
            <CardTitle>Acties nodig</CardTitle>
            <CardDescription className="text-slate-400">
              Alleen signalen die nu opvolging vragen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nextActions.length ? (
              <div className="divide-y divide-white/8">
                {nextActions.map((item) => {
                  if (!item) {
                    return null;
                  }

                  const tone = actionToneClasses[item.tone];
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2 py-3 transition",
                        tone.row,
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          tone.badge,
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-white">
                          {item.title}
                        </span>
                        <span className="mt-0.5 line-clamp-1 block text-xs text-slate-400">
                          {item.text}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-semibold",
                          tone.badge,
                        )}
                      >
                        Open
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-5">
                <p className="font-semibold text-emerald-100">Alles rustig</p>
                <p className="mt-1 text-sm leading-6 text-emerald-100/75">
                  Geen open aanvragen, urgente leerling-signalen of operationele
                  acties. Mooi moment om vooruit te plannen.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Card size="sm" className="border-white/10 bg-white/[0.045] text-white">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Vandaag gepland</CardTitle>
                <CardDescription className="text-slate-400">
                  Eerstvolgende lessen in je dagritme.
                </CardDescription>
              </div>
              <Link
                href="/instructeur/lessen"
                className="text-xs font-semibold text-sky-200 hover:text-sky-100"
              >
                Bekijk alles
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {todaysLessons.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                    <tr>
                      <th className="py-2 pr-3">Tijd</th>
                      <th className="py-2 pr-3">Leerling</th>
                      <th className="py-2 pr-3">Les</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {todaysLessons.slice(0, 6).map((lesson) => (
                      <tr key={lesson.id}>
                        <td className="whitespace-nowrap py-2.5 pr-3 font-semibold text-sky-100">
                          {getTimeLabel(lesson.start_at, lesson.tijd)}
                        </td>
                        <td className="max-w-[8rem] truncate py-2.5 pr-3 text-white">
                          {lesson.leerling_naam}
                        </td>
                        <td className="max-w-[8rem] truncate py-2.5 pr-3 text-slate-400">
                          {lesson.titel}
                        </td>
                        <td className="py-2.5">
                          <Badge variant={getLessonStatusTone(lesson.status)}>
                            {lesson.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/12 bg-slate-950/22 p-4 text-center">
                <CheckCircle2 className="mx-auto size-7 text-emerald-300" />
                <p className="mt-2 font-semibold text-white">
                  Geen lessen vandaag
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Gebruik open plekken alleen voor echte opvolging.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <FeedbackTodoCard className="h-full" items={feedbackTodos} limit={4} />

        <Card size="sm" className="border-white/10 bg-white/[0.045] text-white">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Open aanvragen</CardTitle>
                <CardDescription className="text-slate-400">
                  Snel beoordelen vanuit de cockpit.
                </CardDescription>
              </div>
              <Link
                href="/instructeur/aanvragen"
                className="text-xs font-semibold text-sky-200 hover:text-sky-100"
              >
                Bekijk alles
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {requests.length ? (
              <div className="divide-y divide-white/8">
                {requests.slice(0, 4).map((request) => (
                  <div key={request.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          {request.leerling_naam}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          {request.voorkeursdatum} - {request.tijdvak}
                        </p>
                      </div>
                      <Badge variant="warning">Open</Badge>
                    </div>
                    <div className="mt-3">
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
      </div>

      <DashboardPerformanceMark route={ROUTE} label="InstructorRegie" />
    </div>
  );
}
