import Link from "next/link";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import { Logo } from "@/components/logo";
import { SignatureLine } from "@/components/marketing/homepage-motion";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const authBenefits = [
  "Eenzelfde premium ervaring op desktop en mobiel.",
  "Veilige auth-flow met rollen en sessiebehoud via Supabase.",
  "Direct toegang tot lessen, berichten, pakketten en dashboards.",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-clip px-4 py-6 sm:px-6 xl:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(56,189,248,0.18),transparent_22%),radial-gradient(circle_at_86%_14%,rgba(29,78,216,0.18),transparent_24%),radial-gradient(circle_at_58%_64%,rgba(249,115,22,0.12),transparent_22%)] dark:bg-[radial-gradient(circle_at_14%_18%,rgba(56,189,248,0.14),transparent_22%),radial-gradient(circle_at_86%_14%,rgba(59,130,246,0.16),transparent_24%),radial-gradient(circle_at_58%_64%,rgba(245,158,11,0.1),transparent_22%)]" />
      <div className="site-shell relative mx-auto flex w-full items-center justify-between gap-3 pb-4">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Link
            href="/"
            className="hidden rounded-full border border-white/80 bg-white/76 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.28)] transition hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:shadow-[0_18px_45px_-30px_rgba(15,23,42,0.52)] dark:hover:bg-white/10 dark:hover:text-white sm:inline-flex"
          >
            Terug naar website
          </Link>
        </div>
      </div>

      <div className="site-shell relative mx-auto grid w-full gap-6 xl:grid-cols-[0.92fr_1.08fr] xl:items-stretch">
        <div className="min-w-0 rounded-[2.5rem] bg-[linear-gradient(145deg,rgba(15,23,42,1),rgba(30,64,175,0.95),rgba(14,165,233,0.88))] p-6 text-white shadow-[0_40px_120px_-56px_rgba(15,23,42,0.78)] sm:p-8 lg:p-10">
          <div className="flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-sky-200 uppercase">
                <Sparkles className="size-3.5" />
                Moderne auth-flow
              </div>
              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  Toegang tot een rijschoolplatform dat voelt als premium software.
                </h1>
                <p className="max-w-lg text-base leading-8 text-white/75 sm:text-lg">
                  Inloggen, registreren en herstellen gebeurt in een rustige, sterke flow die vertrouwen uitstraalt en meteen klaar is voor dagelijks gebruik.
                </p>
                <SignatureLine className="h-px w-32 rounded-full" />
              </div>
            </div>

            <div className="grid gap-4">
              {authBenefits.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.7rem] border border-white/12 bg-white/10 p-5 backdrop-blur"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white/12">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <p className="text-sm leading-7 text-white/82">{item}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.7rem] border border-white/12 bg-white/10 p-5">
                <p className="text-sm text-white/65">Voor leerlingen</p>
                <p className="mt-2 text-xl font-semibold">Zoeken, boeken en volgen</p>
              </div>
              <div className="rounded-[1.7rem] border border-white/12 bg-white/10 p-5">
                <div className="flex items-center gap-2 text-emerald-300">
                  <ShieldCheck className="size-4" />
                  <span className="text-sm font-medium">Veilig en schaalbaar</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-white/75">
                  Voorbereid op rollen, routebescherming en live platformdata.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-[2.5rem] border border-white/70 bg-white/84 p-4 shadow-[0_32px_100px_-50px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.86),rgba(30,41,59,0.82),rgba(15,23,42,0.88))] dark:shadow-[0_32px_100px_-50px_rgba(15,23,42,0.7)] sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
