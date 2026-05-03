import type { BeschikbaarheidSlot, Les } from "@/lib/types";

export type RescheduleProposalOption = {
  compactLabel: string;
  endAt: Date;
  id: string;
  label: string;
  startAt: Date;
};

const activeLessonStatuses = new Set(["geaccepteerd", "ingepland"]);

const proposalDayFormatter = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Amsterdam",
});

const proposalTimeFormatter = new Intl.DateTimeFormat("nl-NL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

const compactProposalDayFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Amsterdam",
  weekday: "short",
});

function getDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getLessonStart(lesson: Les) {
  return getDate(lesson.start_at);
}

function getLessonEnd(lesson: Les) {
  const explicitEnd = getDate(lesson.end_at);

  if (explicitEnd) {
    return explicitEnd;
  }

  const start = getLessonStart(lesson);
  return start
    ? new Date(start.getTime() + lesson.duur_minuten * 60_000)
    : null;
}

function overlaps(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date,
) {
  return leftStart < rightEnd && leftEnd > rightStart;
}

export function formatRescheduleProposalLabel(startAt: Date, endAt: Date) {
  return `${proposalDayFormatter.format(startAt)} ${proposalTimeFormatter.format(
    startAt,
  )} - ${proposalTimeFormatter.format(endAt)}`;
}

export function formatCompactRescheduleProposalLabel(
  startAt: Date,
  endAt: Date,
) {
  return `${compactProposalDayFormatter.format(startAt)} ${proposalTimeFormatter.format(
    startAt,
  )} - ${proposalTimeFormatter.format(endAt)}`;
}

function getWeekdayDistance(left: number, right: number) {
  const directDistance = Math.abs(left - right);
  return Math.min(directDistance, 7 - directDistance);
}

function getTimeMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function getProposalScore({
  now,
  originalStart,
  startAt,
}: {
  now: Date;
  originalStart: Date | null;
  startAt: Date;
}) {
  const daysFromNow = Math.max(
    0,
    (startAt.getTime() - now.getTime()) / (24 * 60 * 60_000),
  );

  if (!originalStart) {
    return daysFromNow;
  }

  const weekdayDistance = getWeekdayDistance(
    originalStart.getDay(),
    startAt.getDay(),
  );
  const timeDistance = Math.abs(
    getTimeMinutes(originalStart) - getTimeMinutes(startAt),
  );

  return daysFromNow + weekdayDistance * 2 + timeDistance / 120;
}

function roundUpToStep(date: Date, stepMinutes: number) {
  const stepMs = stepMinutes * 60_000;

  return new Date(Math.ceil(date.getTime() / stepMs) * stepMs);
}

function getCandidateStarts({
  durationMs,
  now,
  slotEnd,
  slotStart,
}: {
  durationMs: number;
  now: Date;
  slotEnd: Date;
  slotStart: Date;
}) {
  const stepMinutes = 30;
  const stepMs = stepMinutes * 60_000;
  const firstStart = roundUpToStep(
    new Date(Math.max(slotStart.getTime(), now.getTime() + stepMs)),
    stepMinutes,
  );
  const latestStart = slotEnd.getTime() - durationMs;
  const starts: Date[] = [];

  for (
    let timestamp = firstStart.getTime();
    timestamp <= latestStart;
    timestamp += stepMs
  ) {
    starts.push(new Date(timestamp));
  }

  return starts;
}

export function findBestLessonRescheduleOptions({
  limit = 3,
  lesson,
  lessons,
  now = new Date(),
  slots,
}: {
  lesson: Les;
  lessons: Les[];
  limit?: number;
  now?: Date;
  slots: BeschikbaarheidSlot[];
}) {
  const originalStart = getLessonStart(lesson);
  const durationMs = Math.max(30, lesson.duur_minuten || 60) * 60_000;
  const busyLessons = lessons.filter(
    (item) => item.id !== lesson.id && activeLessonStatuses.has(item.status),
  );
  const seen = new Set<string>();

  return slots
    .flatMap((slot) => {
      if (!slot.beschikbaar || !slot.start_at || !slot.eind_at) {
        return [];
      }

      const slotStart = getDate(slot.start_at);
      const slotEnd = getDate(slot.eind_at);

      if (!slotStart || !slotEnd || slotEnd <= now) {
        return [];
      }

      if (slotEnd.getTime() - slotStart.getTime() < durationMs) {
        return [];
      }

      return getCandidateStarts({
        durationMs,
        now,
        slotEnd,
        slotStart,
      }).flatMap((proposalStart) => {
        const proposalEnd = new Date(proposalStart.getTime() + durationMs);
        const key = `${proposalStart.toISOString()}-${proposalEnd.toISOString()}`;

        if (seen.has(key)) {
          return [];
        }

        const hasConflict = busyLessons.some((busyLesson) => {
          const busyStart = getLessonStart(busyLesson);
          const busyEnd = getLessonEnd(busyLesson);

          return busyStart && busyEnd
            ? overlaps(proposalStart, proposalEnd, busyStart, busyEnd)
            : false;
        });

        if (hasConflict) {
          return [];
        }

        seen.add(key);

        return [
          {
            compactLabel: formatCompactRescheduleProposalLabel(
              proposalStart,
              proposalEnd,
            ),
            endAt: proposalEnd,
            id: `${slot.id}-${key}`,
            label: formatRescheduleProposalLabel(proposalStart, proposalEnd),
            startAt: proposalStart,
          } satisfies RescheduleProposalOption,
        ];
      });
    })
    .sort(
      (left, right) =>
        getProposalScore({ now, originalStart, startAt: left.startAt }) -
        getProposalScore({ now, originalStart, startAt: right.startAt }),
    )
    .slice(0, limit);
}

export function buildCancellationRecoveryPlans({
  lessons,
  limit = 3,
  now = new Date(),
  slots,
}: {
  lessons: Les[];
  limit?: number;
  now?: Date;
  slots: BeschikbaarheidSlot[];
}) {
  return lessons
    .filter((lesson) => lesson.status === "geannuleerd")
    .sort((left, right) => {
      const leftStart = getLessonStart(left)?.getTime() ?? 0;
      const rightStart = getLessonStart(right)?.getTime() ?? 0;

      return rightStart - leftStart;
    })
    .slice(0, limit)
    .map((lesson) => ({
      lesson,
      options: findBestLessonRescheduleOptions({
        lesson,
        lessons,
        now,
        slots,
      }),
    }));
}
