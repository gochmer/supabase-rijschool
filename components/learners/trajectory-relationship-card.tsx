import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  CarFront,
  Flag,
  Handshake,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Route,
  ShieldCheck,
} from "lucide-react";

import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

type TrajectoryTone = "amber" | "emerald" | "rose" | "sky" | "violet";

type TrajectoryParticipant = {
  name: string;
  roleLabel: string;
  subtitle?: string;
  tone?: TrajectoryTone;
};

type TrajectoryDetail = {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: TrajectoryTone;
};

type TrajectoryRelationshipCardProps = {
  learner: TrajectoryParticipant;
  instructor: TrajectoryParticipant;
  startLabel: string;
  goalLabel: string;
  rhythmLabel: string;
  nextMilestone: string;
  preferences: string[];
  agreements?: string[];
  eyebrow?: string;
  title?: string;
  description?: string;
  privacyLabel?: string;
  className?: string;
};

const toneStyles: Record<
  TrajectoryTone,
  {
    avatar: string;
    badge: string;
    icon: string;
    line: string;
  }
> = {
  amber: {
    avatar: "border-amber-200/25 bg-amber-300/16 text-amber-50",
    badge: "border-amber-200/20 bg-amber-300/12 text-amber-100",
    icon: "bg-amber-300/14 text-amber-100",
    line: "bg-amber-300",
  },
  emerald: {
    avatar: "border-emerald-200/25 bg-emerald-300/16 text-emerald-50",
    badge: "border-emerald-200/20 bg-emerald-300/12 text-emerald-100",
    icon: "bg-emerald-300/14 text-emerald-100",
    line: "bg-emerald-300",
  },
  rose: {
    avatar: "border-rose-200/25 bg-rose-300/16 text-rose-50",
    badge: "border-rose-200/20 bg-rose-300/12 text-rose-100",
    icon: "bg-rose-300/14 text-rose-100",
    line: "bg-rose-300",
  },
  sky: {
    avatar: "border-sky-200/25 bg-sky-300/16 text-sky-50",
    badge: "border-sky-200/20 bg-sky-300/12 text-sky-100",
    icon: "bg-sky-300/14 text-sky-100",
    line: "bg-sky-300",
  },
  violet: {
    avatar: "border-violet-200/25 bg-violet-300/16 text-violet-50",
    badge: "border-violet-200/20 bg-violet-300/12 text-violet-100",
    icon: "bg-violet-300/14 text-violet-100",
    line: "bg-violet-300",
  },
};

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatTrajectoryDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return dateFormatter.format(date);
}

function cleanText(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function ParticipantNode({
  align = "left",
  participant,
}: {
  align?: "left" | "right";
  participant: TrajectoryParticipant;
}) {
  const tone = participant.tone ?? (align === "left" ? "sky" : "emerald");
  const styles = toneStyles[tone];
  const name = cleanText(participant.name, participant.roleLabel);

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        align === "right" && "md:flex-row-reverse md:text-right"
      )}
    >
      <div
        className={cn(
          "flex size-14 shrink-0 items-center justify-center rounded-2xl border text-base font-semibold shadow-[0_18px_38px_-28px_rgba(15,23,42,0.65)]",
          styles.avatar
        )}
      >
        {getInitials(name)}
      </div>
      <div className="min-w-0">
        <div
          className={cn(
            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            styles.badge
          )}
        >
          {participant.roleLabel}
        </div>
        <p className="mt-2 truncate text-lg font-semibold text-white">{name}</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          {cleanText(participant.subtitle, "Traject wordt opgebouwd")}
        </p>
      </div>
    </div>
  );
}

function DetailBlock({ detail }: { detail: TrajectoryDetail }) {
  const styles = toneStyles[detail.tone];

  return (
    <div className="min-w-0 rounded-[1.15rem] border border-white/10 bg-white/[0.055] p-3.5 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.72)]">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/10",
            styles.icon
          )}
        >
          <detail.icon className="size-4" />
        </span>
        <div className={cn("h-1 w-8 rounded-full", styles.line)} />
      </div>
      <p className="mt-3 text-[11px] font-semibold text-slate-400 uppercase">
        {detail.label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-white">
        {detail.value}
      </p>
    </div>
  );
}

