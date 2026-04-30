import { CircleAlert, Link2, Target, UserPlus2 } from "lucide-react";
import Link from "next/link";

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StudentsBoard } from "@/components/instructor/students-board";
import { StudentOnboardDialog } from "@/components/instructor/student-onboard-dialog";
import { Button } from "@/components/ui/button";
import { getLocationOptions } from "@/lib/data/locations";
import { getCurrentInstructorPackages } from "@/lib/data/packages";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";

export default async function LeerlingenPage() {
  const [workspace, locationOptions, packages, instructeur] = await Promise.all([
    getInstructeurStudentsWorkspace(),
    getLocationOptions(),
    getCurrentInstructorPackages(),
    getCurrentInstructeurRecord(),
  ]);
  const lessonDurationDefaults = resolveInstructorLessonDurationDefaults(instructeur);
  const totalStudents = workspace.students.length;
  const manualStudents = workspace.students.filter(
    (student) => student.isHandmatigGekoppeld
  ).length;
  const selfSchedulingStudents = workspace.students.filter(
    (student) => student.zelfInplannenToegestaan
  ).length;
  const actionStudents = workspace.students.filter(
    (student) =>
      student.voortgang < 40 ||
      !student.volgendeLesAt ||
      student.accountStatus === "uitgenodigd"
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

  return (
    <>
      <PageHeader
        title="Leerlingen"
        description="Werk per leerling vanuit één rustige werkplek voor voortgang, intake en het plannen van de volgende stap."
        actions={
          <>
            <StudentOnboardDialog packages={packages} />
            <Button asChild variant="outline" className="h-9 rounded-full text-[13px]">
              <Link href="/instructeur/lessen">Lessen bekijken</Link>
            </Button>
            <Button asChild className="h-9 rounded-full text-[13px]">
              <Link href="/instructeur/aanvragen">Nieuwe aanvragen</Link>
            </Button>
          </>
        }
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
      />
    </>
  );
}
