import "server-only";

import type { LessonCheckinBoard } from "@/lib/types";
import {
  getCurrentInstructeurRecord,
  getCurrentLeerlingRecord,
} from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

type LessonCheckinRow = {
  id: string;
  les_id: string;
  leerling_id: string;
  instructeur_id: string;
  confidence_level: number | null;
  support_request: string | null;
  arrival_mode: "op_tijd" | "afstemmen" | null;
  instructor_focus: string | null;
  learner_updated_at: string | null;
  instructor_updated_at: string | null;
};

type UpcomingLessonRow = {
  id: string;
  titel: string | null;
  start_at: string | null;
  leerling_id: string | null;
  instructeur_id: string | null;
};

function formatLessonDate(dateValue: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(dateValue));
}

function formatLessonTime(dateValue: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(dateValue));
}

async function getLearnerNames(leerlingIds: string[]) {
  if (!leerlingIds.length) {
    return new Map<string, string>();
  }

  const supabase = await createServerClient();
  const { data: learners } = await supabase
    .from("leerlingen")
    .select("id, profile_id")
    .in("id", leerlingIds);

  const profileIds = (learners ?? []).map((row) => row.profile_id);

  if (!profileIds.length) {
    return new Map<string, string>();
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, volledige_naam")
    .in("id", profileIds);

  const profileMap = new Map(
    (profiles ?? []).map((row) => [row.id, row.volledige_naam || "Leerling"])
  );

  return new Map(
    (learners ?? []).map((row) => [
      row.id,
      profileMap.get(row.profile_id) ?? "Leerling",
    ])
  );
}

async function getInstructorNames(instructeurIds: string[]) {
  if (!instructeurIds.length) {
    return new Map<string, string>();
  }

  const supabase = await createServerClient();
  const { data: instructors } = await supabase
    .from("instructeurs")
    .select("id, profile_id")
    .in("id", instructeurIds);

  const profileIds = (instructors ?? []).map((row) => row.profile_id);

  if (!profileIds.length) {
    return new Map<string, string>();
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, volledige_naam")
    .in("id", profileIds);

  const profileMap = new Map(
    (profiles ?? []).map((row) => [row.id, row.volledige_naam || "Instructeur"])
  );

  return new Map(
    (instructors ?? []).map((row) => [
      row.id,
      profileMap.get(row.profile_id) ?? "Instructeur",
    ])
  );
}

function mapBoard(
  lesson: UpcomingLessonRow,
  checkin: LessonCheckinRow | undefined,
  counterpartName: string
): LessonCheckinBoard | null {
  if (!lesson.start_at) {
    return null;
  }

  return {
    id: checkin?.id ?? null,
    les_id: lesson.id,
    counterpart_name: counterpartName,
    lesson_title: lesson.titel?.trim() || "Rijles",
    lesson_date: formatLessonDate(lesson.start_at),
    lesson_time: formatLessonTime(lesson.start_at),
    confidence_level: checkin?.confidence_level ?? null,
    support_request: checkin?.support_request ?? null,
    arrival_mode: checkin?.arrival_mode ?? null,
    instructor_focus: checkin?.instructor_focus ?? null,
    learner_updated_at: checkin?.learner_updated_at ?? null,
    instructor_updated_at: checkin?.instructor_updated_at ?? null,
  };
}

export async function getCurrentInstructorLessonCheckinBoards() {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [] as LessonCheckinBoard[];
  }

  const supabase = await createServerClient();
  const now = new Date().toISOString();
  const { data: lessons } = (await supabase
    .from("lessen")
    .select("id, titel, start_at, leerling_id, instructeur_id")
    .eq("instructeur_id", instructeur.id)
    .in("status", ["ingepland", "geaccepteerd"])
    .gte("start_at", now)
    .order("start_at", { ascending: true })
    .limit(4)) as unknown as { data: UpcomingLessonRow[] | null };

  if (!lessons?.length) {
    return [] as LessonCheckinBoard[];
  }

  const lessonIds = lessons.map((lesson) => lesson.id);
  const learnerIds = lessons
    .map((lesson) => lesson.leerling_id)
    .filter((value): value is string => Boolean(value));

  const [{ data: checkins }, learnerNameMap] = (await Promise.all([
    supabase
      .from("les_checkins" as never)
      .select(
        "id, les_id, leerling_id, instructeur_id, confidence_level, support_request, arrival_mode, instructor_focus, learner_updated_at, instructor_updated_at"
      )
      .in("les_id", lessonIds),
    getLearnerNames(learnerIds),
  ])) as unknown as [
    { data: LessonCheckinRow[] | null },
    Map<string, string>,
  ];

  const checkinMap = new Map((checkins ?? []).map((row) => [row.les_id, row]));

  return lessons
    .map((lesson) =>
      mapBoard(
        lesson,
        checkinMap.get(lesson.id),
        lesson.leerling_id
          ? learnerNameMap.get(lesson.leerling_id) ?? "Leerling"
          : "Leerling"
      )
    )
    .filter((board): board is LessonCheckinBoard => Boolean(board));
}

export async function getCurrentLearnerLessonCheckinBoards() {
  const leerling = await getCurrentLeerlingRecord();

  if (!leerling) {
    return [] as LessonCheckinBoard[];
  }

  const supabase = await createServerClient();
  const now = new Date().toISOString();
  const { data: lessons } = (await supabase
    .from("lessen")
    .select("id, titel, start_at, leerling_id, instructeur_id")
    .eq("leerling_id", leerling.id)
    .in("status", ["ingepland", "geaccepteerd"])
    .gte("start_at", now)
    .order("start_at", { ascending: true })
    .limit(2)) as unknown as { data: UpcomingLessonRow[] | null };

  if (!lessons?.length) {
    return [] as LessonCheckinBoard[];
  }

  const lessonIds = lessons.map((lesson) => lesson.id);
  const instructorIds = lessons
    .map((lesson) => lesson.instructeur_id)
    .filter((value): value is string => Boolean(value));

  const [{ data: checkins }, instructorNameMap] = (await Promise.all([
    supabase
      .from("les_checkins" as never)
      .select(
        "id, les_id, leerling_id, instructeur_id, confidence_level, support_request, arrival_mode, instructor_focus, learner_updated_at, instructor_updated_at"
      )
      .in("les_id", lessonIds),
    getInstructorNames(instructorIds),
  ])) as unknown as [
    { data: LessonCheckinRow[] | null },
    Map<string, string>,
  ];

  const checkinMap = new Map((checkins ?? []).map((row) => [row.les_id, row]));

  return lessons
    .map((lesson) =>
      mapBoard(
        lesson,
        checkinMap.get(lesson.id),
        lesson.instructeur_id
          ? instructorNameMap.get(lesson.instructeur_id) ?? "Instructeur"
          : "Instructeur"
      )
    )
    .filter((board): board is LessonCheckinBoard => Boolean(board));
}
