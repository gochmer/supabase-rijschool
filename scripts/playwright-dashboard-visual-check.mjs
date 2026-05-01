import process from "node:process";
import { readFileSync } from "node:fs";

import { chromium } from "playwright";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "Test123!Aa";
const TEST_PHONE = "06 12 34 56 78";
const STRICT =
  process.env.PLAYWRIGHT_DASHBOARD_VISUAL_STRICT === "true" ||
  process.env.CI === "true";
const TEST_NAMES = {
  leerling: "Codex Dashboard Learner",
  instructeur: "Codex Dashboard Instructor",
  admin: "Codex Dashboard Admin",
};
const FATAL_TEXT_PATTERNS = [
  "Application error",
  "Something went wrong",
  "This page couldn't load",
  "This page could not be found",
  "Unhandled Runtime Error",
  "Missing env.",
];

const DASHBOARD_ROLES = [
  {
    role: "leerling",
    emailEnv: "PLAYWRIGHT_LEARNER_EMAIL",
    routes: ["/leerling/dashboard", "/leerling/profiel", "/leerling/boekingen"],
  },
  {
    role: "instructeur",
    emailEnv: "PLAYWRIGHT_INSTRUCTOR_EMAIL",
    routes: [
      "/instructeur/dashboard",
      "/instructeur/leerlingen",
      "/instructeur/pakketten",
      "/instructeur/instellingen",
    ],
  },
  {
    role: "admin",
    emailEnv: "PLAYWRIGHT_ADMIN_EMAIL",
    routes: ["/admin/dashboard", "/admin/instructeurs", "/admin/support"],
  },
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobiel", width: 390, height: 844 },
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

function createTempEmail(prefix) {
  return `codex.dashboard.${prefix}.${Date.now()}.${Math.random()
    .toString(36)
    .slice(2, 8)}@example.com`;
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
    throw new Error(
      `Kon Supabase API keys niet ophalen (${apiKeysResponse.status})`
    );
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

async function createDashboardUser(role) {
  const email = createTempEmail(role);
  const displayName = TEST_NAMES[role];
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
      app_metadata: { rol: role },
      user_metadata: {
        rol: role,
        volledige_naam: displayName,
        telefoon: TEST_PHONE,
      },
    }),
  });

  if (!createUserResponse.ok) {
    throw new Error(
      `Kon ${role} testuser niet aanmaken (${createUserResponse.status})`
    );
  }

  const createdUserPayload = await createUserResponse.json();
  const userId = createdUserPayload.user?.id ?? createdUserPayload.id ?? null;

  if (!userId) {
    throw new Error(`${role} testuser is aangemaakt zonder user id.`);
  }

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?on_conflict=id`,
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
          id: userId,
          volledige_naam: displayName,
          email,
          telefoon: TEST_PHONE,
          avatar_url: null,
          rol: role,
        },
      ]),
    }
  );

  if (!profileResponse.ok) {
    throw new Error(
      `Kon ${role} profiel niet upserten (${profileResponse.status})`
    );
  }

  if (role === "leerling") {
    const learnerResponse = await fetch(
      `${supabaseUrl}/rest/v1/leerlingen?on_conflict=profile_id`,
      {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify([{ profile_id: userId }]),
      }
    );

    if (!learnerResponse.ok) {
      throw new Error(
        `Kon leerling record niet upserten (${learnerResponse.status})`
      );
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
            slug: `codex-dashboard-instructeur-${userId.slice(0, 8)}`,
            volledige_naam: displayName,
            bio: "Playwright dashboard test instructeur",
            werkgebied: ["Amsterdam"],
            specialisaties: ["Personenauto (B)"],
            profiel_status: "goedgekeurd",
            profiel_compleetheid: 100,
          },
        ]),
      }
    );

    if (!instructorResponse.ok) {
      throw new Error(
        `Kon instructeur record niet upserten (${instructorResponse.status})`
      );
    }
  }

  return email;
}

async function cleanupUsers(emails) {
  const uniqueEmails = Array.from(new Set(emails.filter(Boolean)));

  if (!uniqueEmails.length) {
    return [];
  }

  const { supabaseUrl, serviceKey } = await getSupabaseAdminContext();
  const authResponse = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=200`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );

  if (!authResponse.ok) {
    throw new Error(`Kon userlijst niet ophalen (${authResponse.status})`);
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

    const deleteResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${userId}`,
      {
        method: "DELETE",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    if (!deleteResponse.ok) {
      throw new Error(
        `Kon testaccount ${email} niet verwijderen (${deleteResponse.status})`
      );
    }

    deletedEmails.push(email);
  }

  return deletedEmails;
}

function buildUrl(pathname) {
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    return pathname;
  }

  return `${BASE_URL}${pathname}`;
}

async function gotoStable(page, pathname) {
  const response = await page.goto(buildUrl(pathname), {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await page.waitForLoadState("load", { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(1_000);

  return response;
}

async function loginUser(page, email, redirectPath) {
  await gotoStable(page, `/inloggen?redirect=${encodeURIComponent(redirectPath)}`);
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL(`**${redirectPath}`, { timeout: 30_000 });
  await page.waitForTimeout(1_000);
}

async function collectPageIssues(page, route, viewportName) {
  const issues = [];
  const bodyText = await page.locator("body").innerText();
  const fatalMatches = FATAL_TEXT_PATTERNS.filter((pattern) =>
    bodyText.includes(pattern)
  );

  if (fatalMatches.length) {
    issues.push(
      `[${viewportName}] ${route}: fatale tekst gevonden (${fatalMatches.join(", ")})`
    );
  }

  const layout = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyHeight: document.body.scrollHeight,
    visibleText: document.body.innerText.length,
  }));

  if (layout.scrollWidth > layout.viewportWidth + 8) {
    issues.push(
      `[${viewportName}] ${route}: horizontale overflow (${layout.scrollWidth}px > ${layout.viewportWidth}px)`
    );
  }

  if (layout.bodyHeight < 320 || layout.visibleText < 80) {
    issues.push(`[${viewportName}] ${route}: pagina oogt leeg of te kort`);
  }

  return issues;
}

async function checkRole(browser, roleConfig, createdEmails) {
  let email = process.env[roleConfig.emailEnv];
  let seeded = false;

  if (!email) {
    email = await createDashboardUser(roleConfig.role);
    createdEmails.push(email);
    seeded = true;
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  const issues = [];

  try {
    await loginUser(page, email, roleConfig.routes[0]);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      for (const route of roleConfig.routes) {
        await gotoStable(page, route);
        issues.push(...(await collectPageIssues(page, route, viewport.name)));
      }
    }
  } finally {
    await context.close();
  }

  return {
    role: roleConfig.role,
    skipped: false,
    seeded,
    issues,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const createdEmails = [];
  const cleanupIssues = [];

  try {
    for (const roleConfig of DASHBOARD_ROLES) {
      results.push(await checkRole(browser, roleConfig, createdEmails));
    }
  } finally {
    await browser.close();

    try {
      await cleanupUsers(createdEmails);
    } catch (error) {
      cleanupIssues.push(
        error instanceof Error ? error.message : "Cleanup mislukt."
      );
    }
  }

  const skipped = results.filter((result) => result.skipped);
  const failures = results.flatMap((result) =>
    result.skipped && !STRICT ? [] : result.issues
  ).concat(cleanupIssues);

  for (const result of results) {
    const state = result.skipped
      ? STRICT
        ? "missing env"
        : "skipped"
      : result.issues.length
        ? "issues"
        : result.seeded
          ? "ok (tijdelijk testaccount)"
          : "ok";
    console.log(`[dashboards] ${result.role}: ${state}`);
  }

  if (skipped.length && !STRICT) {
    console.log(
      "[dashboards] Tip: zet PLAYWRIGHT_LEARNER_EMAIL, PLAYWRIGHT_INSTRUCTOR_EMAIL en PLAYWRIGHT_ADMIN_EMAIL voor volledige visuele dashboardchecks."
    );
  }

  if (failures.length) {
    console.error("\n[dashboards] Problemen gevonden:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("[dashboards] Visual dashboard check afgerond.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
