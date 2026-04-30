"use client";

import Image from "next/image";
import { type PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import { BadgeEuro, Boxes, ImagePlus, Sparkles } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { getRijlesTypeLabel } from "@/lib/lesson-types";
import {
  clampPackageCoverFocusValue,
  getPackageCoverFocusPoint,
  getPackageCoverObjectPosition,
  getPackageCoverPositionConfig,
} from "@/lib/package-covers";
import { PRAKTIJK_EXAMEN_LABEL } from "@/lib/package-labels";
import { getPackageVisualConfig } from "@/lib/package-visuals";
import type { RijlesType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PackagePreset = {
  id: string;
  label: string;
  subtitle: string;
  naam: string;
  badge: string;
  iconKey: string;
  visualTheme: string;
  prijs: string;
  aantalLessen: string;
  weeklyBookingLimitMinutes?: string;
  beschrijving: string;
  praktijkExamenPrijs?: string;
};

export type StudioStepKey = "basis" | "prijs" | "tekst" | "beeld";

export type StudioProgressItem = {
  key: StudioStepKey;
  title: string;
  detail: string;
  complete: boolean;
  optional?: boolean;
};

export function getStudioStepMeta(step: StudioStepKey) {
  const config = {
    basis: {
      step: "01",
      title: "Basis",
      detail: "Naam, type en uitstraling",
      icon: Boxes,
      borderClass:
        "border-sky-200/90 ring-1 ring-sky-200/70 dark:border-sky-300/25 dark:ring-sky-300/18",
      accentClass:
        "from-sky-500/16 via-sky-500/10 to-transparent dark:from-sky-400/18 dark:via-sky-400/10",
      iconClass:
        "bg-sky-100 text-sky-700 dark:bg-sky-400/14 dark:text-sky-200",
      chipClass:
        "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-200",
    },
    prijs: {
      step: "02",
      title: "Prijs",
      detail: "Lessen en examenlaag",
      icon: BadgeEuro,
      borderClass:
        "border-emerald-200/90 ring-1 ring-emerald-200/70 dark:border-emerald-300/25 dark:ring-emerald-300/18",
      accentClass:
        "from-emerald-500/16 via-emerald-500/10 to-transparent dark:from-emerald-400/18 dark:via-emerald-400/10",
      iconClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/14 dark:text-emerald-200",
      chipClass:
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200",
    },
    tekst: {
      step: "03",
      title: "Tekst",
      detail: "Beschrijving en varianten",
      icon: Sparkles,
      borderClass:
        "border-indigo-200/90 ring-1 ring-indigo-200/70 dark:border-indigo-300/25 dark:ring-indigo-300/18",
      accentClass:
        "from-indigo-500/16 via-indigo-500/10 to-transparent dark:from-indigo-400/18 dark:via-indigo-400/10",
      iconClass:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-400/14 dark:text-indigo-200",
      chipClass:
        "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-300/20 dark:bg-indigo-400/10 dark:text-indigo-200",
    },
    beeld: {
      step: "04",
      title: "Beeld",
      detail: "Foto, focus en preview",
      icon: ImagePlus,
      borderClass:
        "border-amber-200/90 ring-1 ring-amber-200/70 dark:border-amber-300/25 dark:ring-amber-300/18",
      accentClass:
        "from-amber-500/16 via-amber-500/10 to-transparent dark:from-amber-400/18 dark:via-amber-400/10",
      iconClass:
        "bg-amber-100 text-amber-700 dark:bg-amber-400/14 dark:text-amber-200",
      chipClass:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-200",
    },
  } satisfies Record<
    StudioStepKey,
    {
      step: string;
      title: string;
      detail: string;
      icon: typeof Boxes;
      borderClass: string;
      accentClass: string;
      iconClass: string;
      chipClass: string;
    }
  >;

  return config[step];
}

export function getStudioProgressItems({
  naam,
  badge,
  prijs,
  aantalLessen,
  beschrijving,
  practiceExamEnabled,
  practiceExamPrice,
  hasCover,
}: {
  naam: string;
  badge: string;
  prijs: string;
  aantalLessen: string;
  beschrijving: string;
  practiceExamEnabled: boolean;
  practiceExamPrice: string;
  hasCover: boolean;
}) {
  const basisComplete = Boolean(naam.trim() && badge.trim());
  const priceComplete = Boolean(
    prijs.trim() &&
      aantalLessen.trim() &&
      (!practiceExamEnabled || practiceExamPrice.trim())
  );
  const textComplete = Boolean(beschrijving.trim());
  const imageComplete = Boolean(hasCover);

  return [
    {
      key: "basis" as const,
      title: "Basis",
      detail: basisComplete ? "Naam en badge staan klaar." : "Voeg naam en badge toe.",
      complete: basisComplete,
    },
    {
      key: "prijs" as const,
      title: "Prijs",
      detail: priceComplete
        ? "Prijslaag en lessen zijn compleet."
        : "Vul prijs, lessen en examenlaag in.",
      complete: priceComplete,
    },
    {
      key: "tekst" as const,
      title: "Tekst",
      detail: textComplete ? "Beschrijving is ingevuld." : "Voeg een beschrijving toe.",
      complete: textComplete,
    },
    {
      key: "beeld" as const,
      title: "Beeld",
      detail: imageComplete ? "Pakketfoto is toegevoegd." : "Nog geen pakketfoto toegevoegd.",
      complete: imageComplete,
      optional: true,
    },
  ] satisfies StudioProgressItem[];
}

export async function readFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("De afbeelding kon niet worden gelezen."));
    reader.readAsDataURL(file);
  });
}

