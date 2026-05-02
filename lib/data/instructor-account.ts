import "server-only";

import type {
  BeschikbaarheidSlot,
  BeschikbaarheidWeekrooster,
  InstructorStudentProgressRow,
  Voertuig,
} from "@/lib/types";
import {
  formatAvailabilityDay,
  formatAvailabilityWindow,
} from "@/lib/availability";
import { buildRecurringAvailabilitySlots } from "@/lib/availability-week-rules";
import { formatCurrency } from "@/lib/format";
import { getInstructorGrowthInsights } from "@/lib/data/instructor-growth-insights";
import {
  getInstructeurLessonRequests,
  getInstructeurLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentInstructorPackages } from "@/lib/data/packages";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";
import { createServerClient } from "@/lib/supabase/server";

type LessonRevenueRow = {
  id: string;
  titel: string;
  start_at: string | null;
  status: string;
  created_at: string;
};

type VehicleRow = {
  id: string;
  model: string;
  kenteken: string;
  transmissie: string;
  status: string;
};

type DocumentRow = {
  id: string;
  naam: string;
  status: string;
  url: string | null;
  created_at: string;
};

type VerificationRow = {
  id: string;
  wrm_pasnummer: string;
  wrm_categorie: string;
  wrm_geldig_tot: string;
  rijschool_organisatie: string | null;
  functie_rol: string | null;
  status: string;
  submitted_at: string;
  updated_at: string;
};

type InstructorSettingsDocument = {
  id: string;
  naam: string;
  status: string;
  datum: string;
  hasUrl: boolean;
  description?: string;
  sourceLabel?: string;
  details?: string[];
};

export type InstructorIncomeCockpitStat = {
  label: string;
  value: string;
  detail: string;
};

export type InstructorIncomeActionItem = {
  id: string;
  title: string;
  detail: string;
  meta?: string;
  badge: "success" | "warning" | "danger" | "info";
  href: string;
  ctaLabel: string;
};

export type InstructorStudentPackageHealth = {
  leerlingId: string;
  naam: string;
  pakketNaam: string;
  packageValueAmount: number;
  packageValueLabel: string;
  lessonsUsedLabel: string;
  remainingLessonsLabel: string;
  usageRatio: number;
  badge: "success" | "warning" | "danger" | "info";
  badgeLabel: string;
  nextStep: string;
};

export type InstructorIncomeCockpit = {
  stats: InstructorIncomeCockpitStat[];
  actions: InstructorIncomeActionItem[];
  packageHealth: InstructorStudentPackageHealth[];
  gapOpportunities: InstructorIncomeActionItem[];
  incomeRows: Awaited<ReturnType<typeof getCurrentInstructorIncomeRows>>;
  growthInsights: Awaited<ReturnType<typeof getInstructorGrowthInsights>>;
};

export type InstructorIncomeOverviewSection = {
  title: string;
  items: string[];
};

export type InstructorIncomeOverview = {
  topStats: InstructorIncomeCockpitStat[];
  secondaryStats: InstructorIncomeCockpitStat[];
  overviewSignals: InstructorIncomeOverviewSection[];
};

export type InstructorIncomeTransactionStatus =
  | "open"
  | "verstuurd"
  | "betaald"
  | "te_laat"
  | "terugbetaald"
  | "geannuleerd";

export type InstructorIncomeTransactionType =
  | "les"
  | "pakket"
  | "losse_betaling"
  | "correctie"
  | "refund";

