"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";
import {
  Apple,
  BarChart3,
  BookOpen,
  Building2,
  DollarSign,
  Eye,
  EyeOff,
  GraduationCap,
  Home,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  TrendingUp,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { getDashboardRouteForRole } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import type { GebruikersRol } from "@/lib/types";
import { cn } from "@/lib/utils";

type AuthView = "register" | "login";
type AccountKind = "instructeur" | "organisatie";

const featureCards = [
  {
    title: "Alle inzichten op een plek",
    description:
      "Krijg realtime inzicht in prestaties, voortgang en betrokkenheid van je leerlingen.",
    icon: TrendingUp,
    className: "from-violet-500/35 to-indigo-500/20 text-violet-200",
  },
  {
    title: "Bespaar tijd en werk slimmer",
    description:
      "Automatiseer rapportages en administratie, zodat jij je kunt focussen op wat echt telt.",
    icon: UsersRound,
    className: "from-emerald-500/30 to-teal-500/18 text-emerald-200",
  },
  {
    title: "Veilig & betrouwbaar",
    description:
      "Jouw data is veilig bij ons. Gebouwd met de hoogste beveiligingsstandaarden.",
    icon: ShieldCheck,
    className: "from-blue-500/32 to-sky-500/18 text-blue-200",
  },
];

const accountOptions: Array<{
  value: AccountKind;
  label: string;
  description: string;
  icon: typeof GraduationCap;
}> = [
  {
    value: "instructeur",
    label: "Instructeur",
    description: "Ik geef trainingen, lessen of cursussen",
    icon: UsersRound,
  },
  {
    value: "organisatie",
    label: "Organisatie",
    description: "Ik vertegenwoordig een school of bedrijf",
    icon: Building2,
  },
];

const navItems = [
  { label: "Dashboard", icon: Home, active: true },
  { label: "Leerlingen", icon: UsersRound },
  { label: "Lessen", icon: BookOpen },
  { label: "Inkomsten", icon: DollarSign },
  { label: "Berichten", icon: MessageSquare },
  { label: "Rapportages", icon: BarChart3 },
  { label: "Instellingen", icon: Settings },
];

function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center rounded-[0.55rem] bg-[#6d5df6]/16 text-[#7d69ff]",
        small ? "size-6" : "size-9"
      )}
    >
      <div
        className={cn(
          "absolute rounded-full border-[3px] border-current",
          small ? "size-4" : "size-6"
        )}
      />
      <div
        className={cn(
          "absolute rounded-full bg-[#020813]",
          small ? "right-1.5 top-1.5 size-2" : "right-2 top-2 size-3"
        )}
      />
      <div
        className={cn(
          "absolute bottom-1 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-current",
          small ? "h-3" : "h-5"
        )}
      />
    </div>
  );
}

function GoogleMark() {
  return (
    <span className="grid size-6 place-items-center rounded-full bg-white text-lg font-black">
      <span className="bg-[conic-gradient(from_35deg,#4285f4_0_25%,#34a853_0_50%,#fbbc05_0_75%,#ea4335_0_100%)] bg-clip-text text-transparent">
        G
      </span>
    </span>
  );
}

function PasswordToggle({
  visible,
  onToggle,
  label,
}: {
  visible: boolean;
  onToggle: () => void;
  label: string;
}) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-300 transition hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
      aria-label={label}
    >
      <Icon className="size-4" />
    </button>
  );
}

