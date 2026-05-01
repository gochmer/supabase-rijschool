"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  Eye,
  GraduationCap,
  Grid2X2,
  LockKeyhole,
  Mail,
  Settings,
  UserRound,
} from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitInstructorVerificationAction } from "@/lib/actions/instructor-verification";
import { createClient } from "@/lib/supabase/client";

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

type VerificationProgressStep = {
  id: number;
  label: string;
};

const demoDefaults = {
  firstName: "Jan",
  lastName: "de Vries",
  email: "voorbeeld@mail.nl",
  phone: "06 12345678",
  wrmNumber: "123456789",
  wrmCategory: "A",
  wrmValidUntil: "2026-12-31",
  school: "Autorijschool de Vries",
  functionRole: "Hoofdinstructeur",
  specializations: ["Personenauto (B)", "Aanhangwagen (BE)", "Motor (A)"],
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  bio: "",
  wrmNumber: demoDefaults.wrmNumber,
  wrmCategory: demoDefaults.wrmCategory,
  wrmValidUntil: demoDefaults.wrmValidUntil,
  school: demoDefaults.school,
  functionRole: demoDefaults.functionRole,
  specializations: demoDefaults.specializations,
  terms: false,
};

const verificationProgressSteps: VerificationProgressStep[] = [
  { id: 2, label: "Profiel" },
  { id: 3, label: "WRM verificatie" },
  { id: 4, label: "Extra informatie" },
  { id: 5, label: "Review" },
];

