"use server";

import { createServerClient } from "@/lib/supabase/server";

export type LocationSelectionInput = {
  locationId?: string | null;
  newLocationName?: string | null;
  newLocationCity?: string | null;
  newLocationAddress?: string | null;
};

export async function resolveLocationSelection(input: LocationSelectionInput) {
  const selectedLocationId = input.locationId?.trim();

  if (selectedLocationId) {
    return selectedLocationId;
  }

  const name = input.newLocationName?.trim();
  const city = input.newLocationCity?.trim();
  const address = input.newLocationAddress?.trim() || null;

  if (!name || !city) {
    return null;
  }

  const supabase = await createServerClient();
  const { data: existingLocation } = await supabase
    .from("locaties")
    .select("id")
    .eq("naam", name)
    .eq("stad", city)
    .maybeSingle();

  if (existingLocation?.id) {
    return existingLocation.id;
  }

  const { data: insertedLocation, error } = await supabase
    .from("locaties")
    .insert({
      naam: name,
      stad: city,
      adres: address,
    } as never)
    .select("id")
    .maybeSingle();

  if (error || !insertedLocation?.id) {
    return null;
  }

  return insertedLocation.id;
}
