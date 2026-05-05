"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import type { GebruikersRol } from "@/lib/types";
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

const moduleGroupsByRole: Record<GebruikersRol, ModuleGroup[]> = {
  leerling: [
    {
      id: "trajectory",
      label: "Leertraject",
      routes: [
        "/leerling/dashboard",
        "/leerling/voortgang",
        "/leerling/boekingen",
        "/leerling/lesmateriaal",
      ],
      tabs: [
        {
          href: "/leerling/dashboard",
          label: "Overzicht",
          description: "Wat is nu je volgende stap?",
        },
        {
          href: "/leerling/voortgang",
          label: "Voortgang",
          description: "Waar sta je in je traject?",
        },
        {
          href: "/leerling/boekingen",
          label: "Boekingen",
          description: "Welke lessen en aanvragen lopen?",
        },
        {
          href: "/leerling/lesmateriaal",
          label: "Lesmateriaal",
          description: "Waar kun je extra mee oefenen?",
        },
      ],
    },
    {
      id: "choice",
      label: "Instructeurs",
      routes: ["/leerling/instructeurs"],
      tabs: [
        {
          href: "/leerling/instructeurs",
          label: "Zoeken",
          description: "Vergelijk instructeurs en kies rustig.",
        },
      ],
    },
    {
      id: "finance",
      label: "Betalingen",
      routes: ["/leerling/betalingen"],
      tabs: [
        {
          href: "/leerling/betalingen",
          label: "Pakketten en betalingen",
          description: "Wat staat open of is al actief?",
        },
      ],
    },
    {
      id: "communication",
      label: "Communicatie",
      routes: [
        "/leerling/berichten",
        "/leerling/notificaties",
        "/leerling/support",
      ],
      tabs: [
        {
          href: "/leerling/berichten",
          label: "Berichten",
          description: "Gesprekken met instructeur en platform.",
        },
        {
          href: "/leerling/notificaties",
          label: "Meldingen",
          description: "Updates over planning en voortgang.",
        },
        {
          href: "/leerling/support",
          label: "Support",
          description: "Hulpvragen en tickets.",
        },
      ],
    },
    {
      id: "account",
      label: "Profiel",
      routes: [
        "/leerling/profiel",
        "/leerling/documenten",
        "/leerling/reviews",
        "/leerling/instellingen",
      ],
      tabs: [
        {
          href: "/leerling/profiel",
          label: "Profiel",
          description: "Je gegevens en trajectafspraken.",
        },
        {
          href: "/leerling/documenten",
          label: "Documenten",
          description: "Dossier en bewijsstukken.",
        },
        {
          href: "/leerling/reviews",
          label: "Reviews",
          description: "Feedback na afgeronde lessen.",
        },
        {
          href: "/leerling/instellingen",
          label: "Instellingen",
          description: "Voorkeuren, privacy en meldingen.",
        },
      ],
    },
  ],
  instructeur: [
    {
      id: "operations",
      label: "Regie",
      routes: [
        "/instructeur/regie",
        "/instructeur/onboarding",
        "/instructeur/documenten",
        "/instructeur/voertuigen",
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
        {
          href: "/instructeur/profiel",
          label: "Gegevens",
          description: "Profiel, werkgebied en presentatie.",
        },
        {
          href: "/instructeurs",
          label: "Openbare gids",
          description: "Hoe leerlingen je vinden.",
        },
        {
          href: "/instructeur/reviews",
          label: "Reviews",
          description: "Reacties en reputatie.",
        },
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
        {
          href: "/instructeur/leerlingen",
          label: "Leerlingenbeheer",
          description: "Pakketten, voortgang en opvolging.",
        },
      ],
    },
    {
      id: "finance",
      label: "Financiën",
      routes: ["/instructeur/inkomsten", "/instructeur/pakketten"],
      tabs: [
        {
          href: "/instructeur/inkomsten",
          label: "Inkomsten",
          description: "Omzet, facturen en betalingen.",
        },
        {
          href: "/instructeur/pakketten",
          label: "Pakketten",
          description: "Aanbod en lesbundels.",
        },
      ],
    },
  ],
  admin: [
    {
      id: "control",
      label: "Controlekamer",
      routes: ["/admin/dashboard", "/admin/audit", "/admin/instellingen"],
      tabs: [
        {
          href: "/admin/dashboard",
          label: "Dashboard",
          description: "Wat vraagt platformbreed aandacht?",
        },
        {
          href: "/admin/audit",
          label: "Audit",
          description: "Wie deed wat en wanneer?",
        },
        {
          href: "/admin/instellingen",
          label: "Instellingen",
          description: "Globale beheerinstellingen.",
        },
      ],
    },
    {
      id: "users",
      label: "Gebruikers",
      routes: ["/admin/gebruikers", "/admin/instructeurs", "/admin/leerlingen"],
      tabs: [
        {
          href: "/admin/gebruikers",
          label: "Alle gebruikers",
          description: "Accounts en rollen.",
        },
        {
          href: "/admin/instructeurs",
          label: "Instructeurs",
          description: "Goedkeuring en profielkwaliteit.",
        },
        {
          href: "/admin/leerlingen",
          label: "Leerlingen",
          description: "Pakketten, voortgang en status.",
        },
      ],
    },
    {
      id: "operations",
      label: "Operatie",
      routes: ["/admin/lessen", "/admin/pakketten", "/admin/betalingen"],
      tabs: [
        {
          href: "/admin/lessen",
          label: "Lessen",
          description: "Planning en status.",
        },
        {
          href: "/admin/pakketten",
          label: "Pakketten",
          description: "Aanbod en koppelingen.",
        },
        {
          href: "/admin/betalingen",
          label: "Betalingen",
          description: "Transacties en open posten.",
        },
      ],
    },
    {
      id: "quality",
      label: "Kwaliteit",
      routes: ["/admin/reviews", "/admin/support"],
      tabs: [
        {
          href: "/admin/reviews",
          label: "Reviews",
          description: "Moderatie en reputatie.",
        },
        {
          href: "/admin/support",
          label: "Support",
          description: "Tickets en opvolging.",
        },
      ],
    },
  ],
};

