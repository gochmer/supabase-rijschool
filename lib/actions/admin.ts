"use server";

import { revalidatePath } from "next/cache";

import { getCurrentRole } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

export async function updateInstructorApprovalAction(
  instructorId: string,
  nextStatus: "goedgekeurd" | "afgewezen"
) {
  const role = await getCurrentRole();

  if (role !== "admin") {
    return {
      success: false,
      message: "Alleen admins kunnen instructeurs beheren.",
    };
  }

  const supabase = await createServerClient();

  const { error } = await supabase
    .from("instructeurs")
    .update({
      profiel_status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", instructorId);

  if (error) {
    return {
      success: false,
      message: "De status van de instructeur kon niet worden bijgewerkt.",
    };
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/instructeurs");

  return {
    success: true,
    message:
      nextStatus === "goedgekeurd"
        ? "De instructeur is goedgekeurd."
        : "De instructeur is afgewezen.",
  };
}

export async function updateSupportTicketStatusAction(
  ticketId: string,
  nextStatus: "in_behandeling" | "afgesloten"
) {
  const role = await getCurrentRole();

  if (role !== "admin") {
    return {
      success: false,
      message: "Alleen admins kunnen supporttickets beheren.",
    };
  }

  const supabase = await createServerClient();

  const { error } = await supabase
    .from("support_tickets")
    .update({
      status: nextStatus,
    })
    .eq("id", ticketId);

  if (error) {
    return {
      success: false,
      message: "De ticketstatus kon niet worden bijgewerkt.",
    };
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/support");

  return {
    success: true,
    message:
      nextStatus === "afgesloten"
        ? "Het ticket is afgesloten."
        : "Het ticket staat nu in behandeling.",
  };
}
