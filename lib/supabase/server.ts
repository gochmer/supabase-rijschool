import { cookies } from "next/headers";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

function readLocalEnvValue(name: string) {
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }

  const envPath = join(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return undefined;
  }

  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${name}=`));

  if (!line) {
    return undefined;
  }

  return line.slice(name.length + 1).trim();
}

function getSupabaseEnv() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    readLocalEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    readLocalEnvValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ??
    readLocalEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");

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

export async function createServerClient() {
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
}
