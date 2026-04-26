import "server-only";

import { getCurrentLeerlingRecord } from "@/lib/data/profiles";

export async function getFavoriteInstructorIds() {
  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return [];
  }

  return leerling.favoriete_instructeurs ?? [];
}
