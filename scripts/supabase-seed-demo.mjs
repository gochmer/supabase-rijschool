import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const envText = readFileSync(".env.local", "utf8");

function getEnv(name) {
  const match = envText.match(new RegExp(`^${name}=(.*)$`, "m"));

  if (!match) {
    throw new Error(`Missing ${name} in .env.local`);
  }

  return match[1].trim();
}

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const accessToken = getEnv("SUPABASE_ACCESS_TOKEN");
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

const demoInstructors = [
  {
    email: "demo.sanne@rijbasis.example",
    volledigeNaam: "Sanne van Dijk",
    telefoon: "06 14 52 88 11",
    slug: "sanne-van-dijk",
    bio: "Rustige, coachende instructeur met veel aandacht voor faalangst, examenvoorbereiding en stadsverkeer.",
    ervaringJaren: 9,
    prijsPerLes: 64,
    beoordeling: 4.9,
    transmissie: "beide",
    werkgebied: ["Amsterdam", "Amstelveen", "Diemen"],
    specialisaties: ["Faalangst", "Spoedcursus", "Examentraining"],
    profielfotoKleur: "from-amber-300 via-orange-400 to-rose-500",
    profielCompleetheid: 96,
  },
  {
    email: "demo.mo@rijbasis.example",
    volledigeNaam: "Mo Haddad",
    telefoon: "06 20 66 10 84",
    slug: "mo-haddad",
    bio: "Resultaatgerichte instructeur voor leerlingen die structuur willen, met focus op automaat en zelfvertrouwen.",
    ervaringJaren: 6,
    prijsPerLes: 59,
    beoordeling: 4.8,
    transmissie: "automaat",
    werkgebied: ["Utrecht", "Nieuwegein", "Houten"],
    specialisaties: ["Automaat", "Opfrislessen", "Beginners"],
    profielfotoKleur: "from-sky-300 via-cyan-400 to-blue-600",
    profielCompleetheid: 92,
  },
  {
    email: "demo.lisa@rijbasis.example",
    volledigeNaam: "Lisa Kramer",
    telefoon: "06 31 09 44 72",
    slug: "lisa-kramer",
    bio: "Premium rijervaring met een sterke focus op examenroutes, fileparkeren en efficient plannen.",
    ervaringJaren: 11,
    prijsPerLes: 68,
    beoordeling: 5,
    transmissie: "handgeschakeld",
    werkgebied: ["Rotterdam", "Schiedam", "Capelle aan den IJssel"],
    specialisaties: ["Examentraining", "Handgeschakeld", "Stadsverkeer"],
    profielfotoKleur: "from-emerald-300 via-teal-400 to-cyan-600",
    profielCompleetheid: 98,
  },
];

const demoLearners = [
  {
    email: "demo.mila@rijbasis.example",
    volledigeNaam: "Mila Jansen",
    telefoon: "06 88 10 22 33",
    voortgangPercentage: 74,
    packageKey: "sanne-premium",
  },
  {
    email: "demo.noah@rijbasis.example",
    volledigeNaam: "Noah de Vries",
    telefoon: "06 77 15 23 90",
    voortgangPercentage: 61,
    packageKey: "lisa-examen",
  },
  {
    email: "demo.sara@rijbasis.example",
    volledigeNaam: "Sara Akkermans",
    telefoon: "06 81 45 39 12",
    voortgangPercentage: 42,
    packageKey: "mo-automaat",
  },
  {
    email: "demo.ruben@rijbasis.example",
    volledigeNaam: "Ruben van Leeuwen",
    telefoon: "06 11 28 45 68",
    voortgangPercentage: 87,
    packageKey: "lisa-premium",
  },
];

const demoReviews = [
  {
    leerlingEmail: "demo.mila@rijbasis.example",
    instructeurEmail: "demo.sanne@rijbasis.example",
    score: 5,
    titel: "Super rustige begeleiding",
    tekst: "Ik voelde me direct op mijn gemak. Sanne legt helder uit en maakt het plannen echt makkelijk.",
    createdAt: "2026-04-12T10:15:00+02:00",
  },
  {
    leerlingEmail: "demo.noah@rijbasis.example",
    instructeurEmail: "demo.sanne@rijbasis.example",
    score: 5,
    titel: "Perfect voor examenstress",
    tekst: "Praktische tips, duidelijke feedback en veel rust in de auto. In een keer geslaagd.",
    createdAt: "2026-04-03T18:40:00+02:00",
  },
  {
    leerlingEmail: "demo.sara@rijbasis.example",
    instructeurEmail: "demo.mo@rijbasis.example",
    score: 5,
    titel: "Automaatlessen top geregeld",
    tekst: "Mo is duidelijk, vriendelijk en heel goed bereikbaar. Aanrader voor wie snel wil starten.",
    createdAt: "2026-04-09T14:20:00+02:00",
  },
  {
    leerlingEmail: "demo.ruben@rijbasis.example",
    instructeurEmail: "demo.lisa@rijbasis.example",
    score: 5,
    titel: "Professioneel en premium",
    tekst: "Zeer goede voorbereiding op lastige verkeerssituaties. Alles voelde strak en professioneel.",
    createdAt: "2026-04-16T11:00:00+02:00",
  },
];

