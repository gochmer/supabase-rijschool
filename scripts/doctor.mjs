#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REQUIRED_PUBLIC_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];

const REQUIRED_SERVER_ENV = ["SUPABASE_SERVICE_ROLE_KEY"];
const OPTIONAL_ENV = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
  "LESSON_REMINDER_CRON_SECRET",
  "PAYMENT_REMINDER_CRON_SECRET",
  "RESEND_API_KEY",
  "NOTIFICATION_FROM_EMAIL",
];

function readEnvFile(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

function assertNodeVersion() {
  const major = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
  if (Number.isNaN(major) || major < 20) {
    throw new Error(`Node.js 20+ is vereist. Huidige versie: ${process.versions.node}`);
  }
}

function assertNoCommittedSecrets(localEnv) {
  const leakedSecretKeys = Object.entries(localEnv).filter(([key, value]) => {
    const normalizedKey = key.toUpperCase();
    return (
      value &&
      !value.includes("localhost") &&
      (normalizedKey.includes("SERVICE_ROLE") ||
        normalizedKey.includes("ACCESS_TOKEN") ||
        normalizedKey.includes("DB_PASSWORD") ||
        normalizedKey.includes("RESEND_API_KEY") ||
        normalizedKey.includes("SECRET"))
    );
  });

  if (process.env.CI === "true" && leakedSecretKeys.length > 0) {
    throw new Error(
      `CI blokkeert mogelijke secrets in .env.local: ${leakedSecretKeys
        .map(([key]) => key)
        .join(", ")}`
    );
  }
}

function assertEnvShape(env) {
  const missing = [...REQUIRED_PUBLIC_ENV, ...REQUIRED_SERVER_ENV].filter(
    (key) => !env[key] && !process.env[key]
  );

  const legacyAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasPublishableKey =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const effectiveMissing = missing.filter(
    (key) => key !== "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" || !legacyAnonKey
  );

  if (effectiveMissing.length > 0) {
    throw new Error(`Ontbrekende environment variables: ${effectiveMissing.join(", ")}`);
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const url = new URL(supabaseUrl);
    if (!url.hostname.endsWith(".supabase.co") && !url.hostname.includes("localhost")) {
      throw new Error(`NEXT_PUBLIC_SUPABASE_URL lijkt geen Supabase URL: ${url.hostname}`);
    }
  }

  if (!hasPublishableKey && legacyAnonKey) {
    console.warn("[doctor] Gebruik bij voorkeur NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; ANON_KEY fallback is legacy.");
  }
}

function main() {
  const localEnv = readEnvFile(join(process.cwd(), ".env.local"));
  const exampleEnv = readEnvFile(join(process.cwd(), ".env.example"));

  assertNodeVersion();
  assertNoCommittedSecrets(localEnv);
  assertEnvShape({ ...exampleEnv, ...localEnv });

  console.log("[doctor] Project preflight is groen.");
  if (OPTIONAL_ENV.some((key) => !localEnv[key] && !process.env[key])) {
    console.log("[doctor] Optionele integraties zoals e-mail/cron worden pas actief na env-configuratie.");
  }
}

try {
  main();
} catch (error) {
  console.error(`[doctor] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
