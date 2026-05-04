import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { GebruikersRol } from "@/lib/types";
import { getDashboardRouteForRole } from "@/lib/routes";
import type { Database } from "@/lib/supabase/database.types";

const protectedPrefixes = ["/leerling", "/instructeur", "/admin"];
const guestOnlyRoutes = [
  "/inloggen",
  "/registreren",
  "/wachtwoord-vergeten",
];

function matchesRoutePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function redirectToRoleDashboard(
  request: NextRequest,
  role: GebruikersRol | null,
  fromPathname?: string
) {
  const url = request.nextUrl.clone();
  url.search = "";
  url.pathname = getDashboardRouteForRole(role ?? "leerling");

  if (fromPathname) {
    url.searchParams.set("notice", "role-mismatch");
    url.searchParams.set("from", fromPathname);
  }

  return NextResponse.redirect(url);
}

async function resolveRole(
  supabase: SupabaseClient<Database>,
  user: { id: string }
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  return (profile?.rol as GebruikersRol | undefined) ?? null;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) =>
    matchesRoutePrefix(pathname, prefix)
  );
  const isGuestOnlyRoute = guestOnlyRoutes.some((route) =>
    matchesRoutePrefix(pathname, route)
  );
  const response = NextResponse.next({
    request,
  });

  if (isProtected || !isGuestOnlyRoute) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

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

  const {
    data: claimsData,
  } = await supabase.auth.getClaims();
  const userId =
    typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  const user = userId ? { id: userId } : null;

  const resolvedRole = user ? await resolveRole(supabase, user) : null;

  if (user && isGuestOnlyRoute) {
    if (resolvedRole) {
      return redirectToRoleDashboard(request, resolvedRole);
    }
  }

  return response;
}
