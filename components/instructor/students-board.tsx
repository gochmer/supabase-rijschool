"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Eye,
  Filter,
  Flame,
  GraduationCap,
  MoreVertical,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { toggleInstructorLearnerChecklistAction } from "@/lib/actions/instructor-learners";
import {
  clearStudentProgressAssessmentAction,
  saveStudentProgressAssessmentAction,
} from "@/lib/actions/student-progress";
import {
  updateStudentSelfSchedulingAccessAction,
  updateStudentWeeklyBookingLimitAction,
} from "@/lib/actions/student-scheduling";
import type { InstructorLessonDurationDefaults } from "@/lib/lesson-durations";
import { MANUAL_LEARNER_INTAKE_ITEMS } from "@/lib/manual-learner-intake";
import { getFirstLessonTemplateForPackage } from "@/lib/package-first-lesson-template";
import type {
  InstructorStudentProgressRow,
  LocationOption,
  Pakket,
  StudentProgressAssessment,
  StudentProgressLessonNote,
} from "@/lib/types";
import {
  SELF_SCHEDULING_WEEKLY_LIMIT_PRESETS,
  formatMinutesAsHoursLabel,
} from "@/lib/self-scheduling-limits";
import {
  getStudentAutomaticNotifications,
  getStudentExamReadiness,
  formatStudentProgressDate,
  getStudentProgressFocusItems,
  getStudentProgressItem,
  getStudentMilestoneOverview,
  getStudentProgressMomentum,
  getStudentProgressSectionSummaries,
  getStudentProgressStreak,
  getStudentProgressStatusMeta,
  getStudentProgressStrongestItems,
  getStudentProgressSummary,
  getStudentThreeLessonTrack,
  getStudentWeeklyGoals,
  STUDENT_PROGRESS_SECTIONS,
  STUDENT_PROGRESS_STATUS_OPTIONS,
  type StudentProgressSection,
} from "@/lib/student-progress";
import { cn } from "@/lib/utils";
import { CreateManualLessonDialog } from "@/components/instructor/create-manual-lesson-dialog";
import {
  canDetachStudent,
  getAverageStudentProgress,
  getRecentStudentNotes,
  getSelectedLessonNote,
  getStudentAttentionCount,
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
  getProgressBand,
  getStatusStyles,
  getTodayInputValue,
  StudentSectionRows,
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
type StudentStatusGroup = Exclude<StudentFilter, "all">;

const pageSizeOptions = [6, 10, 20] as const;

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

export function StudentsBoard({
  students,
  assessments,
  notes,
  locationOptions = [],
  packages = [],
  lessonDurationDefaults,
  initialStudentId = null,
}: {
  students: InstructorStudentProgressRow[];
  assessments: StudentProgressAssessment[];
  notes: StudentProgressLessonNote[];
  locationOptions?: LocationOption[];
  packages?: Pakket[];
  lessonDurationDefaults: InstructorLessonDurationDefaults;
  initialStudentId?: string | null;
}) {
  const initialStudent =
    students.find((student) => student.id === initialStudentId) ??
    students[0] ??
    null;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StudentFilter>("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState(
    initialStudent?.id ?? "",
  );
  const [selectedDate, setSelectedDate] = useState(getTodayInputValue());
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

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return localStudents.filter((student) => {
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

      return matchesQuery && matchesStatus;
    });
  }, [filter, localStudents, query]);

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

  const summary = useMemo(
    () => getStudentProgressSummary(selectedStudentAssessments),
    [selectedStudentAssessments],
  );
  const sectionSummaries = useMemo(
    () => getStudentProgressSectionSummaries(selectedStudentAssessments),
    [selectedStudentAssessments],
  );
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
  const automaticNotifications = useMemo(
    () =>
      getStudentAutomaticNotifications(
        selectedStudentAssessments,
        selectedStudentNotes,
      ),
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

  const visibleDates = useMemo(
    () =>
      getAssessmentDatesForStudent(
        selectedStudent?.id,
        localAssessments,
        selectedDate,
      ),
    [localAssessments, selectedDate, selectedStudent?.id],
  );

  const averageProgress = useMemo(
    () => getAverageStudentProgress(localStudents),
    [localStudents],
  );

  const attentionStudents = useMemo(
    () => getStudentAttentionCount(localStudents),
    [localStudents],
  );
  const selectedLessonNote = useMemo(() => {
    return getSelectedLessonNote({
      notes: selectedStudentNotes,
      selectedDate,
      selectedStudent,
    });
  }, [selectedDate, selectedStudent, selectedStudentNotes]);
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
  const selectedStudentWeeklyLimitLabel = weeklyPlanningSummary.limitLabel;
  const selectedStudentWeeklyLimitSource = weeklyPlanningSummary.limitSource;
  const selectedStudentWeeklyLimitSourceLabel =
    weeklyPlanningSummary.limitSourceLabel;
  const selectedStudentPackageWeeklyLimitLabel =
    weeklyPlanningSummary.packageLimitLabel;
  const selectedStudentManualWeeklyLimitLabel =
    weeklyPlanningSummary.manualLimitLabel;
  const selectedStudentWeeklyUsedLabel = weeklyPlanningSummary.usedLabel;
  const selectedStudentWeeklyRemainingLabel =
    weeklyPlanningSummary.remainingLabel;
  const weeklyBookingLimitInput = getWeeklyBookingLimitInput({
    draft: weeklyBookingLimitDraft,
    selectedStudent,
  });
  const canDetachSelectedStudent = canDetachStudent(selectedStudent);

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
              vaardigheidKey,
              beoordelingsDatum: selectedDate,
            })
          : await saveStudentProgressAssessmentAction({
              leerlingId: selectedStudent.id,
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
            note.lesdatum === selectedDate
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

  const tabs: Array<{ label: string; value: StudentFilter }> = [
    { label: "Alle leerlingen", value: "all" },
    { label: "Actief", value: "active" },
    { label: "Inactief", value: "inactive" },
    { label: "Uitgevallen", value: "dropped" },
  ];
  const filterLabels: Record<StudentFilter, string> = {
    active: "Actieve leerlingen",
    all: "Alle leerlingen",
    dropped: "Uitgevallen",
    inactive: "Inactieve leerlingen",
  };

  return (
    <div className="space-y-4 text-white">
      <section className="overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(15,23,42,0.34))] p-4 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.95)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-5">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setFilter(tab.value);
                  setCurrentPage(1);
                }}
                className={cn(
                  "border-b-2 px-2 pb-3 text-base transition",
                  filter === tab.value
                    ? "border-blue-400 text-white"
                    : "border-transparent text-slate-400 hover:text-white",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Zoek leerlingen..."
                aria-label="Zoek leerlingen"
                className="h-11 w-full rounded-lg border-white/10 bg-slate-950/34 pl-10 text-white placeholder:text-slate-500 sm:w-72"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 rounded-lg border-white/10 bg-white/7 px-4 text-white hover:bg-white/12"
                >
                  <Filter className="size-5" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-60 border-white/10 bg-slate-950 text-slate-100"
              >
                <DropdownMenuLabel>Status leerling</DropdownMenuLabel>
                {tabs.map((tab) => (
                  <DropdownMenuItem
                    key={tab.value}
                    onSelect={() => {
                      setFilter(tab.value);
                      setCurrentPage(1);
                    }}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        filter === tab.value ? "bg-blue-400" : "bg-white/20",
                      )}
                    />
                    {filterLabels[tab.value]}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setFilter("all");
                    setQuery("");
                    setCurrentPage(1);
                  }}
                >
                  Filters wissen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[1080px]">
            <div className="grid grid-cols-[260px_170px_150px_180px_120px_150px_110px] rounded-lg border border-white/10 bg-white/5 px-2 py-4 text-base text-slate-200">
              <span>Leerling</span>
              <span>Laatst actieve les</span>
              <span>Voltooide lessen</span>
              <span>Voortgang</span>
              <span>Status</span>
              <span>Lid sinds</span>
              <span>Acties</span>
            </div>

            {visibleStudents.length ? (
              visibleStudents.map((student, index) => {
                const statusPill = getStudentStatusPill(student);
                const isSelected = selectedStudent?.id === student.id;

                return (
                  <div
                    key={student.id}
                    className={cn(
                      "grid grid-cols-[260px_170px_150px_180px_120px_150px_110px] items-center border-b border-white/10 px-2 py-4 text-sm last:border-b-0",
                      isSelected ? "bg-blue-500/[0.03]" : "",
                    )}
                  >
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
                        <p className="truncate text-sm text-slate-400">
                          {student.email || "Geen e-mail bekend"}
                        </p>
                      </div>
                    </div>

                    <p className="text-slate-100">
                      {getLastActiveLessonLabel(student)}
                    </p>
                    <p className="text-slate-100">
                      {student.voltooideLessen ?? student.gekoppeldeLessen}
                    </p>
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
                    <span
                      className={cn(
                        "inline-flex w-fit rounded-full border px-3 py-1 text-sm font-medium",
                        statusPill.className,
                      )}
                    >
                      {statusPill.label}
                    </span>
                    <p className="text-slate-100">
                      {formatCompactDate(student.gekoppeldSinds)}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        aria-label={`Bekijk ${student.naam}`}
                        title="Bekijken"
                        size="icon-sm"
                        variant="outline"
                        className="size-9 rounded-lg border-white/10 bg-white/7 text-slate-200 hover:bg-white/12 hover:text-white"
                        onClick={() => {
                          setSelectedStudentId(student.id);
                          setWeeklyBookingLimitDraft({
                            studentId: student.id,
                            value:
                              student.zelfInplannenHandmatigeOverrideActief &&
                              student.zelfInplannenHandmatigeLimietMinutenPerWeek !=
                                null
                                ? String(
                                    student.zelfInplannenHandmatigeLimietMinutenPerWeek,
                                  )
                                : "",
                          });
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-label={`Meer acties voor ${student.naam}`}
                            title="Meer"
                            size="icon-sm"
                            variant="outline"
                            className="size-9 rounded-lg border-white/10 bg-white/7 text-slate-200 hover:bg-white/12 hover:text-white"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 border-white/10 bg-slate-950 text-slate-100"
                        >
                          <DropdownMenuLabel>Vervolgactie</DropdownMenuLabel>
                          <DropdownMenuItem
                            onSelect={() => {
                              setSelectedStudentId(student.id);
                              setWeeklyBookingLimitDraft({
                                studentId: student.id,
                                value:
                                  student.zelfInplannenHandmatigeOverrideActief &&
                                  student.zelfInplannenHandmatigeLimietMinutenPerWeek !=
                                    null
                                    ? String(
                                        student.zelfInplannenHandmatigeLimietMinutenPerWeek,
                                      )
                                    : "",
                              });
                            }}
                          >
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/12 text-center">
                <XCircle className="size-10 text-slate-500" />
                <p className="mt-4 font-semibold text-white">
                  Geen leerlingen gevonden
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Pas je zoekterm of filter aan, of voeg een nieuwe leerling toe
                  aan je werkplek.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 border-t border-white/10 pt-4 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
          <p>
            {filteredStudents.length
              ? `${firstItemIndex + 1}-${Math.min(
                  firstItemIndex + pageSize,
                  filteredStudents.length,
                )} van ${filteredStudents.length} leerlingen`
              : "0 van 0 leerlingen"}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
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
            </div>

            <label className="flex items-center gap-3">
              Toon
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="h-10 rounded-lg border border-white/10 bg-slate-950/34 px-3 text-white outline-none"
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
      </section>

      <div className="grid gap-4">
        <aside className="hidden">
          <div className="rounded-[1.35rem] border border-white/70 bg-white/86 p-3 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.6)]">
            <div className="space-y-2.5">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase dark:text-sky-300">
                  Leerlingregie
                </p>
                <h2 className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                  Leerlingenoverzicht
                </h2>
                <p className="mt-1 text-[12px] leading-5 text-slate-600 dark:text-slate-300">
                  Zoek, kies en werk direct verder in dezelfde kaart.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    icon: Search,
                    label: "Leerlingen",
                    value: `${localStudents.length}`,
                  },
                  {
                    icon: Target,
                    label: "Gem. voortgang",
                    value: `${averageProgress}%`,
                  },
                  {
                    icon: CircleAlert,
                    label: "Extra aandacht",
                    value: `${attentionStudents}`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1rem] border border-slate-200/80 bg-slate-50/90 p-2.5 dark:border-white/10 dark:bg-white/5"
                  >
                    <item.icon className="size-3.5 text-slate-500 dark:text-slate-300" />
                    <p className="mt-1.5 text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-2">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Zoek op leerling, mail of pakket"
                  className="h-10 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                />
                <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_11rem_auto] xl:items-center">
                  <select
                    value={filter}
                    onChange={(event) =>
                      setFilter(event.target.value as StudentFilter)
                    }
                    className="native-select h-10 rounded-xl px-3 text-sm"
                  >
                    <option value="all">Alle leerlingen</option>
                    <option value="active">Actief</option>
                    <option value="inactive">Inactief</option>
                    <option value="dropped">Uitgevallen</option>
                  </select>
                  <div className="rounded-[0.95rem] border border-slate-200/80 bg-slate-50/90 px-3 py-2 text-[12px] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 xl:text-center">
                    {filteredStudents.length} zichtbaar
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-white/70 bg-white/90 p-2.5 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.6)]">
            <div className="space-y-2 xl:max-h-[calc(100vh-21rem)] xl:overflow-y-auto xl:pr-1">
              {filteredStudents.length ? (
                filteredStudents.map((student) => {
                  const band = getProgressBand(student.voortgang);
                  const isSelected = selectedStudent?.id === student.id;

                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setWeeklyBookingLimitDraft({
                          studentId: student.id,
                          value:
                            student.zelfInplannenHandmatigeOverrideActief &&
                            student.zelfInplannenHandmatigeLimietMinutenPerWeek !=
                              null
                              ? String(
                                  student.zelfInplannenHandmatigeLimietMinutenPerWeek,
                                )
                              : "",
                        });
                      }}
                      className={cn(
                        "w-full rounded-[1.05rem] border p-2.5 text-left transition-all",
                        isSelected
                          ? "border-sky-300/70 bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(59,130,246,0.14),rgba(15,23,42,0.04))] shadow-[0_18px_44px_-28px_rgba(14,165,233,0.34)] dark:border-sky-400/30 dark:bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(59,130,246,0.14),rgba(15,23,42,0.32))]"
                          : "border-slate-200/80 bg-slate-50/88 hover:border-slate-300/80 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-semibold text-slate-950 dark:text-white">
                                {student.naam}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                                {student.pakket}
                              </p>
                            </div>
                            <Badge variant={band.badge}>
                              {student.voortgang}%
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-[0.9rem] border border-slate-200/80 bg-white/90 px-2.5 py-2 dark:border-white/10 dark:bg-white/6">
                          <p className="text-[9px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                            Pakket
                          </p>
                          <p className="mt-1 truncate text-[11px] font-medium text-slate-700 dark:text-slate-200">
                            {student.pakket}
                          </p>
                        </div>
                        <div className="rounded-[0.9rem] border border-slate-200/80 bg-white/90 px-2.5 py-2 dark:border-white/10 dark:bg-white/6">
                          <p className="text-[9px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                            Volgende les
                          </p>
                          <p className="mt-1 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                            {student.volgendeLes}
                          </p>
                        </div>
                        <div className="rounded-[0.9rem] border border-slate-200/80 bg-white/90 px-2.5 py-2 dark:border-white/10 dark:bg-white/6">
                          <p className="text-[9px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                            Status
                          </p>
                          <p className="mt-1 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                            {band.label}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Geen leerlingen in dit filter
                  </p>
                  <p className="mt-1.5 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                    Pas je zoekterm aan of wacht tot er nieuwe trajecten aan
                    deze instructeur gekoppeld zijn.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          {selectedStudent ? (
            <>
              <div
                data-progress-print-root
                className="rounded-[1.7rem] border border-white/70 bg-white/88 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] print:shadow-none dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]"
              >
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase dark:text-sky-300">
                          Digitale instructiekaart
                        </p>
                        <Badge
                          variant={
                            getProgressBand(selectedStudent.voortgang).badge
                          }
                        >
                          {getProgressBand(selectedStudent.voortgang).label}
                        </Badge>
                      </div>
                      <div>
                        <h2 className="text-[1.65rem] font-semibold tracking-tight text-slate-950 dark:text-white">
                          {selectedStudent.naam}
                        </h2>
                        <p className="mt-1 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                          {selectedStudent.pakket} -{" "}
                          {selectedStudent.email || "Geen e-mail"} •{" "}
                          {selectedStudent.telefoon || "Geen telefoon"}
                        </p>
                        {selectedStudent.isHandmatigGekoppeld ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="info">Handmatig gekoppeld</Badge>
                            <Badge
                              variant={
                                selectedStudentAccountStatus === "actief"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {selectedStudentAccountStatus === "actief"
                                ? "Account actief"
                                : "Uitnodiging open"}
                            </Badge>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {selectedStudent.isHandmatigGekoppeld ||
                    selectedStudent.onboardingNotitie ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {selectedStudent.isHandmatigGekoppeld ? (
                          <div className="rounded-[1.15rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                                  Accountstatus
                                </p>
                                <p className="mt-1 text-[13px] font-semibold text-slate-900 dark:text-white">
                                  {selectedStudentAccountStatus === "actief"
                                    ? "Leerling heeft toegang tot het account"
                                    : "Leerling moet uitnodiging nog openen"}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  selectedStudentAccountStatus === "actief"
                                    ? "success"
                                    : "warning"
                                }
                              >
                                {selectedStudentAccountStatus === "actief"
                                  ? "Actief"
                                  : "Wacht op activatie"}
                              </Badge>
                            </div>
                            <p className="mt-2 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                              {selectedStudentLastSignInLabel
                                ? `Laatste login: ${selectedStudentLastSignInLabel}`
                                : "Er is nog geen login geregistreerd voor dit account."}
                            </p>
                          </div>
                        ) : null}
                        {selectedStudent.onboardingNotitie ? (
                          <div className="rounded-[1.15rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                              Startnotitie
                            </p>
                            <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                              {selectedStudent.onboardingNotitie}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {selectedStudent.isHandmatigGekoppeld ? (
                      <div className="rounded-[1.15rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                              Intake-checklist
                            </p>
                            <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                              {intakeChecklistCompletedCount}/
                              {MANUAL_LEARNER_INTAKE_ITEMS.length} onderdelen
                              klaar
                            </p>
                          </div>
                          <Badge
                            variant={
                              intakeChecklistCompletedCount ===
                              MANUAL_LEARNER_INTAKE_ITEMS.length
                                ? "success"
                                : intakeChecklistCompletedCount >= 3
                                  ? "warning"
                                  : "info"
                            }
                          >
                            {Math.round(
                              (intakeChecklistCompletedCount /
                                MANUAL_LEARNER_INTAKE_ITEMS.length) *
                                100,
                            )}
                            %
                          </Badge>
                        </div>

                        <div className="mt-3 space-y-2">
                          {MANUAL_LEARNER_INTAKE_ITEMS.map((item) => {
                            const completed = intakeChecklistKeys.includes(
                              item.key,
                            );

                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() =>
                                  handleChecklistToggle(item.key, !completed)
                                }
                                className={cn(
                                  "flex w-full items-start gap-3 rounded-[1rem] border px-3 py-2.5 text-left transition-all",
                                  completed
                                    ? "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/18 dark:bg-emerald-500/10"
                                    : "border-slate-200/80 bg-white/80 hover:border-slate-300/80 dark:border-white/10 dark:bg-white/4 dark:hover:bg-white/7",
                                )}
                              >
                                <div
                                  className={cn(
                                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                                    completed
                                      ? "border-emerald-500 bg-emerald-500 text-white"
                                      : "border-slate-300 bg-white text-transparent dark:border-slate-500 dark:bg-slate-900",
                                  )}
                                >
                                  <CheckCircle2 className="size-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                    {item.title}
                                  </p>
                                  <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                                    {item.detail}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {firstLessonTemplate ? (
                      <div className="rounded-[1.15rem] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(59,130,246,0.08),rgba(14,165,233,0.08),rgba(255,255,255,0.92))] p-3 dark:border-sky-400/18 dark:bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(59,130,246,0.14),rgba(15,23,42,0.74))]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                              Eerste lesopzet
                            </p>
                            <h3 className="mt-1 text-[15px] font-semibold text-slate-950 dark:text-white">
                              {firstLessonTemplate.title}
                            </h3>
                          </div>
                          <Badge variant="info">
                            {firstLessonTemplate.durationMinutes} min
                          </Badge>
                        </div>
                        <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                          {firstLessonTemplate.summary}
                        </p>
                        <ul className="mt-3 space-y-1.5 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                          {firstLessonTemplate.bullets.map((bullet) => (
                            <li key={bullet}>- {bullet}</li>
                          ))}
                        </ul>
                        <p className="mt-3 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                          Als je nu op{" "}
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            Les inplannen
                          </span>{" "}
                          klikt, nemen titel en duur deze opzet automatisch
                          over.
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-start">
                      <div className="flex flex-wrap justify-start gap-2">
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
                          suggestedTitle={
                            selectedStudent.pakket !== "Nog geen pakket"
                              ? selectedStudent.pakket
                              : "Rijles"
                          }
                          locationOptions={locationOptions}
                          template={firstLessonTemplate}
                          durationDefaults={lessonDurationDefaults}
                        />
                        {selectedStudent.isHandmatigGekoppeld ? (
                          <StudentDetachDialog
                            leerlingId={selectedStudent.id}
                            leerlingNaam={selectedStudent.naam}
                            canDetach={canDetachSelectedStudent}
                          />
                        ) : null}
                        {selectedStudent.isHandmatigGekoppeld &&
                        selectedStudentAccountStatus === "uitgenodigd" ? (
                          <StudentInviteResendButton
                            leerlingId={selectedStudent.id}
                          />
                        ) : null}
                        <ProgressPrintButton className="h-9 rounded-full text-[12px]" />
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          icon: Target,
                          label: "Voortgang",
                          value: `${selectedStudent.voortgang}%`,
                          context:
                            summary.beoordeeldCount > 0
                              ? `${summary.beoordeeldCount} onderdelen beoordeeld`
                              : "Nog geen onderdelen gemarkeerd",
                        },
                        {
                          icon: CheckCircle2,
                          label: "Zelfstandig",
                          value: `${summary.zelfstandigCount}`,
                          context: "Onderdelen die zelfstandig lukken",
                        },
                        {
                          icon: CircleAlert,
                          label: "Aandacht",
                          value: `${summary.aandachtCount}`,
                          context: "Onderdelen met uitleg of herhaling",
                        },
                        {
                          icon: CalendarDays,
                          label: "Volgende les",
                          value: selectedStudent.volgendeLes,
                          context: `${selectedStudent.gekoppeldeLessen} gekoppelde lesmomenten`,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-[1.15rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5"
                        >
                          <item.icon className="size-4 text-slate-500 dark:text-slate-300" />
                          <p className="mt-2 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                            {item.label}
                          </p>
                          <p className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                            {item.value}
                          </p>
                          <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                            {item.context}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-[1.15rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <ShieldCheck className="size-4 text-slate-500 dark:text-slate-300" />
                            <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                              Zelf inplannen
                            </p>
                            <Badge
                              variant={
                                selectedStudent.zelfInplannenToegestaan
                                  ? "success"
                                  : selectedStudent.planningVrijTeGeven
                                    ? "warning"
                                    : "info"
                              }
                            >
                              {selectedStudent.zelfInplannenToegestaan
                                ? "Vrijgegeven"
                                : selectedStudent.planningVrijTeGeven
                                  ? "Nog uit"
                                  : "Nog niet beschikbaar"}
                            </Badge>
                          </div>
                          <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                            {selectedStudent.zelfInplannenToegestaan
                              ? "Deze leerling mag nu jouw agenda zien en zelf een passend moment kiezen."
                              : selectedStudent.planningVrijTeGeven
                                ? selectedStudent.isHandmatigGekoppeld
                                  ? "Deze leerling is handmatig aan jouw werkplek gekoppeld. Jij bepaalt hier of zelf inplannen direct wordt vrijgegeven."
                                  : "Deze leerling zit al in een actief traject. Jij bepaalt hier of zelf inplannen wordt vrijgegeven."
                                : "De agenda blijft afgeschermd tot je deze leerling actief koppelt of een traject start."}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.planningVrijTeGeven ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 rounded-full text-[12px]"
                              onClick={() =>
                                handleSelfSchedulingToggle(
                                  !selectedStudent.zelfInplannenToegestaan,
                                )
                              }
                              disabled={isPending}
                            >
                              {selectedStudent.zelfInplannenToegestaan
                                ? "Zet zelf inplannen uit"
                                : "Sta zelf inplannen toe"}
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      {selectedStudent.planningVrijTeGeven ? (
                        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                          <div className="grid gap-2 md:grid-cols-2">
                            {[
                              {
                                label: "Actieve limiet",
                                value: selectedStudentWeeklyLimitLabel,
                                context:
                                  "Dit is de ruimte die nu echt geldt voor zelfstandig boeken",
                              },
                              {
                                label: "Bron",
                                value: selectedStudentWeeklyLimitSourceLabel,
                                context:
                                  selectedStudentWeeklyLimitSource === "manual"
                                    ? "Jij hebt deze leerling handmatig anders ingesteld dan het pakket"
                                    : selectedStudentWeeklyLimitSource ===
                                        "package"
                                      ? "Deze leerling volgt nu automatisch de pakketstandaard"
                                      : "Er staat nu geen weeklimiet actief op deze leerling",
                              },
                              {
                                label: "Pakketstandaard",
                                value: selectedStudentPackageWeeklyLimitLabel,
                                context:
                                  selectedStudent.zelfInplannenPakketLimietMinutenPerWeek ==
                                  null
                                    ? "Dit pakket heeft geen eigen weeklimiet en laat plannen onbeperkt open"
                                    : "Zodra je geen override gebruikt, volgt de leerling weer deze pakketruimte",
                              },
                              {
                                label: "Deze week gebruikt",
                                value: selectedStudentWeeklyUsedLabel,
                                context:
                                  "Lessen en actieve boekingen in deze week",
                              },
                              {
                                label: "Nog over",
                                value: selectedStudentWeeklyRemainingLabel,
                                context:
                                  selectedStudent.zelfInplannenLimietMinutenPerWeek ==
                                  null
                                    ? "Geen limiet ingesteld"
                                    : "Ruimte die de leerling nog zelf mag boeken",
                              },
                            ].map((item) => (
                              <div
                                key={item.label}
                                className="rounded-[1rem] border border-slate-200/80 bg-white/90 p-3 dark:border-white/10 dark:bg-white/6"
                              >
                                <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                  {item.label}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                                  {item.value}
                                </p>
                                <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                                  {item.context}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-[1rem] border border-slate-200/80 bg-white/90 p-3 dark:border-white/10 dark:bg-white/6">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                  Zelf plannen per week
                                </p>
                                <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                                  Laat deze leerling het pakket volgen of zet
                                  bewust een handmatige override voor meer of
                                  minder weekruimte.
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="info">
                                  {selectedStudent.pakket !== "Nog geen pakket"
                                    ? selectedStudent.pakket
                                    : "Nog geen pakket"}
                                </Badge>
                                <Badge
                                  variant={
                                    selectedStudentWeeklyLimitSource ===
                                    "manual"
                                      ? "warning"
                                      : selectedStudentWeeklyLimitSource ===
                                          "package"
                                        ? "success"
                                        : "default"
                                  }
                                >
                                  {selectedStudentWeeklyLimitSourceLabel}
                                </Badge>
                              </div>
                            </div>

                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                              <div className="rounded-[0.9rem] border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                                <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                                  Pakketstandaard
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                                  {selectedStudentPackageWeeklyLimitLabel}
                                </p>
                                <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                                  Dit volgt de leerling automatisch zodra je
                                  geen losse override actief hebt.
                                </p>
                              </div>
                              <div className="rounded-[0.9rem] border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                                <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                                  Handmatige override
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                                  {selectedStudentManualWeeklyLimitLabel}
                                </p>
                                <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                                  Gebruik dit alleen als deze leerling bewust
                                  meer, minder of onbeperkt weekruimte nodig
                                  heeft.
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {SELF_SCHEDULING_WEEKLY_LIMIT_PRESETS.map(
                                (minutes) => (
                                  <Button
                                    key={minutes}
                                    type="button"
                                    variant={
                                      selectedStudent.zelfInplannenHandmatigeOverrideActief &&
                                      Number(weeklyBookingLimitInput) ===
                                        minutes
                                        ? "default"
                                        : "outline"
                                    }
                                    className="h-8 rounded-full px-3 text-[11px]"
                                    onClick={() =>
                                      handleWeeklyBookingLimitSave(
                                        minutes,
                                        "manual",
                                      )
                                    }
                                    disabled={isPending}
                                  >
                                    {formatMinutesAsHoursLabel(minutes)}
                                  </Button>
                                ),
                              )}
                              <Button
                                type="button"
                                variant={
                                  selectedStudent.zelfInplannenHandmatigeOverrideActief &&
                                  !weeklyBookingLimitInput.trim()
                                    ? "default"
                                    : "outline"
                                }
                                className="h-8 rounded-full px-3 text-[11px]"
                                onClick={() =>
                                  handleWeeklyBookingLimitSave(null, "manual")
                                }
                                disabled={isPending}
                              >
                                Handmatig onbeperkt
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 rounded-full px-3 text-[11px]"
                                onClick={() =>
                                  handleWeeklyBookingLimitSave(null, "package")
                                }
                                disabled={isPending}
                              >
                                {selectedStudent.zelfInplannenPakketLimietMinutenPerWeek !=
                                null
                                  ? "Volg pakketlimiet"
                                  : "Gebruik standaard zonder limiet"}
                              </Button>
                            </div>

                            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                                  Handmatige override in minuten
                                </label>
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
                                  placeholder="Bijvoorbeeld 120"
                                  className="h-10 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 rounded-full px-4 text-[12px]"
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
                                disabled={isPending}
                              >
                                Override opslaan
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-10 rounded-full px-4 text-[12px]"
                                onClick={() =>
                                  handleWeeklyBookingLimitSave(null, "package")
                                }
                                disabled={isPending}
                              >
                                Terug naar pakket
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {sectionSummaries.map((section) => (
                  <div
                    key={section.key}
                    className="rounded-[1.3rem] border border-white/70 bg-white/88 p-4 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.28)] print:shadow-none dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]"
                  >
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                      {section.shortLabel}
                    </p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <p className="text-2xl font-semibold text-slate-950 dark:text-white">
                        {section.percentage}%
                      </p>
                      <Badge
                        variant={
                          section.percentage >= 75
                            ? "success"
                            : section.percentage >= 40
                              ? "warning"
                              : "danger"
                        }
                      >
                        {section.masteredCount}/{section.totalCount}
                      </Badge>
                    </div>
                    <p className="mt-2 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                      {section.attentionCount > 0
                        ? `${section.attentionCount} onderdeel${section.attentionCount === 1 ? "" : "en"} vragen nog extra aandacht.`
                        : "Dit toetsblok oogt stabiel en groeit richting zelfstandigheid."}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <div className="rounded-[1.3rem] border border-white/70 bg-white/88 p-4 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.28)] print:shadow-none dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-slate-500 dark:text-slate-300" />
                      <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                        Richting proefexamen
                      </h3>
                    </div>
                    <Badge variant={examReadiness.badge}>
                      {examReadiness.label}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                        Gereedheid
                      </p>
                      <p className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">
                        {examReadiness.score}%
                      </p>
                    </div>
                    <p className="max-w-[10rem] text-right text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                      {examReadiness.nextMilestone}
                    </p>
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                    {examReadiness.summary}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {examReadiness.checks.map((check) => (
                      <div
                        key={check.label}
                        className="rounded-[1rem] border border-slate-200/80 bg-slate-50/90 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                            {check.label}
                          </p>
                          <Badge variant={check.badge}>{check.value}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.3rem] border border-white/70 bg-white/88 p-4 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.28)] print:shadow-none dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-4 text-slate-500 dark:text-slate-300" />
                      <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                        Recent ritme
                      </h3>
                    </div>
                    <Badge variant={momentum.badge}>{momentum.label}</Badge>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
                    {momentum.score}%
                  </p>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                    {momentum.detail}
                  </p>
                  <div className="mt-3 rounded-[1rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                      Coachsignaal
                    </p>
                    <p className="mt-1 text-[13px] leading-6 text-slate-700 dark:text-slate-200">
                      {momentum.suggestion}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.3rem] border border-white/70 bg-white/88 p-4 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.28)] print:shadow-none dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-slate-500 dark:text-slate-300" />
                    <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                      Wat al sterk staat
                    </h3>
                  </div>
                  <div className="mt-3 space-y-2">
                    {strongestItems.length ? (
                      strongestItems.map((item) => {
                        const meta = item.latest?.status
                          ? getStudentProgressStatusMeta(item.latest.status)
                          : null;

                        return (
                          <div
                            key={item.key}
                            className="rounded-[1rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                  {item.sectionLabel}
                                </p>
                                <p className="mt-1 text-[13px] font-medium text-slate-900 dark:text-white">
                                  {item.label}
                                </p>
                              </div>
                              {meta ? (
                                <Badge variant="success">
                                  {meta.shortLabel}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-[1rem] border border-dashed border-slate-200 bg-slate-50/85 p-3 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                          Zodra onderdelen echt zelfstandig staan, verschijnen
                          hier automatisch de sterkste punten van deze leerling.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <div className="rounded-[1.3rem] border border-white/70 bg-white/88 p-4 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.28)] print:shadow-none dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
                  <div className="flex items-center gap-2">
                    <Award className="size-4 text-slate-500 dark:text-slate-300" />
                    <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                      Badges en mijlpalen
                    </h3>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                    {milestoneOverview.headline}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {milestoneOverview.unlocked.length ? (
                      milestoneOverview.unlocked.map((badge) => (
                        <Badge
                          key={badge.key}
                          variant={badge.badge}
                          className={cn(
                            "rounded-full px-3 py-1.5",
                            badge.newlyUnlocked
                              ? "milestone-badge-fresh ring-2 ring-emerald-300/70 dark:ring-emerald-400/30"
                              : "",
                          )}
                        >
                          {badge.newlyUnlocked
                            ? `Nieuw: ${badge.title}`
                            : badge.title}
                        </Badge>
                      ))
                    ) : (
                      <div className="rounded-[1rem] border border-dashed border-slate-200 bg-slate-50/85 px-3 py-2 text-[12px] leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                        De eerste badges verschijnen automatisch zodra de kaart
                        sterker gevuld raakt.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.3rem] border border-white/70 bg-white/88 p-4 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.28)] print:shadow-none dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-slate-500 dark:text-slate-300" />
                      <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                        Volgende badge
                      </h3>
                    </div>
                    {milestoneOverview.next ? (
                      <Badge variant={milestoneOverview.next.badge}>
                        {milestoneOverview.next.badgeLabel}
                      </Badge>
                    ) : (
                      <Badge variant="success">Compleet</Badge>
                    )}
                  </div>
                  {milestoneOverview.next ? (
                    <>
                      <p className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
                        {milestoneOverview.next.title}
                      </p>
                      <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                        {milestoneOverview.next.detail}
                      </p>
                      <div className="mt-3 rounded-[1rem] border border-slate-200/80 bg-slate-50/90 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                          Richting
                        </p>
                        <p className="mt-1 text-[13px] font-medium text-slate-900 dark:text-white">
                          {milestoneOverview.next.progressLabel}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                      Alle huidige badges zijn vrijgespeeld. De kaart staat
                      sterk en laat een volwassen groeibeeld zien.
                    </p>
                  )}
                </div>

                <div className="rounded-[1.3rem] border border-white/70 bg-white/88 p-4 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.28)] print:shadow-none dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Flame className="size-4 text-slate-500 dark:text-slate-300" />
                      <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                        Groei-streak
                      </h3>
                    </div>
                    <Badge variant={progressStreak.badge}>
                      {progressStreak.count}x
                    </Badge>
                  </div>
                  <p className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
                    {progressStreak.label}
                  </p>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                    {progressStreak.detail}
                  </p>
                </div>
              </div>

              {milestoneOverview.recentUnlocked.length ? (
                <div className="milestone-celebration rounded-[1.45rem] border border-emerald-200/80 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(14,165,233,0.08),rgba(255,255,255,0.82))] p-4 shadow-[0_20px_54px_-40px_rgba(16,185,129,0.32)] print:shadow-none dark:border-emerald-400/20 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(14,165,233,0.12),rgba(15,23,42,0.84))]">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 size-5 text-emerald-600 dark:text-emerald-300" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-700 uppercase dark:text-emerald-300">
                        Nieuw behaald
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                        {milestoneOverview.recentUnlocked.length} nieuwe{" "}
                        {milestoneOverview.recentUnlocked.length === 1
                          ? "badge"
                          : "badges"}{" "}
                        na de laatste les
                      </h3>
                      <p className="mt-1.5 text-[13px] leading-6 text-slate-700 dark:text-slate-200">
                        Mooie stap. De meest recente les heeft direct een nieuwe
                        mijlpaal opgeleverd.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {milestoneOverview.recentUnlocked.map((badge) => (
                          <Badge
                            key={badge.key}
                            variant={badge.badge}
                            className="milestone-badge-fresh rounded-full px-3 py-1.5 ring-2 ring-emerald-300/70 dark:ring-emerald-400/30"
                          >
                            Nieuw: {badge.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_20rem]">
                <div
                  data-progress-print-root
                  className="rounded-[1.7rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] print:shadow-none dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]"
                >
                  <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 print:border-slate-200 dark:border-white/10">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                          Instructiekaart per lesmoment
                        </h3>
                        <p className="mt-1.5 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                          Kies eerst een lesdatum en klik daarna in de
                          geselecteerde kolom om onderdelen te markeren. Zo houd
                          je voortgang en examenklaarheid veel strakker bij.
                        </p>
                      </div>

                      <div className="w-full print:hidden sm:w-[12.5rem]">
                        <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                          Lesdatum
                        </label>
                        <Input
                          type="date"
                          value={selectedDate}
                          onChange={(event) =>
                            setSelectedDate(event.target.value)
                          }
                          className="h-10 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 print:hidden">
                      {STUDENT_PROGRESS_STATUS_OPTIONS.map((option) => {
                        const styles = getStatusStyles(option.value);
                        const active = activeMarkMode === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setActiveMarkMode(option.value)}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all",
                              styles.card,
                              active
                                ? "ring-2 ring-slate-900/12 dark:ring-white/18"
                                : "opacity-80 hover:opacity-100",
                            )}
                          >
                            {option.shortLabel} - {option.label}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setActiveMarkMode("clear")}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all",
                          activeMarkMode === "clear"
                            ? "border-slate-400 bg-slate-900 text-white dark:border-white/30 dark:bg-white dark:text-slate-950"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
                        )}
                      >
                        Wis markering
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2 text-left">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-10 min-w-[17rem] rounded-l-[1rem] bg-white/96 px-3 py-2 text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:bg-[rgba(15,23,42,0.96)] dark:text-slate-400">
                            Onderdeel
                          </th>
                          {visibleDates.map((dateValue) => {
                            const isSelectedColumn = dateValue === selectedDate;

                            return (
                              <th
                                key={dateValue}
                                className={cn(
                                  "min-w-[5.2rem] px-1.5 py-2 text-center",
                                  isSelectedColumn
                                    ? "text-slate-950 dark:text-white"
                                    : "text-slate-500 dark:text-slate-400",
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => setSelectedDate(dateValue)}
                                  className={cn(
                                    "w-full rounded-[0.95rem] border px-2 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase transition-all",
                                    isSelectedColumn
                                      ? "border-sky-300/70 bg-sky-100 text-sky-800 dark:border-sky-400/28 dark:bg-sky-500/18 dark:text-sky-100"
                                      : "border-slate-200/80 bg-slate-50/90 text-slate-600 hover:border-slate-300/80 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
                                  )}
                                >
                                  {formatStudentProgressDate(dateValue)}
                                </button>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {STUDENT_PROGRESS_SECTIONS.map((section) => (
                          <StudentSectionRows
                            key={section.key}
                            section={section}
                            assessments={selectedStudentAssessments}
                            visibleDates={visibleDates}
                            selectedDate={selectedDate}
                            isPending={isPending}
                            onMark={(vaardigheidKey) =>
                              handleAssessmentUpdate(vaardigheidKey, section)
                            }
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.55rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
                    <div className="flex items-center gap-2">
                      <CircleAlert className="size-4 text-slate-500 dark:text-slate-300" />
                      <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                        Automatische meldingen
                      </h3>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                      Automatische waarschuwingen en kansen die direct uit de
                      kaart komen, zodat je sneller weet waar nu actie nodig is.
                    </p>
                    <div className="mt-3 space-y-2">
                      {automaticNotifications.map((signal) => (
                        <div
                          key={signal.title}
                          className="rounded-[1.05rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[13px] font-medium text-slate-900 dark:text-white">
                                {signal.title}
                              </p>
                              <p className="mt-1 text-[12px] leading-6 text-slate-600 dark:text-slate-300">
                                {signal.detail}
                              </p>
                            </div>
                            <Badge variant={signal.badge}>
                              {signal.badgeLabel}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.55rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
                    <div className="flex items-center gap-2">
                      <Target className="size-4 text-slate-500 dark:text-slate-300" />
                      <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                        Weekdoelen
                      </h3>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                      Concrete doelen voor deze week, zodat je de groei van de
                      leerling gericht en meetbaar kunt sturen.
                    </p>
                    <div className="mt-3 space-y-2">
                      {weeklyGoals.map((goal) => (
                        <div
                          key={goal.title}
                          className="rounded-[1.05rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[13px] font-medium text-slate-900 dark:text-white">
                                {goal.title}
                              </p>
                              <p className="mt-1 text-[12px] leading-6 text-slate-600 dark:text-slate-300">
                                {goal.detail}
                              </p>
                            </div>
                            <Badge variant={goal.badge}>
                              {goal.badgeLabel}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.55rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="size-4 text-slate-500 dark:text-slate-300" />
                      <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                        Komende 3 lessen
                      </h3>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                      Een slimme route per lesmoment, zodat je niet alleen losse
                      aandachtspunten ziet maar ook meteen een logische opbouw
                      kunt aanhouden.
                    </p>
                    <div className="mt-3 space-y-2">
                      {threeLessonTrack.map((item) => (
                        <div
                          key={`${item.lessonLabel}-${item.title}`}
                          className="rounded-[1.05rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                {item.lessonLabel}
                              </p>
                              <p className="text-[13px] font-medium text-slate-900 dark:text-white">
                                {item.title}
                              </p>
                              <p className="mt-1 text-[12px] leading-6 text-slate-600 dark:text-slate-300">
                                {item.detail}
                              </p>
                            </div>
                            <Badge variant={item.badge}>
                              {item.badgeLabel}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.55rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="size-4 text-slate-500 dark:text-slate-300" />
                      <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                        Focus voor de volgende les
                      </h3>
                    </div>
                    <div className="mt-3 space-y-2">
                      {focusItems.length ? (
                        focusItems.map((item) => {
                          const meta = item.latest?.status
                            ? getStudentProgressStatusMeta(item.latest.status)
                            : null;
                          const styles = getStatusStyles(item.latest?.status);

                          return (
                            <div
                              key={item.key}
                              className="rounded-[1.05rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                    {item.sectionLabel}
                                  </p>
                                  <p className="mt-1 text-[13px] font-medium text-slate-900 dark:text-white">
                                    {item.label}
                                  </p>
                                </div>
                                {meta ? (
                                  <span
                                    className={cn(
                                      "rounded-full border px-2 py-1 text-[11px] font-semibold",
                                      styles.card,
                                    )}
                                  >
                                    {meta.shortLabel}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-[1.05rem] border border-dashed border-slate-200 bg-slate-50/85 p-3 dark:border-white/10 dark:bg-white/5">
                          <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                            Nog geen focusonderdelen. Zet de eerste markeringen
                            in de kaart en deze sidebar toont automatisch waar
                            extra aandacht nodig is.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.55rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] print:hidden dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
                    <StudentProgressLessonNoteEditor
                      key={`${selectedStudent.id}-${selectedDate}-${selectedLessonNote?.updated_at ?? "new"}`}
                      leerlingId={selectedStudent.id}
                      lesdatum={selectedDate}
                      note={selectedLessonNote}
                      onSaved={handleLessonNoteSaved}
                    />
                  </div>

                  <div className="rounded-[1.55rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="size-4 text-slate-500 dark:text-slate-300" />
                      <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                        Lesmoment {formatFullDate(selectedDate)}
                      </h3>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                      De geselecteerde kolom is nu actief. Kies bovenaan de
                      juiste markering en klik in de rij van het onderdeel dat
                      je wilt vastleggen.
                    </p>

                    <div className="mt-3 space-y-2">
                      {STUDENT_PROGRESS_STATUS_OPTIONS.map((option) => {
                        const styles = getStatusStyles(option.value);

                        return (
                          <div
                            key={option.value}
                            className="flex items-center gap-2 rounded-[1rem] border border-slate-200/80 bg-slate-50/90 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                          >
                            <span
                              className={cn(
                                "inline-flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                                styles.card,
                              )}
                            >
                              {option.shortLabel}
                            </span>
                            <div>
                              <p className="text-[12px] font-semibold text-slate-900 dark:text-white">
                                {option.label}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {option.value === "zelfstandig"
                                  ? "Gebruik dit als de leerling het zelfstandig beheerst."
                                  : option.value === "begeleid"
                                    ? "Gebruik dit als sturing nog nodig is."
                                    : option.value === "uitleg"
                                      ? "Gebruik dit bij eerste uitleg of demonstratie."
                                      : "Gebruik dit als het onderdeel opnieuw moet worden opgepakt."}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 rounded-[1rem] border border-dashed border-slate-200 bg-slate-50/85 p-3 text-[12px] leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      Wissel naar een oudere datum boven de kaart als je een
                      eerder lesmoment wilt corrigeren. De geselecteerde datum
                      blijft altijd de enige bewerkbare kolom.
                    </div>

                    {selectedLessonNote ? (
                      <div className="mt-3 space-y-2 rounded-[1rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5">
                        <div>
                          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                            Lesreflectie
                          </p>
                          <p className="mt-1 text-[12px] leading-6 text-slate-700 dark:text-slate-200">
                            {selectedLessonNote.samenvatting ||
                              "Nog geen samenvatting ingevuld."}
                          </p>
                        </div>
                        {selectedLessonNote.sterk_punt ? (
                          <div>
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                              Sterk punt
                            </p>
                            <p className="mt-1 text-[12px] leading-6 text-slate-700 dark:text-slate-200">
                              {selectedLessonNote.sterk_punt}
                            </p>
                          </div>
                        ) : null}
                        {selectedLessonNote.focus_volgende_les ? (
                          <div>
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                              Volgende focus
                            </p>
                            <p className="mt-1 text-[12px] leading-6 text-slate-700 dark:text-slate-200">
                              {selectedLessonNote.focus_volgende_les}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-[1.55rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)] print:hidden dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]">
                    <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                      Recente lesreflecties
                    </h3>
                    <div className="mt-3 space-y-2">
                      {recentNotes.length ? (
                        recentNotes.map((note) => (
                          <div
                            key={note.id}
                            className="rounded-[1rem] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                {formatFullDate(note.lesdatum)}
                              </p>
                              {note.lesdatum === selectedDate ? (
                                <Badge variant="info">Actieve datum</Badge>
                              ) : null}
                            </div>
                            <p className="mt-2 text-[13px] leading-6 text-slate-700 dark:text-slate-200">
                              {note.samenvatting ||
                                "Nog geen samenvatting ingevuld."}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[1rem] border border-dashed border-slate-200 bg-slate-50/85 p-3 dark:border-white/10 dark:bg-white/5">
                          <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                            Zodra je coachnotities opslaat, verschijnen de
                            laatste lesreflecties hier automatisch.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-[1.7rem] border border-dashed border-slate-200 bg-white/88 p-8 text-center shadow-[0_24px_80px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                Nog geen leerling geselecteerd
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                Zodra hier leerlingen staan, open ik voor de geselecteerde
                leerling direct een digitale instructiekaart om prestaties per
                lesmoment bij te houden.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