export function TrajectoryRelationshipCard({
  agreements = [
    "Voorbereid naar elke les",
    "Wijzigingen via boekingen",
    "Berichten kort en duidelijk",
  ],
  className,
  description = "Start, doel, ritme en volgende mijlpaal staan rustig naast elkaar voor leerling en instructeur.",
  eyebrow = "Rijtraject",
  goalLabel,
  instructor,
  learner,
  nextMilestone,
  preferences,
  privacyLabel = "Alleen gedeelde trajectinformatie. Gevoelige informatie blijft opt-in.",
  rhythmLabel,
  startLabel,
  title = "Jullie rijtraject",
}: TrajectoryRelationshipCardProps) {
  const details: TrajectoryDetail[] = [
    {
      icon: CalendarClock,
      label: "Start",
      value: startLabel,
      tone: "sky",
    },
    {
      icon: Flag,
      label: "Doel",
      value: goalLabel,
      tone: "emerald",
    },
    {
      icon: CarFront,
      label: "Lesritme",
      value: rhythmLabel,
      tone: "amber",
    },
    {
      icon: Route,
      label: "Mijlpaal",
      value: nextMilestone,
      tone: "violet",
    },
  ];

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.97),rgba(30,41,59,0.92),rgba(17,24,39,0.97))] p-5 text-white shadow-[0_28px_86px_-50px_rgba(15,23,42,0.78)] sm:p-6",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(56,189,248,0.14),transparent_30%,rgba(16,185,129,0.1)_52%,transparent_72%,rgba(245,158,11,0.1))]" />
      <div className="pointer-events-none absolute inset-x-8 top-[8.6rem] hidden md:block">
        <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="mx-auto -mt-2 h-4 w-36 rounded-full border-t border-dashed border-sky-100/35" />
      </div>

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-3 py-1.5 text-xs font-semibold text-slate-200">
            <ShieldCheck className="size-3.5 text-emerald-200" />
            {eyebrow}
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-3 py-1.5 text-xs font-medium text-slate-300">
          <LockKeyhole className="size-3.5 text-sky-200" />
          Privacy bewust
        </div>
      </div>

      <div className="relative mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
        <ParticipantNode participant={learner} />

        <div className="mx-auto flex min-w-40 flex-col items-center rounded-[1.25rem] border border-white/10 bg-white/[0.065] px-4 py-3 text-center shadow-[0_20px_46px_-36px_rgba(15,23,42,0.75)]">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-sky-300/12 text-sky-100">
            <Route className="size-5" />
          </div>
          <p className="mt-2 text-sm font-semibold text-white">Samen onderweg</p>
          <p className="text-xs leading-5 text-slate-400">leerling + instructeur</p>
        </div>

        <ParticipantNode align="right" participant={instructor} />
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {details.map((detail) => (
          <DetailBlock key={detail.label} detail={detail} />
        ))}
      </div>

      <div className="relative mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <MapPin className="size-4 text-sky-200" />
            Voorkeuren en afspraken
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {preferences.map((preference) => (
              <span
                key={preference}
                className="rounded-full border border-sky-100/14 bg-sky-200/9 px-3 py-1.5 text-xs font-medium text-sky-50"
              >
                {preference}
              </span>
            ))}
            {agreements.map((agreement) => (
              <span
                key={agreement}
                className="rounded-full border border-emerald-100/14 bg-emerald-200/9 px-3 py-1.5 text-xs font-medium text-emerald-50"
              >
                {agreement}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <MessageCircle className="size-4 text-emerald-200" />
            Samenwerkingslaag
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Afspraken blijven compact: voorbereiding, wijzigingen en communicatie
            staan bij elkaar zonder gevoelige details.
          </p>
          <div className="mt-3 flex items-start gap-2 rounded-[1rem] border border-white/10 bg-slate-950/28 px-3 py-2.5 text-xs leading-5 text-slate-300">
            <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-sky-200" />
            <span>{privacyLabel}</span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-200/40 to-transparent" />
      <Handshake className="pointer-events-none absolute bottom-5 right-5 size-20 text-white/[0.035]" />
    </section>
  );
}
