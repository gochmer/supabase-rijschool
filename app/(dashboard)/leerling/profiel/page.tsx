import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Heart,
  Package,
  Phone,
  User,
} from "lucide-react";

import { StudentProgressReadOnlyCard } from "@/components/progress/student-progress-readonly-card";
import { ProfileForm } from "@/components/profile/profile-form";
import { Button } from "@/components/ui/button";
import { getCurrentStudentPackageOverview } from "@/lib/data/packages";
import {
  getLeerlingLessonRequests,
  getLeerlingLessons,
} from "@/lib/data/lesson-requests";
import {
  getCurrentLeerlingRecord,
  getCurrentProfile,
} from "@/lib/data/profiles";
import { getCurrentLeerlingProgressWorkspace } from "@/lib/data/student-progress";

const shellCardClassName =
  "rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] shadow-[0_28px_88px_-46px_rgba(15,23,42,0.78)]";

export default async function LeerlingProfielPage() {
  const [profile, leerling, lessons, requests, packageOverview, progressWorkspace] =
    await Promise.all([
      getCurrentProfile(),
      getCurrentLeerlingRecord(),
      getLeerlingLessons(),
      getLeerlingLessonRequests(),
      getCurrentStudentPackageOverview(),
      getCurrentLeerlingProgressWorkspace(),
    ]);

  const today = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const nextLesson = lessons.find((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status)
  );
  const pendingRequests = requests.filter(
    (request) => request.status === "aangevraagd"
  ).length;
  const progressValue = leerling?.voortgang_percentage ?? 0;
  const favoriteCount = leerling?.favoriete_instructeurs?.length ?? 0;
  const packageLabel =
    packageOverview.assignedPackage?.naam ?? "Nog geen pakket gekoppeld";
  const profileIntegrity = [
    Boolean(profile?.volledige_naam.trim()),
    Boolean(profile?.telefoon.trim()),
    Boolean(nextLesson),
    Boolean(packageOverview.assignedPackage),
  ];
  const accountQuality = Math.round(
    (profileIntegrity.filter(Boolean).length / profileIntegrity.length) * 100
  );

  const overviewCards = [
    {
      icon: User,
      label: "Accountkwaliteit",
      value: `${accountQuality}%`,
      detail:
        accountQuality === 100
          ? "Je basisgegevens en planning staan professioneel en compleet."
          : "Werk je gegevens bij voor een sterker en completer profiel.",
    },
    {
      icon: CalendarDays,
      label: "Volgende les",
      value: nextLesson ? `${nextLesson.datum}` : "Nog niet ingepland",
      detail: nextLesson
        ? `${nextLesson.tijd} met ${nextLesson.instructeur_naam}`
        : "Zodra je een les bevestigt zie je hem hier direct terug.",
    },
    {
      icon: Heart,
      label: "Favorieten",
      value: `${favoriteCount}`,
      detail:
        favoriteCount > 0
          ? "Je bewaarde instructeurs blijven hier snel inzichtelijk."
          : "Sla interessante instructeurs op om sneller te vergelijken.",
    },
    {
      icon: Package,
      label: "Pakket",
      value: packageLabel,
      detail: packageOverview.assignedPackage
        ? `${packageOverview.assignedPackage.lessen || "Flexibel"} lessen • ${packageOverview.assignedPackage.prijsLabel}`
        : `${packageOverview.availablePackages.length} pakketopties staan klaar.`,
    },
  ];

  return (
    <div className="space-y-6 text-white">
      <section
        className={`relative overflow-hidden p-6 sm:p-7 xl:p-8 print:hidden ${shellCardClassName}`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.18),transparent_26%),radial-gradient(circle_at_84%_18%,rgba(56,189,248,0.1),transparent_22%),radial-gradient(circle_at_54%_72%,rgba(245,158,11,0.08),transparent_24%)]" />
        </div>

        <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-semibold tracking-[0.22em] text-slate-200 uppercase">
                Profile suite
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-medium tracking-[0.12em] text-slate-300 uppercase">
                {today}
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-[12ch] text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Een strakke, professionele basis voor je leerlingaccount.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Je profielomgeving is nu rustiger, luxer en veel meer in lijn met een
                premium platform. Alles draait hier om overzicht, vertrouwen en een
                nette presentatie van je voortgang en gegevens.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                `${progressValue}% voortgang`,
                `${favoriteCount} favorieten`,
                packageLabel,
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(148,163,184,0.08),rgba(15,23,42,0.3))] px-3.5 py-2 text-[12px] font-semibold text-slate-100 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.42)]"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-full border border-white/12 bg-[linear-gradient(135deg,#f8fafc,#cbd5e1)] px-5 text-[0.95rem] font-semibold text-slate-950 shadow-[0_22px_46px_-26px_rgba(148,163,184,0.42)] hover:brightness-[1.03]"
              >
                <Link href="/leerling/instructeurs">
                  Instructeurs bekijken
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-white/10 bg-white/6 px-5 text-[0.95rem] font-semibold text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.42)] backdrop-blur hover:bg-white/10"
              >
                <Link href="/leerling/boekingen">Boekingen beheren</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(148,163,184,0.08),rgba(15,23,42,0.28))] p-5 shadow-[0_20px_48px_-32px_rgba(15,23,42,0.54)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-300 uppercase">
                  Account overview
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Persoonlijk overzicht
                </h2>
              </div>
              <div className="rounded-full border border-emerald-400/18 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-emerald-200 uppercase">
                Actief
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-[1.4rem] border border-white/8 bg-black/12 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-200">
                    Profielcompleetheid
                  </p>
                  <p className="text-lg font-semibold text-white">{accountQuality}%</p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#f8fafc,#94a3b8,#0f172a)]"
                    style={{ width: `${Math.min(Math.max(accountQuality, 8), 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Een completer account maakt plannen en communiceren merkbaar eenvoudiger.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-300 uppercase">
                    Volgende les
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {nextLesson ? `${nextLesson.datum} om ${nextLesson.tijd}` : "Nog niet bekend"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {nextLesson
                      ? `${nextLesson.instructeur_naam} • ${nextLesson.locatie}`
                      : "Bevestigde lessen verschijnen hier automatisch."}
                  </p>
                </div>

                <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-300 uppercase">
                    Open aanvragen
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {pendingRequests} aanvraag(en)
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Houd hier zicht op lopende verzoeken en reacties van instructeurs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 print:hidden md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <div
            key={card.label}
            className={`p-5 ${shellCardClassName}`}
          >
            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-slate-100">
              <card.icon className="size-5" />
            </div>
            <p className="mt-4 text-[10px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
              {card.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-white">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{card.detail}</p>
          </div>
        ))}
      </div>

      <StudentProgressReadOnlyCard
        assessments={progressWorkspace.assessments}
        notes={progressWorkspace.notes}
        progressValue={progressValue}
        volgendeLes={
          nextLesson ? `${nextLesson.datum} om ${nextLesson.tijd}` : "Nog niet ingepland"
        }
        laatsteInstructeurNaam={progressWorkspace.laatsteInstructeurNaam}
      />

      <div className="grid gap-6 print:hidden xl:grid-cols-[1.15fr_0.85fr]">
        <section className={`p-6 sm:p-7 ${shellCardClassName}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-300 uppercase">
                Personal details
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Persoonlijke gegevens
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                Werk je naam en contactgegevens bij in een rustige, premium formulierenlaag die beter past bij de rest van het platform.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-slate-200 uppercase">
              Leerling account
            </div>
          </div>

          <div className="mt-6 rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(148,163,184,0.08),rgba(15,23,42,0.28))] p-5 sm:p-6">
            <ProfileForm
              role="leerling"
              tone="urban"
              initialValues={{
                volledigeNaam: profile?.volledige_naam ?? "",
                telefoon: profile?.telefoon ?? "",
              }}
            />
          </div>
        </section>

        <div className="grid gap-6">
          <section className={`p-5 ${shellCardClassName}`}>
            <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-300 uppercase">
              Account status
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Wat al goed staat
            </h3>

            <div className="mt-5 grid gap-3">
              {[
                {
                  label: "Naam ingevuld",
                  ok: Boolean(profile?.volledige_naam.trim()),
                  detail: profile?.volledige_naam || "Voeg je volledige naam toe.",
                },
                {
                  label: "Telefoon beschikbaar",
                  ok: Boolean(profile?.telefoon.trim()),
                  detail: profile?.telefoon || "Voeg een telefoonnummer toe voor snelle afstemming.",
                },
                {
                  label: "Pakket gekoppeld",
                  ok: Boolean(packageOverview.assignedPackage),
                  detail: packageLabel,
                },
                {
                  label: "Planning actief",
                  ok: Boolean(nextLesson),
                  detail: nextLesson
                    ? `${nextLesson.datum} om ${nextLesson.tijd}`
                    : "Nog geen eerstvolgende les gevonden.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={
                        item.ok
                          ? "mt-0.5 flex size-9 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-200"
                          : "mt-0.5 flex size-9 items-center justify-center rounded-xl bg-amber-500/12 text-amber-200"
                      }
                    >
                      <CheckCircle2 className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`p-5 ${shellCardClassName}`}>
            <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-300 uppercase">
              Aanbevolen acties
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Slimme vervolgstappen
            </h3>

            <div className="mt-5 grid gap-3">
              {[
                {
                  icon: CalendarDays,
                  title: "Plan je volgende les",
                  text: nextLesson
                    ? "Je eerstvolgende les staat al gepland. Houd je boekingen actueel."
                    : "Zet een nieuwe les vast zodat je traject zichtbaar in beweging komt.",
                },
                {
                  icon: Phone,
                  title: "Houd contact eenvoudig",
                  text: profile?.telefoon
                    ? "Je telefoonnummer staat klaar voor snelle afstemming."
                    : "Met een telefoonnummer verloopt plannen meestal merkbaar soepeler.",
                },
                {
                  icon: Package,
                  title: "Bekijk je pakket",
                  text: packageOverview.assignedPackage
                    ? "Je huidige pakket is gekoppeld en netjes zichtbaar in je account."
                    : "Zonder pakket mis je nu een deel van je overzicht en betaalflow.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-white/8 text-slate-100">
                      <item.icon className="size-4.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
