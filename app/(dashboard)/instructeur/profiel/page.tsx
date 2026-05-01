import {
  Award,
  BadgeCheck,
  CalendarDays,
  Camera,
  Car,
  Clock3,
  Languages,
  LockKeyhole,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  Trophy,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AvatarUploadCard } from "@/components/profile/avatar-upload-card";
import { ProfileForm } from "@/components/profile/profile-form";
import { InstructorReviewReplyDialog } from "@/components/reviews/instructor-review-reply-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getInstructorReviews } from "@/lib/data/instructors";
import { getInstructeurLessons } from "@/lib/data/lesson-requests";
import {
  getCurrentInstructeurRecord,
  getCurrentProfile,
} from "@/lib/data/profiles";
import { getCurrentInstructorReviewSummary } from "@/lib/data/reviews";
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";
import { formatStars, getInitials } from "@/lib/format";
import { instructorColorOptions } from "@/lib/instructor-profile";
import { cn } from "@/lib/utils";

function transmissionLabel(value?: string | null) {
  if (value === "automaat") return "B (Automaat)";
  if (value === "handgeschakeld") return "B (Schakel)";
  return "B (Auto)";
}

function getProfileStatusLabel(value?: string | null) {
  if (value === "goedgekeurd") return "Actief";
  if (value === "in_beoordeling") return "In beoordeling";
  return value ?? "Concept";
}

function formatMemberSince() {
  return "Lid sinds 2026";
}

function getWorkAreaMap(area: string | null | undefined) {
  const normalized = (area || "Amsterdam").trim().toLowerCase();
  const presets: Record<string, { bbox: string; marker: string; label: string }> = {
    amsterdam: {
      bbox: "4.728,52.278,5.079,52.431",
      marker: "52.3676,4.9041",
      label: "Amsterdam",
    },
    amstelveen: {
      bbox: "4.780,52.250,4.945,52.350",
      marker: "52.3025,4.8627",
      label: "Amstelveen",
    },
    diemen: {
      bbox: "4.930,52.315,5.020,52.365",
      marker: "52.3380,4.9597",
      label: "Diemen",
    },
    aalsmeer: {
      bbox: "4.690,52.230,4.830,52.300",
      marker: "52.2592,4.7597",
      label: "Aalsmeer",
    },
  };
  const preset =
    presets[normalized] ??
    presets[Object.keys(presets).find((key) => normalized.includes(key)) ?? "amsterdam"];

  return {
    ...preset,
    src: `https://www.openstreetmap.org/export/embed.html?bbox=${preset.bbox}&layer=mapnik&marker=${preset.marker}`,
  };
}

function getAvailabilityPreview(
  slots: Awaited<ReturnType<typeof getCurrentInstructorAvailability>>
) {
  const active = slots.filter((slot) => slot.beschikbaar && slot.start_at);
  const grouped = new Map<string, string>();

  for (const slot of active) {
    if (!slot.dag || grouped.has(slot.dag)) continue;
    grouped.set(slot.dag, slot.tijdvak);
  }

  const rows = Array.from(grouped.entries()).slice(0, 6).map(([day, window]) => ({
    day,
    window,
    label: "Beschikbaar",
  }));

  if (rows.length) return rows;

  return [
    { day: "Maandag", window: "Nog niet ingesteld", label: "Aanvullen" },
    { day: "Dinsdag", window: "Nog niet ingesteld", label: "Aanvullen" },
    { day: "Woensdag", window: "Nog niet ingesteld", label: "Aanvullen" },
    { day: "Donderdag", window: "Nog niet ingesteld", label: "Aanvullen" },
  ];
}

function ProfilePanel({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-[1.35rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(148,163,184,0.055),rgba(15,23,42,0.2))] p-4 shadow-[0_22px_70px_-48px_rgba(15,23,42,0.75)]",
        className
      )}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {action}
    </div>
  );
}

