"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const options = [
  { value: "light" as const, label: "Licht", icon: Sun },
  { value: "dark" as const, label: "Donker", icon: Moon },
];

export function ThemeToggle({
  surface = "light",
  compact = false,
  className,
}: {
  surface?: "light" | "dark";
  compact?: boolean;
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDarkSurface = surface === "dark";
  const activeTheme = mounted ? theme : "light";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border p-1 transition-all",
        compact ? "gap-1" : "gap-1.5",
        isDarkSurface
          ? "border-white/10 bg-white/6 text-white shadow-[0_18px_42px_-28px_rgba(15,23,42,0.58)]"
          : "border-white/70 bg-white/82 text-slate-950 shadow-[0_18px_42px_-28px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.82))] dark:text-white dark:shadow-[0_18px_48px_-30px_rgba(15,23,42,0.56)]",
        !mounted && "pointer-events-none opacity-0",
        className,
      )}
      role="group"
      aria-label="Kies een kleurthema"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = activeTheme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={cn(
              "inline-flex items-center justify-center rounded-full font-medium transition-all",
              compact ? "gap-1.5 px-3 py-1.5 text-[11px]" : "gap-2 px-3.5 py-2 text-xs",
              isActive
                ? isDarkSurface
                  ? "bg-white text-slate-950 shadow-[0_12px_28px_-18px_rgba(255,255,255,0.58)]"
                  : "bg-[linear-gradient(135deg,#0f172a,#2563eb,#0ea5e9)] text-white shadow-[0_16px_34px_-22px_rgba(37,99,235,0.42)] dark:bg-[linear-gradient(135deg,rgba(248,250,252,0.96),rgba(191,219,254,0.94))] dark:text-slate-950 dark:shadow-[0_16px_34px_-22px_rgba(148,163,184,0.3)]"
                : isDarkSurface
                  ? "text-slate-200 hover:bg-white/10 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white",
            )}
            aria-pressed={isActive}
          >
            <Icon className={compact ? "size-3.5" : "size-4"} />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
