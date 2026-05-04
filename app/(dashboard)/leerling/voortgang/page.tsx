import Link from "next/link";
import {
  AlertTriangle,
  Brain,
  CalendarClock,
  ClipboardList,
  Gauge,
  Info,
  ShieldCheck,
  Target,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { StudentProgressReadOnlyCard } from "@/components/progress/student-progress-readonly-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getLeerlingLessonRequests,
  getLeerlingLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentStudentPackageOverview } from "@/lib/data/packages";
import { getCurrentLeerlingRecord, getCurrentProfile } from "@/lib/data/profiles";
import { getCurrentLeerlingProgressWorkspace } from "@/lib/data/student-progress";
import { getCurrentLearnerLearningPreferences } from "@/lib/data/learner-experience";
import { buildLearnerCoachingModel } from "@/lib/learner-coaching";
import { resolveLearnerNextAction } from "@/lib/next-action-engine";
import {
  getStudentExamReadiness,
  getStudentProgressFocusItems,
  getStudentProgressSummary,
  getStudentTrajectoryIntelligence,
} from "@/lib/student-progress";

const cardClassName =
  "rounded-xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_20px_60px_-44px_rgba(0,0,0,0.9)]";

function getCoachingToneClass(tone: "danger" | "success" | "warning" | "info") {
  switch (tone) {
    case "danger":
      return "border-rose-300/20 bg-rose-400/10 text-rose-100";
    case "success":
      return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
    case "warning":
      return "border-amber-300/20 bg-amber-400/10 text-amber-100";
    default:
      return "border-sky-300/20 bg-sky-400/10 text-sky-100";
  }
}

function getBadgeVariant(tone: "danger" | "success" | "warning" | "info") {
  if (tone === "danger") {
    return "danger" as const;
  }

  if (tone === "success") {
    return "success" as const;
  }

  if (tone === "warning") {
    return "warning" as const;
  }

  return "info" as const;
}

