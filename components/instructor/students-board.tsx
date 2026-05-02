"use client";

import { useMemo, useState, useTransition } from "react";
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
import {
  CreateManualLessonDialog,
  type LessonPlanningAvailabilitySlot,
  type LessonPlanningBusyWindow,
} from "@/components/instructor/create-manual-lesson-dialog";
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
        "rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(15,23,42,0.38))] p-4 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.95)]",
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
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[11px] font-semibold tracking-[0.16em] text-slate-300 uppercase">
        {title}
      </h2>
      {action}
    </div>
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
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
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
  locationOptions = [],
  availabilitySlots = [],
  busyWindows = [],
  packages = [],
  lessonDurationDefaults,
  initialStudentId = null,
}: {
  students: InstructorStudentProgressRow[];
  assessments: StudentProgressAssessment[];
  notes: StudentProgressLessonNote[];
  locationOptions?: LocationOption[];
  availabilitySlots?: LessonPlanningAvailabilitySlot[];
  busyWindows?: LessonPlanningBusyWindow[];
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
  const [packageFilter, setPackageFilter] = useState(ALL_PACKAGES_VALUE);
  const [sort, setSort] = useState<StudentSort>("newest");
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

  const summary = useMemo(
    () => getStudentProgressSummary(selectedStudentAssessments),
    [selectedStudentAssessments],
  );
  const sectionSummaries = useMemo(
    () => getStudentProgressSectionSummaries(selectedStudentAssessments),
    [selectedStudentAssessments],
  );
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

  const filters = [
    { label: "Alle", value: "all" },
    { label: "Actief", value: "active" },
    { label: "Inactief", value: "inactive" },
    { label: "Uitgevallen", value: "dropped" },
  ] as const;

  return (
    <div className="space-y-4 text-white">
      <Panel className="p-0">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 xl:flex-row xl:items-center xl:justify-between">
          <SectionTitle title="Leerlingen overzicht" />
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
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
                className="h-10 w-full rounded-lg border-white/10 bg-slate-950/45 pl-9 text-white placeholder:text-slate-500 lg:w-72"
              />
            </div>
            <select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value as StudentFilter);
                setCurrentPage(1);
              }}
              className="h-10 rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none"
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
              className="h-10 rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none"
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
              className="h-10 rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none"
            >
              <option value="newest">Sorteren: Nieuwste</option>
              <option value="progress">Sorteren: Voortgang</option>
              <option value="attention">Sorteren: Aandacht</option>
              <option value="name">Sorteren: Naam</option>
            </select>
            <Button
              type="button"
              variant="outline"
              className="size-10 rounded-lg border-white/10 bg-white/7 p-0 text-white"
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
                        <span
                          className={cn(
                            "inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold",
                            statusPill.className,
                          )}
                        >
                          {statusPill.label}
                        </span>
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

        <div className="flex flex-col gap-4 border-t border-white/10 p-4 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
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
                className="h-10 rounded-lg border border-white/10 bg-slate-950/45 px-3 text-white outline-none"
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
          <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
            <Panel data-progress-print-root className="space-y-4">
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
                      {selectedStudent.planningVrijTeGeven
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

            <div className="space-y-4">
              <Panel data-progress-matrix-root data-progress-print-root>
                <SectionTitle
                  title="Voortgang per lesdatum"
                  action={
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="h-9 w-36 rounded-lg border-white/10 bg-slate-950/45 text-white"
                    />
                  }
                />
                <div className="mb-4 flex flex-wrap gap-2">
                  {STUDENT_PROGRESS_STATUS_OPTIONS.map((option) => {
                    const styles = getStatusStyles(option.value);
                    const active = activeMarkMode === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setActiveMarkMode(option.value)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                          styles.card,
                          active
                            ? "ring-2 ring-white/20"
                            : "opacity-80 hover:opacity-100",
                        )}
                      >
                        {option.shortLabel} {option.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setActiveMarkMode("clear")}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[12px] font-medium",
                      activeMarkMode === "clear"
                        ? "border-white/30 bg-white text-slate-950"
                        : "border-white/10 bg-white/5 text-slate-300",
                    )}
                  >
                    Wissen
                  </button>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  {visibleDates.map((dateValue) => (
                    <button
                      key={dateValue}
                      type="button"
                      onClick={() => setSelectedDate(dateValue)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-semibold",
                        dateValue === selectedDate
                          ? "border-blue-400/35 bg-blue-500/20 text-blue-100"
                          : "border-white/10 bg-white/[0.04] text-slate-300",
                      )}
                    >
                      {formatStudentProgressDate(dateValue)}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2 text-left">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 min-w-[15rem] rounded-l-lg bg-slate-950/95 px-3 py-2 text-[10px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                          Onderdeel
                        </th>
                        {visibleDates.map((dateValue) => (
                          <th
                            key={dateValue}
                            className="min-w-[5.2rem] px-1.5 py-2 text-center text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase"
                          >
                            {formatStudentProgressDate(dateValue)}
                          </th>
                        ))}
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
              </Panel>

              <Panel data-note-editor-root>
                <SectionTitle
                  title="Lesnotities / reflecties"
                  action={
                    <details className="relative">
                      <summary className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-200 marker:hidden">
                        Nieuwe notitie
                      </summary>
                      <div className="absolute right-0 z-20 mt-2 w-[24rem] rounded-xl border border-white/10 bg-slate-950 p-4 shadow-2xl">
                        <StudentProgressLessonNoteEditor
                          key={`${selectedStudent.id}-${selectedDate}-${selectedLessonNote?.updated_at ?? "new"}`}
                          leerlingId={selectedStudent.id}
                          lesdatum={selectedDate}
                          note={selectedLessonNote}
                          onSaved={handleLessonNoteSaved}
                        />
                      </div>
                    </details>
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

            <Panel>
              <SectionTitle title="Automatische inzichten" />
              <div className="space-y-3">
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
