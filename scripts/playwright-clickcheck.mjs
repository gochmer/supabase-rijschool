import { readFileSync } from "node:fs";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "Test123!Aa";
const FATAL_TEXT_PATTERNS = [
  "Application error",
  "Something went wrong",
  "This page could not be found",
  "Unhandled Runtime Error",
];
const TEST_PHONE = "06 12 34 56 78";
const TEST_NAMES = {
  leerling: "Codex Leerling Test",
  instructeur: "Codex Instructeur Test",
  admin: "Codex Admin Test",
};

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
  return `codex.${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
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

async function gotoStable(page, pathname) {
  const response = await page.goto(buildUrl(pathname), {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await page.waitForLoadState("load", { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(1_800);

  return response;
}

async function getBodyText(page) {
  return page.locator("body").innerText();
}

function collectFatalText(bodyText) {
  return FATAL_TEXT_PATTERNS.filter((pattern) => bodyText.includes(pattern));
}

function assertCondition(condition, message, failures) {
  if (!condition) {
    failures.push(message);
  }
}

async function checkRoute(page, route, failures, options = {}) {
  const response = await gotoStable(page, route);
  const finalUrl = page.url();
  const bodyText = await getBodyText(page);
  const fatalMatches = collectFatalText(bodyText);

  assertCondition(
    fatalMatches.length === 0,
    `[${route}] fatale fouttekst gevonden: ${fatalMatches.join(", ")}`,
    failures
  );

  if (options.expectPathStartsWith) {
    const expectedStarts = Array.isArray(options.expectPathStartsWith)
      ? options.expectPathStartsWith
      : [options.expectPathStartsWith];

    assertCondition(
      expectedStarts.some((expectedStart) => finalUrl.startsWith(buildUrl(expectedStart))),
      `[${route}] verwachtte URL-start ${expectedStarts.join(" of ")}, kreeg ${finalUrl}`,
      failures
    );
  }

  if (options.expectText) {
    assertCondition(
      bodyText.includes(options.expectText),
      `[${route}] verwachte tekst niet gevonden: ${options.expectText}`,
      failures
    );
  }

  if (options.expectStatus) {
    assertCondition(
      response?.status() === options.expectStatus,
      `[${route}] verwachte status ${options.expectStatus}, kreeg ${response?.status() ?? "geen response"}`,
      failures
    );
  }

  return {
    route,
    finalUrl,
    status: response?.status() ?? null,
  };
}

async function registerUser(page, role, redirectPath) {
  const email = createTempEmail(role);
  const { supabaseUrl, serviceKey } = await getSupabaseAdminContext();
  const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        rol: role,
        volledige_naam: TEST_NAMES[role],
        telefoon: TEST_PHONE,
      },
    }),
  });

  if (!createUserResponse.ok) {
    throw new Error(`Kon ${role} testuser niet aanmaken (${createUserResponse.status})`);
  }

  const createdUserPayload = await createUserResponse.json();
  const userId = createdUserPayload.user?.id ?? createdUserPayload.id ?? null;

  if (!userId) {
    throw new Error(`${role} testuser is aangemaakt zonder user id.`);
  }

  const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify([
      {
        id: userId,
        volledige_naam: TEST_NAMES[role],
        email,
        telefoon: TEST_PHONE,
        avatar_url: null,
        rol: role,
      },
    ]),
  });

  if (!profileResponse.ok) {
    throw new Error(`Kon ${role} profiel niet upserten (${profileResponse.status})`);
  }

  if (role === "leerling") {
    const learnerResponse = await fetch(`${supabaseUrl}/rest/v1/leerlingen?on_conflict=profile_id`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify([{ profile_id: userId }]),
    });

    if (!learnerResponse.ok) {
      throw new Error(`Kon leerling record niet upserten (${learnerResponse.status})`);
    }
  }

  if (role === "instructeur") {
    const instructorResponse = await fetch(
      `${supabaseUrl}/rest/v1/instructeurs?on_conflict=profile_id`,
      {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify([
          {
            profile_id: userId,
            slug: `codex-instructeur-${userId.slice(0, 8)}`,
            volledige_naam: TEST_NAMES[role],
            bio: "Playwright test instructeur",
            werkgebied: ["Amsterdam"],
            specialisaties: ["Personenauto (B)"],
            profiel_status: "goedgekeurd",
            profiel_compleetheid: 100,
          },
        ]),
      }
    );

    if (!instructorResponse.ok) {
      throw new Error(`Kon instructeur record niet upserten (${instructorResponse.status})`);
    }
  }

  await loginUser(page, email, redirectPath);
  await page.waitForTimeout(2_000);

  return email;
}

async function createAdminUser() {
  const email = createTempEmail("admin");
  const { supabaseUrl, serviceKey } = await getSupabaseAdminContext();

  const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      app_metadata: {
        rol: "admin",
      },
      user_metadata: {
        volledige_naam: TEST_NAMES.admin,
        telefoon: TEST_PHONE,
      },
    }),
  });

  if (!createUserResponse.ok) {
    throw new Error(`Kon admin testuser niet aanmaken (${createUserResponse.status})`);
  }

  const createdUserPayload = await createUserResponse.json();
  let userId = createdUserPayload.user?.id ?? createdUserPayload.id ?? null;

  if (!userId) {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=200`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!authResponse.ok) {
      throw new Error(`Kon admin userlijst niet ophalen (${authResponse.status})`);
    }

    const authPayload = await authResponse.json();
    userId =
      authPayload.users?.find(
        (user) =>
          typeof user.email === "string" &&
          user.email.toLowerCase() === email.toLowerCase()
      )?.id ?? null;
  }

  if (!userId) {
    throw new Error("Admin testuser is aangemaakt zonder user id.");
  }

  const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([
      {
        id: userId,
        volledige_naam: TEST_NAMES.admin,
        email,
        telefoon: TEST_PHONE,
        avatar_url: null,
        rol: "admin",
      },
    ]),
  });

  if (!profileResponse.ok) {
    throw new Error(`Kon admin profiel niet upserten (${profileResponse.status})`);
  }

  const upsertedProfiles = await profileResponse.json().catch(() => []);
  const currentRole =
    Array.isArray(upsertedProfiles) && upsertedProfiles.length
      ? upsertedProfiles[0]?.rol ?? null
      : null;

  if (currentRole !== "admin") {
    const updateProfileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          volledige_naam: TEST_NAMES.admin,
          email,
          telefoon: TEST_PHONE,
          avatar_url: null,
          rol: "admin",
        }),
      }
    );

    if (!updateProfileResponse.ok) {
      throw new Error(
        `Kon admin profiel niet expliciet bijwerken (${updateProfileResponse.status})`
      );
    }
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const verifyProfileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=id,rol`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    if (!verifyProfileResponse.ok) {
      throw new Error(
        `Kon admin profiel niet verifiëren (${verifyProfileResponse.status})`
      );
    }

    const profileRows = await verifyProfileResponse.json();
    const verifiedRole =
      Array.isArray(profileRows) && profileRows.length ? profileRows[0]?.rol ?? null : null;

    if (verifiedRole === "admin") {
      return email;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Admin profielrol bleef niet op 'admin' staan.");
}

async function loginUser(page, email, redirectPath) {
  await gotoStable(page, `/inloggen?redirect=${encodeURIComponent(redirectPath)}`);
  const loginForm = page.locator("form").first();
  await loginForm.getByLabel("E-mailadres").fill(email);
  await loginForm.locator('input[name="password"]').fill(TEST_PASSWORD);
  await loginForm.getByRole("button", { name: "Inloggen", exact: true }).click();

  await page
    .waitForURL(`**${redirectPath}`, { timeout: 45_000 })
    .catch(async () => {
      await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

      if (!page.url().includes(redirectPath)) {
        const bodyText = await getBodyText(page).catch(() => "");
        throw new Error(
          `Inloggen bleef op ${page.url()} in plaats van ${redirectPath}. Body: ${bodyText.slice(0, 240)}`
        );
      }
    });
  await page.waitForTimeout(2_000);
}

async function inspectDialog(page, buttonNames) {
  const names = Array.isArray(buttonNames) ? buttonNames : [buttonNames];
  let resolvedButtonName = null;

  for (const name of names) {
    const count = await page.getByRole("button", { name }).count();

    if (count > 0) {
      resolvedButtonName = name;
      break;
    }
  }

  if (!resolvedButtonName) {
    throw new Error(`Geen knop gevonden voor: ${names.join(", ")}`);
  }

  async function openDialog() {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const freshButton = page.getByRole("button", { name: resolvedButtonName }).first();
        await freshButton.waitFor({ state: "visible", timeout: 8_000 });
        await freshButton.scrollIntoViewIfNeeded();
        await freshButton.click({ force: true });
        return;
      } catch (error) {
        if (attempt === 1) {
          throw error;
        }

        await page.waitForTimeout(250);
      }
    }
  }

  async function closeDialog() {
    const activeDialog = page.locator('[role="dialog"]').last();
    const closeButton = activeDialog.getByRole("button", { name: "Close" });

    if ((await closeButton.count()) > 0) {
      await closeButton.click({ force: true });
    } else {
      await page.keyboard.press("Escape");
    }

    await activeDialog.waitFor({ state: "hidden", timeout: 8_000 }).catch(() => {});
    await page.waitForTimeout(350);
  }

  await openDialog();

  let dialog = page.locator('[role="dialog"]').last();

  try {
    await dialog.waitFor({ state: "visible", timeout: 8_000 });
  } catch {
    await page.keyboard.press("Escape").catch(() => null);
    await page.waitForTimeout(250);
    await openDialog();
    dialog = page.locator('[role="dialog"]').last();
    await dialog.waitFor({ state: "visible", timeout: 8_000 });
  }
  await page.waitForTimeout(500);

  const stepOneText = await dialog.innerText();
  const hasNextStep = (await dialog.getByRole("button", { name: "Volgende stap" }).count()) > 0;

  if (hasNextStep) {
    const nextButton = page
      .locator('[role="dialog"]')
      .last()
      .getByRole("button", { name: "Volgende stap" });
    await nextButton.click({ force: true });
    await page.waitForTimeout(350);
  }

  dialog = page.locator('[role="dialog"]').last();
  const dialogText = await dialog.innerText({ timeout: 8_000 });
  const normalizedStepOneText = stepOneText.toLowerCase();
  const normalizedDialogText = dialogText.toLowerCase();
  const hasLiveSlotPicker = (await dialog.locator('[role="combobox"]').count()) > 0;
  const hasManualTimeInput = (await dialog.locator("input#tijdvak").count()) > 0;

  await closeDialog();

  return {
    buttonName: resolvedButtonName,
    isPackageFlow: resolvedButtonName.toLowerCase().includes("pakket"),
    hasAvailableMoment:
      normalizedDialogText.includes("beschikbaar moment") ||
      normalizedDialogText.includes("kies een open tijdvak"),
    hasPreviewMoments:
      normalizedStepOneText.includes("eerstvolgende beschikbare momenten") ||
      normalizedStepOneText.includes("eerstvolgende momenten"),
    hasLiveAgendaBlock: normalizedDialogText.includes("gekozen uit live agenda"),
    hasLiveSlotPicker,
    hasManualTimeInput,
  };
}

async function checkLearnerDialogs(page, failures) {
  await checkRoute(page, "/instructeurs", failures, {
    expectPathStartsWith: "/instructeurs",
  });

  const listText = await getBodyText(page);
  assertCondition(
    !listText.includes("Eerstvolgende beschikbare momenten") &&
      !listText.includes("Eerstvolgende momenten"),
    "[/instructeurs] tijden zijn zichtbaar voordat de popup geopend is",
    failures
  );
  assertCondition(
    !listText.includes("Beschikbaar moment"),
    "[/instructeurs] live beschikbaarheidsselectie is zichtbaar voordat de popup geopend is",
    failures
  );

  const packageDialogOnList = await inspectDialog(page, [
    "Vraag pakket aan",
    "Vraag dit pakket aan",
    "Les aanvragen",
  ]);
  assertCondition(
    packageDialogOnList.hasLiveSlotPicker || packageDialogOnList.hasManualTimeInput,
    "[/instructeurs] pakket-popup toont geen bruikbare momentkeuze in stap 2",
    failures
  );
  assertCondition(
    !(packageDialogOnList.hasLiveSlotPicker && packageDialogOnList.hasManualTimeInput),
    "[/instructeurs] pakket-popup toont tegelijk live tijdkeuze en handmatige tijdinvoer",
    failures
  );

  const proeflesDialogOnList = await inspectDialog(page, [
    "Plan proefles",
    "Vraag proefles op moment aan",
    "Vraag proefles aan",
    "Kies proeflesmoment",
    "Boek dit moment als proefles",
  ]);
  assertCondition(
    proeflesDialogOnList.hasLiveSlotPicker || proeflesDialogOnList.hasManualTimeInput,
    "[/instructeurs] proefles-popup toont geen bruikbare momentkeuze in stap 2",
    failures
  );
  assertCondition(
    !(proeflesDialogOnList.hasLiveSlotPicker && proeflesDialogOnList.hasManualTimeInput),
    "[/instructeurs] proefles-popup toont tegelijk live tijdkeuze en handmatige tijdinvoer",
    failures
  );

  const detailLink = page
    .locator('a[href^="/instructeurs/"]')
    .filter({ hasText: /Bekijk profiel/i })
    .first();
  const detailHref = await detailLink.getAttribute("href");

  if (!detailHref) {
    throw new Error("Geen instructeur-detail link gevonden.");
  }

  await detailLink.click();
  await page.waitForURL(`**${detailHref}`, { timeout: 30_000 });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2_000);

  const detailText = await getBodyText(page);
  assertCondition(
    !detailText.includes("Eerstvolgende beschikbare momenten") &&
      !detailText.includes("Eerstvolgende momenten"),
    `[${page.url()}] tijden zijn zichtbaar voordat de popup geopend is`,
    failures
  );
  assertCondition(
    !detailText.includes("Beschikbaar moment"),
    `[${page.url()}] live beschikbaarheidsselectie is zichtbaar voordat de popup geopend is`,
    failures
  );

  const packageDialogOnDetail = await inspectDialog(page, [
    "Vraag dit pakket aan",
    "Vraag pakket aan",
    "Les aanvragen",
  ]);
  assertCondition(
    packageDialogOnDetail.hasLiveSlotPicker || packageDialogOnDetail.hasManualTimeInput,
    `[${page.url()}] pakket-popup toont geen bruikbare momentkeuze in stap 2`,
    failures
  );
  assertCondition(
    !(packageDialogOnDetail.hasLiveSlotPicker && packageDialogOnDetail.hasManualTimeInput),
    `[${page.url()}] pakket-popup toont tegelijk live tijdkeuze en handmatige tijdinvoer`,
    failures
  );

  const proeflesDialogOnDetail = await inspectDialog(page, [
    "Plan proefles",
    "Vraag proefles op moment aan",
    "Vraag proefles aan",
    "Kies proeflesmoment",
    "Boek dit moment als proefles",
  ]);
  assertCondition(
    proeflesDialogOnDetail.hasLiveSlotPicker || proeflesDialogOnDetail.hasManualTimeInput,
    `[${page.url()}] proefles-popup toont geen bruikbare momentkeuze in stap 2`,
    failures
  );
  assertCondition(
    !(proeflesDialogOnDetail.hasLiveSlotPicker && proeflesDialogOnDetail.hasManualTimeInput),
    `[${page.url()}] proefles-popup toont tegelijk live tijdkeuze en handmatige tijdinvoer`,
    failures
  );

  return {
    list: {
      packageDialogOnList,
      proeflesDialogOnList,
    },
    detail: {
      url: page.url(),
      packageDialogOnDetail,
      proeflesDialogOnDetail,
    },
  };
}

async function checkAvailabilityInteractions(page, failures) {
  await checkRoute(page, "/instructeur/beschikbaarheid", failures, {
    expectPathStartsWith: "/instructeur/beschikbaarheid",
    expectText: "Beschikbaarheid",
  });

  const afterBlockingText = await getBodyText(page);
  assertCondition(
    afterBlockingText.includes("Snel je beschikbaarheid aanpassen") &&
      afterBlockingText.includes("Jouw beschikbaarheid in cijfers") &&
      afterBlockingText.includes("Beschikbaarheid / Openingstijden"),
    "[/instructeur/beschikbaarheid] beschikbaarheidsbeheer, cijfers of openingstijden ontbreken",
    failures
  );

  const hasOnlineBookingToggle =
    (await page
      .getByRole("button", { name: "Zet online boeking aan" })
      .count()) > 0 ||
    (await page
      .getByRole("button", { name: "Zet online boeking uit" })
      .count()) > 0;
  assertCondition(
    hasOnlineBookingToggle ||
      afterBlockingText.includes("Sta online boekingen toe via jouw publieke agenda") ||
      afterBlockingText.includes("Open voor boeking") ||
      afterBlockingText.includes("Alleen op vrijgave"),
    "[/instructeur/beschikbaarheid] online boeking-toggle ontbreekt",
    failures
  );
}

async function cleanupUsers(emails) {
  const uniqueEmails = Array.from(new Set(emails.filter(Boolean)));

  if (!uniqueEmails.length) {
    return [];
  }

  const { supabaseUrl, serviceKey } = await getSupabaseAdminContext();

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=200`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (!authResponse.ok) {
    throw new Error(`Kon auth users niet ophalen (${authResponse.status})`);
  }

  const authPayload = await authResponse.json();
  const users = authPayload.users ?? [];
  const usersByEmail = new Map(
    users
      .filter((user) => typeof user.email === "string")
      .map((user) => [user.email.toLowerCase(), user.id])
  );

  const deletedEmails = [];

  for (const email of uniqueEmails) {
    const userId = usersByEmail.get(email.toLowerCase());

    if (!userId) {
      continue;
    }

    const deleteResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!deleteResponse.ok) {
      throw new Error(`Kon testaccount ${email} niet verwijderen (${deleteResponse.status})`);
    }

    deletedEmails.push(email);
  }

  return deletedEmails;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const createdEmails = [];
  const failures = [];
  const summary = {
    publicRoutes: [],
    learnerRoutes: [],
    learnerDialogs: null,
    instructorRoutes: [],
    adminRoutes: [],
    cleanup: [],
  };

  try {
    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();

    for (const route of [
      "/",
      "/pakketten",
      "/motor",
      "/vrachtwagen",
      "/over-ons",
      "/contact",
      "/inloggen",
      "/registreren",
      "/wachtwoord-vergeten",
    ]) {
      summary.publicRoutes.push(await checkRoute(publicPage, route, failures, {
        expectPathStartsWith: route,
      }));
    }

    summary.publicRoutes.push(
      await checkRoute(publicPage, "/instructeurs", failures, {
        expectPathStartsWith: "/instructeurs",
      })
    );

    await publicContext.close();

    const learnerContext = await browser.newContext();
    const learnerPage = await learnerContext.newPage();
    const learnerEmail = await registerUser(
      learnerPage,
      "leerling",
      "/leerling/dashboard"
    );
    createdEmails.push(learnerEmail);

    for (const route of [
      "/leerling/dashboard",
      "/leerling/boekingen",
      "/leerling/berichten",
      "/leerling/betalingen",
      "/leerling/instructeurs",
      "/leerling/profiel",
      "/leerling/instellingen",
      "/leerling/reviews",
      "/instructeurs",
    ]) {
      summary.learnerRoutes.push(
        await checkRoute(learnerPage, route, failures, {
          expectPathStartsWith:
            route === "/leerling/dashboard"
              ? ["/leerling/dashboard", "/leerling/profiel"]
              : route,
        })
      );
    }

    summary.learnerDialogs = await checkLearnerDialogs(learnerPage, failures);
    await learnerContext.close();

    const instructorContext = await browser.newContext();
    const instructorPage = await instructorContext.newPage();
    const instructorEmail = await registerUser(
      instructorPage,
      "instructeur",
      "/instructeur/regie"
    );
    createdEmails.push(instructorEmail);

    for (const route of [
      "/instructeur/regie",
      "/instructeur/dashboard",
      "/instructeur/beschikbaarheid",
      "/instructeur/aanvragen",
      "/instructeur/lessen",
      "/instructeur/leerlingen",
      "/instructeur/berichten",
      "/instructeur/inkomsten",
      "/instructeur/pakketten",
      "/instructeur/profiel",
      "/instructeur/reviews",
      "/instructeur/instellingen",
    ]) {
      summary.instructorRoutes.push(
        await checkRoute(instructorPage, route, failures, {
          expectPathStartsWith: route,
        })
      );
    }

    await checkAvailabilityInteractions(instructorPage, failures);
    await instructorContext.close();

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    const adminEmail = await createAdminUser();
    createdEmails.push(adminEmail);

    await loginUser(adminPage, adminEmail, "/admin/dashboard");

    for (const route of [
      "/admin/dashboard",
      "/admin/gebruikers",
      "/admin/instructeurs",
      "/admin/leerlingen",
      "/admin/lessen",
      "/admin/betalingen",
      "/admin/pakketten",
      "/admin/reviews",
      "/admin/support",
      "/admin/instellingen",
    ]) {
      summary.adminRoutes.push(
        await checkRoute(adminPage, route, failures, {
          expectPathStartsWith: route,
        })
      );
    }

    await adminContext.close();
  } finally {
    try {
      summary.cleanup = await cleanupUsers(createdEmails);
    } catch (cleanupError) {
      failures.push(`Cleanup mislukt: ${cleanupError.message}`);
    }

    await browser.close();
  }

  console.log(JSON.stringify(summary, null, 2));

  if (failures.length) {
    console.error("\nClickcheck failures:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
