import { BadgeEuro, Boxes, Eye, ImagePlus, Pin } from "lucide-react";
import Link from "next/link";

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

  const summaryCards = [
    {
      label: "Totaal pakketten",
      value: `${packages.length}`,
      description: activePackages
        ? `${activePackages} actief zichtbaar`
        : "Nog geen actieve pakketten",
      icon: Boxes,
    },
    {
      label: "Uitgelicht",
      value: `${featuredPackages}`,
      description: featuredPackages
        ? "Trekken extra aandacht op je profiel"
        : "Nog geen uitgelicht pakket",
      icon: Pin,
    },
    {
      label: "Met pakketfoto",
      value: `${packages.length - missingCoverCount}`,
      description: missingCoverCount
        ? `${missingCoverCount} missen nog beeld`
        : "Alle pakketten hebben beeld",
      icon: ImagePlus,
    },
    {
      label: "Gemiddelde prijs",
      value: packages.length ? formatCurrency(averagePrice) : "Nog leeg",
      description: practiceExamPackages
        ? `${practiceExamPackages} met praktijk-examenprijs`
        : "Nog zonder praktijk-examenlagen",
      icon: BadgeEuro,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pakketten"
        description="Houd je aanbod rustig, premium en commercieel scherp voordat het live op je openbare profiel verschijnt."
        actions={
          publicProfilePath ? (
            <Button asChild variant="outline" className="h-9 rounded-full text-[13px]">
              <Link href={publicProfilePath}>
                Openbare preview
                <Eye className="size-4" />
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card
            key={item.label}
            className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <item.icon className="size-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {item.label}
                </p>
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="studio" className="space-y-4">
        <TabsList className="h-auto w-full rounded-[1.4rem] bg-white/70 p-1 dark:bg-white/5">
          <TabsTrigger value="overzicht" className="min-h-10 rounded-[1rem] px-3 text-sm">
            Overzicht
          </TabsTrigger>
          <TabsTrigger value="studio" className="min-h-10 rounded-[1rem] px-3 text-sm">
            Studio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overzicht" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Wat staat sterk</CardTitle>
                <CardDescription>
                  Je aanbod oogt het sterkst als prijzen, zichtbaarheid en typeverdeling
                  rustig op orde zijn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {activePackages
                      ? `${activePackages} pakket(en) staan actief klaar`
                      : "Nog geen actieve pakketten"}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Zichtbare pakketten geven direct meer houvast op je profiel.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {featuredPackages
                      ? `${featuredPackages} pakket(en) trekken extra aandacht`
                      : "Nog geen uitgelicht pakket"}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Een uitgelicht pakket helpt leerlingen sneller kiezen.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeTypes.length ? (
                    activeTypes.map((type) => (
                      <Badge
                        key={type}
                        className="border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200"
                      >
                        {getRijlesTypeLabel(type)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Nog geen rijlestypes gevuld.
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Nu slim om te checken</CardTitle>
                <CardDescription>
                  Alleen de punten die het meeste verschil maken in uitstraling en
                  conversie.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {missingCoverCount
                      ? `${missingCoverCount} pakket(en) missen nog een foto`
                      : "Alle pakketten hebben al beeld"}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Goede pakketfoto&apos;s maken je aanbod direct premiumer.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {pausedPackages
                      ? `${pausedPackages} pakket(en) staan gepauzeerd`
                      : "Geen gepauzeerde pakketten"}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Pauzeer alleen aanbod dat je nu echt niet wilt tonen.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {missingTypes.length
                      ? `Nog geen ${missingTypes
                          .map((type) => getRijlesTypeLabel(type).toLowerCase())
                          .join(", ")}`
                      : "Alle hoofdtypes zijn aanwezig"}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Een bredere pakketmix helpt leerlingen sneller de juiste route kiezen.
                  </p>
                </div>
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
