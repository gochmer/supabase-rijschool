"use client";

import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Compass,
  ListChecks,
  MessageSquareText,
  Route,
} from "lucide-react";

import { getLessonAttendanceLabel } from "@/lib/lesson-utilities";
import {
  getStudentProgressItem,
  getStudentProgressStatusMeta,
} from "@/lib/student-progress";
import type {
  LessonCheckinBoard,
  LessonDetailTimelineSummary,
  Les,
  SharedLessonCompassBoard,
  StudentProgressAssessment,
  StudentProgressLessonNote,
  StudentProgressStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_ORDER: StudentProgressStatus[] = [
  "uitleg",
  "begeleid",
  "zelfstandig",
  "herhaling",
];

function hasCompassInput(board: SharedLessonCompassBoard) {
  return Boolean(
    board.instructor_focus?.trim() ||
      board.instructor_mission?.trim() ||
      board.learner_help_request?.trim() ||
      board.learner_confidence != null,
  );
}

function hasCheckinInput(board: LessonCheckinBoard) {
  return Boolean(
    board.confidence_level != null ||
      board.support_request?.trim() ||
      board.arrival_mode ||
      board.instructor_focus?.trim(),
  );
}

function getLessonStatusLabel(status: Les["status"]) {
  switch (status) {
    case "afgerond":
      return "Voltooid";
    case "geannuleerd":
      return "Geannuleerd";
    case "geweigerd":
      return "Geweigerd";
    case "aangevraagd":
      return "Aangevraagd";
    case "geaccepteerd":
      return "Geaccepteerd";
    default:
      return "Ingepland";
  }
}

function getArrivalLabel(value?: LessonCheckinBoard["arrival_mode"] | null) {
  if (value === "op_tijd") {
    return "Op tijd";
  }

  if (value === "afstemmen") {
    return "Afstemmen";
  }

  return null;
}

function getProgressSnapshot({
  assessments = [],
  timeline,
}: {
  assessments?: StudentProgressAssessment[];
  timeline?: LessonDetailTimelineSummary | null;
}) {
  if (!assessments.length) {
    return {
      count: timeline?.progress_mark_count ?? 0,
      label: timeline?.latest_progress_label ?? null,
      status: timeline?.latest_progress_status ?? null,
      statusCounts: timeline?.progress_status_counts ?? {
        begeleid: 0,
        herhaling: 0,
        uitleg: 0,
        zelfstandig: 0,
      },
    };
  }

  const statusCounts: Record<StudentProgressStatus, number> = {
    begeleid: 0,
    herhaling: 0,
    uitleg: 0,
    zelfstandig: 0,
  };

  for (const assessment of assessments) {
    statusCounts[assessment.status] += 1;
  }

  const latest = [...assessments].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  )[0];

  return {
    count: assessments.length,
    label: latest
      ? (getStudentProgressItem(latest.vaardigheid_key)?.label ??
        latest.vaardigheid_key)
      : null,
    status: latest?.status ?? null,
    statusCounts,
  };
}

function getFeedbackSummary({
  lesson,
  progressNote,
  timeline,
}: {
  lesson: Les;
  progressNote?: StudentProgressLessonNote | null;
  timeline?: LessonDetailTimelineSummary | null;
}) {
  return (
    progressNote?.samenvatting?.trim() ||
    timeline?.lesson_note_summary?.trim() ||
    lesson.lesson_note?.trim() ||
    null
  );
}

function compactBadges(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value));
}

