import type {
  Bericht,
  BeschikbaarheidSlot,
  Betaling,
  DashboardMetric,
  InstructeurProfiel,
  Les,
  LesAanvraag,
  Notificatie,
  Pakket,
  Review,
  SupportTicket,
  Voertuig,
} from "@/lib/types";

export const pakketten: Pakket[] = [
  {
    id: "losse-les",
    naam: "Losse les",
    prijs: 62,
    lessen: 1,
    les_type: "auto",
    icon_key: "calendar",
    visual_theme: "slate",
    sort_order: 1,
    cover_url:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    cover_position: "center",
    beschrijving: "Ideaal voor losse opfrislessen of een intake met een instructeur.",
  },
  {
    id: "starterspakket",
    naam: "Starterspakket",
    prijs: 549,
    lessen: 10,
    les_type: "auto",
    badge: "Populair",
    icon_key: "sparkles",
    visual_theme: "sky",
    uitgelicht: true,
    sort_order: 2,
    cover_url:
      "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1200&q=80",
    cover_position: "top",
    beschrijving:
      "Tien rijlessen, intake, digitale voortgangskaart en prioriteit bij plannen.",
  },
  {
    id: "examenpakket",
    naam: "Examenpakket",
    prijs: 1299,
    praktijk_examen_prijs: 289,
    lessen: 24,
    les_type: "auto",
    badge: "Beste waarde",
    icon_key: "shield",
    visual_theme: "violet",
    sort_order: 3,
    cover_url:
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
    cover_position: "right",
    beschrijving:
      "Voor leerlingen die richting examen werken, inclusief proefexamen en begeleiding.",
  },
  {
    id: "maatwerk",
    naam: "Maatwerk pakket",
    prijs: 0,
    lessen: 0,
    les_type: "auto",
    icon_key: "compass",
    visual_theme: "emerald",
    sort_order: 4,
    cover_url:
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80",
    cover_position: "left",
    beschrijving:
      "Persoonlijk samengesteld voor herintreders, spoedtrajecten en faalangstbegeleiding.",
  },
  {
    id: "motor-avb-traject",
    naam: "Motor AVB startpakket",
    prijs: 849,
    lessen: 8,
    les_type: "motor",
    badge: "Motor",
    icon_key: "zap",
    visual_theme: "emerald",
    sort_order: 5,
    cover_url:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
    cover_position: "center",
    beschrijving:
      "Gericht op voertuigbeheersing, AVB-onderdelen en een snelle, heldere basis voor motorrijders.",
  },
  {
    id: "vrachtwagen-c-traject",
    naam: "Vrachtwagen C-traject",
    prijs: 2590,
    lessen: 16,
    les_type: "vrachtwagen",
    badge: "C-rijbewijs",
    icon_key: "shield",
    visual_theme: "amber",
    sort_order: 6,
    cover_url:
      "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80",
    cover_position: "center",
    beschrijving:
      "Voor praktijktraining, routeopbouw en zelfverzekerd toewerken naar het vrachtwagenexamen.",
  },
];