export type InstructorIncomeLedgerTransaction = {
  id: string;
  instructeur_id: string;
  leerling_id: string | null;
  leerling_naam: string | null;
  les_id: string | null;
  pakket_id: string | null;
  betaling_id: string | null;
  type: InstructorIncomeTransactionType;
  bedrag: number;
  btw_bedrag: number;
  platform_fee: number;
  netto_bedrag: number;
  status: InstructorIncomeTransactionStatus;
  factuurnummer: string | null;
  vervaldatum: string | null;
  betaald_at: string | null;
  herinnering_verstuurd_at: string | null;
  omschrijving: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type InstructorPayoutStatus =
  | "gepland"
  | "in_verwerking"
  | "uitbetaald"
  | "mislukt";

export type InstructorPayout = {
  id: string;
  periode_start: string;
  periode_eind: string;
  bruto_bedrag: number;
  platform_fee: number;
  netto_bedrag: number;
  status: InstructorPayoutStatus;
  uitbetaald_at: string | null;
  referentie: string | null;
};

export type InstructorExpenseReceiptCategory =
  | "brandstof"
  | "onderhoud"
  | "verzekering"
  | "platformkosten"
  | "overig";

export type InstructorExpenseReceipt = {
  id: string;
  instructeur_id: string;
  categorie: InstructorExpenseReceiptCategory;
  omschrijving: string;
  bedrag: number;
  btw_bedrag: number;
  uitgegeven_op: string;
  leverancier: string | null;
  bestand_pad: string | null;
  bestand_naam: string | null;
  bestand_type: string | null;
  bestand_grootte: number | null;
  signed_url: string | null;
  created_at: string;
  updated_at: string;
};

export type InstructorIncomeLedger = {
  transactions: InstructorIncomeLedgerTransaction[];
  payouts: InstructorPayout[];
  expenseReceipts: InstructorExpenseReceipt[];
  expenseSummary: {
    totalAmount: number;
    vatAmount: number;
    count: number;
  };
  summary: {
    openAmount: number;
    overdueAmount: number;
    paidThisMonth: number;
    nextDueDate: string | null;
    payoutNetto: number;
    outstandingCount: number;
    overdueCount: number;
  };
};

type InstructorIncomeLedgerRow = Omit<
  InstructorIncomeLedgerTransaction,
  | "leerling_naam"
  | "bedrag"
  | "btw_bedrag"
  | "platform_fee"
  | "netto_bedrag"
  | "metadata"
> & {
  bedrag: number | string | null;
  btw_bedrag: number | string | null;
  platform_fee: number | string | null;
  netto_bedrag: number | string | null;
  metadata: Record<string, unknown> | null;
};

type InstructorExpenseReceiptRow = Omit<
  InstructorExpenseReceipt,
  "bedrag" | "btw_bedrag" | "bestand_grootte" | "signed_url"
> & {
  bedrag: number | string | null;
  btw_bedrag: number | string | null;
  bestand_grootte: number | string | null;
};

type InstructorPayoutRow = Omit<
  InstructorPayout,
  "bruto_bedrag" | "platform_fee" | "netto_bedrag"
> & {
  bruto_bedrag: number | string | null;
  platform_fee: number | string | null;
  netto_bedrag: number | string | null;
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}

function toVehicleStatus(value: string): Voertuig["status"] {
  return value === "onderhoud" ? "onderhoud" : "actief";
}

function toTransmission(value: string): Voertuig["transmissie"] {
  if (value === "automaat" || value === "handgeschakeld") {
    return value;
  }

  return "beide";
}

function normalizeDocumentName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isVerificationUpload(row: DocumentRow) {
  const name = normalizeDocumentName(row.naam);

  return (
    name.includes("wrm") ||
    name.includes("selfie") ||
    name.includes("profiel")
  );
}

function isRejectedStatus(status: string | null | undefined) {
  return status === "afgewezen" || status === "afgekeurd";
}

function isApprovedStatus(status: string | null | undefined) {
  return status === "goedgekeurd";
}

function getLatestDocuments(rows: DocumentRow[]) {
  const byName = new Map<string, DocumentRow>();

  for (const row of rows) {
    const key = normalizeDocumentName(row.naam);

    if (!byName.has(key)) {
      byName.set(key, row);
    }
  }

  return Array.from(byName.values());
}

function formatDocumentRow(row: DocumentRow): InstructorSettingsDocument {
  return {
    id: row.id,
    naam: row.naam,
    status: row.status,
    datum: formatDate(row.created_at),
    hasUrl: Boolean(row.url),
    sourceLabel: "Documentkluis",
  };
}

function buildVerificationDocument(
  verification: VerificationRow | null,
  verificationUploads: DocumentRow[]
): InstructorSettingsDocument | null {
  if (!verification && !verificationUploads.length) {
    return null;
  }

  const allUploadsApproved =
    verificationUploads.length > 0 &&
    verificationUploads.every((document) => isApprovedStatus(document.status));
  const hasRejectedUpload = verificationUploads.some((document) =>
    isRejectedStatus(document.status)
  );
  const status =
    isApprovedStatus(verification?.status) || allUploadsApproved
      ? "goedgekeurd"
      : isRejectedStatus(verification?.status) || hasRejectedUpload
        ? "afgewezen"
        : verification?.status ?? "ingediend";
  const dates = [
    verification?.updated_at,
    verification?.submitted_at,
    ...verificationUploads.map((document) => document.created_at),
  ].filter((value): value is string => Boolean(value));
  const latestDate = dates.sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )[0];
  const details = [
    verification?.wrm_categorie ? `Categorie ${verification.wrm_categorie}` : null,
    verification?.wrm_geldig_tot
      ? `Geldig tot ${formatDate(verification.wrm_geldig_tot)}`
      : null,
    verification?.rijschool_organisatie ?? null,
    verificationUploads.length
      ? `${verificationUploads.length} bestand(en) gekoppeld`
      : null,
  ].filter((value): value is string => Boolean(value));

  return {
    id: verification?.id ?? "wrm-verificatiepakket",
    naam: "WRM-bevoegdheidspas",
    status,
    datum: latestDate ? formatDate(latestDate) : "Nog niet aangeleverd",
    hasUrl: verificationUploads.some((document) => Boolean(document.url)),
    sourceLabel: "Instructeur-verificatie",
    description:
      "Samengevoegd uit de verificatiepagina: WRM-gegevens, voorkant/achterkant pas en identiteitscontrole.",
    details,
  };
}

