import { InsightPanel } from "@/components/dashboard/insight-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { TrendCard } from "@/components/dashboard/trend-card";
import { PackageStudio } from "@/components/packages/package-studio";
import { getAdminPackages } from "@/lib/data/admin";

export default async function AdminPakkettenPage() {
  const packages = await getAdminPackages();

  return (
    <>
      <PageHeader
        tone="urban"
        title="Pakketten beheren"
        description="Maak, wijzig, activeer of pauzeer pakketten met een aantrekkelijker commercieel overzicht."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <TrendCard
          title="Pakketinteresse"
          value={`${packages.length}`}
          change="+14%"
          description="Indicatieve trendkaart voor pakketactiviteit en commerciële aandacht."
          data={[2, 3, 4, 4, 5, 6, 7]}
        />
        <InsightPanel
          title="Pakketmix"
          description="Snelle inzichten in je actieve en gepauzeerde aanbod."
          items={[
            {
              label: "Actief",
              value: `${packages.filter((pkg) => pkg.status === "actief").length} pakket(en) zijn zichtbaar`,
            },
            {
              label: "Gepauzeerd",
              value: `${packages.filter((pkg) => pkg.status !== "actief").length} pakket(en) staan tijdelijk uit`,
            },
            {
              label: "Positionering",
              value: "Gebruik duidelijke badging en premium presentatie om keuzes makkelijker te maken.",
            },
          ]}
        />
      </div>

      <PackageStudio
        packages={packages.map((pkg) => ({
          ...pkg,
          actief: pkg.status === "actief",
        }))}
        scope="admin"
      />
    </>
  );
}
