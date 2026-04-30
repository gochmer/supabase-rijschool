import { BellRing, Sparkles, Zap } from "lucide-react";

import { getAdminActivityFeed } from "@/lib/data/admin";
import { getCurrentNotifications } from "@/lib/data/notifications";
import { dashboardNavigation } from "@/lib/navigation";
import type { GebruikersRol } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ActivityDrawer } from "@/components/dashboard/activity-drawer";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { RoleRedirectNotice } from "@/components/dashboard/role-redirect-notice";
import { Logo } from "@/components/logo";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export async function DashboardShell({
  role,
  children,
}: {
  role: GebruikersRol;
  children: React.ReactNode;
}) {
  const roleLabel =
    role === "admin" ? "Beheerder" : role === "instructeur" ? "Instructeur" : "Leerling";
  const isLearner = role === "leerling";
  const today = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const [notifications, adminActivity] = await Promise.all([
    getCurrentNotifications(),
    role === "admin" ? getAdminActivityFeed() : Promise.resolve([]),
  ]);

  const drawerItems =
    role === "admin"
      ? adminActivity.map((item) => ({
          id: item.id,
          title: item.titel,
          description: item.detail,
          meta: item.type,
          tone: "info" as const,
        }))
      : notifications.map((item) => ({
          id: item.id,
          title: item.titel,
          description: item.tekst,
          meta: item.tijd,
          tone:
            item.type === "succes"
              ? ("success" as const)
              : item.type === "waarschuwing"
                ? ("warning" as const)
                : ("info" as const),
        }));

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden",
        isLearner
          ? "bg-[linear-gradient(180deg,#0f172a_0%,#111827_54%,#0f172a_100%)] text-white"
          : "bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_50%,#f8fafc_100%)] dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_52%,#111827_100%)]"
      )}
    >
      {isLearner ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.16),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(56,189,248,0.09),transparent_24%)]" />
      ) : null}

      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] items-start gap-5 px-4 py-5 xl:grid-cols-[280px_minmax(0,1fr)] xl:px-6">
        <aside
          className={cn(
            "min-h-0 xl:self-start",
            !isLearner && "xl:sticky xl:top-6"
          )}
        >
          <div
            className={cn(
              "flex flex-col rounded-[1.55rem] backdrop-blur-xl",
              isLearner ? "gap-3 p-3" : "gap-5 p-4",
              isLearner
                ? "border border-white/10 bg-slate-950/82 shadow-[0_28px_86px_-48px_rgba(15,23,42,0.82)]"
                : "surface-panel"
            )}
          >
            <div className="shrink-0">
              <Logo inverse={isLearner} compact={isLearner} />
            </div>

            <div
              className={cn(
                "shrink-0 rounded-[1.15rem]",
                isLearner ? "p-3" : "p-4",
                isLearner
                  ? "border border-white/10 bg-white/6"
                  : "surface-card"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2",
                  isLearner ? "text-white" : "text-slate-950"
                )}
              >
                <Sparkles className={cn("size-4", isLearner ? "text-slate-200" : "text-primary")} />
                <p className="text-xs font-semibold tracking-[0.28em] uppercase">
                  {roleLabel}
                </p>
              </div>
              <p className={cn("mt-1 text-sm", isLearner ? "text-slate-300" : "text-muted-foreground")}>
                {today}
              </p>
            </div>

            <div className="shrink-0">
              <ThemeToggle surface={isLearner ? "dark" : "light"} compact={isLearner} />
            </div>

            <div className="space-y-4">
              <DashboardNav
                items={dashboardNavigation[role]}
                tone={isLearner ? "urban" : "default"}
                compact={isLearner}
              />
              <div className={cn(isLearner ? "grid gap-3" : "space-y-4")}>
                <CommandPalette role={role} compact={isLearner} />
                <ActivityDrawer
                  title={role === "admin" ? "Activiteit en platformfeed" : "Notificaties en updates"}
                  description={
                    role === "admin"
                      ? "Volg recente platformactiviteit, supportsignalen en operationele bewegingen."
                      : "Bekijk nieuwe meldingen, statusupdates en belangrijke accountsignalen."
                  }
                  items={drawerItems}
                  tone={isLearner ? "urban" : "default"}
                  compact={isLearner}
                />
              </div>
            </div>

            <div className="shrink-0">
              <div
                className={cn(
                  "rounded-[1.25rem] shadow-[0_24px_64px_-38px_rgba(15,23,42,0.62)]",
                  isLearner ? "p-3.5" : "p-5",
                  isLearner
                    ? "border border-white/10 bg-white/7 text-white"
                    : "border border-slate-200 bg-slate-950 text-primary-foreground dark:border-white/10 dark:bg-white/7"
                )}
              >
                <div className="flex items-center gap-2">
                  <Zap className="size-4" />
                  <p className="text-sm font-semibold">
                    {isLearner ? "Workspace status" : "Platformstatus"}
                  </p>
                </div>
                <p
                  className={cn(
                    isLearner ? "mt-1.5 text-[13px]/5" : "mt-2 text-sm/7",
                    isLearner ? "text-slate-200/88" : "text-primary-foreground/85"
                  )}
                >
                  {isLearner
                    ? "Profiel, boekingen en instructeurs direct bereikbaar."
                    : "Belangrijkste acties, berichten en beheerflows staan klaar."}
                </p>
                <SignOutButton
                  className={cn(
                    isLearner ? "mt-2.5 h-9 rounded-full px-4" : "mt-4 rounded-full",
                    isLearner
                      ? "border border-white/12 bg-[linear-gradient(135deg,#f8fafc,#cbd5e1)] text-slate-950 hover:brightness-[1.03]"
                      : "bg-white text-primary hover:bg-white/90"
                  )}
                />
              </div>
            </div>
          </div>
        </aside>

        <main
          className={cn(
            "dashboard-fade min-w-0 space-y-5 rounded-[1.65rem] p-2 sm:p-3",
            isLearner
              ? "border border-white/10 bg-white/5 backdrop-blur-md"
              : "border border-white/55 bg-white/45 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md"
          )}
        >
          <div
            className={cn(
              "sticky top-2 z-20 flex flex-col gap-3 rounded-[1.25rem] border px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between",
              isLearner
                ? "border-white/10 bg-slate-950/64"
                : "border-white/70 bg-white/84 dark:border-white/10 dark:bg-slate-950/72"
            )}
          >
            <div className="min-w-0">
              <div
                className={cn(
                  "flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase",
                  isLearner ? "text-slate-300" : "text-primary dark:text-sky-300"
                )}
              >
                <BellRing className="size-3.5" />
                Dashboardstatus
              </div>
              <p
                className={cn(
                  "mt-1 text-sm leading-6",
                  isLearner ? "text-slate-200" : "text-slate-700 dark:text-slate-200"
                )}
              >
                {notifications.filter((item) => item.ongelezen).length
                  ? `${notifications.filter((item) => item.ongelezen).length} ongelezen melding(en) vragen aandacht.`
                  : "Geen open meldingen. Je dashboard is bijgewerkt en rustig."}
              </p>
            </div>

            <NotificationDropdown
              notifications={notifications}
              surface={isLearner ? "urban" : "default"}
            />
          </div>
          <RoleRedirectNotice role={role} />
          {children}
        </main>
      </div>
    </div>
  );
}
