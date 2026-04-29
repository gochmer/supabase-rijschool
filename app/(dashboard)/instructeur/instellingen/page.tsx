import {
  BadgeCheck,
  CarFront,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  FileWarning,
  ShieldCheck,
  Sparkles,
  Upload,
  Wrench,
} from "lucide-react";

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
import { cn } from "@/lib/utils";

function getDocumentVariant(status: string) {
  if (status === "goedgekeurd") {
    return "success" as const;
  }

  if (status === "afgekeurd") {
    return "danger" as const;
  }

  return "warning" as const;
}

function getDocumentTone(status: string, hasUrl: boolean) {
  if (status === "goedgekeurd") {
    return {
      shell:
        "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10",
      icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
      label: "Profielklaar",
    };
  }

  if (!hasUrl) {
    return {
      shell:
        "border-amber-200/80 bg-amber-50/90 dark:border-amber-400/20 dark:bg-amber-500/10",
      icon: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
      label: "Upload mist",
    };
  }

  if (status === "afgekeurd") {
    return {
      shell:
        "border-rose-200/80 bg-rose-50/90 dark:border-rose-400/20 dark:bg-rose-500/10",
      icon: "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200",
      label: "Actie nodig",
    };
  }

  return {
    shell:
      "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10",
    icon: "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-200",
    label: "Wordt bekeken",
  };
}

