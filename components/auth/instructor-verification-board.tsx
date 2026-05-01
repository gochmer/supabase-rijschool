"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { submitInstructorVerificationAction } from "@/lib/actions/instructor-verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InitialInstructorVerificationValues = {
  fullName?: string;
  email?: string;
  phone?: string;
  bio?: string | null;
  specializations?: string[] | null;
};

type VerificationForm = {
  fullName: string;
  email: string;
  phone: string;
  wrmNumber: string;
  wrmCategory: string;
  wrmValidUntil: string;
  school: string;
  functionRole: string;
  specializations: string[];
  extraInfo: string;
};

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

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function usePreview(file?: File | null) {
  return useMemo(() => {
    if (!file?.type.startsWith("image/")) {
      return null;
    }

    return URL.createObjectURL(file);
  }, [file]);
}

function buildInitialForm(
  initialValues?: InitialInstructorVerificationValues
): VerificationForm {
  const specializations = initialValues?.specializations?.filter(Boolean) ?? [];

  return {
    fullName: initialValues?.fullName ?? "",
    email: initialValues?.email ?? "",
    phone: initialValues?.phone ?? "",
    wrmNumber: "",
    wrmCategory: "B",
    wrmValidUntil: "",
    school: "",
    functionRole: "",
    specializations: specializations.length
      ? specializations
      : ["Personenauto (B)"],
    extraInfo: initialValues?.bio ?? "",
  };
}

function StepTitle({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-lg font-semibold text-white shadow-[0_16px_34px_-22px_rgba(124,58,237,0.9)]">
        {number}
      </span>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Step {number} - {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function BoardCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-xl border border-slate-700/70 bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(8,16,31,0.96))] p-5 shadow-[0_24px_80px_-58px_rgba(2,6,23,0.95)]",
        className
      )}
    >
      {children}
    </section>
  );
}

function InnerPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-lg border border-slate-700/70 bg-[linear-gradient(145deg,rgba(15,23,42,0.72),rgba(10,20,38,0.82))] p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  trailingIcon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  trailingIcon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-white">{label}</Label>
      <div className="relative">
        <Input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 rounded-md border-slate-700/80 bg-slate-900/70 px-4 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-slate-500 focus-visible:border-violet-400/60 focus-visible:ring-violet-400/20"
        />
        {trailingIcon ? (
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400">
            {trailingIcon}
          </span>
        ) : null}
      </div>
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
      <Label className="text-xs font-semibold text-white">{label}</Label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-md border border-slate-700/80 bg-slate-900/70 px-4 pr-10 text-sm font-medium text-white outline-none transition focus:border-violet-400/60 focus:ring-3 focus:ring-violet-400/20"
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

