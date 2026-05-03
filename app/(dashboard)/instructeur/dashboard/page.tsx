import { InstructorCommandCenter } from "@/components/dashboard/instructor-command-center";
import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { RealtimeDashboardSync } from "@/components/dashboard/realtime-dashboard-sync";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getLocationOptions } from "@/lib/data/locations";
import {
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentNotifications } from "@/lib/data/notifications";
import { getCurrentInstructorPackages } from "@/lib/data/packages";
import {
  getCurrentInstructeurRecord,
  getCurrentProfile,
} from "@/lib/data/profiles";
import { getReviewStatsByInstructorIds } from "@/lib/data/reviews";
import { getInstructeurLessonPlannerStudents } from "@/lib/data/student-progress";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";

const ROUTE = "/instructeur/dashboard";
const LESSON_HISTORY_WINDOW_DAYS = 120;

function getLessonWindowStartIso() {
  return new Date(
    Date.now() - LESSON_HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

export default async function InstructeurDashboardPage() {
  const {
    availabilitySlots,
    instructor,
    instructorPackages,
    instructorWithReviewStats,
    lessons,
    locationOptions,
    notifications,
    profile,
    requests,
    students,
  } = await timedDashboardRoute(ROUTE, async () => {
    const lessonWindowStart = getLessonWindowStartIso();
    const nowIso = new Date().toISOString();
    const [
      lessons,
      requests,
      notifications,
      instructor,
      profile,
      instructorPackages,
      availabilitySlots,
      students,
      locationOptions,
    ] = await Promise.all([
      timedDashboardData(ROUTE, "lessons", () =>
        getInstructeurLessons({
          from: lessonWindowStart,
          limit: 240,
        }),
      ),
      timedDashboardData(ROUTE, "requests", () =>
        getInstructeurLessonRequests({
          limit: 80,
        }),
      ),
      timedDashboardData(ROUTE, "notifications", getCurrentNotifications),
      timedDashboardData(ROUTE, "instructor", getCurrentInstructeurRecord),
      timedDashboardData(ROUTE, "profile", getCurrentProfile),
      timedDashboardData(ROUTE, "packages", getCurrentInstructorPackages),
      timedDashboardData(ROUTE, "availability", () =>
        getCurrentInstructorAvailability({
          concreteLimit: 160,
          from: nowIso,
        }),
      ),
      timedDashboardData(
        ROUTE,
        "planner-students",
        getInstructeurLessonPlannerStudents,
      ),
      timedDashboardData(ROUTE, "locations", getLocationOptions),
    ]);

    const reviewStats = instructor
      ? (
          await timedDashboardData(ROUTE, "review-stats", () =>
            getReviewStatsByInstructorIds([instructor.id]),
          )
        ).get(instructor.id)
      : null;
    const instructorWithReviewStats = instructor
      ? {
          ...instructor,
          beoordeling: reviewStats?.reviewCount
            ? reviewStats.averageScore
            : instructor.beoordeling,
          aantal_reviews: reviewStats?.reviewCount ?? 0,
        }
      : null;

    return {
      availabilitySlots,
      instructor,
      instructorPackages,
      instructorWithReviewStats,
      lessons,
      locationOptions,
      notifications,
      profile,
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
        profileName={profile?.volledige_naam}
        packages={instructorPackages}
        availabilitySlots={availabilitySlots}
        students={students}
        locationOptions={locationOptions}
        lessonDurationDefaults={resolveInstructorLessonDurationDefaults(
          instructor,
        )}
        realtime={<RealtimeDashboardSync profileLabel="instructeur-dashboard" />}
      />
    </>
  );
}
