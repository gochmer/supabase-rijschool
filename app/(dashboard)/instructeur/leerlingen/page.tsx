import { CheckCircle2, CircleX, Clock3, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StudentsBoard } from "@/components/instructor/students-board";
import { StudentOnboardDialog } from "@/components/instructor/student-onboard-dialog";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import {
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";
import { getLocationOptions } from "@/lib/data/locations";
import { getCurrentInstructorPackages } from "@/lib/data/packages";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import type { InstructorStudentProgressRow } from "@/lib/types";

type StudentStatTone = "amber" | "blue" | "emerald" | "rose";
type StudentStatusGroup = "actief" | "inactief" | "uitgevallen";

const busyLessonStatuses = new Set(["geaccepteerd", "ingepland"]);
const busyRequestStatuses = new Set(["aangevraagd", "geaccepteerd", "ingepland"]);

const statToneClasses: Record<StudentStatTone, string> = {
  amber: "border-amber-400/26 bg-amber-400/12 text-amber-300",
  blue: "border-blue-400/26 bg-blue-500/12 text-blue-300",
  emerald: "border-emerald-400/26 bg-emerald-500/12 text-emerald-300",
  rose: "border-rose-400/28 bg-rose-500/12 text-rose-300",
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
    <div className="rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(15,23,42,0.34))] p-5 text-white shadow-[0_24px_70px_-52px_rgba(0,0,0,0.95)]">
      <div className="flex items-center gap-5">
        <span
          className={`flex size-16 shrink-0 items-center justify-center rounded-xl border ${statToneClasses[tone]}`}
        >
          <Icon className="size-8" />
        </span>
        <div>
          <p className="text-base text-slate-200">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-3 text-sm text-slate-400">Deze maand</p>
        </div>
      </div>
    </div>
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
    availabilitySlots,
    lessons,
    requests,
  ] = await Promise.all([
    getInstructeurStudentsWorkspace(),
    getLocationOptions(),
    getCurrentInstructorPackages(),
    getCurrentInstructeurRecord(),
    getCurrentInstructorAvailability(),
    getInstructeurLessons(),
    getInstructeurLessonRequests(),
  ]);
  const lessonDurationDefaults =
    resolveInstructorLessonDurationDefaults(instructeur);
  const nowMs = Date.now();
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
  const totalStudents = workspace.students.length;
  const activeStudents = workspace.students.filter(
    (student) => getStudentStatusGroup(student) === "actief",
  ).length;
  const inactiveStudents = workspace.students.filter(
    (student) => getStudentStatusGroup(student) === "inactief",
  ).length;
  const droppedStudents = workspace.students.filter(
    (student) => getStudentStatusGroup(student) === "uitgevallen",
  ).length;
  const studentStats = [
    {
      icon: UsersRound,
      label: "Totaal leerlingen",
      value: `${totalStudents}`,
      tone: "blue",
    },
    {
      icon: CheckCircle2,
      label: "Actief",
      value: `${activeStudents}`,
      tone: "emerald",
    },
    {
      icon: Clock3,
      label: "Inactief",
      value: `${inactiveStudents}`,
      tone: "amber",
    },
    {
      icon: CircleX,
      label: "Uitgevallen",
      value: `${droppedStudents}`,
      tone: "rose",
    },
  ] as const;

  return (
    <div className="space-y-6 text-white">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Leerlingen
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Beheer en overzicht van al je leerlingen.
          </p>
        </div>
        <StudentOnboardDialog
          packages={packages}
          triggerLabel="Nieuwe leerling"
          triggerClassName="h-12 rounded-lg bg-blue-600 px-5 text-base text-white shadow-[0_18px_50px_-28px_rgba(37,99,235,0.9)] hover:bg-blue-500"
          showTriggerIcon
        />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {studentStats.map((item) => (
          <StudentStatCard key={item.label} {...item} />
        ))}
      </div>

      <StudentsBoard
        students={workspace.students}
        assessments={workspace.assessments}
        notes={workspace.notes}
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
