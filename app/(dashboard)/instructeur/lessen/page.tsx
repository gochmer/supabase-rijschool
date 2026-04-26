import { PageHeader } from "@/components/dashboard/page-header";
import { LessonsBoard } from "@/components/instructor/lessons-board";
import {
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";

export default async function InstructeurLessenPage() {
  const [lessons, requests] = await Promise.all([
    getInstructeurLessons(),
    getInstructeurLessonRequests(),
  ]);

  return (
    <>
      <PageHeader
        title="Lessen"
        description="Bekijk ingeplande, afgeronde en geannuleerde lessen per leerling."
      />
      <LessonsBoard lessons={lessons} requests={requests} />
    </>
  );
}
