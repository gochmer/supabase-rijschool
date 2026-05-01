import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Euro,
  MessageSquare,
  PackageCheck,
  Send,
  Star,
  UsersRound,
  XCircle,
} from "lucide-react";

import { LessonCreateDialog } from "@/components/instructor/lesson-create-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { InstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import type {
  BeschikbaarheidSlot,
  InstructorStudentProgressRow,
  Les,
  LesAanvraag,
  LocationOption,
  Notificatie,
  Pakket,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type DashboardInstructorRecord = {
  prijs_per_les: number | string | null;
  beoordeling: number | string | null;
  aantal_reviews?: number | string | null;
};

type InstructorCommandCenterProps = {
  lessons: Les[];
  requests: LesAanvraag[];
  notifications: Notificatie[];
  instructor: DashboardInstructorRecord | null;
  profileName?: string | null;
  packages: Pakket[];
  availabilitySlots: BeschikbaarheidSlot[];
  students: InstructorStudentProgressRow[];
  locationOptions: LocationOption[];
  lessonDurationDefaults: InstructorLessonDurationDefaults;
  realtime?: ReactNode;
};

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Amsterdam",
});

const weekdayFormatter = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "short",
  timeZone: "Europe/Amsterdam",
});

const compactWeekdayFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Amsterdam",
  weekday: "short",
});

