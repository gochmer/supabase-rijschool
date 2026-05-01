import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Euro,
  FileText,
  GraduationCap,
  MessageSquare,
  PackageCheck,
  Star,
  TrendingUp,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, getInitials } from "@/lib/format";
import type {
  BeschikbaarheidSlot,
  InstructorStudentProgressRow,
  Les,
  LesAanvraag,
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

const timeFormatter = new Intl.DateTimeFormat("nl-NL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

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

function isSameMonth(date: Date | null, reference: Date) {
  if (!date) {
    return false;
  }

  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function isSameYear(date: Date | null, reference: Date) {
  return Boolean(date && date.getFullYear() === reference.getFullYear());
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

function formatDate(
  value: string | null | undefined,
  fallback = "Nog niet gepland",
) {
  const date = getSafeDate(value);

  return date ? dateFormatter.format(date) : fallback;
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
  const buckets = Array.from({ length: 8 }, () => 0);
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

function buildLessonBuckets(lessons: Les[], reference: Date) {
  const buckets = Array.from({ length: 10 }, (_, index) => ({
    label: `${index + 1}`,
    value: 0,
  }));
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

    buckets[bucketIndex].value += 1;
  });

  return buckets;
}

function getRequestStatusLabel(status: string) {
  switch (status) {
    case "aangevraagd":
      return "Nieuw";
    case "geaccepteerd":
      return "Geaccepteerd";
    case "ingepland":
      return "Ingepland";
    case "afgerond":
      return "Afgerond";
    case "geannuleerd":
      return "Geannuleerd";
    default:
      return status;
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "aangevraagd":
      return "border-blue-400/25 bg-blue-500/15 text-blue-100";
    case "geaccepteerd":
    case "afgerond":
      return "border-emerald-400/25 bg-emerald-500/15 text-emerald-100";
    case "ingepland":
      return "border-cyan-400/25 bg-cyan-500/15 text-cyan-100";
    case "geannuleerd":
    case "geweigerd":
      return "border-rose-400/25 bg-rose-500/15 text-rose-100";
    default:
      return "border-white/10 bg-white/10 text-slate-200";
  }
}

function getRequestDashboardHref(request: LesAanvraag) {
  const tab = request.status === "aangevraagd" ? "nu" : "verwerkt";
  return `/instructeur/aanvragen?focus=${encodeURIComponent(request.id)}&tab=${tab}#aanvraag-${request.id}`;
}

function getStudentDashboardHref(student: InstructorStudentProgressRow) {
  return `/instructeur/leerlingen?student=${encodeURIComponent(student.id)}`;
}

function getLessonDashboardHref(lesson: Les) {
  const zoekwaarde = lesson.leerling_naam || lesson.titel;
  return `/instructeur/lessen?zoek=${encodeURIComponent(zoekwaarde)}`;
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
        "rounded-xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_20px_60px_-44px_rgba(0,0,0,0.9)]",
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
  cta = "Bekijk alles",
}: {
  title: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {href ? (
        <Button
          asChild
          size="xs"
          variant="ghost"
          className="border border-white/10 bg-white/7 text-slate-200 hover:bg-white/12 hover:text-white"
        >
          <Link href={href}>{cta}</Link>
        </Button>
      ) : null}
    </div>
  );
}

function StatTile({
  label,
  value,
  helper,
  trend,
  href,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  trend: string;
  href: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "amber" | "purple";
}) {
  const toneClass = {
    blue: "bg-blue-500/18 text-blue-100 ring-blue-400/20",
    green: "bg-emerald-500/18 text-emerald-100 ring-emerald-400/20",
    amber: "bg-orange-500/18 text-orange-100 ring-orange-400/20",
    purple: "bg-violet-500/18 text-violet-100 ring-violet-400/20",
  }[tone];

  return (
    <Link
      href={href}
      className="group rounded-xl border border-white/10 bg-white/[0.055] p-4 transition hover:border-white/18 hover:bg-white/[0.08]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-slate-300">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-lg ring-1",
            toneClass,
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-2 text-[12px]">
        <span className="text-slate-400">{helper}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
          <TrendingUp className="size-3.5" />
          {trend}
        </span>
      </div>
    </Link>
  );
}

function InitialAvatar({ name }: { name: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[12px] font-semibold text-white">
      {getInitials(name || "RB")}
    </span>
  );
}

function MiniLineChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values.length ? values : [0];
  const polyline = points
    .map((value, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
      const y = 92 - (value / max) * 72;

      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,100 ${polyline} 100,100`;

  return (
    <div className="h-44 rounded-lg border border-white/8 bg-slate-950/22 p-3">
      <svg viewBox="0 0 100 100" className="h-full w-full" role="img">
        <defs>
          <linearGradient id="income-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(249 115 22)" stopOpacity="0.38" />
            <stop
              offset="100%"
              stopColor="rgb(249 115 22)"
              stopOpacity="0.02"
            />
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
        <polygon points={area} fill="url(#income-area)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="rgb(249 115 22)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
      </svg>
    </div>
  );
}

function MiniBarChart({
  buckets,
}: {
  buckets: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...buckets.map((bucket) => bucket.value), 1);

  return (
    <div className="flex h-44 items-end gap-2 rounded-lg border border-white/8 bg-slate-950/22 px-3 py-4">
      {buckets.map((bucket, index) => {
        const height = Math.max(10, Math.round((bucket.value / max) * 124));

        return (
          <div
            key={`${bucket.label}-${index}`}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <div
              className="w-full rounded-t-sm bg-gradient-to-t from-blue-600 to-sky-400"
              style={{ height }}
              title={`${bucket.value} lessen`}
            />
            <span className="text-[10px] text-slate-500">{bucket.label}</span>
          </div>
        );
      })}
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

export function InstructorCommandCenter({
  lessons,
  requests,
  notifications,
  instructor,
  profileName,
  packages,
  availabilitySlots,
  students,
  realtime,
}: InstructorCommandCenterProps) {
  const now = new Date();
  const previousMonth = getPreviousMonth(now);
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
  const yearlyCompletedLessons = completedLessons.filter((lesson) =>
    isSameYear(getLessonDate(lesson), now),
  );
  const incomeThisMonth = completedThisMonth.length * lessonPrice;
  const incomePreviousMonth = completedPreviousMonth.length * lessonPrice;
  const incomeTrend = getPercentChange(incomeThisMonth, incomePreviousMonth);
  const lessonsTrend = getPercentChange(
    lessonsThisMonth.length,
    lessonsPreviousMonth.length,
  );
  const sortedRequests = [...requests].sort((left, right) =>
    (right.start_at ?? right.voorkeursdatum).localeCompare(
      left.start_at ?? left.voorkeursdatum,
    ),
  );
  const upcomingSlots = [...availabilitySlots]
    .sort((left, right) =>
      (left.start_at ?? left.dag).localeCompare(right.start_at ?? right.dag),
    )
    .slice(0, 7);
  const sortedStudents = [...students].sort(
    (left, right) => right.voortgang - left.voortgang,
  );
  const recentLessons = [...lessons]
    .sort((left, right) => {
      const leftDate = getLessonDate(left)?.getTime() ?? 0;
      const rightDate = getLessonDate(right)?.getTime() ?? 0;

      return rightDate - leftDate;
    })
    .slice(0, 6);
  const incomeSeries = buildIncomeSeries(completedLessons, lessonPrice, now);
  const lessonBuckets = buildLessonBuckets(lessons, now);
  const yearlyIncome = yearlyCompletedLessons.length * lessonPrice;
  const averageRating = Number(instructor?.beoordeling ?? 0);
  const reviewCount = Number(instructor?.aantal_reviews ?? 0);
  const displayName = profileName ?? "RijBasis";
  const tipText = getTipText({
    openRequestCount: openRequests.length,
    openSlotCount: availableSlots.length,
    activePackageCount: activePackages.length,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-400 uppercase">
            Instructeur overzicht
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Welkom terug, {displayName}. Alles wat vandaag telt staat hier
            compact bij elkaar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {realtime}
          <Button
            asChild
            size="sm"
            className="bg-white text-slate-950 hover:bg-slate-200"
          >
            <Link href="/instructeur/beschikbaarheid">
              <CalendarDays className="size-4" />
              Agenda
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Aanvragen"
          value={`${openRequests.length}`}
          helper="Open opvolging"
          trend={openRequests.length ? "Actie" : "Rustig"}
          href="/instructeur/aanvragen"
          icon={FileText}
          tone="purple"
        />
        <StatTile
          label="Leerlingen"
          value={`${students.length}`}
          helper="Actieve trajecten"
          trend={`${sortedStudents.filter((student) => student.voortgang >= 70).length} ver`}
          href="/instructeur/leerlingen"
          icon={UsersRound}
          tone="green"
        />
        <StatTile
          label="Lessen"
          value={`${lessonsThisMonth.length}`}
          helper="Deze maand"
          trend={formatPercent(lessonsTrend)}
          href="/instructeur/lessen"
          icon={CalendarDays}
          tone="blue"
        />
        <StatTile
          label="Inkomen"
          value={formatCurrency(incomeThisMonth)}
          helper="Geschat deze maand"
          trend={formatPercent(incomeTrend)}
          href="/instructeur/inkomsten"
          icon={WalletCards}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CommandPanel>
          <SectionHeader
            title="Inkomen overzicht"
            href="/instructeur/inkomsten"
          />
          <div className="mb-4">
            <p className="text-3xl font-semibold tracking-tight text-white">
              {formatCurrency(incomeThisMonth)}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Geschatte omzet op afgeronde lessen deze maand
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-300">
              <TrendingUp className="size-3.5" />
              {formatPercent(incomeTrend)} vs vorige maand
            </p>
          </div>
          <MiniLineChart values={incomeSeries} />
        </CommandPanel>

        <CommandPanel>
          <SectionHeader title="Lessen overzicht" href="/instructeur/lessen" />
          <div className="mb-4">
            <p className="text-3xl font-semibold tracking-tight text-white">
              {lessonsThisMonth.length}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Alle lessen in deze maand
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-300">
              <TrendingUp className="size-3.5" />
              {formatPercent(lessonsTrend)} vs vorige maand
            </p>
          </div>
          <MiniBarChart buckets={lessonBuckets} />
        </CommandPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CommandPanel>
          <SectionHeader
            title="Recente aanvragen"
            href="/instructeur/aanvragen"
          />
          <div className="space-y-3">
            {sortedRequests.slice(0, 5).length ? (
              sortedRequests.slice(0, 5).map((request) => (
                <Link
                  key={request.id}
                  href={getRequestDashboardHref(request)}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/7"
                >
                  <InitialAvatar name={request.leerling_naam} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {request.leerling_naam}
                    </p>
                    <p className="truncate text-[12px] text-slate-400">
                      {request.aanvraag_type === "proefles"
                        ? "Proefles"
                        : (request.pakket_naam ?? "Lesaanvraag")}{" "}
                      - {formatDate(request.start_at ?? request.voorkeursdatum)}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "border px-2 py-1 text-[11px]",
                      getStatusBadgeClass(request.status),
                    )}
                  >
                    {getRequestStatusLabel(request.status)}
                  </Badge>
                </Link>
              ))
            ) : (
              <EmptyState text="Geen recente aanvragen. Nieuwe lesaanvragen verschijnen hier zodra ze binnenkomen." />
            )}
          </div>
        </CommandPanel>

        <CommandPanel>
          <SectionHeader
            title="Beschikbaarheid komende week"
            href="/instructeur/beschikbaarheid"
            cta="Bekijk kalender"
          />
          <div className="space-y-2">
            {upcomingSlots.length ? (
              upcomingSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg px-2 py-2 text-sm"
                >
                  <p className="truncate font-semibold text-white">
                    {formatWeekday(slot.start_at, slot.dag)}
                  </p>
                  <span className="text-[12px] text-slate-400">
                    {formatTime(slot.start_at, slot.tijdvak)}
                    {slot.eind_at ? ` - ${formatTime(slot.eind_at)}` : ""}
                  </span>
                  <Badge
                    className={cn(
                      "border px-2 py-1 text-[11px]",
                      slot.beschikbaar
                        ? "border-emerald-400/25 bg-emerald-500/15 text-emerald-100"
                        : "border-rose-400/25 bg-rose-500/15 text-rose-100",
                    )}
                  >
                    {slot.beschikbaar ? "Beschikbaar" : "Bezet"}
                  </Badge>
                </div>
              ))
            ) : (
              <EmptyState text="Nog geen beschikbaarheid ingevuld. Zet een paar vaste blokken open voor meer directe boekingen." />
            )}
          </div>
        </CommandPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CommandPanel>
          <SectionHeader
            title="Leerlingen overzicht"
            href="/instructeur/leerlingen"
          />
          <div className="space-y-3">
            {sortedStudents.slice(0, 5).length ? (
              sortedStudents.slice(0, 5).map((student) => (
                <Link
                  key={student.id}
                  href={getStudentDashboardHref(student)}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/7"
                >
                  <InitialAvatar name={student.naam} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {student.naam}
                    </p>
                    <p className="truncate text-[12px] text-slate-400">
                      {student.gekoppeldeLessen} lessen - {student.volgendeLes}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, student.voortgang))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-200">
                    {student.voortgang}%
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState text="Nog geen gekoppelde leerlingen. Geaccepteerde aanvragen verschijnen hier automatisch." />
            )}
          </div>
        </CommandPanel>

        <CommandPanel>
          <SectionHeader
            title="Pakketten overzicht"
            href="/instructeur/pakketten"
          />
          <div className="space-y-3">
            {packages.slice(0, 5).length ? (
              packages.slice(0, 5).map((pkg, index) => {
                const colors = [
                  "bg-orange-500/18 text-orange-100 ring-orange-400/20",
                  "bg-rose-500/18 text-rose-100 ring-rose-400/20",
                  "bg-blue-500/18 text-blue-100 ring-blue-400/20",
                  "bg-violet-500/18 text-violet-100 ring-violet-400/20",
                  "bg-emerald-500/18 text-emerald-100 ring-emerald-400/20",
                ];

                return (
                  <Link
                    key={pkg.id}
                    href="/instructeur/pakketten"
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/7"
                  >
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg ring-1",
                        colors[index % colors.length],
                      )}
                    >
                      <PackageCheck className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {pkg.naam}
                      </p>
                      <p className="text-[12px] text-slate-400">
                        {formatCurrency(Number(pkg.prijs ?? 0))} - {pkg.lessen}{" "}
                        lessen
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "border px-2 py-1 text-[11px]",
                        pkg.actief === false
                          ? "border-white/10 bg-white/10 text-slate-300"
                          : "border-emerald-400/25 bg-emerald-500/15 text-emerald-100",
                      )}
                    >
                      {pkg.actief === false ? "Concept" : "Actief"}
                    </Badge>
                  </Link>
                );
              })
            ) : (
              <EmptyState text="Nog geen pakketten. Maak een proefles of starterspakket zodat leerlingen sneller kiezen." />
            )}
          </div>
        </CommandPanel>
      </div>

      <CommandPanel>
        <SectionHeader title="Recente lessen" href="/instructeur/lessen" />
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                <th className="px-2 py-1">Leerling</th>
                <th className="px-2 py-1">Datum</th>
                <th className="px-2 py-1">Tijd</th>
                <th className="px-2 py-1">Duur</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Type</th>
                <th className="px-2 py-1">Actie</th>
              </tr>
            </thead>
            <tbody>
              {recentLessons.length ? (
                recentLessons.map((lesson) => (
                  <tr
                    key={lesson.id}
                    className="rounded-lg bg-white/[0.035] text-slate-200"
                  >
                    <td className="rounded-l-lg px-2 py-2">
                      <div className="flex items-center gap-2">
                        <InitialAvatar name={lesson.leerling_naam} />
                        <span className="font-semibold text-white">
                          {lesson.leerling_naam}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      {formatDate(lesson.start_at ?? lesson.datum)}
                    </td>
                    <td className="px-2 py-2">
                      {formatTime(lesson.start_at, lesson.tijd)}
                    </td>
                    <td className="px-2 py-2">{lesson.duur_minuten} min</td>
                    <td className="px-2 py-2">
                      <Badge
                        className={cn(
                          "border px-2 py-1 text-[11px]",
                          getStatusBadgeClass(lesson.status),
                        )}
                      >
                        {getRequestStatusLabel(lesson.status)}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-slate-300">{lesson.titel}</td>
                    <td className="rounded-r-lg px-2 py-2">
                      <Button
                        asChild
                        size="xs"
                        variant="ghost"
                        className="border border-white/10 bg-white/7 text-slate-100 hover:bg-white/12 hover:text-white"
                      >
                        <Link href={getLessonDashboardHref(lesson)}>Open</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <EmptyState text="Nog geen lessen gevonden. Zodra je lessen plant of afrondt, komt deze tabel tot leven." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CommandPanel>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CommandPanel className="text-center">
          <Euro className="mx-auto size-9 rounded-lg bg-emerald-500/16 p-2 text-emerald-200" />
          <p className="mt-3 text-2xl font-semibold text-white">
            {formatCurrency(yearlyIncome)}
          </p>
          <p className="mt-1 text-[12px] text-slate-400">
            Totaal inkomen dit jaar
          </p>
        </CommandPanel>
        <CommandPanel className="text-center">
          <Clock3 className="mx-auto size-9 rounded-lg bg-blue-500/16 p-2 text-blue-200" />
          <p className="mt-3 text-2xl font-semibold text-white">
            {lessons.length}
          </p>
          <p className="mt-1 text-[12px] text-slate-400">Totaal lessen</p>
        </CommandPanel>
        <CommandPanel className="text-center">
          <GraduationCap className="mx-auto size-9 rounded-lg bg-violet-500/16 p-2 text-violet-200" />
          <p className="mt-3 text-2xl font-semibold text-white">
            {students.length}
          </p>
          <p className="mt-1 text-[12px] text-slate-400">Totaal leerlingen</p>
        </CommandPanel>
        <CommandPanel className="text-center">
          <Star className="mx-auto size-9 rounded-lg bg-orange-500/16 p-2 text-orange-200" />
          <p className="mt-3 text-2xl font-semibold text-white">
            {averageRating ? averageRating.toFixed(1) : "0.0"}
          </p>
          <p className="mt-1 text-[12px] text-slate-400">
            Gemiddelde beoordeling - {reviewCount} reviews
          </p>
        </CommandPanel>
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

      <div className="grid gap-3 sm:grid-cols-3">
        <Button
          asChild
          variant="outline"
          className="border-white/10 bg-white/7 text-white hover:bg-white/12"
        >
          <Link href="/instructeur/aanvragen">
            <FileText className="size-4" />
            Aanvragen beheren
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="border-white/10 bg-white/7 text-white hover:bg-white/12"
        >
          <Link href="/instructeur/berichten">
            <MessageSquare className="size-4" />
            Berichten openen
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="border-white/10 bg-white/7 text-white hover:bg-white/12"
        >
          <Link href="/instructeur/pakketten">
            <PackageCheck className="size-4" />
            Pakketten verbeteren
          </Link>
        </Button>
      </div>
    </div>
  );
}
