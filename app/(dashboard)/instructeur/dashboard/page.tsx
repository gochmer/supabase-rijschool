import Link from "next/link";

import { DataTableCard } from "@/components/dashboard/data-table-card";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { QuickActionGrid } from "@/components/dashboard/quick-action-grid";
import { MetricCard } from "@/components/metric-card";
import { LessonEditDialog } from "@/components/dashboard/lesson-edit-dialog";
import { Button } from "@/components/ui/button";
import {
  getInstructeurDashboardMetrics,
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentNotifications } from "@/lib/data/notifications";

export default async function InstructeurDashboardPage() {
  const [metrics, lessons, requests, notifications] = await Promise.all([
    getInstructeurDashboardMetrics(),
    getInstructeurLessons(),
    getInstructeurLessonRequests(),
    getCurrentNotifications(),
  ]);

  const todayLessons = lessons.slice(0, 3);

  return (
    <>
      <PageHeader
        title="Instructeur dashboard"
        description="Beheer je planning, aanvragen, leerlingen, inkomsten en profielkwaliteit vanuit een modern overzicht."
        actions={
          <>
            <Button asChild variant="outline" className="h-9 rounded-full text-[13px]">
              <Link href="/instructeur/profiel">Profiel beheren</Link>
            </Button>
            <Button asChild className="h-9 rounded-full text-[13px]">
              <Link href="/instructeur/beschikbaarheid">Beschikbaarheid bijwerken</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <QuickActionGrid
        items={[
          {
            href: "/instructeur/aanvragen",
            label: "Actie nodig",
            title: "Openstaande aanvragen bekijken",
            description: "Reageer snel op nieuwe leerlingen en houd je instroom gezond en overzichtelijk.",
          },
          {
            href: "/instructeur/beschikbaarheid",
            label: "Planning",
            title: "Nieuwe tijdsloten toevoegen",
            description: "Zorg voor meer boekingen door je actuele beschikbaarheid zichtbaar te houden.",
          },
          {
            href: "/instructeur/pakketten",
            label: "Aanbod",
            title: "Pakketten bouwen",
            description: "Maak trajecten die direct op je openbare profiel zichtbaar worden en je propositie sterker maken.",
          },
          {
            href: "/instructeur/berichten",
            label: "Communicatie",
            title: "Berichten opvolgen",
            description: "Beantwoord vragen van leerlingen zonder je workflow te verlaten.",
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <InsightPanel
          title="Vandaag in focus"
          description="De belangrijkste operationele signalen voor je werkdag."
          items={[
            {
              label: "Planning vandaag",
              value: todayLessons.length
                ? `${todayLessons.length} les(sen) vragen aandacht`
                : "Nog geen lessen voor vandaag",
            },
            {
              label: "Open aanvragen",
              value: `${requests.filter((item) => item.status === "aangevraagd").length} aanvraag(en) wachten op antwoord`,
            },
            {
              label: "Ongelezen meldingen",
              value: `${notifications.filter((item) => item.ongelezen).length} nieuwe melding(en)`,
            },
          ]}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Planning (bewerken mogelijk)</h3>
          <div className="grid gap-3">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="font-semibold">{lesson.titel}</p>
                  <p className="text-sm text-muted-foreground">
                    {lesson.datum} - {lesson.tijd} ({lesson.leerling_naam})
                  </p>
                </div>
                <LessonEditDialog lesson={lesson} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <DataTableCard
          title="Openstaande aanvragen"
          description="Aanvragen die wachten op acceptatie of afwijzing."
          headers={["Leerling", "Voorkeursdatum", "Tijdvak", "Status"]}
          rows={requests.map((request) => [
            request.leerling_naam,
            request.voorkeursdatum,
            request.tijdvak,
            request.status,
          ])}
          badgeColumns={[3]}
          emptyTitle="Geen openstaande aanvragen"
          emptyDescription="Je inbox is bijgewerkt. Nieuwe lesaanvragen verschijnen hier automatisch."
        />

        <div className="rounded-[1.35rem] border p-4">
          <h3 className="text-lg font-semibold">Profielboost</h3>
          <p className="text-sm text-muted-foreground">
            Kleine verbeteringen aan je profiel zorgen voor meer vertrouwen en boekingen.
          </p>
        </div>
      </div>
    </>
  );
}