export function parseLooseNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function getPackagePresets(lesType: RijlesType): PackagePreset[] {
  const presetsByType: Record<RijlesType, PackagePreset[]> = {
    auto: [
      {
        id: "starter",
        label: "Starter",
        subtitle: "rustige instap",
        naam: "Starterspakket",
        badge: "Instap",
        iconKey: "calendar",
        visualTheme: "slate",
        prijs: "549",
        aantalLessen: "10",
        weeklyBookingLimitMinutes: "60",
        beschrijving:
          "Een helder startpakket voor leerlingen die rustig willen opbouwen met vaste structuur en duidelijke vervolgstappen.",
      },
      {
        id: "examen",
        label: "Examenklaar",
        subtitle: "sterke route naar examen",
        naam: "Examenklaar pakket",
        badge: "Examenfocus",
        iconKey: "shield",
        visualTheme: "violet",
        prijs: "1299",
        aantalLessen: "24",
        weeklyBookingLimitMinutes: "120",
        praktijkExamenPrijs: "289",
        beschrijving:
          "Voor leerlingen die gericht richting praktijkexamen werken met aandacht voor examenroutes, vertrouwen en een sterke eindfase.",
      },
      {
        id: "spoed",
        label: "Spoed",
        subtitle: "meer tempo",
        naam: "Spoedtraject",
        badge: "Intensief",
        iconKey: "zap",
        visualTheme: "amber",
        prijs: "1690",
        aantalLessen: "28",
        weeklyBookingLimitMinutes: "240",
        praktijkExamenPrijs: "299",
        beschrijving:
          "Compact traject met hoger tempo, extra planningsruimte en duidelijke focus op snel maar gecontroleerd toewerken naar examen.",
      },
      {
        id: "opfris",
        label: "Opfris",
        subtitle: "zelfvertrouwen terug",
        naam: "Opfrispakket",
        badge: "Opfris",
        iconKey: "sparkles",
        visualTheme: "sky",
        prijs: "299",
        aantalLessen: "4",
        weeklyBookingLimitMinutes: "60",
        beschrijving:
          "Voor herintreders en leerlingen die hun zekerheid, routine en rust in het verkeer snel willen terugpakken.",
      },
    ],
    motor: [
      {
        id: "avb",
        label: "AVB Start",
        subtitle: "voertuigcontrole",
        naam: "Motor AVB startpakket",
        badge: "AVB",
        iconKey: "zap",
        visualTheme: "emerald",
        prijs: "849",
        aantalLessen: "8",
        weeklyBookingLimitMinutes: "120",
        beschrijving:
          "Gericht op voertuigbeheersing, balans en een sterke basis voor de AVB-onderdelen in een overzichtelijk traject.",
      },
      {
        id: "avd",
        label: "AVD Route",
        subtitle: "de weg op",
        naam: "Motor AVD traject",
        badge: "AVD",
        iconKey: "shield",
        visualTheme: "sky",
        prijs: "1199",
        aantalLessen: "12",
        weeklyBookingLimitMinutes: "120",
        praktijkExamenPrijs: "289",
        beschrijving:
          "Voor motorrijders die verkeersdeelname, kijktechniek en examengericht rijden rustig maar sterk willen opbouwen.",
      },
      {
        id: "combi",
        label: "Combi",
        subtitle: "AVB + AVD",
        naam: "Motor totaalpakket",
        badge: "Compleet",
        iconKey: "star",
        visualTheme: "violet",
        prijs: "1990",
        aantalLessen: "20",
        weeklyBookingLimitMinutes: "180",
        praktijkExamenPrijs: "329",
        beschrijving:
          "Een compleet motortraject met opbouw van voertuigcontrole tot verkeersdeelname en een duidelijke lijn richting beide examens.",
      },
      {
        id: "opstap",
        label: "Opstaples",
        subtitle: "eerste verkenning",
        naam: "Motor opstaples",
        badge: "Instap",
        iconKey: "calendar",
        visualTheme: "slate",
        prijs: "99",
        aantalLessen: "1",
        weeklyBookingLimitMinutes: "60",
        beschrijving:
          "Een eerste kennismaking voor leerlingen die willen ervaren of motorlessen bij hun tempo, houding en ambitie passen.",
      },
    ],
    vrachtwagen: [
      {
        id: "c-start",
        label: "C Start",
        subtitle: "praktische basis",
        naam: "Vrachtwagen C startpakket",
        badge: "C-rijbewijs",
        iconKey: "shield",
        visualTheme: "amber",
        prijs: "1990",
        aantalLessen: "12",
        weeklyBookingLimitMinutes: "120",
        beschrijving:
          "Voor kandidaten die een rustige maar doelgerichte basis willen leggen in voertuigbeheersing, routes en praktijkopbouw.",
      },
      {
        id: "c-examen",
        label: "C Examen",
        subtitle: "examenfocus",
        naam: "Vrachtwagen examentraject",
        badge: "Examenfocus",
        iconKey: "star",
        visualTheme: "rose",
        prijs: "2590",
        aantalLessen: "16",
        weeklyBookingLimitMinutes: "180",
        praktijkExamenPrijs: "399",
        beschrijving:
          "Voor leerlingen die strak richting praktijkexamen willen plannen met extra aandacht voor routevastheid en examenniveau.",
      },
      {
        id: "code95",
        label: "Code 95",
        subtitle: "zakelijke opbouw",
        naam: "Code 95 traject",
        badge: "Code 95",
        iconKey: "gauge",
        visualTheme: "emerald",
        prijs: "2990",
        aantalLessen: "18",
        weeklyBookingLimitMinutes: "180",
        praktijkExamenPrijs: "399",
        beschrijving:
          "Een zakelijk en duidelijk traject voor kandidaten die rijopleiding en professionele doorgroei slim willen combineren.",
      },
      {
        id: "bedrijf",
        label: "Bedrijf",
        subtitle: "maatwerk zakelijk",
        naam: "Bedrijfstraject vrachtwagen",
        badge: "Maatwerk",
        iconKey: "compass",
        visualTheme: "slate",
        prijs: "0",
        aantalLessen: "0",
        weeklyBookingLimitMinutes: "",
        beschrijving:
          "Flexibel pakket voor bedrijven of kandidaten met maatwerkbehoefte, afgestemd op planning, niveau en inzetbaarheid.",
      },
    ],
  };

  return presetsByType[lesType];
}

