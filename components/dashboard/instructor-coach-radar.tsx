"use client";

import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CircleAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type { LessonCheckinBoard, Les, LesAanvraag, Notificatie } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function buildRadarState({
  requests,
  notifications,
  checkins,
}: {
  requests: LesAanvraag[];
  notifications: Notificatie[];
  checkins: LessonCheckinBoard[];
}) {
  const openRequests = requests.filter((item) => item.status === "aangevraagd");
  const unreadNotifications = notifications.filter((item) => item.ongelezen);
  const lessonsWithoutFocus = checkins.filter(
    (item) => !item.instructor_focus?.trim()
  );
  const lowConfidenceLessons = checkins.filter(
    (item) => (item.confidence_level ?? 5) <= 2 || item.arrival_mode === "afstemmen"
  );

  const score =
    openRequests.length * 16 +
    unreadNotifications.length * 8 +
    lessonsWithoutFocus.length * 9 +
    lowConfidenceLessons.length * 14;

  if (score >= 42) {
    return {
      label: "Volle coachdag",
      badge: "warning" as const,
      ring: "border-amber-200/80 bg-amber-50/90 dark:border-amber-400/16 dark:bg-amber-500/10",
      message: "Er liggen meerdere signalen klaar die vandaag directe aandacht kunnen gebruiken.",
    };
  }

  if (score >= 18) {
    return {
      label: "Goede focusdag",
      badge: "info" as const,
      ring: "border-sky-200/80 bg-sky-50/90 dark:border-sky-400/16 dark:bg-sky-500/10",
      message: "Je dashboard laat een paar slimme coachkansen zien die je snel kunt oppakken.",
    };
  }

  return {
    label: "Rustige regiedag",
    badge: "success" as const,
    ring: "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/16 dark:bg-emerald-500/10",
    message: "De basis staat stevig. Dit is een goed moment om vooruit te werken aan groei of profielpolish.",
  };
}

function buildPriorityItems({
  lessons,
  requests,
  notifications,
  checkins,
}: {
  lessons: Les[];
  requests: LesAanvraag[];
  notifications: Notificatie[];
  checkins: LessonCheckinBoard[];
}) {
  const priorities: Array<{
    label: string;
    value: string;
    href: string;
    icon: typeof CircleAlert;
    tone: "danger" | "warning" | "info" | "success";
  }> = [];

  const openRequests = requests.filter((item) => item.status === "aangevraagd");
  if (openRequests.length) {
    priorities.push({
      label: "Open aanvragen",
      value: `${openRequests.length} wachten op reactie`,
      href: "/instructeur/aanvragen",
      icon: CircleAlert,
      tone: "warning",
    });
  }

  const lowConfidence = checkins.filter(
    (item) => (item.confidence_level ?? 5) <= 2 || item.arrival_mode === "afstemmen"
  );
  if (lowConfidence.length) {
    priorities.push({
      label: "Leerlingen met extra spanning",
      value: `${lowConfidence.length} lescheck-in(s) vragen extra aandacht`,
      href: "/instructeur/dashboard",
      icon: ShieldCheck,
      tone: "danger",
    });
  }

  const lessonsWithoutFocus = checkins.filter(
    (item) => !item.instructor_focus?.trim()
  );
  if (lessonsWithoutFocus.length) {
    priorities.push({
      label: "Focus nog niet teruggestuurd",
      value: `${lessonsWithoutFocus.length} aankomende les(sen) missen nog jouw lesfocus`,
      href: "/instructeur/dashboard",
      icon: Sparkles,
      tone: "info",
    });
  }

  const upcomingLessons = lessons.filter((item) =>
    ["ingepland", "geaccepteerd"].includes(item.status)
  );
  if (upcomingLessons.length < 3) {
    priorities.push({
      label: "Planning kan voller",
      value: `Je hebt ${upcomingLessons.length} aankomende les(sen) in beeld`,
      href: "/instructeur/beschikbaarheid",
      icon: CalendarClock,
      tone: "info",
    });
  }

  const unreadNotifications = notifications.filter((item) => item.ongelezen);
  if (unreadNotifications.length) {
    priorities.push({
      label: "Meldingen wachten",
      value: `${unreadNotifications.length} ongelezen melding(en)`,
      href: "/instructeur/dashboard",
      icon: BellRing,
      tone: "info",
    });
  }

  if (!priorities.length) {
    priorities.push({
      label: "Dashboard is schoon",
      value: "Geen directe blockers. Goed moment om vooruit te plannen.",
      href: "/instructeur/profiel",
      icon: Sparkles,
      tone: "success",
    });
  }

  return priorities.slice(0, 4);
}

