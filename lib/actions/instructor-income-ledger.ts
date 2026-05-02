"use server";

import { revalidatePath } from "next/cache";

import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import type {
  InstructorExpenseReceiptCategory,
  InstructorIncomeTransactionStatus,
  InstructorIncomeTransactionType,
} from "@/lib/data/instructor-account";
import { processDuePaymentReminders } from "@/lib/payment-reminders";
import { createServerClient } from "@/lib/supabase/server";

type LessonSyncRow = {
  id: string;
  titel: string;
  start_at: string | null;
  status: string;
  created_at: string;
  leerling_id: string | null;
};

type ExistingLedgerPointer = {
  id: string;
  les_id: string | null;
  betaling_id: string | null;
};

type PackageSyncRow = {
  id: string;
  naam: string;
  prijs: number | string | null;
};

type PaymentSyncRow = {
  id: string;
  pakket_id: string | null;
  profiel_id: string;
  bedrag: number | string | null;
  status: string;
  betaald_at: string | null;
  created_at: string;
};

type LearnerProfilePointer = {
  id: string;
  profile_id: string;
};

type LedgerAmountRow = {
  id: string;
  bedrag: number | string | null;
  platform_fee: number | string | null;
};

type ActionLedgerRow = {
  id: string;
  leerling_id: string | null;
  bedrag: number | string | null;
  btw_bedrag: number | string | null;
  platform_fee: number | string | null;
  status: InstructorIncomeTransactionStatus;
  type: InstructorIncomeTransactionType;
  factuurnummer: string | null;
  omschrijving: string | null;
};

type ExpenseReceiptPointer = {
  id: string;
  bestand_pad: string | null;
};

const EXPENSE_RECEIPT_BUCKET = "instructor-expense-receipts";
const EXPENSE_RECEIPT_CATEGORIES: InstructorExpenseReceiptCategory[] = [
  "brandstof",
  "onderhoud",
  "verzekering",
  "platformkosten",
  "overig",
];
const EXPENSE_RECEIPT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function toAmount(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.length) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function addDaysAsDate(value: string | null | undefined, days: number) {
  const date = value ? new Date(value) : new Date();

  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

function getMonthPeriod(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function buildInvoiceNumber(prefix: string, id: string, dateValue?: string | null) {
  const year = new Date(dateValue ?? Date.now()).getFullYear();

  return `RB-${prefix}-${year}-${id.slice(0, 8).toUpperCase()}`;
}

function mapLessonStatusToLedgerStatus(
  lesson: LessonSyncRow
): InstructorIncomeTransactionStatus {
  if (lesson.status === "afgerond") {
    return "betaald";
  }

  return addDaysAsDate(lesson.start_at ?? lesson.created_at, 7) <
    new Date().toISOString().slice(0, 10)
    ? "te_laat"
    : "open";
}

function mapPaymentStatusToLedgerStatus(
  status: string
): InstructorIncomeTransactionStatus {
  if (status === "betaald") {
    return "betaald";
  }

  if (status === "mislukt") {
    return "geannuleerd";
  }

  return status === "in_afwachting" ? "verstuurd" : "open";
}

function parseCorrectionType(value: FormDataEntryValue | null) {
  return value === "refund" ? "refund" : "correctie";
}

function parseCorrectionAmount(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return 0;
  }

  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

function parseExpenseCategory(
  value: FormDataEntryValue | null,
): InstructorExpenseReceiptCategory {
  return typeof value === "string" &&
    EXPENSE_RECEIPT_CATEGORIES.includes(value as InstructorExpenseReceiptCategory)
    ? (value as InstructorExpenseReceiptCategory)
    : "overig";
}

function parseMoneyInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return 0;
  }

  const parsed = Number(value.replace(",", "."));

  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

function parseDateInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date().toISOString().slice(0, 10);
  }

  return value;
}

function sanitizeUploadName(value: string) {
  const safeName = value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeName || "kostenbon";
}

