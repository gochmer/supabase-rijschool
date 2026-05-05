import { readFileSync } from "node:fs";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "Test123!Aa";
const TEST_PHONE = "06 12 34 56 78";
const NO_PACKAGE_VALUE = "__no_package__";
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
  return pathname.startsWith("http") ? pathname : `${BASE_URL}${pathname}`;
}

function uniqueToken() {
  return `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
}

function createTempEmail(role) {
  return `codex.packageqa.${role}.${uniqueToken()}@example.com`;
}

function createSlug() {
  return `codex-packageqa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
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
    },
  );

  if (!apiKeysResponse.ok) {
    throw new Error(`Kon Supabase API keys niet ophalen (${apiKeysResponse.status}).`);
  }

  const apiKeys = await apiKeysResponse.json();
  const serviceKey =
    apiKeys.find((key) => key.name === "service_role")?.api_key ??
    apiKeys.find((key) => key.name === "secret")?.api_key ??
    apiKeys.find(
      (key) =>
        key.type === "legacy" &&
        typeof key.name === "string" &&
        key.name.includes("service"),
    )?.api_key;

  if (!serviceKey) {
    throw new Error("Kon geen Supabase service key vinden.");
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

  const text = await response.text();
  throw new Error(`${label} mislukt (${response.status}): ${text}`);
}

async function adminJson(pathname, options = {}) {
  const response = await adminFetch(pathname, options);
  await assertAdminOk(response, pathname);
  return response.json();
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
    throw new Error(`Auth user voor ${role} heeft geen id.`);
  }

  return { userId, email };
}

async function upsertProfile({ userId, email, role, displayName }) {
  await assertAdminOk(
    await adminFetch("/rest/v1/profiles?on_conflict=id", {
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
    }),
    `Profiel ${email} opslaan`,
  );
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
    const rows = await adminJson(
      `/rest/v1/leerlingen?profile_id=eq.${profileId}&select=id,profile_id,pakket_id,student_status,voortgang_percentage`,
    );
    return rows[0];
  }

  await assertAdminOk(response, "Leerlingrecord aanmaken");
  const rows = await response.json();
  return rows[0];
}

