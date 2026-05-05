import "server-only";

import { revalidatePath } from "next/cache";

import { recordAuditEvents, type AuditActorRole } from "@/lib/audit-events";
import { syncStudentDriverJourneyStatus } from "@/lib/data/driver-journey";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { toPackageAmount } from "@/lib/student-package-status";
import type { BetaalStatus } from "@/lib/types";

type AssignStudentPackageInput = {
  leerlingId: string;
  pakketId: string | null;
  actorInstructeurId?: string | null;
  actorProfileId?: string | null;
  actorRole?: AuditActorRole | null;
  allowReplace?: boolean;
  notifyLearner?: boolean;
};

type LearnerPackageRow = {
  id: string;
  profile_id: string;
  pakket_id: string | null;
};

type PackageAssignmentPackageRow = {
  id: string;
  naam: string;
  prijs: number | string | null;
  aantal_lessen: number | null;
  instructeur_id: string | null;
  actief: boolean | null;
};

type PackageAssignmentPaymentRow = {
  id: string;
  status: BetaalStatus;
  created_at: string;
};

type PackageAssignmentLessonRow = {
  id: string;
};

function revalidateStudentPackageSurfaces() {
  [
    "/admin/leerlingen",
    "/admin/betalingen",
    "/instructeur/dashboard",
    "/instructeur/regie",
    "/instructeur/leerlingen",
    "/instructeur/lessen",
    "/leerling/dashboard",
    "/leerling/boekingen",
    "/leerling/betalingen",
    "/leerling/profiel",
    "/leerling/voortgang",
  ].forEach((path) => revalidatePath(path));
}

async function getLearnerPackageRow(leerlingId: string) {
  const supabase = await createServerClient();
  const { data, error } = (await supabase
    .from("leerlingen")
    .select("id, profile_id, pakket_id")
    .eq("id", leerlingId)
    .maybeSingle()) as unknown as {
    data: LearnerPackageRow | null;
    error?: { message?: string } | null;
  };

  return { data, error };
}

async function getPackageRow(pakketId: string) {
  const supabase = await createServerClient();
  const { data, error } = (await supabase
    .from("pakketten")
    .select("id, naam, prijs, aantal_lessen, instructeur_id, actief")
    .eq("id", pakketId)
    .maybeSingle()) as unknown as {
    data: PackageAssignmentPackageRow | null;
    error?: { message?: string } | null;
  };

  return { data, error };
}

async function cancelOpenPaymentsForPackage(input: {
  leerling: LearnerPackageRow;
  pakketId: string;
}) {
  const admin = await createAdminClient();
  const { data: openPayments, error: readError } = (await admin
    .from("betalingen")
    .select("id, status, created_at")
    .eq("profiel_id", input.leerling.profile_id)
    .eq("pakket_id", input.pakketId)
    .in("status", ["open", "in_afwachting"])) as unknown as {
    data: PackageAssignmentPaymentRow[] | null;
    error?: { message?: string } | null;
  };

  if (readError || !openPayments?.length) {
    return {
      closedPayments: [] as PackageAssignmentPaymentRow[],
      error: readError ?? null,
    };
  }

  const { error } = await admin
    .from("betalingen")
    .update({ status: "mislukt" })
    .in(
      "id",
      openPayments.map((payment) => payment.id)
    );

  return {
    closedPayments: error ? [] : openPayments,
    error: error ?? null,
  };
}

async function ensurePackagePayment(input: {
  leerling: LearnerPackageRow;
  pakket: PackageAssignmentPackageRow;
}) {
  const admin = await createAdminClient();
  const amount = toPackageAmount(input.pakket.prijs);
  const targetStatus: BetaalStatus = amount > 0 ? "open" : "betaald";
  const now = new Date().toISOString();
  const { data: paymentRows } = (await admin
    .from("betalingen")
    .select("id, status, created_at")
    .eq("profiel_id", input.leerling.profile_id)
    .eq("pakket_id", input.pakket.id)
    .in("status", ["open", "in_afwachting", "betaald"])
    .order("created_at", { ascending: false })
    .limit(1)) as unknown as {
    data: PackageAssignmentPaymentRow[] | null;
  };
  const existingPayment = paymentRows?.[0] ?? null;

  if (existingPayment) {
    if (amount <= 0 && existingPayment.status !== "betaald") {
      await admin
        .from("betalingen")
        .update({ status: "betaald", betaald_at: now })
        .eq("id", existingPayment.id);

      return {
        payment: {
          ...existingPayment,
          status: "betaald" as BetaalStatus,
        },
        created: false,
        statusChanged: true,
      };
    }

    return {
      payment: existingPayment,
      created: false,
      statusChanged: false,
    };
  }

  const { data: insertedPayment, error } = (await admin
    .from("betalingen")
    .insert({
      profiel_id: input.leerling.profile_id,
      pakket_id: input.pakket.id,
      bedrag: amount,
      status: targetStatus,
      provider: "manual",
      betaald_at: targetStatus === "betaald" ? now : null,
    })
    .select("id, status, created_at")
    .maybeSingle()) as unknown as {
    data: PackageAssignmentPaymentRow | null;
    error?: { message?: string } | null;
  };

  if (error || !insertedPayment) {
    return null;
  }

  return {
    payment: insertedPayment,
    created: true,
    statusChanged: false,
  };
}

