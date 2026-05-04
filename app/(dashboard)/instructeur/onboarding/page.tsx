import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  IdCard,
  PackageCheck,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  findDocumentByKeywords,
  isDocumentReady,
} from "@/components/instructor/instructor-settings-model";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getCurrentInstructorAvailability,
  getCurrentInstructorSettingsOverview,
} from "@/lib/data/instructor-account";
import { getCurrentInstructorDashboardPackages } from "@/lib/data/packages";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";
import { cn } from "@/lib/utils";

const ROUTE = "/instructeur/onboarding";

export default async function InstructeurOnboardingPage() {
  const [instructor, settings, availabilitySlots, packages] =
    await timedDashboardRoute(ROUTE, () =>
      Promise.all([
        timedDashboardData(ROUTE, "instructor", getCurrentInstructeurRecord),
        timedDashboardData(
          ROUTE,
          "settings-overview",
          getCurrentInstructorSettingsOverview,
        ),
        timedDashboardData(ROUTE, "availability", () =>
          getCurrentInstructorAvailability({
            concreteLimit: 12,
            from: new Date().toISOString(),
            recurringWeeks: 2,
          }),
        ),
        timedDashboardData(
          ROUTE,
          "packages",
          getCurrentInstructorDashboardPackages,
        ),
      ]),
    );

  const wrmDocument = findDocumentByKeywords(settings.documents, [
    "wrm",
    "bevoegd",
    "instructeurspas",
    "instructeur pas",
  ]);
  const licenseDocument = findDocumentByKeywords(settings.documents, [
    "rijbewijs",
    "rijbewijsdocument",
  ]);
  const vogDocument = findDocumentByKeywords(settings.documents, [
    "vog",
    "verklaring omtrent gedrag",
  ]);
  const activeVehicles = settings.vehicles.filter(
    (vehicle) => vehicle.status === "actief",
  );

  const steps = [
    {
      title: "Profielbasis",
      text: instructor
        ? "Je instructeursprofiel bestaat en kan worden aangevuld."
        : "Maak eerst je instructeursprofiel compleet.",
      done: Boolean(instructor),
      href: "/instructeur/profiel",
      icon: UserRound,
    },
    {
      title: "WRM-bevoegdheid",
      text: isDocumentReady(wrmDocument)
        ? "Je WRM-document is akkoord."
        : "Upload of laat je WRM-bevoegdheid controleren.",
      done: isDocumentReady(wrmDocument),
      href: "/instructeur/documenten",
      icon: IdCard,
    },
    {
      title: "Rijbewijs en VOG",
      text:
        isDocumentReady(licenseDocument) && isDocumentReady(vogDocument)
          ? "De belangrijkste vertrouwensdocumenten zijn klaar."
          : "Koppel rijbewijs en VOG voor een stevige verificatiebasis.",
      done: isDocumentReady(licenseDocument) && isDocumentReady(vogDocument),
      href: "/instructeur/documenten",
      icon: ShieldCheck,
    },
    {
      title: "Voertuig rijklaar",
      text: activeVehicles.length
        ? `${activeVehicles.length} actief voertuig${activeVehicles.length === 1 ? "" : "en"} inzetbaar.`
        : "Registreer minimaal een actief lesvoertuig.",
      done: activeVehicles.length > 0,
      href: "/instructeur/voertuigen",
      icon: CarFront,
    },
    {
      title: "Beschikbaarheid",
      text: availabilitySlots.length
        ? "Je planning heeft open momenten."
        : "Zet je eerste beschikbaarheid open voor leerlingen.",
      done: availabilitySlots.length > 0,
      href: "/instructeur/beschikbaarheid",
      icon: CalendarDays,
    },
    {
      title: "Pakketaanbod",
      text: packages.length
        ? `${packages.length} pakket${packages.length === 1 ? "" : "ten"} beschikbaar.`
        : "Maak je lespakket of proeflesaanbod klaar.",
      done: packages.length > 0,
      href: "/instructeur/pakketten",
      icon: PackageCheck,
    },
  ];
  const completedSteps = steps.filter((step) => step.done).length;
  const progress = Math.round((completedSteps / steps.length) * 100);
  const nextStep = steps.find((step) => !step.done) ?? steps[0];

  return (
    <div className="space-y-4">
      <PageHeader
        tone="urban"
        title="Onboarding"
        description="Een rustige checklist voor de basis van je instructeurwerkplek: profiel, documenten, voertuig, planning en aanbod."
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="border-white/10 bg-white/[0.055] text-white">
          <CardHeader>
            <CardTitle>Startstatus</CardTitle>
            <CardDescription className="text-slate-400">
              Dit overzicht gebruikt je echte profiel-, document-, voertuig- en
              planningsdata.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-[9rem_1fr] sm:items-center">
              <div className="relative grid aspect-square place-items-center rounded-full border border-white/10 bg-slate-950/35">
                <span className="text-4xl font-semibold">{progress}%</span>
                <span className="absolute bottom-8 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                  Gereed
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
                  {completedSteps} van {steps.length} stappen klaar
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  De volgende logische stap is: {nextStep.title.toLowerCase()}.
                  Zo voorkom je dat belangrijke compliance of planningszaken
                  blijven liggen.
                </p>
                <Button asChild className="mt-4 rounded-lg">
                  <Link href={nextStep.href}>
                    Volgende stap openen
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.045] text-white">
          <CardHeader>
            <CardTitle>Werkplek gereedheid</CardTitle>
            <CardDescription className="text-slate-400">
              Basis voordat je workflow echt soepel wordt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Documenten", `${settings.documents.length}`],
              ["Voertuigen", `${settings.vehicles.length}`],
              ["Open slots", `${availabilitySlots.length}`],
              ["Pakketten", `${packages.length}`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/30 px-3 py-2"
              >
                <span className="text-sm text-slate-300">{label}</span>
                <span className="font-semibold text-white">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <Link
              key={step.title}
              href={step.href}
              className={cn(
                "rounded-xl border p-4 text-white transition hover:-translate-y-0.5 hover:bg-white/8",
                step.done
                  ? "border-emerald-300/20 bg-emerald-400/10"
                  : "border-amber-300/22 bg-amber-400/10",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-lg",
                    step.done
                      ? "bg-emerald-300/15 text-emerald-200"
                      : "bg-amber-300/15 text-amber-200",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <Badge variant={step.done ? "success" : "warning"}>
                  {step.done ? "Klaar" : "Actie"}
                </Badge>
              </div>
              <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-white/55 uppercase">
                Stap {index + 1}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{step.text}</p>
            </Link>
          );
        })}
      </section>

      <Card className="border-white/10 bg-slate-950/25 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {completedSteps === steps.length ? (
              <CheckCircle2 className="size-5 text-emerald-300" />
            ) : (
              <CircleAlert className="size-5 text-amber-300" />
            )}
            Daarna
          </CardTitle>
          <CardDescription className="text-slate-400">
            Zodra de basis klopt, kan de regiepagina leerling-signalen,
            weekplanning, communicatie en omzetkansen veel scherper sturen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Slimme leerling-signalen",
              "Automatische weekplanning",
              "Agenda-integraties",
            ].map((label) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <FileCheck2 className="size-5 text-sky-200" />
                <span className="text-sm font-medium text-slate-200">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DashboardPerformanceMark route={ROUTE} label="InstructorOnboarding" />
    </div>
  );
}
