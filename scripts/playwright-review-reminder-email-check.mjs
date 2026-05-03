import { readFileSync } from "node:fs";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "Test123!Aa";
const TEST_PHONE = "06 98 76 54 32";
const MAILBOX_BASE =
  process.env.PLAYWRIGHT_NOTIFICATION_TEST_EMAIL ??
  "gochmershahab@gmail.com";
const NOTIFICATION_TARGET_EMAIL =
  process.env.NOTIFICATION_TEST_TO_EMAIL ?? MAILBOX_BASE;

function readLocalEnv(name) {
  const envText = readFileSync(".env.local", "utf8");
  const match = envText.match(new RegExp(`^${name}=(.*)$`, "m"));

  if (!match) {
    throw new Error(`Missing ${name} in .env.local`);
  }

  return match[1].trim();
}

function buildUrl(pathname) {
  return `${BASE_URL}${pathname}`;
}

function buildMailboxAlias(baseEmail, label) {
  const [localPart, domain] = baseEmail.split("@");

  if (!localPart || !domain) {
    throw new Error(`Ongeldig testmailadres: ${baseEmail}`);
  }

  const suffix = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  return `${localPart}+${label}.${suffix}@${domain}`;
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

async function getRestRows(pathname) {
  const response = await adminFetch(pathname, {
    headers: {
      Prefer: "return=representation",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Kon REST rows niet ophalen voor ${pathname} (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

async function createAuthUser(role, displayName, email) {
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
      slug: createSlug("review-reminder"),
      bio: "Test instructeur voor review reminder flow",
      werkgebied: ["Amsterdam"],
      profiel_status: "goedgekeurd",
      prijs_per_les: 72,
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

async function createLesson({ learnerId, instructorId, title }) {
  const response = await adminFetch("/rest/v1/lessen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      titel: title,
      leerling_id: learnerId,
      instructeur_id: instructorId,
      start_at: "2026-06-15T18:30:00",
      duur_minuten: 75,
      status: "ingepland",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kon les niet aanmaken (${response.status}): ${errorText}`);
  }

  const rows = await response.json();
  return rows[0];
}

async function listResendEmails() {
  const apiKey = readLocalEnv("RESEND_API_KEY");
  const response = await fetch("https://api.resend.com/emails?limit=100", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "gochoir-playwright-review-reminder-check/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Kon Resend emails niet ophalen (${response.status})`);
  }

  const payload = await response.json();
  return payload.data ?? [];
}

async function retrieveResendEmail(emailId) {
  const apiKey = readLocalEnv("RESEND_API_KEY");
  const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "gochoir-playwright-review-reminder-check/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Kon Resend email ${emailId} niet ophalen (${response.status})`);
  }

  return response.json();
}

async function waitForSentEmail({ to, subjectIncludes, afterTime, timeoutMs = 60_000 }) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const emails = await listResendEmails();
    const match = emails.find((email) => {
      const createdAt = new Date(email.created_at).getTime();
      const recipients = Array.isArray(email.to) ? email.to : [email.to];

      return (
        createdAt >= afterTime - 2000 &&
        recipients.some(
          (recipient) => String(recipient).toLowerCase() === to.toLowerCase()
        ) &&
        String(email.subject).includes(subjectIncludes)
      );
    });

    if (match) {
      const detail = await retrieveResendEmail(match.id);
      return {
        id: match.id,
        subject: match.subject,
        created_at: match.created_at,
        last_event: detail.last_event ?? match.last_event ?? "unknown",
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 2_500));
  }

  throw new Error(
    `Geen Resend review-reminder mail gevonden voor ${to} met onderwerp "${subjectIncludes}".`
  );
}

async function waitForRows(pathname, predicate, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let lastRows = [];

  while (Date.now() < deadline) {
    const rows = await getRestRows(pathname);
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

async function deleteAuthUsers(userIds) {
  for (const userId of userIds) {
    await adminFetch(`/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
    });
  }
}

async function cleanupRows({ lessonId, learnerId, instructorId }) {
  if (lessonId) {
    await adminFetch(`/rest/v1/reviews?les_id=eq.${lessonId}`, { method: "DELETE" });
    await adminFetch(`/rest/v1/lessen?id=eq.${lessonId}`, { method: "DELETE" });
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

async function markLessonAsCompleted(page, lessonTitle) {
  await gotoStable(page, "/instructeur/lessen");
  const lessonEditButton = page
    .locator("div")
    .filter({ hasText: lessonTitle })
    .getByRole("button", { name: "Les bewerken" })
    .first();

  await lessonEditButton.waitFor({ state: "visible", timeout: 20_000 });
  await lessonEditButton.click();

  const dialog = page.locator('[role="dialog"]').last();
  await dialog.waitFor({ state: "visible", timeout: 8_000 });
  await dialog.getByRole("heading", { name: "Les bewerken" }).waitFor({
    timeout: 8_000,
  });

  const statusCombobox = dialog.getByRole("combobox").first();
  await statusCombobox.click();
  await page.getByRole("option", { name: "Afgerond" }).click();

  const saveButton = dialog.getByRole("button", {
    name: "Wijzigingen opslaan",
  });
  const saveHandle = await saveButton.elementHandle();

  if (!saveHandle) {
    throw new Error("Kon de opslaanknop voor lesbewerking niet vinden.");
  }

  await page.waitForTimeout(250);
  await saveHandle.evaluate((button) => button.click());
  await dialog.waitFor({ state: "hidden", timeout: 20_000 }).catch(async () => {
    await page.keyboard.press("Escape").catch(() => {});
  });
  await page.waitForTimeout(2_000);
}

async function run() {
  const createdUserIds = [];
  let learner = null;
  let instructor = null;
  let lesson = null;
  const browser = await chromium.launch({ headless: true });
  let instructorContext = null;
  let learnerContext = null;

  try {
    const learnerEmail = buildMailboxAlias(MAILBOX_BASE, "review-learner");
    const instructorEmail = buildMailboxAlias(MAILBOX_BASE, "review-instructor");
    const lessonTitle = `Review reminder test ${Date.now()}`;

    const learnerIdentity = await createAuthUser(
      "leerling",
      "Codex Review Learner",
      learnerEmail
    );
    createdUserIds.push(learnerIdentity.userId);
    await upsertProfile({
      userId: learnerIdentity.userId,
      email: learnerIdentity.email,
      role: "leerling",
      displayName: "Codex Review Learner",
    });
    learner = await createLearnerRecord(learnerIdentity.userId);

    const instructorIdentity = await createAuthUser(
      "instructeur",
      "Codex Review Instructor",
      instructorEmail
    );
    createdUserIds.push(instructorIdentity.userId);
    await upsertProfile({
      userId: instructorIdentity.userId,
      email: instructorIdentity.email,
      role: "instructeur",
      displayName: "Codex Review Instructor",
    });
    instructor = await createInstructorRecord(instructorIdentity.userId);

    lesson = await createLesson({
      learnerId: learner.id,
      instructorId: instructor.id,
      title: lessonTitle,
    });

    instructorContext = await browser.newContext();
    const instructorPage = await instructorContext.newPage();
    await loginUser(instructorPage, instructorIdentity.email, "/instructeur/lessen");

    const reviewReminderStartedAt = Date.now();
    await markLessonAsCompleted(instructorPage, lessonTitle);

    await waitForRows(
      `/rest/v1/lessen?id=eq.${lesson.id}&select=id,status`,
      (rows) => rows.some((row) => row.status === "afgerond"),
      30_000
    );

    const reminderNotifications = await waitForRows(
      `/rest/v1/notificaties?profiel_id=eq.${learnerIdentity.userId}&titel=eq.Laat%20een%20review%20achter&select=id,titel,tekst,ongelezen&order=created_at.desc`,
      (rows) => rows.length >= 1,
      30_000
    );

    const reminderEmail = await waitForSentEmail({
      to: NOTIFICATION_TARGET_EMAIL,
      subjectIncludes: "laat een review achter",
      afterTime: reviewReminderStartedAt,
    });

    learnerContext = await browser.newContext();
    const learnerPage = await learnerContext.newPage();
    await loginUser(learnerPage, learnerIdentity.email, "/leerling/reviews");
    await gotoStable(learnerPage, "/leerling/reviews");
    await learnerPage.getByText(lessonTitle).waitFor({ timeout: 20_000 });

    console.log(
      JSON.stringify(
        {
          success: true,
          learnerEmail: learnerIdentity.email,
          instructorEmail: instructorIdentity.email,
          notificationTargetEmail: NOTIFICATION_TARGET_EMAIL,
          reminderNotification: reminderNotifications[0],
          reminderEmail,
          lessonTitle,
        },
        null,
        2
      )
    );

  } finally {
    await instructorContext?.close().catch(() => {});
    await learnerContext?.close().catch(() => {});
    await browser.close();
    await cleanupRows({
      lessonId: lesson?.id ?? null,
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