function getVehicleTone(status: string) {
  if (status === "actief") {
    return {
      shell:
        "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-500/10",
      icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
      label: "Rijklaar",
    };
  }

  return {
    shell:
      "border-amber-200/80 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-500/10",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
    label: "Aandacht",
  };
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

  const vehicleCoverage = overview.vehicles.length
    ? Math.round((activeVehicles / overview.vehicles.length) * 100)
    : 0;
  const documentCoverage = overview.documents.length
    ? Math.round((approvedDocuments / overview.documents.length) * 100)
    : 0;
  const uploadCoverage = overview.documents.length
    ? Math.round((uploadedDocuments / overview.documents.length) * 100)
    : 0;
  const settingsHealthScore =
    overview.vehicles.length || overview.documents.length
      ? Math.round((vehicleCoverage + documentCoverage + uploadCoverage) / 3)
      : 0;

  const statusMoments = [
    {
      label: "Voertuigen rijklaar",
      value: `${activeVehicles}/${overview.vehicles.length || 0}`,
      detail:
        activeVehicles > 0
          ? "Actieve voertuigen staan klaar voor planning en profielweergave."
          : "Nog geen rijklaar voertuig gekoppeld.",
      icon: CarFront,
      tone:
        activeVehicles > 0
          ? "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-500/10"
          : "border-slate-200/80 bg-slate-50/90 dark:border-white/10 dark:bg-white/5",
    },
    {
      label: "Documenten akkoord",
      value: `${approvedDocuments}/${overview.documents.length || 0}`,
      detail:
        approvedDocuments > 0
          ? "Goedgekeurde documenten versterken direct vertrouwen."
          : "Nog geen goedgekeurd document zichtbaar.",
      icon: ShieldCheck,
      tone:
        approvedDocuments > 0
          ? "border-sky-200/80 bg-sky-50/80 dark:border-sky-400/20 dark:bg-sky-500/10"
          : "border-slate-200/80 bg-slate-50/90 dark:border-white/10 dark:bg-white/5",
    },
    {
      label: "Uploads aanwezig",
      value: `${uploadedDocuments}/${overview.documents.length || 0}`,
      detail:
        uploadedDocuments > 0
          ? "Bestanden hangen al aan je profielitems."
          : "Nog geen documenten met bestand gekoppeld.",
      icon: Upload,
      tone:
        uploadedDocuments > 0
          ? "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10"
          : "border-slate-200/80 bg-slate-50/90 dark:border-white/10 dark:bg-white/5",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instellingen"
        description="Maak je instructeurwerkplek rustiger en betrouwbaarder met een helder overzicht van voertuigen, verificatie en profielbestanden."
      />

      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,#0f172a,#172554,#1e293b)] p-5 text-white shadow-[0_34px_120px_-62px_rgba(15,23,42,0.75)] dark:border-white/10 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(59,130,246,0.18),transparent_26%),radial-gradient(circle_at_70%_86%,rgba(148,163,184,0.16),transparent_24%)]" />
        <div className="relative grid gap-5 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/78 uppercase">
              <Sparkles className="size-3.5" />
              Instellingen cockpit
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Houd voertuigen, verificatie en profielbestanden strak op orde.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/74 sm:text-[15px]">
              Dit is je rustige controlelaag: wat staat al goed, wat mist nog
              op je profiel en welke onderdelen verdienen nu het eerst
              aandacht.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {statusMoments.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-[1.2rem] border px-3.5 py-3 backdrop-blur",
                    item.tone
                  )}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="size-4 text-white" />
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-white/68 uppercase">
                      {item.label}
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs leading-5 text-white/68">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.55rem] border border-white/14 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/62 uppercase">
                  Werkplek score
                </p>
                <p className="mt-1 text-4xl font-semibold">{settingsHealthScore}</p>
              </div>
              <Badge className="border border-white/16 bg-white/10 text-white">
                {actionDocuments > 0 || maintenanceVehicles > 0
                  ? "Aandacht open"
                  : "Sterk op orde"}
              </Badge>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#2dd4bf,#facc15)]"
                style={{ width: `${Math.max(settingsHealthScore, 6)}%` }}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Voertuigen",
                  value: `${vehicleCoverage}%`,
                  hint: "Rijklaar",
                },
                {
                  label: "Verificatie",
                  value: `${documentCoverage}%`,
                  hint: "Akkoord",
                },
                {
                  label: "Bestanden",
                  value: `${uploadCoverage}%`,
                  hint: "Documentdekking",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-[1rem] bg-white/10 px-3 py-3">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-white/62 uppercase">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-white/62">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Actieve voertuigen",
            value: `${activeVehicles}`,
            description: maintenanceVehicles
              ? `${maintenanceVehicles} in onderhoud of aandacht`
              : "Alles staat rijklaar",
            icon: CarFront,
            tone: "from-emerald-500/12 to-cyan-500/10",
          },
          {
            label: "Documenten akkoord",
            value: `${approvedDocuments}`,
            description: "Goedgekeurde documenten op je profiel.",
            icon: ShieldCheck,
            tone: "from-sky-500/12 to-indigo-500/10",
          },
          {
            label: "Bestanden gekoppeld",
            value: `${uploadedDocuments}`,
            description: "Documenten waar al een bestand aan hangt.",
            icon: FileCheck2,
            tone: "from-slate-500/12 to-sky-500/8",
          },
          {
            label: "Nu checken",
            value: `${actionDocuments}`,
            description: "Documenten die nog niet akkoord zijn.",
            icon: CircleAlert,
            tone: "from-amber-500/14 to-rose-500/10",
          },
        ].map((item) => (
          <Card
            key={item.label}
            className="overflow-hidden border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]"
          >
            <CardContent className="relative p-4">
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-20 bg-gradient-to-r opacity-80",
                  item.tone
                )}
              />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-950/6 text-primary dark:bg-white/10 dark:text-sky-200">
                    <item.icon className="size-4" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {item.label}
                  </p>
                </div>
                <p className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
                  {item.value}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overzicht" className="space-y-4">
        <TabsList className="h-auto w-full rounded-[1.45rem] border border-white/60 bg-white/75 p-1 dark:border-white/10 dark:bg-white/5">
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
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Wat staat sterk</CardTitle>
                <CardDescription>
                  Rustige signalen van wat nu al vertrouwen en stabiliteit geeft.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {[
                  {
                    title: activeVehicles
                      ? `${activeVehicles} voertuig(en) rijklaar`
                      : "Nog geen actief voertuig",
                    text: "Actieve voertuigen houden je profiel geloofwaardig en je planning soepel inzetbaar.",
                    icon: CheckCircle2,
                    tone:
                      "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10",
                    iconTone:
                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
                  },
                  {
                    title: approvedDocuments
                      ? `${approvedDocuments} document(en) akkoord`
                      : "Nog geen document goedgekeurd",
                    text: "Goedgekeurde documenten versterken je verificatie en publieke betrouwbaarheid.",
                    icon: BadgeCheck,
                    tone:
                      "border-sky-200/80 bg-sky-50/90 dark:border-sky-400/20 dark:bg-sky-500/10",
                    iconTone:
                      "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200",
                  },
                  {
                    title: uploadedDocuments
                      ? `${uploadedDocuments} bestand(en) gekoppeld`
                      : "Nog geen document geupload",
                    text: "Bestanden die al hangen maken het reviewproces sneller en rustiger.",
                    icon: Upload,
                    tone:
                      "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10",
                    iconTone:
                      "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-200",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className={cn(
                      "rounded-[1.25rem] border p-4",
                      item.tone
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                          item.iconTone
                        )}
                      >
                        <item.icon className="size-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Nu slim om te checken</CardTitle>
                <CardDescription>
                  Alleen wat je profiel of werkplek nu echt kan blokkeren.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {[
                  {
                    title: maintenanceVehicles
                      ? `${maintenanceVehicles} voertuig(en) vragen aandacht`
                      : "Geen voertuigwaarschuwingen",
                    text: "Onderhoud of statusupdates houden je planning voorspelbaar en je aanbod eerlijk.",
                    icon: maintenanceVehicles ? Wrench : CheckCircle2,
                    tone: maintenanceVehicles
                      ? "border-amber-200/80 bg-amber-50/90 dark:border-amber-400/20 dark:bg-amber-500/10"
                      : "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10",
                    iconTone: maintenanceVehicles
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
                  },
                  {
                    title: actionDocuments
                      ? `${actionDocuments} document(en) nog niet akkoord`
                      : "Geen open documentchecks",
                    text: "Kijk vooral naar afkeuringen, ontbrekende uploads of documenten die nog in beoordeling hangen.",
                    icon: actionDocuments ? FileWarning : CheckCircle2,
                    tone: actionDocuments
                      ? "border-rose-200/80 bg-rose-50/90 dark:border-rose-400/20 dark:bg-rose-500/10"
                      : "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10",
                    iconTone: actionDocuments
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
                  },
                  {
                    title:
                      uploadedDocuments < overview.documents.length
                        ? `${overview.documents.length - uploadedDocuments} document(en) missen nog een bestand`
                        : "Alle documenten hebben een bestand",
                    text: "Ontbrekende uploads zorgen vaak voor vertraging in review of profielvertrouwen.",
                    icon:
                      uploadedDocuments < overview.documents.length
                        ? Upload
                        : CheckCircle2,
                    tone:
                      uploadedDocuments < overview.documents.length
                        ? "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10"
                        : "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10",
                    iconTone:
                      uploadedDocuments < overview.documents.length
                        ? "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-200"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className={cn(
                      "rounded-[1.25rem] border p-4",
                      item.tone
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                          item.iconTone
                        )}
                      >
                        <item.icon className="size-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voertuigen">
          <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
            <CardHeader>
              <CardTitle>Voertuigen</CardTitle>
              <CardDescription>
                De voertuigen die je planning, profiel en transmissie-aanbod nu dragen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview.vehicles.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {overview.vehicles.map((vehicle) => {
                    const tone = getVehicleTone(vehicle.status);

                    return (
                      <div
                        key={vehicle.id}
                        className={cn(
                          "rounded-[1.35rem] border p-4 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.22)]",
                          tone.shell
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex size-11 items-center justify-center rounded-2xl",
                                tone.icon
                              )}
                            >
                              <CarFront className="size-4.5" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-950 dark:text-white">
                                {vehicle.model}
                              </p>
                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {vehicle.kenteken}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              vehicle.status === "actief" ? "success" : "warning"
                            }
                          >
                            {vehicle.status}
                          </Badge>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge variant="info">{tone.label}</Badge>
                          <Badge variant="default">{vehicle.transmissie}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[1.35rem] border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
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
                Welke documenten al vertrouwen geven en welke nog opvolging nodig hebben.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview.documents.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {overview.documents.map((document) => {
                    const tone = getDocumentTone(document.status, document.hasUrl);

                    return (
                      <div
                        key={document.id}
                        className={cn(
                          "rounded-[1.35rem] border p-4 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.22)]",
                          tone.shell
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex size-11 items-center justify-center rounded-2xl",
                                tone.icon
                              )}
                            >
                              {document.hasUrl ? (
                                <FileCheck2 className="size-4.5" />
                              ) : (
                                <Upload className="size-4.5" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-950 dark:text-white">
                                {document.naam}
                              </p>
                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {document.datum}
                              </p>
                            </div>
                          </div>
                          <Badge variant={getDocumentVariant(document.status)}>
                            {document.status}
                          </Badge>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge variant="info">{tone.label}</Badge>
                          <Badge variant="default">
                            {document.hasUrl ? "Bestand gekoppeld" : "Nog geen bestand"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[1.35rem] border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Nog geen documenten gevonden voor dit instructeursprofiel.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
