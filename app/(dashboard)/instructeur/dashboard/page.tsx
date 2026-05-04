import { Suspense } from "react";

import { InstructorCommandCenter } from "@/components/dashboard/instructor-command-center";
import { InstructorDashboardSkeleton } from "@/components/dashboard/instructor-dashboard-skeleton";
import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { RealtimeDashboardSync } from "@/components/dashboard/realtime-dashboard-sync";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import {
  getInstructeurDashboardLessonRequests,
  getInstructeurDashboardLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentNotificationPreview } from "@/lib/data/notifications";
import { getCurrentInstructorDashboardPackages } from "@/lib/data/packages";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import {
  getInstructeurDashboardProgressSignals,
  getInstructeurDashboardStudents,
} from "@/lib/data/student-progress";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";

const ROUTE = "/instructeur/dashboard";
const LESSON_HISTORY_WINDOW_DAYS = 45;
const LESSON_LOOKAHEAD_DAYS = 14;
const DASHBOARD_LESSON_LIMIT = 48;
const DASHBOARD_REQUEST_LIMIT = 12;
const DASHBOARD_AVAILABILITY_LIMIT = 24;
const DASHBOARD_RECURRING_AVAILABILITY_WEEKS = 2;
const DASHBOARD_STUDENT_LIMIT = 12;

function getLessonWindowStartIso() {
  return new Date(
    Date.now() - LESSON_HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

function getLessonWindowEndIso() {
  return new Date(
    Date.now() + LESSON_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

export default function InstructeurDashboardPage() {
  return (
    <Suspense fallback={<InstructorDashboardSkeleton />}>
      <InstructeurDashboardContent />
    </Suspense>
  );
}

async function InstructeurDashboardContent() {
  const {
    availabilitySlots,
    instructor,
    instructorPackages,
    instructorWithReviewStats,
    lessons,
    notifications,
    progressSignals,
    profileName,
    requests,
    students,
  } = await timedDashboardRoute(ROUTE, async () => {
    const lessonWindowStart = getLessonWindowStartIso();
    const lessonWindowEnd = getLessonWindowEndIso();
    const nowIso = new Date().toISOString();
    const [
      lessons,
      requests,
      notifications,
      instructor,
      instructorPackages,
      availabilitySlots,
      students,
    ] = await Promise.all([
      timedDashboardData(ROUTE, "lessons", () =>
        getInstructeurDashboardLessons({
          from: lessonWindowStart,
          to: lessonWindowEnd,
          limit: DASHBOARD_LESSON_LIMIT,
        }),
      ),
      timedDashboardData(ROUTE, "requests", () =>
        getInstructeurDashboardLessonRequests({
          limit: DASHBOARD_REQUEST_LIMIT,
          status: "aangevraagd",
        }),
      ),
      timedDashboardData(ROUTE, "notifications", () =>
        getCurrentNotificationPreview(),
      ),
      timedDashboardData(ROUTE, "instructor", getCurrentInstructeurRecord),
      timedDashboardData(
        ROUTE,
        "packages",
        getCurrentInstructorDashboardPackages,
      ),
      timedDashboardData(ROUTE, "availability", () =>
        getCurrentInstructorAvailability({
          concreteLimit: DASHBOARD_AVAILABILITY_LIMIT,
          from: nowIso,
          recurringWeeks: DASHBOARD_RECURRING_AVAILABILITY_WEEKS,
        }),
      ),
      timedDashboardData(
        ROUTE,
        "dashboard-students",
        () =>
          getInstructeurDashboardStudents({
            lessonLimit: DASHBOARD_STUDENT_LIMIT * 18,
          }),
      ),
    ]);
    const progressSignals = await timedDashboardData(
      ROUTE,
      "progress-signals",
      () =>
        getInstructeurDashboardProgressSignals({
          instructorId: instructor?.id ?? null,
          students,
        }),
    );

    const instructorWithReviewStats = instructor
      ? {
          ...instructor,
          aantal_reviews: 0,
        }
      : null;

    return {
      availabilitySlots,
      instructor,
      instructorPackages,
      instructorWithReviewStats,
      lessons,
      notifications,
      progressSignals,
      profileName: instructor?.profielNaam ?? null,
      requests,
      students,
    };
  });

  return (
    <>
      <DashboardPerformanceMark
        route={ROUTE}
        label="InstructorCommandCenter"
      />
      <InstructorCommandCenter
        lessons={lessons}
        requests={requests}
        notifications={notifications}
        instructor={instructorWithReviewStats}
        profileName={profileName}
        packages={instructorPackages}
        availabilitySlots={availabilitySlots}
        students={students}
        progressSignals={progressSignals}
        locationOptions={[]}
        lessonDurationDefaults={resolveInstructorLessonDurationDefaults(
          instructor,
        )}
        realtime={<RealtimeDashboardSync profileLabel="instructeur-dashboard" />}
      />
    </>
  );
}
