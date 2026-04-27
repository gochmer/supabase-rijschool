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
  return `codex.reviewcheck.${prefix}.${Date.now()}.${Math.random()
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

function getPublishableKey() {
  const envText = readFileSync(".env.local", "utf8");
  const publishableMatch = envText.match(
    /^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)$/m
  );
  const anonMatch = envText.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)$/m);

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    publishableMatch?.[1]?.trim() ??
    anonMatch?.[1]?.trim();

  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return key;
}

async function anonFetch(pathname, options = {}) {
  const supabaseUrl = readLocalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = getPublishableKey();

  return fetch(`${supabaseUrl}${pathname}`, {
    ...options,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
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
      slug: createSlug("review-flow"),
      bio: "Test instructeur voor review flow check",
      werkgebied: ["Amsterdam", "Amstelveen"],
      profiel_status: "goedgekeurd",
      prijs_per_les: 69,
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
  title,
  startAt,
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
      titel: title,
      start_at: startAt,
      duur_minuten: 90,
      status,
      notities: "Seed voor review flow check",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kon les niet aanmaken (${response.status}): ${errorText}`);
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

    await new Promise((resolve) => setTimeout(resolve, 1_500));
  }

  throw new Error(
    `Gezochte database-uitkomst niet gevonden voor ${pathname}. Laatste rows: ${JSON.stringify(
      lastRows,
      null,
      2
    )}`
  );
}

