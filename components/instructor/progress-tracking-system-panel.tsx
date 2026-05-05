import type React from "react";

import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  MessageSquareText,
  Route,
  Target,
} from "lucide-react";

import {
  getStudentExamReadiness,
  getStudentProgressFocusItems,
  STUDENT_PROGRESS_ITEM_COUNT,
  STUDENT_PROGRESS_STATUS_WEIGHTS,
} from "@/lib/student-progress";
import type {
  InstructorStudentProgressRow,
  StudentProgressAssessment,
  StudentProgressLessonNote,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type ProgressTrackingSystemPanelProps = {
  assessments: StudentProgressAssessment[];
  notes: StudentProgressLessonNote[];
  students: InstructorStudentProgressRow[];
};

type LessonScoreRow = {
  date: string;
  label: string;
  score: number;
  studentName: string;
};

type MetricTone = "amber" | "blue" | "emerald" | "violet";

type GuidanceTone = "amber" | "emerald" | "sky";

const statusPriority = {
  zelfstandig: 4,
  begeleid: 3,
  uitleg: 2,
  herhaling: 1,
} as const;

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(`${dateValue}T12:00:00`));
}

function getLatestAssessments(assessments: StudentProgressAssessment[]) {
  const latest = new Map<string, StudentProgressAssessment>();

  [...assessments]
    .sort((left, right) => {
      if (left.beoordelings_datum !== right.beoordelings_datum) {
        return right.beoordelings_datum.localeCompare(left.beoordelings_datum);
      }

      return right.created_at.localeCompare(left.created_at);
    })
    .forEach((assessment) => {
      const key = `${assessment.leerling_id}-${assessment.vaardigheid_key}`;

      if (!latest.has(key)) {
        latest.set(key, assessment);
      }
    });

  return Array.from(latest.values());
}

function getLessonScoreRows({
  assessments,
  students,
}: {
  assessments: StudentProgressAssessment[];
  students: InstructorStudentProgressRow[];
}) {
  const studentNameById = new Map(
    students.map((student) => [student.id, student.naam]),
  );
  const grouped = new Map<string, StudentProgressAssessment[]>();

  for (const assessment of assessments) {
    const key = `${assessment.leerling_id}::${assessment.beoordelings_datum}`;
    const current = grouped.get(key) ?? [];
    current.push(assessment);
    grouped.set(key, current);
  }

  return Array.from(grouped.entries())
    .map<LessonScoreRow>(([key, rows]) => {
      const [studentId, date] = key.split("::");
      const score = Math.round(
        rows.reduce(
          (total, row) => total + STUDENT_PROGRESS_STATUS_WEIGHTS[row.status],
          0,
        ) / rows.length,
      );
      const mostImportantStatus = [...rows].sort(
        (left, right) =>
          statusPriority[right.status] - statusPriority[left.status],
      )[0]?.status;

      return {
        date: rows[0]?.beoordelings_datum ?? date,
        label:
          mostImportantStatus === "zelfstandig"
            ? "Zelfstandig"
            : mostImportantStatus === "begeleid"
              ? "Begeleid"
              : mostImportantStatus === "herhaling"
                ? "Herhaling"
                : "Uitleg",
        score,
        studentName: studentNameById.get(studentId) ?? "Leerling",
      };
    })
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5);
}

