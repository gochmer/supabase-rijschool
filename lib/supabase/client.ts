"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseEnv() {
  if (!supabaseUrl) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}