function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function buildPaymentLink(transactionId: string) {
  return `${getAppBaseUrl()}/leerling/betalingen?factuur=${encodeURIComponent(
    transactionId,
  )}`;
}

function isActionableIncomeStatus(status: InstructorIncomeTransactionStatus) {
  return !["betaald", "terugbetaald", "geannuleerd"].includes(status);
}

async function getCurrentInstructorOrMessage() {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      instructeur: null,
    };
  }

  return {
    instructeur,
  };
}

async function getInstructorTransaction(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  transactionId: string,
  instructeurId: string,
) {
  const { data } = await supabase
    .from("instructeur_inkomsten_transacties" as never)
    .select(
      "id, leerling_id, bedrag, btw_bedrag, platform_fee, status, type, factuurnummer, omschrijving",
    )
    .eq("id" as never, transactionId as never)
    .eq("instructeur_id" as never, instructeurId as never)
    .maybeSingle();

  return (data ?? null) as ActionLedgerRow | null;
}

async function notifyLearner(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  leerlingId: string | null,
  notification: {
    titel: string;
    tekst: string;
    type?: string;
  },
) {
  if (!leerlingId) {
    return;
  }

  const { data: learner } = await supabase
    .from("leerlingen")
    .select("profile_id")
    .eq("id", leerlingId)
    .maybeSingle();

  if (!learner?.profile_id) {
    return;
  }

  await supabase.from("notificaties").insert({
    profiel_id: learner.profile_id,
    titel: notification.titel,
    tekst: notification.tekst,
    type: notification.type ?? "info",
    ongelezen: true,
  });
}

