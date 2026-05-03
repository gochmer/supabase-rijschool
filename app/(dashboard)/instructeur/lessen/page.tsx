import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { LessonsBoard } from "@/components/instructor/lessons-board";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getLocationOptions } from "@/lib/data/locations";
import {
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { getInstructeurLessonPlannerStudents } from "@/lib/data/student-progress";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";

const LESSON_HISTORY_WINDOW_DAYS = 180;
const ROUTE = "/instructeur/lessen";

function getLessonWindowStartIso() {
  return new Date(
    Date.now() - LESSON_HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

function getNowIso() {
  return new Date().toISOString();
}

export default async function InstructeurLessenPage({
  searchParams,
}: {
  searchParams: Promise<{ zoek?: string }>;
}) {
  const {
    instructeur,
    lessons,
    locationOptions,
    params,
    requests,
    slots,
    students,
  } = await timedDashboardRoute(ROUTE, async () => {
    const params = await searchParams;
    const lessonWindowStart = getLessonWindowStartIso();
    const nowIso = getNowIso();
    const [
      lessons,
      requests,
      slots,
      locationOptions,
      students,
      instructeur,
    ] = await Promise.all([
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
      timedDashboardData(ROUTE, "availability", () =>
        getCurrentInstructorAvailability({
          concreteLimit: 240,
          from: nowIso,
        }),
      ),
      timedDashboardData(ROUTE, "locations", getLocationOptions),
      timedDashboardData(
        ROUTE,
        "planner-students",
        getInstructeurLessonPlannerStudents,
      ),
      timedDashboardData(ROUTE, "instructor", getCurrentInstructeurRecord),
    ]);

    return {
      instructeur,
      lessons,
      locationOptions,
      params,
      requests,
      slots,
      students,
    };
  });
  const durationDefaults = resolveInstructorLessonDurationDefaults(instructeur);

  return (
    <>
      <DashboardPerformanceMark route={ROUTE} label="LessonsBoard" />
      <LessonsBoard
        lessons={lessons}
        requests={requests}
        slots={slots}
        students={students}
        locationOptions={locationOptions}
        durationDefaults={durationDefaults}
        initialQuery={params.zoek ?? ""}
      />
    </>
  );
}
