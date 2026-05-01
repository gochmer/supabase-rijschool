import { CreditCard, WalletCards } from "lucide-react";

import { DataTableCard } from "@/components/dashboard/data-table-card";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { TrendCard } from "@/components/dashboard/trend-card";
import { getAdminPayments } from "@/lib/data/admin";

export default async function AdminBetalingenPage() {
  const payments = await getAdminPayments();

  return (
    <>
      <PageHeader
        tone="urban"
        title="Betalingen beheren"
        description="Controleer betaalstatus, historie, trend en afwijkingen in een moderner financieel overzicht."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <TrendCard
          title="Omzettrend"
          value={payments[0]?.bedrag ?? "EUR 0"}
          change="+9%"
          description="Snelle trendvisual voor recente geldstromen en betaalactiviteit."
          data={[3, 5, 4, 6, 7, 8, 10]}
        />
        <InsightPanel
          title="Financieel overzicht"
          description="Belangrijkste betaalinzichten voor snelle opvolging."
          items={[
            {
              label: "Open betalingen",
              value: `${payments.filter((payment) => payment.status === "open").length} betaling(en) vereisen opvolging`,
            },
            {
              label: "Betaald",
              value: `${payments.filter((payment) => payment.status === "betaald").length} betaling(en) afgerond`,
            },
            {
              label: "Betaalkoppeling",
              value: "Voorbereid op live betaalverwerking zodra de provider actief is.",
            },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {[
          {
            icon: CreditCard,
            title: "Transactiekwaliteit",
            text: "Sneller afwijkingen signaleren in status, bedrag en moment van betaling.",
          },
          {
            icon: WalletCards,
            title: "Heldere opvolging",
            text: "Openstaande posten en betaalde trajecten blijven overzichtelijk zichtbaar.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-[1.9rem] border border-white/70 bg-white/85 p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <item.icon className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground dark:text-slate-300">{item.text}</p>
          </div>
        ))}
      </div>

      <DataTableCard
        title="Betalingen"
        description="Live overzicht van betalingen met gebruiker, bedrag, datum en status."
        headers={["Gebruiker", "Bedrag", "Datum", "Status"]}
        rows={payments.map((payment) => [
          payment.gebruiker,
          payment.bedrag,
          payment.datum,
          payment.status,
        ])}
        badgeColumns={[3]}
        emptyTitle="Nog geen betalingen geregistreerd"
        emptyDescription="Nieuwe transacties verschijnen hier zodra pakketten en betalingen actief worden gebruikt."
      />
    </>
  );
}
