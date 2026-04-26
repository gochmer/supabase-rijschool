"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ResetLinkGate() {
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") ?? "recovery";
  const next = searchParams.get("next") ?? "/wachtwoord-resetten";
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");
  const hasToken = Boolean(tokenHash);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center gap-2 text-slate-950">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span className="text-sm font-semibold">Veilige stap</span>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Deze tussenstap voorkomt dat een mailscanner je herstelcode al vooraf gebruikt.
          </p>
        </div>
        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center gap-2 text-slate-950">
            <Sparkles className="size-4 text-sky-600" />
            <span className="text-sm font-semibold">Slimme flow</span>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Na de bevestiging openen we direct je pagina om een nieuw wachtwoord te kiezen.
          </p>
        </div>
      </div>

      {hasToken ? (
        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/80 p-5 text-sm leading-7 text-slate-700">
          Klik hieronder om deze herstelcode veilig te activeren.
        </div>
      ) : (
        <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50/90 p-5 text-sm leading-7 text-amber-900">
          {errorCode === "otp_expired" || errorDescription
            ? "Deze resetlink is al gebruikt of verlopen. Vraag een nieuwe resetmail aan."
            : "Deze resetlink mist de benodigde herstelcode. Vraag een nieuwe resetmail aan."}
        </div>
      )}

      {hasToken ? (
        <form action="/auth/callback" method="post" className="space-y-5">
          <input type="hidden" name="token_hash" value={tokenHash ?? ""} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="next" value={next} />

          <Button
            type="submit"
            className="h-12 w-full rounded-full bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#0ea5e9)] text-sm text-white shadow-[0_24px_50px_-22px_rgba(37,99,235,0.7)]"
          >
            Open veilige resetpagina
          </Button>
        </form>
      ) : null}

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
        <p>
          Geen werkende link meer?{" "}
          <Link href="/wachtwoord-vergeten" className="text-primary hover:underline">
            Vraag een nieuwe resetmail aan
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
