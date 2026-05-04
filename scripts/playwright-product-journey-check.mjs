import { readFileSync } from "node:fs";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "Test123!Aa";
const TEST_PHONE = "06 12 34 56 78";
const FATAL_TEXT_PATTERNS = [
  "Application error",
  "Something went wrong",
  "This page could not be found",
  "Unhandled Runtime Error",
  "Runtime Error",
];

let cachedSupabaseAdminContext = null;

function readLocalEnv(name) {
  const envText = readFileSync(".env.local", "utf8");
  const match = envText.match(new RegExp(`^${name}=(.*)$`, "m"));

  if (!match) {
    throw new Error(`Missing ${name} in .env.local`);
  }

  return match[1].trim();
}

function buildUrl(pathname) {
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    return pathname;
  }

  return `${BASE_URL}${pathname}`;
}

function createTempEmail(prefix) {
  return `codex.productreis.${prefix}.${Date.now()}.${Math.random()
    .toString(36)
    .slice(2, 8)}@example.com`;
}

function createSlug(prefix) {
  return `codex-${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

async function getSupabaseAdminContext() {
  if (cachedSupabaseAdminContext) {
    return cachedSupabaseAdminContext;
  }

  const supabaseUrl = readLocalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const accessToken = readLocalEnv("SUPABASE_ACCESS_TOKEN");
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const apiKeysResponse = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/api-keys?reveal=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!apiKeysResponse.ok) {
    throw new Error(`Kon Supabase API keys niet ophalen (${apiKeysResponse.status})`);
  }

  const apiKeys = await apiKeysResponse.json();
  const serviceKey =
    apiKeys.find((key) => key.name === "service_role")?.api_key ??
    apiKeys.find((key) => key.name === "secret")?.api_key ??
    apiKeys.find(
      (key) =>
        key.type === "legacy" &&
        typeof key.name === "string" &&
        key.name.includes("service")
    )?.api_key;

  if (!serviceKey) {
    throw new Error("Kon geen service role key vinden.");
  }

  cachedSupabaseAdminContext = { supabaseUrl, serviceKey };
  return cachedSupabaseAdminContext;
}

async function adminFetch(pathname, options = {}) {
  const { supabaseUrl, serviceKey } = await getSupabaseAdminContext();

  return fetch(`${supabaseUrl}${pathname}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(options.headers ?? {}),
    },
  });
}

async function assertAdminOk(response, label) {
  if (response.ok) {
    return;
  }

  const errorText = await response.text();
  throw new Error(`${label} mislukt (${response.status}): ${errorText}`);
}

async function createAuthUser(role, displayName) {
  const email = createTempEmail(role);
  const response = await adminFetch("/auth/v1/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      app_metadata: { rol: role },
      user_metadata: {
        volledige_naam: displayName,
        telefoon: TEST_PHONE,
        rol: role,
      },
    }),
  });

  await assertAdminOk(response, `Auth user voor ${role} aanmaken`);
  const payload = await response.json();
  const userId = payload.user?.id ?? payload.id ?? null;

  if (!userId) {
    throw new Error(`Auth user voor ${role} is aangemaakt zonder id.`);
  }

  return { userId, email };
}

async function upsertProfile({ userId, email, role, displayName }) {
  const response = await adminFetch("/rest/v1/profiles?on_conflict=id", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([
      {
        id: userId,
        volledige_naam: displayName,
        email,
        telefoon: TEST_PHONE,
        avatar_url: null,
        rol: role,
      },
    ]),
  });

  await assertAdminOk(response, `Profiel voor ${email} opslaan`);
}

async function createLearnerRecord(profileId) {
  const response = await adminFetch("/rest/v1/leerlingen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      profile_id: profileId,
      student_status: "onboarding",
    }),
  });

  if (response.status === 409) {
    const existingResponse = await adminFetch(
      `/rest/v1/leerlingen?profile_id=eq.${profileId}&select=id,profile_id,pakket_id,student_status,voortgang_percentage`
    );
    await assertAdminOk(existingResponse, "Bestaand leerlingrecord ophalen");
    const existingRows = await existingResponse.json();
    return existingRows[0];
  }

  await assertAdminOk(response, "Leerlingrecord aanmaken");
  const rows = await response.json();
  return rows[0];
}

