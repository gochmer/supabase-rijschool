import Link from "next/link";
import {
  CalendarCheck2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FolderCheck,
  Sparkles,
} from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { RequestStatusActions } from "@/components/dashboard/request-status-actions";
import { TrendCard } from "@/components/dashboard/trend-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInstructeurLessonRequests } from "@/lib/data/lesson-requests";
import { getLocationOptions } from "@/lib/data/locations";
import {
  getRequestStatusLabel,
  getRequestStatusVariant,
  requestStatusTimeline,
} from "@/lib/lesson-request-flow";
import { getRijlesTypeLabel } from "@/lib/lesson-types";
import type { LesAanvraag } from "@/lib/types";
import { cn } from "@/lib/utils";

function isTimelineStepActive(
  stepValue: (typeof requestStatusTimeline)[number]["value"],
  currentStatus: string
) {
  const order = requestStatusTimeline.map((item) => item.value);
  const currentIndex = order.indexOf(currentStatus as (typeof order)[number]);
  const stepIndex = order.indexOf(stepValue);

  if (currentStatus === "geweigerd") {
    return stepValue === "aangevraagd";
  }

  return stepIndex <= currentIndex;
}

function getRequestPrimaryLabel(request: LesAanvraag) {
  if (request.aanvraag_type === "proefles") {
    return "Proefles";
  }

  if (request.pakket_naam) {
    return request.pakket_naam;
  }

  return "Lesaanvraag";
}

