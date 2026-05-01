import { CalendarDays, Heart, Search, Zap } from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
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
      tone: "sky",
      detail: "Beschikbaar om te vergelijken.",
    },
    {
      icon: Heart,
      label: "Favorieten",
      value: `${favoriteInstructorIds.length}`,
      tone: "rose",
      detail: "Bewaarde instructeurs in jouw account.",
    },
    {
      icon: CalendarDays,
      label: "Zichtbare agenda",
      value: `${visibleAgendaInstructorIds.length}`,
      tone: "emerald",
      detail: `${totalVisibleSlots} vrije blokken zichtbaar.`,
    },
    {
      icon: Zap,
      label: "Direct boeken",
      value: `${directBookingCount}`,
      tone: "amber",
      detail: "Koppelingen waar direct plannen openstaat.",
    },
  ] as const;

  return (
    <div className="space-y-4 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Instructeurs"
        title="Instructeurs zoeken"
        description="Vergelijk instructeurs in een rustigere volgorde: eerst de kern, daarna filters en resultaten."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <DashboardStatCard key={item.label} {...item} />
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
