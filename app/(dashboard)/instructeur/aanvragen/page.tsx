import { DataHealthCallout } from "@/components/dashboard/data-health-callout";
import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { InstructorRequestsBoard } from "@/components/requests/instructor-requests-board";
import { getInstructorPlanningDataHealth } from "@/lib/data/data-health";
import { getInstructeurLessonRequests } from "@/lib/data/lesson-requests";
import { getLocationOptions } from "@/lib/data/locations";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";
import { Suspense } from "react";
import InstructeurAanvragenLoading from "./loading";

const ROUTE = "/instructeur/aanvragen";
const REQUEST_PAGE_REQUEST_LIMIT = 120;
const REQUEST_PAGE_LOCATION_LIMIT = 80;

export default function AanvragenPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; tab?: string }>;
}) {
  return (
    <Suspense fallback={<InstructeurAanvragenLoading />}>
      <AanvragenContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AanvragenContent({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; tab?: string }>;
}) {
  const { dataHealth, locationOptions, params, requests } = await timedDashboardRoute(
    ROUTE,
    async () => {
      const params = await searchParams;
      const [requests, locationOptions, dataHealth] = await Promise.all([
        timedDashboardData(ROUTE, "requests", () =>
          getInstructeurLessonRequests({
            limit: REQUEST_PAGE_REQUEST_LIMIT,
          }),
        ),
        timedDashboardData(ROUTE, "locations", () =>
          getLocationOptions({ limit: REQUEST_PAGE_LOCATION_LIMIT }),
        ),
        timedDashboardData(ROUTE, "data-health", getInstructorPlanningDataHealth),
      ]);

      return {
        dataHealth,
        locationOptions,
        params,
        requests,
      };
    },
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
      <DataHealthCallout
        className="mb-4"
        label="Aanvragen datastatus"
        results={dataHealth}
      />
      <InstructorRequestsBoard
        requests={requests}
        locationOptions={locationOptions}
        initialTab={initialTab}
        initialFocusId={params.focus ?? null}
      />
    </>
  );
}
