import "server-only";

export type SeoCityVariant =
  | "general"
  | "automaat"
  | "schakel"
  | "motor"
  | "vrachtwagen";

export type SeoCityConfig = {
  slug: string;
  name: string;
  provinceLabel: string;
  intro: string;
  seoTitle: string;
  seoDescription: string;
  automaatIntro: string;
  automaatSeoTitle: string;
  automaatSeoDescription: string;
  highlightLines: string[];
  faqTitle: string;
  faqAnswer: string;
};

type SeoCityVariantContent = {
  seoTitle: string;
  seoDescription: string;
  pageTitle: string;
  pageIntro: string;
  pagePath: string;
  pageLabel: string;
  collectionLabel: string;
  metricPackageLabel: string;
  metricPackageDetail: string;
  listTitle: string;
  listDescription: string;
  faqQuestion: string;
  faqAnswer: string;
  emptyState: string;
};

export const seoCityVariants: SeoCityVariant[] = [
  "general",
  "automaat",
  "schakel",
  "motor",
  "vrachtwagen",
];

export const seoCityConfigs: SeoCityConfig[] = [
  {
    slug: "amsterdam",
    name: "Amsterdam",
    provinceLabel: "Noord-Holland",
    intro:
      "Vind rijinstructeurs in Amsterdam met focus op stadsverkeer, examenroutes, automaat of schakel en een rustige opbouw naar zelfstandig rijden.",
    seoTitle: "Rijschool Amsterdam | Vind rijinstructeurs en rijlespakketten",
    seoDescription:
      "Bekijk rijinstructeurs en rijlespakketten in Amsterdam. Vergelijk prijs, reviews, automaat of schakel en plan direct je volgende stap richting je rijbewijs.",
    automaatIntro:
      "Zoek automaat rijles in Amsterdam met instructeurs die rustig begeleiden in stadsverkeer, drukke kruispunten en examenroutes.",
    automaatSeoTitle:
      "Automaat rijles Amsterdam | Automaat instructeurs en rijschool",
    automaatSeoDescription:
      "Vind automaat rijles in Amsterdam. Vergelijk instructeurs, reviews en lespakketten voor leerlingen die automaat willen rijden in de stad.",
    highlightLines: [
      "Ideaal voor druk stadsverkeer en examenroutes",
      "Vergelijk automaat en schakel in Amsterdam",
      "Sterke profielen met reviews en pakketkeuze",
    ],
    faqTitle: "Waarom een aparte rijschoolpagina voor Amsterdam?",
    faqAnswer:
      "Omdat leerlingen vaak specifiek zoeken op stad. Hier zie je direct instructeurs die actief zijn in Amsterdam, zonder ruis van andere regio's.",
  },
  {
    slug: "rotterdam",
    name: "Rotterdam",
    provinceLabel: "Zuid-Holland",
    intro:
      "Zoek rijinstructeurs in Rotterdam met duidelijke pakketten, heldere reviews en begeleiding die past bij druk verkeer, ringroutes en examenmomenten.",
    seoTitle: "Rijschool Rotterdam | Rijinstructeurs, reviews en pakketten",
    seoDescription:
      "Vind een rijschool in Rotterdam met instructeurs in jouw regio. Vergelijk prijs per les, reviews en pakketten voor automaat of schakel.",
    automaatIntro:
      "Ontdek automaat rijles in Rotterdam met instructeurs die passen bij druk stadsverkeer, ringroutes en een rustige rijopbouw.",
    automaatSeoTitle:
      "Automaat rijles Rotterdam | Instructeurs en automaat pakketten",
    automaatSeoDescription:
      "Vind automaat rijles in Rotterdam. Vergelijk instructeurs, reviews en automaat pakketten voor een duidelijke en rustige route naar je rijbewijs.",
    highlightLines: [
      "Geschikt voor drukke stadsroutes en ringverkeer",
      "Pakketten en proeflessen direct zichtbaar",
      "Meer vertrouwen door echte reviews van leerlingen",
    ],
    faqTitle: "Wat zie je op de rijschoolpagina voor Rotterdam?",
    faqAnswer:
      "Alleen instructeurs die lesgeven in Rotterdam of omliggende deelgebieden binnen hun werkgebied. Daardoor sluit het aanbod direct beter aan op lokale zoekintentie.",
  },
  {
    slug: "den-haag",
    name: "Den Haag",
    provinceLabel: "Zuid-Holland",
    intro:
      "Ontdek rijinstructeurs in Den Haag voor automaat, schakel, examentraining en rustige begeleiding in stadsverkeer en omliggende examenroutes.",
    seoTitle: "Rijschool Den Haag | Rijinstructeurs in jouw regio",
    seoDescription:
      "Bekijk rijinstructeurs en pakketten in Den Haag. Vergelijk reviews, lesprijzen en aanbod voor automaat of schakel in een overzicht.",
    automaatIntro:
      "Vind automaat rijles in Den Haag met instructeurs die helpen bij stadsverkeer, examenroutes en ontspannen lesopbouw.",
    automaatSeoTitle:
      "Automaat rijles Den Haag | Automaat instructeurs vergelijken",
    automaatSeoDescription:
      "Bekijk automaat rijles in Den Haag. Vergelijk rijinstructeurs, reviews en automaat pakketten in een overzichtelijke lokale pagina.",
    highlightLines: [
      "Lokale focus op Den Haag en omliggende examenroutes",
      "Automaat en schakel overzichtelijk naast elkaar",
      "Sneller kiezen met reviews en pakketstructuur",
    ],
    faqTitle: "Voor wie is deze Den Haag pagina handig?",
    faqAnswer:
      "Voor leerlingen die gericht zoeken naar een rijschool in Den Haag en meteen lokale instructeurs, reviews en pakketten willen vergelijken.",
  },
  {
    slug: "utrecht",
    name: "Utrecht",
    provinceLabel: "Utrecht",
    intro:
      "Bekijk rijinstructeurs in Utrecht met premium profielinformatie, pakketten, reviews en een duidelijke keuze tussen lesstijl, prijs en voertuigtype.",
    seoTitle:
      "Rijschool Utrecht | Vergelijk rijlespakketten en instructeurs",
    seoDescription:
      "Zoek een rijschool in Utrecht met instructeurs die passen bij jouw regio, budget en manier van leren. Bekijk pakketten, beoordelingen en profielinformatie.",
    automaatIntro:
      "Zoek automaat rijles in Utrecht met instructeurs die rust, overzicht en lokale routekennis combineren.",
    automaatSeoTitle:
      "Automaat rijles Utrecht | Automaat rijschool en instructeurs",
    automaatSeoDescription:
      "Vind automaat rijles in Utrecht. Vergelijk lokale instructeurs, reviews en automaat pakketten voor een rustiger leertraject.",
    highlightLines: [
      "Lokaal aanbod voor Utrecht en omliggende wijken",
      "Premium profielkaarten met social proof",
      "Duidelijke vergelijking op prijs en lesstijl",
    ],
    faqTitle: "Wat maakt de Utrecht stadspagina waardevol?",
    faqAnswer:
      "Je ziet alleen relevant lokaal aanbod voor Utrecht, waardoor de pagina beter aansluit op hoe mensen zoeken en sneller vertrouwen opbouwt.",
  },
  {
    slug: "eindhoven",
    name: "Eindhoven",
    provinceLabel: "Noord-Brabant",
    intro:
      "Vind rijinstructeurs in Eindhoven met heldere pakketten, reviews en begeleiding voor stadsverkeer, ringroutes en examenopbouw.",
    seoTitle: "Rijschool Eindhoven | Rijinstructeurs en lokale pakketten",
    seoDescription:
      "Zoek een rijschool in Eindhoven met lokale instructeurs, reviews en rijlespakketten voor automaat of schakel.",
    automaatIntro:
      "Bekijk automaat rijles in Eindhoven met instructeurs die een rustige en duidelijke lesopbouw bieden.",
    automaatSeoTitle:
      "Automaat rijles Eindhoven | Lokale instructeurs en pakketten",
    automaatSeoDescription:
      "Vind automaat rijles in Eindhoven. Vergelijk lokale instructeurs, reviews en automaat rijlespakketten.",
    highlightLines: [
      "Lokale focus op Eindhoven en omliggende wijken",
      "Duidelijke profielvergelijking op prijs en stijl",
      "Automaat en schakel overzichtelijk zichtbaar",
    ],
    faqTitle: "Waarom werkt een stadspagina voor Eindhoven goed?",
    faqAnswer:
      "Bezoekers die op Eindhoven zoeken krijgen direct relevante instructeurs en pakketten te zien, wat beter converteert dan een algemene landelijke pagina.",
  },
  {
    slug: "groningen",
    name: "Groningen",
    provinceLabel: "Groningen",
    intro:
      "Bekijk rijinstructeurs in Groningen met een duidelijke vergelijking op reviewscore, lesprijs en regio.",
    seoTitle: "Rijschool Groningen | Vergelijk lokale rijinstructeurs",
    seoDescription:
      "Vind een rijschool in Groningen met lokale instructeurs, reviews en pakketten voor automaat of schakel.",
    automaatIntro:
      "Zoek automaat rijles in Groningen met instructeurs die duidelijk, rustig en lokaal gericht lesgeven.",
    automaatSeoTitle:
      "Automaat rijles Groningen | Automaat instructeurs vergelijken",
    automaatSeoDescription:
      "Vind automaat rijles in Groningen en vergelijk instructeurs, reviews en pakketten voor een ontspannen leertraject.",
    highlightLines: [
      "Sterke lokale vergelijking voor Groningen",
      "Reviews en pakketten op een stadspagina",
      "Beter afgestemd op lokale zoekintentie",
    ],
    faqTitle: "Wat maakt de Groningen pagina waardevol?",
    faqAnswer:
      "Leerlingen die op Groningen zoeken willen snel zien wie daar echt actief is. Deze pagina maakt die lokale keuze veel directer.",
  },
  {
    slug: "tilburg",
    name: "Tilburg",
    provinceLabel: "Noord-Brabant",
    intro:
      "Vind rijinstructeurs in Tilburg met passende pakketten, reviews en een heldere route naar je praktijkexamen.",
    seoTitle: "Rijschool Tilburg | Lokale instructeurs en reviews",
    seoDescription:
      "Bekijk rijinstructeurs in Tilburg en vergelijk rijlespakketten, prijzen en beoordelingen voor automaat of schakel.",
    automaatIntro:
      "Bekijk automaat rijles in Tilburg met instructeurs die focussen op rust, controle en duidelijke lesstructuur.",
    automaatSeoTitle:
      "Automaat rijles Tilburg | Vergelijk automaat instructeurs",
    automaatSeoDescription:
      "Vind automaat rijles in Tilburg en vergelijk lokale instructeurs, reviews en pakketten.",
    highlightLines: [
      "Lokale focus op Tilburg en omliggende regio",
      "Duidelijke route van pakket naar instructeur",
      "Reviews als extra vertrouwen voor nieuwe leerlingen",
    ],
    faqTitle: "Waarom een aparte Tilburg rijschoolpagina?",
    faqAnswer:
      "Omdat lokale zoekopdrachten in Tilburg anders werken dan landelijke vergelijkingen. Deze pagina sluit beter aan op echte regionale intentie.",
  },
  {
    slug: "breda",
    name: "Breda",
    provinceLabel: "Noord-Brabant",
    intro:
      "Zoek rijinstructeurs in Breda met duidelijke profielen, lesprijzen en pakketten die passen bij jouw tempo en leerstijl.",
    seoTitle: "Rijschool Breda | Instructeurs, reviews en lespakketten",
    seoDescription:
      "Vind een rijschool in Breda. Vergelijk rijinstructeurs, automaat of schakel, reviews en lespakketten.",
    automaatIntro:
      "Vind automaat rijles in Breda met lokale instructeurs en pakketten voor een rustige en overzichtelijke lesopbouw.",
    automaatSeoTitle:
      "Automaat rijles Breda | Automaat rijschool vergelijken",
    automaatSeoDescription:
      "Zoek automaat rijles in Breda en vergelijk lokale instructeurs, reviews en pakketten.",
    highlightLines: [
      "Lokale instructeurs in Breda overzichtelijk gebundeld",
      "Pakketten en reviews direct zichtbaar",
      "Sterke basis voor lokale SEO en conversie",
    ],
    faqTitle: "Wat levert de Breda stadspagina op?",
    faqAnswer:
      "Een betere match tussen lokale zoekers en relevante instructeurs, waardoor bezoekers sneller vertrouwen krijgen en doorklikken.",
  },
  {
    slug: "arnhem",
    name: "Arnhem",
    provinceLabel: "Gelderland",
    intro:
      "Bekijk rijinstructeurs in Arnhem en vergelijk lokaal aanbod op prijs, lesstijl, reviews en pakketten.",
    seoTitle: "Rijschool Arnhem | Lokale instructeurs en rijlespakketten",
    seoDescription:
      "Vind een rijschool in Arnhem met lokale instructeurs, reviews en pakketten voor automaat of schakel.",
    automaatIntro:
      "Zoek automaat rijles in Arnhem met instructeurs die lokaal lesgeven en duidelijk werken naar examenmomenten toe.",
    automaatSeoTitle:
      "Automaat rijles Arnhem | Lokale automaat instructeurs",
    automaatSeoDescription:
      "Vind automaat rijles in Arnhem en vergelijk lokale instructeurs, pakketten en reviewscore.",
    highlightLines: [
      "Lokale focus op Arnhem en omgeving",
      "Duidelijke profielvergelijking voor snelle keuze",
      "Automaat-aanbod direct op stadspagina zichtbaar",
    ],
    faqTitle: "Waarom is Arnhem als SEO-pagina interessant?",
    faqAnswer:
      "Omdat veel bezoekers direct zoeken op stad. Met een lokale Arnhem pagina wordt het aanbod relevanter en sterker vindbaar.",
  },
];

