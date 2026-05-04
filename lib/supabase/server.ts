import { cookies } from "next/headers";
import { cache } from "react";
import { loadEnvConfig } from "@next/env";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

let localEnvLoaded = false;

function ensureLocalEnvLoaded() {
  if (process.env.NODE_ENV === "production" || localEnvLoaded) {
    return;
  }

  loadEnvConfig(process.cwd());
  localEnvLoaded = true;
}

function getSupabaseEnv() {
  ensureLocalEnvLoaded();

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseKey) {
    throw new Error(
      "Missing env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or env.NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return {
    supabaseUrl,
    supabaseKey,
  };
}

export const createServerClient = cache(async function createServerClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components mogen soms geen cookies muteren.
        }
      },
    },
  });
});
