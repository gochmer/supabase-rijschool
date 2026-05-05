"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  Archive,
  BookmarkPlus,
  Clock3,
  Copy,
  Lightbulb,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveInstructorFeedbackTemplateAction,
  deleteInstructorFeedbackTemplateAction,
  duplicateInstructorFeedbackTemplateAction,
  reorderInstructorFeedbackTemplatesAction,
  saveInstructorFeedbackTemplateAction,
  updateInstructorFeedbackTemplateAction,
} from "@/lib/actions/instructor-feedback-templates";
import {
  COACH_NOTE_TEMPLATE_TYPE_OPTIONS,
  getCoachNoteTemplateTypeMeta,
} from "@/lib/feedback-template-types";
import {
  STUDENT_PROGRESS_SECTIONS,
  STUDENT_PROGRESS_STATUS_OPTIONS,
  getStudentProgressItem,
  getStudentProgressStatusMeta,
} from "@/lib/student-progress";
import type {
  CoachNoteTemplateType,
  FeedbackTemplateTarget,
  InstructorFeedbackTemplate,
  StudentProgressStatus,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type DraftTemplate = {
  id: string | null;
  label: string;
  noteType: CoachNoteTemplateType;
  omschrijving: string;
  sortOrder: number;
  status: StudentProgressStatus | null;
  target: FeedbackTemplateTarget;
  tekst: string;
  vaardigheidKey: string | null;
};

const targetOptions: Array<{
  label: string;
  value: FeedbackTemplateTarget;
}> = [
  { label: "Lesreflectie", value: "samenvatting" },
  { label: "Sterk punt", value: "sterkPunt" },
  { label: "Focus volgende les", value: "focusVolgendeLes" },
];

const emptyDraft: DraftTemplate = {
  id: null,
  label: "",
  noteType: "algemene_begeleiding",
  omschrijving: "",
  sortOrder: 100,
  status: null,
  target: "focusVolgendeLes",
  tekst: "",
  vaardigheidKey: null,
};

function getTargetLabel(target: FeedbackTemplateTarget) {
  return (
    targetOptions.find((option) => option.value === target)?.label ??
    "Feedback"
  );
}

function normalizeTemplates(templates: InstructorFeedbackTemplate[]) {
  return [...templates].sort((left, right) => {
    const orderDifference = left.sort_order - right.sort_order;

    if (orderDifference !== 0) {
      return orderDifference;
    }

    return right.created_at.localeCompare(left.created_at);
  });
}

function toDraft(template: InstructorFeedbackTemplate): DraftTemplate {
  return {
    id: template.id,
    label: template.label,
    noteType: template.note_type,
    omschrijving: template.omschrijving ?? "",
    sortOrder: template.sort_order,
    status: template.status ?? null,
    target: template.target,
    tekst: template.tekst,
    vaardigheidKey: template.vaardigheid_key ?? null,
  };
}

type TemplateRecommendation = {
  action: "archive" | "edit" | "promote";
  detail: string;
  label: string;
  template: InstructorFeedbackTemplate;
  tone: "info" | "success" | "warning";
};

function formatLastUsed(value: string | null | undefined) {
  if (!value) {
    return "Nog niet gebruikt";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getUsageAdvice(template: InstructorFeedbackTemplate) {
  const usageCount = template.usage_count ?? 0;

  if (usageCount >= 10) {
    return {
      label: "Werkt goed",
      tone: "success" as const,
    };
  }

  if (usageCount >= 3) {
    return {
      label: "Wordt gebruikt",
      tone: "info" as const,
    };
  }

  if (usageCount === 0) {
    return {
      label: "Nog testen",
      tone: "warning" as const,
    };
  }

  return {
    label: "Nieuw signaal",
    tone: "default" as const,
  };
}

function getTemplateRecommendations(
  templates: InstructorFeedbackTemplate[],
): TemplateRecommendation[] {
  const orderedTemplates = normalizeTemplates(templates);
  const recommendations: TemplateRecommendation[] = [];

  for (const [index, template] of orderedTemplates.entries()) {
    const usageCount = template.usage_count ?? 0;
    const noteType = getCoachNoteTemplateTypeMeta(template.note_type);

    if (usageCount >= 5 && index > 0) {
      recommendations.push({
        action: "promote",
        detail: `${usageCount} keer gebruikt als ${noteType.label}. Zet hem hoger zodat coaches hem sneller vinden.`,
        label: "Zet vaker gebruikte template bovenaan",
        template,
        tone: "success",
      });
    } else if (usageCount === 0) {
      recommendations.push({
        action: "archive",
        detail: "Deze template is nog nooit gebruikt. Test hem in de feedbackflow of archiveer hem.",
        label: "Ongebruikte template",
        template,
        tone: "warning",
      });
    } else if (template.tekst.length > 260) {
      recommendations.push({
        action: "edit",
        detail: "Deze tekst is vrij lang. Kortere templates zijn sneller bruikbaar tijdens een coachgesprek.",
        label: "Maak template korter",
        template,
        tone: "info",
      });
    } else if (!template.omschrijving) {
      recommendations.push({
        action: "edit",
        detail: `Voeg een korte uitleg toe wanneer coaches deze ${noteType.label.toLowerCase()} gebruiken.`,
        label: "Omschrijving ontbreekt",
        template,
        tone: "info",
      });
    }
  }

  return recommendations.slice(0, 4);
}

export function InstructorFeedbackTemplateManager({
  templates,
}: {
  templates: InstructorFeedbackTemplate[];
}) {
  const [items, setItems] = useState(() => normalizeTemplates(templates));
  const [draft, setDraft] = useState<DraftTemplate>(emptyDraft);
  const [query, setQuery] = useState("");
  const [noteTypeFilter, setNoteTypeFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const skillOptions = useMemo(
    () =>
      STUDENT_PROGRESS_SECTIONS.flatMap((section) =>
        section.items.map((item) => ({
          label: item.label,
          section: section.shortLabel,
          value: item.key,
        })),
      ),
    [],
  );
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((template) => {
      const skill = template.vaardigheid_key
        ? getStudentProgressItem(template.vaardigheid_key)
        : null;
      const status = template.status
        ? getStudentProgressStatusMeta(template.status)
        : null;
      const noteType = getCoachNoteTemplateTypeMeta(template.note_type);
      const searchable = [
        template.label,
        template.omschrijving,
        template.tekst,
        getTargetLabel(template.target),
        noteType.label,
        noteType.shortLabel,
        skill?.label,
        status?.label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesTarget =
        targetFilter === "all" || template.target === targetFilter;
      const matchesNoteType =
        noteTypeFilter === "all" || template.note_type === noteTypeFilter;
      const matchesScope =
        scopeFilter === "all" ||
        (scopeFilter === "general" &&
          !template.vaardigheid_key &&
          !template.status) ||
        (scopeFilter === "context" &&
          Boolean(template.vaardigheid_key || template.status));

      return matchesQuery && matchesTarget && matchesNoteType && matchesScope;
    });
  }, [items, noteTypeFilter, query, scopeFilter, targetFilter]);
  const generalTemplates = items.filter(
    (template) => !template.vaardigheid_key && !template.status,
  ).length;
  const contextualTemplates = items.length - generalTemplates;
  const totalUsageCount = items.reduce(
    (total, template) => total + (template.usage_count ?? 0),
    0,
  );
  const unusedTemplates = items.filter(
    (template) => (template.usage_count ?? 0) === 0,
  ).length;
  const bestTemplate = [...items].sort(
    (left, right) => (right.usage_count ?? 0) - (left.usage_count ?? 0),
  )[0];
  const usedNoteTypes = new Set(items.map((template) => template.note_type)).size;
  const recommendations = useMemo(
    () => getTemplateRecommendations(items),
    [items],
  );

  function updateDraft(nextDraft: Partial<DraftTemplate>) {
    setDraft((current) => ({
      ...current,
      ...nextDraft,
    }));
  }

  function handleNewTemplate() {
    setDraft({
      ...emptyDraft,
      sortOrder: (items.length + 1) * 10,
    });
  }

  function handleEditTemplate(template: InstructorFeedbackTemplate) {
    setDraft(toDraft(template));
  }

  function handleSaveTemplate() {
    startTransition(async () => {
      const payload = {
        label: draft.label,
        noteType: draft.noteType,
        omschrijving: draft.omschrijving,
        sortOrder: draft.sortOrder,
        status: draft.status,
        target: draft.target,
        tekst: draft.tekst,
        vaardigheidKey: draft.vaardigheidKey,
      };
      const result = draft.id
        ? await updateInstructorFeedbackTemplateAction({
            id: draft.id,
            ...payload,
          })
        : await saveInstructorFeedbackTemplateAction(payload);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      if (result.template) {
        setItems((current) => {
          const exists = current.some((item) => item.id === result.template.id);
          const next = exists
            ? current.map((item) =>
                item.id === result.template.id ? result.template : item,
              )
            : [result.template, ...current];

          return normalizeTemplates(next);
        });
        setDraft(toDraft(result.template));
      }

      toast.success(result.message);
    });
  }

  function handleArchiveTemplate(template: InstructorFeedbackTemplate) {
    startTransition(async () => {
      const result = await archiveInstructorFeedbackTemplateAction({
        id: template.id,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setItems((current) => current.filter((item) => item.id !== template.id));

      if (draft.id === template.id) {
        setDraft(emptyDraft);
      }

      toast.success(result.message);
    });
  }

  function handleDeleteTemplate(template: InstructorFeedbackTemplate) {
    startTransition(async () => {
      const result = await deleteInstructorFeedbackTemplateAction({
        id: template.id,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setItems((current) => current.filter((item) => item.id !== template.id));

      if (draft.id === template.id) {
        setDraft(emptyDraft);
      }

      toast.success(result.message);
    });
  }

  function handleDuplicateTemplate(template: InstructorFeedbackTemplate) {
    startTransition(async () => {
      const result = await duplicateInstructorFeedbackTemplateAction({
        id: template.id,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      if (result.template) {
        setItems((current) => normalizeTemplates([result.template, ...current]));
        setDraft(toDraft(result.template));
      }

      toast.success(result.message);
    });
  }

  function handlePromoteTemplate(template: InstructorFeedbackTemplate) {
    const sorted = normalizeTemplates(items);
    const currentIndex = sorted.findIndex((item) => item.id === template.id);

    if (currentIndex <= 0) {
      return;
    }

    const reordered = [
      sorted[currentIndex],
      ...sorted.filter((item) => item.id !== template.id),
    ];
    const nextItems = reordered.map((item, index) => ({
      ...item,
      sort_order: (index + 1) * 10,
    }));
    const previousItems = items;

    setItems(nextItems);

    startTransition(async () => {
      const result = await reorderInstructorFeedbackTemplatesAction({
        items: nextItems.map((item) => ({
          id: item.id,
          sortOrder: item.sort_order,
        })),
      });

      if (!result.success) {
        setItems(previousItems);
        toast.error(result.message);
        return;
      }

      toast.success("Template bovenaan gezet.");
    });
  }

  function handleMoveTemplate(template: InstructorFeedbackTemplate, offset: -1 | 1) {
    const sorted = normalizeTemplates(items);
    const currentIndex = sorted.findIndex((item) => item.id === template.id);
    const nextIndex = currentIndex + offset;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sorted.length) {
      return;
    }

    const reordered = [...sorted];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, moved);
    const nextItems = reordered.map((item, index) => ({
      ...item,
      sort_order: (index + 1) * 10,
    }));
    const previousItems = items;

    setItems(nextItems);

    if (draft.id) {
      const nextDraftTemplate = nextItems.find((item) => item.id === draft.id);

      if (nextDraftTemplate) {
        setDraft(toDraft(nextDraftTemplate));
      }
    }

    startTransition(async () => {
      const result = await reorderInstructorFeedbackTemplatesAction({
        items: nextItems.map((item) => ({
          id: item.id,
          sortOrder: item.sort_order,
        })),
      });

      if (!result.success) {
        setItems(previousItems);
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  }

  return (
    <Card className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Feedbacktemplatebibliotheek</CardTitle>
            <CardDescription>
              Beheer je eigen feedbackzinnen per skill/status of maak een
              algemene rijschoolstandaard die overal beschikbaar is.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={handleNewTemplate}
            className="h-9 rounded-full"
          >
            <Plus className="size-4" />
            Nieuwe template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-5">
          {[
            {
              label: "Totaal",
              value: items.length,
              detail: "actieve templates",
            },
            {
              label: "Algemeen",
              value: generalTemplates,
              detail: "rijschoolstandaard",
            },
            {
              label: "Types",
              value: usedNoteTypes,
              detail: "coachnotitie soorten",
            },
            {
              label: "Slim gekoppeld",
              value: contextualTemplates,
              detail: "skill/status templates",
            },
            {
              label: "Gebruik",
              value: totalUsageCount,
              detail: unusedTemplates
                ? `${unusedTemplates} nog niet gebruikt`
                : "alle templates actief",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[1rem] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-[1.1rem] border border-sky-200/80 bg-sky-50/90 p-4 dark:border-sky-400/20 dark:bg-sky-500/10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-100">
                <Sparkles className="size-4" />
              </div>
              <div>
                <p className="font-semibold text-sky-950 dark:text-sky-50">
                  Template-inzicht
                </p>
                <p className="mt-1 text-sm leading-6 text-sky-900/80 dark:text-sky-100/80">
                  {bestTemplate && (bestTemplate.usage_count ?? 0) > 0
                    ? `"${bestTemplate.label}" is nu je sterkste template met ${bestTemplate.usage_count} keer gebruik.`
                    : "Gebruik templates in de feedbackflow; daarna zie je hier vanzelf welke zinnen echt werken."}
                </p>
              </div>
            </div>
            <Badge variant={unusedTemplates ? "warning" : "success"}>
              {unusedTemplates
                ? `${unusedTemplates} ongebruikt`
                : "Alles heeft data"}
            </Badge>
          </div>
        </div>

        {recommendations.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {recommendations.map((recommendation) => (
              <div
                key={`${recommendation.label}-${recommendation.template.id}`}
                className={cn(
                  "rounded-[1.1rem] border p-4",
                  recommendation.tone === "success"
                    ? "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10"
                    : recommendation.tone === "warning"
                      ? "border-amber-200/80 bg-amber-50/90 dark:border-amber-400/20 dark:bg-amber-500/10"
                      : "border-sky-200/80 bg-sky-50/90 dark:border-sky-400/20 dark:bg-sky-500/10",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-slate-800 dark:bg-white/10 dark:text-white">
                    <Lightbulb className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {recommendation.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                      {recommendation.detail}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge variant="default">
                        {recommendation.template.label}
                      </Badge>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => {
                          if (recommendation.action === "promote") {
                            handlePromoteTemplate(recommendation.template);
                            return;
                          }

                          if (recommendation.action === "archive") {
                            handleArchiveTemplate(recommendation.template);
                            return;
                          }

                          handleEditTemplate(recommendation.template);
                        }}
                      >
                        {recommendation.action === "promote"
                          ? "Zet bovenaan"
                          : recommendation.action === "archive"
                            ? "Archiveer"
                            : "Bewerk"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[0.98fr_1.02fr]">
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Zoek template, skill of tekst..."
                  className="h-10 rounded-full border-slate-200 bg-white pl-9 dark:border-white/10 dark:bg-white/5"
                />
              </div>
              <Select value={targetFilter} onValueChange={setTargetFilter}>
                <SelectTrigger className="h-10 min-w-40 rounded-full border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                  <SelectValue placeholder="Veld" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle velden</SelectItem>
                  {targetOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={noteTypeFilter} onValueChange={setNoteTypeFilter}>
                <SelectTrigger className="h-10 min-w-48 rounded-full border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle notitietypes</SelectItem>
                  {COACH_NOTE_TEMPLATE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="h-10 min-w-44 rounded-full border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alles</SelectItem>
                  <SelectItem value="general">Algemeen</SelectItem>
                  <SelectItem value="context">Skill/status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {filteredItems.length ? (
                filteredItems.map((template) => {
                  const skill = template.vaardigheid_key
                    ? getStudentProgressItem(template.vaardigheid_key)
                    : null;
                  const status = template.status
                    ? getStudentProgressStatusMeta(template.status)
                    : null;
                  const noteType = getCoachNoteTemplateTypeMeta(
                    template.note_type,
                  );
                  const isSelected = draft.id === template.id;
                  const usageAdvice = getUsageAdvice(template);

                  return (
                    <div
                      key={template.id}
                      className={cn(
                        "rounded-[1.1rem] border p-3 transition",
                        isSelected
                          ? "border-sky-300/70 bg-sky-50/90 dark:border-sky-300/30 dark:bg-sky-500/10"
                          : "border-slate-200/80 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.035]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => handleEditTemplate(template)}
                          className="min-w-0 text-left"
                        >
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                            {template.label}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                            {template.omschrijving || template.tekst}
                          </p>
                        </button>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => handleMoveTemplate(template, -1)}
                            aria-label={`${template.label} omhoog`}
                          >
                            <ArrowUp className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => handleMoveTemplate(template, 1)}
                            aria-label={`${template.label} omlaag`}
                          >
                            <ArrowDown className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleEditTemplate(template)}
                            aria-label={`${template.label} bewerken`}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => handleDuplicateTemplate(template)}
                            aria-label={`${template.label} dupliceren`}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => handleArchiveTemplate(template)}
                            aria-label={`${template.label} archiveren`}
                          >
                            <Archive className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Badge variant="info">{getTargetLabel(template.target)}</Badge>
                        <Badge variant="info">{noteType.label}</Badge>
                        <Badge variant={skill ? "success" : "default"}>
                          {skill?.label ?? "Algemeen / rijschool"}
                        </Badge>
                        {status ? (
                          <Badge variant="warning">{status.label}</Badge>
                        ) : (
                          <Badge variant="default">Alle statussen</Badge>
                        )}
                        <Badge variant={usageAdvice.tone}>
                          {usageAdvice.label}
                        </Badge>
                        <Badge variant="default">
                          {template.usage_count ?? 0}x gebruikt
                        </Badge>
                        <Badge variant="default">
                          <Clock3 className="size-3" />
                          {formatLastUsed(template.last_used_at)}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[1.1rem] border border-dashed border-slate-300 bg-slate-50/80 p-5 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Geen templates gevonden. Maak rechts een eerste template of
                  pas je filters aan.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/[0.045]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookmarkPlus className="size-4 text-sky-500 dark:text-sky-300" />
                  <h3 className="font-semibold text-slate-950 dark:text-white">
                    {draft.id ? "Template bewerken" : "Nieuwe template"}
                  </h3>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Zonder skill en status wordt dit een algemene
                  rijschoolstandaard voor elke feedbackflow.
                </p>
              </div>
              {draft.id ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    const template = items.find((item) => item.id === draft.id);

                    if (template) {
                      handleArchiveTemplate(template);
                    }
                  }}
                >
                  <Archive className="size-3.5" />
                  Archiveer
                </Button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="feedback-template-label">Naam</Label>
                <Input
                  id="feedback-template-label"
                  value={draft.label}
                  onChange={(event) =>
                    updateDraft({ label: event.target.value })
                  }
                  placeholder="Bijv. Parkeren herhalen"
                  className="h-10 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-1.5">
                  <Label>Type coachnotitie</Label>
                  <Select
                    value={draft.noteType}
                    onValueChange={(value) =>
                      updateDraft({
                        noteType: value as CoachNoteTemplateType,
                      })
                    }
                  >
                    <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COACH_NOTE_TEMPLATE_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="feedback-template-description">
                    Korte omschrijving
                  </Label>
                  <Input
                    id="feedback-template-description"
                    value={draft.omschrijving}
                    onChange={(event) =>
                      updateDraft({ omschrijving: event.target.value })
                    }
                    placeholder="Wanneer gebruik je deze template?"
                    className="h-10 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Feedbackveld</Label>
                  <Select
                    value={draft.target}
                    onValueChange={(value) =>
                      updateDraft({ target: value as FeedbackTemplateTarget })
                    }
                  >
                    <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {targetOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="feedback-template-order">Volgorde</Label>
                  <Input
                    id="feedback-template-order"
                    type="number"
                    min={0}
                    value={draft.sortOrder}
                    onChange={(event) =>
                      updateDraft({
                        sortOrder: Number(event.target.value) || 0,
                      })
                    }
                    className="h-10 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Skill</Label>
                  <Select
                    value={draft.vaardigheidKey ?? "general"}
                    onValueChange={(value) =>
                      updateDraft({
                        vaardigheidKey: value === "general" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">
                        Algemeen / rijschoolstandaard
                      </SelectItem>
                      {skillOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.section} - {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={draft.status ?? "all"}
                    onValueChange={(value) =>
                      updateDraft({
                        status:
                          value === "all"
                            ? null
                            : (value as StudentProgressStatus),
                      })
                    }
                  >
                    <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle statussen</SelectItem>
                      {STUDENT_PROGRESS_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="feedback-template-text">Templatezin</Label>
                <Textarea
                  id="feedback-template-text"
                  value={draft.tekst}
                  onChange={(event) =>
                    updateDraft({ tekst: event.target.value })
                  }
                  placeholder="Schrijf de feedbackzin die je later met een klik wilt invoegen."
                  className="min-h-32 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
                />
              </div>

              <div className="rounded-[1rem] border border-sky-200/80 bg-sky-50/90 p-3 text-sm leading-6 text-sky-900 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-100">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Tip: maak algemene templates kort en breed inzetbaar. Maak
                    skill/status templates juist heel specifiek, bijvoorbeeld
                    parkeren + herhaling of kijkgedrag + zelfstandig.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                disabled={isPending}
                onClick={handleSaveTemplate}
                className="h-10 rounded-full"
              >
                {isPending
                  ? "Opslaan..."
                  : draft.id
                    ? "Template bijwerken"
                    : "Template opslaan"}
              </Button>
              {draft.id ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => {
                      const template = items.find((item) => item.id === draft.id);

                      if (template) {
                        handleDuplicateTemplate(template);
                      }
                    }}
                    className="h-10 rounded-full"
                  >
                    <Copy className="size-3.5" />
                    Dupliceer
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => {
                      const template = items.find((item) => item.id === draft.id);

                      if (template) {
                        handleDeleteTemplate(template);
                      }
                    }}
                    className="h-10 rounded-full"
                  >
                    <Trash2 className="size-3.5" />
                    Permanent verwijderen
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
