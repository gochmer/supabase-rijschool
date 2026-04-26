import Link from "next/link";
import { CalendarDays, Clock3, MapPin } from "lucide-react";

import { DataTableCard } from "@/components/dashboard/data-table-card";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { TrendCard } from "@/components/dashboard/trend-card";
import { LessonCalendar } from "@/components/calendar/lesson-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getLeerlingLessonRequests,
  getLeerlingLessons,
} from "@/lib/data/lesson-requests";

function getRequestLabel(request: {
  aanvraag_type?: "algemeen" | "pakket" | "proefles";
  pakket_naam?: string | null;
}) {
  if (request.aanvraag_type === "proefles") {
    return "Proefles";
  }

  if (request.aanvraag_type === "pakket") {
    return request.pakket_naam ?? "Pakketaanvraag";
  }

  return request.pakket_naam ?? "Losse aanvraag";
}

const urbanCardClassName =
  "rounded-[1.9rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.72)]";

export default async function LeerlingBoekingenPage() {
  const [requests, lessons] = await Promise.all([
    getLeerlingLessonRequests(),
    getLeerlingLessons(),
  ]);

  const pendingRequests = requests.filter(
    (item) => item.status === "aangevraagd"
  ).length;
  const plannedLessons = lessons.filter(
    (item) => item.status === "ingepland" || item.status === "geaccepteerd"
  ).length;
  const nextLesson = lessons.find(
    (item) => item.status === "ingepland" || item.status === "geaccepteerd"
  );

  return (
    <div className="space-y-6 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Planning"
        title="Boekingen en aanvragen"
        description="Volg aanvragen, bevestigde lessen en de belangrijkste planningsinformatie in een rustige, luxe en professionele leeromgeving."
        actions={
          <>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/10 bg-white/6 text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.42)] backdrop-blur hover:bg-white/10"
            >
              <Link href="/leerling/berichten">Berichten openen</Link>
            </Button>
            <Button
              asChild
              className="rounded-full border border-white/12 bg-[linear-gradient(135deg,#f8fafc,#cbd5e1)] text-slate-950 shadow-[0_22px_46px_-26px_rgba(148,163,184,0.42)] hover:brightness-[1.03]"
            >
              <Link href="/leerling/instructeurs">Nieuwe aanvraag starten</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: CalendarDays,
            label: "Volgende les",
            value: nextLesson ? `${nextLesson.datum} om ${nextLesson.tijd}` : "Nog niet ingepland",
            detail: nextLesson
              ? `${nextLesson.instructeur_naam} • ${nextLesson.locatie}`
              : "Bevestigde lessen verschijnen hier automatisch.",
          },
          {
            icon: Clock3,
            label: "Open aanvragen",
            value: `${pendingRequests}`,
            detail:
              pendingRequests > 0
                ? "Er wachten nog reacties op een of meer aanvragen."
                : "Er staan momenteel geen open aanvragen uit.",
          },
          {
            icon: MapPin,
            label: "Actieve planning",
            value: `${plannedLessons} les(sen)`,
            detail:
              plannedLessons > 0
                ? "Je planning staat klaar en blijft hier overzichtelijk in beeld."
                : "Zodra er lessen vastliggen wordt dit overzicht direct aangevuld.",
          },
        ].map((item) => (
          <div key={item.label} className={urbanCardClassName}>
            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-slate-100">
              <item.icon className="size-5" />
            </div>
            <p className="mt-4 text-[10px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
          </div>
        ))}
      </div>

      <LessonCalendar
        lessons={lessons}
        requests={requests}
        tone="urban"
        title="Agenda"
        description="Je bevestigde lessen en open lesaanvragen staan nu samen in een echte kalender, zodat je hele planning in een oogopslag zichtbaar blijft."
        emptyDescription="Zodra een les of aanvraag een concreet moment heeft, verschijnt die hier automatisch in je agenda."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <TrendCard
          tone="urban"
          title="Boekingsritme"
          value={`${requests.length + lessons.length}`}
          change={plannedLessons > 0 ? "+18%" : "Stand-by"}
          description="Totaal aantal boekingsmomenten en aanvragen in je huidige traject."
          data={[4, 6, 5, 7, 8, 9, 10]}
        />
        <InsightPanel
          tone="urban"
          title="Snelle status"
          description="De belangrijkste punten om je planning netjes en voorspelbaar te houden."
          items={[
            {
              label: "Open aanvragen",
              value: `${pendingRequests} aanvraag(en) wachten op reactie`,
              status: pendingRequests > 0 ? "Open" : "Rustig",
            },
            {
              label: "Ingeplande lessen",
              value: `${plannedLessons} les(sen) staan vast in je agenda`,
            },
            {
              label: "Aankomende locatie",
              value: nextLesson?.locatie ?? "Nog geen leslocatie bekend",
            },
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DataTableCard
          tone="urban"
          title="Lesaanvragen"
          description="Statussen: aangevraagd, geaccepteerd, geweigerd, ingepland, afgerond en geannuleerd."
          headers={["Instructeur", "Pakket", "Moment", "Status"]}
          rows={requests.map((request) => [
            request.instructeur_naam,
            getRequestLabel(request),
            `${request.voorkeursdatum} • ${request.tijdvak}`,
            request.status,
          ])}
          badgeColumns={[3]}
          emptyTitle="Nog geen lesaanvragen"
          emptyDescription="Zodra je een aanvraag verstuurt, verschijnt hier automatisch je volledige statusoverzicht."
        />
        <DataTableCard
          tone="urban"
          title="Geplande lessen"
          description="Je bevestigde lessen en de afspraken die al voor je klaarstaan."
          headers={["Les", "Datum", "Locatie", "Status"]}
          rows={lessons.map((lesson) => [
            lesson.titel,
            `${lesson.datum} om ${lesson.tijd}`,
            lesson.locatie,
            lesson.status,
          ])}
          badgeColumns={[3]}
          emptyTitle="Nog geen bevestigde lessen"
          emptyDescription="Geaccepteerde boekingen en ingeplande ritten worden hier direct zichtbaar."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {[
          {
            icon: CalendarDays,
            title: "Volgende stap",
            text: "Bevestig een aanvraag of plan een nieuwe les op een moment dat logisch aansluit op je week.",
          },
          {
            icon: Clock3,
            title: "Rust in je planning",
            text: "Met een helder schema kun je beter inschatten waar nog ruimte of opvolging nodig is.",
          },
          {
            icon: MapPin,
            title: "Locatie helder",
            text: "Je startlocatie blijft zichtbaar zodat je planning niet alleen datums, maar ook praktische context geeft.",
          },
        ].map((item) => (
          <div key={item.title} className={urbanCardClassName}>
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-slate-100">
              <item.icon className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">{item.text}</p>
          </div>
        ))}
      </div>

      <div className={urbanCardClassName}>
        <Badge variant="info" className="mb-3">
          Live planning
        </Badge>
        <p className="text-sm leading-7 text-slate-300">
          Deze pagina leest live lesaanvragen en lessen uit Supabase en zet ze neer in een veel netter, rustiger en professioneler overzicht.
        </p>
      </div>
    </div>
  );
}
