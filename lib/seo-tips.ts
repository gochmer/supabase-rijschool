import "server-only";

export type SeoTipArticle = {
  slug: string;
  title: string;
  description: string;
  category: string;
  cityLabel: string;
  keywords: string[];
  intro: string;
  sections: Array<{
    heading: string;
    body: string[];
  }>;
  relatedLinks: Array<{
    href: string;
    label: string;
  }>;
};

export const seoTipArticles: SeoTipArticle[] = [
  {
    slug: "rijexamen-amsterdam",
    title: "Rijexamen Amsterdam: hoe bereid je je slimmer voor op stadsverkeer en examenroutes?",
    description:
      "Praktische SEO-kennispagina over rijexamen Amsterdam, stadsverkeer, routekennis en hoe leerlingen lokaal beter vergelijken.",
    category: "Rijexamen",
    cityLabel: "Amsterdam",
    keywords: ["rijexamen amsterdam", "examenroutes amsterdam", "rijschool amsterdam"],
    intro:
      "Wie zoekt op rijexamen Amsterdam zit vaak dichter op een keuze dan iemand die alleen algemeen op rijschool zoekt. Daarom is het slim om lokale instructeurs, examenfocus en routekennis op één plek zichtbaar te maken.",
    sections: [
      {
        heading: "Waarom lokale examenkennis in Amsterdam telt",
        body: [
          "Amsterdam vraagt vaak meer van leerlingen door tramverkeer, drukkere kruispunten en complexere voorrangssituaties.",
          "Een instructeur die examenroutes en lastige stadsdelen kent, kan gerichter trainen op de punten waar leerlingen meestal onzeker worden.",
        ],
      },
      {
        heading: "Waar let je op als je instructeurs vergelijkt",
        body: [
          "Kijk niet alleen naar prijs, maar vooral naar examengerichte begeleiding, reviewscore en of een instructeur ervaring heeft met stadsverkeer.",
          "Pakketten met opfrislessen, examentraining of faalangstbegeleiding zijn vaak interessanter voor leerlingen die al dichter op hun praktijkexamen zitten.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/rijschool/amsterdam", label: "Rijschool Amsterdam" },
      { href: "/examengericht/amsterdam", label: "Examengericht Amsterdam" },
      { href: "/praktijkexamen/amsterdam", label: "Praktijkexamen Amsterdam" },
    ],
  },
  {
    slug: "automaat-rijles-rotterdam",
    title: "Automaat rijles Rotterdam: wanneer is een aparte automaatroute slim voor SEO en keuzehulp?",
    description:
      "Waarom automaat rijles Rotterdam een sterke zoekterm is en hoe een aparte landingspagina bezoekers sneller laat doorklikken.",
    category: "Automaat",
    cityLabel: "Rotterdam",
    keywords: ["automaat rijles rotterdam", "automaat rijschool rotterdam"],
    intro:
      "Automaat rijles Rotterdam is een typische zoekterm met duidelijke koopintentie. De bezoeker weet vaak al welk type les hij zoekt en wil vooral snel lokale instructeurs vergelijken.",
    sections: [
      {
        heading: "Waarom automaat als aparte route beter werkt",
        body: [
          "Als automaat verdwijnt tussen algemene auto-aanbieders, voelt het minder relevant voor de bezoeker en minder scherp voor Google.",
          "Een lokale automaatpagina bundelt alleen profielen en pakketten die echt passen bij die vraag.",
        ],
      },
      {
        heading: "Welke signalen vertrouwen geven",
        body: [
          "Reviews, proefles-opties en duidelijke pakketopbouw zijn op deze zoekterm vaak belangrijker dan algemene marketingtekst.",
          "Door lokale profielen te combineren met echte social proof stijgt de kans dat een bezoeker doorklikt naar een instructeurprofiel.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/automaat/rotterdam", label: "Automaat Rotterdam" },
      { href: "/proefles/rotterdam", label: "Proefles Rotterdam" },
      { href: "/instructeurs", label: "Alle instructeurs" },
    ],
  },
  {
    slug: "proefles-utrecht",
    title: "Proefles Utrecht: waarom deze zoekintentie zo sterk converteert",
    description:
      "SEO-artikel over proefles Utrecht, waarom die zoekterm warmer is en hoe je bezoekers sneller naar de juiste instructeur laat gaan.",
    category: "Proefles",
    cityLabel: "Utrecht",
    keywords: ["proefles utrecht", "eerste rijles utrecht", "kennismakingsles utrecht"],
    intro:
      "Bij proefles Utrecht zoekt een bezoeker meestal niet meer naar informatie in de breedte, maar naar een instructeur die direct vertrouwen geeft. Dat maakt deze pagina commercieel sterk.",
    sections: [
      {
        heading: "Een proefles is vaak de eerste echte conversiestap",
        body: [
          "De bezoeker wil weten of de klik met de instructeur goed is en of de uitleg rustig en duidelijk voelt.",
          "Daarom zijn profielkwaliteit, recente reviews en heldere proeflesknoppen belangrijker dan lange, algemene marketingteksten.",
        ],
      },
      {
        heading: "Hoe je deze intentie goed opvangt",
        body: [
          "Een aparte lokale proeflespagina helpt om meteen de juiste profielen te laten zien zonder ruis van landelijke of minder passende routes.",
          "Interne links naar pakketten en algemene stadspagina's houden die bezoeker daarna soepel in dezelfde funnel.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/proefles/utrecht", label: "Proefles Utrecht" },
      { href: "/rijschool/utrecht", label: "Rijschool Utrecht" },
      { href: "/spoedcursus/utrecht", label: "Spoedcursus Utrecht" },
    ],
  },
  {
    slug: "spoedcursus-den-haag",
    title: "Spoedcursus Den Haag: hoe vang je snelle zoekers beter op?",
    description:
      "Lokale SEO-pagina over spoedcursus Den Haag en waarom snelle trajecten apart beter converteren dan generieke rijschoolpagina's.",
    category: "Spoedcursus",
    cityLabel: "Den Haag",
    keywords: ["spoedcursus den haag", "snel rijbewijs den haag"],
    intro:
      "Spoedcursus Den Haag is een zoekterm die vaak komt van bezoekers met weinig tijd en hoge intentie. Ze willen snel zien welke instructeurs passen bij een intensiever traject.",
    sections: [
      {
        heading: "Wat maakt deze intentie anders",
        body: [
          "Spoedzoekers kijken vaak eerst naar snelheid, beschikbaarheid en route naar het examen, pas daarna naar randinformatie.",
          "Daarom helpt een aparte lokale pagina om direct de juiste instructeurs en pakketten te tonen.",
        ],
      },
      {
        heading: "Welke content hier het best werkt",
        body: [
          "Leg uit hoe snelle trajecten eruitzien, maar laat vooral lokale profielen, pakketten en reviews het overtuigende werk doen.",
          "Een goede mix van SEO-copy en echte instructeurdata houdt de pagina relevant én conversiegericht.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/spoedcursus/den-haag", label: "Spoedcursus Den Haag" },
      { href: "/examengericht/den-haag", label: "Examengericht Den Haag" },
      { href: "/rijschool/den-haag", label: "Rijschool Den Haag" },
    ],
  },
  {
    slug: "faalangst-rijles-amsterdam",
    title: "Faalangst rijles Amsterdam: welke signalen maken een profiel geloofwaardig?",
    description:
      "SEO-contentpagina over faalangst rijles Amsterdam en hoe een rustige, gerichte profielpresentatie vertrouwen opbouwt.",
    category: "Faalangst",
    cityLabel: "Amsterdam",
    keywords: ["faalangst rijles amsterdam", "rustige rijles amsterdam"],
    intro:
      "Zoekers naar faalangst rijles Amsterdam hebben vaak een duidelijker probleembeeld en zoeken meer vertrouwen dan sensatie. Dat vraagt om andere copy en andere profielsignalen.",
    sections: [
      {
        heading: "Waarom deze bezoeker anders beslist",
        body: [
          "Bij faalangst speelt gevoel minstens zo sterk mee als prijs of pakketomvang.",
          "Reviews, rustige taal en duidelijke begeleiding rondom examenmomenten zijn daarom extra belangrijk op deze route.",
        ],
      },
      {
        heading: "Wat je hier zichtbaar wilt maken",
        body: [
          "Laat vooral zien welke instructeurs gespecialiseerd zijn in spanning, examenrust en stap-voor-stap opbouw.",
          "Combineer dat met lokale relevantie, zodat de bezoeker niet hoeft te filteren door ongeschikt aanbod.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/faalangst/amsterdam", label: "Faalangst Amsterdam" },
      { href: "/examengericht/amsterdam", label: "Examengericht Amsterdam" },
      { href: "/instructeurs", label: "Alle instructeurs" },
    ],
  },
  {
    slug: "opfriscursus-eindhoven",
    title: "Opfriscursus Eindhoven: hoe bereik je zoekers die weer vertrouwen willen opbouwen?",
    description:
      "Kennisbankpagina over opfriscursus Eindhoven voor bezoekers die na een pauze weer veilig en rustig willen rijden.",
    category: "Opfriscursus",
    cityLabel: "Eindhoven",
    keywords: ["opfriscursus eindhoven", "opfris rijles eindhoven"],
    intro:
      "Mensen die zoeken op opfriscursus Eindhoven zitten vaak in een andere fase dan nieuwe leerlingen. Ze willen herstarten, zekerheid opbouwen en vooral snel zien welke instructeurs daarbij passen.",
    sections: [
      {
        heading: "Waarom een opfriscursus eigen SEO-waarde heeft",
        body: [
          "Deze zoekterm is specifieker dan algemene rijschooltermen en trekt daardoor bezoekers aan met een concreter doel.",
          "Een aparte lokale pagina laat meteen zien dat er ook aanbod is voor herstart, twijfel of extra rijrust.",
        ],
      },
      {
        heading: "Hoe je die bezoeker laat doorstromen",
        body: [
          "Laat opfriscursus-profielen zien met heldere reviewscore, rustige uitleg en duidelijke vervolgstappen zoals proefles of pakket.",
          "Koppel de pagina ook aan bredere lokale routes zodat de funnel niet doodloopt als er nog weinig expliciete matches zijn.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/opfriscursus/eindhoven", label: "Opfriscursus Eindhoven" },
      { href: "/rijschool/eindhoven", label: "Rijschool Eindhoven" },
      { href: "/proefles/eindhoven", label: "Proefles Eindhoven" },
    ],
  },
  {
    slug: "kosten-rijbewijs",
    title: "Wat kost een rijbewijs echt? Waar leerlingen op moeten letten bij prijsvergelijking",
    description:
      "SEO-artikel over kosten rijbewijs, lesprijzen, pakketvergelijking en waarom alleen naar de goedkoopste les kijken vaak te kort door de bocht is.",
    category: "Kosten",
    cityLabel: "Landelijk",
    keywords: ["kosten rijbewijs", "wat kost rijles", "prijs rijbewijs"],
    intro:
      "Wie zoekt op kosten rijbewijs wil meestal niet alleen een los bedrag zien, maar begrijpen waar prijsverschillen vandaan komen en welk aanbod echt logisch voelt.",
    sections: [
      {
        heading: "Waarom prijs per les niet het hele verhaal is",
        body: [
          "Een losse lesprijs zegt nog weinig over structuur, pakketkwaliteit, examentraining of hoeveel begeleiding een leerling krijgt.",
          "Daarom helpt het om prijzen altijd te bekijken naast reviews, lesfocus en de opbouw van een pakket.",
        ],
      },
      {
        heading: "Welke vergelijking commercieel het sterkst werkt",
        body: [
          "Bezoekers krijgen meer vertrouwen als ze direct begrijpen wat een pakket inhoudt en of er extra examenkosten of focusgebieden zijn.",
          "Dat maakt duidelijke pakketpagina's en eerlijke profielvergelijking veel sterker dan alleen een kale prijslijst.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/pakketten", label: "Bekijk pakketten" },
      { href: "/instructeurs", label: "Vergelijk instructeurs" },
      { href: "/tips/hoeveel-rijlessen-nodig", label: "Hoeveel lessen heb je nodig?" },
    ],
  },
  {
    slug: "automaat-of-schakel",
    title: "Automaat of schakel: wat is slimmer voor jouw rijlestraject?",
    description:
      "Vergelijk automaat of schakel voor rijles, met aandacht voor keuzehulp, zoekintentie en welke landingspagina het best aansluit bij de bezoeker.",
    category: "Keuzehulp",
    cityLabel: "Landelijk",
    keywords: ["automaat of schakel", "automaat rijles of schakel", "verschil automaat schakel"],
    intro:
      "Veel leerlingen zoeken heel direct op automaat of schakel. Dat betekent dat deze vraag niet alleen inhoudelijk belangrijk is, maar ook SEO-technisch een sterke ingang vormt.",
    sections: [
      {
        heading: "Wanneer automaat logischer voelt",
        body: [
          "Automaat kan rust geven bij spanning, druk stadsverkeer of wanneer een leerling vooral snel vertrouwen wil opbouwen.",
          "Een aparte automaatpagina helpt die bezoeker sneller naar relevante profielen en pakketten.",
        ],
      },
      {
        heading: "Wanneer schakel meer waarde geeft",
        body: [
          "Schakel is vaak logischer voor leerlingen die later meer vrijheid willen of die bewust in elke auto willen kunnen rijden.",
          "Daarom werkt een aparte schakelroute goed voor bezoekers die al doelgerichter zoeken.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/automaat/amsterdam", label: "Automaat Amsterdam" },
      { href: "/schakel/amsterdam", label: "Schakel Amsterdam" },
      { href: "/tips/proefles-utrecht", label: "Lees ook over proefles-intentie" },
    ],
  },
  {
    slug: "hoeveel-rijlessen-nodig",
    title: "Hoeveel rijlessen heb je nodig? Zo kijk je slimmer naar pakketten en voortgang",
    description:
      "Praktische SEO-content over hoeveel rijlessen je nodig hebt en hoe bezoekers pakketten, tempo en instructeurkwaliteit beter kunnen inschatten.",
    category: "Voortgang",
    cityLabel: "Landelijk",
    keywords: ["hoeveel rijlessen nodig", "aantal rijlessen", "hoeveel lessen rijbewijs"],
    intro:
      "Zoekers die vragen hoeveel rijlessen ze nodig hebben, willen meestal grip op tijd, kosten en tempo. Dat maakt dit een sterke kennisvraag om bezoekers richting pakketten en instructeurs te begeleiden.",
    sections: [
      {
        heading: "Waarom hier geen vast getal voor bestaat",
        body: [
          "Het aantal lessen hangt af van ervaring, tempo, spanning, examendruk en hoe goed de instructeur de opbouw afstemt.",
          "Daarom zijn proeflessen, reviewkwaliteit en pakketopbouw vaak betere signalen dan alleen een gemiddeld landelijk getal.",
        ],
      },
      {
        heading: "Hoe je dit goed vertaalt naar conversie",
        body: [
          "Bezoekers willen vooral voelen dat er een logisch traject is. Heldere pakketten, coachsignalen en examengerichte routes maken die keuze makkelijker.",
          "Door kenniscontent te koppelen aan echte instructeurs en pakketten blijft de stap naar aanvragen klein.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/pakketten", label: "Bekijk pakketten" },
      { href: "/proefles/amsterdam", label: "Start met een proefles" },
      { href: "/examengericht/amsterdam", label: "Examengerichte route bekijken" },
    ],
  },
];

export function getSeoTipArticleBySlug(slug: string) {
  return seoTipArticles.find((article) => article.slug === slug) ?? null;
}
