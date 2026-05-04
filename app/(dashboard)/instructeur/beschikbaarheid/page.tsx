import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { AvailabilityDashboard } from "@/components/instructor/availability-dashboard";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import {
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";
import { getLocationOptions } from "@/lib/data/locations";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { getInstructeurDashboardStudents } from "@/lib/data/student-progress";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";
import { Suspense } from "react";
import InstructeurBeschikbaarheidLoading from "./loading";

const ROUTE = "/instructeur/beschikbaarheid";
const LESSON_HISTORY_WINDOW_DAYS = 120;
const LESSON_LOOKAHEAD_DAYS = 45;
const AVAILABILITY_PAGE_LESSON_LIMIT = 180;
const AVAILABILITY_PAGE_REQUEST_LIMIT = 80;
const AVAILABILITY_PAGE_CONCRETE_LIMIT = 120;
const AVAILABILITY_PAGE_RECURRING_WEEKS = 5;
const AVAILABILITY_PAGE_LOCATION_LIMIT = 80;
const AVAILABILITY_PAGE_STUDENT_LESSON_LIMIT = 260;

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

export default function BeschikbaarheidPage() {
  return (
    <Suspense fallback={<InstructeurBeschikbaarheidLoading />}>
      <BeschikbaarheidContent />
    </Suspense>
  );
}

async function BeschikbaarheidContent() {
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
    const lessonWindowEnd = getLessonWindowEndIso();

    return Promise.all([
      timedDashboardData(ROUTE, "availability", () =>
        getCurrentInstructorAvailability({
          concreteLimit: AVAILABILITY_PAGE_CONCRETE_LIMIT,
          from: nowIso,
          recurringWeeks: AVAILABILITY_PAGE_RECURRING_WEEKS,
        }),
      ),
      timedDashboardData(ROUTE, "instructor", getCurrentInstructeurRecord),
      timedDashboardData(ROUTE, "lessons", () =>
        getInstructeurLessons({
          from: lessonWindowStart,
          to: lessonWindowEnd,
          limit: AVAILABILITY_PAGE_LESSON_LIMIT,
        }),
      ),
      timedDashboardData(ROUTE, "requests", () =>
        getInstructeurLessonRequests({
          limit: AVAILABILITY_PAGE_REQUEST_LIMIT,
        }),
      ),
      timedDashboardData(
        ROUTE,
        "planner-students",
        () =>
          getInstructeurDashboardStudents({
            lessonLimit: AVAILABILITY_PAGE_STUDENT_LESSON_LIMIT,
          }),
      ),
      timedDashboardData(ROUTE, "locations", () =>
        getLocationOptions({ limit: AVAILABILITY_PAGE_LOCATION_LIMIT }),
      ),
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
