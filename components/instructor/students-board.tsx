"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import type { ComponentType, HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  Eye,
  Filter,
  Flame,
  Mail,
  MoreVertical,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  toggleInstructorLearnerChecklistAction,
  updateInstructorLearnerJourneyStatusAction,
} from "@/lib/actions/instructor-learners";
import {
  clearStudentProgressAssessmentAction,
  saveStudentProgressAssessmentAction,
} from "@/lib/actions/student-progress";
import {
  updateStudentSelfSchedulingAccessAction,
  updateStudentWeeklyBookingLimitAction,
} from "@/lib/actions/student-scheduling";
import {
  getDriverJourneyStateMeta,
  type DriverJourneyStatus,
} from "@/lib/driver-journey";
import type { InstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import { MANUAL_LEARNER_INTAKE_ITEMS } from "@/lib/manual-learner-intake";
import { getFirstLessonTemplateForPackage } from "@/lib/package-first-lesson-template";
import type {
  InstructorStudentProgressRow,
  Les,
  LocationOption,
  Pakket,
  StudentProgressAssessment,
  StudentProgressLessonNote,
  StudentProgressStatus,
} from "@/lib/types";
import {
  SELF_SCHEDULING_WEEKLY_LIMIT_PRESETS,
  formatMinutesAsHoursLabel,
} from "@/lib/self-scheduling-limits";
import {
  getStudentExamReadiness,
  formatStudentProgressDate,
  getStudentProgressFocusItems,
  getStudentProgressItem,
  getStudentMilestoneOverview,
  getStudentProgressMomentum,
  getStudentProgressStreak,
  getStudentProgressStatusMeta,
  getStudentProgressStrongestItems,
  getStudentProgressSummary,
  getStudentThreeLessonTrack,
  getStudentTrajectoryIntelligence,
  getStudentWeeklyGoals,
  STUDENT_PROGRESS_SECTIONS,
  type StudentProgressSection,
} from "@/lib/student-progress";
import { cn } from "@/lib/utils";
import {
  CreateManualLessonDialog,
  type LessonPlanningAvailabilitySlot,
  type LessonPlanningBusyWindow,
} from "@/components/instructor/create-manual-lesson-dialog";
import {
  canDetachStudent,
  getRecentStudentNotes,
  getSelectedLessonNote,
  getStudentWeeklyPlanningSummary,
  getWeeklyBookingLimitInput,
} from "@/components/instructor/students-board-model";
import { StudentDetachDialog } from "@/components/instructor/student-detach-dialog";
import { StudentInviteResendButton } from "@/components/instructor/student-invite-resend-button";
import {
  buildNextAssessmentsState,
  formatDateTimeLabel,
  formatFullDate,
  getAssessmentDatesForStudent,
  getTodayInputValue,
  type ActiveMarkMode,
} from "@/components/instructor/students-board-parts";
import { StudentPackageDialog } from "@/components/instructor/student-package-dialog";
import { ProgressPrintButton } from "@/components/progress/progress-print-button";
import { StudentProgressLessonNoteEditor } from "@/components/progress/student-progress-lesson-note-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/format";

type StudentFilter = "all" | "active" | "inactive" | "dropped";
type ManualJourneyStatus = Extract<
  DriverJourneyStatus,
  "examen_gepland" | "geslaagd"
>;
type StudentStatusGroup = Exclude<StudentFilter, "all">;
type StudentSort = "newest" | "progress" | "name" | "attention";

const pageSizeOptions = [6, 10, 20] as const;
const ALL_PACKAGES_VALUE = "__all__";

const avatarTones = [
  "bg-violet-500/28 text-violet-100",
  "bg-fuchsia-500/24 text-fuchsia-100",
  "bg-emerald-500/24 text-emerald-100",
  "bg-cyan-500/24 text-cyan-100",
  "bg-amber-500/24 text-amber-100",
  "bg-rose-500/24 text-rose-100",
  "bg-blue-500/24 text-blue-100",
];

const compactDateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Amsterdam",
  year: "numeric",
});

function getStudentStatusGroup(
  student: InstructorStudentProgressRow,
): StudentStatusGroup {
  if (
    student.voortgang <= 0 &&
    student.gekoppeldeLessen <= 0 &&
    !student.volgendeLesAt &&
    student.accountStatus !== "uitgenodigd"
  ) {
    return "dropped";
  }

  if (
    student.accountStatus === "uitgenodigd" ||
    (!student.volgendeLesAt &&
      !student.zelfInplannenToegestaan &&
      student.voortgang < 40)
  ) {
    return "inactive";
  }

  return "active";
}

function getStudentStatusPill(student: InstructorStudentProgressRow) {
  const status = getStudentStatusGroup(student);

  if (status === "dropped") {
    return {
      className: "border-red-400/28 bg-red-500/12 text-red-300",
      label: "Uitgevallen",
    };
  }

  if (status === "inactive") {
    return {
      className: "border-amber-400/35 bg-amber-400/12 text-amber-300",
      label: "Inactief",
    };
  }

  return {
    className: "border-emerald-400/25 bg-emerald-500/14 text-emerald-300",
    label: "Actief",
  };
}

function getJourneyPillClass(student: InstructorStudentProgressRow) {
  switch (student.journeyTone) {
    case "danger":
      return "border-red-400/28 bg-red-500/12 text-red-200";
    case "success":
      return "border-emerald-400/25 bg-emerald-500/14 text-emerald-200";
    case "warning":
      return "border-amber-400/35 bg-amber-400/12 text-amber-200";
    case "info":
    default:
      return "border-sky-400/25 bg-sky-500/12 text-sky-200";
  }
}

function getProgressFillClass(value: number) {
  if (value >= 70) {
    return "bg-emerald-400";
  }

  if (value >= 40) {
    return "bg-amber-400";
  }

  return "bg-red-400";
}

function formatCompactDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return compactDateFormatter.format(date);
}

function getLastActiveLessonLabel(student: InstructorStudentProgressRow) {
  if (student.laatsteBeoordelingAt) {
    return formatCompactDate(`${student.laatsteBeoordelingAt}T12:00:00`);
  }

  if (student.volgendeLesAt) {
    return formatCompactDate(student.volgendeLesAt);
  }

  return "Nog geen les";
}

function getPaginationPages(currentPage: number, totalPages: number) {
  const candidates = [
    1,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    totalPages,
  ];

  return Array.from(
    new Set(candidates.filter((page) => page >= 1 && page <= totalPages)),
  ).sort((left, right) => left - right);
}

function Panel({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>) {
  return (
    <section
      {...props}
      className={cn(
        "rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(15,23,42,0.38))] p-3 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.95)] 2xl:rounded-xl 2xl:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  action,
  title,
}: {
  action?: ReactNode;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 2xl:mb-4">
      <h2 className="text-[10px] font-semibold tracking-[0.16em] text-slate-300 uppercase 2xl:text-[11px]">
        {title}
      </h2>
      {action}
    </div>
  );
}

const paperProgressColumnCount = 12;

const paperStatusSymbols: Record<StudentProgressStatus, string> = {
  begeleid: "X",
  herhaling: "H",
  uitleg: "/",
  zelfstandig: "\u2713",
};

function getPaperStatusSymbol(status?: StudentProgressStatus | null) {
  return status ? paperStatusSymbols[status] : "";
}

function PaperLineField({
  label,
  value,
}: {
  label: string;
  value?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(5.25rem,32%)_minmax(0,1fr)] items-end gap-1.5 text-[clamp(0.62rem,0.36vw,0.95rem)] leading-none 2xl:grid-cols-[minmax(8rem,30%)_minmax(0,1fr)]">
      <span className="truncate">{label}</span>
      <span className="min-h-[clamp(1rem,0.68vw,1.8rem)] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border-b-2 border-black px-1 pb-0.5 text-[clamp(0.55rem,0.35vw,0.92rem)] font-medium 2xl:px-1.5">
        {value || "\u00a0"}
      </span>
    </div>
  );
}

function formatPaperDateValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(date);
}

function getLessonDateValue(lesson: Les) {
  return lesson.start_at?.slice(0, 10) ?? null;
}

function formatLessonAuditLabel(lesson: Les | null) {
  if (!lesson?.start_at) {
    return "Datumkaart";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(lesson.start_at));
}

function PaperProgressLegendButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "grid grid-cols-[clamp(1.2rem,0.8vw,2rem)_minmax(0,1fr)] items-center gap-1.5 rounded-sm border border-transparent px-1.5 py-1 text-left transition 2xl:gap-2 2xl:px-2",
        active && "border-black bg-orange-100",
      )}
    >
      {children}
    </button>
  );
}

