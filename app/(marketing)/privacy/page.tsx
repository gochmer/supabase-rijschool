import Link from "next/link";

import { SeoBreadcrumbs } from "@/components/marketing/seo-breadcrumbs";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";

const privacySections = [
  {
    title: "Welke gegevens we gebruiken",
    text: "RijBasis verwerkt gegevens zoals naam, e-mailadres, telefoonnummer, rol, profielinformatie, lesaanvragen, boekingen, berichten en verificatiegegevens wanneer die nodig zijn voor de werking van het platform.",
  },
  {
    title: "Waarom we gegevens gebruiken",
    text: "We gebruiken gegevens om accounts te beveiligen, rollen te herkennen, lessen en aanvragen te tonen, communicatie mogelijk te maken, instructeurs te verifieren en support of beheer goed uit te voeren.",
  },
  {
    title: "Delen van gegevens",
    text: "Gegevens worden alleen gedeeld binnen de functies van het platform, bijvoorbeeld tussen leerling en instructeur bij een aanvraag of boeking. Beheerders kunnen gegevens bekijken voor support, veiligheid en kwaliteitscontrole.",
  },
  {
    title: "Bewaren en beveiligen",
    text: "We bewaren gegevens niet langer dan nodig voor het doel waarvoor ze zijn verzameld. Toegang tot gevoelige onderdelen wordt beperkt met rollen, sessies en databasebeveiliging.",
  },
  {
    title: "Jouw keuzes",
    text: "Je kunt contact opnemen voor vragen over je gegevens, correcties of verwijderverzoeken. Sommige gegevens kunnen nodig blijven voor administratie, veiligheid of bestaande afspraken.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="pb-20">
      <section className="site-shell mx-auto w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl space-y-8">
          <SeoBreadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Privacyverklaring", href: "/privacy" },
            ]}
          />
          <SectionHeading
            eyebrow="Privacy"
            title="Privacyverklaring"
            description="Hier lees je welke gegevens RijBasis gebruikt en waarom die nodig zijn voor een veilige en duidelijke rijschoolervaring."
          />
          <div className="rounded-[1.75rem] border border-white/70 bg-white/86 p-6 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/6 sm:p-8">
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              Laatst bijgewerkt: 1 mei 2026. We verwerken gegevens zorgvuldig
              en alleen voor functies die nodig zijn voor registratie,
              planning, communicatie, verificatie, support en beheer.
            </p>
            <div className="mt-8 space-y-7">
              {privacySections.map((section) => (
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
                <Link href="/contact">Privacyvraag stellen</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/voorwaarden">Algemene voorwaarden bekijken</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
