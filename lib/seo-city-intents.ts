import "server-only";

import type { InstructeurProfiel, Pakket } from "@/lib/types";
import type { SeoCityConfig, SeoFaqItem } from "@/lib/seo-cities";

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

export function getSeoCityIntentRouteLabel(
  cityName: string,
  intent: SeoCityIntent
) {
  return `${getSeoCityIntentConfig(intent)?.label ?? intent} ${cityName}`;
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

export function getSeoCityIntentFaqItems(
  city: SeoCityConfig,
  intent: SeoCityIntent
): SeoFaqItem[] {
  const config = getSeoCityIntentConfig(intent);

  if (!config) {
    return [];
  }

  if (intent === "faalangst") {
    return [
      {
        question: config.faqQuestion(city),
        answer: config.faqAnswer(city),
      },
      {
        question: `Wat houdt faalangst rijles in ${city.name} meestal in?`,
        answer: `Faalangst rijles in ${city.name} draait meestal om een rustigere lesopbouw, voorspelbare uitleg en meer ruimte om spanning af te bouwen voordat de druk oploopt. Het gaat dus niet om zachter lesgeven, maar om slimmer begeleiden.`,
      },
      {
        question: `Wanneer is faalangst rijles in ${city.name} een logische keuze?`,
        answer: `Dat is vaak slim als je merkt dat spanning, prestatiedruk of eerdere negatieve ervaringen invloed hebben op je rit. In ${city.name} helpt het extra als een instructeur het tempo aanpast aan druk verkeer en onverwachte situaties zonder dat je het overzicht verliest.`,
      },
      {
        question: `Kan ik in ${city.name} eerst rustig kennismaken voordat ik een groter pakket kies?`,
        answer: `Ja. Veel leerlingen beginnen in ${city.name} liever met een proefles of klein pakket om eerst te voelen of de klik, uitlegstijl en rust van de instructeur goed passen. ${city.localComfortInsight}`,
      },
      {
        question: `Helpt faalangstbegeleiding in ${city.name} ook richting praktijkexamen?`,
        answer: `Juist daar zit vaak de grootste winst. Een rustige instructeur helpt je in ${city.name} niet alleen tijdens gewone lessen, maar vooral bij examenspanning, foutangst en het opbouwen van meer vertrouwen voor de laatste fase richting praktijkexamen.`,
      },
    ];
  }

  if (intent === "spoedcursus") {
    return [
      {
        question: config.faqQuestion(city),
        answer: config.faqAnswer(city),
      },
      {
        question: `Voor wie is een spoedcursus rijles in ${city.name} vooral geschikt?`,
        answer: `Een spoedcursus in ${city.name} past vooral bij leerlingen die snel willen schakelen, al veel tijd kunnen vrijmaken en genoeg focus hebben om meerdere lessen dicht op elkaar te volgen. Het werkt meestal beter als je al basisgevoel in het verkeer hebt of snel informatie oppakt.`,
      },
      {
        question: `Hoe snel kan een spoedcursus in ${city.name} realistisch gaan?`,
        answer: `Dat hangt af van beschikbaarheid, startniveau en examendruk in ${city.name}. Een spoedtraject klinkt snel, maar de beste routes blijven realistisch gepland zodat je niet alleen sneller lest, maar ook echt klaar bent voor het examen. ${city.localExamInsight}`,
      },
      {
        question: `Is een spoedcursus in ${city.name} altijd beter dan een regulier traject?`,
        answer: `Niet altijd. Voor sommige leerlingen werkt een regulier ritme beter, juist omdat het meer tijd geeft om ervaring te laten landen. In ${city.name} is een spoedcursus vooral sterk wanneer je planning, motivatie en leerstijl goed aansluiten op een intensiever tempo.`,
      },
      {
        question: `Waar let ik op als ik een spoedcursus instructeur in ${city.name} vergelijk?`,
        answer: `Kijk in ${city.name} niet alleen naar prijs of aantal lessen, maar juist naar examenfocus, reviewkwaliteit, flexibiliteit in planning en hoe duidelijk de instructeur kan uitleggen wat de snelste route is zonder kwaliteit te verliezen.`,
      },
    ];
  }

  if (intent === "proefles") {
    return [
      {
        question: config.faqQuestion(city),
        answer: config.faqAnswer(city),
      },
      {
        question: `Wat is het doel van een proefles in ${city.name}?`,
        answer: `Een proefles in ${city.name} is vooral bedoeld om te voelen of de instructeur, uitlegstijl en sfeer goed bij je passen. Het is minder een los verkooppraatje en meer een eerste echte stap om te zien hoe jij reageert op het verkeer en de lesopbouw.`,
      },
      {
        question: `Wanneer is een proefles in ${city.name} slimmer dan direct een pakket kiezen?`,
        answer: `Dat is vaak slim als je nog twijfelt over automaat of schakel, spanning voelt voor je eerste les of gewoon eerst een klik met de instructeur wilt ervaren. In ${city.name} helpt zo'n eerste moment vaak om sneller met vertrouwen te kiezen.`,
      },
      {
        question: `Waar let ik op tijdens een proefles in ${city.name}?`,
        answer: `Let in ${city.name} vooral op hoe rustig de instructeur uitlegt, of je je veilig voelt om fouten te maken en of het verkeerstempo logisch wordt opgebouwd. ${city.localComfortInsight}`,
      },
      {
        question: `Kan ik na een proefles in ${city.name} makkelijk door naar een pakket of vervolglessen?`,
        answer: `Ja. Juist daarom werkt een proefles lokaal zo goed: je kunt na die eerste rit in ${city.name} veel sneller bepalen of je door wilt met losse lessen, een starterspakket of een route met meer examenfocus.`,
      },
    ];
  }

  if (intent === "examengericht") {
    return [
      {
        question: config.faqQuestion(city),
        answer: config.faqAnswer(city),
      },
      {
        question: `Wat maakt examengerichte rijles in ${city.name} anders dan gewone lessen?`,
        answer: `Examengerichte rijles in ${city.name} draait minder om de absolute basis en meer om foutreductie, zelfstandigheid en het aanscherpen van situaties die rond het praktijkexamen het meeste druk geven.`,
      },
      {
        question: `Voor wie is examengerichte rijles in ${city.name} vooral bedoeld?`,
        answer: `Dit past vooral bij leerlingen die al een redelijke basis hebben, dichter op hun examendatum zitten of merken dat ze telkens op dezelfde punten blijven hangen. In ${city.name} helpt het om dan veel gerichter te trainen op lokale verkeersmomenten.`,
      },
      {
        question: `Waar moet een examengerichte instructeur in ${city.name} sterk in zijn?`,
        answer: `Een goede examengerichte instructeur in ${city.name} moet snel terugkerende fouten zien, duidelijk prioriteiten stellen en exact kunnen uitleggen waar nog winst zit richting het praktijkexamen. ${city.localExamInsight}`,
      },
      {
        question: `Kan ik in ${city.name} ook examengericht starten zonder groot pakket?`,
        answer: `Ja. Sommige leerlingen kiezen in ${city.name} eerst een paar gerichte lessen om te bepalen hoeveel extra voorbereiding echt nodig is, en stappen daarna pas over op een groter examenpakket als dat logisch voelt.`,
      },
    ];
  }

  if (intent === "praktijkexamen") {
    return [
      {
        question: config.faqQuestion(city),
        answer: config.faqAnswer(city),
      },
      {
        question: `Wanneer is praktijkexamen rijles in ${city.name} relevant?`,
        answer: `Dat wordt vooral relevant als je al een basis hebt en dichter op je examendatum zit. In ${city.name} zoeken leerlingen dan meestal minder naar algemene rijles en juist meer naar finetuning, foutreductie en examenvertrouwen.`,
      },
      {
        question: `Waar ligt de focus van praktijkexamen lessen in ${city.name}?`,
        answer: `De nadruk ligt meestal op kijktechniek, verkeersinzicht, zelfstandigheid en het verkleinen van terugkerende fouten. In ${city.name} helpt het extra om lokaal te oefenen op situaties die op examenroutes of in vergelijkbaar verkeer vaak terugkomen. ${city.localExamInsight}`,
      },
      {
        question: `Hoe weet ik of ik in ${city.name} klaar ben voor het praktijkexamen?`,
        answer: `Een goede instructeur kijkt in ${city.name} niet alleen naar hoeveel lessen je hebt gehad, maar vooral naar hoe stabiel je rijdt onder druk, hoe zelfstandig je keuzes maakt en of je fouten nog structureel of incidenteel zijn.`,
      },
      {
        question: `Is een praktijkexamen pakket in ${city.name} handiger dan losse lessen?`,
        answer: `Vaak wel als je in een korte periode gericht wilt afronden. Een pakket in ${city.name} geeft meestal meer structuur rond de laatste lessen, het examengerichte ritme en de opbouw naar je praktijkexamen dan losse lessen zonder duidelijke planning.`,
      },
    ];
  }

  if (intent === "opfriscursus") {
    return [
      {
        question: config.faqQuestion(city),
        answer: config.faqAnswer(city),
      },
      {
        question: `Voor wie is een opfriscursus in ${city.name} meestal geschikt?`,
        answer: `Een opfriscursus in ${city.name} is vooral geschikt voor mensen die al een rijbewijs hebben, lang niet gereden hebben of weer meer zekerheid willen voordat ze vaker zelfstandig de weg op gaan.`,
      },
      {
        question: `Wat oefen je meestal tijdens een opfriscursus in ${city.name}?`,
        answer: `Dat hangt af van je niveau, maar in ${city.name} gaat het vaak om herstarten in drukker verkeer, weer comfortabel invoegen, parkeren, kijken onder druk en opnieuw vertrouwen opbouwen in je eigen ritme.`,
      },
      {
        question: `Hoe verschilt een opfriscursus in ${city.name} van gewone rijlessen?`,
        answer: `Het doel is meestal niet om helemaal vanaf nul te beginnen, maar om gericht terug te krijgen wat is weggezakt. In ${city.name} voelt zo'n traject daardoor vaak praktischer, rustiger en veel persoonlijker dan een standaard lesroute.`,
      },
      {
        question: `Kan ik een opfriscursus in ${city.name} heel persoonlijk laten invullen?`,
        answer: `Ja. Juist bij een opfriscursus in ${city.name} werkt maatwerk vaak het best: sommige leerlingen willen vooral stadsverkeer oefenen, anderen juist snelwegen, parkeren of weer rust vinden na een lange rijpauze. ${city.localComfortInsight}`,
      },
    ];
  }

  return [
    {
      question: config.faqQuestion(city),
      answer: config.faqAnswer(city),
    },
    {
      question: `Wanneer is ${config.searchLabel} in ${city.name} slim?`,
      answer: `${config.label} in ${city.name} is vooral slim voor bezoekers die al vrij concreet weten wat ze zoeken, zoals een proefles, spoedtraject, praktijkexamenfocus of juist meer rust en zekerheid.`,
    },
    {
      question: `Hoe kies ik een instructeur voor ${config.searchLabel} in ${city.name}?`,
      answer: `Vergelijk instructeurs in ${city.name} op reviews, lesstijl, pakketten en specialisaties. Bij intentpagina's zoals ${config.searchLabel} helpt het extra om te letten op bio, pakketomschrijvingen en recente beoordelingen.`,
    },
    {
      question: `Kan ik op deze pagina ook andere routes in ${city.name} bekijken?`,
      answer: `Ja. Naast ${config.searchLabel} ${city.name} linkt de pagina ook door naar rijschool, automaat, schakel en andere lokale SEO-routes, zodat bezoekers logisch kunnen doorklikken zonder terug te hoeven naar Google.`,
    },
    {
      question: `Waarom is een intentpagina voor ${config.searchLabel} in ${city.name} SEO-technisch sterk?`,
      answer: `Omdat de zoekterm veel dichter op een concrete behoefte zit. Door lokale instructeurs, reviews, pakketten en interne routes rond ${city.name} te combineren, wordt de pagina relevanter voor zowel bezoekers als zoekmachines.`,
    },
  ];
}

export function getSeoCityIntentNarrative(
  city: SeoCityConfig,
  intent: SeoCityIntent
) {
  const config = getSeoCityIntentConfig(intent);

  if (!config) {
    return null;
  }

  switch (intent) {
    case "spoedcursus":
      return {
        title: `Waarom spoedcursussen in ${city.name} vaak anders worden gezocht`,
        body: city.localExamInsight,
        support: `Bezoekers die op spoedcursus in ${city.name} zoeken, willen meestal niet alleen sneller rijden, maar vooral sneller richting examen zonder grip op de basis te verliezen.`,
      };
    case "proefles":
      return {
        title: `Waarom een proefles in ${city.name} veel vertrouwen kan schelen`,
        body: city.localComfortInsight,
        support: `Juist in ${city.name} helpt een eerste les vaak om te voelen of de instructeur, het verkeersritme en de sfeer goed bij je passen voordat je een groter pakket kiest.`,
      };
    case "examengericht":
    case "praktijkexamen":
      return {
        title: `Waarom examenfocus in ${city.name} meer vraagt dan alleen extra lessen`,
        body: city.localExamInsight,
        support: `Voor bezoekers in ${city.name} gaat examengerichte hulp vaak om routekennis, rust onder druk en slimmer oefenen op de fouten die lokaal het meest terugkomen.`,
      };
    case "faalangst":
      return {
        title: `Waarom faalangst rijles in ${city.name} vooral om rust en ritme draait`,
        body: city.localComfortInsight,
        support: `In ${city.name} helpt een kalme instructeur vaak het meest wanneer spanning ontstaat door drukte, onverwachte verkeersmomenten of de gedachte aan het praktijkexamen.`,
      };
    case "opfriscursus":
      return {
        title: `Waarom opfriscursus rijles in ${city.name} voor veel mensen relevant is`,
        body: city.localComfortInsight,
        support: `Wie in ${city.name} weer wil instappen, zoekt meestal geen standaard beginnerstraject maar juist een rustige herstart die past bij het lokale verkeer van nu.`,
      };
    default:
      return {
        title: `Waarom ${config.searchLabel} in ${city.name} lokale nuance nodig heeft`,
        body: city.localTrafficInsight,
        support: `Die lokale nuance maakt het verschil tussen een algemene SEO-pagina en een route die echt aansluit op hoe mensen in ${city.name} zoeken en kiezen.`,
      };
  }
}
