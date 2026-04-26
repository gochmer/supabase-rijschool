import { LessonTypePage } from "@/components/marketing/lesson-type-page";
import { getPublicInstructorsByLessonType } from "@/lib/data/instructors";
import { getCatalogPackagesByLessonType } from "@/lib/data/packages";

export default async function VrachtwagenPage() {
  const [instructors, packages] = await Promise.all([
    getPublicInstructorsByLessonType("vrachtwagen"),
    getCatalogPackagesByLessonType("vrachtwagen"),
  ]);

  return (
    <LessonTypePage
      lessonType="vrachtwagen"
      eyebrow="Vrachtwagen"
      title="Vrachtwagenrijlessen die professioneel aanvoelen vanaf de eerste stap."
      description="Voor vrachtwagenleerlingen moet het aanbod meteen helder zijn. Daarom staan hier alleen instructeurs en pakketten die gericht zijn op praktijktraining, routeopbouw en trajecten richting het C-rijbewijs."
      highlights={[
        "Gericht op C-rijbewijs en praktijkopbouw",
        "Duidelijke vrachtwagenpakketten zonder ruis",
        "Direct gekoppeld aan instructeurs met passend aanbod",
      ]}
      instructors={instructors}
      packages={packages}
    />
  );
}
