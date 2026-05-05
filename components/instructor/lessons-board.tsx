"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  Flag,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  MapPin,
  MoreVertical,
  NotebookPen,
  PieChart,
  Search,
  TimerReset,
  UsersRound,
  XCircle,
} from "lucide-react";

import {
  PlanningWeekView,
  type PlanningWeekAccent,
  type PlanningWeekItem,
} from "@/components/calendar/planning-week-view";
import { LessonAttendanceActions } from "@/components/lessons/lesson-attendance-actions";
import { LessonEditDialog } from "@/components/lessons/lesson-edit-dialog";
import { LessonFocusCard } from "@/components/lessons/lesson-focus-card";
import { LessonNoteEditor } from "@/components/lessons/lesson-note-editor";
import { LessonQuickActions } from "@/components/lessons/lesson-quick-actions";
import { RequestStatusActions } from "@/components/requests/request-status-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/format";
import {
  DEFAULT_LESSON_DURATION_MINUTES,
  type InstructorLessonDurationDefaults,
} from "@/lib/lesson-durations";
import { getRijlesTypeLabel } from "@/lib/lesson-types";
import type {
  BeschikbaarheidSlot,
  InstructorStudentProgressRow,
  Les,
  LesAanvraag,
  LesAanvraagType,
  LocationOption,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const CreateManualLessonDialog = dynamic(() =>
  import("@/components/instructor/create-manual-lesson-dialog").then(
    (module) => module.CreateManualLessonDialog,
  ),
);
const LessonCalendarEditDialog = dynamic(() =>
  import("@/components/instructor/lesson-calendar-edit-dialog").then(
    (module) => module.LessonCalendarEditDialog,
  ),
);
const PlanningRequestDialog = dynamic(() =>
  import("@/components/instructor/planning-request-dialog").then(
    (module) => module.PlanningRequestDialog,
  ),
);
const ScheduleLessonFromSlotDialog = dynamic(() =>
  import("@/components/instructor/schedule-lesson-from-slot-dialog").then(
    (module) => module.ScheduleLessonFromSlotDialog,
  ),
);

type LessonTab = "all" | "planned" | "completed" | "cancelled";
type LessonTypeFilter =
  | "all"
  | "proefles"
  | "losse-les"
  | "pakket"
  | "examenrit";
type LessonPlanningMeta = {
  lesson?: Les;
  request?: LesAanvraag;
  slot?: BeschikbaarheidSlot;
};
type RequestTab = "accepted" | "all" | "pending" | "rejected";
type RequestKindFilter = "all" | LesAanvraagType;
type PlanningSectionId = "agenda" | "requests" | "stats" | "tasks" | "week";
type PlanningNavigationItem =
  | {
      href: string;
      icon: LucideIcon;
      label: string;
      type: "link";
    }
  | {
      icon: LucideIcon;
      label: string;
      section: PlanningSectionId;
      targetId: string;
      type: "section";
    };

const pageSizeOptions = [6, 10, 20] as const;
const lessonTabs: Array<{ label: string; value: LessonTab }> = [
  { label: "Alle lessen", value: "all" },
  { label: "Ingepland", value: "planned" },
  { label: "Voltooid", value: "completed" },
  { label: "Geannuleerd", value: "cancelled" },
];
const lessonTypeFilterOptions = [
  "all",
  "proefles",
  "losse-les",
  "pakket",
  "examenrit",
] as const;
const lessonTypeLabels: Record<LessonTypeFilter, string> = {
  all: "Alle types",
  examenrit: "Examenritten",
  "losse-les": "Losse lessen",
  pakket: "Pakketten",
  proefles: "Proeflessen",
};
const requestTabs: Array<{ label: string; value: RequestTab }> = [
  { label: "Alle aanvragen", value: "all" },
  { label: "In behandeling", value: "pending" },
  { label: "Geaccepteerd", value: "accepted" },
  { label: "Geweigerd", value: "rejected" },
];
const requestKindFilterOptions = [
  "all",
  "proefles",
  "algemeen",
  "pakket",
] as const;
const requestKindLabels: Record<RequestKindFilter, string> = {
  algemeen: "Losse lessen",
  all: "Alle types",
  pakket: "Pakketten",
  proefles: "Proeflessen",
};
const lessonTableWidthClass = "min-w-[950px] 2xl:min-w-[1280px]";
const lessonTableGridClass =
  "grid-cols-[190px_92px_160px_116px_82px_116px_120px_74px] 2xl:grid-cols-[250px_130px_210px_150px_120px_150px_160px_110px]";
const requestTableWidthClass = "min-w-[940px]";
const requestTableGridClass =
  "grid-cols-[230px_104px_180px_130px_90px_128px_118px] 2xl:grid-cols-[260px_140px_220px_150px_110px_170px_150px]";

const avatarTones = [
  "bg-violet-500/28 text-violet-100",
  "bg-fuchsia-500/24 text-fuchsia-100",
  "bg-emerald-500/24 text-emerald-100",
  "bg-cyan-500/24 text-cyan-100",
  "bg-amber-500/24 text-amber-100",
  "bg-rose-500/24 text-rose-100",
];
const busyLessonStatuses = new Set(["geaccepteerd", "ingepland", "afgerond"]);

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Amsterdam",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("nl-NL", {
  timeZone: "Europe/Amsterdam",
  weekday: "long",
});

const compactDayFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Amsterdam",
  weekday: "short",
});