function getStudentGroups<T extends { leerling_id: string }>(rows: T[]) {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const current = grouped.get(row.leerling_id) ?? [];
    current.push(row);
    grouped.set(row.leerling_id, current);
  }

  return grouped;
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.045] px-2.5 py-1 text-[11px] text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  progress,
  tone,
  value,
}: {
  detail: string;
  icon: typeof Activity;
  label: string;
  progress?: number;
  tone: MetricTone;
  value: string;
}) {
  const toneClass = {
    amber:
      "border-amber-400/20 bg-amber-400/10 text-amber-200 ring-amber-300/10",
    blue: "border-sky-400/20 bg-sky-400/10 text-sky-200 ring-sky-300/10",
    emerald:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-200 ring-emerald-300/10",
    violet:
      "border-violet-400/20 bg-violet-400/10 text-violet-200 ring-violet-300/10",
  }[tone];

  const progressClass = {
    amber: "bg-amber-300",
    blue: "bg-sky-300",
    emerald: "bg-emerald-300",
    violet: "bg-violet-300",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.035] p-3 shadow-[0_18px_58px_-50px_rgba(0,0,0,0.95)] transition-colors hover:border-white/15 hover:bg-white/[0.055]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg border ring-4",
            toneClass,
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-bold tracking-[0.18em] text-slate-500 uppercase">
              {label}
            </p>
            <p className="text-xl font-semibold leading-none tracking-tight text-white">
              {value}
            </p>
          </div>
          <p className="mt-1.5 min-h-10 text-xs leading-5 text-slate-400">
            {detail}
          </p>
          {typeof progress === "number" ? (
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className={cn("h-full rounded-full", progressClass)}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.035] p-3.5 shadow-[0_18px_58px_-52px_rgba(0,0,0,0.95)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {children}
    </div>
  );
}

function PanelHeading({
  icon: Icon,
  subtitle,
  title,
  tone,
}: {
  icon: typeof Activity;
  subtitle?: string;
  title: string;
  tone: "emerald" | "sky" | "violet";
}) {
  const toneClass = {
    emerald: "border-emerald-400/15 bg-emerald-400/10 text-emerald-200",
    sky: "border-sky-400/15 bg-sky-400/10 text-sky-200",
    violet: "border-violet-400/15 bg-violet-400/10 text-violet-200",
  }[tone];

  return (
    <div className="flex items-start gap-2.5">
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
          toneClass,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-xs leading-5 text-slate-500">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function GuidanceRow({
  label,
  tone,
  value,
}: {
  label: string;
  tone: GuidanceTone;
  value: string;
}) {
  const toneClass = {
    amber: "text-amber-200",
    emerald: "text-emerald-200",
    sky: "text-sky-200",
  }[tone];

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-black/15 px-3 py-2.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={cn("text-sm font-semibold", toneClass)}>{value}</span>
    </div>
  );
}

