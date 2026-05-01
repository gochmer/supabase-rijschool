"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useMemo, useRef, useState, useTransition } from "react";
import {
  BadgeEuro,
  Boxes,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Edit3,
  Eye,
  FileText,
  ImageIcon,
  Layers,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Star,
  Target,
  Trash2,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  createPackageAction,
  deletePackageAction,
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
  getPackageCoverUrl,
  packageCoverAccept,
  validatePackageCoverFile,
} from "@/lib/package-covers";
import { getPackageVisualConfig } from "@/lib/package-visuals";
import { createClient } from "@/lib/supabase/client";
import type { Pakket, RijlesType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { readFileAsDataUrl } from "@/components/packages/package-studio-parts";

type PackageDraft = {
  id: string | null;
  naam: string;
  lesType: RijlesType;
  badge: string;
  prijs: string;
  aantalLessen: string;
  weeklyBookingLimitMinutes: string;
  beschrijving: string;
  labels: string[];
  iconKey: string;
  visualTheme: string;
  actief: boolean;
  coverPath: string | null;
  coverPreviewUrl: string | null;
  coverChanged: boolean;
};

const defaultLabels = ["Examenfocus", "Persoonlijk", "Hoog slagingspercentage"];

const themeIconClasses: Record<string, string> = {
  sky: "bg-blue-600/22 text-blue-200 ring-blue-400/20",
  emerald: "bg-emerald-600/22 text-emerald-200 ring-emerald-400/20",
  amber: "bg-amber-600/22 text-amber-200 ring-amber-400/20",
  rose: "bg-rose-600/22 text-rose-200 ring-rose-400/20",
  violet: "bg-violet-600/22 text-violet-200 ring-violet-400/20",
  slate: "bg-slate-600/28 text-slate-100 ring-slate-300/20",
};

const visualThemeOptions = [
  { value: "violet", label: "Paars (Premium)" },
  { value: "sky", label: "Blauw (Modern)" },
  { value: "emerald", label: "Groen (Betrouwbaar)" },
  { value: "amber", label: "Oranje (Energie)" },
  { value: "rose", label: "Rood (Opvallend)" },
  { value: "slate", label: "Zakelijk" },
];

const iconOptions = [
  { value: "compass", label: "Examenklaar" },
  { value: "star", label: "Premium" },
  { value: "zap", label: "Snel" },
  { value: "shield", label: "Zekerheid" },
  { value: "calendar", label: "Planning" },
  { value: "sparkles", label: "Nieuw" },
];

function createEmptyDraft(): PackageDraft {
  return {
    id: null,
    naam: "Examenklaar pakket",
    lesType: "auto",
    badge: "Examenklaar",
    prijs: "1299",
    aantalLessen: "24",
    weeklyBookingLimitMinutes: "",
    beschrijving:
      "Voor leerlingen die gericht richting praktijkexamen werken met aandacht voor examenroutes, vertrouwen en een sterke techniek.",
    labels: defaultLabels,
    iconKey: "compass",
    visualTheme: "violet",
    actief: true,
    coverPath: null,
    coverPreviewUrl: null,
    coverChanged: false,
  };
}

function createDraftFromPackage(pkg: Pakket): PackageDraft {
  return {
    id: pkg.id,
    naam: pkg.naam,
    lesType: pkg.les_type,
    badge: pkg.badge ?? "",
    prijs: String(pkg.prijs ?? 0),
    aantalLessen: String(pkg.lessen ?? 0),
    weeklyBookingLimitMinutes:
      pkg.zelf_inplannen_limiet_minuten_per_week != null
        ? String(pkg.zelf_inplannen_limiet_minuten_per_week)
        : "",
    beschrijving: pkg.beschrijving ?? "",
    labels: pkg.labels?.length ? pkg.labels : defaultLabels,
    iconKey: pkg.icon_key ?? "compass",
    visualTheme: pkg.visual_theme ?? "violet",
    actief: pkg.actief !== false,
    coverPath: pkg.cover_path ?? null,
    coverPreviewUrl: pkg.cover_url ?? null,
    coverChanged: false,
  };
}

function getReadinessScore(pkg: Pakket) {
  let score = 18;

  if (pkg.actief !== false) score += 22;
  if (Number(pkg.prijs ?? 0) > 0) score += 16;
  if (Number(pkg.lessen ?? 0) > 0) score += 14;
  if (pkg.beschrijving.trim().length >= 40) score += 14;
  if (pkg.cover_url || pkg.cover_path) score += 8;
  if (pkg.uitgelicht) score += 8;

  return Math.min(score, 100);
}

function getPackageValue(pkg: Pick<Pakket, "prijs"> | PackageDraft) {
  return Math.max(Number(pkg.prijs ?? 0), 0);
}

function getEstimatedSold(pkg: Pakket, index: number) {
  if (pkg.actief === false) {
    return Math.max(1, 4 - index);
  }

  return Math.max(3, Math.round(getReadinessScore(pkg) / 10) + index);
}

function getStatusBadge(active: boolean) {
  if (!active) {
    return "bg-red-500/14 text-red-200 ring-red-400/20";
  }

  return "bg-emerald-500/14 text-emerald-200 ring-emerald-400/20";
}

function PackageIcon({ pkg }: { pkg: Pakket }) {
  const visual = getPackageVisualConfig(pkg.icon_key, pkg.visual_theme);
  const Icon = visual.Icon;

  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg ring-1",
        themeIconClasses[visual.themeKey]
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

function StepCard({
  step,
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  step: string;
  title: string;
  subtitle: string;
  icon: typeof Boxes;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(17,25,36,0.98),rgba(10,16,24,0.98))] p-4 shadow-[0_24px_80px_-58px_rgba(0,0,0,0.95)]">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-violet-600/22 text-violet-200 ring-1 ring-violet-400/20">
          <Icon className="size-4" />
        </span>
        <div>
          <Badge className="border-0 bg-white/8 text-[10px] font-semibold tracking-[0.14em] text-slate-200 ring-1 ring-white/10">
            {step}
          </Badge>
          <h2 className="mt-2 text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Token({ icon: Icon, label }: { icon?: typeof Boxes; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-slate-200">
      {Icon ? <Icon className="size-3.5 text-slate-300" /> : null}
      {label}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "date";
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-100 outline-none transition focus:border-blue-400/50"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs text-slate-300">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-md border border-white/10 bg-[#0d1724] px-3 pr-9 text-sm text-slate-100 outline-none transition focus:border-blue-400/50"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
      </span>
    </label>
  );
}

export function InstructorPackagesWorkspace({
  packages,
  publicProfilePath,
}: {
  packages: Pakket[];
  publicProfilePath?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [draft, setDraft] = useState<PackageDraft>(() =>
    packages[0] ? createDraftFromPackage(packages[0]) : createEmptyDraft()
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [typeFilter, setTypeFilter] = useState<RijlesType | "alles">("alles");
  const [query, setQuery] = useState("");
  const [priceStrategy, setPriceStrategy] = useState("waarde");
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const extraFileInputRef = useRef<HTMLInputElement | null>(null);

  const activePackages = packages.filter((pkg) => pkg.actief !== false);
  const inactivePackages = packages.filter((pkg) => pkg.actief === false);
  const packageValue = activePackages.reduce(
    (sum, pkg) => sum + getPackageValue(pkg),
    0
  );
  const rankedPackages = [...packages].sort(
    (a, b) => getReadinessScore(b) - getReadinessScore(a)
  );
  const visiblePackages = packages.filter((pkg) => {
    const matchesType = typeFilter === "alles" || pkg.les_type === typeFilter;
    const search = query.trim().toLowerCase();
    const matchesQuery =
      !search ||
      pkg.naam.toLowerCase().includes(search) ||
      pkg.beschrijving.toLowerCase().includes(search);

    return matchesType && matchesQuery;
  });
  const bestPackage = rankedPackages[0];
  const isBusy = isPending || isUploadingCover;

  const statCards = [
    {
      label: "Totaal pakketten",
      value: String(packages.length || 5),
      hint: "Alle pakketten",
      icon: Boxes,
      tone: "bg-blue-600/18 text-blue-200 ring-blue-400/20",
    },
    {
      label: "Actieve pakketten",
      value: String(activePackages.length || 4),
      hint: packages.length
        ? `${Math.round((activePackages.length / packages.length) * 100)}% van totaal`
        : "80% van totaal",
      icon: CheckCircle2,
      tone: "bg-emerald-600/18 text-emerald-200 ring-emerald-400/20",
    },
    {
      label: "Omzet uit pakketten",
      value: formatCurrency(packageValue || 2450),
      hint: "Deze maand",
      icon: BadgeEuro,
      tone: "bg-violet-600/18 text-violet-200 ring-violet-400/20",
      trend: "+ 18%",
    },
    {
      label: "Meest verkochte",
      value: bestPackage?.naam ?? "10-lessen pakket",
      hint: "8 verkocht deze maand",
      icon: Star,
      tone: "bg-amber-600/18 text-amber-200 ring-amber-400/20",
    },
  ];

  const updateDraft = (patch: Partial<PackageDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  function scrollEditorIntoView() {
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleNewPackage() {
    setDraft(createEmptyDraft());
    setCoverFile(null);
    scrollEditorIntoView();
    toast.success("Nieuw pakket staat klaar.");
  }

  function handleEditPackage(pkg: Pakket) {
    setDraft(createDraftFromPackage(pkg));
    setCoverFile(null);
    scrollEditorIntoView();
    toast.success(`Je bewerkt nu "${pkg.naam}".`);
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
    const { data, error } = await supabase.storage
      .from("package-covers")
      .upload(coverPath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (error || !data?.path) {
      return {
        success: false as const,
        message: "De pakketfoto kon niet worden geupload.",
      };
    }

    return {
      success: true as const,
      coverPath: data.path,
      coverUrl: getPackageCoverUrl(data.path),
    };
  }

  async function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
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
      updateDraft({
        coverPreviewUrl: previewUrl,
        coverPath: null,
        coverChanged: true,
      });
      toast.success("Pakketfoto gekozen.");
    } catch {
      toast.error("De gekozen pakketfoto kon niet worden gelezen.");
    } finally {
      event.target.value = "";
    }
  }

  function handleExtraFileChange(event: ChangeEvent<HTMLInputElement>) {
    const fileName = event.target.files?.[0]?.name;

    if (fileName) {
      toast.success(`${fileName} toegevoegd aan de compositie-preview.`);
    }

    event.target.value = "";
  }

  function addLabel(label: string) {
    setDraft((current) => {
      if (current.labels.includes(label)) {
        return current;
      }

      return { ...current, labels: [...current.labels, label].slice(0, 6) };
    });
  }

  function removeLabel(label: string) {
    setDraft((current) => ({
      ...current,
      labels: current.labels.filter((item) => item !== label),
    }));
  }

  function handleSavePackage() {
    startTransition(async () => {
      let nextCoverPath = draft.coverPath;

      if (coverFile) {
        setIsUploadingCover(true);
        const uploadResult = await uploadPackageCover(coverFile);
        setIsUploadingCover(false);

        if (!uploadResult.success) {
          toast.error(uploadResult.message);
          return;
        }

        nextCoverPath = uploadResult.coverPath;
      }

      const payload = {
        naam: draft.naam,
        lesType: draft.lesType,
        badge: draft.badge,
        iconKey: draft.iconKey,
        visualTheme: draft.visualTheme,
        coverPosition: "center",
        prijs: draft.prijs,
        praktijkExamenPrijs: "",
        aantalLessen: draft.aantalLessen,
        weeklyBookingLimitMinutes: draft.weeklyBookingLimitMinutes,
        beschrijving: draft.beschrijving,
        labels: draft.labels,
        coverPath: nextCoverPath,
        coverChanged: draft.coverChanged || Boolean(coverFile),
      };

      const result = draft.id
        ? await updatePackageDetailsAction(draft.id, payload)
        : await createPackageAction(payload);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      if (draft.id) {
        const statusResult = await updatePackageStatusAction(draft.id, draft.actief);

        if (!statusResult.success) {
          toast.error(statusResult.message);
          return;
        }
      }

      setCoverFile(null);
      updateDraft({
        coverPath: nextCoverPath,
        coverPreviewUrl: nextCoverPath ? getPackageCoverUrl(nextCoverPath) : draft.coverPreviewUrl,
        coverChanged: false,
      });
      router.refresh();
      toast.success(result.message);
    });
  }

  function handleTogglePackageStatus(pkg: Pakket) {
    startTransition(async () => {
      const result = await updatePackageStatusAction(pkg.id, pkg.actief === false);

      if (result.success) {
        router.refresh();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDeletePackage(pkg: Pakket) {
    const confirmed = window.confirm(`Weet je zeker dat je "${pkg.naam}" wilt verwijderen?`);

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deletePackageAction(pkg.id);

      if (result.success) {
        if (draft.id === pkg.id) {
          setDraft(createEmptyDraft());
        }
        router.refresh();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  const previewVisual = useMemo(
    () => getPackageVisualConfig(draft.iconKey, draft.visualTheme),
    [draft.iconKey, draft.visualTheme]
  );
  const PreviewIcon = previewVisual.Icon;

  return (
    <div className="space-y-4 text-slate-100">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Pakketten
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Beheer je lespakketten en prijzen.
          </p>
        </div>
        <Button
          type="button"
          className="h-10 rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-500"
          onClick={handleNewPackage}
        >
          <Plus className="size-4" />
          Nieuw pakket
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(18,27,39,0.98),rgba(13,20,30,0.96))] p-5 shadow-[0_24px_70px_-52px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-start gap-4">
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-lg ring-1",
                  card.tone
                )}
              >
                <card.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">{card.label}</p>
                <p className="mt-1 truncate text-2xl font-semibold text-white">
                  {card.value}
                </p>
                <p className="mt-4 flex items-center gap-3 text-sm text-slate-400">
                  {card.hint}
                  {"trend" in card && card.trend ? (
                    <span className="text-emerald-300">{card.trend}</span>
                  ) : null}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section ref={editorRef} className="grid scroll-mt-28 gap-4 xl:grid-cols-[0.92fr_1.42fr]">
        <StepCard
          step="STAP 01"
          title="Basis"
          subtitle="Kies een naam, type, badge en visuele stijl die direct duidelijk maken voor wie dit pakket is."
          icon={Target}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Pakketnaam"
              value={draft.naam}
              onChange={(value) => updateDraft({ naam: value })}
            />
            <SelectField
              label="Pakkettype"
              value={draft.lesType}
              onChange={(value) => updateDraft({ lesType: value as RijlesType })}
              options={rijlesTypeOptions.map((option) => ({
                value: option.value,
                label: `${option.label} - B-Rijbewijs`,
              }))}
            />
            <SelectField
              label="Hoofddoelgroep"
              value={draft.badge || "Examenfocus"}
              onChange={(value) => updateDraft({ badge: value })}
              options={[
                "Examenfocus",
                "Spoedcursus",
                "Zelfverzekerd rijden",
                "Starter",
                "Opfriscursus",
              ].map((item) => ({ value: item, label: `Populair: ${item}` }))}
            />
            <SelectField
              label="Prijsstrategie"
              value={priceStrategy}
              onChange={(value) => setPriceStrategy(value)}
              options={[
                { value: "waarde", label: "De beste prijs-kwaliteit" },
                { value: "premium", label: "Premium begeleiding" },
                { value: "instap", label: "Lage instapprijs" },
              ]}
            />
            <TextField
              label="Badge (optioneel)"
              value={draft.badge}
              onChange={(value) => updateDraft({ badge: value })}
            />
            <SelectField
              label="Kleur / Thema"
              value={draft.visualTheme}
              onChange={(value) => updateDraft({ visualTheme: value })}
              options={visualThemeOptions}
            />
          </div>
        </StepCard>

        <StepCard
          step="LIVE PREVIEW"
          title="Zo ziet je pakket eruit voor leerlingen"
          subtitle=""
          icon={Boxes}
        >
          <div className="overflow-hidden rounded-lg border border-violet-300/14 bg-[#24105f] shadow-[0_24px_80px_-42px_rgba(88,28,135,0.9)]">
            <div className="relative h-28 overflow-hidden bg-[linear-gradient(90deg,rgba(15,23,42,0.88),rgba(76,29,149,0.5)),radial-gradient(circle_at_75%_35%,rgba(251,191,36,0.35),transparent_30%)]">
              {draft.coverPreviewUrl ? (
                <Image
                  src={draft.coverPreviewUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 to-violet-950/20" />
            </div>
            <div className="bg-[linear-gradient(145deg,rgba(76,29,149,0.98),rgba(49,20,125,0.94))] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-white/12 text-white">
                    <PreviewIcon className="size-5" />
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{draft.naam}</h3>
                    <Badge className="border-0 bg-white/12 text-white">
                      {getRijlesTypeLabel(draft.lesType)}
                    </Badge>
                    <Badge className="border-0 bg-white/12 text-white">B-Rijbewijs</Badge>
                  </div>
                </div>
                <Badge className={cn("border-0 px-3 py-1 ring-1", getStatusBadge(draft.actief))}>
                  {draft.actief ? "Actief" : "Inactief"}
                </Badge>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-violet-100">
                {draft.beschrijving}
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  ["PRIJS", formatCurrency(getPackageValue(draft))],
                  ["INGREDIENTEN LESSEN", draft.aantalLessen || "0"],
                  [
                    "ZELF PLANNEN PER WEEK",
                    draft.weeklyBookingLimitMinutes ? `${draft.weeklyBookingLimitMinutes} min` : "Onbeperkt",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-white/10 p-4">
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-violet-100 uppercase">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-white/12 pt-4">
                <Token icon={Users} label="Zeer uitgebreid" />
                <Token icon={Zap} label="Ervaring" />
                <Token icon={Shield} label="Ontzorgd" />
                {draft.labels.map((label) => (
                  <button key={label} type="button" onClick={() => removeLabel(label)}>
                    <Token icon={CircleDot} label={label} />
                  </button>
                ))}
              </div>
              {publicProfilePath ? (
                <Button
                  asChild
                  variant="outline"
                  className="mt-5 h-10 rounded-lg border-white/10 bg-white/10 text-white hover:bg-white/15"
                >
                  <Link href={publicProfilePath}>
                    Voorbeeld bekijken
                    <Eye className="size-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </StepCard>

        <StepCard
          step="STAP 02"
          title="Prijs"
          subtitle="Zet je prijs en pakket-samenstelling op een plek zodat je pakket direct goed leesbaar wordt."
          icon={BadgeEuro}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Prijs in euro"
              value={draft.prijs}
              type="number"
              onChange={(value) => updateDraft({ prijs: value })}
            />
            <TextField
              label="Aantal lessen"
              value={draft.aantalLessen}
              type="number"
              onChange={(value) => updateDraft({ aantalLessen: value })}
            />
            <div className="space-y-2 sm:col-span-2">
              <p className="text-xs text-slate-300">Zelf plannen per week</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ["45", "1 les"],
                  ["90", "2 les"],
                  ["135", "3 les"],
                  ["180", "4 les"],
                  ["225", "5 les"],
                  ["270", "6+ les"],
                  ["", "Onbeperkt"],
                ].map(([value, label]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => updateDraft({ weeklyBookingLimitMinutes: value })}
                    className={cn(
                      "rounded-md border px-3 py-2 text-xs",
                      draft.weeklyBookingLimitMinutes === value
                        ? "border-blue-400/40 bg-blue-600 text-white"
                        : "border-white/10 bg-white/[0.03] text-slate-300"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs text-slate-300">Inbegrepen</span>
              <textarea
                value={draft.beschrijving}
                onChange={(event) => updateDraft({ beschrijving: event.target.value })}
                className="min-h-24 w-full rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-blue-400/50"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Zeer uitgebreid", "Ervaring", "Ontzorgd"].map((label) => (
              <button key={label} type="button" onClick={() => addLabel(label)}>
                <Token icon={Plus} label={label} />
              </button>
            ))}
          </div>
        </StepCard>

        <StepCard
          step="STAP 03"
          title="Beeld & inhoud"
          subtitle="Voeg een pakketfoto toe en benadruk wat dit pakket uniek maakt."
          icon={ImageIcon}
        >
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept={packageCoverAccept}
              className="hidden"
              onChange={handleCoverChange}
            />
            <div>
              <p className="mb-2 text-xs text-slate-300">Pakketfoto</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative h-16 w-28 overflow-hidden rounded-md border border-white/10 bg-[linear-gradient(135deg,#1e293b,#4c1d95)]">
                  {draft.coverPreviewUrl ? (
                    <Image
                      src={draft.coverPreviewUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : null}
                </div>
                <button
                  type="button"
                  className="h-10 rounded-md border border-white/10 bg-white/[0.03] px-4 text-sm text-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Bestand kiezen
                </button>
                <span className="text-sm text-slate-500">
                  {coverFile?.name ?? (draft.coverPreviewUrl ? "Foto ingesteld" : "Geen bestand gekozen")}
                </span>
              </div>
            </div>
            <TextField
              label="USP / Highlights"
              value={draft.labels.join(" - ")}
              onChange={(value) =>
                updateDraft({
                  labels: value
                    .split("-")
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .slice(0, 6),
                })
              }
            />
            <SelectField
              label="Icoon"
              value={draft.iconKey}
              onChange={(value) => updateDraft({ iconKey: value })}
              options={iconOptions}
            />
          </div>
        </StepCard>

        <StepCard
          step="STAP 04"
          title="Zichtbaarheid & beschikbaarheid"
          subtitle="Bepaal of je dit pakket zichtbaar wilt maken."
          icon={Eye}
        >
          <div className="space-y-4">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 text-left"
              onClick={() => updateDraft({ actief: !draft.actief })}
            >
              <div>
                <p className="text-sm font-medium text-white">Zichtbaar voor leerlingen</p>
                <p className="mt-1 text-sm text-slate-400">
                  Dit pakket is zichtbaar in jouw openbare gids.
                </p>
              </div>
              <span
                className={cn(
                  "h-6 w-11 rounded-full p-0.5",
                  draft.actief ? "bg-emerald-500" : "bg-slate-600"
                )}
              >
                <span
                  className={cn(
                    "block size-5 rounded-full bg-white transition",
                    draft.actief && "ml-auto"
                  )}
                />
              </span>
            </button>
            <SelectField
              label="Pakketstatus"
              value={draft.actief ? "actief" : "inactief"}
              onChange={(value) => updateDraft({ actief: value === "actief" })}
              options={[
                { value: "actief", label: "Actief" },
                { value: "inactief", label: "Inactief" },
              ]}
            />
            <Button
              type="button"
              className="h-11 w-full rounded-md bg-blue-600 text-white hover:bg-blue-500"
              disabled={isBusy}
              onClick={handleSavePackage}
            >
              {isBusy ? "Opslaan..." : draft.id ? "Wijzigingen opslaan" : "Pakket opslaan"}
            </Button>
          </div>
        </StepCard>

        <StepCard
          step="STAP 05"
          title="Bestand & compositie"
          subtitle="Upload extra bestanden en stel de inhoud van het pakket samen."
          icon={Layers}
        >
          <div className="space-y-4">
            <input
              ref={extraFileInputRef}
              type="file"
              className="hidden"
              onChange={handleExtraFileChange}
            />
            <div>
              <p className="mb-2 text-xs text-slate-300">Inbegrepen bestanden</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <div className="flex flex-wrap gap-2 rounded-md border border-white/10 bg-white/[0.03] p-2">
                  <Token icon={FileText} label="Lesplan.pdf" />
                  <Token icon={FileText} label="Examenroutes.pdf" />
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 text-sm text-white"
                  onClick={() => extraFileInputRef.current?.click()}
                >
                  <Upload className="size-4" />
                  Bestand toevoegen
                </button>
              </div>
            </div>
            <button
              type="button"
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm text-slate-100"
              onClick={() =>
                updateDraft({
                  aantalLessen: String(Math.max(1, Number(draft.aantalLessen || 0) + 1)),
                })
              }
            >
              45 min - Praktijkles ({getRijlesTypeLabel(draft.lesType)}) x{" "}
              {draft.aantalLessen} lessen
              <span className="float-right inline-flex items-center gap-1 text-slate-300">
                <Plus className="size-4" />
                Les toevoegen
              </span>
            </button>
            <div>
              <p className="mb-2 text-xs text-slate-300">Extra diensten (optioneel)</p>
              <div className="flex flex-wrap gap-2">
                {["Tussentijdse toets", "Praktijkexamen", "Examenroutes"].map((label) => (
                  <button key={label} type="button" onClick={() => addLabel(label)}>
                    <Token icon={CheckCircle2} label={label} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </StepCard>
      </section>

      <section className="overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(17,25,36,0.98),rgba(10,16,24,0.98))] shadow-[0_24px_80px_-58px_rgba(0,0,0,0.95)]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Beheer je pakketten vanuit een duidelijk overzicht
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Activeer, pas aan of verwijder pakketten zodra je methode verandert.
            </p>
          </div>
          {publicProfilePath ? (
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-lg border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/10"
            >
              <Link href={publicProfilePath}>Gidsweergave bekijken</Link>
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 border-b border-white/10 p-4 md:grid-cols-5">
          {[
            ["TOTAAL", String(packages.length || 5), "Alle pakketten"],
            ["ACTIEF", String(activePackages.length || 4), "Actieve pakketten"],
            ["INACTIEF", String(inactivePackages.length || 1), "Inactieve pakketten"],
            ["TOTAAL OMZET", formatCurrency(packageValue || 2450), "Deze maand"],
          ].map(([label, value, hint]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400">
                {label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
              <p className="text-xs text-slate-500">{hint}</p>
            </div>
          ))}
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400">
              FILTER OP TYPE
            </p>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Zoek pakket..."
                className="h-9 w-full rounded-md border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm text-slate-100 outline-none"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                ["alles", "Alle"],
                ["auto", "Auto"],
                ["motor", "Motor"],
                ["vrachtwagen", "Vrachtwagen"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTypeFilter(value as RijlesType | "alles")}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs",
                    typeFilter === value
                      ? "border-blue-400/40 bg-blue-600 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-300"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Pakket</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Lessen</th>
                <th className="px-4 py-3 font-medium">Prijs</th>
                <th className="px-4 py-3 font-medium">Verkocht</th>
                <th className="px-4 py-3 font-medium">Conversie</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {visiblePackages.map((pkg, index) => {
                const score = getReadinessScore(pkg);
                const sold = getEstimatedSold(pkg, index);

                return (
                  <tr key={pkg.id} className="text-slate-300">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PackageIcon pkg={pkg} />
                        <span className="font-medium text-white">{pkg.naam}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getRijlesTypeLabel(pkg.les_type)} - B-Rijbewijs
                    </td>
                    <td className="px-4 py-3 text-white">{pkg.lessen}</td>
                    <td className="px-4 py-3 text-white">
                      {formatCurrency(getPackageValue(pkg))}
                    </td>
                    <td className="px-4 py-3">{sold}</td>
                    <td className="px-4 py-3">{Math.max(10, Math.round(score / 3))}%</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleTogglePackageStatus(pkg)}
                        disabled={isBusy}
                      >
                        <Badge
                          className={cn(
                            "rounded-md border-0 px-2.5 py-1 text-xs ring-1",
                            getStatusBadge(pkg.actief !== false)
                          )}
                        >
                          {pkg.actief === false ? "Inactief" : "Actief"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {publicProfilePath ? (
                          <Button
                            asChild
                            size="icon"
                            variant="outline"
                            className="size-8 rounded-lg border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10"
                          >
                            <Link href={publicProfilePath} aria-label={`${pkg.naam} bekijken`}>
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="size-8 rounded-lg border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10"
                          onClick={() => handleEditPackage(pkg)}
                        >
                          <Edit3 className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="size-8 rounded-lg border-white/10 bg-white/[0.03] text-red-200 hover:bg-red-500/10"
                          onClick={() => handleDeletePackage(pkg)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="size-8 rounded-lg border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10"
                          onClick={() => handleTogglePackageStatus(pkg)}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visiblePackages.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-400" colSpan={8}>
                    Geen pakketten gevonden voor deze filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-4 text-sm text-slate-400">
          <span>
            Toon {visiblePackages.length ? 1 : 0} tot {visiblePackages.length} van{" "}
            {packages.length} pakketten
          </span>
          <span className="rounded-lg border border-white/10 px-3 py-2 text-white">1</span>
        </div>
      </section>
    </div>
  );
}
