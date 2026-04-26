import { AuthForm } from "@/components/auth/auth-form";

export default function WachtwoordVergetenPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
          Wachtwoord vergeten
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Reset je wachtwoord
        </h1>
        <p className="max-w-lg text-base leading-8 text-slate-600">
          We sturen een veilige link naar je inbox zodat je snel weer toegang krijgt tot je account.
        </p>
      </div>
      <AuthForm mode="forgot" />
    </div>
  );
}
