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

function buildUrl(pathname) {
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    return pathname;
  }

  return `${BASE_URL}${pathname}`;
}

function createTempEmail(prefix) {
  return `codex.directbooking.${prefix}.${Date.now()}.${Math.random()
    .toString(36)
    .slice(2, 8)}@example.com`;
}

function createSlug(prefix) {
  return `codex-${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
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
  return fetch(`${supabaseUrl}${pathname}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(options.headers ?? {}),
    },
  });
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
    const errorText = await response.text();
    throw new Error(`Kon ${role} auth user niet aanmaken (${response.status}): ${errorText}`);
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
    const errorText = await response.text();
    throw new Error(`Kon profiel voor ${email} niet upserten (${response.status}): ${errorText}`);
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
    const errorText = await response.text();
    throw new Error(`Kon leerlingrecord niet aanmaken (${response.status}): ${errorText}`);
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
      slug: createSlug("direct-booking"),
      bio: "Test instructeur voor directe boekingscheck",
      werkgebied: ["Amsterdam"],
      profiel_status: "goedgekeurd",
      prijs_per_les: 67,
      transmissie: "beide",
      specialisaties: ["Examentraining", "Stadsverkeer"],
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
    const errorText = await response.text();
    throw new Error(`Kon instructeurrecord niet aanmaken (${response.status}): ${errorText}`);
  }

  const rows = await response.json();
  return rows[0];
}

async function createLesson({
  leerlingId,
  instructeurId,
  titel,
  startAt,
  duurMinuten,
  status,
}) {
  const response = await adminFetch("/rest/v1/lessen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      leerling_id: leerlingId,
      instructeur_id: instructeurId,
      titel,
      start_at: startAt,
      duur_minuten: duurMinuten,
      status,
      notities: "Seed voor directe boekingscheck",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kon seedles niet aanmaken (${response.status}): ${errorText}`);
  }

  const rows = await response.json();
  return rows[0];
}

async function createAvailabilitySlot({ instructeurId, startAt, endAt }) {
  const response = await adminFetch("/rest/v1/beschikbaarheid", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      instructeur_id: instructeurId,
      start_at: startAt,
      eind_at: endAt,
      beschikbaar: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kon beschikbaarheid niet aanmaken (${response.status}): ${errorText}`);
  }

  const rows = await response.json();
  return rows[0];
}

async function upsertPlanningRights({
  leerlingId,
  instructeurId,
  vrijgegevenAt,
}) {
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
          vrijgegeven_at: vrijgegevenAt,
        },
      ]),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Kon planningsrechten niet opslaan (${response.status}): ${errorText}`
    );
  }

  const rows = await response.json();
  return rows[0];
}

async function waitForRows(pathname, predicate, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let lastRows = [];

  while (Date.now() < deadline) {
    const response = await adminFetch(pathname, {
      headers: {
        Prefer: "return=representation",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Kon rows niet ophalen voor ${pathname} (${response.status}): ${errorText}`
      );
    }

    const rows = await response.json();
    lastRows = Array.isArray(rows) ? rows : [];

    if (predicate(lastRows)) {
      return lastRows;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
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
  await page.waitForTimeout(1500);
}

