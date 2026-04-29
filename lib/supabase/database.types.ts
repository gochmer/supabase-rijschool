export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      berichten: {
        Row: {
          afzender_profiel_id: string
          created_at: string
          gelezen: boolean
          id: string
          inhoud: string
          onderwerp: string
          ontvanger_profiel_id: string
        }
        Insert: {
          afzender_profiel_id: string
          created_at?: string
          gelezen?: boolean
          id?: string
          inhoud: string
          onderwerp: string
          ontvanger_profiel_id: string
        }
        Update: {
          afzender_profiel_id?: string
          created_at?: string
          gelezen?: boolean
          id?: string
          inhoud?: string
          onderwerp?: string
          ontvanger_profiel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "berichten_afzender_profiel_id_fkey"
            columns: ["afzender_profiel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "berichten_ontvanger_profiel_id_fkey"
            columns: ["ontvanger_profiel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      beschikbaarheid: {
        Row: {
          beschikbaar: boolean
          created_at: string
          eind_at: string
          id: string
          instructeur_id: string
          start_at: string
        }
        Insert: {
          beschikbaar?: boolean
          created_at?: string
          eind_at: string
          id?: string
          instructeur_id: string
          start_at: string
        }
        Update: {
          beschikbaar?: boolean
          created_at?: string
          eind_at?: string
          id?: string
          instructeur_id?: string
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beschikbaarheid_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
        ]
      }
      beschikbaarheid_weekroosters: {
        Row: {
          actief: boolean
          beschikbaar: boolean
          created_at: string
          eind_tijd: string
          id: string
          instructeur_id: string
          pauze_eind_tijd: string | null
          pauze_start_tijd: string | null
          start_tijd: string
          updated_at: string
          weekdag: number
        }
        Insert: {
          actief?: boolean
          beschikbaar?: boolean
          created_at?: string
          eind_tijd: string
          id?: string
          instructeur_id: string
          pauze_eind_tijd?: string | null
          pauze_start_tijd?: string | null
          start_tijd: string
          updated_at?: string
          weekdag: number
        }
        Update: {
          actief?: boolean
          beschikbaar?: boolean
          created_at?: string
          eind_tijd?: string
          id?: string
          instructeur_id?: string
          pauze_eind_tijd?: string | null
          pauze_start_tijd?: string | null
          start_tijd?: string
          updated_at?: string
          weekdag?: number
        }
        Relationships: [
          {
            foreignKeyName: "beschikbaarheid_weekroosters_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
        ]
      }
      betalingen: {
        Row: {
          bedrag: number
          betaald_at: string | null
          created_at: string
          id: string
          pakket_id: string | null
          profiel_id: string
          provider: string | null
          status: Database["public"]["Enums"]["betaal_status"]
        }
        Insert: {
          bedrag?: number
          betaald_at?: string | null
          created_at?: string
          id?: string
          pakket_id?: string | null
          profiel_id: string
          provider?: string | null
          status?: Database["public"]["Enums"]["betaal_status"]
        }
        Update: {
          bedrag?: number
          betaald_at?: string | null
          created_at?: string
          id?: string
          pakket_id?: string | null
          profiel_id?: string
          provider?: string | null
          status?: Database["public"]["Enums"]["betaal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "betalingen_pakket_id_fkey"
            columns: ["pakket_id"]
            isOneToOne: false
            referencedRelation: "pakketten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betalingen_profiel_id_fkey"
            columns: ["profiel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boekingen: {
        Row: {
          created_at: string
          id: string
          les_id: string | null
          lesaanvraag_id: string | null
          status: Database["public"]["Enums"]["les_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          les_id?: string | null
          lesaanvraag_id?: string | null
          status?: Database["public"]["Enums"]["les_status"]
        }
        Update: {
          created_at?: string
          id?: string
          les_id?: string | null
          lesaanvraag_id?: string | null
          status?: Database["public"]["Enums"]["les_status"]
        }
        Relationships: [
          {
            foreignKeyName: "boekingen_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: false
            referencedRelation: "lessen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boekingen_lesaanvraag_id_fkey"
            columns: ["lesaanvraag_id"]
            isOneToOne: false
            referencedRelation: "lesaanvragen"
            referencedColumns: ["id"]
          },
        ]
      }
      instructeur_documenten: {
        Row: {
          created_at: string
          id: string
          instructeur_id: string
          naam: string
          status: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instructeur_id: string
          naam: string
          status?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instructeur_id?: string
          naam?: string
          status?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructeur_documenten_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
        ]
      }
        instructeurs: {
          Row: {
            avatar_url: string | null
            beoordeling: number
            bio: string | null
            created_at: string
            ervaring_jaren: number
            id: string
            online_boeken_actief: boolean
            prijs_per_les: number
            profiel_compleetheid: number
            profiel_status: string
            profielfoto_kleur: string
            profile_id: string
          slug: string
          specialisaties: string[]
          transmissie: Database["public"]["Enums"]["transmissie_type"]
          updated_at: string
          volledige_naam: string
          werkgebied: string[]
        }
          Insert: {
            avatar_url?: string | null
            beoordeling?: number
            bio?: string | null
            created_at?: string
            ervaring_jaren?: number
            id?: string
            online_boeken_actief?: boolean
            prijs_per_les?: number
            profiel_compleetheid?: number
            profiel_status?: string
            profielfoto_kleur?: string
            profile_id: string
          slug: string
          specialisaties?: string[]
          transmissie?: Database["public"]["Enums"]["transmissie_type"]
          updated_at?: string
          volledige_naam?: string
          werkgebied?: string[]
        }
          Update: {
            avatar_url?: string | null
            beoordeling?: number
            bio?: string | null
            created_at?: string
            ervaring_jaren?: number
            id?: string
            online_boeken_actief?: boolean
            prijs_per_les?: number
            profiel_compleetheid?: number
            profiel_status?: string
            profielfoto_kleur?: string
            profile_id?: string
          slug?: string
          specialisaties?: string[]
          transmissie?: Database["public"]["Enums"]["transmissie_type"]
          updated_at?: string
          volledige_naam?: string
          werkgebied?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "instructeurs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leerlingen: {
        Row: {
          created_at: string
          favoriete_instructeurs: string[] | null
          id: string
          pakket_id: string | null
          profile_id: string
          voortgang_percentage: number
        }
        Insert: {
          created_at?: string
          favoriete_instructeurs?: string[] | null
          id?: string
          pakket_id?: string | null
          profile_id: string
          voortgang_percentage?: number
        }
        Update: {
          created_at?: string
          favoriete_instructeurs?: string[] | null
          id?: string
          pakket_id?: string | null
          profile_id?: string
          voortgang_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "leerlingen_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesaanvragen: {
        Row: {
          bericht: string | null
          created_at: string
          id: string
          instructeur_id: string
          leerling_id: string
          status: Database["public"]["Enums"]["les_status"]
          tijdvak: string | null
          voorkeursdatum: string | null
        }
        Insert: {
          bericht?: string | null
          created_at?: string
          id?: string
          instructeur_id: string
          leerling_id: string
          status?: Database["public"]["Enums"]["les_status"]
          tijdvak?: string | null
          voorkeursdatum?: string | null
        }
        Update: {
          bericht?: string | null
          created_at?: string
          id?: string
          instructeur_id?: string
          leerling_id?: string
          status?: Database["public"]["Enums"]["les_status"]
          tijdvak?: string | null
          voorkeursdatum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesaanvragen_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesaanvragen_leerling_id_fkey"
            columns: ["leerling_id"]
            isOneToOne: false
            referencedRelation: "leerlingen"
            referencedColumns: ["id"]
          },
        ]
      }
      leerling_voortgang_beoordelingen: {
        Row: {
          beoordelings_datum: string
          created_at: string
          id: string
          instructeur_id: string
          leerling_id: string
          notitie: string | null
          status: string
          vaardigheid_key: string
        }
        Insert: {
          beoordelings_datum: string
          created_at?: string
          id?: string
          instructeur_id: string
          leerling_id: string
          notitie?: string | null
          status: string
          vaardigheid_key: string
        }
        Update: {
          beoordelings_datum?: string
          created_at?: string
          id?: string
          instructeur_id?: string
          leerling_id?: string
          notitie?: string | null
          status?: string
          vaardigheid_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "leerling_voortgang_beoordelingen_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leerling_voortgang_beoordelingen_leerling_id_fkey"
            columns: ["leerling_id"]
            isOneToOne: false
            referencedRelation: "leerlingen"
            referencedColumns: ["id"]
          },
        ]
      }
      leerling_voortgang_lesnotities: {
        Row: {
          created_at: string
          focus_volgende_les: string | null
          id: string
          instructeur_id: string
          lesdatum: string
          leerling_id: string
          samenvatting: string | null
          sterk_punt: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          focus_volgende_les?: string | null
          id?: string
          instructeur_id: string
          lesdatum: string
          leerling_id: string
          samenvatting?: string | null
          sterk_punt?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          focus_volgende_les?: string | null
          id?: string
          instructeur_id?: string
          lesdatum?: string
          leerling_id?: string
          samenvatting?: string | null
          sterk_punt?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leerling_voortgang_lesnotities_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leerling_voortgang_lesnotities_leerling_id_fkey"
            columns: ["leerling_id"]
            isOneToOne: false
            referencedRelation: "leerlingen"
            referencedColumns: ["id"]
          },
        ]
      }
      leskompassen: {
        Row: {
          created_at: string
          id: string
          instructeur_focus: string | null
          instructeur_id: string
          instructeur_missie: string | null
          laatste_update_door: string | null
          leerling_confidence: number | null
          leerling_hulpvraag: string | null
          leerling_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructeur_focus?: string | null
          instructeur_id: string
          instructeur_missie?: string | null
          laatste_update_door?: string | null
          leerling_confidence?: number | null
          leerling_hulpvraag?: string | null
          leerling_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructeur_focus?: string | null
          instructeur_id?: string
          instructeur_missie?: string | null
          laatste_update_door?: string | null
          leerling_confidence?: number | null
          leerling_hulpvraag?: string | null
          leerling_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leskompassen_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leskompassen_leerling_id_fkey"
            columns: ["leerling_id"]
            isOneToOne: false
            referencedRelation: "leerlingen"
            referencedColumns: ["id"]
          },
        ]
      }
      lessen: {
        Row: {
          afwezigheids_reden: string | null
          aanwezigheid_bevestigd_at: string | null
          aanwezigheid_status:
            | Database["public"]["Enums"]["les_aanwezigheid_status"]
            | null
          created_at: string
          duur_minuten: number
          herinnering_24h_verstuurd_at: string | null
          id: string
          instructeur_id: string | null
          lesnotitie: string | null
          leerling_id: string | null
          locatie_id: string | null
          notities: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["les_status"]
          titel: string
        }
        Insert: {
          afwezigheids_reden?: string | null
          aanwezigheid_bevestigd_at?: string | null
          aanwezigheid_status?:
            | Database["public"]["Enums"]["les_aanwezigheid_status"]
            | null
          created_at?: string
          duur_minuten?: number
          herinnering_24h_verstuurd_at?: string | null
          id?: string
          instructeur_id?: string | null
          lesnotitie?: string | null
          leerling_id?: string | null
          locatie_id?: string | null
          notities?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["les_status"]
          titel: string
        }
        Update: {
          afwezigheids_reden?: string | null
          aanwezigheid_bevestigd_at?: string | null
          aanwezigheid_status?:
            | Database["public"]["Enums"]["les_aanwezigheid_status"]
            | null
          created_at?: string
          duur_minuten?: number
          herinnering_24h_verstuurd_at?: string | null
          id?: string
          instructeur_id?: string | null
          lesnotitie?: string | null
          leerling_id?: string | null
          locatie_id?: string | null
          notities?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["les_status"]
          titel?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessen_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessen_leerling_id_fkey"
            columns: ["leerling_id"]
            isOneToOne: false
            referencedRelation: "leerlingen"
            referencedColumns: ["id"]
          },
        ]
      }
      locaties: {
        Row: {
          adres: string | null
          created_at: string
          id: string
          naam: string
          regio: string | null
          stad: string
        }
        Insert: {
          adres?: string | null
          created_at?: string
          id?: string
          naam: string
          regio?: string | null
          stad: string
        }
        Update: {
          adres?: string | null
          created_at?: string
          id?: string
          naam?: string
          regio?: string | null
          stad?: string
        }
        Relationships: []
      }
      notificaties: {
        Row: {
          created_at: string
          id: string
          ongelezen: boolean
          profiel_id: string
          tekst: string
          titel: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          ongelezen?: boolean
          profiel_id: string
          tekst: string
          titel: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          ongelezen?: boolean
          profiel_id?: string
          tekst?: string
          titel?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaties_profiel_id_fkey"
            columns: ["profiel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pakketten: {
        Row: {
          aantal_lessen: number
          actief: boolean
          badge: string | null
          beschrijving: string | null
          cover_focus_x: number | null
          cover_focus_y: number | null
          cover_path: string | null
          cover_position: string
          created_at: string
          id: string
          icon_key: string
          instructeur_id: string | null
          naam: string
          prijs: number
          sort_order: number
          uitgelicht: boolean
          visual_theme: string
        }
        Insert: {
          aantal_lessen?: number
          actief?: boolean
          badge?: string | null
          beschrijving?: string | null
          cover_focus_x?: number | null
          cover_focus_y?: number | null
          cover_path?: string | null
          cover_position?: string
          created_at?: string
          id?: string
          icon_key?: string
          instructeur_id?: string | null
          naam: string
          prijs?: number
          sort_order?: number
          uitgelicht?: boolean
          visual_theme?: string
        }
        Update: {
          aantal_lessen?: number
          actief?: boolean
          badge?: string | null
          beschrijving?: string | null
          cover_focus_x?: number | null
          cover_focus_y?: number | null
          cover_path?: string | null
          cover_position?: string
          created_at?: string
          id?: string
          icon_key?: string
          instructeur_id?: string | null
          naam?: string
          prijs?: number
          sort_order?: number
          uitgelicht?: boolean
          visual_theme?: string
        }
        Relationships: [
          {
            foreignKeyName: "pakketten_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          rol: Database["public"]["Enums"]["gebruikersrol"]
          telefoon: string | null
          updated_at: string
          volledige_naam: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          rol?: Database["public"]["Enums"]["gebruikersrol"]
          telefoon?: string | null
          updated_at?: string
          volledige_naam?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          rol?: Database["public"]["Enums"]["gebruikersrol"]
          telefoon?: string | null
          updated_at?: string
          volledige_naam?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          answered_by: string | null
          antwoord_datum: string | null
          antwoord_tekst: string | null
          created_at: string
          id: string
          instructeur_id: string
          leerling_id: string
          leerling_naam_snapshot: string | null
          les_id: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderatie_notitie: string | null
          moderatie_status: string
          score: number
          tekst: string | null
          titel: string | null
          verborgen: boolean
        }
        Insert: {
          answered_by?: string | null
          antwoord_datum?: string | null
          antwoord_tekst?: string | null
          created_at?: string
          id?: string
          instructeur_id: string
          leerling_id: string
          leerling_naam_snapshot?: string | null
          les_id?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderatie_notitie?: string | null
          moderatie_status?: string
          score: number
          tekst?: string | null
          titel?: string | null
          verborgen?: boolean
        }
        Update: {
          answered_by?: string | null
          antwoord_datum?: string | null
          antwoord_tekst?: string | null
          created_at?: string
          id?: string
          instructeur_id?: string
          leerling_id?: string
          leerling_naam_snapshot?: string | null
          les_id?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderatie_notitie?: string | null
          moderatie_status?: string
          score?: number
          tekst?: string | null
          titel?: string | null
          verborgen?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_leerling_id_fkey"
            columns: ["leerling_id"]
            isOneToOne: false
            referencedRelation: "leerlingen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: false
            referencedRelation: "lessen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string
          id: string
          reden: string
          reporter_profile_id: string
          review_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          reden: string
          reporter_profile_id: string
          review_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          reden?: string
          reporter_profile_id?: string
          review_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          omschrijving: string
          onderwerp: string
          prioriteit: string
          profiel_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          omschrijving: string
          onderwerp: string
          prioriteit?: string
          profiel_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          omschrijving?: string
          onderwerp?: string
          prioriteit?: string
          profiel_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_profiel_id_fkey"
            columns: ["profiel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voertuigen: {
        Row: {
          created_at: string
          id: string
          instructeur_id: string
          kenteken: string
          model: string
          status: string
          transmissie: Database["public"]["Enums"]["transmissie_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          instructeur_id: string
          kenteken: string
          model: string
          status?: string
          transmissie: Database["public"]["Enums"]["transmissie_type"]
        }
        Update: {
          created_at?: string
          id?: string
          instructeur_id?: string
          kenteken?: string
          model?: string
          status?: string
          transmissie?: Database["public"]["Enums"]["transmissie_type"]
        }
        Relationships: [
          {
            foreignKeyName: "voertuigen_instructeur_id_fkey"
            columns: ["instructeur_id"]
            isOneToOne: false
            referencedRelation: "instructeurs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_due_lesson_reminders: {
        Args: Record<PropertyKey, never>
        Returns: {
          instructeur_email: string | null
          instructeur_naam: string | null
          instructeur_profiel_id: string | null
          leerling_email: string | null
          leerling_naam: string | null
          leerling_profiel_id: string | null
          les_datum: string | null
          les_tijd: string | null
          les_titel: string | null
          lesson_id: string | null
          locatie: string | null
          start_at: string | null
        }[]
      }
    }
    Enums: {
      betaal_status: "open" | "in_afwachting" | "betaald" | "mislukt"
      gebruikersrol: "leerling" | "instructeur" | "admin"
      les_aanwezigheid_status: "onbekend" | "aanwezig" | "afwezig"
      les_status:
        | "aangevraagd"
        | "geaccepteerd"
        | "geweigerd"
        | "ingepland"
        | "afgerond"
        | "geannuleerd"
      transmissie_type: "handgeschakeld" | "automaat" | "beide"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      betaal_status: ["open", "in_afwachting", "betaald", "mislukt"],
      gebruikersrol: ["leerling", "instructeur", "admin"],
      les_aanwezigheid_status: ["onbekend", "aanwezig", "afwezig"],
      les_status: [
        "aangevraagd",
        "geaccepteerd",
        "geweigerd",
        "ingepland",
        "afgerond",
        "geannuleerd",
      ],
      transmissie_type: ["handgeschakeld", "automaat", "beide"],
    },
  },
} as const