function isRouteActive(pathname: string, href: string) {
  return pathname === href;
}

export function DashboardModuleTabs({ role }: { role: GebruikersRol }) {
  const pathname = usePathname();
  const router = useRouter();
  const isUrban = role !== "admin";
  const group = moduleGroupsByRole[role].find((item) =>
    item.routes.includes(pathname),
  );

  if (!group) {
    return null;
  }

  const activeTab = group.tabs.find((tab) => isRouteActive(pathname, tab.href));

  return (
    <section
      className={cn(
        "rounded-xl border px-3 py-2.5 shadow-[0_20px_60px_-54px_rgba(0,0,0,0.95)] 2xl:px-4",
        isUrban
          ? "border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.065),rgba(15,23,42,0.36))] text-white"
          : "border-slate-200 bg-white/86 text-slate-950 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.055] dark:text-white",
      )}
    >
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p
            className={cn(
              "text-[10px] font-semibold tracking-[0.22em] uppercase",
              isUrban ? "text-slate-400" : "text-primary dark:text-sky-300",
            )}
          >
            Module
          </p>
          <h2
            className={cn(
              "mt-0.5 text-base font-semibold",
              isUrban ? "text-white" : "text-slate-950 dark:text-white",
            )}
          >
            {group.label}
          </h2>
          {activeTab?.description ? (
            <p
              className={cn(
                "mt-0.5 text-[13px]",
                isUrban ? "text-slate-400" : "text-muted-foreground",
              )}
            >
              {activeTab.description}
            </p>
          ) : null}
        </div>
        <nav
          aria-label={`${group.label} tabs`}
          className="flex min-w-0 gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  "inline-flex h-9 shrink-0 items-center rounded-lg border px-3 text-sm font-semibold transition-colors 2xl:px-4",
                  active
                    ? isUrban
                      ? "border-sky-300/30 bg-white text-slate-950 shadow-[0_14px_34px_-24px_rgba(226,232,240,0.7)]"
                      : "border-slate-950 bg-slate-950 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-950"
                    : isUrban
                      ? "border-white/10 bg-white/7 text-slate-200 hover:bg-white/12 hover:text-white"
                      : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-white/10 dark:bg-white/8 dark:text-slate-200 dark:hover:bg-white/12",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
