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

  return (
    <>
      <PageHeader
        title="Instellingen"
        description="Beheer accountvoorkeuren, voertuigen en documentstatus."
      />
      <div className="grid gap-6 xl:grid-cols-2">
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
                  className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">{vehicle.model}</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">
                      {vehicle.kenteken} | {vehicle.transmissie}
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
                  className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">{document.naam}</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">
                      {document.datum} |{" "}
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
      </div>
    </>
  );
}
