import "server-only";

import { MANUAL_LEARNER_INTAKE_ITEMS } from "@/lib/manual-learner-intake";
import { createServerClient } from "@/lib/supabase/server";
import {
  ensureCurrentUserContext,
  getCurrentInstructeurRecord,
} from "@/lib/data/profiles";
import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import { getInstructorGrowthInsights } from "@/lib/data/instructor-growth-insights";
import { getInstructeurStudentsWorkspace } from "@/lib/data/student-progress";

type InstructorUpcomingLessonRow = {
  leerling_id: string | null;
  titel: string;
  start_at: string | null;
  status: string | null;
};

export type MessageRecipientOption = {
  id: string;
  label: string;
};

export type MessageSmartTemplate = {
  id: string;
  kind:
    | "package_proposal"
    | "lesson_reminder"
    | "open_slot"
    | "intake_follow_up";
  title: string;
  description: string;
  badgeLabel: string;
  badgeVariant: "info" | "success" | "warning";
  recipientProfileId: string;
  recipientLabel: string;
  subject: string;
  body: string;
};

export type MessageSentLogEntry = {
  id: string;
  recipient: string;
  subject: string;
  preview: string;
  time: string;
};

function formatDateTimeLabel(dateValue: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(dateValue));
}

function formatSlotLabel(startAt: string, endAt: string) {
  const day = new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(startAt));
  const start = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(startAt));
  const end = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(endAt));

  return `${day}, ${start} - ${end}`;
}

function buildLessonReminderSubject(startAt: string) {
  const dayLabel = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(startAt));

  return `Herinnering voor je les op ${dayLabel}`;
}

function truncateInline(value: string, maxLength = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

export async function getCurrentMessageInbox() {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return [];
  }

  const supabase = await createServerClient();
  const { data: rows, error } = await supabase
    .from("berichten")
    .select("id, afzender_profiel_id, onderwerp, inhoud, gelezen, created_at")
    .eq("ontvanger_profiel_id", context.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    logSupabaseDataError("messages.inbox", error, {
      profileId: context.user.id,
    });
    return [];
  }

  if (!rows?.length) {
    return [];
  }

  const senderIds = rows.map((row) => row.afzender_profiel_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, volledige_naam")
    .in("id", senderIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.volledige_naam])
  );

  return rows.map((row) => ({
    id: row.id,
    afzender: profileMap.get(row.afzender_profiel_id) ?? "Afzender",
    onderwerp: row.onderwerp,
    preview: row.inhoud,
    tijd: new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(row.created_at)),
    ongelezen: !row.gelezen,
  }));
}

export async function getCurrentOutgoingMessageLog(): Promise<
  MessageSentLogEntry[]
> {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return [];
  }

  const supabase = await createServerClient();
  const { data: rows, error } = await supabase
    .from("berichten")
    .select("id, ontvanger_profiel_id, onderwerp, inhoud, created_at")
    .eq("afzender_profiel_id", context.user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    logSupabaseDataError("messages.outgoingLog", error, {
      profileId: context.user.id,
    });
    return [];
  }

  if (!rows?.length) {
    return [];
  }

  const recipientIds = rows.map((row) => row.ontvanger_profiel_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, volledige_naam")
    .in("id", recipientIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.volledige_naam])
  );

  return rows.map((row) => ({
    id: row.id,
    recipient: profileMap.get(row.ontvanger_profiel_id) ?? "Ontvanger",
    subject: row.onderwerp,
    preview: truncateInline(row.inhoud, 140),
    time: new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(row.created_at)),
  }));
}

export async function getMessageRecipientsForCurrentUser(): Promise<
  MessageRecipientOption[]
