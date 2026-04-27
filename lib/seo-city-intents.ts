import "server-only";

import type { InstructeurProfiel, Pakket } from "@/lib/types";
import type { SeoCityConfig } from "@/lib/seo-cities";

export type SeoCityIntent =
  | "spoedcursus"
  | "proefles"
  | "examengericht"
  | "faalangst"
  | "opfriscursus"
  | "praktijkexamen";

type SeoCityIntentConfig = {
  slug: SeoCityIntent;
  label: string;
  routeBase: `/${SeoCityIntent}`;
  searchLabel: string;
  seoTitle: (city: SeoCityConfig) => string;
  seoDescription: (city: SeoCityConfig) => string;
  heroTitle: (city: SeoCityConfig) => string;
  heroIntro: (city: SeoCityConfig) => string;
  faqQuestion: (city: SeoCityConfig) => string;
  faqAnswer: (city: SeoCityConfig) => string;
  badges: string[];
  emptyState: (city: SeoCityConfig) => string;
};

type SeoCityIntentMatchResult = {
  instructors: InstructeurProfiel[];
  fallbackUsed: boolean;
  exactMatchCount: number;
};

const intentKeywordMap: Record<SeoCityIntent, string[]> = {
  spoedcursus: ["spoed", "snel", "versnelling", "intensief", "opfris"],
  proefles: ["proefles", "intake", "kennismaking", "eerste les"],
  examengericht: [
    "examen",
    "praktijk-examen",
    "praktijkexamen",
    "examengericht",
    "examentraining",
    "faalangst",
    "opfris",
  ],
  faalangst: ["faalangst", "rustig", "vertrouwen", "spanning", "examen"],
  opfriscursus: ["opfris", "opfriscursus", "herstart", "zekerheid", "terug"],
  praktijkexamen: [
    "praktijk-examen",
    "praktijkexamen",
    "examen",
    "examengericht",
    "examentraining",
  ],
};

