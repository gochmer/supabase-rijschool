import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  Flame,
  PackageCheck,
  Sparkles,
  UserRoundCog,
} from "lucide-react";

import { LessonAttendanceActions } from "@/components/dashboard/lesson-attendance-actions";
import { LessonEditDialog } from "@/components/dashboard/lesson-edit-dialog";
import { LessonNoteEditor } from "@/components/dashboard/lesson-note-editor";
import { LessonQuickActions } from "@/components/dashboard/lesson-quick-actions";
import { RealtimeDashboardSync } from "@/components/dashboard/realtime-dashboard-sync";
import { RequestStatusActions } from "@/components/dashboard/request-status-actions";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLocationOptions } from "@/lib/data/locations";
import {
  getInstructeurDashboardMetrics,
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentNotifications } from "@/lib/data/notifications";
import {
  getLessonAttendanceLabel,
  getLessonAttendanceVariant,
} from "@/lib/lesson-utilities";

export default async function InstructeurDashboardPage() {
  const [metrics, lessons, requests, notifications, locationOptions] =
    await Promise.all([
      getInstructeurDashboardMetrics(),
      getInstructeurLessons(),
      getInstructeurLessonRequests(),
      getCurrentNotifications(),
      getLocationOptions(),
    ]);

  const openRequests = requests.filter((item) => item.status === "aangevraagd");
  const plannedLessons = lessons.filter((item) =>
    ["ingepland", "geaccepteerd"].includes(item.status)
  );
  const nextLessons = plannedLessons.slice(0, 5);
  const unreadNotifications = notifications.filter((item) => item.ongelezen);
  const focusScore = Math.min(
    100,
    55 +
      openRequests.length * 8 +
      plannedLessons.length * 5 +
      unreadNotifications.length * 3
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.2rem] border border-white/70 bg-[linear-gradient(135deg,#020617,#172554,#0284c7)] p-6 text-white shadow-[0_34px_110px_-58px_rgba(15,23,42,0.78)] dark:border-white/10 sm:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_88%_18%,rgba(56,189,248,0.24),transparent_24%),radial-gradient(circle_at_70%_86%,rgba(249,115,22,0.16),transparent_24%)]" />
        <div className="relative grid gap-7 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/78 uppercase">
                <Flame className="size-3.5" />
                Instructeur cockpit
              </div>
              <RealtimeDashboardSync profileLabel="instructeur-dashboard" />
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Vandaag draaien om aanvragen, lessen en conversie.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72 sm:text-[15px]">
              Een scherp overzicht voor je planning, nieuwe leerlingen,
              meldingen en profielacties. Geen ruis, alleen wat vandaag geld,
              vertrouwen en voortgang oplevert.
            </p>
          </div>

          <div className="grid min-w-[17rem] gap-3 rounded-[1.6rem] border border-white/14 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/62 uppercase">
                  Focus score
                </p>
                <p className="mt-1 text-4xl font-semibold">{focusScore}</p>
              </div>
              <Sparkles className="size-8 text-sky-200" />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#22c55e,#facc15)]"
                style={{ width: `${focusScore}%` }}
              />
            </div>
            <p className="text-xs leading-5 text-white/68">
              Gebaseerd op open aanvragen, geplande lessen en meldingen die
              actie nodig hebben.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            href: "/instructeur/aanvragen",
            icon: CheckCircle2,
            label: "Aanvragen",
            title: `${openRequests.length} open`,
            text: "Direct accepteren of weigeren",
          },
          {
            href: "/instructeur/beschikbaarheid",
            icon: CalendarClock,
            label: "Agenda",
            title: "Slots beheren",
            text: "Meer beschikbaarheid = meer boekingen",
          },
          {
            href: "/instructeur/pakketten",
            icon: PackageCheck,
            label: "Aanbod",
            title: "Pakketten",
            text: "Maak je profiel beter verkoopbaar",
          },
          {
            href: "/instructeur/profiel",
            icon: UserRoundCog,
            label: "Profiel",
            title: "Profiel polish",
            text: "Bio, prijs en specialisaties bijwerken",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-[1.35rem] border border-white/70 bg-white/88 p-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.32)] transition-all hover:-translate-y-0.5 hover:shadow-[0_28px_78px_-48px_rgba(15,23,42,0.42)] dark:border-white/10 dark:bg-white/6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-sky-200">
                <item.icon className="size-5" />
              </div>
              <ArrowUpRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <p className="mt-4 text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
              {item.label}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
              {item.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {item.text}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[1.8rem] border border-white/70 bg-white/90 p-5 shadow-[0_26px_86px_-48px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
                Planning
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                Volgende lessen
              </h2>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/instructeur/beschikbaarheid">Agenda beheren</Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-3">
            {nextLessons.length ? (
              nextLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="grid gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/85 p-3 dark:border-white/10 dark:bg-white/5 sm:grid-cols-[1fr_auto] sm:items-center"
                >
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
                      <Badge
                        variant={getLessonAttendanceVariant(
                          lesson.attendance_status
                        )}
                      >
                        {getLessonAttendanceLabel(lesson.attendance_status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {lesson.datum} om {lesson.tijd} •{" "}
                      {lesson.leerling_naam || "Leerling"}
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
                  <LessonEditDialog
                    lesson={lesson}
                    locationOptions={locationOptions}
                  />
                </div>
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-slate-300 p-6 text-sm leading-6 text-slate-600 dark:border-white/12 dark:text-slate-300">
                Nog geen geplande lessen. Accepteer een aanvraag of voeg
                beschikbaarheid toe om je planning te vullen.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-white/70 bg-white/90 p-5 shadow-[0_26px_86px_-48px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
                Inbox
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                Nieuwe aanvragen
              </h2>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/instructeur/aanvragen">Alles bekijken</Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-3">
            {openRequests.slice(0, 4).length ? (
              openRequests.slice(0, 4).map((request) => (
                <div
                  key={request.id}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50/85 p-3 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {request.leerling_naam}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {request.voorkeursdatum} • {request.tijdvak}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {request.pakket_naam ?? request.aanvraag_type ?? "Aanvraag"}
                      </p>
                    </div>
                    <Badge variant="warning">actie nodig</Badge>
                  </div>
                  <div className="mt-3">
                    <RequestStatusActions
                      requestId={request.id}
                      status={request.status}
                      locationOptions={locationOptions}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-slate-300 p-6 text-sm leading-6 text-slate-600 dark:border-white/12 dark:text-slate-300">
                Geen open aanvragen. Je inbox is schoon.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[1.8rem] border border-white/70 bg-white/90 p-5 shadow-[0_26px_86px_-48px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-white/6">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              Meldingen
            </h2>
          </div>
          <div className="mt-4 grid gap-2">
            {notifications.slice(0, 5).length ? (
              notifications.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1rem] border border-slate-200 bg-slate-50/85 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {item.titel}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                        {item.tekst}
                      </p>
                    </div>
                    {item.ongelezen ? (
                      <span className="mt-1 size-2 rounded-full bg-primary" />
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Geen meldingen.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,249,255,0.9))] p-5 shadow-[0_26px_86px_-48px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
            Groei advies
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
            Wat levert nu het meeste op?
          </h2>
          <div className="mt-4 grid gap-2">
            {[
              openRequests.length
                ? "Werk open aanvragen eerst af. Snel reageren verhoogt je kans op bevestigde lessen."
                : "Je inbox is leeg. Zet extra beschikbaarheid open om nieuwe aanvragen te stimuleren.",
              plannedLessons.length < 3
                ? "Voeg avond- of weekend-slots toe; dat zijn vaak de sterkste conversiemomenten."
                : "Je planning loopt goed. Rond lessen af zodat je voortgang en omzet actueel blijven.",
              unreadNotifications.length
                ? "Check je ongelezen meldingen zodat je geen leerlingactie mist."
                : "Geen urgente meldingen. Gebruik dit moment om je pakketten scherper te maken.",
            ].map((tip) => (
              <div
                key={tip}
                className="rounded-[1rem] bg-white/80 px-3 py-2.5 text-sm leading-6 text-slate-700 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.18)] dark:bg-white/6 dark:text-slate-300"
              >
                {tip}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