export const instructeurs: InstructeurProfiel[] = [
  {
    id: "ins-1",
    slug: "sanne-van-dijk",
    volledige_naam: "Sanne van Dijk",
    email: "sanne@rijbasis.nl",
    telefoon: "06 14 52 88 11",
    avatar_url: null,
    rol: "instructeur",
    created_at: "2026-01-05",
    updated_at: "2026-04-20",
    bio: "Rustige, coachende instructeur met veel aandacht voor faalangst, examenvoorbereiding en stadsverkeer.",
    ervaring_jaren: 9,
    prijs_per_les: 64,
    beoordeling: 4.9,
    aantal_reviews: 132,
    transmissie: "beide",
    steden: ["Amsterdam", "Amstelveen", "Diemen"],
    specialisaties: ["Faalangst", "Spoedcursus", "Examentraining", "Motor"],
    profielfoto_kleur: "from-amber-300 via-orange-400 to-rose-500",
    status: "goedgekeurd",
    profiel_voltooid: 96,
  },
  {
    id: "ins-2",
    slug: "mo-haddad",
    volledige_naam: "Mo Haddad",
    email: "mo@rijbasis.nl",
    telefoon: "06 20 66 10 84",
    avatar_url: null,
    rol: "instructeur",
    created_at: "2025-11-18",
    updated_at: "2026-04-19",
    bio: "Resultaatgerichte instructeur voor leerlingen die structuur willen, met focus op automaat en zelfvertrouwen.",
    ervaring_jaren: 6,
    prijs_per_les: 59,
    beoordeling: 4.8,
    aantal_reviews: 87,
    transmissie: "automaat",
    steden: ["Utrecht", "Nieuwegein", "Houten"],
    specialisaties: ["Automaat", "Opfrislessen", "Beginners"],
    profielfoto_kleur: "from-sky-300 via-cyan-400 to-blue-600",
    status: "goedgekeurd",
    profiel_voltooid: 92,
  },
  {
    id: "ins-3",
    slug: "lisa-kramer",
    volledige_naam: "Lisa Kramer",
    email: "lisa@rijbasis.nl",
    telefoon: "06 31 09 44 72",
    avatar_url: null,
    rol: "instructeur",
    created_at: "2025-10-02",
    updated_at: "2026-04-18",
    bio: "Premium rijervaring met een sterke focus op examenroutes, fileparkeren en efficiënt plannen.",
    ervaring_jaren: 11,
    prijs_per_les: 68,
    beoordeling: 5,
    aantal_reviews: 201,
    transmissie: "handgeschakeld",
    steden: ["Rotterdam", "Schiedam", "Capelle aan den IJssel"],
    specialisaties: ["Examentraining", "Handgeschakeld", "Stadsverkeer", "Vrachtwagen"],
    profielfoto_kleur: "from-emerald-300 via-teal-400 to-cyan-600",
    status: "goedgekeurd",
    profiel_voltooid: 98,
  },
];