export function getSeoCityConfigBySlug(slug: string) {
  return seoCityConfigs.find((city) => city.slug === slug) ?? null;
}

export function normalizeCityForSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSeoCityVariantPath(
  citySlug: string,
  variant: SeoCityVariant = "general"
) {
  switch (variant) {
    case "automaat":
      return `/automaat/${citySlug}`;
    case "schakel":
      return `/schakel/${citySlug}`;
    case "motor":
      return `/motor/${citySlug}`;
    case "vrachtwagen":
      return `/vrachtwagen/${citySlug}`;
    case "general":
    default:
      return `/rijschool/${citySlug}`;
  }
}

export function getSeoCityVariantCollectionLabel(variant: SeoCityVariant) {
  switch (variant) {
    case "automaat":
      return "Automaat rijles";
    case "schakel":
      return "Schakel rijles";
    case "motor":
      return "Motorrijles";
    case "vrachtwagen":
      return "Vrachtwagenrijles";
    case "general":
    default:
      return "Rijschool";
  }
}

export function getSeoCityVariantLabel(
  cityName: string,
  variant: SeoCityVariant = "general"
) {
  switch (variant) {
    case "automaat":
      return `Automaat ${cityName}`;
    case "schakel":
      return `Schakel ${cityName}`;
    case "motor":
      return `Motor ${cityName}`;
    case "vrachtwagen":
      return `Vrachtwagen ${cityName}`;
    case "general":
    default:
      return `Rijschool ${cityName}`;
  }
}