export async function syncInstructorIncomeLedgerAction(): Promise<void> {
  const { instructeur } = await getCurrentInstructorOrMessage();

  if (!instructeur) {
    return;
  }

  const supabase = await createServerClient();
  const lessonPrice = Math.max(toAmount(instructeur.prijs_per_les), 0);
  const [
    { data: lessonRows, error: lessonError },
    { data: packageRows },
    { data: existingRows },
  ] = await Promise.all([
    supabase
      .from("lessen")
      .select("id, titel, start_at, status, created_at, leerling_id")
      .eq("instructeur_id", instructeur.id)
      .in("status", ["geaccepteerd", "ingepland", "afgerond"]),
    supabase
      .from("pakketten")
      .select("id, naam, prijs")
      .eq("instructeur_id", instructeur.id),
    supabase
      .from("instructeur_inkomsten_transacties" as never)
      .select("id, les_id, betaling_id")
      .eq("instructeur_id" as never, instructeur.id as never),
  ]);

  if (lessonError) {
    return;
  }

  const existing = (existingRows ?? []) as ExistingLedgerPointer[];
  const existingLessonIds = new Set(
    existing.map((row) => row.les_id).filter(Boolean)
  );
  const existingPaymentIds = new Set(
    existing.map((row) => row.betaling_id).filter(Boolean)
  );
  const lessons = (lessonRows ?? []) as LessonSyncRow[];
  const lessonInserts = lessons
    .filter((lesson) => !existingLessonIds.has(lesson.id))
    .map((lesson) => {
      const amount = lessonPrice;
      const status = mapLessonStatusToLedgerStatus(lesson);

      return {
        instructeur_id: instructeur.id,
        leerling_id: lesson.leerling_id,
        les_id: lesson.id,
        type: "les" satisfies InstructorIncomeTransactionType,
        bedrag: amount,
        btw_bedrag: roundMoney(amount * 0.21),
        platform_fee: roundMoney(amount * 0.05),
        status,
        factuurnummer: buildInvoiceNumber("LES", lesson.id, lesson.start_at),
        vervaldatum: addDaysAsDate(lesson.start_at ?? lesson.created_at, 7),
        betaald_at:
          status === "betaald" ? lesson.start_at ?? lesson.created_at : null,
        omschrijving: lesson.titel || "Rijles",
        metadata: {
          source: "lesson_sync",
          lesson_status: lesson.status,
        },
      };
    });

  const packages = (packageRows ?? []) as PackageSyncRow[];
  const packageMap = new Map(packages.map((pkg) => [pkg.id, pkg]));
  const packageIds = packages.map((pkg) => pkg.id);
  let paymentInserts: Array<Record<string, unknown>> = [];

  if (packageIds.length) {
    const { data: paymentRows } = await supabase
      .from("betalingen")
      .select("id, pakket_id, profiel_id, bedrag, status, betaald_at, created_at")
      .in("pakket_id", packageIds);
    const payments = ((paymentRows ?? []) as PaymentSyncRow[]).filter(
      (payment) => !existingPaymentIds.has(payment.id)
    );
    const profileIds = Array.from(
      new Set(payments.map((payment) => payment.profiel_id))
    );
    const learnerByProfileId = new Map<string, string>();

    if (profileIds.length) {
      const { data: learnerRows } = await supabase
        .from("leerlingen")
        .select("id, profile_id")
        .in("profile_id", profileIds);

      for (const learner of (learnerRows ?? []) as LearnerProfilePointer[]) {
        learnerByProfileId.set(learner.profile_id, learner.id);
      }
    }

    paymentInserts = payments.map((payment) => {
      const pkg = payment.pakket_id ? packageMap.get(payment.pakket_id) : null;
      const amount = toAmount(payment.bedrag) || toAmount(pkg?.prijs);
      const status = mapPaymentStatusToLedgerStatus(payment.status);

      return {
        instructeur_id: instructeur.id,
        leerling_id: learnerByProfileId.get(payment.profiel_id) ?? null,
        pakket_id: payment.pakket_id,
        betaling_id: payment.id,
        type: "pakket" satisfies InstructorIncomeTransactionType,
        bedrag: amount,
        btw_bedrag: roundMoney(amount * 0.21),
        platform_fee: roundMoney(amount * 0.05),
        status,
        factuurnummer: buildInvoiceNumber(
          "PAK",
          payment.id,
          payment.created_at
        ),
        vervaldatum: addDaysAsDate(payment.created_at, 14),
        betaald_at:
          status === "betaald"
            ? payment.betaald_at ?? payment.created_at
            : null,
        omschrijving: pkg?.naam ? `Pakketbetaling - ${pkg.naam}` : "Pakketbetaling",
        metadata: {
          source: "payment_sync",
          payment_status: payment.status,
        },
      };
    });
  }

  const inserts = [...lessonInserts, ...paymentInserts];

  if (inserts.length) {
    const { error: insertError } = await supabase
      .from("instructeur_inkomsten_transacties" as never)
      .insert(inserts as never);

    if (insertError) {
      return;
    }
  }

  const { start, end } = getMonthPeriod();
  const { data: paidRows } = await supabase
    .from("instructeur_inkomsten_transacties" as never)
    .select("id, bedrag, platform_fee")
    .eq("instructeur_id" as never, instructeur.id as never)
    .eq("status" as never, "betaald" as never)
    .gte("betaald_at" as never, `${start}T00:00:00.000Z` as never)
    .lte("betaald_at" as never, `${end}T23:59:59.999Z` as never);
  const paid = (paidRows ?? []) as LedgerAmountRow[];
  const bruto = roundMoney(
    paid.reduce((sum, row) => sum + toAmount(row.bedrag), 0)
  );
  const fee = roundMoney(
    paid.reduce((sum, row) => sum + toAmount(row.platform_fee), 0)
  );

  if (bruto > 0) {
    const { data: existingPayout } = await supabase
      .from("instructeur_uitbetalingen" as never)
      .select("id")
      .eq("instructeur_id" as never, instructeur.id as never)
      .eq("periode_start" as never, start as never)
      .eq("periode_eind" as never, end as never)
      .maybeSingle();

    if (existingPayout) {
      await supabase
        .from("instructeur_uitbetalingen" as never)
        .update({
          bruto_bedrag: bruto,
          platform_fee: fee,
          status: "gepland",
        } as never)
        .eq("id" as never, (existingPayout as { id: string }).id as never);
    } else {
      await supabase.from("instructeur_uitbetalingen" as never).insert({
        instructeur_id: instructeur.id,
        periode_start: start,
        periode_eind: end,
        bruto_bedrag: bruto,
        platform_fee: fee,
        status: "gepland",
        referentie: `UIT-${start.slice(0, 7)}`,
      } as never);
    }
  }

  revalidatePath("/instructeur/inkomsten");
}

