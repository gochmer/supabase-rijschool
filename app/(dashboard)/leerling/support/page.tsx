import { HelpCircle, MessageSquare, ShieldCheck } from "lucide-react";

import { createLearnerSupportTicketFormAction } from "@/lib/actions/learner-experience";
import { ExperienceCallout } from "@/components/dashboard/experience-callout";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { getCurrentLearnerSupportTickets } from "@/lib/data/learner-experience";

const cardClassName =
  "rounded-xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_20px_60px_-44px_rgba(0,0,0,0.9)]";

function formatTicketDate(value: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getTicketVariant(status: string) {
  if (status === "opgelost" || status === "gesloten") {
    return "success" as const;
  }

  if (status === "in_behandeling") {
    return "info" as const;
  }

  return "warning" as const;
}

export default async function LeerlingSupportPage() {
  const tickets = await getCurrentLearnerSupportTickets();
  const openTickets = tickets.filter((ticket) => ticket.status !== "afgesloten");

  return (
    <div className="space-y-4 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Support"
        title="Hulp en tickets"
        description="Stel je vraag op een rustige plek en volg daarna dezelfde vraag tot hij is opgelost."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className={cardClassName}>
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-400/15 text-sky-100">
              <HelpCircle className="size-5" />
            </span>
            <div>
              <Badge variant="info">Nieuwe hulpvraag</Badge>
              <h2 className="mt-3 text-xl font-semibold">Waar kunnen we bij helpen?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Kies een korte titel en vertel wat je vastloopt. Je hoeft dezelfde
                vraag niet meerdere keren te sturen.
              </p>
            </div>
          </div>

          <form action={createLearnerSupportTicketFormAction} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-300 uppercase">
                Onderwerp
              </span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none focus:border-sky-300/60"
                name="onderwerp"
                placeholder="Bijvoorbeeld: betaling lukt niet"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-300 uppercase">
                Prioriteit
              </span>
              <select
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none focus:border-sky-300/60"
                name="prioriteit"
                defaultValue="normaal"
              >
                <option value="laag">Laag - geen haast</option>
                <option value="normaal">Normaal - graag reactie</option>
                <option value="hoog">Hoog - blokkeert mijn planning</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-300 uppercase">
                Omschrijving
              </span>
              <textarea
                className="mt-2 min-h-32 w-full rounded-lg border border-white/10 bg-slate-950/45 p-3 text-sm text-white outline-none focus:border-sky-300/60"
                name="omschrijving"
                placeholder="Beschrijf kort wat er gebeurde en wat je verwachtte."
                required
              />
            </label>
            <ExperienceCallout
              icon={ShieldCheck}
              title="Na versturen"
              description="Je ticket verschijnt direct in je overzicht. Open tickets blijven zichtbaar, zodat je niet hoeft te onthouden wat al loopt."
            />
            <PendingSubmitButton
              className="w-full rounded-lg"
              pendingLabel="Vraag versturen..."
            >
              <MessageSquare className="size-4" />
              Vraag versturen
            </PendingSubmitButton>
          </form>
        </section>

        <section className={cardClassName}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge variant={openTickets.length ? "warning" : "success"}>
                {openTickets.length} open
              </Badge>
              <h2 className="mt-3 text-xl font-semibold">Je lopende vragen</h2>
            </div>
            <ShieldCheck className="size-6 text-emerald-200" />
          </div>

          <div className="mt-4 space-y-3">
            {tickets.length ? (
              tickets.map((ticket) => (
                <article
                  key={ticket.id}
                  className="rounded-lg border border-white/10 bg-white/6 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{ticket.onderwerp}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {ticket.created_at ? formatTicketDate(ticket.created_at) : "Datum onbekend"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getTicketVariant(ticket.status)}>
                        {ticket.status}
                      </Badge>
                      <Badge variant="default">{ticket.prioriteit}</Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {ticket.omschrijving}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-white/12 bg-white/4 p-6 text-center">
                <ShieldCheck className="mx-auto size-9 text-emerald-300" />
                <p className="mt-3 font-semibold">Nog geen vragen open</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Fijn rustig. Als je hulp nodig hebt, maak je links een vraag aan.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
