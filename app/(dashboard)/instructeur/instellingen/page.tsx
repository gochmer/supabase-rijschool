import {
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CarFront,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileCheck2,
  FileWarning,
  Gauge,
  IdCard,
  Info,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  Wrench,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  findDocumentByKeywords,
  getAuthorityStatusLabel,
  getAuthorityTone,
  getDocumentTone,
  getDocumentVariant,
  getVehicleTone,
  isDocumentReady,
} from "@/components/instructor/instructor-settings-model";
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
  const wrmDocument = findDocumentByKeywords(overview.documents, [
    "wrm",
    "bevoegd",
    "instructeurspas",
    "instructeur pas",
  ]);
  const licenseDocument = findDocumentByKeywords(overview.documents, [
    "rijbewijs",
    "rijbewijsdocument",
  ]);
  const vogDocument = findDocumentByKeywords(overview.documents, [
    "vog",
    "verklaring omtrent gedrag",
  ]);
  const risDocument = findDocumentByKeywords(overview.documents, ["ris"]);
  const kvkDocument = findDocumentByKeywords(overview.documents, [
    "kvk",
    "kamer van koophandel",
  ]);
  const insuranceDocument = findDocumentByKeywords(overview.documents, [
    "verzekering",
    "aansprakelijk",
    "avb",
  ]);
  const requiredAuthorityChecks = [
    {
      label: "WRM-bevoegdheidspas",
      description:
        "Basiscontrole voor instructeursbevoegdheid. Leg pasnummer, categorie en geldig-tot datum vast.",
      document: wrmDocument,
      required: true,
      icon: IdCard,
      meta: "Verplicht",
      privacy: "Afgeschermd/admin",
    },
    {
      label: "Rijbewijs categorie-match",
      description:
        "Controleer of het rijbewijs past bij de lescategorie die op het profiel wordt aangeboden.",
      document: licenseDocument,
      required: true,
      icon: KeyRound,
      meta: "Categorie",
      privacy: "Afgeschermd/admin",
    },
    {
      label: "VOG / betrouwbaarheid",
      description:
        "Sterk voor onboarding, platformvertrouwen en eventuele hercertificering of review.",
      document: vogDocument,
      required: true,
      icon: ShieldCheck,
      meta: "Controle",
      privacy: "Afgeschermd/admin",
    },
  ];
  const optionalAuthorityChecks = [
    {
      label: "RIS-pas",
      description:
        "Alleen tonen of vragen wanneer de instructeur RIS-lessen aanbiedt of ermee adverteert.",
      document: risDocument,
      required: false,
      icon: Award,
      meta: "Optioneel",
      privacy: "Alleen bij RIS",
    },
    {
      label: "KvK / onderneming",
      description:
        "Handig voor facturatie, zakelijke controle en professionele profielkwaliteit.",
      document: kvkDocument,
      required: false,
      icon: BriefcaseBusiness,
      meta: "Zakelijk",
      privacy: "Afgeschermd/admin",
    },
    {
      label: "Verzekering / aansprakelijkheid",
      description:
        "Leg vast dat zakelijke dekking of aansprakelijkheid controleerbaar is.",
      document: insuranceDocument,
      required: false,
      icon: LockKeyhole,
      meta: "Zekerheid",
      privacy: "Afgeschermd/admin",
    },
  ];
  const requiredAuthorityReady = requiredAuthorityChecks.filter((item) =>
    isDocumentReady(item.document)
  ).length;
  const missingAuthorityChecks =
    requiredAuthorityChecks.length - requiredAuthorityReady;
  const publicTrustBadges = [
    {
      label: "WRM gecontroleerd",
      active: isDocumentReady(wrmDocument),
      detail: "Publieke badge zonder pasnummer te tonen.",
    },
    {
      label: "Rijbewijs match",
      active: isDocumentReady(licenseDocument),
      detail: "Categorie past bij het lesaanbod.",
    },
    {
      label: "Voertuig rijklaar",
      active: activeVehicles > 0,
      detail: "Minimaal een actief lesvoertuig.",
    },
    {
      label: "Documentkluis compleet",
      active: missingAuthorityChecks === 0,
      detail: "Belangrijkste controles staan klaar.",
    },
  ];
  const vehicleChecklist = [
    "Dubbele bediening",
    "APK & verzekering",
    "Examen geschikt",
    "Onderhoud actueel",
  ];
  const recommendedDocumentTypes = [
    {
      label: "WRM-bevoegdheidspas",
      keywords: ["wrm", "bevoegd"],
    },
    {
      label: "Rijbewijs",
      keywords: ["rijbewijs"],
    },
    {
      label: "VOG",
      keywords: ["vog", "verklaring omtrent gedrag"],
    },
    {
      label: "RIS-pas optioneel",
      keywords: ["ris"],
    },
    {
      label: "KvK",
      keywords: ["kvk", "kamer van koophandel"],
    },
    {
      label: "Verzekering/AVB",
      keywords: ["verzekering", "aansprakelijk", "avb"],
    },
  ];

  const vehicleCoverage = overview.vehicles.length
    ? Math.round((activeVehicles / overview.vehicles.length) * 100)
    : 0;
  const documentCoverage = overview.documents.length
    ? Math.round((approvedDocuments / overview.documents.length) * 100)
    : 0;
  const uploadCoverage = overview.documents.length
    ? Math.round((uploadedDocuments / overview.documents.length) * 100)
    : 0;
  const authorityCoverage = Math.round(
    (requiredAuthorityReady / requiredAuthorityChecks.length) * 100
  );
  const settingsHealthScore =
    overview.vehicles.length || overview.documents.length
      ? Math.round(
          (vehicleCoverage + documentCoverage + uploadCoverage + authorityCoverage) /
            4
        )
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
      label: "Bevoegdheden klaar",
      value: `${requiredAuthorityReady}/${requiredAuthorityChecks.length}`,
      detail:
        missingAuthorityChecks === 0
          ? "WRM, rijbewijs en betrouwbaarheid staan netjes klaar."
          : "Start met WRM, rijbewijs en VOG voor een sterk profiel.",
      icon: ShieldCheck,
      tone:
        missingAuthorityChecks === 0
          ? "border-sky-200/80 bg-sky-50/80 dark:border-sky-400/20 dark:bg-sky-500/10"
          : "border-slate-200/80 bg-slate-50/90 dark:border-white/10 dark:bg-white/5",
    },
    {
      label: "Documenten akkoord",
      value: `${approvedDocuments}/${overview.documents.length || 0}`,
      detail:
        approvedDocuments > 0
          ? "Goedgekeurde documenten versterken direct vertrouwen."
          : "Nog geen goedgekeurd document zichtbaar.",
      icon: FileCheck2,
      tone:
        approvedDocuments > 0
          ? "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-500/10"
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
        description="Maak je instructeurwerkplek rustiger en betrouwbaarder met een helder overzicht van voertuigen, bevoegdheden en profielbestanden."
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
              Houd voertuigen, bevoegdheden en profielbestanden strak op orde.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/74 sm:text-[15px]">
              Dit is je rustige controlelaag: wat staat al goed, wat mist nog
              op je profiel en welke onderdelen verdienen nu het eerst
              aandacht.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Voertuigen",
                  value: `${vehicleCoverage}%`,
                  hint: "Rijklaar",
                },
                {
                  label: "Bevoegdheid",
                  value: `${authorityCoverage}%`,
                  hint: "WRM basis",
                },
                {
                  label: "Documenten",
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
            label: "Bevoegdheden klaar",
            value: `${requiredAuthorityReady}/${requiredAuthorityChecks.length}`,
            description:
              missingAuthorityChecks === 0
                ? "WRM, rijbewijs en VOG staan scherp."
                : "Maak de basiscontrole compleet.",
            icon: IdCard,
            tone: "from-teal-500/12 to-emerald-500/10",
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
        <TabsList className="sticky top-28 z-10 !h-auto min-h-12 w-full justify-start overflow-x-auto overflow-y-hidden rounded-[1.45rem] border border-white/60 bg-white/85 p-1 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.32)] [-ms-overflow-style:none] [scrollbar-width:none] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72 [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="overzicht" className="min-h-10 rounded-[1rem] px-3 text-sm data-active:bg-sky-200 data-active:text-slate-950">
            Overzicht
          </TabsTrigger>
          <TabsTrigger value="bevoegdheden" className="min-h-10 rounded-[1rem] px-3 text-sm data-active:bg-emerald-200 data-active:text-slate-950">
            Bevoegdheden
          </TabsTrigger>
          <TabsTrigger value="voertuigen" className="min-h-10 rounded-[1rem] px-3 text-sm data-active:bg-amber-200 data-active:text-slate-950">
            Voertuigen
          </TabsTrigger>
          <TabsTrigger value="documenten" className="min-h-10 rounded-[1rem] px-3 text-sm data-active:bg-violet-200 data-active:text-slate-950">
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
                    title:
                      missingAuthorityChecks === 0
                        ? "Belangrijkste bevoegdheden compleet"
                        : `${requiredAuthorityReady}/${requiredAuthorityChecks.length} bevoegdheden klaar`,
                    text: "WRM, rijbewijs en VOG vormen de basis voor vertrouwen zonder gevoelige details publiek te tonen.",
                    icon: IdCard,
                    tone:
                      missingAuthorityChecks === 0
                        ? "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10"
                        : "border-amber-200/80 bg-amber-50/90 dark:border-amber-400/20 dark:bg-amber-500/10",
                    iconTone:
                      missingAuthorityChecks === 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
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
                    title: missingAuthorityChecks
                      ? `${missingAuthorityChecks} bevoegdheidcheck(s) open`
                      : "Bevoegdheden op orde",
                    text: "Start met WRM-bevoegdheidspas, rijbewijs categorie en VOG voordat je extra documenten toevoegt.",
                    icon: missingAuthorityChecks ? ClipboardCheck : CheckCircle2,
                    tone: missingAuthorityChecks
                      ? "border-amber-200/80 bg-amber-50/90 dark:border-amber-400/20 dark:bg-amber-500/10"
                      : "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10",
                    iconTone: missingAuthorityChecks
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

        <TabsContent value="bevoegdheden" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Bevoegdheden & compliance</CardTitle>
                <CardDescription>
                  De kerncontrole voor een betrouwbare instructeur: bevoegd,
                  passend bij de categorie en netjes vastgelegd.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {requiredAuthorityChecks.map((item) => {
                  const tone = getAuthorityTone(item.document, item.required);

                  return (
                    <div
                      key={item.label}
                      className={cn("rounded-[1.35rem] border p-4", tone.shell)}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                              tone.icon
                            )}
                          >
                            <item.icon className="size-4.5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-950 dark:text-white">
                                {item.label}
                              </p>
                              <Badge variant="default">{item.meta}</Badge>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <Badge variant={tone.badge}>
                          {getAuthorityStatusLabel(item.document, item.required)}
                        </Badge>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="info">{item.privacy}</Badge>
                        <Badge variant="default">
                          {item.document?.datum ?? "Nog niet aangeleverd"}
                        </Badge>
                        <Badge variant="default">
                          {item.document?.hasUrl
                            ? "Bestand gekoppeld"
                            : "Bestand nodig"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Publieke vertrouwenslaag</CardTitle>
                <CardDescription>
                  Toon straks badges aan leerlingen, maar houd nummers,
                  bestanden en vervaldata afgeschermd voor admincontrole.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                      <BadgeCheck className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">
                        {missingAuthorityChecks === 0
                          ? "Klaar voor sterke profielbadges"
                          : "Nog niet alles badge-klaar"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {missingAuthorityChecks === 0
                          ? "De belangrijkste controles kunnen als rustige vertrouwenssignalen worden gebruikt."
                          : "Maak eerst de basiscontrole af voor je dit publiek als vertrouwen toont."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  {publicTrustBadges.map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "rounded-[1.1rem] border px-4 py-3",
                        item.active
                          ? "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10"
                          : "border-slate-200/80 bg-slate-50/90 dark:border-white/10 dark:bg-white/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">
                            {item.label}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                            {item.detail}
                          </p>
                        </div>
                        <Badge variant={item.active ? "success" : "default"}>
                          {item.active ? "Actief" : "Wacht"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[1.2rem] border border-sky-200/80 bg-sky-50/90 p-4 dark:border-sky-400/20 dark:bg-sky-500/10">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 size-4.5 text-sky-700 dark:text-sky-200" />
                    <p className="text-sm leading-6 text-sky-900 dark:text-sky-100">
                      Beste structuur: leerling ziet alleen rustige badges zoals
                      WRM gecontroleerd; admin ziet documenten, status,
                      vervaldata en uploaddetails.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Aanvullende documenten</CardTitle>
                <CardDescription>
                  Niet alles hoeft verplicht te zijn, maar dit maakt het profiel
                  zakelijker en makkelijker te beheren.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {optionalAuthorityChecks.map((item) => {
                  const tone = getAuthorityTone(item.document, item.required);

                  return (
                    <div
                      key={item.label}
                      className={cn("rounded-[1.2rem] border p-4", tone.shell)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                              tone.icon
                            )}
                          >
                            <item.icon className="size-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950 dark:text-white">
                              {item.label}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <Badge variant={tone.badge}>
                          {getAuthorityStatusLabel(item.document, item.required)}
                        </Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="info">{item.privacy}</Badge>
                        <Badge variant="default">{item.meta}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Slimme opvolging</CardTitle>
                <CardDescription>
                  De informatie die later het meeste werk en supportvragen
                  voorkomt.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {[
                  {
                    title: "WRM geldig-tot datum",
                    text: "Gebruik dit later voor automatische herinneringen ruim voor verlopen of hercertificering.",
                    icon: CalendarDays,
                  },
                  {
                    title: "Categorieen per bevoegdheid",
                    text: "Koppel categorie B, automaat/handgeschakeld en eventuele specialisaties aan het profiel.",
                    icon: ClipboardCheck,
                  },
                  {
                    title: "Document opnieuw controleren",
                    text: "Maak afkeuringen concreet met korte redenen, zodat de instructeur direct weet wat nodig is.",
                    icon: RefreshCw,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950/6 text-primary dark:bg-white/10 dark:text-sky-200">
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
                De voertuigen die je planning, profiel en transmissie-aanbod dragen,
                met duidelijke veiligheidspunten voor later beheer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-3">
                {[
                  {
                    title: "Les- en examenvoertuig",
                    text: "Controleer dubbele bediening, transmissie en of het voertuig past bij de aangeboden categorie.",
                    icon: CarFront,
                  },
                  {
                    title: "APK & verzekering",
                    text: "Voeg later vervaldata toe, zodat verlopen dekking of keuring nooit stilletjes blijft liggen.",
                    icon: ShieldCheck,
                  },
                  {
                    title: "Onderhoud & veiligheid",
                    text: "Houd onderhoud, storingen en bijzonderheden strak per voertuig bij.",
                    icon: Gauge,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950/6 text-primary dark:bg-white/10 dark:text-sky-200">
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
              </div>

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

                        <div className="mt-4 rounded-[1rem] border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                          <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                            Aanbevolen checkpunten
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {vehicleChecklist.map((item) => (
                              <Badge key={item} variant="default">
                                {item}
                              </Badge>
                            ))}
                          </div>
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
              <CardTitle>Documentkluis</CardTitle>
              <CardDescription>
                Welke documenten al vertrouwen geven, welke nog opvolging nodig
                hebben en welke typen je het liefst standaard klaarzet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">
                      Aanbevolen documenttypes
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Begin met WRM, rijbewijs en VOG. De rest maakt beheer,
                      facturatie en vertrouwen sterker.
                    </p>
                  </div>
                  <Badge variant="info">{uploadedDocuments} uploads</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {recommendedDocumentTypes.map((item) => (
                    <Badge
                      key={item.label}
                      variant={
                        findDocumentByKeywords(overview.documents, item.keywords)
                          ? "success"
                          : "default"
                      }
                    >
                      {item.label}
                    </Badge>
                  ))}
                </div>
              </div>

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
                  Nog geen documenten gevonden. Start met WRM-bevoegdheidspas,
                  rijbewijs categorie en VOG; daarna kun je RIS, KvK en
                  verzekering toevoegen.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
