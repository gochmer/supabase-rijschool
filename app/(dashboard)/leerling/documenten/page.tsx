import { FileCheck2, FileText, UploadCloud } from "lucide-react";

import {
  deleteLearnerDocumentFormAction,
  uploadLearnerDocumentFormAction,
} from "@/lib/actions/learner-experience";
import { ExperienceCallout } from "@/components/dashboard/experience-callout";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { getCurrentLearnerDocumentContext } from "@/lib/data/learner-experience";

const cardClassName =
  "rounded-xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_20px_60px_-44px_rgba(0,0,0,0.9)]";

const requiredDocuments = [
  { type: "theoriecertificaat", label: "Theoriecertificaat" },
  { type: "identiteitsbewijs", label: "Identiteitsbewijs" },
  { type: "gezondheidsverklaring", label: "Gezondheidsverklaring" },
  { type: "examenbevestiging", label: "Examenbevestiging" },
];

function formatDocumentDate(value: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getDocumentStatusVariant(status: string) {
  if (status === "goedgekeurd") {
    return "success" as const;
  }

  if (status === "afgewezen" || status === "afgekeurd") {
    return "danger" as const;
  }

  return "warning" as const;
}

export default async function LeerlingDocumentenPage() {
  const { documents } = await getCurrentLearnerDocumentContext();
  const uploadedTypes = new Set(documents.map((document) => document.document_type));

  return (
    <div className="space-y-4 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Documenten"
        title="Leerlingdossier"
        description="Bewaar belangrijke documenten op een plek, zodat je traject niet vastloopt op administratie."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className={cardClassName}>
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-400/15 text-violet-100">
              <UploadCloud className="size-5" />
            </span>
            <div>
              <Badge variant="info">Upload</Badge>
              <h2 className="mt-3 text-xl font-semibold">Document toevoegen</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Gebruik PDF, JPG, PNG of WebP tot 5 MB. Upload alleen wat nodig
                is voor je rijles- of examentraject.
              </p>
            </div>
          </div>

          <form action={uploadLearnerDocumentFormAction} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-300 uppercase">
                Type
              </span>
              <select
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none focus:border-violet-300/60"
                name="document_type"
                defaultValue="theoriecertificaat"
              >
                {requiredDocuments.map((item) => (
                  <option key={item.type} value={item.type}>
                    {item.label}
                  </option>
                ))}
                <option value="overig">Overig</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-300 uppercase">
                Naam
              </span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none focus:border-violet-300/60"
                name="document_name"
                placeholder="Bijvoorbeeld: Theoriecertificaat"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-300 uppercase">
                Bestand
              </span>
              <input
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="mt-2 w-full rounded-lg border border-dashed border-white/15 bg-slate-950/45 px-3 py-3 text-sm text-slate-200 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1 file:text-sm file:font-semibold file:text-slate-950"
                name="document_file"
                required
                type="file"
              />
            </label>
            <ExperienceCallout
              icon={FileCheck2}
              title="Geen halve uploads"
              description="Als een document niet goed wordt geregistreerd, ruimt het systeem de upload op. Je dossier blijft daardoor schoon."
              tone="success"
            />
            <PendingSubmitButton className="w-full rounded-lg" pendingLabel="Uploaden...">
              <UploadCloud className="size-4" />
              Document uploaden
            </PendingSubmitButton>
          </form>
        </section>

        <section className={cardClassName}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge variant="info">{documents.length} document(en)</Badge>
              <h2 className="mt-3 text-xl font-semibold">Wat staat klaar?</h2>
            </div>
            <FileCheck2 className="size-6 text-emerald-200" />
          </div>

          <div className="mt-4 grid gap-3">
            {requiredDocuments.map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/6 p-3"
              >
                <span className="font-semibold">{item.label}</span>
                <Badge variant={uploadedTypes.has(item.type) ? "success" : "warning"}>
                  {uploadedTypes.has(item.type) ? "Aanwezig" : "Nog nodig"}
                </Badge>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {documents.length ? (
              documents.map((document) => (
                <article
                  key={document.id}
                  className="rounded-lg border border-white/10 bg-white/6 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{document.naam}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDocumentDate(document.created_at)}
                      </p>
                    </div>
                    <Badge variant={getDocumentStatusVariant(document.status)}>
                      {document.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {document.signed_url ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={document.signed_url} rel="noreferrer" target="_blank">
                          Openen
                        </a>
                      </Button>
                    ) : null}
                    <form action={deleteLearnerDocumentFormAction}>
                      <input name="document_id" type="hidden" value={document.id} />
                      <input
                        name="document_path"
                        type="hidden"
                        value={document.bestand_pad}
                      />
                      <PendingSubmitButton
                        pendingLabel="Verwijderen..."
                        size="sm"
                        variant="destructive"
                      >
                        Verwijderen
                      </PendingSubmitButton>
                    </form>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-white/12 bg-white/4 p-6 text-center">
                <FileText className="mx-auto size-9 text-slate-300" />
                <p className="mt-3 font-semibold">Nog geen documenten toegevoegd</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Begin met het document dat je nu al hebt. De rest kan later.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
