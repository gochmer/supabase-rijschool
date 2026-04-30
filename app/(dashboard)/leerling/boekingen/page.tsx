import Link from "next/link";
import { CalendarDays, Clock3, MapPin } from "lucide-react";

import { LessonCalendar } from "@/components/calendar/lesson-calendar";
import { DataTableCard } from "@/components/dashboard/data-table-card";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { LessonFocusCard } from "@/components/dashboard/lesson-focus-card";
import { LearnerLessonActions } from "@/components/dashboard/learner-lesson-actions";
import { LessonQuickActions } from "@/components/dashboard/lesson-quick-actions";
import { LearnerRequestOverview } from "@/components/dashboard/learner-request-overview";
import { PageHeader } from "@/components/dashboard/page-header";
import { TrendCard } from "@/components/dashboard/trend-card";
import { LessonRequestDialog } from "@/components/instructors/lesson-request-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getLeerlingLessonRequests,
  getLeerlingLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentLearnerBookingOverview } from "@/lib/data/student-scheduling";
import {
  getLessonAttendanceLabel,
  getLessonAttendanceVariant,
} from "@/lib/lesson-utilities";
import { cn } from "@/lib/utils";
import {
  formatMinutesAsHoursLabel,
  formatWeeklyLimitLabel,
} from "@/lib/self-scheduling-limits";

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

  return (
    <div className="space-y-6 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Planning"
        title="Boekingen en aanvragen"
        description="Volg aanvragen, bevestigde lessen en de belangrijkste planningsinformatie in een rustige, luxe en professionele leeromgeving."
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

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: CalendarDays,
            label: "Volgende les",
            value: nextLesson
              ? `${nextLesson.datum} om ${nextLesson.tijd}`
              : "Nog niet ingepland",
            detail: nextLesson
              ? `${nextLesson.instructeur_naam} • ${nextLesson.locatie}`
              : "Bevestigde lessen verschijnen hier automatisch.",
          },
          {
            icon: Clock3,
            label: "Open aanvragen",
            value: `${pendingRequests}`,
            detail:
              pendingRequests > 0
                ? "Er wachten nog reacties op een of meer aanvragen."
                : "Er staan momenteel geen open aanvragen uit.",
          },
          {
            icon: MapPin,
            label: "Actieve planning",
            value: `${plannedLessons} les(sen)`,
            detail:
              plannedLessons > 0
                ? "Je planning staat klaar en blijft hier overzichtelijk in beeld."
                : "Zodra er lessen vastliggen wordt dit overzicht direct aangevuld.",
          },
        ].map((item) => (
          <div key={item.label} className={urbanCardClassName}>
            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-slate-100">
              <item.icon className="size-5" />
            </div>
            <p className="mt-4 text-[10px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
          </div>
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

      <div className={urbanCardClassName}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Badge variant="info">Zelf inplannen</Badge>
            <h3 className="text-xl font-semibold text-white">
              Alleen na aanmelding en acceptatie door je instructeur
            </h3>
            <p className="max-w-3xl text-sm leading-7 text-slate-300">
              Je ziet hier alleen vrije boekbare momenten. De volledige agenda van de instructeur,
              bezette lessen, namen van andere leerlingen en interne afspraken blijven verborgen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">
              {bookingOverview.eligibleInstructors.length} instructeur
              {bookingOverview.eligibleInstructors.length === 1 ? "" : "s"} open
            </Badge>
            <Badge variant="warning">
              {bookingOverview.pendingInstructors.length} in behandeling
            </Badge>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          {!bookingOverview.totalKnownInstructors ? (
            <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4 xl:col-span-3">
              <p className="text-sm font-semibold text-white">
                Je bent nog niet gekoppeld aan een instructeur
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Dien eerst een aanvraag of proefles in via de rijschool. Zodra een instructeur
                je traject accepteert, verschijnt hier automatisch of je zelf mag plannen.
              </p>
              <div className="mt-4">
                <Button
                  asChild
                  className="rounded-full border border-white/12 bg-[linear-gradient(135deg,#f8fafc,#cbd5e1)] text-slate-950 shadow-[0_22px_46px_-26px_rgba(148,163,184,0.42)] hover:brightness-[1.03]"
                >
                  <Link href="/leerling/instructeurs">Vraag eerst een instructeur aan</Link>
                </Button>
              </div>
            </div>
          ) : null}

          {bookingOverview.eligibleInstructors.map((item) => (
            <div
              key={`eligible-${item.instructorId}`}
              className="rounded-[1.35rem] border border-emerald-300/18 bg-emerald-400/8 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-white">{item.instructorName}</p>
                <Badge variant="success">Geaccepteerd</Badge>
                <Badge variant={item.directBookingAllowed ? "info" : "default"}>
                  {item.directBookingAllowed ? "Direct boeken aan" : "Exact moment kiezen"}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                {item.directBookingAllowed
                  ? "Je traject is actief en je kunt nu direct vrije boekbare momenten kiezen en vastzetten."
                  : "Je traject is actief. Je kunt nu vrije momenten van deze instructeur zien en precies dat moment als leskeuze doorgeven."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="info">
                  {item.availableSlots.length} open blok
                  {item.availableSlots.length === 1 ? "" : "ken"}
                </Badge>
                <Badge
                  variant={getWeeklyLimitSourceVariant(item.weeklyBookingLimitSource)}
                >
                  {getWeeklyLimitSourceLabel(item.weeklyBookingLimitSource)}
                </Badge>
                <Badge variant="default">
                  Limiet: {formatWeeklyLimitLabel(item.weeklyBookingLimitMinutes)}
                </Badge>
                <Badge variant="default">
                  Deze week gebruikt:{" "}
                  {formatMinutesAsHoursLabel(item.weeklyBookedMinutesThisWeek)}
                </Badge>
                <Badge
                  variant={
                    item.weeklyRemainingMinutesThisWeek === 0
                      ? "warning"
                      : "success"
                  }
                >
                  Nog over:{" "}
                  {item.weeklyRemainingMinutesThisWeek == null
                    ? "Onbeperkt"
                    : formatMinutesAsHoursLabel(item.weeklyRemainingMinutesThisWeek)}
                </Badge>
                {item.availableSlots[0] ? (
                  <Badge variant="default">
                    Eerst: {item.availableSlots[0].dag} - {item.availableSlots[0].tijdvak}
                  </Badge>
                  ) : (
                    <Badge variant="warning">Nog geen vrij blok opengezet</Badge>
                  )}
              </div>
              {item.weeklyBookingLimitSource === "package" ? (
                <p className="mt-3 text-[12px] leading-6 text-slate-300">
                  Je weekruimte volgt nu automatisch het gekoppelde pakket van deze instructeur.
                </p>
              ) : null}
              {item.weeklyBookingLimitSource === "manual" ? (
                <p className="mt-3 text-[12px] leading-6 text-slate-300">
                  Deze weekruimte is handmatig door je instructeur afgestemd op jouw traject.
                </p>
              ) : null}
              {!item.directBookingAllowed ? (
                <p className="mt-3 text-[12px] leading-6 text-slate-300">
                  Kies een vrij moment en stuur dat door als exact voorkeursblok. Andere lessen
                  en interne afspraken van de instructeur blijven verborgen.
                </p>
              ) : null}
              {item.currentWeekLimitReached ? (
                <p className="mt-3 text-[12px] leading-6 text-amber-100/90">
                  Je hebt voor deze week je ruimte bereikt. Kies een later moment of vraag je
                  instructeur om extra ruimte vrij te geven als je eerder nog wilt plannen.
                </p>
              ) : null}
              {!item.availableSlots.length && item.trialAvailableSlots.length ? (
                <p className="mt-3 text-[12px] leading-6 text-slate-300">
                  Een gewone rijles past nu niet meer binnen je resterende weekruimte, maar een
                  proefles of korter blok nog wel.
                </p>
              ) : null}
              {!item.trialLessonAvailable ? (
                <p className="mt-3 text-[12px] leading-6 text-slate-300">
                  Je proefles is al gebruikt. Daarom kun je hier alleen vervolglessen plannen.
                </p>
              ) : null}
              {item.availableSlots.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.availableSlots.slice(0, 3).map((slot) => (
                    <span
                      key={slot.id}
                      className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-slate-200"
                    >
                      {slot.dag} - {slot.tijdvak}
                    </span>
                  ))}
                </div>
              ) : null}
              <div
                className={cn(
                  "mt-4 grid gap-2",
                  item.trialLessonAvailable ? "sm:grid-cols-2" : "sm:grid-cols-1"
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
                  weeklyRemainingMinutesThisWeek={item.weeklyRemainingMinutesThisWeek}
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
                    weeklyRemainingMinutesThisWeek={item.weeklyRemainingMinutesThisWeek}
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
          ))}

          {bookingOverview.waitingApprovalInstructors.map((item) => (
            <div
              key={`waiting-${item.instructorId}`}
              className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-white">{item.instructorName}</p>
                <Badge variant="default">Traject actief</Badge>
                <Badge variant="warning">Wacht op vrijgave</Badge>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Je bent al gekoppeld aan deze instructeur, maar zelf inplannen staat nog niet
                open. Wacht tot de instructeur plannen voor jou vrijgeeft.
              </p>
            </div>
          ))}

          {bookingOverview.pendingInstructors.map((item) => (
            <div
              key={`pending-${item.instructorId}`}
              className="rounded-[1.35rem] border border-amber-300/18 bg-amber-400/8 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-white">{item.instructorName}</p>
                <Badge variant="warning">Aanvraag in behandeling</Badge>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Je aanvraag loopt al, maar deze instructeur heeft je nog niet geaccepteerd.
                Daarom kun je hier nog geen lessen zelf inplannen.
              </p>
            </div>
          ))}
        </div>
      </div>

      <LessonCalendar
        lessons={lessons}
        requests={requests}
        tone="urban"
        title="Agenda"
        description="Je bevestigde lessen en open lesaanvragen staan nu samen in een echte kalender, zodat je hele planning in een oogopslag zichtbaar blijft."
        emptyDescription="Zodra een les of aanvraag een concreet moment heeft, verschijnt die hier automatisch in je agenda."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <TrendCard
          tone="urban"
          title="Boekingsritme"
          value={`${requests.length + lessons.length}`}
          change={plannedLessons > 0 ? "+18%" : "Stand-by"}
          description="Totaal aantal boekingsmomenten en aanvragen in je huidige traject."
          data={[4, 6, 5, 7, 8, 9, 10]}
        />
        <InsightPanel
          tone="urban"
          title="Snelle status"
          description="De belangrijkste punten om je planning netjes en voorspelbaar te houden."
          items={[
            {
              label: "Open aanvragen",
              value: `${pendingRequests} aanvraag(en) wachten op reactie`,
              status: pendingRequests > 0 ? "Open" : "Rustig",
            },
            {
              label: "Ingeplande lessen",
              value: `${plannedLessons} les(sen) staan vast in je agenda`,
            },
            {
              label: "Aankomende locatie",
              value: nextLesson?.locatie ?? "Nog geen leslocatie bekend",
            },
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <LearnerRequestOverview
          tone="urban"
          title="Lesaanvragen"
          description="Statussen: aangevraagd, geaccepteerd, geweigerd, ingepland, afgerond en geannuleerd."
          requests={requests.map((request) => ({
            ...request,
            pakket_naam: request.pakket_naam ?? getRequestLabel(request),
          }))}
          emptyTitle="Nog geen lesaanvragen"
          emptyDescription="Zodra je een aanvraag verstuurt, verschijnt hier automatisch je volledige statusoverzicht."
        />
        <div className="space-y-4">
          <div className={urbanCardClassName}>
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-white">Geplande lessen</h3>
              <p className="mt-1 text-[13px] leading-6 text-slate-300">
                Voeg bevestigde lessen toe aan je agenda, open je route en annuleer op tijd als jouw instructeur dat toestaat.
              </p>
            </div>

            {lessons.length ? (
              <div className="grid gap-3">
                {lessons.slice(0, 4).map((lesson) => (
                  <div
                    key={lesson.id}
                    className="rounded-[1.1rem] border border-white/10 bg-white/6 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{lesson.titel}</p>
                        <p className="mt-1 text-[13px] text-slate-300">
                          {lesson.datum} om {lesson.tijd}
                        </p>
                        <p className="mt-1 text-[12px] text-slate-400">
                          {lesson.locatie}
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
                      </div>
                    </div>
                    {lesson.lesson_note?.trim() ? (
                      <p className="mt-2 text-[12px] leading-6 text-slate-300">
                        Coachnotitie: {lesson.lesson_note.trim()}
                      </p>
                    ) : null}
                    <LessonQuickActions
                      lesson={lesson}
                      tone="urban"
                      className="mt-3"
                    />
                    <LearnerLessonActions lesson={lesson} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-slate-300">
                Geaccepteerde boekingen en ingeplande ritten worden hier direct zichtbaar.
              </p>
            )}
          </div>

          <DataTableCard
            tone="urban"
            title="Lessenoverzicht"
            description="Je bevestigde lessen en de afspraken die al voor je klaarstaan."
            headers={["Les", "Datum", "Locatie", "Status"]}
            rows={lessons.map((lesson) => [
              lesson.titel,
              `${lesson.datum} om ${lesson.tijd}`,
              lesson.locatie,
              lesson.status,
            ])}
            badgeColumns={[3]}
            emptyTitle="Nog geen bevestigde lessen"
            emptyDescription="Geaccepteerde boekingen en ingeplande ritten worden hier direct zichtbaar."
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {[
          {
            icon: CalendarDays,
            title: "Volgende stap",
            text: "Bevestig een aanvraag of plan een nieuwe les op een moment dat logisch aansluit op je week.",
          },
          {
            icon: Clock3,
            title: "Rust in je planning",
            text: "Met een helder schema kun je beter inschatten waar nog ruimte of opvolging nodig is.",
          },
          {
            icon: MapPin,
            title: "Locatie helder",
            text: "Je startlocatie blijft zichtbaar zodat je planning niet alleen datums, maar ook praktische context geeft.",
          },
        ].map((item) => (
          <div key={item.title} className={urbanCardClassName}>
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-slate-100">
              <item.icon className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">{item.text}</p>
          </div>
        ))}
      </div>

      <div className={urbanCardClassName}>
        <Badge variant="info" className="mb-3">
          Live planning
        </Badge>
        <p className="text-sm leading-7 text-slate-300">
          Deze pagina leest live lesaanvragen en lessen uit Supabase en zet ze neer
          in een veel netter, rustiger en professioneler overzicht.
        </p>
      </div>
    </div>
  );
}
