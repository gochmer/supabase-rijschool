import Link from "next/link";
import { CheckCircle2, CreditCard, Sparkles, Wallet } from "lucide-react";

import { InsightPanel } from "@/components/dashboard/insight-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { TrendCard } from "@/components/dashboard/trend-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentStudentPackageOverview } from "@/lib/data/packages";

const urbanCardClassName =
  "rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] p-6 shadow-[0_28px_88px_-46px_rgba(15,23,42,0.78)]";

export default async function LeerlingBetalingenPage() {
  const overview = await getCurrentStudentPackageOverview();
  const paidCount = overview.payments.filter((payment) => payment.status === "betaald").length;
  const openCount = overview.payments.filter((payment) => payment.status !== "betaald").length;
  const recommendedPackage =
    overview.availablePackages[1] ?? overview.availablePackages[0] ?? null;

  return (
    <div className="space-y-6 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Betalingen"
        title="Betalingen en pakketten"
        description="Bekijk je pakketoverzicht, betaalstatus en beschikbare trajecten in een rustigere, luxere en meer zakelijke leerlingomgeving."
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

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Wallet,
            label: "Actief pakket",
            value: overview.assignedPackage?.naam ?? "Nog niet gekoppeld",
            detail: overview.assignedPackage
              ? `${overview.assignedPackage.lessen || "Flexibel"} lessen • ${overview.assignedPackage.prijsLabel}`
              : "Je account is klaar om aan een pakket of traject gekoppeld te worden.",
          },
          {
            icon: CreditCard,
            label: "Betalingen",
            value: `${overview.payments.length}`,
            detail:
              overview.payments.length > 0
                ? `${paidCount} betaald en ${openCount} nog in behandeling.`
                : "Zodra er activiteit is verschijnt hier je betaalhistorie.",
          },
          {
            icon: Sparkles,
            label: "Aanbevolen traject",
            value: recommendedPackage?.naam ?? "Nog geen opties",
            detail: recommendedPackage
              ? `${recommendedPackage.lessen || "Flexibel"} lessen • ${recommendedPackage.prijsLabel}`
              : "Er zijn nog geen actieve pakketten om te vergelijken.",
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

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <TrendCard
          tone="urban"
          title="Betaaltrend"
          value={`${overview.payments.length}`}
          change={paidCount > 0 ? "+12%" : "Stand-by"}
          description="Overzicht van betaalmomenten en activiteit binnen je huidige traject."
          data={[2, 3, 3, 4, 5, 6, 7]}
        />
        <InsightPanel
          tone="urban"
          title="Pakketfocus"
          description="De belangrijkste punten rond je huidige of volgende pakket."
          items={[
            {
              label: "Actief pakket",
              value: overview.assignedPackage?.naam ?? "Nog niet toegewezen",
              status: overview.assignedPackage ? "Actief" : "Open",
            },
            {
              label: "Aantal betalingen",
              value: `${overview.payments.length} geregistreerde betaling(en)`,
            },
            {
              label: "Beschikbare opties",
              value: `${overview.availablePackages.length} pakket(en) klaar om te kiezen`,
            },
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className={urbanCardClassName}>
          <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,#0f172a,#1e293b,#334155)] p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white/12">
                <Wallet className="size-5" />
              </div>
              <div>
                <p className="text-sm text-white/72">Jouw traject</p>
                <h2 className="text-2xl font-semibold">
                  {overview.assignedPackage?.naam ?? "Nog geen pakket toegewezen"}
                </h2>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            {overview.assignedPackage ? (
              <div className="rounded-[1.85rem] border border-emerald-400/16 bg-emerald-500/8 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {overview.assignedPackage.naam}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      {overview.assignedPackage.beschrijving}
                    </p>
                  </div>
                  <Badge variant="success">Actief</Badge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Aantal lessen</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {overview.assignedPackage.lessen || "Flexibel"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Pakketwaarde</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {overview.assignedPackage.prijsLabel}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/4 p-6">
                <h3 className="text-lg font-semibold text-white">
                  Nog geen pakket toegewezen
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Zodra een admin of instructeur een pakket koppelt, zie je het hier direct terug in je overzicht.
                </p>
              </div>
            )}

            <div className="grid gap-4">
              {overview.availablePackages.map((pkg) => {
                const isRecommended = recommendedPackage?.id === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    className={
                      isRecommended
                        ? "rounded-[1.75rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(148,163,184,0.12),rgba(15,23,42,0.34))] p-5 shadow-[0_20px_48px_-30px_rgba(15,23,42,0.52)]"
                        : "rounded-[1.75rem] border border-white/10 bg-white/5 p-5"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-white">{pkg.naam}</h3>
                          {isRecommended ? <Badge variant="info">Aanbevolen</Badge> : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-300">
                          {pkg.lessen ? `${pkg.lessen} lessen` : "Flexibel aantal lessen"}
                        </p>
                      </div>
                      <span className="text-lg font-semibold text-white">
                        {pkg.prijsLabel}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-200">
                      <CheckCircle2 className="size-4 text-emerald-300" />
                      Geschikt om direct aan je leerlingprofiel en betaaloverzicht te koppelen.
                    </div>
                    {isRecommended ? (
                      <div className="mt-4 rounded-[1.2rem] bg-black/12 px-4 py-3 text-sm leading-7 text-slate-200">
                        Mooie balans tussen prijs, structuur en examenvoorbereiding.
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className={urbanCardClassName}>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-300 uppercase">
              Payment history
            </p>
            <h2 className="text-2xl font-semibold text-white">Betalingsgeschiedenis</h2>
            <p className="text-sm leading-7 text-slate-300">
              Live overzicht van openstaande en afgeronde betalingen binnen je account.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {overview.payments.length ? (
              overview.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-4 rounded-[1.6rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(148,163,184,0.08),rgba(15,23,42,0.28))] p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-white/8 text-slate-100">
                      <CreditCard className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{payment.omschrijving}</h3>
                      <p className="mt-1 text-sm text-slate-300">{payment.datum}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{payment.bedrag}</span>
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
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/4 p-6">
                <h3 className="text-lg font-semibold text-white">Nog geen betalingen</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Hier verschijnen automatisch nieuwe pakketbetalingen en losse lesbetalingen.
                </p>
              </div>
            )}

            <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(135deg,#0f172a,#1e293b,#334155)] p-5 text-white shadow-[0_26px_62px_-38px_rgba(15,23,42,0.42)]">
              <div className="flex items-center gap-3">
                <Sparkles className="size-4 text-slate-200" />
                <p className="font-semibold">Premium betaaloverzicht</p>
              </div>
              <p className="mt-2 text-sm leading-7 text-white/75">
                Deze basis is nu veel geschikter om later uit te breiden met betaalherinneringen, iDEAL en extra factuuracties.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