function AuthInput({
  label,
  id,
  className,
  children,
  ...props
}: React.ComponentProps<"input"> & {
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-white" htmlFor={id}>
      <span>{label}</span>
      <span className="relative block">
        <input
          id={id}
          className={cn(
            "h-10 w-full rounded-[0.45rem] border border-white/18 bg-[#06101c]/88 px-4 text-[15px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-slate-500 focus:border-violet-400/80 focus:ring-4 focus:ring-violet-500/15",
            children ? "pr-12" : "",
            className
          )}
          {...props}
        />
        {children}
      </span>
    </label>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-5 py-1 text-sm text-slate-400">
      <div className="h-px flex-1 bg-white/14" />
      <span>of</span>
      <div className="h-px flex-1 bg-white/14" />
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mt-5 w-full max-w-[500px] rounded-[1.45rem] border border-white/20 bg-[#07101d]/92 p-3 shadow-[0_34px_120px_-40px_rgba(20,34,74,0.95)] backdrop-blur">
      <div className="grid grid-cols-[100px_1fr] gap-3">
        <aside className="space-y-3 border-r border-white/8 pr-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-white">
            <LogoMark small />
            Dashboard
          </div>
          <div className="space-y-1.5">
            {navItems.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-[9px]",
                  item.active
                    ? "bg-[#21345a] text-white"
                    : "text-slate-400"
                )}
              >
                <item.icon className="size-3" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </aside>

          <div className="min-w-0 space-y-2.5">
          <p className="text-sm font-semibold text-white">Welkom terug, Instructeur!</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Leerlingen", "24", "+12%"],
              ["Lessen", "56", "+8%"],
              ["Inkomsten", "EUR2.450", "+18%"],
            ].map(([label, value, trend]) => (
              <div
                key={label}
                className="rounded-lg border border-white/7 bg-white/[0.045] p-2.5"
              >
                <p className="text-[8px] text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-bold text-white">{value}</p>
                <p className="mt-1 text-[8px] text-emerald-300">{trend}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-white/7 bg-white/[0.045] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[9px] font-semibold text-white">Inkomsten overzicht</span>
              <span className="rounded-full bg-white/8 px-2 py-0.5 text-[8px] text-slate-300">
                4 weken
              </span>
            </div>
              <div className="relative h-16 overflow-hidden rounded-md bg-[#081423]">
              <div className="absolute inset-x-3 bottom-4 h-px bg-white/8" />
              <div className="absolute inset-x-3 bottom-11 h-px bg-white/8" />
              <div className="absolute inset-x-3 bottom-[4.5rem] h-px bg-white/8" />
              <svg viewBox="0 0 260 86" className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 70 L38 58 L62 54 L86 49 L110 52 L134 34 L158 30 L182 22 L206 12 L230 20 L250 10 L250 86 L12 86 Z"
                  fill="url(#incomeFill)"
                />
                <path
                  d="M12 70 L38 58 L62 54 L86 49 L110 52 L134 34 L158 30 L182 22 L206 12 L230 20 L250 10"
                  fill="none"
                  stroke="#f97316"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                />
              </svg>
            </div>
          </div>
          <div className="rounded-lg border border-white/7 bg-white/[0.045] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[9px] font-semibold text-white">Recente leerlingen</span>
              <span className="rounded-full bg-white/8 px-2 py-0.5 text-[8px] text-slate-300">
                Bekijk alles
              </span>
            </div>
            <div className="space-y-1.5">
              {["Emma de Vries", "Daan Jansen", "Lisa van Dijk"].map(
                (name, index) => (
                  <div key={name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "size-6 rounded-full",
                          index === 0
                            ? "bg-[linear-gradient(135deg,#60a5fa,#fda4af)]"
                            : index === 1
                              ? "bg-[linear-gradient(135deg,#fbbf24,#fb7185)]"
                              : "bg-[linear-gradient(135deg,#a78bfa,#34d399)]"
                        )}
                      />
                      <div>
                        <p className="text-[9px] font-semibold text-white">{name}</p>
                        <p className="text-[8px] text-slate-500">Vandaag</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/14 px-2 py-1 text-[8px] text-emerald-200">
                      Les voltooid
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

        <div className="absolute -bottom-5 left-1 right-6 flex items-center gap-3 rounded-full bg-[linear-gradient(135deg,#0ea5e9,#6d5df6_48%,#4c2fc7)] px-3 py-2 shadow-[0_18px_46px_-16px_rgba(109,93,246,0.8)]">
        <div className="flex -space-x-2">
          {["#60a5fa", "#f59e0b", "#fda4af", "#34d399", "#c084fc"].map(
            (color) => (
              <span
                key={color}
                className="size-8 rounded-full border-2 border-[#4034a5]"
                style={{ background: color }}
              />
            )
          )}
        </div>
        <div className="flex text-[13px] text-yellow-300">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="size-4 fill-current" />
          ))}
        </div>
        <span className="text-xs text-white">4,9/5 op basis van 120+ reviews</span>
      </div>
    </div>
  );
}

