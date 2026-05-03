import { Fragment } from "react";
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
  getStudentWeeklyGoals,
  STUDENT_PROGRESS_SECTIONS,
  STUDENT_PROGRESS_STATUS_OPTIONS,
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

function getStatusStyles(status?: StudentProgressStatus | null) {
  switch (status) {
    case "zelfstandig":
      return "border-emerald-300/60 bg-emerald-100 text-emerald-800 dark:border-emerald-400/24 dark:bg-emerald-500/14 dark:text-emerald-100";
    case "begeleid":
      return "border-sky-300/60 bg-sky-100 text-sky-800 dark:border-sky-400/24 dark:bg-sky-500/14 dark:text-sky-100";
    case "uitleg":
      return "border-amber-300/60 bg-amber-100 text-amber-800 dark:border-amber-400/24 dark:bg-amber-500/14 dark:text-amber-100";
    case "herhaling":
      return "border-rose-300/60 bg-rose-100 text-rose-800 dark:border-rose-400/24 dark:bg-rose-500/14 dark:text-rose-100";
    default:
      return "border-slate-200/80 bg-white/85 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400";
  }
}

function getVisibleDates(assessments: StudentProgressAssessment[]) {
  return Array.from(
    new Set(assessments.map((assessment) => assessment.beoordelings_datum))
  )
    .sort((left, right) => right.localeCompare(left))
    .slice(0, 5)
    .sort((left, right) => left.localeCompare(right));
}

export function StudentProgressReadOnlyCard({
  assessments,
  notes = [],
  progressValue,
  volgendeLes,
  laatsteInstructeurNaam,
}: {
  assessments: StudentProgressAssessment[];
  notes?: StudentProgressLessonNote[];
  progressValue: number;
  volgendeLes: string;
  laatsteInstructeurNaam?: string | null;
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

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
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
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
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

          <div className="space-y-4">
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
