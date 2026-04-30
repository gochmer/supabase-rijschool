import { BellRing, Shield, Smartphone } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentNotifications } from "@/lib/data/notifications";

export default async function LeerlingInstellingenPage() {
  const notifications = await getCurrentNotifications();

  return (
    <>
      <PageHeader
        title="Instellingen"
        description="Beheer meldingen, privacyvoorkeuren en je persoonlijke notificatiecentrum."
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          {[
            {
              title: "In-app meldingen",
              text: "Updates over lesaanvragen, planning, betalingen en support verschijnen direct in je dashboard.",
              icon: BellRing,
            },
            {
              title: "Mobiele voorkeuren",
              text: "Gebruik dezelfde meldingslogica later ook voor pushmeldingen of WhatsApp-herinneringen.",
              icon: Smartphone,
            },
            {
              title: "Privacy",
              text: "Je account blijft voorbereid op gescheiden rollen, RLS en veilige profieltoegang.",
              icon: Shield,
            },
          ].map((item) => (
            <Card
              key={item.title}
              className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]"
            >
              <CardHeader>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="size-5" />
                </div>
                <CardTitle className="pt-4">{item.title}</CardTitle>
                <CardDescription className="text-sm leading-7">
                  {item.text}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
          <CardHeader>
            <CardTitle>Notificatiecentrum</CardTitle>
            <CardDescription>
              Meldingen over aanvragen, lessen en accountupdates verschijnen hier zodra ze beschikbaar zijn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="rounded-3xl border border-border/70 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{notification.titel}</h3>
                      {notification.ongelezen ? (
                        <Badge variant="info">Nieuw</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground dark:text-slate-300">
                      {notification.tekst}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground dark:text-slate-400">
                    {notification.tijd}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
