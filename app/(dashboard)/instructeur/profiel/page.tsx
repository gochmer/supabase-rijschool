import { ProfileForm } from "@/components/profile/profile-form";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentInstructeurRecord, getCurrentProfile } from "@/lib/data/profiles";
import { instructorColorOptions } from "@/lib/instructor-profile";

export default async function InstructeurProfielPage() {
  const [profile, instructor] = await Promise.all([
    getCurrentProfile(),
    getCurrentInstructeurRecord(),
  ]);

  return (
    <>
      <PageHeader
        title="Instructeur profiel"
        description="Werk je bio, prijzen, werkgebied, transmissie en profielinformatie bij."
      />
      <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.72)]">
        <CardHeader>
          <CardTitle className="text-slate-950 dark:text-white">Profielgegevens</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">
            Deze informatie wordt zichtbaar op je openbare instructeurspagina.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            role="instructeur"
            initialValues={{
              volledigeNaam: profile?.volledige_naam ?? "",
              telefoon: profile?.telefoon ?? "",
              bio: instructor?.bio ?? "",
              ervaringJaren: instructor?.ervaring_jaren ?? 0,
              werkgebied: instructor?.werkgebied?.join(", ") ?? "",
              prijsPerLes: Number(instructor?.prijs_per_les ?? 0),
              transmissie: instructor?.transmissie ?? "beide",
              specialisaties: instructor?.specialisaties?.join(", ") ?? "",
              profielfotoKleur:
                instructor?.profielfoto_kleur ?? instructorColorOptions[0].value,
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
