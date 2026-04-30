"use client";

import Image from "next/image";
import Link from "next/link";
import { type ChangeEvent, type PointerEvent as ReactPointerEvent, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  BadgeEuro,
  Boxes,
  Check,
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  Pin,
  PlusCircle,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  createPackageAction,
  deletePackageAction,
  movePackageAction,
  toggleFeaturedPackageAction,
  updatePackageDetailsAction,
  updatePackageStatusAction,
} from "@/lib/actions/packages";
import { formatCurrency } from "@/lib/format";
import {
  getRijlesTypeLabel,
  rijlesTypeOptions,
} from "@/lib/lesson-types";
import {
  buildPackageCoverPath,
  clampPackageCoverFocusValue,
  getPackageCoverFocusPoint,
  getPackageCoverObjectPosition,
  getPackageCoverPositionConfig,
  getPackageCoverPositionKey,
  getPackageCoverUrl,
  packageCoverAccept,
  packageCoverPositionOptions,
  validatePackageCoverFile,
} from "@/lib/package-covers";
import {
  PRAKTIJK_EXAMEN_LABEL,
} from "@/lib/package-labels";
import {
  SELF_SCHEDULING_WEEKLY_LIMIT_PRESETS,
  formatMinutesAsHoursLabel,
  formatWeeklyLimitLabel,
} from "@/lib/self-scheduling-limits";
import {
  getPackageVisualConfig,
  packageIconOptions,
  packageThemeOptions,
} from "@/lib/package-visuals";
import { createClient } from "@/lib/supabase/client";
import type { Pakket, RijlesType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PackagePreset = {
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

type StudioStepKey = "basis" | "prijs" | "tekst" | "beeld";

type StudioProgressItem = {
  key: StudioStepKey;
  title: string;
  detail: string;
  complete: boolean;
  optional?: boolean;
};

function getStudioStepMeta(step: StudioStepKey) {
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

function getStudioProgressItems({
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

async function readFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("De afbeelding kon niet worden gelezen."));
    reader.readAsDataURL(file);
  });
}

function parseLooseNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function getPackagePresets(lesType: RijlesType): PackagePreset[] {
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

function buildGeneratedPackageDescription({
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

function getPackageTierLabel(lessons: number | null, price: number | null) {
  if ((lessons ?? 0) >= 24 || (price ?? 0) >= 1500) {
    return "Premium traject";
  }

  if ((lessons ?? 0) >= 10 || (price ?? 0) >= 650) {
    return "Middenpakket";
  }

  return "Instappakket";
}

function PackageCoverFocusEditor({
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

function PracticeExamPriceField({
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

function PackageQuickExtrasBar({
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

function PackagePresetsBar({
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

function getPresetLabelById(lesType: RijlesType, presetId: string | null) {
  if (!presetId) {
    return null;
  }

  const preset = getPackagePresets(lesType).find((item) => item.id === presetId);
  return preset ? preset.label : null;
}

function PackageInsightsPanel({
  priceLabel,
  practiceExamLabel,
  pricePerLessonLabel,
  totalValueLabel,
  tierLabel,
  className,
  accentClass,
}: {
  priceLabel: string;
  practiceExamLabel: string;
  pricePerLessonLabel: string;
  totalValueLabel: string;
  tierLabel: string;
  className?: string;
  accentClass?: string;
}) {
  const labelClass =
    "inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-700 uppercase dark:border-white/10 dark:bg-white/10 dark:text-slate-200";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.25rem] border border-white/75 bg-white/92 p-4 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.14)] transition-colors dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.82),rgba(30,41,59,0.76),rgba(15,23,42,0.84))]",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-14 bg-gradient-to-r from-slate-900/6 via-sky-500/8 to-transparent dark:from-white/6 dark:via-sky-400/10",
          accentClass
        )}
      />
      <div>
        <p className={labelClass}>
          Slim pakketinzicht
        </p>
        <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Zie direct hoe je pakket commercieel overkomt en waar prijs, waarde en opbouw nu staan.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pakketprijs", value: priceLabel },
          { label: "Praktijk-examen", value: practiceExamLabel },
          { label: "Prijs per les", value: pricePerLessonLabel },
          { label: "Positie", value: tierLabel },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[1rem] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/8"
          >
            <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
              {item.label}
            </p>
            <p className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-white">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-[1rem] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/8">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
          Totale waarde met praktijk-examen
        </p>
        <p className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-white">
          {totalValueLabel}
        </p>
      </div>
    </div>
  );
}

function StudioProgressOverview({
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

export function PackageStudio({
  packages,
  scope,
  publicProfilePath,
  showDashboardSummary = true,
}: {
  packages: Pakket[];
  scope: "admin" | "instructeur";
  publicProfilePath?: string;
  showDashboardSummary?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [typeFilter, setTypeFilter] = useState<RijlesType | "alles">("alles");
  const [naam, setNaam] = useState("");
  const [lesType, setLesType] = useState<RijlesType>("auto");
  const [badge, setBadge] = useState("");
  const [iconKey, setIconKey] = useState("sparkles");
  const [visualTheme, setVisualTheme] = useState("sky");
  const [coverPosition, setCoverPosition] = useState("center");
  const [coverFocusX, setCoverFocusX] = useState<number | null>(null);
  const [coverFocusY, setCoverFocusY] = useState<number | null>(null);
  const [prijs, setPrijs] = useState("");
  const [hasPracticeExam, setHasPracticeExam] = useState(false);
  const [praktijkExamenPrijs, setPraktijkExamenPrijs] = useState("");
  const [aantalLessen, setAantalLessen] = useState("10");
  const [weeklyBookingLimitMinutes, setWeeklyBookingLimitMinutes] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [descriptionVariantIndex, setDescriptionVariantIndex] = useState(0);
  const [selectedCreatePresetId, setSelectedCreatePresetId] = useState<string | null>(null);
  const [activeStudioStep, setActiveStudioStep] = useState<StudioStepKey>("basis");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [editNaam, setEditNaam] = useState("");
  const [editLesType, setEditLesType] = useState<RijlesType>("auto");
  const [editBadge, setEditBadge] = useState("");
  const [editIconKey, setEditIconKey] = useState("sparkles");
  const [editVisualTheme, setEditVisualTheme] = useState("sky");
  const [editCoverPosition, setEditCoverPosition] = useState("center");
  const [editCoverFocusX, setEditCoverFocusX] = useState<number | null>(null);
  const [editCoverFocusY, setEditCoverFocusY] = useState<number | null>(null);
  const [editPrijs, setEditPrijs] = useState("");
  const [editHasPracticeExam, setEditHasPracticeExam] = useState(false);
  const [editPraktijkExamenPrijs, setEditPraktijkExamenPrijs] = useState("");
  const [editAantalLessen, setEditAantalLessen] = useState("10");
  const [editWeeklyBookingLimitMinutes, setEditWeeklyBookingLimitMinutes] = useState("");
  const [editBeschrijving, setEditBeschrijving] = useState("");
  const [editDescriptionVariantIndex, setEditDescriptionVariantIndex] = useState(0);
  const [selectedEditPresetId, setSelectedEditPresetId] = useState<string | null>(null);
  const [activeEditStudioStep, setActiveEditStudioStep] = useState<StudioStepKey>("basis");
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPath, setEditCoverPath] = useState<string | null>(null);
  const [editCoverPreviewUrl, setEditCoverPreviewUrl] = useState<string | null>(null);
  const [editCoverChanged, setEditCoverChanged] = useState(false);
  const createBasisRef = useRef<HTMLDivElement | null>(null);
  const createPrijsRef = useRef<HTMLDivElement | null>(null);
  const createTekstRef = useRef<HTMLDivElement | null>(null);
  const createBeeldRef = useRef<HTMLDivElement | null>(null);
  const editBasisRef = useRef<HTMLDivElement | null>(null);
  const editPrijsRef = useRef<HTMLDivElement | null>(null);
  const editTekstRef = useRef<HTMLDivElement | null>(null);
  const editBeeldRef = useRef<HTMLDivElement | null>(null);

  const activeCount = packages.filter((pkg) => pkg.actief !== false).length;
  const autoCount = packages.filter((pkg) => pkg.les_type === "auto").length;
  const motorCount = packages.filter((pkg) => pkg.les_type === "motor").length;
  const vrachtwagenCount = packages.filter((pkg) => pkg.les_type === "vrachtwagen").length;
  const filteredPackages =
    typeFilter === "alles"
      ? packages
      : packages.filter((pkg) => pkg.les_type === typeFilter);
  const averagePrice =
    packages.length > 0
      ? Math.round(
          packages.reduce((sum, pkg) => sum + Number(pkg.prijs ?? 0), 0) / packages.length
        )
      : 0;
  const isBusy = isPending || isUploadingCover;
  const createVisual = getPackageVisualConfig(iconKey, visualTheme);
  const editVisual = getPackageVisualConfig(editIconKey, editVisualTheme);
  const showPracticeExamPriceField = hasPracticeExam || Boolean(praktijkExamenPrijs.trim());
  const showEditPracticeExamPriceField =
    editHasPracticeExam || Boolean(editPraktijkExamenPrijs.trim());
  const createPriceNumber = parseLooseNumber(prijs);
  const createPracticeExamNumber = showPracticeExamPriceField
    ? parseLooseNumber(praktijkExamenPrijs)
    : null;
  const createLessonsNumber = Number.parseInt(aantalLessen, 10);
  const createPricePerLesson =
    createPriceNumber !== null && Number.isFinite(createLessonsNumber) && createLessonsNumber > 0
      ? formatCurrency(createPriceNumber / createLessonsNumber)
      : "Nog niet compleet";
  const createTotalValue =
    createPriceNumber !== null
      ? formatCurrency(createPriceNumber + (createPracticeExamNumber ?? 0))
      : "Nog niet compleet";
  const createTier = getPackageTierLabel(createLessonsNumber, createPriceNumber);
  const createCoverObjectPosition = getPackageCoverObjectPosition(
    coverPosition,
    coverFocusX,
    coverFocusY
  );
  const editCoverObjectPosition = getPackageCoverObjectPosition(
    editCoverPosition,
    editCoverFocusX,
    editCoverFocusY
  );
  const selectedCreatePresetLabel = getPresetLabelById(lesType, selectedCreatePresetId);
  const selectedEditPresetLabel = getPresetLabelById(editLesType, selectedEditPresetId);
  const activeStudioStepMeta = getStudioStepMeta(activeStudioStep);
  const activeEditStudioStepMeta = getStudioStepMeta(activeEditStudioStep);
  const createProgressItems = getStudioProgressItems({
    naam,
    badge,
    prijs,
    aantalLessen,
    beschrijving,
    practiceExamEnabled: showPracticeExamPriceField,
    practiceExamPrice: praktijkExamenPrijs,
    hasCover: Boolean(coverPreviewUrl),
  });
  const editProgressItems = getStudioProgressItems({
    naam: editNaam,
    badge: editBadge,
    prijs: editPrijs,
    aantalLessen: editAantalLessen,
    beschrijving: editBeschrijving,
    practiceExamEnabled: showEditPracticeExamPriceField,
    practiceExamPrice: editPraktijkExamenPrijs,
    hasCover: Boolean(editCoverPreviewUrl),
  });
  const createProgressMap = Object.fromEntries(
    createProgressItems.map((item) => [item.key, item.complete])
  ) as Record<StudioStepKey, boolean>;
  const editProgressMap = Object.fromEntries(
    editProgressItems.map((item) => [item.key, item.complete])
  ) as Record<StudioStepKey, boolean>;

  function scrollStepIntoView(element: HTMLDivElement | null) {
    element?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleCreateStepSelect(step: StudioStepKey) {
    setActiveStudioStep(step);

    const stepRefs = {
      basis: createBasisRef,
      prijs: createPrijsRef,
      tekst: createTekstRef,
      beeld: createBeeldRef,
    } as const;

    scrollStepIntoView(stepRefs[step].current);
  }

  function handleEditStepSelect(step: StudioStepKey) {
    setActiveEditStudioStep(step);

    const stepRefs = {
      basis: editBasisRef,
      prijs: editPrijsRef,
      tekst: editTekstRef,
      beeld: editBeeldRef,
    } as const;

    scrollStepIntoView(stepRefs[step].current);
  }

  function resetForm() {
    setNaam("");
    setLesType("auto");
    setBadge("");
    setIconKey("sparkles");
    setVisualTheme("sky");
    setCoverPosition("center");
    setCoverFocusX(null);
    setCoverFocusY(null);
    setPrijs("");
    setHasPracticeExam(false);
    setPraktijkExamenPrijs("");
    setAantalLessen("10");
    setWeeklyBookingLimitMinutes("");
    setBeschrijving("");
    setDescriptionVariantIndex(0);
    setSelectedCreatePresetId(null);
    setActiveStudioStep("basis");
    setCoverFile(null);
    setCoverPreviewUrl(null);
  }

  function applyCreatePreset(preset: PackagePreset) {
    setSelectedCreatePresetId(preset.id);
    setActiveStudioStep("basis");
    setNaam(preset.naam);
    setBadge(preset.badge);
    setIconKey(preset.iconKey);
    setVisualTheme(preset.visualTheme);
    setPrijs(preset.prijs);
    setAantalLessen(preset.aantalLessen);
    setWeeklyBookingLimitMinutes(preset.weeklyBookingLimitMinutes ?? "");
    setBeschrijving(preset.beschrijving);
    setDescriptionVariantIndex(0);
    const nextPracticeExamPrice = preset.praktijkExamenPrijs ?? "";
    setHasPracticeExam(Boolean(nextPracticeExamPrice));
    setPraktijkExamenPrijs(nextPracticeExamPrice);
  }

  function generateCreateDescription() {
    setActiveStudioStep("tekst");
    setBeschrijving(
      buildGeneratedPackageDescription({
        naam,
        badge,
        lesType,
        prijs,
        aantalLessen,
        praktijkExamenPrijs: showPracticeExamPriceField ? praktijkExamenPrijs : "",
        variantIndex: descriptionVariantIndex,
      })
    );
    setDescriptionVariantIndex((current) => current + 1);
  }

  function applyEditPreset(preset: PackagePreset) {
    setSelectedEditPresetId(preset.id);
    setActiveEditStudioStep("basis");
    setEditNaam(preset.naam);
    setEditBadge(preset.badge);
    setEditIconKey(preset.iconKey);
    setEditVisualTheme(preset.visualTheme);
    setEditPrijs(preset.prijs);
    setEditAantalLessen(preset.aantalLessen);
    setEditWeeklyBookingLimitMinutes(preset.weeklyBookingLimitMinutes ?? "");
    setEditBeschrijving(preset.beschrijving);
    setEditDescriptionVariantIndex(0);
    const nextPracticeExamPrice = preset.praktijkExamenPrijs ?? "";
    setEditHasPracticeExam(Boolean(nextPracticeExamPrice));
    setEditPraktijkExamenPrijs(nextPracticeExamPrice);
  }

  function generateEditDescription() {
    setActiveEditStudioStep("tekst");
    setEditBeschrijving(
      buildGeneratedPackageDescription({
        naam: editNaam,
        badge: editBadge,
        lesType: editLesType,
        prijs: editPrijs,
        aantalLessen: editAantalLessen,
        praktijkExamenPrijs: showEditPracticeExamPriceField ? editPraktijkExamenPrijs : "",
        variantIndex: editDescriptionVariantIndex,
      })
    );
    setEditDescriptionVariantIndex((current) => current + 1);
  }

  async function uploadPackageCover(file: File) {
    const validation = validatePackageCoverFile(file);

    if (!validation.success) {
      return validation;
    }

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false as const,
        message: "Je sessie is verlopen. Log opnieuw in en upload daarna opnieuw.",
      };
    }

    const coverPath = buildPackageCoverPath(user.id, file.name);
    const { data, error } = await supabase.storage.from("package-covers").upload(
      coverPath,
      file,
      {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      }
    );

    if (error || !data?.path) {
      return {
        success: false as const,
        message: "De pakketcover kon niet worden geüpload.",
      };
    }

    return {
      success: true as const,
      coverPath: data.path,
      coverUrl: getPackageCoverUrl(data.path),
    };
  }

  async function handleCreateCoverChange(event: ChangeEvent<HTMLInputElement>) {
    setActiveStudioStep("beeld");
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validation = validatePackageCoverFile(file);

    if (!validation.success) {
      toast.error(validation.message);
      event.target.value = "";
      return;
    }

    try {
      const previewUrl = await readFileAsDataUrl(file);
      setCoverFile(file);
      setCoverPreviewUrl(previewUrl);
      setCoverFocusX(null);
      setCoverFocusY(null);
      event.target.value = "";
    } catch {
      toast.error("De gekozen cover kon niet worden gelezen.");
    }
  }

  function clearCreateCover() {
    setCoverFile(null);
    setCoverPreviewUrl(null);
    setCoverFocusX(null);
    setCoverFocusY(null);
  }

  function togglePracticeExam(
    currentValue: boolean,
    setValue: (value: boolean) => void,
    clearPrice: (value: string) => void
  ) {
    if (currentValue) {
      setValue(false);
      clearPrice("");
      return;
    }

    setValue(true);
  }

  async function handleCreatePackage() {
    let uploadedCoverPath: string | null = null;

    if (coverFile) {
      setIsUploadingCover(true);
      const uploadResult = await uploadPackageCover(coverFile);
      setIsUploadingCover(false);

      if (!uploadResult.success) {
        toast.error(uploadResult.message);
        return;
      }

      uploadedCoverPath = uploadResult.coverPath;
    }

    startTransition(async () => {
      const result = await createPackageAction({
        naam,
        lesType,
        badge,
        iconKey,
        visualTheme,
        coverPosition,
        coverFocusX,
        coverFocusY,
        prijs,
        praktijkExamenPrijs: showPracticeExamPriceField ? praktijkExamenPrijs : "",
        aantalLessen,
        weeklyBookingLimitMinutes,
        beschrijving,
        coverPath: uploadedCoverPath,
      });

      if (result.success) {
        resetForm();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleUpdateStatus(packageId: string, nextActive: boolean) {
    startTransition(async () => {
      const result = await updatePackageStatusAction(packageId, nextActive);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDeletePackage(packageId: string) {
    startTransition(async () => {
      const result = await deletePackageAction(packageId);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleToggleFeatured(packageId: string, nextFeatured: boolean) {
    startTransition(async () => {
      const result = await toggleFeaturedPackageAction(packageId, nextFeatured);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleMovePackage(packageId: string, direction: "up" | "down") {
    startTransition(async () => {
      const result = await movePackageAction(packageId, direction);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function openEditDialog(pkg: Pakket) {
    setEditingPackageId(pkg.id);
    setActiveEditStudioStep("basis");
    setSelectedEditPresetId(null);
    setEditDescriptionVariantIndex(0);
    setEditNaam(pkg.naam);
    setEditLesType(pkg.les_type);
    setEditBadge(pkg.badge ?? "");
    setEditIconKey(pkg.icon_key ?? "sparkles");
    setEditVisualTheme(pkg.visual_theme ?? "sky");
    setEditCoverPosition(getPackageCoverPositionKey(pkg.cover_position));
    setEditCoverFocusX(pkg.cover_focus_x ?? null);
    setEditCoverFocusY(pkg.cover_focus_y ?? null);
    setEditPrijs(String(pkg.prijs ?? 0));
    setEditWeeklyBookingLimitMinutes(
      pkg.zelf_inplannen_limiet_minuten_per_week != null
        ? String(pkg.zelf_inplannen_limiet_minuten_per_week)
        : ""
    );
    setEditHasPracticeExam(
      pkg.praktijk_examen_prijs !== null && pkg.praktijk_examen_prijs !== undefined
    );
    setEditPraktijkExamenPrijs(
      pkg.praktijk_examen_prijs !== null && pkg.praktijk_examen_prijs !== undefined
        ? String(pkg.praktijk_examen_prijs)
        : ""
    );
    setEditAantalLessen(String(pkg.lessen ?? 0));
    setEditBeschrijving(pkg.beschrijving ?? "");
    setEditCoverFile(null);
    setEditCoverPath(pkg.cover_path ?? null);
    setEditCoverPreviewUrl(pkg.cover_url ?? null);
    setEditCoverChanged(false);
  }

  function closeEditDialog() {
    setEditingPackageId(null);
    setActiveEditStudioStep("basis");
    setSelectedEditPresetId(null);
    setEditDescriptionVariantIndex(0);
    setEditLesType("auto");
    setEditCoverFile(null);
    setEditCoverPath(null);
    setEditCoverPreviewUrl(null);
    setEditCoverChanged(false);
    setEditCoverPosition("center");
    setEditCoverFocusX(null);
    setEditCoverFocusY(null);
    setEditHasPracticeExam(false);
    setEditPraktijkExamenPrijs("");
    setEditWeeklyBookingLimitMinutes("");
  }

  async function handleEditCoverChange(event: ChangeEvent<HTMLInputElement>) {
    setActiveEditStudioStep("beeld");
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validation = validatePackageCoverFile(file);

    if (!validation.success) {
      toast.error(validation.message);
      event.target.value = "";
      return;
    }

    try {
      const previewUrl = await readFileAsDataUrl(file);
      setEditCoverFile(file);
      setEditCoverPreviewUrl(previewUrl);
      setEditCoverChanged(true);
      setEditCoverFocusX(null);
      setEditCoverFocusY(null);
      event.target.value = "";
    } catch {
      toast.error("De gekozen cover kon niet worden gelezen.");
    }
  }

  function clearEditCover() {
    setEditCoverFile(null);
    setEditCoverPath(null);
    setEditCoverPreviewUrl(null);
    setEditCoverChanged(true);
    setEditCoverFocusX(null);
    setEditCoverFocusY(null);
  }

  async function handleSavePackageEdit() {
    if (!editingPackageId) {
      return;
    }

    let nextCoverPath: string | null | undefined;

    if (editCoverChanged) {
      if (editCoverFile) {
        setIsUploadingCover(true);
        const uploadResult = await uploadPackageCover(editCoverFile);
        setIsUploadingCover(false);

        if (!uploadResult.success) {
          toast.error(uploadResult.message);
          return;
        }

        nextCoverPath = uploadResult.coverPath;
      } else {
        nextCoverPath = editCoverPath;
      }
    }

    startTransition(async () => {
      const result = await updatePackageDetailsAction(editingPackageId, {
        naam: editNaam,
        lesType: editLesType,
        badge: editBadge,
        iconKey: editIconKey,
        visualTheme: editVisualTheme,
        coverPosition: editCoverPosition,
        coverFocusX: editCoverFocusX,
        coverFocusY: editCoverFocusY,
        prijs: editPrijs,
        praktijkExamenPrijs: showEditPracticeExamPriceField ? editPraktijkExamenPrijs : "",
        aantalLessen: editAantalLessen,
        weeklyBookingLimitMinutes: editWeeklyBookingLimitMinutes,
        beschrijving: editBeschrijving,
        coverChanged: editCoverChanged,
        coverPath: editCoverChanged ? (nextCoverPath ?? null) : editCoverPath,
      });

      if (result.success) {
        closeEditDialog();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="package-studio space-y-6">
      {showDashboardSummary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Totaal pakketten",
              value: `${packages.length}`,
              icon: Boxes,
            },
            {
              label: "Actief zichtbaar",
              value: `${activeCount}`,
              icon: Sparkles,
            },
            {
              label: "Voertuigmix",
              value: `${autoCount} auto / ${motorCount} motor / ${vrachtwagenCount} vrachtwagen`,
              icon: Pin,
            },
            {
              label: "Gemiddelde prijs",
              value: packages.length ? formatCurrency(averagePrice) : "Nog leeg",
              icon: BadgeEuro,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="relative overflow-hidden rounded-[1.45rem] border border-white/80 bg-white/88 p-4 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_20px_60px_-40px_rgba(15,23,42,0.56)]"
            >
              <div className="absolute inset-x-0 top-0 h-18 bg-gradient-to-r from-sky-500/12 via-transparent to-emerald-500/8" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-slate-950/6 text-primary dark:bg-white/10 dark:text-sky-200">
                    <item.icon className="size-4" />
                  </div>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                    {item.label}
                  </p>
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/90 p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-sky-500/10 via-transparent to-emerald-500/8" />
      <div className="relative">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/82 uppercase">
              Nieuwe pakketten
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Voeg een nieuw pakket toe aan je aanbod
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              {scope === "instructeur"
                ? "Nieuwe pakketten worden direct gekoppeld aan jouw instructeursprofiel en kunnen zichtbaar worden op je openbare pagina."
                : "Maak hier platformpakketten aan die je centraal in het systeem kunt beheren."}
            </p>
          </div>
          {scope === "instructeur" && publicProfilePath ? (
            <Button asChild variant="outline" className="rounded-full border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
              <Link href={publicProfilePath}>Open je openbare profiel</Link>
            </Button>
          ) : null}
        </div>

        <PackagePresetsBar
          lesType={lesType}
          selectedPresetId={selectedCreatePresetId}
          disabled={isBusy}
          onApplyPreset={applyCreatePreset}
        />

        {selectedCreatePresetLabel ? (
          <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm text-emerald-800 shadow-[0_14px_30px_-22px_rgba(16,185,129,0.35)] dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200">
            <Sparkles className="size-4" />
            <span className="font-medium">
              Preset actief: <span className="font-semibold">{selectedCreatePresetLabel}</span>
            </span>
          </div>
        ) : null}

        <div className="mt-5">
          <StudioProgressOverview
            label="Werk je pakket stap voor stap uit en zie meteen welke bouwstenen nog aandacht nodig hebben."
            items={createProgressItems}
          />
        </div>

        <div className="mt-5 rounded-[1.35rem] border border-slate-200/80 bg-slate-50/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {[
              {
                key: "basis" as StudioStepKey,
                step: "01",
                title: "Basis",
                detail: "Naam, type en uitstraling",
                icon: Boxes,
              },
              {
                key: "prijs" as StudioStepKey,
                step: "02",
                title: "Prijs",
                detail: "Lessen en examenlaag",
                icon: BadgeEuro,
              },
              {
                key: "tekst" as StudioStepKey,
                step: "03",
                title: "Tekst",
                detail: "Beschrijving en varianten",
                icon: Sparkles,
              },
              {
                key: "beeld" as StudioStepKey,
                step: "04",
                title: "Beeld",
                detail: "Foto, focus en preview",
                icon: ImagePlus,
              },
            ].map((item) => (
              <button
                key={item.step}
                type="button"
                onClick={() => handleCreateStepSelect(item.key)}
                className={cn(
                  "flex min-w-[13rem] flex-1 items-start gap-3 rounded-[1rem] border px-3.5 py-3 text-left transition-all",
                  activeStudioStep === item.key
                    ? `bg-white shadow-[0_18px_34px_-24px_rgba(15,23,42,0.2)] dark:bg-white/10 ${getStudioStepMeta(item.key).borderClass}`
                    : "border-white/85 bg-white/92 dark:border-white/10 dark:bg-white/8"
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                    activeStudioStep === item.key
                      ? getStudioStepMeta(item.key).iconClass
                      : "bg-slate-950/6 text-primary dark:bg-white/10 dark:text-sky-200"
                  )}
                >
                  <item.icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase dark:text-slate-300">
                      Stap {item.step}
                    </p>
                    {createProgressMap[item.key] ? (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-950">
                        <Check className="size-3" />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-300">
                    {item.detail}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="space-y-4">
            <div
              ref={createBasisRef}
              className={cn(
                "relative scroll-mt-6 overflow-hidden rounded-[1.35rem] border bg-white/94 p-4 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.18)] transition-all dark:bg-white/6",
                activeStudioStep === "basis"
                  ? getStudioStepMeta("basis").borderClass
                  : "border-white/85 dark:border-white/10"
              )}
              onClick={() => setActiveStudioStep("basis")}
              onPointerEnter={() => setActiveStudioStep("basis")}
              onFocusCapture={() => setActiveStudioStep("basis")}
            >
              <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-r from-slate-900/6 via-sky-500/8 to-transparent dark:from-white/6 dark:via-sky-400/10" />
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950/6 text-primary dark:bg-white/10 dark:text-sky-200">
                  <Boxes className="size-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase dark:text-slate-300">
                    Stap 01
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                      Basis
                    </h3>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-slate-700 uppercase dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                      Naam, type en uitstraling
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Kies een naam, type, badge en visuele stijl die direct duidelijk maken voor wie dit pakket is.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="package_name">Pakketnaam</Label>
                  <Input
                    id="package_name"
                    value={naam}
                    onChange={(event) => setNaam(event.target.value)}
                    placeholder="Bijv. Starterspakket of Examentraject"
                    className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="package_type">Rijlestype</Label>
                  <select
                    id="package_type"
                    value={lesType}
                    onChange={(event) => {
                      setSelectedCreatePresetId(null);
                      setLesType(event.target.value as RijlesType);
                    }}
                    className="native-select h-11 w-full rounded-xl px-3 text-sm"
                  >
                    {rijlesTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="package_badge">Hoofdbadge</Label>
                  <Input
                    id="package_badge"
                    value={badge}
                    onChange={(event) => setBadge(event.target.value)}
                    placeholder="Bijv. Populair, Examenfocus of Instap"
                    className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="package_icon">Pakketicoon</Label>
                  <select
                    id="package_icon"
                    value={iconKey}
                    onChange={(event) => setIconKey(event.target.value)}
                    className="native-select h-11 w-full rounded-xl px-3 text-sm"
                  >
                    {packageIconOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="package_theme">Kleurthema</Label>
                  <select
                    id="package_theme"
                    value={visualTheme}
                    onChange={(event) => setVisualTheme(event.target.value)}
                    className="native-select h-11 w-full rounded-xl px-3 text-sm"
                  >
                    {packageThemeOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div
              ref={createPrijsRef}
              className={cn(
                "relative scroll-mt-6 overflow-hidden rounded-[1.35rem] border bg-white/94 p-4 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.18)] transition-all dark:bg-white/6",
                activeStudioStep === "prijs"
                  ? getStudioStepMeta("prijs").borderClass
                  : "border-white/85 dark:border-white/10"
              )}
              onClick={() => setActiveStudioStep("prijs")}
              onPointerEnter={() => setActiveStudioStep("prijs")}
              onFocusCapture={() => setActiveStudioStep("prijs")}
            >
              <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-r from-slate-900/6 via-sky-500/8 to-transparent dark:from-white/6 dark:via-sky-400/10" />
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950/6 text-primary dark:bg-white/10 dark:text-sky-200">
                  <BadgeEuro className="size-4" />
                </div>
                <div>
                  <p className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-700 uppercase dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                    Stap 02
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                    Prijs
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Zet prijs, lessen en praktijk-examenlaag op één plek zodat je pakket direct goed leesbaar wordt.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="package_price">Prijs in euro</Label>
                  <Input
                    id="package_price"
                    type="number"
                    min="0"
                    step="1"
                    value={prijs}
                    onChange={(event) => setPrijs(event.target.value)}
                    placeholder="699"
                    className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="package_lessons">Aantal lessen</Label>
                  <Input
                    id="package_lessons"
                    type="number"
                    min="0"
                    step="1"
                    value={aantalLessen}
                    onChange={(event) => setAantalLessen(event.target.value)}
                    placeholder="10"
                    className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="package_weekly_booking_limit">
                    Zelf plannen per week
                  </Label>
                  <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-wrap gap-2">
                      {SELF_SCHEDULING_WEEKLY_LIMIT_PRESETS.map((minutes) => (
                        <Button
                          key={`create-limit-${minutes}`}
                          type="button"
                          variant={
                            Number(weeklyBookingLimitMinutes) === minutes
                              ? "default"
                              : "outline"
                          }
                          className="h-8 rounded-full px-3 text-[11px]"
                          onClick={() => setWeeklyBookingLimitMinutes(String(minutes))}
                        >
                          {formatMinutesAsHoursLabel(minutes)}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant={
                          !weeklyBookingLimitMinutes.trim() ? "default" : "outline"
                        }
                        className="h-8 rounded-full px-3 text-[11px]"
                        onClick={() => setWeeklyBookingLimitMinutes("")}
                      >
                        Onbeperkt
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                      <div className="space-y-2">
                        <Input
                          id="package_weekly_booking_limit"
                          type="number"
                          min="30"
                          max="1440"
                          step="15"
                          value={weeklyBookingLimitMinutes}
                          onChange={(event) =>
                            setWeeklyBookingLimitMinutes(event.target.value)
                          }
                          placeholder="Bijvoorbeeld 120"
                          className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                        />
                        <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                          Leerlingen met dit pakket volgen automatisch deze weekruimte zolang je
                          geen handmatige leerling-override instelt.
                        </p>
                      </div>
                      <Badge variant="info">
                        {formatWeeklyLimitLabel(
                          weeklyBookingLimitMinutes.trim()
                            ? Number.parseInt(weeklyBookingLimitMinutes, 10)
                            : null
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <PackageQuickExtrasBar
                    enabled={showPracticeExamPriceField}
                    disabled={isBusy}
                    onTogglePracticeExam={() =>
                      togglePracticeExam(
                        showPracticeExamPriceField,
                        setHasPracticeExam,
                        setPraktijkExamenPrijs
                      )
                    }
                  />
                </div>
                {showPracticeExamPriceField ? (
                  <PracticeExamPriceField
                    inputId="package_practice_exam_price"
                    value={praktijkExamenPrijs}
                    onChange={setPraktijkExamenPrijs}
                    disabled={isBusy}
                  />
                ) : null}
              </div>
            </div>

            <div
              ref={createTekstRef}
              className={cn(
                "relative scroll-mt-6 overflow-hidden rounded-[1.35rem] border bg-white/94 p-4 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.18)] transition-all dark:bg-white/6",
                activeStudioStep === "tekst"
                  ? getStudioStepMeta("tekst").borderClass
                  : "border-white/85 dark:border-white/10"
              )}
              onClick={() => setActiveStudioStep("tekst")}
              onPointerEnter={() => setActiveStudioStep("tekst")}
              onFocusCapture={() => setActiveStudioStep("tekst")}
            >
              <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-r from-slate-900/6 via-sky-500/8 to-transparent dark:from-white/6 dark:via-sky-400/10" />
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950/6 text-primary dark:bg-white/10 dark:text-sky-200">
                  <Sparkles className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-700 uppercase dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                    Stap 03
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                    Tekst
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Gebruik handmatige tekst of laat een nieuwe variant maken voor een andere commerciële invalshoek.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex flex-col gap-3 rounded-[1.1rem] border border-sky-200/80 bg-sky-50/85 p-3 dark:border-sky-400/20 dark:bg-sky-500/10 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Label
                      htmlFor="package_description"
                      className="text-slate-950 dark:text-white"
                    >
                      Beschrijving
                    </Label>
                    <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">
                      Laat direct een nieuwe tekstvariant maken die beter past bij dit pakket.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-sky-200 bg-white text-sky-700 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-300/25 dark:bg-white/10 dark:text-sky-100 dark:hover:bg-white/16"
                    onClick={generateCreateDescription}
                    disabled={isBusy}
                  >
                    <Sparkles className="size-4" />
                    {beschrijving.trim() ? "Nieuwe variant" : "Beschrijving genereren"}
                  </Button>
                </div>
                <Textarea
                  id="package_description"
                  value={beschrijving}
                  onChange={(event) => setBeschrijving(event.target.value)}
                  placeholder="Beschrijf kort voor wie dit pakket bedoeld is en wat erin zit."
                  className="min-h-32 rounded-[1.1rem] border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div
              className={cn(
                "relative overflow-hidden rounded-[1.25rem] border bg-white/92 p-4 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.14)] transition-all dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.82),rgba(30,41,59,0.76),rgba(15,23,42,0.84))]",
                activeStudioStepMeta.borderClass
              )}
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-14 bg-gradient-to-r",
                  activeStudioStepMeta.accentClass
                )}
              />
              <div className="relative flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                    activeStudioStepMeta.iconClass
                  )}
                >
                  <activeStudioStepMeta.icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase",
                      activeStudioStepMeta.chipClass
                    )}
                  >
                    Actieve stap
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                    Stap {activeStudioStepMeta.step} · {activeStudioStepMeta.title}
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {activeStudioStepMeta.detail}. De rechter previewlaag laat nu meteen zien hoe
                    deze keuze doorwerkt in je pakketpresentatie.
                  </p>
                </div>
              </div>
            </div>

            <PackageInsightsPanel
              priceLabel={
                createPriceNumber !== null ? formatCurrency(createPriceNumber) : "Nog niet ingevuld"
              }
              practiceExamLabel={
                createPracticeExamNumber !== null
                  ? formatCurrency(createPracticeExamNumber)
                  : showPracticeExamPriceField
                    ? "Nog niet ingevuld"
                    : "Niet actief"
              }
              pricePerLessonLabel={createPricePerLesson}
              totalValueLabel={createTotalValue}
              tierLabel={createTier}
              className={activeStudioStepMeta.borderClass}
              accentClass={activeStudioStepMeta.accentClass}
            />

            <div
              className={cn(
                "relative overflow-hidden rounded-[1.25rem] border bg-white/92 p-4 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.14)] transition-all dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.82),rgba(30,41,59,0.76),rgba(15,23,42,0.84))]",
                activeStudioStepMeta.borderClass
              )}
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-12 bg-gradient-to-r",
                  activeStudioStepMeta.accentClass
                )}
              />
              <p className="relative inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-700 uppercase dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                Studiotip
              </p>
              <div className="mt-3 space-y-3">
                {[
                  "Een heldere pakketnaam en badge zorgen dat leerlingen sneller begrijpen wat ze kiezen.",
                  "Prijs, aantal lessen en praktijk-examenlaag vormen samen je commerciële basis.",
                  "Een eigen foto maakt het pakket direct sterker op je profiel en in kaarten.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1rem] border border-slate-200 bg-white/95 px-3 py-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/8 dark:text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          ref={createBeeldRef}
          className={cn(
            "relative mt-5 scroll-mt-6 overflow-hidden rounded-[1.35rem] border bg-white/94 p-4 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.18)] transition-all dark:bg-white/6",
            activeStudioStep === "beeld"
              ? getStudioStepMeta("beeld").borderClass
              : "border-white/85 dark:border-white/10"
          )}
          onClick={() => setActiveStudioStep("beeld")}
          onPointerEnter={() => setActiveStudioStep("beeld")}
          onFocusCapture={() => setActiveStudioStep("beeld")}
        >
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-r from-slate-900/6 via-sky-500/8 to-transparent dark:from-white/6 dark:via-sky-400/10" />
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950/6 text-primary dark:bg-white/10 dark:text-sky-200">
              <ImagePlus className="size-4" />
            </div>
            <div>
              <p className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-700 uppercase dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                Stap 04
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                Beeld
              </h3>
              <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Upload een eigen pakketfoto, kies de focus en zie meteen hoe de kaart straks op je profiel verschijnt.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(320px,1.08fr)]">
            <div className="space-y-4">
              <div className="space-y-2 rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                <Label htmlFor="package_cover">Pakketfoto</Label>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      Geef je pakket een eigen foto
                    </p>
                    <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      JPG, PNG, WebP of AVIF tot 5 MB. Deze pakketfoto komt terug in het dashboard en op de openbare pakketkaarten.
                    </p>
                  </div>
                  {coverPreviewUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                      onClick={clearCreateCover}
                      disabled={isBusy}
                    >
                      <X className="size-4" />
                      Verwijder foto
                    </Button>
                  ) : null}
                </div>
                <input
                  id="package_cover"
                  type="file"
                  accept={packageCoverAccept}
                  onChange={handleCreateCoverChange}
                  disabled={isBusy}
                  className="mt-2 block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                />
              </div>

              <div className="space-y-2 rounded-[1.25rem] border border-white/75 bg-white/92 p-4 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.82),rgba(30,41,59,0.76),rgba(15,23,42,0.84))]">
                <Label htmlFor="package_cover_position">Coverpositie</Label>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Kies welk deel van de foto voorrang krijgt op de pakketkaart.
                </p>
                <select
                  id="package_cover_position"
                  value={coverPosition}
                  onChange={(event) => setCoverPosition(event.target.value)}
                  className="native-select h-11 w-full rounded-xl px-3 text-sm"
                >
                  {packageCoverPositionOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div
                className={cn(
                  "overflow-hidden rounded-[1.35rem] border text-slate-950 dark:text-slate-950",
                  createVisual.softCardClass
                )}
              >
                {coverPreviewUrl ? (
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={coverPreviewUrl}
                      alt={naam ? `Coverpreview voor ${naam}` : "Coverpreview voor pakket"}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 720px"
                      className="object-cover"
                      style={{ objectPosition: createCoverObjectPosition }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 border-b border-black/5 px-4 py-3 text-xs font-medium tracking-[0.18em] text-slate-500 uppercase dark:border-white/10">
                    <ImagePlus className="size-4" />
                    Nog geen pakketfoto
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                        createVisual.softIconClass
                      )}
                    >
                      <createVisual.Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-950">
                          {naam || "Live preview van je pakket"}
                        </p>
                        <Badge className="border border-slate-200 bg-white text-slate-700">
                          {getRijlesTypeLabel(lesType)}
                        </Badge>
                        {badge ? (
                          <Badge className="border border-slate-200 bg-white text-slate-700">
                            {badge}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-7 text-slate-600">
                        {beschrijving ||
                          "Zo ziet je gekozen icoon, kleurthema en eventuele pakketfoto er straks uit op je pakketkaart."}
                      </p>
                      {praktijkExamenPrijs.trim() ? (
                        <p className="mt-2 text-sm font-medium text-slate-700">
                          Praktijk-examen: {formatCurrency(Number(praktijkExamenPrijs))}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {coverPreviewUrl ? (
                <PackageCoverFocusEditor
                  imageUrl={coverPreviewUrl}
                  imageAlt={naam ? `Focuseditor voor ${naam}` : "Focuseditor voor pakketcover"}
                  positionKey={coverPosition}
                  focusX={coverFocusX}
                  focusY={coverFocusY}
                  onChange={(x, y) => {
                    setCoverFocusX(x);
                    setCoverFocusY(y);
                  }}
                  onReset={() => {
                    setCoverFocusX(null);
                    setCoverFocusY(null);
                  }}
                  disabled={isBusy}
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-7 text-slate-500">
            Tip: geef elk pakket een eigen foto, zodat leerlingen sneller vertrouwen voelen en je
            aanbod direct professioneler oogt.
          </p>
          <Button
            className="h-11 rounded-full bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] text-white"
            onClick={handleCreatePackage}
            disabled={isBusy}
          >
            <PlusCircle className="size-4" />
            {isUploadingCover ? "Cover uploaden..." : isPending ? "Opslaan..." : "Pakket toevoegen"}
          </Button>
        </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/90 p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-slate-500/10 via-transparent to-sky-500/8" />
        <div className="relative">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-slate-700 uppercase dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
              Bestaand aanbod
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Beheer je pakketten vanuit een duidelijk overzicht
            </h2>
            <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Activeer, pauzeer of verwijder pakketten zodra je aanbod verandert.
            </p>
          </div>
          <Badge className="border border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
            {scope === "instructeur" ? "Gekoppeld aan jouw profiel" : "Platformaanbod"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.84fr)_minmax(320px,1.16fr)]">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Totaal",
                value: `${packages.length}`,
                hint: "Hele aanbod",
              },
              {
                label: "Nu zichtbaar",
                value: `${activeCount}`,
                hint: "Actieve pakketten",
              },
              {
                label: "In filter",
                value: `${filteredPackages.length}`,
                hint: typeFilter === "alles" ? "Alles in beeld" : "Geselecteerde categorie",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.1rem] border border-white/85 bg-white/92 px-3.5 py-3 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/8"
              >
                <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                  {item.label}
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                  {item.hint}
                </p>
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-[1.1rem] border border-white/85 bg-white/92 p-3 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/8">
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-r from-slate-900/6 via-sky-500/8 to-transparent dark:from-white/6 dark:via-sky-400/10" />
            <p className="relative inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-700 uppercase dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
              Filter op type
            </p>
            <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-300">
              Houd de studio rustiger door alleen het deel van je aanbod te tonen waar je nu aan werkt.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { value: "alles", label: "Alles" },
                ...rijlesTypeOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                })),
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTypeFilter(option.value as RijlesType | "alles")}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    typeFilter === option.value
                      ? "border-slate-950 bg-slate-950 text-white dark:border-sky-300/30 dark:bg-white/10"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/16 dark:hover:text-white"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredPackages.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {filteredPackages.map((pkg, index) => {
              const isActive = pkg.actief !== false;
              const isLeadCard = pkg.uitgelicht || index === 0;
              const previousIsFeatured =
                index > 0 ? Boolean(filteredPackages[index - 1]?.uitgelicht) : false;
              const disableMoveUp =
                typeFilter !== "alles" ||
                index === 0 ||
                pkg.uitgelicht ||
                previousIsFeatured;
              const disableMoveDown =
                typeFilter !== "alles" ||
                index === filteredPackages.length - 1 ||
                pkg.uitgelicht;
              const visual = getPackageVisualConfig(pkg.icon_key, pkg.visual_theme);
              const pkgCoverObjectPosition = getPackageCoverObjectPosition(
                pkg.cover_position,
                pkg.cover_focus_x,
                pkg.cover_focus_y
              );

              return (
                <div
                  key={pkg.id}
                  className={cn(
                    "overflow-hidden rounded-[1.55rem] border p-5 shadow-[0_20px_52px_-36px_rgba(15,23,42,0.22)] transition-shadow",
                    isLeadCard ? visual.featuredCardClass : visual.softCardClass
                  )}
                >
                  {pkg.cover_url ? (
                    <div className="relative -mx-1 -mt-1 mb-4 h-40 overflow-hidden rounded-[1.35rem]">
                      <Image
                        src={pkg.cover_url}
                        alt={`Cover voor ${pkg.naam}`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                        style={{ objectPosition: pkgCoverObjectPosition }}
                      />
                      <div
                        className={cn(
                          "absolute inset-0",
                          isLeadCard
                            ? "bg-gradient-to-t from-slate-950/65 via-slate-950/18 to-transparent"
                            : "bg-gradient-to-t from-slate-950/30 via-slate-950/10 to-transparent"
                        )}
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "mb-4 flex h-40 flex-col items-center justify-center rounded-[1.35rem] border border-dashed text-center",
                        isLeadCard
                          ? "border-white/18 bg-white/6 text-white/74"
                          : "border-slate-200 bg-slate-50/90 text-slate-500 dark:border-white/10 dark:bg-white/6 dark:text-slate-300"
                      )}
                    >
                      <ImagePlus className="size-7" />
                      <p className="mt-3 text-sm font-semibold">Nog geen pakketfoto</p>
                      <p className="mt-1 max-w-[16rem] text-xs leading-6">
                        Open dit pakket en voeg een foto toe om je kaart sterker te maken.
                      </p>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div
                          className={cn(
                            "mr-1 flex size-10 items-center justify-center rounded-2xl",
                            isLeadCard ? visual.featuredIconClass : visual.softIconClass
                          )}
                        >
                          <visual.Icon className="size-4" />
                        </div>
                        <p className="text-lg font-semibold">{pkg.naam}</p>
                        <Badge
                          className={cn(
                            "border",
                            isLeadCard ? visual.featuredBadgeClass : visual.softBadgeClass
                          )}
                        >
                          {getRijlesTypeLabel(pkg.les_type)}
                        </Badge>
                        {pkg.uitgelicht ? (
                          <Badge
                            className={cn(
                              "border",
                              isLeadCard ? visual.featuredBadgeClass : visual.softBadgeClass
                            )}
                          >
                            Uitgelicht
                          </Badge>
                        ) : null}
                        {pkg.badge ? (
                          <Badge
                            className={cn(
                              "border",
                              isLeadCard ? visual.featuredBadgeClass : visual.softBadgeClass
                            )}
                          >
                            {pkg.badge}
                          </Badge>
                        ) : null}
                      </div>
                      <p
                        className={cn(
                          "mt-2 text-sm leading-7",
                          isLeadCard ? "text-white/78" : "text-slate-600"
                        )}
                      >
                        {pkg.beschrijving || "Nog geen beschrijving toegevoegd."}
                      </p>
                      {pkg.praktijk_examen_prijs !== null &&
                      pkg.praktijk_examen_prijs !== undefined ? (
                        <p
                          className={cn(
                            "mt-3 text-sm font-medium",
                            isLeadCard ? "text-white/82" : "text-slate-700"
                          )}
                        >
                          Praktijk-examen: {formatCurrency(pkg.praktijk_examen_prijs)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={isActive ? "success" : "info"}>
                        {isActive ? "actief" : "gepauzeerd"}
                      </Badge>
                      <Badge
                        className={cn(
                          "border",
                          isLeadCard
                            ? "border-white/16 bg-white/10 text-white"
                            : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/8 dark:text-slate-200"
                        )}
                      >
                        {pkg.cover_url ? "Foto ingesteld" : "Nog geen foto"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <div
                      className={cn(
                        "rounded-[1.2rem] border p-4",
                        isLeadCard
                          ? "border-white/12 bg-white/10"
                          : "border-slate-200 bg-white/95 dark:border-white/10 dark:bg-white/8"
                      )}
                    >
                      <p
                        className={cn(
                          "text-[11px] font-semibold tracking-[0.16em] uppercase",
                          isLeadCard ? "text-white/65" : "text-slate-500"
                        )}
                      >
                        Prijs
                      </p>
                      <p className="mt-2 text-xl font-semibold">
                        {pkg.prijs ? formatCurrency(pkg.prijs) : "Op aanvraag"}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "rounded-[1.2rem] border p-4",
                        isLeadCard
                          ? "border-white/12 bg-white/10"
                          : "border-slate-200 bg-white/95 dark:border-white/10 dark:bg-white/8"
                      )}
                    >
                      <p
                        className={cn(
                          "text-[11px] font-semibold tracking-[0.16em] uppercase",
                          isLeadCard ? "text-white/65" : "text-slate-500"
                        )}
                      >
                        Inbegrepen lessen
                      </p>
                      <p className="mt-2 text-xl font-semibold">{pkg.lessen || "Flexibel"}</p>
                    </div>
                    <div
                      className={cn(
                        "rounded-[1.2rem] border p-4",
                        isLeadCard
                          ? "border-white/12 bg-white/10"
                          : "border-slate-200 bg-white/95 dark:border-white/10 dark:bg-white/8"
                      )}
                    >
                      <p
                        className={cn(
                          "text-[11px] font-semibold tracking-[0.16em] uppercase",
                          isLeadCard ? "text-white/65" : "text-slate-500"
                        )}
                      >
                        Zelf plannen per week
                      </p>
                      <p className="mt-2 text-base font-semibold">
                        {formatWeeklyLimitLabel(
                          pkg.zelf_inplannen_limiet_minuten_per_week ?? null
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4 dark:border-white/10">
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "rounded-full",
                        isLeadCard
                          ? "border-white/20 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                          : "border-slate-200 bg-white"
                      )}
                      onClick={() => handleToggleFeatured(pkg.id, !pkg.uitgelicht)}
                      disabled={isBusy}
                    >
                      <Pin className="size-4" />
                      {pkg.uitgelicht ? "Niet uitgelicht" : "Zet uitgelicht"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "rounded-full",
                        isLeadCard
                          ? "border-white/20 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                          : "border-slate-200 bg-white"
                      )}
                      onClick={() => handleMovePackage(pkg.id, "up")}
                      disabled={isBusy || disableMoveUp}
                    >
                      <ArrowUp className="size-4" />
                      Omhoog
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "rounded-full",
                        isLeadCard
                          ? "border-white/20 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                          : "border-slate-200 bg-white"
                      )}
                      onClick={() => handleMovePackage(pkg.id, "down")}
                      disabled={isBusy || disableMoveDown}
                    >
                      <ArrowDown className="size-4" />
                      Omlaag
                    </Button>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 border-t border-black/5 pt-4 sm:flex-row sm:flex-wrap dark:border-white/10">
                    <Button
                      variant="outline"
                      className={cn(
                        "rounded-full",
                        isLeadCard
                          ? "border-white/20 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                          : "border-slate-200 bg-white"
                      )}
                      onClick={() => openEditDialog(pkg)}
                      disabled={isBusy}
                    >
                      <ImagePlus className="size-4" />
                      Foto wijzigen
                    </Button>
                    <Button
                      variant="outline"
                      className={cn(
                        "rounded-full",
                        isLeadCard
                          ? "border-white/20 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                          : "border-slate-200 bg-white"
                      )}
                      onClick={() => openEditDialog(pkg)}
                      disabled={isBusy}
                    >
                      <Edit3 className="size-4" />
                      Inhoud wijzigen
                    </Button>
                    <Button
                      variant="outline"
                      className={cn(
                        "rounded-full",
                        isLeadCard
                          ? "border-white/20 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                          : "border-slate-200 bg-white"
                      )}
                      onClick={() => handleUpdateStatus(pkg.id, !isActive)}
                      disabled={isBusy}
                    >
                      {isActive ? (
                        <>
                          <EyeOff className="size-4" />
                          Pauzeren
                        </>
                      ) : (
                        <>
                          <Eye className="size-4" />
                          Activeren
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      className={cn(isLeadCard ? "bg-white/12 text-white hover:bg-white/20" : "")}
                      onClick={() => handleDeletePackage(pkg.id)}
                      disabled={isBusy}
                    >
                      <Trash2 className="size-4" />
                      Verwijderen
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.55rem] border border-dashed border-slate-200 bg-slate-50/90 p-6 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            {typeFilter === "alles"
              ? "Je hebt nog geen pakketten toegevoegd. Zodra je hier je eerste pakket maakt, kun je het direct laten terugkomen in je aanbod en op de instructeurspagina."
              : `Je hebt nog geen ${getRijlesTypeLabel(typeFilter).toLowerCase()}-pakketten toegevoegd. Maak hierboven een nieuw pakket aan om deze categorie te vullen.`}
          </div>
        )}
        </div>
      </div>

      <Dialog open={editingPackageId !== null} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto border border-slate-200 bg-white p-0 shadow-[0_32px_90px_-54px_rgba(15,23,42,0.36)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white dark:shadow-[0_32px_90px_-54px_rgba(15,23,42,0.72)]">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-slate-950 dark:text-white">Pakketinformatie en foto bewerken</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-300">
                Werk naam, prijs, lessen, beschrijving en pakketfoto bij zonder het pakket opnieuw te maken.
              </DialogDescription>
            </DialogHeader>

            <PackagePresetsBar
              lesType={editLesType}
              selectedPresetId={selectedEditPresetId}
              disabled={isBusy}
              onApplyPreset={applyEditPreset}
            />

            {selectedEditPresetLabel ? (
              <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm text-emerald-800 shadow-[0_14px_30px_-22px_rgba(16,185,129,0.35)] dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                <Sparkles className="size-4" />
                <span className="font-medium">
                  Preset actief: <span className="font-semibold">{selectedEditPresetLabel}</span>
                </span>
              </div>
            ) : null}

            <div className="mt-5">
              <StudioProgressOverview
                label="Zie direct hoeveel van dit bestaande pakket al strak staat en welke stap je nog kunt aanscherpen."
                items={editProgressItems}
              />
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-slate-200/80 bg-slate-50/80 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-white/10 dark:bg-white/5">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {(["basis", "prijs", "tekst", "beeld"] as StudioStepKey[]).map((step) => {
                  const meta = getStudioStepMeta(step);

                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => handleEditStepSelect(step)}
                      className={cn(
                        "flex items-start gap-3 rounded-[1rem] border px-3 py-3 text-left transition-all",
                        activeEditStudioStep === step
                          ? `bg-white shadow-[0_18px_34px_-24px_rgba(15,23,42,0.2)] dark:bg-white/10 ${meta.borderClass}`
                          : "border-white/85 bg-white/92 dark:border-white/10 dark:bg-white/8"
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-2xl",
                          activeEditStudioStep === step
                            ? meta.iconClass
                            : "bg-slate-950/6 text-primary dark:bg-white/10 dark:text-sky-200"
                        )}
                      >
                        <meta.icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase dark:text-slate-300">
                            Stap {meta.step}
                          </p>
                          {editProgressMap[step] ? (
                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-950">
                              <Check className="size-3" />
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                          {meta.title}
                        </p>
                        <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-300">
                          {meta.detail}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={cn(
                "relative mt-4 overflow-hidden rounded-[1.2rem] border bg-white/92 p-4 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.14)] transition-all dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.82),rgba(30,41,59,0.76),rgba(15,23,42,0.84))]",
                activeEditStudioStepMeta.borderClass
              )}
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-12 bg-gradient-to-r",
                  activeEditStudioStepMeta.accentClass
                )}
              />
              <div className="relative flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                    activeEditStudioStepMeta.iconClass
                  )}
                >
                  <activeEditStudioStepMeta.icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase",
                      activeEditStudioStepMeta.chipClass
                    )}
                  >
                    Actieve stap
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                    Stap {activeEditStudioStepMeta.step} - {activeEditStudioStepMeta.title}
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {activeEditStudioStepMeta.detail}. Werk dit deel bij en controleer daarna direct
                    de live preview van je bestaande pakket.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div ref={editBasisRef} className="space-y-2 scroll-mt-4">
                <Label htmlFor="edit_package_name">Pakketnaam</Label>
                <Input
                  id="edit_package_name"
                  value={editNaam}
                  onChange={(event) => setEditNaam(event.target.value)}
                  onFocus={() => setActiveEditStudioStep("basis")}
                  className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_package_type">Rijlestype</Label>
                <select
                  id="edit_package_type"
                  value={editLesType}
                  onChange={(event) => {
                    setActiveEditStudioStep("basis");
                    setSelectedEditPresetId(null);
                    setEditLesType(event.target.value as RijlesType);
                  }}
                  className="native-select h-11 w-full rounded-xl px-3 text-sm"
                >
                  {rijlesTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_package_badge">Hoofdbadge</Label>
                <Input
                  id="edit_package_badge"
                  value={editBadge}
                  onChange={(event) => setEditBadge(event.target.value)}
                  onFocus={() => setActiveEditStudioStep("basis")}
                  className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              <div
                ref={editPrijsRef}
                className="scroll-mt-4"
                onPointerEnter={() => setActiveEditStudioStep("prijs")}
                onFocusCapture={() => setActiveEditStudioStep("prijs")}
              >
                <PackageQuickExtrasBar
                  enabled={showEditPracticeExamPriceField}
                  disabled={isBusy}
                  onTogglePracticeExam={() =>
                    togglePracticeExam(
                      showEditPracticeExamPriceField,
                      setEditHasPracticeExam,
                      setEditPraktijkExamenPrijs
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_package_icon">Pakketicoon</Label>
                <select
                  id="edit_package_icon"
                  value={editIconKey}
                  onChange={(event) => setEditIconKey(event.target.value)}
                  onFocus={() => setActiveEditStudioStep("basis")}
                  className="native-select h-11 w-full rounded-xl px-3 text-sm"
                >
                  {packageIconOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_package_theme">Kleurthema</Label>
                <select
                  id="edit_package_theme"
                  value={editVisualTheme}
                  onChange={(event) => setEditVisualTheme(event.target.value)}
                  onFocus={() => setActiveEditStudioStep("basis")}
                  className="native-select h-11 w-full rounded-xl px-3 text-sm"
                >
                  {packageThemeOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_package_price">Prijs in euro</Label>
                <Input
                  id="edit_package_price"
                  type="number"
                  min="0"
                  step="1"
                  value={editPrijs}
                  onChange={(event) => setEditPrijs(event.target.value)}
                  onFocus={() => setActiveEditStudioStep("prijs")}
                  className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_package_lessons">Aantal lessen</Label>
                <Input
                  id="edit_package_lessons"
                  type="number"
                  min="0"
                  step="1"
                  value={editAantalLessen}
                  onChange={(event) => setEditAantalLessen(event.target.value)}
                  onFocus={() => setActiveEditStudioStep("prijs")}
                  className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit_package_weekly_booking_limit">
                  Zelf plannen per week
                </Label>
                <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap gap-2">
                    {SELF_SCHEDULING_WEEKLY_LIMIT_PRESETS.map((minutes) => (
                      <Button
                        key={`edit-limit-${minutes}`}
                        type="button"
                        variant={
                          Number(editWeeklyBookingLimitMinutes) === minutes
                            ? "default"
                            : "outline"
                        }
                        className="h-8 rounded-full px-3 text-[11px]"
                        onClick={() => setEditWeeklyBookingLimitMinutes(String(minutes))}
                      >
                        {formatMinutesAsHoursLabel(minutes)}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant={
                        !editWeeklyBookingLimitMinutes.trim() ? "default" : "outline"
                      }
                      className="h-8 rounded-full px-3 text-[11px]"
                      onClick={() => setEditWeeklyBookingLimitMinutes("")}
                    >
                      Onbeperkt
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <div className="space-y-2">
                      <Input
                        id="edit_package_weekly_booking_limit"
                        type="number"
                        min="30"
                        max="1440"
                        step="15"
                        value={editWeeklyBookingLimitMinutes}
                        onChange={(event) =>
                          setEditWeeklyBookingLimitMinutes(event.target.value)
                        }
                        onFocus={() => setActiveEditStudioStep("prijs")}
                        placeholder="Bijvoorbeeld 120"
                        className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                      <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                        Deze pakketlimiet wordt automatisch gebruikt voor leerlingen zonder
                        handmatige leerling-override.
                      </p>
                    </div>
                    <Badge variant="info">
                      {formatWeeklyLimitLabel(
                        editWeeklyBookingLimitMinutes.trim()
                          ? Number.parseInt(editWeeklyBookingLimitMinutes, 10)
                          : null
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
              {showEditPracticeExamPriceField ? (
                <PracticeExamPriceField
                  inputId="edit_package_practice_exam_price"
                  value={editPraktijkExamenPrijs}
                  onChange={setEditPraktijkExamenPrijs}
                  disabled={isBusy}
                />
              ) : null}
              <div ref={editTekstRef} className="space-y-3 scroll-mt-4 md:col-span-2">
                <div className="flex flex-col gap-3 rounded-[1.1rem] border border-sky-200/80 bg-sky-50/85 p-3 dark:border-sky-400/20 dark:bg-sky-500/10 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Label
                      htmlFor="edit_package_description"
                      className="text-slate-950 dark:text-white"
                    >
                      Beschrijving
                    </Label>
                    <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">
                      Laat direct een nieuwe tekstvariant maken die beter past bij dit bestaande pakket.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-sky-200 bg-white text-sky-700 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-300/25 dark:bg-white/10 dark:text-sky-100 dark:hover:bg-white/16"
                    onClick={generateEditDescription}
                    disabled={isBusy}
                  >
                    <Sparkles className="size-4" />
                    {editBeschrijving.trim() ? "Nieuwe variant" : "Beschrijving genereren"}
                  </Button>
                </div>
                <Textarea
                  id="edit_package_description"
                  value={editBeschrijving}
                  onChange={(event) => setEditBeschrijving(event.target.value)}
                  onFocus={() => setActiveEditStudioStep("tekst")}
                  className="min-h-28 rounded-[1.1rem] border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              <div
                ref={editBeeldRef}
                className="space-y-2 scroll-mt-4 md:col-span-2"
                onPointerEnter={() => setActiveEditStudioStep("beeld")}
                onFocusCapture={() => setActiveEditStudioStep("beeld")}
              >
                <Label htmlFor="edit_package_cover">Pakketfoto</Label>
                <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">
                        Werk de pakketfoto van dit pakket bij
                      </p>
                      <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        Upload een nieuwe afbeelding of haal de huidige pakketfoto weg als je
                        weer terug wilt naar de pure icon-stijl.
                      </p>
                    </div>
                    {editCoverPreviewUrl ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                        onClick={clearEditCover}
                        disabled={isBusy}
                      >
                        <X className="size-4" />
                        Verwijder foto
                      </Button>
                    ) : null}
                  </div>
                  <input
                    id="edit_package_cover"
                    type="file"
                    accept={packageCoverAccept}
                    onChange={handleEditCoverChange}
                    disabled={isBusy}
                    className="mt-4 block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  />
                </div>
              </div>
              <div
                className="space-y-2 md:col-span-2"
                onPointerEnter={() => setActiveEditStudioStep("beeld")}
                onFocusCapture={() => setActiveEditStudioStep("beeld")}
              >
                <Label htmlFor="edit_package_cover_position">Coverpositie</Label>
                <select
                  id="edit_package_cover_position"
                  value={editCoverPosition}
                  onChange={(event) => setEditCoverPosition(event.target.value)}
                  onFocus={() => setActiveEditStudioStep("beeld")}
                  className="native-select h-11 w-full rounded-xl px-3 text-sm"
                >
                  {packageCoverPositionOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
              <div
                className="md:col-span-2"
                onPointerEnter={() => setActiveEditStudioStep("beeld")}
                onFocusCapture={() => setActiveEditStudioStep("beeld")}
              >
                <div
                  className={cn(
                    "overflow-hidden rounded-[1.35rem] border text-slate-950 dark:text-slate-950",
                    editVisual.softCardClass
                  )}
                >
                  {editCoverPreviewUrl ? (
                    <div className="relative h-44 overflow-hidden">
                      <Image
                        src={editCoverPreviewUrl}
                        alt={editNaam ? `Coverpreview voor ${editNaam}` : "Coverpreview voor pakket"}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 720px"
                        className="object-cover"
                        style={{ objectPosition: editCoverObjectPosition }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 border-b border-black/5 px-4 py-3 text-xs font-medium tracking-[0.18em] text-slate-500 uppercase">
                      <ImagePlus className="size-4" />
                      Nog geen pakketfoto
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                          editVisual.softIconClass
                        )}
                      >
                        <editVisual.Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-950">
                            {editNaam || "Live preview van je pakket"}
                          </p>
                          <Badge className="border border-slate-200 bg-white text-slate-700">
                            {getRijlesTypeLabel(editLesType)}
                          </Badge>
                          {editBadge ? (
                            <Badge className="border border-slate-200 bg-white text-slate-700">
                              {editBadge}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm leading-7 text-slate-600">
                          {editBeschrijving ||
                            "Controleer direct of je gekozen pakketidentiteit en pakketfoto samen goed aanvoelen."}
                        </p>
                        {editPraktijkExamenPrijs.trim() ? (
                          <p className="mt-2 text-sm font-medium text-slate-700">
                            Praktijk-examen: {formatCurrency(Number(editPraktijkExamenPrijs))}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
                {editCoverPreviewUrl ? (
                  <div className="mt-4">
                    <PackageCoverFocusEditor
                      imageUrl={editCoverPreviewUrl}
                      imageAlt={
                        editNaam ? `Focuseditor voor ${editNaam}` : "Focuseditor voor pakketcover"
                      }
                      positionKey={editCoverPosition}
                      focusX={editCoverFocusX}
                      focusY={editCoverFocusY}
                      onChange={(x, y) => {
                        setEditCoverFocusX(x);
                        setEditCoverFocusY(y);
                      }}
                      onReset={() => {
                        setEditCoverFocusX(null);
                        setEditCoverFocusY(null);
                      }}
                      disabled={isBusy}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-slate-50/90 dark:bg-white/5">
            <Button
              variant="outline"
              className="rounded-full border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              onClick={closeEditDialog}
              disabled={isBusy}
            >
              Annuleren
            </Button>
            <Button
              className="rounded-full bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] text-white"
              onClick={handleSavePackageEdit}
              disabled={isBusy}
            >
              <Edit3 className="size-4" />
              {isUploadingCover ? "Cover uploaden..." : isPending ? "Opslaan..." : "Wijzigingen opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
