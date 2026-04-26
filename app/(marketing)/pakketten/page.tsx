import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Reveal } from "@/components/marketing/homepage-motion";
import { PackageMatchmaker } from "@/components/packages/package-matchmaker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicPackages } from "@/lib/data/packages";
import { formatCurrency } from "@/lib/format";
import { rijlesTypeOptions } from "@/lib/lesson-types";
import { getPackageCoverObjectPosition } from "@/lib/package-covers";
import { getPackageVisualConfig } from "@/lib/package-visuals";
import { cn } from "@/lib/utils";

const advisorSignals = [
  "Persoonlijk afgestemd op niveau en tempo",
  "Duidelijk aanbod zonder ruis",
  "Sterker keuzegevoel voor nieuwe leerlingen",
];

export default async function PakkettenPage() {
  const packages = await getPublicPackages();

  return (
    <div className="pb-20">
      <section className="site-shell mx-auto w-full px-4 pb-6 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <div className="mb-4 flex flex-wrap gap-2">
          {rijlesTypeOptions.map((option) => (
            <Link
              key={option.value}
              href={option.href}
              className={cn(
                "rounded-full border px-3.5 py-2 text-xs font-semibold tracking-[0.16em] uppercase transition-all",
                option.value === "auto"
                  ? "border-slate-950 bg-slate-950 text-white dark:border-sky-300/30 dark:bg-white/10"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/16 dark:hover:text-white"
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>
        <div className="mb-7 flex items-center gap-3 sm:mb-8">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-600 uppercase shadow-[0_14px_30px_-24px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:shadow-[0_14px_30px_-24px_rgba(15,23,42,0.34)]">
            Aanbod
          </span>
          <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(56,189,248,0.34),rgba(148,163,184,0.2),transparent)] dark:bg-[linear-gradient(90deg,rgba(56,189,248,0.22),rgba(255,255,255,0.12),transparent)]" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {packages.map((pakket, index) => {
            const visual = getPackageVisualConfig(
              pakket.icon_key,
              pakket.visual_theme
            );
            const coverObjectPosition = getPackageCoverObjectPosition(
              pakket.cover_position,
              pakket.cover_focus_x,
              pakket.cover_focus_y
            );
            const isLeadCard = pakket.uitgelicht || index === 1;
            const packagePoints = [
              pakket.lessen
                ? `${pakket.lessen} lessen als duidelijke basis`
                : "Flexibel opgebouwd rond jouw tempo",
              "Boekingen, betalingen en voortgang blijven netjes gekoppeld",
            ];

            return (
              <Card
                key={pakket.id}
                className={cn(
                  "group relative min-h-[29rem] overflow-hidden border shadow-[0_24px_80px_-42px_rgba(15,23,42,0.22)] transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1.5",
                  isLeadCard
                    ? "border-sky-300/16 bg-[linear-gradient(160deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96),rgba(14,165,233,0.18))] text-white hover:border-sky-300/28 hover:shadow-[0_38px_110px_-48px_rgba(14,165,233,0.42)] dark:border-sky-300/16"
                    : "border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] hover:border-slate-200 hover:shadow-[0_36px_100px_-44px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88),rgba(15,23,42,0.92))] dark:hover:border-white/16 dark:hover:shadow-[0_36px_100px_-44px_rgba(15,23,42,0.46)]",
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-x-8 top-6 h-24 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100",
                    isLeadCard ? "bg-sky-400/18" : "bg-sky-300/10 dark:bg-sky-400/14"
                  )}
                />
                <div
                  className={cn(
                    "pointer-events-none absolute inset-x-6 top-0 h-px transition-opacity duration-500 group-hover:opacity-100",
                    isLeadCard
                      ? "bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)]"
                      : "bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.55),transparent)]"
                  )}
                />
                {pakket.badge || pakket.uitgelicht ? (
                  <div
                    className={cn(
                      "absolute right-3 top-3 z-20 rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-[0.14em] uppercase backdrop-blur-md shadow-[0_18px_34px_-24px_rgba(15,23,42,0.28)]",
                      isLeadCard ? visual.featuredBadgeClass : visual.softBadgeClass
                    )}
                  >
                    {pakket.uitgelicht ? "Uitgelicht" : pakket.badge}
                  </div>
                ) : null}

                {pakket.cover_url ? (
                  <div
                    className={cn(
                      "relative z-10 mx-4 mt-4 h-28 overflow-hidden rounded-[1.1rem] border",
                      isLeadCard ? "border-white/10" : "border-slate-200/80 dark:border-white/10"
                    )}
                  >
                    <Image
                      src={pakket.cover_url}
                      alt={`Cover voor ${pakket.naam}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      style={{ objectPosition: coverObjectPosition }}
                    />
                    <div
                      className={`absolute inset-0 ${
                        isLeadCard
                          ? "bg-gradient-to-t from-slate-950/70 via-slate-950/18 to-transparent"
                          : "bg-gradient-to-t from-slate-950/35 via-slate-950/10 to-transparent"
                      }`}
                    />
                  </div>
                ) : null}

                <CardHeader className="relative z-10 space-y-3 px-4 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-[0.14em] uppercase shadow-[0_12px_28px_-24px_rgba(15,23,42,0.3)] backdrop-blur-sm",
                        isLeadCard
                          ? "border-white/14 bg-white/10 text-white/78"
                          : visual.softBadgeClass
                      )}
                    >
                      {visual.label}
                    </span>
                    {pakket.uitgelicht ? (
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[9px] font-semibold tracking-[0.14em] text-sky-700 uppercase shadow-[0_12px_28px_-24px_rgba(14,165,233,0.4)] backdrop-blur-sm dark:border-sky-300/18 dark:bg-sky-400/12 dark:text-sky-100">
                        Aanbevolen
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div
                      className={`flex size-9 items-center justify-center rounded-[1rem] ${
                        isLeadCard ? visual.featuredIconClass : visual.softIconClass
                      }`}
                    >
                      <visual.Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className={cn("text-[1rem]", isLeadCard ? "text-white" : "text-slate-950 dark:text-white")}>
                        {pakket.naam}
                      </CardTitle>
                    <CardDescription
                      className={cn(
                        "mt-1.5 line-clamp-2 text-[13px] leading-6",
                        isLeadCard ? "text-white/72" : "text-slate-600 dark:text-slate-300"
                      )}
                    >
                      {pakket.beschrijving}
                    </CardDescription>
                  </div>
                </div>
                </CardHeader>

                <CardContent className="relative z-10 flex flex-1 flex-col space-y-3.5 px-4 pb-4">
                  <div>
                    <p
                      className={`text-[1.75rem] font-semibold ${
                        isLeadCard ? "text-white" : "text-slate-950 dark:text-white"
                      }`}
                    >
                      {pakket.prijs === 0 ? "Op aanvraag" : formatCurrency(pakket.prijs)}
                    </p>
                    <p
                      className={`mt-1 text-[12px] ${
                        isLeadCard ? "text-white/70" : "text-muted-foreground dark:text-slate-300"
                      }`}
                    >
                      {pakket.lessen
                        ? `${pakket.lessen} lessen inbegrepen`
                        : "Persoonlijk samengesteld"}
                    </p>
                    {pakket.praktijk_examen_prijs !== null &&
                    pakket.praktijk_examen_prijs !== undefined ? (
                      <p
                        className={`mt-1 text-[12px] font-medium ${
                          isLeadCard ? "text-white/78" : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        Praktijk-examen {formatCurrency(pakket.praktijk_examen_prijs)}
                      </p>
                    ) : null}
                  </div>

                  <div
                    className={cn(
                      "grid gap-1.5 rounded-[1.05rem] p-2.5",
                      isLeadCard
                        ? "border border-white/10 bg-white/8"
                        : "border border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/6"
                    )}
                  >
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      <div
                        className={`rounded-[0.85rem] px-2.5 py-2 ${
                          isLeadCard
                            ? "bg-white/10 text-white"
                            : "bg-white text-slate-950 dark:bg-white/6 dark:text-white"
                        }`}
                      >
                        <p
                          className={`text-[9px] font-semibold tracking-[0.14em] uppercase ${
                            isLeadCard ? "text-white/62" : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          Prijs
                        </p>
                        <p className="mt-1 text-[13px] font-semibold">
                          {pakket.prijs === 0 ? "Op aanvraag" : formatCurrency(pakket.prijs)}
                        </p>
                      </div>

                      <div
                        className={`rounded-[0.85rem] px-2.5 py-2 ${
                          isLeadCard
                            ? "bg-white/10 text-white"
                            : "bg-white text-slate-950 dark:bg-white/6 dark:text-white"
                        }`}
                      >
                        <p
                          className={`text-[9px] font-semibold tracking-[0.14em] uppercase ${
                            isLeadCard ? "text-white/62" : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          Inhoud
                        </p>
                        <p className="mt-1 text-[13px] font-semibold">
                          {pakket.lessen ? `${pakket.lessen} lessen` : "Maatwerk traject"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      {packagePoints.map((item) => (
                        <div
                          key={item}
                          className={`flex items-start gap-2 rounded-[0.85rem] px-2.5 py-2 text-[12px] leading-5 ${
                            isLeadCard
                              ? "bg-white/6 text-white/82"
                              : "bg-white text-slate-600 dark:bg-white/6 dark:text-slate-300"
                          }`}
                        >
                          <CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${isLeadCard ? "text-sky-200" : "text-emerald-500 dark:text-emerald-300"}`} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto" />

                  <Button
                    className={cn(
                      "h-9 w-full rounded-full text-[13px] transition-all duration-300 hover:-translate-y-0.5",
                      isLeadCard
                        ? "bg-white text-slate-950 shadow-[0_18px_45px_-26px_rgba(255,255,255,0.36)] hover:bg-white/92 hover:shadow-[0_22px_52px_-26px_rgba(255,255,255,0.44)]"
                        : "bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] text-white shadow-[0_18px_45px_-24px_rgba(37,99,235,0.34)] hover:shadow-[0_22px_56px_-24px_rgba(37,99,235,0.42)]"
                    )}
                  >
                    Pakket aanvragen
                  </Button>
                </CardContent>

                {isLeadCard ? (
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.14),transparent_30%)]" />
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>

      <section className="site-shell mx-auto w-full px-4 pb-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-center gap-3 sm:mb-8">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-600 uppercase shadow-[0_14px_30px_-24px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:shadow-[0_14px_30px_-24px_rgba(15,23,42,0.34)]">
            Pakketkiezer
          </span>
          <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(56,189,248,0.34),rgba(148,163,184,0.2),transparent)] dark:bg-[linear-gradient(90deg,rgba(56,189,248,0.22),rgba(255,255,255,0.12),transparent)]" />
        </div>
        <PackageMatchmaker packages={packages} />
      </section>

      <section className="site-shell mx-auto w-full px-4 pt-10 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-[2.45rem] border border-white/70 bg-white/84 p-6 shadow-[0_32px_100px_-50px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_32px_100px_-50px_rgba(15,23,42,0.68)] sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                  Persoonlijk advies
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  We helpen je het pakket kiezen dat past bij jouw niveau, tempo en ambitie.
                </h2>
                <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                  Zo voelt het aanbod niet alleen mooier, maar ook duidelijker en overtuigender
                  voor nieuwe leerlingen.
                </p>
                <div className="flex flex-wrap gap-2">
                  {advisorSignals.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-full px-6">
                  <Link href="/registreren">Gratis starten</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6">
                  <Link href="/contact">Advies aanvragen</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