export function buildGeneratedPackageDescription({
  naam,
  badge,
  lesType,
  prijs,
  aantalLessen,
  praktijkExamenPrijs,
  variantIndex = 0,
}: {
  naam: string;
  badge: string;
  lesType: RijlesType;
  prijs: string;
  aantalLessen: string;
  praktijkExamenPrijs: string;
  variantIndex?: number;
}) {
  const lessonCount = Number.parseInt(aantalLessen, 10);
  const priceNumber = parseLooseNumber(prijs);
  const audienceMap: Record<RijlesType, string> = {
    auto: "leerlingen die met rust, structuur en duidelijke opbouw richting zelfstandig rijden willen groeien",
    motor: "rijders die voertuigcontrole, verkeersinzicht en examengerichte motorbegeleiding slim willen combineren",
    vrachtwagen: "kandidaten die professioneel, zeker en examengericht willen toewerken naar praktijkniveau",
  };
  const fallbackNameMap: Record<RijlesType, string> = {
    auto: "dit autopakket",
    motor: "dit motorpakket",
    vrachtwagen: "dit vrachtwagenpakket",
  };
  const focusMap: Record<RijlesType, string> = {
    auto: "verkeersinzicht, voertuigbeheersing en een rustige opbouw naar zelfstandigheid",
    motor: "balans, kijktechniek en gecontroleerde verkeersdeelname",
    vrachtwagen: "voertuigcontrole, routevastheid en professioneel rijgedrag",
  };
  const goalMap: Record<RijlesType, string> = {
    auto: "zelfstandig en ontspannen de weg op willen",
    motor: "met vertrouwen en controle het verkeer in willen",
    vrachtwagen: "zeker en examengericht richting praktijkniveau willen groeien",
  };

  const packageName = naam.trim() || fallbackNameMap[lesType];
  const cleanBadge = badge.trim();
  const badgeLead = cleanBadge ? `${cleanBadge.toLowerCase()} ` : "";
  const paceLabel =
    Number.isFinite(lessonCount) && lessonCount > 0
      ? lessonCount <= 4
        ? "compacte"
        : lessonCount <= 10
          ? "duidelijke"
          : lessonCount <= 20
            ? "gebalanceerde"
            : "uitgebreide"
      : "flexibele";
  const lessonsLine =
    Number.isFinite(lessonCount) && lessonCount > 0
      ? `met ${lessonCount} lessen als ${
          lessonCount <= 4
            ? "gerichte eerste stap"
            : lessonCount <= 10
              ? "duidelijke basis"
              : lessonCount <= 20
                ? "sterke opbouw"
                : "uitgebreide route"
        }`
      : "met een flexibel opgebouwd traject";
  const priceLine =
    priceNumber !== null
      ? `voor ${formatCurrency(priceNumber)}`
      : "met een prijs die je later nog kunt verfijnen";
  const practiceLines = praktijkExamenPrijs.trim()
    ? [
        " Inclusief ruimte om het praktijk-examen apart helder te prijzen.",
        " De praktijk-examenprijs kan daarbij netjes als losse stap worden meegenomen.",
        " Ook de examenprijs blijft in deze opzet duidelijk en professioneel communiceerbaar.",
      ]
    : [""];
  const variants = [
    `${packageName} is een ${badgeLead}traject voor ${audienceMap[lesType]}, ${lessonsLine}. Ideaal voor leerlingen die ${goalMap[lesType]}.`,
    `Met ${packageName} kies je voor een ${paceLabel} pakketopbouw ${priceLine}. Dit pakket past bij ${audienceMap[lesType]} en houdt het leertraject overzichtelijk en professioneel.`,
    `${packageName} legt de nadruk op ${focusMap[lesType]}, ${lessonsLine}. Daardoor ontstaat een pakket dat vertrouwen geeft aan leerlingen die ${goalMap[lesType]}.`,
    `Voor ${audienceMap[lesType]} biedt ${packageName} een ${paceLabel} route met duidelijke verwachtingen en een nette pakketpresentatie. Zo voelt het aanbod meteen rustiger en sterker aan op je profiel.`,
    `${packageName} is opgebouwd voor ${audienceMap[lesType]}. Je combineert ${focusMap[lesType]} met een ${paceLabel} planning, zodat het aanbod commercieel duidelijk en professioneel gepositioneerd blijft.`,
    `Wie zoekt naar een ${badgeLead}pakket voor ${goalMap[lesType]}, vindt in ${packageName} een ${paceLabel} traject ${lessonsLine}. Dat maakt de keuze voor leerlingen concreet en goed uitlegbaar.`,
  ];
  const safeVariantIndex =
    ((variantIndex % variants.length) + variants.length) % variants.length;
  const practiceLine =
    practiceLines[safeVariantIndex % practiceLines.length] ?? "";

  return `${variants[safeVariantIndex]}${practiceLine}`;
}

