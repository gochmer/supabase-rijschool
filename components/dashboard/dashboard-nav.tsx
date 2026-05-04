"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CarFront,
  Compass,
  CreditCard,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  Settings,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

import {
  isDashboardNavigationItemActive,
  type DashboardNavigationItem,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  Regie: Gauge,
  Profiel: Users,
  Instructeurs: Star,
  Boekingen: CalendarDays,
  Betalingen: CreditCard,
  Berichten: Bell,
  Agenda: CalendarDays,
  Financiën: CreditCard,
  Reviews: Star,
  Instellingen: Settings,
  Beschikbaarheid: CalendarDays,
  Aanvragen: FolderKanban,
  Leerlingen: Users,
  Lessen: BookOpen,
  Inkomsten: CreditCard,
  Gebruikers: Users,
  Pakketten: FolderKanban,
  Onboarding: ClipboardCheck,
  Documenten: FileText,
  Voertuigen: CarFront,
  Support: LifeBuoy,
  "Openbare gids": Compass,
};

export function DashboardNav({
  items,
  tone = "default",
  compact = false,
}: {
  items: DashboardNavigationItem[];
  tone?: "default" | "hazard" | "urban";
  compact?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingRoute, setPendingRoute] = useState<{
    href: string;
    fromPathname: string;
    startedAt: number;
  } | null>(null);
  const isUrban = tone === "urban";
  const isHazard = tone === "hazard";

  useEffect(() => {
    if (!pendingRoute || pendingRoute.fromPathname === pathname) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      const duration = Math.round(performance.now() - pendingRoute.startedAt);
      console.info(
        `[perf] dashboard route ${pendingRoute.fromPathname} -> ${pathname}: ${duration}ms`,
      );
    }
  }, [pathname, pendingRoute]);

  return (
    <nav className={cn("flex flex-col", compact ? "gap-1.5" : "gap-2")}>
      {items.map((item) => {
        const active = isDashboardNavigationItemActive(pathname, item);
        const pending = pendingRoute?.href === item.href && !active;
        const Icon = iconMap[item.label] ?? ShieldCheck;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onFocus={() => router.prefetch(item.href)}
            onMouseEnter={() => router.prefetch(item.href)}
            onClick={(event) => {
              if (
                active ||
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              ) {
                return;
              }

              setPendingRoute({
                href: item.href,
                fromPathname: pathname,
                startedAt: performance.now(),
              });
              router.prefetch(item.href);
            }}
            className={cn(
              "group flex min-w-0 items-center rounded-[1.4rem] font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              compact ? "gap-2.5 px-2.5 py-2 text-[0.92rem]" : "gap-3 px-4 py-3 text-sm",
              active
                ? isUrban
                  ? "border border-white/12 bg-[linear-gradient(135deg,rgba(226,232,240,0.18),rgba(51,65,85,0.96),rgba(15,23,42,0.98))] text-white shadow-[0_22px_54px_-30px_rgba(15,23,42,0.84)]"
                  : isHazard
                  ? "border border-red-300/16 bg-[linear-gradient(135deg,rgba(48,15,18,0.96),rgba(127,29,29,0.94),rgba(249,115,22,0.72))] text-white shadow-[0_22px_54px_-30px_rgba(185,28,28,0.78)]"
                  : "bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#0ea5e9)] text-white shadow-[0_22px_50px_-28px_rgba(37,99,235,0.8)]"
                : isUrban
                  ? "border border-transparent text-slate-300 hover:border-white/8 hover:bg-white/6 hover:text-white"
                : isHazard
                  ? "border border-transparent text-stone-300 hover:border-red-300/10 hover:bg-white/6 hover:text-white"
                  : "text-muted-foreground hover:bg-white hover:text-foreground dark:text-slate-300 dark:hover:bg-white/6 dark:hover:text-white"
            )}
          >
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-xl transition-colors",
                compact ? "size-7" : "size-9",
                active
                  ? isUrban
                    ? "bg-white/12 text-slate-50"
                    : isHazard
                    ? "bg-white/12 text-red-50"
                    : "bg-white/14 text-white"
                  : isUrban
                    ? "bg-white/6 text-slate-300 group-hover:bg-slate-200/14 group-hover:text-slate-50"
                    : isHazard
                    ? "bg-white/6 text-stone-300 group-hover:bg-red-500/16 group-hover:text-red-50"
                    : "bg-slate-100 text-slate-600 group-hover:bg-slate-950 group-hover:text-white dark:bg-white/6 dark:text-slate-300 dark:group-hover:bg-white/10 dark:group-hover:text-white"
              )}
            >
              {pending ? (
                <Loader2
                  className={cn(
                    "animate-spin",
                    compact ? "size-3.5" : "size-4",
                  )}
                />
              ) : (
                <Icon className={compact ? "size-3.5" : "size-4"} />
              )}
            </span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {pending ? (
              <span className="size-1.5 shrink-0 rounded-full bg-current opacity-80" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
