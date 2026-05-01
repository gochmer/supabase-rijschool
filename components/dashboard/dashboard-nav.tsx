"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Compass,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  Profiel: Users,
  Instructeurs: Star,
  Boekingen: CalendarDays,
  Betalingen: CreditCard,
  Berichten: Bell,
  Reviews: Star,
  Instellingen: Settings,
  Beschikbaarheid: CalendarDays,
  Aanvragen: FolderKanban,
  Leerlingen: Users,
  Lessen: BookOpen,
  Inkomsten: CreditCard,
  Gebruikers: Users,
  Pakketten: FolderKanban,
  Support: LifeBuoy,
  "Openbare gids": Compass,
};

export function DashboardNav({
  items,
  tone = "default",
  compact = false,
}: {
  items: Array<{ href: string; label: string }>;
  tone?: "default" | "hazard" | "urban";
  compact?: boolean;
}) {
  const pathname = usePathname();
  const isUrban = tone === "urban";
  const isHazard = tone === "hazard";

  return (
    <nav className={cn("flex flex-col", compact ? "gap-1.5" : "gap-2")}>
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = iconMap[item.label] ?? ShieldCheck;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex min-w-0 items-center rounded-[1.4rem] font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              compact ? "gap-3 px-3 py-3 text-base" : "gap-3 px-4 py-3 text-sm",
              active
                ? isUrban
                  ? "border border-white/12 bg-[linear-gradient(135deg,rgba(59,130,246,0.3),rgba(71,85,105,0.5),rgba(30,41,59,0.72))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : isHazard
                    ? "border border-red-300/16 bg-[linear-gradient(135deg,rgba(48,15,18,0.96),rgba(127,29,29,0.94),rgba(249,115,22,0.72))] text-white shadow-[0_22px_54px_-30px_rgba(185,28,28,0.78)]"
                    : "bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#0ea5e9)] text-white shadow-[0_22px_50px_-28px_rgba(37,99,235,0.8)]"
                : isUrban
                  ? "border border-transparent text-slate-300 hover:border-white/8 hover:bg-white/6 hover:text-white"
                  : isHazard
                    ? "border border-transparent text-stone-300 hover:border-red-300/10 hover:bg-white/6 hover:text-white"
                    : "text-muted-foreground hover:bg-white hover:text-foreground dark:text-slate-300 dark:hover:bg-white/6 dark:hover:text-white",
            )}
          >
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-xl transition-colors",
                compact ? "size-8" : "size-9",
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
                      : "bg-slate-100 text-slate-600 group-hover:bg-slate-950 group-hover:text-white dark:bg-white/6 dark:text-slate-300 dark:group-hover:bg-white/10 dark:group-hover:text-white",
              )}
            >
              <Icon className={compact ? "size-4" : "size-4"} />
            </span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
