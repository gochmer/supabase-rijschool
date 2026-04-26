"use server";

import { revalidatePath } from "next/cache";

import { getCurrentRole } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

export async function updateReviewModerationAction(
  reviewId: string,
  moderatieStatus: "zichtbaar" | "verborgen" | "gemarkeerd"
) {
  const role = await getCurrentRole();

  if (role !== "admin") {
    return {
      success: false,
      message: "Alleen admins kunnen reviews modereren.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("reviews")
    .update({
      moderatie_status: moderatieStatus,
      verborgen: moderatieStatus === "verborgen",
      moderated_at: new Date().toISOString(),
    })
    .eq("id", reviewId);

  if (error) {
    return {
      success: false,
      message: "Reviewstatus kon niet worden bijgewerkt.",
    };
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/instructeurs");

  return {
    success: true,
    message: "Reviewstatus bijgewerkt.",
  };
}
