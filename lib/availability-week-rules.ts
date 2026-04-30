import {
  addDaysToDateValue,
  createAvailabilityTimestamp,
  formatAvailabilityDay,
  formatAvailabilityWindow,
  getAvailabilityDateValue,
  getDateValueDifferenceInDays,
  getStartOfWeekDateValue,
} from "@/lib/availability";
import type {
  BeschikbaarheidSlot,
  BeschikbaarheidWeekrooster,
} from "@/lib/types";

export const RECURRING_AVAILABILITY_WEEKS = 156;
const WEEK_RULE_SLOT_PREFIX = "weekrooster";

function overlaps(
  leftStartAt: string,
  leftEndAt: string,
  rightStartAt: string,
  rightEndAt: string
) {
  return (
    new Date(leftStartAt).getTime() < new Date(rightEndAt).getTime() &&
    new Date(leftEndAt).getTime() > new Date(rightStartAt).getTime()
  );
}

function subtractConcreteOverlapFromRecurringSegment(
  segment: {
    start_at: string;
    eind_at: string;
    beschikbaar: boolean;
  },
  concreteSlot: {
    start_at: string;
    eind_at: string;
  }
) {
  if (
    !overlaps(
      segment.start_at,
      segment.eind_at,
      concreteSlot.start_at,
      concreteSlot.eind_at
    )
  ) {
    return [segment];
  }

  const remainingSegments: Array<{
    start_at: string;
    eind_at: string;
    beschikbaar: boolean;
  }> = [];

  if (
    new Date(concreteSlot.start_at).getTime() >
    new Date(segment.start_at).getTime()
  ) {
    remainingSegments.push({
      ...segment,
      eind_at: concreteSlot.start_at,
    });
  }

  if (
    new Date(concreteSlot.eind_at).getTime() <
    new Date(segment.eind_at).getTime()
  ) {
    remainingSegments.push({
      ...segment,
      start_at: concreteSlot.eind_at,
    });
  }

  return remainingSegments.filter(
    (candidate) =>
      new Date(candidate.eind_at).getTime() >
      new Date(candidate.start_at).getTime()
  );
}

function buildWeekRuleSlotId(ruleId: string, dateValue: string, segmentIndex: number) {
  return `${WEEK_RULE_SLOT_PREFIX}:${ruleId}:${dateValue}:${segmentIndex}`;
}

export function parseWeekRuleSlotId(slotId: string) {
  const [prefix, ruleId, dateValue, segmentIndexRaw] = slotId.split(":");

  if (prefix !== WEEK_RULE_SLOT_PREFIX || !ruleId || !dateValue) {
    return null;
  }

  const segmentIndex = Number.parseInt(segmentIndexRaw ?? "", 10);

  if (!Number.isInteger(segmentIndex) || segmentIndex < 0) {
    return null;
  }

  return {
    ruleId,
    dateValue,
    segmentIndex,
  };
}

function buildRuleSegments(
  rule: Pick<
    BeschikbaarheidWeekrooster,
    | "id"
    | "beschikbaar"
    | "start_tijd"
    | "eind_tijd"
    | "pauze_start_tijd"
    | "pauze_eind_tijd"
  >,
  dateValue: string
) {
  const startAt = createAvailabilityTimestamp(dateValue, rule.start_tijd);
  const eindAt = createAvailabilityTimestamp(dateValue, rule.eind_tijd);
  const hasBreakWindow = Boolean(rule.pauze_start_tijd && rule.pauze_eind_tijd);

  if (hasBreakWindow) {
    const pauseStartAt = createAvailabilityTimestamp(dateValue, rule.pauze_start_tijd ?? "");
    const pauseEndAt = createAvailabilityTimestamp(dateValue, rule.pauze_eind_tijd ?? "");

    return [
      {
        id: buildWeekRuleSlotId(rule.id, dateValue, 0),
        start_at: startAt,
        eind_at: pauseStartAt,
        beschikbaar: rule.beschikbaar,
      },
      {
        id: buildWeekRuleSlotId(rule.id, dateValue, 1),
        start_at: pauseEndAt,
        eind_at: eindAt,
        beschikbaar: rule.beschikbaar,
      },
    ];
  }

  return [
    {
      id: buildWeekRuleSlotId(rule.id, dateValue, 0),
      start_at: startAt,
      eind_at: eindAt,
      beschikbaar: rule.beschikbaar,
    },
  ];
}

