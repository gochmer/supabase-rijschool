"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  ClipboardCheck,
  Clock3,
  Eye,
  FileText,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  Settings,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { submitInstructorVerificationAction } from "@/lib/actions/instructor-verification";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FlowMode = "signup" | "verification";

type FileKey = "profile_photo" | "wrm_front" | "wrm_back" | "selfie";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  bio: string;
  wrmNumber: string;
  wrmCategory: string;
  wrmValidUntil: string;
  school: string;
  functionRole: string;
  specializations: string[];
  terms: boolean;
};

type InitialInstructorRegistrationValues = {
  fullName?: string;
  email?: string;
  phone?: string;
  bio?: string | null;
  specializations?: string[] | null;
  profileStatus?: string | null;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  bio: "",
  wrmNumber: "",
  wrmCategory: "B",
  wrmValidUntil: "",
  school: "",
  functionRole: "",
  specializations: ["Personenauto (B)"],
  terms: false,
};

const steps = [
  { id: 1, label: "Registratie", shortLabel: "Registratie" },
  { id: 2, label: "Profiel", shortLabel: "Profiel" },
  { id: 3, label: "WRM verificatie", shortLabel: "WRM verificatie" },
  { id: 4, label: "Extra informatie", shortLabel: "Extra informatie" },
  { id: 5, label: "Review", shortLabel: "Review" },
];

const specializationOptions = [
  "Personenauto (B)",
  "Automaat",
  "Aanhangwagen (BE)",
  "Motor (A)",
  "Faalangst",
  "Spoedcursus",
  "Examenroutes",
];

const wrmCategoryOptions = ["A", "B", "BE", "C", "CE", "D", "DE", "T"];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function splitFullName(value?: string) {
  const parts = (value ?? "").trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return { firstName: "", lastName: "" };
  }

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function buildInitialForm(initialValues?: InitialInstructorRegistrationValues) {
  const name = splitFullName(initialValues?.fullName);
  const specializations = initialValues?.specializations?.filter(Boolean) ?? [];

  return {
    ...initialForm,
    firstName: name.firstName,
    lastName: name.lastName,
    email: initialValues?.email ?? "",
    phone: initialValues?.phone ?? "",
    bio: initialValues?.bio ?? "",
    specializations: specializations.length
      ? specializations
      : initialForm.specializations,
  };
}

function fullName(form: FormState) {
  return `${form.firstName} ${form.lastName}`.trim();
}

function canPreview(file?: File | null): file is File {
  return Boolean(file?.type.startsWith("image/"));
}

function fileLabel(file?: File | null) {
  if (!file) {
    return "Nog geen bestand";
  }

  return file.name;
}