async function createInstructorRecord(profileId) {
  const payload = {
    profile_id: profileId,
    slug: createSlug(),
    bio: "Package QA instructeur",
    werkgebied: ["Amsterdam", "Utrecht"],
    profiel_status: "goedgekeurd",
    prijs_per_les: 67,
    transmissie: "beide",
    specialisaties: ["Package QA"],
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
    const rows = await adminJson(`/rest/v1/instructeurs?profile_id=eq.${profileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    return rows[0];
  }

  await assertAdminOk(response, "Instructeurrecord aanmaken");
  const rows = await response.json();
  return rows[0];
}

async function createPackage({ instructeurId, name, price, lessons, active = true }) {
  const rows = await adminJson("/rest/v1/pakketten", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      naam: name,
      prijs: price,
      beschrijving: `${name} voor package assignment QA.`,
      aantal_lessen: lessons,
      les_type: "auto",
      actief: active,
      instructeur_id: instructeurId,
      badge: "QA",
      labels: ["Package QA"],
      sort_order: 1,
      uitgelicht: false,
    }),
  });

  return rows[0];
}

async function createManualLink({ leerlingId, instructeurId }) {
  const rows = await adminJson(
    "/rest/v1/instructeur_leerling_koppelingen?on_conflict=instructeur_id,leerling_id",
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
          bron: "package-qa",
          onboarding_notitie: "Package assignment QA",
          intake_checklist_keys: ["contact_gecheckt"],
        },
      ]),
    },
  );

  return rows[0];
}

async function createLesson(payload) {
  const rows = await adminJson("/rest/v1/lessen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  return rows[0];
}

async function patchRow(pathname, payload, label) {
  const rows = await adminJson(pathname, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!rows.length) {
    throw new Error(`${label} gaf geen bijgewerkte rij terug.`);
  }

  return rows[0];
}

async function getRows(pathname) {
  return adminJson(pathname, {
    headers: {
      Prefer: "return=representation",
    },
  });
}

async function waitForRows(pathname, predicate, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let lastRows = [];

  while (Date.now() < deadline) {
    lastRows = await getRows(pathname);

    if (predicate(lastRows)) {
      return lastRows;
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw new Error(
    `Verwachte database-state niet gevonden voor ${pathname}. Laatste rows: ${JSON.stringify(
      lastRows,
      null,
      2,
    )}`,
  );
}

async function gotoStable(page, pathname) {
  await page.goto(buildUrl(pathname), {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForLoadState("load", { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(700);
}

async function loginUser(page, email, redirectPath) {
  await gotoStable(page, `/inloggen?redirect=${encodeURIComponent(redirectPath)}`);
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Inloggen", exact: true }).click();
  await page.waitForURL(`**${redirectPath}`, { timeout: 30_000 });
  await page.waitForTimeout(700);
}

async function assertPageHealthy(page, label, expectedTexts = []) {
  const bodyText = await page.locator("body").innerText({ timeout: 20_000 });
  const fatalText = FATAL_TEXT_PATTERNS.find((pattern) =>
    bodyText.toLowerCase().includes(pattern.toLowerCase()),
  );

  if (fatalText) {
    throw new Error(`${label} toont fatal tekst: ${fatalText}\n\n${bodyText.slice(0, 1600)}`);
  }

  for (const expectedText of expectedTexts) {
    if (!bodyText.toLowerCase().includes(expectedText.toLowerCase())) {
      throw new Error(
        `${label} mist tekst "${expectedText}".\n\n${bodyText.slice(0, 1800)}`,
      );
    }
  }
}

async function clickAdminPackageAssignment(page, { leerlingId, packageId, replace = false }) {
  const select = page.locator(`[data-package-assignment-select="${leerlingId}"]`);
  await select.waitFor({ state: "visible", timeout: 20_000 });
  await select.selectOption(packageId ?? NO_PACKAGE_VALUE);

  if (replace) {
    const checkbox = page.locator(`[data-package-assignment-replace="${leerlingId}"]`);
    await checkbox.waitFor({ state: "visible", timeout: 10_000 });
    await checkbox.check();
  }

  await page.locator(`[data-package-assignment-submit="${leerlingId}"]`).click();
}

async function deleteByFilter(pathname) {
  await adminFetch(pathname, {
    method: "DELETE",
  });
}

async function cleanupRows({ learnerId, instructorId, packageIds, profileIds, userIds }) {
  if (learnerId) {
    await deleteByFilter(`/rest/v1/audit_events?leerling_id=eq.${learnerId}`);
    await deleteByFilter(`/rest/v1/lessen?leerling_id=eq.${learnerId}`);
    await deleteByFilter(`/rest/v1/lesaanvragen?leerling_id=eq.${learnerId}`);
    await deleteByFilter(`/rest/v1/leerling_planningsrechten?leerling_id=eq.${learnerId}`);
    await deleteByFilter(`/rest/v1/instructeur_leerling_koppelingen?leerling_id=eq.${learnerId}`);
  }

  for (const profileId of profileIds) {
    await deleteByFilter(`/rest/v1/notificaties?profiel_id=eq.${profileId}`);
    await deleteByFilter(`/rest/v1/betalingen?profiel_id=eq.${profileId}`);
  }

  if (packageIds.length) {
    await deleteByFilter(`/rest/v1/pakketten?id=in.(${packageIds.join(",")})`);
  }

  if (instructorId) {
    await deleteByFilter(`/rest/v1/instructeurs?id=eq.${instructorId}`);
  }

  for (const userId of userIds) {
    if (!userId) {
      continue;
    }

    await adminFetch(`/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
    });
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const created = {
    userIds: [],
    profileIds: [],
    packageIds: [],
    learnerId: null,
    instructorId: null,
  };

  try {
    const [adminUser, instructorUser, learnerUser] = await Promise.all([
      createAuthUser("admin", "Package QA Admin"),
      createAuthUser("instructeur", "Package QA Instructeur"),
      createAuthUser("leerling", "Package QA Leerling"),
    ]);
    created.userIds.push(adminUser.userId, instructorUser.userId, learnerUser.userId);
    created.profileIds.push(adminUser.userId, instructorUser.userId, learnerUser.userId);

    await Promise.all([
      upsertProfile({
        userId: adminUser.userId,
        email: adminUser.email,
        role: "admin",
        displayName: "Package QA Admin",
      }),
      upsertProfile({
        userId: instructorUser.userId,
        email: instructorUser.email,
        role: "instructeur",
        displayName: "Package QA Instructeur",
      }),
      upsertProfile({
        userId: learnerUser.userId,
        email: learnerUser.email,
        role: "leerling",
        displayName: "Package QA Leerling",
      }),
    ]);

    const [learner, instructor] = await Promise.all([
      createLearnerRecord(learnerUser.userId),
      createInstructorRecord(instructorUser.userId),
    ]);
    created.learnerId = learner.id;
    created.instructorId = instructor.id;

    const [basePackage, replacementPackage, expiredPackage] = await Promise.all([
      createPackage({
        instructeurId: instructor.id,
        name: "Package QA basis",
        price: 900,
        lessons: 2,
      }),
      createPackage({
        instructeurId: instructor.id,
        name: "Package QA vervolg",
        price: 650,
        lessons: 3,
      }),
      createPackage({
        instructeurId: instructor.id,
        name: "Package QA verlopen",
        price: 500,
        lessons: 2,
        active: false,
      }),
    ]);
    created.packageIds.push(basePackage.id, replacementPackage.id, expiredPackage.id);

    await createManualLink({
      leerlingId: learner.id,
      instructeurId: instructor.id,
    });

    const futureStart = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const openLesson = await createLesson({
      leerling_id: learner.id,
      instructeur_id: instructor.id,
      titel: "Package QA rijles zonder pakket",
      start_at: futureStart.toISOString(),
      duur_minuten: 60,
      status: "ingepland",
      pakket_id: null,
    });

    const adminPage = await browser.newPage();
    await loginUser(adminPage, adminUser.email, "/admin/leerlingen");
    await assertPageHealthy(adminPage, "Admin leerlingen", [
      "Leerlingen beheren",
      learnerUser.email,
      "Nog geen pakket",
    ]);

    await clickAdminPackageAssignment(adminPage, {
      leerlingId: learner.id,
      packageId: basePackage.id,
    });

    await waitForRows(
      `/rest/v1/leerlingen?id=eq.${learner.id}&select=id,pakket_id`,
      (rows) => rows[0]?.pakket_id === basePackage.id,
    );
    const basePayments = await waitForRows(
      `/rest/v1/betalingen?profiel_id=eq.${learnerUser.userId}&pakket_id=eq.${basePackage.id}&select=id,status,provider,bedrag,created_at`,
      (rows) => rows.length === 1 && rows[0]?.status === "open",
    );
    const basePayment = basePayments[0];

    await waitForRows(
      `/rest/v1/leerling_planningsrechten?leerling_id=eq.${learner.id}&instructeur_id=eq.${instructor.id}&select=zelf_inplannen_toegestaan`,
      (rows) => rows[0]?.zelf_inplannen_toegestaan === true,
    );
    await waitForRows(
      `/rest/v1/lessen?id=eq.${openLesson.id}&select=id,pakket_id`,
      (rows) => rows[0]?.pakket_id === basePackage.id,
    );
    await waitForRows(
      `/rest/v1/notificaties?profiel_id=eq.${learnerUser.userId}&titel=eq.Pakket gekoppeld&select=id,titel,tekst`,
      (rows) => rows.length >= 1,
    );
    await waitForRows(
      `/rest/v1/audit_events?leerling_id=eq.${learner.id}&event_type=in.(package_assigned,package_payment_created,package_planning_released,package_lessons_attached)&select=id,event_type,summary,metadata`,
      (rows) =>
        ["package_assigned", "package_payment_created", "package_planning_released"].every(
          (eventType) => rows.some((row) => row.event_type === eventType),
        ),
    );
    await gotoStable(adminPage, "/admin/leerlingen");
    await assertPageHealthy(adminPage, "Admin audit-tijdlijn", [
      "Pakket-tijdlijn",
      "Pakket gekoppeld",
      "Betaling aangemaakt",
    ]);

    await clickAdminPackageAssignment(adminPage, {
      leerlingId: learner.id,
      packageId: basePackage.id,
    });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const duplicateCheck = await getRows(
      `/rest/v1/betalingen?profiel_id=eq.${learnerUser.userId}&pakket_id=eq.${basePackage.id}&select=id,status`,
    );

    if (duplicateCheck.length !== 1) {
      throw new Error(`Dubbele betaling aangemaakt voor hetzelfde pakket: ${duplicateCheck.length}`);
    }

    await patchRow(
      `/rest/v1/betalingen?id=eq.${basePayment.id}`,
      { status: "betaald", betaald_at: new Date().toISOString() },
      "Basisbetaling afronden",
    );

    const learnerPage = await browser.newPage();
    await loginUser(learnerPage, learnerUser.email, "/leerling/betalingen");
    await assertPageHealthy(learnerPage, "Leerling betalingen actief", [
      "Package QA basis",
      "Actief",
    ]);

    await createLesson({
      leerling_id: learner.id,
      instructeur_id: instructor.id,
      titel: "Package QA afgeronde rijles",
      start_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      duur_minuten: 60,
      status: "afgerond",
      pakket_id: basePackage.id,
    });
    await gotoStable(learnerPage, "/leerling/betalingen");
    await assertPageHealthy(learnerPage, "Leerling pakket volledig gebruikt", [
      "Package QA basis",
      "Volledig gebruikt",
    ]);

    const instructorPage = await browser.newPage();
    await loginUser(
      instructorPage,
      instructorUser.email,
      `/instructeur/leerlingen?student=${encodeURIComponent(learner.id)}`,
    );
    await assertPageHealthy(instructorPage, "Instructeur leerlingpakket", [
      "Package QA Leerling",
      "Package QA basis",
      "Pakket-tijdlijn",
      "Pakket gekoppeld",
    ]);

    await gotoStable(adminPage, "/admin/leerlingen");
    await clickAdminPackageAssignment(adminPage, {
      leerlingId: learner.id,
      packageId: replacementPackage.id,
      replace: true,
    });
    await waitForRows(
      `/rest/v1/leerlingen?id=eq.${learner.id}&select=id,pakket_id`,
      (rows) => rows[0]?.pakket_id === replacementPackage.id,
    );
    const replacementPayments = await waitForRows(
      `/rest/v1/betalingen?profiel_id=eq.${learnerUser.userId}&pakket_id=eq.${replacementPackage.id}&select=id,status`,
      (rows) => rows.length === 1 && rows[0]?.status === "open",
    );
    const replacementPayment = replacementPayments[0];
    await waitForRows(
      `/rest/v1/lessen?id=eq.${openLesson.id}&select=id,pakket_id`,
      (rows) => rows[0]?.pakket_id === replacementPackage.id,
    );
    await waitForRows(
      `/rest/v1/audit_events?leerling_id=eq.${learner.id}&event_type=eq.package_replaced&select=id,event_type,summary,metadata`,
      (rows) => rows.length >= 1,
    );

    await patchRow(
      `/rest/v1/betalingen?id=eq.${replacementPayment.id}`,
      { status: "mislukt" },
      "Vervangende betaling op mislukt zetten",
    );
    await gotoStable(learnerPage, "/leerling/betalingen");
    await assertPageHealthy(learnerPage, "Leerling betaling mislukt", [
      "Package QA vervolg",
      "Wacht op betaling",
    ]);

    await patchRow(
      `/rest/v1/pakketten?id=eq.${replacementPackage.id}`,
      { actief: false },
      "Vervangend pakket verlopen maken",
    );
    await gotoStable(learnerPage, "/leerling/betalingen");
    await assertPageHealthy(learnerPage, "Leerling pakket verlopen", [
      "Package QA vervolg",
      "Verlopen",
    ]);

    await gotoStable(adminPage, "/admin/leerlingen");
    await clickAdminPackageAssignment(adminPage, {
      leerlingId: learner.id,
      packageId: null,
    });
    await waitForRows(
      `/rest/v1/leerlingen?id=eq.${learner.id}&select=id,pakket_id`,
      (rows) => rows[0]?.pakket_id === null,
    );
    await waitForRows(
      `/rest/v1/leerling_planningsrechten?leerling_id=eq.${learner.id}&instructeur_id=eq.${instructor.id}&select=zelf_inplannen_toegestaan`,
      (rows) => rows[0]?.zelf_inplannen_toegestaan === false,
    );
    await waitForRows(
      `/rest/v1/audit_events?leerling_id=eq.${learner.id}&event_type=eq.package_unlinked&select=id,event_type,summary,metadata`,
      (rows) => rows.length >= 1,
    );
    await gotoStable(learnerPage, "/leerling/betalingen");
    await assertPageHealthy(learnerPage, "Leerling zonder pakket na loskoppelen", [
      "Nog geen pakket",
    ]);

    await Promise.all([
      gotoStable(learnerPage, "/leerling/profiel"),
      gotoStable(instructorPage, `/instructeur/leerlingen?student=${learner.id}`),
    ]);
    await assertPageHealthy(learnerPage, "Leerling profiel zonder pakket", [
      "Nog geen pakket",
    ]);
    await assertPageHealthy(instructorPage, "Instructeur zonder pakket", [
      "Pakket nodig",
    ]);

    console.log(
      JSON.stringify(
        {
          admin: "pakket koppelen, dubbelbetaling voorkomen, vervangen en loskoppelen ok",
          instructeur: "eigen leerling ziet pakketstatus en blokkade na loskoppelen",
          leerling:
            "betalingen, profiel, boekingen/voortgang-brondata tonen pakketstatus",
          auditTrail:
            "package_assigned, package_payment_created, package_replaced en package_unlinked vastgelegd",
          edgeCases: [
            "leerling zonder pakket",
            "betaling aangemaakt",
            "planning vrijgegeven",
            "rijles gekoppeld",
            "betaling betaald",
            "pakket volledig gebruikt",
            "pakket vervangen",
            "betaling mislukt",
            "pakket verlopen",
            "pakket losgekoppeld",
            "geen dubbele betaling",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
    await cleanupRows({
      learnerId: created.learnerId,
      instructorId: created.instructorId,
      packageIds: created.packageIds,
      profileIds: created.profileIds,
      userIds: created.userIds,
    }).catch((error) => {
      console.error(`Cleanup waarschuwing: ${error.message}`);
    });
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