const timeFormatter = new Intl.DateTimeFormat("nl-NL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

const weekHours = Array.from({ length: 11 }, (_, index) => index + 8);

function getSafeDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getLessonDate(lesson: Les) {
  return getSafeDate(lesson.start_at) ?? getSafeDate(lesson.datum);
}

function getLessonEndDate(lesson: Les) {
  if (lesson.end_at) {
    return getSafeDate(lesson.end_at);
  }

  const start = getLessonDate(lesson);

  if (!start) {
    return null;
  }

  return new Date(start.getTime() + lesson.duur_minuten * 60_000);
}

function isSameMonth(date: Date | null, reference: Date) {
  if (!date) {
    return false;
  }

  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function getPreviousMonth(reference: Date) {
  return new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
}

function getPercentChange(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function formatPercent(value: number) {
  if (value === 0) {
    return "0%";
  }

  return `${value > 0 ? "+" : ""}${value}%`;
}

function formatWeekday(value: string | null | undefined, fallback: string) {
  const date = getSafeDate(value);

  return date ? weekdayFormatter.format(date) : fallback;
}

function formatTime(value: string | null | undefined, fallback = "") {
  const date = getSafeDate(value);

  return date ? timeFormatter.format(date) : fallback;
}

function getAverageLessonPrice(
  instructor: DashboardInstructorRecord | null,
  packages: Pakket[],
) {
  const profilePrice = Number(instructor?.prijs_per_les ?? 0);

  if (profilePrice > 0) {
    return profilePrice;
  }

  const packageLessonPrices = packages
    .map((pkg) => {
      const lessons = Number(pkg.lessen ?? 0);
      const price = Number(pkg.prijs ?? 0);

      return lessons > 0 && price > 0 ? price / lessons : 0;
    })
    .filter((value) => value > 0);

  if (!packageLessonPrices.length) {
    return 0;
  }

  return Math.round(
    packageLessonPrices.reduce((total, value) => total + value, 0) /
      packageLessonPrices.length,
  );
}

function buildIncomeSeries(
  lessons: Les[],
  lessonPrice: number,
  reference: Date,
) {
  const buckets = Array.from({ length: 12 }, () => 0);
  const daysInMonth = new Date(
    reference.getFullYear(),
    reference.getMonth() + 1,
    0,
  ).getDate();
  const bucketSize = Math.max(1, Math.ceil(daysInMonth / buckets.length));

  lessons.forEach((lesson) => {
    const date = getLessonDate(lesson);

    if (!date || !isSameMonth(date, reference)) {
      return;
    }

    const bucketIndex = Math.min(
      buckets.length - 1,
      Math.floor((date.getDate() - 1) / bucketSize),
    );
    buckets[bucketIndex] += lessonPrice;
  });

  let runningTotal = 0;

  return buckets.map((value) => {
    runningTotal += value;
    return runningTotal;
  });
}

function getStartOfWeek(reference: Date) {
  const date = new Date(reference);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekDays(reference: Date) {
  const start = getStartOfWeek(reference);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function isSameDay(left: Date | null, right: Date) {
  return Boolean(
    left &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate(),
  );
}

function isInWeek(date: Date | null, reference: Date) {
  if (!date) {
    return false;
  }

  const start = getStartOfWeek(reference);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return date >= start && date < end;
}

function formatWeekRange(days: Date[]) {
  const first = days[0];
  const last = days[days.length - 1];

  if (!first || !last) {
    return "Deze week";
  }

  const sameMonth =
    first.getFullYear() === last.getFullYear() &&
    first.getMonth() === last.getMonth();
  const monthLabel = new Intl.DateTimeFormat("nl-NL", {
    month: "short",
    timeZone: "Europe/Amsterdam",
    year: "numeric",
  }).format(last);

  return sameMonth
    ? `${first.getDate()} - ${last.getDate()} ${monthLabel}`
    : `${dateFormatter.format(first)} - ${dateFormatter.format(last)}`;
}

function getRequestStatusLabel(status: string) {
  switch (status) {
    case "aangevraagd":
      return "Nieuwe aanvraag";
    case "geaccepteerd":
      return "Bevestigd";
    case "ingepland":
      return "Ingepland";
    case "afgerond":
      return "Voltooid";
    case "geannuleerd":
      return "Geannuleerd";
    default:
      return status;
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "aangevraagd":
    case "ingepland":
      return "border-blue-400/25 bg-blue-500/15 text-blue-100";
    case "geaccepteerd":
    case "afgerond":
      return "border-emerald-400/25 bg-emerald-500/15 text-emerald-100";
    case "geannuleerd":
    case "geweigerd":
      return "border-rose-400/25 bg-rose-500/15 text-rose-100";
    default:
      return "border-white/10 bg-white/10 text-slate-200";
  }
}

function getStudentDashboardHref(student: InstructorStudentProgressRow) {
  return `/instructeur/leerlingen?student=${encodeURIComponent(student.id)}`;
}

function getLessonDashboardHref(lesson: Les) {
  const zoekwaarde = lesson.leerling_naam || lesson.titel;
  return `/instructeur/lessen?zoek=${encodeURIComponent(zoekwaarde)}`;
}

function getNotificationHref(notification: Notificatie) {
  if (notification.titel.toLowerCase().includes("aanvraag")) {
    return "/instructeur/aanvragen";
  }

  if (notification.titel.toLowerCase().includes("les")) {
    return "/instructeur/lessen";
  }

  if (notification.titel.toLowerCase().includes("review")) {
    return "/instructeur/reviews";
  }

  return "/instructeur/berichten";
}

function getNotificationIcon(notification: Notificatie) {
  if (notification.type === "succes") {
    return CheckCircle2;
  }

  if (notification.type === "waarschuwing") {
    return Bell;
  }

  return MessageSquare;
}

function getTipText({
  openRequestCount,
  openSlotCount,
  activePackageCount,
}: {
  openRequestCount: number;
  openSlotCount: number;
  activePackageCount: number;
}) {
  if (openRequestCount > 0) {
    return "Reageer vandaag op open aanvragen. Snelle opvolging maakt de kans op een geplande les direct groter.";
  }

  if (openSlotCount === 0) {
    return "Zet nieuwe beschikbaarheid open voor de komende week, zodat leerlingen zonder extra overleg kunnen boeken.";
  }

  if (activePackageCount === 0) {
    return "Publiceer minimaal een duidelijk pakket. Dat maakt je profiel concreter en verlaagt twijfel bij nieuwe leerlingen.";
  }

  return "Houd je beschikbaarheid actueel en rond lessen netjes af. Dan blijven voortgang, omzet en leerlingoverzicht betrouwbaar.";
}

function CommandPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(15,23,42,0.34))] p-4 shadow-[0_22px_70px_-50px_rgba(0,0,0,0.95)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  title,
  href,
  cta = "Alles bekijken",
}: {
  title: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[11px] font-semibold tracking-[0.14em] text-slate-300 uppercase">
        {title}
      </h2>
      {href ? (
        <Link
          href={href}
          className="text-[11px] font-medium text-slate-400 transition hover:text-white"
        >
          {cta}
        </Link>
      ) : null}
    </div>
  );
}

function StatTile({
  label,
  value,
  helper,
  href,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  href: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "amber" | "purple" | "teal";
}) {
  const toneClass = {
    amber: "border-amber-400/26 bg-amber-400/12 text-amber-300",
    blue: "border-blue-400/26 bg-blue-500/12 text-blue-300",
    green: "border-emerald-400/26 bg-emerald-500/12 text-emerald-300",
    purple: "border-violet-400/26 bg-violet-500/12 text-violet-300",
    teal: "border-teal-400/26 bg-teal-500/12 text-teal-300",
  }[tone];

  return (
    <Link
      href={href}
      className="group rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(15,23,42,0.34))] p-4 text-white shadow-[0_20px_60px_-46px_rgba(0,0,0,0.95)] transition hover:border-white/18 hover:bg-white/[0.08]"
    >
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-lg border",
            toneClass,
          )}
        >
          <Icon className="size-7" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-1 truncate text-[12px] text-emerald-300">{helper}</p>
        </div>
      </div>
    </Link>
  );
}

function MiniLineChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values.length ? values : [0];
  const polyline = points
    .map((value, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
      const y = 90 - (value / max) * 72;

      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,100 ${polyline} 100,100`;

  return (
    <div className="mt-4 h-36 rounded-lg border border-white/8 bg-slate-950/22 p-3">
      <svg viewBox="0 0 100 100" className="h-full w-full" role="img">
        <defs>
          <linearGradient
            id="dashboard-income-area"
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[20, 44, 68, 92].map((y) => (
          <line
            key={y}
            x1="0"
            x2="100"
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.6"
          />
        ))}
        <polygon points={area} fill="url(#dashboard-income-area)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="rgb(37 99 235)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
      </svg>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/12 bg-white/[0.035] px-3 py-4 text-sm text-slate-400">
      {text}
    </div>
  );
}

function overlapsHour({
  day,
  end,
  hour,
  start,
}: {
  day: Date;
  end: Date | null;
  hour: number;
  start: Date | null;
}) {
  if (!start || !isSameDay(start, day)) {
    return false;
  }

  const hourStart = new Date(day);
  hourStart.setHours(hour, 0, 0, 0);
  const hourEnd = new Date(day);
  hourEnd.setHours(hour + 1, 0, 0, 0);
  const safeEnd = end ?? new Date(start.getTime() + 60 * 60_000);

  return start < hourEnd && safeEnd > hourStart;
}

function WeekAvailabilityGrid({
  availabilitySlots,
  lessons,
  weekDays,
}: {
  availabilitySlots: BeschikbaarheidSlot[];
  lessons: Les[];
  weekDays: Date[];
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[620px]">
        <div className="grid grid-cols-[3.2rem_repeat(7,minmax(4.8rem,1fr))] gap-1 text-[10px]">
          <div />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="rounded-md bg-white/[0.035] px-2 py-2 text-center font-semibold text-slate-300"
            >
              {compactWeekdayFormatter.format(day)}
            </div>
          ))}

          {weekHours.map((hour) => (
            <div key={hour} className="contents">
              <div className="py-2 text-right text-[11px] text-slate-500">
                {String(hour).padStart(2, "0")}:00
              </div>
              {weekDays.map((day) => {
                const lesson = lessons.find((item) =>
                  overlapsHour({
                    day,
                    end: getLessonEndDate(item),
                    hour,
                    start: getLessonDate(item),
                  }),
                );
                const slot = availabilitySlots.find((item) =>
                  overlapsHour({
                    day,
                    end: getSafeDate(item.eind_at),
                    hour,
                    start: getSafeDate(item.start_at),
                  }),
                );
                const isBlocked = slot && !slot.beschikbaar;
                const isAvailable = slot?.beschikbaar;

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={cn(
                      "min-h-10 rounded-sm border px-1.5 py-1",
                      lesson
                        ? "border-blue-400/35 bg-blue-600/65 text-white"
                        : isBlocked
                          ? "border-red-400/30 bg-red-600/65 text-white"
                          : isAvailable
                            ? "border-emerald-400/18 bg-emerald-500/48 text-emerald-50"
                            : "border-white/6 bg-slate-900/52 text-slate-500",
                    )}
                  >
                    {lesson ? (
                      <>
                        <p className="truncate font-semibold">
                          {lesson.leerling_naam || lesson.titel}
                        </p>
                        <p className="truncate text-[9px] opacity-85">
                          {formatTime(lesson.start_at, lesson.tijd)}
                        </p>
                      </>
                    ) : isBlocked ? (
                      <>
                        <p className="font-semibold">Niet beschikbaar</p>
                        <p className="text-[9px] opacity-85">
                          {formatTime(slot.start_at, "")}
                        </p>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function InstructorCommandCenter({
  lessons,
  requests,
  notifications,
  instructor,
  profileName,
  packages,
  availabilitySlots,
  students,
  locationOptions,
  lessonDurationDefaults,
  realtime,
}: InstructorCommandCenterProps) {
  const now = new Date();
  const previousMonth = getPreviousMonth(now);
  const weekDays = getWeekDays(now);
  const openRequests = requests.filter((item) => item.status === "aangevraagd");
  const activePackages = packages.filter((pkg) => pkg.actief !== false);
  const availableSlots = availabilitySlots.filter((slot) => slot.beschikbaar);
  const unreadNotifications = notifications.filter((item) => item.ongelezen);
  const lessonPrice = getAverageLessonPrice(instructor, packages);
  const completedLessons = lessons.filter(
    (lesson) => lesson.status === "afgerond",
  );
  const completedThisMonth = completedLessons.filter((lesson) =>
    isSameMonth(getLessonDate(lesson), now),
  );
  const completedPreviousMonth = completedLessons.filter((lesson) =>
    isSameMonth(getLessonDate(lesson), previousMonth),
  );
  const lessonsThisMonth = lessons.filter((lesson) =>
    isSameMonth(getLessonDate(lesson), now),
  );
  const lessonsPreviousMonth = lessons.filter((lesson) =>
    isSameMonth(getLessonDate(lesson), previousMonth),
  );
  const lessonsThisWeek = lessons.filter((lesson) =>
    isInWeek(getLessonDate(lesson), now),
  );
  const upcomingLessons = [...lessons]
    .filter((lesson) => {
      const date = getLessonDate(lesson);
      return (
        date &&
        date.getTime() >= new Date().setHours(0, 0, 0, 0) &&
        !["geannuleerd", "geweigerd"].includes(lesson.status)
      );
    })
    .sort((left, right) => {
      const leftDate = getLessonDate(left)?.getTime() ?? 0;
      const rightDate = getLessonDate(right)?.getTime() ?? 0;

      return leftDate - rightDate;
    });
  const sortedStudents = [...students].sort(
    (left, right) => right.voortgang - left.voortgang,
  );
  const incomeThisMonth = completedThisMonth.length * lessonPrice;
  const incomePreviousMonth = completedPreviousMonth.length * lessonPrice;
  const incomeTrend = getPercentChange(incomeThisMonth, incomePreviousMonth);
  const lessonsTrend = getPercentChange(
    lessonsThisMonth.length,
    lessonsPreviousMonth.length,
  );
  const incomeSeries = buildIncomeSeries(completedLessons, lessonPrice, now);
  const averageRating = Number(instructor?.beoordeling ?? 0);
  const reviewCount = Number(instructor?.aantal_reviews ?? 0);
  const displayName = profileName ?? "Gochmer";
  const availabilityPercent = availabilitySlots.length
    ? Math.round((availableSlots.length / availabilitySlots.length) * 100)
    : 0;
  const lessonHoursThisMonth = lessonsThisMonth.reduce(
    (total, lesson) => total + (lesson.duur_minuten ?? 0),
    0,
  );
  const cancelledLessons = lessonsThisMonth.filter((lesson) =>
    ["geannuleerd", "geweigerd"].includes(lesson.status),
  ).length;
  const cancellationRate = lessonsThisMonth.length
    ? Math.round((cancelledLessons / lessonsThisMonth.length) * 100)
    : 0;
  const tipText = getTipText({
    openRequestCount: openRequests.length,
    openSlotCount: availableSlots.length,
    activePackageCount: activePackages.length,
  });

  return (
    <div className="space-y-4 text-white">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Welkom terug, {displayName}! Hier is een overzicht van je
            activiteiten.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {realtime}
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-lg border-white/10 bg-white/7 px-4 text-white hover:bg-white/12"
          >
            <Link href="/instructeur/beschikbaarheid">
              <CalendarRange className="size-4" />
              {formatWeekRange(weekDays)}
            </Link>
          </Button>
          <LessonCreateDialog
            students={students}
            locationOptions={locationOptions}
            durationDefaults={lessonDurationDefaults}
            className="h-11 rounded-lg bg-blue-600 px-5 text-base text-white shadow-[0_18px_50px_-28px_rgba(37,99,235,0.9)] hover:bg-blue-500"
          />
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile
          label="Totaal leerlingen"
          value={`${students.length}`}
          helper={`${students.filter((student) => student.voortgang >= 70).length} sterk op koers`}
          href="/instructeur/leerlingen"
          icon={UsersRound}
          tone="blue"
        />
        <StatTile
          label="Lessen deze week"
          value={`${lessonsThisWeek.length}`}
          helper={`${formatPercent(lessonsTrend)} vs vorige maand`}
          href="/instructeur/lessen"
          icon={CheckCircle2}
          tone="green"
        />
        <StatTile
          label="Beschikbaarheid"
          value={`${availabilityPercent}%`}
          helper={`${availableSlots.length} blokken beschikbaar`}
          href="/instructeur/beschikbaarheid"
          icon={Clock3}
          tone="amber"
        />
        <StatTile
          label="Reviews gemiddeld"
          value={averageRating ? averageRating.toFixed(1) : "0.0"}
          helper={`Van ${reviewCount} reviews`}
          href="/instructeur/reviews"
          icon={Star}
          tone="purple"
        />
        <StatTile
          label="Inkomsten deze maand"
          value={formatCurrency(incomeThisMonth)}
          helper={`${formatPercent(incomeTrend)} vs vorige maand`}
          href="/instructeur/inkomsten"
          icon={Euro}
          tone="teal"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.72fr)_minmax(0,1.38fr)]">
            <CommandPanel>
              <SectionHeader
                title="Aankomende lessen"
                href="/instructeur/lessen"
              />
              <div className="space-y-3">
                {upcomingLessons.slice(0, 5).length ? (
                  upcomingLessons.slice(0, 5).map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={getLessonDashboardHref(lesson)}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-white/7"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400">
                          {formatWeekday(lesson.start_at, lesson.datum)} -{" "}
                          {formatTime(lesson.start_at, lesson.tijd)}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-white">
                          {lesson.leerling_naam || "Leerling"}
                        </p>
                        <p className="truncate text-[12px] text-slate-400">
                          {lesson.titel}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "border px-2 py-1 text-[10px]",
                          getStatusBadgeClass(lesson.status),
                        )}
                      >
                        {getRequestStatusLabel(lesson.status)}
                      </Badge>
                    </Link>
                  ))
                ) : (
                  <EmptyState text="Geen aankomende lessen. Plan een nieuwe les of zet beschikbaarheid open." />
                )}
              </div>
              <Button
                asChild
                variant="outline"
                className="mt-4 h-10 w-full justify-between rounded-lg border-white/10 bg-white/7 text-white hover:bg-white/12"
              >
                <Link href="/instructeur/lessen">
                  Alle lessen bekijken
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </CommandPanel>

            <CommandPanel>
              <SectionHeader
                title="Beschikbaarheid deze week"
                href="/instructeur/beschikbaarheid"
                cta="Week bekijken"
              />
              <WeekAvailabilityGrid
                availabilitySlots={availabilitySlots}
                lessons={lessonsThisWeek}
                weekDays={weekDays}
              />
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  Beschikbaar
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500" />
                  Bezet
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-red-500" />
                  Niet beschikbaar
                </span>
              </div>
            </CommandPanel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <CommandPanel>
              <SectionHeader
                title="Recente reviews"
                href="/instructeur/reviews"
              />
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-white">
                    {averageRating ? averageRating.toFixed(1) : "0.0"}
                  </p>
                  <p className="mt-1 text-[12px] text-slate-400">
                    Gebaseerd op {reviewCount} reviews
                  </p>
                </div>
                <div className="flex text-amber-300">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={cn(
                        "size-4",
                        index < Math.round(averageRating)
                          ? "fill-current"
                          : "opacity-35",
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-semibold text-white">
                  Reviewscore bewaken
                </p>
                <p className="mt-1 text-[12px] leading-5 text-slate-400">
                  Vraag na afgeronde lessen om feedback en reageer op nieuwe
                  reviews vanuit je reviewpagina.
                </p>
              </div>
            </CommandPanel>

            <CommandPanel>
              <SectionHeader
                title="Leerling voortgang"
                href="/instructeur/leerlingen"
              />
              <div className="space-y-3">
                {sortedStudents.slice(0, 5).length ? (
                  sortedStudents.slice(0, 5).map((student, index) => (
                    <Link
                      key={student.id}
                      href={getStudentDashboardHref(student)}
                      className="grid grid-cols-[1.2rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-sm"
                    >
                      <span className="text-slate-400">{index + 1}.</span>
                      <div className="min-w-0">
                        <p className="truncate text-white">{student.naam}</p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              student.voortgang >= 70
                                ? "bg-emerald-400"
                                : student.voortgang >= 40
                                  ? "bg-amber-400"
                                  : "bg-red-400",
                            )}
                            style={{
                              width: `${Math.min(100, Math.max(0, student.voortgang))}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-right text-[12px] text-slate-300">
                        {student.voortgang}%
                      </span>
                    </Link>
                  ))
                ) : (
                  <EmptyState text="Nog geen gekoppelde leerlingen." />
                )}
              </div>
            </CommandPanel>

            <CommandPanel>
              <SectionHeader
                title="Inkomsten overzicht"
                href="/instructeur/inkomsten"
              />
              <p className="text-3xl font-semibold tracking-tight text-white">
                {formatCurrency(incomeThisMonth)}
              </p>
              <p className="mt-1 text-[12px] text-slate-400">
                {formatPercent(incomeTrend)} vs vorige maand
              </p>
              <MiniLineChart values={incomeSeries} />
            </CommandPanel>
          </div>
        </div>

        <aside className="space-y-4">
          <CommandPanel>
            <SectionHeader
              title="Recente meldingen"
              href="/instructeur/berichten"
            />
            <div className="space-y-3">
              {notifications.slice(0, 4).length ? (
                notifications.slice(0, 4).map((notification) => {
                  const Icon = getNotificationIcon(notification);

                  return (
                    <Link
                      key={notification.id}
                      href={getNotificationHref(notification)}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-lg px-2 py-2 transition hover:bg-white/7"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full bg-blue-500/16 text-blue-200">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {notification.titel}
                        </p>
                        <p className="line-clamp-2 text-[11px] leading-5 text-slate-400">
                          {notification.tekst}
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-[10px] text-slate-500">
                        {notification.tijd}
                      </span>
                    </Link>
                  );
                })
              ) : (
                <EmptyState text="Geen recente meldingen." />
              )}
            </div>
          </CommandPanel>

          <CommandPanel>
            <SectionHeader title="Snelle acties" />
            <div className="space-y-1.5">
              {[
                {
                  href: "/instructeur/lessen",
                  icon: CalendarDays,
                  label: "Nieuwe les plannen",
                },
                {
                  href: "/instructeur/beschikbaarheid",
                  icon: Clock3,
                  label: "Beschikbaarheid aanpassen",
                },
                {
                  href: "/instructeur/leerlingen",
                  icon: UsersRound,
                  label: "Nieuwe leerling toevoegen",
                },
                {
                  href: "/instructeur/berichten",
                  icon: Send,
                  label: "Bericht sturen",
                },
              ].map((item) => (
                <Button
                  key={item.label}
                  asChild
                  variant="ghost"
                  className="h-10 w-full justify-between rounded-lg px-3 text-slate-200 hover:bg-white/10 hover:text-white"
                >
                  <Link href={item.href}>
                    <span className="inline-flex items-center gap-2">
                      <item.icon className="size-4 text-slate-400" />
                      {item.label}
                    </span>
                    <ChevronRight className="size-4 text-slate-500" />
                  </Link>
                </Button>
              ))}
            </div>
          </CommandPanel>

          <CommandPanel>
            <SectionHeader title="Statistieken" />
            <div className="space-y-3 text-sm">
              {[
                {
                  icon: CalendarDays,
                  label: "Totale lessen gegeven",
                  value: `${completedLessons.length}`,
                },
                {
                  icon: Clock3,
                  label: "Uren deze maand",
                  value: `${Math.floor(lessonHoursThisMonth / 60)}u ${lessonHoursThisMonth % 60}m`,
                },
                {
                  icon: Euro,
                  label: "Gem. lesduur",
                  value: lessonsThisMonth.length
                    ? `${Math.round(lessonHoursThisMonth / lessonsThisMonth.length)} min`
                    : "0 min",
                },
                {
                  icon: XCircle,
                  label: "Annuleringspercentage",
                  value: `${cancellationRate}%`,
                },
                {
                  icon: PackageCheck,
                  label: "Actieve pakketten",
                  value: `${activePackages.length}`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 border-b border-white/8 pb-2 last:border-b-0 last:pb-0"
                >
                  <span className="inline-flex min-w-0 items-center gap-2 text-slate-400">
                    <item.icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </CommandPanel>
        </aside>
      </div>

      <CommandPanel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/18 text-blue-100 ring-1 ring-blue-400/20">
            <Bell className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Tip van de week</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">{tipText}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[12px] text-slate-400">
          <CheckCircle2 className="size-4 text-emerald-300" />
          {unreadNotifications.length
            ? `${unreadNotifications.length} ongelezen melding${unreadNotifications.length === 1 ? "" : "en"}`
            : "Geen open meldingen"}
        </div>
      </CommandPanel>
    </div>
  );
}