const demoAvailability = [
  {
    instructeurEmail: "demo.sanne@rijbasis.example",
    startAt: "2026-04-27T09:00:00+02:00",
    eindAt: "2026-04-27T11:00:00+02:00",
  },
  {
    instructeurEmail: "demo.sanne@rijbasis.example",
    startAt: "2026-04-29T18:30:00+02:00",
    eindAt: "2026-04-29T20:30:00+02:00",
  },
  {
    instructeurEmail: "demo.mo@rijbasis.example",
    startAt: "2026-04-30T08:30:00+02:00",
    eindAt: "2026-04-30T10:30:00+02:00",
  },
  {
    instructeurEmail: "demo.lisa@rijbasis.example",
    startAt: "2026-05-02T10:00:00+02:00",
    eindAt: "2026-05-02T12:00:00+02:00",
  },
];

const demoWeekRules = [
  {
    instructeurEmail: "demo.sanne@rijbasis.example",
    weekdag: 1,
    startTijd: "09:00",
    eindTijd: "17:00",
    pauzeStartTijd: "12:30",
    pauzeEindTijd: "13:00",
    beschikbaar: true,
  },
  {
    instructeurEmail: "demo.sanne@rijbasis.example",
    weekdag: 3,
    startTijd: "18:00",
    eindTijd: "21:00",
    beschikbaar: true,
  },
  {
    instructeurEmail: "demo.sanne@rijbasis.example",
    weekdag: 6,
    startTijd: "09:30",
    eindTijd: "14:00",
    beschikbaar: true,
  },
  {
    instructeurEmail: "demo.mo@rijbasis.example",
    weekdag: 2,
    startTijd: "08:30",
    eindTijd: "16:30",
    pauzeStartTijd: "12:00",
    pauzeEindTijd: "12:45",
    beschikbaar: true,
  },
  {
    instructeurEmail: "demo.mo@rijbasis.example",
    weekdag: 4,
    startTijd: "17:30",
    eindTijd: "20:30",
    beschikbaar: true,
  },
  {
    instructeurEmail: "demo.lisa@rijbasis.example",
    weekdag: 2,
    startTijd: "10:00",
    eindTijd: "18:00",
    pauzeStartTijd: "13:30",
    pauzeEindTijd: "14:15",
    beschikbaar: true,
  },
  {
    instructeurEmail: "demo.lisa@rijbasis.example",
    weekdag: 5,
    startTijd: "09:00",
    eindTijd: "15:00",
    beschikbaar: true,
  },
  {
    instructeurEmail: "demo.lisa@rijbasis.example",
    weekdag: 6,
    startTijd: "10:00",
    eindTijd: "13:00",
    beschikbaar: true,
  },
];

const demoPackages = [
  {
    key: "sanne-premium",
    instructeurEmail: "demo.sanne@rijbasis.example",
    naam: "Premium examentraject",
    badge: "Examfocus",
    beschrijving: "Voor leerlingen die scherp willen plannen met veel aandacht voor examenroutes en zelfvertrouwen.",
    prijs: 1499,
    aantalLessen: 22,
    lesType: "auto",
    praktijkExamenPrijs: 295,
    uitgelicht: true,
    sortOrder: 1,
    iconKey: "sparkles",
    visualTheme: "sky",
  },
  {
    key: "sanne-starter",
    instructeurEmail: "demo.sanne@rijbasis.example",
    naam: "Starterspakket",
    badge: "Instap",
    beschrijving: "Rustige eerste reeks lessen om basisbediening, kijkgedrag en vertrouwen goed op te bouwen.",
    prijs: 699,
    aantalLessen: 10,
    lesType: "auto",
    praktijkExamenPrijs: null,
    uitgelicht: false,
    sortOrder: 2,
    iconKey: "map",
    visualTheme: "slate",
  },
  {
    key: "mo-automaat",
    instructeurEmail: "demo.mo@rijbasis.example",
    naam: "Automaat comforttraject",
    badge: "Automaat",
    beschrijving: "Duidelijke automaatlessen met structuur, opfrisruimte en extra rust voor starters.",
    prijs: 1199,
    aantalLessen: 18,
    lesType: "auto",
    praktijkExamenPrijs: 275,
    uitgelicht: true,
    sortOrder: 1,
    iconKey: "shield",
    visualTheme: "sky",
  },
  {
    key: "lisa-examen",
    instructeurEmail: "demo.lisa@rijbasis.example",
    naam: "Examenpakket handgeschakeld",
    badge: "Praktijk-examen",
    beschrijving: "Premium traject voor handgeschakeld rijden met focus op fileparkeren, routes en examendruk.",
    prijs: 1599,
    aantalLessen: 24,
    lesType: "auto",
    praktijkExamenPrijs: 310,
    uitgelicht: true,
    sortOrder: 1,
    iconKey: "sparkles",
    visualTheme: "sky",
  },
  {
    key: "lisa-premium",
    instructeurEmail: "demo.lisa@rijbasis.example",
    naam: "Premium rijtraject",
    badge: "Populair",
    beschrijving: "Voor leerlingen die premium begeleiding willen met duidelijke feedback en hoog lestempo.",
    prijs: 1299,
    aantalLessen: 18,
    lesType: "auto",
    praktijkExamenPrijs: null,
    uitgelicht: false,
    sortOrder: 2,
    iconKey: "flag",
    visualTheme: "slate",
  },
];

