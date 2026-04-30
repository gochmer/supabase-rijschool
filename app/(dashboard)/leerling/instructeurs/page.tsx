import { CalendarDays, Heart, Search, Zap } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { InstructorFinder } from "@/components/instructors/instructor-finder";
import { getFavoriteInstructorIds } from "@/lib/data/favorites";
import {
  getPublicInstructorAvailabilityMap,
  getPublicInstructors,
} from "@/lib/data/instructors";
import { getCurrentLearnerSchedulingAccessMapForInstructorIds } from "@/lib/data/student-scheduling";

export default async function LeerlingInstructeursPage() {
  const [liveInstructors, favoriteInstructorIds] = await Promise.all([
    getPublicInstructors(),
    getFavoriteInstructorIds(),
  ]);
  const instructorIds = liveInstructors.map((instructor) => instructor.id);
  const schedulingAccessByInstructorId =
    await getCurrentLearnerSchedulingAccessMapForInstructorIds(instructorIds);
  const visibleAgendaInstructorIds = liveInstructors
    .filter(
      (instructor) =>
        schedulingAccessByInstructorId[instructor.id]?.canViewAgenda
    )
    .map((instructor) => instructor.id);
  const availableSlotsByInstructorId = await getPublicInstructorAvailabilityMap(
    visibleAgendaInstructorIds,
    12
  );
  const directBookingEnabledByInstructorId = Object.fromEntries(
    Object.entries(schedulingAccessByInstructorId).map(([instructorId, access]) => [
      instructorId,
      access.directBookingAllowed,
    ])
  );
  const trialLessonAvailableByInstructorId = Object.fromEntries(
    Object.entries(schedulingAccessByInstructorId).map(([instructorId, access]) => [
      instructorId,
      access.trialLessonAvailable,
    ])
  );
  const weeklyBookingLimitByInstructorId = Object.fromEntries(
    Object.entries(schedulingAccessByInstructorId).map(([instructorId, access]) => [
      instructorId,
      access.weeklyBookingLimitMinutes,
    ])
  );
  const bookedMinutesByWeekStartByInstructorId = Object.fromEntries(
    Object.entries(schedulingAccessByInstructorId).map(([instructorId, access]) => [
      instructorId,
      access.bookedMinutesByWeekStart,
    ])
  );
  const weeklyRemainingMinutesThisWeekByInstructorId = Object.fromEntries(
    Object.entries(schedulingAccessByInstructorId).map(([instructorId, access]) => [
      instructorId,
      access.weeklyRemainingMinutesThisWeek,
    ])
  );
  const totalVisibleSlots = Object.values(availableSlotsByInstructorId).reduce(
    (total, slots) => total + slots.length,
    0
  );
  const directBookingCount = Object.values(directBookingEnabledByInstructorId).filter(Boolean)
    .length;
  const stats = [
    {
      icon: Search,
      label: "Instructeurs",
      value: `${liveInstructors.length}`,
      detail: "Beschikbaar om te vergelijken.",
    },
    {
      icon: Heart,
      label: "Favorieten",
      value: `${favoriteInstructorIds.length}`,
      detail: "Bewaarde instructeurs in jouw account.",
    },
    {
      icon: CalendarDays,
      label: "Zichtbare agenda",
      value: `${visibleAgendaInstructorIds.length}`,
      detail: `${totalVisibleSlots} vrije blokken zichtbaar.`,
    },
    {
      icon: Zap,
      label: "Direct boeken",
      value: `${directBookingCount}`,
      detail: "Koppelingen waar direct plannen openstaat.",
    },
  ];

  return (
    <div className="space-y-6 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Instructeurs"
        title="Instructeurs zoeken"
        description="Vergelijk instructeurs in een rustigere volgorde: eerst de kern, daarna filters en resultaten."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.45rem] border border-white/10 bg-white/6 p-4 shadow-[0_20px_58px_-42px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-slate-100">
                <item.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
                  {item.label}
                </p>
                <p className="mt-1 truncate text-lg font-semibold text-white">
                  {item.value}
                </p>
                <p className="mt-1 text-[12px] leading-5 text-slate-300">
                  {item.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <InstructorFinder
        instructors={liveInstructors}
        detailBasePath="/instructeurs"
        favoriteInstructorIds={favoriteInstructorIds}
        availableSlotsByInstructorId={availableSlotsByInstructorId}
        directBookingEnabledByInstructorId={directBookingEnabledByInstructorId}
        trialLessonAvailableByInstructorId={trialLessonAvailableByInstructorId}
        weeklyBookingLimitByInstructorId={weeklyBookingLimitByInstructorId}
        bookedMinutesByWeekStartByInstructorId={
          bookedMinutesByWeekStartByInstructorId
        }
        weeklyRemainingMinutesThisWeekByInstructorId={
          weeklyRemainingMinutesThisWeekByInstructorId
        }
      />
    </div>
  );
}