function ProgressSteps({
  activeSteps,
  currentStep,
  isPending,
  onSelect,
}: {
  activeSteps: typeof steps;
  currentStep: number;
  isPending: boolean;
  onSelect: (step: number) => void;
}) {
  return (
    <div className="border-b border-white/10 px-5 py-4 sm:px-8">
      <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-5">
        {activeSteps.map((item, index) => {
          const isActive = item.id === currentStep;
          const isDone = item.id < currentStep;
          const isFuture = item.id > currentStep;

          return (
            <button
              key={item.id}
              type="button"
              disabled={isFuture || isPending}
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? "step" : undefined}
              className={cx(
                "group flex min-h-9 min-w-0 items-center gap-2 rounded-lg px-2 text-left text-xs font-medium transition",
                isFuture ? "cursor-default text-slate-500" : "text-slate-200 hover:bg-white/[0.05]",
                isActive && "text-white",
                isDone && "text-emerald-200"
              )}
            >
              <span
                className={cx(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  isDone && "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-300/25",
                  isActive && "bg-violet-500 text-white shadow-[0_12px_28px_-18px_rgba(124,58,237,0.95)]",
                  isFuture && "bg-white/8 text-slate-400"
                )}
              >
                {isDone ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span className="truncate">{item.shortLabel}</span>
              {index < activeSteps.length - 1 ? (
                <span className="ml-auto hidden h-px min-w-5 flex-1 bg-white/12 lg:block" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold tracking-[0.22em] text-violet-200 uppercase">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      <p className="max-w-2xl text-sm leading-7 text-slate-400">{description}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-slate-200">{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border-white/10 bg-slate-950/35 px-3 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-slate-500 focus-visible:border-violet-300/50 focus-visible:ring-violet-400/20"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-slate-200">{label}</Label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-lg border border-white/10 bg-slate-950/35 px-3 pr-9 text-sm text-white outline-none transition focus:border-violet-300/50 focus:ring-3 focus:ring-violet-400/20"
        >
          {options.map((option) => (
            <option key={option} value={option} className="bg-slate-950 text-white">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

function UploadPlaceholder({ field, compact = false }: { field: FileKey; compact?: boolean }) {
  if (field === "wrm_front" || field === "wrm_back") {
    return (
      <span className="flex w-full justify-center">
        <span
          className={cx(
            "grid overflow-hidden rounded-md border border-sky-200/20 bg-[linear-gradient(135deg,#91d5e8,#c8eef7_48%,#8fb4cb)] p-2 text-left text-slate-950 shadow-[0_18px_38px_-28px_rgba(14,165,233,0.7)]",
            compact ? "h-20 w-36" : "h-24 w-44"
          )}
        >
          <span className="flex items-start justify-between gap-2">
            <strong className="text-base leading-none font-black tracking-tight">WRM</strong>
            <span className="text-[6px] leading-tight font-semibold text-slate-700">
              Certificaat
              <br />
              Rijinstructeur
            </span>
          </span>
          <span className="mt-1 grid grid-cols-[34px_1fr] gap-2">
            <span className="rounded-sm bg-slate-700/75" />
            <span className="space-y-1 pt-0.5">
              <span className="block h-1 rounded bg-slate-700/50" />
              <span className="block h-1 rounded bg-slate-700/35" />
              <span className="block h-1 rounded bg-slate-700/35" />
            </span>
          </span>
          <span className="mt-auto h-4 rounded bg-white/25" />
        </span>
      </span>
    );
  }

  if (field === "selfie") {
    return (
      <span className="flex flex-col items-center gap-2">
        <span className="flex size-20 items-center justify-center rounded-full bg-[linear-gradient(145deg,rgba(148,163,184,0.22),rgba(99,102,241,0.22))] text-slate-300">
          <CircleUserRound className="size-12" />
        </span>
      </span>
    );
  }

  return (
    <span className="flex flex-col items-center gap-3">
      <span className="flex size-12 items-center justify-center rounded-lg bg-violet-500/16 text-violet-200">
        <Camera className="size-6" />
      </span>
      <span className="text-sm font-semibold text-white">Klik om een foto te uploaden</span>
    </span>
  );
}

function FileDrop({
  label,
  field,
  file,
  required = false,
  compact = false,
  onFile,
}: {
  label: string;
  field: FileKey;
  file?: File | null;
  required?: boolean;
  compact?: boolean;
  onFile: (field: FileKey, file: File | null) => void;
}) {
  const preview = useMemo(() => {
    if (!canPreview(file)) {
      return null;
    }

    return URL.createObjectURL(file);
  }, [file]);

  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-slate-200">
        <span>{label}</span>
        {file ? (
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <CheckCircle2 className="size-3.5" />
            Klaar
          </span>
        ) : required ? (
          <span className="text-slate-500">Verplicht</span>
        ) : null}
      </span>
      <input
        name={field}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        onChange={(event) => onFile(field, event.target.files?.[0] ?? null)}
      />
      <span
        className={cx(
          "relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-950/30 p-3 transition hover:border-violet-300/40 hover:bg-violet-500/10",
          compact ? "min-h-40" : "min-h-44"
        )}
      >
        {file ? (
          <span className="absolute top-3 right-3 z-10 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_8px_22px_-12px_rgba(16,185,129,0.85)]">
            <Check className="size-3.5" />
          </span>
        ) : null}
        <span className="flex min-h-24 flex-1 items-center justify-center rounded-md border border-white/6 bg-white/[0.025] p-3 text-center">
          {preview ? (
            <Image
              src={preview}
              alt=""
              width={compact ? 240 : 320}
              height={compact ? 150 : 190}
              className={cx(
                "w-full rounded-md object-cover",
                compact ? "h-28" : "h-32"
              )}
              unoptimized
            />
          ) : (
            <UploadPlaceholder field={field} compact={compact} />
          )}
        </span>
        <span className="mt-3 flex min-h-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.035] px-3 text-xs font-medium text-slate-200">
          {file ? "Wijzig foto" : field === "profile_photo" ? "Upload foto" : "Upload document"}
        </span>
        <span className="mt-2 truncate text-center text-[11px] text-slate-500">
          {fileLabel(file)}
        </span>
      </span>
    </label>
  );
}

function ProfilePreview({ file, name }: { file?: File | null; name: string }) {
  const preview = useMemo(() => {
    if (!canPreview(file)) {
      return null;
    }

    return URL.createObjectURL(file);
  }, [file]);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <div className="relative flex size-48 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(145deg,rgba(226,232,240,0.95),rgba(148,163,184,0.9))] text-4xl font-semibold text-slate-700 shadow-[0_28px_70px_-44px_rgba(148,163,184,0.9)]">
        {preview ? (
          <Image
            src={preview}
            alt=""
            width={192}
            height={192}
            className="size-48 rounded-full object-cover"
            unoptimized
          />
        ) : initials ? (
          initials
        ) : (
          <UserRound className="size-20 text-slate-500" />
        )}
        <span className="absolute right-3 bottom-4 flex size-10 items-center justify-center rounded-full bg-violet-600 text-white ring-4 ring-slate-950/80">
          <Camera className="size-4" />
        </span>
      </div>
    </div>
  );
}

function RegistrationDashboardPreview() {
  const navItems = [LayoutDashboard, UserRound, ClipboardCheck, CalendarDays, Settings];

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] shadow-[0_28px_80px_-55px_rgba(15,23,42,0.9)]">
      <div className="grid min-h-[460px] grid-cols-[64px_1fr]">
        <div className="border-r border-white/10 bg-slate-950/35 p-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
            p
          </div>
          <div className="mt-10 flex flex-col gap-5 text-slate-400">
            {navItems.map((Icon, index) => (
              <span key={index} className="flex size-8 items-center justify-center rounded-lg hover:bg-white/5">
                <Icon className="size-4" />
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-6 p-7 sm:grid-cols-[1fr_1.2fr] sm:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <span className="flex size-8 items-center justify-center rounded-lg bg-violet-600/20 text-violet-200">
                p
              </span>
              Dashboard
            </div>
            <div className="pt-12">
              <h2 className="text-2xl font-semibold text-white">Welkom!</h2>
              <p className="mt-2 max-w-48 text-sm leading-6 text-slate-300">
                Maak een account aan om te beginnen.
              </p>
            </div>
            <div className="relative mt-7 flex size-36 items-center justify-center rounded-3xl bg-[linear-gradient(145deg,#6d5dfc,#9aa4ff)] shadow-[0_28px_70px_-35px_rgba(109,93,252,0.9)]">
              <ClipboardCheck className="size-20 text-white/92" />
              <span className="absolute -right-4 bottom-7 flex size-12 items-center justify-center rounded-full bg-violet-600 text-white ring-4 ring-slate-950/80">
                <Check className="size-6" />
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-white/8 bg-white/[0.025] p-5">
            <p className="text-sm font-semibold text-white">Account aanmaken</p>
            <div className="mt-4 space-y-3">
              {[
                "Naam",
                "E-mailadres",
                "Wachtwoord",
                "Rol",
              ].map((item) => (
                <div key={item}>
                  <div className="mb-1 text-[11px] text-slate-400">{item}</div>
                  <div className="h-9 rounded-md border border-white/10 bg-slate-950/45" />
                </div>
              ))}
              <div className="h-10 rounded-md bg-violet-600" />
              <div className="mx-auto h-2 w-36 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewBlock({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 flex items-center gap-2">
        <BadgeCheck className="size-4 text-emerald-300" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 text-sm sm:grid-cols-[150px_1fr]">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-200">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewUploadThumb({
  file,
  field,
  label,
}: {
  file?: File | null;
  field: FileKey;
  label: string;
}) {
  const preview = useMemo(() => {
    if (!canPreview(file)) {
      return null;
    }

    return URL.createObjectURL(file);
  }, [file]);

  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-slate-950/35 p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-slate-300">{label}</span>
        {file ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-300" /> : null}
      </div>
      <div className="flex h-16 items-center justify-center overflow-hidden rounded-sm bg-white/[0.03]">
        {preview ? (
          <Image
            src={preview}
            alt=""
            width={120}
            height={64}
            className="h-16 w-full object-cover"
            unoptimized
          />
        ) : (
          <UploadPlaceholder field={field} compact />
        )}
      </div>
    </div>
  );
}

export function InstructorRegistrationFlow({
  mode = "signup",
  initialValues,
}: {
  mode?: FlowMode;
  initialValues?: InitialInstructorRegistrationValues;
}) {
  const router = useRouter();
  const [step, setStep] = useState(mode === "verification" ? 2 : 1);
  const [form, setForm] = useState<FormState>(() => buildInitialForm(initialValues));
  const [files, setFiles] = useState<Partial<Record<FileKey, File | null>>>({});
  const [isPending, startTransition] = useTransition();
  const isSignup = mode === "signup";
  const activeSteps = isSignup ? steps : steps.slice(1);
  const currentTitle = steps.find((item) => item.id === step)?.label ?? "Verificatie";
  const statusLabel = initialValues?.profileStatus ?? "in_beoordeling";

  function update<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateFullName(value: string) {
    const name = splitFullName(value);
    setForm((current) => ({
      ...current,
      firstName: name.firstName,
      lastName: name.lastName,
    }));
  }

  function toggleSpecialization(value: string) {
    setForm((current) => ({
      ...current,
      specializations: current.specializations.includes(value)
        ? current.specializations.filter((item) => item !== value)
        : [...current.specializations, value],
    }));
  }

  function setFile(field: FileKey, file: File | null) {
    setFiles((current) => ({ ...current, [field]: file }));
  }

  function validateCurrentStep() {
    if (step === 1 && isSignup) {
      if (!form.firstName || !form.lastName || !form.email || !form.password) {
        return "Vul je naam, e-mailadres en wachtwoord in.";
      }

      if (form.password.length < 8) {
        return "Je wachtwoord moet minimaal 8 tekens hebben.";
      }

      if (form.password !== form.confirmPassword) {
        return "De wachtwoorden komen niet overeen.";
      }

      if (!form.terms) {
        return "Ga akkoord met de voorwaarden om verder te gaan.";
      }
    }

    if (step === 2 && (!fullName(form) || !form.phone)) {
      return "Vul je naam en telefoonnummer in.";
    }

    if (step === 3) {
      if (!form.wrmNumber || !form.wrmCategory || !form.wrmValidUntil) {
        return "Vul je WRM-pasnummer, categorie en geldigheidsdatum in.";
      }

      if (!files.wrm_front || !files.wrm_back || !files.selfie) {
        return "Upload de voorkant, achterkant en selfie voor de WRM-controle.";
      }
    }

    return null;
  }

  function validateBeforeSubmit() {
    if (isSignup) {
      const previousStep = step;
      setStep(1);
      const signupError =
        !form.firstName || !form.lastName || !form.email || !form.password
          ? "Vul je naam, e-mailadres en wachtwoord in."
          : form.password.length < 8
            ? "Je wachtwoord moet minimaal 8 tekens hebben."
            : form.password !== form.confirmPassword
              ? "De wachtwoorden komen niet overeen."
              : !form.terms
                ? "Ga akkoord met de voorwaarden om verder te gaan."
                : null;

      if (signupError) {
        return signupError;
      }

      setStep(previousStep);
    }

    if (!fullName(form) || !form.phone) {
      setStep(2);
      return "Vul je naam en telefoonnummer in.";
    }

    if (!form.wrmNumber || !form.wrmCategory || !form.wrmValidUntil) {
      setStep(3);
      return "Vul je WRM-pasnummer, categorie en geldigheidsdatum in.";
    }

    if (!files.wrm_front || !files.wrm_back || !files.selfie) {
      setStep(3);
      return "Upload de voorkant, achterkant en selfie voor de WRM-controle.";
    }

    return null;
  }

  function nextStep() {
    const error = validateCurrentStep();

    if (error) {
      toast.error(error);
      return;
    }

    setStep((current) => Math.min(5, current + 1));
  }

  function previousStep() {
    setStep((current) => Math.max(isSignup ? 1 : 2, current - 1));
  }

  function buildVerificationFormData() {
    const formData = new FormData();

    formData.set("full_name", fullName(form));
    formData.set("phone", form.phone);
    formData.set("bio", form.bio);
    formData.set("wrm_number", form.wrmNumber);
    formData.set("wrm_category", form.wrmCategory);
    formData.set("wrm_valid_until", form.wrmValidUntil);
    formData.set("school", form.school);
    formData.set("function_role", form.functionRole);
    formData.set("specializations", form.specializations.join(", "));

    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        formData.set(key, file);
      }
    });

    return formData;
  }

  function submitVerificationOnly() {
    const error = validateBeforeSubmit();

    if (error) {
      toast.error(error);
      return;
    }

    startTransition(async () => {
      const result = await submitInstructorVerificationAction(buildVerificationFormData());

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  async function submitSignup() {
    const error = validateBeforeSubmit();

    if (error) {
      toast.error(error);
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            rol: "instructeur",
            volledige_naam: fullName(form),
            telefoon: form.phone,
            bio: form.bio,
            wrm_pasnummer: form.wrmNumber,
            wrm_categorie: form.wrmCategory,
            wrm_geldig_tot: form.wrmValidUntil,
            rijschool_organisatie: form.school,
            functie_rol: form.functionRole,
            specialisaties: form.specializations,
          },
        },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      if (data.session) {
        const verificationResult = await submitInstructorVerificationAction(
          buildVerificationFormData()
        );

        if (!verificationResult.success) {
          toast.warning(
            "Je account is aangemaakt. Rond je WRM-verificatie nog af op de verificatiepagina."
          );
          router.push("/instructeur-verificatie");
          return;
        }

        toast.success("Je account en verificatieaanvraag zijn ingediend.");
        router.push("/instructeur-verificatie");
        return;
      }

      toast.success("Je account is aangemaakt. Bevestig je e-mail om je verificatie af te ronden.");
      router.push("/inloggen?signup=check-email");
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] text-white">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-violet-600 text-base font-bold shadow-[0_12px_34px_-18px_rgba(124,58,237,0.95)]">
            {isSignup ? 1 : step - 1}
          </span>
          <div>
            <p className="text-xs font-medium text-slate-400">Stap {isSignup ? step : step - 1}</p>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {currentTitle}
            </h1>
          </div>
        </div>
        {!isSignup ? (
          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-200">
            <ShieldCheck className="size-4" />
            Status: {statusLabel.replaceAll("_", " ")}
          </span>
        ) : null}
      </div>

      <section className="overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.14),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.96))] shadow-[0_32px_110px_-70px_rgba(15,23,42,0.95)]">
        <ProgressSteps
          activeSteps={activeSteps}
          currentStep={step}
          isPending={isPending}
          onSelect={setStep}
        />

        <div className="min-h-[560px] p-5 sm:p-8">
          {step === 1 ? (
            <div className="grid gap-7 xl:grid-cols-[1fr_0.9fr] xl:items-stretch">
              <RegistrationDashboardPreview />
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5 sm:p-6">
                <StepIntro
                  eyebrow="Stap 1"
                  title="Account aanmaken"
                  description="Maak je instructeursaccount aan. Daarna vul je je profiel en WRM-controle in."
                />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Voornaam"
                    value={form.firstName}
                    placeholder="Jan"
                    onChange={(value) => update("firstName", value)}
                  />
                  <Field
                    label="Achternaam"
                    value={form.lastName}
                    placeholder="de Vries"
                    onChange={(value) => update("lastName", value)}
                  />
                </div>
                <div className="mt-4 grid gap-4">
                  <Field
                    label="E-mailadres"
                    type="email"
                    value={form.email}
                    placeholder="voorbeeld@mail.nl"
                    onChange={(value) => update("email", value)}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Wachtwoord"
                      type="password"
                      value={form.password}
                      placeholder="Minimaal 8 tekens"
                      onChange={(value) => update("password", value)}
                    />
                    <Field
                      label="Bevestig wachtwoord"
                      type="password"
                      value={form.confirmPassword}
                      placeholder="Herhaal wachtwoord"
                      onChange={(value) => update("confirmPassword", value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-200">Rol</Label>
                    <div className="flex h-11 items-center justify-between rounded-lg border border-white/10 bg-slate-950/35 px-3 text-sm text-white">
                      <span>Instructeur</span>
                      <GraduationCap className="size-4 text-violet-200" />
                    </div>
                  </div>
                  <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.terms}
                      onChange={(event) => update("terms", event.target.checked)}
                      className="mt-1 size-4 rounded border-white/20 bg-white/5 accent-violet-500"
                    />
                    <span>
                      Ik ga akkoord met de{" "}
                      <Link href="/voorwaarden" className="text-violet-200 hover:text-white">
                        algemene voorwaarden
                      </Link>{" "}
                      en{" "}
                      <Link href="/privacy" className="text-violet-200 hover:text-white">
                        privacyverklaring
                      </Link>
                      .
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-center">
              <div className="space-y-5">
                <StepIntro
                  eyebrow="Stap 2"
                  title="Vertel ons meer over jezelf"
                  description="Vul je profielgegevens in. Deze gegevens helpen bij herkenning en vertrouwen."
                />
                {!isSignup ? (
                  <Field
                    label="Naam"
                    value={fullName(form)}
                    placeholder="Jan de Vries"
                    onChange={updateFullName}
                  />
                ) : null}
                <Field
                  label="Telefoonnummer"
                  value={form.phone}
                  placeholder="06 12345678"
                  onChange={(value) => update("phone", value)}
                />
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-200">Korte introductie</Label>
                  <Textarea
                    value={form.bio}
                    onChange={(event) => update("bio", event.target.value)}
                    placeholder="Vertel kort iets over je rijstijl, ervaring en werkgebied."
                    className="min-h-28 rounded-lg border-white/10 bg-slate-950/35 px-3 py-3 text-sm text-white placeholder:text-slate-500 focus-visible:border-violet-300/50 focus-visible:ring-violet-400/20"
                  />
                </div>
                <FileDrop
                  label="Profielfoto"
                  field="profile_photo"
                  file={files.profile_photo}
                  onFile={setFile}
                />
              </div>
              <ProfilePreview file={files.profile_photo} name={fullName(form)} />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-5">
                <StepIntro
                  eyebrow="Stap 3"
                  title="WRM-bevoegdheidspas"
                  description="Verplicht. We controleren je instructeursbevoegdheid. Leg pasnummer, categorie en geldig-tot datum vast."
                />
                <Field
                  label="Pasnummer"
                  value={form.wrmNumber}
                  placeholder="123456789"
                  onChange={(value) => update("wrmNumber", value)}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Categorie"
                    value={form.wrmCategory}
                    options={wrmCategoryOptions}
                    onChange={(value) => update("wrmCategory", value)}
                  />
                  <Field
                    label="Geldig tot"
                    type="date"
                    value={form.wrmValidUntil}
                    onChange={(value) => update("wrmValidUntil", value)}
                  />
                </div>
                <FileDrop
                  label="Achterkant pas"
                  field="wrm_back"
                  file={files.wrm_back}
                  required
                  onFile={setFile}
                />
              </div>
              <div className="space-y-4">
                <FileDrop
                  label="Voorkant pas"
                  field="wrm_front"
                  file={files.wrm_front}
                  required
                  compact
                  onFile={setFile}
                />
                <FileDrop
                  label="Foto van jezelf (selfie)"
                  field="selfie"
                  file={files.selfie}
                  required
                  compact
                  onFile={setFile}
                />
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="mx-auto max-w-4xl space-y-6">
              <StepIntro
                eyebrow="Stap 4"
                title="Extra informatie"
                description="Optioneel. Deze informatie helpt ons je beter te ondersteunen."
              />
              <Field
                label="Rijschool / organisatie"
                value={form.school}
                placeholder="Autorijschool de Vries"
                onChange={(value) => update("school", value)}
              />
              <Field
                label="Functie / rol"
                value={form.functionRole}
                placeholder="Hoofdinstructeur"
                onChange={(value) => update("functionRole", value)}
              />
              <div className="space-y-3">
                <Label className="text-xs font-medium text-slate-200">Specialisaties</Label>
                <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3">
                  <div className="flex flex-wrap gap-2">
                    {specializationOptions.map((item) => {
                      const selected = form.specializations.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleSpecialization(item)}
                          className={cx(
                            "inline-flex min-h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition",
                            selected
                              ? "border-violet-300/40 bg-violet-500/24 text-white"
                              : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200"
                          )}
                        >
                          {selected ? <Check className="size-3.5" /> : null}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
              <div className="space-y-5">
                <StepIntro
                  eyebrow="Stap 5"
                  title="Controleer je gegevens"
                  description="Controleer alle informatie voordat je deze indient."
                />
                <div className="rounded-lg border border-white/10 bg-white/[0.03]">
                  <div className="grid divide-y divide-white/10 lg:grid-cols-[0.7fr_1fr] lg:divide-x lg:divide-y-0">
                    <div className="p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                        <UserRound className="size-4 text-violet-200" />
                        Profiel
                      </div>
                      <div className="flex items-center gap-3">
                        <ProfileMini file={files.profile_photo} name={fullName(form)} />
                        <div className="min-w-0 text-sm">
                          <p className="truncate font-medium text-white">{fullName(form) || "Nog leeg"}</p>
                          <p className="mt-1 text-slate-400">{form.phone || "Nog leeg"}</p>
                          <p className="truncate text-slate-400">{form.email || "Via je account"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                        <IdCard className="size-4 text-violet-200" />
                        WRM-verificatie
                      </div>
                      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                        <div className="grid gap-2 text-sm">
                          <div className="grid grid-cols-[110px_1fr] gap-2">
                            <span className="text-slate-500">Pasnummer</span>
                            <span className="text-slate-200">{form.wrmNumber || "Nog leeg"}</span>
                          </div>
                          <div className="grid grid-cols-[110px_1fr] gap-2">
                            <span className="text-slate-500">Categorie</span>
                            <span className="text-slate-200">{form.wrmCategory || "Nog leeg"}</span>
                          </div>
                          <div className="grid grid-cols-[110px_1fr] gap-2">
                            <span className="text-slate-500">Geldig tot</span>
                            <span className="text-slate-200">{form.wrmValidUntil || "Nog leeg"}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <ReviewUploadThumb file={files.wrm_front} field="wrm_front" label="Voor" />
                          <ReviewUploadThumb file={files.wrm_back} field="wrm_back" label="Achter" />
                          <ReviewUploadThumb file={files.selfie} field="selfie" label="Selfie" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-white/10 p-4">
                    <ReviewBlock
                      title="Extra informatie"
                      rows={[
                        ["Rijschool / organisatie", form.school || "Niet ingevuld"],
                        ["Functie / rol", form.functionRole || "Niet ingevuld"],
                        ["Specialisaties", form.specializations.join(", ") || "Niet ingevuld"],
                      ]}
                    />
                  </div>
                </div>
              </div>
              <aside className="rounded-xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.2),transparent_42%),rgba(255,255,255,0.04)] p-6 shadow-[0_28px_80px_-58px_rgba(15,23,42,0.95)]">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-violet-500/18 text-violet-200">
                  <Clock3 className="size-8" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">In afwachting van verificatie</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Nadat je op verzenden klikt, controleren wij je gegevens. Dit kan tot 2 werkdagen duren.
                </p>
                <div className="mt-6 space-y-4 text-sm text-slate-300">
                  <div className="flex gap-3">
                    <Mail className="mt-0.5 size-4 shrink-0 text-violet-200" />
                    Je ontvangt een e-mail wanneer we een beslissing hebben genomen.
                  </div>
                  <div className="flex gap-3">
                    <Eye className="mt-0.5 size-4 shrink-0 text-violet-200" />
                    Je kunt de status altijd bekijken in je dashboard.
                  </div>
                  <div className="flex gap-3">
                    <LockKeyhole className="mt-0.5 size-4 shrink-0 text-violet-200" />
                    Je documenten worden alleen voor deze controle gebruikt.
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={isSignup ? submitSignup : submitVerificationOnly}
                  className="mt-8 min-h-12 w-full rounded-lg bg-violet-600 text-white hover:bg-violet-500"
                >
                  {isPending ? "Verzenden..." : "Gegevens verzenden"}
                </Button>
              </aside>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Button
            type="button"
            variant="outline"
            onClick={previousStep}
            disabled={step === (isSignup ? 1 : 2) || isPending}
            className="min-h-10 rounded-lg border-white/10 bg-white/[0.03] text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 size-4" />
            Vorige
          </Button>
          {step < 5 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={isPending}
              className="min-h-10 rounded-lg bg-violet-600 px-6 text-white hover:bg-violet-500"
            >
              Volgende
              <ArrowRight className="ml-2 size-4" />
            </Button>
          ) : null}
        </div>
      </section>

      {isSignup ? (
        <p className="mt-6 text-center text-sm text-slate-400">
          Leerling?{" "}
          <Link href="/registreren?type=leerling" className="font-medium text-violet-200 hover:text-white">
            Maak een leerlingaccount aan
          </Link>{" "}
          of al een account?{" "}
          <Link href="/inloggen" className="font-medium text-violet-200 hover:text-white">
            Inloggen
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function ProfileMini({ file, name }: { file?: File | null; name: string }) {
  const preview = useMemo(() => {
    if (!canPreview(file)) {
      return null;
    }

    return URL.createObjectURL(file);
  }, [file]);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700 text-sm font-semibold text-white">
      {preview ? (
        <Image
          src={preview}
          alt=""
          width={56}
          height={56}
          className="size-14 object-cover"
          unoptimized
        />
      ) : initials ? (
        initials
      ) : (
        <UserRound className="size-7 text-slate-300" />
      )}
    </div>
  );
}
