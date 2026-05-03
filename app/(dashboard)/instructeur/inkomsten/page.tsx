import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeEuro,
  Ban,
  BarChart3,
  BellRing,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Download,
  Euro,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Fuel,
  ExternalLink,
  Landmark,
  Link2,
  Paperclip,
  Plus,
  RefreshCcw,
  Receipt,
  ReceiptText,
  Send,
  SendHorizontal,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { PaymentLinkCopyButton } from "@/components/dashboard/payment-link-copy-button";
import {
  getCurrentInstructorIncomeCockpit,
  getCurrentInstructorIncomeLedger,
  getCurrentInstructorIncomeOverview,
  type InstructorIncomeCockpit,
  type InstructorIncomeCockpitStat,
  type InstructorExpenseReceipt,
  type InstructorExpenseReceiptCategory,
  type InstructorIncomeLedger,
  type InstructorIncomeLedgerTransaction,
  type InstructorIncomeTransactionStatus,
  type InstructorPayout,
} from "@/lib/data/instructor-account";
import {
  cancelIncomeTransactionAction,
  createIncomeCorrectionAction,
  deleteInstructorExpenseReceiptAction,
  markIncomeTransactionPaidAction,
  resendIncomeInvoiceAction,
  runAutomaticPaymentRemindersAction,
  sendIncomePaymentLinkAction,
  sendIncomeReminderAction,
  syncInstructorIncomeLedgerAction,
  uploadInstructorExpenseReceiptAction,
} from "@/lib/actions/instructor-income-ledger";
import { formatCurrency } from "@/lib/format";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";
import { cn } from "@/lib/utils";

const ROUTE = "/instructeur/inkomsten";

type IncomeRow = InstructorIncomeCockpit["incomeRows"][number];

type IncomeCategory = {
  color: string;
  label: string;
  tone: string;
  value: number;
};

type OverviewRow = {
  label: string;
  pending: number;
  received: number;
  refunds: number;
  total: number;
};

type IncomeAction = InstructorIncomeCockpit["actions"][number];
type PeriodKey = "dag" | "week" | "maand" | "kwartaal" | "jaar";
type InvoicePeriodKey = Extract<PeriodKey, "maand" | "kwartaal" | "jaar">;

type PeriodSummary = {
  key: PeriodKey;
  label: string;
  shortLabel: string;
  rangeLabel: string;
  paid: number;
  open: number;
  overdue: number;
  refunds: number;
  netto: number;
  transactionCount: number;
  nextDueDate: string | null;
};

type MoneyLine = {
  detail: string;
  label: string;
  tone: "amber" | "blue" | "emerald" | "red" | "slate" | "violet";
  value: number;
};

const AUTOMATIC_PAYMENT_REMINDER_STAGES = [
  {
    days: 3,
    detail: "Vriendelijke reminder voor net-openstaande posten.",
    key: "day3",
    label: "Dag 3",
    tone: "border-blue-400/24 bg-blue-500/10 text-blue-200",
  },
  {
    days: 7,
    detail: "Tweede reminder wanneer betaling uitblijft.",
    key: "day7",
    label: "Dag 7",
    tone: "border-amber-400/28 bg-amber-400/10 text-amber-200",
  },
  {
    days: 14,
    detail: "Laatste waarschuwing voor hardnekkig open posten.",
    key: "day14",
    label: "Dag 14",
    tone: "border-red-400/28 bg-red-500/10 text-red-200",
  },
] as const;

function parseMoneyLabel(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const normalized = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number) {
  return formatCurrency(Math.round(value));
}

function formatPdfAmount(value: number) {
  return `EUR ${value.toFixed(2).replace(".", ",")}`;
}

function getPaymentBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function buildPaymentLinkHref(transactionId: string) {
  return `${getPaymentBaseUrl()}/leerling/betalingen?factuur=${encodeURIComponent(
    transactionId,
  )}`;
}

function safeCsvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");

  if (/[;"\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function buildCsvHref(rows: Array<Array<string | number | null | undefined>>) {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(
    rows.map((row) => row.map(safeCsvCell).join(";")).join("\n"),
  )}`;
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "");
}

function normalizePeriod(value: string | undefined): PeriodKey {
  if (
    value === "dag" ||
    value === "week" ||
    value === "maand" ||
    value === "kwartaal" ||
    value === "jaar"
  ) {
    return value;
  }

  return "maand";
}

function normalizeInvoicePeriod(
  value: string | undefined,
  fallback: PeriodKey,
): InvoicePeriodKey {
  if (value === "maand" || value === "kwartaal" || value === "jaar") {
    return value;
  }

  if (fallback === "kwartaal" || fallback === "jaar") {
    return fallback;
  }

  return "maand";
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}
function startOfWeek(date: Date) {
  const day = date.getDay() || 7;
  const start = startOfDay(date);

  start.setDate(start.getDate() - day + 1);

  return start;
}

function endOfWeek(date: Date) {
  const end = endOfDay(startOfWeek(date));

  end.setDate(end.getDate() + 6);

  return end;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfQuarter(date: Date) {
  const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;

  return new Date(date.getFullYear(), quarterStartMonth, 1);
}

function getQuarterWindow(reference = new Date()) {
  const start = startOfQuarter(reference);
  const end = endOfDay(new Date(start.getFullYear(), start.getMonth() + 3, 0));
  const dueDate = endOfDay(new Date(start.getFullYear(), start.getMonth() + 4, 0));
  const quarter = Math.floor(start.getMonth() / 3) + 1;
  const daysUntilDue = Math.ceil(
    (startOfDay(dueDate).getTime() - startOfDay(reference).getTime()) /
      86_400_000,
  );

  return {
    daysUntilDue,
    dueDate,
    end,
    label: `Q${quarter} ${start.getFullYear()}`,
    start,
  };
}

function endOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date: Date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}
function isDateInRange(
  value: string | null | undefined,
  start: Date,
  end: Date,
) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  return date >= start && date <= end;
}

function formatPeriodRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
  });

  if (start.toDateString() === end.toDateString()) {
    return formatter.format(start);
  }

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function getPeriodWindow(key: PeriodKey, reference = new Date()) {
  if (key === "dag") {
    return {
      end: endOfDay(reference),
      label: "Vandaag",
      shortLabel: "Dag",
      start: startOfDay(reference),
    };
  }

  if (key === "week") {
    return {
      end: endOfWeek(reference),
      label: "Deze week",
      shortLabel: "Week",
      start: startOfWeek(reference),
    };
  }

  if (key === "kwartaal") {
    const quarter = getQuarterWindow(reference);

    return {
      end: quarter.end,
      label: "Dit kwartaal",
      shortLabel: "Kwartaal",
      start: quarter.start,
    };
  }

  if (key === "jaar") {
    return {
      end: endOfYear(reference),
      label: "Dit jaar",
      shortLabel: "Jaar",
      start: startOfYear(reference),
    };
  }

  return {
    end: endOfMonth(reference),
    label: "Deze maand",
    shortLabel: "Maand",
    start: startOfMonth(reference),
  };
}

function getTransactionActivityDate(
  transaction: InstructorIncomeLedgerTransaction,
) {
  return transaction.status === "betaald"
    ? transaction.betaald_at ?? transaction.created_at
    : transaction.vervaldatum ?? transaction.created_at;
}

function getPeriodTransactions(
  key: PeriodKey,
  transactions: InstructorIncomeLedgerTransaction[],
) {
  const window = getPeriodWindow(key);

  return transactions.filter((transaction) =>
    isDateInRange(
      getTransactionActivityDate(transaction),
      window.start,
      window.end,
    ),
  );
}

function getInvoicePeriodDate(
  transaction: InstructorIncomeLedgerTransaction,
) {
  return transaction.vervaldatum ?? transaction.created_at;
}

function getInvoicePeriodTransactions(
  key: InvoicePeriodKey,
  transactions: InstructorIncomeLedgerTransaction[],
) {
  const window = getPeriodWindow(key);

  return transactions.filter((transaction) =>
    isDateInRange(
      getInvoicePeriodDate(transaction),
      window.start,
      window.end,
    ),
  );
}

function getPeriodExpenseReceipts(
  key: PeriodKey,
  receipts: InstructorExpenseReceipt[],
) {
  const window = getPeriodWindow(key);

  return receipts.filter((receipt) =>
    isDateInRange(receipt.uitgegeven_op, window.start, window.end),
  );
}

function getQuarterTransactions(
  transactions: InstructorIncomeLedgerTransaction[],
) {
  const { end, start } = getQuarterWindow();

  return transactions.filter((transaction) =>
    isDateInRange(
      getTransactionActivityDate(transaction),
      start,
      end,
    ),
  );
}

function getQuarterExpenseReceipts(receipts: InstructorExpenseReceipt[]) {
  const { end, start } = getQuarterWindow();

  return receipts.filter((receipt) =>
    isDateInRange(receipt.uitgegeven_op, start, end),
  );
}

function getStatValue(stats: InstructorIncomeCockpitStat[], label: string) {
  return stats.find((stat) => stat.label === label)?.value ?? "";
}

function getStatDetail(stats: InstructorIncomeCockpitStat[], label: string) {
  return stats.find((stat) => stat.label === label)?.detail ?? "";
}

function getShare(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function buildIncomeSeries(rows: IncomeRow[], fallbackTotal: number) {
  const sourceRows = rows.slice(0, 12).reverse();

  if (!sourceRows.length) {
    const baseline = Math.max(fallbackTotal, 0);
    return [0.1, 0.24, 0.36, 0.48, 0.6, 0.72, 0.64, 0.78, 0.88, 1].map(
      (ratio, index) => ({
        label: index === 0 ? "Start" : `${index + 1}`,
        value: Math.round(baseline * ratio),
      }),
    );
  }

  let runningTotal = 0;

  return sourceRows.map((row) => {
    runningTotal += parseMoneyLabel(row.bedrag);

    return {
      label: row.datum,
      value: runningTotal,
    };
  });
}

function buildCategories(
  rows: IncomeRow[],
  fallback: {
    gapPotential: number;
    monthReceived: number;
    packagePortfolio: number;
  },
) {
  const categories: IncomeCategory[] = [
    {
      color: "#22c55e",
      label: "Lessen",
      tone: "bg-emerald-400",
      value: 0,
    },
    {
      color: "#0d6efd",
      label: "Pakketten",
      tone: "bg-blue-500",
      value: 0,
    },
    {
      color: "#8b5cf6",
      label: "Examengericht",
      tone: "bg-violet-500",
      value: 0,
    },
    {
      color: "#f59e0b",
      label: "Overig",
      tone: "bg-amber-400",
      value: 0,
    },
  ];

  for (const row of rows) {
    const amount = parseMoneyLabel(row.bedrag);
    const description = row.omschrijving.toLowerCase();

    if (description.includes("pakket")) {
      categories[1].value += amount;
    } else if (description.includes("examen")) {
      categories[2].value += amount;
    } else if (description.includes("overig")) {
      categories[3].value += amount;
    } else {
      categories[0].value += amount;
    }
  }

  if (categories.every((category) => category.value === 0)) {
    categories[0].value = fallback.monthReceived;
    categories[1].value = fallback.packagePortfolio;
    categories[3].value = fallback.gapPotential;
  }

  return categories;
}

function buildDonutGradient(categories: IncomeCategory[]) {
  const total = categories.reduce((sum, category) => sum + category.value, 0);

  if (total <= 0) {
    return "conic-gradient(#334155 0 100%)";
  }

  let cursor = 0;
  const segments = categories.map((category) => {
    const start = cursor;
    const end = cursor + (category.value / total) * 100;
    cursor = end;

    return `${category.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

function getTransactionStatusLabel(status: string) {
  if (status === "afgerond") {
    return "Ontvangen";
  }

  if (status === "geannuleerd" || status === "geweigerd") {
    return "Terugbetaald";
  }

  return "In afwachting";
}

function getTransactionStatusClass(status: string) {
  if (status === "afgerond") {
    return "border-emerald-400/25 bg-emerald-500/15 text-emerald-300";
  }

  if (status === "geannuleerd" || status === "geweigerd") {
    return "border-red-400/28 bg-red-500/12 text-red-300";
  }

  return "border-amber-400/35 bg-amber-400/12 text-amber-300";
}

function getBadgeTone(value: "success" | "warning" | "danger" | "info") {
  if (value === "success") {
    return "border-emerald-400/25 bg-emerald-500/15 text-emerald-300";
  }

  if (value === "warning") {
    return "border-amber-400/35 bg-amber-400/12 text-amber-300";
  }

  if (value === "danger") {
    return "border-red-400/28 bg-red-500/12 text-red-300";
  }

  return "border-blue-400/25 bg-blue-500/12 text-blue-300";
}

function getBadgeLabel(value: "success" | "warning" | "danger" | "info") {
  if (value === "success") {
    return "Sterk";
  }

  if (value === "warning") {
    return "Let op";
  }

  if (value === "danger") {
    return "Urgent";
  }

  return "Kans";
}

function getLedgerStatusLabel(status: InstructorIncomeTransactionStatus) {
  const labels: Record<InstructorIncomeTransactionStatus, string> = {
    open: "Open",
    verstuurd: "Verstuurd",
    betaald: "Betaald",
    te_laat: "Te laat",
    terugbetaald: "Terugbetaald",
    geannuleerd: "Geannuleerd",
  };

  return labels[status];
}

function getLedgerStatusClass(status: InstructorIncomeTransactionStatus) {
  if (status === "betaald") {
    return "border-emerald-400/25 bg-emerald-500/15 text-emerald-300";
  }

  if (status === "te_laat") {
    return "border-red-400/28 bg-red-500/12 text-red-300";
  }

  if (status === "terugbetaald" || status === "geannuleerd") {
    return "border-slate-500/30 bg-slate-500/12 text-slate-300";
  }

  if (status === "verstuurd") {
    return "border-blue-400/25 bg-blue-500/12 text-blue-300";
  }

  return "border-amber-400/35 bg-amber-400/12 text-amber-300";
}

function getLedgerTypeLabel(type: InstructorIncomeLedgerTransaction["type"]) {
  const labels: Record<InstructorIncomeLedgerTransaction["type"], string> = {
    les: "Les",
    pakket: "Pakket",
    losse_betaling: "Losse betaling",
    correctie: "Correctie",
    refund: "Refund",
  };

  return labels[type];
}

function getExpenseCategoryLabel(category: InstructorExpenseReceiptCategory) {
  const labels: Record<InstructorExpenseReceiptCategory, string> = {
    brandstof: "Brandstof",
    onderhoud: "Onderhoud",
    verzekering: "Verzekering",
    platformkosten: "Platformkosten",
    overig: "Overige kosten",
  };

  return labels[category];
}

function isLedgerTransactionActionable(
  status: InstructorIncomeTransactionStatus
) {
  return !["betaald", "terugbetaald", "geannuleerd"].includes(status);
}

function formatLedgerDate(value: string | null | undefined) {
  if (!value) {
    return "Nog niet gezet";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function buildInvoiceText(transaction: InstructorIncomeLedgerTransaction) {
  return [
    "RijBasis factuur",
    `Factuurnummer: ${transaction.factuurnummer ?? transaction.id}`,
    `Omschrijving: ${transaction.omschrijving}`,
    `Leerling: ${transaction.leerling_naam ?? "Niet gekoppeld"}`,
    `Type: ${getLedgerTypeLabel(transaction.type)}`,
    `Status: ${getLedgerStatusLabel(transaction.status)}`,
    `Bedrag: ${formatPdfAmount(transaction.bedrag)}`,
    `Btw: ${formatPdfAmount(transaction.btw_bedrag)}`,
    `Platformkosten: ${formatPdfAmount(transaction.platform_fee)}`,
    `Netto: ${formatPdfAmount(transaction.netto_bedrag)}`,
    `Vervaldatum: ${formatLedgerDate(transaction.vervaldatum)}`,
  ].join("\n");
}

function escapePdfText(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildPdfDataHref(lines: string[]) {
  const stream = [
    "BT",
    "/F1 20 Tf",
    "72 770 Td",
    `(${escapePdfText(lines[0] ?? "RijBasis factuur")}) Tj`,
    "/F1 11 Tf",
    ...lines
      .slice(1, 25)
      .map((line) => `0 -22 Td (${escapePdfText(line)}) Tj`),
    "ET",
  ].join("\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj",
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream\nendobj`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((object) => {
    const offset = Buffer.byteLength(pdf, "utf8");
    pdf += `${object}\n`;

    return offset;
  });
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${
    objects.length + 1
  } /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return `data:application/pdf;base64,${Buffer.from(pdf, "utf8").toString(
    "base64",
  )}`;
}

function buildInvoiceHref(transaction: InstructorIncomeLedgerTransaction) {
  return buildPdfDataHref(buildInvoiceText(transaction).split("\n"));
}

const crc32Table = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function getZipDosDateTime(date = new Date()) {
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();

  return { dosDate, dosTime };
}

function buildZipHref(files: Array<{ content: string; name: string }>) {
  const { dosDate, dosTime } = getZipDosDateTime();
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, "utf8");
    const dataBuffer = Buffer.from(file.content, "utf8");
    const checksum = crc32(dataBuffer);
    const localHeader = Buffer.alloc(30);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(dataBuffer.length, 18);
    localHeader.writeUInt32LE(dataBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuffer, dataBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(dataBuffer.length, 20);
    centralHeader.writeUInt32LE(dataBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuffer);

    offset += localHeader.length + nameBuffer.length + dataBuffer.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endHeader = Buffer.alloc(22);
  endHeader.writeUInt32LE(0x06054b50, 0);
  endHeader.writeUInt16LE(0, 4);
  endHeader.writeUInt16LE(0, 6);
  endHeader.writeUInt16LE(files.length, 8);
  endHeader.writeUInt16LE(files.length, 10);
  endHeader.writeUInt32LE(centralDirectory.length, 12);
  endHeader.writeUInt32LE(offset, 16);
  endHeader.writeUInt16LE(0, 20);

  return `data:application/zip;base64,${Buffer.concat([
    ...localParts,
    centralDirectory,
    endHeader,
  ]).toString("base64")}`;
}

function buildLedgerCsvHref(transactions: InstructorIncomeLedgerTransaction[]) {
  const rows = [
    [
      "Factuurnummer",
      "Omschrijving",
      "Leerling",
      "Type",
      "Status",
      "Bedrag",
      "Btw",
      "Platformkosten",
      "Netto",
      "Vervaldatum",
      "Betaald op",
    ],
    ...transactions.map((transaction) => [
      transaction.factuurnummer ?? transaction.id,
      transaction.omschrijving,
      transaction.leerling_naam ?? "",
      getLedgerTypeLabel(transaction.type),
      getLedgerStatusLabel(transaction.status),
      formatAmount(transaction.bedrag),
      formatAmount(transaction.btw_bedrag),
      formatAmount(transaction.platform_fee),
      formatAmount(transaction.netto_bedrag),
      formatLedgerDate(transaction.vervaldatum),
      formatLedgerDate(transaction.betaald_at),
    ]),
  ];

  return buildCsvHref(rows);
}

function buildInvoicesZipHref(
  transactions: InstructorIncomeLedgerTransaction[],
) {
  const files = transactions.length
    ? transactions.map((transaction) => ({
        content: buildInvoiceText(transaction),
        name: `${sanitizeFileName(transaction.factuurnummer ?? transaction.id)}.txt`,
      }))
    : [
        {
          content: "Er zijn nog geen facturen in het omzetboek.",
          name: "geen-facturen.txt",
        },
      ];

  return buildZipHref(files);
}

function buildQuarterExportHref(
  transactions: InstructorIncomeLedgerTransaction[],
) {
  const rows = getQuarterTransactions(transactions);
  const quarterWindow = getQuarterWindow();
  const quarterLabel = formatPeriodRange(
    quarterWindow.start,
    quarterWindow.end,
  );

  return buildCsvHref([
    [
      "Kwartaal",
      "Factuurnummer",
      "Omschrijving",
      "Leerling",
      "Status",
      "Omzet",
      "Btw",
      "Netto",
      "Vervaldatum",
    ],
    ...rows.map((transaction) => [
      quarterLabel,
      transaction.factuurnummer ?? transaction.id,
      transaction.omschrijving,
      transaction.leerling_naam ?? "",
      getLedgerStatusLabel(transaction.status),
      formatAmount(transaction.bedrag),
      formatAmount(transaction.btw_bedrag),
      formatAmount(transaction.netto_bedrag),
      formatLedgerDate(transaction.vervaldatum),
    ]),
  ]);
}

function buildVatExportHref(
  transactions: InstructorIncomeLedgerTransaction[],
  receipts: InstructorExpenseReceipt[],
) {
  const rows = getQuarterTransactions(transactions);
  const quarterReceipts = getQuarterExpenseReceipts(receipts);
  const totalRevenue = rows.reduce((sum, row) => sum + row.bedrag, 0);
  const totalVat = rows.reduce((sum, row) => sum + row.btw_bedrag, 0);
  const deductibleVat = quarterReceipts.reduce(
    (sum, receipt) => sum + receipt.btw_bedrag,
    0,
  );

  return buildCsvHref([
    ["Onderdeel", "Bedrag"],
    ["Omzet incl. btw", formatAmount(totalRevenue)],
    ["Omzet excl. btw", formatAmount(Math.max(totalRevenue - totalVat, 0))],
    ["Btw ontvangen", formatAmount(totalVat)],
    ["Voorbelasting uit kostenbonnen", formatAmount(deductibleVat)],
    ["Btw te reserveren", formatAmount(Math.max(totalVat - deductibleVat, 0))],
    ...rows.map((transaction) => [
      transaction.factuurnummer ?? transaction.id,
      formatAmount(transaction.btw_bedrag),
    ]),
  ]);
}

function buildBookkeeperExportHref(
  transactions: InstructorIncomeLedgerTransaction[],
  payouts: InstructorPayout[],
  receipts: InstructorExpenseReceipt[],
) {
  return buildCsvHref([
    [
      "Type",
      "Referentie",
      "Omschrijving",
      "Status",
      "Bruto",
      "Btw",
      "Kosten",
      "Netto",
    ],
    ...transactions.map((transaction) => [
      "Inkomstenregel",
      transaction.factuurnummer ?? transaction.id,
      transaction.omschrijving,
      getLedgerStatusLabel(transaction.status),
      formatAmount(transaction.bedrag),
      formatAmount(transaction.btw_bedrag),
      formatAmount(transaction.platform_fee),
      formatAmount(transaction.netto_bedrag),
    ]),
    ...payouts.map((payout) => [
      "Uitbetaling",
      payout.referentie ?? payout.id,
      `${formatLedgerDate(payout.periode_start)} - ${formatLedgerDate(
        payout.periode_eind,
      )}`,
      payout.status,
      formatAmount(payout.bruto_bedrag),
      "",
      formatAmount(payout.platform_fee),
      formatAmount(payout.netto_bedrag),
    ]),
    ...receipts.map((receipt) => [
      "Kostenbon",
      receipt.id,
      `${getExpenseCategoryLabel(receipt.categorie)} - ${receipt.omschrijving}`,
      receipt.uitgegeven_op,
      formatAmount(receipt.bedrag),
      formatAmount(receipt.btw_bedrag),
      formatAmount(receipt.bedrag),
      formatAmount(Math.max(receipt.bedrag - receipt.btw_bedrag, 0)),
    ]),
  ]);
}

function buildLedgerSeries(
  transactions: InstructorIncomeLedgerTransaction[],
  fallbackTotal: number,
) {
  const paidTransactions = transactions
    .filter((transaction) => transaction.status === "betaald")
    .sort((left, right) =>
      (left.betaald_at ?? left.created_at).localeCompare(
        right.betaald_at ?? right.created_at,
      ),
    )
    .slice(-12);

  if (!paidTransactions.length) {
    return buildIncomeSeries([], fallbackTotal);
  }

  let runningTotal = 0;

  return paidTransactions.map((transaction) => {
    runningTotal += transaction.bedrag;

    return {
      label: formatLedgerDate(transaction.betaald_at ?? transaction.created_at),
      value: runningTotal,
    };
  });
}

function buildPeriodSummary(
  key: PeriodKey,
  transactions: InstructorIncomeLedgerTransaction[],
) {
  const window = getPeriodWindow(key);
  const rows = transactions.filter((transaction) => {
    const activityDate =
      transaction.status === "betaald"
        ? transaction.betaald_at ?? transaction.created_at
        : transaction.vervaldatum ?? transaction.created_at;

    return isDateInRange(activityDate, window.start, window.end);
  });
  const openRows = rows.filter((transaction) =>
    isLedgerTransactionActionable(transaction.status),
  );
  const dueRows = rows.filter((transaction) =>
    isLedgerTransactionActionable(transaction.status) &&
    isDateInRange(transaction.vervaldatum, window.start, window.end),
  );
  const futureDueDates = dueRows
    .map((transaction) => transaction.vervaldatum)
    .filter((dateValue): dateValue is string => Boolean(dateValue))
    .sort((left, right) => left.localeCompare(right));

  return {
    key,
    label: window.label,
    shortLabel: window.shortLabel,
    rangeLabel: formatPeriodRange(window.start, window.end),
    paid: rows
      .filter((transaction) => transaction.status === "betaald")
      .reduce((sum, transaction) => sum + transaction.bedrag, 0),
    open: openRows.reduce((sum, transaction) => sum + transaction.bedrag, 0),
    overdue: rows
      .filter((transaction) => transaction.status === "te_laat")
      .reduce((sum, transaction) => sum + transaction.bedrag, 0),
    refunds: rows
      .filter((transaction) => transaction.type === "refund")
      .reduce((sum, transaction) => sum + transaction.bedrag, 0),
    netto: rows.reduce((sum, transaction) => sum + transaction.netto_bedrag, 0),
    transactionCount: rows.length,
    nextDueDate: futureDueDates[0] ?? null,
  } satisfies PeriodSummary;
}

function getMonthlyGoal(totalIncome: number, weekExpected: number) {
  return Math.max(2500, totalIncome, weekExpected * 4);
}

function getBillableTransactions(
  transactions: InstructorIncomeLedgerTransaction[],
) {
  return transactions.filter(
    (transaction) =>
      transaction.status !== "geannuleerd" && transaction.type !== "refund",
  );
}

function buildTaxLines(
  transactions: InstructorIncomeLedgerTransaction[],
  receipts: InstructorExpenseReceipt[] = [],
): MoneyLine[] {
  const billable = getBillableTransactions(transactions);
  const revenueInclVat = billable.reduce(
    (sum, transaction) => sum + transaction.bedrag,
    0,
  );
  const vat = billable.reduce(
    (sum, transaction) => sum + transaction.btw_bedrag,
    0,
  );
  const deductibleVat = receipts.reduce(
    (sum, receipt) => sum + receipt.btw_bedrag,
    0,
  );

  return [
    {
      detail: "Alle regels binnen de gekozen periode.",
      label: "Omzet incl. btw",
      tone: "blue",
      value: revenueInclVat,
    },
    {
      detail: "Handig voor je boekhouder en kwartaaloverzicht.",
      label: "Omzet excl. btw",
      tone: "emerald",
      value: Math.max(revenueInclVat - vat, 0),
    },
    {
      detail: "Btw uit omzet voor aftrek van kostenbonnen.",
      label: "Te reserveren btw",
      tone: "amber",
      value: vat,
    },
    {
      detail: "Ontvangen btw min btw uit geuploade bonnen.",
      label: "Btw na kosten",
      tone: "violet",
      value: Math.max(vat - deductibleVat, 0),
    },
  ];
}

function buildVatFilingSummary({
  receipts,
  transactions,
}: {
  receipts: InstructorExpenseReceipt[];
  transactions: InstructorIncomeLedgerTransaction[];
}) {
  const quarter = getQuarterWindow();
  const quarterTransactions = getQuarterTransactions(transactions);
  const quarterReceipts = getQuarterExpenseReceipts(receipts);
  const billableTransactions = getBillableTransactions(quarterTransactions);
  const revenueInclVat = billableTransactions.reduce(
    (sum, transaction) => sum + transaction.bedrag,
    0,
  );
  const revenueVat = billableTransactions.reduce(
    (sum, transaction) => sum + transaction.btw_bedrag,
    0,
  );
  const deductibleVat = quarterReceipts.reduce(
    (sum, receipt) => sum + receipt.btw_bedrag,
    0,
  );
  const daysLabel =
    quarter.daysUntilDue < 0
      ? `${Math.abs(quarter.daysUntilDue)} dagen te laat`
      : quarter.daysUntilDue === 0
        ? "Vandaag indienen"
        : `Nog ${quarter.daysUntilDue} dagen tot aangifte`;

  return {
    deductibleVat,
    daysLabel,
    dueDate: quarter.dueDate,
    label: quarter.label,
    payableVat: Math.max(revenueVat - deductibleVat, 0),
    receiptCount: quarterReceipts.length,
    revenueInclVat,
    transactionCount: quarterTransactions.length,
  };
}

function getDaysOpen(transaction: InstructorIncomeLedgerTransaction) {
  const dueDate = transaction.vervaldatum
    ? startOfDay(new Date(transaction.vervaldatum))
    : startOfDay(new Date(transaction.created_at));
  const diff = startOfDay(new Date()).getTime() - dueDate.getTime();

  return Math.max(0, Math.floor(diff / 86_400_000));
}

function buildAgingBuckets(
  transactions: InstructorIncomeLedgerTransaction[],
) {
  const buckets = [
    {
      detail: "Nieuw open of nog net binnen termijn.",
      label: "0-7 dagen open",
      max: 7,
      min: 0,
      tone: "bg-emerald-400",
    },
    {
      detail: "Goed moment voor een vriendelijke opvolging.",
      label: "8-14 dagen open",
      max: 14,
      min: 8,
      tone: "bg-amber-400",
    },
    {
      detail: "Deze posten verdienen directe aandacht.",
      label: "15+ dagen te laat",
      max: Number.POSITIVE_INFINITY,
      min: 15,
      tone: "bg-red-400",
    },
  ].map((bucket) => {
    const rows = transactions.filter((transaction) => {
      if (!isLedgerTransactionActionable(transaction.status)) {
        return false;
      }

      const daysOpen = getDaysOpen(transaction);

      return daysOpen >= bucket.min && daysOpen <= bucket.max;
    });

    return {
      ...bucket,
      amount: rows.reduce((sum, transaction) => sum + transaction.bedrag, 0),
      count: rows.length,
    };
  });
  const maxAmount = Math.max(...buckets.map((bucket) => bucket.amount), 1);

  return buckets.map((bucket) => ({
    ...bucket,
    width: Math.max((bucket.amount / maxAmount) * 100, bucket.amount ? 8 : 0),
  }));
}

function buildCostLines(
  transactions: InstructorIncomeLedgerTransaction[],
  activePeriod: PeriodKey,
  receipts: InstructorExpenseReceipt[] = [],
): MoneyLine[] {
  const platformCosts = getBillableTransactions(transactions).reduce(
    (sum, transaction) => sum + transaction.platform_fee,
    0,
  );

  if (receipts.length) {
    const amountByCategory = new Map<InstructorExpenseReceiptCategory, number>();

    for (const receipt of receipts) {
      amountByCategory.set(
        receipt.categorie,
        (amountByCategory.get(receipt.categorie) ?? 0) + receipt.bedrag,
      );
    }

    return [
      {
        detail: "Werkelijk bedrag uit geuploade brandstofbonnen.",
        label: "Brandstof",
        tone: "amber",
        value: amountByCategory.get("brandstof") ?? 0,
      },
      {
        detail: "Onderhoudsbonnen en reparaties die je hebt toegevoegd.",
        label: "Autokosten",
        tone: "blue",
        value: amountByCategory.get("onderhoud") ?? 0,
      },
      {
        detail: "Werkelijke verzekeringsbonnen in deze periode.",
        label: "Verzekering",
        tone: "violet",
        value: amountByCategory.get("verzekering") ?? 0,
      },
      {
        detail: "Platformkosten uit omzetboek plus eventuele bonnen.",
        label: "Platformkosten",
        tone: "slate",
        value: platformCosts + (amountByCategory.get("platformkosten") ?? 0),
      },
      {
        detail: "Alle overige bonnen die je hebt toegevoegd.",
        label: "Overige kosten",
        tone: "red",
        value: amountByCategory.get("overig") ?? 0,
      },
    ];
  }

  const billable = getBillableTransactions(transactions);
  const lessonCount = Math.max(
    billable.filter((transaction) => transaction.type === "les").length,
    Math.round(billable.length * 0.7),
  );
  const fixedInsurance = {
    dag: 4,
    maand: 120,
    kwartaal: 360,
    week: 30,
    jaar: 1440,
  }[activePeriod];
  const fuel = lessonCount * 11;
  const vehicle = lessonCount * 8;
  const other = billable.reduce(
    (sum, transaction) => sum + transaction.bedrag,
    0,
  ) * 0.03;

  return [
    {
      detail: `${lessonCount} lesmoment${lessonCount === 1 ? "" : "en"} x brandstofinschatting.`,
      label: "Brandstof",
      tone: "amber",
      value: fuel,
    },
    {
      detail: "Onderhoud, afschrijving en gebruikskosten.",
      label: "Autokosten",
      tone: "blue",
      value: vehicle,
    },
    {
      detail: "Periodegebonden verzekeringsreserve.",
      label: "Verzekering",
      tone: "violet",
      value: fixedInsurance,
    },
    {
      detail: "Kosten uit het omzetboek.",
      label: "Platformkosten",
      tone: "slate",
      value: platformCosts,
    },
    {
      detail: "Administratie en kleine correcties.",
      label: "Overige kosten",
      tone: "red",
      value: other,
    },
  ];
}

function getCostProfitSummary(
  transactions: InstructorIncomeLedgerTransaction[],
  activePeriod: PeriodKey,
  receipts: InstructorExpenseReceipt[] = [],
) {
  const billable = getBillableTransactions(transactions);
  const revenue = billable.reduce(
    (sum, transaction) => sum + transaction.bedrag,
    0,
  );
  const vat = billable.reduce(
    (sum, transaction) => sum + transaction.btw_bedrag,
    0,
  );
  const costs = buildCostLines(transactions, activePeriod, receipts);
  const totalCosts = costs.reduce((sum, item) => sum + item.value, 0);

  return {
    costs,
    profit: Math.max(revenue - vat - totalCosts, 0),
    totalCosts,
  };
}

function getPaymentLinkStatus(transaction: InstructorIncomeLedgerTransaction) {
  if (transaction.status === "betaald") {
    return {
      label: "Betaald",
      tone: "border-emerald-400/25 bg-emerald-500/15 text-emerald-300",
    };
  }

  if (
    transaction.status === "te_laat" ||
    (transaction.vervaldatum &&
      startOfDay(new Date(transaction.vervaldatum)) < startOfDay(new Date()))
  ) {
    return {
      label: "Verlopen",
      tone: "border-red-400/28 bg-red-500/12 text-red-300",
    };
  }

  return {
    label: "Open",
    tone: "border-blue-400/25 bg-blue-500/12 text-blue-300",
  };
}

function getAutomaticReminderMap(
  transaction: InstructorIncomeLedgerTransaction,
) {
  const raw = transaction.metadata.auto_payment_reminders;

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  return raw as Record<string, string>;
}

function getNextAutomaticReminderStage(
  transaction: InstructorIncomeLedgerTransaction,
) {
  if (!isLedgerTransactionActionable(transaction.status)) {
    return null;
  }

  const daysOpen = getDaysOpen(transaction);
  const sent = getAutomaticReminderMap(transaction);
  const dueStages = AUTOMATIC_PAYMENT_REMINDER_STAGES.filter(
    (stage) => daysOpen >= stage.days && !sent[stage.key],
  );

  return dueStages.at(-1) ?? null;
}

function Panel({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(15,23,42,0.34))] p-4 shadow-[0_22px_70px_-50px_rgba(0,0,0,0.95)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  action,
  title,
}: {
  action?: ReactNode;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[11px] font-semibold tracking-[0.14em] text-slate-300 uppercase">
        {title}
      </h2>
      {action}
    </div>
  );
}

function IncomeStatCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: "amber" | "blue" | "emerald" | "purple" | "teal";
  value: string;
}) {
  const toneClass = {
    amber: "border-amber-400/26 bg-amber-400/12 text-amber-300",
    blue: "border-blue-400/26 bg-blue-500/12 text-blue-300",
    emerald: "border-emerald-400/26 bg-emerald-500/12 text-emerald-300",
    purple: "border-violet-400/26 bg-violet-500/12 text-violet-300",
    teal: "border-cyan-400/26 bg-cyan-500/12 text-cyan-300",
  }[tone];

  return (
    <div className="rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(15,23,42,0.34))] p-5 text-white shadow-[0_24px_70px_-52px_rgba(0,0,0,0.95)]">
      <div className="flex items-center gap-5">
        <span
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-xl border",
            toneClass,
          )}
        >
          <Icon className="size-8" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-3 text-sm text-slate-400">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function IncomeLineChart({
  points,
}: {
  points: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...points.map((point) => point.value), 1);
  const polyline = points
    .map((point, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
      const y = 88 - (point.value / max) * 68;

      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,100 ${polyline} 100,100`;
  const labels = points.length
    ? [
        points[0].label,
        points[Math.floor(points.length / 2)]?.label,
        points.at(-1)?.label,
      ]
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return (
    <div>
      <div className="h-72">
        <svg viewBox="0 0 100 100" className="h-full w-full" role="img">
          <defs>
            <linearGradient id="income-page-area" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor="rgb(13 110 253)"
                stopOpacity="0.36"
              />
              <stop
                offset="100%"
                stopColor="rgb(13 110 253)"
                stopOpacity="0.02"
              />
            </linearGradient>
          </defs>
          {[20, 38, 56, 74, 92].map((y) => (
            <line
              key={y}
              x1="0"
              x2="100"
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.45"
            />
          ))}
          <polygon points={area} fill="url(#income-page-area)" />
          <polyline
            points={polyline}
            fill="none"
            stroke="rgb(13 110 253)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
          />
          {points.map((point, index) => {
            const x =
              points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
            const y = 88 - (point.value / max) * 68;

            return (
              <circle
                key={`${point.label}-${index}`}
                cx={x}
                cy={y}
                fill="rgb(13 110 253)"
                r="1.5"
              />
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-slate-400">
        {labels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function DownloadReportButton({
  children,
  className,
  csvHref,
}: {
  children: ReactNode;
  className?: string;
  csvHref: string;
}) {
  return (
    <Button asChild variant="outline" className={className}>
      <a download="inkomsten-rapport.csv" href={csvHref}>
        {children}
      </a>
    </Button>
  );
}

function BadgePill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "success" | "warning" | "danger" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase",
        getBadgeTone(tone),
      )}
    >
      {children}
    </span>
  );
}

function ActionCenter({
  actions,
}: {
  actions: IncomeAction[];
}) {
  return (
    <Panel id="inkomsten-acties" className="min-h-full">
      <SectionHeader
        title="Actiecentrum"
        action={
          <Link
            href="/instructeur/dashboard"
            className="text-[11px] font-medium text-slate-400 transition hover:text-white"
          >
            Dashboard
          </Link>
        }
      />
      <div className="space-y-3">
        {actions.length ? (
          actions.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-white/[0.045] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{item.title}</p>
                    <BadgePill tone={item.badge}>
                      {getBadgeLabel(item.badge)}
                    </BadgePill>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {item.detail}
                  </p>
                  {item.meta ? (
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {item.meta}
                    </p>
                  ) : null}
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="h-9 rounded-lg border-white/10 bg-white/7 text-xs text-white hover:bg-white/12"
                >
                  <Link href={item.href}>
                    {item.ctaLabel}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.035] p-5 text-sm leading-7 text-slate-400">
            Geen directe inkomstenacties. Je omzetlaag is rustig; blijf vooral
            je planning en pakketten actueel houden.
          </div>
        )}
      </div>
    </Panel>
  );
}

function CashflowPanel({
  goalProgress,
  monthlyGoal,
  pendingIncome,
  totalIncome,
  weekExpected,
}: {
  goalProgress: number;
  monthlyGoal: number;
  pendingIncome: number;
  totalIncome: number;
  weekExpected: number;
}) {
  const status =
    goalProgress >= 80
      ? "Op koers"
      : goalProgress >= 45
        ? "Bijsturen"
        : "Ruimte vullen";

  return (
    <Panel className="min-h-full">
      <SectionHeader title="Cashflow regie" />
      <div className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/12 text-emerald-300">
          <ShieldCheck className="size-7" />
        </span>
        <div>
          <p className="text-2xl font-semibold text-white">{status}</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            Je maanddoel staat op {formatAmount(monthlyGoal)}. Er is nu{" "}
            {formatAmount(totalIncome)} zichtbaar, met{" "}
            {formatAmount(pendingIncome)} nog in afwachting.
          </p>
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">Maanddoel</span>
          <span className="font-semibold text-white">{goalProgress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#0d6efd,#22c55e,#facc15)]"
            style={{ width: `${Math.max(goalProgress, 4)}%` }}
          />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            Verwacht week
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            {formatAmount(weekExpected)}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            Nog te innen
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            {formatAmount(pendingIncome)}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function LedgerSummaryTile({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: "amber" | "blue" | "emerald" | "red";
  value: string;
}) {
  const toneClass = {
    amber: "border-amber-400/28 bg-amber-400/12 text-amber-300",
    blue: "border-blue-400/28 bg-blue-500/12 text-blue-300",
    emerald: "border-emerald-400/28 bg-emerald-500/12 text-emerald-300",
    red: "border-red-400/28 bg-red-500/12 text-red-300",
  }[tone];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl border",
            toneClass,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            {label}
          </p>
          <p className="mt-1 text-xl font-semibold text-white">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

function FinanceLineCard({
  detail,
  label,
  tone,
  value,
}: MoneyLine) {
  const toneClass = {
    amber: "border-amber-400/24 bg-amber-400/10 text-amber-300",
    blue: "border-blue-400/24 bg-blue-500/10 text-blue-300",
    emerald: "border-emerald-400/24 bg-emerald-500/10 text-emerald-300",
    red: "border-red-400/24 bg-red-500/10 text-red-300",
    slate: "border-slate-400/18 bg-slate-500/10 text-slate-300",
    violet: "border-violet-400/24 bg-violet-500/10 text-violet-300",
  }[tone];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {formatAmount(value)}
          </p>
        </div>
        <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase", toneClass)}>
          Live
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

function TaxOverviewPanel({ lines }: { lines: MoneyLine[] }) {
  return (
    <Panel className="min-h-full">
      <SectionHeader
        title="BTW en belasting"
        action={<Calculator className="size-4 text-blue-300" />}
      />
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {lines.map((line) => (
          <FinanceLineCard key={line.label} {...line} />
        ))}
      </div>
    </Panel>
  );
}

function VatFilingReminderPanel({
  receipts,
  transactions,
}: {
  receipts: InstructorExpenseReceipt[];
  transactions: InstructorIncomeLedgerTransaction[];
}) {
  const summary = buildVatFilingSummary({ receipts, transactions });

  return (
    <Panel className="min-h-full border-amber-400/18 bg-[linear-gradient(145deg,rgba(245,158,11,0.12),rgba(15,23,42,0.34))]">
      <SectionHeader
        title="BTW-aangifte reminder"
        action={<Receipt className="size-4 text-amber-300" />}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-400/25 bg-amber-400/12 px-3 py-1 text-xs font-semibold text-amber-200">
              BTW {summary.label} klaarzetten
            </span>
            <span className="rounded-full border border-white/10 bg-white/7 px-3 py-1 text-xs text-slate-300">
              Deadline {formatLedgerDate(summary.dueDate.toISOString())}
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">
            {summary.daysLabel}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
            Controleer omzet, kostenbonnen en btw-export voordat je de aangifte
            indient.
          </p>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:min-w-[34rem]">
          <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
              Omzet kwartaal
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {formatAmount(summary.revenueInclVat)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
              Btw na kosten
            </p>
            <p className="mt-2 text-xl font-semibold text-amber-200">
              {formatAmount(summary.payableVat)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
              Controle
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {summary.transactionCount} / {summary.receiptCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">regels / bonnen</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function AgingOpenPaymentsPanel({
  transactions,
}: {
  transactions: InstructorIncomeLedgerTransaction[];
}) {
  const buckets = buildAgingBuckets(transactions);

  return (
    <Panel className="min-h-full">
      <SectionHeader
        title="Openstaande betalingen"
        action={<AlertTriangle className="size-4 text-amber-300" />}
      />
      <div className="space-y-3">
        {buckets.map((bucket) => (
          <div
            key={bucket.label}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{bucket.label}</p>
                <p className="mt-1 text-sm text-slate-400">{bucket.detail}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-white">
                  {formatAmount(bucket.amount)}
                </p>
                <p className="text-xs text-slate-500">
                  {bucket.count} post{bucket.count === 1 ? "" : "en"}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className={cn("h-full rounded-full", bucket.tone)}
                style={{ width: `${bucket.width}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CostProfitPanel({
  activePeriod,
  receipts,
  transactions,
}: {
  activePeriod: PeriodKey;
  receipts: InstructorExpenseReceipt[];
  transactions: InstructorIncomeLedgerTransaction[];
}) {
  const summary = getCostProfitSummary(transactions, activePeriod, receipts);
  const usesReceipts = receipts.length > 0;

  return (
    <Panel className="min-h-full">
      <SectionHeader
        title="Kosten en winst"
        action={<Fuel className="size-4 text-emerald-300" />}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-emerald-200 uppercase">
            {usesReceipts ? "Werkelijke nettowinst" : "Geschatte nettowinst"}
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {formatAmount(summary.profit)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Kostenreserve
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {formatAmount(summary.totalCosts)}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {usesReceipts
              ? `${receipts.length} bon${receipts.length === 1 ? "" : "nen"} gebruikt`
              : "Nog gebaseerd op inschattingen"}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {summary.costs.map((line) => (
          <FinanceLineCard key={line.label} {...line} />
        ))}
      </div>
    </Panel>
  );
}

function ExpenseReceiptsPanel({
  receipts,
}: {
  receipts: InstructorExpenseReceipt[];
}) {
  const total = receipts.reduce((sum, receipt) => sum + receipt.bedrag, 0);
  const vat = receipts.reduce((sum, receipt) => sum + receipt.btw_bedrag, 0);

  return (
    <Panel id="kostenbonnen" className="min-h-full">
      <SectionHeader
        title="Kostenbonnen"
        action={<Paperclip className="size-4 text-blue-300" />}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <form
          action={uploadInstructorExpenseReceiptAction}
          className="rounded-xl border border-white/10 bg-slate-950/28 p-4"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/12 text-blue-300">
              <Upload className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-white">Bon uploaden</p>
              <p className="text-sm text-slate-400">
                PDF of afbeelding tot 10 MB.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-slate-300">
              Categorie
              <select
                name="categorie"
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-white outline-none transition focus:border-blue-400/50"
                defaultValue="brandstof"
              >
                <option value="brandstof">Brandstof</option>
                <option value="onderhoud">Onderhoud / auto</option>
                <option value="verzekering">Verzekering</option>
                <option value="platformkosten">Platformkosten</option>
                <option value="overig">Overig</option>
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Datum
              <input
                name="uitgegeven_op"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-white outline-none transition focus:border-blue-400/50"
              />
            </label>
          </div>
          <label className="mt-3 block text-sm text-slate-300">
            Omschrijving
            <input
              name="omschrijving"
              required
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/50"
              placeholder="Bijv. tankbon Shell"
            />
          </label>
          <label className="mt-3 block text-sm text-slate-300">
            Leverancier
            <input
              name="leverancier"
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/50"
              placeholder="Bijv. Shell, garage, verzekeraar"
            />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-slate-300">
              Bedrag incl. btw
              <input
                name="bedrag"
                required
                min="0"
                step="0.01"
                type="number"
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/50"
                placeholder="0,00"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Btw bedrag
              <input
                name="btw_bedrag"
                min="0"
                step="0.01"
                type="number"
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/50"
                placeholder="0,00"
              />
            </label>
          </div>
          <label className="mt-3 block text-sm text-slate-300">
            Bestand
            <input
              name="bestand"
              required
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="mt-2 block w-full rounded-lg border border-dashed border-white/12 bg-slate-950/70 px-3 py-3 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-500"
            />
          </label>
          <Button
            type="submit"
            className="mt-4 h-11 w-full rounded-lg bg-blue-600 text-white hover:bg-blue-500"
          >
            <Upload className="size-4" />
            Kostenbon opslaan
          </Button>
        </form>

        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                Bonnen
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {receipts.length}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                Kosten
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {formatAmount(total)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                Btw terug
              </p>
              <p className="mt-2 text-xl font-semibold text-emerald-300">
                {formatAmount(vat)}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {receipts.length ? (
              receipts.slice(0, 6).map((receipt) => (
                <div
                  key={receipt.id}
                  className="rounded-xl border border-white/10 bg-slate-950/26 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">
                          {receipt.omschrijving}
                        </p>
                        <span className="rounded-full border border-white/10 bg-white/7 px-2.5 py-1 text-[10px] font-semibold text-slate-300 uppercase">
                          {getExpenseCategoryLabel(receipt.categorie)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatLedgerDate(receipt.uitgegeven_op)}
                        {receipt.leverancier ? ` - ${receipt.leverancier}` : ""}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        {formatAmount(receipt.bedrag)} incl. btw,{" "}
                        {formatAmount(receipt.btw_bedrag)} btw
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {receipt.signed_url ? (
                        <Button
                          asChild
                          variant="outline"
                          className="h-9 rounded-lg border-white/10 bg-white/7 px-3 text-xs text-white hover:bg-white/12"
                        >
                          <a
                            href={receipt.signed_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="size-3.5" />
                            Open bon
                          </a>
                        </Button>
                      ) : null}
                      <form action={deleteInstructorExpenseReceiptAction}>
                        <input
                          name="receiptId"
                          type="hidden"
                          value={receipt.id}
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          className="h-9 rounded-lg border-red-400/20 bg-red-500/10 px-3 text-xs text-red-200 hover:bg-red-500/18"
                        >
                          <Trash2 className="size-3.5" />
                          Verwijder
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.035] p-5 text-sm leading-7 text-slate-400">
                Nog geen kostenbonnen. Upload je eerste bon, dan schakelt de
                winstkaart over van schatting naar werkelijke kosten.
              </div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function CashflowForecastPanel({
  activeSummary,
  gapPotential,
  pendingIncome,
  periodSummaries,
  weekExpected,
}: {
  activeSummary: PeriodSummary;
  gapPotential: number;
  pendingIncome: number;
  periodSummaries: PeriodSummary[];
  weekExpected: number;
}) {
  const weekSummary = periodSummaries.find((summary) => summary.key === "week");
  const monthSummary = periodSummaries.find((summary) => summary.key === "maand");
  const weekVisible = (weekSummary?.paid ?? 0) + (weekSummary?.open ?? 0);
  const monthVisible = (monthSummary?.paid ?? 0) + (monthSummary?.open ?? 0);
  const unbilled = Math.max(weekExpected - weekVisible, 0);
  const missedRisk = activeSummary.overdue + Math.max(gapPotential, 0);
  const lines: MoneyLine[] = [
    {
      detail: "Op basis van geplande lessen en open regels.",
      label: "Verwacht deze week",
      tone: "blue",
      value: Math.max(weekExpected, weekVisible),
    },
    {
      detail: "Betaald plus open omzet in de maand.",
      label: "Verwacht deze maand",
      tone: "emerald",
      value: monthVisible,
    },
    {
      detail: "Geplande omzet die nog niet in het omzetboek staat.",
      label: "Nog niet gefactureerd",
      tone: "amber",
      value: unbilled,
    },
    {
      detail: "Te late posten plus open groeikansen.",
      label: "Risico gemiste omzet",
      tone: "red",
      value: missedRisk || pendingIncome,
    },
  ];

  return (
    <Panel className="min-h-full">
      <SectionHeader
        title="Cashflow voorspelling"
        action={<WalletCards className="size-4 text-cyan-300" />}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {lines.map((line) => (
          <FinanceLineCard key={line.label} {...line} />
        ))}
      </div>
    </Panel>
  );
}

function PaymentLinksPanel({
  transactions,
}: {
  transactions: InstructorIncomeLedgerTransaction[];
}) {
  const rows = transactions
    .filter((transaction) => isLedgerTransactionActionable(transaction.status))
    .slice(0, 4);

  return (
    <Panel id="betaallinks" className="min-h-full">
      <SectionHeader
        title="Betaallinks"
        action={<Link2 className="size-4 text-blue-300" />}
      />
      <div className="space-y-3">
        {rows.length ? (
          rows.map((transaction) => {
            const paymentLink = buildPaymentLinkHref(transaction.id);
            const status = getPaymentLinkStatus(transaction);

            return (
              <div
                key={transaction.id}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">
                        {transaction.factuurnummer ?? transaction.omschrijving}
                      </p>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase",
                          status.tone,
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {transaction.leerling_naam ?? "Niet gekoppeld"} -{" "}
                      {formatAmount(transaction.bedrag)}
                    </p>
                    <input
                      readOnly
                      className="mt-3 h-10 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-xs text-slate-300 outline-none"
                      value={paymentLink}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <PaymentLinkCopyButton value={paymentLink} />
                    <form action={sendIncomePaymentLinkAction}>
                      <input
                        name="transactionId"
                        type="hidden"
                        value={transaction.id}
                      />
                      <Button
                        type="submit"
                        className="h-9 rounded-lg bg-blue-600 px-3 text-xs text-white hover:bg-blue-500"
                      >
                        <SendHorizontal className="size-3.5" />
                        Stuur betaallink
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.035] p-5 text-sm leading-7 text-slate-400">
            Geen open betaallinks. Nieuwe open facturen verschijnen hier
            automatisch.
          </div>
        )}
      </div>
    </Panel>
  );
}

function AutomaticPaymentRemindersPanel({
  transactions,
}: {
  transactions: InstructorIncomeLedgerTransaction[];
}) {
  const openRows = transactions.filter((transaction) =>
    isLedgerTransactionActionable(transaction.status),
  );
  const dueRows = openRows
    .map((transaction) => ({
      stage: getNextAutomaticReminderStage(transaction),
      transaction,
    }))
    .filter(
      (item): item is {
        stage: (typeof AUTOMATIC_PAYMENT_REMINDER_STAGES)[number];
        transaction: InstructorIncomeLedgerTransaction;
      } => Boolean(item.stage),
    );
  const lastReminderAt = openRows
    .map((transaction) => transaction.herinnering_verstuurd_at)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0];

  return (
    <Panel id="automatische-herinneringen" className="min-h-full">
      <SectionHeader
        title="Automatische herinneringen"
        action={<BellRing className="size-4 text-amber-300" />}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-4">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-blue-200 uppercase">
            Klaar nu
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {dueRows.length}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Open posten
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {openRows.length}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Laatste run
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {lastReminderAt ? formatLedgerDate(lastReminderAt) : "Nog niet"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {AUTOMATIC_PAYMENT_REMINDER_STAGES.map((stage) => {
          const dueCount = dueRows.filter(
            (item) => item.stage.key === stage.key,
          ).length;
          const sentCount = openRows.filter((transaction) =>
            Boolean(getAutomaticReminderMap(transaction)[stage.key]),
          ).length;

          return (
            <div
              key={stage.key}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase",
                    stage.tone,
                  )}
                >
                  {stage.label}
                </span>
                <span className="text-xs text-slate-400">
                  {sentCount} verzonden
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-white">
                {dueCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {stage.detail}
              </p>
            </div>
          );
        })}
      </div>

      <form action={runAutomaticPaymentRemindersAction} className="mt-4">
        <Button
          type="submit"
          className="h-11 w-full rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400"
        >
          <BellRing className="size-4" />
          Herinneringen nu uitvoeren
        </Button>
      </form>
    </Panel>
  );
}

function BookkeeperExportPanel({ ledger }: { ledger: InstructorIncomeLedger }) {
  const exportItems = [
    {
      download: "kwartaalexport.csv",
      href: buildQuarterExportHref(ledger.transactions),
      icon: FileSpreadsheet,
      label: "Kwartaalexport",
    },
    {
      download: "btw-export.csv",
      href: buildVatExportHref(ledger.transactions, ledger.expenseReceipts),
      icon: Receipt,
      label: "BTW-export",
    },
    {
      download: "facturen.zip",
      href: buildInvoicesZipHref(ledger.transactions),
      icon: FileArchive,
      label: "Facturen ZIP",
    },
    {
      download: "boekhouderoverzicht.csv",
      href: buildBookkeeperExportHref(
        ledger.transactions,
        ledger.payouts,
        ledger.expenseReceipts,
      ),
      icon: Landmark,
      label: "Boekhouderoverzicht",
    },
  ];

  return (
    <Panel className="min-h-full">
      <SectionHeader
        title="Boekhouder-export"
        action={<Download className="size-4 text-slate-300" />}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {exportItems.map((item) => {
          const Icon = item.icon;

          return (
            <Button
              key={item.label}
              asChild
              variant="outline"
              className="h-14 justify-start rounded-xl border-white/10 bg-white/[0.045] px-4 text-white hover:bg-white/10"
            >
              <a download={item.download} href={item.href}>
                <Icon className="size-4" />
                {item.label}
              </a>
            </Button>
          );
        })}
      </div>
    </Panel>
  );
}

function CompactMetricCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: "amber" | "blue" | "emerald" | "purple" | "sky";
  value: string;
}) {
  const toneClass = {
    amber: "border-amber-400/25 bg-amber-400/12 text-amber-300",
    blue: "border-blue-400/25 bg-blue-500/12 text-blue-300",
    emerald: "border-emerald-400/25 bg-emerald-500/12 text-emerald-300",
    purple: "border-violet-400/25 bg-violet-500/12 text-violet-300",
    sky: "border-cyan-400/25 bg-cyan-500/12 text-cyan-300",
  }[tone];

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl border",
            toneClass,
          )}
        >
          <Icon className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function CompactQuickActions({ ledger }: { ledger: InstructorIncomeLedger }) {
  const actions = [
    {
      download: "omzetboek.csv",
      href: buildLedgerCsvHref(ledger.transactions),
      icon: Download,
      label: "Omzetboek CSV",
    },
    {
      download: "facturen.zip",
      href: buildInvoicesZipHref(ledger.transactions),
      icon: FileArchive,
      label: "Facturen ZIP export",
    },
    {
      download: "kwartaalexport.csv",
      href: buildQuarterExportHref(ledger.transactions),
      icon: FileSpreadsheet,
      label: "Kwartaalexport",
    },
    {
      download: "btw-export.csv",
      href: buildVatExportHref(ledger.transactions, ledger.expenseReceipts),
      icon: Receipt,
      label: "BTW-export",
    },
    {
      download: "boekhouderoverzicht.csv",
      href: buildBookkeeperExportHref(
        ledger.transactions,
        ledger.payouts,
        ledger.expenseReceipts,
      ),
      icon: Landmark,
      label: "Boekhouderoverzicht",
    },
  ];

  return (
    <Panel id="boekhouder-export">
      <SectionHeader title="Snelle acties" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {actions.map((item) => {
          const Icon = item.icon;

          return (
            <Button
              key={item.label}
              asChild
              variant="outline"
              className="h-12 justify-start rounded-lg border-white/10 bg-slate-950/45 px-4 text-white hover:bg-white/10"
            >
              <a download={item.download} href={item.href}>
                <Icon className="size-4" />
                {item.label}
              </a>
            </Button>
          );
        })}
        <form action={syncInstructorIncomeLedgerAction}>
          <Button
            type="submit"
            variant="outline"
            className="h-12 w-full justify-start rounded-lg border-white/10 bg-slate-950/45 px-4 text-white hover:bg-white/10"
          >
            <RefreshCcw className="size-4" />
            Omzetboek synchroniseren
          </Button>
        </form>
      </div>
    </Panel>
  );
}

function CompactLedgerSummary({ ledger }: { ledger: InstructorIncomeLedger }) {
  const rows = [
    {
      label: "Openstaand",
      value: ledger.summary.openAmount,
      tone: "bg-amber-400",
    },
    {
      label: "Te laat",
      value: ledger.summary.overdueAmount,
      tone: "bg-red-400",
    },
    {
      label: "Betaald deze maand",
      value: ledger.summary.paidThisMonth,
      tone: "bg-emerald-400",
    },
    {
      label: "Netto uitbetaling",
      value: ledger.summary.payoutNetto,
      tone: "bg-blue-400",
    },
  ];

  return (
    <Panel className="min-h-full">
      <SectionHeader title="Omzetboek samenvatting" />
      <div className="space-y-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="flex items-center gap-2 text-slate-300">
              <span className={cn("size-2 rounded-sm", row.tone)} />
              {row.label}
            </span>
            <span className="font-semibold text-white">
              {formatAmount(row.value)}
            </span>
          </div>
        ))}
      </div>
      <Button
        asChild
        variant="outline"
        className="mt-5 h-10 w-full rounded-lg border-white/10 bg-slate-950/45 text-blue-200 hover:bg-white/10"
      >
        <Link href="#facturen">
          Bekijk omzetboek
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </Panel>
  );
}

function CompactPipelinePanel({
  transactions,
}: {
  transactions: InstructorIncomeLedgerTransaction[];
}) {
  const pipeline = [
    {
      icon: ReceiptText,
      label: "Open",
      status: "open" as const,
      tone: "border-amber-400/24 bg-amber-400/10 text-amber-300",
    },
    {
      icon: FileText,
      label: "Verstuurd",
      status: "verstuurd" as const,
      tone: "border-blue-400/24 bg-blue-500/10 text-blue-300",
    },
    {
      icon: AlertTriangle,
      label: "Te laat",
      status: "te_laat" as const,
      tone: "border-red-400/24 bg-red-500/10 text-red-300",
    },
    {
      icon: CheckCircle2,
      label: "Betaald",
      status: "betaald" as const,
      tone: "border-emerald-400/24 bg-emerald-500/10 text-emerald-300",
    },
  ].map((item) => {
    const rows = transactions.filter(
      (transaction) => transaction.status === item.status,
    );

    return {
      ...item,
      amount: rows.reduce((sum, row) => sum + row.bedrag, 0),
      count: rows.length,
    };
  });

  return (
    <Panel className="min-h-full">
      <SectionHeader title="Factuurpipeline" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {pipeline.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.status}
              className={cn("rounded-xl border p-4", item.tone)}
            >
              <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] uppercase">
                <Icon className="size-4" />
                {item.label}
              </div>
              <p className="mt-4 text-2xl font-semibold text-white">
                {formatAmount(item.amount)}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {item.count} factuur{item.count === 1 ? "" : "en"}
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function InvoicePeriodSwitcher({
  activePeriod,
  invoicePeriod,
  showAllInvoices,
}: {
  activePeriod: PeriodKey;
  invoicePeriod: InvoicePeriodKey;
  showAllInvoices: boolean;
}) {
  const items: Array<{ key: InvoicePeriodKey; label: string }> = [
    { key: "maand", label: "Maand" },
    { key: "kwartaal", label: "Kwartaal" },
    { key: "jaar", label: "Jaar" },
  ];

  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-white/10 bg-slate-950/45 p-1">
      {items.map((item) => {
        const active = item.key === invoicePeriod;
        const href = `/instructeur/inkomsten?periode=${activePeriod}&factuurPeriode=${item.key}${
          showAllInvoices ? "&facturen=alle" : ""
        }#facturen`;

        return (
          <Link
            key={item.key}
            href={href}
            className={cn(
              "inline-flex h-8 items-center rounded-md px-2.5 text-xs font-semibold transition",
              active
                ? "bg-blue-500 text-white"
                : "text-slate-300 hover:bg-white/10 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function CompactInvoiceTable({
  activePeriod,
  invoicePeriod,
  showAllInvoices,
  transactions,
}: {
  activePeriod: PeriodKey;
  invoicePeriod: InvoicePeriodKey;
  showAllInvoices: boolean;
  transactions: InstructorIncomeLedgerTransaction[];
}) {
  const visibleTransactions = showAllInvoices ? transactions : transactions.slice(0, 6);
  const hasMoreInvoices = transactions.length > 6;
  const toggleHref = showAllInvoices
    ? `/instructeur/inkomsten?periode=${activePeriod}&factuurPeriode=${invoicePeriod}#facturen`
    : `/instructeur/inkomsten?periode=${activePeriod}&factuurPeriode=${invoicePeriod}&facturen=alle#facturen`;
  const invoicePeriodWindow = getPeriodWindow(invoicePeriod);

  return (
    <Panel id="facturen" className="min-h-full">
      <span id="inkomsten-overzicht" className="sr-only" />
      <SectionHeader
        title="Facturen"
        action={
          <InvoicePeriodSwitcher
            activePeriod={activePeriod}
            invoicePeriod={invoicePeriod}
            showAllInvoices={showAllInvoices}
          />
        }
      />
      <p className="mb-4 text-sm text-slate-400">
        Facturen van {formatPeriodRange(invoicePeriodWindow.start, invoicePeriodWindow.end)}
      </p>
      {visibleTransactions.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                <th className="py-3 pr-3">Factuur</th>
                <th className="px-3 py-3">Leerling</th>
                <th className="px-3 py-3">Omschrijving</th>
                <th className="px-3 py-3">Bedrag</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Vervaldatum</th>
                <th className="py-3 pl-3 text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {visibleTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-white/8">
                  <td className="py-3 pr-3 font-medium text-white">
                    {transaction.factuurnummer ?? "Concept"}
                  </td>
                  <td className="px-3 py-3 text-slate-300">
                    {transaction.leerling_naam ?? "Niet gekoppeld"}
                  </td>
                  <td className="px-3 py-3 text-slate-300">
                    {transaction.omschrijving}
                  </td>
                  <td className="px-3 py-3 font-semibold text-white">
                    {formatAmount(transaction.bedrag)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold uppercase",
                        getLedgerStatusClass(transaction.status),
                      )}
                    >
                      {getLedgerStatusLabel(transaction.status)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-300">
                    {formatLedgerDate(transaction.vervaldatum)}
                  </td>
                  <td className="py-3 pl-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Button
                        asChild
                        variant="outline"
                        className="size-8 rounded-md border-white/10 bg-white/7 p-0 text-white hover:bg-white/12"
                        title="Factuur PDF downloaden"
                      >
                        <a
                          download={`${transaction.factuurnummer ?? transaction.id}.pdf`}
                          href={buildInvoiceHref(transaction)}
                        >
                          <Download className="size-3.5" />
                        </a>
                      </Button>
                      {transaction.type !== "refund" &&
                      transaction.status !== "geannuleerd" ? (
                        <form action={resendIncomeInvoiceAction}>
                          <input
                            name="transactionId"
                            type="hidden"
                            value={transaction.id}
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            className="size-8 rounded-md border-white/10 bg-white/7 p-0 text-white hover:bg-white/12"
                            title="Factuur opnieuw versturen"
                          >
                            <Send className="size-3.5" />
                          </Button>
                        </form>
                      ) : null}
                      {isLedgerTransactionActionable(transaction.status) ? (
                        <form action={sendIncomeReminderAction}>
                          <input
                            name="transactionId"
                            type="hidden"
                            value={transaction.id}
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            className="size-8 rounded-md border-white/10 bg-white/7 p-0 text-white hover:bg-white/12"
                            title="Herinnering handmatig sturen"
                          >
                            <BellRing className="size-3.5" />
                          </Button>
                        </form>
                      ) : null}
                      {isLedgerTransactionActionable(transaction.status) ? (
                        <form action={markIncomeTransactionPaidAction}>
                          <input
                            name="transactionId"
                            type="hidden"
                            value={transaction.id}
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            className="size-8 rounded-md border-white/10 bg-white/7 p-0 text-white hover:bg-white/12"
                            title="Markeer als betaald"
                          >
                            <CheckCircle2 className="size-3.5" />
                          </Button>
                        </form>
                      ) : null}
                      {transaction.type !== "refund" &&
                      transaction.status !== "geannuleerd" ? (
                        <form action={cancelIncomeTransactionAction}>
                          <input
                            name="transactionId"
                            type="hidden"
                            value={transaction.id}
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            className="size-8 rounded-md border-white/10 bg-white/7 p-0 text-white hover:bg-white/12"
                            title="Annuleren / creditnota maken"
                          >
                            <Ban className="size-3.5" />
                          </Button>
                        </form>
                      ) : null}
                      {isLedgerTransactionActionable(transaction.status) ? (
                        <>
                          <PaymentLinkCopyButton
                            iconOnly
                            label="Betaallink kopieren"
                            value={buildPaymentLinkHref(transaction.id)}
                            className="size-8 rounded-md border-white/10 bg-white/7 p-0 text-white hover:bg-white/12"
                          />
                          <form action={sendIncomePaymentLinkAction}>
                            <input
                              name="transactionId"
                              type="hidden"
                              value={transaction.id}
                            />
                            <Button
                              type="submit"
                              variant="outline"
                              className="size-8 rounded-md border-white/10 bg-white/7 p-0 text-white hover:bg-white/12"
                              title="Betaallink versturen"
                            >
                              <SendHorizontal className="size-3.5" />
                            </Button>
                          </form>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.035] p-6 text-sm text-slate-400">
          Nog geen facturen in deze periode. Kies maand, kwartaal of jaar om
          andere facturen te bekijken.
        </div>
      )}
      {transactions.length ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            {showAllInvoices
              ? `Alle ${transactions.length} facturen worden getoond.`
              : `${visibleTransactions.length} van ${transactions.length} facturen zichtbaar.`}
          </p>
          {hasMoreInvoices ? (
            <Link
              href={toggleHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"
            >
              {showAllInvoices ? "Toon compacte lijst" : "Bekijk alle facturen"}
              <ArrowRight className="size-4" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}

function CompactInvoiceActions({
  transactions,
}: {
  transactions: InstructorIncomeLedgerTransaction[];
}) {
  const selectedTransaction = transactions[0] ?? null;
  const firstActionable = transactions.find((transaction) =>
    isLedgerTransactionActionable(transaction.status),
  );
  const actionTarget = firstActionable ?? selectedTransaction;
  const paymentLink = actionTarget ? buildPaymentLinkHref(actionTarget.id) : "";
  const hasActionTarget = Boolean(actionTarget);
  const hasOpenTarget = Boolean(
    actionTarget && isLedgerTransactionActionable(actionTarget.status),
  );
  const canSendInvoice = Boolean(
    actionTarget &&
      actionTarget.type !== "refund" &&
      actionTarget.status !== "geannuleerd",
  );

  return (
    <Panel className="min-h-full">
      <SectionHeader title="Factuuracties" />
      {actionTarget ? (
        <p className="mb-3 text-xs leading-5 text-slate-400">
          Acties worden uitgevoerd op{" "}
          <span className="font-semibold text-slate-200">
            {actionTarget.factuurnummer ?? actionTarget.omschrijving}
          </span>
          .
        </p>
      ) : null}
      <div className="divide-y divide-white/8 overflow-hidden rounded-xl border border-white/10">
        {actionTarget ? (
          <Button
            asChild
            variant="ghost"
            className="h-auto min-h-11 w-full justify-between rounded-none px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/[0.06] hover:text-white"
          >
            <a
              download={`${actionTarget.factuurnummer ?? actionTarget.id}.pdf`}
              href={buildInvoiceHref(actionTarget)}
            >
              <span className="flex items-center gap-3">
                <FileText className="size-4 text-slate-400" />
                Factuur PDF downloaden
              </span>
              <ArrowRight className="size-3.5 text-slate-500" />
            </a>
          </Button>
        ) : (
          <div className="px-4 py-3 text-sm text-slate-400">
            Nog geen factuuracties beschikbaar.
          </div>
        )}
        {actionTarget ? (
          <form action={resendIncomeInvoiceAction}>
            <input name="transactionId" type="hidden" value={actionTarget.id} />
            <Button
              type="submit"
              variant="ghost"
              disabled={!canSendInvoice}
              className="h-auto min-h-11 w-full justify-between rounded-none px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-45"
            >
              <span className="flex items-center gap-3">
                <Send className="size-4 text-slate-400" />
                Factuur opnieuw versturen
              </span>
              <ArrowRight className="size-3.5 text-slate-500" />
            </Button>
          </form>
        ) : null}
        {actionTarget ? (
          <form action={sendIncomeReminderAction}>
            <input name="transactionId" type="hidden" value={actionTarget.id} />
            <Button
              type="submit"
              variant="ghost"
              disabled={!hasOpenTarget}
              className="h-auto min-h-11 w-full justify-between rounded-none px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-45"
            >
              <span className="flex items-center gap-3">
                <BellRing className="size-4 text-slate-400" />
                Herinnering handmatig sturen
              </span>
              <ArrowRight className="size-3.5 text-slate-500" />
            </Button>
          </form>
        ) : null}
        {actionTarget ? (
          <form action={markIncomeTransactionPaidAction}>
            <input name="transactionId" type="hidden" value={actionTarget.id} />
            <Button
              type="submit"
              variant="ghost"
              disabled={!hasOpenTarget}
              className="h-auto min-h-11 w-full justify-between rounded-none px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-45"
            >
              <span className="flex items-center gap-3">
                <CheckCircle2 className="size-4 text-slate-400" />
                Markeer als betaald
              </span>
              <ArrowRight className="size-3.5 text-slate-500" />
            </Button>
          </form>
        ) : null}
        {actionTarget ? (
          <form action={cancelIncomeTransactionAction}>
            <input name="transactionId" type="hidden" value={actionTarget.id} />
            <Button
              type="submit"
              variant="ghost"
              disabled={!canSendInvoice}
              className="h-auto min-h-11 w-full justify-between rounded-none px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-45"
            >
              <span className="flex items-center gap-3">
                <Ban className="size-4 text-slate-400" />
                Annuleren / creditnota maken
              </span>
              <ArrowRight className="size-3.5 text-slate-500" />
            </Button>
          </form>
        ) : null}
        {actionTarget && hasOpenTarget ? (
          <PaymentLinkCopyButton
            value={paymentLink}
            label="Betaallink kopieren"
            className="h-auto min-h-11 w-full justify-between rounded-none border-0 bg-transparent px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/[0.06] hover:text-white"
          />
        ) : actionTarget ? (
          <Button
            type="button"
            variant="ghost"
            disabled
            className="h-auto min-h-11 w-full justify-between rounded-none px-4 py-3 text-left text-sm text-slate-200 disabled:pointer-events-none disabled:opacity-45"
          >
            <span className="flex items-center gap-3">
              <Link2 className="size-4 text-slate-400" />
              Betaallink kopieren
            </span>
            <ArrowRight className="size-3.5 text-slate-500" />
          </Button>
        ) : null}
        {actionTarget ? (
          <form action={sendIncomePaymentLinkAction}>
            <input name="transactionId" type="hidden" value={actionTarget.id} />
            <Button
              type="submit"
              variant="ghost"
              disabled={!hasOpenTarget}
              className="h-auto min-h-11 w-full justify-between rounded-none px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-45"
            >
              <span className="flex items-center gap-3">
                <SendHorizontal className="size-4 text-slate-400" />
                Betaallink versturen
              </span>
              <ArrowRight className="size-3.5 text-slate-500" />
            </Button>
          </form>
        ) : null}
      </div>
      {!hasActionTarget ? null : hasOpenTarget ? (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          De betaallink gebruikt dezelfde leerlingbetaling als de factuurregel.
        </p>
      ) : (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Deze factuur is al afgehandeld; betaalacties zijn daarom uitgeschakeld.
        </p>
      )}
    </Panel>
  );
}

function CompactAgingPanel({
  transactions,
}: {
  transactions: InstructorIncomeLedgerTransaction[];
}) {
  const ranges = [
    { label: "0 - 7 dagen", max: 7, min: 0, tone: "bg-emerald-400" },
    { label: "8 - 14 dagen", max: 14, min: 8, tone: "bg-yellow-400" },
    { label: "15 - 30 dagen", max: 30, min: 15, tone: "bg-orange-400" },
    { label: "30+ dagen", max: Number.POSITIVE_INFINITY, min: 31, tone: "bg-rose-400" },
  ].map((range) => {
    const rows = transactions.filter((transaction) => {
      if (!isLedgerTransactionActionable(transaction.status)) {
        return false;
      }

      const daysOpen = getDaysOpen(transaction);

      return daysOpen >= range.min && daysOpen <= range.max;
    });

    return {
      ...range,
      amount: rows.reduce((sum, transaction) => sum + transaction.bedrag, 0),
    };
  });
  const maxAmount = Math.max(...ranges.map((range) => range.amount), 1);

  return (
    <Panel className="min-h-full">
      <SectionHeader title="Openstaande betalingen per leeftijd" />
      <div className="space-y-4">
        {ranges.map((range) => (
          <div
            key={range.label}
            className="grid grid-cols-[7rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm"
          >
            <span className="text-slate-300">{range.label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className={cn("h-full rounded-full", range.tone)}
                style={{
                  width: `${Math.max((range.amount / maxAmount) * 100, range.amount ? 8 : 0)}%`,
                }}
              />
            </div>
            <span className="text-right font-semibold text-white">
              {formatAmount(range.amount)}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CompactCashflowForecastPanel({
  periodSummaries,
  weekExpected,
}: {
  periodSummaries: PeriodSummary[];
  weekExpected: number;
}) {
  const points = periodSummaries.map((summary) => ({
    label: summary.shortLabel,
    value: summary.paid + summary.open,
  }));

  return (
    <Panel className="min-h-full">
      <SectionHeader
        title="Cashflow voorspelling"
        action={
          <span className="rounded-md border border-white/10 bg-white/7 px-2 py-1 text-xs text-slate-300">
            6 maanden
          </span>
        }
      />
      <IncomeLineChart points={points.length ? points : [{ label: "Week", value: weekExpected }]} />
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400" />
          Verwacht inkomen
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-rose-400" />
          Verwachte uitgaven
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-blue-400" />
          Cashflow
        </span>
      </div>
    </Panel>
  );
}

function CompactPayoutsPanel({ payouts }: { payouts: InstructorPayout[] }) {
  return (
    <Panel id="uitbetalingen" className="min-h-full">
      <SectionHeader title="Uitbetalingen overzicht" />
      <div className="space-y-2">
        {payouts.slice(0, 5).length ? (
          payouts.slice(0, 5).map((payout) => (
            <div
              key={payout.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-white/8 py-2 text-sm"
            >
              <span className="text-slate-300">
                {formatLedgerDate(payout.periode_eind)}
              </span>
              <span className="font-semibold text-white">
                {formatAmount(payout.netto_bedrag)}
              </span>
              <span className="text-xs font-semibold text-emerald-300">
                {payout.status === "uitbetaald" ? "Uitbetaald" : "Gepland"}
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.035] p-4 text-sm text-slate-400">
            Nog geen uitbetalingen.
          </div>
        )}
      </div>
      <Link
        href="#boekhouder-export"
        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-300"
      >
        Bekijk uitbetalingsexport
        <ArrowRight className="size-4" />
      </Link>
    </Panel>
  );
}

function CompactExpenseReceiptsPanel({
  receipts,
}: {
  receipts: InstructorExpenseReceipt[];
}) {
  return (
    <Panel id="kostenbonnen" className="min-h-full">
      <SectionHeader
        title="Kostenbonnen"
        action={
          <details className="relative">
            <summary className="cursor-pointer rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 marker:hidden">
              Upload bon
            </summary>
            <form
              action={uploadInstructorExpenseReceiptAction}
              className="absolute right-0 z-20 mt-2 w-[22rem] rounded-xl border border-white/10 bg-slate-950 p-4 shadow-2xl"
            >
              <div className="grid gap-2">
                <input
                  name="omschrijving"
                  required
                  className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"
                  placeholder="Omschrijving"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="bedrag"
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"
                    placeholder="Bedrag"
                  />
                  <input
                    name="btw_bedrag"
                    min="0"
                    step="0.01"
                    type="number"
                    className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"
                    placeholder="BTW"
                  />
                </div>
                <select
                  name="categorie"
                  className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white"
                  defaultValue="brandstof"
                >
                  <option value="brandstof">Brandstof</option>
                  <option value="onderhoud">Auto onderhoud</option>
                  <option value="verzekering">Verzekering</option>
                  <option value="platformkosten">Platformkosten</option>
                  <option value="overig">Overig</option>
                </select>
                <input
                  name="uitgegeven_op"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"
                />
                <input
                  name="bestand"
                  required
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="rounded-lg border border-dashed border-white/12 bg-white/5 px-3 py-2 text-xs text-slate-300"
                />
                <Button type="submit" className="h-10 rounded-lg bg-blue-600">
                  Opslaan
                </Button>
              </div>
            </form>
          </details>
        }
      />
      <div className="space-y-2">
        {receipts.slice(0, 4).length ? (
          receipts.slice(0, 4).map((receipt) => (
            <div
              key={receipt.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-white/8 py-2 text-sm"
            >
              <span className="text-slate-300">
                {getExpenseCategoryLabel(receipt.categorie)}
              </span>
              <span className="text-slate-400">
                {formatLedgerDate(receipt.uitgegeven_op)}
              </span>
              <span className="font-semibold text-white">
                {formatAmount(receipt.bedrag)}
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.035] p-4 text-sm text-slate-400">
            Nog geen kostenbonnen.
          </div>
        )}
      </div>
      <Link
        href="#kostenbonnen"
        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-300"
      >
        Bekijk alle kostenbonnen
        <ArrowRight className="size-4" />
      </Link>
    </Panel>
  );
}

function CompactProfitPanel({
  activePeriod,
  receipts,
  totalIncome,
  transactions,
}: {
  activePeriod: PeriodKey;
  receipts: InstructorExpenseReceipt[];
  totalIncome: number;
  transactions: InstructorIncomeLedgerTransaction[];
}) {
  const summary = getCostProfitSummary(transactions, activePeriod, receipts);
  const margin = totalIncome > 0 ? Math.round((summary.profit / totalIncome) * 100) : 0;

  return (
    <Panel className="min-h-full">
      <SectionHeader title="Kosten en winst" />
      <div className="space-y-3 text-sm">
        <div className="flex justify-between border-b border-white/8 pb-2">
          <span className="text-slate-400">Totaal inkomsten</span>
          <span className="font-semibold text-emerald-300">
            {formatAmount(totalIncome)}
          </span>
        </div>
        <div className="flex justify-between border-b border-white/8 pb-2">
          <span className="text-slate-400">Totale kosten</span>
          <span className="font-semibold text-red-300">
            - {formatAmount(summary.totalCosts)}
          </span>
        </div>
        <div className="flex justify-between border-b border-white/8 pb-2">
          <span className="text-slate-400">Werkelijke winst</span>
          <span className="font-semibold text-emerald-300">
            {formatAmount(summary.profit)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Winstmarge</span>
          <span className="font-semibold text-emerald-300">{margin}%</span>
        </div>
      </div>
      <Link
        href="#kostenbonnen"
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-300"
      >
        Bekijk winstberekening
        <ArrowRight className="size-4" />
      </Link>
    </Panel>
  );
}

function CompactVatPanel({
  receipts,
  transactions,
}: {
  receipts: InstructorExpenseReceipt[];
  transactions: InstructorIncomeLedgerTransaction[];
}) {
  const summary = buildVatFilingSummary({ receipts, transactions });

  return (
    <Panel className="min-h-full">
      <SectionHeader title="BTW & belastingen" />
      <div className="space-y-3 text-sm">
        <div className="flex justify-between border-b border-white/8 pb-2">
          <span className="text-slate-400">
            BTW te betalen ({summary.label})
          </span>
          <span className="font-semibold text-white">
            {formatAmount(summary.payableVat)}
          </span>
        </div>
        <div className="flex justify-between border-b border-white/8 pb-2">
          <span className="text-slate-400">Voorbelasting</span>
          <span className="font-semibold text-white">
            {formatAmount(summary.deductibleVat)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">BTW af te dragen</span>
          <span className="font-semibold text-white">
            {formatAmount(summary.payableVat)}
          </span>
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/45 p-4">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          BTW-aangifte reminder
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-white">
              BTW {summary.label} klaarzetten
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Deadline: {formatLedgerDate(summary.dueDate.toISOString())}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-9 rounded-lg border-blue-400/20 bg-blue-500/10 px-3 text-xs text-blue-200"
          >
            <a
              download="btw-export.csv"
              href={buildVatExportHref(transactions, receipts)}
            >
              BTW-export downloaden
            </a>
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function CompactCorrectionsPanel({
  transactions,
}: {
  transactions: InstructorIncomeLedgerTransaction[];
}) {
  const rows = transactions
    .filter(
      (transaction) =>
        transaction.type === "correctie" || transaction.type === "refund",
    )
    .slice(0, 3);

  return (
    <Panel className="min-h-full">
      <SectionHeader title="Correcties / refunds" />
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-[620px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                <th className="py-3 pr-3">Datum</th>
                <th className="px-3 py-3">Factuur</th>
                <th className="px-3 py-3">Reden</th>
                <th className="px-3 py-3">Bedrag</th>
                <th className="py-3 pl-3 text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((transaction) => (
                <tr key={transaction.id} className="border-b border-white/8">
                  <td className="py-3 pr-3 text-slate-300">
                    {formatLedgerDate(transaction.created_at)}
                  </td>
                  <td className="px-3 py-3 text-slate-300">
                    {transaction.factuurnummer ?? transaction.id.slice(0, 8)}
                  </td>
                  <td className="px-3 py-3 text-slate-300">
                    {transaction.omschrijving}
                  </td>
                  <td className="px-3 py-3 font-semibold text-white">
                    {transaction.type === "refund" ? "- " : ""}
                    {formatAmount(transaction.bedrag)}
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <Button
                      asChild
                      variant="outline"
                      className="size-8 rounded-md border-white/10 bg-white/7 p-0 text-white"
                    >
                      <a
                        download={`${transaction.factuurnummer ?? transaction.id}.pdf`}
                        href={buildInvoiceHref(transaction)}
                      >
                        <Download className="size-3.5" />
                      </a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.035] p-4 text-sm text-slate-400">
          Nog geen correcties of refunds.
        </div>
      )}
      <details className="mt-4">
        <summary className="cursor-pointer rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-200 marker:hidden">
          + Correctie / refund toevoegen
        </summary>
        <form action={createIncomeCorrectionAction} className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem_9rem_auto]">
          <input
            name="omschrijving"
            required
            className="h-10 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
            placeholder="Reden"
          />
          <input
            name="bedrag"
            required
            min="0"
            step="0.01"
            type="number"
            className="h-10 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
            placeholder="Bedrag"
          />
          <select
            name="type"
            className="h-10 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
            defaultValue="correctie"
          >
            <option value="correctie">Correctie</option>
            <option value="refund">Refund</option>
          </select>
          <Button type="submit" className="h-10 rounded-lg bg-blue-600">
            Opslaan
          </Button>
        </form>
      </details>
    </Panel>
  );
}

function CompactOverviewCards() {
  const cards = [
    {
      href: "#inkomsten-overzicht",
      icon: FileText,
      label: "Maandrapport",
    },
    {
      href: "#kostenbonnen",
      icon: TrendingUp,
      label: "Winst & verlies",
    },
    {
      href: "#boekhouder-export",
      icon: Receipt,
      label: "BTW overzicht",
    },
    {
      href: "#boekhouder-export",
      icon: FileSpreadsheet,
      label: "Boekhouder rapport",
    },
  ];

  return (
    <Panel className="min-h-full">
      <SectionHeader title="Snelle overzichten" />
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.label}
              href={card.href}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-4 transition hover:bg-white/[0.07]"
            >
              <span className="flex size-11 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold text-white">
                  {card.label}
                </span>
                <span className="text-sm text-slate-400">Bekijk overzicht</span>
              </span>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

function CompactIncomeDashboard({
  activePeriod,
  activePeriodSummary,
  averageLessonPrice,
  categories,
  categoryTotal,
  csvHref,
  donutGradient,
  incomeSeries,
  invoicePeriod,
  invoiceTransactions,
  ledger,
  ledgerReceivedShare,
  paidThisMonth,
  pendingIncome,
  pendingShare,
  periodExpenseReceipts,
  periodSummaries,
  periodTransactions,
  refunds,
  showAllInvoices,
  totalIncome,
  weekExpected,
}: {
  activePeriod: PeriodKey;
  activePeriodSummary: PeriodSummary;
  averageLessonPrice: string;
  categories: IncomeCategory[];
  categoryTotal: number;
  csvHref: string;
  donutGradient: string;
  incomeSeries: Array<{ label: string; value: number }>;
  invoicePeriod: InvoicePeriodKey;
  invoiceTransactions: InstructorIncomeLedgerTransaction[];
  ledger: InstructorIncomeLedger;
  ledgerReceivedShare: number;
  paidThisMonth: number;
  pendingIncome: number;
  pendingShare: number;
  periodExpenseReceipts: InstructorExpenseReceipt[];
  periodSummaries: PeriodSummary[];
  periodTransactions: InstructorIncomeLedgerTransaction[];
  refunds: number;
  showAllInvoices: boolean;
  totalIncome: number;
  weekExpected: number;
}) {
  return (
    <div className="space-y-4 text-white">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Inkomsten
          </h1>
          <p className="mt-2 text-base text-slate-400">
            Een compleet overzicht van je omzet, betalingen en inkomsten.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodSwitcher activePeriod={activePeriod} />
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-lg border-white/10 bg-slate-950/45 px-4 text-white hover:bg-white/10"
          >
            <Link href="#inkomsten-overzicht">
              <CalendarDays className="size-4" />
              {activePeriodSummary.rangeLabel}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-lg border-white/10 bg-slate-950/45 px-4 text-white hover:bg-white/10"
          >
            <Link href="#cashflow">
              <BarChart3 className="size-4" />
              Vergelijken
            </Link>
          </Button>
          <DownloadReportButton
            csvHref={csvHref}
            className="h-10 rounded-lg border-emerald-500/30 bg-emerald-600 px-4 text-white hover:bg-emerald-500"
          >
            <Download className="size-4" />
            Exporteren
          </DownloadReportButton>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <CompactMetricCard
          detail="+15% vs vorige maand"
          icon={Euro}
          label="Totale inkomsten"
          tone="emerald"
          value={formatAmount(totalIncome)}
        />
        <CompactMetricCard
          detail={`${ledgerReceivedShare}% van totaal`}
          icon={CreditCard}
          label="Betalingen ontvangen"
          tone="blue"
          value={formatAmount(paidThisMonth)}
        />
        <CompactMetricCard
          detail={`${pendingShare}% van totaal`}
          icon={Clock3}
          label="In afwachting"
          tone="amber"
          value={formatAmount(pendingIncome)}
        />
        <CompactMetricCard
          detail={`${ledger.transactions.filter((row) => row.type === "refund").length} terugbetalingen`}
          icon={RefreshCcw}
          label="Terugbetalingen"
          tone="purple"
          value={formatAmount(refunds)}
        />
        <CompactMetricCard
          detail="+8% vs vorige maand"
          icon={TrendingUp}
          label="Gem. per les"
          tone="sky"
          value={averageLessonPrice}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)_minmax(20rem,0.75fr)]">
        <Panel>
          <SectionHeader
            title="Inkomsten over tijd"
            action={
              <span className="rounded-md border border-white/10 bg-white/7 px-2 py-1 text-xs text-slate-300">
                {activePeriodSummary.label}
              </span>
            }
          />
          <IncomeLineChart points={incomeSeries} />
        </Panel>

        <Panel>
          <SectionHeader title="Verdeling van inkomsten" />
          <div className="grid gap-5 md:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)]">
            <div className="relative mx-auto size-52">
              <div
                className="size-full rounded-full"
                style={{ background: donutGradient }}
              />
              <div className="absolute inset-12 flex flex-col items-center justify-center rounded-full bg-slate-950 text-center">
                <p className="text-2xl font-semibold text-white">
                  {formatAmount(categoryTotal || totalIncome)}
                </p>
                <p className="text-sm text-slate-300">Totaal</p>
              </div>
            </div>
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.label}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm"
                >
                  <span className={cn("mt-1 size-2 rounded-sm", category.tone)} />
                  <div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-200">{category.label}</span>
                      <span className="text-slate-300">
                        {formatAmount(category.value)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {getShare(category.value, categoryTotal)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <CompactLedgerSummary ledger={ledger} />
      </div>

      <CompactQuickActions ledger={ledger} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <CompactPipelinePanel transactions={ledger.transactions} />
        <AutomaticPaymentRemindersPanel transactions={ledger.transactions} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <CompactInvoiceTable
          activePeriod={activePeriod}
          invoicePeriod={invoicePeriod}
          showAllInvoices={showAllInvoices}
          transactions={invoiceTransactions}
        />
        <CompactInvoiceActions transactions={invoiceTransactions} />
      </div>

      <div id="cashflow" className="grid gap-4 xl:grid-cols-[0.8fr_1fr_0.8fr]">
        <CompactAgingPanel transactions={ledger.transactions} />
        <CompactCashflowForecastPanel
          periodSummaries={periodSummaries}
          weekExpected={weekExpected}
        />
        <CompactPayoutsPanel payouts={ledger.payouts} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_0.8fr_0.9fr]">
        <CompactExpenseReceiptsPanel receipts={ledger.expenseReceipts} />
        <CompactProfitPanel
          activePeriod={activePeriod}
          receipts={periodExpenseReceipts}
          totalIncome={totalIncome}
          transactions={periodTransactions}
        />
        <CompactVatPanel
          receipts={ledger.expenseReceipts}
          transactions={ledger.transactions}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <CompactCorrectionsPanel transactions={ledger.transactions} />
        <CompactOverviewCards />
      </div>

    </div>
  );
}

function PayoutRow({ payout }: { payout: InstructorPayout }) {
  const paid = payout.status === "uitbetaald";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">
            {formatLedgerDate(payout.periode_start)} -{" "}
            {formatLedgerDate(payout.periode_eind)}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {payout.referentie ?? "Uitbetaling zonder referentie"}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase",
            paid
              ? "border-emerald-400/25 bg-emerald-500/15 text-emerald-300"
              : "border-blue-400/25 bg-blue-500/12 text-blue-300",
          )}
        >
          {paid ? "Uitbetaald" : "Gepland"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-slate-500">Bruto</p>
          <p className="mt-1 font-semibold text-white">
            {formatAmount(payout.bruto_bedrag)}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Platform</p>
          <p className="mt-1 font-semibold text-white">
            {formatAmount(payout.platform_fee)}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Netto</p>
          <p className="mt-1 font-semibold text-emerald-300">
            {formatAmount(payout.netto_bedrag)}
          </p>
        </div>
      </div>
    </div>
  );
}

function LedgerPipelineChart({
  transactions,
}: {
  transactions: InstructorIncomeLedgerTransaction[];
}) {
  const pipeline = [
    {
      label: "Open",
      status: "open" as const,
      tone: "bg-amber-400",
    },
    {
      label: "Verstuurd",
      status: "verstuurd" as const,
      tone: "bg-blue-400",
    },
    {
      label: "Te laat",
      status: "te_laat" as const,
      tone: "bg-red-400",
    },
    {
      label: "Betaald",
      status: "betaald" as const,
      tone: "bg-emerald-400",
    },
  ].map((item) => {
    const rows = transactions.filter(
      (transaction) => transaction.status === item.status,
    );

    return {
      ...item,
      amount: rows.reduce((sum, transaction) => sum + transaction.bedrag, 0),
      count: rows.length,
    };
  });
  const maxAmount = Math.max(...pipeline.map((item) => item.amount), 1);

  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/26 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-semibold text-white">Factuurpipeline</p>
          <p className="mt-1 text-sm text-slate-400">
            Zie meteen waar omzet nog wacht, verstuurd is, te laat staat of al
            binnen is.
          </p>
        </div>
        <Link
          href="#omzetboek-correctie"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/18"
        >
          <Plus className="size-3.5" />
          Correctie
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {pipeline.map((item) => (
          <div
            key={item.status}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white">
                {item.label}
              </span>
              <span className="text-xs text-slate-400">
                {item.count} regel{item.count === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold text-white">
              {formatAmount(item.amount)}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className={cn("h-full rounded-full", item.tone)}
                style={{
                  width: `${Math.max((item.amount / maxAmount) * 100, item.amount > 0 ? 8 : 0)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeriodSwitcher({ activePeriod }: { activePeriod: PeriodKey }) {
  const items = [
    { href: "/instructeur/inkomsten?periode=dag", key: "dag" as const, label: "Dag" },
    { href: "/instructeur/inkomsten?periode=week", key: "week" as const, label: "Week" },
    { href: "/instructeur/inkomsten?periode=maand", key: "maand" as const, label: "Maand" },
    { href: "/instructeur/inkomsten?periode=kwartaal", key: "kwartaal" as const, label: "Kwartaal" },
    { href: "/instructeur/inkomsten?periode=jaar", key: "jaar" as const, label: "Jaar" },
  ];

  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.045] p-1">
      {items.map((item) => {
        const active = item.key === activePeriod;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition",
              active
                ? "bg-white text-slate-950 shadow-[0_10px_30px_-20px_rgba(255,255,255,0.65)]"
                : "text-slate-300 hover:bg-white/10 hover:text-white",
            )}
          >
            <CalendarDays className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function PeriodFocusPanel({
  activeSummary,
  summaries,
}: {
  activeSummary: PeriodSummary;
  summaries: PeriodSummary[];
}) {
  const maxTotal = Math.max(
    ...summaries.map((summary) => summary.paid + summary.open),
    1,
  );
  const actionText =
    activeSummary.overdue > 0
      ? `${formatAmount(activeSummary.overdue)} te laat. Stuur herinneringen vanuit het omzetboek.`
      : activeSummary.open > 0
        ? `${formatAmount(activeSummary.open)} staat nog open voor deze periode.`
        : "Deze periode is rustig: geen open betaling om direct op te volgen.";

  return (
    <Panel className="border-blue-400/15 bg-[linear-gradient(145deg,rgba(13,110,253,0.13),rgba(15,23,42,0.38))]">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-blue-200 uppercase">
            Periode focus
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <h2 className="text-2xl font-semibold text-white">
              {activeSummary.label}
            </h2>
            <span className="rounded-full border border-white/10 bg-white/7 px-3 py-1 text-xs text-slate-300">
              {activeSummary.rangeLabel}
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            {actionText}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                Betaald
              </p>
              <p className="mt-2 text-xl font-semibold text-emerald-300">
                {formatAmount(activeSummary.paid)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                Open
              </p>
              <p className="mt-2 text-xl font-semibold text-amber-300">
                {formatAmount(activeSummary.open)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                Netto
              </p>
              <p className="mt-2 text-xl font-semibold text-blue-200">
                {formatAmount(activeSummary.netto)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                Regels
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {activeSummary.transactionCount}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/28 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-white">Dag / week / maand</p>
              <p className="mt-1 text-sm text-slate-400">
                Snelle vergelijking van betaald plus open omzet.
              </p>
            </div>
            <Link
              href="#omzetboek"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/7 px-3 text-xs font-semibold text-white transition hover:bg-white/12"
            >
              Open omzetboek
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {summaries.map((summary) => {
              const total = summary.paid + summary.open;
              const width = Math.max((total / maxTotal) * 100, total > 0 ? 8 : 0);
              const active = summary.key === activeSummary.key;

              return (
                <Link
                  key={summary.key}
                  href={`/instructeur/inkomsten?periode=${summary.key}`}
                  className={cn(
                    "block rounded-lg border p-3 transition",
                    active
                      ? "border-blue-400/35 bg-blue-500/12"
                      : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-white">
                      {summary.shortLabel}
                    </span>
                    <span className="text-sm text-slate-300">
                      {formatAmount(total)}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e,#0d6efd,#f59e0b)]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>{formatAmount(summary.paid)} betaald</span>
                    <span>{formatAmount(summary.open)} open</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function IncomeLedgerPanel({ ledger }: { ledger: InstructorIncomeLedger }) {
  const visibleTransactions = ledger.transactions.slice(0, 8);
  const ledgerCsvHref = buildLedgerCsvHref(ledger.transactions);

  return (
    <Panel id="omzetboek" className="border-blue-400/15">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-blue-200 uppercase">
            Omzetboek + facturen
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Echte inkomstenregels, statussen en uitbetalingen
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
            Synchroniseer je lessen en pakketbetalingen naar een financieel
            overzicht met factuurnummers, vervaldatums, herinneringen en netto
            uitbetaling.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-lg border-white/10 bg-white/7 px-4 text-white hover:bg-white/12"
          >
            <a download="omzetboek.csv" href={ledgerCsvHref}>
              <Download className="size-4" />
              Omzetboek CSV
            </a>
          </Button>
          <form action={syncInstructorIncomeLedgerAction}>
            <Button
              type="submit"
              className="h-11 rounded-lg bg-blue-600 px-5 text-white hover:bg-blue-500"
            >
              <RefreshCcw className="size-4" />
              Omzetboek synchroniseren
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <LedgerSummaryTile
          detail={`${ledger.summary.outstandingCount} regel${ledger.summary.outstandingCount === 1 ? "" : "s"} wachten op betaling of opvolging.`}
          icon={ReceiptText}
          label="Openstaand"
          tone="amber"
          value={formatAmount(ledger.summary.openAmount)}
        />
        <LedgerSummaryTile
          detail={`${ledger.summary.overdueCount} regel${ledger.summary.overdueCount === 1 ? "" : "s"} over de vervaldatum.`}
          icon={Clock3}
          label="Te laat"
          tone="red"
          value={formatAmount(ledger.summary.overdueAmount)}
        />
        <LedgerSummaryTile
          detail="Alle betaalde regels binnen deze kalendermaand."
          icon={CheckCircle2}
          label="Betaald deze maand"
          tone="emerald"
          value={formatAmount(ledger.summary.paidThisMonth)}
        />
        <LedgerSummaryTile
          detail={`Volgende vervaldatum: ${formatLedgerDate(ledger.summary.nextDueDate)}.`}
          icon={Landmark}
          label="Netto uitbetaling"
          tone="blue"
          value={formatAmount(ledger.summary.payoutNetto)}
        />
      </div>

      <LedgerPipelineChart transactions={ledger.transactions} />

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)]">
        <div className="rounded-xl border border-white/10 bg-slate-950/28 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-white">Inkomstenregels</p>
              <p className="mt-1 text-sm text-slate-400">
                Per les, pakket, correctie of refund met eigen status.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/7 px-3 py-1 text-xs text-slate-300">
              {ledger.transactions.length} regel
              {ledger.transactions.length === 1 ? "" : "s"}
            </span>
          </div>
          {visibleTransactions.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                    <th className="py-3 pr-4">Factuur</th>
                    <th className="px-4 py-3">Omschrijving</th>
                    <th className="px-4 py-3">Bedrag</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Vervalt</th>
                    <th className="py-3 pl-4 text-right">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-white/8 align-top"
                    >
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-white">
                          {transaction.factuurnummer ?? "Concept"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {getLedgerTypeLabel(transaction.type)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-100">
                          {transaction.omschrijving}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {transaction.leerling_naam ?? "Niet aan leerling gekoppeld"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white">
                          {formatAmount(transaction.bedrag)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Netto {formatAmount(transaction.netto_bedrag)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase",
                            getLedgerStatusClass(transaction.status),
                          )}
                        >
                          {getLedgerStatusLabel(transaction.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {formatLedgerDate(transaction.vervaldatum)}
                      </td>
                      <td className="py-4 pl-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            asChild
                            variant="outline"
                            className="size-9 rounded-lg border-white/10 bg-white/7 p-0 text-white hover:bg-white/12"
                            title="Factuur downloaden"
                          >
                            <a
                              aria-label={`Download factuur ${transaction.factuurnummer ?? transaction.id}`}
                              download={`${transaction.factuurnummer ?? transaction.id}.pdf`}
                              href={buildInvoiceHref(transaction)}
                            >
                              <FileText className="size-4" />
                            </a>
                          </Button>
                          {transaction.type !== "refund" &&
                          transaction.status !== "geannuleerd" ? (
                            <form action={resendIncomeInvoiceAction}>
                              <input
                                name="transactionId"
                                type="hidden"
                                value={transaction.id}
                              />
                              <Button
                                type="submit"
                                variant="outline"
                                className="size-9 rounded-lg border-cyan-400/20 bg-cyan-500/10 p-0 text-cyan-200 hover:bg-cyan-500/18"
                                aria-label={`Verstuur factuur ${transaction.factuurnummer ?? transaction.omschrijving} opnieuw`}
                                title="Factuur opnieuw versturen"
                              >
                                <ReceiptText className="size-4" />
                              </Button>
                            </form>
                          ) : null}
                          {isLedgerTransactionActionable(transaction.status) ? (
                            <>
                              <form action={sendIncomeReminderAction}>
                                <input
                                  name="transactionId"
                                  type="hidden"
                                  value={transaction.id}
                                />
                                <Button
                                  type="submit"
                                  variant="outline"
                                  className="size-9 rounded-lg border-blue-400/20 bg-blue-500/10 p-0 text-blue-200 hover:bg-blue-500/18"
                                  aria-label={`Stuur herinnering voor ${transaction.factuurnummer ?? transaction.omschrijving}`}
                                  title="Herinnering sturen"
                                >
                                  <Send className="size-4" />
                                </Button>
                              </form>
                              <form action={markIncomeTransactionPaidAction}>
                                <input
                                  name="transactionId"
                                  type="hidden"
                                  value={transaction.id}
                                />
                                <Button
                                  type="submit"
                                  variant="outline"
                                  className="size-9 rounded-lg border-emerald-400/20 bg-emerald-500/10 p-0 text-emerald-200 hover:bg-emerald-500/18"
                                  aria-label={`Markeer ${transaction.factuurnummer ?? transaction.omschrijving} als betaald`}
                                  title="Markeer als betaald"
                                >
                                  <CheckCircle2 className="size-4" />
                                </Button>
                              </form>
                            </>
                          ) : null}
                          {transaction.type !== "refund" &&
                          transaction.status !== "geannuleerd" ? (
                            <form action={cancelIncomeTransactionAction}>
                              <input
                                name="transactionId"
                                type="hidden"
                                value={transaction.id}
                              />
                              <Button
                                type="submit"
                                variant="outline"
                                className="size-9 rounded-lg border-red-400/20 bg-red-500/10 p-0 text-red-200 hover:bg-red-500/18"
                                aria-label={`Annuleer of maak creditnota voor ${transaction.factuurnummer ?? transaction.omschrijving}`}
                                title="Annuleren / creditnota maken"
                              >
                                <Ban className="size-4" />
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.035] p-6 text-sm leading-7 text-slate-400">
              Nog geen inkomstenregels. Gebruik synchroniseren om bestaande
              lessen en pakketbetalingen in het omzetboek te zetten.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div
            id="omzetboek-correctie"
            className="rounded-xl border border-white/10 bg-white/[0.045] p-4"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/12 text-violet-300">
                <BadgeEuro className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-white">Correctie toevoegen</p>
                <p className="text-sm text-slate-400">Voor losse correcties of refunds.</p>
              </div>
            </div>
            <form action={createIncomeCorrectionAction} className="space-y-3">
              <label className="block text-sm text-slate-300">
                Omschrijving
                <input
                  name="omschrijving"
                  required
                  className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/50"
                  placeholder="Bijv. correctie pakketkorting"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  Bedrag
                  <input
                    name="bedrag"
                    required
                    step="0.01"
                    min="0"
                    type="number"
                    className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/50"
                    placeholder="0,00"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Type
                  <select
                    name="type"
                    className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-white outline-none transition focus:border-blue-400/50"
                    defaultValue="correctie"
                  >
                    <option value="correctie">Correctie</option>
                    <option value="refund">Refund</option>
                  </select>
                </label>
              </div>
              <Button
                type="submit"
                className="h-10 w-full rounded-lg bg-blue-600 text-white hover:bg-blue-500"
              >
                <Plus className="size-4" />
                Maak correctie aan
              </Button>
            </form>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/12 text-emerald-300">
                <Landmark className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-white">Uitbetalingen</p>
                <p className="text-sm text-slate-400">Bruto, kosten en netto per periode.</p>
              </div>
            </div>
            <div className="space-y-3">
              {ledger.payouts.length ? (
                ledger.payouts
                  .slice(0, 3)
                  .map((payout) => <PayoutRow key={payout.id} payout={payout} />)
              ) : (
                <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.035] p-4 text-sm leading-6 text-slate-400">
                  Nog geen uitbetaling gepland. Zodra er betaalde regels in de
                  maand staan, maakt synchroniseren automatisch een
                  uitbetalingsoverzicht.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default async function InkomstenPage({
  searchParams,
}: {
  searchParams: Promise<{
    facturen?: string;
    factuurPeriode?: string;
    periode?: string;
  }>;
}) {
  const params = await searchParams;
  const activePeriod = normalizePeriod(params.periode);
  const invoicePeriod = normalizeInvoicePeriod(
    params.factuurPeriode,
    activePeriod,
  );
  const showAllInvoices = params.facturen === "alle";
  const [overview, cockpit, ledger] = await timedDashboardRoute(ROUTE, () =>
    Promise.all([
      timedDashboardData(ROUTE, "income-overview", getCurrentInstructorIncomeOverview),
      timedDashboardData(ROUTE, "income-cockpit", getCurrentInstructorIncomeCockpit),
      timedDashboardData(ROUTE, "income-ledger", getCurrentInstructorIncomeLedger),
    ]),
  );
  const periodSummaries = ([
    "dag",
    "week",
    "maand",
    "kwartaal",
    "jaar",
  ] as PeriodKey[]).map((key) =>
    buildPeriodSummary(key, ledger.transactions),
  );
  const activePeriodSummary =
    periodSummaries.find((summary) => summary.key === activePeriod) ??
    periodSummaries[2];
  const periodTransactions = getPeriodTransactions(
    activePeriod,
    ledger.transactions,
  );
  const invoiceTransactions = getInvoicePeriodTransactions(
    invoicePeriod,
    ledger.transactions,
  );
  const periodExpenseReceipts = getPeriodExpenseReceipts(
    activePeriod,
    ledger.expenseReceipts,
  );
  const taxLines = buildTaxLines(periodTransactions, periodExpenseReceipts);
  const topStats = overview.topStats;
  const secondaryStats = overview.secondaryStats;
  const monthReceived = parseMoneyLabel(
    getStatValue(cockpit.stats, "Afgerond deze maand") ||
      getStatValue(topStats, "Afgerond deze maand"),
  );
  const paidThisMonth =
    activePeriodSummary.paid ||
    (activePeriod === "maand" ? ledger.summary.paidThisMonth || monthReceived : 0);
  const pendingIncome =
    activePeriodSummary.open ||
    (activePeriod === "maand"
      ? ledger.summary.openAmount ||
        parseMoneyLabel(getStatValue(cockpit.stats, "Open lesomzet"))
      : 0);
  const weekExpected = parseMoneyLabel(
    getStatValue(cockpit.stats, "Verwacht deze week") ||
      getStatValue(topStats, "Verwacht deze week"),
  );
  const packagePortfolio = parseMoneyLabel(
    getStatValue(cockpit.stats, "Pakketportfolio") ||
      getStatValue(secondaryStats, "Aanbodwaarde"),
  );
  const gapPotential = parseMoneyLabel(
    getStatValue(cockpit.stats, "Lege gaten"),
  );
  const growthPotential = parseMoneyLabel(
    cockpit.growthInsights.summary.estimatedGrowthValueLabel,
  );
  const refunds = activePeriodSummary.refunds;
  const totalIncome = Math.max(paidThisMonth + pendingIncome, weekExpected);
  const monthlyGoal = getMonthlyGoal(totalIncome, weekExpected);
  const goalProgress = Math.min(
    100,
    Math.round((totalIncome / monthlyGoal) * 100),
  );
  const ledgerReceivedShare = getShare(paidThisMonth, totalIncome);
  const pendingShare = getShare(pendingIncome, totalIncome);
  const averageLessonPrice =
    getStatValue(secondaryStats, "Prijs per les") ||
    getStatValue(cockpit.stats, "Prijs per les") ||
    "Nog leeg";
  const incomeSeries = ledger.transactions.length
    ? buildLedgerSeries(ledger.transactions, totalIncome)
    : buildIncomeSeries(cockpit.incomeRows, totalIncome);
  const categories = buildCategories(cockpit.incomeRows, {
    gapPotential,
    monthReceived: paidThisMonth,
    packagePortfolio,
  });
  const categoryTotal = categories.reduce(
    (sum, category) => sum + category.value,
    0,
  );
  const donutGradient = buildDonutGradient(categories);
  const overviewRows: OverviewRow[] = [
    ...periodSummaries.map((summary) => ({
      label: summary.label,
      pending: summary.open,
      received: summary.paid,
      refunds: summary.refunds,
      total: summary.paid + summary.open,
    })),
    {
      label: "Pakketportfolio",
      pending: 0,
      received: packagePortfolio,
      refunds: 0,
      total: packagePortfolio,
    },
    {
      label: "Open groeikansen",
      pending: gapPotential + growthPotential,
      received: 0,
      refunds: 0,
      total: gapPotential + growthPotential,
    },
  ];
  const csvRows = [
    [
      "Periode",
      "Totale inkomsten",
      "Ontvangen",
      "In afwachting",
      "Terugbetalingen",
      "Netto",
    ],
    ...overviewRows.map((row) => [
      row.label,
      formatAmount(row.total),
      formatAmount(row.received),
      formatAmount(row.pending),
      formatAmount(row.refunds),
      formatAmount(row.received + row.pending - row.refunds),
    ]),
  ];
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(
    csvRows.map((row) => row.join(";")).join("\n"),
  )}`;

  return (
    <>
      <DashboardPerformanceMark route={ROUTE} label="CompactIncomeDashboard" />
      <CompactIncomeDashboard
        activePeriod={activePeriod}
        activePeriodSummary={activePeriodSummary}
        averageLessonPrice={averageLessonPrice}
        categories={categories}
        categoryTotal={categoryTotal}
        csvHref={csvHref}
        donutGradient={donutGradient}
        incomeSeries={incomeSeries}
        invoicePeriod={invoicePeriod}
        invoiceTransactions={invoiceTransactions}
        ledger={ledger}
        ledgerReceivedShare={ledgerReceivedShare}
        paidThisMonth={paidThisMonth}
        pendingIncome={pendingIncome}
        pendingShare={pendingShare}
        periodExpenseReceipts={periodExpenseReceipts}
        periodSummaries={periodSummaries}
        periodTransactions={periodTransactions}
        refunds={refunds}
        showAllInvoices={showAllInvoices}
        totalIncome={totalIncome}
        weekExpected={weekExpected}
      />
    </>
  );

  return (
    <div className="space-y-6 text-white">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Inkomsten
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Een compleet overzicht van je omzet, betalingen en inkomsten.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodSwitcher activePeriod={activePeriod} />
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-lg border-white/10 bg-white/7 px-4 text-white hover:bg-white/12"
          >
            <Link href="#inkomsten-cockpit">
              <BarChart3 className="size-4" />
              Vergelijken
            </Link>
          </Button>
          <DownloadReportButton
            csvHref={csvHref}
            className="h-11 rounded-lg border-blue-500/30 bg-blue-600 px-5 text-white hover:bg-blue-500"
          >
            <Download className="size-4" />
            Exporteren
          </DownloadReportButton>
        </div>
      </header>

      <PeriodFocusPanel
        activeSummary={activePeriodSummary}
        summaries={periodSummaries}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <IncomeStatCard
          detail={`Gekozen periode: ${activePeriodSummary.rangeLabel}`}
          icon={Euro}
          label="Totale inkomsten"
          tone="emerald"
          value={formatAmount(totalIncome)}
        />
        <IncomeStatCard
          detail={`${ledgerReceivedShare}% van totaal`}
          icon={CreditCard}
          label="Betalingen ontvangen"
          tone="blue"
          value={formatAmount(paidThisMonth)}
        />
        <IncomeStatCard
          detail={`${pendingShare}% van totaal`}
          icon={Clock3}
          label="In afwachting"
          tone="amber"
          value={formatAmount(pendingIncome)}
        />
        <IncomeStatCard
          detail={
            refunds > 0
              ? `${formatAmount(refunds)} aan refunds of terugbetalingen verwerkt`
              : "Geen terugbetalingen geregistreerd"
          }
          icon={RefreshCcw}
          label="Terugbetalingen"
          tone="purple"
          value={formatAmount(refunds)}
        />
        <IncomeStatCard
          detail={getStatDetail(secondaryStats, "Prijs per les")}
          icon={TrendingUp}
          label="Gem. per les"
          tone="teal"
          value={averageLessonPrice}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <TaxOverviewPanel lines={taxLines} />
        <AgingOpenPaymentsPanel transactions={ledger.transactions} />
      </div>

      <VatFilingReminderPanel
        receipts={ledger.expenseReceipts}
        transactions={ledger.transactions}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <CostProfitPanel
          activePeriod={activePeriod}
          receipts={periodExpenseReceipts}
          transactions={periodTransactions}
        />
        <CashflowForecastPanel
          activeSummary={activePeriodSummary}
          gapPotential={gapPotential}
          pendingIncome={pendingIncome}
          periodSummaries={periodSummaries}
          weekExpected={weekExpected}
        />
      </div>

      <ExpenseReceiptsPanel receipts={ledger.expenseReceipts} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,0.92fr)_minmax(0,0.8fr)]">
        <BookkeeperExportPanel ledger={ledger} />
        <PaymentLinksPanel transactions={ledger.transactions} />
        <AutomaticPaymentRemindersPanel transactions={ledger.transactions} />
      </div>

      <IncomeLedgerPanel ledger={ledger} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.34fr)_minmax(18rem,0.8fr)_minmax(18rem,0.96fr)]">
        <Panel>
          <SectionHeader
            title="Inkomsten over tijd"
            action={
              <Button
                asChild
                variant="outline"
                className="h-9 rounded-lg border-white/10 bg-white/7 text-xs text-white hover:bg-white/12"
              >
                <Link href="#inkomsten-cockpit">
                  Weergave: {activePeriodSummary.shortLabel}
                  <ChevronDown className="size-3.5" />
                </Link>
              </Button>
            }
          />
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <p className="text-3xl font-semibold tracking-tight text-white">
              {formatAmount(totalIncome)}
            </p>
            <p className="pb-1 text-sm font-semibold text-emerald-300">
              +15% vs vorige maand
            </p>
          </div>
          <IncomeLineChart points={incomeSeries} />
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span className="size-2 rounded-full bg-blue-500" />
            Inkomsten
          </div>
        </Panel>

        <Panel>
          <SectionHeader
            title="Inkomsten verdeling"
            action={
              <Button
                asChild
                variant="outline"
                className="h-9 rounded-lg border-white/10 bg-white/7 text-xs text-white hover:bg-white/12"
              >
                <Link href="#inkomsten-overzicht">
                  {activePeriodSummary.label}
                  <ChevronDown className="size-3.5" />
                </Link>
              </Button>
            }
          />
          <div className="grid gap-5 md:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[13rem_minmax(0,1fr)]">
            <div className="relative mx-auto size-52">
              <div
                className="size-full rounded-full"
                style={{ background: donutGradient }}
              />
              <div className="absolute inset-12 flex flex-col items-center justify-center rounded-full bg-slate-950 text-center">
                <p className="text-2xl font-semibold text-white">
                  {formatAmount(categoryTotal || totalIncome)}
                </p>
                <p className="text-sm text-slate-300">Totaal</p>
              </div>
            </div>
            <div className="space-y-3">
              {categories.map((category) => {
                const share = getShare(category.value, categoryTotal);

                return (
                  <div
                    key={category.label}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"
                  >
                    <span
                      className={cn("size-3 rounded-full", category.tone)}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">
                        {category.label}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatAmount(category.value)}
                      </p>
                    </div>
                    <span className="text-sm text-slate-300">{share}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionHeader
            title="Recente transacties"
            action={
              <Link
                href="#inkomsten-overzicht"
                className="text-[11px] font-medium text-slate-400 transition hover:text-white"
              >
                Alles bekijken
              </Link>
            }
          />
          <div className="space-y-3">
            {cockpit.incomeRows.slice(0, 5).length ? (
              cockpit.incomeRows.slice(0, 5).map((row, index) => {
                const received = row.status === "afgerond";
                const Icon = received ? UsersRound : Clock3;

                return (
                  <div
                    key={`${row.omschrijving}-${row.datum}-${index}`}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2"
                  >
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full",
                        received
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {row.omschrijving}
                      </p>
                      <p className="text-xs text-slate-400">{row.datum}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{row.bedrag}</p>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          getTransactionStatusClass(row.status),
                        )}
                      >
                        {getTransactionStatusLabel(row.status)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-white/12 bg-white/[0.035] p-4 text-sm text-slate-400">
                Nog geen transacties gevonden.
              </div>
            )}
          </div>
          <Button
            asChild
            variant="outline"
            className="mt-4 h-10 w-full justify-between rounded-lg border-white/10 bg-white/7 text-white hover:bg-white/12"
          >
            <Link href="#inkomsten-overzicht">
              <Download className="size-4" />
              Alle transacties bekijken
              <ChevronDown className="size-4 -rotate-90" />
            </Link>
          </Button>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <CashflowPanel
          goalProgress={goalProgress}
          monthlyGoal={monthlyGoal}
          pendingIncome={pendingIncome}
          totalIncome={totalIncome}
          weekExpected={weekExpected}
        />
        <ActionCenter actions={cockpit.actions} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.36fr)_minmax(18rem,0.64fr)]">
        <Panel id="inkomsten-overzicht">
          <SectionHeader title="Inkomsten overzicht" />
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                  <th className="py-3 pr-4">Periode</th>
                  <th className="px-4 py-3">Totale inkomsten</th>
                  <th className="px-4 py-3">Ontvangen</th>
                  <th className="px-4 py-3">In afwachting</th>
                  <th className="px-4 py-3">Terugbetalingen</th>
                  <th className="py-3 pl-4 text-right">Netto</th>
                </tr>
              </thead>
              <tbody>
                {overviewRows.map((row) => (
                  <tr key={row.label} className="border-b border-white/8">
                    <td className="py-3 pr-4 text-white">{row.label}</td>
                    <td className="px-4 py-3 text-slate-200">
                      {formatAmount(row.total)}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {formatAmount(row.received)}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {formatAmount(row.pending)}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {formatAmount(row.refunds)}
                    </td>
                    <td className="py-3 pl-4 text-right font-semibold text-emerald-300">
                      {formatAmount(row.received + row.pending - row.refunds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DownloadReportButton
            csvHref={csvHref}
            className="mt-4 h-10 rounded-lg border-white/10 bg-white/7 text-white hover:bg-white/12"
          >
            <Download className="size-4" />
            Gedetailleerd rapport downloaden
          </DownloadReportButton>
        </Panel>

        <Panel>
          <SectionHeader
            title="Inkomsten per categorie"
            action={
              <Link
                href="#inkomsten-overzicht"
                className="text-[11px] font-medium text-slate-400 transition hover:text-white"
              >
                {activePeriodSummary.label}
              </Link>
            }
          />
          <div className="space-y-5">
            {categories.map((category) => {
              const share = getShare(category.value, categoryTotal);

              return (
                <div key={category.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-white">
                      {category.label}
                    </span>
                    <span className="text-slate-200">
                      {formatAmount(category.value)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700/70">
                      <div
                        className={cn("h-full rounded-full", category.tone)}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm text-slate-300">
                      {share}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

    </div>
  );
}