async function loginUser(page, email, redirectPath) {
  await gotoStable(page, `/inloggen?redirect=${encodeURIComponent(redirectPath)}`);
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL(`**${redirectPath}`, { timeout: 30_000 });
  await page.waitForTimeout(1500);
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

async function cleanupRows({ learnerId, instructorId }) {
  if (learnerId && instructorId) {
    await adminFetch(
      `/rest/v1/lessen?leerling_id=eq.${learnerId}&instructeur_id=eq.${instructorId}`,
      {
        method: "DELETE",
      }
    );

    await adminFetch(
      `/rest/v1/lesaanvragen?leerling_id=eq.${learnerId}&instructeur_id=eq.${instructorId}`,
      {
        method: "DELETE",
      }
    );

    await adminFetch(
      `/rest/v1/leerling_planningsrechten?leerling_id=eq.${learnerId}&instructeur_id=eq.${instructorId}`,
      {
        method: "DELETE",
      }
    );

    await adminFetch(
      `/rest/v1/beschikbaarheid?instructeur_id=eq.${instructorId}`,
      {
        method: "DELETE",
      }
    );
  }

  if (instructorId) {
    await adminFetch(`/rest/v1/instructeurs?id=eq.${instructorId}`, {
      method: "DELETE",
    });
  }

  if (learnerId) {
    await adminFetch(`/rest/v1/leerlingen?id=eq.${learnerId}`, {
      method: "DELETE",
    });
  }
}

async function run() {
  const createdUserIds = [];
  let learner = null;
  let instructor = null;
  const browser = await chromium.launch({ headless: true });

  try {
    const learnerIdentity = await createAuthUser(
      "leerling",
      "Codex Direct Booking Learner"
    );
    createdUserIds.push(learnerIdentity.userId);
    await upsertProfile({
      userId: learnerIdentity.userId,
      email: learnerIdentity.email,
      role: "leerling",
      displayName: "Codex Direct Booking Learner",
    });
    learner = await createLearnerRecord(learnerIdentity.userId);

    const instructorIdentity = await createAuthUser(
      "instructeur",
      "Codex Direct Booking Instructor"
    );
    createdUserIds.push(instructorIdentity.userId);
    await upsertProfile({
      userId: instructorIdentity.userId,
      email: instructorIdentity.email,
      role: "instructeur",
      displayName: "Codex Direct Booking Instructor",
    });
    instructor = await createInstructorRecord(instructorIdentity.userId);

    await createLesson({
      leerlingId: learner.id,
      instructeurId: instructor.id,
      titel: "Bestaande trajectles",
      startAt: "2026-05-10T09:00:00+02:00",
      duurMinuten: 90,
      status: "geaccepteerd",
    });

    await upsertPlanningRights({
      leerlingId: learner.id,
      instructeurId: instructor.id,
      vrijgegevenAt: "2026-05-01T10:00:00+02:00",
    });

    const seededAvailability = await createAvailabilitySlot({
      instructeurId: instructor.id,
      startAt: "2026-05-19T10:00:00+02:00",
      endAt: "2026-05-19T11:30:00+02:00",
    });

    const page = await browser.newPage();
    const directBookingPath = `/instructeurs/${instructor.slug}`;
    const expectedBookedTimeSlot = "10:00 - 11:00";
    const expectedDurationMinutes = 60;
    await loginUser(page, learnerIdentity.email, directBookingPath);

    await page.getByRole("heading", { name: /Plan zelf een moment bij/i }).waitFor({
      timeout: 15_000,
    });

    const plannerButton = page.getByRole("button", { name: "Boek dit moment" }).first();
    await plannerButton.click();

    const dialog = page.locator('[role="dialog"]').last();
    await dialog.getByRole("heading", { name: "Direct inplannen" }).waitFor({
      timeout: 10_000,
    });

    const dialogText = await dialog.innerText();
    if (!dialogText.includes("direct in de agenda")) {
      throw new Error(
        `Dialog toont geen directe boekingscopy.\n\n${dialogText.slice(0, 1200)}`
      );
    }

    await dialog.getByRole("button", { name: "Volgende stap" }).click();
    await dialog.getByText("Gekozen uit live agenda").waitFor({ timeout: 10_000 });

    await dialog.getByRole("button", { name: "Volgende stap" }).click();
    await dialog.getByLabel("Opmerking").fill(
      "Playwright directe boekingscheck voor echt boekbaar moment."
    );
    await dialog.locator("form").evaluate((form) => form.requestSubmit());
    await page.waitForTimeout(3000);

    const matchingRequests = await waitForRows(
      `/rest/v1/lesaanvragen?leerling_id=eq.${learner.id}&instructeur_id=eq.${instructor.id}&select=id,status,voorkeursdatum,tijdvak,bericht,created_at&order=created_at.desc`,
      (rows) =>
        rows.some(
          (row) =>
            row.status === "ingepland" &&
            row.voorkeursdatum === "2026-05-19" &&
            row.tijdvak === expectedBookedTimeSlot
        )
    );

    const directRequest = matchingRequests.find(
      (row) =>
        row.status === "ingepland" &&
        row.voorkeursdatum === "2026-05-19" &&
        row.tijdvak === expectedBookedTimeSlot
    );

    if (!directRequest) {
      throw new Error("Direct ingeplande lesaanvraag niet gevonden.");
    }

    const matchingLessons = await waitForRows(
      `/rest/v1/lessen?leerling_id=eq.${learner.id}&instructeur_id=eq.${instructor.id}&select=id,status,start_at,duur_minuten,notities,titel,created_at&order=created_at.desc`,
      (rows) =>
        rows.some(
          (row) =>
            row.status === "ingepland" &&
            row.start_at === seededAvailability.start_at &&
            row.duur_minuten === expectedDurationMinutes &&
            row.notities === `request-ref:${directRequest.id}`
        )
    );

    const directLesson = matchingLessons.find(
      (row) =>
        row.status === "ingepland" &&
        row.start_at === seededAvailability.start_at &&
        row.notities === `request-ref:${directRequest.id}`
    );

    if (!directLesson) {
      throw new Error("Direct ingeplande les niet gevonden.");
    }

    const result = {
      directBookingDialog: "ok",
      requestStatus: directRequest.status,
      requestId: directRequest.id,
      lessonStatus: directLesson.status,
      lessonId: directLesson.id,
      lessonStartAt: directLesson.start_at,
      linkedReference: directLesson.notities,
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
    await cleanupRows({
      learnerId: learner?.id ?? null,
      instructorId: instructor?.id ?? null,
    }).catch(() => {});
    await deleteAuthUsers(createdUserIds).catch(() => {});
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
