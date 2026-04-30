import { InstructorCommandCenter } from "@/components/dashboard/instructor-command-center";
import { RealtimeDashboardSync } from "@/components/dashboard/realtime-dashboard-sync";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
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
import { getCurrentInstructorReviewSummary } from "@/lib/data/reviews";
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";

export default async function InstructeurDashboardPage() {
  const [
    lessons,
    requests,
    notifications,
    instructor,
    profile,
    reviewSummary,
    instructorPackages,
    availabilitySlots,
    studentsWorkspace,
  ] = await Promise.all([
    getInstructeurLessons(),
    getInstructeurLessonRequests(),
    getCurrentNotifications(),
    getCurrentInstructeurRecord(),
    getCurrentProfile(),
    getCurrentInstructorReviewSummary(),
    getCurrentInstructorPackages(),
    getCurrentInstructorAvailability(),
    getInstructeurStudentsWorkspace(),
  ]);

  return (
    <InstructorCommandCenter
      lessons={lessons}
      requests={requests}
      notifications={notifications}
      instructor={instructor}
      profileName={profile?.volledige_naam}
      reviewSummary={reviewSummary}
      packages={instructorPackages}
      availabilitySlots={availabilitySlots}
      students={studentsWorkspace.students}
      realtime={<RealtimeDashboardSync profileLabel="instructeur-dashboard" />}
    />
  );
}
