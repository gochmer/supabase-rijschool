"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  EyeOff,
  Luggage,
  Settings2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  applyAvailabilityWeeklyBulkAction,
  createAvailabilitySlotAction,
} from "@/lib/actions/instructor-availability";
import { updateInstructorLearnerLessonCancellationWindowAction } from "@/lib/actions/instructor-lesson-cancellation";
import { updateInstructorLessonDurationDefaultsAction } from "@/lib/actions/instructor-lesson-durations";
import { updateInstructorOnlineBookingAction } from "@/lib/actions/instructor-online-booking";
import {
  addDaysToDateValue,
  createAvailabilityTimestamp,
  formatAvailabilityTime,
  getAvailabilityDateValue,
  getAvailabilityDurationMinutes,
  getStartOfWeekDateValue,
} from "@/lib/availability";
import {
  LESSON_DURATION_PRESET_OPTIONS,
  normalizeDurationMinutes,
  type InstructorLessonDurationDefaults,
} from "@/lib/lesson-durations";
import type {
  BeschikbaarheidSlot,
  InstructorStudentProgressRow,
  Les,
  LesAanvraag,
  LocationOption,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  PlanningWeekView,
  type PlanningWeekItem,
} from "@/components/calendar/planning-week-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LessonCalendarEditDialog = dynamic(() =>
  import("@/components/instructor/lesson-calendar-edit-dialog").then(
    (module) => module.LessonCalendarEditDialog,
  ),
);
const PlanningRequestDialog = dynamic(() =>
  import("@/components/instructor/planning-request-dialog").then(
    (module) => module.PlanningRequestDialog,
  ),
);
const ScheduleLessonFromSlotDialog = dynamic(() =>
  import("@/components/instructor/schedule-lesson-from-slot-dialog").then(
    (module) => module.ScheduleLessonFromSlotDialog,
  ),
);

type QuickAction =
  | "moment"
  | "vacation"
  | "week"
  | "closeAfter"
  | "openAfter"
  | "weekend";

type DurationFieldKey = keyof InstructorLessonDurationDefaults;

const weekdayOptions = [
  { value: 1, label: "Ma" },
  { value: 2, label: "Di" },
  { value: 3, label: "Wo" },
  { value: 4, label: "Do" },
  { value: 5, label: "Vr" },
  { value: 6, label: "Za" },
  { value: 7, label: "Zo" },
] as const;

type WeekdayValue = (typeof weekdayOptions)[number]["value"];
type DaySchedule = {
  enabled: boolean;
  startTijd: string;
  eindTijd: string;
};
type DayScheduleMap = Record<WeekdayValue, DaySchedule>;
type AvailabilityPlanningMeta = {
  lesson?: Les;
  request?: LesAanvraag;
  slot?: BeschikbaarheidSlot;
};

const durationFields: Array<{
  key: DurationFieldKey;
  label: string;
}> = [
  { key: "rijles", label: "Rijles" },
  { key: "proefles", label: "Proefles" },
  { key: "pakketles", label: "Pakketles" },
  { key: "examenrit", label: "Examenrit" },
];

function createDayScheduleMap({
  startTijd,
  eindTijd,
  enabledDays,
}: {
  startTijd: string;
  eindTijd: string;
  enabledDays: WeekdayValue[];
}) {
  return weekdayOptions.reduce((accumulator, day) => {
    accumulator[day.value] = {
      enabled: enabledDays.includes(day.value),
      startTijd,
      eindTijd,
    };

    return accumulator;
  }, {} as DayScheduleMap);
}

const busyLessonStatuses = new Set(["geaccepteerd", "ingepland", "afgerond"]);

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Amsterdam",
});

const compactWeekdayFormatter = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "short",
  timeZone: "Europe/Amsterdam",
});

function formatMinutes(totalMinutes: number) {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (!hours) {
    return `${remainder} min`;
  }

  return `${hours}u ${String(remainder).padStart(2, "0")}m`;
}

function getTodayValue() {
  return getAvailabilityDateValue(new Date().toISOString());
}

function getDateFromValue(dateValue: string) {
  return new Date(createAvailabilityTimestamp(dateValue, "12:00"));
}

function getRange(dateValue: string, days: number) {
  const startAt = createAvailabilityTimestamp(dateValue, "00:00");
  const endAt = createAvailabilityTimestamp(addDaysToDateValue(dateValue, days), "00:00");

  return {
    startMs: new Date(startAt).getTime(),
    endMs: new Date(endAt).getTime(),
  };
}

function isInRange(startAt: string | null | undefined, endAt: string | null | undefined, range: {
  startMs: number;
  endMs: number;
}) {
  if (!startAt || !endAt) {
    return false;
  }

  const startMs = new Date(startAt).getTime();
  const endMs = new Date(endAt).getTime();

  return startMs < range.endMs && endMs > range.startMs;
}

function sumAvailabilityMinutes(slots: BeschikbaarheidSlot[], available: boolean) {
  return slots
    .filter((slot) => slot.beschikbaar === available && slot.start_at && slot.eind_at)
    .reduce(
      (total, slot) =>
        total +
        getAvailabilityDurationMinutes(slot.start_at ?? "", slot.eind_at ?? ""),
      0,
    );
}

function getLessonEnd(lesson: Les) {
  if (lesson.end_at) {
    return lesson.end_at;
  }

  if (!lesson.start_at) {
    return null;
  }

  const endDate = new Date(lesson.start_at);
  endDate.setMinutes(endDate.getMinutes() + lesson.duur_minuten);
  return endDate.toISOString();
}

function DashboardCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "rounded-xl border border-sky-300/16 bg-[radial-gradient(circle_at_12%_0%,rgba(14,165,233,0.12),transparent_34%),linear-gradient(145deg,rgba(9,20,35,0.96),rgba(5,13,24,0.99))] shadow-[0_24px_80px_-58px_rgba(0,0,0,0.96)]",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

function SmallField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-slate-300">{label}</Label>
      {children}
    </div>
  );
}

export function AvailabilityDashboard({
  slots,
  lessons,
  requests = [],
  students,
  locationOptions,
  onlineBookingEnabled,
  activeCancellationHours,
  durationDefaults,
  publicAgendaHref,
  currentTimeMs,
}: {
  slots: BeschikbaarheidSlot[];
  lessons: Les[];
  requests?: LesAanvraag[];
  students: InstructorStudentProgressRow[];
  locationOptions: LocationOption[];
  onlineBookingEnabled: boolean;
  activeCancellationHours: number | null;
  durationDefaults: InstructorLessonDurationDefaults;
  publicAgendaHref: string;
  currentTimeMs: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const nowMs = currentTimeMs;
  const todayValue = useMemo(() => getTodayValue(), []);
  const currentWeekStart = useMemo(
    () => getStartOfWeekDateValue(todayValue),
    [todayValue],
  );
  const [calendarWeekStart, setCalendarWeekStart] = useState(currentWeekStart);
  const [selectedQuickAction, setSelectedQuickAction] =
    useState<QuickAction>("moment");
  const [planningSlot, setPlanningSlot] = useState<BeschikbaarheidSlot | null>(
    null,
  );
  const [editingLesson, setEditingLesson] = useState<Les | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LesAanvraag | null>(
    null,
  );
  const [schedulePreset, setSchedulePreset] = useState("workday");
  const [daySchedules, setDaySchedules] = useState<DayScheduleMap>(() =>
    createDayScheduleMap({
      startTijd: "09:00",
      eindTijd: "17:00",
      enabledDays: [1, 2, 3, 4, 5],
    }),
  );
  const [usePause, setUsePause] = useState(true);
  const [pauseStart, setPauseStart] = useState("12:30");
  const [pauseEnd, setPauseEnd] = useState("13:00");
  const [onlineEnabled, setOnlineEnabled] = useState(onlineBookingEnabled);
  const [savedCancellationHours, setSavedCancellationHours] = useState<
    number | null
  >(activeCancellationHours === 24 || activeCancellationHours === 48 || activeCancellationHours === 72
    ? activeCancellationHours
    : null);
  const [selectedCancellationHours, setSelectedCancellationHours] = useState<
    number | null
  >(savedCancellationHours);
  const [durationValues, setDurationValues] = useState<
    Record<DurationFieldKey, string>
  >({
    rijles: String(durationDefaults.rijles),
    proefles: String(durationDefaults.proefles),
    pakketles: String(durationDefaults.pakketles),
    examenrit: String(durationDefaults.examenrit),
  });
  const [savedDurationValues, setSavedDurationValues] =
    useState<InstructorLessonDurationDefaults>(durationDefaults);
  const [momentDate, setMomentDate] = useState(todayValue);
  const [momentStart, setMomentStart] = useState("09:00");
  const [momentEnd, setMomentEnd] = useState("12:00");
  const [vacationStart, setVacationStart] = useState(todayValue);
  const [vacationEnd, setVacationEnd] = useState(
    addDaysToDateValue(todayValue, 2),
  );
  const [bulkCutoffTime, setBulkCutoffTime] = useState("17:00");
  const syncCalendarWeekStart = useCallback((weekStart: Date) => {
    setCalendarWeekStart(getAvailabilityDateValue(weekStart.toISOString()));
  }, []);

  const currentWeekRange = useMemo(
    () => getRange(currentWeekStart, 7),
    [currentWeekStart],
  );
  const currentMonthRange = useMemo(() => {
    const today = getDateFromValue(todayValue);
    const monthStartValue = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}-01`;
    const nextMonth = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 1));
    const nextMonthValue = `${nextMonth.getUTCFullYear()}-${String(
      nextMonth.getUTCMonth() + 1,
    ).padStart(2, "0")}-01`;

    return {
      startMs: new Date(createAvailabilityTimestamp(monthStartValue, "00:00")).getTime(),
      endMs: new Date(createAvailabilityTimestamp(nextMonthValue, "00:00")).getTime(),
    };
  }, [todayValue]);

  const weekSlots = useMemo(
    () =>
      slots.filter((slot) =>
        isInRange(slot.start_at, slot.eind_at, currentWeekRange),
      ),
    [currentWeekRange, slots],
  );
  const monthSlots = useMemo(
    () =>
      slots.filter((slot) =>
        isInRange(slot.start_at, slot.eind_at, currentMonthRange),
      ),
    [currentMonthRange, slots],
  );
  const weekLessons = useMemo(
    () =>
      lessons.filter((lesson) =>
        lesson.start_at &&
        getLessonEnd(lesson) &&
        busyLessonStatuses.has(lesson.status) &&
        isInRange(lesson.start_at, getLessonEnd(lesson), currentWeekRange),
      ),
    [currentWeekRange, lessons],
  );
  const planningBusyWindows = useMemo(
    () =>
      lessons
        .filter((lesson) => {
          const endAt = getLessonEnd(lesson);

          return (
            lesson.start_at &&
            endAt &&
            busyLessonStatuses.has(lesson.status)
          );
        })
        .map((lesson) => ({
          id: lesson.id,
          label: lesson.leerling_naam || lesson.titel,
          start_at: lesson.start_at,
          end_at: getLessonEnd(lesson),
        })),
    [lessons],
  );
  const availableMinutesWeek = sumAvailabilityMinutes(weekSlots, true);
  const blockedMinutesWeek = sumAvailabilityMinutes(weekSlots, false);
  const busyMinutesWeek = weekLessons.reduce(
    (total, lesson) => total + lesson.duur_minuten,
    0,
  );
  const activeOpenSlotsWeek = weekSlots.filter((slot) => slot.beschikbaar).length;
  const openSlotsNext7 = slots.filter((slot) => {
    const range = getRange(todayValue, 7);
    return slot.beschikbaar && isInRange(slot.start_at, slot.eind_at, range);
  }).length;
  const openSlotsNext30 = slots.filter((slot) => {
    const range = getRange(todayValue, 30);
    return slot.beschikbaar && isInRange(slot.start_at, slot.eind_at, range);
  }).length;
  const availableMinutesMonth = sumAvailabilityMinutes(monthSlots, true);
  const upcomingBlocks = slots
    .filter((slot) => {
      if (!slot.start_at || !slot.eind_at || slot.beschikbaar) {
        return false;
      }

      return new Date(slot.eind_at).getTime() >= nowMs;
    })
    .sort((left, right) => (left.start_at ?? "").localeCompare(right.start_at ?? ""))
    .slice(0, 3);
  const calendarPlanningItems = useMemo<
    Array<PlanningWeekItem<AvailabilityPlanningMeta>>
  >(() => {
    const slotItems = slots
      .flatMap((slot) => {
        if (!slot.start_at || !slot.eind_at) {
          return [];
        }

        const kind = slot.beschikbaar ? "available" : "blocked";
        const startAt = new Date(slot.start_at);
        const endAt = new Date(slot.eind_at);

        if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
          return [];
        }

        return [
          {
            id: `${kind}-${slot.id}-${slot.start_at}`,
            kind,
            title: slot.beschikbaar
              ? "Beschikbaar"
              : slot.source === "weekrooster"
                ? "Vaste blokkade"
                : "Geblokkeerd",
            startAt,
            endAt,
            typeLabel: slot.source === "weekrooster" ? "Vaste planning" : "Los blok",
            statusLabel: slot.beschikbaar ? "Open" : "Dicht",
            contextLabel: slot.beschikbaar
              ? "Leerling kan worden ingepland"
              : "Niet boekbaar",
            actionLabel: slot.beschikbaar ? "Leerling inplannen" : undefined,
            interactive: slot.beschikbaar,
            meta: { slot },
          } satisfies PlanningWeekItem<AvailabilityPlanningMeta>,
        ];
      });
    const lessonItems = lessons
      .filter((lesson) => {
        const endAt = getLessonEnd(lesson);

        return (
          lesson.start_at &&
          endAt &&
          busyLessonStatuses.has(lesson.status)
        );
      })
      .flatMap((lesson) => {
        const endAt = getLessonEnd(lesson);

        if (!lesson.start_at || !endAt) {
          return [];
        }

        const startAt = new Date(lesson.start_at);
        const lessonEndAt = new Date(endAt);

        if (
          Number.isNaN(startAt.getTime()) ||
          Number.isNaN(lessonEndAt.getTime())
        ) {
          return [];
        }

        return [
          {
            id: `lesson-${lesson.id}`,
            kind: "lesson",
            title: lesson.leerling_naam || "Les",
            startAt,
            endAt: lessonEndAt,
            typeLabel: lesson.titel,
            statusLabel: lesson.status,
            contextLabel: lesson.locatie,
            actionLabel: "Bewerken / verzetten",
            meta: { lesson },
          } satisfies PlanningWeekItem<AvailabilityPlanningMeta>,
        ];
      });
    const requestItems = requests.flatMap((request) => {
      if (!request.start_at) {
        return [];
      }

      const startAt = new Date(request.start_at);
      const endAt = request.end_at
        ? new Date(request.end_at)
        : new Date(startAt.getTime() + 60 * 60_000);

      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
        return [];
      }

      return [
        {
          id: `request-${request.id}`,
          kind: "request",
          title: request.leerling_naam || "Aanvraag",
          startAt,
          endAt,
          typeLabel:
            request.aanvraag_type === "proefles"
              ? "Proefles"
              : request.pakket_naam ?? "Aanvraag",
          statusLabel: request.status,
          contextLabel: request.tijdvak,
          actionLabel: "Aanvraag bekijken",
          meta: { request },
        } satisfies PlanningWeekItem<AvailabilityPlanningMeta>,
      ];
    });

    return [...slotItems, ...lessonItems, ...requestItems].sort(
      (left, right) => left.startAt.getTime() - right.startAt.getTime(),
    );
  }, [lessons, requests, slots]);

  function runAction(
    action: () => Promise<{
      success: boolean;
      message: string;
      detail?: string;
    }>,
  ) {
    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(
        result.detail ? `${result.message} ${result.detail}` : result.message,
      );
      router.refresh();
    });
  }

  function applySchedulePreset(nextPreset: string) {
    setSchedulePreset(nextPreset);

    if (nextPreset === "workday") {
      setDaySchedules(
        createDayScheduleMap({
          startTijd: "09:00",
          eindTijd: "17:00",
          enabledDays: [1, 2, 3, 4, 5],
        }),
      );
      return;
    }

    if (nextPreset === "long") {
      setDaySchedules(
        createDayScheduleMap({
          startTijd: "09:00",
          eindTijd: "20:00",
          enabledDays: [1, 2, 3, 4, 5],
        }),
      );
    }
  }

  function patchDaySchedule(
    dayValue: WeekdayValue,
    patch: Partial<DaySchedule>,
  ) {
    setSchedulePreset("custom");
    setDaySchedules((current) => ({
      ...current,
      [dayValue]: {
        ...current[dayValue],
        ...patch,
      },
    }));
  }

  function saveFixedSchedule() {
    const activeDayEntries = weekdayOptions
      .map((day) => ({
        ...day,
        schedule: daySchedules[day.value],
      }))
      .filter((entry) => entry.schedule.enabled);

    runAction(async () => {
      if (!activeDayEntries.length) {
        return {
          success: false,
          message: "Kies minimaal een werkdag voor je vaste planning.",
        };
      }

      for (const entry of activeDayEntries) {
        const result = await createAvailabilitySlotAction({
          datum: calendarWeekStart,
          startTijd: entry.schedule.startTijd,
          eindTijd: entry.schedule.eindTijd,
          repeatWeeks: "ongoing",
          weekdagen: [entry.value],
          pauzeStartTijd: usePause ? pauseStart : undefined,
          pauzeEindTijd: usePause ? pauseEnd : undefined,
          beschikbaar: true,
        });

        if (!result.success) {
          return {
            success: false,
            message: `${entry.label}: ${result.message}`,
          };
        }
      }

      return {
        success: true,
        message:
          activeDayEntries.length === 1
            ? "Je vaste planning is opgeslagen voor 1 werkdag."
            : `Je vaste planning is opgeslagen voor ${activeDayEntries.length} werkdagen.`,
      };
    });
  }

  function toggleOnlineBooking() {
    const nextEnabled = !onlineEnabled;
    const previousValue = onlineEnabled;
    setOnlineEnabled(nextEnabled);

    startTransition(async () => {
      const result = await updateInstructorOnlineBookingAction(nextEnabled);

      if (!result.success) {
        setOnlineEnabled(previousValue);
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function saveCancellationWindow() {
    const nextValue =
      selectedCancellationHours === 24 ||
      selectedCancellationHours === 48 ||
      selectedCancellationHours === 72
        ? selectedCancellationHours
        : null;

    startTransition(async () => {
      const result =
        await updateInstructorLearnerLessonCancellationWindowAction(nextValue);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setSavedCancellationHours(nextValue);
      toast.success(result.message);
      router.refresh();
    });
  }

  function saveDurationDefaults() {
    const payload = {
      rijles: normalizeDurationMinutes(
        Number.parseInt(durationValues.rijles, 10),
        savedDurationValues.rijles,
      ),
      proefles: normalizeDurationMinutes(
        Number.parseInt(durationValues.proefles, 10),
        savedDurationValues.proefles,
      ),
      pakketles: normalizeDurationMinutes(
        Number.parseInt(durationValues.pakketles, 10),
        savedDurationValues.pakketles,
      ),
      examenrit: normalizeDurationMinutes(
        Number.parseInt(durationValues.examenrit, 10),
        savedDurationValues.examenrit,
      ),
    };

    startTransition(async () => {
      const result = await updateInstructorLessonDurationDefaultsAction(payload);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setSavedDurationValues(payload);
      setDurationValues({
        rijles: String(payload.rijles),
        proefles: String(payload.proefles),
        pakketles: String(payload.pakketles),
        examenrit: String(payload.examenrit),
      });
      toast.success(result.message);
      router.refresh();
    });
  }

  function runSelectedQuickAction() {
    if (selectedQuickAction === "moment") {
      runAction(() =>
        createAvailabilitySlotAction({
          datum: momentDate,
          startTijd: momentStart,
          eindTijd: momentEnd,
          beschikbaar: false,
        }),
      );
      return;
    }

    if (selectedQuickAction === "vacation") {
      runAction(() =>
        createAvailabilitySlotAction({
          datum: vacationStart,
          eindDatum: vacationEnd,
          startTijd: "00:00",
          eindTijd: "23:59",
          beschikbaar: false,
        }),
      );
      return;
    }

    if (selectedQuickAction === "week") {
      runAction(() =>
        createAvailabilitySlotAction({
          datum: calendarWeekStart,
          eindDatum: addDaysToDateValue(calendarWeekStart, 6),
          startTijd: "00:00",
          eindTijd: "23:59",
          beschikbaar: false,
        }),
      );
      return;
    }

    if (selectedQuickAction === "weekend") {
      runAction(() =>
        applyAvailabilityWeeklyBulkAction({
          weekStartDateValue: calendarWeekStart,
          action: "close_weekend",
        }),
      );
      return;
    }

    runAction(() =>
      applyAvailabilityWeeklyBulkAction({
        weekStartDateValue: calendarWeekStart,
        action:
          selectedQuickAction === "openAfter"
            ? "open_after_time"
            : "close_after_time",
        cutoffTime: bulkCutoffTime,
      }),
    );
  }

  const quickActionConfig = {
    moment: {
      title: "Los moment dichtzetten",
      text: "Kies datum en tijd",
      icon: Clock3,
      tone: "rose",
    },
    vacation: {
      title: "Vakantie blokkeren",
      text: "Periode blokkeren",
      icon: BriefcaseBusiness,
      tone: "amber",
    },
    week: {
      title: "Week sluiten",
      text: "Alle dagen dicht",
      icon: CalendarDays,
      tone: "violet",
    },
    closeAfter: {
      title: "Na bepaald uur sluiten",
      text: "Bijv. na 17:00",
      icon: Clock3,
      tone: "blue",
    },
    openAfter: {
      title: "Na bepaald uur openen",
      text: "Bijv. vanaf 13:00",
      icon: CheckCircle2,
      tone: "emerald",
    },
    weekend: {
      title: "Weekend dichtzetten",
      text: "Zaterdag & zondag",
      icon: CalendarClock,
      tone: "violet",
    },
  } satisfies Record<
    QuickAction,
    {
      title: string;
      text: string;
      icon: typeof Clock3;
      tone: "rose" | "amber" | "violet" | "blue" | "emerald";
    }
  >;

  return (
    <div className="space-y-4 text-slate-100 2xl:space-y-7">
      {planningSlot ? (
        <ScheduleLessonFromSlotDialog
          key={planningSlot.id}
          open={Boolean(planningSlot)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setPlanningSlot(null);
            }
          }}
          slot={planningSlot}
          students={students}
          locationOptions={locationOptions}
          busyWindows={planningBusyWindows}
          durationDefaults={durationDefaults}
        />
      ) : null}
      {editingLesson ? (
        <LessonCalendarEditDialog
          open={Boolean(editingLesson)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setEditingLesson(null);
            }
          }}
          lesson={editingLesson}
          students={students}
          locationOptions={locationOptions}
          slots={slots}
          busyWindows={planningBusyWindows}
        />
      ) : null}
      {selectedRequest ? (
        <PlanningRequestDialog
          request={selectedRequest}
          locationOptions={locationOptions}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setSelectedRequest(null);
            }
          }}
        />
      ) : null}

      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between 2xl:gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl 2xl:text-4xl">
            Beschikbaarheid
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 2xl:mt-2 2xl:text-lg">
            Wanneer kan ik werken? Stel open momenten, vaste werkdagen en
            blokkades in.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="h-11 rounded-lg border-blue-400/55 bg-blue-500/10 px-4 text-blue-200 hover:bg-blue-500/18 hover:text-white"
        >
          <Link href={publicAgendaHref}>
            <CalendarDays className="size-4" />
            Voorbeeld agenda bekijken
          </Link>
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Actieve open slots",
            value: String(activeOpenSlotsWeek),
            sub: "Deze week",
            icon: CalendarDays,
            className: "border-blue-400/25 bg-blue-500/12 text-blue-300",
          },
          {
            label: "Beschikbaar",
            value: formatMinutes(availableMinutesWeek),
            sub: "Deze week",
            icon: CheckCircle2,
            className: "border-emerald-400/25 bg-emerald-500/12 text-emerald-300",
          },
          {
            label: "Bezet",
            value: formatMinutes(busyMinutesWeek),
            sub: "Deze week",
            icon: Clock3,
            className: "border-orange-400/25 bg-orange-500/12 text-orange-300",
          },
          {
            label: "Geblokkeerd",
            value: formatMinutes(blockedMinutesWeek),
            sub: "Deze week",
            icon: Ban,
            className: "border-violet-400/25 bg-violet-500/12 text-violet-300",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <DashboardCard key={item.label} className="p-5">
              <div className="flex items-center gap-5">
                <span
                  className={cn(
                    "flex size-16 shrink-0 items-center justify-center rounded-xl border",
                    item.className,
                  )}
                >
                  <Icon className="size-8" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-300">{item.label}</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-white">
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{item.sub}</p>
                </div>
              </div>
            </DashboardCard>
          );
        })}
      </section>

      <DashboardCard className="p-5">
        <div>
          <h2 className="text-xl font-semibold text-white">Snelle acties</h2>
          <p className="mt-1 text-sm text-slate-400">
            Snel je beschikbaarheid aanpassen.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {(Object.keys(quickActionConfig) as QuickAction[]).map((key) => {
            const item = quickActionConfig[key];
            const Icon = item.icon;
            const active = selectedQuickAction === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedQuickAction(key)}
                className={cn(
                  "flex min-h-16 items-center gap-3 rounded-lg border bg-white/[0.03] p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-300/40 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none",
                  active
                    ? "border-blue-400/55 bg-blue-500/12"
                    : "border-white/10",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                    item.tone === "rose" &&
                      "border-rose-400/25 bg-rose-500/12 text-rose-300",
                    item.tone === "amber" &&
                      "border-amber-400/25 bg-amber-500/12 text-amber-300",
                    item.tone === "violet" &&
                      "border-violet-400/25 bg-violet-500/12 text-violet-300",
                    item.tone === "blue" &&
                      "border-blue-400/25 bg-blue-500/12 text-blue-300",
                    item.tone === "emerald" &&
                      "border-emerald-400/25 bg-emerald-500/12 text-emerald-300",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {item.text}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/35 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            {selectedQuickAction === "moment" ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <SmallField label="Datum">
                  <Input
                    type="date"
                    value={momentDate}
                    onChange={(event) => setMomentDate(event.target.value)}
                    className="h-11 rounded-lg border-white/10 bg-white/5 text-white"
                  />
                </SmallField>
                <SmallField label="Start">
                  <Input
                    type="time"
                    value={momentStart}
                    onChange={(event) => setMomentStart(event.target.value)}
                    className="h-11 rounded-lg border-white/10 bg-white/5 text-white"
                  />
                </SmallField>
                <SmallField label="Einde">
                  <Input
                    type="time"
                    value={momentEnd}
                    onChange={(event) => setMomentEnd(event.target.value)}
                    className="h-11 rounded-lg border-white/10 bg-white/5 text-white"
                  />
                </SmallField>
              </div>
            ) : null}

            {selectedQuickAction === "vacation" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <SmallField label="Van">
                  <Input
                    type="date"
                    value={vacationStart}
                    onChange={(event) => setVacationStart(event.target.value)}
                    className="h-11 rounded-lg border-white/10 bg-white/5 text-white"
                  />
                </SmallField>
                <SmallField label="Tot en met">
                  <Input
                    type="date"
                    value={vacationEnd}
                    onChange={(event) => setVacationEnd(event.target.value)}
                    className="h-11 rounded-lg border-white/10 bg-white/5 text-white"
                  />
                </SmallField>
              </div>
            ) : null}

            {["week", "weekend"].includes(selectedQuickAction) ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                Deze actie wordt toegepast op de week van{" "}
                <span className="font-semibold text-white">
                  {dateFormatter.format(getDateFromValue(calendarWeekStart))}
                </span>
                .
              </div>
            ) : null}

            {["closeAfter", "openAfter"].includes(selectedQuickAction) ? (
              <SmallField
                label={
                  selectedQuickAction === "closeAfter"
                    ? "Sluiten na"
                    : "Openen vanaf"
                }
              >
                <Input
                  type="time"
                  value={bulkCutoffTime}
                  onChange={(event) => setBulkCutoffTime(event.target.value)}
                  className="h-11 max-w-xs rounded-lg border-white/10 bg-white/5 text-white"
                />
              </SmallField>
            ) : null}

            <Button
              type="button"
              className="h-11 rounded-lg bg-blue-600 px-5 text-white hover:bg-blue-500"
              disabled={isPending}
              onClick={runSelectedQuickAction}
            >
              <Zap className="size-4" />
              Actie uitvoeren
            </Button>
          </div>
        </div>
      </DashboardCard>

      <section className="grid gap-5 xl:grid-cols-[minmax(30rem,1.08fr)_minmax(24rem,0.92fr)] xl:items-start">
        <DashboardCard className="overflow-hidden">
          <div className="border-b border-white/10 bg-[radial-gradient(circle_at_0%_0%,rgba(37,99,235,0.16),transparent_40%)] p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/12 text-blue-300">
                <CalendarClock className="size-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Beschikbaarheid / Openingstijden
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Stel per werkdag je vaste tijden en pauzes in.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <Label className="text-xs text-slate-300">Presets</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  {
                    id: "workday",
                    label: "Werkdag",
                    sub: "08:00 - 17:00",
                  },
                  {
                    id: "long",
                    label: "Lange dag",
                    sub: "09:00 - 20:00",
                  },
                  {
                    id: "custom",
                    label: "Aangepast",
                    sub: "Eigen tijden",
                  },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applySchedulePreset(preset.id)}
                    className={cn(
                      "rounded-lg border px-3 py-3 text-left transition",
                      schedulePreset === preset.id
                        ? "border-blue-400 bg-blue-600/20 text-white"
                        : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-blue-300/40",
                    )}
                  >
                    <span className="block text-sm font-semibold">
                      {preset.label}
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      {preset.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-300">
                Werkdagen en tijden per dag
              </Label>
              <div className="mt-2 space-y-2">
                {weekdayOptions.map((day) => {
                  const schedule = daySchedules[day.value];

                  return (
                    <div
                      key={day.value}
                      className={cn(
                        "grid gap-2 rounded-lg border p-2.5 transition sm:grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1fr)]",
                        schedule.enabled
                          ? "border-blue-400/30 bg-blue-500/8"
                          : "border-white/10 bg-white/[0.03]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          patchDaySchedule(day.value, {
                            enabled: !schedule.enabled,
                          })
                        }
                        className={cn(
                          "h-10 rounded-lg border text-sm font-semibold transition",
                          schedule.enabled
                            ? "border-blue-400 bg-blue-600 text-white"
                            : "border-white/10 bg-slate-950/40 text-slate-300 hover:border-blue-300/40",
                        )}
                        aria-pressed={schedule.enabled}
                      >
                        {day.label}
                      </button>
                      <Input
                        type="time"
                        value={schedule.startTijd}
                        disabled={!schedule.enabled}
                        onChange={(event) =>
                          patchDaySchedule(day.value, {
                            startTijd: event.target.value,
                          })
                        }
                        className="h-10 rounded-lg border-white/10 bg-white/5 text-white disabled:bg-slate-950/35"
                        aria-label={`${day.label} starttijd`}
                      />
                      <Input
                        type="time"
                        value={schedule.eindTijd}
                        disabled={!schedule.enabled}
                        onChange={(event) =>
                          patchDaySchedule(day.value, {
                            eindTijd: event.target.value,
                          })
                        }
                        className="h-10 rounded-lg border-white/10 bg-white/5 text-white disabled:bg-slate-950/35"
                        aria-label={`${day.label} eindtijd`}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Elke actieve dag wordt als eigen vaste weekplanning opgeslagen.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm font-medium text-white">Pauze</Label>
              <button
                type="button"
                onClick={() => setUsePause((current) => !current)}
                className={cn(
                  "relative h-7 w-12 rounded-full border transition",
                  usePause
                    ? "border-emerald-300/40 bg-emerald-500"
                    : "border-white/10 bg-white/10",
                )}
                aria-pressed={usePause}
              >
                <span
                  className={cn(
                    "absolute top-1 size-5 rounded-full bg-white transition",
                    usePause ? "left-6" : "left-1",
                  )}
                />
              </button>
            </div>

            {usePause ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <SmallField label="Start pauze">
                  <Input
                    type="time"
                    value={pauseStart}
                    onChange={(event) => setPauseStart(event.target.value)}
                    className="h-12 rounded-lg border-white/10 bg-white/5 text-white"
                  />
                </SmallField>
                <SmallField label="Einde pauze">
                  <Input
                    type="time"
                    value={pauseEnd}
                    onChange={(event) => setPauseEnd(event.target.value)}
                    className="h-12 rounded-lg border-white/10 bg-white/5 text-white"
                  />
                </SmallField>
              </div>
            ) : null}

            <Button
              type="button"
              className="h-12 w-full rounded-lg bg-blue-600 text-white shadow-[0_18px_42px_-28px_rgba(37,99,235,0.9)] hover:bg-blue-500"
              disabled={isPending}
              onClick={saveFixedSchedule}
            >
              Wijzigingen opslaan
            </Button>
          </div>
        </DashboardCard>

        <div className="grid gap-5">
        <DashboardCard className="p-5">
          <h2 className="text-xl font-semibold text-white">Online Boeken</h2>
          <p className="mt-2 text-sm text-slate-400">
            Sta online boekingen toe via jouw publieke agenda.
          </p>

          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-white">
                  Online boeking
                </p>
                <p className="mt-1 max-w-xs text-sm leading-6 text-slate-400">
                  Leerlingen kunnen zelf lessen boeken in jouw agenda.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleOnlineBooking}
                disabled={isPending}
                className={cn(
                  "relative mt-1 h-7 w-12 rounded-full border transition",
                  onlineEnabled
                    ? "border-emerald-300/40 bg-emerald-500"
                    : "border-white/10 bg-white/10",
                )}
                aria-pressed={onlineEnabled}
              >
                <span
                  className={cn(
                    "absolute top-1 size-5 rounded-full bg-white transition",
                    onlineEnabled ? "left-6" : "left-1",
                  )}
                />
              </button>
            </div>
          </div>

          <div className="mt-5 divide-y divide-white/10 rounded-lg border border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-sm text-slate-300">Status</span>
              <Badge
                className={cn(
                  onlineEnabled
                    ? "border border-emerald-400/25 bg-emerald-500/12 text-emerald-200"
                    : "border border-white/10 bg-white/10 text-slate-200",
                )}
              >
                {onlineEnabled ? "Open" : "Gesloten"}
              </Badge>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-sm text-slate-300">
                Open slots komende 7 dagen
              </span>
              <span className="text-xl font-semibold text-white">
                {openSlotsNext7}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-sm text-slate-300">
                Open slots komende 30 dagen
              </span>
              <span className="text-xl font-semibold text-white">
                {openSlotsNext30}
              </span>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="mt-5 h-11 w-full rounded-lg border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white"
          >
            <Link href={publicAgendaHref}>
              Publieke agenda bekijken
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </DashboardCard>

        <DashboardCard className="p-5">
          <h2 className="text-xl font-semibold text-white">
            Annuleren door leerling
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Bepaal tot wanneer leerlingen zelf een les kunnen annuleren.
          </p>

          <div className="mt-5 space-y-3">
            {[
              {
                value: 24,
                title: "Tot 24 uur ervoor",
                text: "Leerling kan tot 24 uur voor de les annuleren.",
              },
              {
                value: 48,
                title: "Tot 48 uur ervoor",
                text: "Meer rust in je planning.",
              },
              {
                value: 72,
                title: "Tot 72 uur ervoor",
                text: "Ruimere annuleertermijn.",
              },
              {
                value: null,
                title: "Zelf annuleren uit",
                text: "Annuleren alleen via jou.",
              },
            ].map((option) => {
              const active = selectedCancellationHours === option.value;

              return (
                <button
                  key={option.title}
                  type="button"
                  onClick={() => setSelectedCancellationHours(option.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition hover:border-blue-300/35",
                    active
                      ? "border-blue-400/45 bg-blue-500/12"
                      : "border-white/10 bg-white/[0.03]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      active
                        ? "border-blue-300 bg-blue-500"
                        : "border-slate-600 bg-transparent",
                    )}
                  >
                    {active ? (
                      <span className="size-2 rounded-full bg-white" />
                    ) : null}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      {option.title}
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      {option.text}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            className="mt-5 h-12 w-full rounded-lg bg-blue-600 text-white hover:bg-blue-500"
            disabled={isPending || selectedCancellationHours === savedCancellationHours}
            onClick={saveCancellationWindow}
          >
            Opslaan
          </Button>
        </DashboardCard>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.8fr]">
        <DashboardCard className="p-5">
          <h2 className="text-xl font-semibold text-white">
            Standaard lesduur
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Deze duur wordt gebruikt bij nieuwe boekingen.
          </p>

          <div className="mt-5 space-y-4">
            {durationFields.map((field) => (
              <div
                key={field.key}
                className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 last:border-b-0"
              >
                <Label className="text-sm text-slate-200">{field.label}</Label>
                <Select
                  value={durationValues[field.key]}
                  onValueChange={(value) =>
                    setDurationValues((current) => ({
                      ...current,
                      [field.key]: value,
                    }))
                  }
                >
                  <SelectTrigger className="h-10 w-36 rounded-lg border-white/10 bg-white/[0.03] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-slate-950 text-white">
                    {LESSON_DURATION_PRESET_OPTIONS.map((preset) => (
                      <SelectItem key={preset} value={String(preset)}>
                        {preset} minuten
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <Label className="text-xs text-slate-300">Snel instellen</Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {LESSON_DURATION_PRESET_OPTIONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setDurationValues({
                      rijles: String(preset),
                      proefles: String(preset),
                      pakketles: String(preset),
                      examenrit: String(preset),
                    })
                  }
                  className={cn(
                    "rounded-full border px-3 py-2 text-xs font-semibold transition",
                    Number.parseInt(durationValues.rijles, 10) === preset
                      ? "border-blue-400 bg-blue-600 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-blue-300/40",
                  )}
                >
                  {preset} min
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            className="mt-5 h-12 w-full rounded-lg bg-blue-600 text-white hover:bg-blue-500"
            disabled={isPending}
            onClick={saveDurationDefaults}
          >
            <Settings2 className="size-4" />
            Opslaan
          </Button>
        </DashboardCard>

        <DashboardCard id="beschikbaarheid-overzicht" className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Weekplanning
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Wanneer kan ik werken: open slots, lessen, aanvragen en
                blokkades in dezelfde agenda.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <PlanningWeekView
              emptyLabel="Geen lessen, vrije slots of blokkades."
              initialAnchorDate={getDateFromValue(calendarWeekStart)}
              items={calendarPlanningItems}
              onSelectItem={(item) => {
                if (item.kind === "available" && item.meta?.slot) {
                  setPlanningSlot(item.meta.slot);
                  return;
                }

                if (item.kind === "lesson" && item.meta?.lesson) {
                  setEditingLesson(item.meta.lesson);
                  return;
                }

                if (item.kind === "request" && item.meta?.request) {
                  setSelectedRequest(item.meta.request);
                }
              }}
              onVisibleWeekStartChange={syncCalendarWeekStart}
              tone="urban"
            />
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-5 text-xs text-slate-400">
            {[
              ["bg-sky-400", "Les gepland"],
              ["bg-amber-400", "Aanvraag"],
              ["bg-emerald-400", "Beschikbaar"],
              ["bg-slate-500/70", "Pauze"],
              ["bg-rose-400", "Geblokkeerd"],
            ].map(([color, label]) => (
              <span key={label} className="inline-flex items-center gap-2">
                <span className={cn("size-3 rounded-sm", color)} />
                {label}
              </span>
            ))}
          </div>
        </DashboardCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <DashboardCard className="p-5">
          <h2 className="text-xl font-semibold text-white">
            Komende blokkades
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Vakanties en speciale dagen.
          </p>

          <div className="mt-5 space-y-3">
            {upcomingBlocks.length ? (
              upcomingBlocks.map((slot) => (
                <div
                  key={`${slot.id}-${slot.start_at}`}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-500/12 text-amber-300">
                    <Luggage className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">
                      {slot.source === "weekrooster" ? "Vaste blokkade" : "Blokkade"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {slot.start_at
                        ? compactWeekdayFormatter.format(new Date(slot.start_at))
                        : "Datum onbekend"}
                    </p>
                  </div>
                  <Badge className="border border-white/10 bg-white/10 text-slate-200">
                    {slot.start_at && slot.eind_at
                      ? formatMinutes(
                          getAvailabilityDurationMinutes(
                            slot.start_at,
                            slot.eind_at,
                          ),
                        )
                      : "Onbekend"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 p-5 text-sm text-slate-400">
                Nog geen komende blokkades gevonden.
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-5 h-11 w-full rounded-lg border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white"
            onClick={() => {
              setSelectedQuickAction("vacation");
              toast.info("Vakantie blokkeren staat klaar bij snelle acties.");
            }}
          >
            Alle blokkades bekijken
          </Button>
        </DashboardCard>

        <DashboardCard className="p-5">
          <h2 className="text-xl font-semibold text-white">Samenvatting</h2>
          <p className="mt-2 text-sm text-slate-400">
            Jouw beschikbaarheid in cijfers.
          </p>

          <div className="mt-5 divide-y divide-white/10 rounded-lg border border-white/10 bg-white/[0.02]">
            {[
              ["Totale beschikbare uren (week)", formatMinutes(availableMinutesWeek), "text-emerald-300"],
              ["Totale beschikbare uren (maand)", formatMinutes(availableMinutesMonth), "text-emerald-300"],
              ["Bezet (week)", formatMinutes(busyMinutesWeek), "text-white"],
              ["Geblokkeerd (week)", formatMinutes(blockedMinutesWeek), "text-white"],
            ].map(([label, value, valueClass]) => (
              <div key={label} className="flex items-center justify-between px-4 py-4">
                <span className="text-sm text-slate-300">{label}</span>
                <span className={cn("text-sm font-semibold", valueClass)}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Laatst bijgewerkt: vandaag om{" "}
            {formatAvailabilityTime(new Date().toISOString())}
          </p>
        </DashboardCard>

        <DashboardCard className="p-5">
          <h2 className="text-xl font-semibold text-white">Hulp nodig?</h2>
          <p className="mt-2 text-sm text-slate-400">
            Tips voor het beheren van je beschikbaarheid.
          </p>

          <div className="mt-5 space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
            {[
              {
                icon: EyeOff,
                text: "Gebruik snelle acties om snel een wijziging door te voeren.",
                className: "text-amber-300",
              },
              {
                icon: CalendarDays,
                text: "Blokkeer vakanties op tijd zodat leerlingen niet kunnen boeken.",
                className: "text-emerald-300",
              },
              {
                icon: ShieldCheck,
                text: "Werk je tijden bij wanneer je beschikbaarheid verandert.",
                className: "text-violet-300",
              },
            ].map((tip) => {
              const Icon = tip.icon;

              return (
                <div key={tip.text} className="flex gap-3 text-sm leading-6 text-slate-300">
                  <Icon className={cn("mt-1 size-4 shrink-0", tip.className)} />
                  <span>{tip.text}</span>
                </div>
              );
            })}
          </div>

          <Button
            asChild
            variant="outline"
            className="mt-5 h-11 w-full rounded-lg border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/instructeur/instellingen">
              <BookOpen className="size-4" />
              Handleiding bekijken
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </DashboardCard>
      </section>
    </div>
  );
}