export async function markIncomeTransactionPaidAction(
  formData: FormData
): Promise<void> {
  const transactionId = String(formData.get("transactionId") ?? "");
  const { instructeur } = await getCurrentInstructorOrMessage();

  if (!instructeur) {
    return;
  }

  if (!transactionId) {
    return;
  }

  const supabase = await createServerClient();
  await supabase
    .from("instructeur_inkomsten_transacties" as never)
    .update({
      status: "betaald",
      betaald_at: new Date().toISOString(),
    } as never)
    .eq("id" as never, transactionId as never)
    .eq("instructeur_id" as never, instructeur.id as never);

  revalidatePath("/instructeur/inkomsten");
}

export async function sendIncomeReminderAction(
  formData: FormData
): Promise<void> {
  const transactionId = String(formData.get("transactionId") ?? "");
  const { instructeur } = await getCurrentInstructorOrMessage();

  if (!instructeur) {
    return;
  }

  if (!transactionId) {
    return;
  }

  const supabase = await createServerClient();
  const row = await getInstructorTransaction(
    supabase,
    transactionId,
    instructeur.id,
  );

  if (!row) {
    return;
  }

  const nextStatus =
    row.status === "te_laat" || row.status === "betaald"
      ? row.status
      : "verstuurd";
  await supabase
    .from("instructeur_inkomsten_transacties" as never)
    .update({
      status: nextStatus,
      herinnering_verstuurd_at: new Date().toISOString(),
    } as never)
    .eq("id" as never, transactionId as never)
    .eq("instructeur_id" as never, instructeur.id as never);

  await notifyLearner(supabase, row.leerling_id, {
    titel: "Betalingsherinnering",
    tekst: `${row.omschrijving ?? "Betaling"} staat nog open voor ${new Intl.NumberFormat("nl-NL", {
      currency: "EUR",
      style: "currency",
    }).format(toAmount(row.bedrag))}.`,
    type: "waarschuwing",
  });

  revalidatePath("/instructeur/inkomsten");
}

export async function runAutomaticPaymentRemindersAction(): Promise<void> {
  const { instructeur } = await getCurrentInstructorOrMessage();

  if (!instructeur) {
    return;
  }

  await processDuePaymentReminders({
    instructeurId: instructeur.id,
  });

  revalidatePath("/instructeur/inkomsten");
}

export async function resendIncomeInvoiceAction(
  formData: FormData
): Promise<void> {
  const transactionId = String(formData.get("transactionId") ?? "");
  const { instructeur } = await getCurrentInstructorOrMessage();

  if (!instructeur || !transactionId) {
    return;
  }

  const supabase = await createServerClient();
  const row = await getInstructorTransaction(
    supabase,
    transactionId,
    instructeur.id,
  );

  if (!row) {
    return;
  }

  if (isActionableIncomeStatus(row.status)) {
    await supabase
      .from("instructeur_inkomsten_transacties" as never)
      .update({
        status: row.status === "te_laat" ? "te_laat" : "verstuurd",
        herinnering_verstuurd_at: new Date().toISOString(),
      } as never)
      .eq("id" as never, transactionId as never)
      .eq("instructeur_id" as never, instructeur.id as never);
  }

  await notifyLearner(supabase, row.leerling_id, {
    titel: "Factuur opnieuw verzonden",
    tekst: `Factuur ${row.factuurnummer ?? row.id} voor ${row.omschrijving ?? "je rijles"} is opnieuw klaargezet.`,
  });

  revalidatePath("/instructeur/inkomsten");
}

