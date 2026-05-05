import type { GebruikersRol } from "@/lib/types";

export type DashboardNavigationItem = {
  href: string;
  label: string;
  activeHrefs?: string[];
};

export const publicNavigation = [
  { href: "/", label: "Home" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/pakketten", label: "Pakketten" },
  { href: "/instructeurs", label: "Instructeurs" },
  { href: "/contact", label: "Contact" },
];

export const dashboardNavigation: Record<
  GebruikersRol,
  DashboardNavigationItem[]
> = {
  leerling: [
    { href: "/leerling/dashboard", label: "Dashboard" },
    {
      href: "/leerling/voortgang",
      label: "Leertraject",
      activeHrefs: ["/leerling/boekingen", "/leerling/lesmateriaal"],
    },
    { href: "/leerling/instructeurs", label: "Instructeurs" },
    { href: "/leerling/betalingen", label: "Betalingen" },
    {
      href: "/leerling/berichten",
      label: "Berichten",
      activeHrefs: ["/leerling/notificaties", "/leerling/support"],
    },
    {
      href: "/leerling/profiel",
      label: "Profiel",
      activeHrefs: [
        "/leerling/documenten",
        "/leerling/reviews",
        "/leerling/instellingen",
      ],
    },
  ],
  instructeur: [
    {
      href: "/instructeur/regie",
      label: "Regie",
      activeHrefs: [
        "/instructeur/onboarding",
        "/instructeur/documenten",
        "/instructeur/voertuigen",
      ],
    },
    { href: "/instructeur/dashboard", label: "Dashboard" },
    {
      href: "/instructeur/profiel",
      label: "Profiel",
      activeHrefs: ["/instructeur/reviews"],
    },
    {
      href: "/instructeur/lessen",
      label: "Agenda",
      activeHrefs: ["/instructeur/beschikbaarheid", "/instructeur/aanvragen"],
    },
    { href: "/instructeur/leerlingen", label: "Leerlingen" },
    { href: "/instructeur/berichten", label: "Berichten" },
    {
      href: "/instructeur/inkomsten",
      label: "Financiën",
      activeHrefs: ["/instructeur/pakketten"],
    },
    { href: "/instructeur/instellingen", label: "Instellingen" },
  ],
  admin: [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      activeHrefs: ["/admin/audit", "/admin/instellingen"],
    },
    {
      href: "/admin/gebruikers",
      label: "Gebruikers",
      activeHrefs: ["/admin/instructeurs", "/admin/leerlingen"],
    },
    {
      href: "/admin/lessen",
      label: "Operatie",
      activeHrefs: ["/admin/pakketten", "/admin/betalingen"],
    },
    {
      href: "/admin/reviews",
      label: "Kwaliteit",
      activeHrefs: ["/admin/support"],
    },
  ],
};

export function isDashboardNavigationItemActive(
  pathname: string,
  item: DashboardNavigationItem,
) {
  return pathname === item.href || Boolean(item.activeHrefs?.includes(pathname));
}
