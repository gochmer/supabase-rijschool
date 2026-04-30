import { CalendarClock, Clock3, Gauge, ToggleRight } from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
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
  const plannedLessons = lessons.filter((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status)
  ).length;
  const durationDefaults = resolveInstructorLessonDurationDefaults(instructeur);
  const availabilityStats = [
    {
      icon: CalendarClock,
      label: "Open blokken",
      value: `${activeSlotCount}`,
      detail: "Beschikbare momenten die leerlingen kunnen gebruiken.",
      tone: activeSlotCount > 0 ? "emerald" : "amber",
    },
    {
      icon: ToggleRight,
      label: "Online boeken",
      value: instructeur?.online_boeken_actief ? "Actief" : "Uit",
      detail: instructeur?.online_boeken_actief
        ? "Leerlingen kunnen sneller van interesse naar planning."
        : "Zet dit aan zodra je agenda en voorwaarden klaarstaan.",
      tone: instructeur?.online_boeken_actief ? "sky" : "amber",
    },
    {
      icon: Clock3,
      label: "Lesduur",
      value: `${durationDefaults.rijles} min`,
      detail: `${durationDefaults.proefles} minuten voor proeflessen.`,
      tone: "cyan",
    },
    {
      icon: Gauge,
      label: "Geplande lessen",
      value: `${plannedLessons}`,
      detail: "Actieve lessen die al in je agenda staan.",
      tone: plannedLessons > 0 ? "violet" : "rose",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beschikbaarheid"
        description="Je werkweek staat standaard open. Beheer alleen uitzonderingen."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {availabilityStats.map((item) => (
          <DashboardStatCard key={item.label} {...item} />
        ))}
      </div>

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
