import Link from "next/link";
import { CheckCircle2, Clock3, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { RequestStatusActions } from "@/components/dashboard/request-status-actions";
import { TrendCard } from "@/components/dashboard/trend-card";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInstructeurLessonRequests } from "@/lib/data/lesson-requests";
import { getRijlesTypeLabel } from "@/lib/lesson-types";

export default async function AanvragenPage() {
  const requests = await getInstructeurLessonRequests();

  return (
    <>
      <PageHeader
        title="Lesaanvragen"
        description="Accepteer of weiger aanvragen, houd prioriteit in beeld en werk sneller vanuit een rijkere flow."
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

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <TrendCard
          title="Aanvraagritme"
          value={`${requests.length}`}
          change="+21%"
          description="Nieuwe aanvragen per periode, bedoeld om je capaciteit en reactietempo te bewaken."
          data={[2, 3, 4, 4, 5, 6, 8]}
        />
        <InsightPanel
          title="Vandaag prioriteit"
          description="Snelle signalen om aanvragen beter en sneller op te volgen."
          items={[
            {
              label: "Nog te beoordelen",
              value: `${requests.filter((item) => item.status === "aangevraagd").length} aanvraag(en) wachten op reactie`,
              status: "Actie nodig",
            },
            {
              label: "Geaccepteerd",
              value: `${requests.filter((item) => item.status === "geaccepteerd").length} aanvraag(en) al verwerkt`,
            },
            {
              label: "Tijdsdruk",
              value: "Snelle reactie verhoogt kans op bevestigde boeking.",
            },
          ]}
        />
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card
            key={request.id}
            className="overflow-hidden border-0 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)]"
          >
            <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6">
                <CardHeader className="p-0">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <CardTitle>{request.leerling_naam}</CardTitle>
                      <CardDescription>
                        {request.voorkeursdatum} - {request.tijdvak}
                      </CardDescription>
                      {request.pakket_naam ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>
                            {request.aanvraag_type === "proefles"
                              ? "Proefles"
                              : request.pakket_naam}
                          </Badge>
                          {request.les_type ? (
                            <Badge variant="info">
                              {getRijlesTypeLabel(request.les_type)}
                            </Badge>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <Badge
                      variant={
                        request.status === "aangevraagd"
                          ? "warning"
                          : request.status === "geaccepteerd"
                            ? "success"
                            : "info"
                      }
                    >
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="mt-5 p-0">
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                    {request.bericht || "Geen extra toelichting meegegeven bij deze aanvraag."}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                      <Clock3 className="size-4" />
                      Reageer snel voor hogere conversie
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                      <CheckCircle2 className="size-4" />
                      Status wordt direct gesynchroniseerd
                    </span>
                  </div>
                </CardContent>
              </div>

              <div className="flex flex-col justify-between border-t border-slate-100 bg-slate-50/70 p-6 xl:border-t-0 xl:border-l">
                <div>
                  <p className="text-xs font-semibold tracking-[0.24em] text-primary uppercase">
                    Snelle afhandeling
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Accepteer of weiger direct. Leerling en instructeur zien dezelfde statusflow terug in het platform.
                  </p>
                </div>
                <div className="mt-5">
                  <RequestStatusActions requestId={request.id} status={request.status} />
                </div>
              </div>
            </div>
          </Card>
        ))}

        {requests.length === 0 ? (
          <div className="rounded-[1.9rem] border border-dashed border-border bg-white/80 p-8 text-sm leading-7 text-muted-foreground">
            Er zijn momenteel geen nieuwe aanvragen die wachten op actie.
          </div>
        ) : null}
      </div>

      <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(29,78,216,0.95))] p-5 text-white">
        <div className="flex items-center gap-3">
          <Sparkles className="size-4 text-sky-200" />
          <p className="font-semibold">Slimme opvolging</p>
        </div>
        <p className="mt-2 text-sm leading-7 text-white/75">
          We kunnen hier later ook prioriteitsscores, automatische labels en reactietimer-achtige inzichten aan toevoegen.
        </p>
      </div>
    </>
  );
}
