"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  MapPin,
  MoreVertical,
  Search,
  XCircle,
} from "lucide-react";

import { LessonCalendar } from "@/components/calendar/lesson-calendar";
import { LessonAttendanceActions } from "@/components/dashboard/lesson-attendance-actions";
import { LessonEditDialog } from "@/components/dashboard/lesson-edit-dialog";
import { LessonFocusCard } from "@/components/dashboard/lesson-focus-card";
import { LessonNoteEditor } from "@/components/dashboard/lesson-note-editor";
import { LessonQuickActions } from "@/components/dashboard/lesson-quick-actions";
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
import type { Les, LesAanvraag, LocationOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type LessonTab = "all" | "planned" | "completed" | "cancelled";
type LessonTypeFilter =
  | "all"
  | "proefles"
  | "losse-les"
  | "pakket"
  | "examenrit";

const pageSizeOptions = [6, 10, 20] as const;

const avatarTones = [
  "bg-violet-500/28 text-violet-100",
  "bg-fuchsia-500/24 text-fuchsia-100",
  "bg-emerald-500/24 text-emerald-100",
  "bg-cyan-500/24 text-cyan-100",
  "bg-amber-500/24 text-amber-100",
  "bg-rose-500/24 text-rose-100",
];

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

function getLessonSortValue(lesson: Les) {
  if (!lesson.start_at) {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsed = new Date(lesson.start_at).getTime();
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function getLessonDate(lesson: Les) {
  if (!lesson.start_at) {
    return null;
  }

  const date = new Date(lesson.start_at);
  return Number.isNaN(date.getTime()) ? null : date;
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
          className="size-9 rounded-lg border-white/10 bg-white/7 text-slate-200 hover:bg-white/12 hover:text-white"
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

function LessonMoreMenu({ lesson }: { lesson: Les }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Meer acties voor ${lesson.leerling_naam}`}
          title="Meer"
          size="icon-sm"
          variant="outline"
          className="size-9 rounded-lg border-white/10 bg-white/7 text-slate-200 hover:bg-white/12 hover:text-white"
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
  index,
  lesson,
  locationOptions,
}: {
  index: number;
  lesson: Les;
  locationOptions: LocationOption[];
}) {
  const statusPill = getStatusPill(lesson.status);
  const lessonType = getLessonType(lesson);
  const StatusIcon = statusPill.icon;

  return (
    <div className="grid min-w-[1080px] grid-cols-[250px_130px_210px_150px_120px_150px_160px_110px] items-center border-b border-white/10 px-2 py-4 text-sm last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            avatarTones[index % avatarTones.length],
          )}
        >
          {getInitials(lesson.leerling_naam || "LL")}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-white">
            {lesson.leerling_naam}
          </p>
          <p className="truncate text-sm text-slate-400">
            {lesson.leerling_email || "Geen e-mail bekend"}
          </p>
        </div>
      </div>

      <p className="text-slate-100">{lessonType.label}</p>
      <p className="truncate text-slate-100">{lesson.titel}</p>
      <div>
        <p className="text-slate-100">{formatLessonDate(lesson)}</p>
        <p className="mt-1 capitalize text-slate-400">
          {formatLessonWeekday(lesson)}
        </p>
      </div>
      <div>
        <p className="text-slate-100">{lesson.tijd}</p>
        <p className="mt-1 text-slate-400">{lesson.duur_minuten} min</p>
      </div>
      <span
        className={cn(
          "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium",
          statusPill.className,
        )}
      >
        <StatusIcon className="size-4" />
        {statusPill.label}
      </span>
      <div className="flex min-w-0 items-center gap-2 text-slate-100">
        <MapPin className="size-4 shrink-0 text-slate-400" />
        <span className="truncate">{lesson.locatie}</span>
      </div>
      <div className="flex items-center gap-2">
        <LessonDetailsDialog
          lesson={lesson}
          locationOptions={locationOptions}
        />
        <LessonMoreMenu lesson={lesson} />
      </div>
    </div>
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

export function LessonsBoard({
  lessons,
  requests = [],
  locationOptions = [],
  initialQuery = "",
}: {
  lessons: Les[];
  requests?: LesAanvraag[];
  locationOptions?: LocationOption[];
  initialQuery?: string;
}) {
  const [activeTab, setActiveTab] = useState<LessonTab>("all");
  const [query, setQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState<LessonTypeFilter>("all");
  const [pageSize, setPageSize] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);

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

  const totalPages = Math.max(1, Math.ceil(sortedLessons.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const firstItemIndex = sortedLessons.length ? (safePage - 1) * pageSize : 0;
  const visibleLessons = sortedLessons.slice(
    firstItemIndex,
    firstItemIndex + pageSize,
  );
  const paginationPages = getPaginationPages(safePage, totalPages);

  const tabs: Array<{ label: string; value: LessonTab }> = [
    { label: "Alle lessen", value: "all" },
    { label: "Ingepland", value: "planned" },
    { label: "Voltooid", value: "completed" },
    { label: "Geannuleerd", value: "cancelled" },
  ];

  const typeLabels: Record<LessonTypeFilter, string> = {
    all: "Alle types",
    examenrit: "Examenritten",
    "losse-les": "Losse lessen",
    pakket: "Pakketten",
    proefles: "Proeflessen",
  };

  return (
    <div className="space-y-4 text-white">
      <section className="overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(15,23,42,0.34))] p-4 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.95)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-5">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setActiveTab(tab.value);
                  setCurrentPage(1);
                }}
                className={cn(
                  "border-b-2 px-2 pb-3 text-base transition",
                  activeTab === tab.value
                    ? "border-blue-400 text-white"
                    : "border-transparent text-slate-400 hover:text-white",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Zoek lessen..."
                aria-label="Zoek lessen"
                className="h-11 w-full rounded-lg border-white/10 bg-slate-950/34 pl-10 text-white placeholder:text-slate-500 sm:w-72"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 rounded-lg border-white/10 bg-white/7 px-4 text-white hover:bg-white/12"
                >
                  <Filter className="size-5" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-60 border-white/10 bg-slate-950 text-slate-100"
              >
                <DropdownMenuLabel>Type les</DropdownMenuLabel>
                {(
                  [
                    "all",
                    "proefles",
                    "losse-les",
                    "pakket",
                    "examenrit",
                  ] as const
                ).map((value) => (
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
                    {typeLabels[value]}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setShowCalendar((current) => !current)}
                >
                  <CalendarRange className="size-4" />
                  {showCalendar ? "Kalender verbergen" : "Kalender tonen"}
                </DropdownMenuItem>
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

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[1080px]">
            <div className="grid grid-cols-[250px_130px_210px_150px_120px_150px_160px_110px] rounded-lg border border-white/10 bg-white/5 px-2 py-4 text-base text-slate-200">
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
                  index={firstItemIndex + index}
                  locationOptions={locationOptions}
                />
              ))
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/12 text-center">
                <Archive className="size-10 text-slate-500" />
                <p className="mt-4 font-semibold text-white">
                  Geen lessen gevonden
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Pas je zoekterm of filter aan, of plan een nieuwe les voor een
                  gekoppelde leerling.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 border-t border-white/10 pt-4 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
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
                className="size-9 rounded-lg border-white/10 bg-white/7 text-white disabled:opacity-40"
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
                        "size-9 rounded-lg",
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
                className="size-9 rounded-lg border-white/10 bg-white/7 text-white disabled:opacity-40"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <label className="flex items-center gap-3">
              Toon
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="h-10 rounded-lg border border-white/10 bg-slate-950/34 px-3 text-white outline-none"
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
      </section>

      {showCalendar ? (
        <LessonCalendar
          lessons={filteredLessons}
          requests={filteredRequests}
          role="instructeur"
          locationOptions={locationOptions}
          tone="urban"
          title="Kalenderweergave"
          description="Bekijk dezelfde selectie in kalenderweergave met lessen en open aanvragen."
          emptyDescription="Er zijn geen lessen of aanvragen die aan deze filters voldoen."
        />
      ) : null}
    </div>
  );
}
