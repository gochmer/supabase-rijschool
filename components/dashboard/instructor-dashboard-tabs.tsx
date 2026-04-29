"use client";

import type { ComponentProps } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  PackageCheck,
  UserRoundCog,
} from "lucide-react";

import { LessonAttendanceActions } from "@/components/dashboard/lesson-attendance-actions";
import { InstructorDashboardGrowthTab } from "@/components/dashboard/instructor-dashboard-growth-tab";
import { InstructorDashboardLearnerTab } from "@/components/dashboard/instructor-dashboard-learner-tab";
import { LessonEditDialog } from "@/components/dashboard/lesson-edit-dialog";
import { LessonNoteEditor } from "@/components/dashboard/lesson-note-editor";
import { LessonQuickActions } from "@/components/dashboard/lesson-quick-actions";
import { RequestStatusActions } from "@/components/dashboard/request-status-actions";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  getLessonAttendanceLabel,
  getLessonAttendanceVariant,
} from "@/lib/lesson-utilities";
import type {
  LessonCheckinBoard,
  Les,
  LesAanvraag,
  LocationOption,
  Notificatie,
  SharedLessonCompassBoard,
} from "@/lib/types";

type DashboardRadarItem = {
  leerlingId: string;
  naam: string;
  label: string;
  detail: string;
  badge: "success" | "warning" | "danger" | "info";
  href: string;
};

type DashboardRadarInsights = {
  reactivation: DashboardRadarItem[];
  examReady: DashboardRadarItem[];
  noShowRisk: DashboardRadarItem[];
};

type GrowthInsightItem = {
  id: string;
  studentId?: string;
  title: string;
  badgeLabel: string;
  badge: "success" | "warning" | "danger" | "info";
  detail: string;
  meta?: string;
  href: string;
  ctaLabel: string;
  openLabel?: string;
  actionType?: "package_suggestion" | "gap_nudge";
  suggestedPackageId?: string;
  suggestedPackageName?: string;
  currentPackageName?: string;
  nudgeStudentIds?: string[];
  nudgeStudentNames?: string[];
  slotStartAt?: string;
  slotEndAt?: string;
  draftText?: string;
};

type GrowthInsights = {
  summary: {
    headline: string;
    readyActions: number;
    estimatedGrowthValueLabel: string;
    nudgeAudienceLabel: string;
  };
  packageOpportunities: GrowthInsightItem[];
  fillGaps: GrowthInsightItem[];
  upgradeCandidates: GrowthInsightItem[];
};

type InstructorDashboardTabsProps = {
  metrics: Array<ComponentProps<typeof MetricCard>>;
  lessons: Les[];
  requests: LesAanvraag[];
  notifications: Notificatie[];
  locationOptions: LocationOption[];
  lessonCompassBoards: SharedLessonCompassBoard[];
  lessonCheckinBoards: LessonCheckinBoard[];
  radarInsights: DashboardRadarInsights;
  growthInsights: GrowthInsights;
};

export function InstructorDashboardTabs({
  metrics,
  lessons,
  requests,
  notifications,
  locationOptions,
  lessonCompassBoards,
  lessonCheckinBoards,
  radarInsights,
  growthInsights,
}: InstructorDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"vandaag" | "leerlingen" | "groei">(
    "vandaag"
  );

  const openRequests = requests.filter((item) => item.status === "aangevraagd");
  const plannedLessons = lessons.filter((item) =>
    ["ingepland", "geaccepteerd"].includes(item.status)
  );
  const nextLessons = plannedLessons.slice(0, 5);
  const unreadNotifications = notifications.filter((item) => item.ongelezen);

  const quickLinks = [
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
  ];

  const todayTips = [
    openRequests.length
      ? "Werk open aanvragen eerst af. Snel reageren verhoogt je kans op bevestigde lessen."
      : "Je inbox is leeg. Zet extra beschikbaarheid open om nieuwe aanvragen te stimuleren.",
    plannedLessons.length < 3
      ? "Voeg avond- of weekend-slots toe; dat zijn vaak de sterkste conversiemomenten."
      : "Je planning loopt goed. Rond lessen af zodat je voortgang en omzet actueel blijven.",
    unreadNotifications.length
      ? "Check je ongelezen meldingen zodat je geen leerlingactie mist."
      : "Geen urgente meldingen. Gebruik dit moment om je pakketten scherper te maken.",
  ];

  const growthTips = [
    growthInsights.packageOpportunities.length
      ? `${growthInsights.packageOpportunities.length} pakketkansen liggen al klaar om op te volgen.`
      : "Er ligt nu geen scherpe pakketkans open; je basis oogt stabiel.",
    growthInsights.fillGaps.length
      ? `${growthInsights.fillGaps.length} open momenten kunnen nog worden gevuld met slimme nudges.`
      : "Je komende week heeft nu geen opvallende open gaten die direct schreeuwen om opvolging.",
    growthInsights.upgradeCandidates.length
      ? `${growthInsights.upgradeCandidates.length} leerling(en) lijken klaar voor een grotere vervolgstap.`
      : "Niemand hoeft nu direct door naar een groter pakket; eerst verder bouwen aan ritme en stabiliteit.",
  ];

  function handleTabChange(value: string) {
    if (value !== "vandaag" && value !== "leerlingen" && value !== "groei") {
      return;
    }

    setActiveTab(value);
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-5">
      <div className="rounded-[1.8rem] border border-white/70 bg-white/88 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-white/6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase dark:text-sky-300">
              Dashboard flow
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
              Kies waar je nu op wilt sturen
            </h2>
            <p className="mt-1 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
              Minder lange scroll, meer focus per laag: wat vandaag direct speelt,
              wat met leerlingen beweegt en wat groei kan opleveren.
            </p>
          </div>
          <TabsList
            variant="line"
            className="w-full justify-start gap-1 overflow-x-auto rounded-full bg-slate-100/80 p-1 dark:bg-white/6 lg:w-auto"
          >
            <TabsTrigger
              value="vandaag"
              className="rounded-full px-4 py-2 text-[13px] data-active:bg-white dark:data-active:bg-white/10"
            >
              Vandaag
            </TabsTrigger>
            <TabsTrigger
              value="leerlingen"
              className="rounded-full px-4 py-2 text-[13px] data-active:bg-white dark:data-active:bg-white/10"
            >
              Leerlingen
            </TabsTrigger>
            <TabsTrigger
              value="groei"
              className="rounded-full px-4 py-2 text-[13px] data-active:bg-white dark:data-active:bg-white/10"
            >
              Groei
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <TabsContent value="vandaag" className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => (
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
                          {request.pakket_naam ??
                            request.aanvraag_type ??
                            "Aanvraag"}
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
              Vandaag slimst
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
              Waar zit nu de meeste directe winst?
            </h2>
            <div className="mt-4 grid gap-2">
              {todayTips.map((tip) => (
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
      </TabsContent>

      <TabsContent value="leerlingen" className="space-y-5">
        <InstructorDashboardLearnerTab
          lessonCompassBoards={lessonCompassBoards}
          lessonCheckinBoards={lessonCheckinBoards}
          lessons={lessons}
          requests={requests}
          notifications={notifications}
          radarInsights={radarInsights}
        />
      </TabsContent>

      <TabsContent value="groei" className="space-y-5">
        <InstructorDashboardGrowthTab
          growthInsights={growthInsights}
          growthTips={growthTips}
        />
      </TabsContent>
    </Tabs>
  );
}