const demoLessonRequests = [
  {
    learnerEmail: "demo.sara@rijbasis.example",
    instructorEmail: "demo.mo@rijbasis.example",
    packageKey: "mo-automaat",
    voorkeursdatum: "2026-04-29",
    tijdvak: "18:00 - 19:30",
    status: "aangevraagd",
    bericht: "Ik wil graag rustig starten met automaat en duidelijke uitleg in druk verkeer.",
    aanvraagType: "pakket",
    createdAt: "2026-04-24T10:20:00+02:00",
  },
  {
    learnerEmail: "demo.noah@rijbasis.example",
    instructorEmail: "demo.lisa@rijbasis.example",
    packageKey: "lisa-examen",
    voorkeursdatum: "2026-04-30",
    tijdvak: "16:30 - 18:00",
    status: "geaccepteerd",
    bericht: "Ik wil echt gericht naar mijn praktijkexamen toewerken en sneller op niveau komen.",
    aanvraagType: "pakket",
    createdAt: "2026-04-22T14:10:00+02:00",
  },
  {
    learnerEmail: "demo.ruben@rijbasis.example",
    instructorEmail: "demo.lisa@rijbasis.example",
    packageKey: "lisa-premium",
    voorkeursdatum: "2026-05-01",
    tijdvak: "10:00 - 11:30",
    status: "ingepland",
    bericht: "Graag een premium vervolgtraject om de laatste examenonderdelen strak af te ronden.",
    aanvraagType: "pakket",
    createdAt: "2026-04-18T09:00:00+02:00",
  },
  {
    learnerEmail: "demo.mila@rijbasis.example",
    instructorEmail: "demo.sanne@rijbasis.example",
    voorkeursdatum: "2026-05-03",
    tijdvak: "11:00 - 12:00",
    status: "aangevraagd",
    bericht: "Ik wil graag een proefles voor mijn zus plannen om te kijken of de stijl past.",
    aanvraagType: "proefles",
    createdAt: "2026-04-25T12:15:00+02:00",
  },
];

const demoLessons = [
  {
    learnerEmail: "demo.mila@rijbasis.example",
    instructorEmail: "demo.sanne@rijbasis.example",
    titel: "Les 8 - Binnenstad en kruispunten",
    startAt: "2026-04-28T18:30:00+02:00",
    duurMinuten: 90,
    status: "ingepland",
    notities: "Focus op voorsorteren, ritme bij kruispunten en vlotter wegrijden.",
    createdAt: "2026-04-21T09:00:00+02:00",
  },
  {
    learnerEmail: "demo.mila@rijbasis.example",
    instructorEmail: "demo.sanne@rijbasis.example",
    titel: "Les 7 - Spiegelroutine en stadsverkeer",
    startAt: "2026-04-23T18:30:00+02:00",
    duurMinuten: 90,
    status: "afgerond",
    notities: "Sterke les, spiegelgebruik rustiger en consequenter.",
    createdAt: "2026-04-16T09:00:00+02:00",
  },
  {
    learnerEmail: "demo.noah@rijbasis.example",
    instructorEmail: "demo.lisa@rijbasis.example",
    titel: "Les 12 - Examenroutes en fileparkeren",
    startAt: "2026-04-30T16:30:00+02:00",
    duurMinuten: 90,
    status: "ingepland",
    notities: "Examendruk simuleren, handgeschakeld schakelen onder spanning.",
    createdAt: "2026-04-20T11:00:00+02:00",
  },
  {
    learnerEmail: "demo.ruben@rijbasis.example",
    instructorEmail: "demo.lisa@rijbasis.example",
    titel: "Les 18 - Praktijkcheck voor examen",
    startAt: "2026-05-01T10:00:00+02:00",
    duurMinuten: 90,
    status: "ingepland",
    notities: "Laatste check op kijktechniek, parkeren en verkeersinzicht.",
    createdAt: "2026-04-17T08:30:00+02:00",
  },
  {
    learnerEmail: "demo.ruben@rijbasis.example",
    instructorEmail: "demo.lisa@rijbasis.example",
    titel: "Les 17 - Snelweg en inhalen",
    startAt: "2026-04-22T10:00:00+02:00",
    duurMinuten: 90,
    status: "afgerond",
    notities: "Sterke les met stabiele kijkroutine en rustige invoegmomenten.",
    createdAt: "2026-04-14T08:30:00+02:00",
  },
  {
    learnerEmail: "demo.sara@rijbasis.example",
    instructorEmail: "demo.mo@rijbasis.example",
    titel: "Proefles automaat - eerste kennismaking",
    startAt: "2026-05-02T09:30:00+02:00",
    duurMinuten: 60,
    status: "geaccepteerd",
    notities: "Kennismaking, basisbediening en vertrouwen in de auto.",
    createdAt: "2026-04-24T15:00:00+02:00",
  },
];

const demoPlanningRights = [
  {
    learnerEmail: "demo.mila@rijbasis.example",
    instructorEmail: "demo.sanne@rijbasis.example",
    zelfInplannenToegestaan: true,
    vrijgegevenAt: "2026-04-20T09:00:00+02:00",
  },
  {
    learnerEmail: "demo.noah@rijbasis.example",
    instructorEmail: "demo.lisa@rijbasis.example",
    zelfInplannenToegestaan: false,
    vrijgegevenAt: null,
  },
  {
    learnerEmail: "demo.ruben@rijbasis.example",
    instructorEmail: "demo.lisa@rijbasis.example",
    zelfInplannenToegestaan: true,
    vrijgegevenAt: "2026-04-18T10:00:00+02:00",
  },
];

