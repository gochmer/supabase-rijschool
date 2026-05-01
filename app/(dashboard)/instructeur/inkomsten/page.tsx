import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Clock3,
  CreditCard,
  Download,
  Euro,
  PackageCheck,
  RefreshCcw,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { InstructorIncomeTabs } from "@/components/dashboard/instructor-income-tabs";
import { Button } from "@/components/ui/button";
import {
  getCurrentInstructorIncomeCockpit,
  getCurrentInstructorIncomeOverview,
  type InstructorIncomeCockpit,
  type InstructorIncomeCockpitStat,
} from "@/lib/data/instructor-account";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

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

const nf = new Intl.NumberFormat("nl-NL", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

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

export default async function InkomstenPage() {
  const [overview, cockpit] = await Promise.all([
    getCurrentInstructorIncomeOverview(),
    getCurrentInstructorIncomeCockpit(),
  ]);
  const topStats = overview.topStats;
  const secondaryStats = overview.secondaryStats;
  const monthReceived = parseMoneyLabel(
    getStatValue(cockpit.stats, "Afgerond deze maand") ||
      getStatValue(topStats, "Afgerond deze maand"),
  );
  const pendingIncome = parseMoneyLabel(
    getStatValue(cockpit.stats, "Open lesomzet"),
  );
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
  const refunds = 0;
  const totalIncome = Math.max(monthReceived + pendingIncome, weekExpected);
  const receivedShare = getShare(monthReceived, totalIncome);
  const pendingShare = getShare(pendingIncome, totalIncome);
  const averageLessonPrice =
    getStatValue(secondaryStats, "Prijs per les") ||
    getStatValue(cockpit.stats, "Prijs per les") ||
    "Nog leeg";
  const activePackages =
    getStatValue(secondaryStats, "Actieve pakketten") || "0";
  const weekRhythm = getStatValue(secondaryStats, "Weekritme") || "0";
  const incomeSeries = buildIncomeSeries(cockpit.incomeRows, totalIncome);
  const categories = buildCategories(cockpit.incomeRows, {
    gapPotential,
    monthReceived,
    packagePortfolio,
  });
  const categoryTotal = categories.reduce(
    (sum, category) => sum + category.value,
    0,
  );
  const donutGradient = buildDonutGradient(categories);
  const overviewRows: OverviewRow[] = [
    {
      label: "Deze week",
      pending: pendingIncome,
      received: Math.min(monthReceived, weekExpected),
      refunds,
      total: weekExpected,
    },
    {
      label: "Deze maand",
      pending: pendingIncome,
      received: monthReceived,
      refunds,
      total: totalIncome,
    },
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
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-lg border-white/10 bg-white/7 px-4 text-white hover:bg-white/12"
          >
            <Link href="#inkomsten-overzicht">
              <CalendarDays className="size-4" />
              Deze maand
              <ChevronDown className="size-4" />
            </Link>
          </Button>
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <IncomeStatCard
          detail={`${formatPercentLike(totalIncome ? 15 : 0)} vs vorige maand`}
          icon={Euro}
          label="Totale inkomsten"
          tone="emerald"
          value={formatAmount(totalIncome)}
        />
        <IncomeStatCard
          detail={`${receivedShare}% van totaal`}
          icon={CreditCard}
          label="Betalingen ontvangen"
          tone="blue"
          value={formatAmount(monthReceived)}
        />
        <IncomeStatCard
          detail={`${pendingShare}% van totaal`}
          icon={Clock3}
          label="In afwachting"
          tone="amber"
          value={formatAmount(pendingIncome)}
        />
        <IncomeStatCard
          detail="Geen terugbetalingen geregistreerd"
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
                  Weergave: Week
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
                  Deze maand
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
                Deze maand
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel>
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/12 text-violet-300">
              <PackageCheck className="size-6" />
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                Actieve pakketten
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {activePackages}
              </p>
            </div>
          </div>
          <Link
            href="/instructeur/pakketten"
            className="mt-4 inline-flex text-sm text-blue-300 hover:text-blue-200"
          >
            Pakketten beheren
          </Link>
        </Panel>
        <Panel>
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/12 text-blue-300">
              <UsersRound className="size-6" />
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                Aanbodwaarde
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {formatAmount(packagePortfolio)}
              </p>
            </div>
          </div>
          <Link
            href="/instructeur/pakketten"
            className="mt-4 inline-flex text-sm text-blue-300 hover:text-blue-200"
          >
            Details bekijken
          </Link>
        </Panel>
        <Panel>
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/12 text-emerald-300">
              <CreditCard className="size-6" />
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                Prijs per les
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {averageLessonPrice}
              </p>
            </div>
          </div>
          <Link
            href="/instructeur/instellingen"
            className="mt-4 inline-flex text-sm text-blue-300 hover:text-blue-200"
          >
            Instellingen bekijken
          </Link>
        </Panel>
        <Panel>
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/12 text-amber-300">
              <TrendingUp className="size-6" />
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                Weekritme
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {weekRhythm}
              </p>
            </div>
          </div>
          <Link
            href="/instructeur/beschikbaarheid"
            className="mt-4 inline-flex text-sm text-blue-300 hover:text-blue-200"
          >
            Agenda bekijken
          </Link>
        </Panel>
      </div>

      <div id="inkomsten-cockpit">
        <InstructorIncomeTabs
          secondaryStats={secondaryStats}
          overviewSignals={overview.overviewSignals}
          cockpit={cockpit}
        />
      </div>
    </div>
  );
}

function formatPercentLike(value: number) {
  if (value === 0) {
    return "0%";
  }

  return `${value > 0 ? "+" : ""}${nf.format(value)}%`;
}
