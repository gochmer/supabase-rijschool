export type GebruikersRol = "leerling" | "instructeur" | "admin";

export type TransmissieType = "handgeschakeld" | "automaat" | "beide";
export type RijlesType = "auto" | "motor" | "vrachtwagen";

export type LesStatus =
  | "aangevraagd"
  | "geaccepteerd"
  | "geweigerd"
  | "ingepland"
  | "afgerond"
  | "geannuleerd";
export type LessonAttendanceStatus = "onbekend" | "aanwezig" | "afwezig";
export type LessonCompassLastUpdatedBy = "leerling" | "instructeur";

export type LesAanvraagType = "algemeen" | "pakket" | "proefles";

export type BetaalStatus = "open" | "in_afwachting" | "betaald" | "mislukt";
export type StudentProgressStatus =
  | "uitleg"
  | "begeleid"
  | "zelfstandig"
  | "herhaling";
export type LessonCheckinArrivalMode = "op_tijd" | "afstemmen";

export interface Profiel {
  id: string;
  volledige_naam: string;
  email: string;
  telefoon: string;
  avatar_url: string | null;
  rol: GebruikersRol;
  created_at: string;
  updated_at: string;
}

export interface InstructeurProfiel extends Profiel {
  slug: string;
  bio: string;
  ervaring_jaren: number;
  prijs_per_les: number;
  beoordeling: number;
  aantal_reviews: number;
  recente_review?: ReviewPreview | null;
  transmissie: TransmissieType;
  steden: string[];
  specialisaties: string[];
  profielfoto_kleur: string;
  status: "concept" | "in_beoordeling" | "goedgekeurd";
  profiel_voltooid: number;
}

export interface Review {
  id: string;
  leerling_naam: string;
  score: number;
  titel: string;
  tekst: string;
  datum: string;
  antwoord_tekst?: string | null;
  antwoord_datum?: string | null;
  rapport_count?: number;
  laatste_rapport_reden?: string | null;
}

export interface ReviewPreview {
  id: string;
  leerling_naam: string;
  score: number;
  titel: string;
  tekst: string;
  datum: string;
}

export interface Les {
  id: string;
  titel: string;
  datum: string;
  tijd: string;
  start_at?: string | null;
  end_at?: string | null;
  duur_minuten: number;
  status: LesStatus;
  attendance_status?: LessonAttendanceStatus | null;
  attendance_confirmed_at?: string | null;
  attendance_reason?: string | null;
  lesson_note?: string | null;
  reminder_24h_sent_at?: string | null;
  locatie: string;
  locatie_id?: string | null;
  leerling_naam: string;
  instructeur_naam: string;
}

export interface LesAanvraag {
  id: string;
  leerling_naam: string;
  instructeur_naam: string;
  voorkeursdatum: string;
  start_at?: string | null;
  end_at?: string | null;
  tijdvak: string;
  status: LesStatus;
  bericht: string;
  pakket_naam?: string | null;
  les_type?: RijlesType | null;
  aanvraag_type?: LesAanvraagType;
}

export interface BeschikbaarheidSlot {
  id: string;
  dag: string;
  tijdvak: string;
  beschikbaar: boolean;
  start_at?: string | null;
  eind_at?: string | null;
  source?: "slot" | "weekrooster";
  weekrooster_id?: string | null;
}

export interface BeschikbaarheidWeekrooster {
  id: string;
  instructeur_id: string;
  weekdag: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  start_tijd: string;
  eind_tijd: string;
  pauze_start_tijd?: string | null;
  pauze_eind_tijd?: string | null;
  beschikbaar: boolean;
  actief: boolean;
}

export interface Pakket {
  id: string;
  naam: string;
  prijs: number;
  beschrijving: string;
  lessen: number;
  les_type: RijlesType;
  badge?: string;
  labels?: string[];
  praktijk_examen_prijs?: number | null;
  actief?: boolean;
  instructeur_id?: string | null;
  instructeur_naam?: string | null;
  instructeur_slug?: string | null;
  uitgelicht?: boolean;
  sort_order?: number;
  icon_key?: string | null;
  visual_theme?: string | null;
  cover_path?: string | null;
  cover_url?: string | null;
  cover_position?: string | null;
  cover_focus_x?: number | null;
  cover_focus_y?: number | null;
}

export interface Betaling {
  id: string;
  omschrijving: string;
  bedrag: number;
  status: BetaalStatus;
  datum: string;
}

export interface Bericht {
  id: string;
  afzender: string;
  onderwerp: string;
  preview: string;
  tijd: string;
  ongelezen: boolean;
}

export interface Notificatie {
  id: string;
  titel: string;
  tekst: string;
  tijd: string;
  type: "info" | "succes" | "waarschuwing";
  ongelezen: boolean;
}

export interface SupportTicket {
  id: string;
  onderwerp: string;
  status: "open" | "in_behandeling" | "afgesloten";
  prioriteit: "laag" | "normaal" | "hoog";
  gebruiker: string;
}

export interface Voertuig {
  id: string;
  model: string;
  transmissie: TransmissieType;
  kenteken: string;
  status: "actief" | "onderhoud";
}

export interface DashboardMetric {
  label: string;
  waarde: string;
  context: string;
}

export interface LocationOption {
  id: string;
  naam: string;
  stad: string;
  adres?: string | null;
  label: string;
}

export interface StudentProgressAssessment {
  id: string;
  leerling_id: string;
  instructeur_id: string;
  vaardigheid_key: string;
  beoordelings_datum: string;
  status: StudentProgressStatus;
  notitie?: string | null;
  created_at: string;
}

export interface StudentProgressLessonNote {
  id: string;
  leerling_id: string;
  instructeur_id: string;
  lesdatum: string;
  samenvatting?: string | null;
  sterk_punt?: string | null;
  focus_volgende_les?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstructorStudentProgressRow {
  id: string;
  profileId?: string;
  naam: string;
  pakket: string;
  pakketId?: string | null;
  voortgang: number;
  volgendeLes: string;
  volgendeLesAt?: string | null;
  laatsteBeoordeling: string;
  laatsteBeoordelingAt?: string | null;
  gekoppeldeLessen: number;
  aanvraagStatus: string;
  email?: string;
  telefoon?: string;
  zelfInplannenToegestaan?: boolean;
  planningVrijTeGeven?: boolean;
  isHandmatigGekoppeld?: boolean;
  onboardingNotitie?: string | null;
  intakeChecklistKeys?: string[];
  accountStatus?: "uitgenodigd" | "actief";
  lastSignInAt?: string | null;
}

export interface SharedLessonCompassBoard {
  id: string | null;
  leerling_id: string;
  instructeur_id: string;
  counterpart_name: string;
  counterpart_role: "leerling" | "instructeur";
  next_touchpoint: string | null;
  instructor_focus?: string | null;
  instructor_mission?: string | null;
  learner_confidence?: number | null;
  learner_help_request?: string | null;
  last_updated_by?: LessonCompassLastUpdatedBy | null;
  updated_at?: string | null;
  updated_label?: string | null;
  pulse_label: string;
  pulse_variant: "info" | "success" | "warning";
}

export interface LessonCheckinBoard {
  id: string | null;
  les_id: string;
  counterpart_name: string;
  lesson_title: string;
  lesson_date: string;
  lesson_time: string;
  confidence_level?: number | null;
  support_request?: string | null;
  arrival_mode?: LessonCheckinArrivalMode | null;
  instructor_focus?: string | null;
  learner_updated_at?: string | null;
  instructor_updated_at?: string | null;
}