const demoProgressAssessments = [
  {
    learnerEmail: "demo.mila@rijbasis.example",
    instructorEmail: "demo.sanne@rijbasis.example",
    vaardigheidKey: "voorbereiding",
    beoordelingsDatum: "2026-04-23",
    status: "zelfstandig",
    notitie: "Rustige voorbereiding en duidelijke instaproutine.",
  },
  {
    learnerEmail: "demo.mila@rijbasis.example",
    instructorEmail: "demo.sanne@rijbasis.example",
    vaardigheidKey: "kijkgedrag",
    beoordelingsDatum: "2026-04-23",
    status: "begeleid",
    notitie: "Spiegels goed, nog iets eerder hoofdbeweging bij kruispunten.",
  },
  {
    learnerEmail: "demo.noah@rijbasis.example",
    instructorEmail: "demo.lisa@rijbasis.example",
    vaardigheidKey: "schakelen",
    beoordelingsDatum: "2026-04-21",
    status: "herhaling",
    notitie: "Schakelritme onder druk nog niet stabiel genoeg.",
  },
  {
    learnerEmail: "demo.noah@rijbasis.example",
    instructorEmail: "demo.lisa@rijbasis.example",
    vaardigheidKey: "parkeren",
    beoordelingsDatum: "2026-04-21",
    status: "begeleid",
    notitie: "Fileparkeren technisch goed, maar nog te afhankelijk van hulp.",
  },
  {
    learnerEmail: "demo.ruben@rijbasis.example",
    instructorEmail: "demo.lisa@rijbasis.example",
    vaardigheidKey: "kruispunten",
    beoordelingsDatum: "2026-04-22",
    status: "zelfstandig",
    notitie: "Mooi verkeersoverzicht en goed tempo in lastige situaties.",
  },
  {
    learnerEmail: "demo.ruben@rijbasis.example",
    instructorEmail: "demo.lisa@rijbasis.example",
    vaardigheidKey: "kijkgedrag",
    beoordelingsDatum: "2026-04-22",
    status: "zelfstandig",
    notitie: "Stabiele kijkroutine, klaar voor praktijkcheck.",
  },
];

const demoProgressNotes = [
  {
    learnerEmail: "demo.mila@rijbasis.example",
    instructorEmail: "demo.sanne@rijbasis.example",
    lesdatum: "2026-04-23",
    samenvatting: "Sterke rit met meer rust op kruispunten en een betere spiegelroutine in de binnenstad.",
    sterkPunt: "Voorbereiding en voertuigcontrole voelen steeds zelfstandiger.",
    focusVolgendeLes: "Meer ritme in stadsverkeer en vloeiender afslaan naar rechts.",
  },
  {
    learnerEmail: "demo.noah@rijbasis.example",
    instructorEmail: "demo.lisa@rijbasis.example",
    lesdatum: "2026-04-21",
    samenvatting: "Noah is gemotiveerd, maar schakelen kost nog te veel aandacht in drukkere situaties.",
    sterkPunt: "Goede inzet en nette houding tijdens uitleg.",
    focusVolgendeLes: "Schakelautomatisme en fileparkeren onder examendruk.",
  },
  {
    learnerEmail: "demo.ruben@rijbasis.example",
    instructorEmail: "demo.lisa@rijbasis.example",
    lesdatum: "2026-04-22",
    samenvatting: "Ruben rijdt stabiel en laat op meerdere onderdelen examenniveau zien.",
    sterkPunt: "Kijkgedrag en snelwegritme zijn sterk en zelfverzekerd.",
    focusVolgendeLes: "Laatste fine-tuning op parkeren en praktijkcheck.",
  },
];

const demoMessages = [
  {
    fromEmail: "demo.sanne@rijbasis.example",
    toEmail: "demo.mila@rijbasis.example",
    onderwerp: "Les van dinsdag staat klaar",
    inhoud: "Ik heb dinsdag 18:30 ingepland. Neem je reflectieformulier nog even mee.",
    gelezen: false,
    createdAt: "2026-04-25T09:20:00+02:00",
  },
  {
    fromEmail: "demo.mila@rijbasis.example",
    toEmail: "demo.sanne@rijbasis.example",
    onderwerp: "Vraag over kruispunten",
    inhoud: "Kunnen we volgende les nog kort extra oefenen op voorsorteren in de stad?",
    gelezen: true,
    createdAt: "2026-04-25T10:05:00+02:00",
  },
  {
    fromEmail: "demo.lisa@rijbasis.example",
    toEmail: "demo.noah@rijbasis.example",
    onderwerp: "Route voor donderdag",
    inhoud: "Donderdag pakken we examenroutes en fileparkeren. Zorg dat je op tijd bent.",
    gelezen: false,
    createdAt: "2026-04-24T16:00:00+02:00",
  },
];

