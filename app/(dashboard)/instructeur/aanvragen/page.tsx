import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { InstructorRequestsBoard } from "@/components/dashboard/instructor-requests-board";
import { getInstructeurLessonRequests } from "@/lib/data/lesson-requests";
import { getLocationOptions } from "@/lib/data/locations";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";

const ROUTE = "/instructeur/aanvragen";

export default async function AanvragenPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const [requests, locationOptions] = await timedDashboardRoute(ROUTE, () =>
    Promise.all([
      timedDashboardData(ROUTE, "requests", () =>
        getInstructeurLessonRequests({
          limit: 200,
        }),
      ),
      timedDashboardData(ROUTE, "locations", getLocationOptions),
    ]),
  );
  let initialTab: "all" | "pending" | "accepted" | "rejected" = "all";

  if (params.tab === "nu" || params.tab === "pending") {
    initialTab = "pending";
  }

  if (params.tab === "accepted") {
    initialTab = "accepted";
  }

  if (params.tab === "rejected") {
    initialTab = "rejected";
  }

  return (
    <>
      <DashboardPerformanceMark route={ROUTE} label="InstructorRequestsBoard" />
      <InstructorRequestsBoard
        requests={requests}
        locationOptions={locationOptions}
        initialTab={initialTab}
        initialFocusId={params.focus ?? null}
      />
    </>
  );
}
