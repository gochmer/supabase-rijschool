import Link from "next/link";
import { AlertCircle, LifeBuoy, ShieldCheck, Star, UserCheck } from "lucide-react";

import { CommandCenter } from "@/components/admin/command-center";
import { DataTableCard } from "@/components/dashboard/data-table-card";
import {
  DashboardFocusPanel,
  type DashboardFocusItem,
} from "@/components/dashboard/dashboard-focus-panel";
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
  getAdminReviews,
  getAdminSupportTickets,
} from "@/lib/data/admin";

export default async function AdminDashboardPage() {
  const [metrics, payments, tickets, activity, approvalQueue, reviews] = await Promise.all([
    getAdminDashboardMetrics(),
    getAdminPayments(),
    getAdminSupportTickets(),
    getAdminActivityFeed(),
    getAdminApprovalQueue(),
    getAdminReviews(),
  ]);
  const openTickets = tickets.filter((ticket) => ticket.status !== "afgesloten");
  const reviewAttention = reviews.filter(
    (review) => review.reportCount > 0 || review.moderatieStatus !== "zichtbaar"
  );
  const attentionCount =
    openTickets.length + reviewAttention.length + approvalQueue.length;
  const primaryAdminHref = approvalQueue.length
    ? "/admin/instructeurs"
    : openTickets.length
      ? "/admin/support"
      : reviewAttention.length
        ? "/admin/reviews"
        : "/admin/dashboard";
  const adminPrimaryFocus: DashboardFocusItem = approvalQueue.length
    ? {
        label: "Eerst beoordelen",
        title: "Nieuwe instructeurs wachten",
        value: `${approvalQueue.length}`,
        description: `${approvalQueue[0].naam} staat klaar voor profielcontrole. Beoordeel nieuwe instructeurs snel om kwaliteit en aanbod op peil te houden.`,
        href: "/admin/instructeurs",
        ctaLabel: "Open instructeurs",
        icon: UserCheck,
        tone: "warning",
      }
    : openTickets.length
      ? {
          label: "Eerst beoordelen",
          title: "Support vraagt opvolging",
          value: `${openTickets.length}`,
          description: `${openTickets[0].onderwerp} staat open voor ${openTickets[0].gebruiker}. Pak support eerst op om frictie te voorkomen.`,
          href: "/admin/support",
          ctaLabel: "Open support",
          icon: LifeBuoy,
          tone: "warning",
        }
      : reviewAttention.length
        ? {
            label: "Eerst beoordelen",
            title: "Reviews vragen moderatie",
            value: `${reviewAttention.length}`,
            description: `${reviewAttention[0].titel} heeft aandacht nodig door status of rapportage.`,
            href: "/admin/reviews",
            ctaLabel: "Open reviews",
            icon: Star,
            tone: "warning",
          }
        : {
            label: "Eerst beoordelen",
            title: "Platform staat rustig",
            value: "Bij",
            description:
              "Er zijn geen open supporttickets, reviewmeldingen of instructeurgoedkeuringen die direct aandacht vragen.",
            href: "/admin/dashboard",
            ctaLabel: "Bekijk overzicht",
            icon: ShieldCheck,
            tone: "success",
          };
  const adminFocusItems: DashboardFocusItem[] = [
    {
      label: "Wat vraagt aandacht?",
      title: attentionCount
        ? `${attentionCount} signaal${attentionCount === 1 ? "" : "en"}`
        : "Geen urgente signalen",
      value: `${attentionCount}`,
      description: attentionCount
        ? "Som van open support, reviewmoderatie en nieuwe instructeurs."
        : "De belangrijkste operationele wachtrijen zijn leeg.",
      href: primaryAdminHref,
      ctaLabel: "Open prioriteit",
      icon: AlertCircle,
      tone: attentionCount ? "warning" : "success",
    },
    {
      label: "Support",
      title: openTickets.length
        ? `${openTickets.length} ticket${openTickets.length === 1 ? "" : "s"} open`
        : "Support is rustig",
      value: `${openTickets.length}`,
      description: openTickets[0]
        ? `${openTickets[0].prioriteit} prioriteit - ${openTickets[0].onderwerp}`
        : "Geen supportvragen wachten op opvolging.",
      href: "/admin/support",
      ctaLabel: "Open support",
      icon: LifeBuoy,
      tone: openTickets.length ? "warning" : "success",
    },
    {
      label: "Reviews",
      title: reviewAttention.length
        ? `${reviewAttention.length} review${reviewAttention.length === 1 ? "" : "s"} checken`
        : "Reviews op orde",
      value: `${reviewAttention.length}`,
      description: reviewAttention[0]
        ? `${reviewAttention[0].instructeur} - ${reviewAttention[0].moderatieStatus}`
        : "Geen gerapporteerde of verborgen reviews vragen nu actie.",
      href: "/admin/reviews",
      ctaLabel: "Open reviews",
      icon: Star,
      tone: reviewAttention.length ? "warning" : "success",
    },
    {
      label: "Nieuwe instructeurs",
      title: approvalQueue.length
        ? `${approvalQueue.length} profiel${approvalQueue.length === 1 ? "" : "en"} beoordelen`
        : "Geen wachtrij",
      value: `${approvalQueue.length}`,
      description: approvalQueue[0]
        ? `${approvalQueue[0].naam} - ${approvalQueue[0].profiel} compleet`
        : "Alle bekende instructeurprofielen zijn verwerkt.",
      href: "/admin/instructeurs",
      ctaLabel: "Open instructeurs",
      icon: UserCheck,
      tone: approvalQueue.length ? "warning" : "success",
    },
  ];

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

      <DashboardFocusPanel
        eyebrow="Operationele focus"
        title="Zie meteen waar het platform aandacht nodig heeft"
        description="Support, reviews en nieuwe instructeurs staan hier bovenaan, zodat beheer niet verdwijnt tussen tabellen."
        primary={adminPrimaryFocus}
        items={adminFocusItems}
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
