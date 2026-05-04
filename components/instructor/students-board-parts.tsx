"use client";

import type {
  StudentProgressAssessment,
  StudentProgressStatus,
} from "@/lib/types";
import {
  getStudentProgressStatusMeta,
  type StudentProgressSection,
} from "@/lib/student-progress";
import { cn } from "@/lib/utils";

export type ActiveMarkMode = StudentProgressStatus | "clear";

export function getTodayInputValue() {
  const current = new Date();
  const local = new Date(current.getTime() - current.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function formatFullDate(dateValue: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(`${dateValue}T12:00:00`));
}

export function formatDateTimeLabel(dateValue: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(dateValue));
}

export function getProgressBand(value: number) {
  if (value >= 75) {
    return {
      label: "Sterk op koers",
      badge: "success" as const,
      ring: "border-emerald-200/70 bg-emerald-50/85 dark:border-emerald-400/18 dark:bg-emerald-500/8",
    };
  }

  if (value >= 40) {
    return {
      label: "In opbouw",
      badge: "warning" as const,
      ring: "border-amber-200/70 bg-amber-50/85 dark:border-amber-400/18 dark:bg-amber-500/8",
    };
  }

  return {
    label: "Extra aandacht",
    badge: "danger" as const,
    ring: "border-rose-200/70 bg-rose-50/85 dark:border-rose-400/18 dark:bg-rose-500/8",
  };
}

export function getStatusStyles(status?: StudentProgressStatus | null) {
  switch (status) {
    case "zelfstandig":
      return {
        card: "border-emerald-300/65 bg-emerald-100 text-emerald-800 dark:border-emerald-400/28 dark:bg-emerald-500/16 dark:text-emerald-100",
        dot: "bg-emerald-500",
      };
    case "begeleid":
      return {
        card: "border-sky-300/65 bg-sky-100 text-sky-800 dark:border-sky-400/28 dark:bg-sky-500/16 dark:text-sky-100",
        dot: "bg-sky-500",
      };
    case "uitleg":
      return {
        card: "border-amber-300/65 bg-amber-100 text-amber-800 dark:border-amber-400/28 dark:bg-amber-500/16 dark:text-amber-100",
        dot: "bg-amber-500",
      };
    case "herhaling":
      return {
        card: "border-rose-300/65 bg-rose-100 text-rose-800 dark:border-rose-400/28 dark:bg-rose-500/16 dark:text-rose-100",
        dot: "bg-rose-500",
      };
    default:
      return {
        card: "border-slate-200/80 bg-white/85 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400",
        dot: "bg-slate-300 dark:bg-slate-500",
      };
  }
}

export function getAssessmentDatesForStudent(
  studentId: string | undefined,
  assessments: StudentProgressAssessment[],
  selectedDate: string
) {
  if (!studentId) {
    return [selectedDate];
  }

  const uniqueDates = Array.from(
    new Set(
      assessments
        .filter((assessment) => assessment.leerling_id === studentId)
        .map((assessment) => assessment.beoordelings_datum)
    )
  ).sort((left, right) => right.localeCompare(left));

  if (!uniqueDates.includes(selectedDate)) {
    uniqueDates.unshift(selectedDate);
  }

  return uniqueDates.slice(0, 6).sort((left, right) => left.localeCompare(right));
}

export function buildNextAssessmentsState(
  current: StudentProgressAssessment[],
  payload: {
    leerlingId: string;
    lesId?: string | null;
    vaardigheidKey: string;
    beoordelingsDatum: string;
    status: StudentProgressStatus | null;
  }
) {
  const next = current.filter(
    (assessment) =>
      !(
        assessment.leerling_id === payload.leerlingId &&
        assessment.vaardigheid_key === payload.vaardigheidKey &&
        (payload.lesId
          ? assessment.les_id === payload.lesId
          : assessment.beoordelings_datum === payload.beoordelingsDatum &&
            !assessment.les_id)
      )
  );

  if (payload.status) {
    next.unshift({
      id: `local-${payload.leerlingId}-${payload.vaardigheidKey}-${payload.beoordelingsDatum}`,
      leerling_id: payload.leerlingId,
      instructeur_id: "local",
      les_id: payload.lesId ?? null,
      vaardigheid_key: payload.vaardigheidKey,
      beoordelings_datum: payload.beoordelingsDatum,
      status: payload.status,
      created_at: new Date().toISOString(),
    });
  }

  return next;
}


