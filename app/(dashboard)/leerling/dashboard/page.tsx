import Link from "next/link";

import { DataTableCard } from "@/components/dashboard/data-table-card";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { LessonFocusCard } from "@/components/dashboard/lesson-focus-card";
import { LearnerRequestOverview } from "@/components/dashboard/learner-request-overview";
import { PageHeader } from "@/components/dashboard/page-header";
import { QuickActionGrid } from "@/components/dashboard/quick-action-grid";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import {
  getLeerlingDashboardMetrics,
  getLeerlingLessonRequests,
  getLeerlingLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentNotifications } from "@/lib/data/notifications";

export default async function LeerlingDashboardPage() {
  const [metrics, lessons, requests, notifications] = await Promise.all([
    getLeerlingDashboardMetrics(),
    getLeerlingLessons(),
    getLeerlingLessonRequests(),
    getCurrentNotifications(),
  ]);

  const upcomingLessons = lessons.slice(0, 4);
  const nextLesson = lessons.find((lesson) =>
    ["geaccepteerd", "ingepland"].includes(lesson.status)
  );
  const pendingRequests = requests.filter((item) => item.status === "aangevraagd");
  const acceptedRequests = requests.filter((item) =>
    ["geaccepteerd", "ingepland"].includes(item.status)
  );
  const unreadNotifications = notifications.filter((item) => item.ongelezen);

  return (
    <>
      <PageHeader
        title="Leerling dashboard"
        description="Volg je aanvragen, geplande lessen, voortgang en meldingen vanuit één rustig overzicht."
        actions={
          <>
            <Button asChild variant="outline" className="h-9 rounded-full text-[13px]">
              <Link href="/leerling/profiel">Profiel bijwerken</Link>
            </Button>
            <Button asChild className="h-9 rounded-full text-[13px]">
              <Link href="/instructeurs">Nieuwe instructeur zoeken</Link>
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
            href: "/instructeurs",
            label: "Nieuwe match",
            title: "Vergelijk instructeurs",
            description:
              "Zoek op regio, prijs, beoordeling en lesauto om sneller de juiste match te vinden.",
          },
          {
            href: "/leerling/boekingen",
            label: "Boekingen",
            title: "Bekijk je aanvragen",
            description:
              "Controleer welke aanvragen nog wachten en welke lessen al zijn bevestigd.",
          },
          {
            href: "/leerling/favorieten",
            label: "Favorieten",
            title: "Opgeslagen instructeurs",
            description:
              "Bewaar profielen die je later wilt vergelijken of direct wilt benaderen.",
          },
          {
            href: "/leerling/profiel",
            label: "Profiel",
            title: "Maak je profiel compleet",
            description:
              "Een duidelijk profiel helpt instructeurs sneller en beter reageren op je aanvraag.",
          },
        ]}
      />

      <LessonFocusCard
        lesson={nextLesson}
        title="Aankomende lesfocus"
        description={
          nextLesson
            ? `Je eerstvolgende moment met ${nextLesson.instructeur_naam} staat klaar. Voeg hem toe aan je agenda of open meteen je route.`
            : undefined
        }
      />

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <InsightPanel
          title="Vandaag in focus"
          description="De belangrijkste signalen voor jouw rijlestraject."
          items={[
            {
              label: "Open aanvragen",
              value: pendingRequests.length
                ? `${pendingRequests.length} aanvraag(en) wachten op reactie`
                : "Geen open aanvragen",
            },
            {
              label: "Bevestigde trajecten",
              value: acceptedRequests.length
                ? `${acceptedRequests.length} traject(en) bevestigd of ingepland`
                : "Nog geen traject bevestigd",
            },
            {
              label: "Ongelezen meldingen",
              value: `${unreadNotifications.length} nieuwe melding(en)`,
            },
          ]}
        />

        <DataTableCard
          title="Komende lessen"
          description="Je eerstvolgende lessen en geplande afspraken."
          headers={["Les", "Datum", "Instructeur", "Locatie", "Status"]}
          rows={upcomingLessons.map((lesson) => [
            lesson.titel,
            `${lesson.datum} - ${lesson.tijd}`,
            lesson.instructeur_naam,
            lesson.locatie,
            lesson.status,
          ])}
          badgeColumns={[4]}
          emptyTitle="Nog geen lessen ingepland"
          emptyDescription="Zodra een instructeur je aanvraag accepteert of een les plant, verschijnt die hier."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <LearnerRequestOverview
          title="Je lesaanvragen"
          description="Alle aanvragen die via de booking flow naar instructeurs zijn verstuurd, inclusief verplaatsen of annuleren zolang ze nog open staan."
          requests={requests}
          emptyTitle="Nog geen aanvragen"
          emptyDescription="Start met vergelijken en vraag direct een proefles of pakket aan bij een instructeur."
        />

        <div className="rounded-[1.35rem] border border-white/70 bg-white/84 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Slimme volgende stap</h3>
          <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground dark:text-slate-300">
            Houd je traject overzichtelijk door open aanvragen snel op te volgen en je profiel compleet te houden.
          </p>
          <div className="mt-3.5 grid gap-2">
            {[
              pendingRequests.length
                ? "Je hebt nog aanvragen die wachten op reactie van een instructeur."
                : "Vraag een proefles aan om je traject te starten.",
              "Sla interessante instructeurs op zodat je ze later makkelijk terugvindt.",
              "Werk je voorkeuren en contactgegevens bij in je profiel.",
              "Check meldingen zodra een instructeur reageert op je aanvraag.",
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
