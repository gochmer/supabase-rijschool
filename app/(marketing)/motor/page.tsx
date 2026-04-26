import { LessonTypePage } from "@/components/marketing/lesson-type-page";
import { getPublicInstructorsByLessonType } from "@/lib/data/instructors";
import { getCatalogPackagesByLessonType } from "@/lib/data/packages";

export default async function MotorPage() {
  const [instructors, packages] = await Promise.all([
    getPublicInstructorsByLessonType("motor"),
    getCatalogPackagesByLessonType("motor"),
  ]);

  return (
    <LessonTypePage
      lessonType="motor"
      eyebrow="Motor"
      title="Motorrijlessen met meer focus, meer controle en een duidelijke route."
      description="Deze pagina bundelt instructeurs en pakketten voor motorrijlessen, zodat je niet hoeft te zoeken tussen gewoon auto-aanbod. Alles draait hier om voertuigbeheersing, verkeersdeelname en rustig toewerken naar AVB en AVD."
      highlights={[
        "AVB en AVD in een heldere opbouw",
        "Motortrajecten direct naast de juiste instructeurs",
        "Sneller zien welk aanbod echt past",
      ]}
      instructors={instructors}
      packages={packages}
    />
  );
}