async function updatePlanningRights(input: {
  leerlingId: string;
  instructeurId: string | null;
  enabled: boolean;
}) {
  if (!input.instructeurId) {
    return null;
  }

  const admin = await createAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin
    .from("leerling_planningsrechten" as never)
    .upsert(
      {
        leerling_id: input.leerlingId,
        instructeur_id: input.instructeurId,
        zelf_inplannen_toegestaan: input.enabled,
        vrijgegeven_at: input.enabled ? now : null,
        updated_at: now,
      } as never,
      { onConflict: "leerling_id,instructeur_id" },
    );

  return error ?? null;
}

async function updateOpenLessonsPackage(input: {
  leerlingId: string;
  fromPackageId?: string | null;
  toPackageId: string | null;
}) {
  const admin = await createAdminClient();
  let query = admin
    .from("lessen")
    .update({ pakket_id: input.toPackageId })
    .eq("leerling_id", input.leerlingId)
    .in("status", ["aangevraagd", "geaccepteerd", "ingepland"])
    .not("titel", "ilike", "%proefles%");

  if (input.fromPackageId === undefined || input.fromPackageId === null) {
    query = query.is("pakket_id", null);
  } else {
    query = query.eq("pakket_id", input.fromPackageId);
  }

  const { data, error } = (await query.select("id")) as unknown as {
    data: PackageAssignmentLessonRow[] | null;
    error?: { message?: string } | null;
  };

  return {
    count: data?.length ?? 0,
    error: error ?? null,
  };
}

async function notifyPackageAssignment(input: {
  leerling: LearnerPackageRow;
  pakket: PackageAssignmentPackageRow;
  paymentStatus: BetaalStatus | null;
}) {
  const supabase = await createServerClient();
  const needsPayment =
    toPackageAmount(input.pakket.prijs) > 0 && input.paymentStatus !== "betaald";

  await supabase.from("notificaties").insert({
    profiel_id: input.leerling.profile_id,
    titel: "Pakket gekoppeld",
    tekst: needsPayment
      ? `${input.pakket.naam} staat klaar. Rond de betaling af om je traject netjes op orde te houden.`
      : `Je bent gekoppeld aan ${input.pakket.naam}. Je lessen worden voortaan aan dit pakket gekoppeld.`,
    type: needsPayment ? "waarschuwing" : "succes",
    ongelezen: true,
  });
}

