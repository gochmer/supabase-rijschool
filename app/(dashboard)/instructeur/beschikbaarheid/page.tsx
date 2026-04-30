import { PageHeader } from "@/components/dashboard/page-header";
import { InstructorLessonCancellationControl } from "@/components/instructor/instructor-lesson-cancellation-control";
import { InstructorLessonDurationControl } from "@/components/instructor/instructor-lesson-duration-control";
import { AvailabilityManager } from "@/components/instructor/availability-manager";
import { InstructorOnlineBookingControl } from "@/components/instructor/instructor-online-booking-control";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getInstructeurLessons } from "@/lib/data/lesson-requests";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";

export default async function BeschikbaarheidPage() {
  const [slots, lessons, instructeur] = await Promise.all([
    getCurrentInstructorAvailability(),
    getInstructeurLessons(),
    getCurrentInstructeurRecord(),
  ]);
  const activeSlotCount = slots.filter((slot) => slot.beschikbaar).length;
  const durationDefaults = resolveInstructorLessonDurationDefaults(instructeur);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beschikbaarheid"
        description="Je vaste werkweek staat standaard open. Gebruik alleen uitzonderingen of vakantie om momenten dicht te zetten."
      />

      <InstructorOnlineBookingControl
        enabled={Boolean(instructeur?.online_boeken_actief)}
        activeSlotCount={activeSlotCount}
      />

      <InstructorLessonCancellationControl
        hoursBeforeLesson={
          instructeur?.leerling_annuleren_tot_uren_voor_les ?? null
        }
      />

      <InstructorLessonDurationControl defaults={durationDefaults} />

      <AvailabilityManager slots={slots} lessons={lessons} />
    </div>
  );
}
