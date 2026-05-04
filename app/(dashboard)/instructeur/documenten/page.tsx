import Link from "next/link";
import {
  FileCheck2,
  FileText,
  FileWarning,
  IdCard,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  findDocumentByKeywords,
  getAuthorityStatusLabel,
  getAuthorityTone,
  getDocumentStatusLabel,
  getDocumentTone,
  getDocumentVariant,
  isDocumentReady,
} from "@/components/instructor/instructor-settings-model";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteInstructorDocumentAction,
  uploadInstructorDocumentAction,
} from "@/lib/actions/instructor-operations";
import { getCurrentInstructorSettingsOverview } from "@/lib/data/instructor-account";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";
import { cn } from "@/lib/utils";

const ROUTE = "/instructeur/documenten";

async function uploadDocumentFormAction(formData: FormData) {
  "use server";

  await uploadInstructorDocumentAction(formData);
}

async function deleteDocumentFormAction(formData: FormData) {
  "use server";

  await deleteInstructorDocumentAction(formData);
}

export default async function InstructeurDocumentenPage() {
  const overview = await timedDashboardRoute(ROUTE, () =>
    timedDashboardData(
      ROUTE,
      "settings-overview",
      getCurrentInstructorSettingsOverview,
    ),
  );

  const approvedDocuments = overview.documents.filter(
    (document) => document.status === "goedgekeurd",
  );
  const uploadedDocuments = overview.documents.filter((document) => document.hasUrl);
  const actionDocuments = overview.documents.filter(
    (document) => document.status !== "goedgekeurd" || !document.hasUrl,
  );
  const requiredChecks = [
    {
      label: "WRM-bevoegdheidspas",
      description: "Basisdocument voor instructeursbevoegdheid.",
      document: findDocumentByKeywords(overview.documents, [
        "wrm",
        "bevoegd",
        "instructeurspas",
        "instructeur pas",
      ]),
      required: true,
      icon: IdCard,
    },
    {
      label: "Rijbewijs",
      description: "Categorie-match met het type lessen dat je aanbiedt.",
      document: findDocumentByKeywords(overview.documents, [
        "rijbewijs",
        "rijbewijsdocument",
      ]),
      required: true,
      icon: ShieldCheck,
    },
    {
      label: "VOG",
      description: "Vertrouwenssignaal voor kwaliteit en veiligheid.",
      document: findDocumentByKeywords(overview.documents, [
        "vog",
        "verklaring omtrent gedrag",
      ]),
      required: true,
      icon: FileCheck2,
    },
    {
      label: "KvK",
      description: "Bedrijfsgegevens voor administratie en vertrouwen.",
      document: findDocumentByKeywords(overview.documents, [
        "kvk",
        "kamer van koophandel",
      ]),
      required: false,
      icon: FileText,
    },
    {
      label: "Verzekering",
      description: "Bewijs van dekking of aansprakelijkheid.",
      document: findDocumentByKeywords(overview.documents, [
        "verzekering",
        "aansprakelijk",
        "avb",
      ]),
      required: false,
      icon: FileWarning,
    },
  ];
  const readyRequiredChecks = requiredChecks.filter((item) =>
    isDocumentReady(item.document),
  ).length;

  return (
    <div className="space-y-4">
      <PageHeader
        tone="urban"
        title="Documenten"
        description="Een aparte documentkluis voor WRM, rijbewijs, VOG, KvK, verzekering en overige bewijsstukken."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            label: "Documenten",
            value: `${overview.documents.length}`,
            text: "Alle documenten uit Supabase.",
            tone: "sky",
          },
          {
            label: "Akkoord",
            value: `${approvedDocuments.length}`,
            text: "Goedgekeurd en bruikbaar als vertrouwenssignaal.",
            tone: "emerald",
          },
          {
            label: "Actie nodig",
            value: `${actionDocuments.length}`,
            text: uploadedDocuments.length
              ? "Controleer status of ontbrekende uploads."
              : "Nog geen bestanden gekoppeld.",
            tone: actionDocuments.length ? "amber" : "emerald",
          },
        ].map((item) => (
          <Card
            key={item.label}
            className={cn(
              "border-white/10 text-white",
              item.tone === "sky" && "bg-sky-400/10",
              item.tone === "emerald" && "bg-emerald-400/10",
              item.tone === "amber" && "bg-amber-400/10",
            )}
          >
            <CardHeader>
              <CardDescription className="text-white/65">
                {item.label}
              </CardDescription>
              <CardTitle className="text-4xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-white/70">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="border-white/10 bg-white/[0.045] text-white">
          <CardHeader>
            <CardTitle>Verificatie-checklist</CardTitle>
            <CardDescription className="text-slate-400">
              De belangrijkste documenten gegroepeerd per compliance-doel.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {requiredChecks.map((item) => {
              const Icon = item.icon;
              const tone = getAuthorityTone(item.document, item.required);

              return (
                <div
                  key={item.label}
                  className={cn("rounded-lg border p-4", tone.shell)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                        tone.icon,
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <Badge variant={tone.badge}>
                      {getAuthorityStatusLabel(item.document, item.required)}
                    </Badge>
                  </div>
                  <h2 className="mt-4 font-semibold text-slate-950 dark:text-white">
                    {item.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/32 text-white">
          <CardHeader>
            <CardTitle>Document uploaden</CardTitle>
            <CardDescription className="text-slate-400">
              Voeg direct een bestand toe aan je Supabase documentkluis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form
              action={uploadDocumentFormAction}
              className="space-y-3"
              encType="multipart/form-data"
            >
              <div className="space-y-1.5">
                <Label htmlFor="document_name" className="text-slate-200">
                  Documenttype
                </Label>
                <select
                  id="document_name"
                  name="document_name"
                  required
                  className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Kies document
                  </option>
                  <option value="WRM-bevoegdheidspas">WRM-bevoegdheidspas</option>
                  <option value="Rijbewijs">Rijbewijs</option>
                  <option value="VOG">VOG</option>
                  <option value="KvK">KvK</option>
                  <option value="Verzekering">Verzekering</option>
                  <option value="RIS-pas">RIS-pas</option>
                  <option value="Overig document">Overig document</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="document_file" className="text-slate-200">
                  Bestand
                </Label>
                <Input
                  id="document_file"
                  name="document_file"
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="border-white/10 bg-slate-950/60 text-white file:text-white"
                />
              </div>
              <PendingSubmitButton className="w-full rounded-lg" pendingLabel="Uploaden...">
                Uploaden
                <Upload className="size-4" />
              </PendingSubmitButton>
            </form>
            <p className="rounded-lg border border-white/10 bg-white/6 p-3 text-sm leading-6 text-slate-300">
              {readyRequiredChecks} van {requiredChecks.length} controles zijn
              klaar of optioneel ingevuld. Nieuwe uploads krijgen de status
              ingediend.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-white/10 bg-white/[0.045] text-white">
        <CardHeader>
          <CardTitle>Alle documenten</CardTitle>
          <CardDescription className="text-slate-400">
            Live uit de documententabel. Geen demo-documenten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overview.documents.length ? (
            <div className="space-y-3">
              {overview.documents.map((document) => {
                const tone = getDocumentTone(document.status, document.hasUrl);

                return (
                  <div
                    key={document.id}
                    className={cn(
                      "grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto] md:items-center",
                      tone.shell,
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {document.naam}
                        </p>
                        <Badge variant={getDocumentVariant(document.status)}>
                          {getDocumentStatusLabel(document.status)}
                        </Badge>
                        {!document.hasUrl ? (
                          <Badge variant="warning">Upload mist</Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                        Bron: {document.sourceLabel}. Status: {tone.label}.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      {document.hasUrl ? (
                        <Badge variant="info">Bestand gekoppeld</Badge>
                      ) : null}
                      {document.sourceLabel === "Documentkluis" ? (
                        <form action={deleteDocumentFormAction}>
                          <input
                            type="hidden"
                            name="document_id"
                            value={document.id}
                          />
                          <PendingSubmitButton
                            pendingLabel="Verwijderen..."
                            variant="outline"
                            className="rounded-lg border-rose-300/30 text-rose-100 hover:bg-rose-400/10"
                          >
                            Verwijderen
                          </PendingSubmitButton>
                        </form>
                      ) : (
                        <Button asChild variant="outline" className="rounded-lg">
                          <Link href="/instructeur/instellingen">
                            Beheren
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/12 bg-slate-950/22 p-8 text-center">
              <FileText className="mx-auto size-10 text-slate-400" />
              <p className="mt-3 font-semibold text-white">
                Nog geen documenten gevonden
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Start met WRM, rijbewijs en VOG zodat je onboarding en
                compliance overzicht compleet worden.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <DashboardPerformanceMark route={ROUTE} label="InstructorDocuments" />
    </div>
  );
}