export async function assignStudentPackage(input: AssignStudentPackageInput) {
  const actorRole: AuditActorRole =
    input.actorRole ?? (input.actorInstructeurId ? "instructeur" : "system");
  const leerlingResult = await getLearnerPackageRow(input.leerlingId);

  if (leerlingResult.error) {
    return {
      success: false,
      message: "De leerling kon niet worden opgehaald.",
    };
  }

  const leerling = leerlingResult.data;

  if (!leerling) {
    return {
      success: false,
      message: "Leerling niet gevonden.",
    };
  }

  const admin = await createAdminClient();

  if (!input.pakketId) {
    const currentPackageId = leerling.pakket_id;
    let currentInstructorId = input.actorInstructeurId ?? null;

    if (currentPackageId && !currentInstructorId) {
      const currentPackage = await getPackageRow(currentPackageId);
      currentInstructorId = currentPackage.data?.instructeur_id ?? null;
    }

    const { error } = await admin
      .from("leerlingen")
      .update({ pakket_id: null })
      .eq("id", leerling.id);

    if (error) {
      return {
        success: false,
        message: "De pakketkoppeling kon niet worden verwijderd.",
      };
    }

    if (currentPackageId) {
      const closedPaymentsResult = await cancelOpenPaymentsForPackage({
        leerling,
        pakketId: currentPackageId,
      });

      const lessonDetachResult = await updateOpenLessonsPackage({
        leerlingId: leerling.id,
        fromPackageId: currentPackageId,
        toPackageId: null,
      });

      await recordAuditEvents([
        {
          actorProfileId: input.actorProfileId ?? null,
          actorRole,
          eventType: "package_unlinked",
          entityType: "student_package",
          entityId: currentPackageId,
          leerlingId: leerling.id,
          instructeurId: currentInstructorId,
          pakketId: currentPackageId,
          summary: "Pakket losgekoppeld van leerling.",
          metadata: {
            previous_package_id: currentPackageId,
            planning_disabled: true,
          },
        },
        ...closedPaymentsResult.closedPayments.map((payment) => ({
          actorProfileId: input.actorProfileId ?? null,
          actorRole,
          eventType: "package_payment_closed",
          entityType: "payment",
          entityId: payment.id,
          leerlingId: leerling.id,
          instructeurId: currentInstructorId,
          pakketId: currentPackageId,
          betalingId: payment.id,
          summary: "Open pakketbetaling gesloten door loskoppeling.",
          metadata: {
            previous_status: payment.status,
            next_status: "mislukt",
          },
        })),
        lessonDetachResult.count > 0
          ? {
              actorProfileId: input.actorProfileId ?? null,
              actorRole,
              eventType: "package_lessons_detached",
              entityType: "lesson_package_link",
              entityId: leerling.id,
              leerlingId: leerling.id,
              instructeurId: currentInstructorId,
              pakketId: currentPackageId,
              summary: "Open lessen losgekoppeld van pakket.",
              metadata: {
                lesson_count: lessonDetachResult.count,
                previous_package_id: currentPackageId,
              },
            }
          : null,
      ].filter(Boolean));
    }

    const planningError = await updatePlanningRights({
      leerlingId: leerling.id,
      instructeurId: currentInstructorId,
      enabled: false,
    });

    if (!planningError) {
      await recordAuditEvents([
        {
          actorProfileId: input.actorProfileId ?? null,
          actorRole,
          eventType: "package_planning_disabled",
          entityType: "planning_right",
          entityId: leerling.id,
          leerlingId: leerling.id,
          instructeurId: currentInstructorId,
          pakketId: currentPackageId,
          summary: "Zelf plannen uitgezet na pakketloskoppeling.",
          metadata: {
            enabled: false,
          },
        },
      ]);
    }

    await syncStudentDriverJourneyStatus(leerling.id);
    revalidateStudentPackageSurfaces();

    return {
      success: true,
      message: "Pakketkoppeling verwijderd. Open betalingen voor dit pakket zijn gesloten.",
    };
  }

  const packageResult = await getPackageRow(input.pakketId);

  if (packageResult.error) {
    return {
      success: false,
      message: "Het pakket kon niet worden opgehaald.",
    };
  }

  const pakket = packageResult.data;

  if (!pakket) {
    return {
      success: false,
      message: "Pakket niet gevonden.",
    };
  }

  if (
    input.actorInstructeurId &&
    pakket.instructeur_id !== input.actorInstructeurId
  ) {
    return {
      success: false,
      message: "Dit pakket hoort niet bij jouw aanbod.",
    };
  }

  if (
    leerling.pakket_id &&
    leerling.pakket_id !== pakket.id &&
    !input.allowReplace
  ) {
    return {
      success: false,
      message:
        "Deze leerling heeft al een pakket. Bevestig bewust vervangen als je het bestaande pakket wilt vervangen.",
    };
  }

  const isReplacingPackage = Boolean(
    leerling.pakket_id && leerling.pakket_id !== pakket.id
  );
  const closedOldPayments = isReplacingPackage
    ? await cancelOpenPaymentsForPackage({
        leerling,
        pakketId: leerling.pakket_id as string,
      })
    : { closedPayments: [] as PackageAssignmentPaymentRow[] };

  const { error: learnerUpdateError } = await admin
    .from("leerlingen")
    .update({ pakket_id: pakket.id })
    .eq("id", leerling.id);

  if (learnerUpdateError) {
    return {
      success: false,
      message: "Het pakket kon niet aan deze leerling worden gekoppeld.",
    };
  }

  const oldPackageLessonUpdate = isReplacingPackage
    ? await updateOpenLessonsPackage({
        leerlingId: leerling.id,
        fromPackageId: leerling.pakket_id,
        toPackageId: pakket.id,
      })
    : null;
  const newPackageLessonUpdate = await updateOpenLessonsPackage({
    leerlingId: leerling.id,
    fromPackageId: null,
    toPackageId: pakket.id,
  });
  const lessonPackageUpdates = [
    oldPackageLessonUpdate,
    newPackageLessonUpdate,
  ].filter(Boolean);
  const lessonPackageUpdateErrors = lessonPackageUpdates
    .map((result) => result?.error)
    .filter(Boolean);

  if (lessonPackageUpdateErrors.length) {
    return {
      success: false,
      message:
        "Het pakket is gekoppeld, maar bestaande geplande lessen konden niet aan dit pakket worden gekoppeld.",
    };
  }

  const paymentResult = await ensurePackagePayment({ leerling, pakket });

  if (!paymentResult) {
    return {
      success: false,
      message:
        "Het pakket is gekoppeld, maar de betaling kon niet worden klaargezet.",
    };
  }

  const payment = paymentResult.payment;

  const planningError = await updatePlanningRights({
    leerlingId: leerling.id,
    instructeurId: pakket.instructeur_id,
    enabled: true,
  });

  if (planningError) {
    return {
      success: false,
      message:
        "Het pakket is gekoppeld, maar de planningstoegang kon niet worden bijgewerkt.",
    };
  }

  const assignmentEventType =
    leerling.pakket_id === pakket.id
      ? "package_assignment_synced"
      : leerling.pakket_id
        ? "package_replaced"
        : "package_assigned";
  const attachedLessonCount = lessonPackageUpdates.reduce(
    (total, result) => total + (result?.count ?? 0),
    0
  );

  await recordAuditEvents([
    {
      actorProfileId: input.actorProfileId ?? null,
      actorRole,
      eventType: assignmentEventType,
      entityType: "student_package",
      entityId: pakket.id,
      leerlingId: leerling.id,
      instructeurId: pakket.instructeur_id,
      pakketId: pakket.id,
      summary:
        assignmentEventType === "package_replaced"
          ? "Pakket van leerling vervangen."
          : assignmentEventType === "package_assignment_synced"
            ? "Bestaande pakketkoppeling opnieuw gesynchroniseerd."
            : "Pakket gekoppeld aan leerling.",
      metadata: {
        previous_package_id: leerling.pakket_id,
        next_package_id: pakket.id,
        package_name: pakket.naam,
        package_lessons: pakket.aantal_lessen,
        package_active: pakket.actief,
        allow_replace: Boolean(input.allowReplace),
      },
    },
    {
      actorProfileId: input.actorProfileId ?? null,
      actorRole,
      eventType: paymentResult.created
        ? "package_payment_created"
        : "package_payment_reused",
      entityType: "payment",
      entityId: payment.id,
      leerlingId: leerling.id,
      instructeurId: pakket.instructeur_id,
      pakketId: pakket.id,
      betalingId: payment.id,
      summary: paymentResult.created
        ? "Pakketbetaling aangemaakt."
        : "Bestaande pakketbetaling hergebruikt.",
      metadata: {
        payment_status: payment.status,
        payment_status_changed: paymentResult.statusChanged,
        package_price: toPackageAmount(pakket.prijs),
      },
    },
    ...closedOldPayments.closedPayments.map((oldPayment) => ({
      actorProfileId: input.actorProfileId ?? null,
      actorRole,
      eventType: "package_payment_closed",
      entityType: "payment",
      entityId: oldPayment.id,
      leerlingId: leerling.id,
      instructeurId: pakket.instructeur_id,
      pakketId: leerling.pakket_id,
      betalingId: oldPayment.id,
      summary: "Open betaling van vorig pakket gesloten.",
      metadata: {
        previous_status: oldPayment.status,
        next_status: "mislukt",
        replacement_package_id: pakket.id,
      },
    })),
    attachedLessonCount > 0
      ? {
          actorProfileId: input.actorProfileId ?? null,
          actorRole,
          eventType: "package_lessons_attached",
          entityType: "lesson_package_link",
          entityId: pakket.id,
          leerlingId: leerling.id,
          instructeurId: pakket.instructeur_id,
          pakketId: pakket.id,
          summary: "Open lessen aan pakket gekoppeld.",
          metadata: {
            lesson_count: attachedLessonCount,
            previous_package_id: leerling.pakket_id,
            next_package_id: pakket.id,
          },
        }
      : null,
    {
      actorProfileId: input.actorProfileId ?? null,
      actorRole,
      eventType: "package_planning_released",
      entityType: "planning_right",
      entityId: leerling.id,
      leerlingId: leerling.id,
      instructeurId: pakket.instructeur_id,
      pakketId: pakket.id,
      summary: "Planning vrijgegeven na pakketkoppeling.",
      metadata: {
        enabled: true,
      },
    },
  ].filter(Boolean));

  if (input.notifyLearner !== false) {
    await notifyPackageAssignment({
      leerling,
      pakket,
      paymentStatus: payment.status,
    });
  }

  await syncStudentDriverJourneyStatus(leerling.id);
  revalidateStudentPackageSurfaces();

  return {
    success: true,
    message:
      leerling.pakket_id === pakket.id
        ? `Pakketstatus bijgewerkt: ${pakket.naam}.`
        : `Pakket gekoppeld: ${pakket.naam}.`,
    paymentId: payment.id,
    paymentStatus: payment.status,
  };
}