export function PackageCoverFocusEditor({
  imageUrl,
  imageAlt,
  positionKey,
  focusX,
  focusY,
  onChange,
  onReset,
  disabled,
}: {
  imageUrl: string;
  imageAlt: string;
  positionKey: string;
  focusX: number | null;
  focusY: number | null;
  onChange: (x: number, y: number) => void;
  onReset: () => void;
  disabled?: boolean;
}) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const preset = getPackageCoverPositionConfig(positionKey);
  const focusPoint = getPackageCoverFocusPoint(positionKey, focusX, focusY);
  const objectPosition = getPackageCoverObjectPosition(positionKey, focusX, focusY);

  function updateFocusFromPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (!previewRef.current) {
      return;
    }

    const bounds = previewRef.current.getBoundingClientRect();

    if (!bounds.width || !bounds.height) {
      return;
    }

    const nextX = clampPackageCoverFocusValue(
      ((event.clientX - bounds.left) / bounds.width) * 100
    );
    const nextY = clampPackageCoverFocusValue(
      ((event.clientY - bounds.top) / bounds.height) * 100
    );

    onChange(nextX, nextY);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updateFocusFromPointer(event);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging || disabled) {
      return;
    }

    updateFocusFromPointer(event);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDragging(false);
  }

  return (
    <div className="rounded-[1.25rem] border border-white/75 bg-white/92 p-4 shadow-[0_24px_58px_-38px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">Handmatige focus</p>
          <p className="mt-1 text-sm leading-7 text-slate-600">
            Sleep het focuspunt naar het deel van de afbeelding dat altijd in beeld moet
            blijven. Zonder handmatige focus gebruiken we automatisch de preset{" "}
            <span className="font-medium text-slate-950">{preset.label.toLowerCase()}</span>.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-full border-slate-200 bg-white dark:border-white/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/10"
          onClick={onReset}
          disabled={disabled || !focusPoint.isCustom}
        >
          Reset naar {preset.label.toLowerCase()}
        </Button>
      </div>

      <div
        ref={previewRef}
        className={cn(
          "relative mt-4 aspect-[16/7] overflow-hidden rounded-[1.2rem] border border-slate-200 bg-slate-950/5",
          disabled ? "pointer-events-none opacity-70" : "cursor-crosshair touch-none"
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 720px"
          className="select-none object-cover"
          style={{ objectPosition }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.22))]" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-white/45" />
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 border-l border-dashed border-white/45" />
        <div
          className="pointer-events-none absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-500/95 shadow-[0_12px_28px_-12px_rgba(14,165,233,0.9)]"
          style={{
            left: `${focusPoint.x}%`,
            top: `${focusPoint.y}%`,
          }}
        >
          <div className="absolute inset-1 rounded-full border border-white/80" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Badge className="border border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
          {focusPoint.isCustom ? "Handmatige focus actief" : `Preset: ${preset.label}`}
        </Badge>
        <span>X {focusPoint.x}%</span>
        <span>Y {focusPoint.y}%</span>
      </div>
    </div>
  );
}