function SocialButton({
  provider,
  loadingProvider,
  onClick,
  children,
}: {
  provider: Provider;
  loadingProvider: Provider | null;
  onClick: (provider: Provider) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(provider)}
      disabled={Boolean(loadingProvider)}
      className="flex h-12 w-full items-center justify-center gap-5 rounded-[0.45rem] border border-white/20 bg-white/[0.045] px-5 text-base font-medium text-white transition hover:border-violet-300/55 hover:bg-white/[0.075] focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none disabled:cursor-wait disabled:opacity-70"
    >
      {children}
    </button>
  );
}

export function InstructorAuthShowcase() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = useMemo<AuthView>(() => {
    if (
      searchParams.get("mode") === "login" ||
      searchParams.get("redirect") ||
      searchParams.get("signup") === "check-email"
    ) {
      return "login";
    }

    return "register";
  }, [searchParams]);
  const [view, setView] = useState<AuthView>(initialView);
  const [accountKind, setAccountKind] = useState<AccountKind>("instructeur");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("signup") === "check-email") {
      toast.success(
        "Je account is aangemaakt. Controleer je e-mail om je account te bevestigen."
      );
    }

    if (searchParams.get("error") === "auth_callback_failed") {
      toast.error(
        "Het inloggen via de terugkoppeling van Supabase is mislukt. Probeer het opnieuw."
      );
    }
  }, [searchParams]);

  const isRegister = view === "register";
  const cardTitle = isRegister ? "Maak je account aan" : "Welkom terug";
  const cardSubtitle = isRegister
    ? "Start vandaag nog met jouw instructeur dashboard."
    : "Log in om verder te gaan naar je dashboard.";
  const socialPrefix = isRegister ? "Registreren" : "Inloggen";
  const submitLabel = isRegister ? "Account aanmaken" : "Inloggen";

  function getRedirectTarget(role: GebruikersRol) {
    return searchParams.get("redirect") ?? getDashboardRouteForRole(role);
  }

  async function handleOAuth(provider: Provider) {
    setLoadingProvider(provider);

    try {
      const supabase = createClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", "/instructeur/regie");

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams:
            provider === "google"
              ? {
                  access_type: "offline",
                  prompt: "consent",
                }
              : undefined,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Deze externe login kon niet worden gestart."
      );
      setLoadingProvider(null);
    }
  }

  async function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();

    setLoading(true);

    try {
      const supabase = createClient();

      if (!email || !password) {
        throw new Error("Vul je e-mailadres en wachtwoord in.");
      }

      if (!isRegister) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("rol")
          .eq("id", data.user.id)
          .maybeSingle();

        const targetRole = (profile?.rol as GebruikersRol | undefined) ?? "leerling";

        toast.success("Welkom terug.");
        window.location.assign(getRedirectTarget(targetRole));
        return;
      }

      if (!firstName || !lastName) {
        throw new Error("Vul je voornaam en achternaam in.");
      }

      if (password !== confirmPassword) {
        throw new Error("De wachtwoorden komen niet overeen.");
      }

      if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
        throw new Error(
          "Gebruik minimaal 8 karakters met een hoofdletter, cijfer en symbool."
        );
      }

      if (!termsAccepted) {
        throw new Error("Akkoord gaan met de voorwaarden is verplicht.");
      }

      const fullName = `${firstName} ${lastName}`.trim();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", "/instructeur-verificatie");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl.toString(),
          data: {
            rol: "instructeur",
            account_type: accountKind,
            volledige_naam: fullName,
            voornaam: firstName,
            achternaam: lastName,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session && data.user) {
        toast.success("Je account is aangemaakt.");
        window.location.assign("/instructeur-verificatie");
        return;
      }

      setView("login");
      router.push("/inloggen?signup=check-email");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Er is iets misgegaan.";

      if (message === "Invalid login credentials") {
        toast.error("Het e-mailadres of wachtwoord klopt niet.");
      } else if (message === "Email not confirmed") {
        toast.error("Bevestig eerst je e-mailadres via de link in je inbox.");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020813] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-18rem] top-[-18rem] size-[42rem] rounded-full bg-blue-600/14 blur-3xl" />
        <div className="absolute right-[-18rem] top-[24rem] size-[42rem] rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-[23rem] left-[-12rem] h-48 w-[70rem] -rotate-[10deg] bg-[linear-gradient(100deg,rgba(37,99,235,0.35),rgba(124,58,237,0.38),transparent_72%)] blur-sm" />
        <div className="absolute bottom-[19rem] right-[-10rem] h-64 w-[42rem] -rotate-[28deg] rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_26%,rgba(72,72,140,0.18),transparent_24%),linear-gradient(180deg,rgba(4,9,18,0.2),rgba(2,8,19,0.96))]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-col px-6 py-7 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark />
            <span className="text-2xl font-bold tracking-[-0.03em]">Dashboard</span>
          </Link>

          <div className="flex items-center gap-4 text-sm text-slate-200">
            <span className="hidden sm:inline">
              {isRegister ? "Al een account?" : "Nog geen account?"}
            </span>
            <button
              type="button"
              onClick={() => setView(isRegister ? "login" : "register")}
              className="h-11 rounded-[0.45rem] border border-violet-400/65 bg-white/[0.035] px-5 font-medium text-white transition hover:bg-violet-500/18 focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:outline-none"
            >
              {isRegister ? "Inloggen" : "Aanmelden"}
            </button>
          </div>
        </header>

        <section className="grid items-start gap-12 py-8 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12">
          <div className="max-w-[530px] pt-4">
            <div className="inline-flex items-center gap-3 rounded-[0.6rem] border border-white/8 bg-violet-500/13 px-4 py-2 text-sm font-semibold text-violet-200 shadow-[0_16px_45px_-25px_rgba(109,93,246,0.7)]">
              <GraduationCap className="size-5" />
              Voor instructeurs
            </div>

            <h1 className="mt-8 text-[clamp(2.45rem,5vw,4.35rem)] font-extrabold leading-[1.08] tracking-[-0.045em] text-white">
              Maak impact met inzichten die{" "}
              <span className="text-[#7d69ff]">het verschil maken.</span>
            </h1>

            <p className="mt-5 max-w-[510px] text-base leading-7 text-slate-200/90">
              Sluit je aan bij honderden instructeurs die onze krachtige dashboard
              oplossing gebruiken om hun lessen, leerlingen en resultaten moeiteloos
              te beheren en te optimaliseren.
            </p>

            <div className="mt-8 space-y-5">
              {featureCards.map((feature) => (
                <div key={feature.title} className="flex gap-5">
                  <div
                    className={cn(
                      "grid size-[3.6rem] shrink-0 place-items-center rounded-[1rem] bg-gradient-to-br shadow-[0_20px_48px_-28px_currentColor]",
                      feature.className
                    )}
                  >
                    <feature.icon className="size-6" />
                  </div>
                  <div className="pt-1">
                    <h2 className="text-lg font-bold tracking-[-0.02em]">
                      {feature.title}
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-slate-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <DashboardPreview />
          </div>

          <div className="mx-auto w-full max-w-[610px] rounded-[1.8rem] border border-white/28 bg-[linear-gradient(145deg,rgba(12,22,40,0.88),rgba(11,17,35,0.76)_52%,rgba(27,21,72,0.8))] p-8 shadow-[0_32px_110px_-48px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-9">
            <div className="mx-auto grid size-[4.4rem] place-items-center rounded-[1.15rem] bg-[linear-gradient(135deg,#32265d,#4d3a92)] text-violet-200 shadow-[0_28px_70px_-32px_rgba(125,105,255,0.95)]">
              <UserPlus className="size-8" />
            </div>

            <div className="mt-5 text-center">
              <h2 className="text-2xl font-bold tracking-[-0.035em]">{cardTitle}</h2>
              <p className="mt-2 text-base text-slate-300">{cardSubtitle}</p>
            </div>

            <div className="mt-7 space-y-3">
              <SocialButton
                provider="google"
                loadingProvider={loadingProvider}
                onClick={handleOAuth}
              >
                <GoogleMark />
                {socialPrefix} met Google
              </SocialButton>
              <SocialButton
                provider="apple"
                loadingProvider={loadingProvider}
                onClick={handleOAuth}
              >
                <Apple className="size-7 fill-white text-white" />
                {socialPrefix} met Apple
              </SocialButton>
            </div>

            <Divider />

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit(new FormData(event.currentTarget));
              }}
              className="mt-3 space-y-3"
            >
              {isRegister ? (
                <>
                  <AuthInput
                    id="firstName"
                    name="firstName"
                    label="Voornaam"
                    placeholder="Je voornaam"
                    autoComplete="given-name"
                    required
                  />
                  <AuthInput
                    id="lastName"
                    name="lastName"
                    label="Achternaam"
                    placeholder="Je achternaam"
                    autoComplete="family-name"
                    required
                  />
                </>
              ) : null}

              <AuthInput
                id="email"
                name="email"
                label="E-mailadres"
                type="email"
                placeholder={isRegister ? "jouw@email.nl" : "naam@voorbeeld.nl"}
                autoComplete="email"
                required
              />

              <div className="space-y-1.5">
                <AuthInput
                  id="password"
                  name="password"
                  label="Wachtwoord"
                  type={passwordVisible ? "text" : "password"}
                  placeholder={
                    isRegister ? "Maak een sterk wachtwoord" : "Je wachtwoord"
                  }
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  required
                >
                  <PasswordToggle
                    visible={passwordVisible}
                    onToggle={() => setPasswordVisible((value) => !value)}
                    label={
                      passwordVisible
                        ? "Verberg invoer"
                        : "Toon invoer"
                    }
                  />
                </AuthInput>
                {isRegister ? (
                  <p className="pl-1 text-xs text-slate-500">
                    Minimaal 8 karakters met een hoofdletter, cijfer en symbool
                  </p>
                ) : null}
              </div>

              {isRegister ? (
                <>
                  <AuthInput
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Bevestig wachtwoord"
                    type={confirmVisible ? "text" : "password"}
                    placeholder="Herhaal je wachtwoord"
                    autoComplete="new-password"
                    required
                  >
                    <PasswordToggle
                      visible={confirmVisible}
                      onToggle={() => setConfirmVisible((value) => !value)}
                      label={
                        confirmVisible
                          ? "Verberg bevestiging"
                          : "Toon bevestiging"
                      }
                    />
                  </AuthInput>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Ik ben een...</p>
                    <div className="space-y-3">
                      {accountOptions.map((option) => {
                        const Icon = option.icon;
                        const checked = accountKind === option.value;

                        return (
                          <label
                            key={option.value}
                            className={cn(
                              "flex cursor-pointer items-center gap-5 rounded-[0.45rem] border px-5 py-2.5 transition",
                              checked
                                ? "border-[#7d69ff] bg-[#21195a]/60 shadow-[0_18px_58px_-36px_rgba(125,105,255,0.85)]"
                                : "border-white/13 bg-white/[0.025] hover:border-white/28"
                            )}
                          >
                            <input
                              type="radio"
                              name="accountKind"
                              value={option.value}
                              checked={checked}
                              onChange={() => setAccountKind(option.value)}
                              className="sr-only"
                            />
                            <Icon
                              className={cn(
                                "size-7 shrink-0",
                                checked ? "text-[#8c73ff]" : "text-slate-300"
                              )}
                            />
                            <span>
                              <span className="block text-base font-bold text-white">
                                {option.label}
                              </span>
                              <span className="mt-1 block text-sm text-slate-400">
                                {option.description}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <label className="flex items-start gap-3 text-sm leading-6 text-slate-300">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(event) => setTermsAccepted(event.target.checked)}
                      className="mt-1 size-4 rounded border-white/25 bg-transparent accent-[#7d69ff]"
                    />
                    <span>
                      Ik ga akkoord met de{" "}
                      <Link href="/voorwaarden" className="text-[#9b89ff] hover:text-white">
                        Algemene voorwaarden
                      </Link>{" "}
                      en{" "}
                      <Link href="/privacy" className="text-[#9b89ff] hover:text-white">
                        Privacyverklaring
                      </Link>
                    </span>
                  </label>
                </>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => router.push("/wachtwoord-vergeten")}
                    className="text-[#9b89ff] transition hover:text-white"
                  >
                    Wachtwoord vergeten?
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("register")}
                    className="text-slate-300 transition hover:text-white"
                  >
                    Account aanmaken
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || Boolean(loadingProvider)}
                className="h-12 w-full rounded-[0.45rem] bg-[linear-gradient(135deg,#7257ff,#4634d8)] text-base font-semibold text-white shadow-[0_22px_60px_-28px_rgba(114,87,255,0.9)] transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:outline-none disabled:cursor-wait disabled:opacity-70"
              >
                {loading ? "Even geduld..." : submitLabel}
              </button>

              {isRegister ? (
                <p className="px-6 text-center text-sm leading-6 text-slate-400">
                  Door je aan te melden, ga je akkoord met onze{" "}
                  <Link href="/voorwaarden" className="text-[#9b89ff] hover:text-white">
                    Algemene voorwaarden
                  </Link>{" "}
                  en{" "}
                  <Link href="/privacy" className="text-[#9b89ff] hover:text-white">
                    Privacyverklaring
                  </Link>
                  .
                </p>
              ) : null}
            </form>
          </div>
        </section>
      </div>

      <footer className="relative z-10 border-t border-white/10 bg-[#030b16]/80">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-7 sm:px-8 md:grid-cols-[1.5fr_repeat(4,1fr)] lg:px-10">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <LogoMark small />
              <span className="text-xl font-bold">Dashboard</span>
            </Link>
            <p className="mt-4 max-w-[240px] text-sm leading-6 text-slate-400">
              Het slimme dashboard voor instructeurs die resultaatgericht werken.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <h3 className="font-semibold text-white">Product</h3>
            <Link href="/pakketten" className="block text-slate-400 hover:text-white">
              Functionaliteiten
            </Link>
            <Link href="/pakketten" className="block text-slate-400 hover:text-white">
              Prijzen
            </Link>
            <Link href="/vergelijk" className="block text-slate-400 hover:text-white">
              Integraties
            </Link>
            <Link href="/tips" className="block text-slate-400 hover:text-white">
              Updates
            </Link>
          </div>

          <div className="space-y-3 text-sm">
            <h3 className="font-semibold text-white">Company</h3>
            <Link href="/over-ons" className="block text-slate-400 hover:text-white">
              Over ons
            </Link>
            <Link href="/tips" className="block text-slate-400 hover:text-white">
              Blog
            </Link>
            <Link href="/contact" className="block text-slate-400 hover:text-white">
              Careers
            </Link>
            <Link href="/contact" className="block text-slate-400 hover:text-white">
              Contact
            </Link>
          </div>

          <div className="space-y-3 text-sm">
            <h3 className="font-semibold text-white">Support</h3>
            <Link href="/contact" className="block text-slate-400 hover:text-white">
              Helpcentrum
            </Link>
            <Link href="/privacy" className="block text-slate-400 hover:text-white">
              Privacy
            </Link>
            <Link href="/voorwaarden" className="block text-slate-400 hover:text-white">
              Voorwaarden
            </Link>
          </div>

          <div className="space-y-4 text-sm">
            <h3 className="font-semibold text-white">Volg ons</h3>
            <div className="flex gap-3">
              {[
                { label: "LinkedIn", mark: "in" },
                { label: "Twitter", mark: "x" },
                { label: "Facebook", mark: "f" },
                { label: "Instagram", mark: "ig" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  aria-label={item.label}
                  className="grid size-9 place-items-center rounded-full bg-white/8 text-sm font-bold text-slate-300 transition hover:bg-white/14 hover:text-white"
                >
                  {item.mark}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="pb-4 text-center text-sm text-slate-500">
          © 2024 Dashboard. Alle rechten voorbehouden.
        </p>
      </footer>
    </main>
  );
}
