import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { DataTableCard } from "@/components/dashboard/data-table-card";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { InstructorGrowthRadar } from "@/components/dashboard/instructor-growth-radar";
import { PageHeader } from "@/components/dashboard/page-header";
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
import { getCurrentInstructorIncomeCockpit } from "@/lib/data/instructor-account";

function getIncomeBadgeLabel(value: "success" | "warning" | "danger" | "info") {
  if (value === "success") return "Sterk";
  if (value === "warning") return "Let op";
  if (value === "danger") return "Urgent";
  return "Kans";
}

export default async function InkomstenPage() {
  const cockpit = await getCurrentInstructorIncomeCockpit();
  const topStats = cockpit.stats.slice(0, 4);
  const secondaryStats = cockpit.stats.slice(4);
  const summaryIcons = [WalletCards, CalendarClock, Sparkles, CircleAlert];
  const overviewSignals = [
    {
      title: "Wat staat sterk",
      items: [
        topStats[0]
          ? `${topStats[0].label}: ${topStats[0].value.toLowerCase()}`
          : "Nog geen weekomzet zichtbaar.",
        topStats[3]
          ? `${topStats[3].label}: ${topStats[3].detail}`
          : "Nog geen pakketportfolio opgebouwd.",
      ],
    },
    {
      title: "Nu slim om te checken",
      items: cockpit.actions.length
        ? cockpit.actions.slice(0, 3).map((item) => item.detail)
        : [
            "Er liggen nu geen directe omzet- of opvolgsignalen open in je cockpit.",
          ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inkomsten"
        description="Een cockpit voor geplande omzet, pakketwaarde, open gaten en leerlingen waar nu geld of vervolg blijft liggen."
        actions={
          <>
            <Button asChild variant="outline" className="h-9 rounded-full text-[13px]">
              <Link href="/instructeur/beschikbaarheid">Agenda openen</Link>
            </Button>
            <Button asChild variant="outline" className="h-9 rounded-full text-[13px]">
              <Link href="/instructeur/leerlingen">Leerlingenwerkplek</Link>
            </Button>
            <Button asChild className="h-9 rounded-full text-[13px]">
              <Link href="/instructeur/pakketten">Pakketten beheren</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topStats.map((stat, index) => {
          const Icon = summaryIcons[index] ?? WalletCards;

          return (
            <Card
              key={stat.label}
              className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Icon className="size-4 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {stat.label}
                  </p>
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {stat.detail}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overzicht" className="space-y-4">
        <TabsList className="h-auto w-full rounded-[1.4rem] bg-white/70 p-1 dark:bg-white/5">
          <TabsTrigger value="overzicht" className="min-h-10 rounded-[1rem] px-3 text-sm">
            Overzicht
          </TabsTrigger>
          <TabsTrigger value="cockpit" className="min-h-10 rounded-[1rem] px-3 text-sm">
            Cockpit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overzicht" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {overviewSignals.map((section) => (
              <Card
                key={section.title}
                className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]"
              >
                <CardHeader className="pb-3">
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>
                    Rustige samenvatting van de belangrijkste omzet- en opvolgsignalen.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {section.items.map((item, index) => (
                    <div
                      key={`${section.title}-${index}`}
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5"
                    >
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {item}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {secondaryStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.35rem] border border-white/70 bg-white/88 p-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/6"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary dark:text-sky-300">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                  {stat.value}
                </p>
                <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cockpit" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <TrendCard
              title="Omzetritme"
              value={cockpit.stats[0]?.value ?? "Nog leeg"}
              change={`${cockpit.growthInsights.summary.readyActions} acties klaar`}
              description="Deze weekse omzetpotentie op basis van lessen die al ingepland of bijna rond zijn."
              data={[
                Math.max(cockpit.gapOpportunities.length, 1),
                Math.max(cockpit.actions.length, 1),
                Math.max(cockpit.packageHealth.length, 1),
                Math.max(cockpit.growthInsights.packageOpportunities.length, 1),
                Math.max(cockpit.growthInsights.upgradeCandidates.length, 1),
                Math.max(cockpit.growthInsights.fillGaps.length, 1),
              ]}
            />
            <InsightPanel
              title="Waar laat je nu geld liggen?"
              description="De belangrijkste financiele signalen uit je agenda, pakketten en actieve trajecten."
              items={[
                {
                  label: "Open gaten",
                  value:
                    cockpit.gapOpportunities.length > 0
                      ? `${cockpit.gapOpportunities.length} boekbare momenten kunnen nog lesomzet worden.`
                      : "Je week heeft nu geen duidelijke open gaten die opvallen.",
                  status: cockpit.gapOpportunities.length > 0 ? "Actie" : undefined,
                },
                {
                  label: "Bijna leeg",
                  value:
                    secondaryStats.find((stat) => stat.label === "Bijna door pakket heen")
                      ?.detail ?? "Geen pakketten die nu direct op spanning staan.",
                },
                {
                  label: "Zonder pakket",
                  value:
                    secondaryStats.find((stat) => stat.label === "Zonder logisch pakket")
                      ?.detail ?? "Geen actieve trajecten zonder pakket gevonden.",
                  status:
                    Number(
                      secondaryStats.find(
                        (stat) => stat.label === "Zonder logisch pakket"
                      )?.value ?? "0"
                    ) > 0
                      ? "Kans"
                      : undefined,
                },
              ]}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
            <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                      <WalletCards className="size-4 text-primary dark:text-sky-300" />
                      Pakketwaarde per leerling
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300">
                      Zie in een oogopslag wie bijna door zijn pakket heen is en waar vervolgomzet of rust in planning klaarstaat.
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline" className="h-8 rounded-full px-3 text-[12px]">
                    <Link href="/instructeur/leerlingen">Open werkplek</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {cockpit.packageHealth.length ? (
                  cockpit.packageHealth.map((item) => (
                    <div
                      key={item.leerlingId}
                      className="rounded-[1.15rem] border border-slate-200 bg-slate-50/88 p-3.5 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[14px] font-semibold text-slate-950 dark:text-white">
                              {item.naam}
                            </p>
                            <Badge variant={item.badge}>{item.badgeLabel}</Badge>
                          </div>
                          <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-300">
                            {item.pakketNaam} • {item.packageValueLabel}
                          </p>
                        </div>
                        <Button asChild variant="outline" className="h-8 rounded-full px-3 text-[12px]">
                          <Link href="/instructeur/leerlingen">
                            Open leerling
                            <ArrowRight className="ml-1 size-3.5" />
                          </Link>
                        </Button>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a,#2563eb,#38bdf8)]"
                          style={{ width: `${Math.max(item.usageRatio, 8)}%` }}
                        />
                      </div>
                      <div className="mt-3 grid gap-2 text-[12px] text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                        <p>{item.lessonsUsedLabel}</p>
                        <p>{item.remainingLessonsLabel}</p>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                        {item.nextStep}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.15rem] border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600 dark:border-white/12 dark:bg-white/5 dark:text-slate-300">
                    Nog geen actieve pakketkoppelingen gevonden die omzet en dekking kunnen tonen.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                      <CalendarClock className="size-4 text-primary dark:text-sky-300" />
                      Vrije omzetkansen
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300">
                      Open boekbare gaten die nu het meest direct omzet of ritme kunnen opleveren.
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline" className="h-8 rounded-full px-3 text-[12px]">
                    <Link href="/instructeur/beschikbaarheid">Open agenda</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {cockpit.gapOpportunities.length ? (
                  cockpit.gapOpportunities.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1.15rem] border border-slate-200 bg-slate-50/88 p-3.5 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-semibold text-slate-950 dark:text-white">
                          {item.title}
                        </p>
                        <Badge variant={item.badge}>{getIncomeBadgeLabel(item.badge)}</Badge>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                        {item.detail}
                      </p>
                      {item.meta ? (
                        <p className="mt-2 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                          {item.meta}
                        </p>
                      ) : null}
                      <div className="mt-3">
                        <Button asChild variant="outline" className="h-8 rounded-full px-3 text-[12px]">
                          <Link href={item.href}>
                            {item.ctaLabel}
                            <ArrowRight className="ml-1 size-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.15rem] border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600 dark:border-white/12 dark:bg-white/5 dark:text-slate-300">
                    Er springen nu geen duidelijke open momenten uit die direct als omzetkans op tafel liggen.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <InstructorGrowthRadar insights={cockpit.growthInsights} />

          <DataTableCard
            title="Inkomstenoverzicht"
            description="Live opgebouwd uit ingeplande, geaccepteerde en afgeronde lessen die aan jouw instructeursprofiel gekoppeld zijn."
            headers={["Omschrijving", "Bedrag", "Datum", "Status"]}
            rows={cockpit.incomeRows.map((row) => [
              row.omschrijving,
              row.bedrag,
              row.datum,
              row.status,
            ])}
            badgeColumns={[3]}
            emptyTitle="Nog geen inkomstenmomenten"
            emptyDescription="Zodra lessen worden ingepland of afgerond, verschijnt hier automatisch je omzetlijn."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
