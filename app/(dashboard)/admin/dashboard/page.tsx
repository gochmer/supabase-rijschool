import Link from "next/link";
import {
  AlertCircle,
  CreditCard,
  LifeBuoy,
  PackageCheck,
  ShieldCheck,
  Star,
  UserCheck,
  UsersRound,
} from "lucide-react";

import { DataTableCard } from "@/components/dashboard/data-table-card";
import { DataHealthCallout } from "@/components/dashboard/data-health-callout";
import {
  DashboardActionHub,
  type DashboardActionHubItem,
} from "@/components/dashboard/dashboard-action-hub";
import {
  DashboardFocusPanel,
  type DashboardFocusItem,
} from "@/components/dashboard/dashboard-focus-panel";
import {
  OnboardingPanel,
  type OnboardingStep,
} from "@/components/dashboard/onboarding-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import {
  getAdminActivityFeed,
  getAdminApprovalQueue,
  getAdminDashboardMetrics,
  getAdminInstructors,
  getAdminPayments,
  getAdminReviews,
  getAdminSupportTickets,
  getAdminUsers,
} from "@/lib/data/admin";
import { getAdminDashboardDataHealth } from "@/lib/data/data-health";

function parsePercent(value: string) {
  const parsed = Number(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNames(names: string[]) {
  const visibleNames = names.slice(0, 2).join(", ");
  const remaining = names.length - 2;

  if (!visibleNames) {
    return "Geen namen";
  }

  return remaining > 0 ? `${visibleNames} +${remaining}` : visibleNames;
}

export default async function AdminDashboardPage() {
  const [
    metrics,
    payments,
    tickets,
    activity,
    approvalQueue,
    reviews,
    users,
    instructors,
    dataHealth,
  ] = await Promise.all([
    getAdminDashboardMetrics(),
    getAdminPayments(),
    getAdminSupportTickets(),
    getAdminActivityFeed(),
    getAdminApprovalQueue(),
    getAdminReviews(),
    getAdminUsers(),
    getAdminInstructors(),
    getAdminDashboardDataHealth(),
  ]);
  const openTickets = tickets.filter((ticket) => ticket.status !== "afgesloten");
  const reviewAttention = reviews.filter(
    (review) => review.reportCount > 0 || review.moderatieStatus !== "zichtbaar"
  );
  const incompleteUsers = users.filter(
    (user) => !user.naam?.trim() || !user.email?.trim() || !user.telefoon?.trim()
  );
  const incompleteInstructors = instructors.filter(
    (instructor) =>
      parsePercent(instructor.profiel) < 90 || instructor.status !== "goedgekeurd"
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
  const adminOnboardingSteps: OnboardingStep[] = [
    {
      label: "Gebruikers",
      title: incompleteUsers.length
        ? `${incompleteUsers.length} account${incompleteUsers.length === 1 ? "" : "s"} incompleet`
        : "Gebruikersbasis compleet",
      description: incompleteUsers.length
        ? "Deze accounts missen naam, e-mail of telefoon en kunnen daardoor minder soepel doorstromen."
        : "Alle recente gebruikers hebben de basisgegevens die nodig zijn voor opvolging.",
      href: "/admin/gebruikers",
      ctaLabel: "Open gebruikers",
      complete: incompleteUsers.length === 0,
      icon: UserCheck,
      meta: incompleteUsers.length
        ? formatNames(incompleteUsers.map((user) => user.naam || user.email || "Gebruiker"))
        : "Geen incomplete accounts",
    },
    {
      label: "Instructeurs",
      title: incompleteInstructors.length
        ? `${incompleteInstructors.length} profiel${incompleteInstructors.length === 1 ? "" : "en"} checken`
        : "Instructeurs op orde",
      description: incompleteInstructors.length
        ? "Deze instructeurs missen profielvulling of goedkeuring voordat ze optimaal kunnen converteren."
        : "Instructeurprofielen zijn compleet genoeg en verwerkt.",
      href: "/admin/instructeurs",
      ctaLabel: "Open instructeurs",
      complete: incompleteInstructors.length === 0,
      icon: ShieldCheck,
      meta: incompleteInstructors.length
        ? formatNames(incompleteInstructors.map((item) => `${item.naam} (${item.profiel})`))
        : "Geen incomplete instructeurs",
    },
    {
      label: "Support",
      title: openTickets.length
        ? `${openTickets.length} supportticket${openTickets.length === 1 ? "" : "s"} open`
        : "Support rustig",
      description:
        "Nieuwe gebruikers haken sneller aan wanneer vragen en blokkades kort blijven liggen.",
      href: "/admin/support",
      ctaLabel: "Open support",
      complete: openTickets.length === 0,
      icon: LifeBuoy,
      meta: openTickets[0]?.onderwerp ?? "Geen open tickets",
    },
    {
      label: "Reviews",
      title: reviewAttention.length
        ? `${reviewAttention.length} review${reviewAttention.length === 1 ? "" : "s"} modereren`
        : "Reviews schoon",
      description:
        "Reviewmoderatie houdt publieke profielen betrouwbaar voor nieuwe leerlingen.",
      href: "/admin/reviews",
      ctaLabel: "Open reviews",
      complete: reviewAttention.length === 0,
      icon: Star,
      meta: reviewAttention[0]?.titel ?? "Geen reviewmeldingen",
    },
  ];
  const adminActionItems: DashboardActionHubItem[] = [
    {
      title: "Gebruikers",
      description: "Leerlingen, instructeurs en accountstatussen.",
      href: "/admin/gebruikers",
      icon: UsersRound,
      tone: incompleteUsers.length ? "amber" : "emerald",
      meta: incompleteUsers.length ? `${incompleteUsers.length} incompleet` : "Op orde",
    },
    {
      title: "Instructeurs",
      description: "Goedkeuring, profielkwaliteit en aanbod.",
      href: "/admin/instructeurs",
      icon: UserCheck,
      tone: approvalQueue.length ? "amber" : "sky",
      meta: approvalQueue.length ? `${approvalQueue.length} wachten` : "Beheer",
    },
    {
      title: "Support",
      description: "Tickets en blokkades snel opvolgen.",
      href: "/admin/support",
      icon: LifeBuoy,
      tone: openTickets.length ? "rose" : "emerald",
      meta: openTickets.length ? `${openTickets.length} open` : "Rustig",
    },
    {
      title: "Reviews",
      description: "Moderatie, meldingen en kwaliteit.",
      href: "/admin/reviews",
      icon: Star,
      tone: reviewAttention.length ? "amber" : "emerald",
      meta: reviewAttention.length ? `${reviewAttention.length} checken` : "Schoon",
    },
    {
      title: "Betalingen",
      description: "Transacties en betaaloverzicht.",
      href: "/admin/betalingen",
      icon: CreditCard,
      tone: "sky",
      meta: "Financieel",
    },
    {
      title: "Pakketten",
      description: "Aanbod en pakketstructuur beheren.",
      href: "/admin/pakketten",
      icon: PackageCheck,
      tone: "slate",
      meta: "Catalogus",
    },
  ];

  return (
    <>
      <PageHeader
        tone="urban"
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

      <DataHealthCallout
        label="Admin datastatus"
        results={dataHealth}
      />

      <DashboardActionHub
        eyebrow="Beheerhub"
        title="Direct naar het juiste beheergebied"
        description="De belangrijkste platformonderdelen staan als eenvoudige accounttegels bovenaan, met aandachtssignalen waar opvolging nodig is."
        primaryHref={primaryAdminHref}
        primaryLabel={attentionCount ? "Open prioriteit" : "Bekijk beheer"}
        items={adminActionItems}
      />

      <DashboardFocusPanel
        eyebrow="Operationele focus"
        title="Zie meteen waar het platform aandacht nodig heeft"
        description="Support, reviews en nieuwe instructeurs staan hier bovenaan, zodat beheer niet verdwijnt tussen tabellen."
        primary={adminPrimaryFocus}
        items={adminFocusItems}
      />

      <OnboardingPanel
        eyebrow="Admin onboarding"
        title="Zie wie nog niet klaar is voor productiegebruik"
        description="Deze laag bundelt incomplete gebruikers, instructeurprofielen, support en reviewmoderatie zodat nieuwe accounts niet blijven hangen."
        steps={adminOnboardingSteps}
        accent="amber"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

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
