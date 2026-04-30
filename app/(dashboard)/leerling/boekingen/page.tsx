import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  MapPin,
  UserRound,
} from "lucide-react";

import { LessonCalendar } from "@/components/calendar/lesson-calendar";
import { LearnerLessonActions } from "@/components/dashboard/learner-lesson-actions";
import { LessonFocusCard } from "@/components/dashboard/lesson-focus-card";
import { LessonQuickActions } from "@/components/dashboard/lesson-quick-actions";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { LearnerRequestOverview } from "@/components/dashboard/learner-request-overview";
import { PageHeader } from "@/components/dashboard/page-header";
import { LessonRequestDialog } from "@/components/instructors/lesson-request-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getLeerlingLessonRequests,
  getLeerlingLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentLearnerBookingOverview } from "@/lib/data/student-scheduling";
import {
  getLessonAttendanceLabel,
  getLessonAttendanceVariant,
} from "@/lib/lesson-utilities";
import {
  formatMinutesAsHoursLabel,
  formatWeeklyLimitLabel,
} from "@/lib/self-scheduling-limits";
import { cn } from "@/lib/utils";

function getRequestLabel(request: {
  aanvraag_type?: "algemeen" | "pakket" | "proefles";
  pakket_naam?: string | null;
}) {
  if (request.aanvraag_type === "proefles") {
    return "Proefles";
  }

  if (request.aanvraag_type === "pakket") {
    return request.pakket_naam ?? "Pakketaanvraag";
  }

  return request.pakket_naam ?? "Losse aanvraag";
}

function getWeeklyLimitSourceLabel(source: "manual" | "package" | "none") {
  if (source === "manual") {
    return "Handmatig afgestemd";
  }

  if (source === "package") {
    return "Volgt pakket";
  }

  return "Geen vaste limiet";
}

function getWeeklyLimitSourceVariant(source: "manual" | "package" | "none") {
  if (source === "manual") {
    return "warning" as const;
  }

  if (source === "package") {
    return "success" as const;
  }

  return "default" as const;
}

const urbanCardClassName =
  "rounded-[1.9rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.72)]";

const tabTriggerClassName =
  "h-10 rounded-full px-4 text-slate-300 data-active:text-slate-950";

