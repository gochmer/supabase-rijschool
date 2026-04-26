import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

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

function sanitizeNext(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return "/";
  }

  return value;
}

function readString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : null;
}

async function handleAuthCallback(
  request: NextRequest,
  params: {
    code?: string | null;
    tokenHash?: string | null;
    type?: EmailOtpType | null;
    next?: string | null;
  }
) {
  const requestUrl = new URL(request.url);
  const code = params.code ?? null;
  const tokenHash = params.tokenHash ?? null;
  const type = params.type ?? null;
  const next = sanitizeNext(params.next ?? null);
  const redirectUrl = new URL(next, requestUrl.origin);

  const response = NextResponse.redirect(redirectUrl);
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();
  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return response;
    }
  }

  const fallbackUrl = new URL(
    next.startsWith("/wachtwoord-resetten")
      ? "/wachtwoord-vergeten"
      : "/inloggen",
    requestUrl.origin
  );

  fallbackUrl.searchParams.set(
    "error",
    next.startsWith("/wachtwoord-resetten")
      ? "reset_link_invalid"
      : "auth_callback_failed"
  );

  return NextResponse.redirect(fallbackUrl);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  return handleAuthCallback(request, {
    code: requestUrl.searchParams.get("code"),
    tokenHash: requestUrl.searchParams.get("token_hash"),
    type: requestUrl.searchParams.get("type") as EmailOtpType | null,
    next: requestUrl.searchParams.get("next"),
  });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  return handleAuthCallback(request, {
    code: readString(formData.get("code")),
    tokenHash: readString(formData.get("token_hash")),
    type: readString(formData.get("type")) as EmailOtpType | null,
    next: readString(formData.get("next")),
  });
}
