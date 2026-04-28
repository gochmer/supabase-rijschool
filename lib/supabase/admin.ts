import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type ServiceKeyPayload = {
  api_key?: string;
  name?: string;
  type?: string;
};

let cachedServiceRoleKey: string | null = null;

function getSupabaseUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
  }

  return supabaseUrl;
}

async function getServiceRoleKey() {
  if (cachedServiceRoleKey) {
    return cachedServiceRoleKey;
  }

  const directKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (directKey) {
    cachedServiceRoleKey = directKey;
    return directKey;
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const supabaseUrl = getSupabaseUrl();

  if (!accessToken || process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing env.SUPABASE_SERVICE_ROLE_KEY for admin Supabase access."
    );
  }

  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/api-keys?reveal=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Kon Supabase admin key niet ophalen (${response.status}).`
    );
  }

  const keys = (await response.json()) as ServiceKeyPayload[];
  const serviceKey =
    keys.find((item) => item.name === "service_role")?.api_key ??
    keys.find((item) => item.name === "secret")?.api_key ??
    keys.find(
      (item) =>
        item.type === "legacy" &&
        typeof item.name === "string" &&
        item.name.includes("service")
    )?.api_key;

  if (!serviceKey) {
    throw new Error("Kon geen service role key voor Supabase vinden.");
  }

  cachedServiceRoleKey = serviceKey;
  return serviceKey;
}

export async function createAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = await getServiceRoleKey();

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
