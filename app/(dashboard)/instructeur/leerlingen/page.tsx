import { CircleAlert, Link2, Target, UserPlus2 } from "lucide-react";
import Link from "next/link";

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  formatTrajectoryDate,
  TrajectoryRelationshipCard,
} from "@/components/dashboard/trajectory-relationship-card";
import { StudentsBoard } from "@/components/instructor/students-board";
import { StudentOnboardDialog } from "@/components/instructor/student-onboard-dialog";
import { Button } from "@/components/ui/button";
import { getLocationOptions } from "@/lib/data/locations";
import { getCurrentInstructorPackages } from "@/lib/data/packages";
import {
  getCurrentInstructeurRecord,
  getCurrentProfile,
} from "@/lib/data/profiles";
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";

export default async function LeerlingenPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const params = await searchParams;
  const [workspace, locationOptions, packages, instructeur, profile] =
    await Promise.all([
      getInstructeurStudentsWorkspace(),
      getLocationOptions(),
      getCurrentInstructorPackages(),
      getCurrentInstructeurRecord(),
      getCurrentProfile(),
    ]);
  const lessonDurationDefaults =
    resolveInstructorLessonDurationDefaults(instructeur);
  const totalStudents = workspace.students.length;
  const manualStudents = workspace.students.filter(
    (student) => student.isHandmatigGekoppeld,
  ).length;
  const selfSchedulingStudents = workspace.students.filter(
    (student) => student.zelfInplannenToegestaan,
  ).length;
  const actionStudents = workspace.students.filter(
    (student) =>
      student.voortgang < 40 ||
      !student.volgendeLesAt ||
      student.accountStatus === "uitgenodigd",
  ).length;
  const studentStats = [
    {
      icon: UserPlus2,
      label: "Leerlingen",
      value: `${totalStudents}`,
      detail: "Actieve werkplek voor je huidige trajecten.",
      tone: totalStudents > 0 ? "sky" : "cyan",
    },
    {
      icon: Link2,
      label: "Handmatig gekoppeld",
      value: `${manualStudents}`,
      detail: "Leerlingen die direct via jouw werkplek zijn gestart.",
      tone: "violet",
    },
    {
      icon: Target,
      label: "Zelf inplannen aan",
      value: `${selfSchedulingStudents}`,
      detail: "Leerlingen die zelfstandig boekbare momenten zien.",
      tone: selfSchedulingStudents > 0 ? "emerald" : "amber",
    },
    {
      icon: CircleAlert,
      label: "Nu slim om te checken",
      value: `${actionStudents}`,
      detail: "Trajecten zonder volgende stap of met extra aandacht.",
      tone: actionStudents > 0 ? "rose" : "emerald",
    },
  ] as const;
  const focusStudent =
    workspace.students.find((student) => student.volgendeLesAt) ??
    workspace.students.find((student) => student.zelfInplannenToegestaan) ??
    workspace.students[0] ??
    null;
  const instructorName = profile?.volledige_naam ?? "Instructeur";
  const studentName = focusStudent?.naam ?? "Nieuwe leerling";
  const trajectoryStartLabel = focusStudent
    ? focusStudent.isHandmatigGekoppeld
      ? "Handmatig gekoppeld"
      : focusStudent.laatsteBeoordelingAt
        ? (formatTrajectoryDate(focusStudent.laatsteBeoordelingAt) ??
          "Traject actief")
        : "Traject actief"
    : "Eerste koppeling volgt";
  const trajectoryGoalLabel =
    focusStudent?.pakket && focusStudent.pakket !== "Nog geen pakket"
      ? focusStudent.pakket
      : "Doel samen bepalen";
  const trajectoryRhythmLabel = focusStudent?.volgendeLesAt
    ? focusStudent.volgendeLes
    : focusStudent?.zelfInplannenToegestaan
      ? "Zelf plannen staat aan"
      : "Planning samen afstemmen";
  const trajectoryMilestone = focusStudent?.volgendeLesAt
    ? `Volgende les: ${focusStudent.volgendeLes}`
    : focusStudent
      ? focusStudent.voortgang < 40
        ? "Basisvaardigheden versterken"
        : "Volgende les plannen"
      : "Eerste leerling koppelen";
  const trajectoryPreferences = [
    focusStudent?.zelfInplannenToegestaan
      ? "Zelf inplannen actief"
      : "Planning via instructeur",
    focusStudent?.telefoon ? "Contact bekend" : "Contact aanvullen",
    focusStudent?.onboardingNotitie
      ? "Intake notitie aanwezig"
      : "Intake aanvullen",
  ];

  return (
    <>
      <PageHeader
        tone="urban"
        title="Leerlingen"
        description="Werk per leerling vanuit één rustige werkplek voor voortgang, intake en het plannen van de volgende stap."
        actions={
          <>
            <StudentOnboardDialog packages={packages} />
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-full text-[13px]"
            >
              <Link href="/instructeur/lessen">Lessen bekijken</Link>
            </Button>
            <Button asChild className="h-9 rounded-full text-[13px]">
              <Link href="/instructeur/aanvragen">Nieuwe aanvragen</Link>
            </Button>
          </>
        }
      />

      <TrajectoryRelationshipCard
        learner={{
          name: studentName,
          roleLabel: "Leerling",
          subtitle: focusStudent
            ? `${focusStudent.voortgang}% voortgang`
            : "Nog geen actieve koppeling",
          tone: "sky",
        }}
        instructor={{
          name: instructorName,
          roleLabel: "Instructeur",
          subtitle: instructeur?.online_boeken_actief
            ? "Online boeken actief"
            : "Planning beheerd",
          tone: "emerald",
        }}
        startLabel={trajectoryStartLabel}
        goalLabel={trajectoryGoalLabel}
        rhythmLabel={trajectoryRhythmLabel}
        nextMilestone={trajectoryMilestone}
        preferences={trajectoryPreferences}
        agreements={[
          "Intake helder houden",
          "Voortgang per les bijwerken",
          "Privacy opt-in",
        ]}
        description="Een rustige trajectkaart voor de leerling waar nu het meeste aandacht op zit: planning, doel en afspraken in een helder overzicht."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {studentStats.map((item) => (
          <DashboardStatCard key={item.label} {...item} />
        ))}
      </div>

      <StudentsBoard
        students={workspace.students}
        assessments={workspace.assessments}
        notes={workspace.notes}
        locationOptions={locationOptions}
        packages={packages}
        lessonDurationDefaults={lessonDurationDefaults}
        initialStudentId={params.student ?? null}
      />
    </>
  );
}