function toAmount(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function isCurrentMonth(dateValue: string | null | undefined) {
  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isWithinNextDays(dateValue: string | null | undefined, days: number) {
  if (!dateValue) {
    return false;
  }

  const timestamp = new Date(dateValue).getTime();
  const now = Date.now();

  return timestamp >= now && timestamp <= now + days * 24 * 60 * 60 * 1000;
}

function isOpenIncomeStatus(status: InstructorIncomeTransactionStatus) {
  return status === "open" || status === "verstuurd" || status === "te_laat";
}

function isOverdueIncomeTransaction(
  row: InstructorIncomeLedgerTransaction,
  today: string
) {
  return (
    isOpenIncomeStatus(row.status) &&
    (row.status === "te_laat" ||
      Boolean(row.vervaldatum && row.vervaldatum < today))
  );
}

function isSameMonth(dateValue: string | null | undefined, reference: Date) {
  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);

  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function buildStudentPackageHealth(
  student: InstructorStudentProgressRow,
  packagePrice: number,
  packageLessons: number
): InstructorStudentPackageHealth {
  const lessonsUsed = Math.max(student.gekoppeldeLessen, 0);
  const remainingLessons =
    packageLessons > 0 ? Math.max(packageLessons - lessonsUsed, 0) : 0;
  const usageRatio =
    packageLessons > 0
      ? Math.min(100, Math.round((lessonsUsed / packageLessons) * 100))
      : 0;

  if (packageLessons === 0) {
    return {
      leerlingId: student.id,
      naam: student.naam,
      pakketNaam: student.pakket,
      packageValueAmount: packagePrice,
      packageValueLabel: packagePrice > 0 ? formatCurrency(packagePrice) : "Op aanvraag",
      lessonsUsedLabel: `${lessonsUsed} losse les${lessonsUsed === 1 ? "" : "sen"} gebruikt`,
      remainingLessonsLabel: "Flextraject zonder vaste lesdekking",
      usageRatio,
      badge: "info",
      badgeLabel: "Flex",
      nextStep: "Kijk of een vast pakket nu meer rust en opbrengst geeft.",
    };
  }

  if (remainingLessons <= 1) {
    return {
      leerlingId: student.id,
      naam: student.naam,
      pakketNaam: student.pakket,
      packageValueAmount: packagePrice,
      packageValueLabel: formatCurrency(packagePrice),
      lessonsUsedLabel: `${lessonsUsed} van ${packageLessons} lessen gebruikt`,
      remainingLessonsLabel: `${remainingLessons} les${remainingLessons === 1 ? "" : "sen"} over`,
      usageRatio,
      badge: "danger",
      badgeLabel: "Bijna op",
      nextStep: "Tijd om direct een vervolgvoorstel of upgrade klaar te zetten.",
    };
  }

  if (remainingLessons <= 3) {
    return {
      leerlingId: student.id,
      naam: student.naam,
      pakketNaam: student.pakket,
      packageValueAmount: packagePrice,
      packageValueLabel: formatCurrency(packagePrice),
      lessonsUsedLabel: `${lessonsUsed} van ${packageLessons} lessen gebruikt`,
      remainingLessonsLabel: `${remainingLessons} lessen over`,
      usageRatio,
      badge: "warning",
      badgeLabel: "Bijna leeg",
      nextStep: "Goed moment om vervolglessen of een groter pakket te bespreken.",
    };
  }

  return {
    leerlingId: student.id,
    naam: student.naam,
    pakketNaam: student.pakket,
    packageValueAmount: packagePrice,
    packageValueLabel: formatCurrency(packagePrice),
    lessonsUsedLabel: `${lessonsUsed} van ${packageLessons} lessen gebruikt`,
    remainingLessonsLabel: `${remainingLessons} lessen over`,
    usageRatio,
    badge: "success",
    badgeLabel: "Gezond",
    nextStep: "Dit pakket loopt nog stabiel; focus hier vooral op ritme en voortgang.",
  };
}

export async function getCurrentInstructorAvailability(): Promise<
  BeschikbaarheidSlot[]
> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  const [{ data: rows, error }, { data: ruleRows }] = await Promise.all([
    supabase
      .from("beschikbaarheid")
      .select("id, start_at, eind_at, beschikbaar")
      .eq("instructeur_id", instructeur.id)
      .order("start_at", { ascending: true }),
    supabase
      .from("beschikbaarheid_weekroosters")
      .select(
        "id, instructeur_id, weekdag, start_tijd, eind_tijd, pauze_start_tijd, pauze_eind_tijd, beschikbaar, actief"
      )
      .eq("instructeur_id", instructeur.id)
      .eq("actief", true),
  ]);

  if (error) {
    return [];
  }

  const concreteSlots = (rows ?? []).map((row) => ({
    id: row.id,
    dag: formatAvailabilityDay(row.start_at),
    tijdvak: formatAvailabilityWindow(row.start_at, row.eind_at),
    beschikbaar: row.beschikbaar,
    start_at: row.start_at,
    eind_at: row.eind_at,
    source: "slot" as const,
    weekrooster_id: null,
  }));

  const recurringSlots = buildRecurringAvailabilitySlots({
    rules: (ruleRows ?? []) as BeschikbaarheidWeekrooster[],
    concreteSlots,
  });

  return [...concreteSlots, ...recurringSlots].sort((left, right) =>
    (left.start_at ?? "").localeCompare(right.start_at ?? "")
  );
}

export async function getCurrentInstructorIncomeRows() {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  const { data: rows, error } = await supabase
    .from("lessen")
    .select("id, titel, start_at, status, created_at")
    .eq("instructeur_id", instructeur.id)
    .in("status", ["geaccepteerd", "ingepland", "afgerond"])
    .order("start_at", { ascending: false });

  if (error || !rows?.length) {
    return [];
  }

  const bedragPerLes = formatCurrency(toAmount(instructeur.prijs_per_les));

  return (rows as LessonRevenueRow[]).map((row) => ({
    id: row.id,
    omschrijving: row.titel,
    bedrag: bedragPerLes,
    datum: formatDate(row.start_at ?? row.created_at),
    status: row.status,
  }));
}

export async function getCurrentInstructorIncomeLedger(): Promise<InstructorIncomeLedger> {
  const emptyLedger: InstructorIncomeLedger = {
    transactions: [],
    payouts: [],
    expenseReceipts: [],
    expenseSummary: {
      totalAmount: 0,
      vatAmount: 0,
      count: 0,
    },
    summary: {
      openAmount: 0,
      overdueAmount: 0,
      paidThisMonth: 0,
      nextDueDate: null,
      payoutNetto: 0,
      outstandingCount: 0,
      overdueCount: 0,
    },
  };
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return emptyLedger;
  }

  const supabase = await createServerClient();
  const [
    { data: transactionRows, error: transactionError },
    { data: payoutRows },
    { data: expenseRows },
  ] =
    await Promise.all([
      supabase
        .from("instructeur_inkomsten_transacties" as never)
        .select(
          "id, instructeur_id, leerling_id, les_id, pakket_id, betaling_id, type, bedrag, btw_bedrag, platform_fee, netto_bedrag, status, factuurnummer, vervaldatum, betaald_at, herinnering_verstuurd_at, omschrijving, metadata, created_at, updated_at"
        )
        .eq("instructeur_id" as never, instructeur.id as never)
        .order("created_at" as never, { ascending: false } as never),
      supabase
        .from("instructeur_uitbetalingen" as never)
        .select(
          "id, periode_start, periode_eind, bruto_bedrag, platform_fee, netto_bedrag, status, uitbetaald_at, referentie"
        )
        .eq("instructeur_id" as never, instructeur.id as never)
        .order("periode_start" as never, { ascending: false } as never),
      supabase
        .from("instructeur_kostenbonnen" as never)
        .select(
          "id, instructeur_id, categorie, omschrijving, bedrag, btw_bedrag, uitgegeven_op, leverancier, bestand_pad, bestand_naam, bestand_type, bestand_grootte, created_at, updated_at"
        )
        .eq("instructeur_id" as never, instructeur.id as never)
        .order("uitgegeven_op" as never, { ascending: false } as never)
        .order("created_at" as never, { ascending: false } as never),
    ]);

  if (transactionError) {
    return emptyLedger;
  }

  const rawTransactions = (transactionRows ?? []) as InstructorIncomeLedgerRow[];
  const learnerIds = Array.from(
    new Set(
      rawTransactions
        .map((row) => row.leerling_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const learnerNameById = new Map<string, string>();

  if (learnerIds.length) {
    const { data: learnerRows } = await supabase
      .from("leerlingen")
      .select("id, profile_id")
      .in("id", learnerIds);
    const profileIds = Array.from(
      new Set((learnerRows ?? []).map((row) => row.profile_id))
    );

    if (profileIds.length) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, volledige_naam")
        .in("id", profileIds);
      const profileNameById = new Map(
        (profileRows ?? []).map((row) => [row.id, row.volledige_naam])
      );

      for (const learner of learnerRows ?? []) {
        learnerNameById.set(
          learner.id,
          profileNameById.get(learner.profile_id) ?? "Leerling"
        );
      }
    }
  }

  const transactions: InstructorIncomeLedgerTransaction[] = rawTransactions.map(
    (row) => ({
      ...row,
      leerling_naam: row.leerling_id
        ? learnerNameById.get(row.leerling_id) ?? "Leerling"
        : null,
      bedrag: toAmount(row.bedrag),
      btw_bedrag: toAmount(row.btw_bedrag),
      platform_fee: toAmount(row.platform_fee),
      netto_bedrag: toAmount(row.netto_bedrag),
      metadata:
        row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    })
  );
  const payouts: InstructorPayout[] = ((payoutRows ?? []) as InstructorPayoutRow[]).map(
    (row) => ({
      ...row,
      bruto_bedrag: toAmount(row.bruto_bedrag),
      platform_fee: toAmount(row.platform_fee),
      netto_bedrag: toAmount(row.netto_bedrag),
    })
  );
  const expenseReceipts: InstructorExpenseReceipt[] = await Promise.all(
    ((expenseRows ?? []) as InstructorExpenseReceiptRow[]).map(async (row) => {
      let signedUrl: string | null = null;

      if (row.bestand_pad) {
        const { data: signedData } = await supabase.storage
          .from("instructor-expense-receipts")
          .createSignedUrl(row.bestand_pad, 60 * 30);

        signedUrl = signedData?.signedUrl ?? null;
      }

      return {
        ...row,
        bedrag: toAmount(row.bedrag),
        btw_bedrag: toAmount(row.btw_bedrag),
        bestand_grootte:
          typeof row.bestand_grootte === "number"
            ? row.bestand_grootte
            : row.bestand_grootte
              ? Number(row.bestand_grootte)
              : null,
        signed_url: signedUrl,
      };
    })
  );
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const openTransactions = transactions.filter((row) =>
    isOpenIncomeStatus(row.status)
  );
  const overdueTransactions = transactions.filter((row) =>
    isOverdueIncomeTransaction(row, today)
  );
  const futureDueDates = openTransactions
    .map((row) => row.vervaldatum)
    .filter(
      (dateValue): dateValue is string =>
        typeof dateValue === "string" && dateValue >= today
    )
    .sort((left, right) => left.localeCompare(right));

  return {
    transactions,
    payouts,
    expenseReceipts,
    expenseSummary: {
      totalAmount: expenseReceipts.reduce((sum, row) => sum + row.bedrag, 0),
      vatAmount: expenseReceipts.reduce((sum, row) => sum + row.btw_bedrag, 0),
      count: expenseReceipts.length,
    },
    summary: {
      openAmount: openTransactions.reduce((sum, row) => sum + row.bedrag, 0),
      overdueAmount: overdueTransactions.reduce(
        (sum, row) => sum + row.bedrag,
        0
      ),
      paidThisMonth: transactions
        .filter(
          (row) =>
            row.status === "betaald" && isSameMonth(row.betaald_at, now)
        )
        .reduce((sum, row) => sum + row.bedrag, 0),
      nextDueDate: futureDueDates[0] ?? null,
      payoutNetto: payouts
        .filter((row) => row.status !== "mislukt")
        .reduce((sum, row) => sum + row.netto_bedrag, 0),
      outstandingCount: openTransactions.length,
      overdueCount: overdueTransactions.length,
    },
  };
}

export async function getCurrentInstructorIncomeOverview(): Promise<InstructorIncomeOverview> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      topStats: [],
      secondaryStats: [],
      overviewSignals: [],
    };
  }

  const lessonPrice = toAmount(instructeur.prijs_per_les);
  const supabase = await createServerClient();
  const [{ data: lessonRows }, { data: requestRows }, { data: packageRows }] =
    await Promise.all([
      supabase
        .from("lessen")
        .select("start_at, status")
        .eq("instructeur_id", instructeur.id)
        .in("status", ["geaccepteerd", "ingepland", "afgerond"]),
      supabase
        .from("lesaanvragen")
        .select("id, status")
        .eq("instructeur_id", instructeur.id),
      supabase
        .from("pakketten")
        .select("id, prijs, actief")
        .eq("instructeur_id", instructeur.id)
        .eq("actief", true),
    ]);

  const lessons = (lessonRows ?? []) as Array<{
    start_at: string | null;
    status: string | null;
  }>;
  const openRequests = (requestRows ?? []).filter(
    (row) => row.status === "aangevraagd"
  ).length;
  const activePackages = (packageRows ?? []) as Array<{
    id: string;
    prijs: number;
    actief: boolean;
  }>;

  const plannedLessons = lessons.filter((lesson) =>
    lesson.status === "ingepland" || lesson.status === "geaccepteerd"
  );
  const weekLessons = plannedLessons.filter((lesson) =>
    isWithinNextDays(lesson.start_at, 7)
  );
  const monthCompletedLessons = lessons.filter(
    (lesson) =>
      lesson.status === "afgerond" && isCurrentMonth(lesson.start_at)
  );

  const packageCatalogValue = activePackages.reduce(
    (sum, item) => sum + toAmount(item.prijs),
    0
  );

  const topStats = [
    {
      label: "Verwacht deze week",
      value: formatCurrency(weekLessons.length * lessonPrice),
      detail: `${weekLessons.length} geplande les${weekLessons.length === 1 ? "" : "sen"} in de komende 7 dagen.`,
    },
    {
      label: "Afgerond deze maand",
      value: formatCurrency(monthCompletedLessons.length * lessonPrice),
      detail: `${monthCompletedLessons.length} afgeronde les${monthCompletedLessons.length === 1 ? "" : "sen"} in deze kalendermaand.`,
    },
    {
      label: "Open lesomzet",
      value: formatCurrency(plannedLessons.length * lessonPrice),
      detail: `${plannedLessons.length} ingeplande of geaccepteerde les${plannedLessons.length === 1 ? "" : "sen"} staat of staan al klaar.`,
    },
    {
      label: "Open aanvragen",
      value: `${openRequests}`,
      detail:
        openRequests > 0
          ? "Nieuwe lesaanvragen wachten nog op een beslissing."
          : "Er staan nu geen open aanvragen te wachten.",
    },
  ] satisfies InstructorIncomeCockpitStat[];

  const secondaryStats = [
    {
      label: "Actieve pakketten",
      value: `${activePackages.length}`,
      detail:
        activePackages.length > 0
          ? "Je huidige aanbod staat klaar om te verkopen."
          : "Er staan nog geen actieve pakketten open in je aanbod.",
    },
    {
      label: "Aanbodwaarde",
      value: formatCurrency(packageCatalogValue),
      detail: "Totale waarde van je actieve pakketaanbod.",
    },
    {
      label: "Prijs per les",
      value: lessonPrice > 0 ? formatCurrency(lessonPrice) : "Nog leeg",
      detail:
        lessonPrice > 0
          ? "Deze prijs wordt gebruikt in je omzetindicaties."
          : "Vul een lesprijs in om omzet en kansen goed te zien.",
    },
    {
      label: "Weekritme",
      value: `${weekLessons.length}`,
      detail:
        weekLessons.length >= 5
          ? "Je komende week heeft al een stevig lesritme."
          : "Er ligt nog ruimte om je komende week voller te plannen.",
    },
  ] satisfies InstructorIncomeCockpitStat[];

  const overviewSignals = [
    {
      title: "Wat staat sterk",
      items: [
        weekLessons.length
          ? `${weekLessons.length} lessen staan al klaar voor de komende week.`
          : "De komende week heeft nog geen stevige lesbasis.",
        activePackages.length
          ? `${activePackages.length} actieve pakketten ondersteunen je aanbod.`
          : "Je aanbod kan sterker zodra er actieve pakketten zichtbaar zijn.",
      ],
    },
    {
      title: "Nu slim om te checken",
      items: [
        openRequests
          ? `${openRequests} aanvraag${openRequests === 1 ? "" : "en"} wacht${openRequests === 1 ? "" : "en"} nog op opvolging.`
          : "Er staan geen open aanvragen op je inkomstenlaag te wachten.",
        weekLessons.length < 3
          ? "Je komende week heeft nog ruimte voor extra lesomzet."
          : "Je komende week heeft al een gezond ritme aan geplande lessen.",
      ],
    },
  ] satisfies InstructorIncomeOverviewSection[];

  return {
    topStats,
    secondaryStats,
    overviewSignals,
  };
}

