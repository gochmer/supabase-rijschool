"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

type ModuleTab = {
  description?: string;
  href: string;
  label: string;
};

type ModuleGroup = {
  id: string;
  label: string;
  routes: string[];
  tabs: ModuleTab[];
};

const instructorModuleGroups: ModuleGroup[] = [
  {
    id: "operations",
    label: "Regie",
    routes: [
      "/instructeur/regie",
      "/instructeur/onboarding",
      "/instructeur/documenten",
      "/instructeur/voertuigen",
      "/instructeur/instellingen",
    ],
    tabs: [
      {
        href: "/instructeur/regie",
        label: "Vandaag",
        description: "Wat vraagt nu aandacht?",
      },
      {
        href: "/instructeur/onboarding",
        label: "Onboarding",
        description: "Welke basis mist nog?",
      },
      {
        href: "/instructeur/documenten",
        label: "Documenten",
        description: "Welke bewijzen zijn klaar?",
      },
      {
        href: "/instructeur/voertuigen",
        label: "Voertuigen",
        description: "Welke auto is inzetbaar?",
      },
    ],
  },
  {
    id: "profile",
    label: "Profiel",
    routes: ["/instructeur/profiel", "/instructeur/reviews"],
    tabs: [
      { href: "/instructeur/profiel", label: "Gegevens" },
      { href: "/instructeurs", label: "Openbare gids" },
      { href: "/instructeur/reviews", label: "Reviews" },
    ],
  },
  {
    id: "agenda",
    label: "Agenda",
    routes: [
      "/instructeur/lessen",
      "/instructeur/beschikbaarheid",
      "/instructeur/aanvragen",
    ],
    tabs: [
      {
        href: "/instructeur/lessen",
        label: "Lessen",
        description: "Wat staat er gepland?",
      },
      {
        href: "/instructeur/beschikbaarheid",
        label: "Beschikbaarheid",
        description: "Wanneer kan ik werken?",
      },
      {
        href: "/instructeur/aanvragen",
        label: "Aanvragen",
        description: "Wat moet ik nog accepteren?",
      },
    ],
  },
  {
    id: "learners",
    label: "Leerlingen",
    routes: ["/instructeur/leerlingen"],
    tabs: [
      { href: "/instructeur/leerlingen", label: "Actieve leerlingen" },
      { href: "/instructeur/aanvragen", label: "Aanvragen" },
      { href: "/instructeur/lessen", label: "Lesgeschiedenis" },
    ],
  },
  {
    id: "finance",
    label: "Financiën",
    routes: ["/instructeur/inkomsten", "/instructeur/pakketten"],
    tabs: [
      { href: "/instructeur/inkomsten", label: "Inkomsten" },
      { href: "/instructeur/pakketten", label: "Pakketten" },
    ],
  },
];

function isRouteActive(pathname: string, href: string) {
  return pathname === href;
}

export function InstructorModuleTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const group = instructorModuleGroups.find((item) =>
    item.routes.includes(pathname),
  );

  if (!group) {
    return null;
  }

  const activeTab = group.tabs.find((tab) => isRouteActive(pathname, tab.href));
  const hasTabDescriptions = group.tabs.some((tab) => tab.description);

  return (
    <section className="rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.065),rgba(15,23,42,0.36))] px-3 py-3 text-white shadow-[0_22px_70px_-54px_rgba(0,0,0,0.95)] 2xl:px-5 2xl:py-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-slate-400 uppercase">
            Module
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            {group.label}
          </h2>
          {activeTab?.description ? (
            <p className="mt-1 text-sm text-slate-400">
              {activeTab.description}
            </p>
          ) : null}
        </div>
        <nav
          aria-label={`${group.label} tabs`}
          className={cn(
            "min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            hasTabDescriptions
              ? "grid gap-2 sm:grid-cols-2 xl:w-[50rem] xl:grid-cols-4"
              : "flex gap-2",
          )}
        >
          {group.tabs.map((tab) => {
            const active = isRouteActive(pathname, tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                prefetch
                aria-current={active ? "page" : undefined}
                onFocus={() => router.prefetch(tab.href)}
                onMouseEnter={() => router.prefetch(tab.href)}
                className={cn(
                  "shrink-0 rounded-lg border px-3 text-sm font-semibold transition-colors 2xl:px-4",
                  hasTabDescriptions
                    ? "flex min-h-16 flex-col justify-center"
                    : "inline-flex h-9 items-center 2xl:h-10",
                  active
                    ? "border-sky-300/30 bg-white text-slate-950 shadow-[0_14px_34px_-24px_rgba(226,232,240,0.7)]"
                    : "border-white/10 bg-white/7 text-slate-200 hover:bg-white/12 hover:text-white",
                )}
              >
                <span>{tab.label}</span>
                {tab.description ? (
                  <span
                    className={cn(
                      "mt-1 text-xs font-medium",
                      active ? "text-slate-600" : "text-slate-400",
                    )}
                  >
                    {tab.description}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
