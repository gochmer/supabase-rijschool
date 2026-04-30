"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Gauge,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react";

import { FavoriteButton } from "@/components/instructors/favorite-button";
import { LessonRequestDialog } from "@/components/instructors/lesson-request-dialog";
import { HoverTilt } from "@/components/marketing/homepage-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, getInitials } from "@/lib/format";
import { getRijlesTypeLabel } from "@/lib/lesson-types";
import type { WeeklyBookedMinutesMap } from "@/lib/self-scheduling-limits";
import type { BeschikbaarheidSlot, InstructeurProfiel, Pakket } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatTransmissionLabel(transmission: InstructeurProfiel["transmissie"]) {
  if (transmission === "handgeschakeld") {
    return "Handgeschakeld";
  }

  if (transmission === "automaat") {
    return "Automaat";
  }

  return "Automaat en schakel";
}

function getRankLabel(score: number) {
  if (score >= 4.95) {
    return "S";
  }

  if (score >= 4.8) {
    return "A";
  }

  return "B";
}

function getRankTheme(rank: string) {
  switch (rank) {
    case "S":
      return {
        accentBar: "bg-[linear-gradient(90deg,#fdba74,#ef4444,#7f1d1d)]",
        rankBadge:
          "border-red-200/24 bg-[linear-gradient(135deg,rgba(127,29,29,0.96),rgba(239,68,68,0.92))] text-red-50 shadow-[0_14px_28px_-20px_rgba(185,28,28,0.34)]",
        flashBadge: "border-orange-200/28 bg-orange-100/92 text-red-900",
        orbPrimary: "bg-red-400/20",
        orbSecondary: "bg-orange-400/16",
        scoreTint: "text-red-300",
        progress: "bg-[linear-gradient(90deg,#fdba74,#ef4444,#7f1d1d)]",
      };
    case "A":
      return {
        accentBar: "bg-[linear-gradient(90deg,#fecaca,#ef4444,#991b1b)]",
        rankBadge:
          "border-red-200/22 bg-[linear-gradient(135deg,rgba(69,10,10,0.96),rgba(185,28,28,0.9))] text-red-50 shadow-[0_14px_28px_-20px_rgba(185,28,28,0.28)]",
        flashBadge: "border-orange-200/28 bg-orange-100/90 text-red-900",
        orbPrimary: "bg-red-400/18",
        orbSecondary: "bg-orange-300/16",
        scoreTint: "text-red-300",
        progress: "bg-[linear-gradient(90deg,#fecaca,#f87171,#b91c1c)]",
      };
    default:
      return {
        accentBar: "bg-[linear-gradient(90deg,#fed7aa,#fb923c,#7f1d1d)]",
        rankBadge:
          "border-orange-200/22 bg-[linear-gradient(135deg,rgba(120,53,15,0.96),rgba(249,115,22,0.88))] text-orange-50 shadow-[0_14px_28px_-20px_rgba(249,115,22,0.24)]",
        flashBadge: "border-stone-200/28 bg-stone-100/92 text-stone-900",
        orbPrimary: "bg-red-400/16",
        orbSecondary: "bg-orange-300/14",
        scoreTint: "text-orange-300",
        progress: "bg-[linear-gradient(90deg,#fed7aa,#fb923c,#7f1d1d)]",
      };
  }
}

function formatPackageLessonsLabel(lessons: number) {
  return lessons > 0 ? `${lessons} lessen` : "Flexibel traject";
}

function formatPackagePriceLabel(price: number) {
  return price > 0 ? formatCurrency(price) : "Op aanvraag";
}

function getReviewExcerpt(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  return normalized.length > 96 ? `${normalized.slice(0, 93)}...` : normalized;
}

function shouldIgnoreCardNavigation(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      [
        "a",
        "button",
        "input",
        "textarea",
        "select",
        "[role='button']",
        "[role='combobox']",
        "[role='dialog']",
        "[data-no-card-navigation]",
      ].join(",")
    )
  );
}

