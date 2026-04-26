import { AuthForm } from "@/components/auth/auth-form";

export default function InloggenPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
          Inloggen
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Welkom terug
        </h1>
        <p className="max-w-lg text-base leading-8 text-slate-600 dark:text-slate-300">
          Log in om je lessen, planning, berichten, pakketten en dashboard in een rustige moderne flow te beheren.
        </p>
      </div>
      <AuthForm mode="login" />
    </div>
  );
}