const demoPayments = [
  {
    learnerEmail: "demo.mila@rijbasis.example",
    packageKey: "sanne-premium",
    bedrag: 749.5,
    status: "betaald",
    provider: "ideal",
    betaaldAt: "2026-04-15T13:05:00+02:00",
    createdAt: "2026-04-15T12:55:00+02:00",
  },
  {
    learnerEmail: "demo.noah@rijbasis.example",
    packageKey: "lisa-examen",
    bedrag: 1599,
    status: "open",
    provider: "factuur",
    betaaldAt: null,
    createdAt: "2026-04-20T09:10:00+02:00",
  },
  {
    learnerEmail: "demo.ruben@rijbasis.example",
    packageKey: "lisa-premium",
    bedrag: 1299,
    status: "betaald",
    provider: "ideal",
    betaaldAt: "2026-04-10T11:20:00+02:00",
    createdAt: "2026-04-10T11:00:00+02:00",
  },
];

async function fetchJson(url, init) {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return response.json();
}

async function getServerKey() {
  const apiKeys = await fetchJson(
    `https://api.supabase.com/v1/projects/${projectRef}/api-keys?reveal=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const preferredKey =
    apiKeys.find((key) => key.name === "service_role")?.api_key ??
    apiKeys.find((key) => key.name === "secret")?.api_key ??
    apiKeys.find(
      (key) =>
        key.type === "legacy" &&
        typeof key.name === "string" &&
        key.name.includes("service")
    )?.api_key;

  if (!preferredKey) {
    throw new Error("Could not resolve a server-side API key for this project.");
  }

  return preferredKey;
}

async function listAllUsers(adminClient) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    users.push(...data.users);

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return users;
}

async function waitForProfile(supabase, userId) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Profile row for ${userId} was not created in time.`);
}

async function ensureAuthUsers(adminClient, definitions, role) {
  const existingUsers = await listAllUsers(adminClient);
  const byEmail = new Map(
    existingUsers
      .filter((user) => typeof user.email === "string")
      .map((user) => [user.email.toLowerCase(), user])
  );

  const ensuredUsers = [];

  for (const definition of definitions) {
    const emailKey = definition.email.toLowerCase();
    const existing = byEmail.get(emailKey);
    const metadata = {
      volledige_naam: definition.volledigeNaam,
      telefoon: definition.telefoon,
      rol: role,
      bio: "bio" in definition ? definition.bio : "",
    };

    if (existing) {
      const { error } = await adminClient.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
        user_metadata: metadata,
      });

      if (error) {
        throw error;
      }

      ensuredUsers.push({ ...definition, id: existing.id });
      continue;
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email: definition.email,
      password: `Seed-${randomUUID()}-Aa1!`,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error) {
      throw error;
    }

    ensuredUsers.push({ ...definition, id: data.user.id });
  }

  return ensuredUsers;
}

async function upsertProfiles(supabase, users, role) {
  const rows = users.map((user) => ({
    id: user.id,
    volledige_naam: user.volledigeNaam,
    email: user.email,
    telefoon: user.telefoon,
    avatar_url: null,
    rol: role,
  }));

  const { error } = await supabase
    .from("profiles")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    throw error;
  }
}

async function upsertLearners(supabase, learners) {
  const rows = learners.map((learner) => ({
    profile_id: learner.id,
    voortgang_percentage: learner.voortgangPercentage,
  }));

  const { error } = await supabase
    .from("leerlingen")
    .upsert(rows, { onConflict: "profile_id" });

  if (error) {
    throw error;
  }
}

async function upsertInstructors(supabase, instructors) {
  const rows = instructors.map((instructor) => ({
    profile_id: instructor.id,
    slug: instructor.slug,
    volledige_naam: instructor.volledigeNaam,
    avatar_url: null,
    bio: instructor.bio,
    ervaring_jaren: instructor.ervaringJaren,
    werkgebied: instructor.werkgebied,
    prijs_per_les: instructor.prijsPerLes,
    transmissie: instructor.transmissie,
    beoordeling: instructor.beoordeling,
    profiel_status: "goedgekeurd",
    profiel_compleetheid: instructor.profielCompleetheid,
    specialisaties: instructor.specialisaties,
    profielfoto_kleur: instructor.profielfotoKleur,
  }));

  const { error } = await supabase
    .from("instructeurs")
    .upsert(rows, { onConflict: "profile_id" });

  if (error) {
    throw error;
  }
}

async function ensureReviews(supabase, instructorByEmail, learnerByEmail) {
  for (const review of demoReviews) {
    const instructeurId = instructorByEmail.get(review.instructeurEmail)?.id;
    const leerlingId = learnerByEmail.get(review.leerlingEmail)?.id;

    if (!instructeurId || !leerlingId) {
      throw new Error(`Missing seed ids for review ${review.titel}`);
    }

    const { data: existing, error: selectError } = await supabase
      .from("reviews")
      .select("id")
      .eq("instructeur_id", instructeurId)
      .eq("leerling_id", leerlingId)
      .eq("titel", review.titel)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    if (existing) {
      continue;
    }

    const { error: insertError } = await supabase.from("reviews").insert({
      instructeur_id: instructeurId,
      leerling_id: leerlingId,
      score: review.score,
      titel: review.titel,
      tekst: review.tekst,
      created_at: review.createdAt,
    });

    if (insertError) {
      throw insertError;
    }
  }
}

