import Link from "next/link";
import {
  BadgeEuro,
  Boxes,
  CheckCircle2,
  CircleAlert,
  Eye,
  FileImage,
  LayoutTemplate,
  Pin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { PackageStudio } from "@/components/packages/package-studio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentInstructorPackages } from "@/lib/data/packages";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { formatCurrency } from "@/lib/format";
import { getRijlesTypeLabel } from "@/lib/lesson-types";
import type { RijlesType } from "@/lib/types";
import { cn } from "@/lib/utils";

const allLessonTypes: RijlesType[] = ["auto", "motor", "vrachtwagen"];

export default async function InstructeurPakkettenPage() {
  const [packages, instructeur] = await Promise.all([
    getCurrentInstructorPackages(),
    getCurrentInstructeurRecord(),
  ]);

  const publicProfilePath = instructeur?.slug
    ? `/instructeurs/${instructeur.slug}`
    : undefined;
  const activePackages = packages.filter((pkg) => pkg.actief !== false).length;
  const featuredPackages = packages.filter((pkg) => pkg.uitgelicht).length;
  const practiceExamPackages = packages.filter(
    (pkg) =>
      pkg.praktijk_examen_prijs !== null &&
      pkg.praktijk_examen_prijs !== undefined
  ).length;
  const missingCoverCount = packages.filter(
    (pkg) => !pkg.cover_url && !pkg.cover_path
  ).length;
  const pausedPackages = packages.filter((pkg) => pkg.actief === false).length;
  const averagePrice = packages.length
    ? Math.round(
        packages.reduce((sum, pkg) => sum + Number(pkg.prijs ?? 0), 0) /
          packages.length
      )
    : 0;
  const activeTypes = Array.from(
    new Set(packages.map((pkg) => pkg.les_type).filter(Boolean))
  ) as RijlesType[];
  const missingTypes = allLessonTypes.filter((type) => !activeTypes.includes(type));
  const imageCoverage = packages.length
    ? Math.round(((packages.length - missingCoverCount) / packages.length) * 100)
    : 0;
  const typeCoverage = Math.round(
    (activeTypes.length / allLessonTypes.length) * 100
  );
  const packageHealthScore = packages.length
    ? Math.round(
        (activePackages / Math.max(packages.length, 1)) * 45 +
          (imageCoverage / 100) * 30 +
          (typeCoverage / 100) * 25
      )
    : 0;
  const attentionCount =
    missingCoverCount + pausedPackages + missingTypes.length;

  const heroSignals = [
    {
      label: "Actief aanbod",
      value: `${activePackages}/${packages.length || 0}`,
      hint: activePackages
        ? "Pakketten staan klaar voor profielweergave."
        : "Nog geen actieve pakketten zichtbaar.",
      tone:
        "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-500/10",
    },
    {
      label: "Type dekking",
      value: `${activeTypes.length}/${allLessonTypes.length}`,
      hint:
        activeTypes.length > 0
          ? "Je aanbod spreidt zich over je lescategorieen."
          : "Nog geen rijlestype ingevuld.",
      tone:
        "border-sky-200/80 bg-sky-50/80 dark:border-sky-400/20 dark:bg-sky-500/10",
    },
    {
      label: "Nu open",
      value: `${attentionCount}`,
      hint:
        attentionCount > 0
          ? "Beeld, pauzes of typegaten vragen aandacht."
          : "Je aanbod oogt nu rustig en compleet.",
      tone:
        "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10",
    },
  ];

  const summaryCards = [
    {
      label: "Totaal pakketten",
      value: `${packages.length}`,
      description: activePackages
        ? `${activePackages} actief zichtbaar op je profiel`
        : "Nog geen actieve pakketten klaar",
      icon: Boxes,
      tone: "from-emerald-500/12 to-cyan-500/10",
    },
    {
      label: "Uitgelicht",
      value: `${featuredPackages}`,
      description: featuredPackages
        ? "Trekken extra aandacht in je aanbod"
        : "Nog geen focuspakket gekozen",
      icon: Pin,
      tone: "from-sky-500/12 to-indigo-500/10",
    },
    {
      label: "Met pakketfoto",
      value: `${packages.length - missingCoverCount}`,
      description: missingCoverCount
        ? `${missingCoverCount} missen nog beeld`
        : "Alle pakketten hebben een foto",
      icon: FileImage,
      tone: "from-slate-500/12 to-sky-500/8",
    },
    {
      label: "Gemiddelde prijs",
      value: packages.length ? formatCurrency(averagePrice) : "Nog leeg",
      description: practiceExamPackages
        ? `${practiceExamPackages} met praktijk-examenprijs`
        : "Nog zonder examenprijslaag",
      icon: BadgeEuro,
      tone: "from-amber-500/14 to-slate-500/10",
    },
  ];

  const strengthItems = [
    {
      title: activePackages
        ? `${activePackages} pakket(en) staan live klaar`
        : "Nog geen actief pakket zichtbaar",
      text: "Actieve pakketten geven direct rust en duidelijkheid op je openbare profiel.",
      icon: CheckCircle2,
      tone:
        "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10",
      iconTone:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
    },
    {
      title: featuredPackages
        ? `${featuredPackages} pakket(en) sturen de keuze`
        : "Nog geen uitgelicht pakket ingesteld",
      text: "Een uitgelicht pakket helpt leerlingen sneller kiezen zonder dat je aanbod druk wordt.",
      icon: ShieldCheck,
      tone:
        "border-sky-200/80 bg-sky-50/90 dark:border-sky-400/20 dark:bg-sky-500/10",
      iconTone:
        "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200",
    },
    {
      title:
        activeTypes.length > 0
          ? `${activeTypes.length} type(s) zijn al afgedekt`
          : "Typeverdeling is nog leeg",
      text: "Een nette mix van lescategorieen maakt je aanbod sterker en geloofwaardiger.",
      icon: LayoutTemplate,
      tone:
        "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10",
      iconTone:
        "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-200",
    },
  ];

  const attentionItems = [
    {
      title: missingCoverCount
        ? `${missingCoverCount} pakket(en) missen nog een foto`
        : "Alle pakketten hebben beeld",
      text: "Sterke pakketfoto's maken je aanbod direct professioneler en duidelijker scanbaar.",
      icon: missingCoverCount ? FileImage : CheckCircle2,
      tone: missingCoverCount
        ? "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10"
        : "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10",
      iconTone: missingCoverCount
        ? "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-200"
        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
    },
    {
      title: pausedPackages
        ? `${pausedPackages} pakket(en) staan gepauzeerd`
        : "Geen gepauzeerde pakketten",
      text: "Laat alleen gepauzeerd wat je nu bewust niet wilt tonen of verkopen.",
      icon: pausedPackages ? CircleAlert : CheckCircle2,
      tone: pausedPackages
        ? "border-amber-200/80 bg-amber-50/90 dark:border-amber-400/20 dark:bg-amber-500/10"
        : "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10",
      iconTone: pausedPackages
        ? "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200"
        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
    },
    {
      title: missingTypes.length
        ? `Nog geen ${missingTypes
            .map((type) => getRijlesTypeLabel(type).toLowerCase())
            .join(", ")}`
        : "Alle hoofdtypes zijn aanwezig",
      text: "Typegaten zijn vaak de snelste manier waarop een aanbod incompleet kan aanvoelen.",
      icon: missingTypes.length ? CircleAlert : CheckCircle2,
      tone: missingTypes.length
        ? "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10"
        : "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10",
      iconTone: missingTypes.length
        ? "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-200"
        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pakketten"
        description="Maak je aanbod rustiger, professioneler en duidelijker voordat het live op je instructeurprofiel verschijnt."
        actions={
          publicProfilePath ? (
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-full text-[13px]"
            >
              <Link href={publicProfilePath}>
                Openbare preview
                <Eye className="size-4" />
              </Link>
            </Button>
          ) : undefined
        }
      />

      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,#0f172a,#172554,#1e293b)] p-5 text-white shadow-[0_34px_120px_-62px_rgba(15,23,42,0.75)] dark:border-white/10 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(59,130,246,0.18),transparent_26%),radial-gradient(circle_at_70%_86%,rgba(148,163,184,0.16),transparent_24%)]" />
        <div className="relative grid gap-5 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/78 uppercase">
              <Sparkles className="size-3.5" />
              Pakketten cockpit
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Bouw een aanbod dat vertrouwen geeft en direct professioneel overkomt.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/74 sm:text-[15px]">
              Zie in een oogopslag welke pakketten live staan, waar nog beeld of
              spreiding mist en hoe sterk je aanbod nu aanvoelt voor nieuwe
              leerlingen.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {heroSignals.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-[1.2rem] border px-3.5 py-3 backdrop-blur",
                    item.tone
                  )}
                >
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-white/68 uppercase">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs leading-5 text-white/68">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.55rem] border border-white/14 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/62 uppercase">
                  Aanbod score
                </p>
                <p className="mt-1 text-4xl font-semibold">{packageHealthScore}</p>
              </div>
              <Boxes className="size-8 text-sky-200" />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#22c55e,#facc15)]"
                style={{ width: `${Math.max(packageHealthScore, 6)}%` }}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Gemiddeld",
                  value: packages.length ? formatCurrency(averagePrice) : "Nog leeg",
                  hint: "Prijsniveau",
                },
                {
                  label: "Beelddekking",
                  value: `${imageCoverage}%`,
                  hint: "Pakketfoto's",
                },
                {
                  label: "Type dekking",
                  value: `${typeCoverage}%`,
                  hint: "Lesmix",
                },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-[1rem] border px-3 py-3",
                    heroSignals[index]?.tone ?? "border-white/14 bg-white/10"
                  )}
                >
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-white/62 uppercase">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-white/62">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card
            key={item.label}
            className="overflow-hidden border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]"
          >
            <CardContent className="relative p-4">
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-20 bg-gradient-to-r opacity-80",
                  item.tone
                )}
              />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-950/6 text-primary dark:bg-white/10 dark:text-sky-200">
                    <item.icon className="size-4" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {item.label}
                  </p>
                </div>
                <p className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
                  {item.value}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overzicht" className="space-y-4">
        <TabsList className="h-auto w-full rounded-[1.45rem] border border-white/60 bg-white/75 p-1 dark:border-white/10 dark:bg-white/5">
          <TabsTrigger
            value="overzicht"
            className="min-h-10 rounded-[1rem] px-3 text-sm"
          >
            Overzicht
          </TabsTrigger>
          <TabsTrigger
            value="studio"
            className="min-h-10 rounded-[1rem] px-3 text-sm"
          >
            Studio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overzicht" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Wat staat sterk</CardTitle>
                <CardDescription>
                  Rustige signalen van wat je aanbod nu al stevig en geloofwaardig maakt.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {strengthItems.map((item) => (
                  <div
                    key={item.title}
                    className={cn("rounded-[1.25rem] border p-4", item.tone)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                          item.iconTone
                        )}
                      >
                        <item.icon className="size-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Nu slim om te checken</CardTitle>
                <CardDescription>
                  Alleen de punten die nu het meeste verschil maken in uitstraling en conversie.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {attentionItems.map((item) => (
                  <div
                    key={item.title}
                    className={cn("rounded-[1.25rem] border p-4", item.tone)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                          item.iconTone
                        )}
                      >
                        <item.icon className="size-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
            <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Typeverdeling</CardTitle>
                <CardDescription>
                  Welke lescategorieen je nu al afdekt en waar nog ruimte zit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {allLessonTypes.map((type) => {
                    const isActive = activeTypes.includes(type);

                    return (
                      <Badge
                        key={type}
                        className={cn(
                          "border",
                          isActive
                            ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200"
                            : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/8 dark:text-slate-300"
                        )}
                      >
                        {getRijlesTypeLabel(type)}
                      </Badge>
                    );
                  })}
                </div>
                <div className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-400/20 dark:bg-slate-500/10">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {missingTypes.length
                      ? `${missingTypes.length} type(s) missen nog aanbod`
                      : "Je hoofdtypes zijn compleet afgedekt"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Een brede maar rustige typeverdeling helpt leerlingen sneller begrijpen
                    waar jij sterk in bent.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Profielweergave</CardTitle>
                <CardDescription>
                  Dit zijn de signalen die je aanbod direct sterker maken op de publieke pagina.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    label: "Pakketfoto's",
                    value: `${packages.length - missingCoverCount}/${packages.length || 0}`,
                    hint: missingCoverCount
                      ? "Nog beeld toevoegen"
                      : "Alles heeft beeld",
                    tone:
                      "border-slate-200/80 bg-slate-50/90 dark:border-slate-400/20 dark:bg-slate-500/10",
                  },
                  {
                    label: "Focuspakketten",
                    value: `${featuredPackages}`,
                    hint: featuredPackages
                      ? "Leiden de keuze"
                      : "Nog geen focus gekozen",
                    tone:
                      "border-sky-200/80 bg-sky-50/90 dark:border-sky-400/20 dark:bg-sky-500/10",
                  },
                  {
                    label: "Examenlagen",
                    value: `${practiceExamPackages}`,
                    hint: practiceExamPackages
                      ? "Prijsdetail aanwezig"
                      : "Nog geen examenprijs",
                    tone:
                      "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn("rounded-[1.15rem] border p-4", item.tone)}
                  >
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-300/80">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {item.hint}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="studio">
          <PackageStudio
            packages={packages}
            scope="instructeur"
            publicProfilePath={publicProfilePath}
            showDashboardSummary={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
