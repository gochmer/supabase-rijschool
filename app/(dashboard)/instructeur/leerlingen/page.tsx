import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CircleX,
  Clock3,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { DataHealthCallout } from "@/components/dashboard/data-health-callout";
import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { ProgressTrackingSystemPanel } from "@/components/instructor/progress-tracking-system-panel";
import { StudentsBoard } from "@/components/instructor/students-board";
import { StudentOnboardDialog } from "@/components/instructor/student-onboard-dialog";
import { getInstructorPlanningDataHealth } from "@/lib/data/data-health";
import { getCurrentInstructorFeedbackTemplates } from "@/lib/data/instructor-feedback-templates";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getCurrentInstructorLessonCheckinBoards } from "@/lib/data/lesson-checkins";
import { getCurrentInstructorLessonCompassBoards } from "@/lib/data/lesson-compass";
import {
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";
import { getLocationOptions } from "@/lib/data/locations";
import { getCurrentInstructorPackages } from "@/lib/data/packages";
import {
  getCurrentInstructeurRecord,
  getCurrentProfile,
} from "@/lib/data/profiles";
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";
import type { InstructorStudentProgressRow } from "@/lib/types";

type StudentStatTone = "amber" | "blue" | "emerald" | "rose";
type StudentStatusGroup = "actief" | "inactief" | "uitgevallen";
type StudentPriorityTone = "amber" | "blue" | "emerald" | "rose";

type StudentPriority = {
  detail: string;
  href: string;
  icon: LucideIcon;
  label: string;
  name: string;
  tone: StudentPriorityTone;
};

const busyLessonStatuses = new Set(["geaccepteerd", "ingepland"]);
const busyRequestStatuses = new Set([
  "aangevraagd",
  "geaccepteerd",
  "ingepland",
]);
const ROUTE = "/instructeur/leerlingen";
const LESSON_HISTORY_WINDOW_DAYS = 180;

function getLessonWindowStartIso() {
  return new Date(
    Date.now() - LESSON_HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

const statToneClasses: Record<
  StudentStatTone,
  { dot: string; icon: string; value: string }
> = {
  amber: {
    dot: "bg-amber-300",
    icon: "bg-amber-400/12 text-amber-200",
    value: "text-amber-100",
  },
  blue: {
    dot: "bg-sky-300",
    icon: "bg-sky-400/12 text-sky-200",
    value: "text-sky-100",
  },
  emerald: {
    dot: "bg-emerald-300",
    icon: "bg-emerald-400/12 text-emerald-200",
    value: "text-emerald-100",
  },
  rose: {
    dot: "bg-rose-300",
    icon: "bg-rose-400/12 text-rose-200",
    value: "text-rose-100",
  },
};

const priorityToneClasses: Record<StudentPriorityTone, string> = {
  amber: "border-amber-400/24 bg-amber-400/10 text-amber-200",
  blue: "border-blue-400/24 bg-blue-500/10 text-blue-200",
  emerald: "border-emerald-400/24 bg-emerald-500/10 text-emerald-200",
  rose: "border-rose-400/26 bg-rose-500/10 text-rose-200",
};

function getStudentStatusGroup(
  student: InstructorStudentProgressRow,
): StudentStatusGroup {
  if (
    student.voortgang <= 0 &&
    student.gekoppeldeLessen <= 0 &&
    !student.volgendeLesAt &&
    student.accountStatus !== "uitgenodigd"
  ) {
    return "uitgevallen";
  }

  if (
    student.accountStatus === "uitgenodigd" ||
    (!student.volgendeLesAt &&
      !student.zelfInplannenToegestaan &&
      student.voortgang < 40)
  ) {
    return "inactief";
  }

  return "actief";
}

function getStudentHref(studentId: string) {
  return `/instructeur/leerlingen?student=${encodeURIComponent(studentId)}`;
}

function getStudentPriority(
  student: InstructorStudentProgressRow,
): StudentPriority | null {
  const statusGroup = getStudentStatusGroup(student);

  if (statusGroup === "uitgevallen") {
    return {
      detail: "Geen actieve planning of voortgang zichtbaar",
      href: getStudentHref(student.id),
      icon: CircleX,
      label: "Terugwinmoment",
      name: student.naam,
      tone: "rose",
    };
  }

  if (student.accountStatus === "uitgenodigd") {
    return {
      detail: "Uitnodiging staat nog open",
      href: getStudentHref(student.id),
      icon: UsersRound,
      label: "Uitnodiging opvolgen",
      name: student.naam,
      tone: "blue",
    };
  }

  if (!student.volgendeLesAt) {
    return {
      detail: `${student.voortgang}% voortgang, geen volgende les gepland`,
      href: getStudentHref(student.id),
      icon: CalendarDays,
      label: "Volgende les plannen",
      name: student.naam,
      tone: "amber",
    };
  }

  if (
    student.voortgang < 40 &&
    student.laatsteBeoordeling !== "Nog geen beoordeling"
  ) {
    return {
      detail: `${student.voortgang}% voortgang na recente beoordeling`,
      href: getStudentHref(student.id),
      icon: CircleAlert,
      label: "Extra begeleiding",
      name: student.naam,
      tone: "amber",
    };
  }

  if ((student.zelfInplannenResterendMinutenDezeWeek ?? 1) <= 0) {
    return {
      detail: "Weeklimiet voor zelf inplannen is bereikt",
      href: getStudentHref(student.id),
      icon: Clock3,
      label: "Planninglimiet bereikt",
      name: student.naam,
      tone: "blue",
    };
  }

  return null;
}

function getStudentDashboardSummary(students: InstructorStudentProgressRow[]) {
  return students.reduce(
    (summary, student) => {
      const statusGroup = getStudentStatusGroup(student);
      const priority = getStudentPriority(student);

      summary.totalStudents += 1;

      if (statusGroup === "actief") {
        summary.activeStudents += 1;
      } else if (statusGroup === "inactief") {
        summary.inactiveStudents += 1;
      } else {
        summary.droppedStudents += 1;
      }

      if (!student.volgendeLesAt) {
        summary.studentsWithoutNextLesson += 1;
      }

      if (student.zelfInplannenToegestaan) {
        summary.studentsWithSelfPlanning += 1;
      }

      if (student.voortgang < 40) {
        summary.lowProgressStudents += 1;
      }

      if (priority && summary.priorities.length < 4) {
        summary.priorities.push(priority);
      }

      return summary;
    },
    {
      activeStudents: 0,
      droppedStudents: 0,
      inactiveStudents: 0,
      lowProgressStudents: 0,
      priorities: [] as StudentPriority[],
      studentsWithSelfPlanning: 0,
      studentsWithoutNextLesson: 0,
      totalStudents: 0,
    },
  );
}

function StudentStatCard({
  helper,
  icon: Icon,
  label,
  tone,
  value,
}: {
  helper: string;
  icon: LucideIcon;
  label: string;
  tone: StudentStatTone;
  value: string;
}) {
  const toneClasses = statToneClasses[tone];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] p-3.5 text-white shadow-[0_18px_54px_-46px_rgba(0,0,0,0.95)]">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${toneClasses.icon}`}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            {label}
          </p>
          <p
            className={`mt-1 text-2xl font-semibold tracking-tight ${toneClasses.value}`}
          >
            {value}
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <span className={`size-1.5 rounded-full ${toneClasses.dot}`} />
            <span className="truncate">{helper}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function StudentPrioritiesPanel({
  lowProgressStudents,
  priorities,
  studentsWithSelfPlanning,
  studentsWithoutNextLesson,
}: {
  lowProgressStudents: number;
  priorities: StudentPriority[];
  studentsWithSelfPlanning: number;
  studentsWithoutNextLesson: number;
}) {
  const insightItems = [
    {
      label: "Zonder volgende les",
      value: studentsWithoutNextLesson,
    },
    {
      label: "Zelf inplannen aan",
      value: studentsWithSelfPlanning,
    },
    {
      label: "Lage voortgang",
      value: lowProgressStudents,
    },
  ];

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.045] p-3.5 text-white shadow-[0_18px_58px_-48px_rgba(0,0,0,0.95)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-400/12 text-amber-200">
              <CircleAlert className="size-4" />
            </span>
            <h2 className="text-base font-semibold tracking-tight">
              Slimme prioriteiten
            </h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Automatisch berekend uit planning, voortgang en accountstatus.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {insightItems.map((item) => (
            <div
              key={item.label}
              className="min-w-28 rounded-lg border border-white/10 bg-slate-950/24 px-3 py-2"
            >
              <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
                {item.label}
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {priorities.length ? (
          priorities.map((priority) => {
            const Icon = priority.icon;

            return (
              <Link
                key={`${priority.label}-${priority.name}`}
                href={priority.href}
                className={`group rounded-lg border p-3 transition hover:-translate-y-0.5 hover:bg-white/[0.07] ${priorityToneClasses[priority.tone]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/5 2xl:size-9">
                    <Icon className="size-3.5 2xl:size-4" />
                  </span>
                  <ArrowRight className="size-4 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </div>
                <p className="mt-2 text-sm font-semibold text-white 2xl:mt-3">
                  {priority.name}
                </p>
                <p className="mt-1 text-sm font-medium">{priority.label}</p>
                <p className="mt-1.5 text-xs leading-5 text-slate-400 2xl:mt-2">
                  {priority.detail}
                </p>
              </Link>
            );
          })
        ) : (
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100 lg:col-span-2 xl:col-span-1 2xl:col-span-2">
            Alles ziet er rustig uit. Er zijn geen directe leerlingprioriteiten.
          </div>
        )}
      </div>
    </section>
  );
}

export default async function LeerlingenPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    feedback?: string;
    lesson?: string;
    student?: string;
  }>;
}) {
  const params = await searchParams;
  const [
    workspace,
    locationOptions,
    packages,
    instructeur,
    profile,
    availabilitySlots,
    lessons,
    requests,
    lessonCompassBoards,
    lessonCheckinBoards,
    feedbackTemplates,
    dataHealth,
  ] = await timedDashboardRoute(ROUTE, async () => {
    const nowIso = new Date().toISOString();
    const lessonWindowStart = getLessonWindowStartIso();

    return Promise.all([
      timedDashboardData(
        ROUTE,
        "student-workspace",
        getInstructeurStudentsWorkspace,
      ),
      timedDashboardData(ROUTE, "locations", getLocationOptions),
      timedDashboardData(ROUTE, "packages", getCurrentInstructorPackages),
      timedDashboardData(ROUTE, "instructor", getCurrentInstructeurRecord),
      timedDashboardData(ROUTE, "profile", getCurrentProfile),
      timedDashboardData(ROUTE, "availability", () =>
        getCurrentInstructorAvailability({
          concreteLimit: 240,
          from: nowIso,
          recurringWeeks: 8,
        }),
      ),
      timedDashboardData(ROUTE, "lessons", () =>
        getInstructeurLessons({
          from: lessonWindowStart,
          limit: 360,
        }),
      ),
      timedDashboardData(ROUTE, "requests", () =>
        getInstructeurLessonRequests({
          limit: 160,
        }),
      ),
      timedDashboardData(
        ROUTE,
        "lesson-compass",
        getCurrentInstructorLessonCompassBoards,
      ),
      timedDashboardData(
        ROUTE,
        "lesson-checkins",
        getCurrentInstructorLessonCheckinBoards,
      ),
      timedDashboardData(
        ROUTE,
        "feedback-templates",
        getCurrentInstructorFeedbackTemplates,
      ),
      timedDashboardData(ROUTE, "data-health", getInstructorPlanningDataHealth),
    ]);
  });
  const lessonDurationDefaults =
    resolveInstructorLessonDurationDefaults(instructeur);
  const nowMs = new Date().getTime();
  const planningAvailabilitySlots = availabilitySlots
    .filter((slot) => {
      if (!slot.start_at || !slot.eind_at) {
        return false;
      }

      return (
        slot.beschikbaar !== false && new Date(slot.eind_at).getTime() > nowMs
      );
    })
    .sort((left, right) =>
      (left.start_at ?? "").localeCompare(right.start_at ?? ""),
    )
    .slice(0, 48);
  const busyWindows = [
    ...lessons
      .filter(
        (lesson) =>
          lesson.start_at &&
          lesson.end_at &&
          new Date(lesson.end_at).getTime() > nowMs &&
          busyLessonStatuses.has(lesson.status),
      )
      .map((lesson) => ({
        id: lesson.id,
        label: lesson.leerling_naam || lesson.titel,
        status: lesson.status,
        start_at: lesson.start_at,
        end_at: lesson.end_at,
      })),
    ...requests
      .filter(
        (request) =>
          request.start_at &&
          request.end_at &&
          new Date(request.end_at).getTime() > nowMs &&
          busyRequestStatuses.has(request.status),
      )
      .map((request) => ({
        id: request.id,
        label: request.leerling_naam || request.pakket_naam || "Aanvraag",
        status: request.status,
        start_at: request.start_at,
        end_at: request.end_at,
      })),
  ];
  const studentSummary = getStudentDashboardSummary(workspace.students);
  const studentStats = [
    {
      helper: `${studentSummary.studentsWithoutNextLesson} zonder vervolgafspraak`,
      icon: UsersRound,
      label: "Totaal leerlingen",
      value: `${studentSummary.totalStudents}`,
      tone: "blue",
    },
    {
      helper: "Met actieve voortgang of planning",
      icon: CheckCircle2,
      label: "Actief",
      value: `${studentSummary.activeStudents}`,
      tone: "emerald",
    },
    {
      helper: "Uitnodiging of planning mist",
      icon: Clock3,
      label: "Inactief",
      value: `${studentSummary.inactiveStudents}`,
      tone: "amber",
    },
    {
      helper: "Geen trajectsignalen zichtbaar",
      icon: CircleX,
      label: "Uitgevallen",
      value: `${studentSummary.droppedStudents}`,
      tone: "rose",
    },
  ] as const;

  const hasOperationalAttention =
    studentSummary.priorities.length > 0 ||
    studentSummary.studentsWithoutNextLesson > 0 ||
    studentSummary.lowProgressStudents > 0;

  return (
    <div className="space-y-3 text-white 2xl:space-y-4">
      <header className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_20px_60px_-48px_rgba(0,0,0,0.95)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/7 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-300 uppercase">
              Leerlingenbeheer
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                hasOperationalAttention
                  ? "border-amber-300/18 bg-amber-400/10 text-amber-100"
                  : "border-emerald-300/18 bg-emerald-400/10 text-emerald-100"
              }`}
            >
              {hasOperationalAttention ? "Opvolging nodig" : "Rustig overzicht"}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Leerlingen
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-400">
            Beheer leerlingen, planning, pakketten, feedback en voortgang vanuit
            een duidelijke werkruimte. Eerst de signalen, daarna het volledige
            dossier.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-3.5 shadow-[0_18px_54px_-46px_rgba(0,0,0,0.95)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                Werkstatus
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {studentSummary.totalStudents
                  ? `${studentSummary.activeStudents} actief van ${studentSummary.totalStudents}`
                  : "Nog geen leerlingen"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {studentSummary.priorities.length
                  ? `${studentSummary.priorities.length} directe actie${studentSummary.priorities.length === 1 ? "" : "s"} zichtbaar.`
                  : "Geen directe blokkades zichtbaar."}
              </p>
            </div>
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                hasOperationalAttention
                  ? "bg-amber-400/12 text-amber-100"
                  : "bg-emerald-400/12 text-emerald-100"
              }`}
            >
              {hasOperationalAttention ? (
                <CircleAlert className="size-5" />
              ) : (
                <CheckCircle2 className="size-5" />
              )}
            </span>
          </div>
          <div className="mt-3">
            <StudentOnboardDialog
              packages={packages}
              triggerLabel="Nieuwe leerling"
              triggerClassName="h-9 w-full rounded-lg bg-blue-600 px-4 text-sm text-white shadow-[0_18px_50px_-28px_rgba(37,99,235,0.9)] hover:bg-blue-500"
              showTriggerIcon
            />
          </div>
        </div>
      </header>

      <DataHealthCallout label="Leerlingen datastatus" results={dataHealth} />

      <section className="grid gap-3 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.45fr)]">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {studentStats.map((item) => (
              <StudentStatCard key={item.label} {...item} />
            ))}
          </div>

          <StudentPrioritiesPanel
            lowProgressStudents={studentSummary.lowProgressStudents}
            priorities={studentSummary.priorities}
            studentsWithSelfPlanning={studentSummary.studentsWithSelfPlanning}
            studentsWithoutNextLesson={studentSummary.studentsWithoutNextLesson}
          />
        </div>

        <ProgressTrackingSystemPanel
          assessments={workspace.assessments}
          notes={workspace.notes}
          students={workspace.students}
        />
      </section>

      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Leerlingdossiers</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-400">
            Zoek, open en beheer planning, pakketten, feedback en audit per
            leerling.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-300">
          {workspace.students.length} dossier
          {workspace.students.length === 1 ? "" : "s"}
        </span>
      </div>

      <DashboardPerformanceMark route={ROUTE} label="StudentsBoard" />

      <StudentsBoard
        students={workspace.students}
        assessments={workspace.assessments}
        notes={workspace.notes}
        lessons={lessons}
        instructorName={profile?.volledige_naam ?? "Instructeur"}
        locationOptions={locationOptions}
        availabilitySlots={planningAvailabilitySlots}
        busyWindows={busyWindows}
        lessonCheckinBoards={lessonCheckinBoards}
        lessonCompassBoards={lessonCompassBoards}
        feedbackTemplates={feedbackTemplates}
        packages={packages}
        lessonDurationDefaults={lessonDurationDefaults}
        initialDate={params.date ?? null}
        initialFeedbackOpen={params.feedback === "1"}
        initialLessonId={params.lesson ?? null}
        initialStudentId={params.student ?? null}
      />
    </div>
  );
}
