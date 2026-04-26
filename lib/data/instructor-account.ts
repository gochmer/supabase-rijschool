import "server-only";

import type {
  BeschikbaarheidSlot,
  BeschikbaarheidWeekrooster,
  Voertuig,
} from "@/lib/types";
import {
  formatAvailabilityDay,
  formatAvailabilityWindow,
} from "@/lib/availability";
import { buildRecurringAvailabilitySlots } from "@/lib/availability-week-rules";
import { formatCurrency } from "@/lib/format";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";
import { createServerClient } from "@/lib/supabase/server";

type LessonRevenueRow = {
  id: string;
  titel: string;
  start_at: string | null;
  status: string;
  created_at: string;
};

type VehicleRow = {
  id: string;
  model: string;
  kenteken: string;
  transmissie: string;
  status: string;
};

type DocumentRow = {
  id: string;
  naam: string;
  status: string;
  url: string | null;
  created_at: string;
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}

function toVehicleStatus(value: string): Voertuig["status"] {
  return value === "onderhoud" ? "onderhoud" : "actief";
}

function toTransmission(value: string): Voertuig["transmissie"] {
  if (value === "automaat" || value === "handgeschakeld") {
    return value;
  }

  return "beide";
}

function toAmount(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function getCurrentInstructorAvailability(): Promise<
  BeschikbaarheidSlot[]
> {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  const [{ data: rows, error }, { data: ruleRows }] = await Promise.all([
    supabase
      .from("beschikbaarheid")
      .select("id, start_at, eind_at, beschikbaar")
      .eq("instructeur_id", instructeur.id)
      .order("start_at", { ascending: true }),
    supabase
      .from("beschikbaarheid_weekroosters")
      .select(
        "id, instructeur_id, weekdag, start_tijd, eind_tijd, pauze_start_tijd, pauze_eind_tijd, beschikbaar, actief"
      )
      .eq("instructeur_id", instructeur.id)
      .eq("actief", true),
  ]);

  if (error) {
    return [];
  }

  const concreteSlots = (rows ?? []).map((row) => ({
    id: row.id,
    dag: formatAvailabilityDay(row.start_at),
    tijdvak: formatAvailabilityWindow(row.start_at, row.eind_at),
    beschikbaar: row.beschikbaar,
    start_at: row.start_at,
    eind_at: row.eind_at,
    source: "slot" as const,
    weekrooster_id: null,
  }));

  const recurringSlots = buildRecurringAvailabilitySlots({
    rules: (ruleRows ?? []) as BeschikbaarheidWeekrooster[],
    concreteSlots,
  });

  return [...concreteSlots, ...recurringSlots].sort((left, right) =>
    (left.start_at ?? "").localeCompare(right.start_at ?? "")
  );
}

export async function getCurrentInstructorIncomeRows() {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return [];
  }

  const supabase = await createServerClient();
  const { data: rows, error } = await supabase
    .from("lessen")
    .select("id, titel, start_at, status, created_at")
    .eq("instructeur_id", instructeur.id)
    .in("status", ["geaccepteerd", "ingepland", "afgerond"])
    .order("start_at", { ascending: false });

  if (error || !rows?.length) {
    return [];
  }

  const bedragPerLes = formatCurrency(toAmount(instructeur.prijs_per_les));

  return (rows as LessonRevenueRow[]).map((row) => ({
    id: row.id,
    omschrijving: row.titel,
    bedrag: bedragPerLes,
    datum: formatDate(row.start_at ?? row.created_at),
    status: row.status,
  }));
}

export async function getCurrentInstructorSettingsOverview() {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      vehicles: [] as Voertuig[],
      documents: [] as {
        id: string;
        naam: string;
        status: string;
        datum: string;
        hasUrl: boolean;
      }[],
    };
  }

  const supabase = await createServerClient();
  const [{ data: vehicleRows }, { data: documentRows }] = await Promise.all([
    supabase
      .from("voertuigen")
      .select("id, model, kenteken, transmissie, status")
      .eq("instructeur_id", instructeur.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("instructeur_documenten")
      .select("id, naam, status, url, created_at")
      .eq("instructeur_id", instructeur.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    vehicles: ((vehicleRows ?? []) as VehicleRow[]).map((row) => ({
      id: row.id,
      model: row.model,
      kenteken: row.kenteken,
      transmissie: toTransmission(row.transmissie),
      status: toVehicleStatus(row.status),
    })),
    documents: ((documentRows ?? []) as DocumentRow[]).map((row) => ({
      id: row.id,
      naam: row.naam,
      status: row.status,
      datum: formatDate(row.created_at),
      hasUrl: Boolean(row.url),
    })),
  };
}
