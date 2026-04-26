import { PageHeader } from "@/components/dashboard/page-header";
import { LessonsBoard } from "@/components/instructor/lessons-board";
import { getLocationOptions } from "@/lib/data/locations";
import {
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";

export default async function InstructeurLessenPage() {
  const [lessons, requests, locationOptions] = await Promise.all([
    getInstructeurLessons(),
    getInstructeurLessonRequests(),
    getLocationOptions(),
  ]);

  return (
    <>
      <PageHeader
        title="Lessen"
        description="Bekijk ingeplande, afgeronde en geannuleerde lessen per leerling."
      />
      <LessonsBoard
        lessons={lessons}
        requests={requests}
        locationOptions={locationOptions}
      />
    </>
  );
}
