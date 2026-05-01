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
  const updatedAt = new Date().toISOString();

  const [
    { error: instructorError },
    { error: verificationError },
    { error: documentsError },
  ] = await Promise.all([
    supabase
      .from("instructeurs")
      .update({
        profiel_status: nextStatus,
        updated_at: updatedAt,
      })
      .eq("id", instructorId),
    supabase
      .from("instructeur_verificatie_aanvragen" as never)
      .update({
        status: nextStatus,
        updated_at: updatedAt,
      } as never)
      .eq("instructeur_id" as never, instructorId as never),
    supabase
      .from("instructeur_documenten")
      .update({
        status: nextStatus,
      })
      .eq("instructeur_id", instructorId)
      .in("status", ["ingediend", "in_beoordeling"]),
  ]);

  if (instructorError || verificationError || documentsError) {
    return {
      success: false,
      message: "De verificatiestatus kon niet volledig worden bijgewerkt.",
    };
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/instructeurs");
  revalidatePath("/instructeur-verificatie");
  revalidatePath("/instructeur/instellingen");
  revalidatePath("/instructeur/profiel");

  return {
    success: true,
    message:
      nextStatus === "goedgekeurd"
        ? "De instructeur, aanvraag en documenten zijn goedgekeurd."
        : "De instructeur, aanvraag en documenten zijn afgewezen.",
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