export const seoCityIntentConfigs: SeoCityIntentConfig[] = [
  {
    slug: "spoedcursus",
    label: "Spoedcursus",
    routeBase: "/spoedcursus",
    searchLabel: "spoedcursus",
    seoTitle: (city) =>
      `Spoedcursus rijles ${city.name} | Snel traject en instructeurs vergelijken`,
    seoDescription: (city) =>
      `Vind een spoedcursus rijles in ${city.name}. Vergelijk instructeurs, reviews en pakketten voor een sneller traject richting je praktijkexamen.`,
    heroTitle: (city) =>
      `Spoedcursus rijles ${city.name} met instructeurs voor snelle trajecten.`,
    heroIntro: (city) =>
      `Zoek in ${city.name} naar instructeurs en pakketten die passen bij een sneller traject, intensievere lesopbouw en een duidelijke route naar je praktijkexamen.`,
    faqQuestion: (city) =>
      `Waarom een aparte spoedcursus rijles pagina voor ${city.name}?`,
    faqAnswer: (city) =>
      `Omdat bezoekers die zoeken op spoedcursus rijles in ${city.name} vaak al verder in hun keuzeproces zijn. Een lokale pagina met snelle trajecten, reviews en relevante instructeurs sluit beter aan op die koopintentie.`,
    badges: [
      "Snelle trajecten en intensievere planning",
      "Vergelijk instructeurs met examenfocus",
      "Lokale SEO-pagina voor warme zoekintentie",
    ],
    emptyState: (city) =>
      `Er staan nu nog geen uitgesproken spoedcursus-profielen live voor ${city.name}. Daarom tonen we voorlopig het bredere lokale auto-aanbod, zodat bezoekers wel kunnen doorstromen.`,
  },
  {
    slug: "proefles",
    label: "Proefles",
    routeBase: "/proefles",
    searchLabel: "proefles",
    seoTitle: (city) =>
      `Proefles rijschool ${city.name} | Plan een eerste rijles met lokale instructeurs`,
    seoDescription: (city) =>
      `Vind een proefles rijschool in ${city.name}. Vergelijk lokale instructeurs, reviews en plan je eerste proefles of kennismakingsles.`,
    heroTitle: (city) =>
      `Proefles in ${city.name} met instructeurs die direct vertrouwen geven.`,
    heroIntro: (city) =>
      `Vergelijk in ${city.name} lokale instructeurs voor een eerste proefles, intake of kennismakingsmoment en ontdek welke lesstijl het best bij je past.`,
    faqQuestion: (city) =>
      `Waarom een aparte proefles pagina voor ${city.name}?`,
    faqAnswer: (city) =>
      `Veel nieuwe leerlingen zoeken eerst heel concreet op een proefles in ${city.name}. Een aparte lokale pagina helpt om sneller vertrouwen te krijgen en direct de juiste instructeur te kiezen.`,
    badges: [
      "Eerste les of kennismaking lokaal vergelijken",
      "Drempel laag, intentie hoog",
      "Direct door naar proefles of pakket",
    ],
    emptyState: (city) =>
      `Er zijn momenteel geen aparte proefles-profielen uitgelicht voor ${city.name}, maar alle lokale instructeurs hieronder kunnen wel als eerste stap worden vergeleken.`,
  },
  {
    slug: "examengericht",
    label: "Examengericht",
    routeBase: "/examengericht",
    searchLabel: "examengericht",
    seoTitle: (city) =>
      `Examengerichte rijles ${city.name} | Examentraining en lokale instructeurs`,
    seoDescription: (city) =>
      `Zoek examengerichte rijles in ${city.name}. Vergelijk instructeurs, reviews en pakketten voor examentraining, opfrislessen en praktijkexamenfocus.`,
    heroTitle: (city) =>
      `Examengerichte rijles ${city.name} voor leerlingen die dichter op het praktijkexamen zitten.`,
    heroIntro: (city) =>
      `Bekijk in ${city.name} instructeurs en pakketten met focus op examentraining, opfrissen, faalangstbegeleiding en een strakke route richting het praktijkexamen.`,
    faqQuestion: (city) =>
      `Waarom werkt een examengerichte pagina voor ${city.name} goed?`,
    faqAnswer: (city) =>
      `Bezoekers die zoeken op examengerichte rijles in ${city.name} willen meestal direct weten welke instructeurs ervaring hebben met examentraining en opfrissen. Zo'n lokale pagina sluit dus heel gericht aan op hun intentie.`,
    badges: [
      "Examentraining en opfrisfocus",
      "Sterker voor leerlingen vlak voor examen",
      "Reviews en pakketten direct lokaal vergeleken",
    ],
    emptyState: (city) =>
      `Er staan nu nog geen uitgesproken examengerichte profielen live voor ${city.name}. Daarom laten we voorlopig het bredere lokale aanbod zien, zodat de route wel bruikbaar blijft.`,
  },
  {
    slug: "faalangst",
    label: "Faalangst rijles",
    routeBase: "/faalangst",
    searchLabel: "faalangst rijles",
    seoTitle: (city) =>
      `Faalangst rijles ${city.name} | Rustige instructeurs en examenbegeleiding`,
    seoDescription: (city) =>
      `Vind faalangst rijles in ${city.name}. Vergelijk instructeurs, reviews en pakketten voor leerlingen die meer rust, structuur en vertrouwen zoeken.`,
    heroTitle: (city) =>
      `Faalangst rijles ${city.name} met instructeurs die rust en vertrouwen centraal zetten.`,
    heroIntro: (city) =>
      `Zoek in ${city.name} naar instructeurs die helpen bij spanning, onzekerheid en examendruk met een rustigere opbouw en duidelijke begeleiding.`,
    faqQuestion: (city) =>
      `Waarom een aparte faalangst rijles pagina voor ${city.name}?`,
    faqAnswer: (city) =>
      `Leerlingen die zoeken op faalangst rijles in ${city.name} hebben vaak een specifieke hulpvraag. Door dat aanbod apart te tonen, voelt de pagina relevanter en veiliger om op door te klikken.`,
    badges: [
      "Rustige lesopbouw en meer vertrouwen",
      "Sterk voor spanning rond praktijkexamen",
      "Zoekintentie met hoge relevantie en conversiekans",
    ],
    emptyState: (city) =>
      `Er staan nu nog geen expliciet gemarkeerde faalangst-profielen live voor ${city.name}. Daarom tonen we voorlopig het bredere lokale aanbod dat mogelijk toch passend is.`,
  },
  {
    slug: "opfriscursus",
    label: "Opfriscursus",
    routeBase: "/opfriscursus",
    searchLabel: "opfriscursus rijles",
    seoTitle: (city) =>
      `Opfriscursus rijles ${city.name} | Opfrislessen en lokale instructeurs`,
    seoDescription: (city) =>
      `Vind een opfriscursus rijles in ${city.name}. Vergelijk instructeurs, reviews en pakketten voor herstart, extra zekerheid of terugkeer op de weg.`,
    heroTitle: (city) =>
      `Opfriscursus rijles ${city.name} voor herstart, zekerheid en terug op niveau.`,
    heroIntro: (city) =>
      `Zoek in ${city.name} naar instructeurs en opfrispakketten voor wie na een pauze weer veilig, rustig en met vertrouwen wil rijden.`,
    faqQuestion: (city) =>
      `Waarom een aparte opfriscursus pagina voor ${city.name}?`,
    faqAnswer: (city) =>
      `Zoekers naar opfriscursus rijles in ${city.name} zitten vaak in een andere fase dan beginners. Een aparte pagina helpt om direct relevant aanbod en de juiste toon te tonen.`,
    badges: [
      "Sterk voor herstart en extra zekerheid",
      "Opfrislessen duidelijk lokaal gefilterd",
      "Gericht op warme zoekers met concrete behoefte",
    ],
    emptyState: (city) =>
      `Er staan nu nog geen uitgesproken opfriscursus-profielen live voor ${city.name}. Daarom laten we voorlopig het bredere lokale aanbod zien dat nog steeds relevant kan zijn.`,
  },
  {
    slug: "praktijkexamen",
    label: "Praktijkexamen focus",
    routeBase: "/praktijkexamen",
    searchLabel: "praktijkexamen rijles",
    seoTitle: (city) =>
      `Praktijkexamen rijles ${city.name} | Examenfocus en lokale instructeurs`,
    seoDescription: (city) =>
      `Vind praktijkexamen rijles in ${city.name}. Vergelijk instructeurs, reviews en pakketten voor examenfocus, laatste voorbereiding en gerichte lessen.`,
    heroTitle: (city) =>
      `Praktijkexamen rijles ${city.name} voor de laatste rechte lijn naar slagen.`,
    heroIntro: (city) =>
      `Bekijk in ${city.name} instructeurs en pakketten die passen bij de laatste voorbereiding op het praktijkexamen, met focus op routes, foutenreductie en zelfvertrouwen.`,
    faqQuestion: (city) =>
      `Waarom een aparte praktijkexamen pagina voor ${city.name}?`,
    faqAnswer: (city) =>
      `Mensen die zoeken op praktijkexamen rijles in ${city.name} zijn vaak al heel dicht bij hun examendatum. Deze pagina sluit dus aan op een sterke, directe koopintentie.`,
    badges: [
      "Laatste voorbereiding op praktijkexamen",
      "Focus op routes, fouten en zelfvertrouwen",
      "SEO-pagina voor zeer concrete examengerichte zoekers",
    ],
    emptyState: (city) =>
      `Er staan nu nog geen expliciet gemarkeerde praktijkexamen-profielen live voor ${city.name}. Daarom tonen we voorlopig het bredere lokale aanbod met examenrelevante overlap.`,
  },
];

