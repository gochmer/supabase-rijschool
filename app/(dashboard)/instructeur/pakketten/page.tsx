import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { InstructorPackagesWorkspace } from "@/components/packages/instructor-packages-workspace";
import { getCurrentInstructorPackages } from "@/lib/data/packages";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";

const ROUTE = "/instructeur/pakketten";

export default async function InstructeurPakkettenPage() {
  const [packages, instructeur] = await timedDashboardRoute(ROUTE, () =>
    Promise.all([
      timedDashboardData(ROUTE, "packages", getCurrentInstructorPackages),
      timedDashboardData(ROUTE, "instructor", getCurrentInstructeurRecord),
    ]),
  );

  const publicProfilePath = instructeur?.slug
    ? `/instructeurs/${instructeur.slug}`
    : undefined;

  return (
    <>
      <DashboardPerformanceMark
        route={ROUTE}
        label="InstructorPackagesWorkspace"
      />
      <InstructorPackagesWorkspace
        packages={packages}
        publicProfilePath={publicProfilePath}
      />
    </>
  );
}
