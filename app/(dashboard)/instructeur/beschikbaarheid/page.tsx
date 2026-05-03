import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { AvailabilityDashboard } from "@/components/instructor/availability-dashboard";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import {
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";
import { getLocationOptions } from "@/lib/data/locations";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { getInstructeurLessonPlannerStudents } from "@/lib/data/student-progress";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";

const ROUTE = "/instructeur/beschikbaarheid";
const LESSON_HISTORY_WINDOW_DAYS = 120;

function getLessonWindowStartIso() {
  return new Date(
    Date.now() - LESSON_HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

export default async function BeschikbaarheidPage() {
  const [
    slots,
    instructeur,
    lessons,
    requests,
    students,
    locationOptions,
  ] = await timedDashboardRoute(ROUTE, async () => {
    const nowIso = new Date().toISOString();
    const lessonWindowStart = getLessonWindowStartIso();

    return Promise.all([
      timedDashboardData(ROUTE, "availability", () =>
        getCurrentInstructorAvailability({
          concreteLimit: 240,
          from: nowIso,
        }),
      ),
      timedDashboardData(ROUTE, "instructor", getCurrentInstructeurRecord),
      timedDashboardData(ROUTE, "lessons", () =>
        getInstructeurLessons({
          from: lessonWindowStart,
          limit: 240,
        }),
      ),
      timedDashboardData(ROUTE, "requests", () =>
        getInstructeurLessonRequests({
          limit: 120,
        }),
      ),
      timedDashboardData(
        ROUTE,
        "planner-students",
        getInstructeurLessonPlannerStudents,
      ),
      timedDashboardData(ROUTE, "locations", getLocationOptions),
    ]);
  });
  const durationDefaults = resolveInstructorLessonDurationDefaults(instructeur);
  const publicAgendaHref = instructeur?.slug
    ? `/instructeurs/${instructeur.slug}`
    : "/instructeurs";
  const currentTimeMs = new Date().getTime();

  return (
    <>
      <DashboardPerformanceMark route={ROUTE} label="AvailabilityDashboard" />
      <AvailabilityDashboard
        slots={slots}
        lessons={lessons}
        requests={requests}
        students={students}
        locationOptions={locationOptions}
        onlineBookingEnabled={Boolean(instructeur?.online_boeken_actief)}
        activeCancellationHours={
          instructeur?.leerling_annuleren_tot_uren_voor_les ?? null
        }
        durationDefaults={durationDefaults}
        publicAgendaHref={publicAgendaHref}
        currentTimeMs={currentTimeMs}
      />
    </>
  );
}
