import { CircleAlert, Link2, Target, UserPlus2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StudentsBoard } from "@/components/instructor/students-board";
import { StudentOnboardDialog } from "@/components/instructor/student-onboard-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { getLocationOptions } from "@/lib/data/locations";
import { getCurrentInstructorPackages } from "@/lib/data/packages";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import Link from "next/link";

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
        <Card className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserPlus2 className="size-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Leerlingen
              </p>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {totalStudents}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Actieve werkplek voor je huidige trajecten.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Link2 className="size-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Handmatig gekoppeld
              </p>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {manualStudents}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Leerlingen die direct via jouw werkplek zijn gestart.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="size-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Zelf inplannen aan
              </p>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {selfSchedulingStudents}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Leerlingen die zelfstandig boekbare momenten zien.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CircleAlert className="size-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Nu slim om te checken
              </p>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {actionStudents}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Trajecten zonder volgende stap of met extra aandacht.
            </p>
          </CardContent>
        </Card>
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
