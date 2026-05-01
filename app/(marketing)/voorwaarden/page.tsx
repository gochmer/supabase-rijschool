import Link from "next/link";

import { SeoBreadcrumbs } from "@/components/marketing/seo-breadcrumbs";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";

const termsSections = [
  {
    title: "Gebruik van het platform",
    text: "RijBasis biedt software voor rijschoolprocessen zoals registratie, planning, aanvragen, communicatie en beheer. Gebruikers zijn zelf verantwoordelijk voor correcte gegevens en zorgvuldig gebruik van hun account.",
  },
  {
    title: "Accounts en rollen",
    text: "Leerlingen, instructeurs en admins krijgen toegang tot functies die passen bij hun rol. Instructeurs kunnen pas volledig gebruikmaken van hun dashboard nadat hun profiel of verificatie is goedgekeurd.",
  },
  {
    title: "Boekingen en aanvragen",
    text: "Lesaanvragen, proeflessen en boekingen worden binnen het platform vastgelegd. Beschikbaarheid, acceptatie en eventuele wijzigingen kunnen afhankelijk zijn van de instellingen van de instructeur of rijschool.",
  },
  {
    title: "Betalingen en pakketten",
    text: "Pakketprijzen, lesprijzen en betaalstatussen worden getoond zoals ze in het platform zijn ingesteld. Definitieve afspraken kunnen per rijschool of instructeur verschillen.",
  },
  {
    title: "Wijzigingen",
    text: "RijBasis kan functies, teksten en voorwaarden aanpassen wanneer dat nodig is voor veiligheid, kwaliteit of doorontwikkeling van het platform.",
  },
];

export default function VoorwaardenPage() {
  return (
    <div className="pb-20">
      <section className="site-shell mx-auto w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl space-y-8">
          <SeoBreadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Algemene voorwaarden", href: "/voorwaarden" },
            ]}
          />
          <SectionHeading
            eyebrow="Juridisch"
            title="Algemene voorwaarden"
            description="Deze voorwaarden beschrijven hoe RijBasis gebruikt kan worden door leerlingen, instructeurs, rijscholen en beheerders."
          />
          <div className="rounded-[1.75rem] border border-white/70 bg-white/86 p-6 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/6 sm:p-8">
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              Laatst bijgewerkt: 1 mei 2026. Deze pagina is bedoeld als heldere
              basis voor het gebruik van het platform. Voor specifieke
              afspraken met een rijschool of instructeur kunnen aanvullende
              voorwaarden gelden.
            </p>
            <div className="mt-8 space-y-7">
              {termsSections.map((section) => (
                <section key={section.title} className="space-y-2">
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                    {section.title}
                  </h2>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {section.text}
                  </p>
                </section>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact">Vraag stellen</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/privacy">Privacyverklaring bekijken</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
