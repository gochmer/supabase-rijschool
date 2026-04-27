"use client";

import Image from "next/image";
import Link from "next/link";
import { type ChangeEvent, type PointerEvent as ReactPointerEvent, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  BadgeEuro,
  Boxes,
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
  beschrijving: string;
  praktijkExamenPrijs?: string;
};

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
  aantalLessen,
  praktijkExamenPrijs,
}: {
  naam: string;
  badge: string;
  lesType: RijlesType;
  aantalLessen: string;
  praktijkExamenPrijs: string;
}) {
  const lessonCount = Number.parseInt(aantalLessen, 10);
  const audienceMap: Record<RijlesType, string> = {
    auto: "leerlingen die met rust, structuur en duidelijke opbouw richting zelfstandig rijden willen groeien",
    motor: "rijders die voertuigcontrole, verkeersinzicht en examengerichte motorbegeleiding slim willen combineren",
    vrachtwagen: "kandidaten die professioneel, zeker en examengericht willen toewerken naar praktijkniveau",
  };

  const badgeLead = badge ? `${badge.toLowerCase()} ` : "";
  const lessonsLine =
    Number.isFinite(lessonCount) && lessonCount > 0
      ? `met ${lessonCount} lessen als duidelijke basis`
      : "met een flexibel opgebouwd traject";
  const practiceLine = praktijkExamenPrijs.trim()
    ? ` Inclusief ruimte om het praktijk-examen apart helder te prijzen.`
    : "";

  return `${naam || "Dit pakket"} is een ${badgeLead}traject voor ${audienceMap[lesType]}, ${lessonsLine}. Je houdt het aanbod commercieel duidelijk en professioneel gepresenteerd op je openbare profiel.${practiceLine}`;
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
    <div className="rounded-[1.25rem] border border-slate-200 bg-white/92 p-4 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.18)]">
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
          className="rounded-full border-slate-200 bg-white"
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
        <Badge className="border border-slate-200 bg-slate-100 text-slate-700">
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
      <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/5">
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
      <div className="flex flex-wrap gap-2 rounded-[1.1rem] border border-slate-200 bg-slate-50/85 p-3 dark:border-white/10 dark:bg-white/5">
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
  disabled,
  onApplyPreset,
}: {
  lesType: RijlesType;
  disabled?: boolean;
  onApplyPreset: (preset: PackagePreset) => void;
}) {
  const presets = getPackagePresets(lesType);

  return (
    <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
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
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onApplyPreset(preset)}
            disabled={disabled}
            className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_34px_-24px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-white/8 dark:hover:border-white/16 dark:hover:shadow-none"
          >
            <p className="text-sm font-semibold text-slate-950 dark:text-white">{preset.label}</p>
            <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-300">
              {preset.subtitle}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function PackageInsightsPanel({
  priceLabel,
  practiceExamLabel,
  pricePerLessonLabel,
  totalValueLabel,
  tierLabel,
  descriptionReady,
  onGenerateDescription,
  disabled,
}: {
  priceLabel: string;
  practiceExamLabel: string;
  pricePerLessonLabel: string;
  totalValueLabel: string;
  tierLabel: string;
  descriptionReady: boolean;
  onGenerateDescription: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
            Slim pakketinzicht
          </p>
          <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Zie direct hoe je pakket commercieel overkomt en vul sneller sterke tekst in.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-full border-slate-200 bg-white dark:border-white/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/10"
          onClick={onGenerateDescription}
          disabled={disabled}
        >
          <Sparkles className="size-4" />
          {descriptionReady ? "Beschrijving verversen" : "Beschrijving genereren"}
        </Button>
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

export function PackageStudio({
  packages,
  scope,
  publicProfilePath,
}: {
  packages: Pakket[];
  scope: "admin" | "instructeur";
  publicProfilePath?: string;
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
  const [beschrijving, setBeschrijving] = useState("");
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
  const [editBeschrijving, setEditBeschrijving] = useState("");
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPath, setEditCoverPath] = useState<string | null>(null);
  const [editCoverPreviewUrl, setEditCoverPreviewUrl] = useState<string | null>(null);
  const [editCoverChanged, setEditCoverChanged] = useState(false);

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
    setBeschrijving("");
    setCoverFile(null);
    setCoverPreviewUrl(null);
  }

  function applyCreatePreset(preset: PackagePreset) {
    setNaam(preset.naam);
    setBadge(preset.badge);
    setIconKey(preset.iconKey);
    setVisualTheme(preset.visualTheme);
    setPrijs(preset.prijs);
    setAantalLessen(preset.aantalLessen);
    setBeschrijving(preset.beschrijving);
    const nextPracticeExamPrice = preset.praktijkExamenPrijs ?? "";
    setHasPracticeExam(Boolean(nextPracticeExamPrice));
    setPraktijkExamenPrijs(nextPracticeExamPrice);
  }

  function generateCreateDescription() {
    setBeschrijving(
      buildGeneratedPackageDescription({
        naam,
        badge,
        lesType,
        aantalLessen,
        praktijkExamenPrijs: showPracticeExamPriceField ? praktijkExamenPrijs : "",
      })
    );
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
    setEditNaam(pkg.naam);
    setEditLesType(pkg.les_type);
    setEditBadge(pkg.badge ?? "");
    setEditIconKey(pkg.icon_key ?? "sparkles");
    setEditVisualTheme(pkg.visual_theme ?? "sky");
    setEditCoverPosition(getPackageCoverPositionKey(pkg.cover_position));
    setEditCoverFocusX(pkg.cover_focus_x ?? null);
    setEditCoverFocusY(pkg.cover_focus_y ?? null);
    setEditPrijs(String(pkg.prijs ?? 0));
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
  }

  async function handleEditCoverChange(event: ChangeEvent<HTMLInputElement>) {
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
            className="rounded-[1.45rem] border border-white/80 bg-white/88 p-4 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_20px_60px_-40px_rgba(15,23,42,0.56)]"
          >
            <div className="flex items-center gap-2">
              <item.icon className="size-4 text-sky-700" />
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                {item.label}
              </p>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[1.9rem] border border-white/80 bg-white/90 p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
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
          disabled={isBusy}
          onApplyPreset={applyCreatePreset}
        />

        <div className="mt-5 grid gap-4 md:grid-cols-2">
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
              onChange={(event) => setLesType(event.target.value as RijlesType)}
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
          <div className="space-y-2">
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
          {showPracticeExamPriceField ? (
            <PracticeExamPriceField
              inputId="package_practice_exam_price"
              value={praktijkExamenPrijs}
              onChange={setPraktijkExamenPrijs}
              disabled={isBusy}
            />
          ) : null}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="package_description">Beschrijving</Label>
            <Textarea
              id="package_description"
              value={beschrijving}
              onChange={(event) => setBeschrijving(event.target.value)}
              placeholder="Beschrijf kort voor wie dit pakket bedoeld is en wat erin zit."
              className="min-h-28 rounded-[1.1rem] border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>
          <div className="md:col-span-2">
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
              descriptionReady={Boolean(beschrijving.trim())}
              onGenerateDescription={generateCreateDescription}
              disabled={isBusy}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="package_cover">Pakketfoto</Label>
            <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    Geef je pakket een eigen foto
                  </p>
                  <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    JPG, PNG, WebP of AVIF tot 5 MB. Deze pakketfoto komt terug in het dashboard
                    en op de openbare pakketkaarten.
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
                className="mt-4 block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              />
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="package_cover_position">Coverpositie</Label>
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
          <div className="md:col-span-2">
            <div className={cn("overflow-hidden rounded-[1.35rem] border", createVisual.softCardClass)}>
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
              <div className="mt-4">
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
              </div>
            ) : null}
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

      <div className="rounded-[1.9rem] border border-white/80 bg-white/90 p-5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
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

        <div className="mt-5 flex flex-wrap gap-2">
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
                    "overflow-hidden rounded-[1.55rem] border p-5 shadow-[0_20px_52px_-36px_rgba(15,23,42,0.22)]",
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

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div
                      className={cn(
                        "rounded-[1.2rem] p-4",
                        isLeadCard ? "bg-white/10" : "bg-white"
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
                        "rounded-[1.2rem] p-4",
                        isLeadCard ? "bg-white/10" : "bg-white"
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
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
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

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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

      <Dialog open={editingPackageId !== null} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-xl border border-slate-200 bg-white p-0 shadow-[0_32px_90px_-54px_rgba(15,23,42,0.36)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white dark:shadow-[0_32px_90px_-54px_rgba(15,23,42,0.72)]">
          <div className="p-5">
            <DialogHeader>
              <DialogTitle className="text-slate-950 dark:text-white">Pakketinformatie en foto bewerken</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-300">
                Werk naam, prijs, lessen, beschrijving en pakketfoto bij zonder het pakket opnieuw te maken.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_package_name">Pakketnaam</Label>
                <Input
                  id="edit_package_name"
                  value={editNaam}
                  onChange={(event) => setEditNaam(event.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_package_type">Rijlestype</Label>
                <select
                  id="edit_package_type"
                  value={editLesType}
                  onChange={(event) => setEditLesType(event.target.value as RijlesType)}
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
                  className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="edit_package_icon">Pakketicoon</Label>
                <select
                  id="edit_package_icon"
                  value={editIconKey}
                  onChange={(event) => setEditIconKey(event.target.value)}
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
                  className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              {showEditPracticeExamPriceField ? (
                <PracticeExamPriceField
                  inputId="edit_package_practice_exam_price"
                  value={editPraktijkExamenPrijs}
                  onChange={setEditPraktijkExamenPrijs}
                  disabled={isBusy}
                />
              ) : null}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit_package_description">Beschrijving</Label>
                <Textarea
                  id="edit_package_description"
                  value={editBeschrijving}
                  onChange={(event) => setEditBeschrijving(event.target.value)}
                  className="min-h-28 rounded-[1.1rem] border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit_package_cover_position">Coverpositie</Label>
                <select
                  id="edit_package_cover_position"
                  value={editCoverPosition}
                  onChange={(event) => setEditCoverPosition(event.target.value)}
                  className="native-select h-11 w-full rounded-xl px-3 text-sm"
                >
                  {packageCoverPositionOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <div className={cn("overflow-hidden rounded-[1.35rem] border", editVisual.softCardClass)}>
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
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">
                            {editNaam || "Live preview van je pakket"}
                          </p>
                          <Badge className="border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                            {getRijlesTypeLabel(editLesType)}
                          </Badge>
                          {editBadge ? (
                            <Badge className="border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                              {editBadge}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {editBeschrijving ||
                            "Controleer direct of je gekozen pakketidentiteit en pakketfoto samen goed aanvoelen."}
                        </p>
                        {editPraktijkExamenPrijs.trim() ? (
                          <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
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