export function StudentSectionRows({
  section,
  assessments,
  visibleDates,
  selectedDate,
  isPending,
  onMark,
}: {
  section: StudentProgressSection;
  assessments: StudentProgressAssessment[];
  visibleDates: string[];
  selectedDate: string;
  isPending: boolean;
  onMark: (vaardigheidKey: string) => void;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={visibleDates.length + 1}
          className="rounded-[1rem] bg-[linear-gradient(90deg,rgba(14,165,233,0.16),rgba(59,130,246,0.12),rgba(255,255,255,0.02))] px-3 py-2 text-[11px] font-semibold tracking-[0.18em] text-slate-700 uppercase dark:bg-[linear-gradient(90deg,rgba(14,165,233,0.18),rgba(59,130,246,0.14),rgba(255,255,255,0.04))] dark:text-slate-200"
        >
          {section.label}
        </td>
      </tr>

      {section.items.map((item) => {
        const latest = assessments
          .filter((assessment) => assessment.vaardigheid_key === item.key)
          .sort((left, right) =>
            right.beoordelings_datum.localeCompare(left.beoordelings_datum)
          )[0];
        const latestMeta = latest?.status
          ? getStudentProgressStatusMeta(latest.status)
          : null;
        const latestStyles = getStatusStyles(latest?.status);

        return (
          <tr key={item.key}>
            <td className="sticky left-0 z-10 rounded-l-[1rem] border border-slate-200/80 bg-white/96 px-3 py-3 align-top dark:border-white/10 dark:bg-[rgba(15,23,42,0.96)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-950 dark:text-white">
                    {item.label}
                  </p>
                  {latestMeta ? (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Laatst gemarkeerd als {latestMeta.label.toLowerCase()}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Nog niet beoordeeld
                    </p>
                  )}
                </div>
                {latestMeta ? (
                  <span
                    className={cn(
                      "rounded-full border px-2 py-1 text-[11px] font-semibold",
                      latestStyles.card
                    )}
                  >
                    {latestMeta.shortLabel}
                  </span>
                ) : null}
              </div>
            </td>

            {visibleDates.map((dateValue) => {
              const assessment = assessments.find(
                (entry) =>
                  entry.vaardigheid_key === item.key &&
                  entry.beoordelings_datum === dateValue
              );
              const isEditableColumn = dateValue === selectedDate;
              const meta = assessment?.status
                ? getStudentProgressStatusMeta(assessment.status)
                : null;
              const styles = getStatusStyles(assessment?.status);

              return (
                <td
                  key={`${item.key}-${dateValue}`}
                  className="rounded-[1rem] border border-slate-200/80 bg-slate-50/88 p-1.5 text-center align-middle dark:border-white/10 dark:bg-white/5"
                >
                  {isEditableColumn ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onMark(item.key)}
                      className={cn(
                        "inline-flex h-10 w-full items-center justify-center rounded-[0.85rem] border text-[11px] font-semibold transition-all",
                        styles.card,
                        "hover:brightness-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                      )}
                    >
                      {meta ? meta.shortLabel : "+"}
                    </button>
                  ) : (
                    <div
                      className={cn(
                        "inline-flex h-10 w-full items-center justify-center rounded-[0.85rem] border text-[11px] font-semibold",
                        styles.card
                      )}
                    >
                      {meta ? meta.shortLabel : "-"}
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}
