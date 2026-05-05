import "server-only";

import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import { createServerClient } from "@/lib/supabase/server";
import type { InstructorFeedbackTodoLesson } from "@/lib/types";

type CompletedLessonRow = {
  id: string;
  titel: string | null;
  start_at: string | null;
  leerling_id: string | null;
  leerling: {
    id: string;
    profile: {
      volledige_naam: string | null;
      email: string | null;
    } | null;
  } | null;
};

type LessonNoteRow = {
  les_id: string | null;
  samenvatting: string | null;
  sterk_punt: string | null;
  focus_volgende_les: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Amsterdam",
});

const timeFormatter = new Intl.DateTimeFormat("nl-NL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_HOURS = 24;

function formatDate(value: string | null) {
  if (!value) {
    return "Nog geen datum";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatTime(value: string | null) {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "--:--" : timeFormatter.format(date);
}

function getLessonDateValue(startAt: string | null) {
  if (!startAt) {
    return new Date().toISOString().slice(0, 10);
  }

  const date = new Date(startAt);

  if (Number.isNaN(date.getTime())) {
    return startAt.slice(0, 10);
  }

  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Amsterdam",
    year: "numeric",
  }).format(date);
}

function getFeedbackHref({
  dateValue,
  learnerId,
  lessonId,
}: {
  dateValue: string;
  learnerId: string;
  lessonId: string;
}) {
  return `/instructeur/leerlingen?student=${encodeURIComponent(
    learnerId,
  )}&date=${encodeURIComponent(dateValue)}&lesson=${encodeURIComponent(
    lessonId,
  )}&feedback=1#voortgang-feedback`;
}

function hasWrittenFeedback(row: LessonNoteRow) {
  return Boolean(
    row.samenvatting?.trim() ||
      row.sterk_punt?.trim() ||
      row.focus_volgende_les?.trim(),
  );
}

function getOpenFeedbackAge(startAt: string | null, nowMs: number) {
  const timestamp = startAt ? new Date(startAt).getTime() : nowMs;
  const safeTimestamp = Number.isNaN(timestamp) ? nowMs : timestamp;
  const openAgeHours = Math.max(
    0,
    Math.floor((nowMs - safeTimestamp) / HOUR_IN_MS),
  );
  const openAgeDays = Math.floor(openAgeHours / DAY_IN_HOURS);

  if (openAgeHours >= DAY_IN_HOURS * 2) {
    return {
      open_age_days: openAgeDays,
      open_age_hours: openAgeHours,
      open_label: `${openAgeDays} dagen open`,
      urgency: "urgent" as const,
    };
  }

  if (openAgeHours >= DAY_IN_HOURS) {
    return {
      open_age_days: openAgeDays,
      open_age_hours: openAgeHours,
      open_label: "1 dag open",
      urgency: "attention" as const,
    };
  }

  return {
    open_age_days: 0,
    open_age_hours: openAgeHours,
    open_label: "Vandaag open",
    urgency: "recent" as const,
  };
}

export async function getCurrentInstructorFeedbackTodoLessons({
  daysBack = 21,
  limit = 24,
}: {
  daysBack?: number;
  limit?: number;
} = {}): Promise<InstructorFeedbackTodoLesson[]> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 80);
  const queryLimit = Math.min(Math.max(safeLimit * 4, safeLimit), 160);
  const fromDate = new Date(
    Date.now() - Math.max(daysBack, 1) * 24 * 60 * 60 * 1000,
  ).toISOString();
  const supabase = await createServerClient();
  const { data: lessons, error: lessonsError } = (await supabase
    .from("lessen")
    .select(
      "id, titel, start_at, leerling_id, leerling:leerlingen!lessen_leerling_id_fkey(id, profile:profiles!leerlingen_profile_id_fkey(volledige_naam, email))",
    )
    .eq("instructeur_id", instructeur.id)
    .eq("status", "afgerond")
    .not("leerling_id", "is", null)
    .gte("start_at", fromDate)
    .order("start_at", { ascending: false })
    .limit(queryLimit)) as unknown as {
    data: CompletedLessonRow[] | null;
    error?: unknown;
  };

  if (lessonsError) {
    logSupabaseDataError("feedbackTodos.completedLessons", lessonsError, {
      daysBack,
      instructeurId: instructeur.id,
      limit: queryLimit,
    });
    return [];
  }

  const lessonRows = lessons ?? [];
  const lessonIds = lessonRows.map((lesson) => lesson.id);

  if (!lessonIds.length) {
    return [];
  }

  const { data: notes, error: notesError } = (await supabase
    .from("leerling_voortgang_lesnotities")
    .select("les_id, samenvatting, sterk_punt, focus_volgende_les")
    .eq("instructeur_id", instructeur.id)
    .in("les_id", lessonIds)) as unknown as {
    data: LessonNoteRow[] | null;
    error?: unknown;
  };

  if (notesError) {
    logSupabaseDataError("feedbackTodos.lessonNotes", notesError, {
      instructeurId: instructeur.id,
      lessonCount: lessonIds.length,
    });
    return [];
  }

  const lessonsWithFeedback = new Set(
    (notes ?? [])
      .filter((note) => note.les_id && hasWrittenFeedback(note))
      .map((note) => note.les_id),
  );

  const nowMs = Date.now();

  return lessonRows
    .filter(
      (lesson) => lesson.leerling_id && !lessonsWithFeedback.has(lesson.id),
    )
    .map((lesson) => {
      const learnerId = lesson.leerling_id ?? "";
      const dateValue = getLessonDateValue(lesson.start_at);
      const age = getOpenFeedbackAge(lesson.start_at, nowMs);

      return {
        datum: formatDate(lesson.start_at),
        href: getFeedbackHref({
          dateValue,
          learnerId,
          lessonId: lesson.id,
        }),
        id: lesson.id,
        leerling_email: lesson.leerling?.profile?.email ?? null,
        leerling_id: learnerId,
        leerling_naam:
          lesson.leerling?.profile?.volledige_naam?.trim() || "Leerling",
        ...age,
        start_at: lesson.start_at,
        tijd: formatTime(lesson.start_at),
        titel: lesson.titel?.trim() || "Rijles",
      };
    })
    .sort((left, right) => right.open_age_hours - left.open_age_hours)
    .slice(0, safeLimit);
}