export async function sendIncomePaymentLinkAction(
  formData: FormData
): Promise<void> {
  const transactionId = String(formData.get("transactionId") ?? "");
  const { instructeur } = await getCurrentInstructorOrMessage();

  if (!instructeur || !transactionId) {
    return;
  }

  const supabase = await createServerClient();
  const row = await getInstructorTransaction(
    supabase,
    transactionId,
    instructeur.id,
  );

  if (!row) {
    return;
  }

  if (isActionableIncomeStatus(row.status)) {
    await supabase
      .from("instructeur_inkomsten_transacties" as never)
      .update({
        status: row.status === "te_laat" ? "te_laat" : "verstuurd",
        herinnering_verstuurd_at: new Date().toISOString(),
      } as never)
      .eq("id" as never, transactionId as never)
      .eq("instructeur_id" as never, instructeur.id as never);
  }

  await notifyLearner(supabase, row.leerling_id, {
    titel: "Betaallink ontvangen",
    tekst: `Betaal ${new Intl.NumberFormat("nl-NL", {
      currency: "EUR",
      style: "currency",
    }).format(toAmount(row.bedrag))} via ${buildPaymentLink(row.id)}.`,
  });

  revalidatePath("/instructeur/inkomsten");
}

export async function cancelIncomeTransactionAction(
  formData: FormData
): Promise<void> {
  const transactionId = String(formData.get("transactionId") ?? "");
  const { instructeur } = await getCurrentInstructorOrMessage();

  if (!instructeur || !transactionId) {
    return;
  }

  const supabase = await createServerClient();
  const row = await getInstructorTransaction(
    supabase,
    transactionId,
    instructeur.id,
  );

  if (!row || row.status === "geannuleerd" || row.type === "refund") {
    return;
  }

  if (row.status === "betaald") {
    const referenceId = crypto.randomUUID();

    await supabase
      .from("instructeur_inkomsten_transacties" as never)
      .insert({
        instructeur_id: instructeur.id,
        leerling_id: row.leerling_id,
        type: "refund" satisfies InstructorIncomeTransactionType,
        bedrag: toAmount(row.bedrag),
        btw_bedrag: toAmount(row.btw_bedrag),
        platform_fee: 0,
        status: "terugbetaald",
        factuurnummer: buildInvoiceNumber("CRE", referenceId),
        vervaldatum: new Date().toISOString().slice(0, 10),
        betaald_at: new Date().toISOString(),
        omschrijving: `Creditnota - ${row.omschrijving ?? row.factuurnummer ?? "inkomstenregel"}`,
        metadata: {
          source: "credit_note",
          original_transaction_id: row.id,
        },
      } as never);
  } else {
    await supabase
      .from("instructeur_inkomsten_transacties" as never)
      .update({
        status: "geannuleerd",
      } as never)
      .eq("id" as never, transactionId as never)
      .eq("instructeur_id" as never, instructeur.id as never);
  }

  await notifyLearner(supabase, row.leerling_id, {
    titel: row.status === "betaald" ? "Creditnota gemaakt" : "Factuur geannuleerd",
    tekst:
      row.status === "betaald"
        ? `Er is een creditnota gemaakt voor ${row.factuurnummer ?? row.omschrijving ?? "je factuur"}.`
        : `Factuur ${row.factuurnummer ?? row.id} is geannuleerd.`,
  });

  revalidatePath("/instructeur/inkomsten");
}

