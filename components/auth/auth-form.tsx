"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { EmailOtpType } from "@supabase/supabase-js";

import type { GebruikersRol } from "@/lib/types";
import { getDashboardRouteForRole } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AuthMode = "login" | "register" | "forgot" | "reset";
type ZelfRegistratieRol = Extract<GebruikersRol, "leerling" | "instructeur">;

const roleOptions: Array<{
  value: ZelfRegistratieRol;
  label: string;
  description: string;
}> = [
  {
    value: "leerling",
    label: "Leerling",
    description: "Voor lessen boeken, voortgang volgen en instructeurs vergelijken.",
  },
  {
    value: "instructeur",
    label: "Instructeur",
    description: "Voor profielbeheer, planning, aanvragen en leerlingenbeheer.",
  },
];

const submitLabels: Record<AuthMode, string> = {
  login: "Inloggen",
  register: "Account aanmaken",
  forgot: "Resetlink versturen",
  reset: "Wachtwoord opslaan",
};

const helperCopy: Record<AuthMode, string> = {
  login: "Je komt na het inloggen automatisch uit op het juiste dashboard voor jouw rol.",
  register:
    "Je gegevens worden gebruikt om direct een passend profiel en dashboardflow voor te bereiden.",
  forgot: "Na het verzenden ontvang je een beveiligde e-mail om je wachtwoord te herstellen.",
  reset: "Na het opslaan kun je meteen opnieuw inloggen met je nieuwe wachtwoord.",
};

