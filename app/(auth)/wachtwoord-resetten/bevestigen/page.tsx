import { ResetLinkGate } from "@/components/auth/reset-link-gate";

export default function WachtwoordResettenBevestigenPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
          Resetlink bevestigen
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Open je veilige resetpagina
        </h1>
        <p className="max-w-lg text-base leading-8 text-slate-600">
          We gebruiken eerst een korte tussenstap zodat je herstelcode niet voortijdig door een
          e-mailscanner wordt verbruikt.
        </p>
      </div>
      <ResetLinkGate />
    </div>
  );
}
