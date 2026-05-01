import {
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CircleX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LessonCreateDialog } from "@/components/instructor/lesson-create-dialog";
import { LessonsBoard } from "@/components/instructor/lessons-board";
import { getLocationOptions } from "@/lib/data/locations";
import {
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";
import { resolveInstructorLessonDurationDefaults } from "@/lib/lesson-durations";

type LessonStatTone = "amber" | "blue" | "emerald" | "rose";

const statToneClasses: Record<LessonStatTone, string> = {
  amber: "border-amber-400/26 bg-amber-400/12 text-amber-300",
  blue: "border-blue-400/26 bg-blue-500/12 text-blue-300",
  emerald: "border-emerald-400/26 bg-emerald-500/12 text-emerald-300",
  rose: "border-rose-400/28 bg-rose-500/12 text-rose-300",
};

function isCurrentMonth(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function LessonStatCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: LucideIcon;
  label: string;
  tone: LessonStatTone;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(15,23,42,0.34))] p-5 text-white shadow-[0_24px_70px_-52px_rgba(0,0,0,0.95)]">
      <div className="flex items-center gap-5">
        <span
          className={`flex size-16 shrink-0 items-center justify-center rounded-xl border ${statToneClasses[tone]}`}
        >
          <Icon className="size-8" />
        </span>
        <div>
          <p className="text-base text-slate-200">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-3 text-sm text-slate-400">Deze maand</p>
        </div>
      </div>
    </div>
  );
}

export default async function InstructeurLessenPage({
  searchParams,
}: {
  searchParams: Promise<{ zoek?: string }>;
}) {
  const params = await searchParams;
  const [lessons, requests, locationOptions, studentsWorkspace, instructeur] =
    await Promise.all([
      getInstructeurLessons(),
      getInstructeurLessonRequests(),
      getLocationOptions(),
      getInstructeurStudentsWorkspace(),
      getCurrentInstructeurRecord(),
    ]);
  const durationDefaults = resolveInstructorLessonDurationDefaults(instructeur);
  const monthLessons = lessons.filter((lesson) =>
    isCurrentMonth(lesson.start_at),
  );
  const plannedLessons = monthLessons.filter((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status),
  ).length;
  const completedLessons = monthLessons.filter(
    (lesson) => lesson.status === "afgerond",
  ).length;
  const cancelledLessons = monthLessons.filter(
    (lesson) => lesson.status === "geannuleerd",
  ).length;
  const lessonStats = [
    {
      icon: CalendarDays,
      label: "Totaal lessen",
      value: `${monthLessons.length}`,
      tone: "blue",
    },
    {
      icon: CalendarClock,
      label: "Ingepland",
      value: `${plannedLessons}`,
      tone: "amber",
    },
    {
      icon: CalendarCheck2,
      label: "Voltooid",
      value: `${completedLessons}`,
      tone: "emerald",
    },
    {
      icon: CircleX,
      label: "Geannuleerd",
      value: `${cancelledLessons}`,
      tone: "rose",
    },
  ] as const;

  return (
    <div className="space-y-6 text-white">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Lessen
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Beheer en overzicht van al je lessen en ingeplande afspraken.
          </p>
        </div>
        <LessonCreateDialog
          students={studentsWorkspace.students}
          locationOptions={locationOptions}
          durationDefaults={durationDefaults}
        />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {lessonStats.map((item) => (
          <LessonStatCard key={item.label} {...item} />
        ))}
      </div>

      <LessonsBoard
        lessons={lessons}
        requests={requests}
        locationOptions={locationOptions}
        initialQuery={params.zoek ?? ""}
      />
    </div>
  );
}
