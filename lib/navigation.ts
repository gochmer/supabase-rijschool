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
    { href: "/leerling/profiel", label: "Profiel" },
    { href: "/leerling/instructeurs", label: "Instructeurs" },
    { href: "/leerling/boekingen", label: "Boekingen" },
    { href: "/leerling/betalingen", label: "Betalingen" },
    { href: "/leerling/berichten", label: "Berichten" },
    { href: "/leerling/reviews", label: "Reviews" },
    { href: "/leerling/instellingen", label: "Instellingen" },
  ],
  instructeur: [
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
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/gebruikers", label: "Gebruikers" },
    { href: "/admin/instructeurs", label: "Instructeurs" },
    { href: "/admin/leerlingen", label: "Leerlingen" },
    { href: "/admin/lessen", label: "Lessen" },
    { href: "/admin/betalingen", label: "Betalingen" },
    { href: "/admin/pakketten", label: "Pakketten" },
    { href: "/admin/reviews", label: "Reviews" },
    { href: "/admin/support", label: "Support" },
    { href: "/admin/instellingen", label: "Instellingen" },
  ],
};

export function isDashboardNavigationItemActive(
  pathname: string,
  item: DashboardNavigationItem,
) {
  return pathname === item.href || Boolean(item.activeHrefs?.includes(pathname));
}