const compactTimeFormatter = new Intl.DateTimeFormat("nl-NL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

function getStartOfWeek(reference: Date) {
  const date = new Date(reference);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(reference: Date, days: number) {
  const date = new Date(reference);
  date.setDate(date.getDate() + days);
  return date;
}

function isSameDay(left: Date | null, right: Date) {
  return Boolean(
    left &&
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate(),
  );
}

function isInDateRange(date: Date | null, start: Date, end: Date) {
  return Boolean(date && date >= start && date < end);
}

function formatCompactDateTime(date: Date | null) {
  return date
    ? `${compactDayFormatter.format(date)} ${compactTimeFormatter.format(date)}`
    : "Nog niet gepland";
}

function formatWeekRange(start: Date, endExclusive: Date) {
  const inclusiveEnd = addDays(endExclusive, -1);

  return `${dateFormatter.format(start)} - ${dateFormatter.format(inclusiveEnd)}`;
}

function formatDurationHours(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) {
    return `${remainingMinutes}m`;
  }

  return remainingMinutes ? `${hours}u ${remainingMinutes}m` : `${hours}u`;
}

function getLessonSortValue(lesson: Les) {
  if (!lesson.start_at) {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsed = new Date(lesson.start_at).getTime();
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function isCancelledLesson(lesson: Les) {
  return lesson.status === "geannuleerd" || lesson.status === "geweigerd";
}

function getLessonDate(lesson: Les) {
  if (!lesson.start_at) {
    return null;
  }

  const date = new Date(lesson.start_at);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getLessonEndDate(lesson: Les) {
  if (lesson.end_at) {
    const date = new Date(lesson.end_at);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const startDate = getLessonDate(lesson);
  return startDate
    ? new Date(startDate.getTime() + lesson.duur_minuten * 60_000)
    : null;
}

function formatLessonDate(lesson: Les) {
  const date = getLessonDate(lesson);
  return date ? dateFormatter.format(date) : lesson.datum;
}

function formatLessonWeekday(lesson: Les) {
  const date = getLessonDate(lesson);
  return date ? weekdayFormatter.format(date) : "";
}

function getLessonStatusGroup(status: string): Exclude<LessonTab, "all"> {
  if (status === "afgerond") {
    return "completed";
  }

  if (status === "geannuleerd" || status === "geweigerd") {
    return "cancelled";
  }

  return "planned";
}

function matchesTab(lesson: Les, tab: LessonTab) {
  return tab === "all" || getLessonStatusGroup(lesson.status) === tab;
}

function getStatusPill(status: string) {
  if (status === "afgerond") {
    return {
      className: "border-emerald-400/25 bg-emerald-500/14 text-emerald-300",
      icon: CheckCircle2,
      label: "Voltooid",
    };
  }

  if (status === "geannuleerd" || status === "geweigerd") {
    return {
      className: "border-red-400/28 bg-red-500/12 text-red-300",
      icon: XCircle,
      label: status === "geweigerd" ? "Geweigerd" : "Geannuleerd",
    };
  }

  return {
    className: "border-amber-400/35 bg-amber-400/12 text-amber-300",
    icon: Clock3,
    label: "Ingepland",
  };
}

function getLessonType(lesson: Les): {
  label: string;
  value: LessonTypeFilter;
} {
  const title = lesson.titel.toLowerCase();

  if (title.includes("proef")) {
    return { label: "Proefles", value: "proefles" };
  }

  if (title.includes("pakket")) {
    return { label: "Pakket", value: "pakket" };
  }

  if (title.includes("examen")) {
    return { label: "Examenrit", value: "examenrit" };
  }

  return { label: "Losse les", value: "losse-les" };
}

function getLessonAccent(lesson: Les): PlanningWeekAccent {
  if (lesson.status === "geannuleerd" || lesson.status === "geweigerd") {
    return "rose";
  }

  if (lesson.status === "afgerond") {
    return "emerald";
  }

  const lessonType = getLessonType(lesson);

  if (lessonType.value === "proefles") {
    return "violet";
  }

  if (lessonType.value === "pakket") {
    return "cyan";
  }

  if (lessonType.value === "examenrit") {
    return "amber";
  }

  return "sky";
}

function getLessonAccentClass(accent: PlanningWeekAccent) {
  const classes: Record<PlanningWeekAccent, string> = {
    amber: "bg-amber-400",
    cyan: "bg-cyan-400",
    emerald: "bg-emerald-400",
    rose: "bg-rose-400",
    sky: "bg-sky-400",
    slate: "bg-slate-400",
    violet: "bg-violet-400",
  };

  return classes[accent];
}

function getRequestTypeLabel(request: LesAanvraag) {
  if (request.aanvraag_type === "proefles") {
    return "Proefles";
  }

  if (request.aanvraag_type === "pakket") {
    return request.pakket_naam ?? "Pakket";
  }

  return request.pakket_naam ?? "Aanvraag";
}

function getRequestDate(request: LesAanvraag) {
  if (!request.start_at) {
    return null;
  }

  const date = new Date(request.start_at);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getSlotDate(slot: BeschikbaarheidSlot) {
  if (!slot.start_at) {
    return null;
  }

  const date = new Date(slot.start_at);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getRequestKindLabel(request: LesAanvraag) {
  if (request.aanvraag_type === "proefles") {
    return "Proefles";
  }

  if (request.aanvraag_type === "pakket") {
    return "Pakket";
  }

  return "Losse les";
}

function getRequestLessonTitle(request: LesAanvraag) {
  if (request.pakket_naam?.trim()) {
    return request.pakket_naam;
  }

  const lessonTypeLabel = request.les_type
    ? getRijlesTypeLabel(request.les_type)
    : "Auto";

  if (request.aanvraag_type === "proefles") {
    return `${lessonTypeLabel}rijles`;
  }

  return request.aanvraag_type === "pakket"
    ? `${lessonTypeLabel} pakket`
    : `${lessonTypeLabel}rijles 60 minuten`;
}

function formatRequestTableDate(value: string) {
  return value
    .replace(" januari ", " jan. ")
    .replace(" februari ", " feb. ")
    .replace(" maart ", " mrt. ")
    .replace(" april ", " apr. ")
    .replace(" mei ", " mei ")
    .replace(" juni ", " jun. ")
    .replace(" juli ", " jul. ")
    .replace(" augustus ", " aug. ")
    .replace(" september ", " sep. ")
    .replace(" oktober ", " okt. ")
    .replace(" november ", " nov. ")
    .replace(" december ", " dec. ");
}

function getRequestTableTime(request: LesAanvraag) {
  const match = request.tijdvak.match(/\d{1,2}:\d{2}/);
  return match?.[0] ?? request.tijdvak;
}

function matchesRequestTab(request: LesAanvraag, tab: RequestTab) {
  if (tab === "pending") {
    return request.status === "aangevraagd";
  }

  if (tab === "accepted") {
    return ["geaccepteerd", "ingepland", "afgerond"].includes(request.status);
  }

  if (tab === "rejected") {
    return ["geweigerd", "geannuleerd"].includes(request.status);
  }

  return true;
}

function getRequestStatusPill(request: LesAanvraag) {
  if (request.status === "aangevraagd") {
    return {
      className: "border-amber-400/35 bg-amber-400/12 text-amber-300",
      label: "In behandeling",
    };
  }

  if (["geaccepteerd", "ingepland", "afgerond"].includes(request.status)) {
    return {
      className: "border-emerald-400/25 bg-emerald-400/12 text-emerald-300",
      label: "Geaccepteerd",
    };
  }

  return {
    className: "border-rose-400/28 bg-rose-400/12 text-rose-300",
    label: "Geweigerd",
  };
}

function LessonDetailsDialog({
  lesson,
  locationOptions,
}: {
  lesson: Les;
  locationOptions: LocationOption[];
}) {
  const statusPill = getStatusPill(lesson.status);
  const StatusIcon = statusPill.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          aria-label={`Bekijk les van ${lesson.leerling_naam}`}
          title="Bekijken"
          size="icon-sm"
          variant="outline"
          className="size-8 rounded-lg border-white/10 bg-white/7 text-slate-200 hover:bg-white/12 hover:text-white 2xl:size-9"
        >
          <Eye className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>{lesson.leerling_naam}</DialogTitle>
          <DialogDescription>
            {getLessonType(lesson).label} - {lesson.titel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Datum", formatLessonDate(lesson)],
              ["Tijd", lesson.tijd],
              ["Duur", `${lesson.duur_minuten} min`],
              ["Locatie", lesson.locatie],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/6 p-3"
              >
                <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/6 p-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold",
                statusPill.className,
              )}
            >
              <StatusIcon className="size-4" />
              {statusPill.label}
            </span>
            <LessonQuickActions lesson={lesson} tone="urban" />
          </div>

          <LessonFocusCard
            lesson={lesson}
            title="Lesoverzicht"
            description="Controleer de lesgegevens en werk direct aanwezigheid, notities of planning bij."
            tone="urban"
          />

          <div className="grid gap-3 xl:grid-cols-2">
            <LessonAttendanceActions lesson={lesson} tone="urban" />
            <LessonNoteEditor lesson={lesson} tone="urban" />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4">
            <Button
              asChild
              variant="outline"
              className="rounded-lg border-white/10 bg-white/7 text-white hover:bg-white/12"
            >
              <Link
                href={
                  lesson.leerling_id
                    ? `/instructeur/leerlingen?student=${encodeURIComponent(
                        lesson.leerling_id,
                      )}`
                    : "/instructeur/leerlingen"
                }
              >
                Leerling openen
              </Link>
            </Button>
            <LessonEditDialog
              lesson={lesson}
              locationOptions={locationOptions}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LessonScopeBadge() {
  return (
    <span className="mt-1 inline-flex w-fit items-center rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold text-sky-100 2xl:text-xs">
      Buiten deze week
    </span>
  );
}

function LessonMoreMenu({ lesson }: { lesson: Les }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Meer acties voor ${lesson.leerling_naam}`}
          title="Meer"
          size="icon-sm"
          variant="outline"
          className="size-8 rounded-lg border-white/10 bg-white/7 text-slate-200 hover:bg-white/12 hover:text-white 2xl:size-9"
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-white/10 bg-slate-950 text-slate-100"
      >
        <DropdownMenuLabel>Vervolgactie</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link
            href={
              lesson.leerling_id
                ? `/instructeur/leerlingen?student=${encodeURIComponent(
                    lesson.leerling_id,
                  )}`
                : "/instructeur/leerlingen"
            }
          >
            Leerling openen
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/instructeur/berichten">Berichten openen</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/instructeur/aanvragen">Aanvragen bekijken</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LessonRow({
  isOutsideVisibleWeek,
  index,
  lesson,
  locationOptions,
}: {
  isOutsideVisibleWeek: boolean;
  index: number;
  lesson: Les;
  locationOptions: LocationOption[];
}) {
  const statusPill = getStatusPill(lesson.status);
  const lessonType = getLessonType(lesson);
  const StatusIcon = statusPill.icon;

  return (
    <div
      className={cn(
        "grid items-center border-b border-white/10 px-2 py-3 text-xs last:border-b-0 2xl:py-4 2xl:text-sm",
        lessonTableWidthClass,
        lessonTableGridClass,
      )}
    >
      <div className="flex min-w-0 items-center gap-2 2xl:gap-3">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold 2xl:size-10 2xl:text-sm",
            avatarTones[index % avatarTones.length],
          )}
        >
          {getInitials(lesson.leerling_naam || "LL")}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-white">
            {lesson.leerling_naam}
          </p>
          <p className="truncate text-[11px] text-slate-400 2xl:text-sm">
            {lesson.leerling_email || "Geen e-mail bekend"}
          </p>
        </div>
      </div>

      <p className="text-slate-100">{lessonType.label}</p>
      <p className="truncate text-slate-100">{lesson.titel}</p>
      <div>
        <p className="text-slate-100">{formatLessonDate(lesson)}</p>
        <p className="mt-0.5 capitalize text-slate-400 2xl:mt-1">
          {formatLessonWeekday(lesson)}
        </p>
        {isOutsideVisibleWeek ? <LessonScopeBadge /> : null}
      </div>
      <div>
        <p className="text-slate-100">{lesson.tijd}</p>
        <p className="mt-0.5 text-slate-400 2xl:mt-1">{lesson.duur_minuten} min</p>
      </div>
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium 2xl:gap-2 2xl:px-3 2xl:py-1 2xl:text-sm",
          statusPill.className,
        )}
      >
        <StatusIcon className="size-3.5 2xl:size-4" />
        {statusPill.label}
      </span>
      <div className="flex min-w-0 items-center gap-1.5 text-slate-100 2xl:gap-2">
        <MapPin className="size-3.5 shrink-0 text-slate-400 2xl:size-4" />
        <span className="truncate">{lesson.locatie}</span>
      </div>
      <div className="flex items-center gap-1.5 2xl:gap-2">
        <LessonDetailsDialog
          lesson={lesson}
          locationOptions={locationOptions}
        />
        <LessonMoreMenu lesson={lesson} />
      </div>
    </div>
  );
}

function LessonEmptyState() {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-white/12 text-center 2xl:min-h-64">
      <Archive className="size-8 text-slate-500 2xl:size-10" />
      <p className="mt-3 font-semibold text-white 2xl:mt-4">
        Geen lessen gevonden
      </p>
      <p className="mt-2 max-w-md text-xs leading-5 text-slate-400 2xl:text-sm 2xl:leading-6">
        Pas je zoekterm of filter aan, of plan een nieuwe les voor een gekoppelde
        leerling.
      </p>
    </div>
  );
}

function LessonCompactCard({
  isOutsideVisibleWeek,
  index,
  lesson,
  locationOptions,
}: {
  isOutsideVisibleWeek: boolean;
  index: number;
  lesson: Les;
  locationOptions: LocationOption[];
}) {
  const statusPill = getStatusPill(lesson.status);
  const lessonType = getLessonType(lesson);
  const StatusIcon = statusPill.icon;

  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              avatarTones[index % avatarTones.length],
            )}
          >
            {getInitials(lesson.leerling_naam || "LL")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {lesson.leerling_naam || "Leerling"}
            </p>
            <p className="truncate text-[11px] text-slate-400">
              {lesson.leerling_email || "Geen e-mail bekend"}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            statusPill.className,
          )}
        >
          <StatusIcon className="size-3.5" />
          {statusPill.label}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-slate-950/24 px-2.5 py-2">
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase">
            Les
          </p>
          <p className="mt-1 truncate text-sm font-medium text-white">
            {lesson.titel}
          </p>
          <p className="mt-0.5 text-slate-400">{lessonType.label}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/24 px-2.5 py-2">
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase">
            Datum en tijd
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {formatLessonDate(lesson)} om {lesson.tijd}
          </p>
          <p className="mt-0.5 capitalize text-slate-400">
            {formatLessonWeekday(lesson)} - {lesson.duur_minuten} min
          </p>
          {isOutsideVisibleWeek ? <LessonScopeBadge /> : null}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-300">
          <MapPin className="size-3.5 shrink-0 text-slate-500" />
          <span className="truncate">{lesson.locatie}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <LessonDetailsDialog
            lesson={lesson}
            locationOptions={locationOptions}
          />
          <LessonMoreMenu lesson={lesson} />
        </div>
      </div>
    </article>
  );
}

function getPaginationPages(currentPage: number, totalPages: number) {
  const candidates = [
    1,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    totalPages,
  ];
  return Array.from(
    new Set(candidates.filter((page) => page >= 1 && page <= totalPages)),
  ).sort((left, right) => left - right);
}

function PlanningOsPanel({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      tabIndex={id ? -1 : undefined}
      className={cn(
        "scroll-mt-24 outline-none",
        "rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(15,23,42,0.35))] shadow-[0_28px_90px_-58px_rgba(0,0,0,0.95)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function PanelTitle({
  action,
  title,
}: {
  action?: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-white 2xl:text-base">
        {title}
      </h2>
      {action}
    </div>
  );
}

function getStudentProgressPercent(student: InstructorStudentProgressRow) {
  return Math.min(100, Math.max(0, Math.round(student.voortgang)));
}

function getStudentProgressTone(progress: number) {
  if (progress >= 70) {
    return "bg-emerald-400";
  }

  if (progress >= 40) {
    return "bg-amber-400";
  }

  return "bg-rose-400";
}

function StudentProgressOverview({
  averageProgress,
  className,
  id,
  students,
  variant = "full",
}: {
  averageProgress: number;
  className?: string;
  id?: string;
  students: InstructorStudentProgressRow[];
  variant?: "compact" | "full";
}) {
  const isCompact = variant === "compact";

  if (isCompact) {
    return (
      <PlanningOsPanel id={id} className={cn("p-4", className)}>
        <PanelTitle
          title="Leerling voortgang"
          action={
            <span className="rounded-full bg-violet-400/16 px-2 py-1 text-xs font-semibold text-violet-100">
              {averageProgress}%
            </span>
          }
        />
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Leerlingen met de meeste aandacht staan bovenaan.
        </p>
        <div className="mt-4 space-y-3">
          {students.length ? (
            students.map((student) => {
              const progress = getStudentProgressPercent(student);
              const progressTone = getStudentProgressTone(progress);

              return (
                <Link
                  key={student.id}
                  href={`/instructeur/leerlingen?student=${encodeURIComponent(
                    student.id,
                  )}`}
                  className="block rounded-lg border border-white/10 bg-white/5 p-3 transition hover:border-violet-300/25 hover:bg-violet-400/8"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-400/16 text-xs font-semibold text-violet-100">
                      {getInitials(student.naam)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {student.naam}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {student.pakket}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {progress}%
                        </span>
                      </div>

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={cn("h-full rounded-full", progressTone)}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="mt-3 grid gap-1.5 text-xs text-slate-400">
                        <p className="truncate">
                          Volgende les: {student.volgendeLes}
                        </p>
                        <p>
                          {student.voltooideLessen ?? 0} van{" "}
                          {student.gekoppeldeLessen} lessen afgerond
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="rounded-lg border border-dashed border-white/10 bg-white/5 p-3 text-sm text-slate-400">
              Nog geen gekoppelde leerlingen om voortgang te tonen.
            </p>
          )}
        </div>
      </PlanningOsPanel>
    );
  }

  return (
    <PlanningOsPanel id={id} className={cn("overflow-hidden p-4 2xl:p-5", className)}>
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
            Taken
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Leerling voortgang
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
            Bekijk per leerling hoeveel lessen zijn afgerond, wat nog openstaat
            en welke leerling als eerste aandacht nodig heeft.
          </p>
        </div>
        <div className="grid min-w-40 grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-violet-300/20 bg-violet-400/10 p-4">
          <span className="flex size-11 items-center justify-center rounded-xl bg-violet-400/18 text-violet-100">
            <ListChecks className="size-5" />
          </span>
          <div>
            <p className="text-2xl font-semibold text-white">
              {averageProgress}%
            </p>
            <p className="text-xs text-slate-400">Gemiddelde voortgang</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {students.length ? (
          students.map((student) => {
            const progress = getStudentProgressPercent(student);
            const progressTone = getStudentProgressTone(progress);
            const completedLessons = student.voltooideLessen ?? 0;
            const remainingLessons = Math.max(
              0,
              student.gekoppeldeLessen - completedLessons,
            );

            return (
              <Link
                key={student.id}
                href={`/instructeur/leerlingen?student=${encodeURIComponent(
                  student.id,
                )}`}
                className="group rounded-xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-violet-300/30 hover:bg-violet-400/8"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-400/16 text-sm font-semibold text-violet-100">
                    {getInitials(student.naam)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-white">
                          {student.naam}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-slate-400">
                          {student.pakket}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/8 px-2 py-1 text-sm font-semibold text-white">
                        {progress}%
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={cn("h-full rounded-full", progressTone)}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
                      <div className="rounded-lg border border-white/10 bg-slate-950/24 p-2.5">
                        <p className="font-semibold text-slate-300">Voltooid</p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {completedLessons} / {student.gekoppeldeLessen}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-slate-950/24 p-2.5">
                        <p className="font-semibold text-slate-300">Nog open</p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {remainingLessons}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-slate-950/24 p-2.5">
                        <p className="font-semibold text-slate-300">Status</p>
                        <p className="mt-1 truncate text-sm font-semibold text-white">
                          {student.aanvraagStatus}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-slate-300">
                      <p className="truncate">
                        Volgende les:{" "}
                        <span className="font-semibold text-white">
                          {student.volgendeLes}
                        </span>
                      </p>
                      <p className="truncate">
                        Laatste beoordeling:{" "}
                        <span className="font-semibold text-white">
                          {student.laatsteBeoordeling || "Nog niet beoordeeld"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <p className="rounded-lg border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400 md:col-span-2">
            Nog geen gekoppelde leerlingen om voortgang te tonen.
          </p>
        )}
      </div>
    </PlanningOsPanel>
  );
}

function WeekScopeCallout({
  nextLesson,
  onGoToNextLessonWeek,
  onOpenAgenda,
  outsideWeekLessonCount,
  showGoToNextLessonWeek,
  weekLessonCount,
  weekRangeLabel,
}: {
  nextLesson: Les | null;
  onGoToNextLessonWeek?: () => void;
  onOpenAgenda: () => void;
  outsideWeekLessonCount: number;
  showGoToNextLessonWeek?: boolean;
  weekLessonCount: number;
  weekRangeLabel: string;
}) {
  const nextLessonDate = nextLesson ? getLessonDate(nextLesson) : null;

  return (
    <div className="mb-4 grid gap-3 rounded-xl border border-sky-300/16 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(124,58,237,0.08),rgba(255,255,255,0.03))] p-3 text-sm text-sky-100 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center 2xl:p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-400/12 text-sky-100">
          <Eye className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-white">
            Je bekijkt: {weekRangeLabel}
          </p>
          <p className="mt-1 leading-6 text-sky-100/78">
            {weekLessonCount
              ? `${weekLessonCount} les${weekLessonCount === 1 ? "" : "sen"} zichtbaar in deze week.`
              : "Geen lessen in deze week."}{" "}
            {outsideWeekLessonCount
              ? `${outsideWeekLessonCount} les${outsideWeekLessonCount === 1 ? "" : "sen"} vallen buiten deze week.`
              : "Alle geladen lessen vallen binnen deze week."}
          </p>
          {nextLesson ? (
            <p className="mt-2 text-xs font-semibold text-sky-100">
              Volgende les: {nextLesson.leerling_naam || "Leerling"} op{" "}
              {formatCompactDateTime(nextLessonDate)}.
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col 2xl:flex-row">
        {showGoToNextLessonWeek ? (
          <Button
            type="button"
            className="h-10 rounded-lg bg-sky-300 px-3 text-slate-950 hover:bg-sky-200"
            onClick={onGoToNextLessonWeek}
          >
            <CalendarRange className="size-4" />
            Ga naar week van volgende les
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-lg border-sky-200/20 bg-white/8 px-3 text-white hover:bg-white/12"
          onClick={onOpenAgenda}
        >
          <ListChecks className="size-4" />
          Bekijk volledige planning
        </Button>
      </div>
    </div>
  );
}

function LessonListPanel({
  activeTab,
  firstItemIndex,
  locationOptions,
  pageSize,
  paginationPages,
  query,
  safePage,
  setActiveTab,
  setCurrentPage,
  setPageSize,
  setQuery,
  setTypeFilter,
  sortedLessons,
  totalPages,
  typeFilter,
  visibleWeekEnd,
  visibleWeekStart,
  visibleLessons,
}: {
  activeTab: LessonTab;
  firstItemIndex: number;
  locationOptions: LocationOption[];
  pageSize: number;
  paginationPages: number[];
  query: string;
  safePage: number;
  setActiveTab: Dispatch<SetStateAction<LessonTab>>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  setPageSize: Dispatch<SetStateAction<number>>;
  setQuery: Dispatch<SetStateAction<string>>;
  setTypeFilter: Dispatch<SetStateAction<LessonTypeFilter>>;
  sortedLessons: Les[];
  totalPages: number;
  typeFilter: LessonTypeFilter;
  visibleWeekEnd: Date;
  visibleWeekStart: Date;
  visibleLessons: Les[];
}) {
  const outsideVisibleWeekCount = sortedLessons.filter((lesson) =>
    !isInDateRange(getLessonDate(lesson), visibleWeekStart, visibleWeekEnd)
  ).length;

  return (
    <PlanningOsPanel
      id="agenda-overzicht"
      className="overflow-hidden p-3 transition 2xl:p-5"
    >
      <div className="mb-3 2xl:mb-4">
        <h2 className="text-lg font-semibold text-white 2xl:text-xl">
          Lessenlijst
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Zoek, filter en open details van geplande en afgeronde lessen.
        </p>
      </div>
      <div className="mb-4 rounded-lg border border-sky-300/16 bg-sky-400/8 p-3 text-sm leading-6 text-sky-100">
        <p className="font-semibold">Volledige planning</p>
        <p className="mt-1 text-sky-100/78">
          Deze lijst toont alle geladen lessen die bij je filters passen. De
          weekplanning is alleen een visuele weekfilter.
        </p>
        {outsideVisibleWeekCount ? (
          <p className="mt-2 text-xs font-semibold text-sky-100/90">
            {outsideVisibleWeekCount} les
            {outsideVisibleWeekCount === 1 ? "" : "sen"} vallen buiten de
            huidige week en krijgen hieronder een badge.
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between 2xl:gap-4">
        <div className="flex flex-wrap gap-3 2xl:gap-5">
          {lessonTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTab(tab.value);
                setCurrentPage(1);
              }}
              className={cn(
                "border-b-2 px-1.5 pb-2 text-sm transition 2xl:px-2 2xl:pb-3 2xl:text-base",
                activeTab === tab.value
                  ? "border-blue-400 text-white"
                  : "border-transparent text-slate-400 hover:text-white",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center 2xl:gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400 2xl:size-5" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Zoek lessen..."
              aria-label="Zoek lessen"
              className="h-9 w-full rounded-lg border-white/10 bg-slate-950/34 pl-9 text-sm text-white placeholder:text-slate-500 sm:w-64 2xl:h-11 2xl:w-72 2xl:pl-10 2xl:text-base"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-white/10 bg-white/7 px-3 text-sm text-white hover:bg-white/12 2xl:h-11 2xl:px-4 2xl:text-base"
              >
                <Filter className="size-4 2xl:size-5" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-60 border-white/10 bg-slate-950 text-slate-100"
            >
              <DropdownMenuLabel>Type les</DropdownMenuLabel>
              {lessonTypeFilterOptions.map((value) => (
                <DropdownMenuItem
                  key={value}
                  onSelect={() => {
                    setTypeFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      typeFilter === value ? "bg-blue-400" : "bg-white/20",
                    )}
                  />
                  {lessonTypeLabels[value]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  setActiveTab("all");
                  setQuery("");
                  setTypeFilter("all");
                  setCurrentPage(1);
                }}
              >
                Filters wissen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 lg:grid-cols-2 2xl:hidden">
        {visibleLessons.length ? (
          visibleLessons.map((lesson, index) => (
            <LessonCompactCard
              key={lesson.id}
              lesson={lesson}
              isOutsideVisibleWeek={
                !isInDateRange(
                  getLessonDate(lesson),
                  visibleWeekStart,
                  visibleWeekEnd,
                )
              }
              index={firstItemIndex + index}
              locationOptions={locationOptions}
            />
          ))
        ) : (
          <div className="lg:col-span-2">
            <LessonEmptyState />
          </div>
        )}
      </div>

      <div className="mt-5 hidden overflow-x-auto 2xl:block">
        <div className={lessonTableWidthClass}>
          <div
            className={cn(
              "grid rounded-lg border border-white/10 bg-white/5 px-2 py-2.5 text-xs font-semibold text-slate-200 2xl:py-4 2xl:text-base",
              lessonTableGridClass,
            )}
          >
            <span>Leerling</span>
            <span>Type</span>
            <span>Les / Pakket</span>
            <span>Datum</span>
            <span>Tijd</span>
            <span>Status</span>
            <span>Locatie</span>
            <span>Acties</span>
          </div>

          {visibleLessons.length ? (
            visibleLessons.map((lesson, index) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                isOutsideVisibleWeek={
                  !isInDateRange(
                    getLessonDate(lesson),
                    visibleWeekStart,
                    visibleWeekEnd,
                  )
                }
                index={firstItemIndex + index}
                locationOptions={locationOptions}
              />
            ))
          ) : (
            <LessonEmptyState />
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 border-t border-white/10 pt-3 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between 2xl:mt-5 2xl:gap-4 2xl:pt-5">
        <p>
          {sortedLessons.length
            ? `${firstItemIndex + 1}-${Math.min(
                firstItemIndex + pageSize,
                sortedLessons.length,
              )} van ${sortedLessons.length} lessen`
            : "0 van 0 lessen"}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              aria-label="Vorige pagina"
              size="icon-sm"
              variant="outline"
              disabled={safePage <= 1}
              className="size-8 rounded-lg border-white/10 bg-white/7 text-white disabled:opacity-40 2xl:size-9"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {paginationPages.map((page, index) => {
              const previousPage = paginationPages[index - 1];
              const hasGap = previousPage && page - previousPage > 1;

              return (
                <span key={page} className="inline-flex items-center gap-2">
                  {hasGap ? (
                    <span className="px-1 text-slate-500">...</span>
                  ) : null}
                  <Button
                    size="icon-sm"
                    variant={safePage === page ? "default" : "outline"}
                    className={cn(
                      "size-8 rounded-lg 2xl:size-9",
                      safePage === page
                        ? "bg-blue-600 text-white hover:bg-blue-500"
                        : "border-white/10 bg-white/7 text-slate-200",
                    )}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                </span>
              );
            })}

            <Button
              aria-label="Volgende pagina"
              size="icon-sm"
              variant="outline"
              disabled={safePage >= totalPages}
              className="size-8 rounded-lg border-white/10 bg-white/7 text-white disabled:opacity-40 2xl:size-9"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <label className="flex items-center gap-2 2xl:gap-3">
            Toon
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
              className="h-9 rounded-lg border border-white/10 bg-slate-950/34 px-3 text-white outline-none 2xl:h-10"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </PlanningOsPanel>
  );
}

function RequestMoreMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Meer aanvraagacties"
          title="Meer"
          size="icon-sm"
          variant="outline"
          className="size-8 rounded-lg border-white/10 bg-white/7 text-slate-200 hover:bg-white/12 hover:text-white 2xl:size-9"
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-white/10 bg-slate-950 text-slate-100"
      >
        <DropdownMenuLabel>Vervolgactie</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/instructeur/berichten">Berichten openen</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/instructeur/lessen">Lessen bekijken</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/instructeur/leerlingen">Leerlingen openen</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RequestRow({
  index,
  locationOptions,
  onSelectRequest,
  request,
}: {
  index: number;
  locationOptions: LocationOption[];
  onSelectRequest: (request: LesAanvraag) => void;
  request: LesAanvraag;
}) {
  const statusPill = getRequestStatusPill(request);

  return (
    <div
      id={`aanvraag-${request.id}`}
      className={cn(
        "grid items-center border-b border-white/10 px-2 py-3 text-xs last:border-b-0 2xl:py-4 2xl:text-sm",
        requestTableWidthClass,
        requestTableGridClass,
      )}
    >
      <div className="flex min-w-0 items-center gap-2 2xl:gap-3">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold 2xl:size-10 2xl:text-sm",
            avatarTones[index % avatarTones.length],
          )}
        >
          {getInitials(request.leerling_naam || "AA")}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-white">
            {request.leerling_naam}
          </p>
          <p className="truncate text-[11px] text-slate-400 2xl:text-sm">
            {request.leerling_email || "Geen e-mail bekend"}
          </p>
        </div>
      </div>
      <p className="truncate text-slate-100">{getRequestKindLabel(request)}</p>
      <p className="truncate text-slate-100">{getRequestLessonTitle(request)}</p>
      <div className="flex min-w-0 items-center gap-1.5 text-slate-100 2xl:gap-2">
        <CalendarDays className="size-3.5 shrink-0 text-slate-300 2xl:size-4" />
        <span className="truncate">
          {formatRequestTableDate(request.voorkeursdatum)}
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-1.5 text-slate-100 2xl:gap-2">
        <Clock3 className="size-3.5 shrink-0 text-slate-300 2xl:size-4" />
        <span className="truncate">{getRequestTableTime(request)}</span>
      </div>
      <span
        className={cn(
          "w-fit rounded-full border px-2 py-0.5 text-xs font-medium 2xl:px-3 2xl:py-1 2xl:text-sm",
          statusPill.className,
        )}
      >
        {statusPill.label}
      </span>
      <div className="flex items-center gap-1.5 2xl:gap-2">
        <Button
          aria-label={`Bekijk aanvraag van ${request.leerling_naam}`}
          title="Bekijken"
          size="icon-sm"
          variant="outline"
          className="size-8 rounded-lg border-white/10 bg-white/7 text-slate-200 hover:bg-white/12 hover:text-white 2xl:size-9"
          onClick={() => onSelectRequest(request)}
        >
          <Eye className="size-4" />
        </Button>
        {request.status === "aangevraagd" ? (
          <RequestStatusActions
            requestId={request.id}
            status={request.status}
            locationOptions={locationOptions}
            display="icons"
          />
        ) : (
          <RequestMoreMenu />
        )}
      </div>
    </div>
  );
}

function RequestListPanel({
  locationOptions,
  onSelectRequest,
  requests,
}: {
  locationOptions: LocationOption[];
  onSelectRequest: (request: LesAanvraag) => void;
  requests: LesAanvraag[];
}) {
  const [activeTab, setActiveTab] = useState<RequestTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [kindFilter, setKindFilter] = useState<RequestKindFilter>("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          request.leerling_naam,
          request.leerling_email ?? "",
          getRequestKindLabel(request),
          getRequestLessonTitle(request),
          request.voorkeursdatum,
          request.tijdvak,
          getRequestStatusPill(request).label,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesKind =
        kindFilter === "all" || request.aanvraag_type === kindFilter;

      return matchesSearch && matchesKind && matchesRequestTab(request, activeTab);
    });
  }, [activeTab, kindFilter, requests, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const firstItemIndex = filteredRequests.length
    ? (safePage - 1) * pageSize
    : 0;
  const visibleRequests = filteredRequests.slice(
    firstItemIndex,
    firstItemIndex + pageSize,
  );
  const paginationPages = getPaginationPages(safePage, totalPages);

  return (
    <PlanningOsPanel
      id="aanvragen-overzicht"
      className="overflow-hidden p-3 transition 2xl:p-5"
    >
      <div className="mb-3 2xl:mb-4">
        <h2 className="text-lg font-semibold text-white 2xl:text-xl">
          Aanvragenlijst
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Nieuwe aanvragen staan bovenaan je werkvoorraad; accepteer of wijs ze
          direct af.
        </p>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between 2xl:gap-4">
        <div className="flex flex-wrap gap-3 2xl:gap-5">
          {requestTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTab(tab.value);
                setCurrentPage(1);
              }}
              className={cn(
                "border-b-2 px-1.5 pb-2 text-sm transition 2xl:px-2 2xl:pb-3 2xl:text-base",
                activeTab === tab.value
                  ? "border-blue-400 text-white"
                  : "border-transparent text-slate-400 hover:text-white",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center 2xl:gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400 2xl:size-5" />
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Zoek aanvragen..."
              aria-label="Zoek aanvragen"
              className="h-9 w-full rounded-lg border-white/10 bg-slate-950/34 pl-9 text-sm text-white placeholder:text-slate-500 sm:w-64 2xl:h-11 2xl:w-72 2xl:pl-10 2xl:text-base"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-white/10 bg-white/7 px-3 text-sm text-white hover:bg-white/12 2xl:h-11 2xl:px-4 2xl:text-base"
              >
                <Filter className="size-4 2xl:size-5" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-white/10 bg-slate-950 text-slate-100"
            >
              <DropdownMenuLabel>Type aanvraag</DropdownMenuLabel>
              {requestKindFilterOptions.map((value) => (
                <DropdownMenuItem
                  key={value}
                  onSelect={() => {
                    setKindFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      kindFilter === value ? "bg-blue-400" : "bg-white/20",
                    )}
                  />
                  {requestKindLabels[value]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  setSearchTerm("");
                  setKindFilter("all");
                  setActiveTab("all");
                  setCurrentPage(1);
                }}
              >
                Filters wissen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className={requestTableWidthClass}>
          <div
            className={cn(
              "grid rounded-lg border border-white/10 bg-white/5 px-2 py-2.5 text-xs font-semibold text-slate-200 2xl:py-4 2xl:text-base",
              requestTableGridClass,
            )}
          >
            <span>Aanvrager</span>
            <span>Type</span>
            <span>Les / Pakket</span>
            <span>Datum</span>
            <span>Tijd</span>
            <span>Status</span>
            <span>Acties</span>
          </div>

          {visibleRequests.length ? (
            visibleRequests.map((request, index) => (
              <RequestRow
                key={request.id}
                request={request}
                index={firstItemIndex + index}
                locationOptions={locationOptions}
                onSelectRequest={onSelectRequest}
              />
            ))
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-white/12 text-center 2xl:min-h-64">
              <Archive className="size-8 text-slate-500 2xl:size-10" />
              <p className="mt-3 font-semibold text-white 2xl:mt-4">
                Geen aanvragen gevonden
              </p>
              <p className="mt-2 max-w-md text-xs leading-5 text-slate-400 2xl:text-sm 2xl:leading-6">
                Pas je zoekterm of filter aan, of open je profiel om nieuwe
                aanvragen te ontvangen.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 border-t border-white/10 pt-3 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between 2xl:mt-5 2xl:gap-4 2xl:pt-5">
        <p>
          {filteredRequests.length
            ? `${firstItemIndex + 1}-${Math.min(
                firstItemIndex + pageSize,
                filteredRequests.length,
              )} van ${filteredRequests.length} aanvragen`
            : "0 van 0 aanvragen"}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              aria-label="Vorige pagina"
              size="icon-sm"
              variant="outline"
              disabled={safePage <= 1}
              className="size-8 rounded-lg border-white/10 bg-white/7 text-white disabled:opacity-40 2xl:size-9"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {paginationPages.map((page, index) => {
              const previousPage = paginationPages[index - 1];
              const hasGap = previousPage && page - previousPage > 1;

              return (
                <span key={page} className="inline-flex items-center gap-2">
                  {hasGap ? (
                    <span className="px-1 text-slate-500">...</span>
                  ) : null}
                  <Button
                    size="icon-sm"
                    variant={safePage === page ? "default" : "outline"}
                    className={cn(
                      "size-8 rounded-lg 2xl:size-9",
                      safePage === page
                        ? "bg-blue-600 text-white hover:bg-blue-500"
                        : "border-white/10 bg-white/7 text-slate-200",
                    )}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                </span>
              );
            })}

            <Button
              aria-label="Volgende pagina"
              size="icon-sm"
              variant="outline"
              disabled={safePage >= totalPages}
              className="size-8 rounded-lg border-white/10 bg-white/7 text-white disabled:opacity-40 2xl:size-9"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <label className="flex items-center gap-2 2xl:gap-3">
            Toon
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
              className="h-9 rounded-lg border border-white/10 bg-slate-950/34 px-3 text-white outline-none 2xl:h-10"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </PlanningOsPanel>
  );
}

export function LessonsBoard({
  durationDefaults = DEFAULT_LESSON_DURATION_MINUTES,
  lessons,
  requests = [],
  slots = [],
  students = [],
  locationOptions = [],
  initialQuery = "",
}: {
  durationDefaults?: InstructorLessonDurationDefaults;
  lessons: Les[];
  requests?: LesAanvraag[];
  slots?: BeschikbaarheidSlot[];
  students?: InstructorStudentProgressRow[];
  locationOptions?: LocationOption[];
  initialQuery?: string;
}) {
  const [activeTab, setActiveTab] = useState<LessonTab>("all");
  const [query, setQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState<LessonTypeFilter>("all");
  const [pageSize, setPageSize] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [planningSlot, setPlanningSlot] = useState<BeschikbaarheidSlot | null>(
    null,
  );
  const [editingLesson, setEditingLesson] = useState<Les | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LesAanvraag | null>(
    null,
  );
  const [selectedWeekStart, setSelectedWeekStart] = useState(() =>
    getStartOfWeek(new Date()),
  );
  const [activePlanningSection, setActivePlanningSection] =
    useState<PlanningSectionId>("week");
  const [manualPlannerNowMs] = useState(() => Date.now());

  const filteredLessons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return lessons.filter((lesson) => {
      const lessonType = getLessonType(lesson);
      const matchesQuery =
        !normalizedQuery ||
        [
          lesson.titel,
          lesson.leerling_naam,
          lesson.leerling_email ?? "",
          lesson.locatie,
          lesson.status,
          lessonType.label,
          lesson.lesson_note ?? "",
          lesson.attendance_reason ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus = matchesTab(lesson, activeTab);
      const matchesType =
        typeFilter === "all" || lessonType.value === typeFilter;

      return matchesQuery && matchesStatus && matchesType;
    });
  }, [activeTab, lessons, query, typeFilter]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests.filter((request) => {
      if (!normalizedQuery) {
        return true;
      }

      return [
        request.leerling_naam,
        request.leerling_email ?? "",
        request.aanvraag_type ?? "",
        request.pakket_naam ?? "",
        request.tijdvak,
        request.bericht,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [query, requests]);

  const sortedLessons = useMemo(
    () =>
      [...filteredLessons].sort(
        (left, right) => getLessonSortValue(left) - getLessonSortValue(right),
      ),
    [filteredLessons],
  );
  const planningBusyWindows = useMemo(
    () =>
      lessons
        .filter((lesson) => {
          const endAt = getLessonEndDate(lesson);

          return (
            lesson.start_at &&
            endAt &&
            busyLessonStatuses.has(lesson.status)
          );
        })
        .map((lesson) => ({
          id: lesson.id,
          label: lesson.leerling_naam || lesson.titel,
          start_at: lesson.start_at,
          end_at: getLessonEndDate(lesson)?.toISOString() ?? null,
        })),
    [lessons],
  );
  const manualPlannerSlots = useMemo(() => {
    return slots
      .filter((slot) => {
        if (slot.beschikbaar === false || !slot.start_at || !slot.eind_at) {
          return false;
        }

        const endAt = new Date(slot.eind_at);

        return !Number.isNaN(endAt.getTime()) && endAt.getTime() > manualPlannerNowMs;
      })
      .sort((left, right) => (left.start_at ?? "").localeCompare(right.start_at ?? ""))
      .slice(0, 72);
  }, [manualPlannerNowMs, slots]);
  const manualPlannerBusyWindows = useMemo(() => {
    const latestSlotEndMs = manualPlannerSlots.reduce((latest, slot) => {
      const endAt = slot.eind_at ? new Date(slot.eind_at).getTime() : Number.NaN;

      return Number.isNaN(endAt) ? latest : Math.max(latest, endAt);
    }, manualPlannerNowMs);

    return planningBusyWindows.filter((window) => {
      if (!window.start_at || !window.end_at) {
        return false;
      }

      const startAt = new Date(window.start_at).getTime();
      const endAt = new Date(window.end_at).getTime();

      return (
        !Number.isNaN(startAt) &&
        !Number.isNaN(endAt) &&
        endAt > manualPlannerNowMs &&
        startAt <= latestSlotEndMs
      );
    });
  }, [manualPlannerNowMs, manualPlannerSlots, planningBusyWindows]);
  const calendarItems = useMemo<Array<PlanningWeekItem<LessonPlanningMeta>>>(() => {
    const slotItems = slots.flatMap((slot) => {
      if (!slot.start_at || !slot.eind_at) {
        return [];
      }

      const kind = slot.beschikbaar ? "available" : "blocked";
      const startAt = new Date(slot.start_at);
      const endAt = new Date(slot.eind_at);

      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
        return [];
      }

      return [
        {
          id: `${kind}-${slot.id}-${slot.start_at}`,
          accent: slot.beschikbaar ? "emerald" : "rose",
          kind,
          title: slot.beschikbaar
            ? "Open plek"
            : slot.source === "weekrooster"
              ? "Vaste blokkade"
              : "Geblokkeerd",
          startAt,
          endAt,
          typeLabel: slot.source === "weekrooster" ? "Vast werkblok" : "Vrij blok",
          statusLabel: slot.beschikbaar ? "Open" : "Dicht",
          contextLabel: slot.beschikbaar
            ? "Klik om leerling in te plannen"
            : "Niet boekbaar",
          actionLabel: slot.beschikbaar ? "Leerling inplannen" : undefined,
          interactive: slot.beschikbaar,
          meta: { slot },
        } satisfies PlanningWeekItem<LessonPlanningMeta>,
      ];
    });
    const lessonItems = filteredLessons.flatMap((lesson) => {
      const startAt = getLessonDate(lesson);
      const endAt = getLessonEndDate(lesson);

      if (!startAt || !endAt) {
        return [];
      }

      return [
        {
          id: `lesson-${lesson.id}`,
          accent: getLessonAccent(lesson),
          kind: "lesson",
          title: lesson.leerling_naam || "Les",
          startAt,
          endAt,
          typeLabel: lesson.titel,
          statusLabel: getStatusPill(lesson.status).label,
          contextLabel: lesson.locatie,
          actionLabel: "Bewerken / verzetten",
          meta: { lesson },
        } satisfies PlanningWeekItem<LessonPlanningMeta>,
      ];
    });
    const requestItems = filteredRequests.flatMap((request) => {
      if (!request.start_at) {
        return [];
      }

      const startAt = new Date(request.start_at);
      const endAt = request.end_at
        ? new Date(request.end_at)
        : new Date(startAt.getTime() + 60 * 60_000);

      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
        return [];
      }

      return [
        {
          id: `request-${request.id}`,
          accent: "amber",
          kind: "request",
          title: request.leerling_naam || "Aanvraag",
          startAt,
          endAt,
          typeLabel: getRequestTypeLabel(request),
          statusLabel: request.status,
          contextLabel: request.tijdvak,
          actionLabel: "Aanvraag bekijken",
          meta: { request },
        } satisfies PlanningWeekItem<LessonPlanningMeta>,
      ];
    });

    return [...slotItems, ...lessonItems, ...requestItems].sort(
      (left, right) => left.startAt.getTime() - right.startAt.getTime(),
    );
  }, [filteredLessons, filteredRequests, slots]);

  const totalPages = Math.max(1, Math.ceil(sortedLessons.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const firstItemIndex = sortedLessons.length ? (safePage - 1) * pageSize : 0;
  const visibleLessons = sortedLessons.slice(
    firstItemIndex,
    firstItemIndex + pageSize,
  );
  const paginationPages = getPaginationPages(safePage, totalPages);

  const today = new Date();
  const visibleWeekStart = selectedWeekStart;
  const visibleWeekEnd = addDays(visibleWeekStart, 7);
  const weekLessons = lessons.filter((lesson) =>
    isInDateRange(getLessonDate(lesson), visibleWeekStart, visibleWeekEnd),
  );
  const weekRequests = requests.filter((request) =>
    isInDateRange(getRequestDate(request), visibleWeekStart, visibleWeekEnd),
  );
  const weekSlots = slots.filter((slot) =>
    isInDateRange(getSlotDate(slot), visibleWeekStart, visibleWeekEnd),
  );
  const activeWeekLessons = weekLessons.filter(
    (lesson) => !isCancelledLesson(lesson),
  );
  const actionableLessons = lessons
    .filter((lesson) => !isCancelledLesson(lesson) && getLessonDate(lesson))
    .sort((left, right) => getLessonSortValue(left) - getLessonSortValue(right));
  const outsideVisibleWeekLessonCount = actionableLessons.filter(
    (lesson) =>
      !isInDateRange(getLessonDate(lesson), visibleWeekStart, visibleWeekEnd),
  ).length;
  const upcomingActionableLessons = actionableLessons.filter((lesson) => {
    const lessonDate = getLessonDate(lesson);

    return Boolean(lessonDate && lessonDate >= today);
  });
  const futurePlannedLessons = upcomingActionableLessons.filter((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status),
  );
  const nextFutureLessonForScope =
    futurePlannedLessons[0] ?? upcomingActionableLessons[0] ?? null;
  const nextLessonForScope =
    nextFutureLessonForScope ?? actionableLessons[0] ?? null;
  const visibleWeekRangeLabel = formatWeekRange(
    visibleWeekStart,
    visibleWeekEnd,
  );
  const completedWeekLessons = weekLessons.filter(
    (lesson) => lesson.status === "afgerond",
  );
  const plannedWeekLessons = weekLessons.filter((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status),
  );
  const todayLessons = lessons
    .filter((lesson) => {
      const lessonDate = getLessonDate(lesson);

      return (
        isSameDay(lessonDate, today) &&
        !["geannuleerd", "geweigerd"].includes(lesson.status)
      );
    })
    .sort((left, right) => getLessonSortValue(left) - getLessonSortValue(right));
  const openRequests = requests.filter(
    (request) => request.status === "aangevraagd",
  );
  const studentProgressItems = [...students].sort((left, right) => {
    const progressDiff = left.voortgang - right.voortgang;

    if (progressDiff !== 0) {
      return progressDiff;
    }

    return left.naam.localeCompare(right.naam);
  });
  const priorityStudentProgressItems = studentProgressItems.slice(0, 5);
  const averageStudentProgress = students.length
    ? Math.round(
        students.reduce((total, student) => total + student.voortgang, 0) /
          students.length,
      )
    : 0;
  const deadlineItems = [
    ...openRequests
      .slice()
      .sort((left, right) => {
        const leftDate = getRequestDate(left)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const rightDate = getRequestDate(right)?.getTime() ?? Number.MAX_SAFE_INTEGER;

        return leftDate - rightDate;
      })
      .slice(0, 3)
      .map((request) => ({
        id: `deadline-request-${request.id}`,
        date: formatCompactDateTime(getRequestDate(request)),
        detail: request.tijdvak,
        title: `${request.leerling_naam || "Leerling"} opvolgen`,
        tone: "bg-amber-400",
      })),
    ...lessons
      .filter((lesson) => lesson.status === "geannuleerd")
      .slice(0, 2)
      .map((lesson) => ({
        id: `deadline-cancelled-${lesson.id}`,
        date: formatCompactDateTime(getLessonDate(lesson)),
        detail: "Nieuw voorstel sturen",
        title: `${lesson.leerling_naam || "Leerling"} herplannen`,
        tone: "bg-rose-400",
      })),
  ].slice(0, 4);
  const focusTips = [
    openRequests.length
      ? `${openRequests.length} aanvraag${openRequests.length === 1 ? "" : "en"} wacht${openRequests.length === 1 ? "" : "en"} nog op acceptatie. Pak die eerst op.`
      : "Geen open aanvragen. Gebruik de vrije blokken om ritme vast te houden.",
    weekSlots.filter((slot) => slot.beschikbaar).length
      ? "Klik op een open plek in de weekplanning om direct een leerling in te plannen."
      : "Zet extra beschikbaarheid open als je deze week meer lessen wilt vullen.",
    todayLessons.length
      ? "Rond na elke les aanwezigheid en notities direct af voor een strak leerlingdossier."
      : "Geen lessen vandaag. Goed moment om aanvragen en vervolglessen klaar te zetten.",
  ];
  const noteItems = lessons
    .filter((lesson) => lesson.lesson_note?.trim())
    .slice(0, 2)
    .map((lesson) => ({
      id: `note-${lesson.id}`,
      detail: lesson.lesson_note ?? "",
      meta: `${lesson.leerling_naam || "Leerling"} - ${lesson.tijd}`,
    }));
  const lessonMinutesThisWeek = activeWeekLessons.reduce(
    (total, lesson) => total + (lesson.duur_minuten ?? 0),
    0,
  );
  const progressRate = weekLessons.length
    ? Math.round((completedWeekLessons.length / weekLessons.length) * 100)
    : 0;
  const uniqueWeekStudents = new Set(
    activeWeekLessons
      .map((lesson) => lesson.leerling_id || lesson.leerling_naam)
      .filter(Boolean),
  ).size;
  const navigationItems: PlanningNavigationItem[] = [
    {
      icon: CalendarRange,
      label: "Weekplanning",
      section: "week",
      targetId: "weekplanning",
      type: "section",
    },
    {
      icon: CalendarDays,
      label: "Agenda",
      section: "agenda",
      targetId: "agenda-overzicht",
      type: "section",
    },
    {
      icon: ListChecks,
      label: "Taken",
      section: "tasks",
      targetId: "taken-vandaag",
      type: "section",
    },
    {
      icon: Flag,
      label: "Aanvragen",
      section: "requests",
      targetId: "aanvragen-overzicht",
      type: "section",
    },
    {
      href: "/instructeur/leerlingen",
      icon: UsersRound,
      label: "Leerlingen",
      type: "link",
    },
    {
      icon: PieChart,
      label: "Statistieken",
      section: "stats",
      targetId: "planning-stats",
      type: "section",
    },
  ];
  const lessonLegend = [
    { accent: "sky" as const, label: "Losse les" },
    { accent: "violet" as const, label: "Proefles" },
    { accent: "cyan" as const, label: "Pakket" },
    { accent: "amber" as const, label: "Examenrit" },
    { accent: "emerald" as const, label: "Voltooid" },
    { accent: "rose" as const, label: "Geannuleerd" },
  ];

  function handlePlanningSectionClick(
    item: Extract<PlanningNavigationItem, { type: "section" }>,
  ) {
    setActivePlanningSection(item.section);

    if (
      item.section === "agenda" ||
      item.section === "requests" ||
      item.section === "tasks"
    ) {
      return;
    }

    const target = document.getElementById(item.targetId);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
    target.focus({ preventScroll: true });
  }

  function openFullLessonPlanning() {
    setActivePlanningSection("agenda");
    setActiveTab("all");
    setQuery("");
    setTypeFilter("all");
    setCurrentPage(1);
  }

  function goToNextLessonWeek() {
    const nextLessonDate = getLessonDate(nextFutureLessonForScope);

    if (!nextLessonDate) {
      return;
    }

    setActivePlanningSection("week");
    setSelectedWeekStart(getStartOfWeek(nextLessonDate));
  }

  return (
    <div className="space-y-4 text-white 2xl:space-y-6">
      <ScheduleLessonFromSlotDialog
        key={planningSlot?.id ?? "empty-planning-slot"}
        open={Boolean(planningSlot)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPlanningSlot(null);
          }
        }}
        slot={planningSlot}
        students={students}
        locationOptions={locationOptions}
        busyWindows={planningBusyWindows}
        durationDefaults={durationDefaults}
      />
      <LessonCalendarEditDialog
        open={Boolean(editingLesson)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingLesson(null);
          }
        }}
        lesson={editingLesson}
        students={students}
        locationOptions={locationOptions}
        slots={slots}
        busyWindows={planningBusyWindows}
      />
      <PlanningRequestDialog
        request={selectedRequest}
        locationOptions={locationOptions}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedRequest(null);
          }
        }}
      />

      <div className="grid gap-4 xl:grid-cols-[14rem_minmax(0,1fr)] 2xl:grid-cols-[16rem_minmax(0,1fr)_18rem]">
        <aside className="space-y-4">
          <PlanningOsPanel className="p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-400/14 text-violet-100">
                <LayoutDashboard className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">
                  LesFlow
                </p>
                <p className="truncate text-xs text-slate-400">
                  Planning, focus en opvolging
                </p>
              </div>
            </div>

            <nav className="mt-6 space-y-1.5">
              {navigationItems.map((item) => {
                const isActive =
                  item.type === "section" &&
                  activePlanningSection === item.section;

                if (item.type === "link") {
                  return (
                    <Button
                      key={item.label}
                      asChild
                      variant="ghost"
                      className="h-10 w-full justify-start rounded-lg px-3 text-sm text-slate-300 hover:bg-white/8 hover:text-white"
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                }

                return (
                  <Button
                    key={item.label}
                    type="button"
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "h-10 w-full justify-start rounded-lg px-3 text-sm",
                      isActive
                        ? "bg-violet-500/80 text-white hover:bg-violet-500"
                        : "text-slate-300 hover:bg-white/8 hover:text-white",
                    )}
                    onClick={() => handlePlanningSectionClick(item)}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </PlanningOsPanel>

          <PlanningOsPanel className="p-4">
            <PanelTitle title="Voortgang deze week" />
            <div className="mt-4 flex items-center gap-4">
              <div className="relative flex size-20 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-950/30">
                <div className="absolute inset-2 rounded-full border-4 border-emerald-400/70 border-l-violet-400" />
                <span className="text-lg font-semibold text-white">
                  {progressRate}%
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white">Goed bezig</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {completedWeekLessons.length} van {weekLessons.length} lessen afgerond.
                </p>
              </div>
            </div>
          </PlanningOsPanel>

          <PlanningOsPanel className="p-4">
            <PanelTitle title="Planning focus" />
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/24 p-4 text-center">
              <p className="text-3xl font-semibold text-white">45:00</p>
              <p className="mt-1 text-xs text-slate-400">Admin sprint</p>
            </div>
            <Button className="mt-3 h-10 w-full rounded-lg bg-violet-500 text-white hover:bg-violet-400">
              <TimerReset className="size-4" />
              Start focus
            </Button>
          </PlanningOsPanel>
        </aside>

        <main className="space-y-4">
          {activePlanningSection === "agenda" ? (
            <LessonListPanel
              activeTab={activeTab}
              firstItemIndex={firstItemIndex}
              locationOptions={locationOptions}
              pageSize={pageSize}
              paginationPages={paginationPages}
              query={query}
              safePage={safePage}
              setActiveTab={setActiveTab}
              setCurrentPage={setCurrentPage}
              setPageSize={setPageSize}
              setQuery={setQuery}
              setTypeFilter={setTypeFilter}
              sortedLessons={sortedLessons}
              totalPages={totalPages}
              typeFilter={typeFilter}
              visibleWeekEnd={visibleWeekEnd}
              visibleWeekStart={visibleWeekStart}
              visibleLessons={visibleLessons}
            />
          ) : activePlanningSection === "requests" ? (
            <RequestListPanel
              requests={requests}
              locationOptions={locationOptions}
              onSelectRequest={setSelectedRequest}
            />
          ) : activePlanningSection === "tasks" ? (
            <StudentProgressOverview
              id="taken-vandaag"
              averageProgress={averageStudentProgress}
              students={studentProgressItems}
              className="border-violet-300/30 ring-2 ring-violet-400/35"
            />
          ) : (
            <PlanningOsPanel
              id="weekplanning"
              className={cn(
                "overflow-hidden p-3 transition 2xl:p-4",
                activePlanningSection === "week" &&
                  "border-violet-300/30 ring-2 ring-violet-400/35",
              )}
            >
              <div className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                    Weekplanning
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                    Lessen
                  </h1>
                  <p className="mt-1 text-sm text-slate-400">
                    Lessen, aanvragen en open plekken in een centraal weekbeeld.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 rounded-lg border-white/10 bg-white/7 text-white hover:bg-white/12"
                  >
                    <Link href="/instructeur/beschikbaarheid">
                      <CalendarClock className="size-4" />
                      Beschikbaarheid
                    </Link>
                  </Button>
                  {students[0] ? (
                    <CreateManualLessonDialog
                      leerlingId={students[0].id}
                      leerlingNaam={students[0].naam}
                      studentOptions={students}
                      suggestedTitle={
                        students[0].pakket !== "Nog geen pakket"
                          ? students[0].pakket
                          : "Rijles"
                      }
                      locationOptions={locationOptions}
                      availabilitySlots={manualPlannerSlots}
                      busyWindows={manualPlannerBusyWindows}
                      durationDefaults={durationDefaults}
                      triggerLabel="Nieuwe les"
                      triggerClassName="h-10 rounded-lg bg-violet-500 px-4 text-sm text-white hover:bg-violet-400"
                    />
                  ) : null}
                </div>
              </div>

              <WeekScopeCallout
                nextLesson={nextLessonForScope}
                onGoToNextLessonWeek={goToNextLessonWeek}
                onOpenAgenda={openFullLessonPlanning}
                outsideWeekLessonCount={outsideVisibleWeekLessonCount}
                showGoToNextLessonWeek={
                  activeWeekLessons.length === 0 && Boolean(nextFutureLessonForScope)
                }
                weekLessonCount={activeWeekLessons.length}
                weekRangeLabel={visibleWeekRangeLabel}
              />

              <PlanningWeekView
                emptyLabel="Geen lessen, aanvragen of open plekken."
                fitToContainer
                items={calendarItems}
                navigationLabel="Week van"
                onSelectedWeekStartChange={setSelectedWeekStart}
                onSelectItem={(item) => {
                  if (item.kind === "available" && item.meta?.slot) {
                    setPlanningSlot(item.meta.slot);
                    return;
                  }

                  if (item.kind === "lesson" && item.meta?.lesson) {
                    setEditingLesson(item.meta.lesson);
                    return;
                  }

                  if (item.kind === "request" && item.meta?.request) {
                    setSelectedRequest(item.meta.request);
                  }
                }}
                selectedWeekStart={selectedWeekStart}
                tone="urban"
              />

              <div className="mt-5 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
                {lessonLegend.map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2.5 rounded-full",
                        getLessonAccentClass(item.accent),
                      )}
                    />
                    {item.label}
                  </span>
                ))}
                <span className="inline-flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-amber-400" />
                  Aanvraag
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-emerald-400" />
                  Open plek
                </span>
              </div>
            </PlanningOsPanel>
          )}

          <div
            id="planning-stats"
            tabIndex={-1}
            className={cn(
              "scroll-mt-24 grid gap-3 rounded-xl outline-none transition sm:grid-cols-2 xl:grid-cols-6",
              activePlanningSection === "stats" &&
                "ring-2 ring-violet-400/35 ring-offset-2 ring-offset-slate-950",
            )}
          >
            {[
              {
                icon: CalendarDays,
                label: "Lessen deze week",
                value: `${weekLessons.length}`,
              },
              {
                icon: CheckCircle2,
                label: "Voltooid",
                value: `${completedWeekLessons.length}`,
              },
              {
                icon: Clock3,
                label: "Nog te doen",
                value: `${plannedWeekLessons.length}`,
              },
              {
                icon: Flag,
                label: "Aanvragen",
                value: `${weekRequests.length}`,
              },
              {
                icon: TimerReset,
                label: "Lesuren",
                value: formatDurationHours(lessonMinutesThisWeek),
              },
              {
                icon: UsersRound,
                label: "Leerlingen",
                value: `${uniqueWeekStudents}`,
              },
            ].map((item) => (
              <PlanningOsPanel key={item.label} className="p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-slate-200">
                    <item.icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-xl font-semibold text-white">
                      {item.value}
                    </p>
                    <p className="text-xs text-slate-400">{item.label}</p>
                  </div>
                </div>
              </PlanningOsPanel>
            ))}
          </div>
        </main>

        <aside className="space-y-4 xl:col-span-2 2xl:col-span-1">
          <StudentProgressOverview
            averageProgress={averageStudentProgress}
            students={priorityStudentProgressItems}
            variant="compact"
            className={cn(
              "transition",
              activePlanningSection === "tasks" &&
                "border-violet-300/30 ring-2 ring-violet-400/35",
            )}
          />

          <PlanningOsPanel className="p-4">
            <PanelTitle title="Deadlines" />
            <div className="mt-4 space-y-3">
              {deadlineItems.length ? (
                deadlineItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-b border-white/8 pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className={cn("mt-1 size-2.5 rounded-full", item.tone)} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.detail}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">{item.date}</span>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-white/10 bg-white/5 p-3 text-sm text-slate-400">
                  Geen open deadlines.
                </p>
              )}
            </div>
          </PlanningOsPanel>

          <PlanningOsPanel className="p-4">
            <PanelTitle
              title="Focus tips"
              action={<Lightbulb className="size-4 text-amber-300" />}
            />
            <div className="mt-4 space-y-2">
              {focusTips.map((tip) => (
                <p
                  key={tip}
                  className="rounded-lg border border-white/10 bg-white/6 p-3 text-sm leading-6 text-slate-300"
                >
                  {tip}
                </p>
              ))}
            </div>
          </PlanningOsPanel>

          <PlanningOsPanel className="p-4">
            <PanelTitle
              title="Notities"
              action={<NotebookPen className="size-4 text-slate-400" />}
            />
            <div className="mt-4 space-y-2">
              {noteItems.length ? (
                noteItems.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-white/10 bg-white/6 p-3"
                  >
                    <p className="line-clamp-2 text-sm text-slate-200">
                      {note.detail}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">{note.meta}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-white/10 bg-white/5 p-3 text-sm text-slate-400">
                  Lesnotities verschijnen hier zodra je ze bij lessen opslaat.
                </p>
              )}
            </div>
          </PlanningOsPanel>
        </aside>
      </div>

    </div>
  );
}
