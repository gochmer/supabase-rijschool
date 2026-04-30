import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "Test123!Aa";
const STRICT =
  process.env.PLAYWRIGHT_DASHBOARD_VISUAL_STRICT === "true" ||
  process.env.CI === "true";
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

async function checkRole(browser, roleConfig) {
  const email = process.env[roleConfig.emailEnv];

  if (!email) {
    return {
      role: roleConfig.role,
      skipped: true,
      issues: [
        `${roleConfig.emailEnv} ontbreekt. Zet deze env-var om ${roleConfig.role}-dashboards visueel te checken.`,
      ],
    };
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
    issues,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const roleConfig of DASHBOARD_ROLES) {
      results.push(await checkRole(browser, roleConfig));
    }
  } finally {
    await browser.close();
  }

  const skipped = results.filter((result) => result.skipped);
  const failures = results.flatMap((result) =>
    result.skipped && !STRICT ? [] : result.issues
  );

  for (const result of results) {
    const state = result.skipped
      ? STRICT
        ? "missing env"
        : "skipped"
      : result.issues.length
        ? "issues"
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
