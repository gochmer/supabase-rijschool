"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { DateSelectArg, EventInput } from "@fullcalendar/core";
import nlLocale from "@fullcalendar/core/locales/nl";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CalendarPlus2,
  CopyPlus,
  Clock3,
  Edit3,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  applyAvailabilityTemplateAction,
  createAvailabilitySlotAction,
  deleteAvailabilitySeriesAction,
  deleteAvailabilitySlotAction,
  deleteAvailabilityWeekRuleAction,
  duplicateAvailabilityWeekAction,
  updateAvailabilitySeriesStatusAction,
  updateAvailabilitySeriesTimingAction,
  updateAvailabilitySlotStatusAction,
  updateAvailabilitySlotTimingAction,
  updateAvailabilityWeekRuleActiveAction,
  updateAvailabilityWeekRuleAction,
  updateAvailabilityWindowAction,
} from "@/lib/actions/instructor-availability";
import { availabilityTemplates } from "@/lib/availability-templates";
import {
  addDaysToDateValue,
  formatAvailabilityDuration,
  formatAvailabilityMoment,
  formatAvailabilityShortDay,
  formatAvailabilityTime,
  getAvailabilityDateValue,
  getAvailabilityDurationMinutes,
  getAvailabilitySeriesKey,
  getAvailabilityWeekdayNumber,
  getStartOfWeekDateValue,
} from "@/lib/availability";
import { formatCurrency } from "@/lib/format";
import type { BeschikbaarheidSlot } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type AvailabilityEntry = {
  id: string;
  startAt: string;
  endAt: string;
  dag: string;
  tijdvak: string;
  beschikbaar: boolean;
  momentLabel: string;
  shortDay: string;
  durationLabel: string;
  source: "slot" | "weekrooster";
  weekroosterId: string | null;
};

type LinkedAvailabilityWindow = {
  slots: AvailabilityEntry[];
  startAt: string;
  endAt: string;
  pauseStartAt?: string | null;
  pauseEndAt?: string | null;
};

type QuickEditDraft = {
  sourceKey: string;
  startTijd: string;
  eindTijd: string;
  useBreakWindow: boolean;
  pauseStartTijd: string;
  pauseEindTijd: string;
};

const MAX_LINKED_WINDOW_GAP_MINUTES = 90;
const MIN_DETECTED_BREAK_GAP_MINUTES = 20;

function createAvailabilityEntry(slot: BeschikbaarheidSlot): AvailabilityEntry | null {
  if (!slot.start_at || !slot.eind_at) {
    return null;
  }

  return {
    id: slot.id,
    startAt: slot.start_at,
    endAt: slot.eind_at,
    dag: slot.dag,
    tijdvak: slot.tijdvak,
    beschikbaar: slot.beschikbaar,
    momentLabel: formatAvailabilityMoment(slot.start_at, slot.eind_at),
    shortDay: formatAvailabilityShortDay(slot.start_at),
    durationLabel: formatAvailabilityDuration(slot.start_at, slot.eind_at),
    source: slot.source ?? "slot",
    weekroosterId: slot.weekrooster_id ?? null,
  };
}

function isAvailabilityEntry(
  entry: AvailabilityEntry | null
): entry is AvailabilityEntry {
  return entry !== null;
}

function getMinutesBetweenIso(startAt: string, endAt: string) {
  return Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000);
}

function buildLinkedAvailabilityWindow(
  entries: AvailabilityEntry[],
  anchorId: string | null
): LinkedAvailabilityWindow | null {
  if (!anchorId) {
    return null;
  }

  const orderedEntries = [...entries].sort((left, right) =>
    left.startAt.localeCompare(right.startAt)
  );
  const anchorIndex = orderedEntries.findIndex((entry) => entry.id === anchorId);

  if (anchorIndex === -1) {
    return null;
  }

  let startIndex = anchorIndex;
  let endIndex = anchorIndex;

  while (startIndex > 0) {
    const current = orderedEntries[startIndex];
    const previous = orderedEntries[startIndex - 1];
    const sameDate =
      getAvailabilityDateValue(previous.startAt) === getAvailabilityDateValue(current.startAt);
    const sameSource =
      previous.source === current.source &&
      previous.weekroosterId === current.weekroosterId;
    const gapMinutes = getMinutesBetweenIso(previous.endAt, current.startAt);

    if (
      !sameDate ||
      !sameSource ||
      previous.beschikbaar !== current.beschikbaar ||
      gapMinutes < 0 ||
      gapMinutes > MAX_LINKED_WINDOW_GAP_MINUTES
    ) {
      break;
    }

    startIndex -= 1;
  }

  while (endIndex < orderedEntries.length - 1) {
    const current = orderedEntries[endIndex];
    const next = orderedEntries[endIndex + 1];
    const sameDate =
      getAvailabilityDateValue(next.startAt) === getAvailabilityDateValue(current.startAt);
    const sameSource =
      next.source === current.source &&
      next.weekroosterId === current.weekroosterId;
    const gapMinutes = getMinutesBetweenIso(current.endAt, next.startAt);

    if (
      !sameDate ||
      !sameSource ||
      next.beschikbaar !== current.beschikbaar ||
      gapMinutes < 0 ||
      gapMinutes > MAX_LINKED_WINDOW_GAP_MINUTES
    ) {
      break;
    }

    endIndex += 1;
  }

  const windowEntries = orderedEntries.slice(startIndex, endIndex + 1);
  const detectedPause = windowEntries.reduce<{
    pauseStartAt: string | null;
    pauseEndAt: string | null;
    gapMinutes: number;
  }>(
    (largestGap, entry, index) => {
      if (index === windowEntries.length - 1) {
        return largestGap;
      }

      const next = windowEntries[index + 1];
      const gapMinutes = getMinutesBetweenIso(entry.endAt, next.startAt);

      if (
        gapMinutes >= MIN_DETECTED_BREAK_GAP_MINUTES &&
        gapMinutes > largestGap.gapMinutes
      ) {
        return {
          pauseStartAt: entry.endAt,
          pauseEndAt: next.startAt,
          gapMinutes,
        };
      }

      return largestGap;
    },
    {
      pauseStartAt: null,
      pauseEndAt: null,
      gapMinutes: 0,
    }
  );

  return {
    slots: windowEntries,
    startAt: windowEntries[0]?.startAt ?? "",
    endAt: windowEntries[windowEntries.length - 1]?.endAt ?? "",
    pauseStartAt: detectedPause.pauseStartAt,
    pauseEndAt: detectedPause.pauseEndAt,
  };
}

function getQuickEditSourceKey(workWindow: LinkedAvailabilityWindow | null) {
  if (!workWindow) {
    return "empty";
  }

  return workWindow.slots.map((slot) => slot.id).join("|");
}

