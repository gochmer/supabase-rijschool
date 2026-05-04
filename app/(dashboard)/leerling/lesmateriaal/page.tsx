import Link from "next/link";
import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  PlayCircle,
  Route,
  SlidersHorizontal,
  Target,
} from "lucide-react";

import { updateLearnerLearningPreferencesFormAction } from "@/lib/actions/learner-experience";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import {
  getLeerlingLessonRequests,
  getLeerlingLessons,
} from "@/lib/data/lesson-requests";
import { getCurrentStudentPackageOverview } from "@/lib/data/packages";
import { getCurrentLearnerLearningPreferences } from "@/lib/data/learner-experience";
import { getCurrentLeerlingRecord, getCurrentProfile } from "@/lib/data/profiles";
import { getCurrentLeerlingProgressWorkspace } from "@/lib/data/student-progress";
import { buildLearnerCoachingModel } from "@/lib/learner-coaching";
import { resolveLearnerNextAction } from "@/lib/next-action-engine";
import {
  getStudentNextLessonPlan,
  getStudentProgressFocusItems,
  STUDENT_PROGRESS_SECTIONS,
} from "@/lib/student-progress";

const cardClassName =
  "rounded-xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_20px_60px_-44px_rgba(0,0,0,0.9)]";

const baseMaterials = [
  {
    icon: BookOpenCheck,
    title: "Kijkgedrag en spiegels",
    type: "Tipkaart",
    detail: "Herhaal de vaste kijkvolgorde voor wegrijden, kruispunten en rijstrook wisselen.",
  },
  {
    icon: PlayCircle,
    title: "Bijzondere verrichtingen",
    type: "Oefenblok",
    detail: "Bereid parkeren, keren en achteruit rijden voor met korte aandachtspunten.",
  },
  {
    icon: ClipboardList,
    title: "Examenvoorbereiding",
    type: "Checklist",
    detail: "Controleer zelfstandigheid, route rijden, spanning en laatste feedback.",
  },
];

function findSectionForSkill(skillKey: string) {
  return STUDENT_PROGRESS_SECTIONS.find((section) =>
    section.items.some((item) => item.key === skillKey),
  );
}

