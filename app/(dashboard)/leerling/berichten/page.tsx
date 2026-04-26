import Link from "next/link";
import { BellRing, Radio, Send } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { MessageCenter } from "@/components/messages/message-center";
import { Button } from "@/components/ui/button";
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

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: BellRing,
            label: "Ongelezen berichten",
            value: `${unreadCount}`,
            detail:
              unreadCount > 0
                ? "Er wachten nog berichten op jouw aandacht."
                : "Je inbox is bijgewerkt en volledig gelezen.",
          },
          {
            icon: Radio,
            label: "Beschikbare contacten",
            value: `${recipients.length}`,
            detail:
              recipients.length > 0
                ? "Je kunt direct schakelen met instructeurs binnen het platform."
                : "Er zijn nog geen ontvangers klaar voor directe communicatie.",
          },
          {
            icon: Send,
            label: "Laatste bericht",
            value: latestMessage?.afzender ?? "Nog geen berichten",
            detail: latestMessage
              ? latestMessage.tijd
              : "Zodra er een bericht binnenkomt wordt hier de laatste update getoond.",
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

      <MessageCenter
        inbox={inbox}
        recipients={recipients}
        recipientLabel="Instructeur"
        tone="urban"
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {[
          {
            icon: Send,
            title: "Helder formuleren",
            text: "Korte en duidelijke berichten zorgen bijna altijd voor snellere en betere reacties.",
          },
          {
            icon: BellRing,
            title: "Sneller opvolgen",
            text: "Met een rustiger inboxoverzicht zie je nieuwe berichten sneller terug zonder visuele drukte.",
          },
          {
            icon: Radio,
            title: "Professionele uitstraling",
            text: "Deze berichtenmodule oogt nu serieuzer en premium, maar blijft eenvoudig in gebruik.",
          },
        ].map((item) => (
          <div key={item.title} className={urbanCardClassName}>
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-slate-100">
              <item.icon className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
