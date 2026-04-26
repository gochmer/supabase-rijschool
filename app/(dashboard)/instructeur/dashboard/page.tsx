import Link from "next/link";

import { DataTableCard } from "@/components/dashboard/data-table-card";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { QuickActionGrid } from "@/components/dashboard/quick-action-grid";
import { MetricCard } from "@/components/metric-card";
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

        <DataTableCard
          title="Planning"
          description="Je eerstvolgende lessen en geplande ritten in een rustig professioneel overzicht."
          headers={["Les", "Datum", "Leerling", "Locatie", "Status"]}
          rows={lessons.map((lesson) => [
            lesson.titel,
            `${lesson.datum} - ${lesson.tijd}`,
            lesson.leerling_naam,
            lesson.locatie,
            lesson.status,
          ])}
          badgeColumns={[4]}
          emptyTitle="Nog geen lessen ingepland"
          emptyDescription="Zodra leerlingen een aanvraag doen en lessen worden bevestigd, bouwt je planning zich hier op."
        />
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

        <div className="rounded-[1.35rem] border border-white/70 bg-white/84 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Profielboost</h3>
          <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground dark:text-slate-300">
            Kleine verbeteringen aan je profiel zorgen vaak direct voor meer vertrouwen en hogere conversie.
          </p>
          <div className="mt-3.5 grid gap-2">
            {[
              "Voeg extra beschikbaarheid in de avond toe.",
              "Maak pakketten aan die passen bij starter, opfris of examenfocus.",
              "Werk je bio bij met specialisaties en lesstijl.",
              "Controleer of je prijs en werkgebied actueel zijn.",
            ].map((item) => (
              <div key={item} className="rounded-[0.95rem] bg-slate-50/85 px-3 py-2.5 text-[13px] leading-6 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