export default async function LeerlingBoekingenPage() {
  const [requests, lessons, bookingOverview] = await Promise.all([
    getLeerlingLessonRequests(),
    getLeerlingLessons(),
    getCurrentLearnerBookingOverview(),
  ]);

  const pendingRequests = requests.filter(
    (item) => item.status === "aangevraagd"
  ).length;
  const plannedLessons = lessons.filter(
    (item) => item.status === "ingepland" || item.status === "geaccepteerd"
  ).length;
  const nextLesson = lessons.find(
    (item) => item.status === "ingepland" || item.status === "geaccepteerd"
  );
  const totalOpenSlots = bookingOverview.eligibleInstructors.reduce(
    (total, item) => total + item.availableSlots.length,
    0
  );
  const totalTrialSlots = bookingOverview.eligibleInstructors.reduce(
    (total, item) => total + item.trialAvailableSlots.length,
    0
  );
  const activeInstructorCount =
    bookingOverview.eligibleInstructors.length +
    bookingOverview.waitingApprovalInstructors.length;
  const requestsWithLabels = requests.map((request) => ({
    ...request,
    pakket_naam: request.pakket_naam ?? getRequestLabel(request),
  }));
  const planningStats = [
    {
      icon: CalendarDays,
      label: "Volgende les",
      value: nextLesson ? nextLesson.datum : "Nog niet ingepland",
      tone: nextLesson ? "emerald" : "sky",
      detail: nextLesson
        ? `${nextLesson.tijd} met ${nextLesson.instructeur_naam}`
        : "Plan zodra je een instructeur hebt gekozen.",
    },
    {
      icon: Clock3,
      label: "Open aanvragen",
      value: `${pendingRequests}`,
      tone: pendingRequests > 0 ? "amber" : "emerald",
      detail:
        pendingRequests > 0
          ? "Wachten nog op reactie van instructeurs."
          : "Geen losse opvolging nodig.",
    },
    {
      icon: UserRound,
      label: "Actieve instructeurs",
      value: `${activeInstructorCount}`,
      tone: activeInstructorCount > 0 ? "cyan" : "rose",
      detail:
        activeInstructorCount > 0
          ? "Je kunt vanuit deze koppelingen plannen of volgen."
          : "Start met een aanvraag bij een instructeur.",
    },
    {
      icon: MapPin,
      label: "Vrije blokken",
      value: `${totalOpenSlots}`,
      tone: totalOpenSlots > 0 ? "violet" : "sky",
      detail:
        totalOpenSlots > 0
          ? `${totalTrialSlots} proeflesblok${totalTrialSlots === 1 ? "" : "ken"} beschikbaar.`
          : "Nog geen vrij planblok open.",
    },
  ] as const;
  const hasNoInstructorState =
    bookingOverview.totalKnownInstructors > 0 &&
    !bookingOverview.eligibleInstructors.length &&
    !bookingOverview.waitingApprovalInstructors.length &&
    !bookingOverview.pendingInstructors.length;

  return (
    <div className="space-y-6 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Planning"
        title="Boekingen en aanvragen"
        description="Alles rond plannen, aanvragen en bevestigde lessen staat nu in een compactere werkruimte met duidelijke tabs."
        actions={
          <>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/10 bg-white/6 text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.42)] backdrop-blur hover:bg-white/10"
            >
              <Link href="/leerling/berichten">Berichten openen</Link>
            </Button>
            <Button
              asChild
              className="rounded-full border border-white/12 bg-[linear-gradient(135deg,#f8fafc,#cbd5e1)] text-slate-950 shadow-[0_22px_46px_-26px_rgba(148,163,184,0.42)] hover:brightness-[1.03]"
            >
              <Link href="/leerling/instructeurs">Nieuwe aanvraag starten</Link>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="zelf-plannen" className="space-y-4">
        <TabsList className="sticky top-28 z-10 !h-auto min-h-12 w-full justify-start overflow-x-auto overflow-y-hidden rounded-[1.35rem] border border-white/10 bg-slate-950/72 p-1 text-slate-300 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.65)] [-ms-overflow-style:none] [scrollbar-width:none] backdrop-blur-xl [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="zelf-plannen" className={`${tabTriggerClassName} data-active:bg-sky-200`}>
            Zelf plannen
          </TabsTrigger>
          <TabsTrigger value="aanvragen" className={`${tabTriggerClassName} data-active:bg-amber-200`}>
            Aanvragen
          </TabsTrigger>
          <TabsTrigger value="lessen" className={`${tabTriggerClassName} data-active:bg-emerald-200`}>
            Lessen
          </TabsTrigger>
          <TabsTrigger value="agenda" className={`${tabTriggerClassName} data-active:bg-violet-200`}>
            Agenda
          </TabsTrigger>
        </TabsList>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {planningStats.map((item) => (
          <DashboardStatCard key={item.label} {...item} />
        ))}
      </div>

      <LessonFocusCard
        lesson={nextLesson}
        tone="urban"
        title="Je eerstvolgende les"
        description={
          nextLesson
            ? `Praktisch lesmoment met ${nextLesson.instructeur_naam}. Voeg hem toe aan je agenda of open direct je route.`
            : undefined
        }
      />

        <TabsContent value="zelf-plannen" className="mt-0">
          <div className={urbanCardClassName}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <Badge variant="info">Zelf inplannen</Badge>
                <h3 className="text-xl font-semibold text-white">
                  Plan alleen bij instructeurs die al aan jou gekoppeld zijn
                </h3>
                <p className="max-w-3xl text-sm leading-7 text-slate-300">
                  Je ziet alleen vrije blokken die je mag gebruiken. Details en limieten staan nu per instructeur achter een compacte uitklapkaart.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">
                  {bookingOverview.eligibleInstructors.length} open
                </Badge>
                <Badge variant="info">{totalOpenSlots} rijlesblokken</Badge>
                <Badge variant="warning">
                  {bookingOverview.pendingInstructors.length} in behandeling
                </Badge>
              </div>
            </div>

            {!bookingOverview.totalKnownInstructors ? (
              <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
                <p className="text-sm font-semibold text-white">
                  Je bent nog niet gekoppeld aan een instructeur
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Start eerst een aanvraag of proefles. Zodra een instructeur je accepteert, verschijnt hier vanzelf of je zelf mag plannen.
                </p>
                <Button
                  asChild
                  className="mt-4 rounded-full border border-white/12 bg-[linear-gradient(135deg,#f8fafc,#cbd5e1)] text-slate-950 shadow-[0_22px_46px_-26px_rgba(148,163,184,0.42)] hover:brightness-[1.03]"
                >
                  <Link href="/leerling/instructeurs">Instructeur kiezen</Link>
                </Button>
              </div>
            ) : null}

            {bookingOverview.totalKnownInstructors ? (
              <div className="mt-4 grid gap-3">
                {bookingOverview.eligibleInstructors.map((item) => (
                  <details
                    key={`eligible-${item.instructorId}`}
                    className="group overflow-hidden rounded-[1.35rem] border border-emerald-300/18 bg-emerald-400/8"
                  >
                    <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 transition hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-white">
                            {item.instructorName}
                          </p>
                          <Badge variant="success">Geaccepteerd</Badge>
                          <Badge
                            variant={item.directBookingAllowed ? "info" : "default"}
                          >
                            {item.directBookingAllowed
                              ? "Direct boeken"
                              : "Voorkeursblok"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {item.availableSlots.length} open rijlesblok
                          {item.availableSlots.length === 1 ? "" : "ken"} beschikbaar
                          {item.availableSlots[0]
                            ? `, eerst ${item.availableSlots[0].dag} - ${item.availableSlots[0].tijdvak}`
                            : "."}
                        </p>
                      </div>
                      <span className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 text-xs font-semibold text-slate-100">
                        Open plannen
                        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                      </span>
                    </summary>

                    <div className="space-y-4 border-t border-white/10 p-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={getWeeklyLimitSourceVariant(
                            item.weeklyBookingLimitSource
                          )}
                        >
                          {getWeeklyLimitSourceLabel(item.weeklyBookingLimitSource)}
                        </Badge>
                        <Badge variant="default">
                          Limiet{" "}
                          {formatWeeklyLimitLabel(item.weeklyBookingLimitMinutes)}
                        </Badge>
                        <Badge variant="default">
                          Gebruikt{" "}
                          {formatMinutesAsHoursLabel(
                            item.weeklyBookedMinutesThisWeek
                          )}
                        </Badge>
                        <Badge
                          variant={
                            item.weeklyRemainingMinutesThisWeek === 0
                              ? "warning"
                              : "success"
                          }
                        >
                          Over{" "}
                          {item.weeklyRemainingMinutesThisWeek == null
                            ? "onbeperkt"
                            : formatMinutesAsHoursLabel(
                                item.weeklyRemainingMinutesThisWeek
                              )}
                        </Badge>
                      </div>

                      {item.availableSlots.length ? (
                        <div className="flex flex-wrap gap-2">
                          {item.availableSlots.slice(0, 4).map((slot) => (
                            <span
                              key={slot.id}
                              className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-slate-200"
                            >
                              {slot.dag} - {slot.tijdvak}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-2xl border border-amber-300/18 bg-amber-400/8 px-3 py-2 text-sm leading-6 text-amber-100">
                          Nog geen rijlesblok open. Je kunt wel een nieuw moment aanvragen.
                        </p>
                      )}

                      {item.currentWeekLimitReached ? (
                        <p className="rounded-2xl border border-amber-300/18 bg-amber-400/8 px-3 py-2 text-sm leading-6 text-amber-100">
                          Je weekruimte is bereikt. Kies een later moment of vraag je instructeur om extra ruimte.
                        </p>
                      ) : null}

                      {!item.trialLessonAvailable ? (
                        <p className="text-[12px] leading-6 text-slate-300">
                          Je proefles is al gebruikt; je plant hier alleen vervolglessen.
                        </p>
                      ) : null}

                      <div
                        className={cn(
                          "grid gap-2",
                          item.trialLessonAvailable
                            ? "sm:grid-cols-2"
                            : "sm:grid-cols-1"
                        )}
                      >
                        <LessonRequestDialog
                          instructorName={item.instructorName}
                          instructorSlug={item.instructorSlug}
                          availableSlots={item.availableSlots}
                          directBookingEnabled={item.directBookingAllowed}
                          defaultDurationMinutes={item.regularLessonDurationMinutes}
                          weeklyBookingLimitMinutes={item.weeklyBookingLimitMinutes}
                          bookedMinutesByWeekStart={item.bookedMinutesByWeekStart}
                          weeklyRemainingMinutesThisWeek={
                            item.weeklyRemainingMinutesThisWeek
                          }
                          triggerLabel={
                            item.directBookingAllowed
                              ? item.availableSlots.length
                                ? "Plan rijles"
                                : "Vraag nieuw moment aan"
                              : item.availableSlots.length
                                ? "Kies rijlesmoment"
                                : "Vraag rijles aan"
                          }
                          triggerClassName="!h-10 !w-full"
                        />
                        {item.trialLessonAvailable ? (
                          <LessonRequestDialog
                            instructorName={item.instructorName}
                            instructorSlug={item.instructorSlug}
                            requestType="proefles"
                            availableSlots={item.trialAvailableSlots}
                            directBookingEnabled={item.directBookingAllowed}
                            defaultDurationMinutes={item.trialLessonDurationMinutes}
                            weeklyBookingLimitMinutes={item.weeklyBookingLimitMinutes}
                            bookedMinutesByWeekStart={item.bookedMinutesByWeekStart}
                            weeklyRemainingMinutesThisWeek={
                              item.weeklyRemainingMinutesThisWeek
                            }
                            triggerLabel={
                              item.directBookingAllowed
                                ? item.trialAvailableSlots.length
                                  ? "Plan proefles"
                                  : "Vraag proefles aan"
                                : item.trialAvailableSlots.length
                                  ? "Kies proeflesmoment"
                                  : "Vraag proefles aan"
                            }
                            triggerVariant="secondary"
                            triggerClassName="!h-10 !w-full"
                          />
                        ) : null}
                      </div>
                    </div>
                  </details>
                ))}

                {bookingOverview.waitingApprovalInstructors.map((item) => (
                  <div
                    key={`waiting-${item.instructorId}`}
                    className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-white">
                        {item.instructorName}
                      </p>
                      <Badge variant="default">Traject actief</Badge>
                      <Badge variant="warning">Wacht op vrijgave</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Deze instructeur moet zelf inplannen nog voor jou openzetten.
                    </p>
                  </div>
                ))}

                {bookingOverview.pendingInstructors.map((item) => (
                  <div
                    key={`pending-${item.instructorId}`}
                    className="rounded-[1.35rem] border border-amber-300/18 bg-amber-400/8 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-white">
                        {item.instructorName}
                      </p>
                      <Badge variant="warning">Aanvraag in behandeling</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Na acceptatie verschijnen hier de planmogelijkheden.
                    </p>
                  </div>
                ))}

                {hasNoInstructorState ? (
                  <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
                    <p className="font-semibold text-white">
                      Nog geen planopties beschikbaar
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Je koppelingen zijn bekend, maar er staat nog geen open planning klaar.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="aanvragen" className="mt-0">
          <LearnerRequestOverview
            tone="urban"
            title="Lesaanvragen"
            description="Compact overzicht van je aanvragen. Open alleen de aanvraag waarvan je details, statusflow of acties wilt zien."
            requests={requestsWithLabels}
            emptyTitle="Nog geen lesaanvragen"
            emptyDescription="Zodra je een aanvraag verstuurt, verschijnt hier automatisch je volledige statusoverzicht."
          />
        </TabsContent>

        <TabsContent value="lessen" className="mt-0">
          <div className={urbanCardClassName}>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="info">Geplande lessen</Badge>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Je bevestigde lessen
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-7 text-slate-300">
                  De lijst blijft compact; route, agenda en annuleren staan achter details.
                </p>
              </div>
              <Badge variant="success">{plannedLessons} actief</Badge>
            </div>

            {lessons.length ? (
              <div className="grid gap-3">
                {lessons.map((lesson) => (
                  <details
                    key={lesson.id}
                    className="group overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/6"
                  >
                    <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 transition hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          {lesson.titel}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          {lesson.datum} om {lesson.tijd} - {lesson.locatie}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="info">{lesson.status}</Badge>
                        <Badge
                          variant={getLessonAttendanceVariant(
                            lesson.attendance_status
                          )}
                        >
                          {getLessonAttendanceLabel(lesson.attendance_status)}
                        </Badge>
                        <span className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 text-xs font-semibold text-slate-100">
                          Details
                          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                        </span>
                      </div>
                    </summary>
                    <div className="border-t border-white/10 p-4">
                      {lesson.lesson_note?.trim() ? (
                        <p className="mb-3 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-[12px] leading-6 text-slate-300">
                          Coachnotitie: {lesson.lesson_note.trim()}
                        </p>
                      ) : null}
                      <LessonQuickActions lesson={lesson} tone="urban" />
                      <LearnerLessonActions lesson={lesson} />
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-slate-300">
                Geaccepteerde boekingen en ingeplande ritten worden hier direct zichtbaar.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="agenda" className="mt-0">
          <LessonCalendar
            lessons={lessons}
            requests={requests}
            tone="urban"
            title="Agenda"
            description="Je bevestigde lessen en open aanvragen staan samen in een kalenderbeeld."
            emptyDescription="Zodra een les of aanvraag een concreet moment heeft, verschijnt die hier automatisch in je agenda."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
