"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Upload,
  UserPlus,
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
  { id: 1, label: "Registratie" },
  { id: 2, label: "Profiel" },
  { id: 3, label: "WRM verificatie" },
  { id: 4, label: "Extra informatie" },
  { id: 5, label: "Review" },
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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function fullName(form: FormState) {
  return `${form.firstName} ${form.lastName}`.trim();
}

function canPreview(file?: File | null): file is File {
  return Boolean(file?.type.startsWith("image/"));
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
      <span className="mb-2 flex items-center justify-between text-sm font-medium text-white">
        {label}
        {file ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
            <CheckCircle2 className="size-3.5" />
            Klaar
          </span>
        ) : required ? (
          <span className="text-xs text-slate-400">Verplicht</span>
        ) : null}
      </span>
      <input
        name={field}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        required={required && !file}
        className="sr-only"
        onChange={(event) => onFile(field, event.target.files?.[0] ?? null)}
      />
      <span
        className={cx(
          "flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.2rem] border border-dashed border-white/14 bg-white/[0.03] text-center transition hover:border-violet-300/50 hover:bg-violet-400/10",
          compact ? "min-h-28 p-3" : "min-h-36 p-5"
        )}
      >
        {preview ? (
          <Image
            src={preview}
            alt=""
            width={compact ? 180 : 260}
            height={compact ? 96 : 150}
            className="h-24 w-full rounded-xl object-cover"
            unoptimized
          />
        ) : (
          <>
            <span className="flex size-11 items-center justify-center rounded-2xl bg-violet-500/18 text-violet-200">
              <Upload className="size-5" />
            </span>
            <span className="mt-3 text-sm font-semibold text-white">
              Klik om te uploaden
            </span>
            <span className="mt-1 text-xs leading-5 text-slate-400">
              JPG, PNG, WebP of PDF tot 5 MB
            </span>
          </>
        )}
        {file ? (
          <span className="mt-3 max-w-full truncate text-xs text-slate-300">
            {file.name}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function InstructorRegistrationFlow({
  mode = "signup",
}: {
  mode?: FlowMode;
}) {
  const router = useRouter();
  const [step, setStep] = useState(mode === "verification" ? 2 : 1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [files, setFiles] = useState<Partial<Record<FileKey, File | null>>>({});
  const [isPending, startTransition] = useTransition();
  const isSignup = mode === "signup";

  function update<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
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
    const error = validateCurrentStep();

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
    const error = validateCurrentStep();

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

  const activeSteps = isSignup ? steps : steps.slice(1);

  return (
    <div className="mx-auto w-full max-w-6xl text-white">
      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(91,33,182,0.28),transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))] p-7 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.9)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-200">
            <GraduationCap className="size-4" />
            Voor instructeurs
          </div>
          <h1 className="mt-7 text-4xl font-semibold tracking-tight sm:text-5xl">
            Maak impact met inzichten die het verschil maken.
          </h1>
          <p className="mt-5 max-w-md text-base leading-8 text-slate-300">
            Start met je account, rond de WRM-controle af en krijg daarna volledige toegang tot je instructeursdashboard.
          </p>

          <div className="mt-8 grid gap-4">
            {[
              {
                icon: ShieldCheck,
                title: "Geverifieerde toegang",
                text: "Alleen bevoegde instructeurs krijgen volledige dashboardtoegang.",
              },
              {
                icon: Clock3,
                title: "Controle binnen 1-2 werkdagen",
                text: "Na verzending ontvang je een bevestiging en volgt beoordeling door het team.",
              },
              {
                icon: LockKeyhole,
                title: "Private WRM-documenten",
                text: "Uploads staan in private opslag en worden alleen voor controle gebruikt.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200">
                  <item.icon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm font-semibold">Waarom deze verificatie?</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              {[
                "Voldoen aan WRM-eisen.",
                "Bescherming van identiteit en bevoegdheid.",
                "Een betrouwbaar platform voor instructeurs en leerlingen.",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.9)] sm:p-7">
          <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-5">
            {activeSteps.map((item) => {
              const isActive = item.id === step;
              const isDone = item.id < step;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStep(item.id)}
                  className={cx(
                    "flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-semibold transition",
                    isActive
                      ? "bg-violet-500 text-white"
                      : isDone
                        ? "bg-emerald-500/14 text-emerald-200"
                        : "bg-white/5 text-slate-400"
                  )}
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-white/16">
                    {isDone ? <Check className="size-3" /> : item.id}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="min-h-[560px] py-7">
            {step === 1 ? (
              <div className="grid gap-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-200">
                    Stap 1
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">Maak je account aan</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    Hiermee start je het verificatieproces voor instructeurs.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Voornaam" value={form.firstName} onChange={(value) => update("firstName", value)} />
                  <Field label="Achternaam" value={form.lastName} onChange={(value) => update("lastName", value)} />
                </div>
                <Field label="E-mailadres" type="email" value={form.email} onChange={(value) => update("email", value)} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Wachtwoord" type="password" value={form.password} onChange={(value) => update("password", value)} />
                  <Field label="Bevestig wachtwoord" type="password" value={form.confirmPassword} onChange={(value) => update("confirmPassword", value)} />
                </div>
                <div className="rounded-[1.2rem] border border-violet-300/25 bg-violet-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <UserPlus className="mt-1 size-5 text-violet-200" />
                    <div>
                      <p className="font-semibold">Instructeur</p>
                      <p className="mt-1 text-sm text-slate-300">
                        Ik geef trainingen, rijlessen of cursussen en wil toegang tot het dashboard.
                      </p>
                    </div>
                  </div>
                </div>
                <label className="flex items-start gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.terms}
                    onChange={(event) => update("terms", event.target.checked)}
                    className="mt-1 size-4 rounded border-white/20 bg-white/5"
                  />
                  Ik ga akkoord met de algemene voorwaarden en privacyverklaring.
                </label>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-7 lg:grid-cols-[1fr_240px]">
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-200">
                      Stap 2
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">Vertel ons meer over jezelf</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Dit helpt bij herkenning en vertrouwen binnen het platform.
                    </p>
                  </div>
                  {!isSignup ? (
                    <Field label="Volledige naam" value={fullName(form)} onChange={(value) => {
                      const [firstName, ...rest] = value.split(" ");
                      update("firstName", firstName ?? "");
                      update("lastName", rest.join(" "));
                    }} />
                  ) : null}
                  <Field label="Telefoonnummer" value={form.phone} onChange={(value) => update("phone", value)} />
                  <div className="space-y-2">
                    <Label className="text-slate-200">Korte introductie</Label>
                    <Textarea
                      value={form.bio}
                      onChange={(event) => update("bio", event.target.value)}
                      placeholder="Vertel kort iets over je rijstijl, ervaring en werkgebied."
                      className="min-h-28 border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500"
                    />
                  </div>
                  <FileDrop
                    label="Profielfoto"
                    field="profile_photo"
                    file={files.profile_photo}
                    onFile={setFile}
                  />
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative flex size-52 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                    {canPreview(files.profile_photo) ? (
                      <Image
                        src={URL.createObjectURL(files.profile_photo)}
                        alt=""
                        width={208}
                        height={208}
                        className="size-52 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <Camera className="size-14 text-violet-200" />
                    )}
                    <span className="absolute bottom-4 right-4 flex size-11 items-center justify-center rounded-full bg-violet-500">
                      <Camera className="size-5" />
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-7 lg:grid-cols-[1fr_280px]">
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-200">
                      Stap 3
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">WRM-bevoegdheidspas</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Verplicht. We controleren je instructeursbevoegdheid voordat het dashboard volledig open gaat.
                    </p>
                  </div>
                  <Field label="Pasnummer" value={form.wrmNumber} onChange={(value) => update("wrmNumber", value)} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Categorie" value={form.wrmCategory} onChange={(value) => update("wrmCategory", value)} />
                    <Field label="Geldig tot" type="date" value={form.wrmValidUntil} onChange={(value) => update("wrmValidUntil", value)} />
                  </div>
                  <FileDrop label="Achterkant pas" field="wrm_back" file={files.wrm_back} required onFile={setFile} />
                </div>
                <div className="space-y-4">
                  <FileDrop label="Voorkant pas" field="wrm_front" file={files.wrm_front} required compact onFile={setFile} />
                  <FileDrop label="Foto van jezelf (selfie)" field="selfie" file={files.selfie} required compact onFile={setFile} />
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-200">
                    Stap 4
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">Extra informatie</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    Optioneel, maar het maakt je profiel direct sterker.
                  </p>
                </div>
                <Field label="Rijschool / organisatie" value={form.school} onChange={(value) => update("school", value)} />
                <Field label="Functie / rol" value={form.functionRole} onChange={(value) => update("functionRole", value)} />
                <div className="space-y-3">
                  <Label className="text-slate-200">Specialisaties</Label>
                  <div className="flex flex-wrap gap-2">
                    {specializationOptions.map((item) => {
                      const selected = form.specializations.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleSpecialization(item)}
                          className={cx(
                            "min-h-10 rounded-full border px-3 text-sm transition",
                            selected
                              ? "border-violet-300/40 bg-violet-500 text-white"
                              : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20"
                          )}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-200">
                      Stap 5
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">Controleer je gegevens</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Na verzending beoordelen we je profiel. Dit kan tot 1-2 werkdagen duren.
                    </p>
                  </div>
                  <ReviewBlock
                    title="Profiel"
                    rows={[
                      ["Naam", fullName(form) || "Nog leeg"],
                      ["Telefoon", form.phone || "Nog leeg"],
                      ["E-mailadres", form.email || "Via je bestaande account"],
                    ]}
                  />
                  <ReviewBlock
                    title="WRM-verificatie"
                    rows={[
                      ["Pasnummer", form.wrmNumber || "Nog leeg"],
                      ["Categorie", form.wrmCategory || "Nog leeg"],
                      ["Geldig tot", form.wrmValidUntil || "Nog leeg"],
                      ["Documenten", `${["wrm_front", "wrm_back", "selfie"].filter((key) => files[key as FileKey]).length}/3 uploads`],
                    ]}
                  />
                  <ReviewBlock
                    title="Extra informatie"
                    rows={[
                      ["Rijschool", form.school || "Niet ingevuld"],
                      ["Functie", form.functionRole || "Niet ingevuld"],
                      ["Specialisaties", form.specializations.join(", ") || "Niet ingevuld"],
                    ]}
                  />
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-violet-500/18 text-violet-200">
                    <Clock3 className="size-7" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">In afwachting van verificatie</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    Je ontvangt een bevestiging per e-mail. Zodra je bent goedgekeurd, krijg je volledige toegang tot je dashboard.
                  </p>
                  <div className="mt-5 space-y-3 text-sm text-slate-300">
                    <div className="flex gap-2">
                      <Mail className="mt-0.5 size-4 text-violet-200" />
                      Bevestiging per e-mail
                    </div>
                    <div className="flex gap-2">
                      <Eye className="mt-0.5 size-4 text-violet-200" />
                      Status zichtbaar na inloggen
                    </div>
                  </div>
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={isSignup ? submitSignup : submitVerificationOnly}
                    className="mt-7 min-h-12 w-full rounded-xl bg-violet-600 text-white hover:bg-violet-500"
                  >
                    {isPending ? "Verzenden..." : "Gegevens verzenden"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={previousStep}
              disabled={step === (isSignup ? 1 : 2) || isPending}
              className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 size-4" />
              Vorige
            </Button>
            {step < 5 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={isPending}
                className="min-h-11 rounded-xl bg-violet-600 px-6 text-white hover:bg-violet-500"
              >
                Volgende
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : null}
          </div>
        </section>
      </div>

      {isSignup ? (
        <p className="mt-6 text-center text-sm text-slate-400">
          Leerling?{" "}
          <Link href="/registreren?type=leerling" className="font-medium text-violet-200 hover:text-white">
            Maak een leerlingaccount aan
          </Link>
          {" "}of al een account?{" "}
          <Link href="/inloggen" className="font-medium text-violet-200 hover:text-white">
            Inloggen
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-slate-200">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500"
      />
    </div>
  );
}

function ReviewBlock({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center gap-2">
        <BadgeCheck className="size-5 text-emerald-300" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="grid gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-2 text-sm sm:grid-cols-[150px_1fr]">
            <span className="text-slate-400">{label}</span>
            <span className="text-slate-100">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