function StudentProgressPaperCard({
  activeMarkMode,
  assessments,
  instructorName,
  isPending,
  onDateChange,
  onMark,
  onModeChange,
  selectedDate,
  selectedStudent,
  visibleDates,
}: {
  activeMarkMode: ActiveMarkMode;
  assessments: StudentProgressAssessment[];
  instructorName: string;
  isPending: boolean;
  onDateChange: (date: string) => void;
  onMark: (vaardigheidKey: string, section: StudentProgressSection) => void;
  onModeChange: (mode: ActiveMarkMode) => void;
  selectedDate: string;
  selectedStudent: InstructorStudentProgressRow;
  visibleDates: string[];
}) {
  const paperDates = Array.from({ length: paperProgressColumnCount }, (_, index) =>
    visibleDates[index] ?? null,
  );
  const reversedSections = [...STUDENT_PROGRESS_SECTIONS].reverse();
  const paperRowCount =
    STUDENT_PROGRESS_SECTIONS.length +
    STUDENT_PROGRESS_SECTIONS.reduce(
      (total, section) => total + section.items.length,
      0,
    );
  const paperSections = reversedSections.map((section, sectionIndex) => {
    const previousRowCount = reversedSections
      .slice(0, sectionIndex)
      .reduce((total, previousSection) => total + previousSection.items.length + 1, 0);
    const sectionNumber = paperRowCount - previousRowCount;
    const rows = [...section.items].reverse().map((item, itemIndex) => ({
      item,
      number: sectionNumber - itemIndex - 1,
    }));

    return {
      rows,
      section,
      sectionNumber,
    };
  });

  return (
    <Panel
      id="voortgang"
      data-progress-matrix-root
      data-progress-print-root
      className="mx-auto w-full max-w-[1280px] overflow-hidden border-black/20 bg-white p-[clamp(0.35rem,0.35vw,0.9rem)] text-black shadow-[0_28px_90px_-58px_rgba(0,0,0,0.95)]"
    >
      <div className="mx-auto w-full max-w-[1280px] overflow-hidden bg-white p-[clamp(0.35rem,0.34vw,0.9rem)] font-sans text-black">
        <div className="grid gap-[clamp(0.65rem,0.55vw,1.35rem)] [@media(min-width:1280px)]:grid-cols-[1.12fr_0.72fr_0.88fr]">
          <div className="space-y-2">
            <PaperLineField label="Naam leerling" value={selectedStudent.naam} />
            <PaperLineField label="Straat en huisnummer" />
            <PaperLineField label="Postcode en woonplaats" />
            <PaperLineField
              label="Telefoonnummer"
              value={selectedStudent.telefoon}
            />
            <PaperLineField label="E-mail adres" value={selectedStudent.email} />
            <PaperLineField
              label="Niveau pakket"
              value={
                <span className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-1.5">
                  <span className="whitespace-nowrap">START/A/B/C/D/Op maat:</span>
                  <span className="truncate">{selectedStudent.pakket}</span>
                </span>
              }
            />
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-[clamp(0.65rem,0.5vw,1.2rem)]">
            <div className="mx-auto w-full max-w-[clamp(10rem,12vw,22rem)] border-2 border-black bg-zinc-900 px-[clamp(0.55rem,0.55vw,1.3rem)] py-[clamp(0.5rem,0.5vw,1.2rem)] text-center text-white">
              <p className="text-[clamp(0.55rem,0.35vw,0.9rem)] font-bold uppercase">Autorijschool</p>
              <p className="mt-1 text-[clamp(1.25rem,1.25vw,2.8rem)] font-black italic text-orange-400">
                GOCHOIR
              </p>
            </div>
            <PaperLineField label="Instructeur" value={instructorName} />
          </div>

          <div className="space-y-2 2xl:pt-7">
            <PaperLineField
              label="Inschrijfdatum"
              value={formatPaperDateValue(selectedStudent.gekoppeldSinds)}
            />
            <PaperLineField label="Geboortedatum" />
            <PaperLineField label="Geboorteplaats" />
            <div className="grid grid-cols-[minmax(5.25rem,32%)_minmax(0,1fr)] items-center gap-1.5 pt-1 text-[clamp(0.58rem,0.34vw,0.9rem)] 2xl:grid-cols-[minmax(7rem,30%)_minmax(0,1fr)] 2xl:gap-2">
              <span className="text-right">2ToDrive</span>
              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <span>{"\u25a1"} Ja</span>
                <span>{"\u25a1"} Geregeld</span>
                <span>{"\u25a1"} Nee</span>
              </span>
            </div>
            <label className="grid grid-cols-[minmax(5.25rem,32%)_minmax(0,1fr)] items-center gap-1.5 pt-1 text-[clamp(0.58rem,0.34vw,0.9rem)] 2xl:grid-cols-[minmax(7rem,30%)_minmax(0,1fr)] 2xl:gap-2">
              <span>Lesdatum</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => onDateChange(event.target.value)}
                className="min-w-0 border-0 border-b-2 border-black bg-transparent px-1.5 py-0.5 text-[clamp(0.55rem,0.35vw,0.92rem)] text-black outline-none 2xl:px-2"
              />
            </label>
          </div>
        </div>

        <table className="mt-[clamp(0.65rem,0.55vw,1.25rem)] w-full table-fixed border-collapse text-[clamp(0.52rem,0.34vw,0.95rem)] leading-tight">
          <colgroup>
            <col style={{ width: "38%" }} />
            <col style={{ width: "clamp(1.55rem,1.35vw,3.15rem)" }} />
            {paperDates.map((_, index) => (
              <col key={`col-${index}`} />
            ))}
          </colgroup>
          <tbody>
            {paperSections.map(({ rows, section, sectionNumber }) => {
              return (
                <Fragment key={section.key}>
                  <tr>
                    <td className="border border-black bg-orange-400 px-1 py-1 font-semibold 2xl:border-2 2xl:px-1.5">
                      <span className="block whitespace-normal break-words leading-tight">
                        {section.label}
                      </span>
                    </td>
                    <td className="border border-black bg-orange-400 text-center font-semibold 2xl:border-2">
                      {sectionNumber}
                    </td>
                    {paperDates.map((_, index) => (
                      <td
                        key={`${section.key}-header-${index}`}
                        className="h-[clamp(1.35rem,0.72vw,2.35rem)] border border-black bg-orange-400 2xl:border-2"
                      />
                    ))}
                  </tr>

                  {rows.map(({ item, number }, rowIndex) => (
                    <tr key={item.key}>
                      <td
                        className={cn(
                            "border border-black px-1 py-1 2xl:border-2 2xl:px-1.5",
                          rowIndex % 2 === 0 ? "bg-white" : "bg-neutral-200",
                        )}
                      >
                        <span className="block whitespace-normal break-words leading-tight">
                          {item.label}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "border border-black text-center 2xl:border-2",
                          rowIndex % 2 === 0 ? "bg-white" : "bg-neutral-200",
                        )}
                      >
                        {number}
                      </td>
                      {paperDates.map((dateValue, columnIndex) => {
                        const assessment = dateValue
                          ? assessments.find(
                              (entry) =>
                                entry.vaardigheid_key === item.key &&
                                entry.beoordelings_datum === dateValue,
                            )
                          : null;
                        const isEditableColumn = dateValue === selectedDate;
                        const symbol = getPaperStatusSymbol(assessment?.status);

                        return (
                          <td
                            key={`${item.key}-${dateValue ?? columnIndex}`}
                            className={cn(
                              "h-[clamp(1.35rem,0.72vw,2.3rem)] border border-black bg-white p-0 text-center align-middle 2xl:border-2",
                              !dateValue && "bg-white",
                              assessment?.status === "herhaling" && "bg-orange-100",
                            )}
                          >
                            {dateValue ? (
                              isEditableColumn ? (
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => onMark(item.key, section)}
                                  className={cn(
                                    "flex h-full w-full items-center justify-center text-[clamp(0.58rem,0.38vw,1rem)] font-bold text-black transition hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-55",
                                    symbol && "bg-white",
                                  )}
                                  title={`${item.label} markeren op ${formatStudentProgressDate(
                                    dateValue,
                                  )}`}
                                >
                                  {symbol || "+"}
                                </button>
                              ) : (
                                <span className="flex h-full w-full items-center justify-center font-bold">
                                  {symbol}
                                </span>
                              )
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              );
            })}

            <tr>
              <td
                rowSpan={2}
                className="border border-black bg-white px-2 py-2 align-top 2xl:border-2 2xl:px-5"
              >
                <p className="mb-2 text-center text-[10px] 2xl:mb-3 2xl:text-[13px]">
                  Verklaring van de te gebruiken tekens
                </p>
                <div className="grid max-w-full gap-1 text-[9px] sm:text-[10px] 2xl:max-w-[420px] 2xl:text-[13px]">
                  <PaperProgressLegendButton
                    active={activeMarkMode === "uitleg"}
                    onClick={() => onModeChange("uitleg")}
                  >
                    <span className="text-lg leading-none 2xl:text-2xl">/</span>
                    <span>Beknopte uitleg/demonstratie/afnemende hulp</span>
                  </PaperProgressLegendButton>
                  <PaperProgressLegendButton
                    active={activeMarkMode === "zelfstandig"}
                    onClick={() => onModeChange("zelfstandig")}
                  >
                    <span className="text-xl leading-none">{"\u2713"}</span>
                    <span>Zelfstandig uitgevoerd</span>
                  </PaperProgressLegendButton>
                  <PaperProgressLegendButton
                    active={activeMarkMode === "begeleid"}
                    onClick={() => onModeChange("begeleid")}
                  >
                    <span className="text-base leading-none 2xl:text-xl">X</span>
                    <span>Met begeleiding uitgevoerd</span>
                  </PaperProgressLegendButton>
                  <PaperProgressLegendButton
                    active={activeMarkMode === "herhaling"}
                    onClick={() => onModeChange("herhaling")}
                  >
                    <span className="text-base leading-none 2xl:text-xl">H</span>
                    <span>Herhaling noodzakelijk gebleken</span>
                  </PaperProgressLegendButton>
                  <PaperProgressLegendButton
                    active={activeMarkMode === "clear"}
                    onClick={() => onModeChange("clear")}
                  >
                    <span className="text-xl leading-none">{"\u25a1"}</span>
                    <span>Vakje wissen</span>
                  </PaperProgressLegendButton>
                </div>
              </td>
              <td className="border border-black bg-white text-center text-[clamp(0.55rem,0.34vw,0.95rem)] [writing-mode:vertical-rl] 2xl:border-2">
                Tijd
              </td>
              {paperDates.map((dateValue, index) => (
                <td
                  key={`time-${dateValue ?? index}`}
                  className="h-[clamp(2.6rem,1.75vw,5rem)] border border-black bg-white 2xl:border-2"
                />
              ))}
            </tr>
            <tr>
              <td className="border border-black bg-white text-center text-[clamp(0.55rem,0.34vw,0.95rem)] [writing-mode:vertical-rl] 2xl:border-2">
                Datum
              </td>
              {paperDates.map((dateValue, index) => (
                <td
                  key={`date-${dateValue ?? index}`}
                  className="h-[clamp(2.6rem,1.75vw,5rem)] border border-black bg-white p-0 text-center align-bottom 2xl:border-2"
                >
                  {dateValue ? (
                    <button
                      type="button"
                      onClick={() => onDateChange(dateValue)}
                      className={cn(
                        "flex h-full w-full items-end justify-center px-0.5 pb-1 text-[clamp(0.45rem,0.28vw,0.8rem)] font-semibold [writing-mode:vertical-rl]",
                        dateValue === selectedDate && "bg-orange-200",
                      )}
                    >
                      {formatStudentProgressDate(dateValue)}
                    </button>
                  ) : null}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3 2xl:p-4">
      <Icon className="size-4 text-slate-400" />
      <p className="mt-2 text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

export function StudentsBoard({
  students,
  assessments,
  notes,
  lessons = [],
  instructorName = "Instructeur",
  locationOptions = [],
  availabilitySlots = [],
  busyWindows = [],
  packages = [],
  lessonDurationDefaults,
  initialDate = null,
  initialLessonId = null,
  initialStudentId = null,
}: {
  students: InstructorStudentProgressRow[];
  assessments: StudentProgressAssessment[];
  notes: StudentProgressLessonNote[];
  lessons?: Les[];
  instructorName?: string;
  locationOptions?: LocationOption[];
  availabilitySlots?: LessonPlanningAvailabilitySlot[];
  busyWindows?: LessonPlanningBusyWindow[];
  packages?: Pakket[];
  lessonDurationDefaults: InstructorLessonDurationDefaults;
  initialDate?: string | null;
  initialLessonId?: string | null;
  initialStudentId?: string | null;
}) {
  const initialStudent =
    students.find((student) => student.id === initialStudentId) ??
    students[0] ??
    null;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StudentFilter>("all");
  const [packageFilter, setPackageFilter] = useState(ALL_PACKAGES_VALUE);
  const [sort, setSort] = useState<StudentSort>("newest");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState(
    initialStudent?.id ?? "",
  );
  const initialSelectedDate =
    initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)
      ? initialDate
      : initialLessonId
        ? (lessons.find((lesson) => lesson.id === initialLessonId)?.start_at?.slice(0, 10) ?? getTodayInputValue())
        : getTodayInputValue();
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [activeMarkMode, setActiveMarkMode] =
    useState<ActiveMarkMode>("zelfstandig");
  const [localStudents, setLocalStudents] = useState(students);
  const [localAssessments, setLocalAssessments] = useState(assessments);
  const [localNotes, setLocalNotes] = useState(notes);
  const [weeklyBookingLimitDraft, setWeeklyBookingLimitDraft] = useState(
    () => ({
      studentId: initialStudent?.id ?? "",
      value:
        initialStudent?.zelfInplannenHandmatigeOverrideActief &&
        initialStudent?.zelfInplannenHandmatigeLimietMinutenPerWeek != null
          ? String(initialStudent.zelfInplannenHandmatigeLimietMinutenPerWeek)
          : "",
    }),
  );
  const [isPending, startTransition] = useTransition();

  const packageOptions = useMemo(
    () =>
      Array.from(new Set(localStudents.map((student) => student.pakket)))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [localStudents],
  );

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return localStudents
      .filter((student) => {
        const matchesQuery =
          !normalizedQuery ||
          [
            student.naam,
            student.email ?? "",
            student.telefoon ?? "",
            student.pakket,
            student.aanvraagStatus,
            getStudentStatusPill(student).label,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesStatus =
          filter === "all" || getStudentStatusGroup(student) === filter;
        const matchesPackage =
          packageFilter === ALL_PACKAGES_VALUE ||
          student.pakket === packageFilter;

        return matchesQuery && matchesStatus && matchesPackage;
      })
      .sort((left, right) => {
        if (sort === "name") {
          return left.naam.localeCompare(right.naam);
        }

        if (sort === "progress") {
          return right.voortgang - left.voortgang;
        }

        if (sort === "attention") {
          return left.voortgang - right.voortgang;
        }

        return (
          new Date(right.gekoppeldSinds ?? 0).getTime() -
          new Date(left.gekoppeldSinds ?? 0).getTime()
        );
      });
  }, [filter, localStudents, packageFilter, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const firstItemIndex = filteredStudents.length
    ? (safePage - 1) * pageSize
    : 0;
  const visibleStudents = filteredStudents.slice(
    firstItemIndex,
    firstItemIndex + pageSize,
  );
  const paginationPages = getPaginationPages(safePage, totalPages);

  const selectedStudent =
    filteredStudents.find((student) => student.id === selectedStudentId) ??
    filteredStudents[0] ??
    localStudents.find((student) => student.id === selectedStudentId) ??
    localStudents[0] ??
    null;

  const selectedStudentAssessments = useMemo(() => {
    if (!selectedStudent) {
      return [];
    }

    return localAssessments.filter(
      (assessment) => assessment.leerling_id === selectedStudent.id,
    );
  }, [localAssessments, selectedStudent]);

  const selectedStudentNotes = useMemo(() => {
    if (!selectedStudent) {
      return [];
    }

    return localNotes.filter((note) => note.leerling_id === selectedStudent.id);
  }, [localNotes, selectedStudent]);

  const selectedPackage = useMemo(() => {
    if (!selectedStudent) {
      return null;
    }

    return (
      packages.find((pkg) => pkg.id === selectedStudent.pakketId) ??
      packages.find((pkg) => pkg.naam === selectedStudent.pakket) ??
      null
    );
  }, [packages, selectedStudent]);
  const shouldUseFirstLessonTemplate = selectedStudent
    ? selectedStudent.isHandmatigGekoppeld &&
      selectedStudent.gekoppeldeLessen === 0
    : false;
  const firstLessonTemplate = useMemo(() => {
    if (!shouldUseFirstLessonTemplate) {
      return null;
    }

    return getFirstLessonTemplateForPackage(selectedPackage);
  }, [selectedPackage, shouldUseFirstLessonTemplate]);
  const focusItems = useMemo(
    () => getStudentProgressFocusItems(selectedStudentAssessments),
    [selectedStudentAssessments],
  );
  const strongestItems = useMemo(
    () => getStudentProgressStrongestItems(selectedStudentAssessments),
    [selectedStudentAssessments],
  );
  const momentum = useMemo(
    () =>
      getStudentProgressMomentum(
        selectedStudentAssessments,
        selectedStudentNotes,
      ),
    [selectedStudentAssessments, selectedStudentNotes],
  );
  const examReadiness = useMemo(
    () =>
      getStudentExamReadiness(selectedStudentAssessments, selectedStudentNotes),
    [selectedStudentAssessments, selectedStudentNotes],
  );
  const weeklyGoals = useMemo(
    () =>
      getStudentWeeklyGoals(selectedStudentAssessments, selectedStudentNotes),
    [selectedStudentAssessments, selectedStudentNotes],
  );
  const progressStreak = useMemo(
    () =>
      getStudentProgressStreak(
        selectedStudentAssessments,
        selectedStudentNotes,
      ),
    [selectedStudentAssessments, selectedStudentNotes],
  );
  const milestoneOverview = useMemo(
    () =>
      getStudentMilestoneOverview(
        selectedStudentAssessments,
        selectedStudentNotes,
      ),
    [selectedStudentAssessments, selectedStudentNotes],
  );
  const threeLessonTrack = useMemo(
    () =>
      getStudentThreeLessonTrack(
        selectedStudentAssessments,
        selectedStudentNotes,
      ),
    [selectedStudentAssessments, selectedStudentNotes],
  );
  const trajectoryIntelligence = useMemo(
    () =>
      getStudentTrajectoryIntelligence({
        assessments: selectedStudentAssessments,
        notes: selectedStudentNotes,
        packageUsage: {
          packageName:
            selectedStudent?.pakket &&
            selectedStudent.pakket !== "Nog geen pakket"
              ? selectedStudent.pakket
              : null,
          totalLessons: selectedStudent?.pakketTotaalLessen ?? null,
          plannedLessons: selectedStudent?.pakketIngeplandeLessen ?? 0,
          usedLessons: selectedStudent?.pakketGevolgdeLessen ?? 0,
          remainingLessons: selectedStudent?.pakketResterendeLessen ?? null,
        },
      }),
    [selectedStudent, selectedStudentAssessments, selectedStudentNotes],
  );
  const visibleDates = useMemo(
    () =>
      getAssessmentDatesForStudent(
        selectedStudent?.id,
        localAssessments,
        selectedDate,
    ),
    [localAssessments, selectedDate, selectedStudent?.id],
  );
  const selectedProgressLesson = useMemo(() => {
    if (!selectedStudent) {
      return null;
    }

    const studentLessonsForDate = lessons
      .filter(
        (lesson) =>
          lesson.leerling_id === selectedStudent.id &&
          getLessonDateValue(lesson) === selectedDate,
      )
      .sort((left, right) =>
        (left.start_at ?? "").localeCompare(right.start_at ?? ""),
      );

    return (
      studentLessonsForDate.find((lesson) => lesson.id === initialLessonId) ??
      studentLessonsForDate[0] ??
      null
    );
  }, [initialLessonId, lessons, selectedDate, selectedStudent]);
  const selectedLessonNote = useMemo(() => {
    return getSelectedLessonNote({
      lesId: selectedProgressLesson?.id ?? null,
      notes: selectedStudentNotes,
      selectedDate,
      selectedStudent,
    });
  }, [selectedDate, selectedProgressLesson?.id, selectedStudent, selectedStudentNotes]);
  const recentNotes = useMemo(() => {
    return getRecentStudentNotes(selectedStudentNotes);
  }, [selectedStudentNotes]);

  const intakeChecklistKeys = selectedStudent?.intakeChecklistKeys ?? [];
  const intakeChecklistCompletedCount = intakeChecklistKeys.length;
  const selectedStudentAccountStatus =
    selectedStudent?.accountStatus ?? "actief";
  const selectedStudentLastSignInLabel = selectedStudent?.lastSignInAt
    ? formatDateTimeLabel(selectedStudent.lastSignInAt)
    : null;
  const weeklyPlanningSummary =
    getStudentWeeklyPlanningSummary(selectedStudent);
  const weeklyBookingLimitInput = getWeeklyBookingLimitInput({
    draft: weeklyBookingLimitDraft,
    selectedStudent,
  });
  const canDetachSelectedStudent = canDetachStudent(selectedStudent);
  const latestLessonRows = visibleDates
    .slice(-4)
    .reverse()
    .map((dateValue) => {
      const dateAssessments = selectedStudentAssessments.filter(
        (assessment) => assessment.beoordelings_datum === dateValue,
      );
      const dateSummary = getStudentProgressSummary(dateAssessments);
      const firstStatus = dateAssessments[0]?.status;

      return {
        dateValue,
        label: firstStatus
          ? getStudentProgressStatusMeta(firstStatus).label
          : "Nog open",
        percentage: dateSummary.percentage,
      };
    });

  function selectStudent(student: InstructorStudentProgressRow) {
    setSelectedStudentId(student.id);
    setWeeklyBookingLimitDraft({
      studentId: student.id,
      value:
        student.zelfInplannenHandmatigeOverrideActief &&
        student.zelfInplannenHandmatigeLimietMinutenPerWeek != null
          ? String(student.zelfInplannenHandmatigeLimietMinutenPerWeek)
          : "",
    });
  }

  function updateStudentSummary(nextAssessments: StudentProgressAssessment[]) {
    if (!selectedStudent) {
      return;
    }

    const nextSummary = getStudentProgressSummary(
      nextAssessments.filter(
        (assessment) => assessment.leerling_id === selectedStudent.id,
      ),
    );

    setLocalStudents((current) =>
      current.map((student) =>
        student.id === selectedStudent.id
          ? {
              ...student,
              voortgang: nextSummary.percentage,
              laatsteBeoordeling: nextSummary.lastReviewedAt
                ? formatFullDate(nextSummary.lastReviewedAt)
                : "Nog geen beoordeling",
              laatsteBeoordelingAt: nextSummary.lastReviewedAt,
            }
          : student,
      ),
    );
  }

  function handleAssessmentUpdate(
    vaardigheidKey: string,
    section: StudentProgressSection,
  ) {
    if (!selectedStudent) {
      return;
    }

    const previousAssessments = localAssessments;
    const nextAssessments = buildNextAssessmentsState(previousAssessments, {
      leerlingId: selectedStudent.id,
      lesId: selectedProgressLesson?.id ?? null,
      vaardigheidKey,
      beoordelingsDatum: selectedDate,
      status: activeMarkMode === "clear" ? null : activeMarkMode,
    });

    setLocalAssessments(nextAssessments);
    updateStudentSummary(nextAssessments);

    startTransition(async () => {
      const result =
        activeMarkMode === "clear"
          ? await clearStudentProgressAssessmentAction({
              leerlingId: selectedStudent.id,
              lesId: selectedProgressLesson?.id ?? null,
              vaardigheidKey,
              beoordelingsDatum: selectedDate,
            })
          : await saveStudentProgressAssessmentAction({
              leerlingId: selectedStudent.id,
              lesId: selectedProgressLesson?.id ?? null,
              vaardigheidKey,
              beoordelingsDatum: selectedDate,
              status: activeMarkMode,
            });

      if (!result.success) {
        setLocalAssessments(previousAssessments);
        updateStudentSummary(previousAssessments);
        toast.error(result.message);
        return;
      }

      const vaardigheid = getStudentProgressItem(vaardigheidKey);
      if (vaardigheid) {
        toast.success(`${section.shortLabel}: ${vaardigheid.label}`);
      }
    });
  }

  function handleLessonNoteSaved(nextNote: StudentProgressLessonNote | null) {
    if (!selectedStudent) {
      return;
    }

    setLocalNotes((current) => {
      const filtered = current.filter(
        (note) =>
          !(
            note.leerling_id === selectedStudent.id &&
            (selectedProgressLesson
              ? note.les_id === selectedProgressLesson.id
              : note.lesdatum === selectedDate && !note.les_id)
          ),
      );

      if (!nextNote) {
        return filtered;
      }

      return [nextNote, ...filtered];
    });
  }

  function handleSelfSchedulingToggle(nextAllowed: boolean) {
    if (!selectedStudent || !selectedStudent.planningVrijTeGeven) {
      return;
    }

    const previousAllowed = Boolean(selectedStudent.zelfInplannenToegestaan);

    setLocalStudents((current) =>
      current.map((student) =>
        student.id === selectedStudent.id
          ? { ...student, zelfInplannenToegestaan: nextAllowed }
          : student,
      ),
    );

    startTransition(async () => {
      const result = await updateStudentSelfSchedulingAccessAction(
        selectedStudent.id,
        nextAllowed,
      );

      if (!result.success) {
        setLocalStudents((current) =>
          current.map((student) =>
            student.id === selectedStudent.id
              ? { ...student, zelfInplannenToegestaan: previousAllowed }
              : student,
          ),
        );
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  }

  function handleWeeklyBookingLimitSave(
    nextLimit: number | null,
    mode: "manual" | "package" = "manual",
  ) {
    if (!selectedStudent?.planningVrijTeGeven) {
      return;
    }

    const previousLimit =
      selectedStudent.zelfInplannenLimietMinutenPerWeek ?? null;
    const previousManualLimit =
      selectedStudent.zelfInplannenHandmatigeLimietMinutenPerWeek ?? null;
    const previousManualOverrideActive = Boolean(
      selectedStudent.zelfInplannenHandmatigeOverrideActief,
    );
    const previousRemaining =
      selectedStudent.zelfInplannenResterendMinutenDezeWeek ?? null;
    const packageLimit =
      selectedStudent.zelfInplannenPakketLimietMinutenPerWeek ?? null;
    const usedMinutes =
      selectedStudent.zelfInplannenGebruiktMinutenDezeWeek ?? 0;
    const nextEffectiveLimit = mode === "package" ? packageLimit : nextLimit;
    const nextRemaining =
      nextEffectiveLimit == null
        ? null
        : Math.max(nextEffectiveLimit - usedMinutes, 0);

    setWeeklyBookingLimitDraft({
      studentId: selectedStudent.id,
      value:
        mode === "manual" ? (nextLimit == null ? "" : String(nextLimit)) : "",
    });
    setLocalStudents((current) =>
      current.map((student) =>
        student.id === selectedStudent.id
          ? {
              ...student,
              zelfInplannenLimietMinutenPerWeek: nextEffectiveLimit,
              zelfInplannenHandmatigeLimietMinutenPerWeek:
                mode === "manual" ? nextLimit : null,
              zelfInplannenHandmatigeOverrideActief: mode === "manual",
              zelfInplannenResterendMinutenDezeWeek: nextRemaining,
            }
          : student,
      ),
    );

    startTransition(async () => {
      const result = await updateStudentWeeklyBookingLimitAction(
        selectedStudent.id,
        nextLimit,
        mode,
      );

      if (!result.success) {
        setWeeklyBookingLimitDraft({
          studentId: selectedStudent.id,
          value:
            previousManualOverrideActive && previousManualLimit != null
              ? String(previousManualLimit)
              : "",
        });
        setLocalStudents((current) =>
          current.map((student) =>
            student.id === selectedStudent.id
              ? {
                  ...student,
                  zelfInplannenLimietMinutenPerWeek: previousLimit,
                  zelfInplannenHandmatigeLimietMinutenPerWeek:
                    previousManualLimit,
                  zelfInplannenHandmatigeOverrideActief:
                    previousManualOverrideActive,
                  zelfInplannenResterendMinutenDezeWeek: previousRemaining,
                }
              : student,
          ),
        );
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  }

  function handleChecklistToggle(itemKey: string, completed: boolean) {
    if (!selectedStudent?.isHandmatigGekoppeld) {
      return;
    }

    const previousKeys = selectedStudent.intakeChecklistKeys ?? [];
    const nextKeys = completed
      ? [...previousKeys, itemKey]
      : previousKeys.filter((key) => key !== itemKey);

    setLocalStudents((current) =>
      current.map((student) =>
        student.id === selectedStudent.id
          ? { ...student, intakeChecklistKeys: nextKeys }
          : student,
      ),
    );

    startTransition(async () => {
      const result = await toggleInstructorLearnerChecklistAction({
        leerlingId: selectedStudent.id,
        itemKey,
        completed,
      });

      if (!result.success) {
        setLocalStudents((current) =>
          current.map((student) =>
            student.id === selectedStudent.id
              ? { ...student, intakeChecklistKeys: previousKeys }
              : student,
          ),
        );
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  }

  function handleJourneyStatusChange(nextStatus: ManualJourneyStatus) {
    if (!selectedStudent) {
      return;
    }

    const previousStudents = localStudents;
    const journey = getDriverJourneyStateMeta(nextStatus);

    setLocalStudents((current) =>
      current.map((student) =>
        student.id === selectedStudent.id
          ? {
              ...student,
              journeyLabel: journey.label,
              journeyNextAction: journey.nextAction,
              journeyStatus: journey.status,
              journeyTone: journey.tone,
            }
          : student,
      ),
    );

    startTransition(async () => {
      const result = await updateInstructorLearnerJourneyStatusAction({
        leerlingId: selectedStudent.id,
        status: nextStatus,
      });

      if (!result.success) {
        setLocalStudents(previousStudents);
        toast.error(result.message);
        return;
      }

      const nextState = result.state ?? journey;

      setLocalStudents((current) =>
        current.map((student) =>
          student.id === selectedStudent.id
            ? {
                ...student,
                journeyLabel: nextState.label,
                journeyNextAction: nextState.nextAction,
                journeyStatus: nextState.status,
                journeyTone: nextState.tone,
              }
            : student,
        ),
      );
      toast.success(result.message);
    });
  }

  const filters = [
    { label: "Alle", value: "all" },
    { label: "Actief", value: "active" },
    { label: "Inactief", value: "inactive" },
    { label: "Uitgevallen", value: "dropped" },
  ] as const;

  return (
    <div className="space-y-4 text-white 2xl:space-y-6">
      <Panel className="p-0">
        <div className="flex flex-col gap-3 border-b border-white/10 p-3 xl:flex-row xl:items-center xl:justify-between 2xl:p-5">
          <SectionTitle title="Leerlingen overzicht" />
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center 2xl:gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Zoek leerlingen..."
                aria-label="Zoek leerlingen"
                className="h-9 w-full rounded-lg border-white/10 bg-slate-950/45 pl-9 text-sm text-white placeholder:text-slate-500 lg:w-64 2xl:h-10 2xl:w-80 2xl:text-base"
              />
            </div>
            <select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value as StudentFilter);
                setCurrentPage(1);
              }}
              className="h-9 rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none 2xl:h-10"
            >
              {filters.map((item) => (
                <option key={item.value} value={item.value}>
                  Status: {item.label}
                </option>
              ))}
            </select>
            <select
              value={packageFilter}
              onChange={(event) => {
                setPackageFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="h-9 rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none 2xl:h-10"
            >
              <option value={ALL_PACKAGES_VALUE}>Pakket: Alle</option>
              {packageOptions.map((pkg) => (
                <option key={pkg} value={pkg}>
                  {pkg}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as StudentSort)}
              className="h-9 rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none 2xl:h-10"
            >
              <option value="newest">Sorteren: Nieuwste</option>
              <option value="progress">Sorteren: Voortgang</option>
              <option value="attention">Sorteren: Aandacht</option>
              <option value="name">Sorteren: Naam</option>
            </select>
            <Button
              type="button"
              variant="outline"
              className="size-9 rounded-lg border-white/10 bg-white/7 p-0 text-white 2xl:size-10"
              onClick={() => {
                setFilter("all");
                setPackageFilter(ALL_PACKAGES_VALUE);
                setQuery("");
                setSort("newest");
                setCurrentPage(1);
              }}
              title="Filters wissen"
            >
              <Filter className="size-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-semibold tracking-[0.13em] text-slate-400 uppercase">
                <th className="px-4 py-3">Leerling</th>
                <th className="px-4 py-3">Laatst actieve les</th>
                <th className="px-4 py-3">Voltooide lessen</th>
                <th className="px-4 py-3">Voortgang</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Lid sinds</th>
                <th className="px-4 py-3 text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {visibleStudents.length ? (
                visibleStudents.map((student, index) => {
                  const statusPill = getStudentStatusPill(student);
                  const isSelected = selectedStudent?.id === student.id;
                  const studentPackage =
                    packages.find((pkg) => pkg.id === student.pakketId) ??
                    packages.find((pkg) => pkg.naam === student.pakket) ??
                    null;
                  const studentFirstLessonTemplate =
                    student.isHandmatigGekoppeld && student.gekoppeldeLessen === 0
                      ? getFirstLessonTemplateForPackage(studentPackage)
                      : null;

                  return (
                    <tr
                      key={student.id}
                      className={cn(
                        "border-b border-white/8 transition hover:bg-white/[0.035]",
                        isSelected ? "bg-blue-500/[0.04]" : "",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                              avatarTones[
                                (firstItemIndex + index) % avatarTones.length
                              ],
                            )}
                          >
                            {getInitials(student.naam)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">
                              {student.naam}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {student.email || "Geen e-mail bekend"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        <p>{getLastActiveLessonLabel(student)}</p>
                        <p className="text-xs text-slate-500">
                          {student.volgendeLes}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        {student.voltooideLessen ?? student.gekoppeldeLessen}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="h-2 w-24 overflow-hidden rounded-full bg-slate-700/70">
                            <span
                              className={cn(
                                "block h-full rounded-full",
                                getProgressFillClass(student.voortgang),
                              )}
                              style={{
                                width: `${Math.min(Math.max(student.voortgang, 0), 100)}%`,
                              }}
                            />
                          </span>
                          <span className="text-slate-200">
                            {student.voortgang}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <span
                            className={cn(
                              "inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold",
                              statusPill.className,
                            )}
                          >
                            {statusPill.label}
                          </span>
                          <span
                            className={cn(
                              "inline-flex max-w-36 rounded-md border px-2.5 py-1 text-[11px] font-semibold",
                              getJourneyPillClass(student),
                            )}
                          >
                            <span className="truncate">
                              {student.journeyLabel ?? "Onboarding"}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {formatCompactDate(student.gekoppeldSinds)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            type="button"
                            aria-label={`Bekijk ${student.naam}`}
                            title="Bekijk leerling"
                            size="icon-sm"
                            variant="outline"
                            className="size-8 rounded-md border-white/10 bg-white/7 text-slate-200"
                            onClick={() => selectStudent(student)}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <CreateManualLessonDialog
                            leerlingId={student.id}
                            leerlingNaam={student.naam}
                            studentOptions={localStudents}
                            suggestedTitle={
                              student.pakket !== "Nog geen pakket"
                                ? student.pakket
                                : "Rijles"
                            }
                            locationOptions={locationOptions}
                            availabilitySlots={availabilitySlots}
                            busyWindows={busyWindows}
                            template={studentFirstLessonTemplate}
                            durationDefaults={lessonDurationDefaults}
                            triggerIconOnly
                            triggerLabel={`Handmatig les inplannen voor ${student.naam}`}
                            triggerVariant="outline"
                            triggerClassName="size-8 rounded-md border-white/10 bg-blue-500/10 p-0 text-blue-200 hover:bg-blue-500/20"
                          />
                          <Button
                            asChild
                            aria-label={`Lessen voor ${student.naam}`}
                            title="Lessen bekijken"
                            size="icon-sm"
                            variant="outline"
                            className="size-8 rounded-md border-white/10 bg-white/7 text-slate-200"
                          >
                            <Link
                              href={`/instructeur/lessen?zoek=${encodeURIComponent(
                                student.naam,
                              )}`}
                            >
                              <CalendarDays className="size-3.5" />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            aria-label={`Aanvragen voor ${student.naam}`}
                            title="Aanvragen bekijken"
                            size="icon-sm"
                            variant="outline"
                            className="size-8 rounded-md border-white/10 bg-white/7 text-slate-200"
                          >
                            <Link href="/instructeur/aanvragen">
                              <ClipboardList className="size-3.5" />
                            </Link>
                          </Button>
                          {student.isHandmatigGekoppeld ? (
                            <StudentDetachDialog
                              leerlingId={student.id}
                              leerlingNaam={student.naam}
                              canDetach={canDetachStudent(student)}
                              triggerIconOnly
                              triggerLabel={`Ontkoppel ${student.naam}`}
                              triggerClassName="size-8 rounded-md border border-red-400/20 bg-red-500/10 p-0 text-red-200 hover:bg-red-500/20"
                            />
                          ) : null}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-label={`Meer acties voor ${student.naam}`}
                                title="Meer"
                                size="icon-sm"
                                variant="outline"
                                className="size-8 rounded-md border-white/10 bg-white/7 text-slate-200"
                              >
                                <MoreVertical className="size-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-56 border-white/10 bg-slate-950 text-slate-100"
                            >
                              <DropdownMenuLabel>Vervolgactie</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => selectStudent(student)}>
                                Werkplek openen
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/instructeur/lessen?zoek=${encodeURIComponent(
                                    student.naam,
                                  )}`}
                                >
                                  Lessen bekijken
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href="/instructeur/aanvragen">
                                  Aanvragen bekijken
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => setSelectedDate(getTodayInputValue())}>
                                Vandaag openen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <XCircle className="mx-auto size-10 text-slate-500" />
                    <p className="mt-4 font-semibold text-white">
                      Geen leerlingen gevonden
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Pas je zoekterm of filter aan, of voeg een nieuwe
                      leerling toe.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 p-3 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between 2xl:gap-4 2xl:p-5">
          <p>
            {filteredStudents.length
              ? `${firstItemIndex + 1}-${Math.min(
                  firstItemIndex + pageSize,
                  filteredStudents.length,
                )} van ${filteredStudents.length} leerlingen`
              : "0 van 0 leerlingen"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              aria-label="Vorige pagina"
              size="icon-sm"
              variant="outline"
              disabled={safePage <= 1}
              className="size-9 rounded-lg border-white/10 bg-white/7 text-white disabled:opacity-40"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {paginationPages.map((page, index) => {
              const previousPage = paginationPages[index - 1];
              const hasGap = previousPage && page - previousPage > 1;

              return (
                <span key={page} className="inline-flex items-center gap-2">
                  {hasGap ? (
                    <span className="px-1 text-slate-500">...</span>
                  ) : null}
                  <Button
                    size="icon-sm"
                    variant={safePage === page ? "default" : "outline"}
                    className={cn(
                      "size-9 rounded-lg",
                      safePage === page
                        ? "bg-blue-600 text-white hover:bg-blue-500"
                        : "border-white/10 bg-white/7 text-slate-200",
                    )}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                </span>
              );
            })}
            <Button
              aria-label="Volgende pagina"
              size="icon-sm"
              variant="outline"
              disabled={safePage >= totalPages}
              className="size-9 rounded-lg border-white/10 bg-white/7 text-white disabled:opacity-40"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              <ChevronRight className="size-4" />
            </Button>
            <label className="flex items-center gap-3">
              Toon
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="h-9 rounded-lg border border-white/10 bg-slate-950/45 px-3 text-white outline-none 2xl:h-10"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </Panel>

      {selectedStudent ? (
        <>
            <div className="grid gap-4 xl:grid-cols-[17rem_minmax(0,1fr)] 2xl:grid-cols-[20rem_minmax(0,1fr)] 2xl:gap-6 [@media(min-width:2200px)]:grid-cols-[20rem_minmax(0,1fr)_24rem]">
            <Panel data-progress-print-root className="space-y-3 2xl:space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-full bg-violet-500/28 text-lg font-semibold text-violet-100">
                    {getInitials(selectedStudent.naam)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {selectedStudent.naam}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {selectedStudent.email || "Geen e-mail"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    getStudentStatusGroup(selectedStudent) === "active"
                      ? "success"
                      : getStudentStatusGroup(selectedStudent) === "inactive"
                        ? "warning"
                        : "danger"
                  }
                >
                  {getStudentStatusPill(selectedStudent).label}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-slate-500" />
                  {selectedStudent.telefoon || "Geen telefoon"}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-slate-500" />
                  {selectedStudent.email || "Geen e-mail"}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-slate-500" />
                  {selectedStudent.pakket}
                </div>
              </div>

              <div className="rounded-lg border border-sky-300/16 bg-sky-500/8 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                      Driver journey
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {selectedStudent.journeyLabel ?? "Onboarding"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[11px] font-semibold",
                      getJourneyPillClass(selectedStudent),
                    )}
                  >
                    {selectedStudent.journeyStatus ?? "onboarding"}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-300">
                  {selectedStudent.journeyNextAction ??
                    "Maak profiel, proefles of intake compleet."}
                </p>
                <div className="mt-3 grid gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      isPending ||
                      selectedStudent.journeyStatus === "examen_gepland"
                    }
                    onClick={() => handleJourneyStatusChange("examen_gepland")}
                    className="h-9 justify-start rounded-full border-sky-300/18 bg-sky-500/10 px-3 text-[12px] font-semibold text-sky-100 hover:bg-sky-500/16 disabled:opacity-55"
                  >
                    <CalendarDays className="size-4" />
                    Markeer examen gepland
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      isPending || selectedStudent.journeyStatus === "geslaagd"
                    }
                    onClick={() => handleJourneyStatusChange("geslaagd")}
                    className="h-9 justify-start rounded-full border-emerald-300/18 bg-emerald-500/10 px-3 text-[12px] font-semibold text-emerald-100 hover:bg-emerald-500/16 disabled:opacity-55"
                  >
                    <Award className="size-4" />
                    Markeer geslaagd
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Voortgang</span>
                  <span className="font-semibold text-white">
                    {selectedStudent.voortgang}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      getProgressFillClass(selectedStudent.voortgang),
                    )}
                    style={{
                      width: `${Math.min(Math.max(selectedStudent.voortgang, 0), 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {selectedStudent.voltooideLessen ?? 0} /{" "}
                  {selectedStudent.gekoppeldeLessen || 0} lessen voltooid
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                      Pakketverbruik
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {selectedStudent.pakketPlanningGeblokkeerd
                        ? "Pakket nodig"
                        : selectedStudent.pakket}
                    </p>
                  </div>
                  <Badge
                    variant={
                      selectedStudent.pakketPlanningGeblokkeerd
                        ? "warning"
                        : "success"
                    }
                  >
                    {selectedStudent.pakketPlanningGeblokkeerd
                      ? "Geblokkeerd"
                      : "Vrijgegeven"}
                  </Badge>
                </div>
                {selectedStudent.pakketPlanningGeblokkeerd ? (
                  <p className="mt-3 text-xs leading-5 text-amber-100">
                    Vervolglessen blijven dicht tot je een pakket koppelt. Een proefles kan nog wel los in het traject staan.
                  </p>
                ) : (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <MiniStat
                      icon={CalendarDays}
                      label="Gepland"
                      value={`${selectedStudent.pakketIngeplandeLessen ?? 0}`}
                    />
                    <MiniStat
                      icon={CheckCircle2}
                      label="Gevolgd"
                      value={`${selectedStudent.pakketGevolgdeLessen ?? 0}`}
                    />
                    <MiniStat
                      icon={ShieldCheck}
                      label="Over"
                      value={
                        selectedStudent.pakketResterendeLessen == null
                          ? "Flex"
                          : `${selectedStudent.pakketResterendeLessen}`
                      }
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <StudentPackageDialog
                  leerlingId={selectedStudent.id}
                  leerlingNaam={selectedStudent.naam}
                  currentPackageName={
                    selectedStudent.pakket !== "Nog geen pakket"
                      ? selectedStudent.pakket
                      : null
                  }
                  packages={packages}
                />
                <CreateManualLessonDialog
                  leerlingId={selectedStudent.id}
                  leerlingNaam={selectedStudent.naam}
                  studentOptions={localStudents}
                  suggestedTitle={
                    selectedStudent.pakket !== "Nog geen pakket"
                      ? selectedStudent.pakket
                      : "Rijles"
                  }
                  locationOptions={locationOptions}
                  availabilitySlots={availabilitySlots}
                  busyWindows={busyWindows}
                  template={firstLessonTemplate}
                  durationDefaults={lessonDurationDefaults}
                  triggerLabel="Handmatig les inplannen"
                  triggerClassName="h-9 rounded-full bg-blue-600 text-[12px] text-white hover:bg-blue-500"
                />
                {selectedStudent.isHandmatigGekoppeld &&
                selectedStudentAccountStatus === "uitgenodigd" ? (
                  <StudentInviteResendButton leerlingId={selectedStudent.id} />
                ) : null}
                <StudentDetachDialog
                  leerlingId={selectedStudent.id}
                  leerlingNaam={selectedStudent.naam}
                  canDetach={canDetachSelectedStudent}
                  blockedMessage={
                    selectedStudent.isHandmatigGekoppeld
                      ? undefined
                      : "Deze leerling is gekoppeld via lessen of aanvragen. Om de leshistorie en administratie netjes te houden kun je alleen losse handmatige werkplekkoppelingen ontkoppelen."
                  }
                  triggerLabel="Leerling ontkoppelen"
                />
                <ProgressPrintButton className="h-9 rounded-full text-[12px]" />
              </div>

              <div className="border-t border-white/10 pt-4">
                <SectionTitle title="Account & instellingen" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Accountstatus</span>
                    <span className="text-white">
                      {selectedStudentAccountStatus === "actief"
                        ? "Actief"
                        : "Uitgenodigd"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Laatste login</span>
                    <span className="text-right text-white">
                      {selectedStudentLastSignInLabel ?? "Nog niet"}
                    </span>
                  </div>
                  {selectedStudent.onboardingNotitie ? (
                    <p className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-slate-300">
                      {selectedStudent.onboardingNotitie}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                      Zelf inplannen
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedStudent.pakketPlanningGeblokkeerd
                        ? "Eerst pakket koppelen"
                        : selectedStudent.planningVrijTeGeven
                        ? weeklyPlanningSummary.limitLabel
                        : "Nog niet beschikbaar"}
                    </p>
                  </div>
                  {selectedStudent.planningVrijTeGeven ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        handleSelfSchedulingToggle(
                          !selectedStudent.zelfInplannenToegestaan,
                        )
                      }
                      className={cn(
                        "relative h-7 w-12 rounded-full border transition",
                        selectedStudent.zelfInplannenToegestaan
                          ? "border-emerald-400/35 bg-emerald-500"
                          : "border-white/10 bg-slate-700",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 size-5 rounded-full bg-white transition",
                          selectedStudent.zelfInplannenToegestaan
                            ? "left-6"
                            : "left-1",
                        )}
                      />
                    </button>
                  ) : null}
                </div>

                {selectedStudent.planningVrijTeGeven ? (
                  <details className="mt-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                    <summary className="cursor-pointer text-sm font-medium text-slate-200 marker:hidden">
                      Beheer weeklimiet
                    </summary>
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <MiniStat
                          icon={Clock3}
                          label="Gebruikt"
                          value={weeklyPlanningSummary.usedLabel}
                        />
                        <MiniStat
                          icon={ShieldCheck}
                          label="Resterend"
                          value={weeklyPlanningSummary.remainingLabel}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {SELF_SCHEDULING_WEEKLY_LIMIT_PRESETS.map((minutes) => (
                          <Button
                            key={minutes}
                            type="button"
                            variant="outline"
                            className="h-8 rounded-full px-3 text-[11px]"
                            onClick={() =>
                              handleWeeklyBookingLimitSave(minutes, "manual")
                            }
                            disabled={isPending}
                          >
                            {formatMinutesAsHoursLabel(minutes)}
                          </Button>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 rounded-full px-3 text-[11px]"
                          onClick={() =>
                            handleWeeklyBookingLimitSave(null, "package")
                          }
                          disabled={isPending}
                        >
                          Volg pakket
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <Input
                          type="number"
                          min={30}
                          max={1440}
                          step={15}
                          value={weeklyBookingLimitInput}
                          onChange={(event) =>
                            setWeeklyBookingLimitDraft({
                              studentId: selectedStudent.id,
                              value: event.target.value,
                            })
                          }
                          placeholder="Minuten"
                          className="h-9 rounded-lg border-white/10 bg-slate-950/45 text-white"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-lg"
                          disabled={isPending}
                          onClick={() => {
                            const parsed = Number.parseInt(
                              weeklyBookingLimitInput,
                              10,
                            );
                            handleWeeklyBookingLimitSave(
                              Number.isFinite(parsed) ? parsed : null,
                              "manual",
                            );
                          }}
                        >
                          Opslaan
                        </Button>
                      </div>
                    </div>
                  </details>
                ) : null}
              </div>

              {selectedStudent.isHandmatigGekoppeld ? (
                <div className="border-t border-white/10 pt-4">
                  <SectionTitle
                    title="Intake-checklist"
                    action={
                      <span className="text-xs text-slate-400">
                        {intakeChecklistCompletedCount}/
                        {MANUAL_LEARNER_INTAKE_ITEMS.length}
                      </span>
                    }
                  />
                  <div className="space-y-2">
                    {MANUAL_LEARNER_INTAKE_ITEMS.map((item) => {
                      const completed = intakeChecklistKeys.includes(item.key);

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() =>
                            handleChecklistToggle(item.key, !completed)
                          }
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs",
                            completed
                              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                              : "border-white/10 bg-white/[0.035] text-slate-300",
                          )}
                        >
                          <CheckCircle2 className="size-4" />
                          {item.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </Panel>

            <div className="min-w-0 space-y-4">
              <StudentProgressPaperCard
                activeMarkMode={activeMarkMode}
                assessments={selectedStudentAssessments}
                instructorName={instructorName}
                isPending={isPending}
                onDateChange={setSelectedDate}
                onMark={handleAssessmentUpdate}
                onModeChange={setActiveMarkMode}
                selectedDate={selectedDate}
                selectedStudent={selectedStudent}
                visibleDates={visibleDates}
              />

              <Panel data-note-editor-root>
                <SectionTitle
                  title="Lesnotities / reflecties"
                  action={
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedProgressLesson ? "info" : "warning"}>
                        {selectedProgressLesson
                          ? `Les ${formatLessonAuditLabel(selectedProgressLesson)}`
                          : "Datumkaart"}
                      </Badge>
                      <details className="relative">
                        <summary className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-200 marker:hidden">
                          Nieuwe notitie
                        </summary>
                        <div className="absolute right-0 z-20 mt-2 w-[24rem] rounded-xl border border-white/10 bg-slate-950 p-4 shadow-2xl">
                          <StudentProgressLessonNoteEditor
                            key={`${selectedStudent.id}-${selectedDate}-${selectedProgressLesson?.id ?? "date"}-${selectedLessonNote?.updated_at ?? "new"}`}
                            leerlingId={selectedStudent.id}
                            lesId={selectedProgressLesson?.id ?? null}
                            lesdatum={selectedDate}
                            note={selectedLessonNote}
                            onSaved={handleLessonNoteSaved}
                          />
                        </div>
                      </details>
                    </div>
                  }
                />
                <div className="space-y-3">
                  {recentNotes.length ? (
                    recentNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-white/10 bg-white/[0.035] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-slate-300">
                            {formatFullDate(note.lesdatum)}
                          </p>
                          {note.lesdatum === selectedDate ? (
                            <Badge variant="info">Actieve datum</Badge>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {note.samenvatting ||
                            "Nog geen samenvatting ingevuld."}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-white/12 bg-white/[0.035] p-4 text-sm text-slate-400">
                      Zodra je coachnotities opslaat, verschijnen de laatste
                      lesreflecties hier.
                    </div>
                  )}
                </div>
              </Panel>
            </div>

            <Panel className="xl:col-start-2 2xl:col-start-2 [@media(min-width:2200px)]:col-start-auto">
              <SectionTitle title="Automatische inzichten" />
              <div className="space-y-3">
                <div className="rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(255,255,255,0.035))] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                        Trajectbewaking
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {trajectoryIntelligence.packageSignal.title}
                      </p>
                    </div>
                    <Badge variant={trajectoryIntelligence.packageSignal.badge}>
                      {trajectoryIntelligence.packageSignal.badgeLabel}
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        trajectoryIntelligence.packageSignal.badge === "danger"
                          ? "bg-red-400"
                          : trajectoryIntelligence.packageSignal.badge ===
                              "warning"
                            ? "bg-amber-400"
                            : "bg-emerald-400",
                      )}
                      style={{
                        width: `${Math.min(
                          Math.max(
                            trajectoryIntelligence.packageSignal.pressure,
                            6,
                          ),
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    {trajectoryIntelligence.packageSignal.usageLabel}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {trajectoryIntelligence.packageSignal.nextAction}
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Examengereedheid</span>
                    <span className="font-semibold text-white">
                      {examReadiness.score}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                    <span
                      className="block h-full rounded-full bg-emerald-400"
                      style={{ width: `${examReadiness.score}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-emerald-300">
                    {examReadiness.label}
                  </p>
                  {examReadiness.score >= 82 ? (
                    <div className="mt-3">
                      <CreateManualLessonDialog
                        leerlingId={selectedStudent.id}
                        leerlingNaam={selectedStudent.naam}
                        studentOptions={localStudents}
                        suggestedTitle="Praktijkexamen / proefexamen"
                        defaultLessonKind="examenrit"
                        locationOptions={locationOptions}
                        availabilitySlots={availabilitySlots}
                        busyWindows={busyWindows}
                        durationDefaults={lessonDurationDefaults}
                        triggerLabel="Examenmoment plannen"
                        triggerClassName="h-9 w-full rounded-full bg-emerald-500 text-[12px] font-semibold text-slate-950 hover:bg-emerald-400"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-300">Recent ritme</span>
                    <Badge variant={momentum.badge}>{momentum.label}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {momentum.detail}
                  </p>
                </div>

                <InsightList
                  empty="Nog geen sterke punten."
                  icon={<Award className="size-4 text-emerald-300" />}
                  title="Sterke punten"
                  items={strongestItems.slice(0, 3).map((item) => item.label)}
                />
                <InsightList
                  empty="Nog geen aandachtspunten."
                  icon={<CircleAlert className="size-4 text-amber-300" />}
                  title="Aandachtspunten"
                  items={focusItems.slice(0, 3).map((item) => item.label)}
                />
                <InsightList
                  empty="Geen weekdoelen beschikbaar."
                  icon={<Target className="size-4 text-red-300" />}
                  title="Weekdoelen"
                  items={weeklyGoals.slice(0, 3).map((goal) => goal.title)}
                />
                <InsightList
                  empty="Geen route voor komende lessen."
                  icon={<CalendarDays className="size-4 text-blue-300" />}
                  title="Komende 3 lessen"
                  items={threeLessonTrack.map(
                    (item) => `${item.lessonLabel}: ${item.title}`,
                  )}
                />

                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-violet-300" />
                    <p className="text-sm font-semibold text-white">
                      Badges / mijlpalen
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {milestoneOverview.unlocked.slice(0, 4).map((badge) => (
                      <Badge key={badge.key} variant={badge.badge}>
                        {badge.title}
                      </Badge>
                    ))}
                    {milestoneOverview.unlocked.length > 4 ? (
                      <Badge variant="default">
                        +{milestoneOverview.unlocked.length - 4}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-center gap-2">
                    <Flame className="size-4 text-amber-300" />
                    <p className="text-sm font-semibold text-white">
                      Groei-streak
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {progressStreak.detail}
                  </p>
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Panel>
              <SectionTitle title="Openstaande aanvragen" />
              <div className="space-y-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">
                        {selectedStudent.aanvraagStatus}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {selectedStudent.volgendeLes}
                      </p>
                    </div>
                    <Badge variant="warning">In behandeling</Badge>
                  </div>
                </div>
              </div>
              <Link
                href="/instructeur/aanvragen"
                className="mt-3 inline-flex text-sm text-blue-300 hover:text-blue-200"
              >
                Bekijk alle aanvragen
              </Link>
            </Panel>

            <Panel>
              <SectionTitle title="Laatste lessen" />
              <div className="space-y-2">
                {latestLessonRows.map((row) => (
                  <div
                    key={row.dateValue}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm"
                  >
                    <span className="text-slate-300">
                      {formatStudentProgressDate(row.dateValue)}
                    </span>
                    <span className="text-slate-400">{row.label}</span>
                    <span className="font-semibold text-emerald-300">
                      {row.percentage}%
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href={`/instructeur/lessen?zoek=${encodeURIComponent(
                  selectedStudent.naam,
                )}`}
                className="mt-3 inline-flex text-sm text-blue-300 hover:text-blue-200"
              >
                Bekijk alle lessen
              </Link>
            </Panel>

            <Panel>
              <SectionTitle title="Snelle acties" />
              <div className="grid gap-2">
                <CreateManualLessonDialog
                  leerlingId={selectedStudent.id}
                  leerlingNaam={selectedStudent.naam}
                  studentOptions={localStudents}
                  suggestedTitle={
                    selectedStudent.pakket !== "Nog geen pakket"
                      ? selectedStudent.pakket
                      : "Rijles"
                  }
                  locationOptions={locationOptions}
                  availabilitySlots={availabilitySlots}
                  busyWindows={busyWindows}
                  template={firstLessonTemplate}
                  durationDefaults={lessonDurationDefaults}
                  triggerLabel="Handmatig les inplannen"
                  triggerClassName="h-10 justify-start rounded-lg bg-blue-600 text-white hover:bg-blue-500"
                />
                <Button
                  asChild
                  variant="outline"
                  className="h-10 justify-start rounded-lg border-white/10 bg-white/[0.04] text-slate-200"
                >
                  <Link href="/instructeur/berichten">
                    <Mail className="size-4" />
                    Bericht sturen
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 justify-start rounded-lg border-white/10 bg-white/[0.04] text-slate-200"
                  onClick={() => {
                    setSelectedDate(getTodayInputValue());
                    document
                      .querySelector("[data-note-editor-root]")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <ClipboardList className="size-4" />
                  Notitie toevoegen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 justify-start rounded-lg border-white/10 bg-white/[0.04] text-slate-200"
                  onClick={() => {
                    const element = document.querySelector(
                      "[data-progress-matrix-root]",
                    );
                    element?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <TrendingUp className="size-4" />
                  Voortgang bekijken
                </Button>
              </div>
            </Panel>
          </div>
        </>
      ) : (
        <Panel className="border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold text-white">
            Nog geen leerling geselecteerd
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Zodra hier leerlingen staan, open je direct een digitale
            instructiekaart.
          </p>
        </Panel>
      )}
    </div>
  );
}

function InsightList({
  empty,
  icon,
  items,
  title,
}: {
  empty: string;
  icon: ReactNode;
  items: string[];
  title: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      <div className="mt-2 space-y-1 text-xs leading-5 text-slate-400">
        {items.length ? (
          items.map((item) => <p key={item}>{item}</p>)
        ) : (
          <p>{empty}</p>
        )}
      </div>
    </div>
  );
}
