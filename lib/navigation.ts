import type { GebruikersRol } from "@/lib/types";

export const publicNavigation = [
  { href: "/", label: "Home" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/pakketten", label: "Pakketten" },
  { href: "/instructeurs", label: "Instructeurs" },
  { href: "/contact", label: "Contact" },
];

export const dashboardNavigation: Record<
  GebruikersRol,
  Array<{ href: string; label: string }>
> = {
  leerling: [
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
    { href: "/instructeur/profiel", label: "Profiel" },
    { href: "/instructeur/pakketten", label: "Pakketten" },
    { href: "/instructeurs", label: "Openbare gids" },
    { href: "/instructeur/beschikbaarheid", label: "Beschikbaarheid" },
    { href: "/instructeur/aanvragen", label: "Aanvragen" },
    { href: "/instructeur/leerlingen", label: "Leerlingen" },
    { href: "/instructeur/lessen", label: "Lessen" },
    { href: "/instructeur/berichten", label: "Berichten" },
    { href: "/instructeur/inkomsten", label: "Inkomsten" },
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
