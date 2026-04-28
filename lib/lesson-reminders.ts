import "server-only";

import {
  sendInstructorLessonReminderEmail,
  sendLearnerLessonReminderEmail,
} from "@/lib/notification-events";
import { createAdminClient } from "@/lib/supabase/admin";

type ClaimedReminderRow = {
  lesson_id: string | null;
  leerling_profiel_id: string | null;
  instructeur_profiel_id: string | null;
  leerling_email: string | null;
  instructeur_email: string | null;
  leerling_naam: string | null;
  instructeur_naam: string | null;
  les_titel: string | null;
  les_datum: string | null;
  les_tijd: string | null;
  locatie: string | null;
  start_at: string | null;
};

export async function processDueLessonReminders() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc("claim_due_lesson_reminders");

  if (error) {
    throw new Error(`Kon lesherinneringen niet claimen: ${error.message}`);
  }

  const claimedRows = (data ?? []) as ClaimedReminderRow[];

  if (!claimedRows.length) {
    return {
      claimed: 0,
      learnerEmailsSent: 0,
      instructorEmailsSent: 0,
    };
  }

  const emailJobs = claimedRows.flatMap((row) => {
    const jobs: Array<{
      audience: "learner" | "instructor";
      run: Promise<Awaited<ReturnType<typeof sendLearnerLessonReminderEmail>>>;
    }> = [];

    if (
      row.leerling_email &&
      row.instructeur_naam &&
      row.les_datum &&
      row.les_tijd &&
      row.les_titel
    ) {
      jobs.push({
        audience: "learner",
        run: sendLearnerLessonReminderEmail({
          to: row.leerling_email,
          instructeurNaam: row.instructeur_naam,
          datum: row.les_datum,
          tijd: row.les_tijd,
          locatie: row.locatie ?? "Locatie volgt nog",
          lesTitel: row.les_titel,
        }),
      });
    }

    if (
      row.instructeur_email &&
      row.leerling_naam &&
      row.les_datum &&
      row.les_tijd &&
      row.les_titel
    ) {
      jobs.push({
        audience: "instructor",
        run: sendInstructorLessonReminderEmail({
          to: row.instructeur_email,
          leerlingNaam: row.leerling_naam,
          datum: row.les_datum,
          tijd: row.les_tijd,
          locatie: row.locatie ?? "Locatie volgt nog",
          lesTitel: row.les_titel,
        }),
      });
    }

    return jobs;
  });

  const emailResults = await Promise.allSettled(
    emailJobs.map((job) => job.run)
  );

  let learnerEmailsSent = 0;
  let instructorEmailsSent = 0;

  emailResults.forEach((result, index) => {
    if (
      result.status === "fulfilled" &&
      result.value?.sent &&
      emailJobs[index]?.audience === "learner"
    ) {
      learnerEmailsSent += 1;
    }

    if (
      result.status === "fulfilled" &&
      result.value?.sent &&
      emailJobs[index]?.audience === "instructor"
    ) {
      instructorEmailsSent += 1;
    }

    if (result.status === "rejected") {
      console.error("Lesson reminder email failed", result.reason);
    }
  });

  return {
    claimed: claimedRows.length,
    learnerEmailsSent,
    instructorEmailsSent,
  };
}
