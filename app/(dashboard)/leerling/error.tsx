"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function LeerlingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[leerling:error-boundary]", {
      digest: error.digest,
      message: error.message,
      name: error.name,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-amber-300/20 bg-slate-950/80 p-6 text-white shadow-2xl shadow-black/30">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10 text-amber-200">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold tracking-[0.18em] text-amber-200/80 uppercase">
              Leerlingdata kon niet geladen worden
            </p>
            <h2 className="text-2xl font-semibold">Probeer het zo opnieuw</h2>
            <p className="text-sm leading-6 text-slate-300">
              We tonen hier geen demo-informatie als echte data niet beschikbaar
              is. De fout is gelogd en je kunt de pagina veilig opnieuw laden.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Opnieuw proberen
        </button>
      </div>
    </div>
  );
}