export async function getCurrentInstructorIncomeCockpit(): Promise<InstructorIncomeCockpit> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      stats: [],
      actions: [],
      packageHealth: [],
      gapOpportunities: [],
      incomeRows: [],
      growthInsights: {
        summary: {
          headline: "Nog geen groeidata",
          readyActions: 0,
          estimatedGrowthValueLabel: "Geen directe groeikans",
          nudgeAudienceLabel: "Nog geen nudge-doelgroep",
        },
        packageOpportunities: [],
        fillGaps: [],
        upgradeCandidates: [],
      },
    };
  }

  const [incomeRows, lessons, requests, packages, workspace, growthInsights] =
    await Promise.all([
      getCurrentInstructorIncomeRows(),
      getInstructeurLessons(),
      getInstructeurLessonRequests(),
      getCurrentInstructorPackages(),
      getInstructeurStudentsWorkspace(),
      getInstructorGrowthInsights(),
    ]);

  const lessonPrice = toAmount(instructeur.prijs_per_les);
  const packageMap = new Map(
    packages.map((pkg) => [pkg.id, { price: pkg.prijs, lessons: pkg.lessen }])
  );
  const plannedLessons = lessons.filter((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status)
  );
  const completedLessons = lessons.filter((lesson) => lesson.status === "afgerond");
  const weekLessons = plannedLessons.filter((lesson) =>
    isWithinNextDays(lesson.start_at, 7)
  );
  const monthCompletedLessons = completedLessons.filter((lesson) =>
    isCurrentMonth(lesson.start_at)
  );
  const openRequests = requests.filter((request) => request.status === "aangevraagd");
  const packageHealth = workspace.students
    .filter((student) => student.pakketId && packageMap.has(student.pakketId))
    .map((student) => {
      const packageData = packageMap.get(student.pakketId ?? "");

      return buildStudentPackageHealth(
        student,
        packageData?.price ?? 0,
        packageData?.lessons ?? 0
      );
    })
    .sort((left, right) => {
      const badgePriority = { danger: 3, warning: 2, info: 1, success: 0 };
      const badgeDiff = badgePriority[right.badge] - badgePriority[left.badge];

      if (badgeDiff !== 0) {
        return badgeDiff;
      }

      return right.usageRatio - left.usageRatio;
    })
    .slice(0, 6);

  const packagePortfolioValue = packageHealth.reduce(
    (sum, item) => sum + item.packageValueAmount,
    0
  );
  const gapCount = growthInsights.fillGaps.length;
  const gapRevenuePotential = gapCount * lessonPrice;
  const openRevenue = plannedLessons.length * lessonPrice;
  const completedRevenueThisMonth = monthCompletedLessons.length * lessonPrice;
  const upcomingWeekRevenue = weekLessons.length * lessonPrice;
  const atRiskPackageCount = packageHealth.filter((item) =>
    item.badge === "danger" || item.badge === "warning"
  ).length;
  const packageMissingStudents = workspace.students.filter(
    (student) => !student.pakketId && student.gekoppeldeLessen > 0
  );

  const actions: InstructorIncomeActionItem[] = [
    ...openRequests.slice(0, 2).map((request) => ({
      id: `request-${request.id}`,
      title: request.leerling_naam || "Nieuwe aanvraag",
      detail:
        "Deze aanvraag staat nog open. Een snelle reactie helpt om omzet sneller naar een ingeplande les te trekken.",
      meta: `${request.voorkeursdatum} • ${request.tijdvak}`,
      badge: "warning" as const,
      href: "/instructeur/aanvragen",
      ctaLabel: "Open aanvraag",
    })),
    ...packageHealth
      .filter((item) => item.badge === "danger" || item.badge === "warning")
      .slice(0, 2)
      .map((item) => ({
        id: `package-${item.leerlingId}`,
        title: item.naam,
        detail: item.nextStep,
        meta: `${item.pakketNaam} • ${item.remainingLessonsLabel}`,
        badge: item.badge,
        href: "/instructeur/leerlingen",
        ctaLabel: "Open werkplek",
      })),
    ...growthInsights.fillGaps.slice(0, 2).map((item) => ({
      id: `gap-${item.id}`,
      title: item.title,
      detail:
        "Dit open moment vertegenwoordigt direct leswaarde. Vul het slim zodat je agenda geen stille omzet laat liggen.",
      meta: `${item.meta ?? "Open plek"} • ${formatCurrency(lessonPrice)}`,
      badge: item.badge,
      href: "/instructeur/beschikbaarheid",
      ctaLabel: "Open agenda",
    })),
    ...packageMissingStudents.slice(0, 2).map((student) => ({
      id: `missing-package-${student.id}`,
      title: student.naam,
      detail:
        "Deze leerling rijdt al wel, maar nog zonder logisch gekoppeld pakket. Daar laat je nu structuur en omzet liggen.",
      meta: `${student.gekoppeldeLessen} les${student.gekoppeldeLessen === 1 ? "" : "sen"} gekoppeld`,
      badge: "info" as const,
      href: "/instructeur/leerlingen",
      ctaLabel: "Koppel pakket",
    })),
  ].slice(0, 8);

  const gapOpportunities = growthInsights.fillGaps.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    meta: `${item.meta ?? "Open plek"} • potentieel ${formatCurrency(lessonPrice)}`,
    badge: item.badge,
    href: "/instructeur/beschikbaarheid",
    ctaLabel: item.actionType ? "Stuur nudge" : "Open agenda",
  }));

  return {
    stats: [
      {
        label: "Verwacht deze week",
        value: formatCurrency(upcomingWeekRevenue),
        detail: `${weekLessons.length} geplande les${weekLessons.length === 1 ? "" : "sen"} in de komende 7 dagen.`,
      },
      {
        label: "Afgerond deze maand",
        value: formatCurrency(completedRevenueThisMonth),
        detail: `${monthCompletedLessons.length} afgeronde les${monthCompletedLessons.length === 1 ? "" : "sen"} in deze kalendermaand.`,
      },
      {
        label: "Open lesomzet",
        value: formatCurrency(openRevenue),
        detail: `${plannedLessons.length} ingeplande of geaccepteerde les${plannedLessons.length === 1 ? "" : "sen"} staat of staan al klaar.`,
      },
      {
        label: "Pakketportfolio",
        value: formatCurrency(packagePortfolioValue),
        detail: `${packageHealth.length} actieve leerlingpakketten met directe waarde in je werkplek.`,
      },
      {
        label: "Lege gaten",
        value: formatCurrency(gapRevenuePotential),
        detail: `${gapCount} open boekbare momenten kunnen nog worden omgezet in lesomzet.`,
      },
      {
        label: "Groeikans",
        value: growthInsights.summary.estimatedGrowthValueLabel,
        detail: `${growthInsights.summary.readyActions} opvolgacties staan al klaar voor voorstel, upgrade of nudge.`,
      },
      {
        label: "Bijna door pakket heen",
        value: `${atRiskPackageCount}`,
        detail: "Leerlingen waar een vervolgvoorstel nu omzetverlies en ritmebreuk kan voorkomen.",
      },
      {
        label: "Zonder logisch pakket",
        value: `${packageMissingStudents.length}`,
        detail: "Actieve trajecten die nog wel lessen draaien maar nog geen scherp pakket hebben gekoppeld.",
      },
    ],
    actions,
    packageHealth,
    gapOpportunities,
    incomeRows,
    growthInsights,
  };
}

