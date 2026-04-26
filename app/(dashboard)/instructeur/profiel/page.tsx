import { ArrowUpRight, BadgeCheck, MapPin, Sparkles, Star, WalletCards } from "lucide-react";
import Link from "next/link";

import { AvatarUploadCard } from "@/components/profile/avatar-upload-card";
import { ProfileForm } from "@/components/profile/profile-form";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentInstructeurRecord, getCurrentProfile } from "@/lib/data/profiles";
import { formatCurrency, getInitials } from "@/lib/format";
import { instructorColorOptions } from "@/lib/instructor-profile";

function transmissionLabel(value?: string | null) {
  if (value === "automaat") return "Automaat";
  if (value === "handgeschakeld") return "Handgeschakeld";
  return "Automaat en schakel";
}

export default async function InstructeurProfielPage() {
  const [profile, instructor] = await Promise.all([
    getCurrentProfile(),
    getCurrentInstructeurRecord(),
  ]);

  const completionScore = Number(instructor?.profiel_compleetheid ?? instructor?.profiel_voltooid ?? 0);
  const safeScore = Math.min(100, Math.max(0, completionScore));
  const workArea = instructor?.werkgebied ?? [];
  const specialisaties = instructor?.specialisaties ?? [];
  const publicProfilePath = instructor?.slug ? `/instructeurs/${instructor.slug}` : "/instructeurs";
  const improvementTips = [
    !profile?.volledige_naam ? "Vul je volledige naam in." : null,
    !instructor?.bio ? "Schrijf een korte bio met je lesstijl en aanpak." : null,
    !workArea.length ? "Voeg minimaal drie steden of regio's toe." : null,
    !specialisaties.length ? "Voeg specialisaties toe zoals faalangst, examentraining of automaat." : null,
    !Number(instructor?.prijs_per_les ?? 0) ? "Vul een duidelijke prijs per les in." : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instructeur profiel"
        description="Maak je profiel scherper, betrouwbaarder en beter verkoopbaar voor nieuwe leerlingen."
        actions={
          <Button asChild variant="outline" className="h-9 rounded-full text-[13px]">
            <Link href={publicProfilePath}>
              Openbare preview
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        }
      />

      <AvatarUploadCard
        avatarUrl={profile?.avatar_url ?? null}
        name={profile?.volledige_naam ?? "Instructeur"}
        fallbackClassName={instructor?.profielfoto_kleur ?? instructorColorOptions[0].value}
      />

      {/* rest unchanged */}
    </div>
  );
}