export const pakkettenPerInstructeur: Record<string, Pakket[]> = {
  "sanne-van-dijk": [
    {
      id: "sanne-intake",
      naam: "Intake & routecheck",
      prijs: 79,
      lessen: 1,
      les_type: "auto",
      badge: "Instap",
      icon_key: "calendar",
      visual_theme: "slate",
      sort_order: 1,
      cover_url:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      cover_position: "center",
      beschrijving:
        "Een rustige eerste les met rijscan, routecheck en een helder plan voor de volgende stappen.",
    },
    {
      id: "sanne-city-flow",
      naam: "City confidence pakket",
      prijs: 699,
      lessen: 10,
      les_type: "auto",
      badge: "Populair",
      icon_key: "sparkles",
      visual_theme: "sky",
      uitgelicht: true,
      sort_order: 2,
      cover_url:
        "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1200&q=80",
      cover_position: "top",
      beschrijving:
        "Voor stadsverkeer, faalangstbegeleiding en consistente opbouw richting zelfstandig rijden.",
    },
    {
      id: "sanne-examenklaar",
      naam: "Examenklaar traject",
      prijs: 1349,
      praktijk_examen_prijs: 295,
      lessen: 20,
      les_type: "auto",
      badge: "Examenfocus",
      icon_key: "shield",
      visual_theme: "violet",
      sort_order: 3,
      cover_url:
        "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
      cover_position: "right",
      beschrijving:
        "Intensief traject met proefexamen, examenroutes en extra focus op vertrouwen onder druk.",
    },
    {
      id: "sanne-motor-flow",
      naam: "Motor control traject",
      prijs: 1199,
      lessen: 12,
      les_type: "motor",
      badge: "AVB + AVD",
      icon_key: "zap",
      visual_theme: "emerald",
      sort_order: 4,
      cover_url:
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
      cover_position: "center",
      beschrijving:
        "Voor motorrijders die voertuigcontrole, verkeersdeelname en examenrit in een rustig traject willen opbouwen.",
    },
  ],
  "mo-haddad": [
    {
      id: "mo-automaat-start",
      naam: "Automaat startpakket",
      prijs: 599,
      lessen: 10,
      les_type: "auto",
      badge: "Automaat",
      icon_key: "gauge",
      visual_theme: "emerald",
      uitgelicht: true,
      sort_order: 1,
      cover_url:
        "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80",
      cover_position: "left",
      beschrijving:
        "Heldere basis voor beginnende leerlingen die structuur en rust zoeken in een automaattraject.",
    },
    {
      id: "mo-opfris",
      naam: "Opfris & zelfvertrouwen",
      prijs: 289,
      lessen: 4,
      les_type: "auto",
      badge: "Opfris",
      icon_key: "wallet",
      visual_theme: "amber",
      sort_order: 2,
      cover_url:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
      cover_position: "bottom",
      beschrijving:
        "Compact pakket voor herintreders en leerlingen die hun zekerheid snel willen terugpakken.",
    },
  ],
  "lisa-kramer": [
    {
      id: "lisa-premium",
      naam: "Premium examenpakket",
      prijs: 1499,
      praktijk_examen_prijs: 319,
      lessen: 22,
      les_type: "auto",
      badge: "Beste waarde",
      icon_key: "star",
      visual_theme: "rose",
      uitgelicht: true,
      sort_order: 1,
      cover_url:
        "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
      cover_position: "center",
      beschrijving:
        "Voor leerlingen die scherp willen plannen met veel aandacht voor examenroutes en precisie.",
    },
    {
      id: "lisa-fastlane",
      naam: "Fastlane spoedtraject",
      prijs: 1890,
      lessen: 28,
      les_type: "auto",
      badge: "Intensief",
      icon_key: "zap",
      visual_theme: "violet",
      sort_order: 2,
      cover_url:
        "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?auto=format&fit=crop&w=1200&q=80",
      cover_position: "top",
      beschrijving:
        "Hoog tempo, vaste structuur en extra begeleidingsmomenten voor snelle doorstroom richting examen.",
    },
    {
      id: "lisa-vrachtwagen-pro",
      naam: "Vrachtwagen pro pakket",
      prijs: 2890,
      lessen: 18,
      les_type: "vrachtwagen",
      badge: "Code 95",
      icon_key: "shield",
      visual_theme: "amber",
      sort_order: 3,
      cover_url:
        "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80",
      cover_position: "center",
      beschrijving:
        "Voor C-rijbewijs en praktijktraining met extra aandacht voor voertuiggevoel, planning en professioneel weggebruik.",
    },
  ],
};

export const reviewsPerInstructeur: Record<string, Review[]> = {
  "sanne-van-dijk": [
    {
      id: "rev-1",
      leerling_naam: "Mila Jansen",
      score: 5,
      titel: "Super rustige begeleiding",
      tekst: "Ik voelde me direct op mijn gemak. Sanne legt helder uit en maakt het plannen echt makkelijk.",
      datum: "12 april 2026",
    },
    {
      id: "rev-2",
      leerling_naam: "Noah de Vries",
      score: 5,
      titel: "Perfect voor examenstress",
      tekst: "Praktische tips, duidelijke feedback en veel rust in de auto. In een keer geslaagd.",
      datum: "3 april 2026",
    },
  ],
  "mo-haddad": [
    {
      id: "rev-3",
      leerling_naam: "Sara Akkermans",
      score: 5,
      titel: "Automaatlessen top geregeld",
      tekst: "Mo is duidelijk, vriendelijk en heel goed bereikbaar. Aanrader voor wie snel wil starten.",
      datum: "9 april 2026",
    },
  ],
  "lisa-kramer": [
    {
      id: "rev-4",
      leerling_naam: "Ruben van Leeuwen",
      score: 5,
      titel: "Professioneel en premium",
      tekst: "Zeer goede voorbereiding op lastige verkeerssituaties. Alles voelde strak en professioneel.",
      datum: "16 april 2026",
    },
  ],
};

