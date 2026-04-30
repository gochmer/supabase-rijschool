import { PageHeader } from "@/components/dashboard/page-header";
import { InstructorFinder } from "@/components/instructors/instructor-finder";
import { getFavoriteInstructorIds } from "@/lib/data/favorites";
import {
  getPublicInstructorAvailabilityMap,
  getPublicInstructors,
} from "@/lib/data/instructors";
import { getCurrentLearnerSchedulingAccessMapForInstructorIds } from "@/lib/data/student-scheduling";

export default async function LeerlingInstructeursPage() {
  const [liveInstructors, favoriteInstructorIds] = await Promise.all([
    getPublicInstructors(),
    getFavoriteInstructorIds(),
  ]);
  const instructorIds = liveInstructors.map((instructor) => instructor.id);
  const schedulingAccessByInstructorId =
    await getCurrentLearnerSchedulingAccessMapForInstructorIds(instructorIds);
  const availableSlotsByInstructorId = await getPublicInstructorAvailabilityMap(
    liveInstructors
      .filter(
        (instructor) =>
          schedulingAccessByInstructorId[instructor.id]?.canViewAgenda
      )
      .map((instructor) => instructor.id),
    12
  );
  const directBookingEnabledByInstructorId = Object.fromEntries(
    Object.entries(schedulingAccessByInstructorId).map(([instructorId, access]) => [
      instructorId,
      access.directBookingAllowed,
    ])
  );
  const trialLessonAvailableByInstructorId = Object.fromEntries(
    Object.entries(schedulingAccessByInstructorId).map(([instructorId, access]) => [
      instructorId,
      access.trialLessonAvailable,
    ])
  );
  const weeklyBookingLimitByInstructorId = Object.fromEntries(
    Object.entries(schedulingAccessByInstructorId).map(([instructorId, access]) => [
      instructorId,
      access.weeklyBookingLimitMinutes,
    ])
  );
  const bookedMinutesByWeekStartByInstructorId = Object.fromEntries(
    Object.entries(schedulingAccessByInstructorId).map(([instructorId, access]) => [
      instructorId,
      access.bookedMinutesByWeekStart,
    ])
  );
  const weeklyRemainingMinutesThisWeekByInstructorId = Object.fromEntries(
    Object.entries(schedulingAccessByInstructorId).map(([instructorId, access]) => [
      instructorId,
      access.weeklyRemainingMinutesThisWeek,
    ])
  );

  return (
    <>
      <PageHeader
        title="Instructeurs zoeken"
        description="Vergelijk instructeurs op regio, prijs, beoordeling, beschikbaarheid, transmissie en specialisatie."
      />
      <InstructorFinder
        instructors={liveInstructors}
        detailBasePath="/instructeurs"
        favoriteInstructorIds={favoriteInstructorIds}
        availableSlotsByInstructorId={availableSlotsByInstructorId}
        directBookingEnabledByInstructorId={directBookingEnabledByInstructorId}
        trialLessonAvailableByInstructorId={trialLessonAvailableByInstructorId}
        weeklyBookingLimitByInstructorId={weeklyBookingLimitByInstructorId}
        bookedMinutesByWeekStartByInstructorId={
          bookedMinutesByWeekStartByInstructorId
        }
        weeklyRemainingMinutesThisWeekByInstructorId={
          weeklyRemainingMinutesThisWeekByInstructorId
        }
      />
    </>
  );
}
