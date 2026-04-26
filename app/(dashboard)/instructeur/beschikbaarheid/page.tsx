import { PageHeader } from "@/components/dashboard/page-header";
import { AvailabilityManager } from "@/components/instructor/availability-manager";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";

export default async function BeschikbaarheidPage() {
  const [slots, instructeur] = await Promise.all([
    getCurrentInstructorAvailability(),
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
        pricePerLesson={Number(instructeur?.prijs_per_les ?? 0)}
      />
    </>
  );
}
