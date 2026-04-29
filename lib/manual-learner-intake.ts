export const MANUAL_LEARNER_INTAKE_ITEMS = [
  {
    key: "contact_gecheckt",
    title: "Contactgegevens gecheckt",
    detail: "Naam, e-mail en telefoon zijn gecontroleerd.",
  },
  {
    key: "pakket_gekozen",
    title: "Pakket of aanpak gekozen",
    detail: "Er is duidelijk wat de leerling als startroute krijgt.",
  },
  {
    key: "eerste_les_gepland",
    title: "Eerste les ingepland",
    detail: "Er staat direct een eerste les of intake in de agenda.",
  },
  {
    key: "agenda_afspraak_duidelijk",
    title: "Agenda-afspraak duidelijk",
    detail: "Zelf inplannen staat bewust aan of uit.",
  },
  {
    key: "startfocus_vastgelegd",
    title: "Startfocus vastgelegd",
    detail: "De eerste aandachtspunten of intake-notitie staan klaar.",
  },
] as const;

export type ManualLearnerIntakeKey =
  (typeof MANUAL_LEARNER_INTAKE_ITEMS)[number]["key"];

const MANUAL_LEARNER_INTAKE_KEY_SET = new Set(
  MANUAL_LEARNER_INTAKE_ITEMS.map((item) => item.key)
);

export function isManualLearnerIntakeKey(
  value: string
): value is ManualLearnerIntakeKey {
  return MANUAL_LEARNER_INTAKE_KEY_SET.has(value as ManualLearnerIntakeKey);
}

export function normalizeManualLearnerIntakeKeys(
  values: readonly string[]
): ManualLearnerIntakeKey[] {
  const unique = new Set(
    values.filter(isManualLearnerIntakeKey) as ManualLearnerIntakeKey[]
  );

  return MANUAL_LEARNER_INTAKE_ITEMS.map((item) => item.key).filter((key) =>
    unique.has(key)
  );
}
