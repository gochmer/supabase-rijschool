import { InstructorPackagesWorkspace } from "@/components/packages/instructor-packages-workspace";
import { getCurrentInstructorPackages } from "@/lib/data/packages";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";

export default async function InstructeurPakkettenPage() {
  const [packages, instructeur] = await Promise.all([
    getCurrentInstructorPackages(),
    getCurrentInstructeurRecord(),
  ]);

  const publicProfilePath = instructeur?.slug
    ? `/instructeurs/${instructeur.slug}`
    : undefined;

  return (
    <InstructorPackagesWorkspace
      packages={packages}
      publicProfilePath={publicProfilePath}
    />
  );
}
