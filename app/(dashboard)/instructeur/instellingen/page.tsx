import { CarFront, CircleAlert, FileCheck2, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentInstructorSettingsOverview } from "@/lib/data/instructor-account";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function getDocumentVariant(status: string) {
  if (status === "goedgekeurd") {
    return "success" as const;
  }

  if (status === "afgekeurd") {
    return "danger" as const;
  }

  return "warning" as const;
}

export default async function InstructeurInstellingenPage() {
  const overview = await getCurrentInstructorSettingsOverview();
  const activeVehicles = overview.vehicles.filter(
    (vehicle) => vehicle.status === "actief"
  ).length;
  const maintenanceVehicles = overview.vehicles.length - activeVehicles;
  const approvedDocuments = overview.documents.filter(
    (document) => document.status === "goedgekeurd"
  ).length;
  const actionDocuments = overview.documents.filter(
    (document) => document.status !== "goedgekeurd"
  ).length;
  const uploadedDocuments = overview.documents.filter(
    (document) => document.hasUrl
  ).length;

  return (
    <>
      <PageHeader
        title="Instellingen"
        description="Houd voertuigen en documentstatus rustig in beeld vanuit één compact instellingenoverzicht."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CarFront className="size-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Actieve voertuigen
              </p>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {activeVehicles}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {maintenanceVehicles
                ? `${maintenanceVehicles} in onderhoud of aandacht`
                : "Alles staat rijklaar"}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Documenten akkoord
              </p>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {approvedDocuments}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Goedgekeurde documenten op je profiel.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileCheck2 className="size-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Bestanden gekoppeld
              </p>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {uploadedDocuments}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Documenten waar al een bestand aan hangt.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CircleAlert className="size-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Nu checken
              </p>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {actionDocuments}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Documenten die nog niet akkoord zijn.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overzicht" className="space-y-4">
        <TabsList className="h-auto w-full rounded-[1.4rem] bg-white/70 p-1 dark:bg-white/5">
          <TabsTrigger value="overzicht" className="min-h-10 rounded-[1rem] px-3 text-sm">
            Overzicht
          </TabsTrigger>
          <TabsTrigger value="voertuigen" className="min-h-10 rounded-[1rem] px-3 text-sm">
            Voertuigen
          </TabsTrigger>
          <TabsTrigger value="documenten" className="min-h-10 rounded-[1rem] px-3 text-sm">
            Documenten
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overzicht" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Wat staat goed</CardTitle>
                <CardDescription>
                  Rustige samenvatting van wat al op orde is.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {activeVehicles
                      ? `${activeVehicles} voertuig(en) actief`
                      : "Nog geen actieve voertuigen"}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Handig voor je profielweergave en dagelijkse planning.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {approvedDocuments
                      ? `${approvedDocuments} document(en) goedgekeurd`
                      : "Nog geen goedgekeurde documenten"}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Dit houdt je profiel en verificatie stevig.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Nu slim om te checken</CardTitle>
                <CardDescription>
                  Alleen de punten die mogelijk nog aandacht vragen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {maintenanceVehicles
                      ? `${maintenanceVehicles} voertuig(en) vragen aandacht`
                      : "Geen voertuigwaarschuwingen"}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Onderhoud of statusupdates houd je planning voorspelbaar.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {actionDocuments
                      ? `${actionDocuments} document(en) nog niet akkoord`
                      : "Geen open documentchecks"}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Check vooral afkeuringen of documenten zonder bestand.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voertuigen">
          <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
            <CardHeader>
              <CardTitle>Voertuigen</CardTitle>
              <CardDescription>
                Voertuigen gekoppeld aan je instructeursprofiel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.vehicles.length ? (
                overview.vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-4 text-sm dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {vehicle.model}
                      </p>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">
                        {vehicle.kenteken} • {vehicle.transmissie}
                      </p>
                    </div>
                    <Badge
                      variant={
                        vehicle.status === "actief" ? "success" : "warning"
                      }
                    >
                      {vehicle.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-slate-50/80 p-5 text-sm leading-7 text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Nog geen voertuigen gevonden voor dit instructeursprofiel.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documenten">
          <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
            <CardHeader>
              <CardTitle>Documentstatus</CardTitle>
              <CardDescription>
                Status van documenten die aan je profiel zijn gekoppeld.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.documents.length ? (
                overview.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-4 text-sm dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {document.naam}
                      </p>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">
                        {document.datum} •{" "}
                        {document.hasUrl ? "Bestand gekoppeld" : "Nog geen bestand"}
                      </p>
                    </div>
                    <Badge variant={getDocumentVariant(document.status)}>
                      {document.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-slate-50/80 p-5 text-sm leading-7 text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Nog geen documenten gevonden voor dit instructeursprofiel.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
