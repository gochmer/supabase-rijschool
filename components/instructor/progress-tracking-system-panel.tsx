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

function MetricCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: typeof Activity;
  label: string;
  tone: "amber" | "blue" | "emerald" | "violet";
  value: string;
}) {
  const toneClass = {
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    blue: "border-blue-400/25 bg-blue-500/10 text-blue-200",
    emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  }[tone];

  return (
    <div className="rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(15,23,42,0.34))] p-4 shadow-[0_24px_70px_-52px_rgba(0,0,0,0.95)]">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg border",
            toneClass,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">{detail}</p>
        </div>
      </div>
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
    (signal) =>
      signal.readiness.score >= 62 && signal.readiness.score < 82,
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

  return (
    <section className="rounded-xl border border-sky-300/14 bg-[radial-gradient(circle_at_12%_0%,rgba(14,165,233,0.14),transparent_34%),linear-gradient(145deg,rgba(9,20,35,0.96),rgba(5,13,24,0.99))] p-4 text-white shadow-[0_28px_90px_-58px_rgba(0,0,0,0.95)] 2xl:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.24em] text-sky-200 uppercase">
            Progress tracking system
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white 2xl:text-2xl">
            Een vaste laag voor skills, lesfeedback en examengereedheid.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Elke markering voedt dezelfde keten: skillstatus, les-score,
            coachfeedback, voortgang richting examen en de focus voor de
            volgende les.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[28rem]">
          {[
            ["Skills", `${latestAssessments.length}/${possibleSkillCount}`],
            ["Les-scores", `${averageLessonScore}%`],
            ["Feedback", `${notes.length}`],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2"
            >
              <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                {label}
              </p>
              <p className="mt-1 text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ClipboardCheck}
          label="Skilldekking"
          value={`${skillCoverage}%`}
          detail={`${latestAssessments.length} actuele skillstatussen vastgelegd.`}
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

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-sky-300" />
            <h3 className="text-sm font-semibold text-white">
              Recente les-scores
            </h3>
          </div>
          <div className="mt-3 space-y-2">
            {lessonScores.length ? (
              lessonScores.map((row) => (
                <div
                  key={`${row.studentName}-${row.date}`}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-slate-200">
                    {row.studentName}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(row.date)}
                  </span>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                    {row.score}%
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-white/10 bg-black/10 p-3 text-sm leading-6 text-slate-400">
                Zodra je per les skills markeert, ontstaan hier automatisch
                les-scores.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="size-4 text-violet-300" />
            <h3 className="text-sm font-semibold text-white">
              Datagedreven begeleiding
            </h3>
          </div>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            <p>
              Laatste meting:{" "}
              <span className="font-semibold text-white">
                {lastReviewedAt
                  ? formatDate(lastReviewedAt)
                  : "nog geen datum"}
              </span>
            </p>
            <p>
              Zelfstandig:{" "}
              <span className="font-semibold text-emerald-200">
                {zelfstandigCount}
              </span>{" "}
              onderdelen.
            </p>
            <p>
              Nog open:{" "}
              <span className="font-semibold text-amber-200">
                {nogOpenCount}
              </span>{" "}
              onderdelen.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-2">
            <Route className="size-4 text-emerald-300" />
            <h3 className="text-sm font-semibold text-white">
              Volgende stuuractie
            </h3>
          </div>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            {firstFocusStudent ? (
              <div>
                <p className="font-semibold text-white">
                  {firstFocusStudent.student.naam}
                </p>
                <p className="mt-1 text-slate-400">
                  Focus op {firstFocusStudent.focusItems[0]?.label}.
                </p>
              </div>
            ) : lowProgressStudents.length ? (
              <div>
                <p className="font-semibold text-white">
                  {lowProgressStudents[0]?.naam}
                </p>
                <p className="mt-1 text-slate-400">
                  Lage voortgang, plan een gerichte herhalingsles.
                </p>
              </div>
            ) : (
              <div className="flex gap-2 text-emerald-200">
                <CheckCircle2 className="mt-1 size-4 shrink-0" />
                <p>Geen acute voortgangsblokkade zichtbaar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
