import { readFileSync } from "node:fs";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "Test123!Aa";
const TEST_PHONE = "06 98 76 54 32";

function readLocalEnv(name) {
  const envText = readFileSync(".env.local", "utf8");
  const match = envText.match(new RegExp(`^${name}=(.*)$`, "m"));

  if (!match) {
    throw new Error(`Missing ${name} in .env.local`);
  }

  return match[1].trim();
}

function tryReadLocalEnv(name) {
  try {
    return readLocalEnv(name);
  } catch {
    return null;
  }
}

function buildUrl(pathname) {
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    return pathname;
  }

  return `${BASE_URL}${pathname}`;
}

function createTempEmail(prefix) {
  return `codex.requestcheck.${prefix}.${Date.now()}.${Math.random()
    .toString(36)
    .slice(2, 8)}@example.com`;
}

function createSlug(prefix) {
  return `codex-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function getSupabaseAdminContext() {
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

  return { supabaseUrl, serviceKey };
}

async function adminFetch(pathname, options = {}) {
  const { supabaseUrl, serviceKey } = await getSupabaseAdminContext();
  const response = await fetch(`${supabaseUrl}${pathname}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(options.headers ?? {}),
    },
  });

  return response;
}

async function signInForAccessToken(email) {
  const supabaseUrl = readLocalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    tryReadLocalEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ??
    readLocalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: publishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: TEST_PASSWORD,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Kon geen access token ophalen (${response.status})`);
  }

  const payload = await response.json();
  return {
    accessToken: payload.access_token,
    publishableKey,
    supabaseUrl,
  };
}

async function fetchAuthenticatedLessonRequests(email, instructorId) {
  const { accessToken, publishableKey, supabaseUrl } =
    await signInForAccessToken(email);

  const response = await fetch(
    `${supabaseUrl}/rest/v1/lesaanvragen?select=id,status,instructeur_id&instructeur_id=eq.${instructorId}`,
    {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Kon geauthenticeerde lesaanvragen niet ophalen (${response.status}): ${errorText}`
    );
  }

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

  if (!response.ok) {
    throw new Error(`Kon ${role} auth user niet aanmaken (${response.status})`);
  }

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

  if (!response.ok) {
    throw new Error(`Kon profiel voor ${email} niet upserten (${response.status})`);
  }
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
    }),
  });

  if (response.status === 409) {
    const existingResponse = await adminFetch(
      `/rest/v1/leerlingen?profile_id=eq.${profileId}&select=id,profile_id`,
      {
        headers: {
          Prefer: "return=representation",
        },
      }
    );

    if (!existingResponse.ok) {
      throw new Error(
        `Kon bestaand leerlingrecord niet ophalen (${existingResponse.status})`
      );
    }

    const existingRows = await existingResponse.json();
    return existingRows[0];
  }

  if (!response.ok) {
    throw new Error(`Kon leerlingrecord niet aanmaken (${response.status})`);
  }

  const rows = await response.json();
  return rows[0];
}

async function createInstructorRecord(profileId) {
  const response = await adminFetch("/rest/v1/instructeurs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      profile_id: profileId,
      slug: createSlug("request-actions"),
      bio: "Test instructeur voor request action check",
      werkgebied: ["Amsterdam"],
      profiel_status: "goedgekeurd",
      prijs_per_les: 65,
      transmissie: "beide",
      specialisaties: ["Examentraining"],
    }),
  });

  if (response.status === 409) {
    const existingResponse = await adminFetch(
      `/rest/v1/instructeurs?profile_id=eq.${profileId}&select=id,profile_id,slug`,
      {
        headers: {
          Prefer: "return=representation",
        },
      }
    );

    if (!existingResponse.ok) {
      throw new Error(
        `Kon bestaand instructeurrecord niet ophalen (${existingResponse.status})`
      );
    }

    const existingRows = await existingResponse.json();
    return existingRows[0];
  }

  if (!response.ok) {
    throw new Error(`Kon instructeurrecord niet aanmaken (${response.status})`);
  }

  const rows = await response.json();
  return rows[0];
}

async function createRequest({ leerlingId, instructeurId, datum, tijdvak, bericht }) {
  const response = await adminFetch("/rest/v1/lesaanvragen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      leerling_id: leerlingId,
      instructeur_id: instructeurId,
      voorkeursdatum: datum,
      tijdvak,
      status: "aangevraagd",
      bericht,
    }),
  });

  if (!response.ok) {
    throw new Error(`Kon lesaanvraag niet aanmaken (${response.status})`);
  }

  const rows = await response.json();
  return rows[0];
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