export async function createIncomeCorrectionAction(
  formData: FormData
): Promise<void> {
  const { instructeur } = await getCurrentInstructorOrMessage();

  if (!instructeur) {
    return;
  }

  const type = parseCorrectionType(formData.get("type"));
  const amount = parseCorrectionAmount(formData.get("bedrag"));
  const omschrijving =
    typeof formData.get("omschrijving") === "string"
      ? String(formData.get("omschrijving")).trim()
      : "";

  if (!omschrijving || amount <= 0) {
    return;
  }

  const supabase = await createServerClient();
  const referenceId = crypto.randomUUID();
  const status: InstructorIncomeTransactionStatus =
    type === "refund" ? "terugbetaald" : "open";
  await supabase
    .from("instructeur_inkomsten_transacties" as never)
    .insert({
      instructeur_id: instructeur.id,
      type,
      bedrag: amount,
      btw_bedrag: 0,
      platform_fee: 0,
      status,
      factuurnummer: buildInvoiceNumber("COR", referenceId),
      vervaldatum: addDaysAsDate(new Date().toISOString(), 14),
      betaald_at: status === "terugbetaald" ? new Date().toISOString() : null,
      omschrijving,
      metadata: {
        source: "manual_correction",
      },
    } as never);

  revalidatePath("/instructeur/inkomsten");
}

export async function uploadInstructorExpenseReceiptAction(
  formData: FormData
): Promise<void> {
  const { instructeur } = await getCurrentInstructorOrMessage();

  if (!instructeur) {
    return;
  }

  const file = formData.get("bestand");

  if (!(file instanceof File) || file.size <= 0) {
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    return;
  }

  if (file.type && !EXPENSE_RECEIPT_MIME_TYPES.has(file.type)) {
    return;
  }

  const omschrijving =
    typeof formData.get("omschrijving") === "string"
      ? String(formData.get("omschrijving")).trim()
      : "";
  const leverancier =
    typeof formData.get("leverancier") === "string"
      ? String(formData.get("leverancier")).trim()
      : "";
  const bedrag = parseMoneyInput(formData.get("bedrag"));
  const btwBedrag = parseMoneyInput(formData.get("btw_bedrag"));
  const categorie = parseExpenseCategory(formData.get("categorie"));
  const uitgegevenOp = parseDateInput(formData.get("uitgegeven_op"));

  if (!omschrijving || bedrag <= 0) {
    return;
  }

  const supabase = await createServerClient();
  const filePath = [
    instructeur.profile_id,
    instructeur.id,
    `${uitgegevenOp}-${crypto.randomUUID()}-${sanitizeUploadName(file.name)}`,
  ].join("/");
  const { error: uploadError } = await supabase.storage
    .from(EXPENSE_RECEIPT_BUCKET)
    .upload(filePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return;
  }

  const { error: insertError } = await supabase
    .from("instructeur_kostenbonnen" as never)
    .insert({
      instructeur_id: instructeur.id,
      categorie,
      omschrijving,
      bedrag,
      btw_bedrag: Math.min(btwBedrag, bedrag),
      uitgegeven_op: uitgegevenOp,
      leverancier: leverancier || null,
      bestand_pad: filePath,
      bestand_naam: file.name,
      bestand_type: file.type || null,
      bestand_grootte: file.size,
      metadata: {
        source: "income_page_upload",
      },
    } as never);

  if (insertError) {
    await supabase.storage.from(EXPENSE_RECEIPT_BUCKET).remove([filePath]);
    return;
  }

  revalidatePath("/instructeur/inkomsten");
}

export async function deleteInstructorExpenseReceiptAction(
  formData: FormData
): Promise<void> {
  const receiptId = String(formData.get("receiptId") ?? "");
  const { instructeur } = await getCurrentInstructorOrMessage();

  if (!instructeur || !receiptId) {
    return;
  }

  const supabase = await createServerClient();
  const { data: receipt } = await supabase
    .from("instructeur_kostenbonnen" as never)
    .select("id, bestand_pad")
    .eq("id" as never, receiptId as never)
    .eq("instructeur_id" as never, instructeur.id as never)
    .maybeSingle();
  const row = (receipt ?? null) as ExpenseReceiptPointer | null;

  if (!row) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("instructeur_kostenbonnen" as never)
    .delete()
    .eq("id" as never, receiptId as never)
    .eq("instructeur_id" as never, instructeur.id as never);

  if (deleteError) {
    return;
  }

  if (row.bestand_pad) {
    await supabase.storage.from(EXPENSE_RECEIPT_BUCKET).remove([row.bestand_pad]);
  }

  revalidatePath("/instructeur/inkomsten");
}