export function LessonDetailTimeline({
  checkinBoards = [],
  className,
  compassBoards = [],
  lesson,
  progressAssessments = [],
  progressNote = null,
  timeline = null,
}: {
  checkinBoards?: LessonCheckinBoard[];
  className?: string;
  compassBoards?: SharedLessonCompassBoard[];
  lesson: Les;
  progressAssessments?: StudentProgressAssessment[];
  progressNote?: StudentProgressLessonNote | null;
  timeline?: LessonDetailTimelineSummary | null;
}) {
  const compassBoard =
    compassBoards.find((board) => board.leerling_id === lesson.leerling_id) ??
    compassBoards.find(hasCompassInput) ??
    compassBoards[0] ??
    null;
  const checkinBoard =
    checkinBoards.find((board) => board.les_id === lesson.id) ??
    checkinBoards.find(hasCheckinInput) ??
    checkinBoards[0] ??
    null;
  const hasPreparation =
    Boolean(compassBoard && hasCompassInput(compassBoard)) ||
    Boolean(checkinBoard && hasCheckinInput(checkinBoard));
  const progress = getProgressSnapshot({
    assessments: progressAssessments,
    timeline,
  });
  const feedbackSummary = getFeedbackSummary({ lesson, progressNote, timeline });
  const feedbackFocus =
    progressNote?.focus_volgende_les?.trim() ||
    timeline?.lesson_note_focus?.trim() ||
    null;
  const feedbackStrength =
    progressNote?.sterk_punt?.trim() ||
    timeline?.lesson_note_strength?.trim() ||
    null;
  const latestProgressMeta = progress.status
    ? getStudentProgressStatusMeta(progress.status)
    : null;
  const arrivalLabel = getArrivalLabel(checkinBoard?.arrival_mode);

  const items = [
    {
      badges: compactBadges([
        compassBoard?.pulse_label,
        checkinBoard?.confidence_level != null
          ? `Vertrouwen ${checkinBoard.confidence_level}/5`
          : null,
        arrivalLabel,
      ]),
      detail: hasPreparation
        ? [
            compassBoard?.instructor_focus || compassBoard?.instructor_mission
              ? `Focus: ${
                  compassBoard.instructor_focus ||
                  compassBoard.instructor_mission
                }`
              : null,
            checkinBoard?.support_request
              ? `Leerlingvraag: ${checkinBoard.support_request}`
              : null,
          ]
            .filter(Boolean)
            .join(" ")
        : "Nog geen voorbereiding of check-in vastgelegd.",
      done: hasPreparation,
      icon: Compass,
      label: "Voorbereiding/check-in",
    },
    {
      badges: compactBadges([
        getLessonStatusLabel(lesson.status),
        getLessonAttendanceLabel(lesson.attendance_status),
      ]),
      detail: `${lesson.datum} om ${lesson.tijd} - ${lesson.duur_minuten} min`,
      done: lesson.status === "afgerond",
      icon: ClipboardCheck,
      label: "Lesstatus",
    },
    {
      badges: compactBadges([
        feedbackStrength ? "Sterk punt" : null,
        feedbackFocus ? "Focus" : null,
      ]),
      detail: feedbackSummary ?? "Nog geen feedback of lesnotitie opgeslagen.",
      done: Boolean(feedbackSummary),
      icon: MessageSquareText,
      label: "Feedback/notitie",
    },
    {
      badges: latestProgressMeta
        ? compactBadges([
            `${progress.count} markering${progress.count === 1 ? "" : "en"}`,
            latestProgressMeta.label,
          ])
        : [],
      detail:
        progress.count > 0
          ? `Laatste markering: ${progress.label ?? "Vaardigheid"}${
              latestProgressMeta ? ` (${latestProgressMeta.label})` : ""
            }.`
          : "Nog geen voortgangsmarkeringen gekoppeld aan deze les.",
      done: progress.count > 0,
      icon: ListChecks,
      label: "Voortgangsmarkeringen",
    },
  ];

  return (
    <section
      className={cn(
        "rounded-[1.35rem] border border-cyan-300/18 bg-cyan-400/[0.055] p-3 text-white shadow-[0_20px_70px_-48px_rgba(34,211,238,0.55)] 2xl:p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-cyan-100/72 uppercase">
            Lesdetail-tijdlijn
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">
            Leerwaarde van deze boeking
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/18 bg-cyan-200/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
          <Route className="size-3.5" />
          {items.filter((item) => item.done).length} / {items.length} gevuld
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {items.map((item, index) => {
          const Icon = item.icon;
          const StepIcon = item.done ? CheckCircle2 : Circle;

          return (
            <div
              key={item.label}
              className="grid grid-cols-[1.65rem_minmax(0,1fr)] gap-2"
            >
              <div className="relative flex justify-center">
                {index < items.length - 1 ? (
                  <span className="absolute top-6 bottom-[-0.55rem] w-px bg-white/12" />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 flex size-6 items-center justify-center rounded-full border",
                    item.done
                      ? "border-emerald-300/35 bg-emerald-400/16 text-emerald-200"
                      : "border-white/14 bg-slate-950/36 text-slate-500",
                  )}
                >
                  <StepIcon className="size-3.5" />
                </span>
              </div>
              <div
                className={cn(
                  "rounded-xl border p-3",
                  item.done
                    ? "border-white/10 bg-white/[0.055]"
                    : "border-dashed border-white/10 bg-slate-950/20",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className="size-4 shrink-0 text-cyan-200" />
                    <p className="truncate text-sm font-semibold text-white">
                      {item.label}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.badges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full border border-white/10 bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-slate-200"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-300">
                  {item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {progress.count > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/10 pt-3">
          {STATUS_ORDER.map((status) => {
            const count = progress.statusCounts[status] ?? 0;

            if (!count) {
              return null;
            }

            const meta = getStudentProgressStatusMeta(status);

            return (
              <span
                key={status}
                className="rounded-full border border-white/10 bg-slate-950/26 px-2 py-1 text-[10px] font-semibold text-slate-200"
              >
                {meta.shortLabel}: {count}
              </span>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