function InstructorCardHeader({
  instructor,
  detailHref,
  isFavorite,
  citiesLabel,
}: {
  instructor: InstructeurProfiel;
  detailHref: string;
  isFavorite: boolean;
  citiesLabel: string;
}) {
  const topRated = instructor.beoordeling >= 4.9;

  return (
    <CardHeader className="gap-1.5 border-b border-slate-100/90 px-3 pb-2 pt-2 dark:border-white/10">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1 rounded-full border border-violet-200/70 bg-violet-50/80 px-1.5 py-0.5 text-[7px] font-semibold tracking-[0.14em] text-violet-700 uppercase shadow-[0_10px_20px_-20px_rgba(109,40,217,0.18)] dark:border-violet-300/14 dark:bg-violet-400/10 dark:text-violet-100 dark:shadow-[0_10px_20px_-20px_rgba(15,23,42,0.34)]">
          <Sparkles className="size-3" />
          Premium match
        </div>
        <FavoriteButton
          instructorId={instructor.id}
          initialIsFavorite={isFavorite}
        />
      </div>

      <div className="flex items-start gap-2.5">
        <Link
          href={detailHref}
          className={`relative flex size-10 shrink-0 items-center justify-center rounded-[0.85rem] bg-gradient-to-br ${instructor.profielfoto_kleur} text-[11px] font-semibold text-white shadow-[0_14px_24px_-22px_rgba(15,23,42,0.32)] ring-2 ring-white transition-transform hover:scale-[1.02] dark:ring-white/10 sm:size-11`}
        >
          <span className="absolute inset-0 rounded-[0.85rem] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.35),transparent_34%)]" />
          <span className="relative">{getInitials(instructor.volledige_naam)}</span>
        </Link>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-[0.93rem] leading-tight text-slate-950 dark:text-white sm:text-[0.98rem]">
                <Link href={detailHref} className="transition-colors hover:text-primary">
                  {instructor.volledige_naam}
                </Link>
              </CardTitle>
              <span className="rounded-full border border-emerald-200/70 bg-emerald-50/70 px-1.5 py-0.5 text-[7px] font-semibold tracking-[0.12em] text-emerald-700 uppercase dark:border-emerald-300/14 dark:bg-emerald-400/10 dark:text-emerald-100">
                Beschikbaar
              </span>
            </div>
            <CardDescription className="text-[10px] leading-4 text-slate-500 dark:text-slate-300">
              {citiesLabel}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-0.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200/70 bg-violet-50/90 px-1.5 py-0.5 text-[8px] font-semibold text-violet-700 shadow-[0_10px_20px_-20px_rgba(109,40,217,0.2)] dark:border-violet-300/14 dark:bg-violet-400/10 dark:text-violet-100 dark:shadow-[0_10px_20px_-20px_rgba(15,23,42,0.36)]">
              <Star className="size-3 fill-current text-current" />
              {instructor.beoordeling.toFixed(1)}
            </span>
            <span className="rounded-full border border-slate-200 bg-white/90 px-1.5 py-0.5 text-[8px] font-medium text-slate-600 shadow-[0_10px_20px_-20px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:shadow-[0_10px_20px_-20px_rgba(15,23,42,0.28)]">
              {instructor.aantal_reviews} reviews
            </span>
            <span className="rounded-full border border-slate-200 bg-white/90 px-1.5 py-0.5 text-[8px] font-medium text-slate-600 shadow-[0_10px_20px_-20px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:shadow-[0_10px_20px_-20px_rgba(15,23,42,0.28)]">
              {instructor.ervaring_jaren} jaar ervaring
            </span>
          </div>

          <div className="flex flex-wrap gap-0.5">
            {topRated ? (
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[7px] font-semibold text-emerald-700 dark:border-emerald-300/16 dark:bg-emerald-400/10 dark:text-emerald-100">
                Top beoordeeld
              </span>
            ) : null}
            {instructor.status === "goedgekeurd" ? (
              <span className="rounded-full border border-sky-100 bg-sky-50 px-1.5 py-0.5 text-[7px] font-semibold text-sky-700 dark:border-sky-300/16 dark:bg-sky-400/10 dark:text-sky-100">
                Geverifieerd
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </CardHeader>
  );
}

function InstructorCardReviewPreview({
  reviewPreview,
}: {
  reviewPreview: InstructeurProfiel["recente_review"] | null;
}) {
  if (!reviewPreview) {
    return null;
  }

  return (
    <div className="rounded-[0.9rem] border border-amber-100/90 bg-[linear-gradient(135deg,rgba(255,251,235,0.92),rgba(255,247,237,0.9))] px-2.5 py-1.5 shadow-[0_16px_28px_-24px_rgba(245,158,11,0.16)] dark:border-amber-300/12 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.16),rgba(15,23,42,0.3))] dark:shadow-[0_16px_28px_-24px_rgba(15,23,42,0.38)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[8px] font-semibold tracking-[0.14em] text-amber-700 uppercase dark:text-amber-100">
            <MessageSquareQuote className="size-3" />
            Review
          </div>
          <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-slate-950 dark:text-white">
            {reviewPreview.titel}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white/90 px-1.5 py-0.5 text-[7px] font-semibold text-amber-700 dark:border-amber-300/16 dark:bg-white/8 dark:text-amber-100">
          <Star className="size-3 fill-current text-current" />
          {reviewPreview.score}/5
        </span>
      </div>
      <p className="mt-1 line-clamp-1 text-[9px] leading-3.5 text-slate-600 dark:text-slate-300">
        &ldquo;{getReviewExcerpt(reviewPreview.tekst)}&rdquo;
      </p>
    </div>
  );
}

function InstructorCardPackagePanel({
  packageOptions,
  selectedPackage,
  selectedPackageId,
  onPackageChange,
  instructor,
}: {
  packageOptions: Pakket[];
  selectedPackage: Pakket | null;
  selectedPackageId: string;
  onPackageChange: (value: string) => void;
  instructor: InstructeurProfiel;
}) {
  if (!packageOptions.length) {
    return (
      <div className="rounded-[0.9rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.92))] p-2 shadow-[0_16px_28px_-26px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.6),rgba(30,41,59,0.4))] dark:shadow-[0_16px_28px_-26px_rgba(15,23,42,0.4)]">
        <div className="flex items-center justify-between gap-2.5">
          <div>
            <p className="text-[8px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-300">
              Lesprijs
            </p>
            <p className="mt-0.5 text-[0.95rem] font-semibold text-slate-950 dark:text-white">
              {formatCurrency(instructor.prijs_per_les)}
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white/90 px-1.5 py-0.5 text-[8px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/8 dark:text-slate-300">
            {formatTransmissionLabel(instructor.transmissie)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1 rounded-[0.85rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.92))] p-1.5 shadow-[0_16px_28px_-26px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.6),rgba(30,41,59,0.4))] dark:shadow-[0_16px_28px_-26px_rgba(15,23,42,0.4)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[8px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-300">
            Kies lespakket
          </p>
          <p className="mt-0.5 text-[9px] font-medium text-slate-700 dark:text-slate-200">
            {packageOptions.length} optie{packageOptions.length === 1 ? "" : "s"} beschikbaar
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white/90 px-1.5 py-0.5 text-[8px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/8 dark:text-slate-300">
          {formatTransmissionLabel(instructor.transmissie)}
        </div>
      </div>

      <Select value={selectedPackageId} onValueChange={onPackageChange}>
        <SelectTrigger className="h-8 w-full rounded-[0.7rem] border-slate-200 bg-white/95 text-left text-[10px] text-slate-950 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/8 dark:text-white dark:shadow-none">
          <SelectValue placeholder="Kies een pakket" />
        </SelectTrigger>
        <SelectContent className="rounded-[1rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 dark:text-white">
          {packageOptions.map((pkg) => (
            <SelectItem key={pkg.id} value={pkg.id}>
              {pkg.naam} - {formatPackageLessonsLabel(pkg.lessen)} -{" "}
              {formatPackagePriceLabel(pkg.prijs)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedPackage ? (
        <div className="rounded-[0.8rem] border border-slate-200/90 bg-white/95 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6 dark:shadow-none">
          <div className="bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(29,78,216,0.96),rgba(56,189,248,0.9))] px-2.5 py-2 text-white">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="line-clamp-1 text-[11px] font-semibold sm:text-[12px]">
                  {selectedPackage.naam}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[9px] leading-4 text-white/80">
                  {selectedPackage.beschrijving}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[0.88rem] font-semibold sm:text-[0.94rem]">
                  {formatPackagePriceLabel(selectedPackage.prijs)}
                </p>
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1">
              <span className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-2 py-0.5 text-[8px] font-medium text-white/90">
                {formatPackageLessonsLabel(selectedPackage.lessen)}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-2 py-0.5 text-[8px] font-medium text-white/90">
                {getRijlesTypeLabel(selectedPackage.les_type)}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1">
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/92 px-1.5 py-0.5 text-[7px] font-medium text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:shadow-none">
          {formatCurrency(instructor.prijs_per_les)} per les
        </span>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/92 px-1.5 py-0.5 text-[7px] font-medium text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:shadow-none">
          {formatTransmissionLabel(instructor.transmissie)}
        </span>
      </div>
    </div>
  );
}

function InstructorCardActions({
  detailHref,
  instructor,
  selectedPackage,
  availableSlots,
  directBookingEnabled,
  trialLessonAvailable,
  weeklyBookingLimitMinutes,
  bookedMinutesByWeekStart,
  weeklyRemainingMinutesThisWeek,
}: {
  detailHref: string;
  instructor: InstructeurProfiel;
  selectedPackage: Pakket | null;
  availableSlots: BeschikbaarheidSlot[];
  directBookingEnabled: boolean;
  trialLessonAvailable: boolean;
  weeklyBookingLimitMinutes?: number | null;
  bookedMinutesByWeekStart?: WeeklyBookedMinutesMap;
  weeklyRemainingMinutesThisWeek?: number | null;
}) {
  return (
      <CardFooter className="flex-col items-stretch gap-1 bg-transparent px-3 pb-2.5 pt-0">
      <LessonRequestDialog
        instructorName={instructor.volledige_naam}
        instructorSlug={instructor.slug}
        selectedPackage={selectedPackage}
        availableSlots={availableSlots}
        directBookingEnabled={directBookingEnabled}
        defaultDurationMinutes={
          selectedPackage
            ? instructor.standaard_pakketles_duur_minuten ?? 90
            : instructor.standaard_rijles_duur_minuten ?? 60
        }
        weeklyBookingLimitMinutes={weeklyBookingLimitMinutes}
        bookedMinutesByWeekStart={bookedMinutesByWeekStart}
        weeklyRemainingMinutesThisWeek={weeklyRemainingMinutesThisWeek}
        triggerLabel={selectedPackage ? "Vraag pakket aan" : "Les aanvragen"}
        triggerClassName="!h-8 !rounded-full !text-[11px] !font-semibold"
      />

      <div
        className={cn(
          "grid gap-1",
          trialLessonAvailable ? "grid-cols-2" : "grid-cols-1"
        )}
      >
        <Button asChild variant="outline" className="h-8 rounded-full px-2.5 text-[10px]">
          <Link href={detailHref}>
            Bekijk profiel
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Button>

        {trialLessonAvailable ? (
          <LessonRequestDialog
            instructorName={instructor.volledige_naam}
            instructorSlug={instructor.slug}
            requestType="proefles"
            availableSlots={availableSlots}
            directBookingEnabled={directBookingEnabled}
            defaultDurationMinutes={instructor.standaard_proefles_duur_minuten ?? 50}
            weeklyBookingLimitMinutes={weeklyBookingLimitMinutes}
            bookedMinutesByWeekStart={bookedMinutesByWeekStart}
            weeklyRemainingMinutesThisWeek={weeklyRemainingMinutesThisWeek}
            triggerLabel="Plan proefles"
            triggerVariant="secondary"
            triggerClassName="!h-8 !rounded-full !text-[11px] !font-semibold"
          />
        ) : null}
      </div>
    </CardFooter>
  );
}

export function InstructorCard({
  instructor,
  packages = [],
  availableSlots = [],
  directBookingEnabled = false,
  trialLessonAvailable = true,
  weeklyBookingLimitMinutes = null,
  bookedMinutesByWeekStart = {},
  weeklyRemainingMinutesThisWeek = null,
  detailBasePath = "/instructeurs",
  isFavorite = false,
  showPackagePanel = true,
  variant = "default",
}: {
  instructor: InstructeurProfiel;
  packages?: Pakket[];
  availableSlots?: BeschikbaarheidSlot[];
  directBookingEnabled?: boolean;
  trialLessonAvailable?: boolean;
  weeklyBookingLimitMinutes?: number | null;
  bookedMinutesByWeekStart?: WeeklyBookedMinutesMap;
  weeklyRemainingMinutesThisWeek?: number | null;
  detailBasePath?: string;
  isFavorite?: boolean;
  showPackagePanel?: boolean;
  variant?: "default" | "arcade";
}) {
  const citiesLabel = instructor.steden.join(" / ");
  const rankLabel = getRankLabel(instructor.beoordeling);
  const rankTheme = getRankTheme(rankLabel);
  const router = useRouter();
  const detailHref = `${detailBasePath}/${instructor.slug}`;
  const packageOptions = useMemo(
    () => (showPackagePanel ? packages.filter((pkg) => pkg.actief !== false) : []),
    [packages, showPackagePanel]
  );
  const [selectedPackageId, setSelectedPackageId] = useState(
    packageOptions[0]?.id ?? ""
  );
  const resolvedSelectedPackageId = packageOptions.some(
    (pkg) => pkg.id === selectedPackageId
  )
    ? selectedPackageId
    : packageOptions[0]?.id ?? "";

  const selectedPackage =
    packageOptions.find((pkg) => pkg.id === resolvedSelectedPackageId) ??
    packageOptions[0] ??
    null;
  const reviewPreview = instructor.recente_review ?? null;

  function handleCardNavigation() {
    router.push(detailHref);
  }

  function handleCardClick(event: React.MouseEvent<HTMLElement>) {
    if (shouldIgnoreCardNavigation(event.target)) {
      return;
    }

    handleCardNavigation();
  }

  function handleCardKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (shouldIgnoreCardNavigation(event.target)) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardNavigation();
    }
  }

  if (variant === "arcade") {
    return (
      <HoverTilt className="relative h-full rounded-[1.7rem] [perspective:1200px]">
        <Card
          role="link"
          tabIndex={0}
          aria-label={`Open profiel van ${instructor.volledige_naam}`}
          onClick={handleCardClick}
          onKeyDown={handleCardKeyDown}
          className="re-frame-flash re-scanlines group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.7rem] border border-red-300/14 bg-[linear-gradient(180deg,rgba(12,13,17,0.98),rgba(27,16,19,0.96),rgba(44,18,20,0.95))] shadow-[0_24px_58px_-40px_rgba(0,0,0,0.34)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_34px_76px_-42px_rgba(0,0,0,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 before:pointer-events-none before:absolute before:inset-y-0 before:right-[-22%] before:w-28 before:translate-x-[120%] before:rotate-[18deg] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] before:opacity-0 before:transition-all before:duration-700 before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.12),transparent_28%)] after:content-[''] hover:before:translate-x-[-360%] hover:before:opacity-100"
        >
          <div className={`absolute inset-x-0 top-0 h-1.5 ${rankTheme.accentBar}`} />
          <div className={`pointer-events-none absolute -right-8 top-18 size-24 rounded-full ${rankTheme.orbPrimary} blur-3xl transition-transform duration-500 group-hover:scale-125`} />
          <div className={`pointer-events-none absolute -left-10 bottom-16 size-20 rounded-full ${rankTheme.orbSecondary} blur-3xl transition-transform duration-500 group-hover:scale-125`} />
          <div className="pointer-events-none absolute inset-[1px] rounded-[1.62rem] opacity-[0.16] [background-image:linear-gradient(rgba(239,68,68,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />

          <CardHeader className="gap-3 px-5 pb-3 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-300/16 bg-[linear-gradient(135deg,rgba(127,29,29,0.96),rgba(68,16,18,0.88))] px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-red-50 uppercase shadow-[0_12px_24px_-18px_rgba(185,28,28,0.22)]">
                  <Sparkles className="size-3.5" />
                  Hazard pack
                </div>
                <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase ${rankTheme.rankBadge}`}>
                  <Trophy className="size-3" />
                  Rank {rankLabel}
                </div>
                <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase shadow-[0_12px_24px_-20px_rgba(79,70,229,0.18)] ${rankTheme.flashBadge}`}>
                  <span className="relative flex size-2 items-center justify-center">
                    <span className="absolute inline-flex size-2 animate-ping rounded-full bg-current opacity-35" />
                    <span className="relative inline-flex size-2 rounded-full bg-current" />
                  </span>
                  <Zap className="size-3" />
                  Flash ready
                </div>
              </div>
              <FavoriteButton
                instructorId={instructor.id}
                initialIsFavorite={isFavorite}
              />
            </div>

            <div className="grid gap-3 rounded-[1.3rem] border border-red-300/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(127,29,29,0.08))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-start gap-3">
                <Link
                  href={detailHref}
                  className={`relative flex size-12 shrink-0 items-center justify-center rounded-[1rem] bg-gradient-to-br ${instructor.profielfoto_kleur} text-[14px] font-semibold text-white shadow-[0_14px_26px_-20px_rgba(15,23,42,0.42)] ring-2 ring-white/90 transition-transform hover:scale-[1.02]`}
                >
                  <span className="absolute inset-0 rounded-[1rem] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.35),transparent_32%)]" />
                  <span className="relative">{getInitials(instructor.volledige_naam)}</span>
                </Link>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-[1rem] leading-tight text-white sm:text-[1.05rem]">
                      <Link
                        href={detailHref}
                        className="transition-colors hover:text-red-100"
                      >
                        {instructor.volledige_naam}
                      </Link>
                    </CardTitle>
                    <span className="rounded-full border border-orange-200/30 bg-orange-100/92 px-2 py-0.5 text-[9px] font-semibold tracking-[0.16em] text-red-900 uppercase">
                      Beschikbaar
                    </span>
                  </div>
                  <CardDescription className="text-[12px] leading-5 text-stone-400">
                    {citiesLabel}
                  </CardDescription>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-[1rem] border border-red-300/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(127,29,29,0.1))] px-3 py-2 shadow-[0_12px_28px_-24px_rgba(0,0,0,0.16)]">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
                    Match score
                  </p>
                  <div className={`mt-1 flex items-center gap-1 ${rankTheme.scoreTint}`}>
                    <Star className="size-3.5 fill-current text-current" />
                    <span className="text-[15px] font-semibold text-white">
                      {instructor.beoordeling}
                    </span>
                  </div>
                </div>

                <div className="rounded-[1rem] border border-red-300/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(127,29,29,0.1))] px-3 py-2 shadow-[0_12px_28px_-24px_rgba(0,0,0,0.16)]">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
                    XP reviews
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-white">
                    {instructor.aantal_reviews}
                  </p>
                </div>

                <div className="rounded-[1rem] border border-red-300/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(127,29,29,0.1))] px-3 py-2 shadow-[0_12px_28px_-24px_rgba(0,0,0,0.16)]">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
                    Level
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-white">
                    {instructor.ervaring_jaren} jaar
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col space-y-3 px-5 pt-0">
            <div className="rounded-[1.15rem] border border-red-300/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(127,29,29,0.1))] px-3.5 py-3 shadow-[0_18px_32px_-26px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-red-200 uppercase">
                <Gauge className="size-3.5" />
                Mission briefing
              </div>
              <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-stone-300 sm:min-h-[4rem]">
                {instructor.bio}
              </p>
            </div>

            {reviewPreview ? (
              <div className="rounded-[1.15rem] border border-orange-200/16 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(249,115,22,0.14))] px-3.5 py-3 shadow-[0_18px_32px_-26px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-orange-100 uppercase">
                    <MessageSquareQuote className="size-3.5" />
                    Laatste review
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-200/24 bg-orange-100/92 px-2 py-0.5 text-[9px] font-semibold text-red-900">
                    <Star className="size-3 fill-current text-current" />
                    {reviewPreview.score}/5
                  </span>
                </div>
                <p className="mt-2 text-[12px] font-semibold text-white">
                  {reviewPreview.titel}
                </p>
                <p className="mt-1 text-[12px] leading-5 text-stone-300">
                  &ldquo;{getReviewExcerpt(reviewPreview.tekst)}&rdquo;
                </p>
                <p className="mt-1.5 text-[10px] text-stone-400">
                  {reviewPreview.leerling_naam} / {reviewPreview.datum}
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-stone-400 uppercase">
                <ShieldCheck className="size-3.5 text-red-300" />
                Perks
              </div>
              <div className="flex min-h-[2.75rem] flex-wrap content-start gap-1.5">
                {instructor.specialisaties.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-red-300/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(127,29,29,0.12))] px-2.5 py-1 text-[10px] font-medium text-red-50 shadow-[0_10px_20px_-18px_rgba(0,0,0,0.16)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-2 rounded-[1.15rem] border border-red-300/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(127,29,29,0.08))] p-2.5 text-sm md:grid-cols-2">
              <div className="min-h-[3.4rem] rounded-[0.9rem] bg-[linear-gradient(135deg,rgba(13,14,18,0.92),rgba(38,19,21,0.88))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-[10px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
                  Prijs per beurt
                </p>
                <p className="mt-0.5 text-[17px] font-semibold text-white">
                  {formatCurrency(instructor.prijs_per_les)}
                </p>
              </div>

              <div className="min-h-[3.4rem] rounded-[0.9rem] bg-[linear-gradient(135deg,rgba(13,14,18,0.92),rgba(38,19,21,0.88))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-[10px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
                  Loadout
                </p>
                <p className="mt-0.5 text-[17px] font-semibold text-white">
                  {formatTransmissionLabel(instructor.transmissie)}
                </p>
              </div>
            </div>

            <div className="mt-auto" />
          </CardContent>

          <CardFooter className="flex-col items-stretch gap-2 bg-transparent px-5 pb-5 pt-1">
            <Button
              asChild
              variant="outline"
              className="h-10 w-full rounded-full border-red-300/14 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(127,29,29,0.14))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-white/10 hover:text-white md:w-auto md:flex-1"
            >
              <Link href={detailHref}>
                Bekijk profiel
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Button>
          <LessonRequestDialog
              instructorName={instructor.volledige_naam}
              instructorSlug={instructor.slug}
              selectedPackage={selectedPackage}
              availableSlots={availableSlots}
              directBookingEnabled={directBookingEnabled}
              defaultDurationMinutes={
                selectedPackage
                  ? instructor.standaard_pakketles_duur_minuten ?? 90
                  : instructor.standaard_rijles_duur_minuten ?? 60
              }
              weeklyBookingLimitMinutes={weeklyBookingLimitMinutes}
              bookedMinutesByWeekStart={bookedMinutesByWeekStart}
              weeklyRemainingMinutesThisWeek={weeklyRemainingMinutesThisWeek}
              triggerLabel={selectedPackage ? "Vraag pakket aan" : "Les aanvragen"}
              tone="hazard"
            />
            {trialLessonAvailable ? (
              <LessonRequestDialog
                instructorName={instructor.volledige_naam}
                instructorSlug={instructor.slug}
                requestType="proefles"
                availableSlots={availableSlots}
                directBookingEnabled={directBookingEnabled}
                defaultDurationMinutes={instructor.standaard_proefles_duur_minuten ?? 50}
                weeklyBookingLimitMinutes={weeklyBookingLimitMinutes}
                bookedMinutesByWeekStart={bookedMinutesByWeekStart}
                weeklyRemainingMinutesThisWeek={weeklyRemainingMinutesThisWeek}
                triggerLabel="Plan proefles"
                triggerVariant="secondary"
                tone="hazard"
              />
            ) : null}
          </CardFooter>
        </Card>
      </HoverTilt>
    );
  }

  return (
    <HoverTilt className="relative h-full rounded-[1.22rem] [perspective:1200px]">
      <Card
        role="link"
        tabIndex={0}
        aria-label={`Open profiel van ${instructor.volledige_naam}`}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.22rem] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,250,252,0.96),rgba(255,255,255,0.99))] shadow-[0_20px_48px_-34px_rgba(15,23,42,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_64px_-34px_rgba(15,23,42,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.88),rgba(15,23,42,0.94))] dark:shadow-[0_20px_48px_-34px_rgba(15,23,42,0.56)] dark:hover:shadow-[0_28px_64px_-34px_rgba(15,23,42,0.62)] dark:focus-visible:ring-sky-300/40 dark:focus-visible:ring-offset-slate-950"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.16),transparent_55%),radial-gradient(circle_at_top_right,rgba(196,181,253,0.16),transparent_50%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_55%),radial-gradient(circle_at_top_right,rgba(167,139,250,0.14),transparent_50%)]" />

        <InstructorCardHeader
          instructor={instructor}
          detailHref={detailHref}
          isFavorite={isFavorite}
          citiesLabel={citiesLabel}
        />

        <CardContent className="flex flex-1 flex-col space-y-1 px-3 pb-2 pt-1.5">
          <p className="line-clamp-2 text-[10px] leading-3.5 text-muted-foreground dark:text-slate-300">
            {instructor.bio}
          </p>

          <InstructorCardReviewPreview reviewPreview={reviewPreview} />

          <div className="flex flex-wrap content-start gap-0.5">
            {instructor.specialisaties.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-200 bg-white/92 px-1.5 py-0.5 text-[8px] font-medium text-slate-600 shadow-[0_8px_18px_-18px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:shadow-[0_8px_18px_-18px_rgba(15,23,42,0.34)]"
              >
                {tag}
              </span>
            ))}
          </div>

          {showPackagePanel ? (
            <InstructorCardPackagePanel
              packageOptions={packageOptions}
              selectedPackage={selectedPackage}
              selectedPackageId={selectedPackage?.id ?? ""}
              onPackageChange={setSelectedPackageId}
              instructor={instructor}
            />
          ) : null}

          <div className="mt-auto" />
        </CardContent>

          <InstructorCardActions
            detailHref={detailHref}
            instructor={instructor}
            selectedPackage={selectedPackage}
            availableSlots={availableSlots}
            directBookingEnabled={directBookingEnabled}
            trialLessonAvailable={trialLessonAvailable}
            weeklyBookingLimitMinutes={weeklyBookingLimitMinutes}
            bookedMinutesByWeekStart={bookedMinutesByWeekStart}
            weeklyRemainingMinutesThisWeek={weeklyRemainingMinutesThisWeek}
          />
      </Card>
    </HoverTilt>
  );
}
