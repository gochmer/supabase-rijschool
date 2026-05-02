import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type PaymentReminderStage = {
  days: 3 | 7 | 14;
  key: "day3" | "day7" | "day14";
  title: string;
  type: "info" | "waarschuwing";
};

type PaymentReminderMetadata = {
  auto_payment_reminder_last_label?: string;
  auto_payment_reminder_stage?: number;
  auto_payment_reminders?: Record<string, string>;
};

type PaymentReminderRow = {
  id: string;
  instructeur_id: string;
  leerling_id: string | null;
  bedrag: number | string | null;
  status: "open" | "verstuurd" | "te_laat" | "betaald" | "terugbetaald" | "geannuleerd";
  factuurnummer: string | null;
  vervaldatum: string | null;
  omschrijving: string | null;
  created_at: string;
  metadata: PaymentReminderMetadata | null;
};

type LearnerProfileRow = {
  id: string;
  profile_id: string | null;
};

export const PAYMENT_REMINDER_STAGES: PaymentReminderStage[] = [
  {
    days: 3,
    key: "day3",
    title: "Vriendelijke betalingsherinnering",
    type: "info",
  },
  {
    days: 7,
    key: "day7",
    title: "Tweede betalingsherinnering",
    type: "waarschuwing",
  },
  {
    days: 14,
    key: "day14",
    title: "Laatste betalingsherinnering",
    type: "waarschuwing",
  },
];

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

function formatAmount(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    currency: "EUR",
    style: "currency",
  }).format(value);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDaysOpen(row: PaymentReminderRow) {
  const baseDate = row.vervaldatum
    ? startOfDay(new Date(row.vervaldatum))
    : startOfDay(new Date(row.created_at));
  const diff = startOfDay(new Date()).getTime() - baseDate.getTime();

  return Math.max(0, Math.floor(diff / 86_400_000));
}

function getMetadata(row: PaymentReminderRow): PaymentReminderMetadata {
  return row.metadata && typeof row.metadata === "object" ? row.metadata : {};
}

function getDueStage(row: PaymentReminderRow) {
  const metadata = getMetadata(row);
  const sent = metadata.auto_payment_reminders ?? {};
  const daysOpen = getDaysOpen(row);
  const dueStages = PAYMENT_REMINDER_STAGES.filter(
    (stage) => daysOpen >= stage.days && !sent[stage.key],
  );

  return dueStages.at(-1) ?? null;
}

function buildReminderText(row: PaymentReminderRow, stage: PaymentReminderStage) {
  const amount = formatAmount(toAmount(row.bedrag));
  const invoice = row.factuurnummer ? `factuur ${row.factuurnummer}` : "je factuur";
  const description = row.omschrijving ? ` voor ${row.omschrijving}` : "";

  if (stage.days === 3) {
    return `Kleine reminder: ${invoice}${description} staat nog open voor ${amount}. Je kunt deze betaling alvast afronden.`;
  }

  if (stage.days === 7) {
    return `Tweede herinnering: ${invoice}${description} staat nog steeds open voor ${amount}. Rond de betaling vandaag af om vertraging te voorkomen.`;
  }

  return `Laatste herinnering: ${invoice}${description} staat al 14 dagen open voor ${amount}. Neem contact op met je instructeur als er iets niet klopt.`;
}

export async function processDuePaymentReminders(options?: {
  instructeurId?: string;
}) {
  const supabase = await createAdminClient();
  let query = supabase
    .from("instructeur_inkomsten_transacties" as never)
    .select(
      "id, instructeur_id, leerling_id, bedrag, status, factuurnummer, vervaldatum, omschrijving, created_at, metadata",
    )
    .in("status" as never, ["open", "verstuurd", "te_laat"] as never)
    .order("vervaldatum" as never, { ascending: true } as never);

  if (options?.instructeurId) {
    query = query.eq("instructeur_id" as never, options.instructeurId as never);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Kon betalingsherinneringen niet ophalen: ${error.message}`);
  }

  const rows = (data ?? []) as PaymentReminderRow[];
  const dueRows = rows
    .map((row) => ({
      row,
      stage: getDueStage(row),
    }))
    .filter(
      (item): item is { row: PaymentReminderRow; stage: PaymentReminderStage } =>
        Boolean(item.stage) && Boolean(item.row.leerling_id),
    );

  if (!dueRows.length) {
    return {
      scanned: rows.length,
      sent: 0,
      day3: 0,
      day7: 0,
      day14: 0,
    };
  }

  const learnerIds = Array.from(
    new Set(
      dueRows
        .map((item) => item.row.leerling_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const { data: learnerRows } = await supabase
    .from("leerlingen")
    .select("id, profile_id")
    .in("id", learnerIds);
  const profileByLearnerId = new Map(
    ((learnerRows ?? []) as LearnerProfileRow[]).map((learner) => [
      learner.id,
      learner.profile_id,
    ]),
  );
  const now = new Date().toISOString();
  const counters = {
    day3: 0,
    day7: 0,
    day14: 0,
    scanned: rows.length,
    sent: 0,
  };

  for (const { row, stage } of dueRows) {
    const profileId = row.leerling_id
      ? profileByLearnerId.get(row.leerling_id)
      : null;

    if (!profileId) {
      continue;
    }

    await supabase.from("notificaties").insert({
      profiel_id: profileId,
      titel: stage.title,
      tekst: buildReminderText(row, stage),
      type: stage.type,
      ongelezen: true,
    });

    const metadata = getMetadata(row);
    const reminderMetadata = {
      ...(metadata.auto_payment_reminders ?? {}),
      [stage.key]: now,
    };

    await supabase
      .from("instructeur_inkomsten_transacties" as never)
      .update({
        herinnering_verstuurd_at: now,
        metadata: {
          ...metadata,
          auto_payment_reminder_last_label: stage.title,
          auto_payment_reminder_stage: stage.days,
          auto_payment_reminders: reminderMetadata,
        },
        status: stage.days >= 14 ? "te_laat" : row.status === "open" ? "verstuurd" : row.status,
      } as never)
      .eq("id" as never, row.id as never);

    counters[stage.key] += 1;
    counters.sent += 1;
  }

  return counters;
}
