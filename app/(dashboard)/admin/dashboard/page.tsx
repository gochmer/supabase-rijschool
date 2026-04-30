import Link from "next/link";

import { CommandCenter } from "@/components/admin/command-center";
import { DataTableCard } from "@/components/dashboard/data-table-card";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { QuickActionGrid } from "@/components/dashboard/quick-action-grid";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import {
  getAdminActivityFeed,
  getAdminApprovalQueue,
  getAdminDashboardMetrics,
  getAdminPayments,
  getAdminSupportTickets,
} from "@/lib/data/admin";

export default async function AdminDashboardPage() {
  const [metrics, payments, tickets, activity, approvalQueue] = await Promise.all([
    getAdminDashboardMetrics(),
    getAdminPayments(),
    getAdminSupportTickets(),
    getAdminActivityFeed(),
    getAdminApprovalQueue(),
  ]);

  return (
    <>
      <PageHeader
        title="Admin dashboard"
        description="Je controlekamer voor gebruikers, support, betalingen, goedkeuringen en platformkwaliteit."
        actions={
          <>
            <Button asChild variant="outline" className="h-9 rounded-full text-[13px]">
              <Link href="/admin/support">Open support</Link>
            </Button>
            <Button asChild className="h-9 rounded-full text-[13px]">
              <Link href="/admin/betalingen">Bekijk betalingen</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <QuickActionGrid
        items={[
          {
            href: "/admin/instructeurs",
            label: "Moderatie",
            title: "Beoordeel instructeurs",
            description: "Werk openstaande goedkeuringen snel weg en houd kwaliteit zichtbaar onder controle.",
          },
          {
            href: "/admin/reviews",
            label: "Reputatie",
            title: "Modereren van reviews",
            description: "Beheer zichtbaarheid, markeringen en kwaliteit van publieke feedback.",
          },
          {
            href: "/admin/leerlingen",
            label: "Pakketten",
            title: "Wijs pakketten toe",
            description: "Koppel leerlingen sneller aan de juiste trajecten en betalingen.",
          },
        ]}
      />

      <CommandCenter />

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <InsightPanel
          title="Controlekamer"
          description="Operationele aandachtspunten die het platform vandaag direct beinvloeden."
          items={[
            {
              label: "Goedkeuringsqueue",
              value: `${approvalQueue.length} instructeur(en) wachten op een besluit`,
              status: approvalQueue.length ? "Actie nodig" : "Bij"
            },
            {
              label: "Open support",
              value: `${tickets.filter((ticket) => ticket.status !== "afgesloten").length} ticket(s) vragen opvolging`,
            },
            {
              label: "Recente activiteit",
              value: `${activity.length} relevante platformupdates in de feed`,
            },
          ]}
        />

        <DataTableCard
          title="Recente betalingen"
          description="Laatste transacties op het platform met duidelijke statusweergave."
          headers={["Gebruiker", "Bedrag", "Datum", "Status"]}
          rows={payments.slice(0, 6).map((payment) => [
            payment.gebruiker,
            payment.bedrag,
            payment.datum,
            payment.status,
          ])}
          badgeColumns={[3]}
          emptyTitle="Nog geen recente betalingen"
          emptyDescription="Nieuwe platformbetalingen verschijnen hier automatisch."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DataTableCard
          title="Support tickets"
          description="Openstaande supportvragen en prioriteiten voor snelle triage."
          headers={["Onderwerp", "Gebruiker", "Prioriteit", "Status"]}
          rows={tickets.slice(0, 6).map((ticket) => [
            ticket.onderwerp,
            ticket.gebruiker,
            ticket.prioriteit,
            ticket.status,
          ])}
          badgeColumns={[2, 3]}
          emptyTitle="Geen open supporttickets"
          emptyDescription="Mooi rustig: er wachten nu geen supportvragen op je team."
        />
        <DataTableCard
          title="Goedkeuringsqueue"
          description="Instructeurs die nog wachten op een besluit."
          headers={["Naam", "Werkgebied", "Profiel", "Status"]}
          rows={approvalQueue.map((item) => [
            item.naam,
            item.werkgebied,
            item.profiel,
            item.status,
          ])}
          badgeColumns={[3]}
          emptyTitle="Geen openstaande goedkeuringen"
          emptyDescription="Alle bekende instructeurprofielen zijn bijgewerkt en verwerkt."
        />
      </div>

      <DataTableCard
        title="Recente activiteit"
        description="Een korte operationele feed van platformbewegingen en teamrelevante updates."
        headers={["Type", "Titel", "Detail"]}
        rows={activity.map((item) => [item.type, item.titel, item.detail])}
        emptyTitle="Nog geen recente activiteit"
        emptyDescription="Zodra er mutaties of platformevents zijn, worden ze hier zichtbaar."
      />
    </>
  );
}
