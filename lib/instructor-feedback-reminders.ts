import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type ServerSupabase = SupabaseClient<Database>;

type CompletedLessonRow = {
  id: string;
  instructeur_id: string | null;
  leerling_id: string | null;
  start_at: string | null;
  titel: string | null;
};

type LessonNoteRow = {
  les_id: string | null;
  samenvatting: string | null;
  sterk_punt: string | null;
  focus_volgende_les: string | null;
};

type InstructorRow = {
  id: string;
  profile_id: string;
  volledige_naam: string | null;
};

type LearnerRow = {
  id: string;
  profile_id: string;
};

type ProfileRow = {
  id: string;
  volledige_naam: string;
  email: string | null;
};

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

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

function hasWrittenFeedback(row: LessonNoteRow) {
  return Boolean(
    row.samenvatting?.trim() ||
      row.sterk_punt?.trim() ||
      row.focus_volgende_les?.trim(),
  );
}

function getDateLabel(value: string | null) {
  if (!value) {
    return "onbekende datum";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function getTimeLabel(value: string | null) {
  if (!value) {
    return "onbekende tijd";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "onbekende tijd" : timeFormatter.format(date);
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

export function getFeedbackReminderActionHref({
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

function compactUnique<T extends string>(items: Array<T | null | undefined>) {
  return Array.from(new Set(items.filter((item): item is T => Boolean(item))));
}

export async function processInstructorFeedbackReminders({
  hoursAfterLesson = 24,
  daysBack = 30,
  limit = 80,
}: {
  hoursAfterLesson?: number;
  daysBack?: number;
  limit?: number;
} = {}) {
  const supabase = await createAdminClient();
  const now = Date.now();
  const cutoffIso = new Date(
    now - Math.max(hoursAfterLesson, 1) * HOUR_IN_MS,
  ).toISOString();
  const fromIso = new Date(
    now - Math.max(daysBack, 1) * DAY_IN_MS,
  ).toISOString();
  const safeLimit = Math.min(Math.max(limit, 1), 200);

  const { data: lessons, error: lessonsError } = (await supabase
    .from("lessen")
    .select("id, instructeur_id, leerling_id, start_at, titel")
    .eq("status", "afgerond")
    .not("instructeur_id", "is", null)
    .not("leerling_id", "is", null)
    .not("start_at", "is", null)
    .gte("start_at", fromIso)
    .lte("start_at", cutoffIso)
    .order("start_at", { ascending: true })
    .limit(safeLimit)) as unknown as {
    data: CompletedLessonRow[] | null;
    error?: { message?: string } | null;
  };

  if (lessonsError) {
    throw new Error(
      `Kon feedback-reminder lessen niet ophalen: ${
        lessonsError.message ?? "onbekende Supabase fout"
      }`,
    );
  }

  const lessonRows = lessons ?? [];

  if (!lessonRows.length) {
    return {
      created: 0,
      pending: 0,
      scanned: 0,
      skippedExisting: 0,
      skippedMissingInstructor: 0,
    };
  }

  const lessonIds = lessonRows.map((lesson) => lesson.id);
  const { data: notes, error: notesError } = (await supabase
    .from("leerling_voortgang_lesnotities")
    .select("les_id, samenvatting, sterk_punt, focus_volgende_les")
    .in("les_id", lessonIds)) as unknown as {
    data: LessonNoteRow[] | null;
    error?: { message?: string } | null;
  };

  if (notesError) {
    throw new Error(
      `Kon feedback-reminder lesverslagen niet ophalen: ${
        notesError.message ?? "onbekende Supabase fout"
      }`,
    );
  }

  const lessonsWithFeedback = new Set(
    (notes ?? [])
      .filter((note) => note.les_id && hasWrittenFeedback(note))
      .map((note) => note.les_id),
  );
  const pendingLessons = lessonRows.filter(
    (lesson) => !lessonsWithFeedback.has(lesson.id),
  );

  if (!pendingLessons.length) {
    return {
      created: 0,
      pending: 0,
      scanned: lessonRows.length,
      skippedExisting: 0,
      skippedMissingInstructor: 0,
    };
  }

  const instructorIds = compactUnique(
    pendingLessons.map((lesson) => lesson.instructeur_id),
  );
  const learnerIds = compactUnique(
    pendingLessons.map((lesson) => lesson.leerling_id),
  );
  const [{ data: instructors }, { data: learners }] = (await Promise.all([
    supabase
      .from("instructeurs")
      .select("id, profile_id, volledige_naam")
      .in("id", instructorIds),
    supabase.from("leerlingen").select("id, profile_id").in("id", learnerIds),
  ])) as unknown as [
    { data: InstructorRow[] | null },
    { data: LearnerRow[] | null },
  ];
  const instructorMap = new Map(
    (instructors ?? []).map((instructor) => [instructor.id, instructor]),
  );
  const learnerMap = new Map((learners ?? []).map((learner) => [learner.id, learner]));
  const profileIds = compactUnique([
    ...(instructors ?? []).map((instructor) => instructor.profile_id),
    ...(learners ?? []).map((learner) => learner.profile_id),
  ]);
  const { data: profiles } = (await supabase
    .from("profiles")
    .select("id, volledige_naam, email")
    .in("id", profileIds)) as unknown as { data: ProfileRow[] | null };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  let created = 0;
  let skippedExisting = 0;
  let skippedMissingInstructor = 0;

  for (const lesson of pendingLessons) {
    const instructor = lesson.instructeur_id
      ? instructorMap.get(lesson.instructeur_id)
      : null;

    if (!instructor?.profile_id) {
      skippedMissingInstructor += 1;
      continue;
    }

    const learner = lesson.leerling_id ? learnerMap.get(lesson.leerling_id) : null;
    const learnerProfile = learner?.profile_id
      ? profileMap.get(learner.profile_id)
      : null;
    const learnerName = learnerProfile?.volledige_naam?.trim() || "een leerling";
    const lessonTitle = lesson.titel?.trim() || "rijles";
    const dateLabel = getDateLabel(lesson.start_at);
    const timeLabel = getTimeLabel(lesson.start_at);
    const actionHref = getFeedbackReminderActionHref({
      dateValue: getLessonDateValue(lesson.start_at),
      learnerId: lesson.leerling_id ?? "",
      lessonId: lesson.id,
    });
    const title = "Feedback nog invullen";
    const text = `${learnerName} had ${lessonTitle.toLowerCase()} op ${dateLabel} om ${timeLabel}. Er staat nog geen lesverslag klaar. Vul feedback in zodat de leerling zijn voortgang ziet.`;

    const { data: existingNotification, error: existingError } = await supabase
      .from("notificaties")
      .select("id, action_href")
      .eq("profiel_id", instructor.profile_id)
      .eq("titel", title)
      .eq("tekst", text)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("Feedback reminder duplicate check failed", {
        error: existingError,
        lessonId: lesson.id,
      });
      continue;
    }

    if (existingNotification) {
      if (!existingNotification.action_href) {
        await supabase
          .from("notificaties")
          .update({ action_href: actionHref })
          .eq("id", existingNotification.id);
      }
      skippedExisting += 1;
      continue;
    }

    const { error: insertError } = await supabase.from("notificaties").insert({
      action_href: actionHref,
      ongelezen: true,
      profiel_id: instructor.profile_id,
      tekst: text,
      titel: title,
      type: "waarschuwing",
    });

    if (insertError) {
      console.error("Feedback reminder notification insert failed", {
        error: insertError,
        lessonId: lesson.id,
      });
      continue;
    }

    created += 1;
  }

  return {
    created,
    pending: pendingLessons.length,
    scanned: lessonRows.length,
    skippedExisting,
    skippedMissingInstructor,
  };
}

export async function markInstructorFeedbackReminderResolved({
  instructorProfileId,
  learnerId,
  lessonId,
  lessonStartAt,
  supabase,
}: {
  instructorProfileId: string | null | undefined;
  learnerId: string;
  lessonId: string | null | undefined;
  lessonStartAt?: string | null;
  supabase: ServerSupabase;
}) {
  if (!instructorProfileId || !lessonId) {
    return { resolved: 0 };
  }

  const actionHref = getFeedbackReminderActionHref({
    dateValue: getLessonDateValue(lessonStartAt ?? null),
    learnerId,
    lessonId,
  });

  const { data, error } = await supabase
    .from("notificaties")
    .update({ ongelezen: false })
    .eq("profiel_id", instructorProfileId)
    .eq("titel", "Feedback nog invullen")
    .eq("action_href", actionHref)
    .eq("ongelezen", true)
    .select("id");

  if (error) {
    console.error("Feedback reminder resolve failed", {
      actionHref,
      error,
      lessonId,
    });

    return { resolved: 0 };
  }

  return { resolved: data?.length ?? 0 };
}
