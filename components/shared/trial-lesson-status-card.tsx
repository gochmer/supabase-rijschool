"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck2,
  Clock3,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TrialLessonStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type TrialLessonStatusTone = "success" | "info" | "warning" | "danger";

export type TrialLessonStatusMeta = {
  badgeVariant: TrialLessonStatusTone;
  icon: LucideIcon;
  label: string;
  pillClassName: string;
  shortLabel: string;
  title: string;
};

export function getTrialLessonStatusMeta(
  status?: TrialLessonStatus,
  available?: boolean,
): TrialLessonStatusMeta {
  const resolvedStatus = status ?? (available ? "available" : "unknown");

  if (resolvedStatus === "available") {
    return {
      badgeVariant: "success",
      icon: ShieldCheck,
      label: "Beschikbaar",
      pillClassName:
        "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
      shortLabel: "Proefles vrij",
      title: "Proefles beschikbaar",
    };
  }

  if (resolvedStatus === "pending") {
    return {
      badgeVariant: "warning",
      icon: Clock3,
      label: "Aanvraag open",
      pillClassName:
        "border-amber-300/20 bg-amber-400/10 text-amber-100",
      shortLabel: "Aanvraag open",
      title: "Proeflesaanvraag open",
    };
  }

  if (resolvedStatus === "planned") {
    return {
      badgeVariant: "info",
      icon: CalendarCheck2,
      label: "Gepland",
      pillClassName:
        "border-sky-300/20 bg-sky-400/10 text-sky-100",
      shortLabel: "Proefles gepland",
      title: "Proefles gepland",
    };
  }

  if (resolvedStatus === "completed") {
    return {
      badgeVariant: "success",
      icon: ShieldCheck,
      label: "Voltooid",
      pillClassName:
        "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
      shortLabel: "Proefles voltooid",
      title: "Proefles voltooid",
    };
  }

  return {
    badgeVariant: "danger",
    icon: AlertTriangle,
    label: "Controle nodig",
    pillClassName: "border-rose-300/20 bg-rose-400/10 text-rose-100",
    shortLabel: "Controle nodig",
    title: "Proeflesstatus onbekend",
  };
}

function getDefaultTrialLessonMessage(
  status?: TrialLessonStatus,
  available?: boolean,
  role: "learner" | "instructor" | "admin" = "learner",
) {
  const resolvedStatus = status ?? (available ? "available" : "unknown");
  const subject =
    role === "learner" ? "Je" : role === "admin" ? "De leerling" : "Deze leerling";

  if (resolvedStatus === "available") {
    return role === "learner"
      ? "Je proefles is nog beschikbaar. Je kunt een proefles aanvragen of plannen bij een gekoppelde instructeur."
      : `${subject} kan nog een proefles aanvragen of ingepland krijgen.`;
  }

  if (resolvedStatus === "pending") {
    return role === "learner"
      ? "Er staat al een proeflesaanvraag open. Wacht op reactie voordat je opnieuw aanvraagt."
      : `${subject} heeft al een open proeflesaanvraag.`;
  }

  if (resolvedStatus === "planned") {
    return role === "learner"
      ? "Er staat al een proefles gepland. Een tweede proefles is niet beschikbaar."
      : `${subject} heeft al een geplande proefles.`;
  }

  if (resolvedStatus === "completed") {
    return role === "learner"
      ? "Je proefles is afgerond. Vervolglessen lopen nu via een gekoppeld pakket."
      : `${subject} heeft de proefles afgerond. Vervolglessen horen nu via een pakket te lopen.`;
  }

  return "De proeflesstatus kon niet veilig worden gecontroleerd. Controleer de leerling voordat je een nieuwe proefles plant.";
}

export function TrialLessonStatusCard({
  actionHref,
  actionLabel,
  available,
  className,
  compact = false,
  message,
  role = "learner",
  status,
}: {
  actionHref?: string;
  actionLabel?: string;
  available?: boolean;
  className?: string;
  compact?: boolean;
  message?: string | null;
  role?: "learner" | "instructor" | "admin";
  status?: TrialLessonStatus;
}) {
  const meta = getTrialLessonStatusMeta(status, available);
  const Icon = meta.icon;
  const resolvedMessage =
    message ?? getDefaultTrialLessonMessage(status, available, role);

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_46px_-36px_rgba(15,23,42,0.65)]",
        compact && "rounded-xl p-3 shadow-none",
        className,
      )}
      data-trial-lesson-status={status ?? (available ? "available" : "unknown")}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border",
            meta.pillClassName,
            compact && "size-8 rounded-lg",
          )}
        >
          <Icon className={compact ? "size-4" : "size-5"} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "font-semibold text-white dark:text-white",
                compact ? "text-sm" : "text-base",
              )}
            >
              {meta.title}
            </p>
            <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
          </div>
          <p
            className={cn(
              "mt-2 text-sm leading-6 text-slate-300",
              compact && "text-xs leading-5",
            )}
          >
            {resolvedMessage}
          </p>
          {actionHref && actionLabel ? (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="mt-3 rounded-full border-white/10 bg-white/7 text-white hover:bg-white/12"
            >
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
