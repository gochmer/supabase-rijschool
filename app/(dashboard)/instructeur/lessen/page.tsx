import {
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CircleX,
} from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { LessonsBoard } from "@/components/instructor/lessons-board";
import { getLocationOptions } from "@/lib/data/locations";
import {
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";

export default async function InstructeurLessenPage({
  searchParams,
}: {
  searchParams: Promise<{ zoek?: string }>;
}) {
  const params = await searchParams;
  const [lessons, requests, locationOptions] = await Promise.all([
    getInstructeurLessons(),
    getInstructeurLessonRequests(),
    getLocationOptions(),
  ]);
  const totalLessons = lessons.length;
  const plannedLessons = lessons.filter((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status),
  ).length;
  const completedLessons = lessons.filter(
    (lesson) => lesson.status === "afgerond",
  ).length;
  const cancelledLessons = lessons.filter(
    (lesson) => lesson.status === "geannuleerd",
  ).length;
  const lessonStats = [
    {
      icon: CalendarDays,
      label: "Totaal lessen",
      value: `${totalLessons}`,
      detail: "Deze maand en komende planning.",
      tone: "sky",
    },
    {
      icon: CalendarClock,
      label: "Gepland",
      value: `${plannedLessons}`,
      detail: "Deze maand",
      tone: plannedLessons > 0 ? "amber" : "cyan",
    },
    {
      icon: CalendarCheck2,
      label: "Voltooid",
      value: `${completedLessons}`,
      detail: "Deze maand",
      tone: "emerald",
    },
    {
      icon: CircleX,
      label: "Geannuleerd",
      value: `${cancelledLessons}`,
      detail: "Deze maand",
      tone: "rose",
    },
  ] as const;

  return (
    <>
      <PageHeader
        tone="urban"
        title="Lessen"
        description="Bekijk ingeplande, afgeronde en geannuleerde lessen per leerling."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {lessonStats.map((item) => (
          <DashboardStatCard key={item.label} {...item} />
        ))}
      </div>
      <LessonsBoard
        lessons={lessons}
        requests={requests}
        locationOptions={locationOptions}
        initialQuery={params.zoek ?? ""}
      />
    </>
  );
}
