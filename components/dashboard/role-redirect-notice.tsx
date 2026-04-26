"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Compass, Info } from "lucide-react";

import type { GebruikersRol } from "@/lib/types";
import { Button } from "@/components/ui/button";

const roleLabelMap: Record<GebruikersRol, string> = {
  leerling: "leerling",
  instructeur: "instructeur",
  admin: "beheerder",
};

function describeArea(pathname: string | null) {
  if (!pathname) {
    return "dit onderdeel";
  }

  if (pathname.startsWith("/leerling")) {
    return "het leerlinggedeelte";
  }

  if (pathname.startsWith("/instructeur")) {
    return "het instructeursgedeelte";
  }

  if (pathname.startsWith("/admin")) {
    return "het beheergedeelte";
  }

  return "dit onderdeel";
}

export function RoleRedirectNotice({ role }: { role: GebruikersRol }) {
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");
  const from = searchParams.get("from");

  if (notice !== "role-mismatch") {
    return null;
  }

  const roleLabel = roleLabelMap[role];
  const areaLabel = describeArea(from);
  const shouldShowPublicInstructorsLink =
    role !== "leerling" && from?.startsWith("/leerling/instructeurs");

  return (
    <div className="rounded-[2rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.96))] p-5 shadow-[0_20px_60px_-40px_rgba(14,165,233,0.4)] dark:border-sky-300/16 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(12,74,110,0.36),rgba(15,23,42,0.9))] dark:shadow-[0_20px_60px_-40px_rgba(14,165,233,0.28)]">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-400/12 dark:text-sky-200">
          <Info className="size-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Je bent ingelogd als {roleLabel}
            </p>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              Daarom hebben we je doorgestuurd naar het juiste dashboard. {areaLabel} hoort niet
              bij dit accounttype.
            </p>
          </div>

          {shouldShowPublicInstructorsLink ? (
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/instructeurs">
                  <Compass className="size-4" />
                  Bekijk openbare instructeurs
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