export async function getCurrentInstructorSettingsOverview() {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      vehicles: [] as Voertuig[],
      documents: [] as InstructorSettingsDocument[],
    };
  }

  const supabase = await createServerClient();
  const [
    { data: vehicleRows },
    { data: documentRows },
    { data: verificationRow },
  ] = await Promise.all([
    supabase
      .from("voertuigen")
      .select("id, model, kenteken, transmissie, status")
      .eq("instructeur_id", instructeur.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("instructeur_documenten")
      .select("id, naam, status, url, created_at")
      .eq("instructeur_id", instructeur.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("instructeur_verificatie_aanvragen" as never)
      .select(
        "id, wrm_pasnummer, wrm_categorie, wrm_geldig_tot, rijschool_organisatie, functie_rol, status, submitted_at, updated_at"
      )
      .eq("instructeur_id" as never, instructeur.id as never)
      .maybeSingle(),
  ]);
  const latestDocuments = getLatestDocuments((documentRows ?? []) as DocumentRow[]);
  const verificationUploads = latestDocuments.filter(isVerificationUpload);
  const verificationDocument = buildVerificationDocument(
    verificationRow as VerificationRow | null,
    verificationUploads
  );
  const extraDocuments = latestDocuments
    .filter((row) => !isVerificationUpload(row))
    .map(formatDocumentRow);
  const documents = verificationDocument
    ? [verificationDocument, ...extraDocuments]
    : extraDocuments;

  return {
    vehicles: ((vehicleRows ?? []) as VehicleRow[]).map((row) => ({
      id: row.id,
      model: row.model,
      kenteken: row.kenteken,
      transmissie: toTransmission(row.transmissie),
      status: toVehicleStatus(row.status),
    })),
    documents,
  };
}