function buildSpotlightItems(checkins: LessonCheckinBoard[]) {
  return checkins
    .filter(
      (item) =>
        item.support_request?.trim() ||
        (item.confidence_level ?? 5) <= 3 ||
        item.arrival_mode === "afstemmen"
    )
    .slice(0, 3);
}

export function InstructorCoachRadar({
  lessons,
  requests,
  notifications,
  checkins,
}: {
  lessons: Les[];
  requests: LesAanvraag[];
  notifications: Notificatie[];
  checkins: LessonCheckinBoard[];
}) {
  const radarState = buildRadarState({
    requests,
    notifications,
    checkins,
  });
  const priorities = buildPriorityItems({
    lessons,
    requests,
    notifications,
    checkins,
  });
  const spotlight = buildSpotlightItems(checkins);

  return (
    <section className="rounded-[1.8rem] border border-white/70 bg-white/90 p-5 shadow-[0_26px_86px_-48px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className={cn("rounded-[1.35rem] border p-4", radarState.ring)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase dark:text-sky-300">
                Coach radar
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                {radarState.label}
              </h2>
            </div>
            <Badge variant={radarState.badge}>Live prioriteiten</Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {radarState.message}
          </p>

          <div className="mt-4 grid gap-2">
            {priorities.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group rounded-[1rem] border border-slate-200/80 bg-white/80 px-3 py-3 transition-all hover:border-slate-300/80 dark:border-white/10 dark:bg-slate-950/20 dark:hover:bg-white/8"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <item.icon className="size-4 text-slate-500 dark:text-slate-300" />
                      <p className="text-[13px] font-semibold text-slate-950 dark:text-white">
                        {item.label}
                      </p>
                    </div>
                    <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                      {item.value}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/88 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase dark:text-sky-300">
                Leerling spotlight
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                Wie heeft vandaag het meest aan jou?
              </h3>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/instructeur/leerlingen">Open leerlingenwerkplek</Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-3">
            {spotlight.length ? (
              spotlight.map((item) => (
                <div
                  key={item.les_id}
                  className="rounded-[1rem] border border-slate-200/80 bg-white/85 p-3 dark:border-white/10 dark:bg-slate-950/20"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-slate-950 dark:text-white">
                      {item.counterpart_name}
                    </p>
                    <Badge variant={item.arrival_mode === "afstemmen" ? "warning" : "info"}>
                      {item.confidence_level ? `${item.confidence_level}/5` : "check-in open"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                    {item.lesson_title} · {item.lesson_date} om {item.lesson_time}
                  </p>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                    {item.support_request?.trim()
                      ? item.support_request
                      : item.arrival_mode === "afstemmen"
                        ? "De leerling wil vooraf nog even afstemmen over de les."
                        : "Er staat al een signaal klaar dat extra aandacht in de les kan vragen."}
                  </p>
                  {item.instructor_focus ? (
                    <div className="mt-2 rounded-[0.9rem] bg-sky-50/90 px-3 py-2 text-[12px] leading-5 text-sky-900 dark:bg-sky-500/10 dark:text-sky-100">
                      <span className="font-semibold">Jouw focus:</span> {item.instructor_focus}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-[1rem] border border-dashed border-slate-300/80 bg-white/80 p-4 text-sm leading-6 text-slate-600 dark:border-white/12 dark:bg-slate-950/20 dark:text-slate-300">
                Nog geen sterke spannings- of focus-signalen. De aankomende lessen lijken op dit moment rustig voorbereid.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