async function gotoStable(page, pathname) {
  await page.goto(buildUrl(pathname), {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForLoadState("load", { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(1_500);
}

async function loginUser(page, email, redirectPath) {
  await gotoStable(page, `/inloggen?redirect=${encodeURIComponent(redirectPath)}`);
  await page.getByLabel("E-mailadres").fill(email);
  await page.locator('input[name="password"]').fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Inloggen", exact: true }).click();
  await page.waitForURL(`**${redirectPath}`, { timeout: 30_000 });
  await page.waitForTimeout(1_500);
}

async function expectDialog(page, buttonName, dialogTitle) {
  const button = page.getByRole("button", { name: buttonName }).first();
  const count = await page.getByRole("button", { name: buttonName }).count();

  if (!count) {
    const bodyText = await page.locator("body").innerText();
    throw new Error(
      `Geen knop gevonden voor "${buttonName}" op ${page.url()}\n\n${bodyText.slice(
        0,
        1500
      )}`
    );
  }

  await button.click();
  const dialog = page.locator('[role="dialog"]').last();
  await dialog.waitFor({ state: "visible", timeout: 8_000 });
  await dialog.getByRole("heading", { name: dialogTitle }).waitFor({
    timeout: 8_000,
  });
  return dialog;
}

async function run() {
  const createdUserIds = [];
  const browser = await chromium.launch({ headless: true });

  try {
    const learnerIdentity = await createAuthUser(
      "leerling",
      "Codex Learner Request Check"
    );
    createdUserIds.push(learnerIdentity.userId);
    await upsertProfile({
      userId: learnerIdentity.userId,
      email: learnerIdentity.email,
      role: "leerling",
      displayName: "Codex Learner Request Check",
    });
    const learner = await createLearnerRecord(learnerIdentity.userId);

    const instructorIdentity = await createAuthUser(
      "instructeur",
      "Codex Instructor Request Check"
    );
    createdUserIds.push(instructorIdentity.userId);
    await upsertProfile({
      userId: instructorIdentity.userId,
      email: instructorIdentity.email,
      role: "instructeur",
      displayName: "Codex Instructor Request Check",
    });
    const instructor = await createInstructorRecord(instructorIdentity.userId);

    await createRequest({
      leerlingId: learner.id,
      instructeurId: instructor.id,
      datum: "2026-05-12",
      tijdvak: "18:00 - 19:30",
      bericht: "Eerste testaanvraag voor verplaatsen.",
    });
    const secondRequest = await createRequest({
      leerlingId: learner.id,
      instructeurId: instructor.id,
      datum: "2026-05-14",
      tijdvak: "19:30 - 21:00",
      bericht: "Tweede testaanvraag voor instructeuractie.",
    });

    console.log(
      JSON.stringify(
        {
          seed: {
            learnerId: learner.id,
            instructorId: instructor.id,
            secondRequestId: secondRequest.id,
            secondRequestInstructorId: secondRequest.instructeur_id,
          },
        },
        null,
        2
      )
    );

    const authenticatedInstructorRows = await fetchAuthenticatedLessonRequests(
      instructorIdentity.email,
      instructor.id
    );

    console.log(
      JSON.stringify(
        {
          authenticatedInstructorRows,
        },
        null,
        2
      )
    );

    const learnerContext = await browser.newContext();
    const learnerPage = await learnerContext.newPage();
    await loginUser(learnerPage, learnerIdentity.email, "/leerling/boekingen");
    await gotoStable(learnerPage, "/leerling/boekingen");

    const learnerRescheduleDialog = await expectDialog(
      learnerPage,
      "Verplaatsen",
      "Aanvraag verplaatsen"
    );
    await learnerRescheduleDialog
      .getByLabel("Nieuwe datum")
      .fill("2026-05-16");
    await learnerRescheduleDialog
      .getByLabel("Nieuw tijdvak")
      .fill("20:00 - 21:30");
    await learnerRescheduleDialog
      .getByLabel("Toelichting")
      .fill("Gerichte clickcheck verplaatsing.");
    await learnerPage.keyboard.press("Escape");
    await learnerRescheduleDialog.waitFor({ state: "hidden", timeout: 8_000 });

    const learnerCancelDialog = await expectDialog(
      learnerPage,
      "Annuleren",
      "Aanvraag annuleren"
    );
    await learnerCancelDialog
      .getByLabel("Reden van annuleren")
      .fill("Alleen dialog-check, niet afronden.");
    await learnerPage.keyboard.press("Escape");
    await learnerCancelDialog.waitFor({ state: "hidden", timeout: 8_000 });
    await learnerContext.close();

    const instructorContext = await browser.newContext();
    const instructorPage = await instructorContext.newPage();
    await loginUser(
      instructorPage,
      instructorIdentity.email,
      "/instructeur/aanvragen"
    );
    await gotoStable(instructorPage, "/instructeur/aanvragen");

    const acceptDialog = await expectDialog(
      instructorPage,
      "Accepteren",
      "Aanvraag accepteren"
    );
    await acceptDialog.getByRole("combobox").waitFor({ timeout: 8_000 });
    await instructorPage.keyboard.press("Escape");
    await acceptDialog.waitFor({ state: "hidden", timeout: 8_000 });

    const rejectDialog = await expectDialog(
      instructorPage,
      "Weigeren",
      "Aanvraag weigeren"
    );
    await rejectDialog
      .getByLabel("Reden van weigeren")
      .fill("Gerichte clickcheck weigering.");
    await instructorPage.keyboard.press("Escape");
    await rejectDialog.waitFor({ state: "hidden", timeout: 8_000 });
    await instructorContext.close();

    console.log(
      JSON.stringify(
        {
          success: true,
          learner: {
            route: "/leerling/boekingen",
            rescheduleDialog: "ok",
            cancelDialog: "ok",
            dialogFieldCheck: "ok",
          },
          instructor: {
            route: "/instructeur/aanvragen",
            acceptDialog: "ok",
            rejectDialog: "ok",
            dialogFieldCheck: "ok",
          },
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
    await deleteAuthUsers(createdUserIds);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
