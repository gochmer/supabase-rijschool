import { CheckCircle2, Sparkles } from "lucide-react";

import { AuthForm } from "@/components/auth/auth-form";

export default function RegistrerenPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-sky-700 uppercase shadow-[0_14px_30px_-24px_rgba(15,23,42,0.12)] dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100 dark:shadow-[0_14px_30px_-24px_rgba(15,23,42,0.42)]">
          <Sparkles className="size-3.5" />
          Registreren
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Maak je account aan
        </h1>
        <p className="max-w-lg text-base leading-8 text-slate-600 dark:text-slate-300">
          Start als leerling, instructeur of admin op een platform dat premium oogt en direct klaar is voor dagelijks gebruik.
        </p>
        <div className="grid gap-2 pt-2 sm:grid-cols-2">
          {[
            "Kies je rol en start met een passende flow.",
            "Direct voorbereid op dashboard, planning en berichten.",
          ].map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-[1.3rem] border border-slate-200 bg-white/78 px-4 py-3 text-sm text-slate-600 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:shadow-[0_18px_38px_-30px_rgba(15,23,42,0.42)]"
            >
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/12 dark:text-emerald-300">
                <CheckCircle2 className="size-3.5" />
              </div>
              <span className="leading-6">{item}</span>
            </div>
          ))}
        </div>
      </div>
      <AuthForm mode="register" />
    </div>
  );
}