async function ensureAvailability(supabase, instructorByEmail) {
  for (const slot of demoAvailability) {
    const instructeurId = instructorByEmail.get(slot.instructeurEmail)?.id;

    if (!instructeurId) {
      throw new Error(`Missing instructor id for slot ${slot.startAt}`);
    }

    const { data: existing, error: selectError } = await supabase
      .from("beschikbaarheid")
      .select("id")
      .eq("instructeur_id", instructeurId)
      .eq("start_at", slot.startAt)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    if (existing) {
      continue;
    }

    const { error: insertError } = await supabase.from("beschikbaarheid").insert({
      instructeur_id: instructeurId,
      start_at: slot.startAt,
      eind_at: slot.eindAt,
      beschikbaar: true,
    });

    if (insertError) {
      throw insertError;
    }
  }
}

async function ensureWeekRules(supabase, instructorByEmail) {
  for (const rule of demoWeekRules) {
    const instructeurId = instructorByEmail.get(rule.instructeurEmail)?.id;

    if (!instructeurId) {
      throw new Error(`Missing instructor id for week rule ${rule.instructeurEmail}`);
    }

    const { data: existing, error: selectError } = await supabase
      .from("beschikbaarheid_weekroosters")
      .select("id")
      .eq("instructeur_id", instructeurId)
      .eq("weekdag", rule.weekdag)
      .eq("start_tijd", rule.startTijd)
      .eq("eind_tijd", rule.eindTijd)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    const payload = {
      instructeur_id: instructeurId,
      weekdag: rule.weekdag,
      start_tijd: rule.startTijd,
      eind_tijd: rule.eindTijd,
      pauze_start_tijd: rule.pauzeStartTijd ?? null,
      pauze_eind_tijd: rule.pauzeEindTijd ?? null,
      beschikbaar: rule.beschikbaar,
      actief: true,
    };

    if (existing) {
      const { error: updateError } = await supabase
        .from("beschikbaarheid_weekroosters")
        .update(payload)
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from("beschikbaarheid_weekroosters")
        .insert(payload);

      if (insertError) {
        throw insertError;
      }
    }
  }
}

async function ensurePackages(supabase, instructorByEmail) {
  const packageByKey = new Map();

  for (const pkg of demoPackages) {
    const instructeurId = instructorByEmail.get(pkg.instructeurEmail)?.id;

    if (!instructeurId) {
      throw new Error(`Missing instructor id for package ${pkg.naam}`);
    }

    const { data: existing, error: selectError } = await supabase
      .from("pakketten")
      .select("id")
      .eq("instructeur_id", instructeurId)
      .eq("naam", pkg.naam)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    const payload = {
      instructeur_id: instructeurId,
      naam: pkg.naam,
      badge: pkg.badge,
      beschrijving: pkg.beschrijving,
      prijs: pkg.prijs,
      aantal_lessen: pkg.aantalLessen,
      actief: true,
      uitgelicht: pkg.uitgelicht,
      sort_order: pkg.sortOrder,
      icon_key: pkg.iconKey,
      visual_theme: pkg.visualTheme,
      les_type: pkg.lesType,
      praktijk_examen_prijs: pkg.praktijkExamenPrijs,
    };

    if (existing) {
      const { error: updateError } = await supabase
        .from("pakketten")
        .update(payload)
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }

      packageByKey.set(pkg.key, { id: existing.id, ...payload });
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("pakketten")
        .insert(payload)
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      packageByKey.set(pkg.key, { id: inserted.id, ...payload });
    }
  }

  return packageByKey;
}

async function attachLearnerPackages(supabase, learnerByEmail, packageByKey) {
  for (const learner of demoLearners) {
    const leerlingId = learnerByEmail.get(learner.email)?.id;
    const pakketId = learner.packageKey ? packageByKey.get(learner.packageKey)?.id : null;

    if (!leerlingId || !pakketId) {
      continue;
    }

    const { error } = await supabase
      .from("leerlingen")
      .update({ pakket_id: pakketId })
      .eq("id", leerlingId);

    if (error) {
      throw error;
    }
  }
}

async function ensureLessonRequests(supabase, instructorByEmail, learnerByEmail, packageByKey) {
  for (const request of demoLessonRequests) {
    const instructeurId = instructorByEmail.get(request.instructorEmail)?.id;
    const leerlingId = learnerByEmail.get(request.learnerEmail)?.id;
    const pakket = request.packageKey ? packageByKey.get(request.packageKey) : null;

    if (!instructeurId || !leerlingId) {
      throw new Error(`Missing ids for lesson request ${request.learnerEmail}`);
    }

    const { data: existing, error: selectError } = await supabase
      .from("lesaanvragen")
      .select("id")
      .eq("leerling_id", leerlingId)
      .eq("instructeur_id", instructeurId)
      .eq("voorkeursdatum", request.voorkeursdatum)
      .eq("tijdvak", request.tijdvak)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    const payload = {
      leerling_id: leerlingId,
      instructeur_id: instructeurId,
      voorkeursdatum: request.voorkeursdatum,
      tijdvak: request.tijdvak,
      status: request.status,
      bericht: request.bericht,
      aanvraag_type: request.aanvraagType,
      pakket_id: pakket?.id ?? null,
      pakket_naam_snapshot: pakket?.naam ?? (request.aanvraagType === "proefles" ? "Proefles" : null),
      les_type: pakket?.les_type ?? null,
      created_at: request.createdAt,
    };

    if (existing) {
      const { error: updateError } = await supabase
        .from("lesaanvragen")
        .update(payload)
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from("lesaanvragen")
        .insert(payload);

      if (insertError) {
        throw insertError;
      }
    }
  }
}

