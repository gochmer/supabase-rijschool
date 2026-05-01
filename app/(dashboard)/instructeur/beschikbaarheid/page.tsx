import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
} from "lucide-react";

import { AvailabilityManager } from "@/components/instructor/availability-manager";
import { InstructorLessonCancellationControl } from "@/components/instructor/instructor-lesson-cancellation-control";
import { InstructorLessonDurationControl } from "@/components/instructor/instructor-lesson-duration-control";
import { InstructorOnlineBookingControl } from "@/components/instructor/instructor-online-booking-control";
import { Button } from "@/components/ui/button";
import { getAvailabilityDurationMinutes } from "@/lib/availability";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getInstructeurLessons } from "@/lib/data/lesson-requests";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";

function isWithinNextDays(dateValue: string | null | undefined, days: number) {
  if (!dateValue) {
    return false;
  }

  const timestamp = new Date(dateValue).getTime();
  const now = Date.now();

  return timestamp >= now && timestamp <= now + days * 24 * 60 * 60 * 1000;
}

function formatNextLessonLabel(startAt: string | null | undefined) {
  if (!startAt) {
    return "Nog geen les";
  }

  const date = new Date(startAt);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayLabel =
    date.toDateString() === tomorrow.toDateString()
      ? "Morgen"
      : new Intl.DateTimeFormat("nl-NL", {
          weekday: "long",
          day: "numeric",
          month: "short",
        }).format(date);
  const timeLabel = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${dayLabel}, ${timeLabel}`;
}

export default async function BeschikbaarheidPage() {
  const [slots, lessons, instructeur] = await Promise.all([
    getCurrentInstructorAvailability(),
    getInstructeurLessons(),
    getCurrentInstructeurRecord(),
  ]);
  const activeSlots = slots.filter((slot) => slot.beschikbaar);
  const weekSlots = activeSlots.filter((slot) => isWithinNextDays(slot.start_at, 7));
  const totalWeekMinutes = weekSlots.reduce((sum, slot) => {
    if (!slot.start_at || !slot.eind_at) {
      return sum;
    }

    return sum + getAvailabilityDurationMinutes(slot.start_at, slot.eind_at);
  }, 0);
  const plannedLessons = lessons
    .filter((lesson) => ["ingepland", "geaccepteerd"].includes(lesson.status))
    .sort((left, right) => (left.start_at ?? "").localeCompare(right.start_at ?? ""));
  const confirmedLessons = plannedLessons.length;
  const nextLesson = plannedLessons.find((lesson) =>
    isWithinNextDays(lesson.start_at, 30)
  );
  const durationDefaults = resolveInstructorLessonDurationDefaults(instructeur);

  const statCards = [
    {
      label: "Totaal beschikbare uren",
      value: `${Math.round(totalWeekMinutes / 60)}u`,
      detail: "Deze week",
      icon: CalendarDays,
      tone: "bg-blue-600/20 text-blue-200 ring-blue-400/20",
      trend: "+ 12%",
    },
    {
      label: "Bevestigde lessen",
      value: String(confirmedLessons),
      detail: instructeur?.online_boeken_actief ? "Boekingen aan" : "Boekingen uit",
      icon: CheckCircle2,
      tone: "bg-emerald-600/20 text-emerald-200 ring-emerald-400/20",
      trend: "+ 8%",
    },
    {
      label: "Beschikbare sloten",
      value: String(weekSlots.length),
      detail: "Deze week",
      icon: Clock3,
      tone: "bg-violet-600/20 text-violet-200 ring-violet-400/20",
    },
    {
      label: "Volgende les",
      value: formatNextLessonLabel(nextLesson?.start_at),
      detail: nextLesson?.leerling_naam ?? "Geen geplande leerling",
      icon: CalendarClock,
      tone: "bg-amber-600/20 text-amber-200 ring-amber-400/20",
    },
  ];

  return (
    <div className="min-h-screen space-y-5 bg-[#080d14] text-slate-100">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Beschikbaarheid
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Beheer je beschikbaarheid en tijden waarop je lessen geeft.
          </p>
        </div>
        <Button
          asChild
          className="h-10 rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-500"
        >
          <a href="#beschikbaarheid-beheer">
            <Plus className="size-4" />
            Beschikbaarheid toevoegen
          </a>
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(18,27,39,0.98),rgba(13,20,30,0.96))] p-5 shadow-[0_24px_70px_-52px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-start gap-4">
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-lg ring-1 ${card.tone}`}
              >
                <card.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">{card.label}</p>
                <p className="mt-2 truncate text-2xl font-semibold text-white">
                  {card.value}
                </p>
                <div className="mt-4 flex items-center gap-3 text-sm">
                  <span className="text-slate-400">{card.detail}</span>
                  {card.trend ? (
                    <span className="text-emerald-300">{card.trend}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <AvailabilityManager slots={slots} lessons={lessons} />

      <section className="grid gap-4 xl:grid-cols-3">
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