export function PracticeExamPriceField({
  inputId,
  value,
  disabled,
  onChange,
}: {
  inputId: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor={inputId}>Prijs praktijk-examen</Label>
      <div className="rounded-[1.25rem] border border-white/75 bg-white/92 p-4 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.82),rgba(30,41,59,0.76),rgba(15,23,42,0.84))]">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem] md:items-end">
          <div>
            <p className="text-sm font-medium text-slate-950 dark:text-white">
              Geef aan wat je rekent voor het praktijk-examen
            </p>
            <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
              Vul dit alleen in als dit pakket ook een praktijk-examen als extra of inbegrepen
              prijslaag heeft. Je kunt dit later altijd wijzigen.
            </p>
          </div>
          <Input
            id={inputId}
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Bijv. 295"
            disabled={disabled}
            className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/8 dark:text-white dark:placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
}

export function PackageQuickExtrasBar({
  enabled,
  disabled,
  onTogglePracticeExam,
}: {
  enabled: boolean;
  disabled?: boolean;
  onTogglePracticeExam: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Praktijk-examen</Label>
      <div className="flex flex-wrap gap-2 rounded-[1.1rem] border border-white/75 bg-white/92 p-3 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.82),rgba(30,41,59,0.76),rgba(15,23,42,0.84))]">
        <button
          type="button"
          onClick={onTogglePracticeExam}
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
            enabled
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/18 dark:bg-emerald-400/10 dark:text-emerald-200"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/8 dark:text-slate-200 dark:hover:border-white/16 dark:hover:text-white"
          )}
        >
          <Sparkles className="size-4" />
          {enabled ? `${PRAKTIJK_EXAMEN_LABEL} aan` : PRAKTIJK_EXAMEN_LABEL}
        </button>
      </div>
    </div>
  );
}