> {
  const context = await ensureCurrentUserContext();

  if (!context) {
    return [];
  }

  const supabase = await createServerClient();

  if (context.role === "leerling") {
    const { data: rows } = await supabase
      .from("instructeurs")
      .select("id, profile_id")
      .order("created_at", { ascending: false })
      .limit(50);

    const profileIds = (rows ?? []).map((row) => row.profile_id);
    const { data: profiles } = profileIds.length
      ? await supabase
          .from("profiles")
          .select("id, volledige_naam")
          .in("id", profileIds)
      : { data: [] };

    const profileMap = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile.volledige_naam])
    );

    return (rows ?? []).map((row) => ({
      id: row.profile_id,
      label: profileMap.get(row.profile_id) ?? "Instructeur",
    }));
  }

  if (context.role === "instructeur") {
    const { data: rows } = await supabase
      .from("leerlingen")
      .select("id, profile_id")
      .order("created_at", { ascending: false })
      .limit(50);

    const profileIds = (rows ?? []).map((row) => row.profile_id);
    const { data: profiles } = profileIds.length
      ? await supabase
          .from("profiles")
          .select("id, volledige_naam")
          .in("id", profileIds)
      : { data: [] };

    const profileMap = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile.volledige_naam])
    );

    return (rows ?? []).map((row) => ({
      id: row.profile_id,
      label: profileMap.get(row.profile_id) ?? "Leerling",
    }));
  }

  return [];
}

export async function getInstructorMessageSmartTemplates(): Promise<
  MessageSmartTemplate[]
