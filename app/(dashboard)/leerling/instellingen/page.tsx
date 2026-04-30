import { BellRing, ChevronDown, Shield, Smartphone } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentNotifications } from "@/lib/data/notifications";

const urbanCardClassName =
  "rounded-[1.9rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] p-5 text-white shadow-[0_24px_80px_-42px_rgba(15,23,42,0.72)]";

const tabTriggerClassName =
  "h-10 rounded-full px-4 text-slate-300 data-active:bg-white data-active:text-slate-950";

export default async function LeerlingInstellingenPage() {
  const notifications = await getCurrentNotifications();
  const unreadCount = notifications.filter((item) => item.ongelezen).length;
  const preferenceCards = [
    {
      title: "In-app meldingen",
      text: "Updates over lesaanvragen, planning, betalingen en support verschijnen direct in je dashboard.",
      icon: BellRing,
      badge: unreadCount > 0 ? `${unreadCount} nieuw` : "Bijgewerkt",
    },
    {
      title: "Mobiele voorkeuren",
      text: "De meldingsstructuur is voorbereid op latere pushmeldingen of WhatsApp-herinneringen.",
      icon: Smartphone,
      badge: "Voorbereid",
    },
    {
      title: "Privacy",
      text: "Je leerlingaccount blijft gekoppeld aan gescheiden rollen, RLS en veilige profieltoegang.",
      icon: Shield,
      badge: "Beveiligd",
    },
  ];

  return (
    <div className="space-y-6 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Instellingen"
        title="Voorkeuren en meldingen"
        description="Je instellingen zijn compacter gegroepeerd: voorkeuren, notificaties en privacy staan ieder in hun eigen tab."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {preferenceCards.map((item) => (
          <div
            key={item.title}
            className="rounded-[1.45rem] border border-white/10 bg-white/6 p-4 shadow-[0_20px_58px_-42px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-slate-100">
                <item.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
                  {item.title}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {item.badge}
                </p>
                <p className="mt-1 text-[12px] leading-5 text-slate-300">
                  {item.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="voorkeuren" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto rounded-[1.35rem] border border-white/10 bg-white/6 p-1 text-slate-300">
          <TabsTrigger value="voorkeuren" className={tabTriggerClassName}>
            Voorkeuren
          </TabsTrigger>
          <TabsTrigger value="meldingen" className={tabTriggerClassName}>
            Meldingen
          </TabsTrigger>
          <TabsTrigger value="privacy" className={tabTriggerClassName}>
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voorkeuren" className="mt-0">
          <section className={urbanCardClassName}>
            <div className="grid gap-3">
              {preferenceCards.map((item) => (
                <details
                  key={item.title}
                  className="group overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/6"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 transition hover:bg-white/[0.04] [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-3">
                      <item.icon className="size-5 text-slate-200" />
                      <div>
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="text-sm text-slate-300">{item.badge}</p>
                      </div>
                    </div>
                    <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="border-t border-white/10 p-4 text-sm leading-7 text-slate-300">
                    {item.text}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="meldingen" className="mt-0">
          <section className={urbanCardClassName}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-300 uppercase">
                  Notificatiecentrum
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Laatste meldingen
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-7 text-slate-300">
                  Meldingen staan compact dichtgeklapt, zodat de pagina niet onnodig lang wordt.
                </p>
              </div>
              <Badge variant={unreadCount > 0 ? "warning" : "success"}>
                {unreadCount} ongelezen
              </Badge>
            </div>

            <div className="mt-5 grid gap-3">
              {notifications.length ? (
                notifications.map((notification) => (
                  <details
                    key={notification.id}
                    className="group overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/6"
                  >
                    <summary className="flex cursor-pointer list-none flex-col gap-2 p-4 transition hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">
                            {notification.titel}
                          </p>
                          {notification.ongelezen ? (
                            <Badge variant="info">Nieuw</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-300">
                          {notification.tijd}
                        </p>
                      </div>
                      <span className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 text-xs font-semibold text-slate-100">
                        Details
                        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                      </span>
                    </summary>
                    <p className="border-t border-white/10 p-4 text-sm leading-7 text-slate-300">
                      {notification.tekst}
                    </p>
                  </details>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-white/4 p-5 text-sm leading-7 text-slate-300">
                  Er zijn nog geen meldingen.
                </div>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="privacy" className="mt-0">
          <section className={urbanCardClassName}>
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8">
                <Shield className="size-5" />
              </div>
              <div>
                <Badge variant="success">Rollen gescheiden</Badge>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  Privacy en toegang
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                  Je leerlinggegevens zijn bedoeld voor je eigen account, gekoppelde instructeurs en platformprocessen zoals planning, betalingen en support.
                </p>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
