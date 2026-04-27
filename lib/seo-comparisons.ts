import "server-only";

import type { SeoFaqItem } from "@/lib/seo-cities";

export type SeoComparisonPage = {
  slug: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  intro: string;
  leftLabel: string;
  rightLabel: string;
  leftSummary: string;
  rightSummary: string;
  comparisonPoints: Array<{
    heading: string;
    left: string;
    right: string;
  }>;
  decisionTitle: string;
  decisionText: string;
  bullets: string[];
  faqItems: SeoFaqItem[];
  relatedLinks: Array<{
    href: string;
    label: string;
  }>;
};

export const seoComparisonPages: SeoComparisonPage[] = [
  {
    slug: "automaat-vs-schakel",
    title: "Automaat vs schakel: wat past beter bij jouw rijlestraject?",
    description:
      "Vergelijk automaat en schakel op rust, verkeersdruk, flexibiliteit en leerstijl. Een sterke SEO-pagina voor zoekers die vlak voor hun keuze zitten.",
    category: "Vergelijking",
    keywords: [
      "automaat vs schakel",
      "automaat of schakel",
      "verschil automaat schakel rijles",
    ],
    intro:
      "Zoekers op automaat vs schakel willen meestal geen algemeen verhaal meer, maar een heldere keuzehulp. Dat maakt dit type vergelijking commercieel sterk én SEO-technisch interessant.",
    leftLabel: "Automaat",
    rightLabel: "Schakel",
    leftSummary:
      "Rustiger starten, minder techniekdruk en vaak aantrekkelijk in druk stadsverkeer of bij spanning.",
    rightSummary:
      "Meer voertuigcontrole, bredere inzet later en vaak logisch voor leerlingen die alles open willen houden.",
    comparisonPoints: [
      {
        heading: "Rust tijdens de eerste lessen",
        left: "Automaat geeft sneller rust omdat je niet tegelijk hoeft te schakelen en koppelen.",
        right: "Schakel vraagt meer techniek, maar kan voor sommige leerlingen juist sneller rijgevoel geven.",
      },
      {
        heading: "Geschikt voor druk stadsverkeer",
        left: "Automaat is vaak prettig in steden als Amsterdam of Rotterdam met veel stop-and-go verkeer.",
        right: "Schakel kan prima in de stad, maar vraagt meer aandacht bij files, kruispunten en korte ritmes.",
      },
      {
        heading: "Flexibiliteit na het behalen",
        left: "Met een automaatrijbewijs blijf je later beperkt tot automaat rijden.",
        right: "Met schakel houd je maximale vrijheid om in elke auto te rijden.",
      },
    ],
    decisionTitle: "Wanneer kies je wat?",
    decisionText:
      "Automaat is vaak slimmer als je vooral snel vertrouwen wilt voelen, veel stadsverkeer verwacht of spanning ervaart. Schakel past beter als je maximale vrijheid wilt of bewust techniek mee wilt nemen in je leerproces.",
    bullets: [
      "Automaat: rustiger, laagdrempeliger en vaak fijner in drukte",
      "Schakel: breder inzetbaar en vaak sterker voor lange termijn vrijheid",
      "Proefles helpt vaak sneller dan eindeloos twijfelen",
    ],
    faqItems: [
      {
        question: "Is automaat makkelijker dan schakel?",
        answer:
          "Voor veel leerlingen wel, omdat er minder tegelijk gebeurt. Maar makkelijker betekent niet automatisch beter; het hangt af van jouw doel en leerstijl.",
      },
      {
        question: "Is schakel nog slim als ik vooral in de stad rijd?",
        answer:
          "Dat kan zeker. Maar in druk stadsverkeer kiezen veel leerlingen toch voor automaat omdat het sneller rust geeft.",
      },
      {
        question: "Wat helpt het meest als ik twijfel?",
        answer:
          "Een proefles of intake bij een passende instructeur. Dan voel je veel sneller welke route logisch is dan via alleen theorie of prijsvergelijking.",
      },
    ],
    relatedLinks: [
      { href: "/automaat/amsterdam", label: "Automaat rijles Amsterdam" },
      { href: "/schakel/amsterdam", label: "Schakel rijles Amsterdam" },
      { href: "/proefles/amsterdam", label: "Plan eerst een proefles" },
    ],
  },
  {
    slug: "spoedcursus-vs-regulier",
    title: "Spoedcursus vs regulier rijlestraject: wanneer is sneller ook slimmer?",
    description:
      "Vergelijk spoedcursus en reguliere rijlessen op tempo, druk, examenkans en planning. Ideaal voor zoekers die bewust een trajectvorm willen kiezen.",
    category: "Vergelijking",
    keywords: [
      "spoedcursus vs regulier",
      "spoedcursus of normale rijlessen",
      "snel rijbewijs vergelijken",
    ],
    intro:
      "Wie zoekt op spoedcursus vs regulier zit vaak al in de beslisfase. De vraag is dan niet alleen wat sneller is, maar vooral welk ritme het best past bij agenda, spanning en leervermogen.",
    leftLabel: "Spoedcursus",
    rightLabel: "Regulier traject",
    leftSummary:
      "Snel, intensief en vaak gekozen door leerlingen met duidelijke deadline of veel focus.",
    rightSummary:
      "Rustiger tempo, meer spreiding en vaak prettiger voor wie stabiel wil opbouwen.",
    comparisonPoints: [
      {
        heading: "Tempo van leren",
        left: "Spoedcursus bundelt veel lessen in korte tijd en vraagt hoge focus.",
        right: "Regulier geeft meer tijd tussen lessen om dingen te laten zakken en rustig te groeien.",
      },
      {
        heading: "Druk en mentale belasting",
        left: "Een spoedcursus kan goed werken, maar voelt zwaarder als je snel spanning opbouwt.",
        right: "Regulier is vaak beter voor leerlingen die rust nodig hebben of minder voorspelbaar beschikbaar zijn.",
      },
      {
        heading: "Praktisch plannen",
        left: "Spoedtrajecten vragen vaak veel beschikbaarheid in een korte periode.",
        right: "Regulier sluit meestal makkelijker aan op werk, studie of wisselende agenda's.",
      },
    ],
    decisionTitle: "Wat past beter bij jouw situatie?",
    decisionText:
      "Spoedcursus is vooral slim als je echt tijd kunt vrijmaken en goed presteert onder focus. Een regulier traject is sterker als je ritme, rust en herhaling belangrijk vindt.",
    bullets: [
      "Spoedcursus: sneller, intensiever, meer druk",
      "Regulier: stabieler, rustiger, vaak beter vol te houden",
      "Je agenda is net zo belangrijk als je motivatie",
    ],
    faqItems: [
      {
        question: "Is een spoedcursus altijd sneller klaar?",
        answer:
          "Niet automatisch. Het kan sneller gaan, maar alleen als het tempo echt past bij jouw concentratie, beschikbaarheid en spanning.",
      },
      {
        question: "Voor wie is een regulier traject beter?",
        answer:
          "Voor leerlingen die liever spreiding hebben, naast studie of werk lessen volgen, of die meer rust nodig hebben om vertrouwen op te bouwen.",
      },
      {
        question: "Kan ik eerst een proefles doen voor ik kies?",
        answer:
          "Ja, en dat is vaak slim. Zo merk je sneller of een instructeur denkt in spoed, rust of juist een tussenweg die beter bij je past.",
      },
    ],
    relatedLinks: [
      { href: "/spoedcursus/rotterdam", label: "Spoedcursus Rotterdam" },
      { href: "/examengericht/utrecht", label: "Examengericht Utrecht" },
      { href: "/pakketten", label: "Bekijk rijlespakketten" },
    ],
  },
  {
    slug: "proefles-vs-direct-pakket",
    title: "Proefles vs direct een pakket kiezen: wat is slimmer als eerste stap?",
    description:
      "Vergelijk eerst een proefles doen met direct een pakket kiezen. Sterke SEO-route voor bezoekers die twijfelen tussen oriënteren en meteen doorpakken.",
    category: "Vergelijking",
    keywords: [
      "proefles of direct pakket",
      "proefles vs pakket",
      "eerst proefles of rijlespakket",
    ],
    intro:
      "Dit is een typische vergelijking voor bezoekers die al verder zijn dan alleen rondkijken. Ze willen weten of ze eerst moeten voelen of een instructeur past, of meteen slim kunnen doorpakken met een traject.",
    leftLabel: "Eerst proefles",
    rightLabel: "Direct pakket",
    leftSummary:
      "Meer zekerheid over klik, lesstijl en rust voordat je geld en tijd groter inzet.",
    rightSummary:
      "Sterker als je al weet wat je wilt en snel richting planning of trajectkeuze wilt gaan.",
    comparisonPoints: [
      {
        heading: "Zekerheid over instructeur",
        left: "Met een proefles voel je sneller of uitleg, stijl en sfeer goed bij je passen.",
        right: "Direct pakket kiezen werkt vooral als je al genoeg vertrouwen hebt opgebouwd via profiel, reviews en aanbod.",
      },
      {
        heading: "Snelheid van doorpakken",
        left: "Een proefles kost één extra stap, maar voorkomt soms een verkeerde keuze.",
        right: "Direct pakket kiezen houdt de flow kort en voelt efficiënt voor beslissers.",
      },
      {
        heading: "Commercieel risico",
        left: "Lagere drempel voor nieuwe leerlingen die nog niet helemaal zeker zijn.",
        right: "Meer commitment meteen, maar alleen slim als de match al vrij duidelijk is.",
      },
    ],
    decisionTitle: "Welke route converteert beter voor jou?",
    decisionText:
      "Als je vooral vertrouwen wilt voelen, is een proefles vaak de beste start. Als je via reviews en profielpresentatie al bijna overtuigd bent, kan direct een pakket kiezen veel logischer zijn.",
    bullets: [
      "Proefles: lagere drempel, meer gevoel, veiligere eerste stap",
      "Direct pakket: sneller door, meer commitment, minder tussenstap",
      "Reviews en profielkwaliteit maken hier vaak het verschil",
    ],
    faqItems: [
      {
        question: "Is een proefles altijd nodig?",
        answer:
          "Nee. Sommige leerlingen weten via reviews, profielinformatie en aanbod al genoeg. Maar bij twijfel is een proefles vaak de slimste stap.",
      },
      {
        question: "Wanneer kies ik beter direct een pakket?",
        answer:
          "Als je al redelijk zeker bent van de instructeur, graag snel wilt plannen en duidelijk ziet welk pakket bij je niveau past.",
      },
      {
        question: "Kan een proefles later nog in een pakket verwerkt worden?",
        answer:
          "Dat hangt af van de instructeur of het pakket. Daarom helpt het als die informatie duidelijk op profiel- en pakketniveau zichtbaar is.",
      },
    ],
    relatedLinks: [
      { href: "/proefles/utrecht", label: "Proefles Utrecht" },
      { href: "/pakketten", label: "Bekijk pakketten" },
      { href: "/instructeurs", label: "Vergelijk instructeurs" },
    ],
  },
  {
    slug: "faalangst-vs-reguliere-rijles",
    title: "Faalangst rijles vs reguliere rijles: wanneer maakt extra rust echt verschil?",
    description:
      "Vergelijk faalangst rijles met reguliere begeleiding op vertrouwen, examendruk en lesopbouw. Sterke long-tail route voor warme zoekers.",
    category: "Vergelijking",
    keywords: [
      "faalangst rijles vs regulier",
      "rustige rijles of normaal",
      "faalangst rijles vergelijken",
    ],
    intro:
      "Bezoekers die deze vergelijking zoeken, hebben vaak al een vrij duidelijke hulpvraag. Ze willen weten of gewone rijlessen genoeg zijn, of dat extra rust en begeleiding echt nodig zijn.",
    leftLabel: "Faalangst rijles",
    rightLabel: "Reguliere rijles",
    leftSummary:
      "Meer rust, meer structuur en vaak een betere match voor leerlingen met spanning of examendruk.",
    rightSummary:
      "Prima voor veel leerlingen, maar niet altijd genoeg als spanning een grote rol speelt in leren of presteren.",
    comparisonPoints: [
      {
        heading: "Spanning tijdens het rijden",
        left: "Faalangst rijles bouwt vaak rustiger op en houdt meer rekening met mentale druk.",
        right: "Reguliere lessen kunnen prima zijn, maar voelen soms te snel of te algemeen als spanning hoog is.",
      },
      {
        heading: "Voorbereiding op examen",
        left: "Faalangstbegeleiding helpt vaak beter bij omgaan met druk, fouten en onzekerheid.",
        right: "Reguliere examenbegeleiding focust vaker vooral op rijvaardigheid en minder op spanning.",
      },
      {
        heading: "Klik met instructeur",
        left: "De toon, rust en veiligheid van de instructeur zijn hier extra bepalend.",
        right: "Bij reguliere lessen is die klik nog steeds belangrijk, maar minder vaak de hoofdreden van keuze.",
      },
    ],
    decisionTitle: "Wanneer is faalangst rijles echt de betere keuze?",
    decisionText:
      "Als spanning je rijgedrag, examengevoel of leertempo beïnvloedt, is extra rust meestal geen luxe maar gewoon logisch. Reguliere lessen blijven sterk als spanning niet de hoofdrol speelt.",
    bullets: [
      "Faalangst rijles: rust, veiligheid en examenspanning serieus meenemen",
      "Regulier: prima als spanning niet je grootste blokkade is",
      "Een proefles laat vaak snel voelen welke toon beter past",
    ],
    faqItems: [
      {
        question: "Is faalangst rijles alleen voor mensen met extreme spanning?",
        answer:
          "Nee. Ook leerlingen die gewoon sneller blokkeren, veel twijfelen of examenstress voelen hebben vaak baat bij een rustigere aanpak.",
      },
      {
        question: "Kan een gewone instructeur dit ook bieden?",
        answer:
          "Soms wel, maar niet elke instructeur profileert of begeleidt daar even sterk op. Daarom helpen specialisaties en reviews hier extra veel.",
      },
      {
        question: "Wat is de beste eerste stap als ik twijfel?",
        answer:
          "Plan een proefles bij een instructeur die duidelijk rust, vertrouwen of faalangstbegeleiding benoemt. Dan merk je snel of de stijl goed voelt.",
      },
    ],
    relatedLinks: [
      { href: "/faalangst/amsterdam", label: "Faalangst rijles Amsterdam" },
      { href: "/proefles/amsterdam", label: "Eerst een proefles plannen" },
      { href: "/examengericht/amsterdam", label: "Examengerichte hulp bekijken" },
    ],
  },
  {
    slug: "praktijkexamen-vs-tussentijdse-toets",
    title: "Praktijkexamen vs tussentijdse toets: wat is het verschil en wat heb je eraan?",
    description:
      "Vergelijk praktijkexamen en tussentijdse toets op doel, spanning, voorbereiding en leerwaarde. Een sterke SEO-route voor leerlingen die dichter op hun examen zitten.",
    category: "Vergelijking",
    keywords: [
      "praktijkexamen vs tussentijdse toets",
      "verschil tussentijdse toets praktijkexamen",
      "tussentijdse toets of examen",
    ],
    intro:
      "Zoekers op praktijkexamen vs tussentijdse toets zitten meestal al verder in hun traject. Ze willen begrijpen wat de extra stap oplevert en of die helpt voor rust, voorbereiding of examenkans.",
    leftLabel: "Praktijkexamen",
    rightLabel: "Tussentijdse toets",
    leftSummary:
      "Het echte beslismoment waarop je moet laten zien dat je zelfstandig en veilig kunt rijden.",
    rightSummary:
      "Een tussenstap die helpt oefenen onder examendruk en vaak extra inzicht geeft voor de laatste fase.",
    comparisonPoints: [
      {
        heading: "Doel van het moment",
        left: "Het praktijkexamen bepaalt of je slaagt en zelfstandig de weg op mag.",
        right: "De tussentijdse toets is bedoeld om ervaring op te doen en gerichter feedback te krijgen voor je eindfase.",
      },
      {
        heading: "Mentale druk",
        left: "De druk ligt hoger omdat dit het definitieve beoordelingsmoment is.",
        right: "De toets voelt vaak veiliger, maar kan juist helpen wennen aan spanning en het examengevoel.",
      },
      {
        heading: "Leerwaarde",
        left: "Het praktijkexamen zelf leert minder, omdat het vooral een eindbeoordeling is.",
        right: "Een tussentijdse toets kan veel waarde geven voor examenrust en duidelijker maken waar je nog winst pakt.",
      },
    ],
    decisionTitle: "Wanneer is een tussentijdse toets slim?",
    decisionText:
      "Een tussentijdse toets is vooral interessant als spanning een rol speelt of als je meer examengevoel wilt opbouwen voor het echte praktijkexamen. Voor sommige leerlingen is het vooral een rustgever, voor anderen een extra bevestiging dat ze goed op koers liggen.",
    bullets: [
      "Praktijkexamen: definitief moment",
      "Tussentijdse toets: oefening en inzicht",
      "Interessant bij spanning of twijfel in de eindfase",
    ],
    faqItems: [
      {
        question: "Is een tussentijdse toets verplicht?",
        answer:
          "Nee, het is geen verplicht onderdeel. Het is vooral een extra hulpmiddel om ervaring op te doen en gerichter naar het praktijkexamen toe te werken.",
      },
      {
        question: "Helpt een tussentijdse toets echt tegen spanning?",
        answer:
          "Voor veel leerlingen wel. Je ervaart hoe een officieel moment voelt, waardoor het echte praktijkexamen later minder onbekend is.",
      },
      {
        question: "Wanneer bespreek ik dit het best met mijn instructeur?",
        answer:
          "Zodra je in de examengerichte fase zit. Dan kan je instructeur beter inschatten of extra toetsing jou echt helpt of dat directe focus op het praktijkexamen slimmer is.",
      },
    ],
    relatedLinks: [
      { href: "/praktijkexamen/amsterdam", label: "Praktijkexamen Amsterdam" },
      { href: "/examengericht/amsterdam", label: "Examengericht Amsterdam" },
      { href: "/tips/rijexamen-amsterdam", label: "Meer over examenvoorbereiding" },
    ],
  },
  {
    slug: "motor-vs-auto",
    title: "Motorrijles vs autorijles: wat past beter bij jouw doel en type traject?",
    description:
      "Vergelijk motorrijles en autorijles op leerdoel, voertuigbeheersing, trajectopbouw en zoekintentie. Handig voor bezoekers die bewust tussen categorieën kiezen.",
    category: "Vergelijking",
    keywords: [
      "motor vs auto rijles",
      "motorrijles of autorijles",
      "verschil motorrijles autorijles",
    ],
    intro:
      "Niet iedereen die tussen motor en auto twijfelt, zit in dezelfde fase. Soms gaat het om praktisch vervoer, soms om vrijheid of rijgevoel. Daardoor is deze vergelijking sterk voor SEO én keuzehulp.",
    leftLabel: "Motorrijles",
    rightLabel: "Autorijles",
    leftSummary:
      "Meer focus op voertuigbeheersing, balans, kijkgedrag en gefaseerde examens zoals AVB en AVD.",
    rightSummary:
      "Meer gericht op dagelijks vervoer, verkeersdeelname en een route naar zelfstandig autorijden in stad en regio.",
    comparisonPoints: [
      {
        heading: "Type leerproces",
        left: "Motorrijles vraagt veel aandacht voor beheersing, balans en veilig lezen van het verkeer.",
        right: "Autorijles draait meer om complete verkeersdeelname, voertuigcontrole en praktische dagelijkse situaties.",
      },
      {
        heading: "Doel van de leerling",
        left: "Veel leerlingen kiezen motor vanuit vrijheid, hobby of extra rijbeleving.",
        right: "Autorijles wordt vaker gekozen vanuit dagelijkse mobiliteit, werk, studie of gezin.",
      },
      {
        heading: "Opbouw van het traject",
        left: "Motorrijles heeft vaak een duidelijkere splitsing tussen basisbeheersing en verkeersdeelname.",
        right: "Autorijles bouwt meestal in één doorgaande lijn op richting praktijkexamen.",
      },
    ],
    decisionTitle: "Welke categorie past beter bij je huidige doel?",
    decisionText:
      "Als je vooral praktisch de weg op wilt, is autorijles meestal logischer. Zoek je juist rijgevoel, vrijheid en een andere voertuigervaring, dan is motorrijles vaak veel beter passend.",
    bullets: [
      "Motor: meer beleving en voertuigbeheersing",
      "Auto: praktischer voor dagelijks gebruik",
      "Kijk eerst naar doel, niet alleen naar prijs",
    ],
    faqItems: [
      {
        question: "Is motorrijles moeilijker dan autorijles?",
        answer:
          "Niet per se, maar het vraagt een ander soort focus. Motorrijles legt vaak meer nadruk op balans, voertuiggevoel en veiligheid zonder de bescherming van een auto.",
      },
      {
        question: "Kan ik beide tegelijk doen?",
        answer:
          "Dat kan, maar het hangt af van je agenda, budget en focus. Vaak werkt één duidelijke hoofdrichting eerst rustiger en effectiever.",
      },
      {
        question: "Welke route is SEO-technisch interessanter?",
        answer:
          "Beide zijn interessant, maar de zoekintentie is anders. Motorrijles is vaak specifieker, terwijl autorijles breder en commercieel groter is.",
      },
    ],
    relatedLinks: [
      { href: "/motor", label: "Bekijk motorrijlessen" },
      { href: "/instructeurs", label: "Bekijk auto-instructeurs" },
      { href: "/motor/amsterdam", label: "Motorrijles Amsterdam" },
    ],
  },
  {
    slug: "opfriscursus-vs-reguliere-lessen",
    title: "Opfriscursus vs reguliere rijlessen: wat is slimmer als je weer wilt instappen?",
    description:
      "Vergelijk opfriscursus en reguliere rijlessen op herstart, spanning, tempo en doel. Ideaal voor bezoekers die na een pauze weer vertrouwen willen opbouwen.",
    category: "Vergelijking",
    keywords: [
      "opfriscursus vs reguliere rijlessen",
      "opfrisles of normale rijlessen",
      "weer beginnen met rijlessen",
    ],
    intro:
      "Zoekers op opfriscursus vs reguliere lessen hebben vaak al rijervaring, maar missen ritme of zelfvertrouwen. Daardoor vraagt deze keuze om andere content dan een gewone beginnerstraject-pagina.",
    leftLabel: "Opfriscursus",
    rightLabel: "Reguliere lessen",
    leftSummary:
      "Gericht op herstart, zekerheid en terugkomen in het verkeer zonder helemaal opnieuw te beginnen.",
    rightSummary:
      "Sterker voor een volledig leertraject of wanneer je nog echt basis op moet bouwen richting rijbewijs.",
    comparisonPoints: [
      {
        heading: "Startniveau van de leerling",
        left: "Een opfriscursus gaat uit van eerdere ervaring of een herstart na pauze.",
        right: "Reguliere lessen zijn logischer als je nog veel fundamentele basis moet opbouwen.",
      },
      {
        heading: "Doel van het traject",
        left: "De focus ligt op vertrouwen terugkrijgen, routine herstellen en rijrust opbouwen.",
        right: "De focus ligt meestal op een volledig traject richting zelfstandig rijden of praktijkexamen.",
      },
      {
        heading: "Tempo en inhoud",
        left: "Opfriscursus is vaak compacter en gerichter op specifieke onzekerheden.",
        right: "Reguliere lessen zijn breder en gestructureerder opgebouwd voor een langere leerroute.",
      },
    ],
    decisionTitle: "Wat past beter na een pauze?",
    decisionText:
      "Als je al ervaring hebt maar je rijgevoel kwijt bent, is een opfriscursus meestal veel slimmer dan weer instappen alsof je helemaal opnieuw begint. Reguliere lessen passen beter als er nog echt een volledig traject nodig is.",
    bullets: [
      "Opfriscursus: herstart, vertrouwen en focus",
      "Regulier: volledige opbouw en langer traject",
      "Je eerdere ervaring maakt hier het verschil",
    ],
    faqItems: [
      {
        question: "Wanneer kies ik beter een opfriscursus?",
        answer:
          "Als je al gereden hebt, maar weer vertrouwen nodig hebt of je huidige rijroutine te ver weg voelt. Dan is een gerichte opfriscursus meestal logischer dan een volledig standaardtraject.",
      },
      {
        question: "Kan een opfriscursus ook richting examen helpen?",
        answer:
          "Ja, zeker als je al ver bent geweest maar nog examengerichte scherpte mist. Dan kan een opfrisroute gecombineerd worden met extra examenfocus.",
      },
      {
        question: "Is een proefles ook nuttig bij opfriscursus?",
        answer:
          "Ja. Juist bij opfrissen helpt een eerste les vaak om snel te zien of je vooral ritme, techniek of zelfvertrouwen mist.",
      },
    ],
    relatedLinks: [
      { href: "/opfriscursus/eindhoven", label: "Opfriscursus Eindhoven" },
      { href: "/proefles/eindhoven", label: "Proefles Eindhoven" },
      { href: "/tips/opfriscursus-eindhoven", label: "Lees meer over opfriscursus" },
    ],
  },
  {
    slug: "proefles-vs-intake",
    title: "Proefles vs intake: wat is het verschil en welke eerste stap werkt beter?",
    description:
      "Vergelijk proefles en intake op gevoel, informatie, drempel en conversiekracht. Sterke SEO-route voor bezoekers die hun eerste stap nog moeten kiezen.",
    category: "Vergelijking",
    keywords: [
      "proefles vs intake",
      "verschil proefles en intake rijles",
      "eerste stap rijles proefles of intake",
    ],
    intro:
      "Bezoekers die twijfelen tussen proefles en intake zoeken meestal nog hun eerste echte stap. Daardoor is dit een sterke vergelijking om vertrouwen op te bouwen én door te sturen naar een instructeur of pakket.",
    leftLabel: "Proefles",
    rightLabel: "Intake",
    leftSummary:
      "Meer voelen, meer rijden en sneller inschatten of de klik met instructeur en lesstijl goed is.",
    rightSummary:
      "Meer inventariseren, minder meteen rijden en vaak logisch als je eerst structuur of advies wilt.",
    comparisonPoints: [
      {
        heading: "Doel van het moment",
        left: "Een proefles laat je direct ervaren hoe het rijden en de instructeur aanvoelen.",
        right: "Een intake is meer gericht op inventariseren, bespreken en bepalen welk traject logisch is.",
      },
      {
        heading: "Drempel voor de leerling",
        left: "Een proefles voelt vaak concreter en emotioneel sterker: je merkt direct of het goed zit.",
        right: "Een intake kan veiliger voelen als je eerst informatie en structuur wilt voordat je gaat rijden.",
      },
      {
        heading: "Conversiekracht",
        left: "Proeflessen converteren vaak sterk omdat ze het vertrouwen sneller tastbaar maken.",
        right: "Intakes werken goed als de route complexer is of wanneer pakketadvies belangrijker is dan direct rijden.",
      },
    ],
    decisionTitle: "Welke eerste stap past beter bij jouw funnel?",
    decisionText:
      "Wil je vooral gevoel krijgen bij de instructeur, kies dan sneller voor een proefles. Wil je eerst helderheid over niveau, planning of pakketadvies, dan is een intake logischer.",
    bullets: [
      "Proefles: voelen, ervaren, sneller vertrouwen",
      "Intake: structureren, inventariseren, route bepalen",
      "Beide werken, maar niet voor hetzelfde type leerling",
    ],
    faqItems: [
      {
        question: "Is een intake hetzelfde als een proefles?",
        answer:
          "Nee. Een proefles draait vooral om ervaren en rijden, terwijl een intake meestal meer draait om inventariseren, adviseren en trajectkeuze.",
      },
      {
        question: "Welke stap converteert beter?",
        answer:
          "Dat hangt af van het type bezoeker. Warme zoekers die al dichter op een keuze zitten, gaan vaak sneller op een proeflesknop. Onzekerdere of complexere gevallen reageren beter op intake of advies.",
      },
      {
        question: "Kan een intake later alsnog overgaan in een proefles?",
        answer:
          "Ja, en dat is vaak slim. Eerst helderheid, daarna voelen hoe de instructeur en lesstijl in de praktijk echt werken.",
      },
    ],
    relatedLinks: [
      { href: "/proefles/utrecht", label: "Proefles Utrecht" },
      { href: "/vergelijk/proefles-vs-direct-pakket", label: "Proefles vs direct pakket" },
      { href: "/instructeurs", label: "Vergelijk instructeurs" },
    ],
  },
];

export function getSeoComparisonBySlug(slug: string) {
  return seoComparisonPages.find((page) => page.slug === slug) ?? null;
}
