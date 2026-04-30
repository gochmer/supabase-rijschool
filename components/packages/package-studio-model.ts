import { formatCurrency } from "@/lib/format";
import { formatWeeklyLimitLabel } from "@/lib/self-scheduling-limits";
import type { Pakket, RijlesType } from "@/lib/types";

export function getPackageStudioMetrics(packages: Pakket[]) {
  const activeCount = packages.filter((pkg) => pkg.actief !== false).length;
  const autoCount = packages.filter((pkg) => pkg.les_type === "auto").length;
  const motorCount = packages.filter((pkg) => pkg.les_type === "motor").length;
  const vrachtwagenCount = packages.filter(
    (pkg) => pkg.les_type === "vrachtwagen"
  ).length;
  const averagePrice =
    packages.length > 0
      ? Math.round(
          packages.reduce((sum, pkg) => sum + Number(pkg.prijs ?? 0), 0) /
            packages.length
        )
      : 0;

  return {
    activeCount,
    autoCount,
    motorCount,
    vrachtwagenCount,
    averagePrice,
  };
}

export function filterPackagesByType(
  packages: Pakket[],
  typeFilter: RijlesType | "alles"
) {
  return typeFilter === "alles"
    ? packages
    : packages.filter((pkg) => pkg.les_type === typeFilter);
}

export function getPackageDraftPriceSummary({
  aantalLessen,
  prijs,
  weeklyBookingLimitMinutes,
}: {
  aantalLessen: string;
  prijs: string;
  weeklyBookingLimitMinutes: string;
}) {
  const priceValue = Number.parseFloat(prijs.replace(",", "."));
  const lessonCount = Number.parseInt(aantalLessen, 10);
  const parsedWeeklyLimit = weeklyBookingLimitMinutes.trim()
    ? Number.parseInt(weeklyBookingLimitMinutes, 10)
    : null;

  const priceLabel =
    Number.isFinite(priceValue) && priceValue > 0
      ? formatCurrency(priceValue)
      : "Nog leeg";
  const lessonsLabel =
    Number.isFinite(lessonCount) && lessonCount > 0
      ? `${lessonCount} lessen`
      : "Nog leeg";
  const pricePerLessonLabel =
    Number.isFinite(priceValue) &&
    priceValue > 0 &&
    Number.isFinite(lessonCount) &&
    lessonCount > 0
      ? formatCurrency(Math.round((priceValue / lessonCount) * 100) / 100)
      : "Nog leeg";
  const weeklyLimitLabel = formatWeeklyLimitLabel(
    parsedWeeklyLimit !== null && Number.isFinite(parsedWeeklyLimit)
      ? parsedWeeklyLimit
      : null
  );

  return {
    priceLabel,
    lessonsLabel,
    pricePerLessonLabel,
    weeklyLimitLabel,
  };
}

export function getPackageDraftReadinessItems({
  beschrijving,
  coverPreviewUrl,
  naam,
  prijs,
}: {
  beschrijving: string;
  coverPreviewUrl: string | null;
  naam: string;
  prijs: string;
}) {
  return [
    {
      label: naam.trim() ? "Naam klaar" : "Naam mist",
      complete: Boolean(naam.trim()),
    },
    {
      label: prijs.trim() ? "Prijs klaar" : "Prijs mist",
      complete: Boolean(prijs.trim()),
    },
    {
      label: beschrijving.trim() ? "Tekst klaar" : "Tekst mist",
      complete: Boolean(beschrijving.trim()),
    },
    {
      label: coverPreviewUrl ? "Foto klaar" : "Foto optioneel",
      complete: Boolean(coverPreviewUrl),
      optional: true,
    },
  ];
}
