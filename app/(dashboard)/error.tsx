"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard:error-boundary]", {
      digest: error.digest,
      message: error.message,
      name: error.name,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-red-300/20 bg-red-950/20 p-6 text-white shadow-2xl shadow-black/30">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-300/20 bg-red-400/10 text-red-200">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-200/80">
              Data kon niet geladen worden
            </p>
            <h2 className="text-2xl font-semibold">Probeer het zo opnieuw</h2>
            <p className="text-sm leading-6 text-slate-300">
              We tonen geen demo- of testdata als de database niet reageert. De
              fout is gelogd, zodat je met echte data verder kunt zodra de
              verbinding hersteld is.
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