async function ensureLessons(supabase, instructorByEmail, learnerByEmail) {
  for (const lesson of demoLessons) {
    const instructeurId = instructorByEmail.get(lesson.instructorEmail)?.id;
    const leerlingId = learnerByEmail.get(lesson.learnerEmail)?.id;

    if (!instructeurId || !leerlingId) {
      throw new Error(`Missing ids for lesson ${lesson.titel}`);
    }

    const { data: existing, error: selectError } = await supabase
      .from("lessen")
      .select("id")
      .eq("leerling_id", leerlingId)
      .eq("instructeur_id", instructeurId)
      .eq("titel", lesson.titel)
      .eq("start_at", lesson.startAt)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    const payload = {
      leerling_id: leerlingId,
      instructeur_id: instructeurId,
      titel: lesson.titel,
      start_at: lesson.startAt,
      duur_minuten: lesson.duurMinuten,
      status: lesson.status,
      notities: lesson.notities,
      created_at: lesson.createdAt,
    };

    if (existing) {
      const { error: updateError } = await supabase
        .from("lessen")
        .update(payload)
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from("lessen")
        .insert(payload);

      if (insertError) {
        throw insertError;
      }
    }
  }
}

async function ensurePlanningRights(supabase, instructorByEmail, learnerByEmail) {
  const rows = demoPlanningRights
    .map((access) => {
      const instructeurId = instructorByEmail.get(access.instructorEmail)?.id;
      const leerlingId = learnerByEmail.get(access.learnerEmail)?.id;

      if (!instructeurId || !leerlingId) {
        return null;
      }

      return {
        instructeur_id: instructeurId,
        leerling_id: leerlingId,
        zelf_inplannen_toegestaan: access.zelfInplannenToegestaan,
        vrijgegeven_at: access.vrijgegevenAt,
      };
    })
    .filter(Boolean);

  if (!rows.length) {
    return;
  }

  const { error } = await supabase
    .from("leerling_planningsrechten")
    .upsert(rows, { onConflict: "leerling_id,instructeur_id" });

  if (error) {
    throw error;
  }
}

async function ensureProgressAssessments(supabase, instructorByEmail, learnerByEmail) {
  const rows = demoProgressAssessments
    .map((assessment) => {
      const instructeurId = instructorByEmail.get(assessment.instructorEmail)?.id;
      const leerlingId = learnerByEmail.get(assessment.learnerEmail)?.id;

      if (!instructeurId || !leerlingId) {
        return null;
      }

      return {
        leerling_id: leerlingId,
        instructeur_id: instructeurId,
        vaardigheid_key: assessment.vaardigheidKey,
        beoordelings_datum: assessment.beoordelingsDatum,
        status: assessment.status,
        notitie: assessment.notitie,
      };
    })
    .filter(Boolean);

  if (!rows.length) {
    return;
  }

  const { error } = await supabase
    .from("leerling_voortgang_beoordelingen")
    .upsert(rows, {
      onConflict: "leerling_id,instructeur_id,vaardigheid_key,beoordelings_datum",
    });

  if (error) {
    throw error;
  }
}

async function ensureProgressNotes(supabase, instructorByEmail, learnerByEmail) {
  const rows = demoProgressNotes
    .map((note) => {
      const instructeurId = instructorByEmail.get(note.instructorEmail)?.id;
      const leerlingId = learnerByEmail.get(note.learnerEmail)?.id;

      if (!instructeurId || !leerlingId) {
        return null;
      }

      return {
        leerling_id: leerlingId,
        instructeur_id: instructeurId,
        lesdatum: note.lesdatum,
        samenvatting: note.samenvatting,
        sterk_punt: note.sterkPunt,
        focus_volgende_les: note.focusVolgendeLes,
      };
    })
    .filter(Boolean);

  if (!rows.length) {
    return;
  }

  const { error } = await supabase
    .from("leerling_voortgang_lesnotities")
    .upsert(rows, { onConflict: "leerling_id,instructeur_id,lesdatum" });

  if (error) {
    throw error;
  }
}

async function ensureMessages(supabase, profileByEmail) {
  for (const message of demoMessages) {
    const afzenderId = profileByEmail.get(message.fromEmail)?.id;
    const ontvangerId = profileByEmail.get(message.toEmail)?.id;

    if (!afzenderId || !ontvangerId) {
      throw new Error(`Missing profile ids for message ${message.onderwerp}`);
    }

    const { data: existing, error: selectError } = await supabase
      .from("berichten")
      .select("id")
      .eq("afzender_profiel_id", afzenderId)
      .eq("ontvanger_profiel_id", ontvangerId)
      .eq("onderwerp", message.onderwerp)
      .eq("created_at", message.createdAt)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    const payload = {
      afzender_profiel_id: afzenderId,
      ontvanger_profiel_id: ontvangerId,
      onderwerp: message.onderwerp,
      inhoud: message.inhoud,
      gelezen: message.gelezen,
      created_at: message.createdAt,
    };

    if (existing) {
      const { error: updateError } = await supabase
        .from("berichten")
        .update(payload)
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from("berichten")
        .insert(payload);

      if (insertError) {
        throw insertError;
      }
    }
  }
}

