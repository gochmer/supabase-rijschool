import {
  CalendarClock,
  ClipboardPenLine,
  MessageSquareMore,
  Send,
  Sparkles,
} from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { PageHeader } from "@/components/dashboard/page-header";
import { MessageCenter } from "@/components/messages/message-center";
import { cn } from "@/lib/utils";
import {
  getCurrentMessageInbox,
  getCurrentOutgoingMessageLog,
  getInstructorMessageSmartTemplates,
  getMessageRecipientsForCurrentUser,
} from "@/lib/data/messages";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";

const ROUTE = "/instructeur/berichten";

export default async function InstructeurBerichtenPage() {
  const [inbox, recipients, smartTemplates, outgoingLog] =
    await timedDashboardRoute(ROUTE, () =>
      Promise.all([
        timedDashboardData(ROUTE, "inbox", getCurrentMessageInbox),
        timedDashboardData(ROUTE, "recipients", getMessageRecipientsForCurrentUser),
        timedDashboardData(
          ROUTE,
          "smart-templates",
          getInstructorMessageSmartTemplates,
        ),
        timedDashboardData(ROUTE, "outgoing-log", getCurrentOutgoingMessageLog),
      ]),
    );

  const unreadCount = inbox.filter((message) => message.ongelezen).length;
  const directSendReadyCount = smartTemplates.filter(
    (template) =>
      template.kind === "lesson_reminder" || template.kind === "intake_follow_up"
  ).length;

  const heroSignals = [
    {
      label: "Inbox",
      value: `${inbox.length}`,
      hint: unreadCount
        ? `${unreadCount} ongelezen bericht${unreadCount === 1 ? "" : "en"}`
        : "Geen open inboxdruk",
      tone:
        "border-sky-200/80 bg-sky-50/80 dark:border-sky-400/20 dark:bg-sky-500/10",
    },
    {
      label: "Slimme templates",
      value: `${smartTemplates.length}`,
      hint: "Voor opvolging, herinnering en pakketvoorstel",
      tone:
        "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-500/10",
    },
    {
      label: "Direct veilig",
      value: `${directSendReadyCount}`,
      hint: "Templates die meteen verzonden mogen worden",
      tone:
        "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10",
    },
  ];

  const summaryCards = [
    {
      label: "Ongelezen",
      value: `${unreadCount}`,
      description: "Nieuwe leerlingsignalen die nu aandacht vragen.",
      icon: MessageSquareMore,
      tone: unreadCount > 0 ? "amber" : "emerald",
    },
    {
      label: "Recent verstuurd",
      value: `${outgoingLog.length}`,
      description: "Laatste berichten en templateacties uit je werklaag.",
      icon: Send,
      tone: "sky",
    },
    {
      label: "Leerlingen bereikbaar",
      value: `${recipients.length}`,
      description: "Ontvangers waar je nu direct een bericht aan kunt sturen.",
      icon: CalendarClock,
      tone: "cyan",
    },
    {
      label: "Opvolging klaar",
      value: `${smartTemplates.length}`,
      description: "Concepten klaar voor intake, herinnering of voorstel.",
      icon: ClipboardPenLine,
      tone: "violet",
    },
  ] as const;

  return (
    <div className="space-y-4">
      <PageHeader
        tone="urban"
        title="Berichten"
        description="Werk sneller en rustiger met een duidelijke inbox, direct bruikbare templates en een net overzicht van je laatste opvolging."
      />

      <section className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.055] p-4 text-white shadow-[0_20px_60px_-44px_rgba(0,0,0,0.9)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(59,130,246,0.18),transparent_26%),radial-gradient(circle_at_70%_86%,rgba(148,163,184,0.16),transparent_24%)]" />
        <div className="relative grid gap-5 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/78 uppercase">
              <Sparkles className="size-3.5" />
              Berichten cockpit
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
              Houd opvolging naar leerlingen snel, rustig en professioneel.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
              Eén plek voor je inbox, verstuurde berichten en slimme templates,
              zodat je minder hoeft te schakelen en sneller kunt reageren.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {heroSignals.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-lg border px-3.5 py-3 backdrop-blur",
                    item.tone
                  )}
                >
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-white/68 uppercase">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs leading-5 text-white/68">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/7 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/62 uppercase">
                  Volgende stap
                </p>
                <p className="mt-1 text-4xl font-semibold">{unreadCount + directSendReadyCount}</p>
              </div>
              <MessageSquareMore className="size-8 text-sky-200" />
            </div>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Totaal aan directe inboxdruk plus templates die je nu veilig kunt gebruiken
              zonder extra denkwerk.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <DashboardStatCard
            key={item.label}
            detail={item.description}
            icon={item.icon}
            label={item.label}
            tone={item.tone}
            value={item.value}
          />
        ))}
      </div>

      <DashboardPerformanceMark route={ROUTE} label="MessageCenter" />

      <MessageCenter
        inbox={inbox}
        outgoingLog={outgoingLog}
        recipients={recipients}
        recipientLabel="Leerling"
        smartTemplates={smartTemplates}
      />
    </div>
  );
}