export default async function InstructeurProfielPage() {
  const [profile, instructor, reviewSummary, lessons, availability, studentsWorkspace] =
    await Promise.all([
      getCurrentProfile(),
      getCurrentInstructeurRecord(),
      getCurrentInstructorReviewSummary(),
      getInstructeurLessons(),
      getCurrentInstructorAvailability(),
      getInstructeurStudentsWorkspace(),
    ]);

  const publicReviews = instructor?.slug
    ? await getInstructorReviews(instructor.slug)
    : [];

  const profileName = profile?.volledige_naam ?? "RijBasis";
  const avatarUrl = profile?.avatar_url ?? null;
  const fallbackColor =
    instructor?.profielfoto_kleur ?? instructorColorOptions[0].value;
  const workArea = instructor?.werkgebied ?? [];
  const specialisaties = instructor?.specialisaties ?? [];
  const completedLessons = lessons.filter((lesson) => lesson.status === "afgerond");
  const activeLessons = lessons.filter((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status)
  );
  const successRate = lessons.length
    ? Math.round((completedLessons.length / lessons.length) * 100)
    : 0;
  const averageScore = reviewSummary.reviewCount
    ? formatStars(reviewSummary.averageScore)
    : "Nog geen score";
  const publicProfilePath = instructor?.slug
    ? `/instructeurs/${instructor.slug}`
    : "/instructeurs";
  const availabilityPreview = getAvailabilityPreview(availability);
  const activeSlotCount = availability.filter((slot) => slot.beschikbaar).length;
  const map = getWorkAreaMap(workArea[0]);
  const certificateRows = [
    {
      icon: ShieldCheck,
      title: "WRM instructeur",
      detail: instructor?.profiel_status === "goedgekeurd" ? "Profiel goedgekeurd" : "Status aanvullen",
      tone: "emerald",
    },
    {
      icon: Car,
      title: transmissionLabel(instructor?.transmissie),
      detail: "Rijbewijs en transmissie",
      tone: "sky",
    },
    {
      icon: Languages,
      title: specialisaties[0] ?? "Specialisaties",
      detail: specialisaties.length
        ? `${specialisaties.length} focusgebied${specialisaties.length === 1 ? "" : "en"}`
        : "Nog toevoegen",
      tone: "violet",
    },
    {
      icon: Award,
      title: "Reviewkwaliteit",
      detail: reviewSummary.reviewCount
        ? `${reviewSummary.replyRate}% reactiegraad`
        : "Nog geen reviews",
      tone: "amber",
    },
  ] as const;
  const detailRows = [
    {
      icon: Mail,
      label: "E-mailadres",
      value: profile?.email ?? "Nog niet bekend",
    },
    {
      icon: Phone,
      label: "Telefoonnummer",
      value: profile?.telefoon || "Nog toevoegen",
    },
    {
      icon: MapPin,
      label: "Adres",
      value: workArea[0] ?? "Werkgebied nog invullen",
    },
    {
      icon: ShieldCheck,
      label: "Rijbewijs",
      value: transmissionLabel(instructor?.transmissie),
    },
    {
      icon: Clock3,
      label: "Ervaring",
      value: `${instructor?.ervaring_jaren ?? 0} jaar`,
    },
    {
      icon: Car,
      label: "Lesauto",
      value: specialisaties.find((item) => item.toLowerCase().includes("auto")) ?? "Nog toevoegen",
    },
    {
      icon: Languages,
      label: "Talen",
      value: "Nederlands",
    },
  ];
  const stats = [
    {
      icon: UsersRound,
      value: `${studentsWorkspace.students.length}`,
      label: "Totale leerlingen",
      detail: activeLessons.length ? `${activeLessons.length} actieve lessen` : "Nog geen actieve lessen",
      tone: "from-violet-500 to-purple-700",
    },
    {
      icon: CalendarDays,
      value: `${lessons.length}`,
      label: "Totale lessen",
      detail: completedLessons.length ? `${completedLessons.length} afgerond` : "Start je eerste les",
      tone: "from-emerald-500 to-green-700",
    },
    {
      icon: Star,
      value: reviewSummary.reviewCount ? reviewSummary.averageScore.toFixed(1) : "0.0",
      label: "Gemiddelde beoordeling",
      detail: `${reviewSummary.reviewCount} review${reviewSummary.reviewCount === 1 ? "" : "s"}`,
      tone: "from-blue-500 to-sky-700",
    },
    {
      icon: Trophy,
      value: `${successRate}%`,
      label: "Afgerond",
      detail: lessons.length ? "Op basis van leshistorie" : "Nog geen historie",
      tone: "from-orange-500 to-amber-700",
    },
    {
      icon: Clock3,
      value: `${instructor?.ervaring_jaren ?? 0} jaar`,
      label: "Ervaring",
      detail: formatMemberSince(),
      tone: "from-indigo-500 to-violet-700",
    },
  ];

  return (
    <div className="space-y-4 text-slate-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Profiel
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Beheer je persoonlijke gegevens, publieke profielkaart en instellingen.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="w-fit rounded-xl border-white/10 bg-white/8 text-white hover:bg-white/12"
        >
          <Link href={publicProfilePath}>Openbare preview</Link>
        </Button>
      </div>

      <ProfilePanel className="p-5">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="grid gap-5 md:grid-cols-[10rem_minmax(0,1fr)]">
            <div className="flex flex-col items-center gap-3">
              <div
                className={`relative flex size-32 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${fallbackColor} text-4xl font-bold text-white shadow-[0_26px_70px_-30px_rgba(239,68,68,0.65)] ring-1 ring-white/10`}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`Profielfoto van ${profileName}`}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                ) : (
                  getInitials(profileName)
                )}
              </div>
              <Button
                asChild
                size="sm"
                className="rounded-lg bg-blue-600 text-white hover:bg-blue-500"
              >
                <a href="#foto-beheren">
                  <Camera className="size-4" />
                  Wijzig foto
                </a>
              </Button>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold text-white">{profileName}</h2>
                <Badge className="border-blue-400/20 bg-blue-500/15 text-blue-100">
                  <BadgeCheck className="mr-1 size-3.5" />
                  {getProfileStatusLabel(instructor?.profiel_status)}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-400">Instructeur</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/10 px-2 py-1 text-sm font-semibold text-amber-200">
                  <Star className="size-4 fill-amber-300 text-amber-300" />
                  {averageScore}
                </span>
                <span className="text-sm text-slate-300">
                  ({reviewSummary.reviewCount} review{reviewSummary.reviewCount === 1 ? "" : "s"})
                </span>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
                {instructor?.bio ||
                  "Vertel kort wie je bent, hoe je lesgeeft en waarom leerlingen met vertrouwen bij jou kunnen starten."}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-2 text-emerald-300">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  {getProfileStatusLabel(instructor?.profiel_status)}
                </span>
                <span className="text-slate-400">{formatMemberSince()}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {detailRows.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <item.icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="mt-1 truncate text-sm font-medium text-slate-100">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ProfilePanel>

      <div className="grid gap-3 md:grid-cols-5">
        {stats.map((item) => (
          <ProfilePanel key={item.label} className="p-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white",
                  item.tone
                )}
              >
                <item.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-sm text-slate-300">{item.label}</p>
                <p className="mt-2 text-xs leading-5 text-emerald-300">{item.detail}</p>
              </div>
            </div>
          </ProfilePanel>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ProfilePanel>
          <SectionTitle
            title="Over mij"
            action={
              <Button asChild size="sm" variant="outline" className="rounded-lg border-white/10 bg-white/8 text-white">
                <a href="#profiel-bewerken">Bewerken</a>
              </Button>
            }
          />
          <p className="text-sm leading-7 text-slate-300">
            {instructor?.bio ||
              "Hoi! Vul hier je persoonlijke introductie in. Beschrijf je lesstijl, ervaring, sterke punten en hoe jij leerlingen rustig richting hun rijexamen helpt."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(specialisaties.length ? specialisaties : ["Rustige uitleg", "Examenfocus", "Veilige begeleiding"]).map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold text-slate-200"
              >
                {item}
              </span>
            ))}
          </div>
        </ProfilePanel>

        <ProfilePanel>
          <SectionTitle
            title="Werkgebied"
            action={
              <Button asChild size="sm" variant="outline" className="rounded-lg border-white/10 bg-white/8 text-white">
                <a href="#profiel-bewerken">Bewerken</a>
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              {(workArea.length ? workArea : ["Amsterdam", "Amstelveen", "Diemen", "Aalsmeer"]).slice(0, 6).map((area) => (
                <div key={area} className="flex items-center gap-2 text-sm text-slate-300">
                  <MapPin className="size-4 text-slate-500" />
                  {area}
                </div>
              ))}
            </div>
            <div className="relative min-h-44 overflow-hidden rounded-xl border border-white/10 bg-slate-950">
              <iframe
                title={`Plattegrond werkgebied ${map.label}`}
                src={map.src}
                className="absolute inset-0 h-full w-full border-0 grayscale-[0.18] invert-[0.88] hue-rotate-180 saturate-[0.85]"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.1),rgba(15,23,42,0.34)),radial-gradient(circle_at_50%_52%,rgba(59,130,246,0.18),transparent_34%)]" />
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-white/10 bg-slate-950/78 px-3 py-2 text-xs font-semibold text-slate-100 backdrop-blur">
                {map.label}
              </div>
            </div>
          </div>
        </ProfilePanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ProfilePanel>
          <SectionTitle
            title="Beschikbaarheid"
            action={
              <Button asChild size="sm" variant="outline" className="rounded-lg border-white/10 bg-white/8 text-white">
                <Link href="/instructeur/beschikbaarheid">Beheer beschikbaarheid</Link>
              </Button>
            }
          />
          <div className="space-y-2">
            {availabilityPreview.map((row) => (
              <div
                key={`${row.day}-${row.window}`}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-white/8 py-2 text-sm last:border-b-0"
              >
                <span className="text-slate-300">{row.day}</span>
                <span className="text-slate-200">{row.window}</span>
                <span className="rounded-md bg-emerald-500/18 px-2 py-1 text-xs font-semibold text-emerald-200">
                  {row.label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            {activeSlotCount} open blok{activeSlotCount === 1 ? "" : "ken"} zichtbaar in je agenda.
          </p>
        </ProfilePanel>

        <ProfilePanel>
          <SectionTitle
            title="Kwalificaties & Certificaten"
            action={
              <Button asChild size="sm" variant="outline" className="rounded-lg border-white/10 bg-white/8 text-white">
                <a href="#profiel-bewerken">Toevoegen</a>
              </Button>
            }
          />
          <div className="space-y-3">
            {certificateRows.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between gap-3 border-b border-white/8 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      item.tone === "emerald" && "bg-emerald-500/18 text-emerald-200",
                      item.tone === "sky" && "bg-sky-500/18 text-sky-200",
                      item.tone === "violet" && "bg-violet-500/18 text-violet-200",
                      item.tone === "amber" && "bg-amber-500/18 text-amber-200"
                    )}
                  >
                    <item.icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ProfilePanel>
      </div>

      <ProfilePanel>
        <SectionTitle
          title="Recente reviews"
          action={
            <Button asChild size="sm" variant="outline" className="rounded-lg border-white/10 bg-white/8 text-white">
              <Link href="/instructeur/reviews">Bekijk alle reviews</Link>
            </Button>
          }
        />
        <div className="space-y-3">
          {publicReviews.length ? (
            publicReviews.slice(0, 3).map((review) => (
              <div
                key={review.id}
                className="grid gap-3 border-b border-white/8 pb-3 last:border-b-0 last:pb-0 md:grid-cols-[12rem_minmax(0,1fr)_auto]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                    {getInitials(review.leerling_naam)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{review.leerling_naam}</p>
                    <p className="text-xs text-slate-400">{review.datum}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-300">
                    {Array.from({ length: Math.round(review.score) }).map((_, index) => (
                      <Star key={`${review.id}-${index}`} className="size-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{review.tekst}</p>
                </div>
                <InstructorReviewReplyDialog
                  reviewId={review.id}
                  reviewerName={review.leerling_naam}
                  reviewTitle={review.titel}
                  initialReply={review.antwoord_tekst}
                />
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-white/12 bg-white/5 p-4 text-sm leading-6 text-slate-400">
              Nog geen reviews. Zodra leerlingen afgeronde lessen beoordelen, bouw je hier social proof op.
            </div>
          )}
        </div>
      </ProfilePanel>

      <ProfilePanel>
        <SectionTitle title="Account instellingen" />
        <div className="space-y-2">
          {[
            {
              icon: LockKeyhole,
              title: "Wachtwoord wijzigen",
              detail: "Wijzig je accountwachtwoord",
              href: "/wachtwoord-vergeten",
              label: "Wijzigen",
            },
            {
              icon: Mail,
              title: "E-mail adres wijzigen",
              detail: "Wijzig je e-mailadres",
              href: "#profiel-email",
              label: "Wijzigen",
            },
            {
              icon: MessageSquare,
              title: "Notificatie instellingen",
              detail: "Beheer hoe je notificaties ontvangt",
              href: "/instructeur/instellingen",
              label: "Beheren",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="grid gap-3 border-b border-white/8 py-3 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-white/8 text-slate-300">
                  <item.icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.detail}</p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="w-fit rounded-lg border-white/10 bg-white/8 text-white">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            </div>
          ))}
        </div>
      </ProfilePanel>

      <div id="foto-beheren" className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <AvatarUploadCard
          avatarUrl={avatarUrl}
          name={profileName}
          fallbackClassName={fallbackColor}
        />

        <ProfilePanel id="profiel-bewerken" className="scroll-mt-24">
          <SectionTitle title="Profiel bewerken" />
          <ProfileForm
            role="instructeur"
            tone="urban"
            initialValues={{
              volledigeNaam: profile?.volledige_naam ?? "",
              email: profile?.email ?? "",
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
        </ProfilePanel>
      </div>

      <ProfilePanel id="reviews" className="scroll-mt-24">
        <SectionTitle title="Reviews en replies" />
        <div className="space-y-3">
          {publicReviews.length ? (
            publicReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-white">{review.titel}</p>
                      <Badge className="border-amber-400/20 bg-amber-400/12 text-amber-100">
                        {review.score}/5
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {review.leerling_naam} - {review.datum}
                    </p>
                  </div>
                  <InstructorReviewReplyDialog
                    reviewId={review.id}
                    reviewerName={review.leerling_naam}
                    reviewTitle={review.titel}
                    initialReply={review.antwoord_tekst}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{review.tekst}</p>
                {review.antwoord_tekst ? (
                  <div className="mt-3 rounded-xl border border-sky-300/16 bg-sky-400/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                      Jouw reactie
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {review.antwoord_tekst}
                    </p>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-white/12 bg-white/5 p-4 text-sm leading-6 text-slate-400">
              Zodra leerlingen reviews plaatsen, kun je hier direct reageren.
            </div>
          )}
        </div>
      </ProfilePanel>
    </div>
  );
}
