import type { CoachNoteTemplateType } from "@/lib/types";

export const COACH_NOTE_TEMPLATE_TYPE_OPTIONS: Array<{
  description: string;
  label: string;
  shortLabel: string;
  value: CoachNoteTemplateType;
}> = [
  {
    description: "Algemene voortgang, lesontwikkeling en leerroute.",
    label: "Voortgangsnotitie",
    shortLabel: "Voortgang",
    value: "voortgangsnotitie",
  },
  {
    description: "Terugkoppeling na een concrete rijles.",
    label: "Lesfeedback",
    shortLabel: "Feedback",
    value: "lesfeedback",
  },
  {
    description: "Gedrag, houding, spanning of verkeersinzicht.",
    label: "Gedragsobservatie",
    shortLabel: "Gedrag",
    value: "gedragsobservatie",
  },
  {
    description: "Examenfocus, proefexamen of examengerichte voorbereiding.",
    label: "Examenvoorbereiding",
    shortLabel: "Examen",
    value: "examenvoorbereiding",
  },
  {
    description: "Motivatie, vertrouwen en begeleiding in het leerproces.",
    label: "Motivatiegesprek",
    shortLabel: "Motivatie",
    value: "motivatiegesprek",
  },
  {
    description: "Specifiek punt dat extra aandacht nodig heeft.",
    label: "Aandachtspunt",
    shortLabel: "Aandacht",
    value: "aandachtspunt",
  },
  {
    description: "Breed inzetbaar voor meerdere soorten coachnotities.",
    label: "Algemene begeleiding",
    shortLabel: "Algemeen",
    value: "algemene_begeleiding",
  },
];

export function isCoachNoteTemplateType(
  value: string,
): value is CoachNoteTemplateType {
  return COACH_NOTE_TEMPLATE_TYPE_OPTIONS.some(
    (option) => option.value === value,
  );
}

export function getCoachNoteTemplateTypeMeta(
  value: CoachNoteTemplateType | string | null | undefined,
) {
  return (
    COACH_NOTE_TEMPLATE_TYPE_OPTIONS.find((option) => option.value === value) ??
    COACH_NOTE_TEMPLATE_TYPE_OPTIONS[COACH_NOTE_TEMPLATE_TYPE_OPTIONS.length - 1]
  );
}
