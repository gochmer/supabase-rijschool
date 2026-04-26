import { Sparkles, Zap } from "lucide-react";

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
          ? "bg-[linear-gradient(180deg,#0b1118_0%,#111827_42%,#161d27_100%)] text-white"
          : "bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_26%),radial-gradient(circle_at_18%_38%,_rgba(99,102,241,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.12),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_50%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_24%),radial-gradient(circle_at_18%_38%,_rgba(99,102,241,0.12),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.1),_transparent_22%),linear-gradient(180deg,#020617_0%,#0f172a_52%,#111827_100%)]"
      )}
    >
      {isLearner ? (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.18),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(56,189,248,0.1),transparent_20%),radial-gradient(circle_at_50%_78%,rgba(245,158,11,0.08),transparent_26%)]" />
          <div className="absolute left-[-8rem] top-[-4rem] h-[26rem] w-[26rem] rounded-full bg-slate-400/12 blur-3xl" />
          <div className="absolute right-[-8rem] top-[20%] h-[30rem] w-[30rem] rounded-full bg-sky-300/8 blur-3xl" />
          <div className="absolute bottom-[-8rem] left-[14%] h-[24rem] w-[24rem] rounded-full bg-amber-200/6 blur-3xl" />
        </div>
      ) : null}

      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] items-start gap-6 px-4 py-6 xl:grid-cols-[300px_minmax(0,1fr)] xl:px-6">
        <aside
          className={cn(
            "min-h-0 xl:self-start",
            !isLearner && "xl:sticky xl:top-6"
          )}
        >
          <div
            className={cn(
              "flex flex-col rounded-[2.2rem] backdrop-blur-xl",
              isLearner ? "gap-3 p-3.5" : "gap-6 p-4",
              isLearner
                ? "border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] shadow-[0_32px_100px_-48px_rgba(15,23,42,0.82)]"
                : "border border-white/70 bg-white/72 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.86),rgba(30,41,59,0.82),rgba(15,23,42,0.88))] dark:shadow-[0_32px_90px_-48px_rgba(15,23,42,0.76)]"
            )}
          >
            <div className="shrink-0">
              <Logo inverse={isLearner} compact={isLearner} />
            </div>

            <div
              className={cn(
                "shrink-0 rounded-[1.8rem]",
                isLearner ? "p-3" : "p-4",
                isLearner
                  ? "border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(148,163,184,0.08),rgba(15,23,42,0.28))]"
                  : "bg-slate-50/80 dark:bg-white/6"
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
                  "rounded-[1.9rem] shadow-[0_30px_80px_-40px_rgba(15,23,42,0.8)]",
                  isLearner ? "p-3.5" : "p-5",
                  isLearner
                    ? "border border-white/10 bg-[linear-gradient(135deg,#0f172a,#1e293b,#334155)] text-white shadow-[0_30px_90px_-44px_rgba(15,23,42,0.9)]"
                    : "bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(37,99,235,0.95),rgba(14,165,233,0.9))] text-primary-foreground dark:border dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(30,41,59,0.96),rgba(37,99,235,0.72),rgba(14,165,233,0.5))]"
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
                    : "Live dashboards, berichten, pakketten en beheerflows staan klaar in een modern platform."}
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
            "dashboard-fade min-w-0 space-y-6 rounded-[2.2rem] p-2 sm:p-3",
            isLearner
              ? "border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(17,24,39,0.76),rgba(15,23,42,0.72))] backdrop-blur-md"
              : "border border-white/50 bg-white/36 backdrop-blur-sm dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.46),rgba(15,23,42,0.32),rgba(15,23,42,0.42))] dark:backdrop-blur-md"
          )}
        >
          <RoleRedirectNotice role={role} />
          {children}
        </main>
      </div>
    </div>
  );
}
