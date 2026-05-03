"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  isDashboardNavigationItemActive,
  type DashboardNavigationItem,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function DashboardRouteChips({
  items,
  tone = "default",
}: {
  items: DashboardNavigationItem[];
  tone?: "default" | "urban";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isUrban = tone === "urban";

  return (
    <div
      className={cn(
        "overflow-x-auto border-t px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden",
        isUrban
          ? "border-white/10 bg-[#0f0f0f]"
          : "border-slate-200 bg-white/90 dark:border-white/10 dark:bg-slate-950/80"
      )}
    >
      <div className="flex min-w-max items-center gap-2">
        {items.map((item) => {
          const active = isDashboardNavigationItemActive(pathname, item);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onFocus={() => router.prefetch(item.href)}
              onMouseEnter={() => router.prefetch(item.href)}
              className={cn(
                "inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold transition-colors",
                active
                  ? isUrban
                    ? "bg-white text-slate-950"
                    : "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                  : isUrban
                    ? "bg-white/9 text-slate-200 hover:bg-white/14 hover:text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/8 dark:text-slate-200 dark:hover:bg-white/12"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