export const beschikbaarheidPerInstructeur: Record<string, BeschikbaarheidSlot[]> = {
  "sanne-van-dijk": [
    {
      id: "b1",
      dag: "Maandag 27 april",
      tijdvak: "09:00 - 11:00",
      beschikbaar: true,
      start_at: "2026-04-27T09:00:00+02:00",
      eind_at: "2026-04-27T11:00:00+02:00",
    },
    {
      id: "b2",
      dag: "Dinsdag 28 april",
      tijdvak: "14:00 - 16:00",
      beschikbaar: true,
      start_at: "2026-04-28T14:00:00+02:00",
      eind_at: "2026-04-28T16:00:00+02:00",
    },
    {
      id: "b3",
      dag: "Donderdag 30 april",
      tijdvak: "18:30 - 20:30",
      beschikbaar: true,
      start_at: "2026-04-30T18:30:00+02:00",
      eind_at: "2026-04-30T20:30:00+02:00",
    },
  ],
  "mo-haddad": [
    {
      id: "b4",
      dag: "Woensdag 29 april",
      tijdvak: "08:30 - 10:30",
      beschikbaar: true,
      start_at: "2026-04-29T08:30:00+02:00",
      eind_at: "2026-04-29T10:30:00+02:00",
    },
    {
      id: "b5",
      dag: "Vrijdag 1 mei",
      tijdvak: "15:00 - 17:00",
      beschikbaar: true,
      start_at: "2026-05-01T15:00:00+02:00",
      eind_at: "2026-05-01T17:00:00+02:00",
    },
  ],
  "lisa-kramer": [
    {
      id: "b6",
      dag: "Maandag 27 april",
      tijdvak: "17:00 - 19:00",
      beschikbaar: true,
      start_at: "2026-04-27T17:00:00+02:00",
      eind_at: "2026-04-27T19:00:00+02:00",
    },
    {
      id: "b7",
      dag: "Zaterdag 2 mei",
      tijdvak: "10:00 - 12:00",
      beschikbaar: true,
      start_at: "2026-05-02T10:00:00+02:00",
      eind_at: "2026-05-02T12:00:00+02:00",
    },
  ],
};

export const leerlingMetrics: DashboardMetric[] = [
  { label: "Volgende les", waarde: "Morgen 18:30", context: "Met Sanne van Dijk in Amsterdam-Zuid" },
  { label: "Voortgang", waarde: "74%", context: "16 van 22 lesdoelen behaald" },
  { label: "Openstaand saldo", waarde: "€ 124", context: "1 factuur wacht op betaling" },
  { label: "Favoriete instructeurs", waarde: "3", context: "Nieuwe beschikbaarheid deze week" },
];

export const instructeurMetrics: DashboardMetric[] = [
  { label: "Lessen vandaag", waarde: "5", context: "2 ritten in Utrecht, 3 in Nieuwegein" },
  { label: "Open aanvragen", waarde: "8", context: "3 met hoge kans op omzetting" },
  { label: "Maandomzet", waarde: "€ 4.820", context: "12% hoger dan vorige maand" },
  { label: "Profiel compleet", waarde: "92%", context: "Voeg nog een certificaat toe" },
];

export const adminMetrics: DashboardMetric[] = [
  { label: "Actieve gebruikers", waarde: "1.284", context: "Over alle rollen binnen het platform" },
  { label: "Open goedkeuringen", waarde: "14", context: "Nieuwe instructeurs wachten op beoordeling" },
  { label: "Lessen deze week", waarde: "326", context: "Stijging van 18% ten opzichte van vorige week" },
  { label: "Support open", waarde: "11", context: "Gemiddelde oplostijd 3,8 uur" },
];

