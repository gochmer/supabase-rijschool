import { Fragment } from "react";
import type { ReactNode } from "react";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Flame,
  GraduationCap,
  LockKeyhole,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import type {
  StudentProgressAssessment,
  StudentProgressLessonNote,
  StudentProgressStatus,
} from "@/lib/types";
import { ProgressPrintButton } from "@/components/progress/progress-print-button";
import {
  formatStudentProgressDate,
  getStudentAutomaticNotifications,
  getStudentExamReadiness,
  getStudentProgressFocusItems,
  getStudentMilestoneOverview,
  getStudentProgressMomentum,
  getStudentProgressSectionSummaries,
  getStudentProgressStreak,
  getStudentProgressStatusMeta,
  getStudentProgressStrongestItems,
  getStudentProgressSummary,
  getStudentThreeLessonTrack,
  getStudentProgressTimeline,
  getStudentTrajectoryIntelligence,
  getStudentWeeklyGoals,
  STUDENT_PROGRESS_SECTIONS,
  STUDENT_PROGRESS_STATUS_OPTIONS,
  type StudentPackageTrajectoryInput,
} from "@/lib/student-progress";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function formatFullDate(dateValue: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(`${dateValue}T12:00:00`));
}

function getVisibleDates(assessments: StudentProgressAssessment[]) {
  return Array.from(
    new Set(assessments.map((assessment) => assessment.beoordelings_datum))
  )
    .sort((left, right) => right.localeCompare(left))
    .slice(0, 12)
    .sort((left, right) => left.localeCompare(right));
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

function getStatusStyles(status?: StudentProgressStatus | null) {
  switch (status) {
    case "zelfstandig":
      return "border-emerald-400/35 bg-emerald-500/18 text-emerald-100";
    case "begeleid":
      return "border-sky-400/35 bg-sky-500/18 text-sky-100";
    case "herhaling":
      return "border-rose-400/35 bg-rose-500/18 text-rose-100";
    case "uitleg":
      return "border-amber-400/35 bg-amber-500/18 text-amber-100";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

function PaperReadonlyLineField({
  label,
  value,
}: {
  label: string;
  value?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(6.5rem,38%)_minmax(0,1fr)] items-end gap-2 text-[12px] leading-none 2xl:grid-cols-[12rem_minmax(0,1fr)] 2xl:text-[15px]">
      <span className="truncate">{label}</span>
      <span className="min-h-5 min-w-0 truncate border-b-2 border-black px-1.5 pb-0.5 font-medium 2xl:px-2">
        {value || "\u00a0"}
      </span>
    </div>
  );
}

type StudentProgressPaperReadonlyProfile = {
  email?: string | null;
  inschrijfdatum?: string | null;
  naam?: string | null;
  pakket?: string | null;
  telefoon?: string | null;
};

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

function StudentProgressPaperReadonlyCard({
  assessments,
  laatsteInstructeurNaam,
  profile,
  visibleDates,
}: {
  assessments: StudentProgressAssessment[];
  laatsteInstructeurNaam?: string | null;
  profile?: StudentProgressPaperReadonlyProfile;
  visibleDates: string[];
}) {
  const paperDates = Array.from({ length: paperProgressColumnCount }, (_, index) =>
    visibleDates[index] ?? null
  );
  const reversedSections = [...STUDENT_PROGRESS_SECTIONS].reverse();
  const paperRowCount =
    STUDENT_PROGRESS_SECTIONS.length +
    STUDENT_PROGRESS_SECTIONS.reduce(
      (total, section) => total + section.items.length,
      0
    );
  const paperSections = reversedSections.map((section, sectionIndex) => {
    const previousRowCount = reversedSections
      .slice(0, sectionIndex)
      .reduce(
        (total, previousSection) => total + previousSection.items.length + 1,
        0
      );
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
    <div className="max-w-full overflow-hidden rounded-[1.6rem] border border-black/20 bg-white p-2 text-black shadow-[0_24px_80px_-54px_rgba(0,0,0,0.85)]">
      <div className="w-full max-w-full bg-white p-2 font-sans text-black 2xl:p-3">
        <div className="grid gap-3 2xl:grid-cols-[1.15fr_0.72fr_0.85fr] 2xl:gap-5">
          <div className="space-y-2">
            <PaperReadonlyLineField label="Naam leerling" value={profile?.naam} />
            <PaperReadonlyLineField label="Straat en huisnummer" />
            <PaperReadonlyLineField label="Postcode en woonplaats" />
            <PaperReadonlyLineField label="Telefoonnummer" value={profile?.telefoon} />
            <PaperReadonlyLineField label="E-mail adres" value={profile?.email} />
            <PaperReadonlyLineField
              label="Niveau pakket"
              value={
                <span className="flex min-w-0 justify-between gap-2">
                  <span className="truncate">START / A / B / C / D / Op maat:</span>
                  <span className="truncate">
                    {profile?.pakket || "Nog geen pakket"}
                  </span>
                </span>
              }
            />
          </div>

          <div className="flex flex-col justify-between gap-3 2xl:gap-4">
            <div className="border-2 border-black bg-zinc-900 px-3 py-3 text-center text-white 2xl:px-5 2xl:py-4">
              <p className="text-xs font-bold uppercase 2xl:text-sm">
                Autorijschool
              </p>
              <p className="mt-1 text-2xl font-black italic text-orange-400 2xl:text-4xl">
                GOCHOIR
              </p>
            </div>
            <PaperReadonlyLineField
              label="Instructeur"
              value={laatsteInstructeurNaam ?? undefined}
            />
          </div>

          <div className="space-y-2 2xl:pt-7">
            <PaperReadonlyLineField
              label="Inschrijfdatum"
              value={formatPaperDateValue(profile?.inschrijfdatum)}
            />
            <PaperReadonlyLineField label="Geboortedatum" />
            <PaperReadonlyLineField label="Geboorteplaats" />
            <div className="grid grid-cols-[minmax(6.5rem,38%)_minmax(0,1fr)] items-center gap-2 pt-2 text-[12px] 2xl:grid-cols-[8rem_1fr] 2xl:gap-3 2xl:text-[15px]">
              <span className="text-right">2ToDrive</span>
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span>{"\u25a1"} Ja</span>
                <span>{"\u25a1"} Geregeld</span>
                <span>{"\u25a1"} Nee</span>
              </span>
            </div>
          </div>
        </div>

        <table className="mt-4 w-full table-fixed border-collapse text-[10px] leading-tight 2xl:mt-5 2xl:text-[15px]">
          <colgroup>
            <col style={{ width: "42%" }} />
            <col style={{ width: "2rem" }} />
            {paperDates.map((_, index) => (
              <col key={`readonly-col-${index}`} />
            ))}
          </colgroup>
          <tbody>
            {paperSections.map(({ rows, section, sectionNumber }) => (
              <Fragment key={section.key}>
                <tr>
                  <td className="border border-black bg-orange-400 px-1.5 py-1 font-semibold 2xl:border-2 2xl:px-2">
                    <span className="block truncate">{section.label}</span>
                  </td>
                  <td className="border border-black bg-orange-400 text-center font-semibold 2xl:border-2">
                    {sectionNumber}
                  </td>
                  {paperDates.map((_, index) => (
                    <td
                      key={`${section.key}-header-${index}`}
                      className="h-5 border border-black bg-orange-400 2xl:h-6 2xl:border-2"
                    />
                  ))}
                </tr>

                {rows.map(({ item, number }, rowIndex) => (
                  <tr key={item.key}>
                    <td
                      className={cn(
                        "border border-black px-1.5 py-1 2xl:border-2 2xl:px-2 2xl:py-1.5",
                        rowIndex % 2 === 0 ? "bg-white" : "bg-neutral-200"
                      )}
                    >
                      <span className="block truncate">{item.label}</span>
                    </td>
                    <td
                      className={cn(
                        "border border-black text-center 2xl:border-2",
                        rowIndex % 2 === 0 ? "bg-white" : "bg-neutral-200"
                      )}
                    >
                      {number}
                    </td>
                    {paperDates.map((dateValue, columnIndex) => {
                      const assessment = dateValue
                        ? assessments.find(
                            (entry) =>
                              entry.vaardigheid_key === item.key &&
                              entry.beoordelings_datum === dateValue
                          )
                        : null;
                      const symbol = getPaperStatusSymbol(assessment?.status);

                      return (
                        <td
                          key={`${item.key}-${dateValue ?? columnIndex}`}
                          className={cn(
                            "h-6 border border-black bg-white p-0 text-center align-middle 2xl:h-7 2xl:border-2",
                            assessment?.status === "herhaling" && "bg-orange-100"
                          )}
                        >
                          <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-black 2xl:text-[15px]">
                            {symbol}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}

            <tr>
              <td
                rowSpan={2}
                className="border border-black bg-white px-2 py-2 align-top 2xl:border-2 2xl:px-8"
              >
                <p className="mb-2 text-center text-[11px] 2xl:mb-3 2xl:text-[15px]">
                  Verklaring van de te gebruiken tekens
                </p>
                <div className="grid max-w-full gap-1 text-[10px] 2xl:max-w-[480px] 2xl:text-[15px]">
                  {STUDENT_PROGRESS_STATUS_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className="grid grid-cols-[1.5rem_1fr] items-center gap-1.5 px-1.5 py-1 text-left 2xl:grid-cols-[2rem_1fr] 2xl:gap-2 2xl:px-2"
                    >
                      <span className="text-base leading-none 2xl:text-xl">
                        {getPaperStatusSymbol(option.value)}
                      </span>
                      <span>{option.label}</span>
                    </div>
                  ))}
                </div>
              </td>
              <td className="border border-black bg-white text-center text-[10px] [writing-mode:vertical-rl] 2xl:border-2 2xl:text-[15px]">
                Tijd
              </td>
              {paperDates.map((dateValue, index) => (
                <td
                  key={`time-${dateValue ?? index}`}
                  className="h-12 border border-black bg-white 2xl:h-16 2xl:border-2"
                />
              ))}
            </tr>
            <tr>
              <td className="border border-black bg-white text-center text-[10px] [writing-mode:vertical-rl] 2xl:border-2 2xl:text-[15px]">
                Datum
              </td>
              {paperDates.map((dateValue, index) => (
                <td
                  key={`date-${dateValue ?? index}`}
                  className="h-12 border border-black bg-white p-0 text-center align-bottom 2xl:h-16 2xl:border-2"
                >
                  {dateValue ? (
                    <span className="flex h-full w-full items-end justify-center px-0.5 pb-1 text-[8px] font-semibold [writing-mode:vertical-rl] 2xl:text-[10px]">
                      {formatStudentProgressDate(dateValue)}
                    </span>
                  ) : null}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StudentProgressReadOnlyCard({
  assessments,
  notes = [],
  progressValue,
  volgendeLes,
  laatsteInstructeurNaam,
  profile,
  packageUsage,
}: {
  assessments: StudentProgressAssessment[];
  notes?: StudentProgressLessonNote[];
  progressValue: number;
  volgendeLes: string;
  laatsteInstructeurNaam?: string | null;
  profile?: StudentProgressPaperReadonlyProfile;
  packageUsage?: StudentPackageTrajectoryInput;
}) {
  const summary = getStudentProgressSummary(assessments);
  const sectionSummaries = getStudentProgressSectionSummaries(assessments);
  const timeline = getStudentProgressTimeline(assessments, notes).slice(0, 4);
  const visibleDates = getVisibleDates(assessments);
  const focusItems = getStudentProgressFocusItems(assessments);
  const strongestItems = getStudentProgressStrongestItems(assessments);
  const momentum = getStudentProgressMomentum(assessments, notes);
  const examReadiness = getStudentExamReadiness(assessments, notes);
  const progressStreak = getStudentProgressStreak(assessments, notes);
  const milestoneOverview = getStudentMilestoneOverview(assessments, notes);
  const automaticNotifications = getStudentAutomaticNotifications(
    assessments,
    notes
  );
  const weeklyGoals = getStudentWeeklyGoals(assessments, notes);
  const threeLessonTrack = getStudentThreeLessonTrack(assessments, notes);
  const trajectoryIntelligence = getStudentTrajectoryIntelligence({
    assessments,
    notes,
    packageUsage: packageUsage ?? {
      packageName: profile?.pakket ?? null,
    },
  });

  return (
    <section
      data-progress-print-root
      className="rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(17,24,39,0.96))] p-6 shadow-[0_28px_88px_-46px_rgba(15,23,42,0.78)] print:shadow-none sm:p-7"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-semibold tracking-[0.22em] text-slate-200 uppercase">
              Voortgangskaart
            </div>
            <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-medium tracking-[0.12em] text-slate-300 uppercase">
              Alleen-lezen
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white sm:text-[2rem]">
              Inzicht in wat je al beheerst en waar nog aandacht zit.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
              Je instructeur werkt deze kaart bij per lesmoment. Daardoor zie je niet alleen een
              percentage, maar ook welke onderdelen al zelfstandig gaan en welke nog in opbouw zijn.
            </p>
          </div>
        </div>

        <div className="space-y-3 xl:w-[20rem]">
          <div className="flex justify-end">
            <ProgressPrintButton
              className="h-9 rounded-full border-white/10 bg-white/6 px-3 text-[12px] font-medium text-white hover:bg-white/10"
            />
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <LockKeyhole className="size-4 text-slate-300" />
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-300 uppercase">
                Laatste update
              </p>
            </div>
            <p className="mt-3 text-base font-semibold text-white">
              {summary.lastReviewedAt
                ? formatFullDate(summary.lastReviewedAt)
                : "Nog geen beoordeling"}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              {laatsteInstructeurNaam
                ? `Bijgewerkt door ${laatsteInstructeurNaam}.`
                : "Zodra je instructeur onderdelen markeert, zie je hier meteen een update."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: GraduationCap,
            label: "Voortgang",
            value: `${progressValue}%`,
            detail:
              summary.beoordeeldCount > 0
                ? `${summary.beoordeeldCount} onderdelen actief beoordeeld`
                : "Nog geen lesonderdelen gemarkeerd",
          },
          {
            icon: CheckCircle2,
            label: "Zelfstandig",
            value: `${summary.zelfstandigCount}`,
            detail: "Onderdelen die zelfstandig lukken",
          },
          {
            icon: CircleAlert,
            label: "Aandacht",
            value: `${summary.aandachtCount}`,
            detail: "Onderdelen met uitleg of herhaling",
          },
          {
            icon: CalendarDays,
            label: "Volgende les",
            value: volgendeLes,
            detail: "Gebruik dit overzicht om gericht voor te bereiden",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[1.35rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(148,163,184,0.08),rgba(15,23,42,0.28))] p-4"
          >
            <item.icon className="size-4 text-slate-200" />
            <p className="mt-3 text-[10px] font-semibold tracking-[0.18em] text-slate-300 uppercase">
              {item.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
            <p className="mt-1.5 text-sm leading-6 text-slate-300">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {sectionSummaries.map((section) => (
          <div
            key={section.key}
            className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
          >
            <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-300 uppercase">
              {section.shortLabel}
            </p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="text-xl font-semibold text-white">{section.percentage}%</p>
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
            <p className="mt-2 text-[12px] leading-5 text-slate-300">
              {section.attentionCount > 0
                ? `${section.attentionCount} onderdeel${section.attentionCount === 1 ? "" : "en"} vragen nog aandacht.`
                : "Deze toetsgroep oogt stabiel en groeit mooi door."}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-slate-200" />
              <h3 className="text-base font-semibold text-white">Trajectbewaking</h3>
            </div>
            <Badge variant={trajectoryIntelligence.packageSignal.badge}>
              {trajectoryIntelligence.packageSignal.badgeLabel}
            </Badge>
          </div>
          <p className="mt-3 text-lg font-semibold text-white">
            {trajectoryIntelligence.packageSignal.title}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <span
              className={cn(
                "block h-full rounded-full",
                trajectoryIntelligence.packageSignal.badge === "danger"
                  ? "bg-rose-400"
                  : trajectoryIntelligence.packageSignal.badge === "warning"
                    ? "bg-amber-400"
                    : "bg-emerald-400"
              )}
              style={{
                width: `${Math.min(
                  Math.max(trajectoryIntelligence.packageSignal.pressure, 6),
                  100
                )}%`,
              }}
            />
          </div>
          <p className="mt-2 text-[13px] leading-6 text-slate-300">
            {trajectoryIntelligence.packageSignal.detail}
          </p>
          <div className="mt-3 rounded-[1rem] border border-white/10 bg-black/12 p-3">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
              Lessenstand
            </p>
            <p className="mt-1 text-[13px] font-medium text-white">
              {trajectoryIntelligence.packageSignal.usageLabel}
            </p>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-slate-200" />
              <h3 className="text-base font-semibold text-white">Richting proefexamen</h3>
            </div>
            <Badge variant={examReadiness.badge}>{examReadiness.label}</Badge>
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-300 uppercase">
                Gereedheid
              </p>
              <p className="mt-1 text-3xl font-semibold text-white">
                {examReadiness.score}%
              </p>
            </div>
            <p className="max-w-[10rem] text-right text-[12px] leading-5 text-slate-300">
              {examReadiness.nextMilestone}
            </p>
          </div>
          <p className="mt-3 text-[13px] leading-6 text-slate-300">
            {examReadiness.summary}
          </p>
          <div className="mt-3 grid gap-2">
            {examReadiness.checks.map((check) => (
              <div
                key={check.label}
                className="rounded-[1rem] border border-white/10 bg-black/12 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                    {check.label}
                  </p>
                  <Badge variant={check.badge}>{check.value}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-slate-200" />
              <h3 className="text-base font-semibold text-white">Recent ritme</h3>
            </div>
            <Badge variant={momentum.badge}>{momentum.label}</Badge>
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{momentum.score}%</p>
          <p className="mt-2 text-[13px] leading-6 text-slate-300">{momentum.detail}</p>
          <div className="mt-3 rounded-[1rem] border border-white/10 bg-black/12 p-3">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
              Wat dit betekent
            </p>
            <p className="mt-1 text-[13px] leading-6 text-slate-200">
              {momentum.suggestion}
            </p>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-slate-200" />
            <h3 className="text-base font-semibold text-white">Wat al sterk staat</h3>
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
                    className="rounded-[1rem] border border-white/10 bg-black/12 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                          {item.sectionLabel}
                        </p>
                        <p className="mt-1 text-[13px] font-medium text-white">
                          {item.label}
                        </p>
                      </div>
                      {meta ? <Badge variant="success">{meta.shortLabel}</Badge> : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[1rem] border border-dashed border-white/10 bg-black/10 p-3">
                <p className="text-[13px] leading-6 text-slate-300">
                  Zodra onderdelen echt zelfstandig staan, zie je hier je sterkste punten terug.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2">
            <Award className="size-4 text-slate-200" />
            <h3 className="text-base font-semibold text-white">Badges en mijlpalen</h3>
          </div>
          <p className="mt-2 text-[13px] leading-6 text-slate-300">
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
                      : ""
                  )}
                >
                  {badge.newlyUnlocked ? `Nieuw: ${badge.title}` : badge.title}
                </Badge>
              ))
            ) : (
              <div className="rounded-[1rem] border border-dashed border-white/10 bg-black/10 px-3 py-2 text-[12px] leading-6 text-slate-300">
                Je eerste badge verschijnt automatisch zodra je kaart meer stevige groei laat zien.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-slate-200" />
              <h3 className="text-base font-semibold text-white">Volgende badge</h3>
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
              <p className="mt-3 text-lg font-semibold text-white">
                {milestoneOverview.next.title}
              </p>
              <p className="mt-2 text-[13px] leading-6 text-slate-300">
                {milestoneOverview.next.detail}
              </p>
              <div className="mt-3 rounded-[1rem] border border-white/10 bg-black/12 px-3 py-2">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                  Richting
                </p>
                <p className="mt-1 text-[13px] font-medium text-white">
                  {milestoneOverview.next.progressLabel}
                </p>
              </div>
            </>
          ) : (
            <p className="mt-3 text-[13px] leading-6 text-slate-300">
              Je huidige mijlpalen zijn allemaal gehaald. Dat is een sterk teken dat je kaart stevig
              staat.
            </p>
          )}
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-slate-200" />
              <h3 className="text-base font-semibold text-white">Groei-streak</h3>
            </div>
            <Badge variant={progressStreak.badge}>{progressStreak.count}x</Badge>
          </div>
          <p className="mt-3 text-lg font-semibold text-white">{progressStreak.label}</p>
          <p className="mt-2 text-[13px] leading-6 text-slate-300">
            {progressStreak.detail}
          </p>
        </div>
      </div>

      {milestoneOverview.recentUnlocked.length ? (
        <div className="milestone-celebration mt-4 rounded-[1.45rem] border border-emerald-400/16 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(14,165,233,0.12),rgba(15,23,42,0.72))] p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 text-emerald-200" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-200 uppercase">
                Nieuw behaald
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {milestoneOverview.recentUnlocked.length} nieuwe {milestoneOverview.recentUnlocked.length === 1 ? "badge" : "badges"} na je laatste les
              </h3>
              <p className="mt-1.5 text-[13px] leading-6 text-slate-200">
                Mooie stap. Je meest recente les heeft direct een nieuwe mijlpaal opgeleverd.
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

      {assessments.length || notes.length ? (
        <div className="mt-6 grid gap-6">
          <StudentProgressPaperReadonlyCard
            assessments={assessments}
            laatsteInstructeurNaam={laatsteInstructeurNaam}
            profile={profile}
            visibleDates={visibleDates}
          />

          {false ? (
            <div className="rounded-[1.6rem] border border-white/10 bg-black/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Lesmomenten en onderdelen</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-slate-300">
                  Dit is dezelfde kaart die je instructeur gebruikt, maar dan leesbaar voor jou als
                  leerling.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {STUDENT_PROGRESS_STATUS_OPTIONS.map((option) => (
                  <span
                    key={option.value}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[11px] font-semibold",
                      getStatusStyles(option.value)
                    )}
                  >
                    {option.shortLabel} · {option.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-left">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 min-w-[17rem] rounded-l-[1rem] bg-[rgba(15,23,42,0.96)] px-3 py-2 text-[10px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                      Onderdeel
                    </th>
                    {visibleDates.map((dateValue) => {
                      const isLatest = dateValue === visibleDates[visibleDates.length - 1];

                      return (
                        <th key={dateValue} className="min-w-[5.2rem] px-1.5 py-2 text-center">
                          <div
                            className={cn(
                              "w-full rounded-[0.95rem] border px-2 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase",
                              isLatest
                                ? "border-sky-400/28 bg-sky-500/16 text-sky-100"
                                : "border-white/10 bg-white/5 text-slate-300"
                            )}
                          >
                            {formatStudentProgressDate(dateValue)}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {STUDENT_PROGRESS_SECTIONS.map((section) => (
                    <Fragment key={section.key}>
                      <tr key={`${section.key}-header`}>
                        <td
                          colSpan={visibleDates.length + 1}
                          className="rounded-[1rem] bg-[linear-gradient(90deg,rgba(14,165,233,0.18),rgba(59,130,246,0.14),rgba(255,255,255,0.04))] px-3 py-2 text-[11px] font-semibold tracking-[0.18em] text-slate-100 uppercase"
                        >
                          {section.label}
                        </td>
                      </tr>

                      {section.items.map((item) => {
                        const latest = assessments
                          .filter((assessment) => assessment.vaardigheid_key === item.key)
                          .sort((left, right) => {
                            if (left.beoordelings_datum !== right.beoordelings_datum) {
                              return right.beoordelings_datum.localeCompare(
                                left.beoordelings_datum
                              );
                            }

                            return right.created_at.localeCompare(left.created_at);
                          })[0];
                        const latestMeta = latest?.status
                          ? getStudentProgressStatusMeta(latest.status)
                          : null;

                        return (
                          <tr key={item.key}>
                            <td className="sticky left-0 z-10 rounded-l-[1rem] border border-white/10 bg-[rgba(15,23,42,0.96)] px-3 py-3 align-top">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[13px] font-medium text-white">{item.label}</p>
                                  <p className="mt-1 text-[11px] text-slate-400">
                                    {latestMeta
                                      ? `Laatste status: ${latestMeta.label.toLowerCase()}`
                                      : "Nog niet beoordeeld"}
                                  </p>
                                </div>
                                {latestMeta ? (
                                  <span
                                    className={cn(
                                      "rounded-full border px-2 py-1 text-[11px] font-semibold",
                                      getStatusStyles(latest?.status)
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
                              const meta = assessment?.status
                                ? getStudentProgressStatusMeta(assessment.status)
                                : null;

                              return (
                                <td
                                  key={`${item.key}-${dateValue}`}
                                  className="rounded-[1rem] border border-white/10 bg-white/5 p-1.5 text-center align-middle"
                                >
                                  <div
                                    className={cn(
                                      "inline-flex h-10 w-full items-center justify-center rounded-[0.85rem] border text-[11px] font-semibold",
                                      getStatusStyles(assessment?.status)
                                    )}
                                  >
                                    {meta ? meta.shortLabel : "·"}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[1.55rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <CircleAlert className="size-4 text-slate-200" />
                <h3 className="text-base font-semibold text-white">
                  Automatische meldingen
                </h3>
              </div>
              <p className="mt-2 text-[13px] leading-6 text-slate-300">
                Dit zijn de belangrijkste aanwijzingen uit je kaart, zodat je sneller ziet waar nu
                de meeste winst of aandacht zit.
              </p>
              <div className="mt-3 space-y-2">
                {automaticNotifications.map((signal) => (
                  <div
                    key={signal.title}
                    className="rounded-[1rem] border border-white/10 bg-black/12 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-medium text-white">{signal.title}</p>
                        <p className="mt-1 text-[12px] leading-6 text-slate-300">
                          {signal.detail}
                        </p>
                      </div>
                      <Badge variant={signal.badge}>{signal.badgeLabel}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.55rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-slate-200" />
                <h3 className="text-base font-semibold text-white">Weekdoelen</h3>
              </div>
              <p className="mt-2 text-[13px] leading-6 text-slate-300">
                Dit zijn de slimste doelen om deze week op te letten, zodat je gerichter kunt
                voorbereiden en mee kunt denken met je instructeur.
              </p>
              <div className="mt-3 space-y-2">
                {weeklyGoals.map((goal) => (
                  <div
                    key={goal.title}
                    className="rounded-[1rem] border border-white/10 bg-black/12 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-medium text-white">{goal.title}</p>
                        <p className="mt-1 text-[12px] leading-6 text-slate-300">
                          {goal.detail}
                        </p>
                      </div>
                      <Badge variant={goal.badge}>{goal.badgeLabel}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.55rem] border border-white/10 bg-white/5 p-4">
              <h3 className="text-base font-semibold text-white">Komende 3 lessen</h3>
              <p className="mt-2 text-[13px] leading-6 text-slate-300">
                Dit zijn nu de slimste stappen richting meer rust, zelfstandigheid en een sterker
                proefexamenritme.
              </p>
              <div className="mt-3 space-y-2">
                {threeLessonTrack.map((item) => (
                  <div
                    key={`${item.lessonLabel}-${item.title}`}
                    className="rounded-[1rem] border border-white/10 bg-black/12 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                          {item.lessonLabel}
                        </p>
                        <p className="text-[13px] font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-[12px] leading-6 text-slate-300">
                          {item.detail}
                        </p>
                      </div>
                      <Badge variant={item.badge}>{item.badgeLabel}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.55rem] border border-white/10 bg-white/5 p-4">
              <h3 className="text-base font-semibold text-white">Aandacht voor de volgende les</h3>
              <div className="mt-3 space-y-2">
                {focusItems.length ? (
                  focusItems.map((item) => {
                    const meta = item.latest?.status
                      ? getStudentProgressStatusMeta(item.latest.status)
                      : null;

                    return (
                      <div
                        key={item.key}
                        className="rounded-[1rem] border border-white/10 bg-black/12 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                              {item.sectionLabel}
                            </p>
                            <p className="mt-1 text-[13px] font-medium text-white">
                              {item.label}
                            </p>
                          </div>
                          {meta ? (
                            <span
                              className={cn(
                                "rounded-full border px-2 py-1 text-[11px] font-semibold",
                                getStatusStyles(item.latest?.status)
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
                  <div className="rounded-[1rem] border border-dashed border-white/10 bg-black/10 p-3">
                    <p className="text-[13px] leading-6 text-slate-300">
                      Je kaart laat nog geen aandachtspunten zien. Dat betekent meestal dat je eerste
                      beoordeling nog moet komen of dat veel onderdelen al stevig staan.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.55rem] border border-white/10 bg-white/5 p-4">
              <h3 className="text-base font-semibold text-white">Coachnotities</h3>
              <div className="mt-3 space-y-2">
                {timeline.length ? (
                  timeline.map((entry) => (
                    <div
                      key={entry.date}
                      className="rounded-[1rem] border border-white/10 bg-black/12 p-3"
                    >
                      <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                        {formatFullDate(entry.date)}
                      </p>
                      <p className="mt-2 text-[13px] leading-6 text-slate-200">
                        {entry.note?.samenvatting || "Nog geen samenvatting voor dit lesmoment."}
                      </p>
                      {(entry.note?.sterk_punt || entry.note?.focus_volgende_les) && (
                        <div className="mt-2 grid gap-2">
                          {entry.note?.sterk_punt ? (
                            <div className="rounded-[0.9rem] border border-emerald-400/14 bg-emerald-500/10 px-3 py-2">
                              <p className="text-[11px] font-semibold tracking-[0.14em] text-emerald-200 uppercase">
                                Sterk punt
                              </p>
                              <p className="mt-1 text-[12px] leading-5 text-emerald-50">
                                {entry.note.sterk_punt}
                              </p>
                            </div>
                          ) : null}
                          {entry.note?.focus_volgende_les ? (
                            <div className="rounded-[0.9rem] border border-sky-400/14 bg-sky-500/10 px-3 py-2">
                              <p className="text-[11px] font-semibold tracking-[0.14em] text-sky-200 uppercase">
                                Volgende focus
                              </p>
                              <p className="mt-1 text-[12px] leading-5 text-sky-50">
                                {entry.note.focus_volgende_les}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1rem] border border-dashed border-white/10 bg-black/10 p-3">
                    <p className="text-[13px] leading-6 text-slate-300">
                      Zodra je instructeur lesreflecties opslaat, komen ze hier in een nette tijdlijn
                      terug.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.55rem] border border-white/10 bg-white/5 p-4">
              <h3 className="text-base font-semibold text-white">Samenvatting</h3>
              <div className="mt-3 grid gap-2">
                {[
                  {
                    label: "Beoordeeld",
                    value: `${summary.beoordeeldCount} onderdelen`,
                  },
                  {
                    label: "Nog open",
                    value: `${summary.nogOpenCount} onderdelen`,
                  },
                  {
                    label: "In opbouw",
                    value: `${summary.begeleidCount} begeleid`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1rem] border border-white/10 bg-black/12 px-3 py-2.5"
                  >
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                      {item.label}
                    </p>
                    <p className="mt-1 text-[13px] font-medium text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[1.6rem] border border-dashed border-white/10 bg-white/5 p-6">
          <div className="flex items-start gap-3">
            <Badge variant="info" className="mt-0.5">
              Nog leeg
            </Badge>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Je instructiekaart vult zich zodra je instructeur lessen beoordeelt
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                Op dit moment zie je alleen je globale voortgang. Zodra je instructeur per onderdeel
                markeringen zet, verschijnt hier automatisch dezelfde voortgangskaart in een
                overzichtelijke leerlingweergave.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
