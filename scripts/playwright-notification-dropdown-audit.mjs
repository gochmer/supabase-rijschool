import { readFileSync } from "node:fs";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "Test123!Aa";
const TEST_PHONE = "06 12 34 56 78";

function readLocalEnv(name) {
  const envText = readFileSync(".env.local", "utf8");
  const match = envText.match(new RegExp(`^${name}=(.*)$`, "m"));

  if (!match) {
    throw new Error(`Missing ${name} in .env.local`);
  }

  return match[1].trim();
}

function createTempEmail(prefix) {
  return `codex.notificationcheck.${prefix}.${Date.now()}.${Math.random()
    .toString(36)
    .slice(2, 8)}@example.com`;
}

function createSlug(prefix) {
  return `codex-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function buildUrl(pathname) {
  return pathname.startsWith("http://") || pathname.startsWith("https://")
    ? pathname
    : `${BASE_URL}${pathname}`;
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
    body: JSON.stringify({ profile_id: profileId }),
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
      const errorText = await existingResponse.text();
      throw new Error(
        `Kon bestaand leerlingrecord niet ophalen (${existingResponse.status}): ${errorText}`
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
      slug: createSlug("notification-audit"),
      bio: "Test instructeur voor dropdown audit",
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
      const errorText = await existingResponse.text();
      throw new Error(
        `Kon bestaand instructeurrecord niet ophalen (${existingResponse.status}): ${errorText}`
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

async function insertNotification({ profileId, title, text, type = "info" }) {
  const response = await adminFetch("/rest/v1/notificaties", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      profiel_id: profileId,
      titel: title,
      tekst: text,
      type,
      ongelezen: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kon notificatie ${title} niet aanmaken (${response.status}): ${errorText}`);
  }

  const rows = await response.json();
  return rows[0];
}

