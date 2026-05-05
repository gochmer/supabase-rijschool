import "server-only";

import { cache } from "react";

import {
  getCurrentInstructeurRecord,
  getCurrentLeerlingRecord,
} from "@/lib/data/profiles";
import { logSupabaseDataError } from "@/lib/data/runtime-safety";
import { createServerClient } from "@/lib/supabase/server";

export type DataHealthStatus = "available" | "empty" | "error";

export type DataHealthCheck = {
  id: string;
  label: string;
  message: string;
  source: string;
  status: DataHealthStatus;
};

type HealthRow = {
  id: string;
};

type HealthQueryResult = {
  data: HealthRow[] | null;
  error: unknown;
};

function createEmptyCheck({
  id,
  label,
  message,
  source,
  status,
}: DataHealthCheck): DataHealthCheck {
  return {
    id,
    label,
    message,
    source,
    status,
  };
}

async function checkRows({
  id,
  label,
  query,
  source,
}: {
  id: string;
  label: string;
  query: PromiseLike<HealthQueryResult>;
  source: string;
}): Promise<DataHealthCheck> {
  try {
    const { data, error } = await query;

    if (error) {
      logSupabaseDataError(`dataHealth.${id}`, error, { source });

      return createEmptyCheck({
        id,
        label,
        message:
          "Deze bron kon niet worden opgehaald. De pagina toont daarom geen stille fallback.",
        source,
        status: "error",
      });
    }

    if (!data?.length) {
      return createEmptyCheck({
        id,
        label,
        message: "Database bereikbaar, maar er zijn geen records gevonden.",
        source,
        status: "empty",
      });
    }

    return createEmptyCheck({
      id,
      label,
      message: "Database bereikbaar en data gevonden.",
      source,
      status: "available",
    });
  } catch (error) {
    logSupabaseDataError(`dataHealth.${id}.unhandled`, error, { source });

    return createEmptyCheck({
      id,
      label,
      message:
        "Deze bron gaf een onverwachte fout. De pagina toont dit expliciet.",
      source,
      status: "error",
    });
  }
}

export const getAdminDashboardDataHealth = cache(
  async function getAdminDashboardDataHealth(): Promise<DataHealthCheck[]> {
    const supabase = await createServerClient();

    return Promise.all([
      checkRows({
        id: "admin-profiles",
        label: "Gebruikers",
        source: "profiles",
        query: supabase.from("profiles").select("id").limit(1),
      }),
      checkRows({
        id: "admin-instructors",
        label: "Instructeurs",
        source: "instructeurs",
        query: supabase.from("instructeurs").select("id").limit(1),
      }),
      checkRows({
        id: "admin-students",
        label: "Leerlingen",
        source: "leerlingen",
        query: supabase.from("leerlingen").select("id").limit(1),
      }),
      checkRows({
        id: "admin-lessons",
        label: "Lessen",
        source: "lessen",
        query: supabase.from("lessen").select("id").limit(1),
      }),
      checkRows({
        id: "admin-payments",
        label: "Betalingen",
        source: "betalingen",
        query: supabase.from("betalingen").select("id").limit(1),
      }),
      checkRows({
        id: "admin-support",
        label: "Support",
        source: "support_tickets",
        query: supabase.from("support_tickets").select("id").limit(1),
      }),
      checkRows({
        id: "admin-audit",
        label: "Auditlog",
        source: "audit_events",
        query: supabase.from("audit_events").select("id").limit(1),
      }),
    ]);
  },
);

export const getInstructorPlanningDataHealth = cache(
  async function getInstructorPlanningDataHealth(): Promise<DataHealthCheck[]> {
    const instructeur = await getCurrentInstructeurRecord();

    if (!instructeur) {
      return [
        createEmptyCheck({
          id: "instructor-profile",
          label: "Instructeurprofiel",
          message:
            "Er is geen instructeurprofiel gevonden voor deze sessie. Data wordt daarom niet als leeg gemaskeerd.",
          source: "instructeurs",
          status: "error",
        }),
      ];
    }

    const supabase = await createServerClient();

    return Promise.all([
      checkRows({
        id: "instructor-lessons",
        label: "Lessen",
        source: "lessen",
        query: supabase
          .from("lessen")
          .select("id")
          .eq("instructeur_id", instructeur.id)
          .limit(1),
      }),
      checkRows({
        id: "instructor-requests",
        label: "Aanvragen",
        source: "lesaanvragen",
        query: supabase
          .from("lesaanvragen")
          .select("id")
          .eq("instructeur_id", instructeur.id)
          .limit(1),
      }),
      checkRows({
        id: "instructor-availability",
        label: "Beschikbaarheid",
        source: "beschikbaarheid",
        query: supabase
          .from("beschikbaarheid")
          .select("id")
          .eq("instructeur_id", instructeur.id)
          .limit(1),
      }),
      checkRows({
        id: "instructor-student-links",
        label: "Leerlingkoppelingen",
        source: "instructeur_leerling_koppelingen",
        query: supabase
          .from("instructeur_leerling_koppelingen")
          .select("id")
          .eq("instructeur_id", instructeur.id)
          .limit(1),
      }),
      checkRows({
        id: "instructor-feedback",
        label: "Lesverslagen",
        source: "leerling_voortgang_lesnotities",
        query: supabase
          .from("leerling_voortgang_lesnotities")
          .select("id")
          .eq("instructeur_id", instructeur.id)
          .limit(1),
      }),
    ]);
  },
);

export const getLearnerJourneyDataHealth = cache(
  async function getLearnerJourneyDataHealth(): Promise<DataHealthCheck[]> {
    const leerling = await getCurrentLeerlingRecord();

    if (!leerling) {
      return [
        createEmptyCheck({
          id: "learner-record",
          label: "Leerlingrecord",
          message:
            "Er is geen leerlingrecord gevonden voor deze sessie. Data wordt daarom niet als leeg gemaskeerd.",
          source: "leerlingen",
          status: "error",
        }),
      ];
    }

    const supabase = await createServerClient();

    return Promise.all([
      checkRows({
        id: "learner-lessons",
        label: "Lessen",
        source: "lessen",
        query: supabase
          .from("lessen")
          .select("id")
          .eq("leerling_id", leerling.id)
          .limit(1),
      }),
      checkRows({
        id: "learner-requests",
        label: "Aanvragen",
        source: "lesaanvragen",
        query: supabase
          .from("lesaanvragen")
          .select("id")
          .eq("leerling_id", leerling.id)
          .limit(1),
      }),
      checkRows({
        id: "learner-payments",
        label: "Betalingen",
        source: "betalingen",
        query: supabase
          .from("betalingen")
          .select("id")
          .eq("profiel_id", leerling.profile_id)
          .limit(1),
      }),
      checkRows({
        id: "learner-notifications",
        label: "Notificaties",
        source: "notificaties",
        query: supabase
          .from("notificaties")
          .select("id")
          .eq("profiel_id", leerling.profile_id)
          .limit(1),
      }),
      checkRows({
        id: "learner-progress-notes",
        label: "Lesverslagen",
        source: "leerling_voortgang_lesnotities",
        query: supabase
          .from("leerling_voortgang_lesnotities")
          .select("id")
          .eq("leerling_id", leerling.id)
          .limit(1),
      }),
    ]);
  },
);
