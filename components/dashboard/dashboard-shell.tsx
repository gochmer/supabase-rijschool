import { BellRing, Menu, Sparkles, Zap } from "lucide-react";

import { getAdminActivityFeed } from "@/lib/data/admin";
import { getCurrentNotifications } from "@/lib/data/notifications";
import { dashboardNavigation } from "@/lib/navigation";
import type { GebruikersRol } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ActivityDrawer } from "@/components/dashboard/activity-drawer";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardRouteChips } from "@/components/dashboard/dashboard-route-chips";
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
  const isInstructor = role === "instructeur";
  const isAppDashboard = isLearner || isInstructor;
  const isStandardCompact = isInstructor;
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

  if (isAppDashboard) {
    const unreadCount = notifications.filter((item) => item.ongelezen).length;

    return (
      <div className="app-dashboard relative min-h-screen overflow-hidden bg-[#0f0f0f] text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-[1680px]">
          <aside className="hidden w-[244px] shrink-0 border-r border-white/10 bg-[#0f0f0f] px-3 py-4 xl:flex xl:flex-col">
            <div className="mb-4 flex items-center gap-3 px-2">
              <button
                type="button"
                aria-label="Menu"
                className="flex size-9 items-center justify-center rounded-full text-slate-200 hover:bg-white/10"
              >
                <Menu className="size-5" />
              </button>
              <Logo inverse compact />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-slate-200" />
                <p className="text-xs font-semibold tracking-[0.22em] text-white uppercase">
                  {roleLabel}
                </p>
              </div>
              <p className="mt-1 text-[12px] leading-5 text-slate-400">{today}</p>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              <DashboardNav
                items={dashboardNavigation[role]}
                tone="urban"
                compact
              />
            </div>

            <div className="mt-4 grid gap-3 border-t border-white/10 pt-4">
              <ActivityDrawer
                title="Notificaties"
                description="Nieuwe meldingen en statusupdates."
                items={drawerItems}
                tone="urban"
                compact
              />
              <SignOutButton className="h-9 rounded-lg border border-white/10 bg-white/10 px-4 text-white hover:bg-white/14" />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0f0f0f]/96 backdrop-blur">
              <div className="flex h-16 items-center gap-3 px-3 sm:px-5">
                <div className="flex items-center gap-3 xl:hidden">
                  <button
                    type="button"
                    aria-label="Menu"
                    className="flex size-9 items-center justify-center rounded-full text-slate-200 hover:bg-white/10"
                  >
                    <Menu className="size-5" />
                  </button>
                  <Logo inverse compact />
                </div>

                <div className="hidden min-w-0 sm:block xl:w-48">
                  <p className="truncate text-sm font-semibold text-white">
                    {roleLabel} dashboard
                  </p>
                  <p className="truncate text-[12px] text-slate-400">
                    {unreadCount
                      ? `${unreadCount} melding${unreadCount === 1 ? "" : "en"}`
                      : "Bijgewerkt"}
                  </p>
                </div>

                <div className="mx-auto min-w-0 flex-1 sm:max-w-2xl">
                  <CommandPalette role={role} compact presentation="search" />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <ThemeToggle surface="dark" compact />
                  <NotificationDropdown notifications={notifications} surface="urban" />
                </div>
              </div>

              <DashboardRouteChips items={dashboardNavigation[role]} tone="urban" />
            </header>

            <main className="dashboard-fade min-w-0 space-y-4 px-3 py-4 sm:px-5 lg:px-6">
              <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                    <BellRing className="size-3.5" />
                    Dashboardstatus
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-200">
                    {unreadCount
                      ? `${unreadCount} ongelezen melding${unreadCount === 1 ? "" : "en"} vragen aandacht.`
                      : "Geen open meldingen. Je dashboard is bijgewerkt en rustig."}
                  </p>
                </div>
                <div className="inline-flex w-fit items-center rounded-lg bg-white/10 px-3 py-1 text-[12px] font-semibold text-slate-200">
                  {today}
                </div>
              </div>

              <RoleRedirectNotice role={role} />
              {children}
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden",
        isStandardCompact && "instructor-standard",
        isLearner
          ? "bg-[linear-gradient(180deg,#0f172a_0%,#111827_54%,#0f172a_100%)] text-white"
          : isStandardCompact
            ? "bg-slate-50 dark:bg-slate-950"
          : "bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_50%,#f8fafc_100%)] dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_52%,#111827_100%)]"
      )}
    >
      {isLearner ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.16),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(56,189,248,0.09),transparent_24%)]" />
      ) : null}

      <div
        className={cn(
          "mx-auto grid min-h-screen w-full items-start",
          isStandardCompact
            ? "max-w-[1360px] gap-4 px-3 py-3 xl:grid-cols-[232px_minmax(0,1fr)] xl:px-4"
            : "max-w-[1440px] gap-5 px-4 py-5 xl:grid-cols-[280px_minmax(0,1fr)] xl:px-6"
        )}
      >
        <aside
          className={cn(
            "min-h-0 xl:self-start",
            !isLearner && (isStandardCompact ? "xl:sticky xl:top-4" : "xl:sticky xl:top-6")
          )}
        >
          <div
            className={cn(
              "flex flex-col backdrop-blur-xl",
              isLearner || isStandardCompact ? "gap-3 p-3" : "gap-5 p-4",
              isStandardCompact ? "rounded-xl" : "rounded-[1.55rem]",
              isLearner
                ? "border border-white/10 bg-slate-950/82 shadow-[0_28px_86px_-48px_rgba(15,23,42,0.82)]"
                : isStandardCompact
                  ? "border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.05]"
                : "surface-panel"
            )}
          >
            <div className="shrink-0">
              <Logo inverse={isLearner} compact={isLearner} />
            </div>

            <div
              className={cn(
                "shrink-0",
                isLearner || isStandardCompact ? "rounded-lg p-3" : "rounded-[1.15rem] p-4",
                isLearner
                  ? "border border-white/10 bg-white/6"
                  : isStandardCompact
                    ? "border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]"
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
              <ThemeToggle
                surface={isLearner ? "dark" : "light"}
                compact={isLearner || isStandardCompact}
              />
            </div>

            <div className="space-y-4">
              <DashboardNav
                items={dashboardNavigation[role]}
                tone={isLearner ? "urban" : "default"}
                compact={isLearner || isStandardCompact}
              />
              <div className={cn(isLearner || isStandardCompact ? "grid gap-3" : "space-y-4")}>
                <CommandPalette role={role} compact={isLearner || isStandardCompact} />
                <ActivityDrawer
                  title={role === "admin" ? "Activiteit en platformfeed" : "Notificaties en updates"}
                  description={
                    role === "admin"
                      ? "Volg recente platformactiviteit, supportsignalen en operationele bewegingen."
                      : "Bekijk nieuwe meldingen, statusupdates en belangrijke accountsignalen."
                  }
                  items={drawerItems}
                  tone={isLearner ? "urban" : "default"}
                  compact={isLearner || isStandardCompact}
                />
              </div>
            </div>

            <div className="shrink-0">
              <div
                className={cn(
                  "shadow-[0_24px_64px_-38px_rgba(15,23,42,0.62)]",
                  isLearner || isStandardCompact ? "rounded-lg p-3.5" : "rounded-[1.25rem] p-5",
                  isLearner
                    ? "border border-white/10 bg-white/7 text-white"
                    : isStandardCompact
                      ? "border border-slate-200 bg-slate-50 text-slate-950 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
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
                    isLearner || isStandardCompact ? "mt-1.5 text-[13px]/5" : "mt-2 text-sm/7",
                    isLearner
                      ? "text-slate-200/88"
                      : isStandardCompact
                        ? "text-slate-600 dark:text-slate-300"
                      : "text-primary-foreground/85"
                  )}
                >
                  {isLearner
                    ? "Profiel, boekingen en instructeurs direct bereikbaar."
                    : "Belangrijkste acties, berichten en beheerflows staan klaar."}
                </p>
                <SignOutButton
                  className={cn(
                    isLearner || isStandardCompact
                      ? "mt-2.5 h-9 rounded-lg px-4"
                      : "mt-4 rounded-full",
                    isLearner
                      ? "border border-white/12 bg-[linear-gradient(135deg,#f8fafc,#cbd5e1)] text-slate-950 hover:brightness-[1.03]"
                      : isStandardCompact
                        ? "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      : "bg-white text-primary hover:bg-white/90"
                  )}
                />
              </div>
            </div>
          </div>
        </aside>

        <main
          className={cn(
            "dashboard-fade min-w-0",
            isStandardCompact ? "space-y-4" : "space-y-5 rounded-[1.65rem] p-2 sm:p-3",
            isLearner
              ? "border border-white/10 bg-white/5 backdrop-blur-md"
              : isStandardCompact
                ? ""
              : "border border-white/55 bg-white/45 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md"
          )}
        >
          <div
            className={cn(
              "sticky z-20 flex flex-col gap-3 border backdrop-blur sm:flex-row sm:items-center sm:justify-between",
              isStandardCompact ? "top-3 rounded-lg px-3 py-2" : "top-2 rounded-[1.25rem] px-4 py-3",
              isLearner
                ? "border-white/10 bg-slate-950/64"
                : isStandardCompact
                  ? "border-slate-200 bg-white/92 shadow-sm dark:border-white/10 dark:bg-slate-950/86"
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
