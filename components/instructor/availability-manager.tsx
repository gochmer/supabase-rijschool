"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CalendarDays,
  Eye,
  EyeOff,
  Luggage,
  PlusSquare,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  applyAvailabilityWeeklyBulkAction,
  createAvailabilityWeekOverrideAction,
  createAvailabilitySlotAction,
  deleteAvailabilitySlotAction,
  deleteAvailabilityWeekRuleAction,
  moveAvailabilityBlockAction,
  shiftAvailabilityBlocksAction,
  updateAvailabilitySlotStatusAction,
  updateAvailabilityWeekRuleAction,
  updateAvailabilityWeekRuleActiveAction,
  updateAvailabilityWindowAction,
} from "@/lib/actions/instructor-availability";
import {
  addDaysToDateValue,
  createAvailabilityTimestamp,
  formatAvailabilityDay,
  formatAvailabilityDuration,
  formatAvailabilityMoment,
  formatAvailabilityTime,
  getAvailabilityDateValue,
  getAvailabilityDurationMinutes,
  getAvailabilityWeekdayNumber,
  getStartOfWeekDateValue,
} from "@/lib/availability";
import type { BeschikbaarheidSlot, Les } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AvailabilityCalendar,
  AvailabilityDayPlanner,
  type AvailabilityCalendarAvailabilityItem,
  type AvailabilityCalendarLessonItem,
} from "@/components/instructor/availability-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LinkedWindowDraft = {
  sourceKey: string;
  startTijd: string;
  eindTijd: string;
  hasBreak: boolean;
  pauseStartTijd: string;
  pauseEindTijd: string;
};

const MAX_LINKED_WINDOW_GAP_MINUTES = 90;

const weekdayOptions = [
  { value: 1, shortLabel: "Ma", longLabel: "Maandag" },
  { value: 2, shortLabel: "Di", longLabel: "Dinsdag" },
  { value: 3, shortLabel: "Wo", longLabel: "Woensdag" },
  { value: 4, shortLabel: "Do", longLabel: "Donderdag" },
  { value: 5, shortLabel: "Vr", longLabel: "Vrijdag" },
  { value: 6, shortLabel: "Za", longLabel: "Zaterdag" },
  { value: 7, shortLabel: "Zo", longLabel: "Zondag" },
] as const;

const schedulePresets = [
  {
    label: "Werkdag 09:00 - 17:00",
    start: "09:00",
    end: "17:00",
    weekdays: [1, 2, 3, 4, 5],
  },
  {
    label: "Lange dag 09:00 - 20:00",
    start: "09:00",
    end: "20:00",
    weekdays: [1, 2, 3, 4, 5],
  },
  {
    label: "Avond 18:00 - 21:00",
    start: "18:00",
    end: "21:00",
    weekdays: [1, 2, 3, 4, 5],
  },
  {
    label: "Zaterdag 10:00 - 15:00",
    start: "10:00",
    end: "15:00",
    weekdays: [6],
  },
];

const exceptionPresets = [
  {
    label: "Lunch 12:30 - 13:30",
    start: "12:30",
    end: "13:30",
  },
  {
    label: "Ochtend dicht",
    start: "09:00",
    end: "12:00",
  },
  {
    label: "Middag dicht",
    start: "13:00",
    end: "17:00",
  },
];

function formatMinutesLabel(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return "0 uur";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!minutes) {
    return `${hours} uur`;
  }

  if (!hours) {
    return `${minutes} min`;
  }

  return `${hours}u ${String(minutes).padStart(2, "0")}m`;
}