export function buildRecurringAvailabilitySlots(params: {
  rules: BeschikbaarheidWeekrooster[];
  concreteSlots: Array<
    Pick<
      BeschikbaarheidSlot,
      "id" | "start_at" | "eind_at" | "beschikbaar" | "weekrooster_id"
    >
  >;
  startDateValue?: string;
  weeks?: number;
}) {
  const {
    rules,
    concreteSlots,
    startDateValue = getAvailabilityDateValue(new Date().toISOString()),
    weeks = RECURRING_AVAILABILITY_WEEKS,
  } = params;

  const weekStart = getStartOfWeekDateValue(startDateValue);
  const nowIso = new Date().toISOString();
  const normalizedConcreteSlots = concreteSlots.filter(
    (slot): slot is Required<Pick<BeschikbaarheidSlot, "id" | "start_at" | "eind_at" | "beschikbaar">> &
      Pick<BeschikbaarheidSlot, "weekrooster_id"> =>
      Boolean(slot.start_at && slot.eind_at)
  );

  return rules
    .filter((rule) => rule.actief)
    .flatMap((rule) => {
      return Array.from({ length: weeks }, (_, weekIndex) => {
        const dateValue = addDaysToDateValue(
          weekStart,
          weekIndex * 7 + (rule.weekdag - 1)
        );

        const dayConcreteSlots = normalizedConcreteSlots
          .filter((concreteSlot) => {
            if (!concreteSlot.start_at || !concreteSlot.eind_at) {
              return false;
            }

            return getAvailabilityDateValue(concreteSlot.start_at) === dateValue;
          })
          .map((concreteSlot) => ({
            start_at: concreteSlot.start_at as string,
            eind_at: concreteSlot.eind_at as string,
          }))
          .sort((left, right) => left.start_at.localeCompare(right.start_at));

        const generatedSegments = buildRuleSegments(rule, dateValue)
          .flatMap((segment) => {
            return dayConcreteSlots.reduce<
              Array<{
                start_at: string;
                eind_at: string;
                beschikbaar: boolean;
              }>
            >((remainingSegments, concreteSlot) => {
              return remainingSegments.flatMap((candidateSegment) =>
                subtractConcreteOverlapFromRecurringSegment(
                  candidateSegment,
                  concreteSlot
                )
              );
            }, [
              {
                start_at: segment.start_at,
                eind_at: segment.eind_at,
                beschikbaar: segment.beschikbaar,
              },
            ]);
          })
          .filter((segment) => segment.eind_at > nowIso);

        return generatedSegments.map<BeschikbaarheidSlot>((segment, segmentIndex) => ({
          id: buildWeekRuleSlotId(rule.id, dateValue, segmentIndex),
          dag: formatAvailabilityDay(segment.start_at),
          tijdvak: formatAvailabilityWindow(segment.start_at, segment.eind_at),
          beschikbaar: segment.beschikbaar,
          start_at: segment.start_at,
          eind_at: segment.eind_at,
          source: "weekrooster",
          weekrooster_id: rule.id,
        }));
      }).flat();
    })
    .sort((left, right) => {
      return (left.start_at ?? "").localeCompare(right.start_at ?? "");
    });
}

export function buildRecurringAvailabilitySlotFromRule(params: {
  rule: BeschikbaarheidWeekrooster;
  dateValue: string;
  segmentIndex: number;
}) {
  const segments = buildRuleSegments(params.rule, params.dateValue);
  return segments[params.segmentIndex] ?? null;
}

export function getWeekdayNumberFromDateValue(dateValue: string) {
  return (
    getDateValueDifferenceInDays(getStartOfWeekDateValue(dateValue), dateValue) + 1
  ) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}
