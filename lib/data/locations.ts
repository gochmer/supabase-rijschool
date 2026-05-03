import "server-only";

import type { LocationOption } from "@/lib/types";
import { createServerClient } from "@/lib/supabase/server";

export async function getLocationOptions(): Promise<LocationOption[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("locaties")
    .select("id, naam, stad, adres")
    .order("stad", { ascending: true })
    .order("naam", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((location) => ({
    id: location.id,
    naam: location.naam,
    stad: location.stad,
    adres: location.adres,
    label: location.naam ? `${location.naam}, ${location.stad}` : location.stad,
  }));
}