function getFriendlyAuthError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Er is iets misgegaan.";
  }

  const normalizedMessage = error.message.toLowerCase();

  if (
    normalizedMessage.includes("email rate limit exceeded") ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests")
  ) {
    return "Er zijn te veel authenticatie-e-mails verstuurd in korte tijd. Probeer het zo opnieuw, of log in als je account al bestaat.";
  }

  switch (error.message) {
    case "Invalid login credentials":
      return "Het e-mailadres of wachtwoord klopt niet.";
    case "Email not confirmed":
      return "Bevestig eerst je e-mailadres via de link in je inbox.";
    case "Auth session missing!":
      return "Open de resetlink uit je e-mail opnieuw. De herstelsessie ontbreekt of is verlopen.";
    default:
      return error.message;
  }
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<ZelfRegistratieRol>("leerling");
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(
    mode === "reset" ? null : true
  );
  const hasShownErrorToast = useRef(false);

  useEffect(() => {
    if (mode !== "reset") {
      return;
    }

    let active = true;
    const supabase = createClient();
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;

    async function hydrateRecoverySession() {
      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const errorDescription = hashParams.get("error_description");

        if (errorDescription) {
          if (active) {
            setHasRecoverySession(false);
            toast.error(decodeURIComponent(errorDescription));
          }
          return;
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            if (active) {
              setHasRecoverySession(false);
              toast.error(
                "De resetlink kon niet worden omgezet naar een geldige sessie. Vraag een nieuwe resetmail aan."
              );
            }
            return;
          }

          window.history.replaceState({}, document.title, "/wachtwoord-resetten");
        }
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          if (active) {
            setHasRecoverySession(false);
            toast.error(
              "De resetlink is ongeldig of verlopen. Vraag een nieuwe resetmail aan."
            );
          }
          return;
        }

        router.replace("/wachtwoord-resetten");
      } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });

        if (error) {
          if (active) {
            setHasRecoverySession(false);
            toast.error(
              "De resetlink is ongeldig of verlopen. Vraag een nieuwe resetmail aan."
            );
          }
          return;
        }

        router.replace("/wachtwoord-resetten");
      }

      const { data } = await supabase.auth.getSession();

      if (active) {
        setHasRecoverySession(Boolean(data.session));
      }
    }

    void hydrateRecoverySession();

    return () => {
      active = false;
    };
  }, [mode, router, searchParams]);

  useEffect(() => {
    if (hasShownErrorToast.current) {
      return;
    }

    const error = searchParams.get("error");
    const errorCode = searchParams.get("error_code");
    const errorDescription = searchParams.get("error_description");
    const signupState = searchParams.get("signup");

    if (!error && !errorCode && !errorDescription && !signupState) {
      return;
    }

    hasShownErrorToast.current = true;

    if (signupState === "check-email") {
      toast.success(
        "Je account is aangemaakt. Controleer je e-mail om je account te bevestigen."
      );
      return;
    }

    if (
      mode === "reset" &&
      (errorCode === "otp_expired" || error === "access_denied")
    ) {
      toast.error(
        "Deze resetlink is al gebruikt of verlopen. Vraag een nieuwe resetmail aan."
      );
      return;
    }

    if (error === "reset_link_invalid") {
      toast.error(
        "De resetlink is ongeldig of verlopen. Vraag een nieuwe resetmail aan."
      );
      return;
    }

    if (error === "auth_callback_failed") {
      toast.error(
        "Het inloggen via de terugkoppeling van Supabase is mislukt. Probeer het opnieuw."
      );
      return;
    }

    if (errorDescription) {
      toast.error(errorDescription);
    }
  }, [mode, searchParams]);

  async function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("volledige_naam") ?? "");
    const telefoon = String(formData.get("telefoon") ?? "");
    const bio = String(formData.get("bio") ?? "");

    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const { data: profile } = await supabase
          .from("profiles")
          .select("rol")
          .eq("id", data.user.id)
          .maybeSingle();

        const targetRole = (profile?.rol as GebruikersRol | undefined) ?? "leerling";
        const redirectTarget =
          searchParams.get("redirect") ?? getDashboardRouteForRole(targetRole);

        toast.success("Welkom terug.");
        window.location.assign(redirectTarget);
      }

      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              rol: role,
              volledige_naam: name,
              telefoon,
              bio,
            },
          },
        });

        if (error) throw error;

        if (data.session && data.user) {
          const redirectTarget =
            searchParams.get("redirect") ?? getDashboardRouteForRole(role);

          toast.success("Je account is aangemaakt en je bent direct ingelogd.");
          window.location.assign(redirectTarget);
          return;
        }

        router.push("/inloggen?signup=check-email");
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/wachtwoord-resetten/bevestigen`,
        });

        if (error) throw error;

        toast.success("We hebben een resetlink naar je e-mailadres gestuurd.");
      }

      if (mode === "reset") {
        if (hasRecoverySession !== true) {
          throw new Error("Auth session missing!");
        }

        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) throw error;

        await supabase.auth.signOut();
        toast.success("Je wachtwoord is bijgewerkt.");
        window.location.assign("/inloggen");
      }
    } catch (error) {
      toast.error(getFriendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2 text-slate-950 dark:text-white">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span className="text-sm font-semibold">Veilig</span>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Supabase sessies en routebescherming zijn klaar voor productiegebruik.
          </p>
        </div>
        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2 text-slate-950 dark:text-white">
            <Sparkles className="size-4 text-sky-600" />
            <span className="text-sm font-semibold">Slimme flow</span>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {helperCopy[mode]}
          </p>
        </div>
      </div>

      {mode === "reset" && hasRecoverySession === false ? (
        <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50/90 p-4 text-sm leading-7 text-amber-900 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
          Deze resetpagina heeft geen actieve herstelsessie. Open de meest recente link uit je
          resetmail opnieuw of vraag een nieuwe reset aan.
        </div>
      ) : null}

      <form action={handleSubmit} className="space-y-5">
        {mode === "register" ? (
          <div className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="volledige_naam">Volledige naam</Label>
                <Input
                  id="volledige_naam"
                  name="volledige_naam"
                  placeholder="Bijvoorbeeld Mila Jansen"
                  required
                  className="h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefoon">Telefoonnummer</Label>
                <Input
                  id="telefoon"
                  name="telefoon"
                  placeholder="06 12 34 56 78"
                  required
                  className="h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="rol">Rol kiezen</Label>
              <div className="grid gap-3">
                {roleOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-[1.4rem] border px-4 py-4 transition-all ${
                      role === option.value
                        ? "border-slate-950 bg-slate-950 text-white shadow-[0_24px_50px_-30px_rgba(15,23,42,0.65)] dark:border-sky-300/30 dark:bg-white/10"
                        : "border-slate-200 bg-white text-slate-950 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/16"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rol"
                      value={option.value}
                      checked={role === option.value}
                      onChange={(event) =>
                        setRole(event.target.value as ZelfRegistratieRol)
                      }
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{option.label}</p>
                        <p
                          className={`mt-1 text-sm leading-7 ${
                            role === option.value ? "text-white/72" : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {option.description}
                        </p>
                      </div>
                      <div
                        className={`mt-1 size-4 rounded-full border ${
                          role === option.value
                            ? "border-white bg-white"
                            : "border-slate-300 dark:border-white/24"
                        }`}
                      />
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                Admin-accounts worden intern toegekend en zijn niet publiek te registreren.
              </p>
            </div>

            {role === "instructeur" ? (
              <div className="space-y-2">
                <Label htmlFor="bio">Korte introductie</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Vertel kort iets over je rijstijl, ervaring en werkgebied."
                  className="min-h-28 rounded-2xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {mode === "login" || mode === "register" || mode === "forgot" ? (
          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="naam@voorbeeld.nl"
              required
              className="h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>
        ) : null}

        {mode !== "forgot" ? (
          <div className="space-y-2">
            <Label htmlFor="password">
              {mode === "reset" ? "Nieuw wachtwoord" : "Wachtwoord"}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimaal 8 tekens"
              required
              className="h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>
        ) : null}

        <Button
          type="submit"
          className="h-12 w-full rounded-full bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#0ea5e9)] text-sm text-white shadow-[0_24px_50px_-22px_rgba(37,99,235,0.7)]"
          disabled={loading || (mode === "reset" && hasRecoverySession !== true)}
        >
          {loading
            ? "Even geduld..."
            : mode === "reset" && hasRecoverySession === null
              ? "Sessies controleren..."
              : submitLabels[mode]}
        </Button>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          {mode === "login" ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/wachtwoord-vergeten" className="text-primary hover:underline">
                Wachtwoord vergeten?
              </Link>
              <Link href="/registreren" className="text-primary hover:underline">
                Nog geen account?
              </Link>
            </div>
          ) : null}

          {mode === "register" ? (
            <p>
              Heb je al een account?{" "}
              <Link href="/inloggen" className="text-primary hover:underline">
                Log hier in
              </Link>
            </p>
          ) : null}

          {mode === "forgot" ? (
            <p>
              Weet je je wachtwoord toch weer?{" "}
              <Link href="/inloggen" className="text-primary hover:underline">
                Terug naar inloggen
              </Link>
            </p>
          ) : null}

          {mode === "reset" ? (
            <p>
              Na het opslaan kun je direct verder via{" "}
              <Link href="/inloggen" className="text-primary hover:underline">
                inloggen
              </Link>
              .
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
