import { DataHealthCallout } from "@/components/dashboard/data-health-callout";
import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { LessonsBoard } from "@/components/instructor/lessons-board";
import { getInstructorPlanningDataHealth } from "@/lib/data/data-health";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getCurrentInstructorLessonDetailTimelineSummaries } from "@/lib/data/lesson-detail-timeline";
import { getLocationOptions } from "@/lib/data/locations";
import { getCurrentInstructorLessonCheckinBoards } from "@/lib/data/lesson-checkins";
import { getCurrentInstructorLessonCompassBoards } from "@/lib/data/lesson-compass";
import {
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { getInstructeurDashboardStudents } from "@/lib/data/student-progress";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";
import { Suspense } from "react";
import InstructeurLessenLoading from "./loading";

const ROUTE = "/instructeur/lessen";
const LESSON_HISTORY_WINDOW_DAYS = 120;
const LESSON_LOOKAHEAD_DAYS = 45;
const LESSON_PAGE_LESSON_LIMIT = 180;
const LESSON_PAGE_REQUEST_LIMIT = 80;
const LESSON_PAGE_AVAILABILITY_LIMIT = 96;
const LESSON_PAGE_RECURRING_AVAILABILITY_WEEKS = 4;
const LESSON_PAGE_LOCATION_LIMIT = 80;
const LESSON_PAGE_STUDENT_LESSON_LIMIT = 260;

function getLessonWindowStartIso() {
  return new Date(
    Date.now() - LESSON_HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

function getNowIso() {
  return new Date().toISOString();
}

function getLessonWindowEndIso() {
  return new Date(
    Date.now() + LESSON_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

export default function InstructeurLessenPage({
  searchParams,
}: {
  searchParams: Promise<{ zoek?: string }>;
}) {
  return (
    <Suspense fallback={<InstructeurLessenLoading />}>
      <InstructeurLessenContent searchParams={searchParams} />
    </Suspense>
  );
}

async function InstructeurLessenContent({
  searchParams,
}: {
  searchParams: Promise<{ zoek?: string }>;
}) {
  const {
    instructeur,
    lessonCheckinBoards,
    lessonCompassBoards,
    lessonTimelineSummaries,
    lessons,
    planningDataHealth,
    locationOptions,
    params,
    requests,
    slots,
    students,
  } = await timedDashboardRoute(ROUTE, async () => {
    const params = await searchParams;
    const lessonWindowStart = getLessonWindowStartIso();
    const lessonWindowEnd = getLessonWindowEndIso();
    const nowIso = getNowIso();
    const [
      lessons,
      requests,
      slots,
      locationOptions,
      students,
      instructeur,
      lessonCompassBoards,
      lessonCheckinBoards,
      lessonTimelineSummaries,
      planningDataHealth,
    ] = await Promise.all([
      timedDashboardData(ROUTE, "lessons", () =>
        getInstructeurLessons({
          from: lessonWindowStart,
          to: lessonWindowEnd,
          limit: LESSON_PAGE_LESSON_LIMIT,
        }),
      ),
      timedDashboardData(ROUTE, "requests", () =>
        getInstructeurLessonRequests({
          limit: LESSON_PAGE_REQUEST_LIMIT,
        }),
      ),
      timedDashboardData(ROUTE, "availability", () =>
        getCurrentInstructorAvailability({
          concreteLimit: LESSON_PAGE_AVAILABILITY_LIMIT,
          from: nowIso,
          recurringWeeks: LESSON_PAGE_RECURRING_AVAILABILITY_WEEKS,
        }),
      ),
      timedDashboardData(ROUTE, "locations", () =>
        getLocationOptions({ limit: LESSON_PAGE_LOCATION_LIMIT }),
      ),
      timedDashboardData(
        ROUTE,
        "planner-students",
        () =>
          getInstructeurDashboardStudents({
            lessonLimit: LESSON_PAGE_STUDENT_LESSON_LIMIT,
          }),
      ),
      timedDashboardData(ROUTE, "instructor", getCurrentInstructeurRecord),
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
      timedDashboardData(ROUTE, "lesson-detail-timeline", () =>
        getCurrentInstructorLessonDetailTimelineSummaries({
          from: lessonWindowStart,
          limit: LESSON_PAGE_LESSON_LIMIT * 4,
          to: lessonWindowEnd,
        }),
      ),
      timedDashboardData(
        ROUTE,
        "data-health",
        getInstructorPlanningDataHealth,
      ),
    ]);

    return {
      instructeur,
      lessonCheckinBoards,
      lessonCompassBoards,
      lessonTimelineSummaries,
      lessons,
      planningDataHealth,
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
      <DataHealthCallout
        className="mb-4"
        label="Planning datastatus"
        results={planningDataHealth}
      />
      <LessonsBoard
        lessons={lessons}
        requests={requests}
        slots={slots}
        students={students}
        locationOptions={locationOptions}
        lessonCheckinBoards={lessonCheckinBoards}
        lessonCompassBoards={lessonCompassBoards}
        lessonTimelineSummaries={lessonTimelineSummaries}
        durationDefaults={durationDefaults}
        initialQuery={params.zoek ?? ""}
      />
    </>
  );
}
