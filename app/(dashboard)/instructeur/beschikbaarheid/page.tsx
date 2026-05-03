import { AvailabilityDashboard } from "@/components/instructor/availability-dashboard";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getInstructeurLessons } from "@/lib/data/lesson-requests";
import { getLocationOptions } from "@/lib/data/locations";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";

export default async function BeschikbaarheidPage() {
  const [slots, instructeur, lessons, studentsWorkspace, locationOptions] =
    await Promise.all([
      getCurrentInstructorAvailability(),
      getCurrentInstructeurRecord(),
      getInstructeurLessons(),
      getInstructeurStudentsWorkspace(),
      getLocationOptions(),
    ]);
  const durationDefaults = resolveInstructorLessonDurationDefaults(instructeur);
  const publicAgendaHref = instructeur?.slug
    ? `/instructeurs/${instructeur.slug}`
    : "/instructeurs";

  return (
    <AvailabilityDashboard
      slots={slots}
      lessons={lessons}
      students={studentsWorkspace.students}
      locationOptions={locationOptions}
      onlineBookingEnabled={Boolean(instructeur?.online_boeken_actief)}
      activeCancellationHours={
        instructeur?.leerling_annuleren_tot_uren_voor_les ?? null
      }
      durationDefaults={durationDefaults}
      publicAgendaHref={publicAgendaHref}
    />
  );
}
