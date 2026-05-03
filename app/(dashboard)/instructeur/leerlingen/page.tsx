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

import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { StudentsBoard } from "@/components/instructor/students-board";
import { StudentOnboardDialog } from "@/components/instructor/student-onboard-dialog";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
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
const busyRequestStatuses = new Set(["aangevraagd", "geaccepteerd", "ingepland"]);
const ROUTE = "/instructeur/leerlingen";
const LESSON_HISTORY_WINDOW_DAYS = 180;

function getLessonWindowStartIso() {
  return new Date(
    Date.now() - LESSON_HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

const statToneClasses: Record<StudentStatTone, string> = {
  amber: "border-amber-400/26 bg-amber-400/12 text-amber-300",
  blue: "border-blue-400/26 bg-blue-500/12 text-blue-300",
  emerald: "border-emerald-400/26 bg-emerald-500/12 text-emerald-300",
  rose: "border-rose-400/28 bg-rose-500/12 text-rose-300",
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

  if (student.voortgang < 40 && student.laatsteBeoordeling !== "Nog geen beoordeling") {
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
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: LucideIcon;
  label: string;
  tone: StudentStatTone;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(15,23,42,0.34))] p-3.5 text-white shadow-[0_24px_70px_-52px_rgba(0,0,0,0.95)] 2xl:rounded-xl 2xl:p-5">
      <div className="flex items-center gap-3 2xl:gap-5">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-lg border 2xl:size-16 2xl:rounded-xl ${statToneClasses[tone]}`}
        >
          <Icon className="size-5 2xl:size-8" />
        </span>
        <div>
          <p className="text-sm text-slate-200 2xl:text-base">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-white 2xl:mt-2 2xl:text-3xl">
            {value}
          </p>
          <p className="mt-1.5 text-xs text-slate-400 2xl:mt-3 2xl:text-sm">Deze maand</p>
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
    <section className="rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.76),rgba(15,23,42,0.36))] p-3.5 text-white shadow-[0_24px_70px_-52px_rgba(0,0,0,0.95)] 2xl:rounded-xl 2xl:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between 2xl:gap-5">
        <div>
          <div className="flex items-center gap-2">
            <CircleAlert className="size-4 text-amber-300 2xl:size-5" />
            <h2 className="text-lg font-semibold tracking-tight 2xl:text-xl">
              Slimme prioriteiten
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400 2xl:text-sm">
            Automatisch berekend uit planning, voortgang en accountstatus.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 2xl:gap-3">
          {insightItems.map((item) => (
            <div
              key={item.label}
              className="min-w-32 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2 2xl:min-w-36 2xl:py-3"
            >
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="mt-1 text-xl font-semibold text-white 2xl:text-2xl">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-4 2xl:mt-5 2xl:gap-4">
        {priorities.length ? (
          priorities.map((priority) => {
            const Icon = priority.icon;

            return (
              <a
                key={`${priority.label}-${priority.name}`}
                href={priority.href}
                className={`group rounded-lg border p-3 transition hover:-translate-y-0.5 hover:bg-white/[0.07] 2xl:p-4 ${priorityToneClasses[priority.tone]}`}
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
              </a>
            );
          })
        ) : (
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100 lg:col-span-4 2xl:p-4">
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
  searchParams: Promise<{ student?: string }>;
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
  ] = await timedDashboardRoute(ROUTE, async () => {
    const nowIso = new Date().toISOString();
    const lessonWindowStart = getLessonWindowStartIso();

    return Promise.all([
      timedDashboardData(ROUTE, "student-workspace", getInstructeurStudentsWorkspace),
      timedDashboardData(ROUTE, "locations", getLocationOptions),
      timedDashboardData(ROUTE, "packages", getCurrentInstructorPackages),
      timedDashboardData(ROUTE, "instructor", getCurrentInstructeurRecord),
      timedDashboardData(ROUTE, "profile", getCurrentProfile),
      timedDashboardData(ROUTE, "availability", () =>
        getCurrentInstructorAvailability({
          concreteLimit: 240,
          from: nowIso,
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

      return slot.beschikbaar !== false && new Date(slot.eind_at).getTime() > nowMs;
    })
    .sort((left, right) => (left.start_at ?? "").localeCompare(right.start_at ?? ""))
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
      icon: UsersRound,
      label: "Totaal leerlingen",
      value: `${studentSummary.totalStudents}`,
      tone: "blue",
    },
    {
      icon: CheckCircle2,
      label: "Actief",
      value: `${studentSummary.activeStudents}`,
      tone: "emerald",
    },
    {
      icon: Clock3,
      label: "Inactief",
      value: `${studentSummary.inactiveStudents}`,
      tone: "amber",
    },
    {
      icon: CircleX,
      label: "Uitgevallen",
      value: `${studentSummary.droppedStudents}`,
      tone: "rose",
    },
  ] as const;

  return (
    <div className="space-y-4 text-white 2xl:space-y-7">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between 2xl:gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl 2xl:text-4xl">
            Leerlingen
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 2xl:mt-2 2xl:text-lg">
            Beheer en overzicht van al je leerlingen.
          </p>
        </div>
        <StudentOnboardDialog
          packages={packages}
          triggerLabel="Nieuwe leerling"
          triggerClassName="h-9 rounded-lg bg-blue-600 px-4 text-sm text-white shadow-[0_18px_50px_-28px_rgba(37,99,235,0.9)] hover:bg-blue-500 2xl:h-12 2xl:px-5 2xl:text-base"
          showTriggerIcon
        />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-5">
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

      <DashboardPerformanceMark route={ROUTE} label="StudentsBoard" />

      <StudentsBoard
        students={workspace.students}
        assessments={workspace.assessments}
        notes={workspace.notes}
        instructorName={profile?.volledige_naam ?? "Instructeur"}
        locationOptions={locationOptions}
        availabilitySlots={planningAvailabilitySlots}
        busyWindows={busyWindows}
        packages={packages}
        lessonDurationDefaults={lessonDurationDefaults}
        initialStudentId={params.student ?? null}
      />
    </div>
  );
}