function RequestWorkflowCard({
  request,
  locationOptions,
  emphasizeAction = false,
}: {
  request: LesAanvraag;
  locationOptions: Awaited<ReturnType<typeof getLocationOptions>>;
  emphasizeAction?: boolean;
}) {
  return (
    <Card className="overflow-hidden border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
      <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="p-5">
          <CardHeader className="p-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-lg">{request.leerling_naam}</CardTitle>
                <CardDescription>
                  {request.voorkeursdatum} • {request.tijdvak}
                </CardDescription>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{getRequestPrimaryLabel(request)}</Badge>
                  {request.les_type ? (
                    <Badge variant="info">
                      {getRijlesTypeLabel(request.les_type)}
                    </Badge>
                  ) : null}
                  {request.aanvraag_type === "pakket" ? (
                    <Badge variant="success">Pakketvraag</Badge>
                  ) : null}
                </div>
              </div>
              <Badge variant={getRequestStatusVariant(request.status)}>
                {getRequestStatusLabel(request.status)}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="mt-4 p-0">
            <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {request.bericht || "Geen extra toelichting meegegeven bij deze aanvraag."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {requestStatusTimeline.map((step) => {
                const active = isTimelineStepActive(step.value, request.status);
                return (
                  <span
                    key={`${request.id}-${step.value}`}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase ${
                      active
                        ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100"
                        : "border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                );
              })}
              {request.status === "geweigerd" ? (
                <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-rose-700 uppercase dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                  Geweigerd
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              {emphasizeAction ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 dark:bg-amber-400/10 dark:text-amber-100">
                  <CircleAlert className="size-4" />
                  Nu reageren houdt de boekingskans hoog
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 dark:bg-white/5">
                  <FolderCheck className="size-4" />
                  Status staat netjes verwerkt
                </span>
              )}
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 dark:bg-white/5">
                <CheckCircle2 className="size-4" />
                Leerling ziet dezelfde statusflow terug
              </span>
            </div>
          </CardContent>
        </div>

        <div className="flex flex-col justify-between border-t border-slate-100 bg-slate-50/70 p-5 dark:border-white/10 dark:bg-white/5 xl:border-t-0 xl:border-l">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-primary uppercase">
              {request.status === "aangevraagd" ? "Nu beslissen" : "Afhandeling"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {request.status === "aangevraagd"
                ? "Accepteer of weiger direct. De lesflow, notificaties en vervolgstatus werken daarna meteen door."
                : "Deze aanvraag staat al verder in de flow. Gebruik dit blok vooral om de stand rustig terug te lezen."}
            </p>
          </div>
          <div className="mt-5">
            <RequestStatusActions
              requestId={request.id}
              status={request.status}
              locationOptions={locationOptions}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default async function AanvragenPage() {
  const [requests, locationOptions] = await Promise.all([
    getInstructeurLessonRequests(),
    getLocationOptions(),
  ]);

  const pendingRequests = requests.filter((item) => item.status === "aangevraagd");
  const acceptedRequests = requests.filter((item) =>
    ["geaccepteerd", "ingepland"].includes(item.status)
  );
  const rejectedRequests = requests.filter((item) => item.status === "geweigerd");
  const completedRequests = requests.filter((item) => item.status === "afgerond");
  const processedRequests = requests.filter((item) => item.status !== "aangevraagd");
  const proeflesRequests = requests.filter(
    (item) => item.aanvraag_type === "proefles"
  ).length;
  const packageRequests = requests.filter(
    (item) => item.aanvraag_type === "pakket"
  ).length;
  const decisionScore = Math.min(
    100,
    50 + pendingRequests.length * 9 + proeflesRequests * 3 + packageRequests * 2
  );
  const heroSignals = [
    {
      label: "Nu beslissen",
      value: `${pendingRequests.length}`,
      hint: "Aanvragen wachten op reactie",
      tone:
        "border-amber-200/80 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-500/10",
    },
    {
      label: "Klaar voor les",
      value: `${acceptedRequests.length}`,
      hint: "Geaccepteerd of ingepland",
      tone:
        "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-500/10",
    },
    {
      label: "Instroommix",
      value: `${proeflesRequests}/${packageRequests}`,
      hint: "Proeflessen / pakketten",
      tone:
        "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10",
    },
  ];
  const statCards = [
    {
      label: "Nu beslissen",
      value: `${pendingRequests.length}`,
      description: "Aanvragen die nu nog op jouw reactie wachten.",
      icon: Clock3,
      tone: pendingRequests.length > 0 ? "amber" : "emerald",
    },
    {
      label: "Klaar voor les",
      value: `${acceptedRequests.length}`,
      description: "Geaccepteerd of al ingepland in het traject.",
      icon: CalendarCheck2,
      tone: "emerald",
    },
    {
      label: "Proeflessen",
      value: `${proeflesRequests}`,
      description: "Handig om snel om te zetten naar een eerste traject.",
      icon: Sparkles,
      tone: "sky",
    },
    {
      label: "Pakketvragen",
      value: `${packageRequests}`,
      description: "Gericht op directe pakketconversie en vervolg.",
      icon: FolderCheck,
      tone: "violet",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        tone="urban"
        title="Lesaanvragen"
        description="Werk open aanvragen eerst af en houd daarna rustig zicht op wat al verwerkt is."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/instructeur/berichten">Berichten openen</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/instructeur/beschikbaarheid">Beschikbaarheid beheren</Link>
            </Button>
          </>
        }
      />

      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,#0f172a,#172554,#1e293b)] p-5 text-white shadow-[0_34px_120px_-62px_rgba(15,23,42,0.75)] dark:border-white/10 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(59,130,246,0.18),transparent_26%),radial-gradient(circle_at_70%_86%,rgba(148,163,184,0.16),transparent_24%)]" />
        <div className="relative grid gap-5 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/78 uppercase">
              <Sparkles className="size-3.5" />
              Aanvragen cockpit
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Houd beslissen, plannen en opvolgen strak in één rustige flow.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/74 sm:text-[15px]">
              Werk eerst de open aanvragen af, lees daarna de verwerkte flow terug
              en houd zicht op waar nieuwe proeflessen of pakketkansen binnenkomen.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {heroSignals.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-[1.2rem] border px-3.5 py-3 backdrop-blur",
                    item.tone
                  )}
                >
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-white/68 uppercase">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs leading-5 text-white/68">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.55rem] border border-white/14 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/62 uppercase">
                  Beslisfocus
                </p>
                <p className="mt-1 text-4xl font-semibold">{decisionScore}</p>
              </div>
              <CircleAlert className="size-8 text-sky-200" />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#22c55e,#facc15)]"
                style={{ width: `${Math.max(decisionScore, 6)}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Gebaseerd op open aanvragen, geplande vervolgflow en hoeveel instroom
              nu nog jouw reactie nodig heeft.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <DashboardStatCard
            key={item.label}
            detail={item.description}
            icon={item.icon}
            label={item.label}
            tone={item.tone}
            value={item.value}
          />
        ))}
      </div>

      <Tabs defaultValue="nu" className="space-y-4">
        <TabsList className="sticky top-28 z-10 !h-auto min-h-12 w-full justify-start overflow-x-auto overflow-y-hidden rounded-[1.45rem] border border-white/60 bg-white/85 p-1 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.32)] [-ms-overflow-style:none] [scrollbar-width:none] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72 [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="nu" className="min-h-10 gap-2 rounded-[1rem] px-3 text-sm data-active:bg-amber-200 data-active:text-slate-950">
            Nu beslissen
            <span className="rounded-full bg-slate-950/8 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-200">
              {pendingRequests.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="verwerkt"
            className="min-h-10 gap-2 rounded-[1rem] px-3 text-sm data-active:bg-emerald-200 data-active:text-slate-950"
          >
            Verwerkt
            <span className="rounded-full bg-slate-950/8 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-200">
              {processedRequests.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="inzicht"
            className="min-h-10 gap-2 rounded-[1rem] px-3 text-sm data-active:bg-sky-200 data-active:text-slate-950"
          >
            Inzicht
            <span className="rounded-full bg-slate-950/8 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-200">
              3
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nu" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-400/10 dark:text-amber-100">
                    <Clock3 className="size-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">
                      Vandaag eerst
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Begin met open aanvragen. Snelle reactie houdt het traject warm en maakt plannen makkelijker.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-white/5">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Nog te beoordelen
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                    {pendingRequests.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Gebruik deze tab als je besliswerkplek.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-white/5">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Klaar voor planning
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                    {acceptedRequests.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Aanvragen die al verder zijn in de flow.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-4">
            {pendingRequests.length ? (
              pendingRequests.map((request) => (
                <RequestWorkflowCard
                  key={request.id}
                  request={request}
                  locationOptions={locationOptions}
                  emphasizeAction
                />
              ))
            ) : (
              <div className="rounded-[1.8rem] border border-dashed border-border bg-white/80 p-8 text-sm leading-7 text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Er staan nu geen open aanvragen meer klaar. Je kunt rustig door naar verwerkt of de beschikbaarheid nalopen.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="verwerkt" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-white/5">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Geaccepteerd
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                  {acceptedRequests.length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-white/5">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Geweigerd
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                  {rejectedRequests.length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-white/5">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Afgerond
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                  {completedRequests.length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            {processedRequests.length ? (
              processedRequests.map((request) => (
                <RequestWorkflowCard
                  key={request.id}
                  request={request}
                  locationOptions={locationOptions}
                />
              ))
            ) : (
              <div className="rounded-[1.8rem] border border-dashed border-border bg-white/80 p-8 text-sm leading-7 text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Er zijn nog geen verwerkte aanvragen om terug te lezen.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inzicht" className="space-y-4">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <TrendCard
              title="Aanvraagritme"
              value={`${requests.length}`}
              change="+21%"
              description="Nieuwe aanvragen per periode, bedoeld om je reactietempo en instroom in beeld te houden."
              data={[2, 3, 4, 4, 5, 6, 8]}
            />
            <InsightPanel
              title="Wat nu slim is"
              description="Compacte signalen om sneller te zien waar de meeste winst zit."
              items={[
                {
                  label: "Direct oppakken",
                  value: `${pendingRequests.length} aanvraag(en) wachten op reactie`,
                  status: pendingRequests.length ? "Actie nodig" : "Rustig",
                },
                {
                  label: "Klaar voor les",
                  value: `${acceptedRequests.length} aanvraag(en) zijn al geaccepteerd of ingepland`,
                },
                {
                  label: "Instroommix",
                  value: `${proeflesRequests} proeflessen en ${packageRequests} pakketvragen in beeld`,
                },
              ]}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-white/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <CalendarCheck2 className="size-4 text-primary" />
                  <p className="font-semibold text-slate-950 dark:text-white">
                    Snelle planning
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Open daarna meteen je beschikbaarheid om geaccepteerde aanvragen sneller door te zetten.
                </p>
              </CardContent>
            </Card>
            <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-white/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-primary" />
                  <p className="font-semibold text-slate-950 dark:text-white">
                    Rustige afhandeling
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Gebruik `Verwerkt` als terugleeslaag, zodat je beslissen en administratie niet door elkaar lopen.
                </p>
              </CardContent>
            </Card>
            <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-white/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <FolderCheck className="size-4 text-primary" />
                  <p className="font-semibold text-slate-950 dark:text-white">
                    Betere opvolging
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Als je veel proeflesaanvragen ziet, kun je daarna makkelijker doorpakken in berichten of pakketten.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
