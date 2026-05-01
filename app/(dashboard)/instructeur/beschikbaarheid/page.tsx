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

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-[1.35rem] border border-sky-300/18 bg-[radial-gradient(circle_at_18%_0%,rgba(30,64,175,0.22),transparent_36%),linear-gradient(145deg,rgba(9,16,29,0.98),rgba(5,12,22,0.99))] px-6 py-9 shadow-[0_30px_90px_-60px_rgba(30,64,175,0.75)] sm:px-8">
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
          Openingstijden beheren
        </h1>
        <p className="mt-4 text-lg leading-7 text-slate-300 sm:text-2xl">
          Beheer vaste tijden en uitzonderingen
        </p>
      </section>

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