> {
  const context = await ensureCurrentUserContext();
  const instructeur = await getCurrentInstructeurRecord();

  if (!context || context.role !== "instructeur" || !instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  const workspacePromise = getInstructeurStudentsWorkspace();
  const [workspace, growthInsights, lessonsResult] = await Promise.all([
    workspacePromise,
    getInstructorGrowthInsights(workspacePromise),
    supabase
      .from("lessen")
      .select("leerling_id, titel, start_at, status")
      .eq("instructeur_id", instructeur.id)
      .in("status", ["geaccepteerd", "ingepland"])
      .gte("start_at", new Date().toISOString())
      .lte("start_at", new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString())
      .order("start_at", { ascending: true })
      .limit(8),
  ]);

  const lessons = (lessonsResult.data ?? []) as InstructorUpcomingLessonRow[];
  const studentsById = new Map(
    workspace.students
      .filter((student) => student.profileId)
      .map((student) => [student.id, student])
  );
  const templates: MessageSmartTemplate[] = [];

  const packageSuggestion =
    growthInsights.packageOpportunities.find(
      (item) => item.studentId && item.suggestedPackageName && item.draftText
    ) ??
    growthInsights.upgradeCandidates.find(
      (item) => item.studentId && item.suggestedPackageName && item.draftText
    );

  if (packageSuggestion?.studentId) {
    const student = studentsById.get(packageSuggestion.studentId);

    if (student?.profileId) {
      templates.push({
        id: `template-package-${student.id}`,
        kind: "package_proposal",
        title: "Pakketvoorstel",
        description: `${student.naam} - ${packageSuggestion.suggestedPackageName}`,
        badgeLabel: "Klaar om te sturen",
        badgeVariant: "success",
        recipientProfileId: student.profileId,
        recipientLabel: student.naam,
        subject: packageSuggestion.currentPackageName
          ? `Voorstel om door te pakken met ${packageSuggestion.suggestedPackageName}`
          : `Voorstel voor ${packageSuggestion.suggestedPackageName}`,
        body: packageSuggestion.draftText ?? "",
      });
    }
  }

  const upcomingLesson = lessons.find(
    (lesson) => lesson.leerling_id && lesson.start_at && studentsById.has(lesson.leerling_id)
  );

  if (upcomingLesson?.leerling_id && upcomingLesson.start_at) {
    const student = studentsById.get(upcomingLesson.leerling_id);

    if (student?.profileId) {
      const lessonMoment = formatDateTimeLabel(upcomingLesson.start_at);

      templates.push({
        id: `template-reminder-${student.id}`,
        kind: "lesson_reminder",
        title: "Lesherinnering",
        description: `${student.naam} - ${lessonMoment}`,
        badgeLabel: "Binnenkort gepland",
        badgeVariant: "info",
        recipientProfileId: student.profileId,
        recipientLabel: student.naam,
        subject: buildLessonReminderSubject(upcomingLesson.start_at),
        body: `Hi ${student.naam}, even een korte herinnering aan je ${upcomingLesson.titel.toLowerCase()} op ${lessonMoment}. Laat het me gerust weten als je vooraf nog iets wilt afstemmen of ergens extra op wilt focussen.`,
      });
    }
  }

  const openSlotSuggestion = growthInsights.fillGaps.find(
    (item) =>
      Boolean(item.slotStartAt && item.slotEndAt) &&
      (item.nudgeStudentIds?.length ?? 0) > 0
  );

  if (openSlotSuggestion?.slotStartAt && openSlotSuggestion.slotEndAt) {
    const targetStudentId = (openSlotSuggestion.nudgeStudentIds ?? []).find(
      (studentId) => studentsById.has(studentId)
    );
    const student = targetStudentId
      ? studentsById.get(targetStudentId) ?? null
      : null;

    if (student?.profileId) {
      const slotLabel = formatSlotLabel(
        openSlotSuggestion.slotStartAt,
        openSlotSuggestion.slotEndAt
      );

      templates.push({
        id: `template-open-slot-${student.id}`,
        kind: "open_slot",
        title: "Open-slot bericht",
        description: `${student.naam} - ${slotLabel}`,
        badgeLabel: "Slim moment vrij",
        badgeVariant: "warning",
        recipientProfileId: student.profileId,
        recipientLabel: student.naam,
        subject: `Vrij lesmoment op ${slotLabel}`,
        body: student.zelfInplannenToegestaan
          ? `Hi ${student.naam}, ik heb een mooi vrij lesmoment voor je opengezet op ${slotLabel}. Als dit past, kun je het direct pakken zodat je ritme lekker doorloopt.`
          : `Hi ${student.naam}, ik heb een mooi vrij lesmoment voor je beschikbaar op ${slotLabel}. Als dit voor je past, laat het me weten dan zet ik het direct voor je vast.`,
      });
    }
  }

  const intakeFollowUpStudent = workspace.students.find((student) => {
    if (!student.profileId || !student.isHandmatigGekoppeld) {
      return false;
    }

    const completedKeys = student.intakeChecklistKeys?.length ?? 0;
    return (
      completedKeys < MANUAL_LEARNER_INTAKE_ITEMS.length ||
      !student.volgendeLesAt
    );
  });

  if (intakeFollowUpStudent?.profileId) {
    const completedKeys = intakeFollowUpStudent.intakeChecklistKeys?.length ?? 0;
    const remainingCount = Math.max(
      MANUAL_LEARNER_INTAKE_ITEMS.length - completedKeys,
      0
    );
    const onboardingNote = intakeFollowUpStudent.onboardingNotitie?.trim()
      ? ` Ik heb nog staan: ${truncateInline(
          intakeFollowUpStudent.onboardingNotitie
        )}.`
      : "";

    templates.push({
      id: `template-intake-${intakeFollowUpStudent.id}`,
      kind: "intake_follow_up",
      title: "Intake opvolging",
      description:
        remainingCount > 0
          ? `${intakeFollowUpStudent.naam} - ${remainingCount} intakepunten open`
          : `${intakeFollowUpStudent.naam} - start nog niet afgerond`,
      badgeLabel: "Start afronden",
      badgeVariant: "info",
      recipientProfileId: intakeFollowUpStudent.profileId,
      recipientLabel: intakeFollowUpStudent.naam,
      subject: !intakeFollowUpStudent.volgendeLesAt
        ? "Even jouw start en eerste les afronden"
        : "Even jouw intake afronden",
      body: `Hi ${intakeFollowUpStudent.naam}, ik wil jouw start graag netjes afronden en de volgende stap meteen scherp zetten.${onboardingNote} Laat me even weten wat voor jou past, dan pak ik de intake en planning direct met je op.`,
    });
  }

  return templates;
}
