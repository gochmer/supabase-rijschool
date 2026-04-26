import { PageHeader } from "@/components/dashboard/page-header";
import { PackageStudio } from "@/components/packages/package-studio";
import { getCurrentInstructorPackages } from "@/lib/data/packages";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";

export default async function InstructeurPakkettenPage() {
  const [packages, instructeur] = await Promise.all([
    getCurrentInstructorPackages(),
    getCurrentInstructeurRecord(),
  ]);

  return (
    <>
      <PageHeader
        title="Pakketten"
        description="Bouw auto-, motor- en vrachtwagenpakketten, stel optioneel een losse praktijk-examenprijs in en laat alles zichtbaar worden op je openbare profiel."
      />
      <PackageStudio
        packages={packages}
        scope="instructeur"
        publicProfilePath={instructeur?.slug ? `/instructeurs/${instructeur.slug}` : undefined}
      />
    </>
  );
}