async function createInstructorRecord(profileId) {
  const slug = createSlug("productreis");
  const payload = {
    profile_id: profileId,
    slug,
    bio: "Test instructeur voor productiereis-check",
    werkgebied: ["Amsterdam", "Utrecht"],
    profiel_status: "goedgekeurd",
    prijs_per_les: 67,
    transmissie: "beide",
    specialisaties: ["Examentraining", "Stadsverkeer"],
    online_boeken_actief: true,
    standaard_rijles_duur_minuten: 60,
    standaard_proefles_duur_minuten: 50,
    standaard_pakketles_duur_minuten: 60,
  };
  const response = await adminFetch("/rest/v1/instructeurs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 409) {
    const existingResponse = await adminFetch(
      `/rest/v1/instructeurs?profile_id=eq.${profileId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      }
    );
    await assertAdminOk(existingResponse, "Bestaand instructeurrecord bijwerken");
    const existingRows = await existingResponse.json();
    return existingRows[0];
  }

  await assertAdminOk(response, "Instructeurrecord aanmaken");
  const rows = await response.json();
  return rows[0];
}

async function createPackage({ instructeurId }) {
  const response = await adminFetch("/rest/v1/pakketten", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      naam: "Productiereis pakket",
      prijs: 1299,
      beschrijving: "E2E pakket voor proefles naar vervolglessen.",
      aantal_lessen: 20,
      les_type: "auto",
      actief: true,
      instructeur_id: instructeurId,
      badge: "E2E",
      labels: ["Productiereis", "Automaat"],
      sort_order: 1,
      uitgelicht: true,
    }),
  });

  await assertAdminOk(response, "Pakket aanmaken");
  const rows = await response.json();
  return rows[0];
}

async function createLessonRequest(payload) {
  const response = await adminFetch("/rest/v1/lesaanvragen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  await assertAdminOk(response, "Lesaanvraag aanmaken");
  const rows = await response.json();
  return rows[0];
}

async function createLesson(payload) {
  const response = await adminFetch("/rest/v1/lessen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  await assertAdminOk(response, "Les aanmaken");
  const rows = await response.json();
  return rows[0];
}

async function createPayment(payload) {
  const response = await adminFetch("/rest/v1/betalingen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  await assertAdminOk(response, "Betaling aanmaken");
  const rows = await response.json();
  return rows[0];
}

async function createNotification(payload) {
  const response = await adminFetch("/rest/v1/notificaties", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  await assertAdminOk(response, "Notificatie aanmaken");
  const rows = await response.json();
  return rows[0];
}

async function createProgressAssessment(payload) {
  const response = await adminFetch("/rest/v1/leerling_voortgang_beoordelingen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  await assertAdminOk(response, "Voortgangsbeoordeling aanmaken");
  const rows = await response.json();
  return rows[0];
}

async function createProgressLessonNote(payload) {
  const response = await adminFetch("/rest/v1/leerling_voortgang_lesnotities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  await assertAdminOk(response, "Lesfeedback aanmaken");
  const rows = await response.json();
  return rows[0];
}

async function updateLearner(learnerId, payload) {
  const response = await adminFetch(`/rest/v1/leerlingen?id=eq.${learnerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  await assertAdminOk(response, "Leerling bijwerken");
  const rows = await response.json();
  return rows[0];
}

async function upsertPlanningRights({ leerlingId, instructeurId }) {
  const now = new Date().toISOString();
  const response = await adminFetch(
    "/rest/v1/leerling_planningsrechten?on_conflict=leerling_id,instructeur_id",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify([
        {
          leerling_id: leerlingId,
          instructeur_id: instructeurId,
          zelf_inplannen_toegestaan: true,
          vrijgegeven_at: now,
          updated_at: now,
        },
      ]),
    }
  );

  await assertAdminOk(response, "Planningsrechten opslaan");
  const rows = await response.json();
  return rows[0];
}

async function waitForRows(pathname, predicate, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let lastRows = [];

  while (Date.now() < deadline) {
    const response = await adminFetch(pathname, {
      headers: {
        Prefer: "return=representation",
      },
    });

    await assertAdminOk(response, `Rows ophalen voor ${pathname}`);
    const rows = await response.json();
    lastRows = Array.isArray(rows) ? rows : [];

    if (predicate(lastRows)) {
      return lastRows;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `Gezochte database-uitkomst niet gevonden voor ${pathname}. Laatste rows: ${JSON.stringify(
      lastRows,
      null,
      2
    )}`
  );
}

async function gotoStable(page, pathname) {
  await page.goto(buildUrl(pathname), {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForLoadState("load", { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(900);
}

async function loginUser(page, email, redirectPath) {
  await gotoStable(page, `/inloggen?redirect=${encodeURIComponent(redirectPath)}`);
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Inloggen", exact: true }).click();
  await page.waitForURL(`**${redirectPath}`, { timeout: 30_000 });
  await page.waitForTimeout(900);
}

async function assertPageHealthy(page, label, expectedTexts = []) {
  const bodyText = await page.locator("body").innerText({ timeout: 20_000 });
  const fatalText = FATAL_TEXT_PATTERNS.find((pattern) =>
    bodyText.toLowerCase().includes(pattern.toLowerCase())
  );

  if (fatalText) {
    throw new Error(`${label} toont fatal tekst: ${fatalText}\n\n${bodyText.slice(0, 1600)}`);
  }

  for (const expectedText of expectedTexts) {
    if (!bodyText.toLowerCase().includes(expectedText.toLowerCase())) {
      throw new Error(
        `${label} mist tekst "${expectedText}".\n\n${bodyText.slice(0, 1800)}`
      );
    }
  }
}

async function visitAndAssert(page, pathname, label, expectedTexts = []) {
  await gotoStable(page, pathname);
  await assertPageHealthy(page, label, expectedTexts);
}

async function deleteAuthUsers(userIds) {
  for (const userId of userIds) {
    if (!userId) {
      continue;
    }

    await adminFetch(`/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
    });
  }
}

async function deleteByFilter(pathname) {
  await adminFetch(pathname, {
    method: "DELETE",
  });
}

async function cleanupRows({
  learnerId,
  instructorId,
  packageIds = [],
  paymentIds = [],
  profileIds = [],
}) {
  if (learnerId && instructorId) {
    await deleteByFilter(
      `/rest/v1/leerling_voortgang_beoordelingen?leerling_id=eq.${learnerId}&instructeur_id=eq.${instructorId}`
    );
    await deleteByFilter(
      `/rest/v1/leerling_voortgang_lesnotities?leerling_id=eq.${learnerId}&instructeur_id=eq.${instructorId}`
    );
    await deleteByFilter(
      `/rest/v1/les_checkins?leerling_id=eq.${learnerId}&instructeur_id=eq.${instructorId}`
    );
    await deleteByFilter(
      `/rest/v1/leskompassen?leerling_id=eq.${learnerId}&instructeur_id=eq.${instructorId}`
    );
    await deleteByFilter(
      `/rest/v1/lessen?leerling_id=eq.${learnerId}&instructeur_id=eq.${instructorId}`
    );
    await deleteByFilter(
      `/rest/v1/lesaanvragen?leerling_id=eq.${learnerId}&instructeur_id=eq.${instructorId}`
    );
    await deleteByFilter(
      `/rest/v1/leerling_planningsrechten?leerling_id=eq.${learnerId}&instructeur_id=eq.${instructorId}`
    );
    await deleteByFilter(`/rest/v1/beschikbaarheid?instructeur_id=eq.${instructorId}`);
  }

  if (paymentIds.length) {
    await deleteByFilter(`/rest/v1/betalingen?id=in.(${paymentIds.join(",")})`);
  }

  if (profileIds.length) {
    await deleteByFilter(`/rest/v1/notificaties?profiel_id=in.(${profileIds.join(",")})`);
  }

  if (packageIds.length) {
    await deleteByFilter(`/rest/v1/pakketten?id=in.(${packageIds.join(",")})`);
  }

  if (instructorId) {
    await deleteByFilter(`/rest/v1/instructeurs?id=eq.${instructorId}`);
  }

  if (learnerId) {
    await deleteByFilter(`/rest/v1/leerlingen?id=eq.${learnerId}`);
  }

  if (profileIds.length) {
    await deleteByFilter(`/rest/v1/profiles?id=in.(${profileIds.join(",")})`);
  }
}

async function run() {
  const createdUserIds = [];
  const createdPackageIds = [];
  const createdPaymentIds = [];
  const createdProfileIds = [];
  let learner = null;
  let instructor = null;
  const browser = await chromium.launch({ headless: true });

  try {
    const learnerIdentity = await createAuthUser(
      "leerling",
      "Codex Productiereis Leerling"
    );
    createdUserIds.push(learnerIdentity.userId);
    createdProfileIds.push(learnerIdentity.userId);
    await upsertProfile({
      userId: learnerIdentity.userId,
      email: learnerIdentity.email,
      role: "leerling",
      displayName: "Codex Productiereis Leerling",
    });
    learner = await createLearnerRecord(learnerIdentity.userId);

    const instructorIdentity = await createAuthUser(
      "instructeur",
      "Codex Productiereis Instructeur"
    );
    createdUserIds.push(instructorIdentity.userId);
    createdProfileIds.push(instructorIdentity.userId);
    await upsertProfile({
      userId: instructorIdentity.userId,
      email: instructorIdentity.email,
      role: "instructeur",
      displayName: "Codex Productiereis Instructeur",
    });
    instructor = await createInstructorRecord(instructorIdentity.userId);

    const packageRecord = await createPackage({ instructeurId: instructor.id });
    createdPackageIds.push(packageRecord.id);

    const trialRequest = await createLessonRequest({
      leerling_id: learner.id,
      instructeur_id: instructor.id,
      aanvraag_type: "proefles",
      les_type: "auto",
      status: "geaccepteerd",
      voorkeursdatum: "2026-05-12",
      tijdvak: "09:00 - 09:50",
      bericht: "Productiereis: proefles geboekt en geaccepteerd.",
    });

    const trialLesson = await createLesson({
      leerling_id: learner.id,
      instructeur_id: instructor.id,
      titel: "Proefles productiereis",
      start_at: "2026-05-12T09:00:00+02:00",
      duur_minuten: 50,
      status: "afgerond",
      notities: `request-ref:${trialRequest.id}`,
      lesnotitie: "Proefles afgerond; pakketadvies is klaar.",
    });

    await updateLearner(learner.id, {
      pakket_id: packageRecord.id,
      student_status: "lessen",
      student_status_reason: "Pakket gekoppeld na afgeronde proefles.",
      voortgang_percentage: 35,
    });
    await upsertPlanningRights({
      leerlingId: learner.id,
      instructeurId: instructor.id,
    });

    const payment = await createPayment({
      profiel_id: learnerIdentity.userId,
      pakket_id: packageRecord.id,
      bedrag: packageRecord.prijs,
      status: "betaald",
      provider: "productiereis-test",
      betaald_at: "2026-05-12T12:00:00+02:00",
    });
    createdPaymentIds.push(payment.id);

    const followupRequest = await createLessonRequest({
      leerling_id: learner.id,
      instructeur_id: instructor.id,
      aanvraag_type: "pakket",
      pakket_id: packageRecord.id,
      pakket_naam_snapshot: packageRecord.naam,
      les_type: "auto",
      status: "ingepland",
      voorkeursdatum: "2026-05-19",
      tijdvak: "10:00 - 11:00",
      bericht: "Productiereis: eerste vervolglessen na pakketkoppeling.",
    });

    const followupLesson = await createLesson({
      leerling_id: learner.id,
      instructeur_id: instructor.id,
      pakket_id: packageRecord.id,
      titel: "Rijles na proefles",
      start_at: "2026-05-19T10:00:00+02:00",
      duur_minuten: 60,
      status: "ingepland",
      notities: `request-ref:${followupRequest.id}`,
      lesnotitie: "Vervolgles gekoppeld aan pakket en leerlingaccount.",
    });

    await createProgressAssessment({
      leerling_id: learner.id,
      instructeur_id: instructor.id,
      les_id: trialLesson.id,
      vaardigheid_key: "voorbereiding",
      beoordelings_datum: "2026-05-12",
      status: "zelfstandig",
      notitie: "Controlehandelingen zelfstandig uitgevoerd.",
    });
    await createProgressAssessment({
      leerling_id: learner.id,
      instructeur_id: instructor.id,
      les_id: trialLesson.id,
      vaardigheid_key: "kijkgedrag",
      beoordelings_datum: "2026-05-12",
      status: "begeleid",
      notitie: "Kijkgedrag heeft nog bewuste herhaling nodig.",
    });
    await createProgressAssessment({
      leerling_id: learner.id,
      instructeur_id: instructor.id,
      les_id: trialLesson.id,
      vaardigheid_key: "fileparkeren",
      beoordelings_datum: "2026-05-12",
      status: "herhaling",
      notitie: "Parkeren wordt focus voor de volgende les.",
    });
    await createProgressLessonNote({
      leerling_id: learner.id,
      instructeur_id: instructor.id,
      les_id: trialLesson.id,
      lesdatum: "2026-05-12",
      samenvatting: "Rustige proefles met duidelijke basiscontrole.",
      sterk_punt: "Bediening van het voertuig",
      focus_volgende_les: "Fileparkeren en kijkgedrag",
    });

    await createNotification({
      profiel_id: learnerIdentity.userId,
      titel: "Productiereis voltooid",
      tekst: "Je proefles, pakket, betaling, vervolgplanning en voortgang zijn gekoppeld.",
      type: "succes",
      ongelezen: true,
    });
    await createNotification({
      profiel_id: instructorIdentity.userId,
      titel: "Productiereis leerling klaar",
      tekst: "De testleerling heeft proefles, pakket en vervolgplanning actief.",
      type: "info",
      ongelezen: true,
    });

    await waitForRows(
      `/rest/v1/leerlingen?id=eq.${learner.id}&select=id,pakket_id,student_status,voortgang_percentage`,
      (rows) =>
        rows.some(
          (row) =>
            row.pakket_id === packageRecord.id &&
            row.student_status === "lessen" &&
            Number(row.voortgang_percentage) >= 35
        )
    );
    await waitForRows(
      `/rest/v1/lessen?leerling_id=eq.${learner.id}&instructeur_id=eq.${instructor.id}&select=id,status,titel,pakket_id`,
      (rows) =>
        rows.some((row) => row.titel === "Proefles productiereis" && row.status === "afgerond") &&
        rows.some(
          (row) =>
            row.titel === "Rijles na proefles" &&
            row.status === "ingepland" &&
            row.pakket_id === packageRecord.id
        )
    );
    await waitForRows(
      `/rest/v1/leerling_voortgang_beoordelingen?leerling_id=eq.${learner.id}&instructeur_id=eq.${instructor.id}&select=id,status,vaardigheid_key`,
      (rows) => rows.length >= 3
    );
    await waitForRows(
      `/rest/v1/betalingen?id=eq.${payment.id}&select=id,status,pakket_id,profiel_id`,
      (rows) =>
        rows.some(
          (row) =>
            row.status === "betaald" &&
            row.pakket_id === packageRecord.id &&
            row.profiel_id === learnerIdentity.userId
        )
    );
    await waitForRows(
      `/rest/v1/notificaties?profiel_id=eq.${learnerIdentity.userId}&select=id,titel`,
      (rows) => rows.some((row) => row.titel === "Productiereis voltooid")
    );

    const learnerContext = await browser.newContext();
    const learnerPage = await learnerContext.newPage();
    await loginUser(learnerPage, learnerIdentity.email, "/leerling/dashboard");
    await assertPageHealthy(learnerPage, "Leerling dashboard", [
      "Codex Productiereis Leerling",
      "Productiereis pakket",
    ]);
    await visitAndAssert(learnerPage, "/leerling/voortgang", "Leerling voortgang", [
      "Jouw leertraject",
      "Focus skills",
      "Fileparkeren",
    ]);
    await visitAndAssert(learnerPage, "/leerling/betalingen", "Leerling betalingen", [
      "Productiereis pakket",
      "betaald",
    ]);
    await visitAndAssert(learnerPage, "/leerling/notificaties", "Leerling notificaties", [
      "Productiereis voltooid",
    ]);
    await visitAndAssert(learnerPage, "/leerling/boekingen", "Leerling boekingen", [
      "Rijles na proefles",
    ]);

    const instructorContext = await browser.newContext();
    const instructorPage = await instructorContext.newPage();
    await loginUser(instructorPage, instructorIdentity.email, "/instructeur/regie");
    await assertPageHealthy(instructorPage, "Instructeur regie", [
      "Regie",
      "Slimme weekplanning",
    ]);
    await visitAndAssert(
      instructorPage,
      "/instructeur/leerlingen",
      "Instructeur leerlingen",
      ["Codex Productiereis Leerling", "Productiereis pakket"]
    );
    await visitAndAssert(instructorPage, "/instructeur/lessen", "Instructeur lessen", [
      "Codex Productiereis Leerling",
      "Productiereis pakket",
    ]);

    const result = {
      registratie: "ok",
      proefles: {
        requestStatus: trialRequest.status,
        lessonStatus: trialLesson.status,
      },
      pakket: {
        naam: packageRecord.naam,
        gekoppeldAanLeerling: learner.id,
      },
      vervolgLes: {
        requestStatus: followupRequest.status,
        lessonStatus: followupLesson.status,
        pakketId: followupLesson.pakket_id,
      },
      voortgang: "3 skillmetingen + lesfeedback zichtbaar",
      betaling: payment.status,
      notificatie: "Productiereis voltooid",
      uiRoutes: [
        "/leerling/dashboard",
        "/leerling/voortgang",
        "/leerling/betalingen",
        "/leerling/notificaties",
        "/leerling/boekingen",
        "/instructeur/regie",
        "/instructeur/leerlingen",
        "/instructeur/lessen",
      ],
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
    await cleanupRows({
      learnerId: learner?.id ?? null,
      instructorId: instructor?.id ?? null,
      packageIds: createdPackageIds,
      paymentIds: createdPaymentIds,
      profileIds: createdProfileIds,
    }).catch(() => {});
    await deleteAuthUsers(createdUserIds).catch(() => {});
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
