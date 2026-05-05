import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2 } from "lucide-react";

import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/notifications";
import { ExperienceCallout } from "@/components/dashboard/experience-callout";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { getCurrentNotifications } from "@/lib/data/notifications";

const cardClassName =
  "rounded-xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_20px_60px_-44px_rgba(0,0,0,0.9)]";

export default async function LeerlingNotificatiesPage() {
  const notifications = await getCurrentNotifications({ limit: 60 });
  const unreadCount = notifications.filter((notification) => notification.ongelezen).length;
  async function markAllRead() {
    "use server";

    await markAllNotificationsReadAction();
  }

  return (
    <div className="space-y-4 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Notificaties"
        title="Alle meldingen"
        description="Alleen updates die iets betekenen voor je planning, betaling, voortgang of support."
        actions={
          <form action={markAllRead}>
            <PendingSubmitButton
              className="rounded-full border border-white/12 bg-[linear-gradient(135deg,#f8fafc,#cbd5e1)] text-slate-950 hover:brightness-[1.03]"
              disabled={!unreadCount}
              pendingLabel="Bijwerken..."
            >
              Markeer alles gelezen
            </PendingSubmitButton>
          </form>
        }
      />

      <section className={cardClassName}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Badge variant={unreadCount ? "warning" : "success"}>
              {unreadCount} ongelezen
            </Badge>
            <h2 className="mt-3 text-xl font-semibold">Wat vraagt aandacht?</h2>
          </div>
          <Bell className="size-6 text-sky-200" />
        </div>

        <div className="mt-4">
          <ExperienceCallout
            icon={Bell}
            title="Meldingen zonder ruis"
            description="Nieuwe items blijven zichtbaar tot jij ze markeert als gelezen. Zo mis je niets, zonder dat oude updates blijven duwen."
          />
        </div>

        <div className="mt-4 space-y-3">
          {notifications.length ? (
            notifications.map((notification) => (
              <article
                key={notification.id}
                className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/6 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{notification.titel}</p>
                    <Badge
                      variant={
                        notification.type === "succes"
                          ? "success"
                          : notification.type === "waarschuwing"
                            ? "warning"
                            : "info"
                      }
                    >
                      {notification.type}
                    </Badge>
                    {notification.ongelezen ? (
                      <Badge variant="danger">Nieuw</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {notification.tekst}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">{notification.tijd}</p>
                  {notification.actionHref ? (
                    <Link
                      href={notification.actionHref}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-200 hover:text-sky-100"
                    >
                      Open actie
                      <ArrowRight className="size-4" />
                    </Link>
                  ) : null}
                </div>
                {notification.ongelezen ? (
                  <form
                    action={async () => {
                      "use server";

                      await markNotificationReadAction(notification.id);
                    }}
                  >
                    <PendingSubmitButton
                      pendingLabel="Opslaan..."
                      size="sm"
                      variant="outline"
                    >
                      Gelezen
                    </PendingSubmitButton>
                  </form>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm text-emerald-200">
                    <CheckCircle2 className="size-4" />
                    Gelezen
                  </span>
                )}
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-white/12 bg-white/4 p-6 text-center">
              <CheckCircle2 className="mx-auto size-9 text-emerald-300" />
              <p className="mt-3 font-semibold">Geen meldingen</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Je bent bij. Nieuwe updates verschijnen hier pas wanneer er echt iets verandert.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
