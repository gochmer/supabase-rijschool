import "server-only";

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

let localEnvLoaded = false;
let publicClient: ReturnType<typeof createClient<Database>> | null = null;

function ensureLocalEnvLoaded() {
  if (process.env.NODE_ENV === "production" || localEnvLoaded) {
    return;
  }

  loadEnvConfig(process.cwd());
  localEnvLoaded = true;
}

function getSupabaseEnv() {
  ensureLocalEnvLoaded();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseKey) {
    throw new Error(
      "Missing env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or env.NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return {
    supabaseKey,
    supabaseUrl,
  };
}

export function createPublicServerClient() {
  if (publicClient) {
    return publicClient;
  }

  const { supabaseKey, supabaseUrl } = getSupabaseEnv();

  publicClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return publicClient;
}