const specializationOptions = [
  "Personenauto (B)",
  "Aanhangwagen (BE)",
  "Motor (A)",
  "Automaat",
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

function buildInitialForm(
  initialValues?: InitialInstructorRegistrationValues,
  mode: FlowMode = "signup"
) {
  const name = splitFullName(initialValues?.fullName);
  const specializations = initialValues?.specializations?.filter(Boolean) ?? [];
  const useDemoFallbacks = mode === "verification";

  return {
    ...initialForm,
    firstName: name.firstName || (useDemoFallbacks ? demoDefaults.firstName : ""),
    lastName: name.lastName || (useDemoFallbacks ? demoDefaults.lastName : ""),
    email: initialValues?.email || (useDemoFallbacks ? demoDefaults.email : ""),
    phone: initialValues?.phone || (useDemoFallbacks ? demoDefaults.phone : ""),
    bio: initialValues?.bio ?? "",
    specializations: specializations.length ? specializations : initialForm.specializations,
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
    return "";
  }

  return file.name;
}

function displayDate(value: string) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}-${month}-${year}`;
}

function StepFrame({
  stepId,
  number,
  title,
  className,
  children,
}: {
  stepId?: number;
  number: number;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cx("min-w-0", className)} id={`verification-step-${stepId ?? number}`}>
      <div className="mb-3 flex items-center gap-2 px-0.5">
        <span className="flex size-7 items-center justify-center rounded-lg bg-[#6757f4] text-[17px] font-bold leading-none text-white shadow-[0_16px_32px_-18px_rgba(103,87,244,0.95)]">
          {number}
        </span>
        <h2 className="text-[18px] font-semibold leading-none tracking-[-0.01em] text-white">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function GlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "overflow-hidden rounded-[10px] border border-white/[0.12] bg-[radial-gradient(circle_at_18%_0%,rgba(110,126,166,0.14),transparent_42%),linear-gradient(145deg,rgba(14,24,39,0.96),rgba(6,13,24,0.985)_58%,rgba(4,9,17,0.99))] shadow-[0_26px_88px_-58px_rgba(2,6,23,0.95)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function VerificationProgress({ activeStep }: { activeStep: number }) {
  return (
    <div className="border-b border-white/[0.08] px-6 py-4">
      <div className="flex items-center gap-3">
        {verificationProgressSteps.map((item, index) => {
          const isDone = item.id < activeStep;
          const isActive = item.id === activeStep;

          return (
            <div key={item.id} className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={cx(
                  "flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  isDone && "bg-emerald-500/65 text-white",
                  isActive && "bg-[#6757f4] text-white",
                  !isDone && !isActive && "bg-white/[0.12] text-slate-400"
                )}
              >
                {isDone ? <Check className="size-3" /> : index + 1}
              </span>
              <span
                className={cx(
                  "truncate text-[10px] font-medium",
                  isActive ? "text-white" : isDone ? "text-slate-200" : "text-slate-500"
                )}
              >
                {item.label}
              </span>
              {index < verificationProgressSteps.length - 1 ? (
                <span className="h-px min-w-4 flex-1 bg-white/[0.12]" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  rightIcon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  rightIcon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="block text-[11px] font-medium text-slate-200">{label}</Label>
      <div className="relative">
        <Input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 rounded-md border-white/[0.13] bg-[#08111f]/70 px-3 text-[12px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] placeholder:text-slate-500 focus-visible:border-[#6f61f8]/70 focus-visible:ring-[#6f61f8]/20"
        />
        {rightIcon ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MiniSelect({
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
    <div className="space-y-1.5">
      <Label className="block text-[11px] font-medium text-slate-200">{label}</Label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full appearance-none rounded-md border border-white/[0.13] bg-[#08111f]/70 px-3 pr-8 text-[12px] text-white outline-none transition focus:border-[#6f61f8]/70 focus:ring-3 focus:ring-[#6f61f8]/20"
        >
          {options.map((option) => (
            <option key={option} value={option} className="bg-[#08111f] text-white">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

function NavButton({
  direction,
  children,
  onClick,
  disabled,
}: {
  direction: "previous" | "next";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const Icon = direction === "previous" ? ArrowLeft : ArrowRight;

  return (
    <Button
      type="button"
      variant={direction === "previous" ? "outline" : "default"}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "h-[29px] rounded-md px-3 text-[12px] font-medium",
        direction === "previous" &&
          "border-white/[0.13] bg-white/[0.025] text-slate-200 hover:bg-white/[0.08] hover:text-white",
        direction === "next" &&
          "min-w-[108px] bg-[#6757f4] text-white hover:bg-[#7668ff]"
      )}
    >
      {direction === "previous" ? <Icon className="mr-1.5 size-3.5" /> : null}
      {children}
      {direction === "next" ? <Icon className="ml-2 size-3.5" /> : null}
    </Button>
  );
}

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={cx(
        "relative flex items-center justify-center rounded-full border border-[#7d6cff]/40 text-[#7d6cff]",
        compact ? "size-[19px]" : "size-[22px]"
      )}
    >
      <span className="absolute size-[7px] rounded-full bg-[#7d6cff]" />
      <span className="absolute right-[3px] bottom-[4px] h-[8px] w-[4px] rounded-full border border-[#7d6cff]" />
    </span>
  );
}

function DashboardSideIcon({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={cx(
        "flex size-8 items-center justify-center rounded-md",
        active ? "text-[#7d6cff]" : "text-slate-300"
      )}
    >
      {children}
    </span>
  );
}

function ClipboardArt() {
  return (
    <div className="relative mx-auto mt-7 h-[156px] w-[146px]">
      <div className="absolute left-3 top-2 h-[130px] w-[96px] rotate-[-5deg] rounded-[18px] border border-[#7668ff]/50 bg-[linear-gradient(145deg,#5947d9,#7d87ff)] shadow-[0_26px_46px_-26px_rgba(112,96,255,0.98)]" />
      <div className="absolute left-10 top-0 h-9 w-16 rotate-[-5deg] rounded-[13px] border border-[#988fff]/70 bg-[linear-gradient(145deg,#7a67ff,#9aa8ff)]" />
      <div className="absolute left-[24px] top-[24px] h-[106px] w-[86px] rotate-[-5deg] rounded-[11px] bg-[linear-gradient(180deg,#f1f5ff,#cfd8ff)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div className="mx-auto mt-8 size-7 rounded-full bg-[#4a5ec9]" />
        <div className="mx-auto mt-2 h-7 w-11 rounded-t-full bg-[#4057c4]" />
        <div className="mx-auto mt-4 h-2 w-14 rounded-full bg-[#4a5ec9]" />
        <div className="ml-5 mt-3 h-2 w-12 rounded-full bg-[#4a5ec9]" />
        <div className="ml-5 mt-2 h-2 w-8 rounded-full bg-[#4a5ec9]" />
      </div>
      <div className="absolute right-0 bottom-8 flex size-[44px] items-center justify-center rounded-full border border-[#a79dff]/70 bg-[linear-gradient(145deg,#6757f4,#7d72ff)] text-white shadow-[0_18px_34px_-18px_rgba(103,87,244,0.9)]">
        <Check className="size-6 stroke-[3]" />
      </div>
    </div>
  );
}

function InstructorPortrait({ file, size = "large" }: { file?: File | null; size?: "large" | "small" }) {
  const preview = useMemo(() => {
    if (!canPreview(file)) {
      return null;
    }

    return URL.createObjectURL(file);
  }, [file]);

  const isLarge = size === "large";

  return (
    <span
      className={cx(
        "relative flex shrink-0 items-end justify-center overflow-hidden rounded-full bg-[linear-gradient(180deg,#d9dedf,#b9c1c4)]",
        isLarge ? "size-[162px]" : "size-[68px]"
      )}
    >
      {preview ? (
        <Image
          src={preview}
          alt=""
          width={isLarge ? 180 : 80}
          height={isLarge ? 180 : 80}
          className="size-full object-cover"
          unoptimized
        />
      ) : (
        <>
          <span
            className={cx(
              "absolute rounded-[46%_46%_42%_42%] bg-[#5a3826]",
              isLarge ? "top-[22px] h-[54px] w-[75px]" : "top-[10px] h-[23px] w-[31px]"
            )}
          />
          <span
            className={cx(
              "absolute rounded-full bg-[#f2c9a8]",
              isLarge ? "top-[42px] h-[75px] w-[61px]" : "top-[19px] h-[32px] w-[26px]"
            )}
          />
          <span
            className={cx(
              "absolute rounded-full bg-[#e9b58f]",
              isLarge ? "top-[78px] h-[12px] w-[12px]" : "top-[34px] h-[5px] w-[5px]"
            )}
          />
          <span
            className={cx(
              "absolute rounded-t-full bg-[#27324a]",
              isLarge ? "-bottom-6 h-[66px] w-[104px]" : "-bottom-2 h-[28px] w-[44px]"
            )}
          />
          <span
            className={cx(
              "absolute rounded-t-full bg-[#f2c9a8]",
              isLarge ? "bottom-[35px] h-[15px] w-[28px]" : "bottom-[15px] h-[7px] w-[12px]"
            )}
          />
          <span
            className={cx(
              "absolute rounded-full bg-[#203044]",
              isLarge ? "left-[62px] top-[70px] size-[4px]" : "left-[26px] top-[30px] size-[2px]"
            )}
          />
          <span
            className={cx(
              "absolute rounded-full bg-[#203044]",
              isLarge ? "right-[62px] top-[70px] size-[4px]" : "right-[26px] top-[30px] size-[2px]"
            )}
          />
          <span
            className={cx(
              "absolute rounded-full border-b-2 border-[#b76760]",
              isLarge ? "top-[91px] h-[10px] w-[24px]" : "top-[39px] h-[5px] w-[10px] border-b"
            )}
          />
        </>
      )}
    </span>
  );
}

function ProfilePreview({ file }: { file?: File | null }) {
  return (
    <div className="flex h-full min-h-[260px] items-center justify-center">
      <div className="relative">
        <InstructorPortrait file={file} />
        <span className="absolute right-0 bottom-2 flex size-8 items-center justify-center rounded-full bg-[#6757f4] text-white shadow-[0_16px_28px_-16px_rgba(103,87,244,0.95)] ring-4 ring-[#08111f]">
          <Camera className="size-4" />
        </span>
      </div>
    </div>
  );
}

function WrmCardArt({ back = false, compact = false }: { back?: boolean; compact?: boolean }) {
  return (
    <span
      className={cx(
        "grid overflow-hidden rounded-md border border-sky-100/40 bg-[linear-gradient(145deg,#8bd8e9,#d8f3fb_48%,#8caec9)] p-2 text-left text-slate-950 shadow-[0_18px_34px_-28px_rgba(14,165,233,0.75)]",
        compact ? "h-[74px] w-[154px]" : "h-[88px] w-[188px]"
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <strong className={cx("leading-none font-black tracking-tight", compact ? "text-[22px]" : "text-[24px]")}>
          WRM
        </strong>
        <span className="max-w-[72px] text-[6px] leading-[1.15] font-bold text-slate-700">
          Certificaat
          <br />
          Rijinstructeur
        </span>
      </span>
      <span
        className={cx(
          "mt-1 grid gap-2",
          back ? "grid-cols-1" : compact ? "grid-cols-[34px_1fr]" : "grid-cols-[42px_1fr]"
        )}
      >
        {!back ? <span className="rounded-sm bg-slate-700/70" /> : null}
        <span className="space-y-1 pt-0.5">
          <span className="block h-1 rounded bg-slate-700/55" />
          <span className="block h-1 rounded bg-slate-700/35" />
          <span className="block h-1 rounded bg-slate-700/35" />
          {back ? <span className="block h-1 rounded bg-slate-700/25" /> : null}
        </span>
      </span>
      <span className="mt-auto h-3 rounded bg-white/25" />
    </span>
  );
}

function UploadDrop({
  label,
  field,
  file,
  required = false,
  variant = "profile",
  onFile,
}: {
  label: string;
  field: FileKey;
  file?: File | null;
  required?: boolean;
  variant?: "profile" | "wrm-front" | "wrm-back" | "selfie";
  onFile: (field: FileKey, file: File | null) => void;
}) {
  const preview = useMemo(() => {
    if (!canPreview(file)) {
      return null;
    }

    return URL.createObjectURL(file);
  }, [file]);

  const isDocument = variant === "wrm-front" || variant === "wrm-back";
  const isReady = Boolean(file) || isDocument || variant === "selfie";

  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-[11px] font-medium text-slate-200">
        <span>{label}</span>
        {isReady ? (
          <span className="flex size-[18px] items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="size-3" />
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
          "flex cursor-pointer flex-col rounded-md border border-white/[0.1] bg-[#08111f]/55 p-2 transition hover:border-[#7668ff]/45 hover:bg-[#111a2b]",
          variant === "profile" ? "min-h-[126px]" : "min-h-[126px]"
        )}
      >
        <span
          className={cx(
            "flex flex-1 items-center justify-center overflow-hidden rounded-md bg-white/[0.025] text-center",
            variant === "profile" && "border border-dashed border-[#506183]/70",
            variant !== "profile" && "border border-white/[0.06]"
          )}
        >
          {preview ? (
            <Image
              src={preview}
              alt=""
              width={variant === "selfie" ? 130 : 220}
              height={variant === "selfie" ? 100 : 120}
              className={cx(
                "rounded-md object-cover",
                variant === "selfie" ? "h-[86px] w-[110px]" : "h-[74px] w-[160px]"
              )}
              unoptimized
            />
          ) : variant === "profile" ? (
            <span className="grid place-items-center px-4 text-center">
              <span className="mb-3 flex size-9 items-center justify-center rounded-md text-[#7668ff]">
                <Camera className="size-7" />
              </span>
              <span className="text-[12px] font-semibold text-white">
                Klik om een foto te uploaden
              </span>
              <span className="mt-1 max-w-[220px] text-[10px] leading-4 text-slate-400">
                of sleep een bestand hierheen
                <br />
                JPG, PNG of HEIC (max. 5MB)
              </span>
            </span>
          ) : variant === "selfie" ? (
            <InstructorPortrait size="small" />
          ) : (
            <WrmCardArt back={variant === "wrm-back"} compact />
          )}
        </span>
        {variant !== "profile" ? (
          <span className="mt-2 flex h-[26px] items-center justify-center rounded border border-white/[0.1] bg-white/[0.025] text-[11px] font-medium text-slate-200">
            Wijzig foto
          </span>
        ) : null}
        {file ? (
          <span className="mt-1 truncate text-center text-[10px] text-slate-500">
            {fileLabel(file)}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function RegistrationPanel({
  form,
  update,
  onNext,
  isPending,
}: {
  form: FormState;
  update: <Key extends keyof FormState>(key: Key, value: FormState[Key]) => void;
  onNext: () => void;
  isPending: boolean;
}) {
  return (
    <GlassPanel className="h-full min-h-[464px]">
      <div className="grid h-full min-h-[464px] grid-cols-[44px_1fr]">
        <aside className="flex flex-col items-center gap-7 border-r border-white/[0.08] px-2 py-5">
          <LogoMark />
          <div className="mt-4 flex flex-col items-center gap-3">
            <DashboardSideIcon active>
              <Grid2X2 className="size-4" />
            </DashboardSideIcon>
            <DashboardSideIcon>
              <UserRound className="size-4" />
            </DashboardSideIcon>
            <DashboardSideIcon>
              <GraduationCap className="size-4" />
            </DashboardSideIcon>
            <DashboardSideIcon>
              <CalendarDays className="size-4" />
            </DashboardSideIcon>
            <DashboardSideIcon>
              <Settings className="size-4" />
            </DashboardSideIcon>
          </div>
        </aside>

        <div className="grid min-w-0 grid-cols-[0.95fr_1.2fr]">
          <div className="min-w-0 px-6 py-5">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
              <LogoMark compact />
              Dashboard
            </div>
            <div className="mt-[70px]">
              <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-white">
                Welkom!
              </h3>
              <p className="mt-2 max-w-[150px] text-[13px] leading-5 text-slate-300">
                Maak een account aan om te beginnen
              </p>
            </div>
            <ClipboardArt />
          </div>

          <div className="border-l border-white/[0.08] px-5 py-[58px]">
            <h3 className="text-[14px] font-semibold text-white">Account aanmaken</h3>
            <div className="mt-4 space-y-3">
              <MiniField
                label="Naam"
                value={fullName(form)}
                placeholder="Jouw volledige naam"
                onChange={(value) => {
                  const name = splitFullName(value);
                  update("firstName", name.firstName);
                  update("lastName", name.lastName);
                }}
              />
              <MiniField
                label="E-mailadres"
                type="email"
                value={form.email}
                placeholder="voorbeeld@mail.nl"
                onChange={(value) => update("email", value)}
              />
              <MiniField
                label="Wachtwoord"
                type="password"
                value={form.password}
                placeholder="••••••••••••••"
                rightIcon={<Eye className="size-3.5" />}
                onChange={(value) => {
                  update("password", value);
                  update("confirmPassword", value);
                }}
              />
              <div className="space-y-1.5">
                <Label className="block text-[11px] font-medium text-slate-200">Rol</Label>
                <div className="flex h-9 items-center justify-between rounded-md border border-white/[0.13] bg-[#08111f]/70 px-3 text-[12px] text-white">
                  <span>Instructeur</span>
                  <ChevronDown className="size-3.5 text-slate-400" />
                </div>
              </div>
              <label className="flex items-start gap-2 text-[10px] leading-4 text-slate-400">
                <input
                  type="checkbox"
                  checked={form.terms}
                  onChange={(event) => update("terms", event.target.checked)}
                  className="mt-0.5 size-3 rounded border-white/20 bg-white/5 accent-[#6757f4]"
                />
                <span>
                  Ik ga akkoord met de{" "}
                  <Link href="/voorwaarden" className="text-[#8d7cff]">
                    Algemene voorwaarden
                  </Link>{" "}
                  en{" "}
                  <Link href="/privacy" className="text-[#8d7cff]">
                    Privacyverklaring
                  </Link>
                </span>
              </label>
              <Button
                type="button"
                disabled={isPending}
                onClick={onNext}
                className="h-9 w-full rounded-md bg-[#6757f4] text-[12px] text-white hover:bg-[#7668ff]"
              >
                Account aanmaken
              </Button>
              <p className="text-center text-[10px] text-slate-500">
                Heb je al een account?{" "}
                <Link href="/inloggen" className="text-[#8d7cff]">
                  Inloggen
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

function ProfilePanel({
  form,
  files,
  updateFullName,
  update,
  onFile,
  onPrevious,
  onNext,
  isPending,
}: {
  form: FormState;
  files: Partial<Record<FileKey, File | null>>;
  updateFullName: (value: string) => void;
  update: <Key extends keyof FormState>(key: Key, value: FormState[Key]) => void;
  onFile: (field: FileKey, file: File | null) => void;
  onPrevious: () => void;
  onNext: () => void;
  isPending: boolean;
}) {
  return (
    <GlassPanel className="min-h-[464px]">
      <VerificationProgress activeStep={2} />
      <div className="grid min-h-[390px] gap-8 px-6 py-5 xl:grid-cols-[minmax(0,1fr)_172px]">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-white">
            Vertel ons meer over jezelf
          </h3>
          <p className="mt-2 text-[11px] text-slate-400">Vul je profielgegevens in.</p>
          <div className="mt-5 space-y-4">
            <MiniField
              label="Naam"
              value={fullName(form)}
              placeholder={demoDefaults.firstName + " " + demoDefaults.lastName}
              onChange={updateFullName}
            />
            <MiniField
              label="Telefoonnummer"
              value={form.phone}
              placeholder={demoDefaults.phone}
              onChange={(value) => update("phone", value)}
            />
            <UploadDrop
              label="Profielfoto"
              field="profile_photo"
              file={files.profile_photo}
              variant="profile"
              onFile={onFile}
            />
          </div>
        </div>
        <ProfilePreview file={files.profile_photo} />
      </div>
      <div className="flex items-center justify-between px-6 pb-5">
        <NavButton direction="previous" disabled={isPending} onClick={onPrevious}>
          Vorige
        </NavButton>
        <NavButton direction="next" disabled={isPending} onClick={onNext}>
          Volgende
        </NavButton>
      </div>
    </GlassPanel>
  );
}

function WrmPanel({
  form,
  files,
  update,
  onFile,
  onPrevious,
  onNext,
  isPending,
}: {
  form: FormState;
  files: Partial<Record<FileKey, File | null>>;
  update: <Key extends keyof FormState>(key: Key, value: FormState[Key]) => void;
  onFile: (field: FileKey, file: File | null) => void;
  onPrevious: () => void;
  onNext: () => void;
  isPending: boolean;
}) {
  return (
    <GlassPanel className="min-h-[492px]">
      <VerificationProgress activeStep={3} />
      <div className="grid min-h-[397px] gap-8 px-6 py-5 xl:grid-cols-[minmax(0,1fr)_206px]">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-white">
            WRM-bevoegdheidspas
          </h3>
          <p className="mt-2 max-w-[360px] text-[10px] leading-4 text-slate-400">
            Verplicht. Basiscontrole voor instructeursbevoegdheid. Leg pasnummer,
            categorie en geldig-tot datum vast.
          </p>
          <div className="mt-5 space-y-4">
            <MiniField
              label="Pasnummer"
              value={form.wrmNumber}
              placeholder={demoDefaults.wrmNumber}
              onChange={(value) => update("wrmNumber", value)}
            />
            <MiniSelect
              label="Categorie"
              value={form.wrmCategory}
              options={wrmCategoryOptions}
              onChange={(value) => update("wrmCategory", value)}
            />
            <MiniField
              label="Geldig tot"
              type="date"
              value={form.wrmValidUntil}
              rightIcon={<CalendarDays className="size-3.5" />}
              onChange={(value) => update("wrmValidUntil", value)}
            />
            <UploadDrop
              label="Achterkant pas"
              field="wrm_back"
              file={files.wrm_back}
              required
              variant="wrm-back"
              onFile={onFile}
            />
          </div>
        </div>
        <div className="space-y-4">
          <UploadDrop
            label="Voorkant pas"
            field="wrm_front"
            file={files.wrm_front}
            required
            variant="wrm-front"
            onFile={onFile}
          />
          <UploadDrop
            label="Foto van jezelf (selfie)"
            field="selfie"
            file={files.selfie}
            required
            variant="selfie"
            onFile={onFile}
          />
        </div>
      </div>
      <div className="flex items-center justify-between px-6 pb-5">
        <NavButton direction="previous" disabled={isPending} onClick={onPrevious}>
          Vorige
        </NavButton>
        <NavButton direction="next" disabled={isPending} onClick={onNext}>
          Volgende
        </NavButton>
      </div>
    </GlassPanel>
  );
}

function SpecializationChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex h-8 items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.045] px-3 text-[12px] text-white transition hover:border-[#7668ff]/45 hover:bg-[#7668ff]/15"
    >
      {label}
      <span className="text-slate-400">×</span>
    </button>
  );
}

function ExtraInfoPanel({
  form,
  update,
  toggleSpecialization,
  onPrevious,
  onNext,
  isPending,
}: {
  form: FormState;
  update: <Key extends keyof FormState>(key: Key, value: FormState[Key]) => void;
  toggleSpecialization: (value: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  isPending: boolean;
}) {
  return (
    <GlassPanel className="min-h-[424px]">
      <VerificationProgress activeStep={4} />
      <div className="min-h-[278px] px-6 py-6">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-white">
          Extra informatie <span className="font-normal text-slate-300">(optioneel)</span>
        </h3>
        <p className="mt-3 text-[11px] text-slate-400">
          Deze informatie helpt ons je beter te ondersteunen.
        </p>
        <div className="mt-6 space-y-5">
          <MiniField
            label="Rijschool / Organisatie"
            value={form.school}
            placeholder={demoDefaults.school}
            onChange={(value) => update("school", value)}
          />
          <MiniField
            label="Functie / Rol"
            value={form.functionRole}
            placeholder={demoDefaults.functionRole}
            onChange={(value) => update("functionRole", value)}
          />
          <div className="space-y-1.5">
            <Label className="block text-[11px] font-medium text-slate-200">
              Specialisaties
            </Label>
            <div className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-white/[0.13] bg-[#08111f]/70 px-3 py-2">
              <div className="flex flex-wrap gap-2">
                {form.specializations.map((item) => (
                  <SpecializationChip
                    key={item}
                    label={item}
                    onRemove={() => toggleSpecialization(item)}
                  />
                ))}
                {!form.specializations.length ? (
                  <button
                    type="button"
                    onClick={() => toggleSpecialization(specializationOptions[0])}
                    className="h-8 rounded-md border border-white/[0.08] bg-white/[0.045] px-3 text-[12px] text-slate-300"
                  >
                    Specialisatie toevoegen
                  </button>
                ) : null}
              </div>
              <ChevronDown className="size-4 shrink-0 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-6 pb-5">
        <NavButton direction="previous" disabled={isPending} onClick={onPrevious}>
          Vorige
        </NavButton>
        <NavButton direction="next" disabled={isPending} onClick={onNext}>
          Volgende
        </NavButton>
      </div>
    </GlassPanel>
  );
}

function ReviewThumb({
  file,
  field,
}: {
  file?: File | null;
  field: "wrm-front" | "wrm-back" | "selfie";
}) {
  const preview = useMemo(() => {
    if (!canPreview(file)) {
      return null;
    }

    return URL.createObjectURL(file);
  }, [file]);

  return (
    <span className="flex h-[54px] w-[64px] shrink-0 items-center justify-center overflow-hidden rounded border border-white/[0.08] bg-white/[0.04]">
      {preview ? (
        <Image
          src={preview}
          alt=""
          width={70}
          height={54}
          className="size-full object-cover"
          unoptimized
        />
      ) : field === "selfie" ? (
        <InstructorPortrait size="small" />
      ) : (
        <WrmCardArt back={field === "wrm-back"} compact />
      )}
    </span>
  );
}

function ReviewPanel({
  form,
  files,
  onPrevious,
  onSubmit,
  isPending,
}: {
  form: FormState;
  files: Partial<Record<FileKey, File | null>>;
  onPrevious: () => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <GlassPanel className="min-h-[424px]">
      <div className="grid min-h-[424px] gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_292px] xl:grid-cols-[minmax(0,1fr)_278px]">
        <div className="min-w-0">
          <VerificationProgress activeStep={5} />
          <div className="px-1 py-5">
            <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-white">
              Controleer je gegevens
            </h3>
            <p className="mt-2 text-[11px] text-slate-400">
              Controleer alle informatie voordat je deze indient.
            </p>

            <div className="mt-5 overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.018]">
              <div className="grid divide-y divide-white/[0.08] lg:grid-cols-[0.42fr_0.58fr] lg:divide-x lg:divide-y-0">
                <div className="p-3">
                  <h4 className="mb-3 text-[12px] font-semibold text-white">Profiel</h4>
                  <div className="flex items-center gap-3">
                    <InstructorPortrait file={files.profile_photo} size="small" />
                    <div className="min-w-0 text-[12px] leading-5">
                      <p className="truncate text-slate-200">{fullName(form)}</p>
                      <p className="text-slate-400">{form.phone}</p>
                      <p className="truncate text-slate-400">{form.email}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <h4 className="mb-3 text-[12px] font-semibold text-white">WRM-verificatie</h4>
                  <div className="grid gap-3 xl:grid-cols-[minmax(112px,0.88fr)_minmax(0,1.12fr)]">
                    <div className="grid gap-2 text-[11px]">
                      <div className="grid grid-cols-[72px_1fr] gap-2">
                        <span className="text-slate-500">Pasnummer</span>
                        <span className="text-slate-200">{form.wrmNumber}</span>
                      </div>
                      <div className="grid grid-cols-[72px_1fr] gap-2">
                        <span className="text-slate-500">Categorie</span>
                        <span className="text-slate-200">{form.wrmCategory}</span>
                      </div>
                      <div className="grid grid-cols-[72px_1fr] gap-2">
                        <span className="text-slate-500">Geldig tot</span>
                        <span className="text-slate-200">{displayDate(form.wrmValidUntil)}</span>
                      </div>
                    </div>
                    <div className="flex min-w-0 gap-1.5 overflow-hidden">
                      <ReviewThumb file={files.wrm_front} field="wrm-front" />
                      <ReviewThumb file={files.wrm_back} field="wrm-back" />
                      <ReviewThumb file={files.selfie} field="selfie" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.08] p-3">
                <h4 className="mb-4 text-[12px] font-semibold text-white">Extra informatie</h4>
                <div className="grid gap-3 text-[11px] sm:grid-cols-[150px_1fr]">
                  <span className="text-slate-500">Rijschool / Organisatie</span>
                  <span className="text-slate-200">{form.school}</span>
                  <span className="text-slate-500">Functie / Rol</span>
                  <span className="text-slate-200">{form.functionRole}</span>
                  <span className="text-slate-500">Specialisaties</span>
                  <span className="text-slate-200">{form.specializations.join(", ")}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="px-1 pb-1">
            <NavButton direction="previous" disabled={isPending} onClick={onPrevious}>
              Vorige
            </NavButton>
          </div>
        </div>

        <aside className="rounded-[10px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(103,87,244,0.2),transparent_43%),rgba(255,255,255,0.035)] p-5">
          <div className="flex size-[58px] items-center justify-center rounded-full bg-[#6757f4]/24 text-[#9b8cff]">
            <Clock3 className="size-8" />
          </div>
          <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.01em] text-white">
            In afwachting van verificatie
          </h3>
          <p className="mt-3 text-[12px] leading-5 text-slate-400">
            Nadat je op verzenden klikt, controleren wij je gegevens. Dit kan tot 2 werkdagen
            duren.
          </p>
          <div className="mt-5 space-y-4 text-[11px] leading-5 text-slate-300">
            <div className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-[#8d7cff]" />
              <span>Je ontvangt een e-mail wanneer we een beslissing hebben genomen.</span>
            </div>
            <div className="flex gap-3">
              <Eye className="mt-0.5 size-4 shrink-0 text-[#8d7cff]" />
              <span>Je kunt de status altijd bekijken in je dashboard.</span>
            </div>
            <div className="flex gap-3">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-[#8d7cff]" />
              <span>Je documenten worden alleen voor deze controle gebruikt.</span>
            </div>
          </div>
          <Button
            type="button"
            disabled={isPending}
            onClick={onSubmit}
            className="mt-8 h-10 w-full rounded-md bg-[#6757f4] text-[12px] text-white hover:bg-[#7668ff]"
          >
            {isPending ? "Verzenden..." : "Gegevens verzenden"}
          </Button>
        </aside>
      </div>
    </GlassPanel>
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
  const [form, setForm] = useState<FormState>(() => buildInitialForm(initialValues, mode));
  const [files, setFiles] = useState<Partial<Record<FileKey, File | null>>>({});
  const [isPending, startTransition] = useTransition();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const isSignup = mode === "signup";
  const visibleStepOffset = isSignup ? 0 : 1;

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

  function scrollToStep(targetStep: number) {
    setStep(targetStep);
    document
      .getElementById(`verification-step-${targetStep}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function validateStep(stepToValidate: number) {
    if (stepToValidate === 1 && isSignup) {
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

    if (stepToValidate === 2 && (!fullName(form) || !form.phone)) {
      return "Vul je naam en telefoonnummer in.";
    }

    if (stepToValidate === 3) {
      if (!form.wrmNumber || !form.wrmCategory || !form.wrmValidUntil) {
        return "Vul je WRM-pasnummer, categorie en geldigheidsdatum in.";
      }

      if (!files.wrm_front || !files.wrm_back || !files.selfie) {
        return "Upload de voorkant, achterkant en selfie voor de WRM-controle.";
      }
    }

    return null;
  }

  function goNext(fromStep: number) {
    const error = validateStep(fromStep);

    if (error) {
      toast.error(error);
      return;
    }

    scrollToStep(Math.min(5, fromStep + 1));
  }

  function goPrevious(fromStep: number) {
    scrollToStep(Math.max(isSignup ? 1 : 2, fromStep - 1));
  }

  function validateBeforeSubmit() {
    if (isSignup) {
      const signupError = validateStep(1);

      if (signupError) {
        scrollToStep(1);
        return signupError;
      }
    }

    const profileError = validateStep(2);

    if (profileError) {
      scrollToStep(2);
      return profileError;
    }

    const wrmError = validateStep(3);

    if (wrmError) {
      scrollToStep(3);
      return wrmError;
    }

    return null;
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
    <div
      ref={boardRef}
      className="mx-auto w-full max-w-[1514px] text-white"
      data-current-step={step}
    >
      <div
        className={cx(
          "grid gap-x-9 gap-y-6",
          isSignup
            ? "2xl:grid-cols-[minmax(0,462px)_minmax(0,472px)_minmax(0,1fr)]"
            : "2xl:grid-cols-[minmax(0,472px)_minmax(0,1fr)]"
        )}
      >
        {isSignup ? (
          <StepFrame stepId={1} number={1} title="Stap 1 – Registratie">
            <RegistrationPanel
              form={form}
              update={update}
              onNext={() => goNext(1)}
              isPending={isPending}
            />
          </StepFrame>
        ) : null}

        <StepFrame
          stepId={2}
          number={2 - visibleStepOffset}
          title={`Stap ${2 - visibleStepOffset} – Profiel`}
        >
          <ProfilePanel
            form={form}
            files={files}
            updateFullName={updateFullName}
            update={update}
            onFile={setFile}
            onPrevious={() => goPrevious(2)}
            onNext={() => goNext(2)}
            isPending={isPending}
          />
        </StepFrame>

        <StepFrame
          stepId={3}
          number={3 - visibleStepOffset}
          title={`Stap ${3 - visibleStepOffset} – WRM verificatie`}
        >
          <WrmPanel
            form={form}
            files={files}
            update={update}
            onFile={setFile}
            onPrevious={() => goPrevious(3)}
            onNext={() => goNext(3)}
            isPending={isPending}
          />
        </StepFrame>
      </div>

      <div
        className={cx(
          "mt-5 grid gap-x-11 gap-y-6",
          !isSignup && "2xl:grid-cols-[minmax(0,552px)_minmax(0,0.92fr)]"
        )}
      >
        <StepFrame
          stepId={4}
          number={4 - visibleStepOffset}
          title={`Stap ${4 - visibleStepOffset} – Extra informatie`}
        >
          <ExtraInfoPanel
            form={form}
            update={update}
            toggleSpecialization={toggleSpecialization}
            onPrevious={() => goPrevious(4)}
            onNext={() => goNext(4)}
            isPending={isPending}
          />
        </StepFrame>

        <StepFrame
          stepId={5}
          number={5 - visibleStepOffset}
          title={`Stap ${5 - visibleStepOffset} – Review & submit`}
        >
          <ReviewPanel
            form={form}
            files={files}
            onPrevious={() => goPrevious(5)}
            onSubmit={isSignup ? submitSignup : submitVerificationOnly}
            isPending={isPending}
          />
        </StepFrame>
      </div>
    </div>
  );
}
