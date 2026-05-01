import { redirect } from "next/navigation";
import { Clock3, ShieldCheck } from "lucide-react";

import { InstructorRegistrationFlow } from "@/components/auth/instructor-registration-flow";
import { ensureCurrentUserContext, getCurrentInstructeurRecord } from "@/lib/data/profiles";

export default async function InstructeurVerificatiePage() {
  const context = await ensureCurrentUserContext();

  if (!context) {
    redirect("/inloggen?redirect=/instructeur-verificatie");
  }

  if (context.role !== "instructeur") {
    redirect("/");
  }

  const instructor = await getCurrentInstructeurRecord();

  if (instructor?.profiel_status === "goedgekeurd") {
    redirect("/instructeur/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-400/10 p-5 text-amber-50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300/15">
            <Clock3 className="size-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">Verificatie verplicht</h1>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                {instructor?.profiel_status ?? "in_beoordeling"}
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-amber-50/78">
              Alleen geverifieerde instructeurs krijgen volledige dashboardtoegang. Vul je gegevens volledig in en upload je WRM-documenten om je account te activeren.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-400/10 p-5 text-emerald-50">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 size-5 shrink-0" />
          <p className="text-sm leading-7">
            Na verzending ontvang je een bevestiging per e-mail. Ons team controleert je aanvraag binnen 1-2 werkdagen.
          </p>
        </div>
      </div>

      <InstructorRegistrationFlow mode="verification" />
    </div>
  );
}