function createQuickEditDraft(workWindow: LinkedAvailabilityWindow | null): QuickEditDraft {
  if (!workWindow) {
    return {
      sourceKey: "empty",
      startTijd: "09:00",
      eindTijd: "10:30",
      useBreakWindow: false,
      pauseStartTijd: "12:30",
      pauseEindTijd: "13:00",
    };
  }

  return {
    sourceKey: getQuickEditSourceKey(workWindow),
    startTijd: formatAvailabilityTime(workWindow.startAt),
    eindTijd: formatAvailabilityTime(workWindow.endAt),
    useBreakWindow: Boolean(workWindow.pauseStartAt && workWindow.pauseEndAt),
    pauseStartTijd: workWindow.pauseStartAt
      ? formatAvailabilityTime(workWindow.pauseStartAt)
      : "12:30",
    pauseEindTijd: workWindow.pauseEndAt
      ? formatAvailabilityTime(workWindow.pauseEndAt)
      : "13:00",
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getTodayValue() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInputValue(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addMinutesToTimeValue(timeValue: string, minutesToAdd: number) {
  const [hours, minutes] = timeValue
    .split(":")
    .map((part) => Number.parseInt(part, 10));

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return timeValue;
  }

  const totalMinutes = Math.min(hours * 60 + minutes + minutesToAdd, 23 * 60 + 59);
  const nextHours = Math.floor(totalMinutes / 60);
  const nextMinutes = totalMinutes % 60;

  return `${pad(nextHours)}:${pad(nextMinutes)}`;
}

function getWeekRange() {
  const now = new Date();
  const currentDay = now.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + distanceToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return { startOfWeek, endOfWeek };
}

function timeValueToMinutes(timeValue: string) {
  const [hours, minutes] = timeValue
    .split(":")
    .map((part) => Number.parseInt(part, 10));

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

function formatMinutesLabel(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return "0 uur";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} uur`;
  }

  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours}u ${minutes} min`;
}

function formatMinutesDeltaLabel(deltaMinutes: number) {
  if (deltaMinutes === 0) {
    return "gelijk aan deze week";
  }

  const direction = deltaMinutes > 0 ? "+" : "-";
  return `${direction}${formatMinutesLabel(Math.abs(deltaMinutes))}`;
}

function countGeneratedSlotsForWindow(
  startTimeValue: string,
  endTimeValue: string,
  lessonDurationMinutes: number,
  bufferMinutes: number
) {
  const startMinutes = timeValueToMinutes(startTimeValue);
  const endMinutes = timeValueToMinutes(endTimeValue);

  if (
    lessonDurationMinutes < 30 ||
    endMinutes <= startMinutes ||
    startMinutes + lessonDurationMinutes > endMinutes
  ) {
    return 0;
  }

  let cursor = startMinutes;
  let count = 0;

  while (cursor + lessonDurationMinutes <= endMinutes) {
    count += 1;
    cursor += lessonDurationMinutes + bufferMinutes;
  }

  return count;
}

const weekdayOptions = [
  { value: 1, shortLabel: "Ma", longLabel: "maandag" },
  { value: 2, shortLabel: "Di", longLabel: "dinsdag" },
  { value: 3, shortLabel: "Wo", longLabel: "woensdag" },
  { value: 4, shortLabel: "Do", longLabel: "donderdag" },
  { value: 5, shortLabel: "Vr", longLabel: "vrijdag" },
  { value: 6, shortLabel: "Za", longLabel: "zaterdag" },
  { value: 7, shortLabel: "Zo", longLabel: "zondag" },
] as const;

const shiftPresets = [
  { label: "Ochtend", start: "08:00", end: "12:00" },
  { label: "Middag", start: "12:00", end: "17:00" },
  { label: "Avond", start: "18:00", end: "21:00" },
  { label: "Werkdag", start: "09:00", end: "17:00" },
] as const;

const breakPresets = [
  { label: "Lunch 30 min", start: "12:30", end: "13:00" },
  { label: "Lunch 60 min", start: "13:00", end: "14:00" },
  { label: "Korte pauze", start: "15:30", end: "15:45" },
] as const;

function formatSelectedWeekdays(weekdays: number[]) {
  if (!weekdays.length) {
    return "";
  }

  return weekdayOptions
    .filter((option) => weekdays.includes(option.value))
    .map((option) => option.longLabel)
    .join(", ");
}

export function AvailabilityManager({
  slots,
  pricePerLesson = 0,
}: {
  slots: BeschikbaarheidSlot[];
  pricePerLesson?: number;
}) {
  const [compact, setCompact] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [insightView, setInsightView] = useState<"health" | "commercial" | "suggestions">(
    "health"
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(slots[0]?.id ?? null);
  const [datum, setDatum] = useState(getTodayValue);
  const [eindDatum, setEindDatum] = useState(getTodayValue);
  const [startTijd, setStartTijd] = useState("09:00");
  const [eindTijd, setEindTijd] = useState("10:30");
  const [repeatWeeks, setRepeatWeeks] = useState("1");
  const [createMode, setCreateMode] = useState<"beschikbaar" | "afwezig">("beschikbaar");
  const [useDateRange, setUseDateRange] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [useBreakWindow, setUseBreakWindow] = useState(false);
  const [pauseStartTijd, setPauseStartTijd] = useState("12:30");
  const [pauseEindTijd, setPauseEindTijd] = useState("13:00");
  const [useLessonCadence, setUseLessonCadence] = useState(false);
  const [lessonDurationMinutes, setLessonDurationMinutes] = useState("90");
  const [bufferMinutes, setBufferMinutes] = useState("15");
  const [visibilityFilter, setVisibilityFilter] = useState("alles");
  const [confirmAction, setConfirmAction] = useState<null | "delete-slot" | "delete-series">(
    null
  );
  const [editAction, setEditAction] = useState<null | "edit-slot" | "edit-series">(null);
  const [editDatum, setEditDatum] = useState(getTodayValue);
  const [editStartTijd, setEditStartTijd] = useState("09:00");
  const [editEindTijd, setEditEindTijd] = useState("10:30");
  const [quickEditDraft, setQuickEditDraft] = useState<QuickEditDraft>(() =>
    createQuickEditDraft(null)
  );

  const entries = useMemo(
    () =>
      slots
        .map(createAvailabilityEntry)
        .filter(isAvailabilityEntry)
        .sort((left, right) => left.startAt.localeCompare(right.startAt)),
    [slots]
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 920px)");
    const sync = () => setCompact(media.matches);

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedSlotId) ?? entries[0] ?? null,
    [entries, selectedSlotId]
  );
  const selectedWorkWindow = useMemo(
    () => buildLinkedAvailabilityWindow(entries, selectedEntry?.id ?? null),
    [entries, selectedEntry]
  );
  const selectedWorkWindowKey = useMemo(
    () => getQuickEditSourceKey(selectedWorkWindow),
    [selectedWorkWindow]
  );
  const activeQuickEditDraft = useMemo(
    () =>
      quickEditDraft.sourceKey === selectedWorkWindowKey
        ? quickEditDraft
        : createQuickEditDraft(selectedWorkWindow),
    [quickEditDraft, selectedWorkWindow, selectedWorkWindowKey]
  );
  const quickEditStartTijd = activeQuickEditDraft.startTijd;
  const quickEditEindTijd = activeQuickEditDraft.eindTijd;
  const quickEditUseBreakWindow = activeQuickEditDraft.useBreakWindow;
  const quickEditPauseStartTijd = activeQuickEditDraft.pauseStartTijd;
  const quickEditPauseEindTijd = activeQuickEditDraft.pauseEindTijd;
  const quickEditHasBreakPreview =
    Boolean(selectedEntry?.beschikbaar) &&
    quickEditUseBreakWindow &&
    timeValueToMinutes(quickEditPauseStartTijd) > timeValueToMinutes(quickEditStartTijd) &&
    timeValueToMinutes(quickEditPauseEindTijd) >
      timeValueToMinutes(quickEditPauseStartTijd) &&
    timeValueToMinutes(quickEditPauseEindTijd) < timeValueToMinutes(quickEditEindTijd);
  const currentWeekStart = useMemo(() => {
    try {
      return getStartOfWeekDateValue(datum);
    } catch {
      return getStartOfWeekDateValue(getTodayValue());
    }
  }, [datum]);
  const nextWeekStart = useMemo(
    () => addDaysToDateValue(currentWeekStart, 7),
    [currentWeekStart]
  );
  const normalizedWeekdays = useMemo(
    () => [...selectedWeekdays].sort((left, right) => left - right),
    [selectedWeekdays]
  );
  const isWeekScheduleMode = normalizedWeekdays.length > 0;
  const selectedWeekdaySummary = useMemo(
    () => formatSelectedWeekdays(normalizedWeekdays),
    [normalizedWeekdays]
  );
  const isBlockingMode = createMode === "afwezig";
  const lessonDurationValue = Number.parseInt(lessonDurationMinutes, 10) || 0;
  const bufferValue = Number.parseInt(bufferMinutes, 10) || 0;
  const nextWeekEnd = useMemo(
    () => addDaysToDateValue(nextWeekStart, 7),
    [nextWeekStart]
  );
  const filteredEntries = useMemo(() => {
    if (visibilityFilter === "actief") {
      return entries.filter((entry) => entry.beschikbaar);
    }

    if (visibilityFilter === "verborgen") {
      return entries.filter((entry) => !entry.beschikbaar);
    }

    return entries;
  }, [entries, visibilityFilter]);
  const selectedSeriesCount = useMemo(() => {
    if (!selectedEntry) {
      return 0;
    }

    if (selectedEntry.source === "weekrooster") {
      return filteredEntries.filter(
        (entry) => entry.weekroosterId === selectedEntry.weekroosterId
      ).length;
    }

    const seriesKey = getAvailabilitySeriesKey(
      selectedEntry.startAt,
      selectedEntry.endAt
    );

    return entries.filter((entry) => {
      return (
        entry.startAt >= selectedEntry.startAt &&
        getAvailabilitySeriesKey(entry.startAt, entry.endAt) === seriesKey
      );
    }).length;
  }, [entries, filteredEntries, selectedEntry]);
  const isRecurringRuleEntry =
    selectedEntry?.source === "weekrooster" && Boolean(selectedEntry.weekroosterId);

  const events = useMemo<EventInput[]>(
    () =>
      filteredEntries.map((entry) => ({
        id: entry.id,
        title: entry.beschikbaar ? "Boekbaar" : "Niet boekbaar",
        start: entry.startAt,
        end: entry.endAt,
        backgroundColor: entry.beschikbaar ? "#dbeafe" : "#e2e8f0",
        borderColor: entry.beschikbaar ? "#38bdf8" : "#94a3b8",
        textColor: entry.beschikbaar ? "#0f172a" : "#475569",
        classNames: entry.beschikbaar
          ? ["lesson-calendar-event--availability"]
          : ["lesson-calendar-event--availability", "lesson-calendar-event--availability-muted"],
      })),
    [filteredEntries]
  );

  const { startOfWeek, endOfWeek } = useMemo(() => getWeekRange(), []);
  const dashboardHorizonEnd = useMemo(
    () => new Date(new Date().getTime() + 56 * 24 * 60 * 60_000),
    []
  );
  const activeCount = entries.filter((entry) => {
    const start = new Date(entry.startAt);
    return entry.beschikbaar && start <= dashboardHorizonEnd;
  }).length;
  const hiddenCount = entries.filter((entry) => {
    const start = new Date(entry.startAt);
    return !entry.beschikbaar && start <= dashboardHorizonEnd;
  }).length;
  const weeklyCount = entries.filter((entry) => {
    const start = new Date(entry.startAt);
    return start >= startOfWeek && start < endOfWeek;
  }).length;
  const isOngoingWeekSchedule = repeatWeeks === "ongoing";
  const repeatCount =
    !isOngoingWeekSchedule && Number.parseInt(repeatWeeks, 10)
      ? Number.parseInt(repeatWeeks, 10)
      : 1;
  const scheduleCountLabel =
    isWeekScheduleMode && isOngoingWeekSchedule
      ? `${normalizedWeekdays.length} werkdagen, vast`
      : isWeekScheduleMode && repeatCount > 1
      ? `${normalizedWeekdays.length} werkdagen, ${repeatCount} weken`
      : isWeekScheduleMode
        ? `${normalizedWeekdays.length} werkdagen`
        : isOngoingWeekSchedule
          ? "Vaste weekplanning"
        : repeatCount > 1
          ? `${repeatCount} weken reeks`
          : "Eenmalig blok";
  const hasBreakPreview =
    useBreakWindow &&
    timeValueToMinutes(pauseStartTijd) > timeValueToMinutes(startTijd) &&
    timeValueToMinutes(pauseEindTijd) > timeValueToMinutes(pauseStartTijd) &&
    timeValueToMinutes(pauseEindTijd) < timeValueToMinutes(eindTijd);
  const cadencePreviewCount = useMemo(() => {
    if (isBlockingMode || !useLessonCadence || lessonDurationValue < 30) {
      return 0;
    }

    if (useBreakWindow && hasBreakPreview) {
      return (
        countGeneratedSlotsForWindow(startTijd, pauseStartTijd, lessonDurationValue, bufferValue) +
        countGeneratedSlotsForWindow(
          pauseEindTijd,
          eindTijd,
          lessonDurationValue,
          bufferValue
        )
      );
    }

    return countGeneratedSlotsForWindow(startTijd, eindTijd, lessonDurationValue, bufferValue);
  }, [
    bufferValue,
    eindTijd,
    hasBreakPreview,
    isBlockingMode,
    lessonDurationValue,
    pauseEindTijd,
    pauseStartTijd,
    startTijd,
    useBreakWindow,
    useLessonCadence,
  ]);
  const currentWeekActiveEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const dateValue = getAvailabilityDateValue(entry.startAt);
        return (
          entry.beschikbaar &&
          dateValue >= currentWeekStart &&
          dateValue < nextWeekStart
        );
      }),
    [currentWeekStart, entries, nextWeekStart]
  );
  const nextWeekActiveEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const dateValue = getAvailabilityDateValue(entry.startAt);
        return entry.beschikbaar && dateValue >= nextWeekStart && dateValue < nextWeekEnd;
      }),
    [entries, nextWeekEnd, nextWeekStart]
  );
  const overlapIndex = useMemo(
    () =>
      entries.map((entry) => ({
        dateValue: getAvailabilityDateValue(entry.startAt),
        startMinutes: timeValueToMinutes(formatAvailabilityTime(entry.startAt)),
        endMinutes: timeValueToMinutes(formatAvailabilityTime(entry.endAt)),
        weekday: getAvailabilityWeekdayNumber(entry.startAt),
        beschikbaar: entry.beschikbaar,
      })),
    [entries]
  );

  const nextWeekEveningSuggestion = (() => {
    for (const weekday of [1, 3, 4]) {
      const dateValue = addDaysToDateValue(nextWeekStart, weekday - 1);

      const overlaps = overlapIndex.some((entry) => {
        return (
          entry.dateValue === dateValue &&
          entry.startMinutes < timeValueToMinutes("20:30") &&
          entry.endMinutes > timeValueToMinutes("18:30")
        );
      });

      if (!overlaps) {
        return {
          dateValue,
          label: `${["", "maandag", "dinsdag", "woensdag", "donderdag"][weekday]} 18:30 - 20:30`,
        };
      }
    }

    return null;
  })();

  const nextWeekWeekendSuggestion = (() => {
    const weekendActive = overlapIndex.some((entry) => {
      return (
        entry.beschikbaar &&
        (entry.weekday === 6 || entry.weekday === 7) &&
        entry.dateValue >= nextWeekStart &&
        entry.dateValue < nextWeekEnd
      );
    });

    if (weekendActive) {
      return null;
    }

    const saturdayDate = addDaysToDateValue(nextWeekStart, 5);
    const overlaps = overlapIndex.some((entry) => {
      return (
        entry.dateValue === saturdayDate &&
        entry.startMinutes < timeValueToMinutes("12:00") &&
        entry.endMinutes > timeValueToMinutes("09:00")
      );
    });

    if (overlaps) {
      return null;
    }

    return {
      dateValue: saturdayDate,
      label: "zaterdag 09:00 - 12:00",
    };
  })();
  const currentWeekTotalMinutes = currentWeekActiveEntries.reduce(
    (total, entry) => total + getAvailabilityDurationMinutes(entry.startAt, entry.endAt),
    0
  );
  const nextWeekTotalMinutes = nextWeekActiveEntries.reduce(
    (total, entry) => total + getAvailabilityDurationMinutes(entry.startAt, entry.endAt),
    0
  );
  const nextWeekEveningEntries = nextWeekActiveEntries.filter((entry) => {
    const startMinutes = timeValueToMinutes(formatAvailabilityTime(entry.startAt));
    const endMinutes = timeValueToMinutes(formatAvailabilityTime(entry.endAt));

    return startMinutes < timeValueToMinutes("21:00") && endMinutes > timeValueToMinutes("18:00");
  });
  const nextWeekWeekendEntries = nextWeekActiveEntries.filter((entry) => {
    const weekday = getAvailabilityWeekdayNumber(entry.startAt);
    return weekday === 6 || weekday === 7;
  });
  const nextWeekPrimeTimeSlots = nextWeekActiveEntries.filter((entry) => {
    const weekday = getAvailabilityWeekdayNumber(entry.startAt);
    const startMinutes = timeValueToMinutes(formatAvailabilityTime(entry.startAt));
    const endMinutes = timeValueToMinutes(formatAvailabilityTime(entry.endAt));

    const isEvening =
      startMinutes < timeValueToMinutes("21:00") && endMinutes > timeValueToMinutes("18:00");
    const isWeekend = weekday === 6 || weekday === 7;

    return isEvening || isWeekend;
  }).length;
  const nextWeekDaySpread = new Set(
    nextWeekActiveEntries.map((entry) => getAvailabilityWeekdayNumber(entry.startAt))
  ).size;
  const capacityDeltaMinutes = nextWeekTotalMinutes - currentWeekTotalMinutes;
  const nextWeekHealthScore = Math.max(
    18,
    Math.min(
      100,
      (nextWeekTotalMinutes >= 480
        ? 40
        : nextWeekTotalMinutes >= 300
          ? 28
          : nextWeekTotalMinutes >= 180
            ? 16
            : 6) +
        (nextWeekEveningEntries.length >= 2
          ? 24
          : nextWeekEveningEntries.length === 1
            ? 15
            : 0) +
        (nextWeekWeekendEntries.length >= 1 ? 14 : 0) +
        (nextWeekDaySpread >= 4
          ? 22
          : nextWeekDaySpread === 3
            ? 16
            : nextWeekDaySpread === 2
              ? 10
              : nextWeekDaySpread === 1
                ? 4
                : 0)
    )
  );
  const nextWeekHealthBadge =
    nextWeekHealthScore >= 78
      ? {
          label: "Sterk vooruitzicht",
          className: "border-emerald-200 bg-emerald-50 text-emerald-700",
          barClassName: "bg-[linear-gradient(90deg,#10b981,#34d399)]",
        }
      : nextWeekHealthScore >= 55
        ? {
            label: "Goed, nog aanscherpen",
            className: "border-sky-200 bg-sky-50 text-sky-700",
            barClassName: "bg-[linear-gradient(90deg,#0ea5e9,#38bdf8)]",
          }
        : {
            label: "Te dun gepland",
            className: "border-amber-200 bg-amber-50 text-amber-700",
            barClassName: "bg-[linear-gradient(90deg,#f59e0b,#fbbf24)]",
          };
  const nextWeekHealthInsights = [
    nextWeekTotalMinutes < 240
      ? {
          tone: "watch",
          eyebrow: "Capaciteit",
          title: "Volgende week staat nog licht open",
          description: `Je hebt nu ${formatMinutesLabel(nextWeekTotalMinutes)} aan actieve beschikbaarheid. Richt op minimaal 4 tot 6 uur om genoeg boekbare momenten te tonen.`,
        }
      : capacityDeltaMinutes < -120
        ? {
            tone: "watch",
            eyebrow: "Capaciteit",
            title: "Je capaciteit zakt terug ten opzichte van deze week",
            description: `Je verliest ${formatMinutesLabel(Math.abs(capacityDeltaMinutes))}. Een duplicatie of extra avond houdt je ritme stabiel.`,
          }
        : {
            tone: "good",
            eyebrow: "Capaciteit",
            title: "Je open uren blijven goed op niveau",
            description: `Volgende week staat ${formatMinutesLabel(nextWeekTotalMinutes)} open, ${formatMinutesDeltaLabel(capacityDeltaMinutes)} vergeleken met deze week.`,
          },
    nextWeekEveningEntries.length === 0
      ? {
          tone: "watch",
          eyebrow: "Prime time",
          title: "Er staat nog geen avondmoment open",
          description: "Na werk of studie wordt vaak het meest geboekt. Voeg minimaal een avondslot toe om zichtbaarder te zijn.",
        }
      : nextWeekEveningEntries.length === 1
        ? {
            tone: "neutral",
            eyebrow: "Prime time",
            title: "Een avondslot is een goede basis",
            description: "Met een tweede avondmoment spreid je de vraag beter en ben je aantrekkelijker voor leerlingen met drukke werkdagen.",
          }
        : {
            tone: "good",
            eyebrow: "Prime time",
            title: "Je avonddekking is sterk",
            description: `Je hebt ${nextWeekEveningEntries.length} avondmomenten openstaan. Dat is sterk voor leerlingen die overdag minder flexibel zijn.`,
          },
    nextWeekDaySpread <= 1
      ? {
          tone: "watch",
          eyebrow: "Spreiding",
          title: "Je planning zit nu op een enkele dag geconcentreerd",
          description: "Spreid beschikbaarheid over minstens twee of drie dagen om uitval beter op te vangen en meer voorkeuren te bedienen.",
        }
      : nextWeekDaySpread === 2 && nextWeekWeekendEntries.length === 0
        ? {
            tone: "neutral",
            eyebrow: "Spreiding",
            title: "Je planning is bruikbaar, maar nog vrij smal",
            description: "Je zit op twee dagen zonder weekenddekking. Een extra doordeweekse dag of zaterdagblok maakt je agenda flexibeler.",
          }
        : nextWeekWeekendEntries.length === 0
          ? {
              tone: "neutral",
              eyebrow: "Spreiding",
              title: "Doordeweeks staat goed, weekend is nog dicht",
              description: "Niet verplicht, maar een weekendblok trekt vaak leerlingen die doordeweeks minder ruimte hebben.",
            }
          : {
              tone: "good",
              eyebrow: "Spreiding",
              title: "Je planning is mooi verdeeld",
              description: `Je bent verspreid over ${nextWeekDaySpread} dagen beschikbaar en hebt ook een weekendmoment openstaan.`,
            },
  ];
  const currentWeekRevenuePotential = currentWeekActiveEntries.length * pricePerLesson;
  const nextWeekRevenuePotential = nextWeekActiveEntries.length * pricePerLesson;
  const bookingChanceScore = Math.max(
    22,
    Math.min(
      96,
      nextWeekHealthScore +
        (nextWeekActiveEntries.length >= 6
          ? 8
          : nextWeekActiveEntries.length >= 4
            ? 4
            : nextWeekActiveEntries.length === 0
              ? -12
              : 0) +
        (nextWeekEveningEntries.length >= 2
          ? 6
          : nextWeekEveningEntries.length === 0
            ? -6
            : 0) +
        (nextWeekWeekendEntries.length >= 1 ? 4 : 0)
    )
  );
  const bookingChanceTone =
    bookingChanceScore >= 78
      ? {
          label: "Hoog",
          className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        }
      : bookingChanceScore >= 56
        ? {
            label: "Gemiddeld",
            className: "border-sky-200 bg-sky-50 text-sky-700",
          }
        : {
            label: "Laag",
            className: "border-amber-200 bg-amber-50 text-amber-700",
          };
  const projectedFillRate =
    bookingChanceScore >= 82
      ? 0.82
      : bookingChanceScore >= 70
        ? 0.71
        : bookingChanceScore >= 58
          ? 0.58
          : bookingChanceScore >= 44
            ? 0.46
            : 0.34;
  const projectedBookings = Number(
    (nextWeekActiveEntries.length * projectedFillRate).toFixed(1)
  );
  const projectedRevenue = Math.round(nextWeekRevenuePotential * projectedFillRate);
  const stretchRevenue = Math.round(
    nextWeekRevenuePotential * Math.min(projectedFillRate + 0.16, 0.94)
  );
  const revenueDelta = nextWeekRevenuePotential - currentWeekRevenuePotential;
  const averageSlotMinutes = nextWeekActiveEntries.length
    ? Math.round(nextWeekTotalMinutes / nextWeekActiveEntries.length)
    : 0;
  const revenueInsights =
    pricePerLesson <= 0
      ? [
          {
            tone: "watch",
            eyebrow: "Prijs ontbreekt",
            title: "Vul eerst je prijs per les aan",
            description:
              "Zonder lesprijs kunnen we je omzetindicatie nog niet berekenen. Zodra je prijs in je profiel staat, zie je hier meteen je commerciële potentieel.",
          },
        ]
      : [
          nextWeekActiveEntries.length === 0
            ? {
                tone: "watch",
                eyebrow: "Omzet",
                title: "Zonder open slots blijft je weekomzet op nul",
                description:
                  "Open minimaal een paar blokken om zichtbaar en boekbaar te worden voor leerlingen in de komende week.",
              }
            : projectedRevenue < currentWeekRevenuePotential * 0.65
              ? {
                  tone: "watch",
                  eyebrow: "Omzet",
                  title: "Je verwachte omzet zakt terug",
                  description: `Bij de huidige planning kom je indicatief uit op ${formatCurrency(projectedRevenue)}. Een extra avond of duplicatie van deze week trekt dat sneller omhoog.`,
                }
              : {
                  tone: "good",
                  eyebrow: "Omzet",
                  title: "Je weekpotentieel ziet er commercieel sterk uit",
                  description: `Bij de huidige opzet ligt je realistische weekomzet rond ${formatCurrency(projectedRevenue)} met een stretch naar ${formatCurrency(stretchRevenue)}.`,
                },
          nextWeekActiveEntries.length < 3
            ? {
                tone: "watch",
                eyebrow: "Volume",
                title: "Je hebt nog weinig boekbare momenten open",
                description: `Je staat nu op ${nextWeekActiveEntries.length} open ${nextWeekActiveEntries.length === 1 ? "slot" : "slots"} voor volgende week. Meer volume geeft leerlingen sneller een passend moment.`,
              }
            : nextWeekActiveEntries.length >= 6
              ? {
                  tone: "good",
                  eyebrow: "Volume",
                  title: "Je volume ondersteunt een sterke boekingskans",
                  description: `Met ${nextWeekActiveEntries.length} open slots en gemiddeld ${formatMinutesLabel(averageSlotMinutes)} per blok staat je agenda aantrekkelijk open.`,
                }
              : {
                  tone: "neutral",
                  eyebrow: "Volume",
                  title: "Je volume is netjes, maar kan nog groeien",
                  description: `Je hebt ${nextWeekActiveEntries.length} open slots klaarstaan. Een extra avond- of weekendmoment kan je boekingskans verder optillen.`,
                },
          nextWeekRevenuePotential <= 0
            ? {
                tone: "neutral",
                eyebrow: "Potentieel",
                title: "Zodra er slots openstaan zie je hier je weekpotentieel",
                description:
                  "De omzetindicatie wordt automatisch opgebouwd uit je actieve slots en je actuele prijs per les.",
              }
            : {
                tone: "neutral",
                eyebrow: "Potentieel",
                title: "Je maximale weekpotentieel staat helder in beeld",
                description: `Als al je open momenten worden geboekt, ligt je plafond voor volgende week op ${formatCurrency(nextWeekRevenuePotential)} ${revenueDelta === 0 ? "en dat is gelijk aan deze week" : revenueDelta > 0 ? `(${formatCurrency(revenueDelta)} hoger dan deze week)` : `(${formatCurrency(Math.abs(revenueDelta))} lager dan deze week)`}.`,
            },
        ];
  const hasWeekCopySuggestion =
    currentWeekActiveEntries.length > 0 &&
    nextWeekActiveEntries.length < currentWeekActiveEntries.length;
  const smartSuggestionCount =
    Number(hasWeekCopySuggestion) +
    Number(Boolean(nextWeekEveningSuggestion)) +
    Number(Boolean(nextWeekWeekendSuggestion));
  const repeatSummaryText = isBlockingMode
    ? useDateRange
      ? `Je blokkeert deze tijd van ${datum} tot en met ${eindDatum}${selectedWeekdaySummary ? ` op ${selectedWeekdaySummary}` : ""}.`
      : isOngoingWeekSchedule
        ? `Je blokkeert ${selectedWeekdaySummary || "de gekozen dag"} nu als vaste weekplanning. Dit blijft elke week doorlopen tot je het wijzigt.`
        : repeatCount > 1
          ? `Je blokkeert ${selectedWeekdaySummary || "de gekozen dag"} automatisch voor ${repeatCount} weken. Deze tijd wordt dan niet boekbaar.`
          : "Gebruik dit om afwezigheid, vakantie of een gesloten moment netjes af te schermen."
    : isWeekScheduleMode
      ? isOngoingWeekSchedule
        ? `Je opent ${selectedWeekdaySummary} nu als vaste weekplanning. Deze werktijden blijven elke week terugkomen tot je ze wijzigt.`
        : repeatCount > 1
          ? `Je opent ${selectedWeekdaySummary} automatisch voor ${repeatCount} weken met dezelfde werktijden.`
          : `Je opent ${selectedWeekdaySummary} in de week van ${currentWeekStart} met dezelfde werktijden.`
      : isOngoingWeekSchedule
        ? "Dit moment wordt nu je vaste weekplanning en blijft elke week terugkomen totdat je hem wijzigt."
        : repeatCount > 1
          ? `Dit blok wordt automatisch ${repeatCount} weken achter elkaar ingepland op dezelfde dag en tijd.`
          : "Kies een terugkerende reeks als je vaste weekblokken wilt openen.";

  function handleCalendarSelect(selection: DateSelectArg) {
    if (selection.allDay) {
      return;
    }

    setDatum(toDateInputValue(selection.start));
    setStartTijd(toTimeInputValue(selection.start));
    setEindTijd(
      toTimeInputValue(
        selection.end ?? new Date(selection.start.getTime() + 90 * 60_000)
      )
    );
  }

  function handleCreateSlot() {
    startTransition(async () => {
      const result = await createAvailabilitySlotAction({
        datum,
        eindDatum: isBlockingMode && useDateRange ? eindDatum : undefined,
        startTijd,
        eindTijd,
        repeatWeeks: isOngoingWeekSchedule ? "ongoing" : repeatCount,
        weekdagen: normalizedWeekdays,
        pauzeStartTijd:
          !isBlockingMode && useBreakWindow ? pauseStartTijd : undefined,
        pauzeEindTijd:
          !isBlockingMode && useBreakWindow ? pauseEindTijd : undefined,
        beschikbaar: !isBlockingMode,
        lesduurMinuten:
          !isBlockingMode && useLessonCadence ? lessonDurationValue : undefined,
        bufferMinuten:
          !isBlockingMode && useLessonCadence ? bufferValue : undefined,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleApplyDurationPreset(durationMinutes: number) {
    setEindTijd(addMinutesToTimeValue(startTijd, durationMinutes));
  }

  function handleApplyShiftPreset(start: string, end: string) {
    setStartTijd(start);
    setEindTijd(end);
  }

  function handleUseSelectedSlotAsTemplate() {
    if (!selectedEntry) {
      return;
    }

    const selectedStart = new Date(selectedEntry.startAt);
    const selectedEnd = new Date(selectedEntry.endAt);

    setDatum(toDateInputValue(selectedStart));
    setEindDatum(toDateInputValue(selectedEnd));
    setStartTijd(toTimeInputValue(selectedStart));
    setEindTijd(toTimeInputValue(selectedEnd));
    setRepeatWeeks("1");
    setSelectedWeekdays([]);
    setUseBreakWindow(false);
    setCreateMode(selectedEntry.beschikbaar ? "beschikbaar" : "afwezig");
    setUseLessonCadence(false);
    toast.success("Het geselecteerde slot staat nu als template in het formulier.");
  }

  function handleToggleWeekday(weekday: number) {
    setSelectedWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((value) => value !== weekday)
        : [...current, weekday]
    );
  }

  function handleApplyWeekdayPreset(weekdays: number[]) {
    setSelectedWeekdays(weekdays);
  }

  function handleApplyBreakPreset(start: string, end: string) {
    setUseBreakWindow(true);
    setPauseStartTijd(start);
    setPauseEindTijd(end);
  }

  function handleApplyLessonCadencePreset(duration: number, buffer: number) {
    setUseLessonCadence(true);
    setLessonDurationMinutes(String(duration));
    setBufferMinutes(String(buffer));
  }

  function updateQuickEditDraft(
    patch:
      | Partial<Omit<QuickEditDraft, "sourceKey">>
      | ((draft: QuickEditDraft) => Partial<Omit<QuickEditDraft, "sourceKey">>)
  ) {
    const nextPatch =
      typeof patch === "function" ? patch(activeQuickEditDraft) : patch;

    setQuickEditDraft({
      ...activeQuickEditDraft,
      ...nextPatch,
      sourceKey: selectedWorkWindowKey,
    });
  }

  function handleResetQuickEdit() {
    setQuickEditDraft(createQuickEditDraft(selectedWorkWindow));
  }

  function handleApplyQuickDurationPreset(durationMinutes: number) {
    updateQuickEditDraft((draft) => ({
      eindTijd: addMinutesToTimeValue(draft.startTijd, durationMinutes),
    }));
  }

  function openEditDialog(mode: "edit-slot" | "edit-series") {
    if (!selectedEntry) {
      return;
    }

    setEditDatum(getAvailabilityDateValue(selectedEntry.startAt));
    setEditStartTijd(formatAvailabilityTime(selectedEntry.startAt));
    setEditEindTijd(formatAvailabilityTime(selectedEntry.endAt));
    setEditAction(mode);
  }

  function handleSaveQuickEdit() {
    if (!selectedEntry) {
      return;
    }

    startTransition(async () => {
      const result =
        isRecurringRuleEntry && selectedEntry.weekroosterId
          ? await updateAvailabilityWeekRuleAction({
              ruleId: selectedEntry.weekroosterId,
              startTijd: quickEditStartTijd,
              eindTijd: quickEditEindTijd,
              pauzeStartTijd:
                selectedEntry.beschikbaar && quickEditUseBreakWindow
                  ? quickEditPauseStartTijd
                  : undefined,
              pauzeEindTijd:
                selectedEntry.beschikbaar && quickEditUseBreakWindow
                  ? quickEditPauseEindTijd
                  : undefined,
            })
          : await updateAvailabilityWindowAction({
              slotId: selectedEntry.id,
              startTijd: quickEditStartTijd,
              eindTijd: quickEditEindTijd,
              pauzeStartTijd:
                selectedEntry.beschikbaar && quickEditUseBreakWindow
                  ? quickEditPauseStartTijd
                  : undefined,
              pauzeEindTijd:
                selectedEntry.beschikbaar && quickEditUseBreakWindow
                  ? quickEditPauseEindTijd
                  : undefined,
            });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleToggleSelectedSlot() {
    if (!selectedEntry) {
      return;
    }

    startTransition(async () => {
      const result =
        isRecurringRuleEntry && selectedEntry.weekroosterId
          ? await updateAvailabilityWeekRuleActiveAction({
              ruleId: selectedEntry.weekroosterId,
              beschikbaar: !selectedEntry.beschikbaar,
            })
          : await updateAvailabilitySlotStatusAction({
              slotId: selectedEntry.id,
              beschikbaar: !selectedEntry.beschikbaar,
            });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDeleteSelectedSlot() {
    if (!selectedEntry) {
      return;
    }

    startTransition(async () => {
      const result =
        isRecurringRuleEntry && selectedEntry.weekroosterId
          ? await deleteAvailabilityWeekRuleAction({
              ruleId: selectedEntry.weekroosterId,
            })
          : await deleteAvailabilitySlotAction({
              slotId: selectedEntry.id,
            });

      if (result.success) {
        setConfirmAction(null);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleToggleSelectedSeries() {
    if (!selectedEntry) {
      return;
    }

    startTransition(async () => {
      const result = await updateAvailabilitySeriesStatusAction({
        slotId: selectedEntry.id,
        beschikbaar: !selectedEntry.beschikbaar,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDeleteSelectedSeries() {
    if (!selectedEntry) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAvailabilitySeriesAction({
        slotId: selectedEntry.id,
      });

      if (result.success) {
        setConfirmAction(null);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDuplicateSelectedToNextWeek() {
    if (!selectedEntry) {
      return;
    }

    startTransition(async () => {
      const nextWeekDate = addDaysToDateValue(
        getAvailabilityDateValue(selectedEntry.startAt),
        7
      );
      const result = await createAvailabilitySlotAction({
        datum: nextWeekDate,
        startTijd: formatAvailabilityTime(selectedEntry.startAt),
        eindTijd: formatAvailabilityTime(selectedEntry.endAt),
        repeatWeeks: 1,
        beschikbaar: selectedEntry.beschikbaar,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleSaveEditAction() {
    if (!selectedEntry || !editAction) {
      return;
    }

    startTransition(async () => {
      const result =
        editAction === "edit-series"
          ? await updateAvailabilitySeriesTimingAction({
              slotId: selectedEntry.id,
              startTijd: editStartTijd,
              eindTijd: editEindTijd,
            })
          : await updateAvailabilitySlotTimingAction({
              slotId: selectedEntry.id,
              datum: editDatum,
              startTijd: editStartTijd,
              eindTijd: editEindTijd,
            });

      if (result.success) {
        setEditAction(null);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleApplyTemplate(templateId: string) {
    startTransition(async () => {
      const result = await applyAvailabilityTemplateAction({
        templateId,
        startDatum: datum,
        repeatWeeks: repeatCount,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDuplicateCurrentWeekToNextWeek() {
    startTransition(async () => {
      const result = await duplicateAvailabilityWeekAction({
        sourceWeekStartDatum: currentWeekStart,
        targetWeekStartDatum: nextWeekStart,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleApplyEveningSuggestion() {
    if (!nextWeekEveningSuggestion) {
      return;
    }

    startTransition(async () => {
      const result = await createAvailabilitySlotAction({
        datum: nextWeekEveningSuggestion.dateValue,
        startTijd: "18:30",
        eindTijd: "20:30",
        repeatWeeks: 1,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleApplyWeekendSuggestion() {
    if (!nextWeekWeekendSuggestion) {
      return;
    }

    startTransition(async () => {
      const result = await createAvailabilitySlotAction({
        datum: nextWeekWeekendSuggestion.dateValue,
        startTijd: "09:00",
        eindTijd: "12:00",
        repeatWeeks: 1,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="availability-manager space-y-4">
      <div className="rounded-[1.4rem] border border-white/70 bg-white/88 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
              Stap 1 - Tijd openen
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Bouw je rooster, buffers en afwezigheid rustig op
            </h2>
            <p className="max-w-3xl text-[13px] leading-6 text-slate-600">
              Stel hier boekbare werktijden in, blokkeer afwezigheid of verdeel je dag direct
              in lesblokken met buffer. Daarna zie je elk moment terug in je agenda.
            </p>
          </div>
          <Badge className="border border-sky-200 bg-sky-50 text-sky-700">
            {scheduleCountLabel}
          </Badge>
        </div>

        <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1.1fr)_22rem]">
          <div className="space-y-4">
            <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/90 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                    Handmatig plannen
                  </p>
                  <h3 className="mt-1.5 text-base font-semibold text-slate-950">
                    Kies type blok, datum of werkweek, tijd en eventuele herhaling
                  </h3>
                  <p className="mt-1 max-w-2xl text-[13px] leading-6 text-slate-600">
                    Sleep straks in de agenda of vul hieronder handmatig je werktijden in.
                    Je kunt hier ook direct niet-boekbare tijd of vakantie blokkeren.
                  </p>
                </div>
                <Badge className="border border-slate-200 bg-white text-slate-700">
                  {isWeekScheduleMode ? `Week van ${currentWeekStart}` : `Start op ${datum}`}
                </Badge>
              </div>

              <div className="mt-3 rounded-[0.95rem] border border-slate-200 bg-white p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-slate-950">Type planning</p>
                    <p className="mt-1 max-w-2xl text-[13px] leading-6 text-slate-600">
                      Kies of je tijd openzet voor leerlingen of juist bewust blokkeert als
                      afwezig, vakantie of gesloten moment.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "rounded-full border-slate-200 bg-white",
                      createMode === "beschikbaar" &&
                        "border-sky-300 bg-sky-50 text-sky-700"
                    )}
                    onClick={() => setCreateMode("beschikbaar")}
                  >
                    <Eye className="size-4" />
                    Boekbaar voor leerlingen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "rounded-full border-slate-200 bg-white",
                      createMode === "afwezig" &&
                        "border-slate-300 bg-slate-100 text-slate-800"
                    )}
                    onClick={() => {
                      setCreateMode("afwezig");
                      setUseLessonCadence(false);
                    }}
                  >
                    <EyeOff className="size-4" />
                    Afwezig of vakantie blokkeren
                  </Button>
                </div>

                {isBlockingMode ? (
                  <div className="mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "rounded-full border-slate-200 bg-white",
                          !useDateRange && "border-slate-950 bg-slate-950 text-white"
                        )}
                        onClick={() => setUseDateRange(false)}
                      >
                        Los afwezig blok
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "rounded-full border-slate-200 bg-white",
                          useDateRange && "border-slate-950 bg-slate-950 text-white"
                        )}
                        onClick={() => {
                          setUseDateRange(true);
                          setEindDatum(datum);
                          if (repeatWeeks === "ongoing") {
                            setRepeatWeeks("1");
                          }
                        }}
                      >
                        Vakantieperiode van-tot
                      </Button>
                    </div>
                    <p className="mt-2.5 text-[13px] leading-6 text-slate-600">
                      Gebruik `van-tot` voor meivakantie, vrije weken of langere afwezigheid
                      zonder elke dag los te blokkeren.
                    </p>
                  </div>
                ) : null}
              </div>

              <div
                className={cn(
                  "mt-4 grid gap-3 md:grid-cols-2",
                  isBlockingMode && useDateRange ? "xl:grid-cols-5" : "xl:grid-cols-4"
                )}
              >
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-slate-700">Datum</label>
                  <Input
                    type="date"
                    value={datum}
                    onChange={(event) => setDatum(event.target.value)}
                    className="h-10 rounded-[0.9rem] border-slate-200 bg-white text-[13px]"
                  />
                </div>
                {isBlockingMode && useDateRange ? (
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-slate-700">Tot en met</label>
                    <Input
                      type="date"
                      value={eindDatum}
                      onChange={(event) => setEindDatum(event.target.value)}
                      className="h-10 rounded-[0.9rem] border-slate-200 bg-white text-[13px]"
                    />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-slate-700">Starttijd</label>
                  <Input
                    type="time"
                    value={startTijd}
                    onChange={(event) => setStartTijd(event.target.value)}
                    className="h-10 rounded-[0.9rem] border-slate-200 bg-white text-[13px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-slate-700">Eindtijd</label>
                  <Input
                    type="time"
                    value={eindTijd}
                    onChange={(event) => setEindTijd(event.target.value)}
                    className="h-10 rounded-[0.9rem] border-slate-200 bg-white text-[13px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-slate-700">Herhaling</label>
                  <select
                    value={repeatWeeks}
                    onChange={(event) => setRepeatWeeks(event.target.value)}
                    className="native-select h-10 w-full rounded-[0.9rem] px-3 text-[13px]"
                  >
                    <option value="1">Eenmalig</option>
                    <option value="2">Elke week, 2 weken totaal</option>
                    <option value="4">Elke week, 4 weken totaal</option>
                    <option value="6">Elke week, 6 weken totaal</option>
                    <option value="8">Elke week, 8 weken totaal</option>
                    <option value="12">Elke week, 12 weken totaal</option>
                    {!useDateRange ? (
                      <option value="ongoing">Vaste weekplanning, elke week doorlopend</option>
                    ) : null}
                  </select>
                </div>
              </div>

              <p className="mt-2.5 text-[13px] leading-6 text-slate-500">
                {repeatSummaryText}
              </p>

              <div className="mt-3 rounded-[0.95rem] border border-slate-200 bg-white p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Snelle werkdag-presets
                    </p>
                    <p className="mt-1 max-w-2xl text-sm leading-7 text-slate-600">
                      Zet met een klik een veelgebruikte werktijd klaar en verfijn daarna
                      eventueel de details.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {shiftPresets.map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-slate-200 bg-slate-50"
                      onClick={() => handleApplyShiftPreset(preset.start, preset.end)}
                    >
                      {preset.label} {preset.start}-{preset.end}
                    </Button>
                  ))}
                </div>
              </div>

              {!isBlockingMode ? (
                <div className="mt-3 rounded-[0.95rem] border border-slate-200 bg-white p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-slate-950">
                        Lesblokken en buffer
                      </p>
                      <p className="mt-1 max-w-2xl text-[13px] leading-6 text-slate-600">
                        Laat een groter werkblok automatisch opdelen in kleinere boekbare lessen,
                        met optioneel rust of reistijd ertussen.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "rounded-full border-slate-200 bg-slate-50",
                        useLessonCadence && "border-sky-300 bg-sky-50 text-sky-700"
                      )}
                      onClick={() => setUseLessonCadence((current) => !current)}
                    >
                      {useLessonCadence ? "Buffer actief" : "Lesblokken gebruiken"}
                    </Button>
                  </div>

                  {useLessonCadence ? (
                    <>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Lesduur
                          </label>
                          <select
                            value={lessonDurationMinutes}
                            onChange={(event) => setLessonDurationMinutes(event.target.value)}
                            className="native-select h-10 w-full rounded-[0.9rem] px-3 text-[13px]"
                          >
                            <option value="60">60 minuten</option>
                            <option value="75">75 minuten</option>
                            <option value="90">90 minuten</option>
                            <option value="120">120 minuten</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Buffer tussen lessen
                          </label>
                          <select
                            value={bufferMinutes}
                            onChange={(event) => setBufferMinutes(event.target.value)}
                            className="native-select h-10 w-full rounded-[0.9rem] px-3 text-[13px]"
                          >
                            <option value="0">Geen buffer</option>
                            <option value="10">10 minuten</option>
                            <option value="15">15 minuten</option>
                            <option value="20">20 minuten</option>
                            <option value="30">30 minuten</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full border-slate-200 bg-slate-50"
                          onClick={() => handleApplyLessonCadencePreset(90, 15)}
                        >
                          90 min + 15 buffer
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full border-slate-200 bg-slate-50"
                          onClick={() => handleApplyLessonCadencePreset(60, 10)}
                        >
                          60 min + 10 buffer
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full border-slate-200 bg-slate-50"
                          onClick={() => handleApplyLessonCadencePreset(120, 15)}
                        >
                          120 min + 15 buffer
                        </Button>
                      </div>

                      <p className="mt-2.5 text-[13px] leading-6 text-slate-500">
                        {cadencePreviewCount > 0
                          ? `${cadencePreviewCount} boekbare lesblok${cadencePreviewCount === 1 ? "" : "ken"} passen in dit tijdvak${useBreakWindow && hasBreakPreview ? ", rekening houdend met je pauze" : ""}.`
                          : "Binnen dit tijdvak past nog geen geldig lesblok. Verleng je werktijd of kies een kortere lesduur."}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2.5 text-[13px] leading-6 text-slate-500">
                      Handig als je liever met vaste lesblokken werkt dan met een groot open
                      werkblok.
                    </p>
                  )}
                </div>
              ) : null}

              <div className="mt-3 rounded-[0.95rem] border border-slate-200 bg-white p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                      <p className="text-[13px] font-semibold text-slate-950">
                      Werkdagen instellen
                    </p>
                      <p className="mt-1 max-w-2xl text-[13px] leading-6 text-slate-600">
                      Selecteer een of meer werkdagen als je dezelfde werktijden in een week of
                      reeks wilt openen.
                    </p>
                  </div>
                  {isWeekScheduleMode ? (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-sky-700 uppercase">
                      {normalizedWeekdays.length} dag{normalizedWeekdays.length === 1 ? "" : "en"} gekozen
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                      Optioneel
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {weekdayOptions.map((weekday) => {
                    const active = normalizedWeekdays.includes(weekday.value);

                    return (
                      <Button
                        key={weekday.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "rounded-full border-slate-200 bg-white px-4",
                          active &&
                            "border-sky-300 bg-sky-50 text-sky-700 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.8)]"
                        )}
                        onClick={() => handleToggleWeekday(weekday.value)}
                      >
                        {weekday.shortLabel}
                      </Button>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-slate-200 bg-slate-50"
                    onClick={() => handleApplyWeekdayPreset([1, 2, 3, 4, 5])}
                  >
                    Ma-vr
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-slate-200 bg-slate-50"
                    onClick={() => handleApplyWeekdayPreset([6, 7])}
                  >
                    Weekend
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-slate-200 bg-slate-50"
                    onClick={() => setSelectedWeekdays([])}
                  >
                    Alleen losse datum
                  </Button>
                </div>
              </div>

              {!isBlockingMode ? (
                <div className="mt-3 rounded-[0.95rem] border border-slate-200 bg-white p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Pauzemoment inplannen
                    </p>
                    <p className="mt-1 max-w-2xl text-sm leading-7 text-slate-600">
                      Laat je werkdag automatisch opsplitsen in twee boekbare blokken, bijvoorbeeld
                      rondom lunch of een korte rustpauze.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-full border-slate-200 bg-slate-50",
                      useBreakWindow && "border-sky-300 bg-sky-50 text-sky-700"
                    )}
                    onClick={() => setUseBreakWindow((current) => !current)}
                  >
                    {useBreakWindow ? "Pauze actief" : "Pauze toevoegen"}
                  </Button>
                </div>

                {useBreakWindow ? (
                  <>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Pauze start
                        </label>
                        <Input
                          type="time"
                          value={pauseStartTijd}
                          onChange={(event) => setPauseStartTijd(event.target.value)}
                          className="h-10 rounded-[0.9rem] border-slate-200 bg-white text-[13px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Pauze einde
                        </label>
                        <Input
                          type="time"
                          value={pauseEindTijd}
                          onChange={(event) => setPauseEindTijd(event.target.value)}
                          className="h-10 rounded-[0.9rem] border-slate-200 bg-white text-[13px]"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {breakPresets.map((preset) => (
                        <Button
                          key={preset.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full border-slate-200 bg-slate-50"
                          onClick={() => handleApplyBreakPreset(preset.start, preset.end)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {hasBreakPreview
                        ? `Leerlingen zien dan twee boekbare blokken: ${startTijd}-${pauseStartTijd} en ${pauseEindTijd}-${eindTijd}${isWeekScheduleMode ? " op elke gekozen werkdag" : ""}.`
                        : "Kies een pauze die binnen je werktijd valt en houd voor en na de pauze minimaal 30 minuten over."}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Handig als je een lunch, schoolrun of korte adempauze in je rooster wilt
                    meenemen zonder alles los op te knippen.
                  </p>
                )}
              </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleCreateSlot}
                  disabled={isPending || !datum || !startTijd || !eindTijd}
                  className={cn(
                    "h-10 rounded-full px-4 text-[13px] text-white shadow-[0_18px_38px_-24px_rgba(14,116,144,0.4)]",
                    isBlockingMode
                      ? "bg-[linear-gradient(135deg,#334155,#475569,#64748b)]"
                      : "bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)]"
                  )}
                >
                  <CalendarPlus2 className="size-4" />
                  {isPending
                    ? "Opslaan..."
                    : isBlockingMode
                      ? repeatCount > 1 || isWeekScheduleMode
                        ? "Afwezigheid blokkeren"
                        : "Afwezig blok toevoegen"
                    : isWeekScheduleMode
                      ? repeatCount > 1
                        ? "Werkrooster toevoegen"
                        : "Werkdagen toevoegen"
                      : useLessonCadence
                        ? "Lesblokken toevoegen"
                      : useBreakWindow
                        ? "Werkdag met pauze toevoegen"
                      : repeatCount > 1
                        ? "Wekelijkse reeks toevoegen"
                        : "Tijdslot toevoegen"}
                </Button>
                <span className="text-sm text-slate-500">
                  {isBlockingMode
                    ? "Deze tijd blijft intern zichtbaar, maar is niet boekbaar voor leerlingen."
                    : useLessonCadence
                      ? "Je werkblok wordt automatisch opgesplitst in aparte lesblokken."
                    : useBreakWindow
                    ? "Voor en na de pauze moet minimaal 30 minuten boekbare tijd overblijven."
                    : "Een blok van minimaal 30 minuten werkt het best voor directe planning."}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Snelle duur:</span>
                {[60, 90, 120].map((duration) => (
                  <Button
                    key={duration}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-slate-200 bg-white"
                    onClick={() => handleApplyDurationPreset(duration)}
                  >
                    {duration} min
                  </Button>
                ))}
                {selectedEntry ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-slate-200 bg-white"
                    onClick={handleUseSelectedSlotAsTemplate}
                  >
                    <CopyPlus className="size-4" />
                    Gebruik geselecteerd blok
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/90 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Templates
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    Gebruik vaste patronen zonder opnieuw alles in te voeren
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm leading-7 text-slate-600">
                    Templates starten in de week van de gekozen datum en nemen dezelfde
                    herhaling over als je huidige instelling.
                  </p>
                </div>
                <Badge className="border border-sky-200 bg-sky-50 text-sky-700">
                  Startweek {datum}
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {availabilityTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-[1rem] border border-slate-200 bg-white p-3 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.18)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-950">
                          {template.title}
                        </p>
                        <p className="mt-1 text-sm leading-7 text-slate-600">
                          {template.description}
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-slate-600 uppercase">
                        {template.badge}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {template.blocks.map((block) => (
                        <span
                          key={`${template.id}-${block.label}`}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                        >
                          {block.label}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4">
                      <Button
                        variant="outline"
                        className="h-10 w-full rounded-full border-slate-200 bg-white"
                        onClick={() => handleApplyTemplate(template.id)}
                        disabled={isPending}
                      >
                        <CalendarPlus2 className="size-4" />
                        Template toepassen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.1rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.9))] p-3 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.18)]">
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Overzicht
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">
                Je planning in een oogopslag
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  { label: "Actieve slots", value: `${activeCount}`, icon: Sparkles },
                  {
                    label: "Volgende week open",
                    value: formatMinutesLabel(nextWeekTotalMinutes),
                    icon: CalendarDays,
                  },
                  {
                    label: "Deze week",
                    value: `${weeklyCount}`,
                    icon: CalendarClock,
                  },
                  { label: "Niet boekbaar", value: `${hiddenCount}`, icon: EyeOff },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[0.9rem] border border-white/90 bg-white/92 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="size-4 text-sky-700" />
                      <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                        {item.label}
                      </p>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.1rem] border border-slate-200 bg-white p-3 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.14)]">
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Werkwijze
              </p>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                <p>1. Kies of je tijd opent, splitst in lesblokken of juist blokkeert.</p>
                <p>2. Controleer in de agenda of alles op de juiste dag en tijd staat.</p>
                <p>3. Beheer daarna losse blokken of hele reeksen vanuit het geselecteerde slot.</p>
              </div>
              <div className="mt-4 rounded-[1.2rem] border border-sky-100 bg-sky-50/70 p-3">
                <p className="text-xs font-semibold tracking-[0.16em] text-sky-700 uppercase">
                  Huidige focus
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {selectedEntry
                    ? `${selectedEntry.shortDay} - ${selectedEntry.tijdvak}`
                    : "Nog geen tijdslot geselecteerd. Kies straks een blok in je agenda voor snelle beheeracties."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.4rem] border border-white/70 bg-white/88 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
              Stap 2 - Agenda beheren
            </p>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">
              Bekijk je agenda en beheer je tijdsloten vanuit een vaste plek
            </h3>
            <p className="max-w-3xl text-[13px] leading-6 text-slate-600">
              Gebruik de kalender als hoofdweergave. Klik op een bestaand slot om rechts de
              details en acties rustig bij elkaar te zien.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={visibilityFilter}
              onChange={(event) => setVisibilityFilter(event.target.value)}
              className="native-select h-9 rounded-full px-3 text-sm"
            >
              <option value="alles">Alles tonen</option>
              <option value="actief">Alleen boekbaar</option>
              <option value="verborgen">Alleen niet boekbaar</option>
            </select>
            <Badge variant="info">Boekbaar voor leerling</Badge>
            <Badge className="border border-slate-200 bg-slate-100 text-slate-700">
              Niet boekbaar intern
            </Badge>
          </div>
        </div>

        <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1.15fr)_20rem]">
          <div className="min-w-0 space-y-4">
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-7 text-slate-600">
              Sleep in de weekweergave om datum en tijden meteen in het formulier te zetten. Dat
              is de snelste manier om vaste maandag- of zaterdagblokken te openen.
            </div>
            <div className="lesson-calendar-shell rounded-[1.2rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-2.5">
              <div className="lesson-calendar lesson-calendar--default">
                <FullCalendar
                  key={compact ? "compact" : "wide"}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  locale={nlLocale}
                  initialDate={selectedEntry?.startAt ?? undefined}
                  initialView={compact ? "dayGridMonth" : "timeGridWeek"}
                  headerToolbar={
                    compact
                      ? {
                          left: "prev,next",
                          center: "title",
                          right: "dayGridMonth,timeGridDay",
                        }
                      : {
                          left: "prev,next today",
                          center: "title",
                          right: "dayGridMonth,timeGridWeek,timeGridDay",
                        }
                  }
                  buttonText={{
                    today: "Vandaag",
                    month: "Maand",
                    week: "Week",
                    day: "Dag",
                  }}
                  firstDay={1}
                  allDaySlot={false}
                  nowIndicator
                  selectable
                  selectMirror
                  height="auto"
                  fixedWeekCount={false}
                  dayMaxEventRows={compact ? 2 : 3}
                  slotMinTime="07:00:00"
                  slotMaxTime="22:00:00"
                  eventTimeFormat={{
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }}
                  slotLabelFormat={{
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }}
                  eventOrder="start,-duration,title"
                  events={events}
                  select={handleCalendarSelect}
                  eventClick={(info) => setSelectedSlotId(info.event.id)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 self-start 2xl:sticky 2xl:top-6">
            <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/90 p-3">
              {selectedEntry ? (
                <>
                  <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                    Geselecteerd tijdslot
                  </p>
                  <h4 className="mt-3 text-lg font-semibold text-slate-950">
                    {selectedEntry.dag}
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                        selectedEntry.beschikbaar
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-700"
                      )}
                    >
                      {selectedEntry.beschikbaar ? "Boekbaar voor leerlingen" : "Niet boekbaar"}
                    </span>
                    {selectedSeriesCount > 1 ? (
                      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        Reeks vanaf hier: {selectedSeriesCount} blokken
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.18)]">
                        <Clock3 className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                          Tijdvak
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {selectedEntry.tijdvak}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.18)]">
                        <CalendarClock className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                          Moment
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {selectedEntry.momentLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.18)]">
                        <Sparkles className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                          Duur
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {selectedEntry.durationLabel}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-200/80 pt-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                          Snelle aanpassing
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          Pas werktijd en pauze direct aan
                        </p>
                        <p className="mt-1 text-sm leading-7 text-slate-600">
                          Werk hier meteen je tijden bij. De agenda ververst direct zodra je opslaat.
                        </p>
                      </div>
                      {selectedWorkWindow ? (
                        <Badge className="border border-sky-200 bg-sky-50 text-sky-700">
                          {selectedWorkWindow.slots.length > 1
                            ? `${selectedWorkWindow.slots.length} gekoppelde blokken`
                            : "1 blok"}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Starttijd</label>
                        <Input
                          type="time"
                          value={quickEditStartTijd}
                          onChange={(event) =>
                            updateQuickEditDraft({ startTijd: event.target.value })
                          }
                          className="h-10 rounded-[0.9rem] border-slate-200 bg-white text-[13px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Eindtijd</label>
                        <Input
                          type="time"
                          value={quickEditEindTijd}
                          onChange={(event) =>
                            updateQuickEditDraft({ eindTijd: event.target.value })
                          }
                          className="h-10 rounded-[0.9rem] border-slate-200 bg-white text-[13px]"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {[60, 90, 120].map((duration) => (
                        <Button
                          key={duration}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full border-slate-200 bg-white"
                          onClick={() => handleApplyQuickDurationPreset(duration)}
                        >
                          {duration} min
                        </Button>
                      ))}
                    </div>

                    {selectedEntry.beschikbaar ? (
                      <div className="mt-4 rounded-[0.95rem] border border-slate-200 bg-white p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">Pauze inplannen</p>
                            <p className="mt-1 text-sm leading-7 text-slate-600">
                              Handig voor lunch of een korte rustpauze midden in je werkblok.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full border-slate-200 bg-white"
                            onClick={() =>
                              updateQuickEditDraft((draft) => ({
                                useBreakWindow: !draft.useBreakWindow,
                              }))
                            }
                          >
                            {quickEditUseBreakWindow ? "Pauze actief" : "Pauze toevoegen"}
                          </Button>
                        </div>

                        {quickEditUseBreakWindow ? (
                          <>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                  Pauze start
                                </label>
                                <Input
                                  type="time"
                                  value={quickEditPauseStartTijd}
                                  onChange={(event) =>
                                    updateQuickEditDraft({
                                      pauseStartTijd: event.target.value,
                                    })
                                  }
                                  className="h-10 rounded-[0.9rem] border-slate-200 bg-white text-[13px]"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                  Pauze einde
                                </label>
                                <Input
                                  type="time"
                                  value={quickEditPauseEindTijd}
                                  onChange={(event) =>
                                    updateQuickEditDraft({
                                      pauseEindTijd: event.target.value,
                                    })
                                  }
                                  className="h-10 rounded-[0.9rem] border-slate-200 bg-white text-[13px]"
                                />
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {breakPresets.map((preset) => (
                                <Button
                                  key={preset.label}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full border-slate-200 bg-white"
                                  onClick={() =>
                                    updateQuickEditDraft({
                                      useBreakWindow: true,
                                      pauseStartTijd: preset.start,
                                      pauseEindTijd: preset.end,
                                    })
                                  }
                                >
                                  {preset.label}
                                </Button>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[0.95rem] border border-slate-200 bg-white p-3 text-sm leading-7 text-slate-600">
                        Dit is nu een niet-boekbaar blok. Je kunt hier wel begin- en eindtijd aanpassen;
                        een pauze is alleen relevant voor boekbare werktijden.
                      </div>
                    )}

                    <div className="mt-3 rounded-[0.95rem] border border-slate-200 bg-white p-3">
                      <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                        Agenda preview
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        {selectedEntry.beschikbaar && quickEditUseBreakWindow
                          ? quickEditHasBreakPreview
                            ? `Na opslaan toont je agenda ${quickEditStartTijd}-${quickEditPauseStartTijd} en ${quickEditPauseEindTijd}-${quickEditEindTijd}.`
                            : "Kies een pauze die binnen je werktijd valt en houd voor en na de pauze minimaal 30 minuten over."
                          : `Na opslaan toont je agenda een blok van ${quickEditStartTijd} tot ${quickEditEindTijd}.`}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                      <Button
                        className="h-11 rounded-full bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] text-white"
                        onClick={handleSaveQuickEdit}
                        disabled={
                          isPending ||
                          !quickEditStartTijd ||
                          !quickEditEindTijd ||
                          (selectedEntry.beschikbaar &&
                            quickEditUseBreakWindow &&
                            (!quickEditPauseStartTijd || !quickEditPauseEindTijd))
                        }
                      >
                        <Edit3 className="size-4" />
                        {isPending
                          ? "Agenda bijwerken..."
                          : isRecurringRuleEntry
                            ? "Vaste weekplanning bijwerken"
                            : "Werkblok direct bijwerken"}
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10 rounded-full border-slate-200 bg-white"
                        onClick={handleResetQuickEdit}
                        disabled={isPending}
                      >
                        Reset naar huidige selectie
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-200/80 pt-4">
                    <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      {isRecurringRuleEntry ? "Vaste weekplanning" : "Los blok"}
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      {!isRecurringRuleEntry ? (
                        <Button
                          variant="outline"
                          className="h-11 rounded-full border-slate-200 bg-white"
                          onClick={() => openEditDialog("edit-slot")}
                          disabled={isPending}
                        >
                          <Edit3 className="size-4" />
                          Bewerk tijdslot
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        className="h-11 rounded-full border-slate-200 bg-white"
                        onClick={handleToggleSelectedSlot}
                        disabled={isPending}
                      >
                        {selectedEntry.beschikbaar ? (
                          <>
                            <EyeOff className="size-4" />
                            Maak niet boekbaar
                          </>
                        ) : (
                          <>
                            <Eye className="size-4" />
                            Maak weer boekbaar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        className="h-11 rounded-full"
                        onClick={() => setConfirmAction("delete-slot")}
                        disabled={isPending}
                      >
                        <Trash2 className="size-4" />
                        {isRecurringRuleEntry
                          ? "Verwijder vaste weekplanning"
                          : "Verwijder tijdslot"}
                      </Button>
                    </div>
                    {isRecurringRuleEntry ? (
                      <p className="mt-3 text-sm leading-7 text-slate-500">
                        Deze vaste weekplanning blijft elke week zichtbaar totdat je haar
                        hier wijzigt of verwijdert.
                      </p>
                    ) : null}
                  </div>

                  {!isRecurringRuleEntry ? (
                    <>
                      <div className="mt-4 border-t border-slate-200/80 pt-4">
                        <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                          Hele reeks vanaf hier
                        </p>
                        <div className="mt-3 flex flex-col gap-2">
                          <Button
                            variant="outline"
                            className="h-11 rounded-full border-slate-200 bg-white"
                            onClick={() => openEditDialog("edit-series")}
                            disabled={isPending || selectedSeriesCount <= 1}
                          >
                            <Edit3 className="size-4" />
                            Bewerk reeks
                          </Button>
                          <Button
                            variant="outline"
                            className="h-11 rounded-full border-slate-200 bg-white"
                            onClick={handleToggleSelectedSeries}
                            disabled={isPending || selectedSeriesCount <= 1}
                          >
                            {selectedEntry.beschikbaar ? (
                              <>
                                <EyeOff className="size-4" />
                                Verberg reeks
                              </>
                            ) : (
                              <>
                                <Eye className="size-4" />
                                Activeer reeks
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            className="h-11 rounded-full"
                            onClick={() => setConfirmAction("delete-series")}
                            disabled={isPending || selectedSeriesCount <= 1}
                          >
                            <Trash2 className="size-4" />
                            Verwijder reeks
                          </Button>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-500">
                          Reeksacties pakken alle toekomstige blokken mee met dezelfde weekdag en
                          hetzelfde tijdvak als dit geselecteerde moment.
                        </p>
                      </div>

                      <div className="mt-4 border-t border-slate-200/80 pt-4">
                        <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                          Snelle actie
                        </p>
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            className="h-11 w-full rounded-full border-slate-200 bg-white"
                            onClick={handleDuplicateSelectedToNextWeek}
                            disabled={isPending}
                          >
                            <CopyPlus className="size-4" />
                            Kopieer naar volgende week
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                    Nog leeg
                  </p>
                  <h4 className="mt-3 text-lg font-semibold text-slate-950">
                    Je agenda heeft nog geen tijdsloten
                  </h4>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Voeg hierboven je eerste beschikbare blok toe. Daarna kun je
                    die hier blijven aanscherpen en later gericht vrijgeven voor planning.
                  </p>
                </>
              )}
            </div>

            <div className="hidden rounded-[1.1rem] border border-slate-200 bg-slate-50/90 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Beschikbaarheidshealth
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    Zie hoe sterk je volgende week staat
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600">
                    We kijken naar volume, spreiding en prime-time dekking zodat je sneller ziet
                    waar nog winst ligt.
                  </p>
                </div>
                <Badge className={cn("border", nextWeekHealthBadge.className)}>
                  {nextWeekHealthBadge.label} - {nextWeekHealthScore}/100
                </Badge>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={cn("h-full rounded-full", nextWeekHealthBadge.barClassName)}
                  style={{ width: `${nextWeekHealthScore}%` }}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Open uren",
                    value: formatMinutesLabel(nextWeekTotalMinutes),
                    hint: "Volgende week",
                  },
                  {
                    label: "Actieve dagen",
                    value: `${nextWeekDaySpread} ${nextWeekDaySpread === 1 ? "dag" : "dagen"}`,
                    hint: "Verspreiding",
                  },
                  {
                    label: "Trend",
                    value: formatMinutesDeltaLabel(capacityDeltaMinutes),
                    hint: "Vs deze week",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[0.9rem] border border-white/80 bg-white/90 p-2.5 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]"
                  >
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                {nextWeekHealthInsights.map((insight) => (
                  <div
                    key={insight.title}
                    className={cn(
                      "rounded-[1.2rem] border p-4",
                      insight.tone === "good"
                        ? "border-emerald-200 bg-emerald-50/70"
                        : insight.tone === "watch"
                          ? "border-amber-200 bg-amber-50/80"
                          : "border-slate-200 bg-white/90"
                    )}
                  >
                    <p
                      className={cn(
                        "text-[11px] font-semibold tracking-[0.16em] uppercase",
                        insight.tone === "good"
                          ? "text-emerald-700"
                          : insight.tone === "watch"
                            ? "text-amber-700"
                            : "text-slate-500"
                      )}
                    >
                      {insight.eyebrow}
                    </p>
                    <p className="mt-2 font-semibold text-slate-950">{insight.title}</p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden rounded-[1.1rem] border border-slate-200 bg-slate-50/90 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Commerciële vooruitblik
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    Zie wat je open agenda ongeveer kan opleveren
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600">
                    Deze indicatie combineert je actieve slots, prijs per les en spreiding in de
                    komende week.
                  </p>
                </div>
                <Badge className={cn("border", bookingChanceTone.className)}>
                  Boekingskans {bookingChanceTone.label} - {bookingChanceScore}%
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: "Prijs per les",
                    value: pricePerLesson > 0 ? formatCurrency(pricePerLesson) : "Nog leeg",
                    hint: "Profielprijs",
                  },
                  {
                    label: "Verwachte boekingen",
                    value:
                      nextWeekActiveEntries.length > 0 ? `${projectedBookings}` : "0",
                    hint: "Indicatief voor volgende week",
                  },
                  {
                    label: "Realistische weekomzet",
                    value:
                      pricePerLesson > 0 ? formatCurrency(projectedRevenue) : "Vul prijs in",
                    hint: "Bij huidige openstelling",
                  },
                  {
                    label: "Vol potentieel",
                    value:
                      pricePerLesson > 0
                        ? formatCurrency(nextWeekRevenuePotential)
                        : "Nog niet berekend",
                    hint: "Als alle open slots boeken",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[0.9rem] border border-white/80 bg-white/90 p-3 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]"
                  >
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-[0.9rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(59,130,246,0.12),rgba(255,255,255,0.9))] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border border-slate-200 bg-white text-slate-700">
                    Stretch-potentieel {pricePerLesson > 0 ? formatCurrency(stretchRevenue) : "beschikbaar na prijs"}
                  </Badge>
                  <Badge className="border border-white/80 bg-white/80 text-slate-700">
                    {nextWeekPrimeTimeSlots} prime-time {nextWeekPrimeTimeSlots === 1 ? "slot" : "slots"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Prime-time telt hier als avond of weekend. Juist die momenten verhogen vaak je
                  boekingskans bij leerlingen met werk, studie of gezinsdrukte.
                </p>
              </div>

              <div className="mt-4 grid gap-3">
                {revenueInsights.map((insight) => (
                  <div
                    key={insight.title}
                    className={cn(
                      "rounded-[1.2rem] border p-4",
                      insight.tone === "good"
                        ? "border-emerald-200 bg-emerald-50/70"
                        : insight.tone === "watch"
                          ? "border-amber-200 bg-amber-50/80"
                          : "border-slate-200 bg-white/90"
                    )}
                  >
                    <p
                      className={cn(
                        "text-[11px] font-semibold tracking-[0.16em] uppercase",
                        insight.tone === "good"
                          ? "text-emerald-700"
                          : insight.tone === "watch"
                            ? "text-amber-700"
                            : "text-slate-500"
                      )}
                    >
                      {insight.eyebrow}
                    </p>
                    <p className="mt-2 font-semibold text-slate-950">{insight.title}</p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden rounded-[1.1rem] border border-slate-200 bg-slate-50/90 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Slimme suggesties
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    Snelle acties op basis van je planning
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600">
                    Deze voorstellen kijken naar gaten in je komende planning en vullen die met
                    een klik.
                  </p>
                </div>
                <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                  Live advies
                </Badge>
              </div>

              <div className="mt-4 grid gap-3">
                {currentWeekActiveEntries.length > 0 &&
                nextWeekActiveEntries.length < currentWeekActiveEntries.length ? (
                  <div className="rounded-[0.95rem] border border-slate-200 bg-white p-3 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]">
                    <p className="font-semibold text-slate-950">
                      Volgende week heeft minder open blokken dan deze week
                    </p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      Deze week heeft {currentWeekActiveEntries.length} actieve blokken en
                      volgende week {nextWeekActiveEntries.length}. Je kunt de actieve blokken
                      van deze week in een keer doorschuiven.
                    </p>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        className="h-10 rounded-full border-slate-200 bg-white"
                        onClick={handleDuplicateCurrentWeekToNextWeek}
                        disabled={isPending}
                      >
                        <CopyPlus className="size-4" />
                        Dupliceer deze week naar volgende week
                      </Button>
                    </div>
                  </div>
                ) : null}

                {nextWeekEveningSuggestion ? (
                  <div className="rounded-[0.95rem] border border-slate-200 bg-white p-3 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]">
                    <p className="font-semibold text-slate-950">
                      Open een extra avondslot volgende week
                    </p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      Je avondplanning kan sterker. Voeg direct {nextWeekEveningSuggestion.label} toe
                      om beter zichtbaar te zijn voor leerlingen na werk of studie.
                    </p>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        className="h-10 rounded-full border-slate-200 bg-white"
                        onClick={handleApplyEveningSuggestion}
                        disabled={isPending}
                      >
                        <CalendarPlus2 className="size-4" />
                        Avondslot toevoegen
                      </Button>
                    </div>
                  </div>
                ) : null}

                {nextWeekWeekendSuggestion ? (
                  <div className="rounded-[0.95rem] border border-slate-200 bg-white p-3 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]">
                    <p className="font-semibold text-slate-950">
                      Je weekend heeft nog ruimte
                    </p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      Weekendslots trekken vaak leerlingen aan die doordeweeks minder flexibel
                      zijn. Voeg direct {nextWeekWeekendSuggestion.label} toe.
                    </p>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        className="h-10 rounded-full border-slate-200 bg-white"
                        onClick={handleApplyWeekendSuggestion}
                        disabled={isPending}
                      >
                        <CalendarPlus2 className="size-4" />
                        Weekendblok toevoegen
                      </Button>
                    </div>
                  </div>
                ) : null}

                {!(
                  (currentWeekActiveEntries.length > 0 &&
                    nextWeekActiveEntries.length < currentWeekActiveEntries.length) ||
                  nextWeekEveningSuggestion ||
                  nextWeekWeekendSuggestion
                ) ? (
                  <div className="rounded-[0.95rem] border border-dashed border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600">
                    Je komende planning ziet er nu mooi in balans uit. Zodra er gaten ontstaan,
                    verschijnen hier automatisch nieuwe suggesties.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="hidden rounded-[1.1rem] border border-dashed border-slate-200 bg-slate-50/80 p-3">
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Tip
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                In de weekweergave kun je ook slepen om datum en tijden meteen in het formulier
                te zetten. Combineer dat met een herhaling als je vaste maandag- of zaterdagblokken
                wilt openen.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.4rem] border border-white/70 bg-white/88 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
              Stap 3 - Inzichten en advies
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Bekijk alleen de inzichten die je nu nodig hebt
            </h3>
            <p className="max-w-3xl text-sm leading-7 text-slate-600">
              Health, omzet en slimme suggesties staan nu los van je agenda. Daardoor voelt de
              planning rustiger en kun je gerichter schakelen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "health", label: "Health", meta: `${nextWeekHealthScore}/100` },
              {
                key: "commercial",
                label: "Omzet",
                meta:
                  pricePerLesson > 0 ? formatCurrency(projectedRevenue) : "Prijs ontbreekt",
              },
              {
                key: "suggestions",
                label: "Acties",
                meta: smartSuggestionCount ? `${smartSuggestionCount} live` : "Rustig",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() =>
                  setInsightView(tab.key as "health" | "commercial" | "suggestions")
                }
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  insightView === tab.key
                    ? "border-slate-950 bg-slate-950 text-white shadow-[0_18px_40px_-26px_rgba(15,23,42,0.45)]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950"
                )}
              >
                {tab.label} - {tab.meta}
              </button>
            ))}
          </div>
        </div>

        {insightView === "health" ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/90 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Beschikbaarheidshealth
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    Zie hoe sterk je volgende week staat
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600">
                    We kijken naar volume, spreiding en prime-time dekking zodat je sneller ziet
                    waar nog winst ligt.
                  </p>
                </div>
                <Badge className={cn("border", nextWeekHealthBadge.className)}>
                  {nextWeekHealthBadge.label} - {nextWeekHealthScore}/100
                </Badge>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={cn("h-full rounded-full", nextWeekHealthBadge.barClassName)}
                  style={{ width: `${nextWeekHealthScore}%` }}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Open uren",
                    value: formatMinutesLabel(nextWeekTotalMinutes),
                    hint: "Volgende week",
                  },
                  {
                    label: "Actieve dagen",
                    value: `${nextWeekDaySpread} ${nextWeekDaySpread === 1 ? "dag" : "dagen"}`,
                    hint: "Verspreiding",
                  },
                  {
                    label: "Trend",
                    value: formatMinutesDeltaLabel(capacityDeltaMinutes),
                    hint: "Vs deze week",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[0.9rem] border border-white/80 bg-white/90 p-2.5 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]"
                  >
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              {nextWeekHealthInsights.map((insight) => (
                <div
                  key={insight.title}
                  className={cn(
                    "rounded-[1.2rem] border p-4",
                    insight.tone === "good"
                      ? "border-emerald-200 bg-emerald-50/70"
                      : insight.tone === "watch"
                        ? "border-amber-200 bg-amber-50/80"
                        : "border-slate-200 bg-white/90"
                  )}
                >
                  <p
                    className={cn(
                      "text-[11px] font-semibold tracking-[0.16em] uppercase",
                      insight.tone === "good"
                        ? "text-emerald-700"
                        : insight.tone === "watch"
                          ? "text-amber-700"
                          : "text-slate-500"
                    )}
                  >
                    {insight.eyebrow}
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">{insight.title}</p>
                  <p className="mt-1 text-sm leading-7 text-slate-600">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {insightView === "commercial" ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
            <div className="space-y-4">
              <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/90 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      Commerciele vooruitblik
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      Zie wat je open agenda ongeveer kan opleveren
                    </h3>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      Deze indicatie combineert je actieve slots, prijs per les en spreiding in de
                      komende week.
                    </p>
                  </div>
                  <Badge className={cn("border", bookingChanceTone.className)}>
                    Boekingskans {bookingChanceTone.label} - {bookingChanceScore}%
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Prijs per les",
                      value: pricePerLesson > 0 ? formatCurrency(pricePerLesson) : "Nog leeg",
                      hint: "Profielprijs",
                    },
                    {
                      label: "Verwachte boekingen",
                      value: nextWeekActiveEntries.length > 0 ? `${projectedBookings}` : "0",
                      hint: "Indicatief voor volgende week",
                    },
                    {
                      label: "Realistische weekomzet",
                      value:
                        pricePerLesson > 0 ? formatCurrency(projectedRevenue) : "Vul prijs in",
                      hint: "Bij huidige openstelling",
                    },
                    {
                      label: "Vol potentieel",
                      value:
                        pricePerLesson > 0
                          ? formatCurrency(nextWeekRevenuePotential)
                          : "Nog niet berekend",
                      hint: "Als alle open slots boeken",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[0.9rem] border border-white/80 bg-white/90 p-3 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]"
                    >
                      <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                        {item.label}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[0.9rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(59,130,246,0.12),rgba(255,255,255,0.9))] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border border-slate-200 bg-white text-slate-700">
                    Stretch-potentieel{" "}
                    {pricePerLesson > 0 ? formatCurrency(stretchRevenue) : "beschikbaar na prijs"}
                  </Badge>
                  <Badge className="border border-white/80 bg-white/80 text-slate-700">
                    {nextWeekPrimeTimeSlots} prime-time{" "}
                    {nextWeekPrimeTimeSlots === 1 ? "slot" : "slots"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Prime-time telt hier als avond of weekend. Juist die momenten verhogen vaak je
                  boekingskans bij leerlingen met werk, studie of gezinsdrukte.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {revenueInsights.map((insight) => (
                <div
                  key={insight.title}
                  className={cn(
                    "rounded-[1.2rem] border p-4",
                    insight.tone === "good"
                      ? "border-emerald-200 bg-emerald-50/70"
                      : insight.tone === "watch"
                        ? "border-amber-200 bg-amber-50/80"
                        : "border-slate-200 bg-white/90"
                  )}
                >
                  <p
                    className={cn(
                      "text-[11px] font-semibold tracking-[0.16em] uppercase",
                      insight.tone === "good"
                        ? "text-emerald-700"
                        : insight.tone === "watch"
                          ? "text-amber-700"
                          : "text-slate-500"
                    )}
                  >
                    {insight.eyebrow}
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">{insight.title}</p>
                  <p className="mt-1 text-sm leading-7 text-slate-600">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {insightView === "suggestions" ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/90 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Slimme suggesties
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    Snelle acties op basis van je planning
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600">
                    Deze voorstellen kijken naar gaten in je komende planning en vullen die met
                    een klik.
                  </p>
                </div>
                <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                  {smartSuggestionCount ? `${smartSuggestionCount} live` : "In balans"}
                </Badge>
              </div>

              <div className="mt-4 grid gap-3">
                {hasWeekCopySuggestion ? (
                  <div className="rounded-[0.95rem] border border-slate-200 bg-white p-3 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]">
                    <p className="font-semibold text-slate-950">
                      Volgende week heeft minder open blokken dan deze week
                    </p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      Deze week heeft {currentWeekActiveEntries.length} actieve blokken en
                      volgende week {nextWeekActiveEntries.length}. Je kunt de actieve blokken van
                      deze week in een keer doorschuiven.
                    </p>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        className="h-10 rounded-full border-slate-200 bg-white"
                        onClick={handleDuplicateCurrentWeekToNextWeek}
                        disabled={isPending}
                      >
                        <CopyPlus className="size-4" />
                        Dupliceer deze week naar volgende week
                      </Button>
                    </div>
                  </div>
                ) : null}

                {nextWeekEveningSuggestion ? (
                  <div className="rounded-[0.95rem] border border-slate-200 bg-white p-3 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]">
                    <p className="font-semibold text-slate-950">
                      Open een extra avondslot volgende week
                    </p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      Je avondplanning kan sterker. Voeg direct {nextWeekEveningSuggestion.label} toe
                      om beter zichtbaar te zijn voor leerlingen na werk of studie.
                    </p>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        className="h-10 rounded-full border-slate-200 bg-white"
                        onClick={handleApplyEveningSuggestion}
                        disabled={isPending}
                      >
                        <CalendarPlus2 className="size-4" />
                        Avondslot toevoegen
                      </Button>
                    </div>
                  </div>
                ) : null}

                {nextWeekWeekendSuggestion ? (
                  <div className="rounded-[0.95rem] border border-slate-200 bg-white p-3 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]">
                    <p className="font-semibold text-slate-950">Je weekend heeft nog ruimte</p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      Weekendslots trekken vaak leerlingen aan die doordeweeks minder flexibel
                      zijn. Voeg direct {nextWeekWeekendSuggestion.label} toe.
                    </p>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        className="h-10 rounded-full border-slate-200 bg-white"
                        onClick={handleApplyWeekendSuggestion}
                        disabled={isPending}
                      >
                        <CalendarPlus2 className="size-4" />
                        Weekendblok toevoegen
                      </Button>
                    </div>
                  </div>
                ) : null}

                {!smartSuggestionCount ? (
                  <div className="rounded-[0.95rem] border border-dashed border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600">
                    Je komende planning ziet er nu mooi in balans uit. Zodra er gaten ontstaan,
                    verschijnen hier automatisch nieuwe suggesties.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.1rem] border border-slate-200 bg-white p-3 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.14)]">
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  Wanneer gebruiken
                </p>
                <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                  <p>Gebruik dupliceren als volgende week minder volume heeft dan deze week.</p>
                  <p>Kies een avondslot als je meer prime-time beschikbaarheid wilt tonen.</p>
                  <p>Voeg een weekendblok toe als doordeweekse leerlingen moeilijk kunnen plannen.</p>
                </div>
              </div>

              <div className="rounded-[1.1rem] border border-dashed border-slate-200 bg-slate-50/80 p-3">
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  Tip
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Combineer een slimme suggestie met een herhaling als je merkt dat dezelfde gaten
                  vaker terugkomen. Zo bouw je sneller een stabiel weekritme op.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
          }
        }}
      >
        <DialogContent className="availability-manager-dialog max-w-md border border-slate-200 bg-white p-0 shadow-[0_32px_90px_-54px_rgba(15,23,42,0.36)]">
          <div className="p-4">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-slate-950">
                    {confirmAction === "delete-series"
                      ? "Hele reeks verwijderen"
                      : "Tijdslot verwijderen"}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-slate-600">
                    {confirmAction === "delete-series"
                      ? "Deze actie verwijdert alle toekomstige blokken in dezelfde reeks vanaf het geselecteerde moment."
                      : "Deze actie verwijdert alleen het geselecteerde tijdslot uit je agenda."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedEntry ? (
              <div className="mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/90 p-3">
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  Controleer wat je verwijdert
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {selectedEntry.dag}
                </p>
                <p className="mt-1 text-sm text-slate-600">{selectedEntry.tijdvak}</p>
                {confirmAction === "delete-series" && selectedSeriesCount > 1 ? (
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Je staat op het punt om <span className="font-semibold text-slate-950">
                      {selectedSeriesCount}
                    </span>{" "}
                    toekomstige blokken uit deze reeks te verwijderen.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <DialogFooter className="availability-manager-dialog-footer bg-slate-50/90">
            <Button
              variant="outline"
              className="rounded-full border-slate-200 bg-white"
              onClick={() => setConfirmAction(null)}
              disabled={isPending}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={
                confirmAction === "delete-series"
                  ? handleDeleteSelectedSeries
                  : handleDeleteSelectedSlot
              }
              disabled={isPending}
            >
              <Trash2 className="size-4" />
              {isPending
                ? "Bezig..."
                : confirmAction === "delete-series"
                  ? "Verwijder reeks"
                  : "Verwijder tijdslot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditAction(null);
          }
        }}
      >
        <DialogContent className="availability-manager-dialog max-w-md border border-slate-200 bg-white p-0 shadow-[0_32px_90px_-54px_rgba(15,23,42,0.36)]">
          <div className="p-4">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                  <Edit3 className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-slate-950">
                    {editAction === "edit-series"
                      ? "Bewerk reeks vanaf hier"
                      : "Bewerk tijdslot"}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-slate-600">
                    {editAction === "edit-series"
                      ? "Pas het tijdvak aan voor alle toekomstige blokken in deze reeks."
                      : "Werk datum en tijden van dit losse blok direct bij."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-5 space-y-4">
              {selectedEntry ? (
                <div className="rounded-[0.95rem] border border-slate-200 bg-slate-50/90 p-3">
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Huidige selectie
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">{selectedEntry.dag}</p>
                  <p className="mt-1 text-sm text-slate-600">{selectedEntry.tijdvak}</p>
                </div>
              ) : null}

              {editAction === "edit-slot" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Datum</label>
                  <Input
                    type="date"
                    value={editDatum}
                    onChange={(event) => setEditDatum(event.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white"
                  />
                </div>
              ) : (
                <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/90 p-3 text-sm leading-7 text-slate-600">
                  De gekozen datum blijft per weekblok hetzelfde. Je past hier alleen de tijden
                  aan voor de hele reeks.
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Starttijd</label>
                  <Input
                    type="time"
                    value={editStartTijd}
                    onChange={(event) => setEditStartTijd(event.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Eindtijd</label>
                  <Input
                    type="time"
                    value={editEindTijd}
                    onChange={(event) => setEditEindTijd(event.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[60, 90, 120].map((duration) => (
                  <Button
                    key={duration}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-slate-200 bg-white"
                    onClick={() => setEditEindTijd(addMinutesToTimeValue(editStartTijd, duration))}
                  >
                    {duration} min
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="availability-manager-dialog-footer bg-slate-50/90">
            <Button
              variant="outline"
              className="rounded-full border-slate-200 bg-white"
              onClick={() => setEditAction(null)}
              disabled={isPending}
            >
              Annuleren
            </Button>
            <Button
              className="rounded-full bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] text-white"
              onClick={handleSaveEditAction}
              disabled={isPending || !editStartTijd || !editEindTijd}
            >
              <Edit3 className="size-4" />
              {isPending ? "Opslaan..." : "Wijzigingen opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
