import { PageHeader } from "@/components/dashboard/page-header";
import { StudentsBoard } from "@/components/instructor/students-board";
import { Button } from "@/components/ui/button";
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";
import Link from "next/link";

export default async function LeerlingenPage() {
  const workspace = await getInstructeurStudentsWorkspace();

  return (
    <>
      <PageHeader
        title="Leerlingen"
        description="Werk per leerling met een digitale instructiekaart, lesmomenten en voortgang die direct meebeweegt."
        actions={
          <>
            <Button asChild variant="outline" className="h-9 rounded-full text-[13px]">
              <Link href="/instructeur/lessen">Lessen bekijken</Link>
            </Button>
            <Button asChild className="h-9 rounded-full text-[13px]">
              <Link href="/instructeur/aanvragen">Nieuwe aanvragen</Link>
            </Button>
          </>
        }
      />
      <StudentsBoard
        students={workspace.students}
        assessments={workspace.assessments}
        notes={workspace.notes}
      />
    </>
  );
}