async function fetchNotificationsForProfile(profileId) {
  const response = await adminFetch(
    `/rest/v1/notificaties?profiel_id=eq.${profileId}&select=id,titel,ongelezen,created_at&order=created_at.desc`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kon notificaties niet ophalen (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function waitForNotificationState(profileId, matcher, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let lastRows = [];

  while (Date.now() < deadline) {
    const rows = await fetchNotificationsForProfile(profileId);
    lastRows = rows;

    if (matcher(rows)) {
      return rows;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(
    `Notificatiestatus niet bereikt voor ${profileId}. Laatste rows: ${JSON.stringify(
      lastRows,
      null,
      2
    )}`
  );
}

async function deleteRows(pathname) {
  await adminFetch(pathname, { method: "DELETE" });
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
  await page.waitForTimeout(1_000);
}

async function loginUser(page, email, redirectPath) {
  await gotoStable(page, `/inloggen?redirect=${encodeURIComponent(redirectPath)}`);
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL(`**${redirectPath}`, { timeout: 30_000 });
  await page.waitForTimeout(1_000);
}

async function openNotificationDropdown(page) {
  await page
    .locator("[data-slot='dropdown-menu-trigger']")
    .filter({ hasText: "Notificaties" })
    .first()
    .click();
  const menu = page.locator("[data-slot='dropdown-menu-content']").last();
  await menu.waitFor({ state: "visible", timeout: 8_000 });
  return menu;
}

async function expectTextCounts(menu, expectedTitles, forbiddenTitles) {
  for (const title of expectedTitles) {
    const count = await menu.getByText(title, { exact: true }).count();
    if (count !== 1) {
      throw new Error(`Titel "${title}" werd ${count}x gevonden in dropdown in plaats van 1x.`);
    }
  }

  for (const title of forbiddenTitles) {
    const count = await menu.getByText(title, { exact: true }).count();
    if (count !== 0) {
      throw new Error(`Verboden titel "${title}" is zichtbaar in de verkeerde dropdown.`);
    }
  }
}

async function markFirstNotificationRead(menu) {
  await menu.getByRole("button", { name: /^Gelezen$/, exact: true }).first().click();
}

async function run() {
  const createdUserIds = [];
  let learner = null;
  let instructor = null;
  const browser = await chromium.launch({ headless: true });

  const stamp = Date.now();
  const learnerTitleA = `Learner audit A ${stamp}`;
  const learnerTitleB = `Learner audit B ${stamp}`;
  const instructorTitle = `Instructor audit ${stamp}`;
  const adminTitle = `Admin audit ${stamp}`;

  try {
    const learnerIdentity = await createAuthUser("leerling", "Codex Notification Learner");
    createdUserIds.push(learnerIdentity.userId);
    await upsertProfile({
      userId: learnerIdentity.userId,
      email: learnerIdentity.email,
      role: "leerling",
      displayName: "Codex Notification Learner",
    });
    learner = await createLearnerRecord(learnerIdentity.userId);

    const instructorIdentity = await createAuthUser(
      "instructeur",
      "Codex Notification Instructor"
    );
    createdUserIds.push(instructorIdentity.userId);
    await upsertProfile({
      userId: instructorIdentity.userId,
      email: instructorIdentity.email,
      role: "instructeur",
      displayName: "Codex Notification Instructor",
    });
    instructor = await createInstructorRecord(instructorIdentity.userId);

    const adminIdentity = await createAuthUser("admin", "Codex Notification Admin");
    createdUserIds.push(adminIdentity.userId);
    await upsertProfile({
      userId: adminIdentity.userId,
      email: adminIdentity.email,
      role: "admin",
      displayName: "Codex Notification Admin",
    });

    const learnerNotificationA = await insertNotification({
      profileId: learnerIdentity.userId,
      title: learnerTitleA,
      text: "Eerste leerlingnotificatie",
      type: "info",
    });
    const learnerNotificationB = await insertNotification({
      profileId: learnerIdentity.userId,
      title: learnerTitleB,
      text: "Tweede leerlingnotificatie",
      type: "waarschuwing",
    });
    await insertNotification({
      profileId: instructorIdentity.userId,
      title: instructorTitle,
      text: "Instructeurmelding",
      type: "info",
    });
    const adminNotification = await insertNotification({
      profileId: adminIdentity.userId,
      title: adminTitle,
      text: "Adminmelding",
      type: "succes",
    });

    const learnerRows = await fetchNotificationsForProfile(learnerIdentity.userId);
    if (learnerRows.filter((item) => item.titel === learnerTitleA).length !== 1) {
      throw new Error("Learner audit A staat niet exact 1x in de database.");
    }
    if (learnerRows.filter((item) => item.titel === learnerTitleB).length !== 1) {
      throw new Error("Learner audit B staat niet exact 1x in de database.");
    }

    const instructorRows = await fetchNotificationsForProfile(instructorIdentity.userId);
    if (instructorRows.filter((item) => item.titel === instructorTitle).length !== 1) {
      throw new Error("Instructor audit staat niet exact 1x in de database.");
    }

    const adminRows = await fetchNotificationsForProfile(adminIdentity.userId);
    if (adminRows.filter((item) => item.titel === adminTitle).length !== 1) {
      throw new Error("Admin audit staat niet exact 1x in de database.");
    }

    const learnerContext = await browser.newContext();
    const learnerPage = await learnerContext.newPage();
    await loginUser(learnerPage, learnerIdentity.email, "/leerling/boekingen");
    const learnerMenu = await openNotificationDropdown(learnerPage);
    await expectTextCounts(learnerMenu, [learnerTitleA, learnerTitleB], [
      instructorTitle,
      adminTitle,
    ]);
    await markFirstNotificationRead(learnerMenu);
    await waitForNotificationState(
      learnerIdentity.userId,
      (rows) =>
        rows.filter(
          (row) =>
            (row.id === learnerNotificationA.id || row.id === learnerNotificationB.id) &&
            row.ongelezen === false
        ).length === 1,
      20_000
    );
    await learnerContext.close();

    const instructorContext = await browser.newContext();
    const instructorPage = await instructorContext.newPage();
    await loginUser(instructorPage, instructorIdentity.email, "/instructeur/dashboard");
    const instructorMenu = await openNotificationDropdown(instructorPage);
    await expectTextCounts(instructorMenu, [instructorTitle], [learnerTitleA, learnerTitleB, adminTitle]);
    await instructorMenu.getByRole("button", { name: /Alles gelezen/ }).click();
    await waitForNotificationState(
      instructorIdentity.userId,
      (rows) => rows.every((row) => row.ongelezen === false),
      20_000
    );
    await instructorContext.close();

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginUser(adminPage, adminIdentity.email, "/admin/dashboard");
    const adminMenu = await openNotificationDropdown(adminPage);
    await expectTextCounts(adminMenu, [adminTitle], [learnerTitleA, learnerTitleB, instructorTitle]);
    await markFirstNotificationRead(adminMenu);
    await waitForNotificationState(
      adminIdentity.userId,
      (rows) =>
        rows.some((row) => row.id === adminNotification.id && row.ongelezen === false),
      20_000
    );
    await adminContext.close();

    console.log(
      JSON.stringify(
        {
          success: true,
          roles: {
            learner: {
              route: "/leerling/boekingen",
              dropdown: "ok",
              ownNotificationsOnly: true,
              markOneRead: "ok",
            },
            instructor: {
              route: "/instructeur/dashboard",
              dropdown: "ok",
              ownNotificationsOnly: true,
              markAllRead: "ok",
            },
            admin: {
              route: "/admin/dashboard",
              dropdown: "ok",
              ownNotificationsOnly: true,
              markOneRead: "ok",
            },
          },
          duplicateCheck: "ok",
        },
        null,
        2
      )
    );
  } finally {
    if (learner?.id) {
      await deleteRows(`/rest/v1/leerlingen?id=eq.${learner.id}`);
    }

    if (instructor?.id) {
      await deleteRows(`/rest/v1/instructeurs?id=eq.${instructor.id}`);
    }

    await deleteRows(
      `/rest/v1/notificaties?titel=in.(${encodeURIComponent(
        `"${learnerTitleA}","${learnerTitleB}","${instructorTitle}","${adminTitle}"`
      )})`
    ).catch(() => {});

    await browser.close();
    await deleteAuthUsers(createdUserIds);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
