import "server-only";

import { cache } from "react";
import type { LocationOption } from "@/lib/types";
import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import { createServerClient } from "@/lib/supabase/server";

export const getLocationOptions = cache(async function getLocationOptions({
  limit,
}: {
  limit?: number;
} = {}): Promise<LocationOption[]> {
  const supabase = await createServerClient();
  let query = supabase
    .from("locaties")
    .select("id, naam, stad, adres")
    .order("stad", { ascending: true })
    .order("naam", { ascending: true });

  if (limit && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    logSupabaseDataError("locations.options", error, {
      limit: limit ?? null,
    });
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((location) => ({
    id: location.id,
    naam: location.naam,
    stad: location.stad,
    adres: location.adres,
    label: location.naam ? `${location.naam}, ${location.stad}` : location.stad,
  }));
});
