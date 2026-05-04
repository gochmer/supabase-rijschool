import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Sparkles,
  Wallet,
} from "lucide-react";

import { startStudentCheckoutFormAction } from "@/lib/actions/learner-experience";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { ExperienceCallout } from "@/components/dashboard/experience-callout";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentStudentPackageOverview } from "@/lib/data/packages";

const urbanCardClassName =
  "rounded-xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_20px_60px_-44px_rgba(0,0,0,0.9)]";

const tabTriggerClassName =
  "h-10 rounded-full px-4 text-slate-300 data-active:text-slate-950";

function getPackageDescription(pkg: unknown) {
  if (typeof pkg === "object" && pkg && "beschrijving" in pkg) {
    const description = (pkg as { beschrijving?: unknown }).beschrijving;

    if (typeof description === "string" && description.trim()) {
      return description;
    }
  }

  return "Geschikt om aan je leerlingprofiel en betaaloverzicht te koppelen.";
}

export default async function LeerlingBetalingenPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; factuur?: string }>;
}) {
  const params = await searchParams;
  const overview = await getCurrentStudentPackageOverview();
  const paidCount = overview.payments.filter(
    (payment) => payment.status === "betaald"
  ).length;
  const openCount = overview.payments.filter(
    (payment) => payment.status !== "betaald"
  ).length;
  const recommendedPackage =
    overview.availablePackages[1] ?? overview.availablePackages[0] ?? null;
  const paymentStats = [
    {
      icon: Wallet,
      label: "Actief pakket",
      value: overview.assignedPackage?.naam ?? "Nog niet gekoppeld",
      tone: overview.assignedPackage ? "emerald" : "amber",
      detail: overview.assignedPackage
        ? `${overview.assignedPackage.lessen || "Flexibel"} lessen - ${overview.assignedPackage.prijsLabel}`
        : "Klaar om aan een traject gekoppeld te worden.",
    },
    {
      icon: CreditCard,
      label: "Betalingen",
      value: `${overview.payments.length}`,
      tone: openCount > 0 ? "amber" : "sky",
      detail:
        overview.payments.length > 0
          ? `${paidCount} betaald, ${openCount} nog open.`
          : "Nog geen betaalhistorie.",
    },
    {
      icon: Sparkles,
      label: "Aanbevolen",
      value: recommendedPackage?.naam ?? "Nog geen opties",
      tone: "violet",
      detail: recommendedPackage
        ? `${recommendedPackage.lessen || "Flexibel"} lessen - ${recommendedPackage.prijsLabel}`
        : "Er zijn nog geen pakketten om te vergelijken.",
    },
  ] as const;

  return (
    <div className="space-y-4 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Betalingen"
        title="Betalingen en pakketten"
        description="Bekijk je pakket, open betalingen en beschikbare trajecten zonder te zoeken."
        actions={
          <>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/10 bg-white/6 text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.42)] backdrop-blur hover:bg-white/10"
            >
              <Link href="/contact">Advies vragen</Link>
            </Button>
            <Button
              asChild
              className="rounded-full border border-white/12 bg-[linear-gradient(135deg,#f8fafc,#cbd5e1)] text-slate-950 shadow-[0_22px_46px_-26px_rgba(148,163,184,0.42)] hover:brightness-[1.03]"
            >
              <Link href="/leerling/boekingen">Boekingen openen</Link>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="pakket" className="space-y-4">
        {params.checkout ? (
          <div className="rounded-xl border border-sky-300/20 bg-sky-400/10 p-4 text-sm leading-6 text-sky-100">
            {params.checkout === "success"
              ? "Betaling afgerond. De bevestiging kan heel even duren; daarna werken we je status automatisch bij."
              : "Betaling geannuleerd. Er is niets afgeschreven via deze poging en je kunt later opnieuw betalen."}
          </div>
        ) : null}

        <ExperienceCallout
          icon={CreditCard}
          title="Rustig betalen"
          description="Bij betalen sturen we je door naar de checkout-provider. Kom je terug op deze pagina, dan blijft je betaalstatus hier zichtbaar."
        />

        <TabsList className="sticky top-28 z-10 !h-auto min-h-12 w-full justify-start overflow-x-auto overflow-y-hidden rounded-xl border border-white/10 bg-slate-950/72 p-1 text-slate-300 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.65)] [-ms-overflow-style:none] [scrollbar-width:none] backdrop-blur-xl [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="pakket" className={`${tabTriggerClassName} data-active:bg-emerald-200`}>
            Pakket
          </TabsTrigger>
          <TabsTrigger value="opties" className={`${tabTriggerClassName} data-active:bg-violet-200`}>
            Opties
          </TabsTrigger>
          <TabsTrigger value="betalingen" className={`${tabTriggerClassName} data-active:bg-sky-200`}>
            Betalingen
          </TabsTrigger>
        </TabsList>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {paymentStats.map((item) => (
          <DashboardStatCard key={item.label} {...item} />
        ))}
      </div>

        <TabsContent value="pakket" className="mt-0">
          <section className={urbanCardClassName}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge variant={overview.assignedPackage ? "success" : "warning"}>
                  {overview.assignedPackage ? "Actief" : "Nog niet gekoppeld"}
                </Badge>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  {overview.assignedPackage?.naam ?? "Nog geen pakket toegewezen"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                  {overview.assignedPackage
                    ? overview.assignedPackage.beschrijving
                    : "Zodra een admin of instructeur een pakket koppelt, zie je hier meteen de belangrijkste details."}
                </p>
              </div>
              {overview.assignedPackage ? (
                <div className="grid gap-2 sm:min-w-56">
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                    <p className="text-[11px] text-slate-300">Aantal lessen</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {overview.assignedPackage.lessen || "Flexibel"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                    <p className="text-[11px] text-slate-300">Waarde</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {overview.assignedPackage.prijsLabel}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="opties" className="mt-0">
          <section className={urbanCardClassName}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-300 uppercase">
                  Pakketopties
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Beschikbare trajecten
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-7 text-slate-300">
                  Vergelijk rustig. Je kiest pas iets zodra er echt een passend pakket aan je traject wordt gekoppeld.
                </p>
              </div>
              <Badge variant="info">
                {overview.availablePackages.length} optie(s)
              </Badge>
            </div>

            <div className="mt-5 grid gap-3">
              {overview.availablePackages.length ? (
                overview.availablePackages.map((pkg) => {
                  const isRecommended = recommendedPackage?.id === pkg.id;

                  return (
                    <details
                      key={pkg.id}
                      className="group overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/6"
                    >
                      <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 transition hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-white">{pkg.naam}</p>
                            {isRecommended ? (
                              <Badge variant="info">Aanbevolen</Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-slate-300">
                            {pkg.lessen ? `${pkg.lessen} lessen` : "Flexibel aantal lessen"} - {pkg.prijsLabel}
                          </p>
                        </div>
                        <span className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 text-xs font-semibold text-slate-100">
                          Details
                          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                        </span>
                      </summary>
                      <div className="border-t border-white/10 p-4">
                        <div className="flex items-start gap-2 text-sm leading-7 text-slate-300">
                          <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-300" />
                          <p>
                            {getPackageDescription(pkg)}
                          </p>
                        </div>
                      </div>
                    </details>
                  );
                })
              ) : (
                <div className="rounded-[1.45rem] border border-dashed border-white/10 bg-white/4 p-5 text-sm leading-7 text-slate-300">
                  Er zijn nog geen actieve pakketten om te vergelijken.
                </div>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="betalingen" className="mt-0">
          <section className={urbanCardClassName}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-300 uppercase">
                  Betaaloverzicht
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Betalingsgeschiedenis
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-7 text-slate-300">
                  Openstaande en afgeronde betalingen staan bij elkaar, met de belangrijkste actie rechts.
                </p>
              </div>
              <Badge variant={openCount > 0 ? "warning" : "success"}>
                {openCount} open
              </Badge>
            </div>

            <div className="mt-5 grid gap-3">
              {overview.payments.length ? (
                overview.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-3 rounded-[1.35rem] border border-white/10 bg-white/6 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-white/8 text-slate-100">
                        <CreditCard className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {payment.omschrijving}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          {payment.datum}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">
                        {payment.bedrag}
                      </span>
                      <Badge
                        variant={
                          payment.status === "betaald"
                            ? "success"
                            : payment.status === "open"
                              ? "warning"
                              : "info"
                        }
                      >
                        {payment.status}
                      </Badge>
                      {payment.status !== "betaald" ? (
                        <form action={startStudentCheckoutFormAction}>
                          <input
                            name="payment_id"
                            type="hidden"
                            value={payment.id}
                          />
                          <PendingSubmitButton
                            pendingLabel="Doorsturen..."
                            size="sm"
                          >
                            Betaal nu
                          </PendingSubmitButton>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.45rem] border border-dashed border-white/10 bg-white/4 p-5">
                  <h3 className="text-lg font-semibold text-white">
                    Nog geen betalingen
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Zodra er een pakketbetaling of losse lesbetaling klaarstaat,
                    verschijnt die hier automatisch.
                  </p>
                </div>
              )}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
