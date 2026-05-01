import { InstructorRequestsBoard } from "@/components/dashboard/instructor-requests-board";
import { getInstructeurLessonRequests } from "@/lib/data/lesson-requests";
import { getLocationOptions } from "@/lib/data/locations";

export default async function AanvragenPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const [requests, locationOptions] = await Promise.all([
    getInstructeurLessonRequests(),
    getLocationOptions(),
  ]);
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
    <InstructorRequestsBoard
      requests={requests}
      locationOptions={locationOptions}
      initialTab={initialTab}
      initialFocusId={params.focus ?? null}
    />
  );
}
