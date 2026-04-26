import { LifeBuoy, TimerReset } from "lucide-react";

import { SupportTicketActions } from "@/components/admin/support-ticket-actions";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { TrendCard } from "@/components/dashboard/trend-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminSupportTickets } from "@/lib/data/admin";

export default async function AdminSupportPage() {
  const tickets = await getAdminSupportTickets();

  return (
    <>
      <PageHeader
        title="Support"
        description="Beheer supportvragen, prioriteiten en afhandeling in een moderne serviceflow."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <TrendCard
          title="Supportdruk"
          value={`${tickets.length}`}
          change="-6%"
          description="Trendlijn voor de huidige ticketbelasting en afhandeltempo."
          data={[8, 7, 9, 8, 6, 5, 4]}
        />
        <InsightPanel
          title="Serviceniveau"
          description="De belangrijkste signalen voor support en klantbeleving."
          items={[
            {
              label: "Open tickets",
              value: `${tickets.filter((ticket) => ticket.status === "open").length} ticket(s) wachten op eerste reactie`,
            },
            {
              label: "In behandeling",
              value: `${tickets.filter((ticket) => ticket.status === "in_behandeling").length} ticket(s) worden nu opgevolgd`,
            },
            {
              label: "Prioriteit hoog",
              value: `${tickets.filter((ticket) => ticket.prioriteit === "hoog").length} ticket(s) vragen snelle actie`,
              status: "Urgent",
            },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {[
          {
            icon: LifeBuoy,
            title: "Heldere afhandeling",
            text: "Werk supporttickets sneller weg met zicht op prioriteit, status en eigenaar.",
          },
          {
            icon: TimerReset,
            title: "Snelle opvolging",
            text: "Kortere reactietijden zorgen direct voor meer vertrouwen in het platform.",
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

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Card
            key={ticket.id}
            className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]"
          >
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <CardTitle>{ticket.onderwerp}</CardTitle>
                  <CardDescription>
                    {ticket.gebruiker} • {ticket.datum}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={
                      ticket.prioriteit === "hoog"
                        ? "danger"
                        : ticket.prioriteit === "normaal"
                          ? "warning"
                          : "info"
                    }
                  >
                    {ticket.prioriteit}
                  </Badge>
                  <Badge
                    variant={
                      ticket.status === "afgesloten"
                        ? "success"
                        : ticket.status === "in_behandeling"
                          ? "info"
                          : "warning"
                    }
                  >
                    {ticket.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-muted-foreground dark:text-slate-300">
                Gebruik snelle acties om tickets door te zetten of af te sluiten.
              </p>
              <SupportTicketActions ticketId={ticket.id} status={ticket.status} />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