async function ensurePayments(supabase, profileByEmail, packageByKey) {
  for (const payment of demoPayments) {
    const profielId = profileByEmail.get(payment.learnerEmail)?.id;
    const pakketId = payment.packageKey ? packageByKey.get(payment.packageKey)?.id : null;

    if (!profielId) {
      throw new Error(`Missing profile id for payment ${payment.learnerEmail}`);
    }

    const { data: existing, error: selectError } = await supabase
      .from("betalingen")
      .select("id")
      .eq("profiel_id", profielId)
      .eq("created_at", payment.createdAt)
      .eq("bedrag", payment.bedrag)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    const payload = {
      profiel_id: profielId,
      pakket_id: pakketId ?? null,
      bedrag: payment.bedrag,
      status: payment.status,
      provider: payment.provider,
      betaald_at: payment.betaaldAt,
      created_at: payment.createdAt,
    };

    if (existing) {
      const { error: updateError } = await supabase
        .from("betalingen")
        .update(payload)
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from("betalingen")
        .insert(payload);

      if (insertError) {
        throw insertError;
      }
    }
  }
}

async function main() {
  const serverKey = await getServerKey();
  const supabase = createClient(supabaseUrl, serverKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const instructors = await ensureAuthUsers(
    supabase,
    demoInstructors,
    "instructeur"
  );
  const learners = await ensureAuthUsers(supabase, demoLearners, "leerling");

  for (const user of [...instructors, ...learners]) {
    await waitForProfile(supabase, user.id);
  }

  await upsertProfiles(supabase, instructors, "instructeur");
  await upsertProfiles(supabase, learners, "leerling");
  await upsertInstructors(supabase, instructors);
  await upsertLearners(supabase, learners);

  const { data: instructorRows, error: instructorRowsError } = await supabase
    .from("instructeurs")
    .select("id, profile_id")
    .in(
      "profile_id",
      instructors.map((instructor) => instructor.id)
    );

  if (instructorRowsError) {
    throw instructorRowsError;
  }

  const { data: learnerRows, error: learnerRowsError } = await supabase
    .from("leerlingen")
    .select("id, profile_id")
    .in(
      "profile_id",
      learners.map((learner) => learner.id)
    );

  if (learnerRowsError) {
    throw learnerRowsError;
  }

  const instructorByEmail = new Map(
    instructors.map((instructor) => {
      const record = instructorRows?.find((row) => row.profile_id === instructor.id);
      return [instructor.email, { ...instructor, id: record?.id }];
    })
  );
  const learnerByEmail = new Map(
    learners.map((learner) => {
      const record = learnerRows?.find((row) => row.profile_id === learner.id);
      return [learner.email, { ...learner, id: record?.id }];
    })
  );
  const profileByEmail = new Map(
    [...instructors, ...learners].map((user) => [user.email, { ...user, id: user.id }])
  );

  const packageByKey = await ensurePackages(supabase, instructorByEmail);
  await attachLearnerPackages(supabase, learnerByEmail, packageByKey);
  await ensureReviews(supabase, instructorByEmail, learnerByEmail);
  await ensurePlanningRights(supabase, instructorByEmail, learnerByEmail);
  await ensureLessonRequests(
    supabase,
    instructorByEmail,
    learnerByEmail,
    packageByKey
  );
  await ensureLessons(supabase, instructorByEmail, learnerByEmail);
  await ensureProgressAssessments(supabase, instructorByEmail, learnerByEmail);
  await ensureProgressNotes(supabase, instructorByEmail, learnerByEmail);
  await ensureMessages(supabase, profileByEmail);
  await ensurePayments(supabase, profileByEmail, packageByKey);
  await ensureAvailability(supabase, instructorByEmail);
  await ensureWeekRules(supabase, instructorByEmail);

  const { count: instructorCount, error: instructorCountError } = await supabase
    .from("instructeurs")
    .select("*", { count: "exact", head: true });
  const { count: reviewCount, error: reviewCountError } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true });
  const { count: lessonCount, error: lessonCountError } = await supabase
    .from("lessen")
    .select("*", { count: "exact", head: true });
  const { count: requestCount, error: requestCountError } = await supabase
    .from("lesaanvragen")
    .select("*", { count: "exact", head: true });
  const { count: availabilityCount, error: availabilityCountError } = await supabase
    .from("beschikbaarheid")
    .select("*", { count: "exact", head: true });
  const { count: weekRuleCount, error: weekRuleCountError } = await supabase
    .from("beschikbaarheid_weekroosters")
    .select("*", { count: "exact", head: true });

  if (instructorCountError) {
    throw instructorCountError;
  }

  if (reviewCountError) {
    throw reviewCountError;
  }

  if (lessonCountError) {
    throw lessonCountError;
  }

  if (requestCountError) {
    throw requestCountError;
  }

  if (availabilityCountError) {
    throw availabilityCountError;
  }

  if (weekRuleCountError) {
    throw weekRuleCountError;
  }

  console.log(
    JSON.stringify(
      {
        seededInstructors: instructors.length,
        seededLearners: learners.length,
        seededPackages: demoPackages.length,
        seededLessonRequests: demoLessonRequests.length,
        seededLessons: demoLessons.length,
        seededWeekRules: demoWeekRules.length,
        totalInstructors: instructorCount ?? 0,
        totalReviews: reviewCount ?? 0,
        totalLessons: lessonCount ?? 0,
        totalLessonRequests: requestCount ?? 0,
        totalAvailabilitySlots: availabilityCount ?? 0,
        totalWeekRules: weekRuleCount ?? 0,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