export function ProgressTrackingSystemPanel({
  assessments,
  notes,
  students,
}: ProgressTrackingSystemPanelProps) {
  const latestAssessments = getLatestAssessments(assessments);
  const assessedStudentIds = new Set(
    latestAssessments.map((assessment) => assessment.leerling_id),
  );
  const possibleSkillCount = students.length * STUDENT_PROGRESS_ITEM_COUNT;
  const skillCoverage = possibleSkillCount
    ? Math.round((latestAssessments.length / possibleSkillCount) * 100)
    : 0;
  const studentAssessments = getStudentGroups(assessments);
  const studentNotes = getStudentGroups(notes);
  const lessonScores = getLessonScoreRows({ assessments, students });
  const averageLessonScore = lessonScores.length
    ? Math.round(
        lessonScores.reduce((total, row) => total + row.score, 0) /
          lessonScores.length,
      )
    : 0;
  const examSignals = students.map((student) => {
    const readiness = getStudentExamReadiness(
      studentAssessments.get(student.id) ?? [],
      studentNotes.get(student.id) ?? [],
    );

    return {
      readiness,
      student,
    };
  });
  const examReadyCount = examSignals.filter(
    (signal) => signal.readiness.score >= 82,
  ).length;
  const examAlmostCount = examSignals.filter(
    (signal) => signal.readiness.score >= 62 && signal.readiness.score < 82,
  ).length;
  const attentionCount = latestAssessments.filter((assessment) =>
    ["uitleg", "herhaling"].includes(assessment.status),
  ).length;
  const withoutAssessmentCount = Math.max(
    students.length - assessedStudentIds.size,
    0,
  );
  const lowProgressStudents = students
    .filter((student) => student.voortgang < 45)
    .slice(0, 3);
  const firstFocusStudent = students
    .map((student) => {
      const focusItems = getStudentProgressFocusItems(
        studentAssessments.get(student.id) ?? [],
        2,
      );

      return {
        focusItems,
        student,
      };
    })
    .find((item) => item.focusItems.length > 0);
  const lastReviewedAt =
    latestAssessments
      .map((assessment) => assessment.beoordelings_datum)
      .sort((left, right) => right.localeCompare(left))[0] ?? null;
  const zelfstandigCount = latestAssessments.filter(
    (assessment) => assessment.status === "zelfstandig",
  ).length;
  const nogOpenCount = Math.max(
    possibleSkillCount - latestAssessments.length,
    0,
  );
  const hasAttention = attentionCount > 0 || withoutAssessmentCount > 0;
  const systemHealthLabel = hasAttention
    ? "Aandacht nodig"
    : nogOpenCount > 0
      ? "Rustig monitoren"
      : "Volledig bijgewerkt";
  const systemHealthCopy = hasAttention
    ? `${attentionCount} skillstatussen vragen begeleiding en ${withoutAssessmentCount} leerling${withoutAssessmentCount === 1 ? "" : "en"} mist nog een meting.`
    : nogOpenCount > 0
      ? "De voortgangsketen is actief. Werk open onderdelen bij na de volgende les."
      : "Alle onderdelen zijn actueel vastgelegd en klaar voor opvolging.";

  return (
    <section className="overflow-hidden rounded-xl border border-sky-300/12 bg-[linear-gradient(145deg,rgba(8,18,32,0.98),rgba(3,9,18,0.99))] p-3.5 text-white shadow-[0_22px_76px_-58px_rgba(0,0,0,0.98)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold tracking-[0.28em] text-sky-300 uppercase">
              Progress tracking system
            </p>
            <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
              Live dossierlaag
            </span>
          </div>
          <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-white">
            Een vaste laag voor skills, feedback en examengereedheid.
          </h2>
          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-400">
            Elke markering voedt dezelfde keten: skillstatus, les-score,
            coachfeedback, voortgang richting examen en de focus voor de
            volgende les.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 xl:max-w-[30rem] xl:justify-end">
          {[
            ["Skills", `${latestAssessments.length}/${possibleSkillCount}`],
            ["Les-scores", `${averageLessonScore}%`],
            ["Feedback", `${notes.length}`],
          ].map(([label, value]) => (
            <HeaderStat key={label} label={label} value={value} />
          ))}
        </div>
      </div>

      <div
        className={cn(
          "mt-3 grid gap-3 rounded-xl border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center",
          hasAttention
            ? "border-amber-400/16 bg-amber-400/[0.07]"
            : "border-emerald-400/16 bg-emerald-400/[0.07]",
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border",
              hasAttention
                ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
                : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
            )}
          >
            {hasAttention ? (
              <Target className="size-4" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              {systemHealthLabel}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-slate-400">
              {systemHealthCopy}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center lg:min-w-[20rem]">
          <div className="rounded-lg border border-white/[0.08] bg-black/15 px-3 py-2">
            <p className="text-[10px] text-slate-500">Dekking</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {skillCoverage}%
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-black/15 px-3 py-2">
            <p className="text-[10px] text-slate-500">Zelfstandig</p>
            <p className="mt-0.5 text-sm font-semibold text-emerald-200">
              {zelfstandigCount}
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-black/15 px-3 py-2">
            <p className="text-[10px] text-slate-500">Open</p>
            <p className="mt-0.5 text-sm font-semibold text-amber-200">
              {nogOpenCount}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ClipboardCheck}
          label="Skilldekking"
          value={`${skillCoverage}%`}
          detail={`${latestAssessments.length} actuele skillstatussen vastgelegd.`}
          progress={skillCoverage}
          tone="blue"
        />
        <MetricCard
          icon={MessageSquareText}
          label="Coachfeedback"
          value={`${notes.length}`}
          detail="Lesnotities met sterk punt, samenvatting en volgende focus."
          tone="violet"
        />
        <MetricCard
          icon={GraduationCap}
          label="Examengereed"
          value={`${examReadyCount}`}
          detail={`${examAlmostCount} leerling${examAlmostCount === 1 ? "" : "en"} zit${examAlmostCount === 1 ? "" : "ten"} in de bijna-klaar zone.`}
          progress={
            students.length ? (examReadyCount / students.length) * 100 : 0
          }
          tone="emerald"
        />
        <MetricCard
          icon={Target}
          label="Aandacht"
          value={`${attentionCount}`}
          detail={`${withoutAssessmentCount} leerling${withoutAssessmentCount === 1 ? "" : "en"} heeft nog geen skillmeting.`}
          tone="amber"
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <SectionCard className="xl:min-h-[14rem]">
          <PanelHeading
            icon={Activity}
            subtitle="Laatste vijf berekende lesmomenten."
            title="Recente les-scores"
            tone="sky"
          />
          <div className="mt-3 space-y-2">
            {lessonScores.length ? (
              lessonScores.map((row) => (
                <div
                  key={`${row.studentName}-${row.date}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-lg border border-white/[0.08] bg-black/15 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium text-slate-200">
                        {row.studentName}
                      </span>
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[10px] text-slate-400">
                        {row.label}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full rounded-full bg-emerald-300"
                        style={{ width: `${Math.min(100, row.score)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {formatDate(row.date)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-200">
                      {row.score}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-white/10 bg-black/10 p-3 text-sm leading-6 text-slate-400">
                Zodra je per les skills markeert, ontstaan hier automatisch
                les-scores.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard className="xl:min-h-[14rem]">
          <PanelHeading
            icon={BrainCircuit}
            subtitle="Compacte auditlaag voor instructeurs."
            title="Datagedreven begeleiding"
            tone="violet"
          />
          <div className="mt-3 space-y-2">
            <GuidanceRow
              label="Laatste meting"
              tone="sky"
              value={lastReviewedAt ? formatDate(lastReviewedAt) : "Geen datum"}
            />
            <GuidanceRow
              label="Zelfstandig"
              tone="emerald"
              value={`${zelfstandigCount} onderdelen`}
            />
            <GuidanceRow
              label="Nog open"
              tone="amber"
              value={`${nogOpenCount} onderdelen`}
            />
          </div>
        </SectionCard>

        <SectionCard className="xl:min-h-[14rem]">
          <PanelHeading
            icon={Route}
            subtitle="De eerstvolgende inhoudelijke actie."
            title="Volgende stuuractie"
            tone="emerald"
          />
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            {firstFocusStudent ? (
              <div className="rounded-lg border border-emerald-400/15 bg-emerald-400/[0.07] p-3">
                <p className="font-semibold text-white">
                  {firstFocusStudent.student.naam}
                </p>
                <p className="mt-1 text-slate-400">
                  Focus op {firstFocusStudent.focusItems[0]?.label}.
                </p>
              </div>
            ) : lowProgressStudents.length ? (
              <div className="rounded-lg border border-amber-400/15 bg-amber-400/[0.07] p-3">
                <p className="font-semibold text-white">
                  {lowProgressStudents[0]?.naam}
                </p>
                <p className="mt-1 text-slate-400">
                  Lage voortgang, plan een gerichte herhalingsles.
                </p>
              </div>
            ) : (
              <div className="flex gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.07] p-3 text-emerald-200">
                <CheckCircle2 className="mt-1 size-4 shrink-0" />
                <p>Geen acute voortgangsblokkade zichtbaar.</p>
              </div>
            )}

            {lowProgressStudents.length > 1 ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold tracking-[0.18em] text-slate-500 uppercase">
                  Extra aandacht
                </p>
                {lowProgressStudents.slice(1).map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-black/15 px-3 py-2 text-xs"
                  >
                    <span className="truncate text-slate-300">
                      {student.naam}
                    </span>
                    <span className="font-semibold text-amber-200">
                      {Math.round(student.voortgang)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>
    </section>
  );
}
