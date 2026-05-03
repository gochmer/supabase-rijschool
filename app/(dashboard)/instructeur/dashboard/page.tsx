import { InstructorCommandCenter } from "@/components/dashboard/instructor-command-center";
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
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";

export default async function InstructeurDashboardPage() {
  const [
    lessons,
    requests,
    notifications,
    instructor,
    profile,
    instructorPackages,
    availabilitySlots,
    studentsWorkspace,
    locationOptions,
  ] = await Promise.all([
    getInstructeurLessons(),
    getInstructeurLessonRequests(),
    getCurrentNotifications(),
    getCurrentInstructeurRecord(),
    getCurrentProfile(),
    getCurrentInstructorPackages(),
    getCurrentInstructorAvailability(),
    getInstructeurStudentsWorkspace(),
    getLocationOptions(),
  ]);

  const reviewStats = instructor
    ? (await getReviewStatsByInstructorIds([instructor.id])).get(instructor.id)
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

  return (
    <InstructorCommandCenter
      lessons={lessons}
      requests={requests}
      notifications={notifications}
      instructor={instructorWithReviewStats}
      profileName={profile?.volledige_naam}
      packages={instructorPackages}
      availabilitySlots={availabilitySlots}
      students={studentsWorkspace.students}
      locationOptions={locationOptions}
      lessonDurationDefaults={resolveInstructorLessonDurationDefaults(
        instructor,
      )}
      realtime={<RealtimeDashboardSync profileLabel="instructeur-dashboard" />}
    />
  );
}