async function waitForAnonRows(pathname, predicate, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let lastRows = [];

  while (Date.now() < deadline) {
    const response = await anonFetch(pathname, {
      headers: {
        Prefer: "return=representation",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Kon anonieme rows niet ophalen voor ${pathname} (${response.status}): ${errorText}`
      );
    }

    const rows = await response.json();
    lastRows = Array.isArray(rows) ? rows : [];

    if (predicate(lastRows)) {
      return lastRows;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_500));
  }

  throw new Error(
    `Gezochte anonieme uitkomst niet gevonden voor ${pathname}. Laatste rows: ${JSON.stringify(
      lastRows,
      null,
      2
    )}`
  );
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

async function cleanupRows({
  reviewIds,
  lessonIds,
  learnerId,
  instructorId,
}) {
  if (reviewIds.length) {
    await adminFetch(`/rest/v1/reviews?id=in.(${reviewIds.join(",")})`, {
      method: "DELETE",
    });
  }

  if (lessonIds.length) {
    await adminFetch(`/rest/v1/lessen?id=in.(${lessonIds.join(",")})`, {
      method: "DELETE",
    });
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
  await page.getByLabel("Wachtwoord").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL(`**${redirectPath}`, { timeout: 30_000 });
  await page.waitForTimeout(1_500);
}

async function run() {
  const createdUserIds = [];
  const createdReviewIds = [];
  const createdLessonIds = [];
  let learner = null;
  let instructor = null;
  const browser = await chromium.launch({ headless: true });

  try {
    const learnerIdentity = await createAuthUser(
      "leerling",
      "Codex Review Check Learner"
    );
    createdUserIds.push(learnerIdentity.userId);
    await upsertProfile({
      userId: learnerIdentity.userId,
      email: learnerIdentity.email,
      role: "leerling",
      displayName: "Codex Review Check Learner",
    });
    learner = await createLearnerRecord(learnerIdentity.userId);

    const instructorIdentity = await createAuthUser(
      "instructeur",
      "Codex Review Check Instructor"
    );
    createdUserIds.push(instructorIdentity.userId);
    await upsertProfile({
      userId: instructorIdentity.userId,
      email: instructorIdentity.email,
      role: "instructeur",
      displayName: "Codex Review Check Instructor",
    });
    instructor = await createInstructorRecord(instructorIdentity.userId);

    const completedLesson = await createLesson({
      leerlingId: learner.id,
      instructeurId: instructor.id,
      title: "Afgeronde examentraining",
      startAt: "2026-06-03T18:30:00+02:00",
      status: "afgerond",
    });
    createdLessonIds.push(completedLesson.id);

    const scheduledLesson = await createLesson({
      leerlingId: learner.id,
      instructeurId: instructor.id,
      title: "Toekomstige stadsles",
      startAt: "2026-06-10T18:30:00+02:00",
      status: "ingepland",
    });
    createdLessonIds.push(scheduledLesson.id);

    const learnerContext = await browser.newContext();
    const learnerPage = await learnerContext.newPage();
    await loginUser(learnerPage, learnerIdentity.email, "/leerling/reviews");
    await gotoStable(learnerPage, "/leerling/reviews");

    await learnerPage
      .getByRole("heading", { name: "Codex Review Check Instructor" })
      .waitFor({ timeout: 15_000 });
    const scheduledLessonVisible = await learnerPage
      .getByText("Toekomstige stadsles")
      .count();

    if (scheduledLessonVisible) {
      throw new Error(
        "Een niet-afgeronde les verscheen toch in de reviewlijst."
      );
    }

    await learnerPage.getByRole("button", { name: "Review schrijven" }).click();
    const reviewDialog = learnerPage.locator('[role="dialog"]').last();
    await reviewDialog
      .getByRole("heading", { name: "Review schrijven" })
      .waitFor({ timeout: 8_000 });

    await reviewDialog.getByRole("button", { name: "5" }).click();
    await reviewDialog
      .getByLabel("Titel")
      .fill("Rustige uitleg en sterke examenfocus");
    await reviewDialog
      .getByLabel("Review")
      .fill(
        "Deze instructeur gaf duidelijke feedback, bleef rustig en maakte lastige verkeerssituaties meteen overzichtelijk."
      );
    await reviewDialog.getByRole("button", { name: "Review plaatsen" }).click();
    await reviewDialog.waitFor({ state: "hidden", timeout: 20_000 });

    const savedReviews = await waitForRows(
      `/rest/v1/reviews?les_id=eq.${completedLesson.id}&select=id,score,titel,tekst,instructeur_id,les_id`,
      (rows) => rows.length === 1,
      30_000
    );
    createdReviewIds.push(savedReviews[0].id);
    const publicReviewRows = await waitForAnonRows(
      `/rest/v1/reviews?instructeur_id=eq.${instructor.id}&select=id,score,titel,tekst`,
      (rows) =>
        rows.some(
          (row) => row.titel === "Rustige uitleg en sterke examenfocus"
        ),
      30_000
    );

    await gotoStable(learnerPage, "/leerling/reviews");
    await learnerPage
      .getByRole("button", { name: "Review bijwerken" })
      .waitFor({ timeout: 15_000 });
    await learnerContext.close();

    const publicPage = await browser.newPage();
    await gotoStable(publicPage, `/instructeurs/${instructor.slug}`);
    try {
      await publicPage
        .getByText("Rustige uitleg en sterke examenfocus")
        .waitFor({ timeout: 15_000 });
      await publicPage
        .getByText(
          "Deze instructeur gaf duidelijke feedback, bleef rustig en maakte lastige verkeerssituaties meteen overzichtelijk."
        )
        .waitFor({ timeout: 15_000 });
    } catch (error) {
      const pageText = (await publicPage.locator("body").innerText()).slice(
        0,
        2500
      );
      throw new Error(
        `Publieke review verscheen niet op het profiel.\nAnon rows: ${JSON.stringify(
          publicReviewRows,
          null,
          2
        )}\n\nPaginafragment:\n${pageText}\n\n${error}`
      );
    }
    await publicPage.getByText("1 reviews").waitFor({ timeout: 15_000 });

    const instructorContext = await browser.newContext();
    const instructorPage = await instructorContext.newPage();
    await loginUser(
      instructorPage,
      instructorIdentity.email,
      "/instructeur/dashboard"
    );
    await gotoStable(instructorPage, "/instructeur/dashboard");
    await instructorPage.getByText("Reviewscore").waitFor({ timeout: 15_000 });
    await instructorPage.getByText("5.0 / 5").waitFor({ timeout: 15_000 });
    await instructorPage.getByText("1 zichtbare review").waitFor({
      timeout: 15_000,
    });
    await instructorContext.close();

    console.log(
      JSON.stringify(
        {
          success: true,
          checks: {
            onlyCompletedLessonsCanReview: "ok",
            learnerReviewSubmitDialog: "ok",
            publicInstructorProfileShowsReview: "ok",
            averageScoreAndReviewCount: "ok",
            instructorDashboardReviewMetric: "ok",
          },
          seed: {
            learnerEmail: learnerIdentity.email,
            instructorEmail: instructorIdentity.email,
            instructorSlug: instructor.slug,
            completedLessonId: completedLesson.id,
          },
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
    await cleanupRows({
      reviewIds: createdReviewIds,
      lessonIds: createdLessonIds,
      learnerId: learner?.id ?? null,
      instructorId: instructor?.id ?? null,
    });
    await deleteAuthUsers(createdUserIds);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