function AvatarIllustration({
  name,
  file,
  size = "lg",
}: {
  name: string;
  file?: File | null;
  size?: "sm" | "md" | "lg";
}) {
  const preview = usePreview(file);
  const initials = initialsFromName(name);
  const sizeClass = size === "sm" ? "size-16" : size === "md" ? "size-24" : "size-32";

  return (
    <div
      className={cx(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(145deg,#e6edf5,#b9c6d7)] text-lg font-bold text-slate-600",
        sizeClass
      )}
    >
      {preview ? (
        <Image
          src={preview}
          alt=""
          width={size === "sm" ? 64 : size === "md" ? 96 : 128}
          height={size === "sm" ? 64 : size === "md" ? 96 : 128}
          className="size-full object-cover"
          unoptimized
        />
      ) : (
        <div className="relative size-full">
          <div className="absolute top-[16%] left-1/2 h-[27%] w-[42%] -translate-x-1/2 rounded-t-full bg-[#7a4e2f]" />
          <div className="absolute top-[26%] left-1/2 h-[39%] w-[38%] -translate-x-1/2 rounded-full bg-[#ffd09d]" />
          <div className="absolute top-[42%] left-[40%] size-1.5 rounded-full bg-slate-700" />
          <div className="absolute top-[42%] right-[40%] size-1.5 rounded-full bg-slate-700" />
          <div className="absolute top-[54%] left-1/2 h-1.5 w-4 -translate-x-1/2 rounded-full border-b-2 border-[#c07b58]" />
          <div className="absolute right-[28%] bottom-[28%] h-[24%] w-[16%] rotate-12 rounded-full bg-[#ffd09d]" />
          <div className="absolute bottom-0 left-1/2 h-[38%] w-[58%] -translate-x-1/2 rounded-t-full bg-[#1f2a44]" />
          {initials ? (
            <span className="sr-only">{initials}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ProfilePhotoUpload({
  file,
  onFile,
}: {
  file?: File | null;
  onFile: (file: File | null) => void;
}) {
  return (
    <label className="block">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />
      <span className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-950/20 p-6 text-center transition hover:border-violet-400/60 hover:bg-violet-500/10">
        <span className="flex size-12 items-center justify-center rounded-full bg-violet-600 text-white">
          <Camera className="size-6" />
        </span>
        <span className="mt-5 text-sm font-semibold text-white">
          Klik om een foto te uploaden
        </span>
        <span className="mt-3 text-xs text-slate-400">of sleep een bestand hierheen</span>
        <span className="mt-4 text-xs text-slate-400">PNG, JPG of JPEG (max. 5MB)</span>
        {file ? (
          <span className="mt-4 max-w-full truncate text-xs text-violet-200">
            {file.name}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function WrmCardIllustration({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cx(
        "grid overflow-hidden rounded-md border border-sky-200/25 bg-[linear-gradient(135deg,#d8f5ff,#a9d7ea_56%,#eaf8ff)] p-3 text-slate-950 shadow-[0_16px_36px_-28px_rgba(125,211,252,0.75)]",
        compact ? "h-16 w-36" : "h-24 w-52"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <strong className={cx("font-black tracking-tight", compact ? "text-lg" : "text-2xl")}>
          WRM
        </strong>
        <span className="text-[6px] leading-tight font-semibold text-slate-600">
          Verklaring
          <br />
          Rijbevoegdheid
          <br />
          Instructeursregister
        </span>
      </div>
      <div className="mt-2 grid grid-cols-[42px_1fr] gap-4">
        <span className="rounded-full bg-slate-400/45" />
        <span className="space-y-1.5">
          <span className="block h-1.5 rounded bg-slate-600/55" />
          <span className="block h-1.5 rounded bg-slate-600/45" />
          <span className="block h-1.5 rounded bg-slate-600/45" />
        </span>
      </div>
    </div>
  );
}

function WrmUpload({
  file,
  onFile,
}: {
  file?: File | null;
  onFile: (file: File | null) => void;
}) {
  return (
    <label className="block">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />
      <span className="flex min-h-28 cursor-pointer items-center justify-center rounded-lg border border-slate-700/80 bg-slate-950/30 p-4 transition hover:border-violet-400/60 hover:bg-violet-500/10">
        <span className="flex flex-col items-center gap-3 text-center">
          <WrmCardIllustration compact />
          {file ? (
            <span className="max-w-56 truncate text-xs text-violet-200">{file.name}</span>
          ) : null}
        </span>
      </span>
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 text-sm sm:grid-cols-[180px_1fr]">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function ReviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 text-sm">
      <span className="block text-slate-400">{label}</span>
      <span className="mt-2 block truncate font-medium text-white">{value}</span>
    </div>
  );
}

export function InstructorVerificationBoard({
  initialValues,
}: {
  initialValues?: InitialInstructorVerificationValues;
}) {
  const router = useRouter();
  const [form, setForm] = useState<VerificationForm>(() =>
    buildInitialForm(initialValues)
  );
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [wrmCard, setWrmCard] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<Key extends keyof VerificationForm>(
    key: Key,
    value: VerificationForm[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleSpecialization(value: string) {
    setForm((current) => ({
      ...current,
      specializations: current.specializations.includes(value)
        ? current.specializations.filter((item) => item !== value)
        : [...current.specializations, value],
    }));
  }

  function validateForm() {
    if (!form.fullName || !form.phone) {
      return "Vul je naam en telefoonnummer in.";
    }

    if (!profilePhoto) {
      return "Upload je pasfoto.";
    }

    if (!form.wrmNumber || !form.wrmCategory || !form.wrmValidUntil) {
      return "Vul je WRM-pasnummer, categorie en geldigheidsdatum in.";
    }

    if (!wrmCard) {
      return "Upload een afbeelding van je WRM-pas.";
    }

    return null;
  }

  function buildFormData() {
    const formData = new FormData();

    formData.set("full_name", form.fullName);
    formData.set("phone", form.phone);
    formData.set("bio", form.extraInfo);
    formData.set("wrm_number", form.wrmNumber);
    formData.set("wrm_category", form.wrmCategory);
    formData.set("wrm_valid_until", form.wrmValidUntil);
    formData.set("school", form.school);
    formData.set("function_role", form.functionRole);
    formData.set("specializations", form.specializations.join(", "));

    if (profilePhoto) {
      formData.set("profile_photo", profilePhoto);
      formData.set("selfie", profilePhoto);
    }

    if (wrmCard) {
      formData.set("wrm_front", wrmCard);
      formData.set("wrm_back", wrmCard);
    }

    return formData;
  }

  function submitVerification() {
    const error = validateForm();

    if (error) {
      toast.error(error);
      return;
    }

    startTransition(async () => {
      const result = await submitInstructorVerificationAction(buildFormData());

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] text-white">
      <div className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
        <BoardCard>
          <StepTitle
            number={1}
            title="Profiel"
            description="Vul je profielgegevens in."
          />

          <InnerPanel className="mt-8">
            <h3 className="text-base font-semibold text-white">Persoonlijke gegevens</h3>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_180px] lg:items-center">
              <div className="space-y-6">
                <Field
                  label="Naam"
                  value={form.fullName}
                  placeholder="Patrick de Vries"
                  onChange={(value) => update("fullName", value)}
                />
                <Field
                  label="Telefoonnummer"
                  value={form.phone}
                  placeholder="0622470715"
                  onChange={(value) => update("phone", value)}
                />
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-white">Pasfoto</Label>
                  <ProfilePhotoUpload file={profilePhoto} onFile={setProfilePhoto} />
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm font-semibold text-white">Profielfoto</p>
                <div className="relative">
                  <AvatarIllustration name={form.fullName} file={profilePhoto} />
                  <span className="absolute right-0 bottom-3 flex size-10 items-center justify-center rounded-full bg-violet-600 text-white ring-4 ring-slate-950/80">
                    <Camera className="size-5" />
                  </span>
                </div>
              </div>
            </div>
          </InnerPanel>
        </BoardCard>

        <BoardCard>
          <StepTitle
            number={2}
            title="WRM verificatie"
            description="Verifieer je bedrijfsgegevens en pasfoto."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
            <InnerPanel>
              <h3 className="text-base font-semibold text-white">WRM-bevoegdheidspas</h3>
              <p className="mt-4 max-w-md text-xs leading-6 text-slate-400">
                Upload je Business Licentie (beschikkingsnummer) of LRK pasnummer,
                categorie en geldig tot datum/m-d.
              </p>
              <div className="mt-6 space-y-5">
                <Field
                  label="Pasnummer"
                  value={form.wrmNumber}
                  placeholder="123456789"
                  onChange={(value) => update("wrmNumber", value)}
                />
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
                  trailingIcon={<CalendarDays className="size-4" />}
                />
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-white">Afbeelding pas</Label>
                  <WrmUpload file={wrmCard} onFile={setWrmCard} />
                </div>
              </div>
            </InnerPanel>

            <div className="grid gap-5">
              <InnerPanel className="flex flex-col justify-center">
                <h3 className="text-base font-semibold text-white">Voorbeeld pas</h3>
                <div className="mt-6 rounded-lg border border-slate-700/80 bg-slate-950/30 p-4">
                  <WrmCardIllustration />
                </div>
              </InnerPanel>
              <InnerPanel className="flex flex-col justify-center">
                <h3 className="text-base font-semibold text-white">
                  Pasfoto voor jouw profiel
                </h3>
                <div className="mt-6 flex justify-center rounded-lg border border-slate-700/80 bg-slate-950/30 p-5">
                  <AvatarIllustration name={form.fullName} file={profilePhoto} size="md" />
                </div>
              </InnerPanel>
            </div>
          </div>
        </BoardCard>
      </div>

      <BoardCard className="mt-6">
        <StepTitle
          number={3}
          title="Extra informatie"
          description="Vul aanvullende gegevens in."
        />

        <div className="mt-8 grid gap-7 lg:grid-cols-2">
          <InnerPanel>
            <div className="space-y-6">
              <Field
                label="Extra informatie (optioneel)"
                value={form.extraInfo}
                placeholder="Geef hier extra informatie op indien van toepassing."
                onChange={(value) => update("extraInfo", value)}
              />
              <Field
                label="Functie / Rol"
                value={form.functionRole}
                placeholder="Hoofd instructeur"
                onChange={(value) => update("functionRole", value)}
              />
            </div>
          </InnerPanel>
          <InnerPanel>
            <div className="space-y-6">
              <Field
                label="Rijbewijs / Registratienr."
                value={form.school}
                placeholder="Autorijschool de Vries"
                onChange={(value) => update("school", value)}
              />
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white">Specialisaties</Label>
                <div className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-slate-700/80 bg-slate-900/70 px-4">
                  <div className="flex flex-wrap gap-2">
                    {form.specializations.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleSpecialization(item)}
                        className="inline-flex min-h-8 items-center gap-2 rounded-md bg-slate-800 px-3 text-xs font-medium text-white"
                      >
                        {item}
                        <span className="text-slate-400">x</span>
                      </button>
                    ))}
                  </div>
                  <div className="relative shrink-0">
                    <select
                      value=""
                      aria-label="Specialisatie toevoegen"
                      onChange={(event) => {
                        if (event.target.value) {
                          toggleSpecialization(event.target.value);
                        }
                      }}
                      className="absolute inset-0 opacity-0"
                    >
                      <option value="">Toevoegen</option>
                      {specializationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="size-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </InnerPanel>
        </div>
      </BoardCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        <BoardCard>
          <StepTitle
            number={4}
            title="Review & submit"
            description="Controleer je gegevens en dien ze in voor verificatie."
          />

          <InnerPanel className="mt-8">
            <div className="grid gap-7 lg:grid-cols-[0.75fr_1fr]">
              <div>
                <h3 className="text-base font-semibold text-white">Profiel</h3>
                <div className="mt-6 flex gap-4">
                  <AvatarIllustration name={form.fullName} file={profilePhoto} size="md" />
                  <div className="min-w-0 space-y-1 text-sm">
                    <p className="font-semibold text-white">{form.fullName || "Nog leeg"}</p>
                    <p className="text-slate-300">{form.phone || "Nog leeg"}</p>
                    <p className="truncate text-slate-300">
                      {form.email || "Via je account"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-700/70 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-7">
                <h3 className="text-base font-semibold text-white">WRM-verificatie</h3>
                <div className="mt-6 grid gap-5 sm:grid-cols-3">
                  <ReviewMetric label="Pasnummer" value={form.wrmNumber || "Nog leeg"} />
                  <ReviewMetric label="Categorie" value={form.wrmCategory || "Nog leeg"} />
                  <ReviewMetric label="Geldig tot" value={form.wrmValidUntil || "Nog leeg"} />
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <WrmCardIllustration compact />
                  <WrmCardIllustration compact />
                  <AvatarIllustration name={form.fullName} file={profilePhoto} size="sm" />
                </div>
              </div>
            </div>
          </InnerPanel>

          <InnerPanel className="mt-4">
            <h3 className="text-base font-semibold text-white">Extra informatie</h3>
            <div className="mt-6 grid gap-4">
              <InfoRow label="Rijbewijs / Registratienr." value={form.school || "-"} />
              <InfoRow label="Functie / Rol" value={form.functionRole || "-"} />
              <InfoRow
                label="Specialisaties"
                value={form.specializations.join(", ") || "-"}
              />
              <InfoRow label="Extra informatie" value={form.extraInfo || "-"} />
            </div>
          </InnerPanel>

          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              onClick={submitVerification}
              disabled={isPending}
              className="min-h-12 w-full max-w-xs rounded-lg bg-violet-600 text-white hover:bg-violet-500"
            >
              <Send className="mr-2 size-4" />
              {isPending ? "Verzenden..." : "Gegevens verzenden"}
            </Button>
          </div>
        </BoardCard>

        <BoardCard className="flex flex-col justify-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-violet-400/25 bg-violet-600/20 text-violet-200 shadow-[0_22px_58px_-32px_rgba(124,58,237,0.85)]">
            <ShieldCheck className="size-10" />
          </div>
          <h3 className="mt-8 text-center text-2xl font-semibold text-white">
            In afwachting van verificatie
          </h3>
          <p className="mx-auto mt-5 max-w-sm text-center text-sm leading-7 text-slate-300">
            Nadat je op verzenden klikt, controleren wij je gegevens. Dit kan 1
            tot 2 werkdagen duren.
          </p>

          <div className="mx-auto mt-8 max-w-sm space-y-5 text-sm leading-6 text-slate-300">
            {[
              "Je ontvangt een e-mail zodra we beschikking hebben over je gegevens.",
              "Je kunt de status altijd bekijken in je dashboard.",
              "Bij vragen nemen we contact met je op via e-mail.",
            ].map((item) => (
              <div key={item} className="flex gap-4">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-violet-400 text-violet-300">
                  <Check className="size-4" />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <InnerPanel className="mt-10">
            <h4 className="font-semibold text-white">Hulp nodig?</h4>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Neem contact op via{" "}
              <a
                href="mailto:support@voorbeeld.nl"
                className="text-violet-300 hover:text-violet-200"
              >
                support@voorbeeld.nl
              </a>
              <br />
              of 085 123 4567
            </p>
          </InnerPanel>
        </BoardCard>
      </div>
    </div>
  );
}
