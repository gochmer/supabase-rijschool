import { PageHeader } from "@/components/dashboard/page-header";
import { AvailabilityManager } from "@/components/instructor/availability-manager";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getInstructeurLessons } from "@/lib/data/lesson-requests";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";

export default async function BeschikbaarheidPage() {
  const [slots, lessons, instructeur] = await Promise.all([
    getCurrentInstructorAvailability(),
    getInstructeurLessons(),
    getCurrentInstructeurRecord(),
  ]);

  return (
    <>
      <PageHeader
        title="Beschikbaarheid"
        description="Stel je werkdagen, werktijden, buffers, pauzemomenten en afwezigheidsblokken in, open losse of terugkerende tijdsloten, beheer je agenda vanuit een vaste kalenderweergave en stuur daarna bij met gerichte inzichten."
      />
      <AvailabilityManager
        slots={slots}
        lessons={lessons}
        pricePerLesson={Number(instructeur?.prijs_per_les ?? 0)}
      />
    </>
  );
}