export default async function LeerlingVoortgangPage() {
  const [
    profile,
    leerling,
    lessons,
    requests,
    packageOverview,
    progressWorkspace,
    learningPreferences,
  ] =
    await Promise.all([
      getCurrentProfile(),
      getCurrentLeerlingRecord(),
      getLeerlingLessons(),
      getLeerlingLessonRequests(),
      getCurrentStudentPackageOverview(),
      getCurrentLeerlingProgressWorkspace(),
      getCurrentLearnerLearningPreferences(),
    ]);
  const progressSummary = getStudentProgressSummary(progressWorkspace.assessments);
  const examReadiness = getStudentExamReadiness(
    progressWorkspace.assessments,
    progressWorkspace.notes,
  );
  const focusItems = getStudentProgressFocusItems(progressWorkspace.assessments, 4);
  const intelligence = getStudentTrajectoryIntelligence({
    assessments: progressWorkspace.assessments,
    notes: progressWorkspace.notes,
    packageUsage: {
      packageName: packageOverview.assignedPackage?.naam,
      plannedLessons: packageOverview.lessonUsage.plannedLessons,
      remainingLessons: packageOverview.lessonUsage.remainingLessons,
      totalLessons: packageOverview.lessonUsage.totalLessons,
      usedLessons: packageOverview.lessonUsage.usedLessons,
    },
  });
  const nextAction = resolveLearnerNextAction({
    assessments: progressWorkspace.assessments,
    hasPackage: Boolean(leerling?.pakket_id),
    journeyStatus: leerling?.student_status,
    lessons,
    notes: progressWorkspace.notes,
    profileComplete: Boolean(profile?.volledige_naam?.trim() && profile.telefoon?.trim()),
    requests,
  });
  const nextLesson = lessons.find((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status),
  );
  const coaching = buildLearnerCoachingModel({
    assessments: progressWorkspace.assessments,
    lessons,
    nextAction,
    notes: progressWorkspace.notes,
    packageUsage: packageOverview.lessonUsage,
    preferences: learningPreferences,
    requests,
  });

  return (
    <div className="space-y-4 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Voortgang"
        title="Jouw leertraject"
        description="Zie rustig waar je staat, wat aandacht vraagt en welke stap nu logisch is."
        actions={
          <Button
            asChild
            className="rounded-full border border-white/12 bg-[linear-gradient(135deg,#f8fafc,#cbd5e1)] text-slate-950 hover:brightness-[1.03]"
          >
            <Link href={nextAction.href}>{nextAction.ctaLabel}</Link>
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: Gauge,
            label: "Totale voortgang",
            value: `${progressSummary.percentage || leerling?.voortgang_percentage || 0}%`,
            text: `${progressSummary.beoordeeldCount} onderdelen beoordeeld`,
          },
          {
            icon: Target,
            label: "Examenklaar-score",
            value: `${examReadiness.score}%`,
            text: examReadiness.nextMilestone,
          },
          {
            icon: CalendarClock,
            label: "Volgende les",
            value: nextLesson ? nextLesson.datum : "Nog geen les",
            text: nextLesson ? `${nextLesson.tijd} - ${nextLesson.titel}` : "Plan je volgende moment.",
          },
          {
            icon: ClipboardList,
            label: "Pakket",
            value: packageOverview.assignedPackage?.naam ?? "Nog geen pakket",
            text: intelligence.packageSignal.usageLabel,
          },
        ].map((item) => (
          <section key={item.label} className={cardClassName}>
            <div className="flex items-center justify-between gap-3">
              <item.icon className="size-5 text-sky-200" />
              <Badge variant="info">{item.label}</Badge>
            </div>
            <p className="mt-4 text-2xl font-semibold">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
          </section>
        ))}
      </div>

      <section className={cardClassName}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant={nextAction.tone === "danger" ? "danger" : nextAction.tone === "warning" ? "warning" : "info"}>
              Volgende actie
            </Badge>
            <h2 className="mt-3 text-2xl font-semibold">{nextAction.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
              {nextAction.description}
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href={nextAction.href}>{nextAction.ctaLabel}</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className={cardClassName}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="warning">Begeleiding</Badge>
              <h2 className="mt-3 text-xl font-semibold">
                Waar letten we nu op?
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Deze signalen combineren planning, pakketruimte, feedback en
                examengereedheid tot concrete vervolgstappen.
              </p>
            </div>
            <Brain className="size-6 text-violet-200" />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {coaching.proactiveSignals.map((signal) => (
              <article
                key={signal.id}
                className={`rounded-lg border p-4 ${getCoachingToneClass(signal.tone)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant={getBadgeVariant(signal.tone)}>
                      {signal.actionLabel}
                    </Badge>
                    <h3 className="mt-3 font-semibold text-white">{signal.title}</h3>
                  </div>
                  <AlertTriangle className="size-5 text-white/70" />
                </div>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  {signal.detail}
                </p>
                <p className="mt-3 text-xs leading-5 text-white/60">
                  {signal.reason}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {signal.evidence.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-white/75"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <Button asChild className="mt-4 rounded-lg" size="sm">
                  <Link href={signal.href}>{signal.actionLabel}</Link>
                </Button>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-3">
          <section className={cardClassName}>
            <Badge variant="info">Waarom?</Badge>
            <h3 className="mt-3 font-semibold">{coaching.explanation.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {coaching.explanation.reason}
            </p>
            <div className="mt-3 rounded-lg border border-white/10 bg-white/6 p-3">
              <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
                Regel
              </p>
              <p className="mt-1 text-sm">{coaching.explanation.ruleLabel}</p>
            </div>
            <div className="mt-3 space-y-2">
              {coaching.explanation.evidence.map((item) => (
                <p
                  key={item}
                  className="flex items-center gap-2 text-sm text-slate-300"
                >
                  <Info className="size-4 text-sky-200" />
                  {item}
                </p>
              ))}
            </div>
          </section>

          <section className={cardClassName}>
            <Badge variant="success">Leerstijl</Badge>
            <h3 className="mt-3 font-semibold">
              {coaching.learningProfile.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {coaching.learningProfile.detail}
            </p>
            <p className="mt-3 rounded-lg border border-white/10 bg-white/6 p-3 text-sm text-slate-200">
              {coaching.learningProfile.coachingStyle}
            </p>
          </section>
        </aside>
      </div>

      <section className={cardClassName}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="info">Vroege signalen</Badge>
            <h2 className="mt-3 text-xl font-semibold">
              Eerder bijsturen, zonder ruis
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Elke score is gebaseerd op planning, activiteit, voortgang of
              examendata. Zo blijft duidelijk waarom iets aandacht krijgt.
            </p>
          </div>
          <ShieldCheck className="size-6 text-emerald-200" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {coaching.behaviorInsights.map((insight) => (
            <article
              key={insight.label}
              className={`rounded-lg border p-4 ${getCoachingToneClass(insight.tone)}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-white/60 uppercase">
                  {insight.label}
                </p>
                <Badge variant={getBadgeVariant(insight.tone)}>
                  {insight.score}%
                </Badge>
              </div>
              <p className="mt-3 text-2xl font-semibold text-white">
                {insight.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {insight.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <StudentProgressReadOnlyCard
          assessments={progressWorkspace.assessments}
          laatsteInstructeurNaam={progressWorkspace.laatsteInstructeurNaam}
          notes={progressWorkspace.notes}
          packageUsage={{
            packageName: packageOverview.assignedPackage?.naam,
            plannedLessons: packageOverview.lessonUsage.plannedLessons,
            remainingLessons: packageOverview.lessonUsage.remainingLessons,
            totalLessons: packageOverview.lessonUsage.totalLessons,
            usedLessons: packageOverview.lessonUsage.usedLessons,
          }}
          progressValue={progressSummary.percentage || leerling?.voortgang_percentage || 0}
          volgendeLes={nextLesson ? `${nextLesson.datum} om ${nextLesson.tijd}` : "Nog geen les ingepland"}
        />

        <aside className="space-y-3">
          <section className={cardClassName}>
            <Badge variant={examReadiness.badge}>Examenklaar</Badge>
            <p className="mt-3 text-3xl font-semibold">{examReadiness.score}%</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              {examReadiness.summary}
            </p>
          </section>
          <section className={cardClassName}>
            <h3 className="font-semibold">Focus skills</h3>
            <div className="mt-3 space-y-2">
              {focusItems.length ? (
                focusItems.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-lg border border-white/10 bg-white/6 p-3"
                  >
                    <p className="font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      {item.sectionLabel}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-300">
                  Zodra je instructeur onderdelen beoordeelt, verschijnen hier je focuspunten.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
