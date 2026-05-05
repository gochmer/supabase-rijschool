"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  BookmarkPlus,
  CheckCircle2,
  FileText,
  Sparkles,
  Target,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveInstructorFeedbackTemplateAction,
  recordInstructorFeedbackTemplateUsageAction,
  saveInstructorFeedbackTemplateAction,
} from "@/lib/actions/instructor-feedback-templates";
import { saveStudentProgressLessonNoteAction } from "@/lib/actions/student-progress";
import { getCoachNoteTemplateTypeMeta } from "@/lib/feedback-template-types";
import {
  getStudentProgressItem,
  getStudentProgressStatusMeta,
} from "@/lib/student-progress";
import type {
  FeedbackTemplateTarget,
  InstructorFeedbackTemplate,
  StudentProgressAssessment,
  StudentProgressLessonNote,
  StudentProgressStatus,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FeedbackTemplate = {
  description?: string | null;
  id?: string;
  key: string;
  label: string;
  noteType?: InstructorFeedbackTemplate["note_type"];
  source?: "context" | "custom" | "default";
  target: FeedbackTemplateTarget;
  text: string;
};

type TemplateContext = {
  label: string;
  status: StudentProgressStatus;
  vaardigheidKey: string;
};

const DEFAULT_FEEDBACK_TEMPLATES: FeedbackTemplate[] = [
  {
    key: "sterk-punt",
    label: "Sterk punt",
    target: "sterkPunt" as const,
    text: "Je keek actief vooruit en bleef rustig bij drukke verkeerssituaties.",
  },
  {
    key: "volgende-les",
    label: "Volgende les oefenen",
    target: "focusVolgendeLes" as const,
    text: "Volgende les oefenen we extra op kijkgedrag, positie op de weg en zelfstandig beslissen bij kruispunten.",
  },
  {
    key: "examenfocus",
    label: "Examenfocus",
    target: "focusVolgendeLes" as const,
    text: "Examenfocus: vaste routines vasthouden, zelfstandig navigeren en bijzondere verrichtingen onder lichte druk uitvoeren.",
  },
];

const STATUS_TEMPLATE_PRIORITY: Record<StudentProgressStatus, number> = {
  herhaling: 0,
  uitleg: 1,
  begeleid: 2,
  zelfstandig: 3,
};

function getAssessmentPriority(assessment: StudentProgressAssessment) {
  return STATUS_TEMPLATE_PRIORITY[assessment.status] ?? 4;
}

function getPrimaryAssessment(assessments: StudentProgressAssessment[]) {
  return [...assessments].sort((left, right) => {
    const priorityDifference =
      getAssessmentPriority(left) - getAssessmentPriority(right);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const rightDate = new Date(
      right.beoordelings_datum || right.created_at,
    ).getTime();
    const leftDate = new Date(
      left.beoordelings_datum || left.created_at,
    ).getTime();

    return rightDate - leftDate;
  })[0];
}

function getSkillTone({
  skillKey,
  skillLabel,
}: {
  skillKey: string;
  skillLabel: string;
}) {
  const normalizedKey = skillKey.toLowerCase();
  const normalizedLabel = skillLabel.toLowerCase();

  if (normalizedKey.includes("parkeren") || normalizedKey.includes("manoeuvre")) {
    return {
      focus:
        "Volgende les oefenen we deze manoeuvre stap voor stap: positie kiezen, rustig sturen, rondom blijven kijken en zelfstandig afronden.",
      strength:
        "Je voorbereiding op de manoeuvre werd rustiger: positie kiezen, tempo laag houden en blijven kijken ging zichtbaar beter.",
    };
  }

  if (normalizedKey.includes("kijk") || normalizedLabel.includes("kijk")) {
    return {
      focus:
        "Volgende les letten we extra op kijkgedrag: vroeg scannen, binnenspiegel-buitenspiegel-schouder gebruiken en daarna pas beslissen.",
      strength:
        "Je keek vaker op tijd vooruit en gebruikte de spiegels bewuster voordat je een keuze maakte.",
    };
  }

  if (
    normalizedKey.includes("kruispunt") ||
    normalizedKey.includes("voorrang") ||
    normalizedLabel.includes("kruispunt") ||
    normalizedLabel.includes("voorrang")
  ) {
    return {
      focus:
        "Volgende les oefenen we kruispunten en voorrang met een vaste routine: snelheid eruit, overzicht maken, keuze hardop voorbereiden.",
      strength:
        "Je nam meer tijd om het kruispunt te lezen en maakte je keuzes rustiger.",
    };
  }

  if (
    normalizedKey.includes("route") ||
    normalizedKey.includes("examen") ||
    normalizedLabel.includes("route") ||
    normalizedLabel.includes("examen")
  ) {
    return {
      focus:
        "Volgende les rijden we meer zelfstandig met examenfocus: route vasthouden, fouten herstellen en rustig blijven onder lichte druk.",
      strength:
        "Je bleef beter in je ritme en herstelde kleine fouten sneller zonder de controle kwijt te raken.",
    };
  }

  return {
    focus: `Volgende les oefenen we gericht op ${normalizedLabel}: eerst rustig herhalen, daarna zelfstandiger toepassen in echte verkeerssituaties.`,
    strength: `Je liet vooruitgang zien bij ${normalizedLabel}: de basis wordt herkenbaarder en je pakt aanwijzingen sneller op.`,
  };
}

function isTemplateMatch(
  template: InstructorFeedbackTemplate,
  context: TemplateContext | null,
) {
  if (!context) {
    return !template.vaardigheid_key && !template.status;
  }

  const skillMatches =
    !template.vaardigheid_key ||
    template.vaardigheid_key === context.vaardigheidKey;
  const statusMatches = !template.status || template.status === context.status;

  return skillMatches && statusMatches;
}

function mapCustomTemplate(template: InstructorFeedbackTemplate): FeedbackTemplate {
  return {
    description: template.omschrijving,
    id: template.id,
    key: `custom-${template.id}`,
    label: template.label,
    noteType: template.note_type,
    source: "custom",
    target: template.target,
    text: template.tekst,
  };
}

function buildContextualTemplates({
  assessments,
  customTemplates,
}: {
  assessments: StudentProgressAssessment[];
  customTemplates: InstructorFeedbackTemplate[];
}): {
  context: TemplateContext | null;
  label: string | null;
  templates: FeedbackTemplate[];
} {
  const primaryAssessment = getPrimaryAssessment(assessments);

  if (!primaryAssessment) {
    const matchingCustomTemplates = customTemplates
      .filter((template) => template.actief && isTemplateMatch(template, null))
      .map(mapCustomTemplate);

    return {
      context: null,
      label: null,
      templates: [...matchingCustomTemplates, ...DEFAULT_FEEDBACK_TEMPLATES],
    };
  }

  const item = getStudentProgressItem(primaryAssessment.vaardigheid_key);
  const status = getStudentProgressStatusMeta(primaryAssessment.status);
  const skillLabel = item?.label ?? "de gekozen vaardigheid";
  const context = {
    label: `${skillLabel} - ${status.label}`,
    status: primaryAssessment.status,
    vaardigheidKey: primaryAssessment.vaardigheid_key,
  };
  const skillTone = getSkillTone({
    skillKey: primaryAssessment.vaardigheid_key,
    skillLabel,
  });
  const matchingCustomTemplates = customTemplates
    .filter((template) => template.actief && isTemplateMatch(template, context))
    .map(mapCustomTemplate);
  const statusTemplate: FeedbackTemplate =
    primaryAssessment.status === "zelfstandig"
      ? {
          key: `context-${primaryAssessment.vaardigheid_key}-zelfstandig`,
          label: "Zelfstandig sterk",
          source: "context",
          target: "sterkPunt",
          text: skillTone.strength,
        }
      : primaryAssessment.status === "begeleid"
        ? {
            key: `context-${primaryAssessment.vaardigheid_key}-begeleid`,
            label: "Van hulp naar zelfstandig",
            source: "context",
            target: "focusVolgendeLes",
            text: `${skillTone.focus} We bouwen de hulp stap voor stap af, zodat de leerling vaker zelf de juiste keuze maakt.`,
          }
        : {
            key: `context-${primaryAssessment.vaardigheid_key}-herhalen`,
            label: "Gericht herhalen",
            source: "context",
            target: "focusVolgendeLes",
            text: skillTone.focus,
          };

  return {
    context,
    label: context.label,
    templates: [
      ...matchingCustomTemplates,
      {
        key: `context-${primaryAssessment.vaardigheid_key}-samenvatting`,
        label: "Slimme reflectie",
        source: "context",
        target: "samenvatting" as const,
        text: `Vandaag stond ${skillLabel.toLowerCase()} centraal. We hebben bekeken wat al stabiel gaat en welke stap nodig is richting ${status.label.toLowerCase()}.`,
      },
      statusTemplate,
      ...DEFAULT_FEEDBACK_TEMPLATES,
    ],
  };
}

function appendTemplate(current: string, template: string) {
  const trimmedCurrent = current.trim();

  return trimmedCurrent ? `${trimmedCurrent}\n${template}` : template;
}

function getFeedbackQuality({
  focusVolgendeLes,
  samenvatting,
  sterkPunt,
}: {
  focusVolgendeLes: string;
  samenvatting: string;
  sterkPunt: string;
}) {
  const summaryLength = samenvatting.trim().length;
  const strengthLength = sterkPunt.trim().length;
  const focusLength = focusVolgendeLes.trim().length;
  const warnings: string[] = [];

  if (summaryLength === 0) {
    warnings.push("Voeg een korte lesreflectie toe.");
  } else if (summaryLength < 35) {
    warnings.push("Maak de lesreflectie iets concreter.");
  }

  if (strengthLength === 0) {
    warnings.push("Noem minimaal een sterk punt.");
  } else if (strengthLength < 18) {
    warnings.push("Maak het sterke punt specifieker.");
  }

  if (focusLength === 0) {
    warnings.push("Zet een focus voor de volgende les klaar.");
  } else if (focusLength < 25) {
    warnings.push("Maak de focus voor de volgende les concreter.");
  }

  const filledParts = [summaryLength, strengthLength, focusLength].filter(
    (length) => length > 0,
  ).length;
  const score = Math.min(
    100,
    Math.round(
      (Math.min(summaryLength, 90) / 90) * 35 +
        (Math.min(strengthLength, 60) / 60) * 25 +
        (Math.min(focusLength, 80) / 80) * 35 +
        (filledParts / 3) * 5,
    ),
  );

  return {
    score,
    tone:
      warnings.length === 0
        ? ("success" as const)
        : filledParts >= 2
          ? ("warning" as const)
          : ("danger" as const),
    warnings,
  };
}

export function StudentProgressLessonNoteEditor({
  leerlingId,
  lesId = null,
  lesdatum,
  note,
  title = "Coachnotitie",
  compact = false,
  contextAssessments = [],
  customTemplates = [],
  onSaved,
}: {
  leerlingId: string;
  lesId?: string | null;
  lesdatum: string;
  note?: StudentProgressLessonNote | null;
  title?: string;
  compact?: boolean;
  contextAssessments?: StudentProgressAssessment[];
  customTemplates?: InstructorFeedbackTemplate[];
  onSaved?: (nextNote: StudentProgressLessonNote | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isTemplatePending, startTemplateTransition] = useTransition();
  const [samenvatting, setSamenvatting] = useState(note?.samenvatting ?? "");
  const [sterkPunt, setSterkPunt] = useState(note?.sterk_punt ?? "");
  const [focusVolgendeLes, setFocusVolgendeLes] = useState(
    note?.focus_volgende_les ?? ""
  );
  const [templateLabel, setTemplateLabel] = useState("");
  const [savedTemplates, setSavedTemplates] = useState(customTemplates);
  const feedbackQuality = useMemo(
    () =>
      getFeedbackQuality({
        focusVolgendeLes,
        samenvatting,
        sterkPunt,
      }),
    [focusVolgendeLes, samenvatting, sterkPunt],
  );
  const templateContext = useMemo(
    () =>
      buildContextualTemplates({
        assessments: contextAssessments,
        customTemplates: savedTemplates,
      }),
    [contextAssessments, savedTemplates],
  );

  function applyTemplate(template: FeedbackTemplate) {
    if (template.target === "samenvatting") {
      setSamenvatting((current) => appendTemplate(current, template.text));
    } else if (template.target === "sterkPunt") {
      setSterkPunt((current) => appendTemplate(current, template.text));
    } else {
      setFocusVolgendeLes((current) => appendTemplate(current, template.text));
    }

    if (template.source === "custom" && template.id) {
      const templateId = template.id;

      startTemplateTransition(async () => {
        const result = await recordInstructorFeedbackTemplateUsageAction({
          id: templateId,
        });

        if (result.success && result.template) {
          setSavedTemplates((current) =>
            current.map((savedTemplate) =>
              savedTemplate.id === result.template.id
                ? result.template
                : savedTemplate,
            ),
          );
        }
      });
    }
  }

  function getTextForTemplateTarget(target: FeedbackTemplateTarget) {
    if (target === "samenvatting") {
      return samenvatting;
    }

    if (target === "sterkPunt") {
      return sterkPunt;
    }

    return focusVolgendeLes;
  }

  function getTemplateTargetLabel(target: FeedbackTemplateTarget) {
    if (target === "samenvatting") {
      return "Reflectie";
    }

    if (target === "sterkPunt") {
      return "Sterk punt";
    }

    return "Focus";
  }

  function inferNoteTypeForTarget(target: FeedbackTemplateTarget) {
    if (templateContext.label?.toLowerCase().includes("examen")) {
      return "examenvoorbereiding";
    }

    if (target === "samenvatting") {
      return "voortgangsnotitie";
    }

    if (target === "focusVolgendeLes") {
      return "aandachtspunt";
    }

    return "lesfeedback";
  }

  function handleSaveTemplate(target: FeedbackTemplateTarget) {
    const tekst = getTextForTemplateTarget(target).trim();

    if (tekst.length < 12) {
      toast.warning("Template is nog te kort", {
        description: "Vul eerst een concrete zin in voor dit veld.",
      });
      return;
    }

    startTemplateTransition(async () => {
      const result = await saveInstructorFeedbackTemplateAction({
        label:
          templateLabel ||
          `${getTemplateTargetLabel(target)}${
            templateContext.label ? ` - ${templateContext.label}` : ""
          }`,
        noteType: inferNoteTypeForTarget(target),
        omschrijving: templateContext.label
          ? `Eigen template voor ${templateContext.label}.`
          : "Eigen algemene coachtemplate.",
        status: templateContext.context?.status ?? null,
        target,
        tekst,
        vaardigheidKey: templateContext.context?.vaardigheidKey ?? null,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      if (result.template) {
        setSavedTemplates((current) => [result.template, ...current]);
      }

      setTemplateLabel("");
      toast.success(result.message);
    });
  }

  function handleArchiveTemplate(template: FeedbackTemplate) {
    if (!template.id) {
      return;
    }

    const templateId = template.id;

    startTemplateTransition(async () => {
      const result = await archiveInstructorFeedbackTemplateAction({
        id: templateId,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setSavedTemplates((current) =>
        current.filter((savedTemplate) => savedTemplate.id !== templateId),
      );
      toast.success(result.message);
    });
  }

  function handleSave() {
    startTransition(async () => {
      if (feedbackQuality.warnings.length) {
        toast.warning("Feedback kan sterker", {
          description: feedbackQuality.warnings[0],
        });
      }

      const result = await saveStudentProgressLessonNoteAction({
        leerlingId,
        lesId,
        lesdatum,
        samenvatting,
        sterkPunt,
        focusVolgendeLes,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      onSaved?.(
        samenvatting || sterkPunt || focusVolgendeLes
          ? {
              id: note?.id ?? `local-note-${leerlingId}-${lesdatum}`,
              leerling_id: leerlingId,
              instructeur_id: note?.instructeur_id ?? "local",
              les_id: lesId,
              lesdatum,
              samenvatting: samenvatting || null,
              sterk_punt: sterkPunt || null,
              focus_volgende_les: focusVolgendeLes || null,
              created_at: note?.created_at ?? new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : null
      );

      toast.success(result.message);
    });
  }

  const fieldClassName =
    "min-h-24 rounded-[1rem] border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500";
  const wrapperClassName = compact ? "space-y-2.5" : "space-y-3";

  return (
    <div className={wrapperClassName}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h3>
          <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
            Leg kort vast wat er goed ging en wat de focus voor de volgende les is.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={handleSave}
          className="h-9 rounded-full text-[12px]"
        >
          {isPending ? "Opslaan..." : "Opslaan"}
        </Button>
      </div>

      <div
        className={cn(
          "rounded-[1rem] border p-3",
          feedbackQuality.tone === "success"
            ? "border-emerald-300/25 bg-emerald-400/10"
            : feedbackQuality.tone === "warning"
              ? "border-amber-300/30 bg-amber-400/10"
              : "border-rose-300/25 bg-rose-400/10",
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {feedbackQuality.tone === "success" ? (
                <CheckCircle2 className="size-4 text-emerald-500 dark:text-emerald-300" />
              ) : (
                <AlertTriangle className="size-4 text-amber-500 dark:text-amber-300" />
              )}
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Feedbackkwaliteit
              </p>
              <Badge
                variant={
                  feedbackQuality.tone === "success"
                    ? "success"
                    : feedbackQuality.tone === "warning"
                      ? "warning"
                      : "danger"
                }
              >
                {feedbackQuality.score}%
              </Badge>
            </div>
            <p className="mt-1 text-[12px] leading-5 text-slate-600 dark:text-slate-300">
              {feedbackQuality.warnings.length
                ? feedbackQuality.warnings.join(" ")
                : "Mooi compleet: leerling ziet wat goed ging en waar de volgende les op stuurt."}
            </p>
            {templateContext.label ? (
              <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                Slimme templates op basis van{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {templateContext.label}
                </span>
                .
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {templateContext.templates.map((template) => (
              <span
                key={template.key}
                className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/70 dark:bg-white/7"
                title={
                  template.noteType
                    ? `${getCoachNoteTemplateTypeMeta(template.noteType).label}${
                        template.description ? ` - ${template.description}` : ""
                      }`
                    : undefined
                }
              >
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => applyTemplate(template)}
                  className="h-8 rounded-none px-2.5 text-[11px]"
                >
                  <WandSparkles className="size-3.5" />
                  {template.source === "custom" && template.noteType
                    ? `${getCoachNoteTemplateTypeMeta(template.noteType).shortLabel}: `
                    : template.source === "custom"
                      ? "Eigen: "
                      : ""}
                  {template.label}
                </Button>
                {template.source === "custom" && template.id ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={isTemplatePending}
                    onClick={() => handleArchiveTemplate(template)}
                    className="h-8 w-8 rounded-none border-l border-white/10 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-300"
                    aria-label={`Verwijder template ${template.label}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor={`samenvatting-${leerlingId}-${lesdatum}`}
          className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
        >
          <FileText className="size-3.5" />
          Lesreflectie
        </Label>
        <Textarea
          id={`samenvatting-${leerlingId}-${lesdatum}`}
          value={samenvatting}
          onChange={(event) => setSamenvatting(event.target.value)}
          placeholder="Beschrijf kort hoe de les verliep, wat opviel en wat nog niet stabiel genoeg was."
          className={fieldClassName}
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor={`sterkpunt-${leerlingId}-${lesdatum}`}
          className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
        >
          <Sparkles className="size-3.5" />
          Sterk punt
        </Label>
        <Textarea
          id={`sterkpunt-${leerlingId}-${lesdatum}`}
          value={sterkPunt}
          onChange={(event) => setSterkPunt(event.target.value)}
          placeholder="Wat deed de leerling vandaag zichtbaar goed?"
          className="min-h-20 rounded-[1rem] border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor={`focus-${leerlingId}-${lesdatum}`}
          className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
        >
          <Target className="size-3.5" />
          Focus volgende les
        </Label>
        <Textarea
          id={`focus-${leerlingId}-${lesdatum}`}
          value={focusVolgendeLes}
          onChange={(event) => setFocusVolgendeLes(event.target.value)}
          placeholder="Welke onderdelen of verkeerssituaties krijgen de volgende les prioriteit?"
          className="min-h-20 rounded-[1rem] border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
        />
      </div>

      <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.035]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label
              htmlFor={`template-label-${leerlingId}-${lesdatum}`}
              className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
            >
              <BookmarkPlus className="size-3.5" />
              Bewaar als eigen template
            </Label>
            <Input
              id={`template-label-${leerlingId}-${lesdatum}`}
              value={templateLabel}
              onChange={(event) => setTemplateLabel(event.target.value)}
              placeholder={
                templateContext.label
                  ? `Naam voor ${templateContext.label}`
                  : "Naam voor algemene feedbacktemplate"
              }
              className="h-9 rounded-full border-slate-200 bg-white text-sm dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["samenvatting", "sterkPunt", "focusVolgendeLes"] as const).map(
              (target) => (
                <Button
                  key={target}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isTemplatePending}
                  onClick={() => handleSaveTemplate(target)}
                  className="h-9 rounded-full border-white/10 px-3 text-[11px]"
                >
                  {getTemplateTargetLabel(target)} opslaan
                </Button>
              ),
            )}
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
          Templates worden gekoppeld aan de huidige skill/status wanneer die
          bekend is. Zonder context blijven ze algemeen beschikbaar.
        </p>
      </div>
    </div>
  );
}
