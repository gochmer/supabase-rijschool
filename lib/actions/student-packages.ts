"use server";

import { getCurrentProfile, getCurrentRole } from "@/lib/data/profiles";
import { assignStudentPackage } from "@/lib/actions/student-package-assignment";

export async function assignPackageToStudentAction(
  leerlingId: string,
  pakketId: string | null,
  options?: {
    allowReplace?: boolean;
  }
) {
  const role = await getCurrentRole();
  const profile = await getCurrentProfile();

  if (role !== "admin") {
    return {
      success: false,
      message: "Alleen admins kunnen pakketten toewijzen.",
    };
  }

  return assignStudentPackage({
    leerlingId,
    pakketId,
    actorProfileId: profile?.id ?? null,
    actorRole: "admin",
    allowReplace: Boolean(options?.allowReplace),
  });
}
