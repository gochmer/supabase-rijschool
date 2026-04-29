import { CalendarClock, CalendarDays, Repeat, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { AvailabilityManager } from "@/components/instructor/availability-manager";
import { InstructorOnlineBookingControl } from "@/components/instructor/instructor-online-booking-control";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAvailabilityDateValue,
  getAvailabilityDurationMinutes,
  getStartOfWeekDateValue,
} from "@/lib/availability";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getInstructeurLessons } from "@/lib/data/lesson-requests";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";

function formatMinutesLabel(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return "0 uur";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!minutes) {
    return `${hours} uur`;
  }

  return `${hours}u ${String(minutes).padStart(2, "0")}m`;
}

export default async function BeschikbaarheidPage() {
  const [slots, lessons, instructeur] = await Promise.all([
    getCurrentInstructorAvailability(),
    getInstructeurLessons(),
    getCurrentInstructeurRecord(),
  ]);

  const activeSlots = slots.filter((slot) => slot.beschikbaar).length;
  const recurringRuleCount = new Set(
    slots.map((slot) => slot.weekrooster_id).filter(Boolean)
  ).size;
  const today = new Date();
  const nextWeekStart = getStartOfWeekDateValue(
    new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  );
  const nextWeekEnd = getStartOfWeekDateValue(
    new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
  );
  const nextWeekOpenMinutes = slots.reduce((total, slot) => {
    if (!slot.beschikbaar || !slot.start_at || !slot.eind_at) {
      return total;
    }

    const dateValue = getAvailabilityDateValue(slot.start_at);

    if (dateValue < nextWeekStart || dateValue >= nextWeekEnd) {
      return total;
    }

    return total + getAvailabilityDurationMinutes(slot.start_at, slot.eind_at);
  }, 0);
  const upcomingLessons = lessons.filter(
    (lesson) =>
      lesson.start_at &&
      new Date(lesson.start_at).getTime() >= today.getTime() &&
      ["ingepland", "geaccepteerd", "afgerond"].includes(lesson.status)
  ).length;

  const summaryCards = [
    {
      label: "Boekbaar open",
      value: `${activeSlots}`,
      description: activeSlots ? "Actieve slots voor leerlingen" : "Nog geen open slots",
      icon: Sparkles,
    },
    {
      label: "Vast weekrooster",
      value: `${recurringRuleCount}`,
      description: recurringRuleCount ? "Terugkerende regels actief" : "Nog geen vaste ritmes",
      icon: Repeat,
    },
    {
      label: "Volgende week open",
      value: formatMinutesLabel(nextWeekOpenMinutes),
      description: "Open tijd die al klaarstaat",
      icon: CalendarDays,
    },
    {
      label: "Ingeplande lessen",
      value: `${upcomingLessons}`,
      description: "Aankomende lesmomenten geblokkeerd",
      icon: CalendarClock,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beschikbaarheid"
        description="Werk vanuit een rustige planner voor open tijden, weekritme en directe online boeking."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card
            key={item.label}
            className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <item.icon className="size-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {item.label}
                </p>
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <InstructorOnlineBookingControl
        enabled={Boolean(instructeur?.online_boeken_actief)}
        activeSlotCount={activeSlots}
      />

      <AvailabilityManager
        slots={slots}
        lessons={lessons}
        pricePerLesson={Number(instructeur?.prijs_per_les ?? 0)}
        showSummarySidebar={false}
      />
    </div>
  );
}