export const komendeLessen: Les[] = [
  {
    id: "les-1",
    titel: "Stadsrit en kruispunten",
    datum: "22 april 2026",
    tijd: "18:30",
    start_at: "2026-04-22T18:30:00+02:00",
    end_at: "2026-04-22T20:00:00+02:00",
    duur_minuten: 90,
    status: "ingepland",
    locatie: "Amsterdam Zuid",
    leerling_naam: "Mila Jansen",
    instructeur_naam: "Sanne van Dijk",
  },
  {
    id: "les-2",
    titel: "Bijzondere verrichtingen",
    datum: "24 april 2026",
    tijd: "16:00",
    start_at: "2026-04-24T16:00:00+02:00",
    end_at: "2026-04-24T17:00:00+02:00",
    duur_minuten: 60,
    status: "geaccepteerd",
    locatie: "Utrecht Leidsche Rijn",
    leerling_naam: "Sara Akkermans",
    instructeur_naam: "Mo Haddad",
  },
];

export const aanvragen: LesAanvraag[] = [
  {
    id: "req-1",
    leerling_naam: "Mila Jansen",
    instructeur_naam: "Sanne van Dijk",
    voorkeursdatum: "23 april 2026",
    start_at: "2026-04-23T19:00:00",
    end_at: "2026-04-23T20:30:00",
    tijdvak: "19:00 - 20:30",
    status: "aangevraagd",
    bericht: "Graag focus op snelweg en invoegen.",
  },
  {
    id: "req-2",
    leerling_naam: "Ruben van Leeuwen",
    instructeur_naam: "Lisa Kramer",
    voorkeursdatum: "25 april 2026",
    start_at: "2026-04-25T10:00:00",
    end_at: "2026-04-25T11:30:00",
    tijdvak: "10:00 - 11:30",
    status: "geaccepteerd",
    bericht: "Voorbereiding proefexamen.",
  },
];

export const betalingen: Betaling[] = [
  {
    id: "bet-1",
    omschrijving: "Starterspakket",
    bedrag: 549,
    status: "betaald",
    datum: "15 april 2026",
  },
  {
    id: "bet-2",
    omschrijving: "Extra losse les",
    bedrag: 62,
    status: "in_afwachting",
    datum: "19 april 2026",
  },
];

export const berichten: Bericht[] = [
  {
    id: "msg-1",
    afzender: "Sanne van Dijk",
    onderwerp: "Les van morgen bevestigd",
    preview: "Ik heb je les bevestigd en we starten bij Station Zuid.",
    tijd: "Vandaag, 14:12",
    ongelezen: true,
  },
  {
    id: "msg-2",
    afzender: "Support",
    onderwerp: "Je pakket is geactiveerd",
    preview: "Je starterspakket is gekoppeld aan je account.",
    tijd: "Gisteren, 10:04",
    ongelezen: false,
  },
];

export const notificaties: Notificatie[] = [
  {
    id: "not-1",
    titel: "Nieuwe beschikbaarheid",
    tekst: "Sanne heeft drie extra avondsloten toegevoegd.",
    tijd: "2 uur geleden",
    type: "info",
    ongelezen: true,
  },
  {
    id: "not-2",
    titel: "Lesaanvraag geaccepteerd",
    tekst: "Je aanvraag voor vrijdag 24 april is geaccepteerd.",
    tijd: "Vandaag",
    type: "succes",
    ongelezen: true,
  },
  {
    id: "not-3",
    titel: "Factuur bijna vervallen",
    tekst: "Rond je betaling binnen 2 dagen af om je planning te behouden.",
    tijd: "Gisteren",
    type: "waarschuwing",
    ongelezen: false,
  },
];

export const supportTickets: SupportTicket[] = [
  {
    id: "sup-1",
    onderwerp: "Onjuiste betaalstatus",
    status: "open",
    prioriteit: "hoog",
    gebruiker: "Mila Jansen",
  },
  {
    id: "sup-2",
    onderwerp: "Profielverificatie instructeur",
    status: "in_behandeling",
    prioriteit: "normaal",
    gebruiker: "Mo Haddad",
  },
];

export const voertuigen: Voertuig[] = [
  {
    id: "veh-1",
    model: "Volkswagen Golf",
    transmissie: "handgeschakeld",
    kenteken: "R-932-KL",
    status: "actief",
  },
  {
    id: "veh-2",
    model: "Tesla Model 3",
    transmissie: "automaat",
    kenteken: "X-184-JV",
    status: "onderhoud",
  },
];
