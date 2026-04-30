import { CalendarCheck2, CalendarClock, CircleAlert, ClipboardList } from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { LessonsBoard } from "@/components/instructor/lessons-board";
import { getLocationOptions } from "@/lib/data/locations";
import {
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";

export default async function InstructeurLessenPage() {
  const [lessons, requests, locationOptions] = await Promise.all([
    getInstructeurLessons(),
    getInstructeurLessonRequests(),
    getLocationOptions(),
  ]);
  const plannedLessons = lessons.filter((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status)
  ).length;
  const completedLessons = lessons.filter(
    (lesson) => lesson.status === "afgerond"
  ).length;
  const openRequests = requests.filter(
    (request) => request.status === "aangevraagd"
  ).length;
  const cancelledLessons = lessons.filter(
    (lesson) => lesson.status === "geannuleerd"
  ).length;
  const lessonStats = [
    {
      icon: CalendarClock,
      label: "Gepland",
      value: `${plannedLessons}`,
      detail: "Lessen die nog in je actieve planning staan.",
      tone: plannedLessons > 0 ? "sky" : "cyan",
    },
    {
      icon: CalendarCheck2,
      label: "Afgerond",
      value: `${completedLessons}`,
      detail: "Ritten die al verwerkt zijn in je leshistorie.",
      tone: "emerald",
    },
    {
      icon: ClipboardList,
      label: "Open aanvragen",
      value: `${openRequests}`,
      detail: "Aanvragen die nog invloed hebben op je planning.",
      tone: openRequests > 0 ? "amber" : "emerald",
    },
    {
      icon: CircleAlert,
      label: "Geannuleerd",
      value: `${cancelledLessons}`,
      detail: "Momenten die extra opvolging kunnen vragen.",
      tone: cancelledLessons > 0 ? "rose" : "violet",
    },
  ] as const;

  return (
    <>
      <PageHeader
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
      />
    </>
  );
}