function formatDateLong(dateValue: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateValue}T12:00:00`));
}

function toAvailabilityCalendarItem(
  slot: BeschikbaarheidSlot
): AvailabilityCalendarAvailabilityItem | null {
  if (!slot.start_at || !slot.eind_at) {
    return null;
  }

  return {
    id: slot.id,
    title: slot.beschikbaar ? "Open moment" : "Afgeschermd moment",
    startAt: slot.start_at,
    endAt: slot.eind_at,
    available: slot.beschikbaar,
    momentLabel: formatAvailabilityMoment(slot.start_at, slot.eind_at),
    durationLabel: formatAvailabilityDuration(slot.start_at, slot.eind_at),
    source: slot.source ?? "slot",
    weekRuleId: slot.weekrooster_id ?? null,
    sourceLabel:
      slot.source === "weekrooster"
        ? "Vaste weekplanning"
        : slot.beschikbaar
          ? "Los geopend moment"
          : "Geblokkeerd moment",
  };
}

function toLessonCalendarItem(
  lesson: Les
): AvailabilityCalendarLessonItem | null {
  if (!lesson.start_at || !lesson.end_at) {
    return null;
  }

  return {
    id: lesson.id,
    title: lesson.titel,
    startAt: lesson.start_at,
    endAt: lesson.end_at,
    status: lesson.status,
    learnerName: lesson.leerling_naam ?? "Leerling",
    location: lesson.locatie ?? "Locatie volgt nog",
    timeLabel: formatAvailabilityMoment(lesson.start_at, lesson.end_at),
  };
}

function getMinutesBetweenIso(startAt: string, endAt: string) {
  return Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000);
}

function shiftTimeValue(timeValue: string, minutes: number) {
  const referenceDate = "2026-01-05";
  const timestamp = createAvailabilityTimestamp(referenceDate, timeValue);
  const shiftedDate = new Date(new Date(timestamp).getTime() + minutes * 60_000);
  const shiftedDateValue = getAvailabilityDateValue(shiftedDate.toISOString());

  if (shiftedDateValue !== referenceDate) {
    return null;
  }

  return shiftedDate.toISOString().slice(11, 16);
}

function buildLinkedWindowDraft(
  items: AvailabilityCalendarAvailabilityItem[],
  anchorId: string | null
): LinkedWindowDraft | null {
  if (!anchorId) {
    return null;
  }

  const orderedItems = [...items].sort((left, right) =>
    left.startAt.localeCompare(right.startAt)
  );
  const anchorIndex = orderedItems.findIndex((item) => item.id === anchorId);

  if (anchorIndex === -1) {
    return null;
  }

  let startIndex = anchorIndex;
  let endIndex = anchorIndex;

  while (startIndex > 0) {
    const previous = orderedItems[startIndex - 1];
    const current = orderedItems[startIndex];
    const sameDay =
      getAvailabilityDateValue(previous.startAt) ===
      getAvailabilityDateValue(current.startAt);
    const sameAvailability = previous.available === current.available;
    const gapMinutes = getMinutesBetweenIso(previous.endAt, current.startAt);

    if (
      !sameDay ||
      !sameAvailability ||
      gapMinutes < 0 ||
      gapMinutes > MAX_LINKED_WINDOW_GAP_MINUTES
    ) {
      break;
    }

    startIndex -= 1;
  }

  while (endIndex < orderedItems.length - 1) {
    const current = orderedItems[endIndex];
    const next = orderedItems[endIndex + 1];
    const sameDay =
      getAvailabilityDateValue(next.startAt) === getAvailabilityDateValue(current.startAt);
    const sameAvailability = next.available === current.available;
    const gapMinutes = getMinutesBetweenIso(current.endAt, next.startAt);

    if (
      !sameDay ||
      !sameAvailability ||
      gapMinutes < 0 ||
      gapMinutes > MAX_LINKED_WINDOW_GAP_MINUTES
    ) {
      break;
    }

    endIndex += 1;
  }

  const windowItems = orderedItems.slice(startIndex, endIndex + 1);
  const largestGap = windowItems.reduce<{
    pauseStartAt: string | null;
    pauseEndAt: string | null;
    gapMinutes: number;
  }>(
    (largest, item, index) => {
      if (index === windowItems.length - 1) {
        return largest;
      }

      const next = windowItems[index + 1];
      const gapMinutes = getMinutesBetweenIso(item.endAt, next.startAt);

      if (gapMinutes >= 20 && gapMinutes > largest.gapMinutes) {
        return {
          pauseStartAt: item.endAt,
          pauseEndAt: next.startAt,
          gapMinutes,
        };
      }

      return largest;
    },
    {
      pauseStartAt: null,
      pauseEndAt: null,
      gapMinutes: 0,
    }
  );

  return {
    sourceKey: windowItems.map((item) => item.id).join("|"),
    startTijd: formatAvailabilityTime(windowItems[0]?.startAt ?? ""),
    eindTijd: formatAvailabilityTime(windowItems[windowItems.length - 1]?.endAt ?? ""),
    hasBreak: Boolean(largestGap.pauseStartAt && largestGap.pauseEndAt),
    pauseStartTijd: largestGap.pauseStartAt
      ? formatAvailabilityTime(largestGap.pauseStartAt)
      : "12:30",
    pauseEindTijd: largestGap.pauseEndAt
      ? formatAvailabilityTime(largestGap.pauseEndAt)
      : "13:00",
  };
}

export function AvailabilityManager({
  slots,
  lessons = [],
}: {
  slots: BeschikbaarheidSlot[];
  lessons?: Les[];
  pricePerLesson?: number;
  showSummarySidebar?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const availabilityItems = useMemo(
    () =>
      slots
        .map(toAvailabilityCalendarItem)
        .filter(
          (
            item
          ): item is AvailabilityCalendarAvailabilityItem => item !== null
        )
        .sort((left, right) => left.startAt.localeCompare(right.startAt)),
    [slots]
  );
  const lessonItems = useMemo(
    () =>
      lessons
        .map(toLessonCalendarItem)
        .filter((item): item is AvailabilityCalendarLessonItem => item !== null)
        .sort((left, right) => left.startAt.localeCompare(right.startAt)),
    [lessons]
  );

  const todayValue = useMemo(
    () => getAvailabilityDateValue(new Date().toISOString()),
    []
  );

  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<string | null>(
    availabilityItems[0]?.id ?? null
  );
  const [selectedAvailabilityIds, setSelectedAvailabilityIds] = useState<string[]>(
    availabilityItems[0]?.id ? [availabilityItems[0].id] : []
  );
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedDateValue, setSelectedDateValue] = useState(
    availabilityItems[0]?.startAt
      ? getAvailabilityDateValue(availabilityItems[0].startAt)
      : todayValue
  );
  const [startTijd, setStartTijd] = useState("09:00");
  const [eindTijd, setEindTijd] = useState("17:00");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [useBreakWindow, setUseBreakWindow] = useState(false);
  const [pauseStartTijd, setPauseStartTijd] = useState("13:00");
  const [pauseEindTijd, setPauseEindTijd] = useState("14:00");
  const [exceptionStartTijd, setExceptionStartTijd] = useState("09:00");
  const [exceptionEindTijd, setExceptionEindTijd] = useState("12:00");
  const [vacationStartDate, setVacationStartDate] = useState(todayValue);
  const [vacationEndDate, setVacationEndDate] = useState(
    addDaysToDateValue(todayValue, 2)
  );
  const [bulkCutoffTime, setBulkCutoffTime] = useState("18:00");
  const [editDraft, setEditDraft] = useState<LinkedWindowDraft>({
    sourceKey: "empty",
    startTijd: "09:00",
    eindTijd: "20:00",
    hasBreak: false,
    pauseStartTijd: "13:00",
    pauseEindTijd: "14:00",
  });

  const resolvedSelectedAvailabilityId = useMemo(() => {
    if (!availabilityItems.length) {
      return null;
    }

    if (
      selectedAvailabilityId &&
      availabilityItems.some((item) => item.id === selectedAvailabilityId)
    ) {
      return selectedAvailabilityId;
    }

    return (
      availabilityItems.find(
        (item) => getAvailabilityDateValue(item.startAt) === selectedDateValue
      )?.id ??
      availabilityItems[0]?.id ??
      null
    );
  }, [availabilityItems, selectedAvailabilityId, selectedDateValue]);

  const selectedAvailabilityItem =
    availabilityItems.find((item) => item.id === resolvedSelectedAvailabilityId) ?? null;
  const isRecurringSelection = selectedAvailabilityItem?.source === "weekrooster";
  const resolvedSelectedAvailabilityIds = useMemo(() => {
    const validIds = Array.from(new Set(selectedAvailabilityIds)).filter((id) =>
      availabilityItems.some((item) => item.id === id)
    );

    if (validIds.length) {
      return validIds;
    }

    return resolvedSelectedAvailabilityId ? [resolvedSelectedAvailabilityId] : [];
  }, [availabilityItems, resolvedSelectedAvailabilityId, selectedAvailabilityIds]);
  const selectedAvailabilitySelectionItems = useMemo(
    () =>
      availabilityItems.filter((item) =>
        resolvedSelectedAvailabilityIds.includes(item.id)
      ),
    [availabilityItems, resolvedSelectedAvailabilityIds]
  );
  const selectedAvailabilitySelectionCount =
    selectedAvailabilitySelectionItems.length;
  const selectedRecurringSelectionCount = selectedAvailabilitySelectionItems.filter(
    (item) => item.source === "weekrooster"
  ).length;

  const selectedEntryStartAt = useMemo(
    () => selectedAvailabilityItem?.startAt ?? availabilityItems[0]?.startAt,
    [availabilityItems, selectedAvailabilityItem]
  );
  const selectedDaySlots = useMemo(
    () =>
      availabilityItems.filter(
        (item) => getAvailabilityDateValue(item.startAt) === selectedDateValue
      ),
    [availabilityItems, selectedDateValue]
  );
  const selectedDayLessons = useMemo(
    () =>
      lessonItems.filter(
        (item) => getAvailabilityDateValue(item.startAt) === selectedDateValue
      ),
    [lessonItems, selectedDateValue]
  );
  const linkedWindowDraft = useMemo(
    () => buildLinkedWindowDraft(selectedDaySlots, resolvedSelectedAvailabilityId),
    [resolvedSelectedAvailabilityId, selectedDaySlots]
  );
  const activeEditDraft =
    linkedWindowDraft && editDraft.sourceKey === linkedWindowDraft.sourceKey
      ? editDraft
      : linkedWindowDraft ?? editDraft;

  const openSlotCount = availabilityItems.filter((item) => item.available).length;
  const blockedSlotCount = availabilityItems.filter((item) => !item.available).length;
  const recurringSlotCount = availabilityItems.filter(
    (item) => item.sourceLabel === "Vaste weekplanning"
  ).length;
  const selectedDayOpenMinutes = selectedDaySlots
    .filter((item) => item.available)
    .reduce(
      (total, item) => total + getAvailabilityDurationMinutes(item.startAt, item.endAt),
      0
    );
  const selectedDayBlockedMinutes = selectedDaySlots
    .filter((item) => !item.available)
    .reduce(
      (total, item) => total + getAvailabilityDurationMinutes(item.startAt, item.endAt),
      0
    );
  const selectedWeekStart = getStartOfWeekDateValue(selectedDateValue || todayValue);

  function handleAvailabilityEventClick(eventId: string) {
    const clickedItem = availabilityItems.find((item) => item.id === eventId);
    setSelectedAvailabilityId(eventId);
    if (multiSelectMode) {
      setSelectedAvailabilityIds((current) => {
        if (current.includes(eventId)) {
          const next = current.filter((id) => id !== eventId);
          return next.length ? next : [eventId];
        }

        return [...current, eventId];
      });
    } else {
      setSelectedAvailabilityIds([eventId]);
    }

    if (clickedItem?.startAt) {
      setSelectedDateValue(getAvailabilityDateValue(clickedItem.startAt));
    }
  }

  function handleDateSelect(dateValue: string) {
    setSelectedDateValue(dateValue);

    const firstSlotOnDay =
      availabilityItems.find(
        (item) => getAvailabilityDateValue(item.startAt) === dateValue
      ) ?? null;

    if (firstSlotOnDay) {
      setSelectedAvailabilityId(firstSlotOnDay.id);
      if (!multiSelectMode) {
        setSelectedAvailabilityIds([firstSlotOnDay.id]);
      }
    }
  }

  function toggleMultiSelectMode() {
    setMultiSelectMode((current) => {
      const next = !current;

      if (next) {
        setSelectedAvailabilityIds((existing) =>
          existing.length
            ? existing
            : resolvedSelectedAvailabilityId
              ? [resolvedSelectedAvailabilityId]
              : []
        );
      } else {
        setSelectedAvailabilityIds(
          resolvedSelectedAvailabilityId ? [resolvedSelectedAvailabilityId] : []
        );
      }

      return next;
    });
  }

  function handleSelectAllForDay() {
    setSelectedAvailabilityIds(selectedDaySlots.map((item) => item.id));
    if (selectedDaySlots[0]) {
      setSelectedAvailabilityId(selectedDaySlots[0].id);
    }
    setMultiSelectMode(true);
  }

  function clearSelection() {
    setSelectedAvailabilityIds(
      resolvedSelectedAvailabilityId ? [resolvedSelectedAvailabilityId] : []
    );
  }

  function patchEditDraft(patch: Partial<LinkedWindowDraft>) {
    setEditDraft({
      sourceKey: linkedWindowDraft?.sourceKey ?? activeEditDraft.sourceKey,
      startTijd: activeEditDraft.startTijd,
      eindTijd: activeEditDraft.eindTijd,
      hasBreak: activeEditDraft.hasBreak,
      pauseStartTijd: activeEditDraft.pauseStartTijd,
      pauseEindTijd: activeEditDraft.pauseEindTijd,
      ...patch,
    });
  }

  function getEditDraftForAvailabilityItemId(itemId: string) {
    const anchorItem = availabilityItems.find((item) => item.id === itemId);

    if (!anchorItem) {
      return null;
    }

    const daySlots = availabilityItems.filter(
      (item) =>
        getAvailabilityDateValue(item.startAt) ===
        getAvailabilityDateValue(anchorItem.startAt)
    );

    return buildLinkedWindowDraft(daySlots, itemId);
  }

  function toggleWeekday(value: number) {
    setSelectedWeekdays((current) =>
      current.includes(value)
        ? current.filter((day) => day !== value)
        : [...current, value].sort((left, right) => left - right)
    );
  }

  function applyPreset(preset: (typeof schedulePresets)[number]) {
    setStartTijd(preset.start);
    setEindTijd(preset.end);
    setSelectedWeekdays(preset.weekdays);
    toast.success(`${preset.label} staat klaar als vaste werkweek.`);
  }

  function applyExceptionPreset(preset: (typeof exceptionPresets)[number]) {
    setExceptionStartTijd(preset.start);
    setExceptionEindTijd(preset.end);
    toast.success(`${preset.label} staat klaar als losse uitzondering.`);
  }

  function runAction(
    action: () => Promise<{ success: boolean; message: string; detail?: string }>
  ) {
    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.detail ? `${result.message} ${result.detail}` : result.message);
      router.refresh();
    });
  }

  function handleSaveFixedWeekSchedule() {
    const normalizedWeekdays =
      selectedWeekdays.length
        ? selectedWeekdays
        : [
            getAvailabilityWeekdayNumber(
              createAvailabilityTimestamp(selectedDateValue, "12:00")
            ),
          ];

    runAction(() =>
      createAvailabilitySlotAction({
        datum: selectedDateValue || todayValue,
        startTijd,
        eindTijd,
        repeatWeeks: "ongoing",
        weekdagen: normalizedWeekdays,
        pauzeStartTijd: useBreakWindow ? pauseStartTijd : undefined,
        pauzeEindTijd: useBreakWindow ? pauseEindTijd : undefined,
        beschikbaar: true,
      })
    );
  }

  function handleCreateExceptionBlock() {
    runAction(() =>
      createAvailabilitySlotAction({
        datum: selectedDateValue || todayValue,
        startTijd: exceptionStartTijd,
        eindTijd: exceptionEindTijd,
        beschikbaar: false,
      })
    );
  }

  function handleCreateVacationBlock() {
    runAction(() =>
      createAvailabilitySlotAction({
        datum: vacationStartDate,
        eindDatum: vacationEndDate,
        startTijd: "00:00",
        eindTijd: "23:59",
        beschikbaar: false,
      })
    );
  }

  function handleAvailabilityDrop(eventId: string, targetDateValue: string) {
    const draggedItem = availabilityItems.find((item) => item.id === eventId);

    if (!draggedItem) {
      return;
    }

    const currentDateValue = getAvailabilityDateValue(draggedItem.startAt);

    if (currentDateValue === targetDateValue) {
      return;
    }

    runAction(() =>
      moveAvailabilityBlockAction({
        slotId: eventId,
        targetDateValue,
      })
    );
  }

  function handleAvailabilityResize(
    eventId: string,
    edge: "start" | "end",
    minutes: number
  ) {
    const targetItem = availabilityItems.find((item) => item.id === eventId);

    if (!targetItem) {
      return;
    }

    const sourceDraft =
      getEditDraftForAvailabilityItemId(eventId) ??
      ({
        sourceKey: eventId,
        startTijd: formatAvailabilityTime(targetItem.startAt),
        eindTijd: formatAvailabilityTime(targetItem.endAt),
        hasBreak: false,
        pauseStartTijd: "12:30",
        pauseEindTijd: "13:00",
      } satisfies LinkedWindowDraft);

    const nextStartTijd =
      edge === "start"
        ? shiftTimeValue(sourceDraft.startTijd, minutes)
        : sourceDraft.startTijd;
    const nextEindTijd =
      edge === "end"
        ? shiftTimeValue(sourceDraft.eindTijd, minutes)
        : sourceDraft.eindTijd;

    if (!nextStartTijd || !nextEindTijd) {
      toast.error("Dit blok kan niet buiten dezelfde dag worden vergroot of verkleind.");
      return;
    }

    if (targetItem.source === "weekrooster" && targetItem.weekRuleId) {
      runAction(() =>
        updateAvailabilityWeekRuleAction({
          ruleId: targetItem.weekRuleId ?? "",
          startTijd: nextStartTijd,
          eindTijd: nextEindTijd,
          pauzeStartTijd: sourceDraft.hasBreak ? sourceDraft.pauseStartTijd : undefined,
          pauzeEindTijd: sourceDraft.hasBreak ? sourceDraft.pauseEindTijd : undefined,
        })
      );
      return;
    }

    runAction(() =>
      updateAvailabilityWindowAction({
        slotId: eventId,
        startTijd: nextStartTijd,
        eindTijd: nextEindTijd,
        pauzeStartTijd: sourceDraft.hasBreak ? sourceDraft.pauseStartTijd : undefined,
        pauzeEindTijd: sourceDraft.hasBreak ? sourceDraft.pauseEindTijd : undefined,
      })
    );
  }

  function handleBulkCloseAfterTime() {
    runAction(() =>
      applyAvailabilityWeeklyBulkAction({
        weekStartDateValue: selectedWeekStart,
        action: "close_after_time",
        cutoffTime: bulkCutoffTime,
      })
    );
  }

  function handleBulkOpenAfterTime() {
    runAction(() =>
      applyAvailabilityWeeklyBulkAction({
        weekStartDateValue: selectedWeekStart,
        action: "open_after_time",
        cutoffTime: bulkCutoffTime,
      })
    );
  }

  function handleBulkCloseWeekend() {
    runAction(() =>
      applyAvailabilityWeeklyBulkAction({
        weekStartDateValue: selectedWeekStart,
        action: "close_weekend",
      })
    );
  }

  function handleShiftSelectedBlocks(minutes: number) {
    const slotIds = multiSelectMode
      ? resolvedSelectedAvailabilityIds
      : selectedAvailabilityItem
        ? [selectedAvailabilityItem.id]
        : [];

    if (!slotIds.length) {
      toast.error("Kies eerst een of meer blokken in je agenda.");
      return;
    }

    runAction(() =>
      shiftAvailabilityBlocksAction({
        slotIds,
        minutes,
      })
    );
  }

  function handleCreateWeekOverride(available: boolean) {
    if (!selectedAvailabilityItem || selectedAvailabilityItem.source !== "weekrooster") {
      toast.error("Kies eerst een vast weekblok om alleen deze week los op te slaan.");
      return;
    }

    runAction(() =>
      createAvailabilityWeekOverrideAction({
        slotId: selectedAvailabilityItem.id,
        startTijd: activeEditDraft.startTijd,
        eindTijd: activeEditDraft.eindTijd,
        pauzeStartTijd: activeEditDraft.hasBreak
          ? activeEditDraft.pauseStartTijd
          : undefined,
        pauzeEindTijd: activeEditDraft.hasBreak
          ? activeEditDraft.pauseEindTijd
          : undefined,
        beschikbaar: available,
      })
    );
  }

  function handleUpdateSelectedWindow() {
    if (!selectedAvailabilityItem) {
      toast.error("Kies eerst een open moment uit de agenda.");
      return;
    }

    if (selectedAvailabilityItem.source === "weekrooster" && selectedAvailabilityItem.weekRuleId) {
      runAction(() =>
        updateAvailabilityWeekRuleAction({
          ruleId: selectedAvailabilityItem.weekRuleId ?? "",
          startTijd: activeEditDraft.startTijd,
          eindTijd: activeEditDraft.eindTijd,
          pauzeStartTijd: activeEditDraft.hasBreak
            ? activeEditDraft.pauseStartTijd
            : undefined,
          pauzeEindTijd: activeEditDraft.hasBreak
            ? activeEditDraft.pauseEindTijd
            : undefined,
        })
      );
      return;
    }

    runAction(() =>
      updateAvailabilityWindowAction({
        slotId: selectedAvailabilityItem.id,
        startTijd: activeEditDraft.startTijd,
        eindTijd: activeEditDraft.eindTijd,
        pauzeStartTijd: activeEditDraft.hasBreak
          ? activeEditDraft.pauseStartTijd
          : undefined,
        pauzeEindTijd: activeEditDraft.hasBreak
          ? activeEditDraft.pauseEindTijd
          : undefined,
      })
    );
  }

  function handleToggleSelectedSlot() {
    if (!selectedAvailabilityItem) {
      toast.error("Kies eerst een open moment uit de agenda.");
      return;
    }

    if (selectedAvailabilityItem.source === "weekrooster" && selectedAvailabilityItem.weekRuleId) {
      runAction(() =>
        updateAvailabilityWeekRuleActiveAction({
          ruleId: selectedAvailabilityItem.weekRuleId ?? "",
          beschikbaar: !selectedAvailabilityItem.available,
        })
      );
      return;
    }

    runAction(() =>
      updateAvailabilitySlotStatusAction({
        slotId: selectedAvailabilityItem.id,
        beschikbaar: !selectedAvailabilityItem.available,
      })
    );
  }

  function handleDeleteSelectedSlot() {
    if (!selectedAvailabilityItem) {
      toast.error("Kies eerst een open moment uit de agenda.");
      return;
    }

    if (!window.confirm("Weet je zeker dat je dit geselecteerde moment wilt verwijderen?")) {
      return;
    }

    if (selectedAvailabilityItem.source === "weekrooster" && selectedAvailabilityItem.weekRuleId) {
      runAction(() =>
        deleteAvailabilityWeekRuleAction({
          ruleId: selectedAvailabilityItem.weekRuleId ?? "",
        })
      );
      return;
    }

    runAction(() =>
      deleteAvailabilitySlotAction({
        slotId: selectedAvailabilityItem.id,
      })
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            label: "Open",
            value: `${openSlotCount}`,
            hint: "Boekbaar",
            icon: Sparkles,
          },
          {
            label: "Dicht",
            value: `${blockedSlotCount}`,
            hint: "Geblokkeerd",
            icon: EyeOff,
          },
          {
            label: "Weekritme",
            value: `${recurringSlotCount}`,
            hint: "Terugkerend",
            icon: CalendarDays,
          },
          {
            label: "Lessen",
            value: `${lessonItems.length}`,
            hint: "In agenda",
            icon: CalendarClock,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[1.4rem] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center gap-2">
              <item.icon className="size-4 text-sky-700 dark:text-sky-300" />
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                {item.label}
              </p>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {item.value}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                  Basisrooster
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                  Vaste werktijden
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Dit is je standaard open werkweek.
                </p>
              </div>
              <Badge className="border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100">
                {formatDateLong(selectedDateValue || todayValue)}
              </Badge>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {schedulePresets.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  className="rounded-full border-slate-200 bg-white text-xs dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className="mt-4 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Werkdag start</Label>
                  <Input
                    type="time"
                    value={startTijd}
                    onChange={(event) => setStartTijd(event.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Werkdag eind</Label>
                  <Input
                    type="time"
                    value={eindTijd}
                    onChange={(event) => setEindTijd(event.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Werkdagen</Label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {weekdayOptions.map((option) => {
                    const active = selectedWeekdays.includes(option.value);
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={active ? "default" : "outline"}
                        className={cn(
                          "h-10 rounded-xl px-0 text-xs",
                          !active &&
                            "border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                        )}
                        onClick={() => toggleWeekday(option.value)}
                      >
                        {option.shortLabel}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      Pauze meenemen
                    </p>
                    <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
                      Splitst je rooster in twee open delen.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={useBreakWindow ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setUseBreakWindow((current) => !current)}
                  >
                    {useBreakWindow ? "Aan" : "Uit"}
                  </Button>
                </div>

                {useBreakWindow ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Pauze start</Label>
                      <Input
                        type="time"
                        value={pauseStartTijd}
                        onChange={(event) => setPauseStartTijd(event.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pauze eind</Label>
                      <Input
                        type="time"
                        value={pauseEindTijd}
                        onChange={(event) => setPauseEindTijd(event.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="h-11 rounded-full"
                  disabled={isPending}
                  onClick={handleSaveFixedWeekSchedule}
                >
                  <PlusSquare className="size-4" />
                  Vaste werktijden opslaan
                </Button>
              </div>

            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                  Uitzondering toevoegen
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                  Los moment dichtzetten
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Alleen voor een losse afwijking.
                </p>
              </div>

              <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Datum van uitzondering</Label>
                    <Input
                      type="date"
                      value={selectedDateValue}
                      onChange={(event) => setSelectedDateValue(event.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Snelle voorbeelden</Label>
                    <div className="flex flex-wrap gap-2">
                      {exceptionPresets.map((preset) => (
                        <Button
                          key={preset.label}
                          type="button"
                          variant="outline"
                          className="rounded-full border-slate-200 bg-white text-xs dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                          onClick={() => applyExceptionPreset(preset)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Starttijd dicht</Label>
                    <Input
                      type="time"
                      value={exceptionStartTijd}
                      onChange={(event) => setExceptionStartTijd(event.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Eindtijd dicht</Label>
                    <Input
                      type="time"
                      value={exceptionEindTijd}
                      onChange={(event) => setExceptionEindTijd(event.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="h-11 rounded-full"
                    disabled={isPending}
                    onClick={handleCreateExceptionBlock}
                  >
                    <EyeOff className="size-4" />
                    Uitzondering blokkeren
                  </Button>
                </div>
              </div>

              <div className="rounded-[1rem] border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-300/20 dark:bg-amber-400/10">
                <div className="flex items-start gap-3">
                  <Luggage className="mt-0.5 size-4 text-amber-700 dark:text-amber-200" />
                  <div>
                    <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                      Vakantie blokkeren
                    </p>
                    <p className="mt-1 text-xs leading-6 text-amber-900/80 dark:text-amber-100/85">
                      Zet meteen een hele periode dicht.
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Van</Label>
                    <Input
                      type="date"
                      value={vacationStartDate}
                      onChange={(event) => setVacationStartDate(event.target.value)}
                      className="h-11 rounded-xl border-amber-200 bg-white/90 dark:border-amber-300/20 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tot en met</Label>
                    <Input
                      type="date"
                      value={vacationEndDate}
                      onChange={(event) => setVacationEndDate(event.target.value)}
                      className="h-11 rounded-xl border-amber-200 bg-white/90 dark:border-amber-300/20 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full border-amber-200 bg-white/85 text-amber-900 dark:border-amber-300/20 dark:bg-white/10 dark:text-amber-100"
                    disabled={isPending}
                    onClick={handleCreateVacationBlock}
                  >
                    Hele periode dichtzetten
                  </Button>
                </div>
              </div>

              <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      Weekacties
                    </p>
                    <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">
                      Snel een hele week opschonen.
                    </p>
                  </div>
                  <Badge className="border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100">
                    Week van {formatAvailabilityDay(createAvailabilityTimestamp(selectedWeekStart, "12:00"))}
                  </Badge>
                </div>

                <div className="mt-3 space-y-2">
                  <Label>Sluit alles na</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="time"
                      value={bulkCutoffTime}
                      onChange={(event) => setBulkCutoffTime(event.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                    <Button
                      type="button"
                      className="h-11 rounded-full"
                      disabled={isPending}
                      onClick={handleBulkCloseAfterTime}
                    >
                      Alles sluiten na dit uur
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-full border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                      disabled={isPending}
                      onClick={handleBulkOpenAfterTime}
                    >
                      Alles weer open na dit uur
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                    disabled={isPending}
                    onClick={handleBulkCloseWeekend}
                  >
                    Weekend dicht zetten
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
              Dagoverzicht
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
              {formatDateLong(selectedDateValue || todayValue)}
            </h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                  Open uren
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                  {formatMinutesLabel(selectedDayOpenMinutes)}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {selectedDaySlots.filter((item) => item.available).length} blokken
                </p>
              </div>
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                  Geblokkeerd
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                  {formatMinutesLabel(selectedDayBlockedMinutes)}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {selectedDayLessons.length} lessen
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <AvailabilityCalendar
            availabilityItems={availabilityItems}
            lessonItems={lessonItems}
            selectedEntryStartAt={selectedEntryStartAt}
            selectedAvailabilityId={resolvedSelectedAvailabilityId}
            selectedDateValue={selectedDateValue}
            onDateSelect={handleDateSelect}
            onAvailabilityEventClick={handleAvailabilityEventClick}
            onAvailabilityEventDrop={handleAvailabilityDrop}
            onAvailabilityResize={handleAvailabilityResize}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                Dagplanner
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                {formatAvailabilityDay(createAvailabilityTimestamp(selectedDateValue, "12:00"))}
              </h3>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge className="border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100">
                {selectedDaySlots.length + selectedDayLessons.length} items
              </Badge>
              {selectedDaySlots.length ? (
                <Button
                  type="button"
                  variant={multiSelectMode ? "default" : "outline"}
                  className="h-9 rounded-full"
                  onClick={toggleMultiSelectMode}
              >
                {multiSelectMode ? "Meerdere actief" : "Meerdere selecteren"}
              </Button>
            ) : null}
          </div>
        </div>

          {multiSelectMode && selectedDaySlots.length ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[1rem] border border-sky-200 bg-sky-50/80 p-3 text-sm text-sky-900 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100">
              <span>{selectedAvailabilitySelectionCount} blokken geselecteerd.</span>
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-full border-sky-200 bg-white/80 text-sky-900 dark:border-sky-300/20 dark:bg-white/10 dark:text-sky-100"
                onClick={handleSelectAllForDay}
              >
                Alles op deze dag
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-full border-sky-200 bg-white/80 text-sky-900 dark:border-sky-300/20 dark:bg-white/10 dark:text-sky-100"
                onClick={clearSelection}
              >
                Selectie opschonen
              </Button>
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            <AvailabilityDayPlanner
              availabilityItems={availabilityItems.filter(
                (item) => getAvailabilityDateValue(item.startAt) === selectedDateValue
              )}
              lessonItems={lessonItems.filter(
                (item) => getAvailabilityDateValue(item.startAt) === selectedDateValue
              )}
              dateValue={selectedDateValue}
              selectedAvailabilityId={resolvedSelectedAvailabilityId}
              onAvailabilityEventClick={handleAvailabilityEventClick}
              onAvailabilityResize={handleAvailabilityResize}
            />

            <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              Klik in deze dagplanner op een open of afgeschermd blok om het rechts verder te beheren.
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                Geselecteerd moment
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                {multiSelectMode && selectedAvailabilitySelectionCount > 1
                  ? `${selectedAvailabilitySelectionCount} blokken geselecteerd`
                  : selectedAvailabilityItem
                  ? selectedAvailabilityItem.momentLabel
                  : "Nog geen moment gekozen"}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {multiSelectMode && selectedAvailabilitySelectionCount > 1
                  ? "Meerdere blokken tegelijk beheren."
                  : isRecurringSelection
                  ? "Dit blok hoort bij je vaste weekritme."
                  : "Beheer dit losse moment direct vanuit je agenda."}
              </p>
            </div>
            {selectedAvailabilityItem ? (
              <Badge
                className={cn(
                  "border",
                  selectedAvailabilityItem.available
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100"
                    : "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100"
                )}
              >
                {multiSelectMode && selectedAvailabilitySelectionCount > 1
                  ? "Bulkselectie"
                  : isRecurringSelection
                  ? "Vaste weekplanning"
                  : selectedAvailabilityItem.available
                    ? "Boekbaar"
                    : "Verborgen"}
              </Badge>
            ) : null}
          </div>

          {multiSelectMode && selectedAvailabilitySelectionCount > 1 ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-[1rem] border border-sky-200 bg-sky-50/80 p-4 dark:border-sky-300/20 dark:bg-sky-400/10">
                <p className="text-sm font-semibold text-sky-950 dark:text-sky-100">
                  {selectedAvailabilitySelectionCount} blokken tegelijk geselecteerd
                </p>
                <p className="mt-2 text-sm leading-7 text-sky-900/80 dark:text-sky-100/85">
                  {selectedRecurringSelectionCount
                    ? `${selectedRecurringSelectionCount} uit vaste weekplanning.`
                    : "Alle blokken zijn losse momenten."}
                </p>
              </div>

              <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  Tijd verschuiven
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { label: "15 min eerder", value: -15 },
                    { label: "30 min eerder", value: -30 },
                    { label: "15 min later", value: 15 },
                    { label: "30 min later", value: 30 },
                  ].map((shift) => (
                    <Button
                      key={shift.label}
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                      disabled={isPending}
                      onClick={() => handleShiftSelectedBlocks(shift.value)}
                    >
                      {shift.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : selectedAvailabilityItem ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  Tijd verschuiven
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { label: "15 min eerder", value: -15 },
                    { label: "15 min later", value: 15 },
                  ].map((shift) => (
                    <Button
                      key={shift.label}
                      type="button"
                      variant="outline"
                      className="h-10 rounded-xl border-slate-200 bg-white text-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                      disabled={isPending}
                      onClick={() => handleShiftSelectedBlocks(shift.value)}
                    >
                      {shift.label}
                    </Button>
                  ))}
                </div>
              </div>

              {isRecurringSelection ? (
                <div className="rounded-[1rem] border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-300/20 dark:bg-amber-400/10">
                  <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                    Alleen deze week afwijken
                  </p>
                  <p className="mt-1 text-xs leading-6 text-amber-900/80 dark:text-amber-100/85">
                    Maak van dit vaste blok alleen voor deze week een losse afwijking.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-full border-amber-200 bg-white/80 text-amber-900 dark:border-amber-300/20 dark:bg-white/10 dark:text-amber-100"
                      disabled={isPending}
                      onClick={() => handleCreateWeekOverride(true)}
                    >
                      Deze week los boekbaar opslaan
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-full border-amber-200 bg-white/80 text-amber-900 dark:border-amber-300/20 dark:bg-white/10 dark:text-amber-100"
                      disabled={isPending}
                      onClick={() => handleCreateWeekOverride(false)}
                    >
                      Deze week los dichtzetten
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Werkdag start</Label>
                  <Input
                    type="time"
                    value={activeEditDraft.startTijd}
                    onChange={(event) =>
                      patchEditDraft({ startTijd: event.target.value })
                    }
                    className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Werkdag eind</Label>
                  <Input
                    type="time"
                    value={activeEditDraft.eindTijd}
                    onChange={(event) =>
                      patchEditDraft({ eindTijd: event.target.value })
                    }
                    className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
              </div>

              <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      Pauze voor dit venster
                    </p>
                    <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
                      Optioneel voor dit moment.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={activeEditDraft.hasBreak ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() =>
                      patchEditDraft({ hasBreak: !activeEditDraft.hasBreak })
                    }
                  >
                    {activeEditDraft.hasBreak ? "Aan" : "Uit"}
                  </Button>
                </div>

                {activeEditDraft.hasBreak ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Pauze start</Label>
                      <Input
                        type="time"
                        value={activeEditDraft.pauseStartTijd}
                        onChange={(event) =>
                          patchEditDraft({ pauseStartTijd: event.target.value })
                        }
                        className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pauze eind</Label>
                      <Input
                        type="time"
                        value={activeEditDraft.pauseEindTijd}
                        onChange={(event) =>
                          patchEditDraft({ pauseEindTijd: event.target.value })
                        }
                        className="h-11 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Button
                  type="button"
                  className="h-11 rounded-full"
                  disabled={isPending}
                  onClick={handleUpdateSelectedWindow}
                >
                  <Settings2 className="size-4" />
                  {isRecurringSelection ? "Weekplanning bijwerken" : "Werkvenster bijwerken"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                  disabled={isPending}
                  onClick={handleToggleSelectedSlot}
                >
                  {selectedAvailabilityItem.available ? (
                    <>
                      <EyeOff className="size-4" />
                      Niet boekbaar maken
                    </>
                  ) : (
                    <>
                      <Eye className="size-4" />
                      Weer boekbaar maken
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  className="h-11 rounded-full"
                  disabled={isPending}
                  onClick={handleDeleteSelectedSlot}
                >
                  <Trash2 className="size-4" />
                  Geselecteerd moment verwijderen
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[1rem] border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              Klik in de agenda op een open of afgeschermd moment om het verder te beheren.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