export function PackagePresetsBar({
  lesType,
  selectedPresetId,
  disabled,
  onApplyPreset,
}: {
  lesType: RijlesType;
  selectedPresetId?: string | null;
  disabled?: boolean;
  onApplyPreset: (preset: PackagePreset) => void;
}) {
  const presets = getPackagePresets(lesType);
  const labelClass =
    "inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-700 uppercase dark:border-white/10 dark:bg-white/10 dark:text-slate-200";

  return (
    <div className="relative mt-5 overflow-hidden rounded-[1.25rem] border border-white/75 bg-white/92 p-4 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.82),rgba(30,41,59,0.76),rgba(15,23,42,0.84))]">
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-r from-slate-900/6 via-sky-500/8 to-transparent dark:from-white/6 dark:via-sky-400/10" />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className={labelClass}>
            Snelle presets
          </p>
          <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Kies een sterke basis voor {getRijlesTypeLabel(lesType).toLowerCase()} en pas hem daarna verder aan.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/8 dark:text-slate-300">
          {presets.length} templates
        </span>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {presets.map((preset) => {
          const visual = getPackageVisualConfig(preset.iconKey, preset.visualTheme);
          const isSelected = selectedPresetId === preset.id;
          const accentClass =
            preset.visualTheme === "emerald"
              ? "from-emerald-500/16 via-emerald-500/8 to-transparent dark:from-emerald-400/18 dark:via-emerald-400/8"
              : preset.visualTheme === "amber"
                ? "from-amber-500/18 via-amber-500/8 to-transparent dark:from-amber-400/20 dark:via-amber-400/8"
                : preset.visualTheme === "rose"
                  ? "from-rose-500/16 via-rose-500/8 to-transparent dark:from-rose-400/18 dark:via-rose-400/8"
                  : preset.visualTheme === "violet"
                    ? "from-violet-500/16 via-violet-500/8 to-transparent dark:from-violet-400/18 dark:via-violet-400/8"
                    : preset.visualTheme === "slate"
                      ? "from-slate-500/16 via-slate-500/8 to-transparent dark:from-slate-300/18 dark:via-slate-300/8"
                      : "from-sky-500/16 via-sky-500/8 to-transparent dark:from-sky-400/18 dark:via-sky-400/8";

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset)}
              disabled={disabled}
              className={cn(
                "relative overflow-hidden rounded-[1rem] border bg-white px-4 py-3 text-left transition-all dark:bg-white/8 dark:hover:shadow-none",
                isSelected
                  ? "border-slate-950 shadow-[0_18px_34px_-24px_rgba(15,23,42,0.24)] ring-1 ring-slate-950/8 dark:border-sky-300/35 dark:ring-sky-300/18"
                  : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_34px_-24px_rgba(15,23,42,0.2)] dark:border-white/10 dark:hover:border-white/16"
              )}
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-16 bg-gradient-to-r",
                  accentClass,
                  isSelected ? "opacity-100" : "opacity-85"
                )}
              />
              <div className="relative flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/5 dark:ring-white/10",
                    isSelected && "scale-[1.03]",
                    visual.softIconClass
                  )}
                >
                  <visual.Icon className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {preset.label}
                    </p>
                    {isSelected ? (
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-slate-700 uppercase dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                        Gekozen
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-300">
                    {preset.subtitle}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function getPresetLabelById(lesType: RijlesType, presetId: string | null) {
  if (!presetId) {
    return null;
  }

  const preset = getPackagePresets(lesType).find((item) => item.id === presetId);
  return preset ? preset.label : null;
}

export function StudioProgressOverview({
  label,
  items,
}: {
  label: string;
  items: StudioProgressItem[];
}) {
  const completedCount = items.filter((item) => item.complete).length;

  return (
    <div className="relative overflow-hidden rounded-[1.25rem] border border-slate-200/85 bg-white/94 p-4 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/8">
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-r from-slate-900/6 via-sky-500/8 to-transparent dark:from-white/6 dark:via-sky-400/10" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-700 uppercase dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
            Voortgang
          </p>
          <h3 className="mt-2 text-base font-semibold text-slate-950 dark:text-white">
            {completedCount} van 4 stappen voltooid
          </h3>
          <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {label}
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-100">
          {Math.round((completedCount / 4) * 100)}%
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a,#1d4ed8,#38bdf8)] transition-all"
          style={{ width: `${(completedCount / 4) * 100}%` }}
        />
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              "rounded-[1rem] border px-3 py-3",
              item.complete
                ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-300/20 dark:bg-emerald-400/10"
                : "border-slate-200 bg-white/95 dark:border-white/10 dark:bg-white/6"
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-[11px] font-semibold",
                  item.complete
                    ? "bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-950"
                    : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200"
                )}
              >
                {item.complete ? "OK" : getStudioStepMeta(item.key).step}
              </span>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {item.title}
              </p>
              {item.optional ? (
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-slate-600 uppercase dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                  Optioneel
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-300">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

