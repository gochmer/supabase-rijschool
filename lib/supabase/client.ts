"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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

export function createClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
