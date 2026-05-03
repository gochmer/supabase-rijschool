import { readFileSync } from "node:fs";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "Test123!Aa";
const TEST_PHONE = "06 98 76 54 32";
const MAILBOX_BASE = process.env.PLAYWRIGHT_NOTIFICATION_TEST_EMAIL ?? "notification-test@example.com";
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
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    return pathname;
  }

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
      slug: createSlug("notify-flow"),
      bio: "Test instructeur voor notificatieflow check",
      werkgebied: ["Amsterdam"],
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
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          bio: "Test instructeur voor notificatieflow check",
          werkgebied: ["Amsterdam"],
          profiel_status: "goedgekeurd",
          prijs_per_les: 69,
          transmissie: "beide",
          specialisaties: ["Examentraining", "Stadsverkeer"],
        }),
      }
    );

    if (!existingResponse.ok) {
      throw new Error(
        `Kon bestaand instructeurrecord niet bijwerken (${existingResponse.status})`
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

async function createPackage({
  instructeurId,
  naam,
  prijs,
  lessen,
  lesType,
}) {
  const response = await adminFetch("/rest/v1/pakketten", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      naam,
      prijs,
      beschrijving: `Testpakket ${naam}`,
      aantal_lessen: lessen,
      les_type: lesType,
      actief: true,
      instructeur_id: instructeurId,
      badge: "Test",
      sort_order: 1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kon pakket niet aanmaken (${response.status}): ${errorText}`);
  }

  const rows = await response.json();
  return rows[0];
}

async function listResendEmails() {
  const apiKey = readLocalEnv("RESEND_API_KEY");
  const response = await fetch("https://api.resend.com/emails?limit=100", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "gochoir-playwright-notification-check/1.0",
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
      "User-Agent": "gochoir-playwright-notification-check/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Kon Resend email ${emailId} niet ophalen (${response.status})`);
  }

  return response.json();
}

async function waitForSentEmail({
  to,
  subjectIncludes,
  afterTime,
  timeoutMs = 60_000,
}) {
  const deadline = Date.now() + timeoutMs;
  let lastSeen = [];

  while (Date.now() < deadline) {
    const emails = await listResendEmails();
    lastSeen = emails;
    const match = emails.find((email) => {
      const createdAt = new Date(email.created_at).getTime();
      const recipients = Array.isArray(email.to) ? email.to : [email.to];
      return (
        createdAt >= afterTime - 2000 &&
        recipients.some((recipient) => String(recipient).toLowerCase() === to.toLowerCase()) &&
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
        to: match.to,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 2_500));
  }

  throw new Error(
    `Geen Resend mail gevonden voor ${to} met onderwerp "${subjectIncludes}". Laatste resultaten: ${JSON.stringify(
      lastSeen.slice(0, 5),
      null,
      2
    )}`
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
    if (!userId) {
      continue;
    }

    await adminFetch(`/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
    });
  }
}

async function cleanupRows({
  packageIds,
  learnerId,
  instructorId,
}) {
  if (packageIds.length) {
    await adminFetch(`/rest/v1/pakketten?id=in.(${packageIds.join(",")})`, {
      method: "DELETE",
    });
  }

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

async function clickButtonByName(page, name) {
  const button = page.getByRole("button", { name }).first();
  await button.waitFor({ state: "visible", timeout: 15_000 });
  await button.click();
}

async function fillRequestFlow({
  page,
  triggerName,
  date,
  timeWindow,
  message,
}) {
  await clickButtonByName(page, triggerName);
  const dialog = page.locator('[role="dialog"]').last();
  await dialog.waitFor({ state: "visible", timeout: 8_000 });

  await dialog.getByRole("button", { name: "Volgende stap" }).click();
  const dateInput = dialog.getByLabel("Voorkeursdatum");
  const liveMomentInput = dialog.getByLabel("Beschikbaar moment");
  const hasManualMomentFields = await dateInput
    .waitFor({ state: "visible", timeout: 4_000 })
    .then(() => true)
    .catch(() => false);

  if (hasManualMomentFields) {
    await dateInput.fill(date);
    const timeInput = dialog.getByLabel("Tijdvak");
    await timeInput.fill(timeWindow);
  } else {
    await liveMomentInput.waitFor({ state: "visible", timeout: 4_000 });
    const momentCombobox = dialog.getByRole("combobox").first();
    await momentCombobox.click();
    const firstOption = page.getByRole("option").first();
    await firstOption.waitFor({ state: "visible", timeout: 4_000 });
    await firstOption.click();
  }

  await dialog.getByRole("button", { name: "Volgende stap" }).click();
  await dialog.getByLabel("Opmerking").waitFor({
    state: "visible",
    timeout: 4_000,
  });
  await dialog.getByLabel("Opmerking").fill(message);
  const submitButton = dialog.getByRole("button", {
    name: /Aanvraag versturen/,
  });
  await submitButton.waitFor({ state: "visible", timeout: 8_000 });
  const submitHandle = await submitButton.elementHandle();

  if (!submitHandle) {
    throw new Error("Kon de aanvraagknop niet vinden in de dialoog.");
  }

  await page.waitForTimeout(250);
  await submitHandle.evaluate((button) => button.click());
  await dialog.waitFor({ state: "hidden", timeout: 20_000 });
  await page.waitForTimeout(2_000);
}

async function openRequestDialog(page, buttonName, dialogTitle) {
  await clickButtonByName(page, buttonName);
  const dialog = page.locator('[role="dialog"]').last();
  await dialog.waitFor({ state: "visible", timeout: 8_000 });
  await dialog.getByRole("heading", { name: dialogTitle }).waitFor({
    timeout: 8_000,
  });
  return dialog;
}

async function selectOption(page, combobox, optionName) {
  await combobox.click();
  await page.getByRole("option", { name: optionName }).click();
}

async function updateLessonStatus(page, nextStatus, options = {}) {
  await clickButtonByName(page, "Les bewerken");
  const dialog = page.locator('[role="dialog"]').last();
  await dialog.waitFor({ state: "visible", timeout: 8_000 });
  await dialog.getByRole("heading", { name: "Les bewerken" }).waitFor({
    timeout: 8_000,
  });

  if (options.date) {
    await dialog.getByLabel("Datum").fill(options.date);
  }

  if (options.time) {
    await dialog.getByLabel("Starttijd").fill(options.time);
  }

  if (options.duration) {
    await dialog.getByLabel("Duur in minuten").fill(String(options.duration));
  }

  const comboBoxes = dialog.getByRole("combobox");
  await selectOption(page, comboBoxes.nth(0), nextStatus);

  if (options.reason) {
    await dialog.getByLabel("Reden van annuleren").fill(options.reason);
  }

  const saveButton = dialog.getByRole("button", { name: "Wijzigingen opslaan" });
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
  const createdPackageIds = [];
  let learner = null;
  let instructor = null;
  const browser = await chromium.launch({ headless: true });

  try {
    const learnerEmail = buildMailboxAlias(MAILBOX_BASE, "learner");
    const instructorEmail = buildMailboxAlias(MAILBOX_BASE, "instructor");

    const learnerIdentity = await createAuthUser(
      "leerling",
      "Codex Notification Learner",
      learnerEmail
    );
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
      "Codex Notification Instructor",
      instructorEmail
    );
    createdUserIds.push(instructorIdentity.userId);
    await upsertProfile({
      userId: instructorIdentity.userId,
      email: instructorIdentity.email,
      role: "instructeur",
      displayName: "Codex Notification Instructor",
    });
    instructor = await createInstructorRecord(instructorIdentity.userId);

    const starterPackage = await createPackage({
      instructeurId: instructor.id,
      naam: "Test examenpakket",
      prijs: 899,
      lessen: 12,
      lesType: "auto",
    });
    createdPackageIds.push(starterPackage.id);

    const results = [];
    const learnerContext = await browser.newContext();
    const learnerPage = await learnerContext.newPage();
    await loginUser(
      learnerPage,
      learnerIdentity.email,
      `/instructeurs/${instructor.slug}`
    );
    await gotoStable(learnerPage, `/instructeurs/${instructor.slug}`);

    const newRequestStartedAt = Date.now();
    await fillRequestFlow({
      page: learnerPage,
      triggerName: "Vraag dit pakket aan",
      date: "2026-06-10",
      timeWindow: "18:00 - 19:30",
      message: "E2E test voor pakketaanvraag en notificaties.",
    });
    const newRequestMail = await waitForSentEmail({
      to: NOTIFICATION_TARGET_EMAIL,
      subjectIncludes: "Nieuwe aanvraag van",
      afterTime: newRequestStartedAt,
    });
    results.push({
      flow: "nieuwe aanvraag",
      recipient: NOTIFICATION_TARGET_EMAIL,
      authEmail: instructorIdentity.email,
      email: newRequestMail,
    });

    const instructorContext = await browser.newContext();
    const instructorPage = await instructorContext.newPage();
    await loginUser(
      instructorPage,
      instructorIdentity.email,
      "/instructeur/aanvragen"
    );
    await gotoStable(instructorPage, "/instructeur/aanvragen");

    const acceptStartedAt = Date.now();
    const acceptDialog = await openRequestDialog(
      instructorPage,
      "Accepteren",
      "Aanvraag accepteren"
    );
    const acceptForm = acceptDialog.locator("form");
    await instructorPage.waitForTimeout(250);
    await acceptForm.evaluate((form) => {
      if (form instanceof HTMLFormElement) {
        form.requestSubmit();
      }
    });
    await waitForRows(
      `/rest/v1/lessen?leerling_id=eq.${learner.id}&instructeur_id=eq.${instructor.id}&select=id,status`,
      (rows) => rows.length >= 1,
      30_000
    );
    await acceptDialog.waitFor({ state: "hidden", timeout: 5_000 }).catch(async () => {
      await instructorPage.keyboard.press("Escape").catch(() => {});
    });
    await instructorPage.waitForTimeout(2_000);
    const acceptedMail = await waitForSentEmail({
      to: NOTIFICATION_TARGET_EMAIL,
      subjectIncludes: "Je aanvraag is geaccepteerd",
      afterTime: acceptStartedAt,
    });
    results.push({
      flow: "aanvraag geaccepteerd",
      recipient: NOTIFICATION_TARGET_EMAIL,
      authEmail: learnerIdentity.email,
      email: acceptedMail,
    });

    const secondRequestStartedAt = Date.now();
    await gotoStable(learnerPage, `/instructeurs/${instructor.slug}`);
    await fillRequestFlow({
      page: learnerPage,
      triggerName: "Plan proefles",
      date: "2026-06-12",
      timeWindow: "20:00 - 21:00",
      message: "E2E test voor proeflesweigering en notificaties.",
    });
    const secondRequestMail = await waitForSentEmail({
      to: NOTIFICATION_TARGET_EMAIL,
      subjectIncludes: "Nieuwe aanvraag van",
      afterTime: secondRequestStartedAt,
    });
    results.push({
      flow: "tweede aanvraag",
      recipient: NOTIFICATION_TARGET_EMAIL,
      authEmail: instructorIdentity.email,
      email: secondRequestMail,
    });

    await gotoStable(instructorPage, "/instructeur/aanvragen");
    const rejectStartedAt = Date.now();
    const rejectDialog = await openRequestDialog(
      instructorPage,
      "Weigeren",
      "Aanvraag weigeren"
    );
    await rejectDialog
      .getByLabel("Reden van weigeren")
      .fill("Testweigering voor notificatiecontrole.");
    const rejectForm = rejectDialog.locator("form");
    await instructorPage.waitForTimeout(250);
    await rejectForm.evaluate((form) => {
      if (form instanceof HTMLFormElement) {
        form.requestSubmit();
      }
    });
    await waitForRows(
      `/rest/v1/lesaanvragen?leerling_id=eq.${learner.id}&instructeur_id=eq.${instructor.id}&status=eq.geweigerd&select=id,status`,
      (rows) => rows.length >= 1,
      30_000
    );
    await rejectDialog.waitFor({ state: "hidden", timeout: 5_000 }).catch(async () => {
      await instructorPage.keyboard.press("Escape").catch(() => {});
    });
    await instructorPage.waitForTimeout(2_000);
    const rejectedMail = await waitForSentEmail({
      to: NOTIFICATION_TARGET_EMAIL,
      subjectIncludes: "Je aanvraag is geweigerd",
      afterTime: rejectStartedAt,
    });
    results.push({
      flow: "aanvraag geweigerd",
      recipient: NOTIFICATION_TARGET_EMAIL,
      authEmail: learnerIdentity.email,
      email: rejectedMail,
    });

    await gotoStable(instructorPage, "/instructeur/lessen");
    const lessonChangedStartedAt = Date.now();
    await updateLessonStatus(instructorPage, "Ingepland", {
      date: "2026-06-11",
      time: "19:15",
      duration: 75,
    });
    await waitForRows(
      `/rest/v1/lessen?leerling_id=eq.${learner.id}&instructeur_id=eq.${instructor.id}&status=eq.ingepland&select=id,status,start_at`,
      (rows) => rows.length >= 1,
      30_000
    );
    const lessonChangedMail = await waitForSentEmail({
      to: NOTIFICATION_TARGET_EMAIL,
      subjectIncludes: "Je les is bijgewerkt",
      afterTime: lessonChangedStartedAt,
    });
    results.push({
      flow: "les gewijzigd",
      recipient: NOTIFICATION_TARGET_EMAIL,
      authEmail: learnerIdentity.email,
      email: lessonChangedMail,
    });

    await gotoStable(instructorPage, "/instructeur/lessen");
    const lessonCanceledStartedAt = Date.now();
    await updateLessonStatus(instructorPage, "Geannuleerd", {
      reason: "Testannulering voor notificatiecontrole.",
    });
    await waitForRows(
      `/rest/v1/lessen?leerling_id=eq.${learner.id}&instructeur_id=eq.${instructor.id}&status=eq.geannuleerd&select=id,status`,
      (rows) => rows.length >= 1,
      30_000
    );
    const lessonCanceledMail = await waitForSentEmail({
      to: NOTIFICATION_TARGET_EMAIL,
      subjectIncludes: "Je les is geannuleerd",
      afterTime: lessonCanceledStartedAt,
    });
    results.push({
      flow: "les geannuleerd",
      recipient: NOTIFICATION_TARGET_EMAIL,
      authEmail: learnerIdentity.email,
      email: lessonCanceledMail,
    });

    console.log(
      JSON.stringify(
        {
          success: true,
          learnerEmail: learnerIdentity.email,
          instructorEmail: instructorIdentity.email,
          notificationTargetEmail: NOTIFICATION_TARGET_EMAIL,
          flows: results,
        },
        null,
        2
      )
    );

    await learnerContext.close();
    await instructorContext.close();
  } finally {
    await browser.close();
    await cleanupRows({
      packageIds: createdPackageIds,
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