export function getSeoCityVariantContent(
  city: SeoCityConfig,
  variant: SeoCityVariant = "general"
): SeoCityVariantContent {
  switch (variant) {
    case "automaat":
      return {
        seoTitle: city.automaatSeoTitle,
        seoDescription: city.automaatSeoDescription,
        pageTitle: `Automaat rijles ${city.name} met lokale instructeurs en duidelijke pakketten.`,
        pageIntro: city.automaatIntro,
        pagePath: getSeoCityVariantPath(city.slug, variant),
        pageLabel: getSeoCityVariantLabel(city.name, variant),
        collectionLabel: getSeoCityVariantCollectionLabel(variant),
        metricPackageLabel: "Automaat pakketten",
        metricPackageDetail: "Automaat-aanbod in deze regio",
        listTitle: `Vergelijk automaat instructeurs in ${city.name} op reviews, prijs en lesstijl.`,
        listDescription: `Deze lokale automaat-pagina laat alleen instructeurs zien die automaat of beide transmissies aanbieden in ${city.name}.`,
        faqQuestion: `Waarom een aparte automaat rijles pagina voor ${city.name}?`,
        faqAnswer: `Bezoekers zoeken vaak heel specifiek op automaat rijles in ${city.name}. Door automaat-instructeurs en lokale profielen apart te bundelen, sluit de pagina beter aan op die koopgerichte zoekintentie.`,
        emptyState: `Er staan nu nog geen automaat-instructeurs live voor ${city.name}. Zodra instructeurs automaat en deze regio toevoegen aan hun profiel, verschijnen ze hier automatisch.`,
      };
    case "schakel":
      return {
        seoTitle: `Schakel rijles ${city.name} | Handgeschakelde instructeurs en pakketten`,
        seoDescription: `Vind schakel rijles in ${city.name}. Vergelijk handgeschakelde instructeurs, reviews en pakketten voor leerlingen die gericht willen leren schakelen.`,
        pageTitle: `Schakel rijles ${city.name} met handgeschakelde instructeurs en duidelijke pakketten.`,
        pageIntro: `Vind schakel rijles in ${city.name} met instructeurs die gericht begeleiden op koppelen, schakelen, hellingproef, stadsverkeer en examenroutes.`,
        pagePath: getSeoCityVariantPath(city.slug, variant),
        pageLabel: getSeoCityVariantLabel(city.name, variant),
        collectionLabel: getSeoCityVariantCollectionLabel(variant),
        metricPackageLabel: "Schakel pakketten",
        metricPackageDetail: "Handgeschakeld aanbod in deze regio",
        listTitle: `Vergelijk schakel-instructeurs in ${city.name} op lesstijl, prijs en reviews.`,
        listDescription: `Deze lokale schakelpagina toont alleen instructeurs die handgeschakeld of beide transmissies aanbieden in ${city.name}.`,
        faqQuestion: `Waarom een aparte schakel rijles pagina voor ${city.name}?`,
        faqAnswer: `Veel leerlingen zoeken heel bewust op schakel rijles in ${city.name} om later in elke auto te kunnen rijden. Deze pagina bundelt alleen het relevante aanbod daarvoor.`,
        emptyState: `Er staan nu nog geen schakel-instructeurs live voor ${city.name}. Zodra instructeurs handgeschakeld of beide transmissies actief hebben in deze regio, verschijnen ze hier automatisch.`,
      };
    case "motor":
      return {
        seoTitle: `Motorrijles ${city.name} | Motorinstructeurs, AVB en AVD pakketten`,
        seoDescription: `Vind motorrijles in ${city.name}. Vergelijk motorinstructeurs, AVB- en AVD-trajecten, reviews en pakketten op een lokale SEO-pagina.`,
        pageTitle: `Motorrijles ${city.name} met instructeurs voor AVB, AVD en complete trajecten.`,
        pageIntro: `Ontdek motorrijles in ${city.name} met instructeurs die helpen bij voertuigbeheersing, verkeersdeelname en een rustige route naar AVB en AVD.`,
        pagePath: getSeoCityVariantPath(city.slug, variant),
        pageLabel: getSeoCityVariantLabel(city.name, variant),
        collectionLabel: getSeoCityVariantCollectionLabel(variant),
        metricPackageLabel: "Motor pakketten",
        metricPackageDetail: "Motor-aanbod in deze regio",
        listTitle: `Vergelijk motorinstructeurs in ${city.name} op traject, reviews en lesstijl.`,
        listDescription: `Deze lokale motorpagina toont alleen instructeurs die motorpakketten aanbieden in ${city.name}.`,
        faqQuestion: `Waarom een aparte motorrijles pagina voor ${city.name}?`,
        faqAnswer: `Mensen zoeken vaak heel gericht op motorrijles in ${city.name}. Door motorprofielen, AVB- en AVD-aanbod lokaal te bundelen, sluit de pagina beter aan op die zoekintentie.`,
        emptyState: `Er staan nu nog geen motorinstructeurs live voor ${city.name}. Zodra instructeurs motorpakketten koppelen aan deze regio, verschijnen ze hier automatisch.`,
      };
    case "vrachtwagen":
      return {
        seoTitle: `Vrachtwagen rijles ${city.name} | C-rijbewijs instructeurs en pakketten`,
        seoDescription: `Vind vrachtwagen rijles in ${city.name}. Vergelijk C-rijbewijs instructeurs, reviews en trajecten richting professioneel vervoer.`,
        pageTitle: `Vrachtwagen rijles ${city.name} met instructeurs voor C-rijbewijs en praktijktrajecten.`,
        pageIntro: `Zoek vrachtwagen rijles in ${city.name} met instructeurs die gericht werken aan voertuigbeheersing, praktijkuren en een duidelijke route naar het C-rijbewijs.`,
        pagePath: getSeoCityVariantPath(city.slug, variant),
        pageLabel: getSeoCityVariantLabel(city.name, variant),
        collectionLabel: getSeoCityVariantCollectionLabel(variant),
        metricPackageLabel: "Vrachtwagen pakketten",
        metricPackageDetail: "C-rijbewijs aanbod in deze regio",
        listTitle: `Vergelijk vrachtwageninstructeurs in ${city.name} op traject, reviews en prijsopbouw.`,
        listDescription: `Deze lokale vrachtwagenpagina toont alleen instructeurs die vrachtwagenpakketten aanbieden in ${city.name}.`,
        faqQuestion: `Waarom een aparte vrachtwagen rijles pagina voor ${city.name}?`,
        faqAnswer: `Bezoekers die zoeken op vrachtwagen rijles in ${city.name} hebben meestal een veel concretere intentie. Door dat aanbod apart te tonen, wordt kiezen sneller en duidelijker.`,
        emptyState: `Er staan nu nog geen vrachtwageninstructeurs live voor ${city.name}. Zodra instructeurs C-rijbewijs pakketten aan deze regio koppelen, verschijnen ze hier automatisch.`,
      };
    case "general":
    default:
      return {
        seoTitle: city.seoTitle,
        seoDescription: city.seoDescription,
        pageTitle: `Rijschool ${city.name} met instructeurs die echt in jouw regio rijden.`,
        pageIntro: city.intro,
        pagePath: getSeoCityVariantPath(city.slug, variant),
        pageLabel: getSeoCityVariantLabel(city.name, variant),
        collectionLabel: getSeoCityVariantCollectionLabel(variant),
        metricPackageLabel: "Pakketten",
        metricPackageDetail: "Auto-aanbod in deze regio",
        listTitle: `Vergelijk rijinstructeurs in ${city.name} op prijs, reviews en lesstijl.`,
        listDescription: `Deze stadspagina is gericht op lokale zoekintentie. Daardoor zien bezoekers direct het relevante aanbod voor ${city.name} in plaats van een generieke landelijke lijst.`,
        faqQuestion: city.faqTitle,
        faqAnswer: city.faqAnswer,
        emptyState: `Er staan nu nog geen auto-instructeurs live voor ${city.name}. Zodra instructeurs deze regio toevoegen aan hun werkgebied, verschijnen ze hier automatisch.`,
      };
  }
}

export function getSeoCityVariantMetadata(
  city: SeoCityConfig,
  variant: SeoCityVariant = "general"
) {
  const content = getSeoCityVariantContent(city, variant);

  return {
    title: content.seoTitle,
    description: content.seoDescription,
    canonicalPath: content.pagePath,
  };
}
