"use client";

import { useMemo, useState } from "react";

import { LessonCalendar } from "@/components/calendar/lesson-calendar";
import { DataTableCard } from "@/components/dashboard/data-table-card";
import { LessonAttendanceActions } from "@/components/dashboard/lesson-attendance-actions";
import { LessonEditDialog } from "@/components/dashboard/lesson-edit-dialog";
import { LessonFocusCard } from "@/components/dashboard/lesson-focus-card";
import { LessonNoteEditor } from "@/components/dashboard/lesson-note-editor";
import { LessonQuickActions } from "@/components/dashboard/lesson-quick-actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getLessonAttendanceLabel,
  getLessonAttendanceVariant,
} from "@/lib/lesson-utilities";
import type { Les, LesAanvraag, LocationOption } from "@/lib/types";

function getLessonSortValue(lesson: Les) {
  if (!lesson.start_at) {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsed = new Date(lesson.start_at).getTime();
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function LessonActionCard({
  lesson,
  locationOptions,
}: {
  lesson: Les;
  locationOptions: LocationOption[];
}) {
  return (
    <div className="grid gap-3 rounded-[1.35rem] border border-white/70 bg-white/84 p-3.5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.6)] sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-slate-950 dark:text-white">
            {lesson.titel}
          </p>
          <Badge
            variant={
              lesson.status === "geannuleerd"
                ? "danger"
                : lesson.status === "afgerond"
                  ? "success"
                  : "info"
            }
          >
            {lesson.status}
          </Badge>
          <Badge variant={getLessonAttendanceVariant(lesson.attendance_status)}>
            {getLessonAttendanceLabel(lesson.attendance_status)}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {lesson.datum} om {lesson.tijd} • {lesson.leerling_naam}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {lesson.locatie}
        </p>
        <LessonQuickActions lesson={lesson} className="mt-3" />
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          <LessonAttendanceActions lesson={lesson} />
          <LessonNoteEditor lesson={lesson} />
        </div>
      </div>
      <LessonEditDialog lesson={lesson} locationOptions={locationOptions} />
    </div>
  );
}

export function LessonsBoard({
  lessons,
  requests = [],
  locationOptions = [],
}: {
  lessons: Les[];
  requests?: LesAanvraag[];
  locationOptions?: LocationOption[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("alles");

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesQuery =
        `${lesson.titel} ${lesson.leerling_naam} ${lesson.locatie} ${lesson.lesson_note ?? ""} ${lesson.attendance_reason ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "alles" ? true : lesson.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [lessons, query, statusFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesQuery =
        `${request.leerling_naam} ${request.aanvraag_type ?? ""} ${request.pakket_naam ?? ""} ${request.tijdvak} ${request.bericht}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "alles" ? true : request.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, requests, statusFilter]);

  const sortedLessons = useMemo(
    () =>
      [...filteredLessons].sort(
        (left, right) => getLessonSortValue(left) - getLessonSortValue(right)
      ),
    [filteredLessons]
  );

  const nextPlannedLesson = useMemo(
    () =>
      sortedLessons.find((lesson) =>
        ["geaccepteerd", "ingepland"].includes(lesson.status)
      ) ?? null,
    [sortedLessons]
  );

  const todayLessons = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    return sortedLessons.filter((lesson) => {
      const startValue = getLessonSortValue(lesson);
      return (
        startValue >= startOfToday.getTime() &&
        startValue < endOfToday.getTime()
      );
    });
  }, [sortedLessons]);

  const upcomingLessons = useMemo(
    () =>
      sortedLessons.filter((lesson) =>
        ["geaccepteerd", "ingepland"].includes(lesson.status)
      ),
    [sortedLessons]
  );

  const dayLessons = useMemo(
    () => (todayLessons.length ? todayLessons : upcomingLessons).slice(0, 6),
    [todayLessons, upcomingLessons]
  );

  const wrapUpLessons = useMemo(() => {
    const needingFollowUp = sortedLessons.filter((lesson) => {
      if (
        !["ingepland", "geaccepteerd", "afgerond", "geannuleerd"].includes(
          lesson.status
        )
      ) {
        return false;
      }

      const missingAttendance =
        !lesson.attendance_status || lesson.attendance_status === "onbekend";
      const missingNote = !(lesson.lesson_note ?? "").trim();

      return missingAttendance || missingNote;
    });

    return needingFollowUp.slice(0, 8);
  }, [sortedLessons]);

  const openRequestsCount = useMemo(
    () =>
      filteredRequests.filter((request) => request.status === "aangevraagd")
        .length,
    [filteredRequests]
  );

  const completedThisSelectionCount = useMemo(
    () =>
      filteredLessons.filter((lesson) => lesson.status === "afgerond").length,
    [filteredLessons]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-[1.7rem] border border-white/70 bg-white/84 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.6)]">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_13rem]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Zoek op les, leerling of locatie"
            className="h-10 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="native-select h-10 rounded-xl px-3 text-sm"
          >
            <option value="alles">Alle statussen</option>
            <option value="aangevraagd">Aangevraagd</option>
            <option value="ingepland">Ingepland</option>
            <option value="geaccepteerd">Geaccepteerd</option>
            <option value="geweigerd">Geweigerd</option>
            <option value="afgerond">Afgerond</option>
            <option value="geannuleerd">Geannuleerd</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="info" className="rounded-full px-2.5 py-1 text-[11px]">
            Vandaag {todayLessons.length} lessen
          </Badge>
          <Badge
            variant="success"
            className="rounded-full px-2.5 py-1 text-[11px]"
          >
            Deze selectie {filteredLessons.length} lessen
          </Badge>
          <Badge
            variant="warning"
            className="rounded-full px-2.5 py-1 text-[11px]"
          >
            Af te handelen {wrapUpLessons.length}
          </Badge>
          <Badge
            variant="default"
            className="rounded-full px-2.5 py-1 text-[11px]"
          >
            Open aanvragen {openRequestsCount}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="dag" className="space-y-4">
        <TabsList className="sticky top-28 z-10 !h-auto min-h-12 w-full justify-start overflow-x-auto overflow-y-hidden rounded-[1.4rem] border border-white/60 bg-white/85 p-1 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.32)] [-ms-overflow-style:none] [scrollbar-width:none] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72 [&::-webkit-scrollbar]:hidden">
          <TabsTrigger
            value="dag"
            className="min-h-10 gap-2 rounded-[1rem] px-3 text-sm data-active:bg-sky-200 data-active:text-slate-950"
          >
            Vandaag
            <span className="rounded-full bg-slate-950/8 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-200">
              {dayLessons.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="week"
            className="min-h-10 gap-2 rounded-[1rem] px-3 text-sm data-active:bg-emerald-200 data-active:text-slate-950"
          >
            Week
            <span className="rounded-full bg-slate-950/8 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-200">
              {filteredLessons.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="afhandelen"
            className="min-h-10 gap-2 rounded-[1rem] px-3 text-sm data-active:bg-amber-200 data-active:text-slate-950"
          >
            Afhandelen
            <span className="rounded-full bg-slate-950/8 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-200">
              {wrapUpLessons.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dag" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-4">
              <LessonFocusCard
                lesson={nextPlannedLesson}
                title="Volgende les in focus"
                description={
                  nextPlannedLesson
                    ? `Praktisch overzicht voor ${nextPlannedLesson.leerling_naam}. Werk vandaag vanuit je eerstvolgende les en handel daarna direct door.`
                    : undefined
                }
              />

              <div className="space-y-3">
                {dayLessons.length ? (
                  dayLessons.map((lesson) => (
                    <LessonActionCard
                      key={lesson.id}
                      lesson={lesson}
                      locationOptions={locationOptions}
                    />
                  ))
                ) : (
                  <div className="rounded-[1.35rem] border border-dashed border-slate-300/80 bg-white/80 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    Er staan nog geen lessen klaar binnen deze selectie. Pas je
                    filters aan of plan een nieuwe les in vanuit je
                    leerlingwerkplek.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-[1.35rem] border border-white/70 bg-white/84 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.6)]">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  Vandaag slimst
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Begin met lessen die vandaag lopen en rond daarna de lessen af
                  waar nog aanwezigheid of notities missen.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[1.2rem] border border-white/70 bg-white/84 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Open aanvragen
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                    {openRequestsCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Handig om vandaag nog te bevestigen of af te stemmen.
                  </p>
                </div>

                <div className="rounded-[1.2rem] border border-white/70 bg-white/84 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Afgerond
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                    {completedThisSelectionCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Lessen met status afgerond binnen deze selectie.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <LessonCalendar
            lessons={filteredLessons}
            requests={filteredRequests}
            title="Weekoverzicht"
            description="Bekijk je bevestigde lessen en open aanvragen in kalenderweergave, zodat je snel ziet waar je ruimte of drukte hebt."
            emptyDescription="Er zijn nog geen lessen of aanvragen die aan deze filters voldoen. Pas je zoekopdracht aan of plan nieuwe lessen in."
          />

          <DataTableCard
            title="Lessenoverzicht"
            description="Compacte lijst voor planning, terugzoeken en snelle controle."
            headers={["Les", "Leerling", "Datum", "Status", "Locatie"]}
            rows={filteredLessons.map((lesson) => [
              lesson.titel,
              lesson.leerling_naam,
              `${lesson.datum} - ${lesson.tijd}`,
              lesson.status,
              lesson.locatie,
            ])}
            badgeColumns={[3]}
            emptyTitle="Geen lessen gevonden"
            emptyDescription="Probeer een andere zoekterm of statusfilter."
          />
        </TabsContent>

        <TabsContent value="afhandelen" className="space-y-4">
          <div className="rounded-[1.35rem] border border-white/70 bg-white/84 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.6)]">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Af te handelen lessen
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Rond hier lessen af die nog aanwezigheid, notities of een laatste
              check missen.
            </p>
          </div>

          <div className="space-y-3">
            {wrapUpLessons.length ? (
              wrapUpLessons.map((lesson) => (
                <LessonActionCard
                  key={lesson.id}
                  lesson={lesson}
                  locationOptions={locationOptions}
                />
              ))
            ) : (
              <div className="rounded-[1.35rem] border border-dashed border-slate-300/80 bg-white/80 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Alles staat netjes bijgewerkt. Er zijn binnen deze selectie geen
                lessen meer die nog aandacht nodig hebben.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
