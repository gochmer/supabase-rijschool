import type { ComponentType } from "react";
import {
  CalendarClock,
  Compass,
  Gauge,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
  Zap,
} from "lucide-react";

export type PackageIconKey =
  | "sparkles"
  | "shield"
  | "star"
  | "zap"
  | "wallet"
  | "compass"
  | "calendar"
  | "gauge";

export type PackageVisualTheme =
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "slate";

type PackageVisualThemeConfig = {
  label: string;
  description: string;
  softCardClass: string;
  featuredCardClass: string;
  softIconClass: string;
  featuredIconClass: string;
  softBadgeClass: string;
  featuredBadgeClass: string;
};

const packageIconMap: Record<PackageIconKey, ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  shield: ShieldCheck,
  star: Star,
  zap: Zap,
  wallet: Wallet,
  compass: Compass,
  calendar: CalendarClock,
  gauge: Gauge,
};

const packageThemeMap: Record<PackageVisualTheme, PackageVisualThemeConfig> = {
  sky: {
    label: "Sky",
    description: "Fris, premium en modern",
    softCardClass:
      "border-sky-100 bg-[linear-gradient(160deg,rgba(255,255,255,1),rgba(240,249,255,0.96))]",
    featuredCardClass:
      "border-sky-100 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(29,78,216,0.94),rgba(56,189,248,0.84))] text-white",
    softIconClass: "bg-sky-100 text-sky-700",
    featuredIconClass: "bg-white/12 text-white",
    softBadgeClass: "border-sky-100 bg-sky-50 text-sky-700",
    featuredBadgeClass: "border-white/16 bg-white/12 text-white",
  },
  emerald: {
    label: "Emerald",
    description: "Rustig, betrouwbaar en coachend",
    softCardClass:
      "border-emerald-100 bg-[linear-gradient(160deg,rgba(255,255,255,1),rgba(236,253,245,0.96))]",
    featuredCardClass:
      "border-emerald-100 bg-[linear-gradient(135deg,rgba(6,78,59,0.98),rgba(5,150,105,0.94),rgba(45,212,191,0.84))] text-white",
    softIconClass: "bg-emerald-100 text-emerald-700",
    featuredIconClass: "bg-white/12 text-white",
    softBadgeClass: "border-emerald-100 bg-emerald-50 text-emerald-700",
    featuredBadgeClass: "border-white/16 bg-white/12 text-white",
  },
  amber: {
    label: "Amber",
    description: "Warm, energiek en toegankelijk",
    softCardClass:
      "border-amber-100 bg-[linear-gradient(160deg,rgba(255,255,255,1),rgba(255,251,235,0.96))]",
    featuredCardClass:
      "border-amber-100 bg-[linear-gradient(135deg,rgba(120,53,15,0.98),rgba(217,119,6,0.94),rgba(251,191,36,0.84))] text-white",
    softIconClass: "bg-amber-100 text-amber-700",
    featuredIconClass: "bg-white/12 text-white",
    softBadgeClass: "border-amber-100 bg-amber-50 text-amber-700",
    featuredBadgeClass: "border-white/16 bg-white/12 text-white",
  },
  rose: {
    label: "Rose",
    description: "Gedurfd, premium en opvallend",
    softCardClass:
      "border-rose-100 bg-[linear-gradient(160deg,rgba(255,255,255,1),rgba(255,241,242,0.96))]",
    featuredCardClass:
      "border-rose-100 bg-[linear-gradient(135deg,rgba(76,5,25,0.98),rgba(190,24,93,0.94),rgba(251,113,133,0.84))] text-white",
    softIconClass: "bg-rose-100 text-rose-700",
    featuredIconClass: "bg-white/12 text-white",
    softBadgeClass: "border-rose-100 bg-rose-50 text-rose-700",
    featuredBadgeClass: "border-white/16 bg-white/12 text-white",
  },
  violet: {
    label: "Violet",
    description: "Luxe, creatief en premium",
    softCardClass:
      "border-violet-100 bg-[linear-gradient(160deg,rgba(255,255,255,1),rgba(245,243,255,0.96))]",
    featuredCardClass:
      "border-violet-100 bg-[linear-gradient(135deg,rgba(30,27,75,0.98),rgba(109,40,217,0.94),rgba(167,139,250,0.84))] text-white",
    softIconClass: "bg-violet-100 text-violet-700",
    featuredIconClass: "bg-white/12 text-white",
    softBadgeClass: "border-violet-100 bg-violet-50 text-violet-700",
    featuredBadgeClass: "border-white/16 bg-white/12 text-white",
  },
  slate: {
    label: "Slate",
    description: "Zakelijk, strak en rustig",
    softCardClass:
      "border-slate-200 bg-[linear-gradient(160deg,rgba(255,255,255,1),rgba(248,250,252,0.96))]",
    featuredCardClass:
      "border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(51,65,85,0.94),rgba(148,163,184,0.82))] text-white",
    softIconClass: "bg-slate-100 text-slate-700",
    featuredIconClass: "bg-white/12 text-white",
    softBadgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    featuredBadgeClass: "border-white/16 bg-white/12 text-white",
  },
};

export const packageIconOptions = [
  { key: "sparkles", label: "Sparkles", description: "Premium en modern" },
  { key: "shield", label: "Shield", description: "Vertrouwen en zekerheid" },
  { key: "star", label: "Star", description: "Uitgelicht en premium" },
  { key: "zap", label: "Zap", description: "Snel en energiek" },
  { key: "wallet", label: "Wallet", description: "Zakelijk en waarde" },
  { key: "compass", label: "Compass", description: "Richting en route" },
  { key: "calendar", label: "Calendar", description: "Gepland en gestructureerd" },
  { key: "gauge", label: "Gauge", description: "Tempo en voortgang" },
] as const satisfies ReadonlyArray<{
  key: PackageIconKey;
  label: string;
  description: string;
}>;

export const packageThemeOptions = Object.entries(packageThemeMap).map(
  ([key, value]) => ({
    key: key as PackageVisualTheme,
    label: value.label,
    description: value.description,
  })
);

export function isPackageIconKey(value: string): value is PackageIconKey {
  return value in packageIconMap;
}

export function isPackageVisualTheme(value: string): value is PackageVisualTheme {
  return value in packageThemeMap;
}

export function getPackageIconKey(value?: string | null): PackageIconKey {
  return value && isPackageIconKey(value) ? value : "sparkles";
}

export function getPackageThemeKey(value?: string | null): PackageVisualTheme {
  return value && isPackageVisualTheme(value) ? value : "sky";
}

export function getPackageVisualConfig(
  iconKey?: string | null,
  themeKey?: string | null
) {
  const safeIconKey = getPackageIconKey(iconKey);
  const safeThemeKey = getPackageThemeKey(themeKey);
  const Icon = packageIconMap[safeIconKey];
  const theme = packageThemeMap[safeThemeKey];

  return {
    Icon,
    iconKey: safeIconKey,
    themeKey: safeThemeKey,
    ...theme,
  };
}