export const seoCityIntents = seoCityIntentConfigs.map((config) => config.slug);

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function countKeywordMatches(text: string, keywords: string[]) {
  return keywords.reduce(
    (total, keyword) => total + (text.includes(keyword) ? 1 : 0),
    0
  );
}

function buildInstructorIntentScore(
  instructor: InstructeurProfiel,
  packages: Pakket[],
  intent: SeoCityIntent
) {
  const keywords = intentKeywordMap[intent];
  const normalizedBio = normalizeSearchText(instructor.bio);
  const normalizedSpecializations = instructor.specialisaties
    .map((item) => normalizeSearchText(item))
    .join(" ");
  const normalizedPackages = packages
    .flatMap((pkg) => [
      pkg.naam,
      pkg.beschrijving,
      pkg.badge ?? "",
      ...(pkg.labels ?? []),
    ])
    .map((item) => normalizeSearchText(item))
    .join(" ");

  let score = 0;

  score += countKeywordMatches(normalizedSpecializations, keywords) * 4;
  score += countKeywordMatches(normalizedPackages, keywords) * 3;
  score += countKeywordMatches(normalizedBio, keywords) * 2;

  if (intent === "proefles") {
    score += 1;
  }

  return score;
}

function sortInstructorsByIntentScore(
  left: { instructor: InstructeurProfiel; score: number },
  right: { instructor: InstructeurProfiel; score: number }
) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  if (right.instructor.beoordeling !== left.instructor.beoordeling) {
    return right.instructor.beoordeling - left.instructor.beoordeling;
  }

  if (right.instructor.aantal_reviews !== left.instructor.aantal_reviews) {
    return right.instructor.aantal_reviews - left.instructor.aantal_reviews;
  }

  return right.instructor.ervaring_jaren - left.instructor.ervaring_jaren;
}

export function getSeoCityIntentConfig(intent: SeoCityIntent) {
  return seoCityIntentConfigs.find((item) => item.slug === intent) ?? null;
}

export function getSeoCityIntentPath(
  citySlug: string,
  intent: SeoCityIntent
) {
  return `${getSeoCityIntentConfig(intent)?.routeBase ?? `/${intent}`}/${citySlug}`;
}

export function getSeoCityIntentMatches(args: {
  instructors: InstructeurProfiel[];
  packagesByInstructorId: Record<string, Pakket[]>;
  intent: SeoCityIntent;
}): SeoCityIntentMatchResult {
  const scored = args.instructors.map((instructor) => ({
    instructor,
    score: buildInstructorIntentScore(
      instructor,
      args.packagesByInstructorId[instructor.id] ?? [],
      args.intent
    ),
  }));

  const directMatches = scored
    .filter((entry) => entry.score > 0)
    .sort(sortInstructorsByIntentScore)
    .map((entry) => entry.instructor);

  if (directMatches.length) {
    return {
      instructors: directMatches,
      fallbackUsed: false,
      exactMatchCount: directMatches.length,
    };
  }

  return {
    instructors: scored
      .sort(sortInstructorsByIntentScore)
      .map((entry) => entry.instructor),
    fallbackUsed: true,
    exactMatchCount: 0,
  };
}
