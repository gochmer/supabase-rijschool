import {
  CalendarCheck2,
  CalendarClock,
  Clock3,
  ShieldCheck,
} from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { InstructorLessonCancellationControl } from "@/components/instructor/instructor-lesson-cancellation-control";
import { InstructorLessonDurationControl } from "@/components/instructor/instructor-lesson-duration-control";
import { InstructorOnlineBookingControl } from "@/components/instructor/instructor-online-booking-control";
import { OpeningHoursManager } from "@/components/instructor/opening-hours-manager";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";

export default async function BeschikbaarheidPage() {
  const [slots, instructeur] = await Promise.all([
    getCurrentInstructorAvailability(),
    getCurrentInstructeurRecord(),
  ]);
  const activeSlots = slots.filter((slot) => slot.beschikbaar);
  const durationDefaults = resolveInstructorLessonDurationDefaults(instructeur);
  const blockedSlots = slots.length - activeSlots.length;

  return (
    <div className="space-y-6 text-slate-100">
      <PageHeader
        tone="urban"
        title="Beschikbaarheid"
        description="Beheer vaste tijden, uitzonderingen en online boekbaarheid vanuit een strak weekoverzicht."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          icon={CalendarCheck2}
          label="Beschikbare momenten"
          value={`${activeSlots.length}`}
          detail="Open voor leerlingen"
          tone="emerald"
        />
        <DashboardStatCard
          icon={CalendarClock}
          label="Totaal blokken"
          value={`${slots.length}`}
          detail="Rooster en uitzonderingen"
          tone="sky"
        />
        <DashboardStatCard
          icon={Clock3}
          label="Geblokkeerd"
          value={`${blockedSlots}`}
          detail="Vakantie of gesloten uren"
          tone={blockedSlots ? "amber" : "cyan"}
        />
        <DashboardStatCard
          icon={ShieldCheck}
          label="Online boeken"
          value={instructeur?.online_boeken_actief ? "Aan" : "Uit"}
          detail="Publieke boekstatus"
          tone={instructeur?.online_boeken_actief ? "emerald" : "rose"}
        />
      </div>

      <OpeningHoursManager slots={slots} />

      <section className="grid items-start gap-4 xl:grid-cols-[0.9fr_0.9fr_1.35fr]">
        <InstructorOnlineBookingControl
          enabled={Boolean(instructeur?.online_boeken_actief)}
          activeSlotCount={activeSlots.length}
        />
        <InstructorLessonCancellationControl
          hoursBeforeLesson={
            instructeur?.leerling_annuleren_tot_uren_voor_les ?? null
          }
        />
        <InstructorLessonDurationControl defaults={durationDefaults} />
      </section>
    </div>
  );
}