export default async function LeerlingLesmateriaalPage() {
  const [
    progressWorkspace,
    lessons,
    requests,
    packageOverview,
    learningPreferences,
    leerling,
    profile,
  ] = await Promise.all([
    getCurrentLeerlingProgressWorkspace(),
    getLeerlingLessons(),
    getLeerlingLessonRequests(),
    getCurrentStudentPackageOverview(),
    getCurrentLearnerLearningPreferences(),
    getCurrentLeerlingRecord(),
    getCurrentProfile(),
  ]);
  const focusItems = getStudentProgressFocusItems(progressWorkspace.assessments, 5);
  const nextLessonPlan = getStudentNextLessonPlan(
    progressWorkspace.assessments,
    progressWorkspace.notes,
  );
  const nextLesson = lessons.find((lesson) =>
    ["ingepland", "geaccepteerd"].includes(lesson.status),
  );
  const nextAction = resolveLearnerNextAction({
    assessments: progressWorkspace.assessments,
    hasPackage: Boolean(leerling?.pakket_id),
    journeyStatus: leerling?.student_status,
    lessons,
    notes: progressWorkspace.notes,
    profileComplete: Boolean(profile?.volledige_naam?.trim() && profile.telefoon?.trim()),
    requests,
  });
  const coaching = buildLearnerCoachingModel({
    assessments: progressWorkspace.assessments,
    lessons,
    nextAction,
    notes: progressWorkspace.notes,
    packageUsage: packageOverview.lessonUsage,
    preferences: learningPreferences,
    requests,
  });
  const selectedScenarioFocus = new Set(learningPreferences?.scenario_focus ?? []);

  return (
    <div className="space-y-4 text-white">
      <PageHeader
        tone="urban"
        eyebrow="Lesmateriaal"
        title="Oefenen buiten de les"
        description="Tips, focusblokken en examenvoorbereiding op basis van je echte voortgang en lesnotities."
        actions={
          <Button asChild className="rounded-full">
            <Link href="/leerling/voortgang">Bekijk voortgang</Link>
          </Button>
        }
      />

      <section className={cardClassName}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="info">Voorbereiding</Badge>
            <h2 className="mt-3 text-2xl font-semibold">
              {nextLesson ? `Voor je les: ${nextLesson.titel}` : "Je volgende focus"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
              {nextLesson
                ? `${nextLesson.datum} om ${nextLesson.tijd}. Neem vooral ophaallocatie, coachnotitie en je laatste focuspunt door.`
                : "Zodra je volgende les gepland staat, verschijnt hier een gerichte voorbereiding per les."}
            </p>
          </div>
          <Badge variant={nextLesson ? "success" : "warning"}>
            {nextLesson ? "Les gepland" : "Nog plannen"}
          </Badge>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className={cardClassName}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Aanbevolen focusmateriaal</h2>
            <Badge variant="info">{focusItems.length} focuspunten</Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {focusItems.length ? (
              focusItems.map((item) => {
                const section = findSectionForSkill(item.key);

                return (
                  <article
                    key={item.key}
                    className="rounded-lg border border-white/10 bg-white/6 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-400/15 text-sky-100">
                        <Target className="size-5" />
                      </span>
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-300">
                          {section?.label ?? item.sectionLabel}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      Oefen bewust op dit onderdeel en vraag je instructeur om
                      dit in de volgende les kort te toetsen.
                    </p>
                  </article>
                );
              })
            ) : (
              <p className="rounded-lg border border-dashed border-white/12 bg-white/4 p-5 text-sm leading-7 text-slate-300">
                Er zijn nog geen beoordeelde onderdelen. De basiskaarten hieronder
                helpen alvast met voorbereiding.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-3">
          <section className={cardClassName}>
            <h3 className="font-semibold">Volgende lesplan</h3>
            <div className="mt-3 space-y-2">
              {nextLessonPlan.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-white/10 bg-white/6 p-3"
                >
                  <Badge variant={item.badge}>{item.badgeLabel}</Badge>
                  <p className="mt-2 font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className={cardClassName}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="success">Scenario-training</Badge>
              <h2 className="mt-3 text-xl font-semibold">
                Realistische oefensituaties
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Scenario&apos;s worden gekozen op basis van je focuspunten,
                lesnotities en leervoorkeuren.
              </p>
            </div>
            <Route className="size-6 text-emerald-200" />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {coaching.scenarioTraining.length ? (
              coaching.scenarioTraining.map((scenario) => (
                <article
                  key={scenario.id}
                  className="rounded-lg border border-white/10 bg-white/6 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge
                        variant={
                          scenario.tone === "success"
                            ? "success"
                            : scenario.tone === "warning"
                              ? "warning"
                              : scenario.tone === "danger"
                                ? "danger"
                                : "info"
                        }
                      >
                        {scenario.badgeLabel}
                      </Badge>
                      <h3 className="mt-3 font-semibold">{scenario.title}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    <span className="font-semibold text-white">Situatie: </span>
                    {scenario.situation}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    <span className="font-semibold text-white">Oefening: </span>
                    {scenario.practice}
                  </p>
                  <p className="mt-3 rounded-lg border border-white/10 bg-slate-950/35 p-3 text-xs leading-5 text-slate-300">
                    Waarom: {scenario.why}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-white/12 bg-white/4 p-5 text-sm leading-7 text-slate-300">
                Scenario&apos;s verschijnen zodra er voortgang of lesfeedback
                beschikbaar is.
              </p>
            )}
          </div>
        </section>

        <aside className={cardClassName}>
          <div className="flex items-start gap-3">
            <SlidersHorizontal className="size-5 text-violet-200" />
            <div>
              <Badge variant="info">Persoonlijk</Badge>
              <h2 className="mt-3 text-xl font-semibold">
                Jouw leerstijl
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Pas aan hoe het systeem materiaal, uitleg en scenario&apos;s
                prioriteert.
              </p>
            </div>
          </div>

          <form
            action={updateLearnerLearningPreferencesFormAction}
            className="mt-5 space-y-4"
          >
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-300 uppercase">
                Leerstijl
              </span>
              <select
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none focus:border-violet-300/60"
                defaultValue={learningPreferences?.leerstijl ?? "praktisch"}
                name="leerstijl"
              >
                <option value="praktisch">Praktisch oefenen</option>
                <option value="visueel">Visueel voorbeeld eerst</option>
                <option value="stap_voor_stap">Stap voor stap</option>
                <option value="examengericht">Examengericht</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-300 uppercase">
                Begeleiding
              </span>
              <select
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none focus:border-violet-300/60"
                defaultValue={learningPreferences?.begeleiding ?? "rustig"}
                name="begeleiding"
              >
                <option value="rustig">Rustig en overzichtelijk</option>
                <option value="direct">Direct en kort</option>
                <option value="motiverend">Motiverend</option>
                <option value="uitgebreid">Uitgebreide uitleg</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-300 uppercase">
                Oefenritme
              </span>
              <select
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none focus:border-violet-300/60"
                defaultValue={learningPreferences?.oefenritme ?? "kort_en_vaker"}
                name="oefenritme"
              >
                <option value="kort_en_vaker">Kort en vaker</option>
                <option value="lange_sessies">Langere sessies</option>
                <option value="vaste_weekroutine">Vaste weekroutine</option>
                <option value="intensief">Intensief richting examen</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-300 uppercase">
                Spanning
              </span>
              <select
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none focus:border-violet-300/60"
                defaultValue={learningPreferences?.spanningsniveau ?? "normaal"}
                name="spanningsniveau"
              >
                <option value="laag">Laag</option>
                <option value="normaal">Normaal</option>
                <option value="hoog">Hoog, graag extra rust</option>
              </select>
            </label>
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold tracking-[0.18em] text-slate-300 uppercase">
                Scenariofocus
              </legend>
              {[
                ["bediening", "Voertuigbediening"],
                ["kijktechniek", "Kijktechniek"],
                ["verkeersdeelname", "Verkeersdeelname"],
                ["examengericht", "Examenvoorbereiding"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/6 px-3 py-2 text-sm text-slate-200"
                >
                  <input
                    defaultChecked={selectedScenarioFocus.has(value)}
                    name="scenario_focus"
                    type="checkbox"
                    value={value}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <PendingSubmitButton
              className="w-full rounded-lg"
              pendingLabel="Opslaan..."
            >
              Leervoorkeuren opslaan
            </PendingSubmitButton>
          </form>
        </aside>
      </div>

      <section className={cardClassName}>
        <h2 className="text-xl font-semibold">Basisbibliotheek</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {baseMaterials.map((item) => (
            <article
              key={item.title}
              className="rounded-lg border border-white/10 bg-white/6 p-4"
            >
              <item.icon className="size-5 text-violet-200" />
              <Badge className="mt-3" variant="default">
                {item.type}
              </Badge>
              <p className="mt-3 font-semibold">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {item.detail}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-emerald-200">
                <CheckCircle2 className="size-4" />
                Altijd beschikbaar
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
