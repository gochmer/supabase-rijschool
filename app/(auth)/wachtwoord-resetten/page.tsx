import { AuthForm } from "@/components/auth/auth-form";

export default function WachtwoordResettenPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
          Wachtwoord resetten
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Kies een nieuw wachtwoord
        </h1>
        <p className="max-w-lg text-base leading-8 text-slate-600">
          Gebruik een sterk wachtwoord zodat je account veilig blijft en je weer direct verder kunt.
        </p>
      </div>
      <AuthForm mode="reset" />
    </div>
  );
}
