import {
  ArrowUpRight,
  BadgeCheck,
  Camera,
  MapPin,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { AvatarUploadCard } from "@/components/profile/avatar-upload-card";
import { ProfileForm } from "@/components/profile/profile-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentInstructeurRecord, getCurrentProfile } from "@/lib/data/profiles";
import { getCurrentInstructorReviewSummary } from "@/lib/data/reviews";
import { formatCurrency, formatStars, getInitials } from "@/lib/format";
import { instructorColorOptions } from "@/lib/instructor-profile";

function transmissionLabel(value?: string | null) {
  if (value === "automaat") return "Automaat";
  if (value === "handgeschakeld") return "Handgeschakeld";
  return "Automaat en schakel";
}

function getConversionLevel(score: number) {
  if (score >= 90) return "Topprofiel";
  if (score >= 70) return "Sterk profiel";
  if (score >= 45) return "In opbouw";
  return "Actie nodig";
}

export default async function InstructeurProfielPage() {
  const [profile, instructor, reviewSummary] = await Promise.all([
    getCurrentProfile(),
    getCurrentInstructeurRecord(),
    getCurrentInstructorReviewSummary(),
  ]);

  const completionScore = Number(instructor?.profiel_compleetheid ?? 0);
  const safeScore = Math.min(100, Math.max(0, completionScore));
  const workArea = instructor?.werkgebied ?? [];
  const specialisaties = instructor?.specialisaties ?? [];
  const publicProfilePath = instructor?.slug
    ? `/instructeurs/${instructor.slug}`
    : "/instructeurs";
  const avatarUrl = profile?.avatar_url ?? null;
  const fallbackColor =
    instructor?.profielfoto_kleur ?? instructorColorOptions[0].value;
  const conversionLevel = getConversionLevel(safeScore);
  const profileName = profile?.volledige_naam ?? "Instructeur";

  const improvementTips = [
    !avatarUrl ? "Upload een echte profielfoto voor meer vertrouwen." : null,
    !profile?.volledige_naam ? "Vul je volledige naam in." : null,
    !instructor?.bio ? "Schrijf een korte bio met je lesstijl en aanpak." : null,
    !workArea.length ? "Voeg minimaal drie steden of regio's toe." : null,
    !specialisaties.length
      ? "Voeg specialisaties toe zoals faalangst, examentraining of automaat."
      : null,
    !Number(instructor?.prijs_per_les ?? 0)
      ? "Vul een duidelijke prijs per les in."
      : null,
  ].filter(Boolean) as string[];

  const quickChecks = [
    {
      icon: MapPin,
      label: "Werkgebied",
      value: workArea.length ? `${workArea.length} regio's` : "Nog leeg",
    },
    {
      icon: WalletCards,
      label: "Prijs",
      value: Number(instructor?.prijs_per_les ?? 0)
        ? formatCurrency(Number(instructor?.prijs_per_les ?? 0))
        : "Nog leeg",
    },
    {
      icon: ShieldCheck,
      label: "Transmissie",
      value: transmissionLabel(instructor?.transmissie),
    },
  ];

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

      <section className="relative overflow-hidden rounded-[2.2rem] border border-white/70 bg-[linear-gradient(135deg,#020617,#172554,#0284c7)] p-6 text-white shadow-[0_34px_110px_-58px_rgba(15,23,42,0.78)] dark:border-white/10 sm:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_88%_18%,rgba(56,189,248,0.24),transparent_24%),radial-gradient(circle_at_70%_86%,rgba(249,115,22,0.16),transparent_24%)]" />
        <div className="relative grid gap-7 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/78 uppercase">
              <Sparkles className="size-3.5" />
              Profiel cockpit
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Laat leerlingen in één blik vertrouwen krijgen.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72 sm:text-[15px]">
              Je profiel is je verkooppagina. Maak direct duidelijk waar je lesgeeft, waar je goed in bent en waarom leerlingen voor jou moeten kiezen.
            </p>
          </div>

          <div className="grid min-w-[17rem] gap-3 rounded-[1.6rem] border border-white/14 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/62 uppercase">
                  Profielscore
                </p>
                <p className="mt-1 text-4xl font-semibold">{safeScore}%</p>
              </div>
              <Rocket className="size-8 text-sky-200" />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#22c55e,#facc15)]"
                style={{ width: `${safeScore}%` }}
              />
            </div>
            <p className="text-xs leading-5 text-white/68">
              {conversionLevel} • hoe completer, hoe sterker je profiel converteert.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <AvatarUploadCard
          avatarUrl={avatarUrl}
          name={profileName}
          fallbackClassName={fallbackColor}
        />

        <section className="rounded-[1.8rem] border border-white/70 bg-white/90 p-5 shadow-[0_26px_86px_-48px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86),rgba(15,23,42,0.94))]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
                Openbare indruk
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                Leerling-preview
              </h2>
            </div>
            <Badge
              variant={
                instructor?.profiel_status === "goedgekeurd" ? "success" : "warning"
              }
            >
              {instructor?.profiel_status ?? "concept"}
            </Badge>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start gap-3">
              <div
                className={`relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] bg-gradient-to-br ${fallbackColor} text-sm font-semibold text-white shadow-[0_14px_28px_-20px_rgba(15,23,42,0.42)]`}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profielfoto"
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  getInitials(profileName)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                  {profile?.volledige_naam || "Naam nog invullen"}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {workArea.length ? workArea.join(" • ") : "Werkgebied nog invullen"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    {reviewSummary.reviewCount
                      ? formatStars(reviewSummary.averageScore)
                      : "Nog geen reviews"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                    <BadgeCheck className="size-3.5" />
                    {reviewSummary.reviewCount} review
                    {reviewSummary.reviewCount === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                    <WalletCards className="size-3.5" />
                    {formatCurrency(Number(instructor?.prijs_per_les ?? 0))}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                    <Camera className="size-3.5" />
                    {avatarUrl ? "Foto actief" : "Foto mist"}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-4 line-clamp-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {instructor?.bio ||
                "Schrijf een korte introductie zodat leerlingen direct snappen hoe jij lesgeeft en waarin je uitblinkt."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {specialisaties.length ? (
                specialisaties.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Nog geen specialisaties toegevoegd.
                </span>
              )}
            </div>
            <div className="mt-4 grid gap-2">
              {reviewSummary.latestReviews.length ? (
                reviewSummary.latestReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-[1rem] border border-slate-200 bg-white/90 p-3 dark:border-white/10 dark:bg-white/6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">
                        {review.titel}
                      </p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {review.leerling_naam} â€¢ {review.datum}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {review.tekst}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1rem] border border-dashed border-slate-300 bg-white/70 p-3 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Zodra leerlingen afgeronde lessen beoordelen, zie je hier meteen de eerste social proof voor je profielpreview.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(15,23,42,0.96))] dark:text-white dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.72)]">
          <CardHeader>
            <CardTitle className="text-slate-950 dark:text-white">
              Profielgegevens
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              Deze informatie wordt zichtbaar op je openbare instructeurspagina.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              role="instructeur"
              tone="urban"
              initialValues={{
                volledigeNaam: profile?.volledige_naam ?? "",
                telefoon: profile?.telefoon ?? "",
                bio: instructor?.bio ?? "",
                ervaringJaren: instructor?.ervaring_jaren ?? 0,
                werkgebied: workArea.join(", "),
                prijsPerLes: Number(instructor?.prijs_per_les ?? 0),
                transmissie: instructor?.transmissie ?? "beide",
                specialisaties: specialisaties.join(", "),
                profielfotoKleur: fallbackColor,
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-5">
          <section className="rounded-[1.8rem] border border-white/70 bg-white/90 p-5 shadow-[0_26px_86px_-48px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-white/6">
            <div className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-primary" />
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                Verbeterpunten
              </h2>
            </div>
            <div className="mt-4 grid gap-2">
              {(improvementTips.length
                ? improvementTips
                : [
                    "Je profiel staat er sterk bij. Houd prijs, werkgebied en beschikbaarheid actueel.",
                  ]
              ).map((tip) => (
                <div
                  key={tip}
                  className="rounded-[1rem] bg-slate-50/85 px-3 py-2.5 text-sm leading-6 text-slate-700 dark:bg-white/6 dark:text-slate-300"
                >
                  {tip}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,249,255,0.9))] p-5 shadow-[0_26px_86px_-48px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84),rgba(15,23,42,0.92))]">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
              Snelle check
            </p>
            <div className="mt-3 grid gap-2">
              {quickChecks.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-[1rem] bg-white/80 px-3 py-2.5 text-sm shadow-[0_14px_34px_-28px_rgba(15,23,42,0.18)] dark:bg-white/6"
                >
                  <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <item.icon className="size-4" />
                    {item.label}
                  </span>
                  <span className="font-semibold text-slate-950 dark:text-white">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
