import Link from "next/link";
import { BellRing, Radio, Send } from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { MessageCenter } from "@/components/messages/message-center";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getCurrentMessageInbox,
  getMessageRecipientsForCurrentUser,
} from "@/lib/data/messages";

const urbanCardClassName =
  "rounded-[1.9rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.72)]";

export default async function LeerlingBerichtenPage() {
  const [inbox, recipients] = await Promise.all([
    getCurrentMessageInbox(),
    getMessageRecipientsForCurrentUser(),
  ]);

  const unreadCount = inbox.filter((item) => item.ongelezen).length;
  const latestMessage = inbox[0];
  const messageStats = [
    {
      icon: BellRing,
      label: "Ongelezen berichten",
      value: `${unreadCount}`,
      tone: unreadCount > 0 ? "amber" : "emerald",
      detail:
        unreadCount > 0
          ? "Er wachten nog berichten op jouw aandacht."
          : "Je inbox is bijgewerkt en volledig gelezen.",
    },
    {
      icon: Radio,
      label: "Beschikbare contacten",
      value: `${recipients.length}`,
      tone: "cyan",
      detail:
        recipients.length > 0
          ? "Je kunt direct schakelen met instructeurs binnen het platform."
          : "Er zijn nog geen ontvangers klaar voor directe communicatie.",
    },
    {
      icon: Send,
      label: "Laatste bericht",
      value: latestMessage?.afzender ?? "Nog geen berichten",
      tone: "sky",
      detail: latestMessage
        ? latestMessage.tijd
        : "Zodra er een bericht binnenkomt wordt hier de laatste update getoond.",
    },
  ] as const;

  return (
    <div className="space-y-6 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Berichten"
        title="Communicatie"
        description="Interne communicatie tussen leerling, instructeur en support in een overzichtelijke, premium inboxomgeving."
        actions={
          <>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/10 bg-white/6 text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.42)] backdrop-blur hover:bg-white/10"
            >
              <Link href="/leerling/boekingen">Planning openen</Link>
            </Button>
            <Button
              asChild
              className="rounded-full border border-white/12 bg-[linear-gradient(135deg,#f8fafc,#cbd5e1)] text-slate-950 shadow-[0_22px_46px_-26px_rgba(148,163,184,0.42)] hover:brightness-[1.03]"
            >
              <Link href="/leerling/instructeurs">Instructeurs bekijken</Link>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="berichten" className="space-y-4">
        <TabsList className="sticky top-28 z-10 !h-auto min-h-12 w-full justify-start overflow-x-auto overflow-y-hidden rounded-[1.35rem] border border-white/10 bg-slate-950/72 p-1 text-slate-300 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.65)] [-ms-overflow-style:none] [scrollbar-width:none] backdrop-blur-xl [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="berichten" className="h-10 rounded-full px-4 data-active:bg-sky-200 data-active:text-slate-950">
            Berichten
          </TabsTrigger>
          <TabsTrigger value="contacten" className="h-10 rounded-full px-4 data-active:bg-emerald-200 data-active:text-slate-950">
            Contacten
          </TabsTrigger>
        </TabsList>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {messageStats.map((item) => (
          <DashboardStatCard key={item.label} {...item} />
        ))}
      </div>

        <TabsContent value="berichten" className="mt-0">
          <MessageCenter
            inbox={inbox}
            recipients={recipients}
            recipientLabel="Instructeur"
            tone="urban"
          />
        </TabsContent>

        <TabsContent value="contacten" className="mt-0">
          <div className={urbanCardClassName}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-300 uppercase">
                  Contacten
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Beschikbare ontvangers
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-7 text-slate-300">
                  Alleen gekoppelde instructeurs of beschikbare platformcontacten verschijnen hier.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-slate-100">
                {recipients.length} contact(en)
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recipients.length ? (
                recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="rounded-[1.2rem] border border-white/10 bg-white/6 p-4"
                  >
                    <p className="font-semibold text-white">{recipient.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Klaar om vanuit de berichtenmodule te benaderen.
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-white/4 p-4 text-sm leading-6 text-slate-300 sm:col-span-2 xl:col-span-3">
                  Er zijn nog geen directe contacten beschikbaar. Zodra een traject loopt, verschijnen ze hier.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
